import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Footer } from '@/components/Footer'
import { routing } from '@/i18n/routing'
import { profileOgImage } from '@/lib/profile'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CommandPalette } from '@/components/CommandPalette'
import { Toaster } from '@/components/Toaster'
import '../globals.css'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

// Tell Next which locales exist. Without this, every page under [locale] that
// did not list its own params (home, the projects and tools lists, a tool's
// page) was rendered on every request despite `revalidate = 3600` — the home
// page, the most visited one, missed the cache every time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    default: 'Jack Deng',
    template: '%s — Jack Deng',
  },
  description: 'Jack Deng — full-stack engineer focused on backend and data. Data platforms, integrations and internal tools.',
  metadataBase: new URL(BASE),
  openGraph: {
    siteName: 'Jack Deng',
    // The fallback card for pages without their own; the home page and /about
    // set a localized one.
    images: [{ url: profileOgImage(BASE, 'Full-Stack Engineer · Backend & Data'), width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [profileOgImage(BASE, 'Full-Stack Engineer · Backend & Data')],
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

  // Seed next-intl's request locale from the route segment. Without this,
  // getMessages() resolves the locale by reading request headers, which is a
  // dynamic API — and this layout wraps the blog detail page, the one route
  // the build renders statically. The result was DYNAMIC_SERVER_USAGE on every
  // post. Layouts render before pages, so this has to happen here.
  setRequestLocale(locale)

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
            {/* Keyboard-only escape hatch past the nav — visible on focus */}
            <a href="#main" className="ds-skip-link">
              {messages.common.skipToContent as string}
            </a>
            {children}
            <Footer />
            <CommandPalette />
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
