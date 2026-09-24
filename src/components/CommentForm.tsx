'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

type Props = {
  postId: number
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

export function CommentForm({ postId }: Props) {
  const t = useTranslations('blog')
  const tCommon = useTranslations('common')
  const [state, setState]     = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [content, setContent] = useState('')

  const turnstileRef    = useRef<HTMLDivElement>(null)
  const widgetIdRef     = useRef<string | null>(null)
  const turnstileToken  = useRef<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  // Mount Turnstile widget
  useEffect(() => {
    if (!siteKey || siteKey === 'dev') return

    const mountWidget = () => {
      if (!turnstileRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile!.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => { turnstileToken.current = token },
        'expired-callback': () => { turnstileToken.current = null },
        theme: 'auto',
      })
    }

    if (window.turnstile) {
      mountWidget()
    } else {
      window.onTurnstileLoad = mountWidget
      if (!document.querySelector('script[src*="turnstile"]')) {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  // The server answers with a code rather than a sentence, so the visitor's
  // language is chosen here instead of in the route.
  const messageForCode = (code: unknown): string => {
    switch (code) {
      case 'invalid_name':     return t('commentErrorName')
      case 'invalid_email':    return t('commentErrorEmail')
      case 'invalid_content':  return t('commentErrorContent')
      case 'turnstile_failed': return t('commentErrorSecurity')
      case 'rate_limited':     return t('commentErrorRateLimited')
      case 'unavailable':      return t('commentErrorUnavailable')
      default:                 return tCommon('errorSomething')
    }
  }

  // A Turnstile token is single-use, so a spent one has to be cleared on the
  // way out of *either* branch — otherwise a retry replays a token Cloudflare
  // has already rejected and the form can never recover.
  const resetChallenge = () => {
    turnstileToken.current = null
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const honeypot = (form.elements.namedItem('_trap') as HTMLInputElement)?.value

    try {
      // Catching an unsolved challenge here saves a round trip, but it is not
      // the check that matters: the token is verified inside the write, so a
      // caller that skips this form is challenged all the same. The old flow
      // asked /api/verify-turnstile first and then posted to /api/comments,
      // which meant skipping the first request skipped the challenge.
      if (siteKey && siteKey !== 'dev' && !turnstileToken.current) {
        throw new Error(t('commentErrorSecurity'))
      }

      const res = await fetch('/api/comments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: name.trim(),
          authorEmail: email.trim(),
          content: content.trim(),
          post: postId,
          honeypot,
          turnstileToken: turnstileToken.current ?? '',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(messageForCode(data?.error))
      }

      setState('success')
      setName('')
      setEmail('')
      setContent('')
      resetChallenge()
    } catch (err) {
      const msg = err instanceof Error ? err.message : tCommon('errorSomething')
      setState('error')
      setErrorMsg(msg)
      // The inline line below sits under a long form and is easy to scroll
      // past; the toast makes a failed submit impossible to miss.
      toast.error(msg)
      // Hand back a fresh challenge. Whatever went wrong, the token that went
      // with the request is spent, and retrying with it fails every time.
      resetChallenge()
    }
  }

  if (state === 'success') {
    return (
      <div
        className="p-6 text-center space-y-1"
        style={{
          borderRadius: 12,
          border: '1px solid color-mix(in srgb, var(--status-success) 24%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--status-success) 10%, transparent)',
        }}
      >
        <p style={{ fontWeight: 510, color: 'var(--status-success)' }}>{t('commentSubmitSuccess')}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('commentSubmitSuccessNote')}
        </p>
        <button
          onClick={() => setState('idle')}
          className="mt-3 text-xs underline underline-offset-2 hover:no-underline"
          style={{ color: 'var(--status-success)' }}
        >
          {t('commentLeaveAnother')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot — hidden from real users */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="_trap" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="comment-name" className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('commentNameLabel')} <span style={{ color: 'var(--status-error)' }}>*</span>
          </label>
          <input
            id="comment-name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('commentNamePlaceholder')}
            className="ds-input w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="comment-email" className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('commentEmailLabel')} <span style={{ color: 'var(--status-error)' }}>*</span>
            <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary)' }}>{tCommon('notDisplayed')}</span>
          </label>
          <input
            id="comment-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="ds-input w-full"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comment-content" className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {t('commentContentLabel')} <span style={{ color: 'var(--status-error)' }}>*</span>
          <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary)' }}>{tCommon('maxChars', { count: 500 })}</span>
        </label>
        <textarea
          id="comment-content"
          required
          minLength={2}
          maxLength={500}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('commentContentPlaceholder')}
          className="ds-input w-full resize-none"
        />
        <p className="text-right text-xs" style={{ color: 'var(--text-tertiary)' }}>{content.length} / 500</p>
      </div>

      {/* Turnstile widget */}
      {siteKey && siteKey !== 'dev' && (
        <div ref={turnstileRef} />
      )}

      {state === 'error' && (
        <p className="text-sm" style={{ color: 'var(--status-error)' }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="ds-accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent-solid)', color: '#fff', fontWeight: 590, border: '1px solid transparent' }}
      >
        {state === 'submitting' ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            {tCommon('submitting')}
          </>
        ) : (
          t('commentSubmitBtn')
        )}
      </button>
    </form>
  )
}
