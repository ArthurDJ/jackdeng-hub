'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'

export const GoogleLoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/admin' })
    setLoading(false)
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
          color: loading ? '#888' : '#e8e8e8',
          fontSize: '14px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'background 0.15s, border-color 0.15s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)'
        }}
        onMouseLeave={e => {
          if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'
        }}
      >
        {loading ? (
          <span style={{ width: 18, height: 18, border: '2px solid #555', borderTopColor: '#aaa', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.705a5.41 5.41 0 01-.282-1.705c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.963l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        {loading ? 'Signing in…' : 'Sign in with Google'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ color: '#666', fontSize: '12px', letterSpacing: '0.08em', userSelect: 'none' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  )
}
