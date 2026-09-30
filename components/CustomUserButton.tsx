'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Trophy, Key, Bell } from 'lucide-react'
import { DragonHeadIcon } from '@/components/characters/MembershipBadge'
import AchievementsModal from '@/components/AchievementsModal'
import { ApiKeyDialog } from '@/components/ApiKeyDialog'
import { NotificationsDialog } from '@/components/NotificationsDialog'

export default function CustomUserButton() {
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false)
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  return (
    <>
      <UserButton
        appearance={{
          elements: {
            footer: 'hidden',
          },
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Action
            label="Buy Membership"
            labelIcon={<DragonHeadIcon className="h-4 w-4 text-amber-400" />}
            onClick={() => window.open('https://tarragon.be', '_blank', 'noopener,noreferrer')}
          />
          <UserButton.Action
            label="Notifications"
            labelIcon={<Bell className="h-4 w-4 text-purple-400" />}
            onClick={() => setIsNotificationsOpen(true)}
          />
          <UserButton.Action
            label="Achievements"
            labelIcon={<Trophy className="h-4 w-4 text-amber-500" />}
            onClick={() => setIsAchievementsOpen(true)}
          />
          <UserButton.Action
            label="API Access Key"
            labelIcon={<Key className="h-4 w-4 text-amber-400" />}
            onClick={() => setIsApiDialogOpen(true)}
          />
        </UserButton.MenuItems>
      </UserButton>

      <NotificationsDialog
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
      />

      <AchievementsModal
        open={isAchievementsOpen}
        onOpenChange={setIsAchievementsOpen}
      />

      <ApiKeyDialog
        open={isApiDialogOpen}
        onOpenChange={setIsApiDialogOpen}
      />
    </>
  )
}
