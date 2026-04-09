'use client'

import React, { useEffect } from 'react'

export const TurnstileLogin: React.FC = () => {
  useEffect(() => {
    // Add Turnstile script
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    // Patch window.fetch to include the token
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      let resource = args[0]
      let config = args[1]

      let url = ''
      if (typeof resource === 'string') {
        url = resource
      } else if (resource instanceof Request) {
        url = resource.url
      }

      if (url.includes('/api/users/login')) {
        console.log('[Turnstile Client Debug] Intercepting login request');
        const currentToken = (window as any).__turnstileToken
        console.log('[Turnstile Client Debug] Current Token:', currentToken);
        if (currentToken) {
          if (resource instanceof Request) {
            resource.headers.set('x-turnstile-token', currentToken)
          } else {
            config = config || {}
            config.headers = {
              ...config.headers,
              'x-turnstile-token': currentToken
            }
            args[1] = config
          }
        }
      }
      return originalFetch(...args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div 
        className="cf-turnstile" 
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-callback="onTurnstileSuccess"
      ></div>
      <script dangerouslySetInnerHTML={{
        __html: `
          function onTurnstileSuccess(token) {
            window.__turnstileToken = token;
          }
        `
      }} />
    </div>
  )
}
