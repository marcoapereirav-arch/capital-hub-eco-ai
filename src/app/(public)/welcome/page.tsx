import { WelcomePage } from "@/features/welcome/components/welcome-page"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Bienvenido — Capital Hub OS",
  robots: { index: false, follow: false },
}

export default function WelcomeRoute() {
  return <WelcomePage />
}
