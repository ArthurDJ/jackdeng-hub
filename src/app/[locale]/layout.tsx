import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Footer } from '@/components/Footer'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CommandPalette } from '@/components/CommandPalette'
import '../globals.css'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export const metadata: Metadata = {
  title: {
    default: 'Jack Deng',
    template: '%s — Jack Deng',
  },
  description: 'Senior Database & Integration Administrator. NetSuite · Boomi · Supabase · Next.js.',
  metadataBase: new URL(BASE),
  openGraph: {
    siteName: 'Jack Deng',
    images: [{ url: `${BASE}/og?title=Jack+Deng`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${BASE}/og?title=Jack+Deng`],
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as 'en' | 'zh')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Jack Deng's Blog (EN)"
          href="/feed.xml?locale=en"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Jack Deng 的博客 (中文)"
          href="/feed.xml?locale=zh"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <Footer />
            <CommandPalette />
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
