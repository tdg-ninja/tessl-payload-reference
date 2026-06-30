import type { Payload, PayloadRequest } from 'payload'

export async function getDocumentCount({
  collectionSlug,
  payload,
  user,
}: {
  collectionSlug: string
  payload: Payload
  user: PayloadRequest['user']
}) {
  return payload.count({
    collection: collectionSlug,
    overrideAccess: false,
    user,
  })
}
