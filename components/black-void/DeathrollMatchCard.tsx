'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FunctionReturnType } from 'convex/server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dices, Clock, AlertCircle, Sparkles, Trophy, Loader2, Hourglass, Skull, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLL_REVEAL_MS, bustChance, heat } from '@/convex/deathroll'

export type DecoratedBet = FunctionReturnType<typeof api.blackVoidBets.getBettingData>['recentBets'][number]

function formatRemainingTime(timeLeftMs: number): string {
  if (timeLeftMs <= 0) return 'Expired'
  const totalSeconds = Math.floor(timeLeftMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m left`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s left`
  }
  return `${seconds}s left`
}

// Harmonic number H(max + 1)
function expectedRollsLeft(max: number): number {
  return Math.log(max + 1) + 0.5772
}

function RollReel({
  value,
  range,
  spinKey,
  spinning,
}: {
  value: number
  range: number
  spinKey: number
  spinning: boolean
}) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!spinning) return
    const id = setInterval(() => setDisplay(Math.floor(Math.random() * (range + 1))), 55)
    return () => clearInterval(id)
  }, [spinning, range])

  return (
    <motion.span
      key={spinning ? 'spin' : `land-${spinKey}`}
      initial={spinning ? false : { scale: 1.4 }}
      animate={{ scale: 1, color: spinning ? '#fcd34d' : '#fb7185' }}
      transition={{ type: 'spring', stiffness: 320, damping: 11 }}
      className="inline-block font-black font-mono tabular-nums tracking-tight"
    >
      {(spinning ? display : value).toLocaleString()}
    </motion.span>
  )
}

export function RollLadder({ bet, characterId }: { bet: DecoratedBet; characterId: Id<'characters'> }) {
  const rolls = bet.rolls || []
  const opponentName = bet.senderCharacterId === characterId ? bet.acceptedByName : bet.senderName

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto pr-3 custom-scrollbar">
      {rolls.map((r, idx) => {
        const isMe = r.characterId === characterId
        const pct = r.outOf > 0 ? (r.roll / r.outOf) * 100 : 0
        const isZero = r.roll === 0
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(idx, 10) * 0.03 }}
            className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-[10px] font-mono"
          >
            <span className={cn('truncate', isMe ? 'text-purple-300' : 'text-muted-foreground')}>
              {isMe ? 'You' : opponentName}
            </span>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  isZero ? 'bg-rose-500' : pct <= 10 ? 'bg-orange-500' : isMe ? 'bg-purple-500/70' : 'bg-zinc-400/50'
                )}
                style={{ width: `${Math.max(isZero ? 100 : 2, pct)}%` }}
              />
            </div>
            <span className={cn('text-right', isZero ? 'text-rose-400 font-bold' : 'text-foreground')}>
              {isZero ? <Skull className="inline h-3 w-3 mr-0.5" /> : null}
              {r.roll.toLocaleString()}
              <span className="opacity-60"> /{r.outOf.toLocaleString()}</span>
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

interface DeathrollMatchCardProps {
  match: DecoratedBet
  characterId: Id<'characters'>
  selectedCharName: string
  now: number
  rolling: boolean
  actionLoading: boolean
  onRoll: () => void
  onClaimTimeout: () => void
  spinFirstRoll?: boolean
}

export default function DeathrollMatchCard({
  match,
  characterId,
  selectedCharName,
  now,
  rolling,
  actionLoading,
  onRoll,
  onClaimTimeout,
  spinFirstRoll = false,
}: DeathrollMatchCardProps) {
  const isChallenger = match.senderCharacterId === characterId
  const opponentName = isChallenger ? match.acceptedByName : match.senderName
  const allRolls = match.rolls || []
  const lastRoll = allRolls[allRolls.length - 1]

  // Spin the opponent's new roll before showing it (own rolls use the popup)
  const [settledRollCount, setSettledRollCount] = useState(spinFirstRoll ? allRolls.length - 1 : allRolls.length)
  const settling = settledRollCount !== allRolls.length && lastRoll?.characterId !== characterId
  useEffect(() => {
    if (!settling) return
    const t = setTimeout(() => setSettledRollCount(allRolls.length), ROLL_REVEAL_MS)
    return () => clearTimeout(t)
  }, [settling, allRolls.length])

  const rollsList = settling ? allRolls.slice(0, -1) : allRolls
  const isMyTurn = match.currentTurnCharacterId === characterId && !settling
  const currentMax = settling
    ? lastRoll.outOf
    : match.currentRollMax !== undefined ? match.currentRollMax : match.deathrollValue
  const rollingText = lastRoll?.characterId === characterId ? 'You are rolling' : `${opponentName} is rolling`

  const deadline = match.turnDeadline || (match.updatedAt || match.createdAt) + 24 * 60 * 60 * 1000
  const timeLeftMs = Math.max(0, deadline - now)
  const isExpired = timeLeftMs <= 0 && !settling

  const heatPct = heat(currentMax, match.deathrollValue) * 100
  const lastDropPct = !settling && lastRoll && lastRoll.outOf > 0 ? (lastRoll.roll / lastRoll.outOf) * 100 : 100

  return (
    <Card
      className={cn(
        'border transition-all duration-200 bg-card/95 overflow-hidden',
        isMyTurn && !isExpired
          ? 'border-amber-500/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/30'
          : 'border-border/60'
      )}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Dices className="h-5 w-5" />
            </span>
            <div>
              <span className="text-sm font-bold text-foreground">
                {selectedCharName} vs {opponentName}
              </span>
              <p className="text-[11px] text-muted-foreground font-mono">
                Winner takes <span className="text-amber-400 font-bold">{match.wagerAmount} GP</span> • Started at 0-{match.deathrollValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Turn & Timer Status Badge */}
          <div className="flex flex-col items-end gap-1">
            {isExpired ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Time Expired!
              </span>
            ) : isMyTurn ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Your Turn
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border/40 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {settling ? 'Rolling...' : <>Opponent&apos;s Turn</>}
              </span>
            )}

            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
              <Hourglass className="h-3 w-3 text-amber-400/80" />
              {formatRemainingTime(timeLeftMs)}
            </span>
          </div>
        </div>

        {/* Current Roll Range Banner */}
        <div className="p-3 rounded-xl bg-background/80 border border-border/40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              {rolling ? 'Rolling...' : settling ? `${rollingText} 0 - ${lastRoll.outOf.toLocaleString()}...` : 'Current Roll Range'}
            </span>
            <span className="text-3xl text-rose-400 flex items-baseline gap-1">
              <span className="text-base font-mono text-muted-foreground">0 &mdash;</span>
              <RollReel
                value={match.currentRollMax ?? match.deathrollValue}
                range={currentMax}
                spinKey={allRolls.length}
                spinning={rolling || settling}
              />
            </span>
            {lastRoll && lastDropPct <= 10 && (
              <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1">
                <Flame className="h-3 w-3" /> Huge drop! Down to {lastDropPct.toFixed(1)}% of the last range
              </span>
            )}
          </div>

          {/* Action: Roll Dice or Claim Timeout */}
          {isExpired ? (
            <Button
              onClick={onClaimTimeout}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 px-3 gap-1.5 shadow-md shadow-rose-900/30"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
              Claim Timeout Win
            </Button>
          ) : isMyTurn ? (
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.92, rotate: -3 }}>
              <Button
                onClick={onRoll}
                disabled={rolling}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-10 px-4 gap-1.5 shadow-md shadow-amber-900/40"
              >
                <Dices className={cn('h-4 w-4', rolling && 'animate-spin')} />
                {rolling ? 'Rolling...' : `Roll (0 - ${currentMax.toLocaleString()})`}
              </Button>
            </motion.div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic shrink-0">{settling ? `${rollingText}...` : 'Awaiting roll...'}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/10 border border-border/30 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Bust chance</span>
            <span className="text-sm font-black font-mono text-rose-300">{bustChance(currentMax)}%</span>
          </div>
          <div className="rounded-lg bg-muted/10 border border-border/30 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Rolls left</span>
            <span className="text-sm font-black font-mono text-amber-300">~{expectedRollsLeft(currentMax).toFixed(1)}</span>
          </div>
          <div className="rounded-lg bg-muted/10 border border-border/30 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Rolls so far</span>
            <span className="text-sm font-black font-mono text-foreground">{rollsList.length}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
            <span>Heat</span>
            <span>{heatPct >= 75 ? '🔥 Danger zone' : heatPct >= 40 ? 'Heating up' : 'Cool'}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600"
              initial={false}
              animate={{ width: `${Math.max(3, heatPct)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Roll History Ladder */}
        {rollsList.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Roll History ({rollsList.length})
            </span>
            <RollLadder bet={{ ...match, rolls: rollsList }} characterId={characterId} />
          </div>
        )}
      </div>
    </Card>
  )
}
