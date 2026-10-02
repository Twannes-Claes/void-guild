'use client'

import React, { useEffect, useRef } from 'react'

interface TintParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  baseAlpha: number
  pulseSpeed: number
  pulseOffset: number
}

export default function TintParticlesEffect({
  variant,
  className,
}: {
  variant: 'cyan' | 'crimson' | 'gold' | 'silver'
  className?: string
}) {
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
    let particles: TintParticle[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      // Initialize initial motes
      if (width > 0 && height > 0 && particles.length === 0) {
        particles = Array.from({ length: isMobile ? 6 : 10 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.15 - Math.random() * 0.25,
          life: Math.random() * 50,
          maxLife: 60 + Math.random() * 60,
          size: 0.8 + Math.random() * 1.3,
          baseAlpha: 0.35 + Math.random() * 0.3,
          pulseSpeed: 1.2 + Math.random() * 1.8,
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

    let startTime = performance.now()

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible) return

      const elapsed = (now - startTime) * 0.001

      ctx.clearRect(0, 0, width, height)

      if (width <= 0 || height <= 0) {
        return
      }

      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      // Spawn new subtle motes
      if (particles.length < 10 && Math.random() < 0.25) {
        particles.push({
          x: Math.random() * width,
          y: height + 2,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.15 - Math.random() * 0.25,
          life: 0,
          maxLife: 60 + Math.random() * 60,
          size: 0.8 + Math.random() * 1.3,
          baseAlpha: 0.35 + Math.random() * 0.3,
          pulseSpeed: 1.2 + Math.random() * 1.8,
          pulseOffset: Math.random() * Math.PI * 2,
        })
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx + Math.sin(p.life * 0.08) * 0.1
        p.y += p.vy

        // Wrap or respawn
        if (p.y < -5 || p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        const progress = p.life / p.maxLife
        const pulse = Math.sin(elapsed * p.pulseSpeed + p.pulseOffset) * 0.5 + 0.5
        const fadeInOut = Math.sin(progress * Math.PI)
        const alpha = p.baseAlpha * fadeInOut * (0.6 + pulse * 0.4)

        const isHighlight = i % 3 === 0

        if (variant === 'cyan') {
          ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`
        } else if (variant === 'crimson') {
          ctx.fillStyle = `rgba(252, 165, 165, ${alpha})`
        } else if (variant === 'gold') {
          ctx.fillStyle = isHighlight
            ? `rgba(254, 249, 195, ${alpha * 1.15})`
            : `rgba(234, 179, 8, ${alpha * 0.95})`
        } else {
          // silver
          ctx.fillStyle = isHighlight
            ? `rgba(255, 255, 255, ${alpha * 1.2})`
            : `rgba(203, 213, 225, ${alpha * 0.95})`
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (0.85 + pulse * 0.25), 0, Math.PI * 2)
        ctx.fill()

        // Subtle 4-point diamond sparkle for highlighted gold/silver motes at peak pulse
        if ((variant === 'gold' || variant === 'silver') && isHighlight && pulse > 0.6) {
          const arm = p.size * (1.5 + pulse * 0.9)
          ctx.strokeStyle =
            variant === 'gold'
              ? `rgba(254, 240, 138, ${alpha * 0.85})`
              : `rgba(255, 255, 255, ${alpha * 0.9})`
          ctx.lineWidth = 0.75
          ctx.beginPath()
          ctx.moveTo(p.x - arm, p.y)
          ctx.lineTo(p.x + arm, p.y)
          ctx.moveTo(p.x, p.y - arm)
          ctx.lineTo(p.x, p.y + arm)
          ctx.stroke()
        }
      }

      ctx.restore()
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      ro.disconnect()
      io.disconnect()
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] z-0 overflow-hidden ${className || ''}`}
    />
  )
}
