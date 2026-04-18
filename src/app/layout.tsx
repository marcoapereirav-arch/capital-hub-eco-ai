import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import PWARegister from "@/components/PWARegister"

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Capital Hub',
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#0F0F12',
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
        <PWARegister />
      </body>
    </html>
  )
}
