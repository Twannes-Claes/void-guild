'use client'

import React, { useEffect, useRef } from 'react'

interface QuestBeaconBorderEffectProps {
  className?: string
}

interface BeaconParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  isStar: boolean
}

export default function QuestBeaconBorderEffect({ className }: QuestBeaconBorderEffectProps) {
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
    const padding = 28
    let particles: BeaconParticle[] = []

    const isMobileDevice =
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = isMobileDevice ? 1 : Math.min(window.devicePixelRatio || 1, 1.25)
      width = parent.offsetWidth || canvas.clientWidth || 0
      height = parent.offsetHeight || canvas.clientHeight || 0

      canvas.width = Math.round((width + padding * 2) * dpr)
      canvas.height = Math.round((height + padding * 2) * dpr)
      canvas.style.width = `calc(100% + ${padding * 2}px)`
      canvas.style.height = `calc(100% + ${padding * 2}px)`
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

    // Helper: parametric point along rounded rectangle perimeter with smooth corner arcs
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
        return { x, y, nx, ny, tx: 1, ty: 0 }
      }
      dist -= straightW

      // Top-right corner
      if (dist < cornerArc) {
        const angle = -Math.PI / 2 + (dist / cornerArc) * (Math.PI / 2)
        x = w - r + Math.cos(angle) * r
        y = r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny, tx: -ny, ty: nx }
      }
      dist -= cornerArc

      // Right edge (top to bottom)
      if (dist < straightH) {
        x = w
        y = r + dist
        nx = 1
        ny = 0
        return { x, y, nx, ny, tx: 0, ty: 1 }
      }
      dist -= straightH

      // Bottom-right corner
      if (dist < cornerArc) {
        const angle = 0 + (dist / cornerArc) * (Math.PI / 2)
        x = w - r + Math.cos(angle) * r
        y = h - r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny, tx: -ny, ty: nx }
      }
      dist -= cornerArc

      // Bottom edge (right to left)
      if (dist < straightW) {
        x = w - r - dist
        y = h
        nx = 0
        ny = 1
        return { x, y, nx, ny, tx: -1, ty: 0 }
      }
      dist -= straightW

      // Bottom-left corner
      if (dist < cornerArc) {
        const angle = Math.PI / 2 + (dist / cornerArc) * (Math.PI / 2)
        x = r + Math.cos(angle) * r
        y = h - r + Math.sin(angle) * r
        nx = Math.cos(angle)
        ny = Math.sin(angle)
        return { x, y, nx, ny, tx: -ny, ty: nx }
      }
      dist -= cornerArc

      // Left edge (bottom to top)
      if (dist < straightH) {
        x = 0
        y = h - r - dist
        nx = -1
        ny = 0
        return { x, y, nx, ny, tx: 0, ty: -1 }
      }
      dist -= straightH

      // Top-left corner
      const angle = Math.PI + (dist / cornerArc) * (Math.PI / 2)
      x = r + Math.cos(angle) * r
      y = r + Math.sin(angle) * r
      nx = Math.cos(angle)
      ny = Math.sin(angle)
      return { x, y, nx, ny, tx: -ny, ty: nx }
    }

    let startTime = performance.now()
    let lastFrameTime = 0
    const targetInterval = isMobileDevice ? 1000 / 30 : 1000 / 60

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible) return

      // Throttle render rate on mobile/tablet to conserve GPU and battery
      if (isMobileDevice && now - lastFrameTime < targetInterval) {
        return
      }
      lastFrameTime = now

      const elapsed = (now - startTime) * 0.001
      const totalW = width + padding * 2
      const totalH = height + padding * 2

      ctx.clearRect(0, 0, totalW, totalH)

      if (width <= 0 || height <= 0) return

      const cardRadius = 8
      const ox = padding
      const oy = padding
      const loopDuration = 3.6
      const tBeacon = (elapsed / loopDuration) % 1

      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      // 1. Ambient guiding track along the perimeter using native roundRect
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(ox, oy, width, height, cardRadius)
      } else {
        const trackSegments = isMobileDevice ? 24 : 48
        for (let i = 0; i <= trackSegments; i++) {
          const pt = getPerimeterPoint(i / trackSegments, width, height, cardRadius)
          if (i === 0) ctx.moveTo(ox + pt.x, oy + pt.y)
          else ctx.lineTo(ox + pt.x, oy + pt.y)
        }
        ctx.closePath()
      }
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // 2. Trailing Radiant Beam Ribbon (spanning ~24% perimeter behind beacon head)
      const trailSpan = 0.24
      const trailSegments = isMobileDevice ? 12 : 24
      const trailPoints: { x: number; y: number; factor: number }[] = []

      for (let i = 0; i <= trailSegments; i++) {
        const factor = i / trailSegments // 0 at tail tip, 1 at head
        const t = tBeacon - (1 - factor) * trailSpan
        const pt = getPerimeterPoint(t, width, height, cardRadius)
        trailPoints.push({
          x: ox + pt.x,
          y: oy + pt.y,
          factor,
        })
      }

      // Draw outer radiant glowing aura of the trail
      if (!isMobileDevice) {
        ctx.shadowColor = 'rgba(251, 191, 36, 0.7)'
      }
      for (let i = 0; i < trailPoints.length - 1; i++) {
        const p1 = trailPoints[i]
        const p2 = trailPoints[i + 1]
        const f = (p1.factor + p2.factor) * 0.5
        const alpha = Math.pow(f, 1.8) * 0.75

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`
        ctx.lineWidth = 3 + f * 9
        if (!isMobileDevice) {
          ctx.shadowBlur = 6 + f * 6
        }
        ctx.stroke()
      }

      // Draw blazing inner core filament of the trail
      if (!isMobileDevice) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
        ctx.shadowBlur = 4
      }
      for (let i = 0; i < trailPoints.length - 1; i++) {
        const p1 = trailPoints[i]
        const p2 = trailPoints[i + 1]
        const f = (p1.factor + p2.factor) * 0.5
        const alpha = Math.pow(f, 1.4) * 0.95

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(255, 250, 220, ${alpha})`
        ctx.lineWidth = 1 + f * 2.5
        ctx.stroke()
      }
      if (!isMobileDevice) {
        ctx.shadowBlur = 0
      }

      // 3. The Focal Radiant Quest Beacon Head
      const headPt = getPerimeterPoint(tBeacon, width, height, cardRadius)
      const hx = ox + headPt.x
      const hy = oy + headPt.y
      const pulse = Math.sin(elapsed * 5.2) * 0.5 + 0.5

      // Outward radiant halo orb
      const haloGrad = ctx.createRadialGradient(hx, hy, 1, hx, hy, 20 + pulse * 6)
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      haloGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)')
      haloGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)')
      haloGrad.addColorStop(1, 'rgba(217, 119, 6, 0)')

      ctx.fillStyle = haloGrad
      ctx.beginPath()
      ctx.arc(hx, hy, 20 + pulse * 6, 0, Math.PI * 2)
      ctx.fill()

      // Forward-projecting searchlight cone
      const beamLength = 26 + pulse * 8
      const fx = hx + headPt.tx * beamLength
      const fy = hy + headPt.ty * beamLength
      const perpX = -headPt.ty * 8
      const perpY = headPt.tx * 8

      const beamGrad = ctx.createRadialGradient(hx, hy, 2, fx, fy, beamLength)
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      beamGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.45)')
      beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')

      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(hx + perpX * 0.4, hy + perpY * 0.4)
      ctx.lineTo(fx + perpX, fy + perpY)
      ctx.lineTo(fx - perpX, fy - perpY)
      ctx.lineTo(hx - perpX * 0.4, hy - perpY * 0.4)
      ctx.closePath()
      ctx.fill()

      // 4-Point Radiant Diamond Flare Spikes
      const spikeLen = 14 + pulse * 5
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      if (!isMobileDevice) {
        ctx.shadowColor = 'rgba(254, 240, 138, 1)'
        ctx.shadowBlur = 8
      }

      // Tangent / travel axis spike
      ctx.beginPath()
      ctx.moveTo(hx - headPt.tx * spikeLen * 0.7, hy - headPt.ty * spikeLen * 0.7)
      ctx.lineTo(hx + headPt.tx * spikeLen, hy + headPt.ty * spikeLen)
      ctx.stroke()

      // Normal / perpendicular axis spike
      ctx.beginPath()
      ctx.moveTo(hx - headPt.nx * spikeLen, hy - headPt.ny * spikeLen)
      ctx.lineTo(hx + headPt.nx * spikeLen, hy + headPt.ny * spikeLen)
      ctx.stroke()

      // Diagonal micro-spikes
      const microLen = spikeLen * 0.55
      const diag1X = (headPt.tx + headPt.nx) * 0.707 * microLen
      const diag1Y = (headPt.ty + headPt.ny) * 0.707 * microLen
      const diag2X = (headPt.tx - headPt.nx) * 0.707 * microLen
      const diag2Y = (headPt.ty - headPt.ny) * 0.707 * microLen

      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(hx - diag1X, hy - diag1Y)
      ctx.lineTo(hx + diag1X, hy + diag1Y)
      ctx.moveTo(hx - diag2X, hy - diag2Y)
      ctx.lineTo(hx + diag2X, hy + diag2Y)
      ctx.stroke()

      // Blazing white-hot center spark
      ctx.beginPath()
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      if (!isMobileDevice) {
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 6
      }
      ctx.fill()
      if (!isMobileDevice) {
        ctx.shadowBlur = 0
      }

      // 4. Trailing Radiant Quest Stardust Motes
      const maxParticles = isMobileDevice ? 6 : 16
      const spawnChance = isMobileDevice ? 0.2 : 0.45
      if (particles.length < maxParticles && Math.random() < spawnChance) {
        // Spawn spark slightly behind beacon head
        const spawnPt = getPerimeterPoint(tBeacon - 0.015, width, height, cardRadius)
        const sparkSpeed = 0.4 + Math.random() * 0.9
        const dirX = -headPt.tx * 0.5 + headPt.nx * (Math.random() - 0.2)
        const dirY = -headPt.ty * 0.5 + headPt.ny * (Math.random() - 0.2)
        const len = Math.hypot(dirX, dirY) || 1

        particles.push({
          x: ox + spawnPt.x + (Math.random() - 0.5) * 3,
          y: oy + spawnPt.y + (Math.random() - 0.5) * 3,
          vx: (dirX / len) * sparkSpeed,
          vy: (dirY / len) * sparkSpeed,
          life: 0,
          maxLife: 20 + Math.random() * 20,
          size: 0.9 + Math.random() * 1.5,
          isStar: Math.random() > 0.5,
        })
      }

      // Update & render stardust particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.size *= 0.96

        const prog = p.life / p.maxLife
        if (prog >= 1 || p.size <= 0.2) {
          particles.splice(i, 1)
          continue
        }

        const alpha = Math.sin(prog * Math.PI) * 0.9
        ctx.fillStyle = p.isStar
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(254, 240, 138, ${alpha})`

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.isStar && p.size > 1.0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(p.x - p.size * 1.6, p.y)
          ctx.lineTo(p.x + p.size * 1.6, p.y)
          ctx.moveTo(p.x, p.y - p.size * 1.6)
          ctx.lineTo(p.x, p.y + p.size * 1.6)
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
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 overflow-visible select-none ${className || ''}`}
    />
  )
}
