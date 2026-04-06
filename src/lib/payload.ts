/**
 * Server-only helper to obtain a Payload instance.
 *
 * Uses the singleton pattern so that in `next dev` the instance is reused
 * across hot-reloads instead of spawning a new connection on every request.
 */
import 'server-only'
import { getPayload as _getPayload } from 'payload'
import config from '../payload.config'

export const getPayload = async () => _getPayload({ config })
