'use client'

import React from 'react'
import { cn, getLevelBadgeStyle, CharacterRankIcon, getCharacterWikiUrl } from '@/lib/utils'
import { resolveCosmeticsStyles, CharacterCosmetics } from '@/lib/cosmetics'
import { renderCosmeticLetters } from '@/components/characters/CosmeticText'
import ProfileAvatarWithBadge from '@/components/characters/ProfileAvatarWithBadge'
import InSyncPlasmaEffect from '@/components/characters/InSyncPlasmaEffect'
import BlazeTextParticles from '@/components/characters/BlazeTextParticles'
import VoidNebulaEffect from '@/components/characters/VoidNebulaEffect'
import InfernoFireEffect from '@/components/characters/InfernoFireEffect'
import TintParticlesEffect from '@/components/characters/TintParticlesEffect'
import FallingCoinsEffect from '@/components/characters/FallingCoinsEffect'
import ArcaneRunesEffect from '@/components/characters/ArcaneRunesEffect'
import PhantomSmokeEffect from '@/components/characters/PhantomSmokeEffect'
import { MembershipBadge } from '@/components/characters/MembershipBadge'
import WorldStreakBackgroundEffect from '@/components/characters/WorldStreakBackgroundEffect'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Book } from 'lucide-react'

export interface CharacterCallingCardProps {
  name: string
  title?: string
  ancestry?: string
  characterClass?: string
  lvl: number
  rank?: string
  system?: 'PF' | 'DnD'
  websiteLink?: string
  imageUrl?: string | null
  cosmetics?: CharacterCosmetics | null
  rankNumber?: number
  streak?: number
  isMember?: boolean
  isYou?: boolean
  className?: string
  onWikiClick?: () => void
}

export default function CharacterCallingCard({
  name,
  title,
  ancestry,
  characterClass,
  lvl,
  rank,
  system,
  websiteLink,
  imageUrl,
  cosmetics,
  rankNumber,
  streak,
  isMember = false,
  isYou = false,
  className,
  onWikiClick,
}: CharacterCallingCardProps) {
  const styles = resolveCosmeticsStyles(cosmetics)

  const isWorldBg = Boolean(cosmetics?.bgColor?.startsWith('world_bg_'))
  const isWorldBorder = Boolean(cosmetics?.borderShape?.startsWith('world_border_'))
  const isWorldRing = Boolean(cosmetics?.profileBorder?.startsWith('world_ring_'))
  const allWorlds = useQuery(api.worlds.getAllWorlds, (isWorldBg || isWorldBorder || isWorldRing) ? {} : 'skip')

  const bgWorldId = isWorldBg ? cosmetics?.bgColor?.replace('world_bg_', '') : null
  const bgWorld = isWorldBg && allWorlds ? allWorlds.find((w) => w._id === bgWorldId) : null

  const borderWorldId = isWorldBorder ? cosmetics?.borderShape?.replace('world_border_', '') : null
  const borderWorld = isWorldBorder && allWorlds ? allWorlds.find((w) => w._id === borderWorldId) : null

  return (
    <div
      className={cn(
        'p-3.5 rounded-lg flex items-center justify-between gap-3 border transition-all relative overflow-visible',
        styles.cardClassName || 'bg-muted/20 border-border/60',
        className
      )}
      style={styles.cardStyle}
    >
      {styles.cardClassName.includes('in-sync') && <InSyncPlasmaEffect />}
      {(styles.cardClassName.includes('void-nebula') ||
        cosmetics?.bgColor === 'void_nebula' ||
        cosmetics?.bgColor === 'void-nebula-bg') && <VoidNebulaEffect />}
      {(styles.cardClassName.includes('blaze-inferno') ||
        cosmetics?.bgColor === 'blaze_inferno_bg' ||
        cosmetics?.bgColor === 'blaze-inferno-bg') && <InfernoFireEffect />}
      {(styles.cardClassName.includes('cyan-particle') ||
        cosmetics?.bgColor === 'cyan_particles' ||
        cosmetics?.bgColor === 'cyan-particle-bg') && <TintParticlesEffect variant="cyan" />}
      {(styles.cardClassName.includes('crimson-particle') ||
        cosmetics?.bgColor === 'crimson_particles' ||
        cosmetics?.bgColor === 'crimson-particle-bg') && <TintParticlesEffect variant="crimson" />}
      {(styles.cardClassName.includes('gold-coins') ||
        cosmetics?.bgColor === 'gold_coins_bg' ||
        cosmetics?.bgColor === 'gold-coins-bg') && <FallingCoinsEffect />}
      {(styles.cardClassName.includes('arcane-runes') ||
        cosmetics?.bgColor === 'arcane_runes_bg' ||
        cosmetics?.bgColor === 'arcane-runes-bg') && <ArcaneRunesEffect />}
      {(styles.cardClassName.includes('phantom-smoke') ||
        cosmetics?.bgColor === 'phantom_smoke_bg' ||
        cosmetics?.bgColor === 'phantom-smoke-bg') && <PhantomSmokeEffect />}
      {isWorldBg && <WorldStreakBackgroundEffect emblemUrl={bgWorld?.emblemUrl} />}

      {isWorldBorder && (
        <div
          className="absolute -bottom-1.5 -right-1.5 z-20 w-7 h-7 rounded-full p-0.5 bg-slate-950 border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center justify-center overflow-hidden"
          title={borderWorld ? `${borderWorld.name} Sigil` : 'World Sigil'}
        >
          {borderWorld?.emblemUrl ? (
            <img
              src={borderWorld.emblemUrl}
              alt={borderWorld.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-[10px] font-bold text-amber-300">✨</span>
          )}
        </div>
      )}

      {/* Left: Avatar & Info */}
      <div className="flex items-center gap-3 min-w-0 relative z-10">
        <ProfileAvatarWithBadge
          imageUrl={isMember && cosmetics?.avatarUrl ? cosmetics.avatarUrl : imageUrl}
          name={name}
          cosmetics={cosmetics}
          profileRingClassName={styles.profileRingClassName}
          rankNumber={rankNumber}
          streak={streak}
          size="lg"
        />
        <div className="min-w-0">
          <div className="font-bold flex items-center flex-wrap gap-2">
            <span
              className={cn('break-words relative', styles.nameClassName)}
              style={styles.nameStyle}
            >
              {styles.nameClassName?.includes('blaze-fire-text') && <BlazeTextParticles />}
              {renderCosmeticLetters(name, styles.nameClassName)}
            </span>
            {isMember && <MembershipBadge />}
            {isYou && (
              <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                You
              </span>
            )}
            <a
              href={getCharacterWikiUrl(name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                onWikiClick?.()
              }}
              className="text-muted-foreground hover:text-purple-500 shrink-0 inline-flex items-center"
              title="View on Wiki"
            >
              <Book size={15} />
            </a>
          </div>

          {title && (
            <div
              className={cn('relative truncate text-xs', styles.titleClassName)}
              style={styles.titleStyle}
            >
              {styles.titleClassName?.includes('blaze-fire-text') && <BlazeTextParticles />}
              {renderCosmeticLetters(title, styles.titleClassName)}
            </div>
          )}

          {(ancestry || characterClass) && (
            <div
              className={cn('relative truncate text-xs', styles.subtitleClassName)}
              style={styles.subtitleStyle}
            >
              {styles.subtitleClassName?.includes('blaze-fire-text') && <BlazeTextParticles />}
              {renderCosmeticLetters([ancestry, characterClass].filter(Boolean).join(' '), styles.subtitleClassName)}
            </div>
          )}

          {websiteLink && (
            <a
              href={websiteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-500 hover:underline truncate max-w-full block mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {websiteLink}
            </a>
          )}
        </div>
      </div>

      {/* Right: Badges */}
      <div className="flex items-center gap-1.5 shrink-0 relative z-10">
        <CharacterRankIcon rank={rank} />
        {system && (
          <img
            src={system === 'PF' ? '/PFVoid.svg' : '/DnDVoid.svg'}
            alt={system}
            className="h-4 w-4"
          />
        )}
        <span
          className="inline-flex align-middle justify-center w-14 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
          style={getLevelBadgeStyle(lvl)}
        >
          Lvl {lvl}
        </span>
      </div>
    </div>
  )
}
