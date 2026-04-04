import { RootLayout } from '@payloadcms/next/layouts'
import config from '../../payload.config'
import './custom.css'

export default ({ children }: { children: React.ReactNode }) => (
  <RootLayout config={config}>{children}</RootLayout>
)
