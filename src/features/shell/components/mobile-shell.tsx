import { MobileHeader } from "./mobile-header"
import { MobileBottomNav } from "./mobile-bottom-nav"

interface MobileShellProps {
  userEmail: string
  userName: string | null
  userRole: string | null
  children: React.ReactNode
}

/**
 * Wrapper movil del OS. Solo se monta a <md.
 * Estructura:
 *   - MobileHeader sticky top (56px + safe-area-top)
 *   - <main> scrolleable con padding-bottom para no chocar con la bottom nav
 *   - MobileBottomNav fija (56px + safe-area-bottom)
 */
export function MobileShell({
  userEmail,
  userName,
  userRole,
  children,
}: MobileShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background md:hidden">
      <MobileHeader userEmail={userEmail} userName={userName} />
      <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileBottomNav
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
      />
    </div>
  )
}
