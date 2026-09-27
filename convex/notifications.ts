import { query, mutation, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { isAdmin } from './roles'
import { Doc, Id } from './_generated/dataModel'

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: false,
  browserPush: false,
  levelUp: true,
  newSession: true,
  newListing: true,
  newBet: true,
  betExpiring: true,
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Gets the notification preferences for the authenticated user.
 */
export const getNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()

    if (!user || !user.notificationPreferences) {
      return DEFAULT_NOTIFICATION_PREFERENCES
    }

    return {
      enabled: user.notificationPreferences.enabled ?? false,
      browserPush: user.notificationPreferences.browserPush ?? false,
      levelUp: user.notificationPreferences.levelUp ?? true,
      newSession: user.notificationPreferences.newSession ?? true,
      newListing: user.notificationPreferences.newListing ?? true,
      newBet: user.notificationPreferences.newBet ?? true,
      betExpiring: user.notificationPreferences.betExpiring ?? true,
    }
  },
})

/**
 * Updates the notification preferences for the authenticated user.
 */
export const updateNotificationPreferences = mutation({
  args: {
    enabled: v.boolean(),
    browserPush: v.optional(v.boolean()),
    levelUp: v.optional(v.boolean()),
    newSession: v.optional(v.boolean()),
    newListing: v.optional(v.boolean()),
    newBet: v.optional(v.boolean()),
    betExpiring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()

    const preferences = {
      enabled: args.enabled,
      browserPush: args.browserPush ?? false,
      levelUp: args.levelUp ?? true,
      newSession: args.newSession ?? true,
      newListing: args.newListing ?? true,
      newBet: args.newBet ?? true,
      betExpiring: args.betExpiring ?? true,
    }

    if (user) {
      await ctx.db.patch(user._id, {
        notificationPreferences: preferences,
      })
    } else {
      await ctx.db.insert('users', {
        userId: identity.subject,
        isAdmin: false,
        isGM: false,
        name: identity.name,
        notificationPreferences: preferences,
      })
    }

    return preferences
  },
})

/**
 * Reactive query for real-time notification listener on client.
 * Returns latest active sessions, active market listings, pending bets, and expiring bets.
 */
export const getNotificationFeed = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return {
        sessions: [],
        listings: [],
        pendingBets: [],
        expiringBets: [],
      }
    }

    // 1. Get user characters to know which characters belong to this player
    const userChars = await ctx.db
      .query('characters')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .collect()

    const userCharIds = new Set(userChars.map((c) => c._id.toString()))
    const userCharMap = new Map(userChars.map((c) => [c._id.toString(), c]))
    const isAdminUser = await isAdmin(ctx)

    // 2. Latest active sessions (unlocked)
    const rawSessions = await ctx.db
      .query('sessions')
      .withIndex('by_locked', (q) => q.eq('locked', false))
      .order('desc')
      .take(10)

    const visibleSessions = rawSessions.filter((s) => {
      if (!s.isPrivate) return true
      if (isAdminUser) return true
      if (s.owner === identity.subject) return true
      return s.characters.some((cid) => userCharIds.has(cid.toString()))
    })

    const decoratedSessions = await Promise.all(
      visibleSessions.map(async (s) => {
        const world = await ctx.db.get(s.world)
        let questName: string | null = null
        if (s.questId) {
          const quest = await ctx.db.get(s.questId)
          questName = quest?.name || null
        }
        return {
          _id: s._id,
          worldName: world?.name || 'Unknown World',
          date: s.date,
          system: s.system,
          isIntro: s.isIntro ?? false,
          questName,
          owner: s.owner,
          _creationTime: s._creationTime,
        }
      })
    )

    // 3. Latest active listings in the Black Void Auction House
    const rawListings = await ctx.db
      .query('blackVoidListings')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .order('desc')
      .take(10)

    const decoratedListings = await Promise.all(
      rawListings.map(async (l) => {
        const seller = await ctx.db.get(l.characterId)
        const isOwnListing = userCharIds.has(l.characterId.toString())
        return {
          _id: l._id,
          name: l.name,
          type: l.type,
          startingBid: l.startingBid,
          buyoutPrice: l.buyoutPrice,
          sellerName: seller?.name || 'Unknown',
          characterId: l.characterId,
          isOwnListing,
          _creationTime: l._creationTime,
        }
      })
    )

    // 4. Pending bets (open challenges from others or direct invitations targeting this user's characters)
    const rawPendingBets = await ctx.db
      .query('blackVoidBets')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .take(25)

    const relevantPendingBets = rawPendingBets.filter((b) => {
      const isTarget = b.targetCharacterId ? userCharIds.has(b.targetCharacterId.toString()) : false
      const isSender = userCharIds.has(b.senderCharacterId.toString())
      const isOpenChallenge = !b.targetCharacterId && !isSender
      return isTarget || isOpenChallenge
    })

    const decoratedPendingBets = await Promise.all(
      relevantPendingBets.map(async (b) => {
        const sender = await ctx.db.get(b.senderCharacterId)
        const target = b.targetCharacterId ? await ctx.db.get(b.targetCharacterId) : null
        const isDirect = b.targetCharacterId ? userCharIds.has(b.targetCharacterId.toString()) : false

        return {
          _id: b._id,
          senderName: sender?.name || 'Unknown',
          targetName: target?.name || null,
          targetCharacterId: b.targetCharacterId,
          wagerAmount: b.wagerAmount,
          deathrollValue: b.deathrollValue,
          isDirect,
          _creationTime: b._creationTime,
        }
      })
    )

    // 5. Expiring bets (accepted matches where user's character is in the match and deadline is <= 1 hour)
    const rawAcceptedBets = await ctx.db
      .query('blackVoidBets')
      .withIndex('by_status', (q) => q.eq('status', 'accepted'))
      .take(30)

    const now = Date.now()
    const userAcceptedBets = rawAcceptedBets.filter((b) => {
      const senderIsUser = userCharIds.has(b.senderCharacterId.toString())
      const acceptedIsUser = b.acceptedByCharacterId ? userCharIds.has(b.acceptedByCharacterId.toString()) : false
      return senderIsUser || acceptedIsUser
    })

    const expiringBets = await Promise.all(
      userAcceptedBets
        .filter((b) => {
          const deadline = b.turnDeadline || (b.updatedAt || b.createdAt) + TWENTY_FOUR_HOURS_MS
          const timeLeftMs = deadline - now
          // If between 0 and 60 minutes remaining and it is this user's character's turn
          const isUserTurn = b.currentTurnCharacterId ? userCharIds.has(b.currentTurnCharacterId.toString()) : false
          return timeLeftMs > 0 && timeLeftMs <= 60 * 60 * 1000 && isUserTurn
        })
        .map(async (b) => {
          const sender = await ctx.db.get(b.senderCharacterId)
          const acceptedBy = b.acceptedByCharacterId ? await ctx.db.get(b.acceptedByCharacterId) : null
          const currentTurn = b.currentTurnCharacterId ? await ctx.db.get(b.currentTurnCharacterId) : null
          const deadline = b.turnDeadline || (b.updatedAt || b.createdAt) + TWENTY_FOUR_HOURS_MS
          const timeLeftMinutes = Math.max(1, Math.round((deadline - now) / 60000))

          const myChar = b.currentTurnCharacterId ? userCharMap.get(b.currentTurnCharacterId.toString()) : null
          const opponentName =
            b.senderCharacterId === b.currentTurnCharacterId
              ? acceptedBy?.name || 'Opponent'
              : sender?.name || 'Opponent'

          return {
            _id: b._id,
            characterName: myChar?.name || currentTurn?.name || 'Your Character',
            opponentName,
            wagerAmount: b.wagerAmount,
            timeLeftMinutes,
            turnDeadline: deadline,
            currentRollMax: b.currentRollMax,
          }
        })
    )

    return {
      sessions: decoratedSessions,
      listings: decoratedListings,
      pendingBets: decoratedPendingBets,
      expiringBets,
    }
  },
})
