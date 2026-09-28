'use client'

import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PROFILE_BORDER_OPTIONS } from '@/lib/cosmetics'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface ProfileAvatarWithBadgeProps {
  imageUrl?: string | null
  name: string
  cosmetics?: {
    profileBorder?: string
    [key: string]: any
  } | null
  profileRingClassName?: string
  rankNumber?: number
  streak?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function ProfileAvatarWithBadge({
  imageUrl,
  name,
  cosmetics,
  profileRingClassName,
  rankNumber,
  streak,
  size = 'md',
}: ProfileAvatarWithBadgeProps) {
  const isWorldRing = Boolean(cosmetics?.profileBorder?.startsWith('world_ring_'))
  const allWorlds = useQuery(api.worlds.getAllWorlds, isWorldRing ? {} : 'skip')
  const worldId = isWorldRing ? cosmetics?.profileBorder?.replace('world_ring_', '') : null
  const worldRing = isWorldRing && allWorlds ? allWorlds.find((w) => w._id === worldId) : null
  const worldEmblem = worldRing?.emblemUrl

  const profileBorderValue = cosmetics?.profileBorder
    ? PROFILE_BORDER_OPTIONS.find(
        (p) => p.id === cosmetics.profileBorder || p.value === cosmetics.profileBorder
      )?.value
    : null

  const ringClass = isWorldRing
    ? 'border-0'
    : profileRingClassName || profileBorderValue || 'border border-border'

  const streakTier = typeof streak === 'number' && streak >= 10 ? '10' : typeof streak === 'number' && streak >= 5 ? '5' : typeof streak === 'number' && streak >= 3 ? '3' : '1'

  const isRankBadge =
    cosmetics?.profileBorder === 'leaderboard_rank' ||
    cosmetics?.profileBorder === 'leaderboard-rank-badge'

  const COMMENDATION_BADGES: Record<string, { emoji: string; label: string }> = {
    comm_roleplay: { emoji: '🎭', label: 'Roleplay Commendation' },
    comm_tactics: { emoji: '⚔️', label: 'Tactics Commendation' },
    comm_clutch: { emoji: '🛡️', label: 'Clutch Commendation' },
    comm_heroic: { emoji: '🌟', label: 'Heroic Commendation' },
    gm_favor: { emoji: '👑', label: 'GM Favor Commendation' },
  }

  const activeCommendation = cosmetics?.profileBorder ? COMMENDATION_BADGES[cosmetics.profileBorder] : null

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const badgeSizeClasses = {
    sm: '-bottom-1.5 px-1.5 py-0.5 text-[10px]',
    md: '-bottom-2 px-1.5 py-0.5 text-xs',
    lg: '-bottom-2.5 px-2 py-0.5 text-xs font-black',
    xl: '-bottom-3 px-2.5 py-1 text-sm',
  }

  const commBadgeSizeClasses = {
    sm: 'w-4 h-4 text-[9px] -bottom-1 -left-1',
    md: 'w-5 h-5 text-xs -bottom-1 -left-1',
    lg: 'w-6 h-6 text-sm -bottom-1 -left-1',
    xl: 'w-8 h-8 text-base -bottom-1.5 -left-1.5',
  }

  return (
    <div className="relative shrink-0 inline-flex items-center justify-center">
      {isWorldRing && (
        <div
          className="absolute -inset-1 rounded-full overflow-hidden z-0 pointer-events-none p-0.5 bg-slate-900 border border-slate-300/50 shadow-[0_0_10px_rgba(203,213,225,0.4)]"
          title={worldRing ? `${worldRing.name} Sigil Ring` : 'World Sigil Ring'}
        >
          {worldEmblem ? (
            <img
              src={worldEmblem}
              alt={worldRing?.name || 'World Sigil'}
              className="w-full h-full object-cover rounded-full opacity-90 scale-105"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center text-[10px] text-slate-300 font-bold">
              ✨
            </div>
          )}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
        </div>
      )}

      <div
        className={cn(
          'rounded-full shrink-0 flex items-center justify-center relative z-10',
          isWorldRing && 'p-[2px]',
          sizeClasses[size],
          ringClass
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full rounded-full object-cover shrink-0 relative z-10"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-purple-500/20 flex items-center justify-center font-bold shrink-0 relative z-10">
            {name ? name[0]?.toUpperCase() : 'C'}
          </div>
        )}
      </div>

      {activeCommendation && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute rounded-full bg-slate-900/95 text-white border border-purple-400/60 shadow-md shadow-purple-950/60 z-10 select-none flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95',
                  commBadgeSizeClasses[size]
                )}
              >
                <span className="leading-none">{activeCommendation.emoji}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-semibold px-2.5 py-1 z-50">
              {activeCommendation.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isRankBadge && typeof rankNumber === 'number' && rankNumber > 0 && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 rounded-md font-black tracking-tighter leading-none z-10 select-none flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 border-0',
                  badgeSizeClasses[size],
                  rankNumber === 1
                    ? 'bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-amber-950 shadow-[0_2px_6px_rgba(245,158,11,0.5)]'
                    : rankNumber <= 9
                      ? 'bg-gradient-to-b from-fuchsia-400 via-purple-600 to-indigo-900 text-white shadow-[0_2px_6px_rgba(168,85,247,0.5)]'
                      : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-slate-100 shadow-md'
                )}
              >
                <span className="font-extrabold font-mono tracking-tighter leading-none">#{rankNumber}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-semibold px-2.5 py-1 z-50">
              Number {rankNumber} on the leaderboard
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
