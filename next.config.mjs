import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['playing-sydney-fingers-wireless.trycloudflare.com'],
}

export default withPayload(nextConfig)
