'use client'

import React from 'react'

/**
 * Splits text into individual character spans when the `font-kobold` class is applied,
 * giving each letter a staggered animation phase so that every letter moves, floats,
 * and undulates individually and smoothly.
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
          const delay = ((globalCharIndex++ * 0.32) % 3.6).toFixed(2)
          return (
            <span
              key={charIdx}
              className="kobold-letter"
              style={{
                animationDelay: `-${delay}s`,
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
