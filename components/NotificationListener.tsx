'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sparkles,
  Calendar,
  ShoppingBag,
  Swords,
  Clock,
  ExternalLink,
} from 'lucide-react'
import {
  sendBrowserNotification,
  playNotificationChime,
} from '@/lib/notifications'
import { fireJoinParticles } from '@/lib/particles'

const LEVEL_UP_MESSAGES = [
  "{name} is now Level {lvl}! Finally, a higher proficiency bonus to miss with.",
  "Level {lvl}! {name} can now fail their saves with much more dignity.",
  "{name} reached Level {lvl}! Time to spend 4 hours picking a feat you'll never use.",
  "Power overwhelming! {name} reached Level {lvl}. Please don't tell the GM.",
  "{name} is Level {lvl}! Still 1 HP away from a very awkward conversation with Pharasma.",
  "Congratulations {name}! Level {lvl} looks good on you. Unlike that cursed ring.",
  "{name} reached Level {lvl}! Now with 10% more 'Main Character' energy.",
  "Level {lvl}! {name} is officially too high level for this tavern's basement rats.",
  "{name} reached Level {lvl}! Maybe now the party will actually listen to your plans? (Probably not).",
  "{name} is Level {lvl}! May your nat 20s be frequent and your 'accidental' fireballs be small.",
]

const loadSeenIds = (key: string): Set<string> => {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

const saveSeenIds = (key: string, set: Set<string>) => {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(set).slice(-200)
    sessionStorage.setItem(key, JSON.stringify(arr))
  } catch {}
}

export default function NotificationListener() {
  const router = useRouter()
  const preferences = useQuery(api.notifications.getNotificationPreferences)
  const characters = useQuery(api.characters.listCharacters)
  const feed = useQuery(api.notifications.getNotificationFeed)

  // Mount timestamp to prevent alerting on items created prior to current browser session
  const mountTime = useRef(Date.now()).current

  // Tracking refs to avoid notifying on initial data load or duplicate refreshes
  const isInitialCharsLoaded = useRef(false)
  const isInitialFeedLoaded = useRef(false)
  const prevCharStats = useRef<Record<string, { lvl: number; rank?: string }>>({})
  const seenSessionIds = useRef<Set<string>>(loadSeenIds('void_seen_sessions'))
  const seenListingIds = useRef<Set<string>>(loadSeenIds('void_seen_listings'))
  const seenPendingBetIds = useRef<Set<string>>(loadSeenIds('void_seen_bets'))
  const seenExpiringBetIds = useRef<Set<string>>(loadSeenIds('void_seen_expiring_bets'))

  // Helper function to dispatch a unified toast + desktop notification + sound
  const dispatchAlert = (options: {
    categoryTitle: string
    title: string
    description: string
    url?: string
    icon: React.ReactNode
    iconColor?: string
    browserTag?: string
  }) => {
    playNotificationChime()

    // Sonner In-App Toast
    toast(
      <div
        className="flex flex-col gap-0.5 cursor-pointer w-full"
        onClick={() => {
          if (options.url) router.push(options.url)
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
          <span>{options.categoryTitle}</span>
          {options.url && <ExternalLink className="h-3 w-3 text-purple-400/70" />}
        </span>
        <span className="font-bold text-sm text-purple-100">{options.title}</span>
      </div>,
      {
        description: options.description,
        icon: options.icon,
        style: {
          backgroundColor: '#1e1b4b',
          borderColor: 'rgba(147, 51, 234, 0.5)',
          color: '#f8fafc',
        },
        className:
          '!bg-purple-950 !border-purple-500/50 !text-slate-100 shadow-2xl backdrop-blur-md rounded-xl p-4 font-sans',
        descriptionClassName: '!text-purple-200/90 !text-xs mt-1 leading-relaxed',
        duration: 7000,
        action: options.url
          ? {
              label: 'View',
              onClick: () => router.push(options.url!),
            }
          : undefined,
      }
    )

    // Browser Native Push Notification
    if (preferences?.browserPush) {
      sendBrowserNotification(options.title, {
        body: options.description,
        url: options.url ? `${window.location.origin}${options.url}` : undefined,
        tag: options.browserTag,
      })
    }
  }

  // 1. Monitor Characters (Level up & Rank Promotions)
  useEffect(() => {
    if (!characters) return

    if (!isInitialCharsLoaded.current) {
      // Seed initial character state without alerting
      const initialMap: Record<string, { lvl: number; rank?: string }> = {}
      characters.forEach((c) => {
        initialMap[c._id] = { lvl: c.lvl, rank: c.rank }
      })
      prevCharStats.current = initialMap
      isInitialCharsLoaded.current = true
      return
    }

    if (!preferences?.enabled) {
      // Keep tracking even if disabled so we don't burst alerts when enabled
      const newMap: Record<string, { lvl: number; rank?: string }> = {}
      characters.forEach((c) => {
        newMap[c._id] = { lvl: c.lvl, rank: c.rank }
      })
      prevCharStats.current = newMap
      return
    }

    const currentMap: Record<string, { lvl: number; rank?: string }> = {}

    characters.forEach((char) => {
      const prev = prevCharStats.current[char._id]

      if (prev !== undefined) {
        // Level Up Check
        if (char.lvl > prev.lvl && (preferences?.levelUp ?? true)) {
          const randomFlavor = LEVEL_UP_MESSAGES[
            Math.floor(Math.random() * LEVEL_UP_MESSAGES.length)
          ]
            .replace('{name}', char.name)
            .replace('{lvl}', char.lvl.toString())

          dispatchAlert({
            categoryTitle: 'Character Leveled Up!',
            title: `${char.name} reached Level ${char.lvl}!`,
            description: randomFlavor,
            icon: <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />,
            browserTag: `levelup-${char._id}-${char.lvl}`,
          })

          try {
            fireJoinParticles(window.innerWidth / 2, window.innerHeight / 2)
          } catch {}
        }

        // Rank Promotion Check
        if (char.rank && char.rank !== prev.rank && (preferences?.levelUp ?? true)) {
          if (char.rank === 'journeyman' || char.rank === 'guildmaster') {
            const rankTitle = char.rank.charAt(0).toUpperCase() + char.rank.slice(1)
            dispatchAlert({
              categoryTitle: 'Rank Promotion!',
              title: `${char.name} is now a ${rankTitle}!`,
              description:
                char.rank === 'guildmaster'
                  ? 'A legendary achievement in the Void!'
                  : 'A significant milestone in your guild journey!',
              icon: <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />,
              browserTag: `promotion-${char._id}-${char.rank}`,
            })

            try {
              fireJoinParticles(window.innerWidth / 2, window.innerHeight / 2)
            } catch {}
          }
        }
      }

      currentMap[char._id] = { lvl: char.lvl, rank: char.rank }
    })

    prevCharStats.current = currentMap
  }, [characters, preferences])

  // 2. Monitor Feed (Sessions, Black Void Listings, Bets, Expiring Bets)
  useEffect(() => {
    if (!feed || preferences === undefined) return

    if (!isInitialFeedLoaded.current) {
      // Seed existing IDs on initial load without alerting
      feed.sessions.forEach((s) => seenSessionIds.current.add(s._id))
      feed.listings.forEach((l) => seenListingIds.current.add(l._id))
      feed.pendingBets.forEach((b) => seenPendingBetIds.current.add(b._id))
      feed.expiringBets.forEach((b) => seenExpiringBetIds.current.add(b._id))
      saveSeenIds('void_seen_sessions', seenSessionIds.current)
      saveSeenIds('void_seen_listings', seenListingIds.current)
      saveSeenIds('void_seen_bets', seenPendingBetIds.current)
      saveSeenIds('void_seen_expiring_bets', seenExpiringBetIds.current)
      isInitialFeedLoaded.current = true
      return
    }

    if (!preferences?.enabled) {
      // Update seen sets so user won't get flooded later
      feed.sessions.forEach((s) => seenSessionIds.current.add(s._id))
      feed.listings.forEach((l) => seenListingIds.current.add(l._id))
      feed.pendingBets.forEach((b) => seenPendingBetIds.current.add(b._id))
      feed.expiringBets.forEach((b) => seenExpiringBetIds.current.add(b._id))
      saveSeenIds('void_seen_sessions', seenSessionIds.current)
      saveSeenIds('void_seen_listings', seenListingIds.current)
      saveSeenIds('void_seen_bets', seenPendingBetIds.current)
      saveSeenIds('void_seen_expiring_bets', seenExpiringBetIds.current)
      return
    }

    // A. New Sessions Scheduled
    if (preferences.newSession ?? true) {
      feed.sessions.forEach((session) => {
        if (!seenSessionIds.current.has(session._id)) {
          seenSessionIds.current.add(session._id)
          saveSeenIds('void_seen_sessions', seenSessionIds.current)

          if (session._creationTime >= mountTime - 30000) {
            const sysName = session.system === 'PF' ? 'Pathfinder 2e' : 'D&D 5e'
            const subtitle = session.isIntro
              ? `🌱 Intro Session • ${sysName}`
              : session.questName
              ? `Quest: ${session.questName} • ${sysName}`
              : `New Session in ${session.worldName} (${sysName})`

            dispatchAlert({
              categoryTitle: 'New Session Scheduled',
              title: `Session in ${session.worldName}`,
              description: subtitle,
              url: `/sessions/${session._id}`,
              icon: <Calendar className="h-5 w-5 text-amber-400 shrink-0" />,
              browserTag: `session-${session._id}`,
            })
          }
        }
      })
    } else {
      feed.sessions.forEach((s) => seenSessionIds.current.add(s._id))
      saveSeenIds('void_seen_sessions', seenSessionIds.current)
    }

    // B. New Black Void Listings
    if (preferences.newListing ?? true) {
      feed.listings.forEach((listing) => {
        if (!seenListingIds.current.has(listing._id)) {
          seenListingIds.current.add(listing._id)
          saveSeenIds('void_seen_listings', seenListingIds.current)

          if (!listing.isOwnListing && listing._creationTime >= mountTime - 30000) {
            const priceInfo = listing.buyoutPrice
              ? `Buyout: ${listing.buyoutPrice} GP`
              : listing.startingBid
              ? `Starting Bid: ${listing.startingBid} GP`
              : 'Market Listing'

            dispatchAlert({
              categoryTitle: 'Black Void Market',
              title: `New Listing: ${listing.name}`,
              description: `Listed by ${listing.sellerName} • ${priceInfo}`,
              url: '/black-void',
              icon: <ShoppingBag className="h-5 w-5 text-blue-400 shrink-0" />,
              browserTag: `listing-${listing._id}`,
            })
          }
        }
      })
    } else {
      feed.listings.forEach((l) => seenListingIds.current.add(l._id))
      saveSeenIds('void_seen_listings', seenListingIds.current)
    }

    // C. New Bets (Direct Invitations or Open Challenges)
    if (preferences.newBet ?? true) {
      feed.pendingBets.forEach((bet) => {
        if (!seenPendingBetIds.current.has(bet._id)) {
          seenPendingBetIds.current.add(bet._id)
          saveSeenIds('void_seen_bets', seenPendingBetIds.current)

          if (bet._creationTime >= mountTime - 30000) {
            const title = bet.isDirect
              ? 'Deathroll Challenge Received!'
              : 'New Open Deathroll Challenge!'

            const desc = bet.isDirect
              ? `${bet.senderName} challenged ${bet.targetName || 'your character'} for ${bet.wagerAmount} GP (/roll ${bet.deathrollValue})!`
              : `${bet.senderName} posted an open ${bet.wagerAmount} GP challenge (/roll ${bet.deathrollValue})!`

            dispatchAlert({
              categoryTitle: 'Deathroll Wager',
              title,
              description: desc,
              url: '/black-void',
              icon: <Swords className="h-5 w-5 text-rose-400 shrink-0" />,
              browserTag: `bet-${bet._id}`,
            })
          }
        }
      })
    } else {
      feed.pendingBets.forEach((b) => seenPendingBetIds.current.add(b._id))
      saveSeenIds('void_seen_bets', seenPendingBetIds.current)
    }

    // D. Expiring Bets (<= 1 hour remaining on turn)
    if (preferences.betExpiring ?? true) {
      feed.expiringBets.forEach((bet) => {
        if (!seenExpiringBetIds.current.has(bet._id)) {
          seenExpiringBetIds.current.add(bet._id)
          saveSeenIds('void_seen_expiring_bets', seenExpiringBetIds.current)

          dispatchAlert({
            categoryTitle: 'Deathroll Turn Expiring',
            title: 'Your Deathroll turn is about to expire!',
            description: `Only ~${bet.timeLeftMinutes} min remaining for ${bet.characterName} against ${bet.opponentName} (${bet.wagerAmount} GP at stake)!`,
            url: '/black-void',
            icon: <Clock className="h-5 w-5 text-amber-400 shrink-0" />,
            browserTag: `expiring-bet-${bet._id}`,
          })
        }
      })
    } else {
      feed.expiringBets.forEach((b) => seenExpiringBetIds.current.add(b._id))
      saveSeenIds('void_seen_expiring_bets', seenExpiringBetIds.current)
    }
  }, [feed, preferences, router])

  return null
}
