import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

interface FooterProps {
  className?: string
}

export async function Footer({ className }: FooterProps) {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'common' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  return (
    <footer 
      className={`border-t border-subtle py-12 ${className ?? ''}`}
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div className="ds-container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Left: Brand & Copyright */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-ds-primary font-semibold tracking-tight ds-logo no-underline">
              Jack Deng
            </Link>
            <p className="text-body-sm text-ds-tertiary">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
          </div>

          {/* Right: Quick Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            <Link href="/blog" className="text-body-sm text-ds-secondary ds-link-hover no-underline">
              {tNav('blog')}
            </Link>
            <Link href="/about" className="text-body-sm text-ds-secondary ds-link-hover no-underline">
              {tNav('about')}
            </Link>
            <a 
              href="https://github.com/ArthurDJ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-body-sm text-ds-secondary ds-link-hover no-underline"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
