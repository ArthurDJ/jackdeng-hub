import { CONTACT_EMAIL, PROFILE_LINKS, SITE_HOST, printableUrl } from '@/lib/profile'

/**
 * The contact line a printed résumé needs and the screen does not show: on
 * paper, the Email / GitHub / LinkedIn buttons are shapes with no address
 * behind them. Hidden on screen, shown only when printing.
 */
export function PrintContact() {
  const items = [
    CONTACT_EMAIL,
    ...PROFILE_LINKS.filter((l) => l.href.startsWith('https://')).map((l) => printableUrl(l.href)),
    SITE_HOST,
  ]
  return (
    <p className="hidden print:block" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
      {items.join('  ·  ')}
    </p>
  )
}
