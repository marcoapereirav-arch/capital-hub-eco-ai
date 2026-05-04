'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishMedia } from './services/meta-graph'

export async function createScheduledPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const scheduledFor = formData.get('scheduled_for')
  const caption = formData.get('caption')
  const mediaType = formData.get('media_type') ?? 'reel'
  const mediaUrl = formData.get('media_url')
  const thumbnailUrl = formData.get('thumbnail_url')
  const status = formData.get('status') ?? 'draft'

  if (typeof scheduledFor !== 'string' || !scheduledFor) {
    return { error: 'scheduled_for required' }
  }

  const validMediaTypes = ['reel', 'image', 'carousel', 'story']
  const validStatus = ['draft', 'scheduled']
  const mt = String(mediaType)
  const st = String(status)
  if (!validMediaTypes.includes(mt)) return { error: 'invalid media_type' }
  if (!validStatus.includes(st)) return { error: 'invalid status' }

  const { error } = await supabase.from('ig_scheduled_posts').insert({
    user_id: user.id,
    scheduled_for: scheduledFor,
    status: st,
    media_type: mt,
    caption: typeof caption === 'string' ? caption : null,
    media_url: typeof mediaUrl === 'string' && mediaUrl ? mediaUrl : null,
    thumbnail_url: typeof thumbnailUrl === 'string' && thumbnailUrl ? thumbnailUrl : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/instagram')
  return { success: true }
}

export async function updateScheduledPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) return { error: 'id required' }

  const updates: Record<string, unknown> = {}
  const scheduledFor = formData.get('scheduled_for')
  const caption = formData.get('caption')
  const mediaType = formData.get('media_type')
  const mediaUrl = formData.get('media_url')
  const status = formData.get('status')

  if (typeof scheduledFor === 'string' && scheduledFor) updates.scheduled_for = scheduledFor
  if (typeof caption === 'string') updates.caption = caption
  if (typeof mediaType === 'string') updates.media_type = mediaType
  if (typeof mediaUrl === 'string') updates.media_url = mediaUrl || null
  if (typeof status === 'string') updates.status = status

  const { error } = await supabase
    .from('ig_scheduled_posts')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/instagram')
  return { success: true }
}

export async function deleteScheduledPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) return { error: 'id required' }

  const { error } = await supabase
    .from('ig_scheduled_posts')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/instagram')
  return { success: true }
}

export async function publishScheduledPostNow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) return { error: 'id required' }

  const { data: post } = await supabase
    .from('ig_scheduled_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!post) return { error: 'post not found' }
  if (!post.media_url) return { error: 'media_url is required to publish' }

  const admin = createAdminClient()
  await admin
    .from('ig_scheduled_posts')
    .update({ status: 'publishing', publish_error: null })
    .eq('id', id)

  const mediaTypeMap: Record<string, 'REELS' | 'IMAGE' | 'STORIES'> = {
    reel: 'REELS',
    image: 'IMAGE',
    carousel: 'IMAGE',
    story: 'STORIES',
  }
  const igMediaType = mediaTypeMap[post.media_type] ?? 'REELS'

  const result = await publishMedia({
    mediaUrl: post.media_url,
    caption: post.caption ?? undefined,
    mediaType: igMediaType,
  })

  if (!result.ok) {
    await admin
      .from('ig_scheduled_posts')
      .update({ status: 'failed', publish_error: result.error ?? 'unknown' })
      .eq('id', id)
    revalidatePath('/instagram')
    return { error: result.error ?? 'publish failed' }
  }

  await admin
    .from('ig_scheduled_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      ig_media_id: result.mediaId ?? null,
      publish_error: null,
    })
    .eq('id', id)

  revalidatePath('/instagram')
  return { success: true, mediaId: result.mediaId }
}
