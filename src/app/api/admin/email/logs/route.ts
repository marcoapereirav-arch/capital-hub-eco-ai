import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URL(req.url).searchParams
  const status = params.get("status")
  const template = params.get("template")
  const search = params.get("q")
  const limit = Math.min(500, Math.max(1, parseInt(params.get("limit") ?? "200", 10)))

  const admin = getAdminClient()
  let q = admin
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit)
  if (status) q = q.eq("status", status)
  if (template) q = q.eq("template", template)
  if (search) q = q.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%,to_name.ilike.%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stats por status
  const { data: stats } = await admin.rpc("email_logs_stats").maybeSingle().then(
    () => ({ data: null }),
    () => ({ data: null })
  )

  return NextResponse.json({ logs: data ?? [], stats })
}
