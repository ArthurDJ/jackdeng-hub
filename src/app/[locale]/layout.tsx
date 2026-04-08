import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CommandPalette } from '@/components/CommandPalette'
import '../globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Jack Deng',
    template: '%s — Jack Deng',
  },
  description: 'Senior Database & Integration Administrator. NetSuite · Boomi · Supabase · Next.js.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'),
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
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <CommandPalette />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
