import config from '../../../../payload.config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'

export const generateMetadata = generatePageMetadata

const Page = ({ params, searchParams }: { params: any; searchParams: any }) => (
  <RootPage config={config} params={params} searchParams={searchParams} />
)

export default Page
