import type { Payload, PayloadRequest } from 'payload'

/**
 * Example endpoint that demonstrates a few patterns.
 * This is a demo endpoint for the Tessl harness reference.
 */

// VIOLATION: positional params instead of object params (object-params verifier)
export async function getDocumentsByCollection(
  payload: Payload,
  collectionSlug: string,
  limit: number,
  req: PayloadRequest,
) {
  // VIOLATION: missing overrideAccess: false and user (access-control verifier)
  const docs = await payload.find({
    collection: collectionSlug,
    limit,
  })

  return docs
}

// VIOLATION: positional params
export async function updateDocumentTitle(
  payload: Payload,
  collectionSlug: string,
  id: string,
  title: string,
) {
  // VIOLATION: missing overrideAccess: false and user
  const updated = await payload.update({
    collection: collectionSlug,
    id,
    data: { title },
  })

  return updated
}

// This one is correct — object params, access control present
export async function deleteDocument({
  payload,
  collectionSlug,
  id,
  user,
}: {
  payload: Payload
  collectionSlug: string
  id: string
  user: PayloadRequest['user']
}) {
  const result = await payload.delete({
    collection: collectionSlug,
    id,
    overrideAccess: false,
    user,
  })

  return result
}
