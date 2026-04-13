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

export const AdminIcon: React.FC = () => {
  return (
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
      }}
    >
      JD
    </div>
  )
}
