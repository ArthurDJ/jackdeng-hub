import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
}

/**
 * Returns an array of page numbers (and '...' sentinels) to display.
 * Always shows first & last page; shows current ± 1; adds ellipsis for gaps.
 */
function getPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items: (number | '...')[] = [1]

  if (current > 3) items.push('...')

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    items.push(i)
  }

  if (current < total - 2) items.push('...')

  items.push(total)

  return items
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 400,
  textDecoration: 'none',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
}

const activeStyle: React.CSSProperties = {
  ...base,
  fontWeight: 510,
  border: '1px solid var(--accent-primary)',
  background: 'var(--accent-primary)',
  color: '#ffffff',
}

const disabledStyle: React.CSSProperties = {
  ...base,
  opacity: 0.35,
  cursor: 'default',
  pointerEvents: 'none',
}

export async function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'blog' })

  const pageItems = getPageItems(page, totalPages)

  // Build href — page 1 uses clean basePath (no ?page=1)
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 40,
        paddingTop: 24,
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {/* ← Previous */}
      {page <= 1 ? (
        <span style={disabledStyle}>{t('pagination.previous')}</span>
      ) : (
        <Link href={href(page - 1)} style={base}>
          {t('pagination.previous')}
        </Link>
      )}

      {/* Page numbers */}
      {pageItems.map((item, i) =>
        item === '...' ? (
          <span
            key={`ellipsis-${i}`}
            style={{ ...base, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', padding: '0 4px' }}
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            style={item === page ? activeStyle : base}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Link>
        )
      )}

      {/* Next → */}
      {page >= totalPages ? (
        <span style={disabledStyle}>{t('pagination.next')}</span>
      ) : (
        <Link href={href(page + 1)} style={base}>
          {t('pagination.next')}
        </Link>
      )}
    </nav>
  )
}
