'use client'

import React from 'react'

export const AdminLogo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}
      >
        JD
      </div>
      <span
        style={{
          color: 'var(--theme-elevation-1000)',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        Jack Deng
      </span>
    </div>
  )
}

/**
 * The icon Payload puts in its breadcrumb home link (`.step-nav__home`), a
 * box of 18×18, 16×16 at 1024px and below. Payload's own icon is an <svg>
 * with `width/height: 100%` that fills that box, and so is this one: the old
 * fixed 28×28 tile overflowed it and the right half of "JD" was cut off.
 * The letters are SVG text in a 28-unit viewBox (the logo tile's size), so
 * they scale with the box; the gradient and rounded corners are CSS on the
 * <svg> itself, which needs no gradient id.
 */
export const AdminIcon: React.FC = () => {
  return (
    <svg
      viewBox="0 0 28 28"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{
        display: 'block',
        // 8px of 28 on the logo tile.
        borderRadius: '28%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      }}
    >
      <text x="14" y="14" dy="0.35em" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" letterSpacing="-0.26">
        JD
      </text>
    </svg>
  )
}
