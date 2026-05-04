export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="pointer-events-none fixed left-4 top-4 pl-safe pt-safe text-[10px] uppercase tracking-[0.3em] text-foreground md:left-8 md:top-8 md:text-xs md:tracking-[0.45em]">
        Capital Hub
      </div>
      {children}
    </div>
  )
}
