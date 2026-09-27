'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Bell,
  Sparkles,
  Calendar,
  ShoppingBag,
  Swords,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Volume2,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  playNotificationChime,
} from '@/lib/notifications'

interface NotificationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const preferences = useQuery(api.notifications.getNotificationPreferences)
  const updatePreferences = useMutation(api.notifications.updateNotificationPreferences)

  const [browserPermission, setBrowserPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (open) {
      setBrowserPermission(getBrowserNotificationPermission())
    }
  }, [open])

  const handleToggleMaster = async (checked: boolean) => {
    if (!preferences) return
    setIsUpdating(true)
    try {
      // If turning on and browser permission is default, ask for it
      let shouldBrowserPush = preferences.browserPush ?? false
      if (checked && browserPermission === 'default') {
        const perm = await requestBrowserNotificationPermission()
        setBrowserPermission(perm)
        if (perm === 'granted') {
          shouldBrowserPush = true
        }
      }

      await updatePreferences({
        enabled: checked,
        browserPush: shouldBrowserPush,
        levelUp: preferences.levelUp ?? true,
        newSession: preferences.newSession ?? true,
        newListing: preferences.newListing ?? true,
        newBet: preferences.newBet ?? true,
        betExpiring: preferences.betExpiring ?? true,
      })
      toast.success(checked ? 'Notifications enabled' : 'Notifications disabled')
    } catch (err: any) {
      toast.error('Failed to update notification settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleOption = async (
    key: 'browserPush' | 'levelUp' | 'newSession' | 'newListing' | 'newBet' | 'betExpiring',
    checked: boolean
  ) => {
    if (!preferences) return
    setIsUpdating(true)
    try {
      if (key === 'browserPush' && checked && browserPermission !== 'granted') {
        const perm = await requestBrowserNotificationPermission()
        setBrowserPermission(perm)
        if (perm !== 'granted') {
          toast.error('Browser notifications permission was not granted')
          setIsUpdating(false)
          return
        }
      }

      await updatePreferences({
        enabled: preferences.enabled,
        browserPush: key === 'browserPush' ? checked : (preferences.browserPush ?? false),
        levelUp: key === 'levelUp' ? checked : (preferences.levelUp ?? true),
        newSession: key === 'newSession' ? checked : (preferences.newSession ?? true),
        newListing: key === 'newListing' ? checked : (preferences.newListing ?? true),
        newBet: key === 'newBet' ? checked : (preferences.newBet ?? true),
        betExpiring: key === 'betExpiring' ? checked : (preferences.betExpiring ?? true),
      })
    } catch (err) {
      toast.error('Failed to update notification option')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission()
    setBrowserPermission(perm)
    if (perm === 'granted') {
      toast.success('Desktop notification permission granted')
      if (preferences?.enabled) {
        await updatePreferences({
          ...preferences,
          browserPush: true,
        })
      }
    } else if (perm === 'denied') {
      toast.error('Notifications blocked. Please check your browser site settings.')
    }
  }

  const handleTestNotification = () => {
    playNotificationChime()
    
    // In-app test toast
    toast(
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
          Void Guild • Test Alert
        </span>
        <span className="font-bold text-sm text-purple-100">
          Notifications are working!
        </span>
      </div>,
      {
        description: 'You will receive real-time alerts for campaign sessions, auction bids, and deathrolls.',
        icon: <Bell className="h-5 w-5 text-purple-400 shrink-0" />,
        style: {
          backgroundColor: '#1e1b4b',
          borderColor: 'rgba(147, 51, 234, 0.5)',
          color: '#f8fafc',
        },
        className: '!bg-purple-950 !border-purple-500/50 !text-slate-100 shadow-2xl backdrop-blur-md rounded-xl p-4',
        duration: 5000,
      }
    )

    // Browser desktop push test
    if (browserPermission === 'granted' && (preferences?.browserPush ?? true)) {
      sendBrowserNotification('Void Guild • Test Notification', {
        body: 'Real-time campaign and market notifications are configured and active!',
        url: window.location.href,
      })
    }
  }

  const isMasterEnabled = preferences?.enabled ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Bell className="h-5 w-5 text-purple-400" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure alerts for character level-ups, scheduled sessions, Black Void auction listings, and deathroll challenges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 overflow-y-auto pr-1 flex-1">
          {/* Master Enable/Disable Toggle */}
          <div
            className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
              isMasterEnabled
                ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-950/30'
                : 'bg-card/40 border-border/60'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Enable Notifications
                </span>
                {isMasterEnabled ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Off (Default)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive live alerts and optional desktop notifications for your Void Guild activity.
              </p>
            </div>
            <Switch
              checked={isMasterEnabled}
              onCheckedChange={handleToggleMaster}
              disabled={isUpdating || !preferences}
            />
          </div>

          {/* Browser Desktop Push Notification Permission Card */}
          <div className="p-3.5 rounded-xl border border-border/50 bg-card/30 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Desktop & Background Popups
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Receive system push alerts even when viewing other tabs or windows.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {browserPermission === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    Allowed
                  </span>
                ) : browserPermission === 'denied' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 border border-destructive/30 px-2 py-0.5 rounded-full font-bold">
                    <XCircle className="h-3 w-3" />
                    Blocked
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] px-2.5 border-purple-500/40 hover:bg-purple-500/20 text-purple-300"
                    onClick={handleRequestPermission}
                  >
                    Allow Popups
                  </Button>
                )}
                {browserPermission === 'granted' && (
                  <Switch
                    checked={preferences?.browserPush ?? false}
                    onCheckedChange={(c) => handleToggleOption('browserPush', c)}
                    disabled={!isMasterEnabled || isUpdating}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Individual Category Toggles */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Event Subscriptions
            </h4>

            {/* 1. Character Level Up */}
            <div
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
              } bg-card/30 border-border/40 hover:border-border`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Character Level Ups
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When one of your characters levels up or achieves a rank promotion.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.levelUp ?? true}
                onCheckedChange={(c) => handleToggleOption('levelUp', c)}
                disabled={!isMasterEnabled || isUpdating}
              />
            </div>

            {/* 2. New Session Posted */}
            <div
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
              } bg-card/30 border-border/40 hover:border-border`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    New Sessions Scheduled
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When a Voidmaster posts a new upcoming campaign or intro session.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.newSession ?? true}
                onCheckedChange={(c) => handleToggleOption('newSession', c)}
                disabled={!isMasterEnabled || isUpdating}
              />
            </div>

            {/* 3. New Auction House Listing */}
            <div
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
              } bg-card/30 border-border/40 hover:border-border`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Black Void Market Listings
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When new items or services are listed on the Auction House.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.newListing ?? true}
                onCheckedChange={(c) => handleToggleOption('newListing', c)}
                disabled={!isMasterEnabled || isUpdating}
              />
            </div>

            {/* 4. New Bet Challenge (Open or Invited) */}
            <div
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
              } bg-card/30 border-border/40 hover:border-border`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <Swords className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Deathroll & Bet Challenges
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When an open bet challenge is posted or your character is challenged.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.newBet ?? true}
                onCheckedChange={(c) => handleToggleOption('newBet', c)}
                disabled={!isMasterEnabled || isUpdating}
              />
            </div>

            {/* 5. Bet About to Expire */}
            <div
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
              } bg-card/30 border-border/40 hover:border-border`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Expiring Bet Warnings
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When an active deathroll bet on your character has under 1 hour left on turn.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.betExpiring ?? true}
                onCheckedChange={(c) => handleToggleOption('betExpiring', c)}
                disabled={!isMasterEnabled || isUpdating}
              />
            </div>
          </div>
        </div>

        {/* Footer with Test Button and Close */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-border hover:bg-muted/40"
            onClick={handleTestNotification}
          >
            <Volume2 className="h-3.5 w-3.5 text-purple-400" />
            Send Test Alert
          </Button>

          <Button
            type="button"
            size="sm"
            className="bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs px-4"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
