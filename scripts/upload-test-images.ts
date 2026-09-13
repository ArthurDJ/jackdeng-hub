import { loadEnv, requireApply } from './lib/env'
import { getPayload } from 'payload'
import path from 'path'
import fs from 'fs'

loadEnv()
requireApply({ script: 'scripts/upload-test-images.ts', writes: ['media'] })

async function run() {
  console.log('Initializing payload...')
  const uri = process.env.DATABASE_URI
  console.log(`Using Database URI: ${uri ? uri.substring(0, 20) + '...' : 'MISSING'}`)
  
  const configPromise = (await import('../src/payload.config')).default
  
  const payload = await getPayload({ config: configPromise })

  const imagesDir = path.resolve(process.cwd(), 'public/test-images/batch-1')
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'))

  console.log(`Found ${files.length} images to upload.`)

  for (const file of files) {
    const filePath = path.join(imagesDir, file)
    console.log(`Uploading ${file}...`)
    
    try {
      await payload.create({
        collection: 'media',
        data: {
          alt: `Test Image ${file}`,
        },
        file: {
          data: fs.readFileSync(filePath),
          name: file,
          mimetype: 'image/jpeg',
          size: fs.statSync(filePath).size,
        },
      })
      console.log(`Successfully uploaded ${file}`)
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err)
    }
  }

  console.log('Batch upload complete!')
  process.exit(0)
}

run().catch(console.error)
