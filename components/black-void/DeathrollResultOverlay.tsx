'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Trophy, Skull, Dices } from 'lucide-react'
import { fireGoldParticles } from '@/lib/particles'
import { cn } from '@/lib/utils'
import { ROLL_REVEAL_MS, bustChance } from '@/convex/deathroll'
import { DecoratedBet, RollLadder } from './DeathrollMatchCard'

export type RollReveal = {
  betId: Id<'blackVoidBets'>
  rollerName: string
  rollerIsMe: boolean
  outOf: number
  roll?: number
  nextName?: string | null
  wagerAmount: number
  isTimeout?: boolean
  skipSpin?: boolean
}

export default function DeathrollResultOverlay({
  reveal,
  finishedBet,
  characterId,
  onClose,
}: {
  reveal: RollReveal
  finishedBet?: DecoratedBet
  characterId: Id<'characters'>
  onClose: () => void
}) {
  const [spunEnough, setSpunEnough] = useState(!!reveal.isTimeout || !!reveal.skipSpin)
  const [display, setDisplay] = useState(0)

  const revealed = !!reveal.isTimeout || (spunEnough && reveal.roll !== undefined)
  const busted = !!reveal.isTimeout || reveal.roll === 0
  const isWinner = reveal.isTimeout ? finishedBet?.winnerCharacterId === characterId : !reveal.rollerIsMe
  const rolls = finishedBet?.rolls || []

  useEffect(() => {
    if (spunEnough) return
    const t = setTimeout(() => setSpunEnough(true), ROLL_REVEAL_MS)
    return () => clearTimeout(t)
  }, [spunEnough])

  useEffect(() => {
    if (revealed) return
    const spin = setInterval(() => setDisplay(Math.floor(Math.random() * (reveal.outOf + 1))), 55)
    return () => clearInterval(spin)
  }, [revealed, reveal.outOf])

  useEffect(() => {
    if (revealed && busted && isWinner) fireGoldParticles(window.innerWidth / 2, window.innerHeight / 2)
  }, [revealed, busted, isWinner])

  return (
    <Dialog open onOpenChange={(open) => !open && revealed && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/85 backdrop-blur-md"
        className={cn(
          'sm:max-w-md overflow-hidden border-2 text-center',
          !revealed
            ? 'border-amber-500/40'
            : !busted
              ? 'border-emerald-500/60 shadow-2xl shadow-emerald-500/10'
              : isWinner
                ? 'border-amber-400/70 shadow-2xl shadow-amber-500/20'
                : 'border-rose-600/70 shadow-2xl shadow-rose-600/20'
        )}
      >
        <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground">
          {reveal.isTimeout
            ? `${finishedBet?.loserName ?? 'Your opponent'} ran out of time`
            : `${reveal.rollerName} rolls 0 - ${reveal.outOf.toLocaleString()}`}
        </DialogDescription>

        {!reveal.isTimeout && (
          <motion.div
            key={revealed ? 'landed' : 'spin'}
            initial={revealed ? { scale: 2.2, opacity: 0 } : false}
            animate={
              revealed ? { scale: 1, opacity: 1, x: busted ? [0, -14, 14, -9, 9, -4, 4, 0] : 0 } : {}
            }
            transition={revealed ? { duration: busted ? 0.6 : 0.35 } : undefined}
            className={cn(
              'text-7xl font-black font-mono tabular-nums py-2',
              !revealed
                ? 'text-amber-300 blur-[0.5px]'
                : busted
                  ? 'text-rose-500 drop-shadow-[0_0_24px_rgba(244,63,94,0.6)]'
                  : 'text-emerald-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.45)]'
            )}
          >
            {(revealed ? reveal.roll ?? 0 : display).toLocaleString()}
          </motion.div>
        )}

        {!revealed && (
          <DialogTitle className="text-sm font-bold text-amber-300 flex items-center justify-center gap-2">
            <Dices className="h-4 w-4 animate-spin" /> Rolling...
          </DialogTitle>
        )}

        {revealed && !busted && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            <DialogTitle className="text-4xl font-black tracking-tight text-emerald-300">SURVIVED</DialogTitle>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{reveal.nextName ?? 'Your opponent'}</strong> must now roll 0 -{' '}
              {reveal.roll!.toLocaleString()} with a{' '}
              <strong className="text-rose-300">{bustChance(reveal.roll!)}%</strong> chance to bust.
            </p>
            <Button onClick={onClose} className="w-full font-bold bg-emerald-700 hover:bg-emerald-600">
              Pass the dice
            </Button>
          </motion.div>
        )}

        {revealed && busted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reveal.isTimeout ? 0 : 0.45 }}
            className="space-y-4"
          >
            <DialogTitle
              className={cn(
                'text-4xl font-black tracking-tight flex items-center justify-center gap-2',
                isWinner ? 'text-amber-300' : 'text-rose-400'
              )}
            >
              {isWinner ? <Trophy className="h-8 w-8" /> : <Skull className="h-8 w-8" />}
              {isWinner ? 'VICTORY' : 'DEFEAT'}
            </DialogTitle>

            <p className={cn('text-2xl font-black font-mono', isWinner ? 'text-emerald-400' : 'text-rose-400')}>
              {isWinner ? '+' : '-'}
              {reveal.wagerAmount} GP
            </p>

            {finishedBet && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-amber-300">{finishedBet.winnerName}</strong> beats{' '}
                <strong className="text-foreground">{finishedBet.loserName}</strong> after {rolls.length} rolls
                {' '}from 0-{finishedBet.deathrollValue.toLocaleString()}.
              </p>
            )}

            {finishedBet && rolls.length > 0 && (
              <div className="text-left rounded-lg bg-muted/10 border border-border/30 p-2">
                <RollLadder bet={finishedBet} characterId={characterId} />
              </div>
            )}

            <Button onClick={onClose} className={cn('w-full font-bold', isWinner ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-700 hover:bg-rose-600')}>
              {isWinner ? 'Bask in glory' : 'Walk away'}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
