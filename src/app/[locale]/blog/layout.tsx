import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function BlogLayout({ children }: Props) {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
