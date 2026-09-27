'use client'

/**
 * Plays a gentle, ambient chime using the Web Audio API without needing external audio files.
 */
export function playNotificationChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Note 1: A subtle crystal tone
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.4)

    // Note 2: Harmonic higher note
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, now + 0.08) // A5
    gain2.gain.setValueAtTime(0, now + 0.08)
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.6)
  } catch {
    // Fail silently if audio context is blocked by browser autoplay policy
  }
}

/**
 * Checks the current browser notification permission status.
 */
export function getBrowserNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Requests browser permission for desktop notifications.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  try {
    return await Notification.requestPermission()
  } catch (err) {
    console.warn('Error requesting notification permission:', err)
    return 'denied'
  }
}

/**
 * Fires a native browser notification if permissions are granted.
 */
export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string
    url?: string
    icon?: string
    tag?: string
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/PFVoid.svg',
      badge: '/PFVoid.svg',
      tag: options?.tag,
      silent: false,
    })

    if (options?.url) {
      notification.onclick = (e) => {
        e.preventDefault()
        window.focus()
        if (options.url) {
          window.location.href = options.url
        }
        notification.close()
      }
    }

    return notification
  } catch (err) {
    console.warn('Failed to display browser notification:', err)
    return null
  }
}
