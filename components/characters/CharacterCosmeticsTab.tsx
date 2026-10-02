'use client'

import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Lock,
  Palette,
  Type,
  Frame,
  Paintbrush,
  Circle,
  Shield,
  Upload,
  ImageIcon,
  Trash2,
  Link2,
  ExternalLink,
  Globe,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getLevelBadgeStyle, CharacterRankIcon, cn } from '@/lib/utils'
import ProfileAvatarWithBadge from '@/components/characters/ProfileAvatarWithBadge'
import { renderCosmeticLetters } from '@/components/characters/CosmeticText'
import InSyncPlasmaEffect from '@/components/characters/InSyncPlasmaEffect'
import BlazeTextParticles from '@/components/characters/BlazeTextParticles'
import VoidNebulaEffect from '@/components/characters/VoidNebulaEffect'
import InfernoFireEffect from '@/components/characters/InfernoFireEffect'
import TintParticlesEffect from '@/components/characters/TintParticlesEffect'
import FallingCoinsEffect from '@/components/characters/FallingCoinsEffect'
import ArcaneRunesEffect from '@/components/characters/ArcaneRunesEffect'
import PhantomSmokeEffect from '@/components/characters/PhantomSmokeEffect'
import WorldStreakBackgroundEffect from '@/components/characters/WorldStreakBackgroundEffect'
import { MembershipBadge } from '@/components/characters/MembershipBadge'
import {
  resolveCosmeticsStyles,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  BORDER_SHAPE_OPTIONS,
  PROFILE_BORDER_OPTIONS,
  BG_COLOR_OPTIONS,
  CharacterCosmetics,
  CosmeticOption,
  ACHIEVEMENT_INFO,
  getLockedCosmeticsEquipped,
} from '@/lib/cosmetics'

interface CharacterCosmeticsTabProps {
  characterId?: string
  characterName: string
  title?: string
  ancestry: string
  characterClass: string
  characterLvl: number
  characterRank?: string
  cosmetics: CharacterCosmetics
  onChangeCosmetics: (updater: (prev: CharacterCosmetics) => CharacterCosmetics) => void
  unlockedAchievementIds: string[]
  isAdmin?: boolean
  isMember?: boolean
}

export default function CharacterCosmeticsTab({
  characterId,
  characterName,
  title,
  ancestry,
  characterClass,
  characterLvl,
  characterRank,
  cosmetics,
  onChangeCosmetics,
  unlockedAchievementIds,
  isAdmin = false,
  isMember = false,
}: CharacterCosmeticsTabProps) {
  const { user } = useUser()
  const clerkRole = String(user?.publicMetadata?.role || '').toLowerCase()
  const clerkMember = Boolean(
    user?.publicMetadata?.isMember === true ||
    String(user?.publicMetadata?.isMember).toLowerCase() === 'true' ||
    clerkRole === 'member' ||
    clerkRole === 'dragon'
  )
  const isEffectiveMember = Boolean(isMember || clerkMember)

  const profileImageUrl = user?.imageUrl
  const effectiveAvatarUrl = (isEffectiveMember && cosmetics.avatarUrl) ? cosmetics.avatarUrl : profileImageUrl
  const characterRanks = useQuery(api.characters.getCharacterLeaderboardRanks)
  const userWorldStreaks = useQuery(api.worlds.getUserWorldStreaks) || []
  const allWorlds = useQuery(api.worlds.getAllWorlds) || []
  const rankNumber = (characterId ? characterRanks?.[characterId] : undefined) ?? 1
  const [adminView, setAdminView] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
  const [customUrlInput, setCustomUrlInput] = useState('')

  const allBorderShapeOptions: CosmeticOption[] = useMemo(() => {
    const worldBorderOptions: CosmeticOption[] = userWorldStreaks.map((w) => ({
      id: `world_border_${w._id}`,
      name: `${w.name} Sigil Sparkles Border`,
      unlockedByDefault: false,
      value: 'rounded-lg world-streak-border',
    }))
    return [...BORDER_SHAPE_OPTIONS, ...worldBorderOptions]
  }, [userWorldStreaks])

  const allBgColorOptions: CosmeticOption[] = useMemo(() => {
    const worldBgOptions: CosmeticOption[] = userWorldStreaks.map((w) => ({
      id: `world_bg_${w._id}`,
      name: `${w.name} Sigil Starlight Tint`,
      unlockedByDefault: false,
      value: `world_bg_${w._id}`,
    }))
    return [...BG_COLOR_OPTIONS, ...worldBgOptions]
  }, [userWorldStreaks])

  const allProfileBorderOptions: CosmeticOption[] = useMemo(() => {
    const worldRingOptions: CosmeticOption[] = userWorldStreaks.map((w) => ({
      id: `world_ring_${w._id}`,
      name: `${w.name} Sigil Ring`,
      unlockedByDefault: false,
      value: `world_ring_${w._id}`,
    }))
    return [...PROFILE_BORDER_OPTIONS, ...worldRingOptions]
  }, [userWorldStreaks])


  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEffectiveMember) {
      toast.error('Custom character portraits are an exclusive Void Guild Member benefit!')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP, etc.)')
      return
    }

    // Max 10MB file check before sending
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setIsUploadingAvatar(true)
    const toastId = toast.loading('Uploading character portrait to Void Wiki...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      const fullUrl = data.fullUrl || `https://void.tarragon.be${data.url}`
      onChangeCosmetics((prev) => ({
        ...prev,
        avatarUrl: fullUrl,
      }))
      toast.success('Character portrait updated successfully!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error uploading image', { id: toastId })
    } finally {
      setIsUploadingAvatar(false)
      // reset file input
      e.target.value = ''
    }
  }

  const handleApplyCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    let trimmed = customUrlInput.trim()
    if (!trimmed) {
      toast.error('Please enter an image URL')
      return
    }
    if (trimmed.startsWith('/')) {
      trimmed = `https://void.tarragon.be${trimmed}`
    }
    onChangeCosmetics((prev) => ({
      ...prev,
      avatarUrl: trimmed,
    }))
    setIsUrlModalOpen(false)
    toast.success('Character portrait link set successfully!')
  }

  const handleRemoveAvatar = () => {
    onChangeCosmetics((prev) => ({
      ...prev,
      avatarUrl: undefined,
    }))
    toast.info('Custom portrait removed. Defaulting to your profile avatar.')
  }

  const isEffectiveAdmin = Boolean(isAdmin && adminView)

  const lockedCosmeticsEquipped = useMemo(() => {
    return getLockedCosmeticsEquipped(
      cosmetics,
      unlockedAchievementIds,
      userWorldStreaks,
      isEffectiveMember
    )
  }, [cosmetics, unlockedAchievementIds, userWorldStreaks, isEffectiveMember])

  function getOptionLockStatus(opt: CosmeticOption) {
    if (opt.unlockedByDefault) {
      return { isUnlocked: true, isNaturallyUnlocked: true, label: '', badgeLabel: '', isHidden: false, title: '' }
    }
    
    // Per-world streak dynamic checks (Hidden by default unless unlocked or in admin view)
    if (opt.id.startsWith('world_ring_')) {
      const worldId = opt.id.replace('world_ring_', '')
      const w = userWorldStreaks.find((x) => x._id === worldId)
      const currentStreak = w?.userMaxStreak ?? 0
      const isNaturallyUnlocked = Boolean((w as any)?.isOwner) || Boolean(w?.unlockedStreak3) || currentStreak >= 3
      const isUnlocked = isEffectiveAdmin || isNaturallyUnlocked
      const title = (w as any)?.isOwner ? `${w?.name || 'World'} Owner` : `${w?.name || 'World'} Streak 3`
      const label = isNaturallyUnlocked ? '' : `Requires World Streak 3 in ${w?.name || 'this world'} (Current: ${currentStreak}/3)`
      const badgeLabel = isNaturallyUnlocked ? '' : `Streak 3 (${currentStreak}/3)`
      return { isUnlocked, isNaturallyUnlocked, isHidden: true, label, badgeLabel, title }
    }

    if (opt.id.startsWith('world_bg_')) {
      const worldId = opt.id.replace('world_bg_', '')
      const w = userWorldStreaks.find((x) => x._id === worldId)
      const currentStreak = w?.userMaxStreak ?? 0
      const isNaturallyUnlocked = Boolean((w as any)?.isOwner) || Boolean(w?.unlockedStreak5) || currentStreak >= 5
      const isUnlocked = isEffectiveAdmin || isNaturallyUnlocked
      const title = (w as any)?.isOwner ? `${w?.name || 'World'} Owner` : `${w?.name || 'World'} Streak 5`
      const label = isNaturallyUnlocked ? '' : `Requires World Streak 5 in ${w?.name || 'this world'} (Current: ${currentStreak}/5)`
      const badgeLabel = isNaturallyUnlocked ? '' : `Streak 5 (${currentStreak}/5)`
      return { isUnlocked, isNaturallyUnlocked, isHidden: true, label, badgeLabel, title }
    }

    if (opt.id.startsWith('world_border_')) {
      const worldId = opt.id.replace('world_border_', '')
      const w = userWorldStreaks.find((x) => x._id === worldId)
      const currentStreak = w?.userMaxStreak ?? 0
      const isNaturallyUnlocked = Boolean((w as any)?.isOwner) || Boolean(w?.unlockedStreak10) || currentStreak >= 10
      const isUnlocked = isEffectiveAdmin || isNaturallyUnlocked
      const title = (w as any)?.isOwner ? `${w?.name || 'World'} Owner` : `${w?.name || 'World'} Streak 10`
      const label = isNaturallyUnlocked ? '' : `Requires World Streak 10 in ${w?.name || 'this world'} (Current: ${currentStreak}/10)`
      const badgeLabel = isNaturallyUnlocked ? '' : `Streak 10 (${currentStreak}/10)`
      return { isUnlocked, isNaturallyUnlocked, isHidden: true, label, badgeLabel, title }
    }

    if (!opt.requiredAchievementId) {
      return { isUnlocked: true, isNaturallyUnlocked: true, label: '', badgeLabel: '', isHidden: false, title: '' }
    }
    const isNaturallyUnlocked = unlockedAchievementIds.includes(opt.requiredAchievementId)
    const isUnlocked = isEffectiveAdmin || isNaturallyUnlocked
    const info = ACHIEVEMENT_INFO[opt.requiredAchievementId]
    const isHidden = info?.category === 'hidden'
    const title = info?.title || opt.requiredAchievementId
    const label = isNaturallyUnlocked
      ? ''
      : isEffectiveAdmin
        ? `Requires achievement: ${title}${isHidden ? ' (Secret)' : ''}`
        : isHidden
          ? 'Locked (Secret Achievement)'
          : `Requires achievement: ${title}`
    const badgeLabel = isNaturallyUnlocked
      ? ''
      : isEffectiveAdmin
        ? `Requires: ${title}${isHidden ? ' (Secret)' : ''}`
        : isHidden
          ? 'Locked'
          : `Requires: ${title}`

    return { isUnlocked, isNaturallyUnlocked, isHidden, label, badgeLabel, title }
  }

  function isOptionVisible(opt: CosmeticOption) {
    if (isEffectiveAdmin) return true
    const { isUnlocked, isHidden } = getOptionLockStatus(opt)
    if (isUnlocked) return true
    if (isHidden) return false
    return true
  }

  function handleSelectOption(category: keyof CharacterCosmetics, opt: CosmeticOption) {
    const { isUnlocked, isHidden, title } = getOptionLockStatus(opt)
    if (!isUnlocked) {
      if (isHidden) {
        toast.error('Locked cosmetic! Unlocked by a secret achievement.')
      } else {
        toast.error(`Locked cosmetic! Requires achievement: "${title}"`)
      }
      return
    }
    onChangeCosmetics((prev) => ({
      ...prev,
      [category]: opt.id,
    }))
  }

  const renderColorSwatches = (colorKey: 'nameColor' | 'titleColor' | 'subtitleColor') => {
    const isDefaultSelected = !cosmetics[colorKey] || cosmetics[colorKey] === '' || cosmetics[colorKey] === 'default'
    const defaultFillClass =
      colorKey === 'nameColor'
        ? 'bg-foreground'
        : colorKey === 'titleColor'
          ? 'bg-amber-400'
          : 'bg-muted-foreground'

    return (
      <div className="flex flex-wrap gap-2.5 items-center">
        {/* Default Theme Color Swatch */}
        <button
          type="button"
          onClick={() => onChangeCosmetics((prev) => ({ ...prev, [colorKey]: '' }))}
          title={colorKey === 'titleColor' ? 'Default Yellow/Amber Italic' : 'Default Theme Color'}
          className={cn(
            'w-8 h-8 rounded-full border transition-all relative shadow-sm',
            defaultFillClass,
            isDefaultSelected
              ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background scale-110 border-purple-500'
              : 'border-transparent hover:scale-105 opacity-80'
          )}
        />

        {/* Preset Color Swatches */}
        {COLOR_OPTIONS.filter((c) => c.id !== 'default' && isOptionVisible(c)).map((opt) => {
          const { isUnlocked, isNaturallyUnlocked, label } = getOptionLockStatus(opt)
          const isSelected = cosmetics[colorKey] === opt.value || cosmetics[colorKey] === opt.id
          const isRainbowOpt = opt.value === 'rainbow-text' || opt.id === 'rainbow'
          const isGoldOpt = opt.value === 'gold-text' || opt.id === 'gold_text'
          const isBlazeOpt = opt.value === 'blaze-fire-text' || opt.id === 'blaze_text'

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(colorKey, opt)}
              title={
                !isNaturallyUnlocked && isEffectiveAdmin
                  ? `${opt.name} (Admin Preview - ${label})`
                  : !isUnlocked
                    ? label
                    : opt.name
              }
              className={cn(
                'w-8 h-8 rounded-full transition-all flex items-center justify-center relative border overflow-hidden shrink-0',
                isRainbowOpt && 'bg-gradient-to-r from-red-500 via-green-500 to-purple-500',
                isGoldOpt && 'bg-gradient-to-br from-[#BF953F] via-[#FCF6BA] to-[#AA771C]',
                isBlazeOpt && 'bg-gradient-to-t from-red-600 via-orange-500 to-amber-300',
                isSelected
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background scale-110 border-white dark:border-slate-900'
                  : isUnlocked
                    ? 'border-transparent hover:scale-105 shadow-sm'
                    : 'opacity-40 grayscale cursor-not-allowed border-border/40'
              )}
              style={!isRainbowOpt && !isGoldOpt && !isBlazeOpt ? { backgroundColor: opt.value } : {}}
            >
              {isRainbowOpt && (
                <span className="text-[9px] font-black text-white drop-shadow tracking-tighter">
                  RGB
                </span>
              )}
              {isGoldOpt && (
                <span className="text-[9px] font-black text-amber-950 drop-shadow-sm tracking-tighter">
                  AU
                </span>
              )}
              {isBlazeOpt && (
                <span className="text-[9px] font-black text-white drop-shadow-sm tracking-tighter">
                  🔥
                </span>
              )}
              {!isUnlocked && <Lock className="h-3 w-3 text-white drop-shadow z-10" />}
            </button>
          )
        })}
      </div>
    )
  }

  const previewStyles = resolveCosmeticsStyles(cosmetics)
  const isPreviewWorldBg = Boolean(cosmetics.bgColor?.startsWith('world_bg_'))
  const isPreviewWorldBorder = Boolean(cosmetics.borderShape?.startsWith('world_border_'))
  const previewBgWorldId = isPreviewWorldBg ? cosmetics.bgColor?.replace('world_bg_', '') : null
  const previewBgWorld =
    (isPreviewWorldBg && allWorlds ? allWorlds.find((w) => w._id === previewBgWorldId) : null) ||
    (isPreviewWorldBg && userWorldStreaks ? userWorldStreaks.find((w) => w._id === previewBgWorldId) : null)
  const previewBorderWorldId = isPreviewWorldBorder ? cosmetics.borderShape?.replace('world_border_', '') : null
  const previewBorderWorld =
    (isPreviewWorldBorder && allWorlds ? allWorlds.find((w) => w._id === previewBorderWorldId) : null) ||
    (isPreviewWorldBorder && userWorldStreaks ? userWorldStreaks.find((w) => w._id === previewBorderWorldId) : null)

  return (
    <div className="flex flex-col gap-6">
      {/* Admin View Toggle Bar */}
      {isAdmin && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Admin Mode</span>
                <p className="text-[11px] text-muted-foreground">Reveal, test and preview all secret, world and achievement cosmetics</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdminView(!adminView)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all',
                adminView
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground border-border/70'
              )}
            >
              <span>{adminView ? 'Admin View: ON' : 'Admin View: OFF'}</span>
            </button>
          </div>

          {adminView && lockedCosmeticsEquipped.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-0.5">
                <span className="font-bold text-foreground">Previewing Locked Cosmetics (Test Mode)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Currently previewed locked cosmetics: <strong className="text-foreground">{lockedCosmeticsEquipped.join(', ')}</strong>.
                  You can freely test all cosmetics in the Calling Card, but characters cannot be saved with locked cosmetics.
                </p>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Live Calling Card Preview (Pinned at top) */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-1 pb-3 -mx-1 px-1 border-b border-border/60 shadow-md">
        <div className="p-3.5 rounded-xl bg-muted/40 border border-dashed border-border/80 space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Calling Card Live Preview
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
              Attending List Style
            </span>
          </div>

          <div
            className={cn(
              'p-3 rounded-lg flex items-center justify-between gap-3 border transition-all relative overflow-visible',
              previewStyles.cardClassName
            )}
            style={previewStyles.cardStyle}
          >
          {previewStyles.cardClassName.includes('in-sync') && <InSyncPlasmaEffect />}
          {(previewStyles.cardClassName.includes('void-nebula') || cosmetics.bgColor === 'void_nebula' || cosmetics.bgColor === 'void-nebula-bg') && (
            <VoidNebulaEffect />
          )}
          {(previewStyles.cardClassName.includes('blaze-inferno') || cosmetics.bgColor === 'blaze_inferno_bg' || cosmetics.bgColor === 'blaze-inferno-bg') && (
            <InfernoFireEffect />
          )}
          {(previewStyles.cardClassName.includes('cyan-particle') || cosmetics.bgColor === 'cyan_particles' || cosmetics.bgColor === 'cyan-particle-bg') && (
            <TintParticlesEffect variant="cyan" />
          )}
          {(previewStyles.cardClassName.includes('crimson-particle') || cosmetics.bgColor === 'crimson_particles' || cosmetics.bgColor === 'crimson-particle-bg') && (
            <TintParticlesEffect variant="crimson" />
          )}
          {(previewStyles.cardClassName.includes('gold-coins') || cosmetics.bgColor === 'gold_coins_bg' || cosmetics.bgColor === 'gold-coins-bg') && (
            <FallingCoinsEffect />
          )}
          {(previewStyles.cardClassName.includes('arcane-runes') || cosmetics.bgColor === 'arcane_runes_bg' || cosmetics.bgColor === 'arcane-runes-bg') && (
            <ArcaneRunesEffect />
          )}
          {(previewStyles.cardClassName.includes('phantom-smoke') || cosmetics.bgColor === 'phantom_smoke_bg' || cosmetics.bgColor === 'phantom-smoke-bg') && (
            <PhantomSmokeEffect />
          )}
          {isPreviewWorldBg && <WorldStreakBackgroundEffect emblemUrl={previewBgWorld?.emblemUrl} />}

          {isPreviewWorldBorder && previewBorderWorld?.emblemUrl && (
            <div
              className="absolute -bottom-2.5 -right-2.5 z-20 pointer-events-none select-none"
              title={previewBorderWorld.name ? `${previewBorderWorld.name} Sigil` : 'World Sigil'}
            >
              <img
                src={previewBorderWorld.emblemUrl}
                alt={previewBorderWorld.name || 'World Sigil'}
                className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              />
            </div>
          )}
          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <ProfileAvatarWithBadge
              imageUrl={effectiveAvatarUrl}
              name={characterName}
              cosmetics={cosmetics}
              profileRingClassName={previewStyles.profileRingClassName}
              rankNumber={rankNumber}
              size="lg"
            />
            <div className="min-w-0">
              <div className="font-bold flex items-center gap-2">
                <span className={cn('break-words relative', previewStyles.nameClassName)} style={previewStyles.nameStyle}>
                  {previewStyles.nameClassName.includes('blaze-fire-text') && <BlazeTextParticles />}
                  {renderCosmeticLetters(characterName || 'Character Name', previewStyles.nameClassName)}
                </span>
                {isMember && <MembershipBadge />}
                <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                  You
                </span>
              </div>
              {title ? (
                <div className={cn('relative', previewStyles.titleClassName)} style={previewStyles.titleStyle}>
                  {previewStyles.titleClassName.includes('blaze-fire-text') && <BlazeTextParticles />}
                  {renderCosmeticLetters(title, previewStyles.titleClassName)}
                </div>
              ) : (
                <div className={cn('relative', previewStyles.titleClassName)} style={previewStyles.titleStyle}>
                  {previewStyles.titleClassName.includes('blaze-fire-text') && <BlazeTextParticles />}
                  {renderCosmeticLetters('The Wanderer', previewStyles.titleClassName)}{' '}
                  <span className="text-[9px] opacity-60 font-normal tracking-tight">(Sample Title)</span>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                <span className={cn('relative', previewStyles.subtitleClassName)} style={previewStyles.subtitleStyle}>
                  {previewStyles.subtitleClassName.includes('blaze-fire-text') && <BlazeTextParticles />}
                  {renderCosmeticLetters(`${ancestry || 'Ancestry'} ${characterClass || 'Class'}`, previewStyles.subtitleClassName)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CharacterRankIcon rank={characterRank} />
            <span
              className="inline-flex align-middle justify-center w-14 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
              style={getLevelBadgeStyle(characterLvl)}
            >
              Lvl {characterLvl}
            </span>
          </div>
        </div>
      </div>
      </div>

      {/* 1. Character Name Styling */}
      <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-card/50 border border-border/60">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" />
          Name Customization
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            Name Font
          </label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
            value={cosmetics.nameFont || 'default'}
            onChange={(e) => {
              const opt = FONT_OPTIONS.find((f) => f.id === e.target.value)
              if (opt) handleSelectOption('nameFont', opt)
            }}
          >
            {FONT_OPTIONS.filter(isOptionVisible).map((f) => {
              const { isUnlocked, isNaturallyUnlocked, isHidden, title: reqTitle } = getOptionLockStatus(f)
              return (
                <option key={f.id} value={f.id} disabled={!isUnlocked}>
                  {isUnlocked
                    ? isEffectiveAdmin && !isNaturallyUnlocked
                      ? `${f.name} [Preview Only - Requires: ${reqTitle}]`
                      : f.name
                    : isAdmin
                      ? `[Locked] ${f.name} (Requires: ${reqTitle}${isHidden ? ' - Secret' : ''})`
                      : isHidden
                        ? `[Locked] ${f.name} (Secret Achievement)`
                        : `[Locked] ${f.name} (Requires: ${reqTitle})`}
                </option>
              )
            })}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-purple-500" />
            Name Color
          </label>
          {renderColorSwatches('nameColor')}
        </div>
      </div>

      {/* 2. Character Title Styling */}
      <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-card/50 border border-border/60">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            Title Customization
          </span>
          {title ? (
            <span className="text-[10px] text-amber-400/90 font-medium italic lowercase">
              &quot;{title}&quot;
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-normal lowercase">
              (preview style)
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>Title Font</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {title ? `Applied to: "${title}"` : 'Applied when granted by a GM'}
            </span>
          </label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
            value={cosmetics.titleFont || 'default'}
            onChange={(e) => {
              const opt = FONT_OPTIONS.find((f) => f.id === e.target.value)
              if (opt) handleSelectOption('titleFont', opt)
            }}
          >
            {FONT_OPTIONS.filter(isOptionVisible).map((f) => {
              const { isUnlocked, isNaturallyUnlocked, isHidden, title: reqTitle } = getOptionLockStatus(f)
              return (
                <option key={f.id} value={f.id} disabled={!isUnlocked}>
                  {isUnlocked
                    ? isEffectiveAdmin && !isNaturallyUnlocked
                      ? `${f.name} [Preview Only - Requires: ${reqTitle}]`
                      : f.name
                    : isAdmin
                      ? `[Locked] ${f.name} (Requires: ${reqTitle}${isHidden ? ' - Secret' : ''})`
                      : isHidden
                        ? `[Locked] ${f.name} (Secret Achievement)`
                        : `[Locked] ${f.name} (Requires: ${reqTitle})`}
                </option>
              )
            })}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              Title Color
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              (Default: Yellow/Amber Italic)
            </span>
          </label>
          {renderColorSwatches('titleColor')}
        </div>
      </div>

      {/* 3. Character Subtitle Styling (Ancestry & Class) */}
      <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-card/50 border border-border/60">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-500 dark:text-purple-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            Subtitle Customization
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {ancestry || 'Ancestry'} {characterClass || 'Class'}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>Subtitle Font</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              ({ancestry || 'Ancestry'} {characterClass || 'Class'})
            </span>
          </label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
            value={cosmetics.subtitleFont || 'default'}
            onChange={(e) => {
              const opt = FONT_OPTIONS.find((f) => f.id === e.target.value)
              if (opt) handleSelectOption('subtitleFont', opt)
            }}
          >
            {FONT_OPTIONS.filter(isOptionVisible).map((f) => {
              const { isUnlocked, isNaturallyUnlocked, isHidden, title: reqTitle } = getOptionLockStatus(f)
              return (
                <option key={f.id} value={f.id} disabled={!isUnlocked}>
                  {isUnlocked
                    ? isEffectiveAdmin && !isNaturallyUnlocked
                      ? `${f.name} [Preview Only - Requires: ${reqTitle}]`
                      : f.name
                    : isAdmin
                      ? `[Locked] ${f.name} (Requires: ${reqTitle}${isHidden ? ' - Secret' : ''})`
                      : isHidden
                        ? `[Locked] ${f.name} (Secret Achievement)`
                        : `[Locked] ${f.name} (Requires: ${reqTitle})`}
                </option>
              )
            })}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-purple-400" />
              Subtitle Color
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              (Default: Muted Opacity)
            </span>
          </label>
          {renderColorSwatches('subtitleColor')}
        </div>
      </div>

      {/* 4. Card Border Effect & Shape */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold flex items-center gap-1.5">
          <Frame className="h-4 w-4 text-amber-500" />
          Card Border Effect & Shape
        </label>
        <div className="flex flex-col gap-2">
          {allBorderShapeOptions.filter(isOptionVisible).map((opt) => {
            const { isUnlocked, isNaturallyUnlocked, label, badgeLabel } = getOptionLockStatus(opt)
            const isSelected = cosmetics.borderShape === opt.id || cosmetics.borderShape === opt.value
            const isSpecialBorder =
              opt.value.includes('-card-border') ||
              opt.value.includes('rainbow-border') ||
              opt.value.includes('void-rotating-border') ||
              opt.value.includes('in-sync-border') ||
              opt.value.includes('world-streak-border')

            const isWorldBorderOpt = opt.id.startsWith('world_border_')
            const worldOpt = isWorldBorderOpt
              ? (allWorlds?.find((w) => w._id === opt.id.replace('world_border_', '')) ||
                 userWorldStreaks?.find((w) => w._id === opt.id.replace('world_border_', '')))
              : null

            return (
              <button
                key={opt.id}
                type="button"
                data-selected={isSelected}
                onClick={() => handleSelectOption('borderShape', opt)}
                title={
                  !isNaturallyUnlocked && isEffectiveAdmin
                    ? `${opt.name} (Admin Preview - ${label})`
                    : !isUnlocked
                      ? label
                      : opt.name
                }
                className={cn(
                  'w-full p-3 text-left text-xs transition-all flex items-center justify-between relative rounded-lg',
                  opt.value,
                  isSelected
                    ? isSpecialBorder
                      ? 'font-bold text-foreground'
                      : 'bg-purple-500/25 dark:bg-purple-950/50 font-bold text-foreground border-purple-500/50'
                    : isUnlocked
                      ? isSpecialBorder
                        ? 'text-foreground'
                        : 'bg-card/80 hover:bg-muted/40 text-foreground border-border/50'
                      : 'bg-muted/20 text-muted-foreground opacity-50 grayscale cursor-not-allowed'
                )}
              >
                {opt.id === 'in_sync_border' && isUnlocked && <InSyncPlasmaEffect />}
                <span className="font-semibold relative z-10">{opt.name}</span>
                <div className="flex items-center gap-2 relative z-10">
                  {!isUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                      <Lock className="h-3 w-3" />
                      {badgeLabel}
                    </span>
                  )}
                </div>
                {isWorldBorderOpt && worldOpt?.emblemUrl && (
                  <div className="absolute -bottom-2 -right-2 z-20 pointer-events-none select-none">
                    <img
                      src={worldOpt.emblemUrl}
                      alt={worldOpt.name}
                      className="w-10 h-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Card Background Color / Tint */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold flex items-center gap-1.5">
          <Paintbrush className="h-4 w-4 text-blue-500" />
          Card Background Tint
        </label>
        <div className="flex flex-col gap-2">
          {allBgColorOptions.filter(isOptionVisible).map((opt) => {
            const { isUnlocked, isNaturallyUnlocked, label, badgeLabel } = getOptionLockStatus(opt)
            const isSelected =
              cosmetics.bgColor === opt.id ||
              cosmetics.bgColor === opt.value ||
              (opt.id === 'default' && (!cosmetics.bgColor || cosmetics.bgColor === 'default'))

            const isClassTint = typeof opt.value === 'string' && (opt.value.endsWith('-bg-tint') || opt.value.endsWith('-bg'))
            const isWorldBgOpt = opt.id.startsWith('world_bg_')
            const worldOpt = isWorldBgOpt ? userWorldStreaks.find((w) => w._id === opt.id.replace('world_bg_', '')) : null

            return (
              <button
                key={opt.id}
                type="button"
                data-selected={isSelected}
                onClick={() => handleSelectOption('bgColor', opt)}
                title={
                  !isNaturallyUnlocked && isEffectiveAdmin
                    ? `${opt.name} (Admin Preview - ${label})`
                    : !isUnlocked
                      ? label
                      : opt.name
                }
                className={cn(
                  'w-full p-3 rounded-lg text-left text-xs transition-all flex items-center justify-between border relative overflow-hidden',
                  isClassTint && opt.value,
                  isSelected
                    ? 'border-2 border-purple-500 ring-2 ring-purple-500 font-bold text-foreground'
                    : isUnlocked
                      ? 'border-border hover:border-muted-foreground text-foreground'
                      : 'border-border/40 opacity-50 grayscale cursor-not-allowed'
                )}
                style={{
                  backgroundColor: !isClassTint && !isWorldBgOpt && opt.value ? opt.value : undefined,
                }}
              >
                {(opt.id === 'void_nebula' || opt.value === 'void-nebula-bg') && isUnlocked && (
                  <VoidNebulaEffect />
                )}
                {(opt.id === 'blaze_inferno_bg' || opt.value === 'blaze-inferno-bg') && isUnlocked && (
                  <InfernoFireEffect />
                )}
                {(opt.id === 'cyan_particles' || opt.value === 'cyan-particle-bg') && isUnlocked && (
                  <TintParticlesEffect variant="cyan" />
                )}
                {(opt.id === 'crimson_particles' || opt.value === 'crimson-particle-bg') && isUnlocked && (
                  <TintParticlesEffect variant="crimson" />
                )}
                {(opt.id === 'gold_coins_bg' || opt.value === 'gold-coins-bg') && isUnlocked && (
                  <FallingCoinsEffect />
                )}
                {(opt.id === 'arcane_runes_bg' || opt.value === 'arcane-runes-bg') && isUnlocked && (
                  <ArcaneRunesEffect />
                )}
                {(opt.id === 'phantom_smoke_bg' || opt.value === 'phantom-smoke-bg') && isUnlocked && (
                  <PhantomSmokeEffect />
                )}
                {isWorldBgOpt && isUnlocked && (
                  <WorldStreakBackgroundEffect emblemUrl={worldOpt?.emblemUrl} />
                )}
                <span className="font-semibold relative z-10">{opt.name}</span>
                {!isUnlocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 relative z-10">
                    <Lock className="h-3 w-3" />
                    {badgeLabel}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. Profile Avatar Ring */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-emerald-500" />
          Profile Avatar Ring
        </label>
        <div className="flex flex-wrap gap-2.5 items-center">
          {allProfileBorderOptions.filter(isOptionVisible).map((opt) => {
            const { isUnlocked, isNaturallyUnlocked, label } = getOptionLockStatus(opt)
            const isSelected =
              cosmetics.profileBorder === opt.id ||
              cosmetics.profileBorder === opt.value ||
              (opt.id === 'default' && (!cosmetics.profileBorder || cosmetics.profileBorder === 'default'))

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption('profileBorder', opt)}
                title={
                  !isNaturallyUnlocked && isEffectiveAdmin
                    ? `${opt.name} (Admin Preview - ${label})`
                    : !isUnlocked
                      ? label
                      : opt.name
                }
                className={cn(
                  'p-2 rounded-xl border transition-all flex items-center justify-center relative shrink-0',
                  isSelected
                    ? 'bg-purple-500/25 dark:bg-purple-950/50 border-purple-500/60 shadow-sm'
                    : isUnlocked
                      ? 'border-transparent hover:bg-muted/40'
                      : 'border-transparent opacity-40 grayscale cursor-not-allowed'
                )}
              >
                <ProfileAvatarWithBadge
                  imageUrl={effectiveAvatarUrl}
                  name={characterName}
                  cosmetics={{ profileBorder: opt.id }}
                  profileRingClassName={opt.value}
                  rankNumber={rankNumber}
                  size="lg"
                />
                {!isUnlocked && <Lock className="h-4 w-4 text-white drop-shadow absolute z-10" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 7. Custom Character Portrait (Member Benefit) */}
      <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-card/50 border border-border/60">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Character Portrait
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
            <MembershipBadge size="sm" />
            Member Perk
          </span>
        </div>

        {isEffectiveMember ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/40">
            <div className="shrink-0 relative">
              <ProfileAvatarWithBadge
                imageUrl={effectiveAvatarUrl}
                name={characterName}
                cosmetics={cosmetics}
                profileRingClassName={previewStyles.profileRingClassName}
                rankNumber={rankNumber}
                size="lg"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <p className="text-xs text-muted-foreground">
                Upload a custom portrait for this character to be used in attending character lists and cards. Uploads are hosted on the Void Wiki and automatically optimized as WebP.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors shadow-sm",
                  isUploadingAvatar && "opacity-50 pointer-events-none"
                )}>
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingAvatar ? 'Uploading...' : cosmetics.avatarUrl ? 'Upload New' : 'Upload Portrait'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingAvatar}
                    onChange={handleAvatarFileChange}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCustomUrlInput(cosmetics.avatarUrl || '')
                    setIsUrlModalOpen((prev) => !prev)
                  }}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-card hover:bg-muted text-foreground border border-border/80 transition-colors shadow-sm"
                >
                  <Link2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Browse / Wiki Link</span>
                </button>

                {cosmetics.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Portrait</span>
                  </button>
                )}
              </div>

              {isUrlModalOpen && (
                <div className="mt-3 p-3 rounded-md bg-background/90 border border-purple-500/30 space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-purple-400" />
                      Link Image from Void Wiki or Web
                    </span>
                    <a
                      href="https://void.tarragon.be"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 hover:underline"
                    >
                      <span>Open Void Wiki</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Paste an image URL from the Void Wiki (e.g. <span className="font-mono text-[10px] text-purple-300">https://void.tarragon.be/...</span> or <span className="font-mono text-[10px] text-purple-300">/uploads/...</span>) or any public image URL.
                  </p>

                  <form onSubmit={handleApplyCustomUrl} className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://void.tarragon.be/uploads/image.webp"
                      className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border focus:outline-none focus:border-purple-500 text-foreground"
                    />
                    <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUrlModalOpen(false)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/40 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Custom Character Portraits</span>
                <p className="text-[11px] text-muted-foreground">
                  Void Guild Members can upload unique character portraits hosted on the Void Wiki.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
