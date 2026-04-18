export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed left-8 top-8 text-xs uppercase tracking-[0.45em] text-foreground">
        Capital Hub
      </div>
      {children}
    </div>
  )
}
