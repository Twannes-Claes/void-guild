'use client'

import React, { useEffect, useRef } from 'react'

interface TextParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  startAlpha: number
}

export default function BlazeTextParticles({ className }: { className?: string }) {
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
    const padTop = 22
    const padHoriz = 10
    let particles: TextParticle[] = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(rect.width, 20)
      height = Math.max(rect.height, 14)

      canvas.width = Math.round((width + padHoriz * 2) * dpr)
      canvas.height = Math.round((height + padTop) * dpr)
      canvas.style.width = `${width + padHoriz * 2}px`
      canvas.style.height = `${height + padTop}px`
      canvas.style.left = `${-padHoriz}px`
      canvas.style.top = `${-padTop}px`

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

    const render = () => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible) return

      ctx.clearRect(0, 0, width + padHoriz * 2, height + padTop)

      if (width <= 0 || height <= 0) {
        return
      }

      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      // Spawn particles
      if (particles.length < 10 && Math.random() < 0.45) {
        particles.push({
          x: padHoriz + Math.random() * width,
          y: padTop + height * 0.5 + Math.random() * (height * 0.5),
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.45 - Math.random() * 0.55,
          life: 0,
          maxLife: 20 + Math.random() * 25,
          size: 0.8 + Math.random() * 1.4,
          startAlpha: 0.7 + Math.random() * 0.3,
        })
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx + Math.sin(p.life * 0.2) * 0.12
        p.y += p.vy
        p.size *= 0.97

        const progress = p.life / p.maxLife
        if (progress >= 1 || p.size <= 0.2) {
          particles.splice(i, 1)
          continue
        }

        const alpha = p.startAlpha * (1 - progress)

        if (progress < 0.25) {
          ctx.fillStyle = `rgba(255, 250, 200, ${alpha})`
        } else if (progress < 0.65) {
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`
        } else {
          ctx.fillStyle = `rgba(220, 38, 38, ${alpha * 0.8})`
        }

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
      className={`pointer-events-none absolute z-10 overflow-visible select-none ${className || ''}`}
    />
  )
}
