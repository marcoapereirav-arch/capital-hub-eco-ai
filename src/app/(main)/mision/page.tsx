import { notFound } from "next/navigation"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { createClient } from "@/lib/supabase/server"
import { loadMisionInitialData } from "@/features/mision/services/mision-server"
import { MisionPage } from "@/features/mision/components/mision-page"
import type { MisionAssignee } from "@/features/mision/types/mision"

export const dynamic = "force-dynamic"

const ASSIGNEE_BY_EMAIL: Record<string, MisionAssignee> = {
  "adrianvillanuevarios@gmail.com": "adrian",
}

export default async function MisionRoutePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") notFound()

  const email = (user.email ?? "").toLowerCase()
  const currentAssignee = ASSIGNEE_BY_EMAIL[email] ?? null
  const currentName = profile?.full_name ?? email.split("@")[0]

  const { phases, tasks } = await loadMisionInitialData()

  return (
    <>
      <ShellHeader title="Misión" />
      <MisionPage
        initialPhases={phases}
        initialTasks={tasks}
        currentAssignee={currentAssignee}
        currentName={currentName}
      />
    </>
  )
}
