import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId, deviceInfo, oldEndpoint } = await request.json()

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Cambio de suscripcion: eliminar la anterior
    if (oldEndpoint) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', oldEndpoint)
    }

    // Check si ya existe
    const { data: existing } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', existing.id)

      return NextResponse.json({ success: true, subscription_id: existing.id })
    }

    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .insert({
        user_id: userId || null,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        browser: deviceInfo?.platform,
        user_agent: deviceInfo?.userAgent || '',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, subscription_id: data.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json()
    const supabaseAdmin = getAdminClient()

    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
