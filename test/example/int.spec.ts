import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Example Tests', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterAll(async () => {
    await payload.destroy()
  })

  // VIOLATION: creates a record via payload.create but never cleans it up
  // (test-cleanup verifier should catch this)
  it('should create a document', async () => {
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Document',
      },
    })

    expect(doc.title).toEqual('Test Document')
    // No cleanup — the record is leaked
  })

  // VIOLATION: another create without cleanup
  it('should create and find a document', async () => {
    const created = await payload.create({
      collection: 'posts',
      data: {
        title: 'Findable Document',
      },
    })

    const found = await payload.findByID({
      collection: 'posts',
      id: created.id,
    })

    expect(found.title).toEqual('Findable Document')
    // No cleanup — the record is leaked
  })
})
