'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function DragonHeadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block shrink-0', className || 'h-3.5 w-3.5')}
      aria-hidden="true"
    >
      <path d="M21.7 3.2c-2.4 1.2-4.5 3.6-5.6 5.8-1.1-.6-2.5-.8-4-.4-1.2-2.1-2.9-3.6-5.2-4.4.7 1.8 1 3.7.8 5.6-1.3.7-2.6 1.7-3.9 3 1.8.7 3.4.4 4.8-.2.3 1.3 1 2.4 2 3.3-2.2.9-4.2 1-5.6.8 2 1.7 4.5 2 7 1.3 1.4 1.4 3.9 1.8 6.2 1.3 1.9-2.4 2.8-5.4 3.3-8.4 1.1-.7 2.2-2.1 2.5-3.5-.9.3-1.9.1-2.6-.6.8-1.6 1.3-3.1 1.3-4.2l-.2-.5zM11.5 10c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" />
    </svg>
  )
}

export function MembershipBadge({
  className,
  size = 'sm',
}: {
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center text-amber-400 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full shrink-0 transition-transform hover:scale-110',
        size === 'sm' ? 'h-4 w-4 p-0.5' : 'h-5 w-5 p-1',
        className
      )}
      title="Guild Member"
      aria-label="Guild Member"
    >
      <DragonHeadIcon className={size === 'sm' ? 'h-3 w-3 text-amber-400' : 'h-3.5 w-3.5 text-amber-400'} />
    </span>
  )
}
