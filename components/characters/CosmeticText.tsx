'use client'

import React from 'react'

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Splits text into individual character spans when the `font-kobold` class is applied,
 * giving each letter a unique random offset, duration, and trajectory so that every
 * letter moves and floats individually and independently.
 */
export function renderCosmeticLetters(
  text: string | null | undefined,
  className?: string
): React.ReactNode {
  if (!text) return null
  if (!className?.includes('font-kobold')) {
    return text
  }

  let globalCharIndex = 0
  const words = text.split(' ')

  return words.map((word, wordIdx) => {
    return (
      <span key={wordIdx} className="inline-block whitespace-nowrap">
        {Array.from(word).map((char, charIdx) => {
          const idx = globalCharIndex++
          const r1 = seededRandom(idx * 13 + 1)
          const r2 = seededRandom(idx * 17 + 5)
          const r3 = seededRandom(idx * 23 + 9)
          const r4 = seededRandom(idx * 29 + 13)

          // Subtle individual random timing & trajectory per letter
          const delay = (r1 * 5.0).toFixed(2)
          const duration = (3.2 + r2 * 2.2).toFixed(2) // 3.2s to 5.4s (gentle, relaxed float)
          const xAmp = ((r3 - 0.5) * 1.2).toFixed(1) // -0.6px to +0.6px
          const yAmp = (0.7 + r4 * 0.9).toFixed(1) // 0.7px to 1.6px
          const rotAmp = (0.6 + r1 * 1.0).toFixed(1) // 0.6deg to 1.6deg

          return (
            <span
              key={charIdx}
              className="kobold-letter"
              style={{
                animationDelay: `-${delay}s`,
                animationDuration: `${duration}s`,
                ['--x-amp' as any]: `${xAmp}px`,
                ['--y-amp' as any]: `${yAmp}px`,
                ['--rot-amp' as any]: `${rotAmp}deg`,
              }}
            >
              {char}
            </span>
          )
        })}
        {wordIdx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
      </span>
    )
  })
}

export default function CosmeticText({
  text,
  className,
  style,
  children,
}: {
  text?: string | null
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const content = text ?? (typeof children === 'string' ? children : null)

  if (!content) {
    return <span className={className} style={style}>{children}</span>
  }

  return (
    <span className={className} style={style}>
      {renderCosmeticLetters(content, className)}
    </span>
  )
}
