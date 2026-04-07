'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  postId: string
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const honeypot = (form.elements.namedItem('_trap') as HTMLInputElement)?.value

    try {
      // 1. Verify Turnstile (skip in dev)
      if (siteKey && siteKey !== 'dev') {
        if (!turnstileToken.current) {
          throw new Error('Please complete the security check.')
        }
        const verifyRes = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken.current }),
        })
        if (!verifyRes.ok) throw new Error('Security check failed. Please try again.')
      }

      // 2. Submit to Payload
      const res = await fetch('/api/comments', {
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
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? 'Submission failed. Please try again.')
      }

      setState('success')
      setName('')
      setEmail('')
      setContent('')
      turnstileToken.current = null
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center space-y-1">
        <p className="font-medium text-emerald-700 dark:text-emerald-400">Comment submitted!</p>
        <p className="text-sm text-emerald-600 dark:text-emerald-500">
          It will appear after review. Thanks for reading.
        </p>
        <button
          onClick={() => setState('idle')}
          className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:no-underline"
        >
          Leave another comment
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
          <label htmlFor="comment-name" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="comment-name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="comment-email" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Email <span className="text-red-400">*</span>
            <span className="ml-1 font-normal text-zinc-400">(not displayed)</span>
          </label>
          <input
            id="comment-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comment-content" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Comment <span className="text-red-400">*</span>
          <span className="ml-1 font-normal text-zinc-400">(max 500 chars)</span>
        </label>
        <textarea
          id="comment-content"
          required
          minLength={2}
          maxLength={500}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 resize-none"
        />
        <p className="text-right text-xs text-zinc-400">{content.length} / 500</p>
      </div>

      {/* Turnstile widget */}
      {siteKey && siteKey !== 'dev' && (
        <div ref={turnstileRef} />
      )}

      {state === 'error' && (
        <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Submitting…
          </>
        ) : (
          'Post comment'
        )}
      </button>
    </form>
  )
}
