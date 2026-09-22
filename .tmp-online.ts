import { loadEnv, requireApply } from './scripts/lib/env'
loadEnv()
requireApply({ script: 'publish falling-sand', writes: ['tools'] })
const run = async () => {
  const { getPayload } = await import('payload')
  const { config } = await import('./src/payload.config')
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'tools', where: { slug: { equals: 'falling-sand' } }, limit: 1 })
  const d: any = await payload.update({ collection: 'tools', id: (docs[0] as any).id, data: { status: 'online' } })
  console.log(`  ${d.slug} -> ${d.status}`)
  process.exit(0)
}
run()
