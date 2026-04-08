import { getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/Navbar'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function BlogLayout({ children, params }: Props) {
  const { locale } = await params
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>{children}</div>
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between"
          style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          <span>{tCommon('copyright', { year: new Date().getFullYear() })}</span>
          <span>{tFooter('builtWith')}</span>
        </div>
      </footer>
    </div>
  )
}
