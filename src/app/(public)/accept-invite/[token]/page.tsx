import { AcceptInvitePage } from "@/features/team/components/accept-invite-page"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Acepta tu invitación — Capital Hub OS",
  robots: { index: false, follow: false },
}

export default async function AcceptInviteRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <AcceptInvitePage token={token} />
}
