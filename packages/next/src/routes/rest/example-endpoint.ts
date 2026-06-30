import type { Payload, PayloadRequest } from 'payload'

/**
 * Retrieve documents from a collection with access control enforced
 * for the requesting user.
 */
export async function getDocumentsByCollection({
  payload,
  collectionSlug,
  limit,
  user,
}: {
  payload: Payload
  collectionSlug: string
  limit: number
  user: PayloadRequest['user']
}) {
  const docs = await payload.find({
    collection: collectionSlug,
    limit,
    overrideAccess: false,
    user,
  })

  return docs
}

/**
 * Update the title of a single document, scoped to what the requesting
 * user is allowed to modify.
 */
export async function updateDocumentTitle({
  payload,
  collectionSlug,
  id,
  title,
  user,
}: {
  payload: Payload
  collectionSlug: string
  id: string
  title: string
  user: PayloadRequest['user']
}) {
  const updated = await payload.update({
    collection: collectionSlug,
    id,
    data: { title },
    overrideAccess: false,
    user,
  })

  return updated
}

/**
 * Delete a document by ID, respecting the requesting user's access control.
 */
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
