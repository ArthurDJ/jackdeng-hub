'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation, useTheme, useLocale } from '@payloadcms/ui'
import Link from 'next/link'

/**
 * Admin header settings panel.
 *
 * The native Payload "语言" selector (renamed from "Locale" via translation override)
 * already handles content locale switching.  This component auto-syncs the admin
 * UI language to match, so one click does both.  The gear only contains
 * secondary settings (theme, account, view site).
 */
export const AdminHeaderSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { i18n, switchLanguage } = useTranslation()
  const { theme, setTheme } = useTheme()
  const locale = useLocale()

  const currentLang = i18n.language ?? 'zh'
  const isZh = currentLang === 'zh'

  // Auto-sync admin UI language with content locale so one control does both.
  // Uses Payload's switchLanguage (sets cookie + router.refresh) instead of
  // i18next's changeLanguage (which doesn't exist on Payload's i18n object).
  useEffect(() => {
    const localeCode = locale?.code
    if (!localeCode) return
    const target = localeCode === 'zh' ? 'zh' : 'en'
    if (i18n.language !== target && switchLanguage) {
      void switchLanguage(target)
    }
  }, [locale?.code, i18n.language])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isZh ? '设置' : 'Settings'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--theme-elevation-500)',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-elevation-800)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-elevation-500)')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            minWidth: '200px',
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '8px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Theme */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--theme-elevation-800)', fontSize: '14px', borderRadius: '4px', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              <span>{isZh ? '主题' : 'Theme'}</span>
            </div>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
              {theme === 'dark' ? (isZh ? '深色' : 'Dark') : (isZh ? '浅色' : 'Light')}
            </span>
          </button>

          <div style={{ height: '1px', background: 'var(--theme-elevation-100)', margin: '4px 0' }} />

          {/* Account */}
          <Link
            href="/admin/account"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 12px',
              color: 'var(--theme-elevation-800)', fontSize: '14px', borderRadius: '4px', textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => setIsOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{isZh ? '账户设置' : 'Account'}</span>
          </Link>

          {/* View Site */}
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 12px',
              color: 'var(--theme-elevation-800)', fontSize: '14px', borderRadius: '4px', textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-elevation-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>{isZh ? '访问前台' : 'View Site'}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
