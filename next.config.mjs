import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['playing-sydney-fingers-wireless.trycloudflare.com'],
}

export default withPayload(withNextIntl(nextConfig))
