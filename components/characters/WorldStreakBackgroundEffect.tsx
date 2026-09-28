'use client'

import React, { useEffect, useRef } from 'react'

interface SilverSparkle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  baseAlpha: number
  pulseSpeed: number
  pulseOffset: number
}

interface WorldStreakBackgroundEffectProps {
  emblemUrl?: string | null
  className?: string
}

export default function WorldStreakBackgroundEffect({
  emblemUrl,
  className,
}: WorldStreakBackgroundEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (emblemUrl) {
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
      }
      img.onerror = () => {
        imageRef.current = null
      }
      img.src = emblemUrl
      if (img.complete && img.naturalWidth > 0) {
        imageRef.current = img
      }
    } else {
      imageRef.current = null
    }
  }, [emblemUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let isVisible = true
    let width = 0
    let height = 0
    let sparkles: SilverSparkle[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const sparkleCount = isMobile ? 10 : 20

      if (width > 0 && height > 0 && sparkles.length === 0) {
        sparkles = Array.from({ length: sparkleCount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -(0.15 + Math.random() * 0.25),
          size: 0.8 + Math.random() * 1.6,
          alpha: 0.3 + Math.random() * 0.5,
          baseAlpha: 0.3 + Math.random() * 0.5,
          pulseSpeed: 1.5 + Math.random() * 2.5,
          pulseOffset: Math.random() * Math.PI * 2,
        }))
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

      const dt = Math.min((now - lastTime) * 0.001, 0.1)
      lastTime = now
      const elapsed = now * 0.001

      ctx.clearRect(0, 0, width, height)
      if (width <= 0 || height <= 0) return

      ctx.save()

      // 1. Scaled Up & Cropped World Emblem on Right Side (28% opacity)
      if (imageRef.current) {
        ctx.save()
        const img = imageRef.current
        const imgW = img.naturalWidth || img.width || 1
        const imgH = img.naturalHeight || img.height || 1
        const aspect = imgW / imgH

        const baseSize = Math.max(height * 1.6, width * 0.45)
        let drawW = baseSize
        let drawH = baseSize
        if (aspect > 1) {
          drawW = baseSize * aspect
        } else {
          drawH = baseSize / aspect
        }

        const imgX = width - drawW * 0.72
        const imgY = height * 0.5 - drawH * 0.5

        ctx.globalAlpha = 0.28
        ctx.drawImage(img, imgX, imgY, drawW, drawH)

        // Soft gradient mask so left edge blends into card
        const maskGrad = ctx.createLinearGradient(width - drawW * 0.75, 0, width, 0)
        maskGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)')
        maskGrad.addColorStop(0.35, 'rgba(15, 23, 42, 0.25)')
        maskGrad.addColorStop(1, 'rgba(15, 23, 42, 0)')
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = maskGrad
        ctx.fillRect(0, 0, width, height)
        ctx.restore()
      }

      // 2. Silver & Starlight Ambient Background Vignette
      const bgGrad = ctx.createLinearGradient(0, 0, width, height)
      bgGrad.addColorStop(0, 'rgba(241, 245, 249, 0.04)')
      bgGrad.addColorStop(0.6, 'rgba(148, 163, 184, 0.03)')
      bgGrad.addColorStop(1, 'rgba(203, 213, 225, 0.08)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // 3. Floating Silver Sparkles
      ctx.globalCompositeOperation = 'screen'
      for (const s of sparkles) {
        s.y += s.vy * (dt * 60)
        s.x += s.vx * (dt * 60) + Math.sin(elapsed * 1.5 + s.pulseOffset) * 0.15

        if (s.y < -5) {
          s.y = height + 5
          s.x = Math.random() * width
        }
        if (s.x < -5) s.x = width + 5
        if (s.x > width + 5) s.x = -5

        const pulse = Math.sin(elapsed * s.pulseSpeed + s.pulseOffset) * 0.5 + 0.5
        const curAlpha = s.baseAlpha * (0.45 + pulse * 0.55)

        // Draw diamond star / sparkle
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.fillStyle = `rgba(248, 250, 252, ${curAlpha})`
        ctx.shadowColor = 'rgba(226, 232, 240, 0.8)'
        ctx.shadowBlur = 4

        ctx.beginPath()
        ctx.arc(0, 0, s.size * (0.8 + pulse * 0.3), 0, Math.PI * 2)
        ctx.fill()

        if (pulse > 0.7 && s.size > 1.2) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${curAlpha * 0.9})`
          ctx.lineWidth = 0.6
          const starLen = s.size * 2.2
          ctx.beginPath()
          ctx.moveTo(-starLen, 0)
          ctx.lineTo(starLen, 0)
          ctx.moveTo(0, -starLen)
          ctx.lineTo(0, starLen)
          ctx.stroke()
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
      className={`pointer-events-none absolute inset-0 rounded-[inherit] z-0 overflow-hidden ${className || ''}`}
    />
  )
}
