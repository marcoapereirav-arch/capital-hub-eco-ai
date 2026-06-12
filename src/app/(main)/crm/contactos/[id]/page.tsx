import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContactDetail } from "@/features/contactos/components/contact-detail"

export const dynamic = "force-dynamic"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error || !contact) notFound()

  return <ContactDetail contact={contact} />
}
