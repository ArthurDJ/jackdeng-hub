import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
}

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

export async function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'blog' })
  const pageItems = getPageItems(page, totalPages)
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center flex-wrap gap-1 mt-10 pt-6 border-t border-subtle"
    >
      {/* ← Previous */}
      {page <= 1 ? (
        <span className="ds-pagination-item disabled">{t('pagination.previous')}</span>
      ) : (
        <Link href={href(page - 1)} className="ds-pagination-item">
          {t('pagination.previous')}
        </Link>
      )}

      {/* Page numbers */}
      {pageItems.map((item, i) =>
        item === '...' ? (
          <span key={`ellipsis-${i}`} className="ds-pagination-item border-none bg-transparent text-ds-tertiary px-1">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`ds-pagination-item ${item === page ? 'active' : ''}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Link>
        )
      )}

      {/* Next → */}
      {page >= totalPages ? (
        <span className="ds-pagination-item disabled">{t('pagination.next')}</span>
      ) : (
        <Link href={href(page + 1)} className="ds-pagination-item">
          {t('pagination.next')}
        </Link>
      )}
    </nav>
  )
}
