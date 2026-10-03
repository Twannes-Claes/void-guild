'use client'

import React, { useEffect, useRef } from 'react'

interface SmokePuff {
  x: number
  y: number
  vy: number
  vx: number
  radius: number
  growthRate: number
  alpha: number
  maxAlpha: number
  life: number
  maxLife: number
  swaySpeed: number
  swayOffset: number
  hue: 'slate' | 'silver' | 'violet'
}

export default function PhantomSmokeEffect({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isVisible = true
    let width = 0
    let height = 0
    let puffs: SmokePuff[] = []

    const createPuff = (startX?: number, startY?: number): SmokePuff => {
      const maxLife = 4.0 + Math.random() * 3.5
      const hues: ('slate' | 'silver' | 'violet')[] = ['slate', 'silver', 'slate', 'violet']
      return {
        x: startX ?? Math.random() * width,
        y: startY ?? (height + 15 + Math.random() * 20),
        vy: -(0.25 + Math.random() * 0.35), // Slow cool upward rise
        vx: (Math.random() - 0.5) * 0.15,
        radius: 12 + Math.random() * 16,
        growthRate: 3.5 + Math.random() * 4.5,
        alpha: 0,
        maxAlpha: 0.18 + Math.random() * 0.22,
        life: 0,
        maxLife,
        swaySpeed: 0.8 + Math.random() * 1.2,
        swayOffset: Math.random() * Math.PI * 2,
        hue: hues[Math.floor(Math.random() * hues.length)],
      }
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      width = parent.offsetWidth || canvas.clientWidth || rect.width
      height = parent.offsetHeight || canvas.clientHeight || rect.height

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = '100%'
      canvas.style.height = '100%'

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const count = isMobile ? 8 : 16

      if (width > 0 && height > 0 && puffs.length === 0) {
        puffs = Array.from({ length: count }, () => {
          const puff = createPuff(Math.random() * width, Math.random() * height)
          puff.life = Math.random() * puff.maxLife // Pre-warm positions
          return puff
        })
      }
    }

    const ro = new ResizeObserver(() => resize())
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
      },
      { threshold: 0.05 }
    )
    io.observe(canvas)

    resize()

    let lastTime = performance.now()

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible) return

      if (canvas.parentElement) {
        const curW = canvas.parentElement.offsetWidth
        const curH = canvas.parentElement.offsetHeight
        if (curW > 0 && curH > 0 && (Math.abs(curW - width) > 1 || Math.abs(curH - height) > 1)) {
          resize()
        }
      }

      const dt = Math.min((now - lastTime) * 0.001, 0.1)
      lastTime = now
      const elapsed = now * 0.001

      ctx.clearRect(0, 0, width, height)
      if (width <= 0 || height <= 0) return

      ctx.save()

      // 1. Cold Charcoal Ambient Overlay
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, 'rgba(15, 17, 23, 0.45)')
      bgGrad.addColorStop(0.6, 'rgba(23, 23, 30, 0.35)')
      bgGrad.addColorStop(1, 'rgba(10, 10, 15, 0.55)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // 2. Render Cold Smoke Wisps
      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i]
        p.life += dt

        if (p.life >= p.maxLife || p.y < -p.radius * 2) {
          puffs[i] = createPuff()
          continue
        }

        const progress = p.life / p.maxLife
        // Fade in rapidly, linger, then dissolve
        if (progress < 0.25) {
          p.alpha = (progress / 0.25) * p.maxAlpha
        } else {
          p.alpha = (1 - (progress - 0.25) / 0.75) * p.maxAlpha
        }

        p.y += p.vy * (dt * 60)
        p.x += (p.vx + Math.sin(elapsed * p.swaySpeed + p.swayOffset) * 0.25) * (dt * 60)
        const curRadius = p.radius + progress * p.growthRate * 8

        if (p.alpha <= 0.005) continue

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, curRadius)
        if (p.hue === 'silver') {
          grad.addColorStop(0, `rgba(226, 232, 240, ${p.alpha * 0.9})`)
          grad.addColorStop(0.45, `rgba(148, 163, 184, ${p.alpha * 0.55})`)
          grad.addColorStop(1, 'rgba(71, 85, 105, 0)')
        } else if (p.hue === 'violet') {
          grad.addColorStop(0, `rgba(196, 181, 253, ${p.alpha * 0.8})`)
          grad.addColorStop(0.5, `rgba(139, 92, 246, ${p.alpha * 0.35})`)
          grad.addColorStop(1, 'rgba(76, 29, 149, 0)')
        } else {
          // Default slate
          grad.addColorStop(0, `rgba(148, 163, 184, ${p.alpha * 0.75})`)
          grad.addColorStop(0.5, `rgba(100, 116, 139, ${p.alpha * 0.4})`)
          grad.addColorStop(1, 'rgba(30, 41, 59, 0)')
        }

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, curRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full rounded-[inherit] z-0 overflow-hidden ${className || ''}`}
    />
  )
}
