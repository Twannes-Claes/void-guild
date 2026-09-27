'use client'

import React, { useEffect, useRef } from 'react'

interface InSyncPlasmaEffectProps {
  className?: string
}

interface EmberParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number // 30-45 (amber to gold)
}

export default function InSyncPlasmaEffect({ className }: InSyncPlasmaEffectProps) {
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
    const padding = 20
    let particles: EmberParticle[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height

      canvas.width = Math.round((width + padding * 2) * dpr)
      canvas.height = Math.round((height + padding * 2) * dpr)
      canvas.style.width = `${width + padding * 2}px`
      canvas.style.height = `${height + padding * 2}px`
      canvas.style.left = `${-padding}px`
      canvas.style.top = `${-padding}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
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

    // Helper: parametric point along rounded rectangle perimeter
    const getPerimeterPoint = (tNorm: number, w: number, h: number, r: number) => {
      const straightW = Math.max(0, w - 2 * r)
      const straightH = Math.max(0, h - 2 * r)
      const cornerArc = (Math.PI / 2) * r
      const totalLen = 2 * straightW + 2 * straightH + 4 * cornerArc
      let dist = (tNorm % 1) * totalLen
      if (dist < 0) dist += totalLen

      let x = 0
      let y = 0
      let nx = 0
      let ny = 0

      // Top edge (left to right)
      if (dist < straightW) {
        x = r + dist
        y = 0
        nx = 0
        ny = -1
        return { x, y, nx, ny }
      }
      dist -= straightW

      // Top-right corner
      if (dist < cornerArc) {
        const angle = -Math.PI / 2 + (dist / cornerArc) * (Math.PI / 2)
        x = w - r + Math.cos(angle) * r
        y = r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny }
      }
      dist -= cornerArc

      // Right edge (top to bottom)
      if (dist < straightH) {
        x = w
        y = r + dist
        nx = 1
        ny = 0
        return { x, y, nx, ny }
      }
      dist -= straightH

      // Bottom-right corner
      if (dist < cornerArc) {
        const angle = 0 + (dist / cornerArc) * (Math.PI / 2)
        x = w - r + Math.cos(angle) * r
        y = h - r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny }
      }
      dist -= cornerArc

      // Bottom edge (right to left)
      if (dist < straightW) {
        x = w - r - dist
        y = h
        nx = 0
        ny = 1
        return { x, y, nx, ny }
      }
      dist -= straightW

      // Bottom-left corner
      if (dist < cornerArc) {
        const angle = Math.PI / 2 + (dist / cornerArc) * (Math.PI / 2)
        x = r + Math.cos(angle) * r
        y = h - r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny }
      }
      dist -= cornerArc

      // Left edge (bottom to top)
      if (dist < straightH) {
        x = 0
        y = h - r - dist
        nx = -1
        ny = 0
        return { x, y, nx, ny }
      }
      dist -= straightH

      // Top-left corner
      const angle = Math.PI + (dist / cornerArc) * (Math.PI / 2)
      x = r + Math.cos(angle) * r
      y = r + Math.sin(angle) * r
      nx = Math.cos(angle)
      ny = Math.sin(angle)
      return { x, y, nx, ny }
    }

    let startTime = performance.now()

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible) return

      const elapsed = (now - startTime) * 0.001

      ctx.clearRect(0, 0, width + padding * 2, height + padding * 2)

      if (width <= 0 || height <= 0) {
        return
      }

      const cardRadius = 8
      const segments = 64 // Optimized from 120
      const ox = padding
      const oy = padding

      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      // Layer 1: Undulating outer fiery crimson/amber plasma haze
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const pt = getPerimeterPoint(t, width, height, cardRadius)
        const wave =
          Math.sin(t * Math.PI * 8 + elapsed * 2.8) * 2.8 +
          Math.cos(t * Math.PI * 14 - elapsed * 3.4) * 1.8 +
          Math.sin(t * Math.PI * 26 + elapsed * 5.2) * 1.1
        const px = ox + pt.x + pt.nx * (wave + 2)
        const py = oy + pt.y + pt.ny * (wave + 2)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(194, 65, 12, 0.45)'
      ctx.lineWidth = 8
      ctx.shadowColor = 'rgba(234, 88, 12, 0.6)'
      ctx.shadowBlur = 6
      ctx.stroke()

      // Layer 2: Radiant blazing orange flame
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const pt = getPerimeterPoint(t, width, height, cardRadius)
        const wave =
          Math.sin(t * Math.PI * 10 - elapsed * 3.6) * 2.2 +
          Math.cos(t * Math.PI * 20 + elapsed * 4.5) * 1.4
        const px = ox + pt.x + pt.nx * (wave + 0.8)
        const py = oy + pt.y + pt.ny * (wave + 0.8)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)'
      ctx.lineWidth = 3
      ctx.shadowColor = 'rgba(251, 146, 60, 0.8)'
      ctx.shadowBlur = 4
      ctx.stroke()

      // Layer 3: Intense white-hot core filaments
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const pt = getPerimeterPoint(t, width, height, cardRadius)
        const wave =
          Math.sin(t * Math.PI * 16 + elapsed * 5.0) * 0.9 +
          Math.cos(t * Math.PI * 36 - elapsed * 8.0) * 0.5
        const px = ox + pt.x + pt.nx * wave
        const py = oy + pt.y + pt.ny * wave
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.lineWidth = 1.2
      ctx.shadowBlur = 0
      ctx.stroke()

      // Spawn ember sparks
      if (particles.length < 12 && Math.random() < 0.4) {
        const t = Math.random()
        const pt = getPerimeterPoint(t, width, height, cardRadius)
        const angle = Math.atan2(pt.ny, pt.nx) + (Math.random() - 0.5) * 0.8
        const speed = 0.4 + Math.random() * 1.0
        particles.push({
          x: ox + pt.x + pt.nx * 2,
          y: oy + pt.y + pt.ny * 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2,
          life: 0,
          maxLife: 25 + Math.random() * 30,
          size: 1 + Math.random() * 2,
          hue: 20 + Math.random() * 22,
        })
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.size *= 0.97

        const progress = p.life / p.maxLife
        if (progress >= 1 || p.size <= 0.2) {
          particles.splice(i, 1)
          continue
        }

        const alpha = (1 - progress) * 0.85
        ctx.fillStyle = `hsla(${p.hue}, 95%, 55%, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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
      className={`pointer-events-none absolute z-20 overflow-visible ${className || ''}`}
    />
  )
}
