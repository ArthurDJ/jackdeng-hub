'use client'

import React, { useEffect, useRef } from 'react'

export const TurnstileLogin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    // Define the success callback globally so Turnstile can find it if needed,
    // though we'll use the explicit render callback.
    ;(window as any).onTurnstileSuccess = (token: string) => {
      console.log('[Turnstile] Token generated')
      
      // Find the Payload login form. 
      // Payload 3.0 login forms usually have a specific structure.
      // We look for a form that contains an input with name="email" or "password"
      const forms = document.querySelectorAll('form')
      let loginForm: HTMLFormElement | null = null
      
      for (const form of Array.from(forms)) {
        if (form.querySelector('input[name="email"]') || form.querySelector('input[name="password"]')) {
          loginForm = form
          break
        }
      }

      if (loginForm) {
        console.log('[Turnstile] Found login form, injecting hidden input')
        // Check if input already exists
        let input = loginForm.querySelector('input[name="turnstileToken"]') as HTMLInputElement
        if (!input) {
          input = document.createElement('input')
          input.type = 'hidden'
          input.name = 'turnstileToken'
          loginForm.appendChild(input)
        }
        input.value = token
        
        // Payload 3.0 uses client-side state for form submission. 
        // We need to trigger an input event so the state updates if they are watching it,
        // although standard form submission might still pick up the hidden input.
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } else {
        console.warn('[Turnstile] Login form not found in DOM')
        // Fallback: attach to window for any other scripts
        ;(window as any).__turnstileToken = token
      }
    }

    const loadTurnstile = () => {
      if (!(window as any).turnstile) {
        if (!document.getElementById('cf-turnstile-script')) {
          const script = document.createElement('script')
          script.id = 'cf-turnstile-script'
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
          script.async = true
          script.defer = true
          document.head.appendChild(script)
          
          script.onload = () => {
            renderWidget()
          }
        }
      } else {
        renderWidget()
      }
    }

    const renderWidget = () => {
      if (containerRef.current && (window as any).turnstile && !widgetIdRef.current) {
        try {
          widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (window as any).onTurnstileSuccess,
            theme: 'light',
          })
          console.log('[Turnstile] Widget rendered successfully')
        } catch (err) {
          console.error('[Turnstile] Render error:', err)
        }
      }
    }

    loadTurnstile()

    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        // (window as any).turnstile.remove(widgetIdRef.current)
        // widgetIdRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef}></div>
    </div>
  )
}
