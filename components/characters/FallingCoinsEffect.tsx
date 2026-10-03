'use client'

import React, { useEffect, useRef } from 'react'

interface FallingCoin {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  flipAngle: number
  flipSpeed: number
  tiltAngle: number
  tiltSpeed: number
  swayOffset: number
  swaySpeed: number
  alpha: number
  shineOffset: number
}

interface GoldDustMote {
  x: number
  y: number
  vy: number
  size: number
  alpha: number
  pulseSpeed: number
  pulseOffset: number
}

export default function FallingCoinsEffect({ className }: { className?: string }) {
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
    let coins: FallingCoin[] = []
    let dustMotes: GoldDustMote[] = []

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

      // Initialize coins and dust particles
      const coinCount = isMobile ? 8 : 16
      const dustCount = isMobile ? 10 : 20

      if (width > 0 && height > 0 && coins.length === 0) {
        coins = Array.from({ length: coinCount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: 0.25 + Math.random() * 0.45, // Slow, gentle fall
          radius: 3.5 + Math.random() * 3.5, // 3.5px to 7px coin size
          flipAngle: Math.random() * Math.PI * 2,
          flipSpeed: 1.2 + Math.random() * 2.0,
          tiltAngle: (Math.random() - 0.5) * 0.6,
          tiltSpeed: (Math.random() - 0.5) * 0.4,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: 0.8 + Math.random() * 1.2,
          alpha: 0.6 + Math.random() * 0.35,
          shineOffset: Math.random() * Math.PI * 2,
        }))

        dustMotes = Array.from({ length: dustCount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: 0.15 + Math.random() * 0.3,
          size: 0.6 + Math.random() * 1.2,
          alpha: 0.3 + Math.random() * 0.4,
          pulseSpeed: 1.5 + Math.random() * 2.5,
          pulseOffset: Math.random() * Math.PI * 2,
        }))
      }
    }

    const ro = new ResizeObserver(() => {
      resize()
    })

    if (canvas.parentElement) {
      ro.observe(canvas.parentElement)
    }

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

      // 1. Warm Golden Ambient Top/Bottom Glow
      const ambientGrad = ctx.createLinearGradient(0, 0, 0, height)
      ambientGrad.addColorStop(0, 'rgba(245, 158, 11, 0.06)')
      ambientGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.02)')
      ambientGrad.addColorStop(1, 'rgba(180, 83, 9, 0.07)')
      ctx.fillStyle = ambientGrad
      ctx.fillRect(0, 0, width, height)

      // 2. Gold Dust Particles (Background Layer)
      ctx.globalCompositeOperation = 'screen'
      for (const mote of dustMotes) {
        mote.y += mote.vy * (dt * 60)
        mote.x += Math.sin(elapsed * 1.5 + mote.pulseOffset) * 0.15

        if (mote.y > height + 10) {
          mote.y = -10
          mote.x = Math.random() * width
        }

        const pulse = Math.sin(elapsed * mote.pulseSpeed + mote.pulseOffset) * 0.5 + 0.5
        const curAlpha = mote.alpha * (0.5 + pulse * 0.5)

        ctx.fillStyle = `rgba(252, 211, 77, ${curAlpha})`
        ctx.beginPath()
        ctx.arc(mote.x, mote.y, mote.size * (0.8 + pulse * 0.4), 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. Falling Gold Coins
      for (const coin of coins) {
        coin.y += coin.vy * (dt * 60)
        coin.x += (coin.vx + Math.sin(elapsed * coin.swaySpeed + coin.swayOffset) * 0.35) * (dt * 60)
        coin.flipAngle += coin.flipSpeed * dt
        coin.tiltAngle += coin.tiltSpeed * dt

        // Wrap around bottom
        if (coin.y > height + coin.radius * 2) {
          coin.y = -coin.radius * 2
          coin.x = Math.random() * width
        }
        if (coin.x < -coin.radius * 2) coin.x = width + coin.radius * 2
        if (coin.x > width + coin.radius * 2) coin.x = -coin.radius * 2

        ctx.save()
        ctx.translate(coin.x, coin.y)
        ctx.rotate(coin.tiltAngle)

        // 3D Flip calculation
        const cosFlip = Math.cos(coin.flipAngle)
        const scaleX = Math.abs(cosFlip)
        const radiusX = Math.max(0.6, coin.radius * scaleX)
        const radiusY = coin.radius

        // Determine face lighting based on flip angle
        const shine = Math.sin(coin.flipAngle + coin.shineOffset) * 0.5 + 0.5
        const isFacingLight = cosFlip > 0

        // Coin Outer Rim (Edge)
        ctx.beginPath()
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2)

        const rimGrad = ctx.createLinearGradient(-radiusX, -radiusY, radiusX, radiusY)
        rimGrad.addColorStop(0, '#fef08a') // Light gold
        rimGrad.addColorStop(0.3, '#f59e0b') // Amber gold
        rimGrad.addColorStop(0.7, '#b45309') // Deep bronze gold
        rimGrad.addColorStop(1, '#78350f') // Dark rim
        ctx.fillStyle = rimGrad
        ctx.globalAlpha = coin.alpha
        ctx.fill()

        // Coin Face / Inner Inset (when visible enough)
        if (scaleX > 0.35) {
          ctx.beginPath()
          const innerX = radiusX * 0.78
          const innerY = radiusY * 0.78
          ctx.ellipse(0, 0, innerX, innerY, 0, 0, Math.PI * 2)

          const faceGrad = ctx.createLinearGradient(-innerX, -innerY, innerX, innerY)
          if (isFacingLight) {
            faceGrad.addColorStop(0, '#fffbeb')
            faceGrad.addColorStop(0.3, '#fbbf24')
            faceGrad.addColorStop(0.8, '#d97706')
            faceGrad.addColorStop(1, '#92400e')
          } else {
            faceGrad.addColorStop(0, '#fde68a')
            faceGrad.addColorStop(0.4, '#d97706')
            faceGrad.addColorStop(0.9, '#92400e')
            faceGrad.addColorStop(1, '#78350f')
          }
          ctx.fillStyle = faceGrad
          ctx.fill()

          // Coin Emblem Line / Star in Center
          if (scaleX > 0.6) {
            ctx.strokeStyle = `rgba(254, 243, 199, ${0.45 + shine * 0.35})`
            ctx.lineWidth = 0.75
            ctx.beginPath()
            ctx.arc(0, 0, innerX * 0.45, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // Glint / Sparkle on coin edge
        if (scaleX > 0.7 && shine > 0.85) {
          const glintAlpha = (shine - 0.85) / 0.15 * coin.alpha
          ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.9})`
          ctx.beginPath()
          ctx.arc(-radiusX * 0.35, -radiusY * 0.35, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
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
