import { PayloadAPI } from '@payloadcms/next/api'
import { config } from '../../../payload.config'

export const GET = PayloadAPI(config)
export const POST = PayloadAPI(config)
export const PATCH = PayloadAPI(config)
export const DELETE = PayloadAPI(config)
export const PUT = PayloadAPI(config)
