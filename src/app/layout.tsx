import type { Metadata } from 'next'
import './globals.css'
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-heading',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Capital Hub OS',
  description: 'Sistema operativo interno de Capital Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={cn(
        "dark",
        inter.variable,
        interTight.variable,
        jetbrainsMono.variable
      )}
    >
      <body className="antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
