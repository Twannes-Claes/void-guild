'use client'

import React, { useEffect, useRef } from 'react'

interface FloatingRune {
  x: number
  y: number
  vy: number
  vx: number
  size: number
  angle: number
  angularSpeed: number
  glyphIndex: number
  alpha: number
  baseAlpha: number
  pulseSpeed: number
  pulseOffset: number
  hueType: 'cyan' | 'purple' | 'gold'
}

interface SpellCircle {
  x: number
  y: number
  radius: number
  angle: number
  rotSpeed: number
  alpha: number
  pulseOffset: number
  layers: number
}

interface ManaSpark {
  x: number
  y: number
  vy: number
  vx: number
  size: number
  alpha: number
  pulseSpeed: number
  pulseOffset: number
  hue: string
}

// Custom programmatic arcane glyph drawers
function drawArcaneGlyph(ctx: CanvasRenderingContext2D, glyphIndex: number, size: number) {
  const s = size * 0.5
  ctx.beginPath()

  switch (glyphIndex % 8) {
    case 0:
      // Arcane Ansuz (F-like branch with diamond head)
      ctx.moveTo(0, s)
      ctx.lineTo(0, -s)
      ctx.moveTo(0, -s * 0.5)
      ctx.lineTo(s * 0.7, -s * 0.9)
      ctx.moveTo(0, 0)
      ctx.lineTo(s * 0.6, -s * 0.4)
      break
    case 1:
      // Algiz (Protective trident / warding branch)
      ctx.moveTo(0, s)
      ctx.lineTo(0, -s)
      ctx.moveTo(-s * 0.7, -s)
      ctx.lineTo(0, -s * 0.3)
      ctx.lineTo(s * 0.7, -s)
      break
    case 2:
      // Othala / Arcane Loop (Diamond with cross legs)
      ctx.moveTo(0, -s)
      ctx.lineTo(s * 0.6, -s * 0.3)
      ctx.lineTo(-s * 0.6, s * 0.9)
      ctx.moveTo(0, -s)
      ctx.lineTo(-s * 0.6, -s * 0.3)
      ctx.lineTo(s * 0.6, s * 0.9)
      break
    case 3:
      // Tiwaz / Arcane Spearhead
      ctx.moveTo(0, s)
      ctx.lineTo(0, -s)
      ctx.moveTo(-s * 0.7, -s * 0.4)
      ctx.lineTo(0, -s)
      ctx.lineTo(s * 0.7, -s * 0.4)
      break
    case 4:
      // Gebo / Arcane Cross of Pacts
      ctx.moveTo(-s * 0.7, -s * 0.8)
      ctx.lineTo(s * 0.7, s * 0.8)
      ctx.moveTo(s * 0.7, -s * 0.8)
      ctx.lineTo(-s * 0.7, s * 0.8)
      ctx.moveTo(0, -s * 0.5)
      ctx.lineTo(0, s * 0.5)
      break
    case 5:
      // Sowilo / Lightning Sigil
      ctx.moveTo(-s * 0.5, -s)
      ctx.lineTo(s * 0.5, -s * 0.3)
      ctx.lineTo(-s * 0.5, s * 0.3)
      ctx.lineTo(s * 0.5, s)
      break
    case 6:
      // Arcane Eye of Divination / Lens
      ctx.moveTo(-s * 0.8, 0)
      ctx.quadraticCurveTo(0, -s * 0.7, s * 0.8, 0)
      ctx.quadraticCurveTo(0, s * 0.7, -s * 0.8, 0)
      ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2)
      break
    case 7:
    default:
      // Arcane Hourglass / Transmutation Seal
      ctx.moveTo(-s * 0.6, -s)
      ctx.lineTo(s * 0.6, -s)
      ctx.lineTo(-s * 0.6, s)
      ctx.lineTo(s * 0.6, s)
      ctx.closePath()
      ctx.moveTo(-s * 0.3, 0)
      ctx.lineTo(s * 0.3, 0)
      break
  }
  ctx.stroke()
}

// Intricate rotating geometric spell circle drawer
function drawSpellCircle(ctx: CanvasRenderingContext2D, circle: SpellCircle, elapsed: number) {
  const { x, y, radius, angle, alpha, pulseOffset } = circle
  const pulse = Math.sin(elapsed * 1.2 + pulseOffset) * 0.5 + 0.5
  const currentAlpha = alpha * (0.7 + pulse * 0.3)

  if (currentAlpha <= 0.01) return

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // 1. Outer Ring
  ctx.lineWidth = 1.0
  ctx.strokeStyle = `rgba(56, 189, 248, ${currentAlpha * 0.8})` // Cyan
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()

  // 2. Outer Tick Marks / Runes Orbit
  const numTicks = 12
  ctx.strokeStyle = `rgba(168, 85, 247, ${currentAlpha * 0.9})` // Purple
  ctx.lineWidth = 0.8
  for (let i = 0; i < numTicks; i++) {
    const a = (i / numTicks) * Math.PI * 2
    const r1 = radius - 2
    const r2 = radius + (i % 3 === 0 ? 4 : 2)
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2)
    ctx.stroke()
  }

  // 3. Middle Ring
  ctx.lineWidth = 0.6
  ctx.strokeStyle = `rgba(250, 204, 21, ${currentAlpha * 0.7})` // Gold
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2)
  ctx.stroke()

  // 4. Inscribed Geometric Triangles (Rotating Counter)
  ctx.save()
  ctx.rotate(-angle * 1.6)
  ctx.strokeStyle = `rgba(56, 189, 248, ${currentAlpha * 0.6})`
  ctx.lineWidth = 0.75
  
  // Equilateral triangle 1
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const ta = (i / 3) * Math.PI * 2
    const tx = Math.cos(ta) * (radius * 0.72)
    const ty = Math.sin(ta) * (radius * 0.72)
    if (i === 0) ctx.moveTo(tx, ty)
    else ctx.lineTo(tx, ty)
  }
  ctx.closePath()
  ctx.stroke()

  // Equilateral triangle 2 (Hexagram / Seal of Solomon)
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const ta = (i / 3) * Math.PI * 2 + Math.PI
    const tx = Math.cos(ta) * (radius * 0.72)
    const ty = Math.sin(ta) * (radius * 0.72)
    if (i === 0) ctx.moveTo(tx, ty)
    else ctx.lineTo(tx, ty)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

  // 5. Center Core Seal
  ctx.fillStyle = `rgba(168, 85, 247, ${currentAlpha * 0.25})`
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = `rgba(254, 240, 138, ${currentAlpha * 0.9})`
  ctx.lineWidth = 0.8
  ctx.stroke()

  ctx.restore()
}

export default function ArcaneRunesEffect({ className }: { className?: string }) {
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
    let runes: FloatingRune[] = []
    let spellCircles: SpellCircle[] = []
    let manaSparks: ManaSpark[] = []

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

      const runeCount = isMobile ? 7 : 14
      const sparkCount = isMobile ? 12 : 24

      if (width > 0 && height > 0 && runes.length === 0) {
        // 1. Floating Arcane Runes
        runes = Array.from({ length: runeCount }, (_, i) => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(0.18 + Math.random() * 0.32), // Gentle upward drift
          vx: (Math.random() - 0.5) * 0.12,
          size: 10 + Math.random() * 8, // 10px to 18px glyph size
          angle: (Math.random() - 0.5) * 0.4,
          angularSpeed: (Math.random() - 0.5) * 0.15,
          glyphIndex: i % 8,
          alpha: 0.35 + Math.random() * 0.45,
          baseAlpha: 0.35 + Math.random() * 0.45,
          pulseSpeed: 1.2 + Math.random() * 1.8,
          pulseOffset: Math.random() * Math.PI * 2,
          hueType: i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'purple' : 'gold',
        }))

        // 2. Slow Rotating Spell Circles
        spellCircles = [
          {
            x: width * 0.88,
            y: height * 0.5,
            radius: Math.min(width * 0.22, 42),
            angle: 0,
            rotSpeed: 0.12,
            alpha: 0.45,
            pulseOffset: 0,
            layers: 3,
          },
          {
            x: width * 0.12,
            y: height * 0.5,
            radius: Math.min(width * 0.18, 34),
            angle: Math.PI * 0.5,
            rotSpeed: -0.09,
            alpha: 0.35,
            pulseOffset: Math.PI * 0.6,
            layers: 2,
          },
        ]

        // 3. Shimmering Mana Sparks
        const hues = ['#38bdf8', '#c084fc', '#fde047', '#a7f3d0']
        manaSparks = Array.from({ length: sparkCount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(0.12 + Math.random() * 0.25),
          vx: (Math.random() - 0.5) * 0.15,
          size: 0.8 + Math.random() * 1.4,
          alpha: 0.3 + Math.random() * 0.5,
          pulseSpeed: 1.5 + Math.random() * 2.5,
          pulseOffset: Math.random() * Math.PI * 2,
          hue: hues[Math.floor(Math.random() * hues.length)],
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

      // 1. Deep Arcane Gradient Ambient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height)
      bgGrad.addColorStop(0, 'rgba(14, 11, 38, 0.45)') // Deep mystic navy
      bgGrad.addColorStop(0.5, 'rgba(30, 27, 75, 0.25)') // Arcane indigo
      bgGrad.addColorStop(1, 'rgba(88, 28, 135, 0.35)') // Subtle violet edge
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'screen'

      // 2. Render Spell Circles in the background
      for (const sc of spellCircles) {
        sc.angle += sc.rotSpeed * dt
        drawSpellCircle(ctx, sc, elapsed)
      }

      // 3. Render Mana Sparks
      for (const spark of manaSparks) {
        spark.y += spark.vy * (dt * 60)
        spark.x += spark.vx * (dt * 60) + Math.sin(elapsed * 1.8 + spark.pulseOffset) * 0.15

        if (spark.y < -5) {
          spark.y = height + 5
          spark.x = Math.random() * width
        }
        if (spark.x < -5) spark.x = width + 5
        if (spark.x > width + 5) spark.x = -5

        const pulse = Math.sin(elapsed * spark.pulseSpeed + spark.pulseOffset) * 0.5 + 0.5
        const curAlpha = spark.alpha * (0.4 + pulse * 0.6)

        ctx.fillStyle = spark.hue
        ctx.globalAlpha = curAlpha
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, spark.size * (0.8 + pulse * 0.4), 0, Math.PI * 2)
        ctx.fill()
      }

      // 4. Render Floating Arcane Glyphs
      for (const rune of runes) {
        rune.y += rune.vy * (dt * 60)
        rune.x += rune.vx * (dt * 60) + Math.sin(elapsed * 1.2 + rune.pulseOffset) * 0.2
        rune.angle += rune.angularSpeed * dt

        if (rune.y < -rune.size) {
          rune.y = height + rune.size
          rune.x = Math.random() * width
        }
        if (rune.x < -rune.size) rune.x = width + rune.size
        if (rune.x > width + rune.size) rune.x = -rune.size

        const pulse = Math.sin(elapsed * rune.pulseSpeed + rune.pulseOffset) * 0.5 + 0.5
        const curAlpha = rune.baseAlpha * (0.55 + pulse * 0.45)

        ctx.save()
        ctx.translate(rune.x, rune.y)
        ctx.rotate(rune.angle)

        // Color & Glow selection
        let strokeColor = `rgba(56, 189, 248, ${curAlpha})` // Cyan default
        let glowColor = 'rgba(56, 189, 248, 0.6)'
        if (rune.hueType === 'purple') {
          strokeColor = `rgba(192, 132, 252, ${curAlpha})`
          glowColor = 'rgba(192, 132, 252, 0.6)'
        } else if (rune.hueType === 'gold') {
          strokeColor = `rgba(253, 224, 71, ${curAlpha * 0.9})`
          glowColor = 'rgba(253, 224, 71, 0.6)'
        }

        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1.2
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 5

        drawArcaneGlyph(ctx, rune.glyphIndex, rune.size)

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
