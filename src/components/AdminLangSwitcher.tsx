'use client'

import React from 'react'
import { useTranslation } from '@payloadcms/ui'

export const AdminLangSwitcher: React.FC = () => {
  const { i18n } = useTranslation()
  const current = i18n.language ?? 'zh'
  const isZh = current === 'zh'

  const toggle = () => {
    i18n.changeLanguage(isZh ? 'en' : 'zh')
  }

  return (
    <div style={{ padding: '8px 16px' }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '12px',
          width: '100%',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
        }}
      >
        {/* Globe icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span style={{ flex: 1, textAlign: 'left' }}>
          界面语言
        </span>
        <span style={{
          background: 'rgba(59,130,246,0.15)',
          color: '#60a5fa',
          borderRadius: '4px',
          padding: '1px 6px',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {isZh ? '中文' : 'EN'}
        </span>
      </button>
    </div>
  )
}
