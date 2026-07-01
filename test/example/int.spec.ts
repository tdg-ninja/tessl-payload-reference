import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Example Tests', () => {
  const createdIDs: (string | number)[] = []

  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload } = initialized)
  })

  afterEach(async () => {
    for (const id of createdIDs) {
      await payload.delete({ collection: 'posts', id })
    }
    createdIDs.length = 0
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should create a document', async () => {
    const doc = await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Document',
      },
    })

    createdIDs.push(doc.id)

    expect(doc.title).toEqual('Test Document')
  })

  it('should create and find a document', async () => {
    const created = await payload.create({
      collection: 'posts',
      data: {
        title: 'Findable Document',
      },
    })

    createdIDs.push(created.id)

    const found = await payload.findByID({
      collection: 'posts',
      id: created.id,
    })

    expect(found.title).toEqual('Findable Document')
  })
})
