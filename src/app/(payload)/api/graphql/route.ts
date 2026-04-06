import { GRAPHQL_PLAYGROUND_GET, GRAPHQL_POST } from '@payloadcms/next/routes'
import config from '../../../../payload.config'

// GET  /api/graphql  → serves the GraphQL Playground UI
export const GET = GRAPHQL_PLAYGROUND_GET(config)

// POST /api/graphql  → executes GraphQL queries / mutations
export const POST = GRAPHQL_POST(config)
