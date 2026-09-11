'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

export interface ConfirmDialogProps {
  open: boolean
  /** Called with true on confirm, false on cancel / Esc / backdrop click. */
  onClose: (confirmed: boolean) => void
  title: string
  /** One line on what will happen. Keep it to the consequence, not reassurance. */
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` paints the confirm button with --status-error. */
  variant?: 'default' | 'danger'
  /**
   * When set, the confirm button stays disabled until the user types this
   * string exactly — the pattern Basedash / Okta / Calendly / Medium all use
   * for irreversible actions. Reserve it for genuinely destructive ones.
   */
  confirmPhrase?: string
  /** Keeps the dialog open and shows a pending state (e.g. while a tool runs). */
  busy?: boolean
}

/**
 * Confirmation dialog built on the native <dialog> element.
 *
 * The platform gives us the hard parts for free: focus trapping, Esc to
 * dismiss, ::backdrop, and top-layer stacking (so it can never lose a z-index
 * fight with the sticky Navbar or CommandPalette). Everything visual comes from
 * the design tokens in globals.css — see DESIGN.md: elevation is a background
 * step plus a barely-there border, never a box-shadow.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  confirmPhrase,
  busy = false,
}: ConfirmDialogProps) {
  const t = useTranslations('common')
  const ref = useRef<HTMLDialogElement>(null)
  const [typed, setTyped] = useState('')
  const titleId = useId()
  const descId = useId()

  const close = useCallback(
    (confirmed: boolean) => {
      if (busy) return
      onClose(confirmed)
    },
    [busy, onClose],
  )

  // Drive the native dialog from the `open` prop. showModal() is what puts the
  // element in the top layer and enables ::backdrop — `open` as an attribute
  // would render it inline and non-modal instead.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      setTyped('')
      el.showModal()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  // Esc fires `cancel` natively; route it through our own handler so the
  // caller always learns the dialog went away.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      close(false)
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [close])

  const phraseSatisfied = !confirmPhrase || typed === confirmPhrase
  const confirmDisabled = busy || !phraseSatisfied
  const confirmColor = variant === 'danger' ? 'var(--status-error)' : 'var(--accent-primary)'

  return (
    <dialog
      ref={ref}
      className="ds-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      // Clicking the backdrop lands on the <dialog> itself, never on its
      // content — so an exact-target check is a reliable outside-click test.
      onClick={(e) => {
        if (e.target === ref.current) close(false)
      }}
    >
      <div className="ds-dialog-panel">
        <h2
          id={titleId}
          style={{
            fontSize: 17,
            fontWeight: 590,
            letterSpacing: '-0.18px',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            id={descId}
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              margin: '10px 0 0',
            }}
          >
            {description}
          </p>
        )}

        {confirmPhrase && (
          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {t('typeToConfirm', { phrase: confirmPhrase })}
            </span>
            <input
              className="ds-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              style={{ marginTop: 6, width: '100%' }}
            />
          </label>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            className="ds-ghost-btn"
            onClick={() => close(false)}
            disabled={busy}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 510,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            disabled={confirmDisabled}
            autoFocus={!confirmPhrase}
            className="ds-dialog-confirm"
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 590,
              color: '#fff',
              background: confirmColor,
              border: '1px solid transparent',
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
              opacity: confirmDisabled ? 0.45 : 1,
            }}
          >
            {busy ? t('loading') : confirmLabel ?? t('submit')}
          </button>
        </div>
      </div>
    </dialog>
  )
}

/**
 * Promise-based wrapper for one-off call sites, so a click handler can read as
 *   if (await confirm({ title: … })) { … }
 * instead of threading open/onClose state through the component by hand.
 */
export function useConfirm() {
  const [state, setState] = useState<
    (Omit<ConfirmDialogProps, 'open' | 'onClose'> & { resolve: (v: boolean) => void }) | null
  >(null)

  const confirm = useCallback(
    (opts: Omit<ConfirmDialogProps, 'open' | 'onClose'>) =>
      new Promise<boolean>((resolve) => setState({ ...opts, resolve })),
    [],
  )

  const dialog = (
    <ConfirmDialog
      {...(state ?? { title: '' })}
      open={state !== null}
      onClose={(confirmed) => {
        state?.resolve(confirmed)
        setState(null)
      }}
    />
  )

  return { confirm, dialog }
}
