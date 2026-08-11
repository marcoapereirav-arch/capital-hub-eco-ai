import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter_Tight, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import PWARegister from "@/components/PWARegister"

// Inter Tight es la UNICA familia de la marca (brandkit oficial, seccion Tipografia:
// "Una sola familia: Inter Tight, de 400 a 900"). Antes se cargaba tambien Inter y
// reclamaba el nombre --font-sans, que es el mismo nombre que usa el tema de estilos:
// dos cosas distintas con el mismo nombre. Retirada.
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter-tight',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://os.capitalhubapp.com'),
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
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // OJO, NO devolver `interactiveWidget`: es de Android, iOS no lo entiende, y
  // al meterlo en el meta del viewport el iPhone dejo de aplicar bien el
  // `viewport-fit=cover`. La ventana se quedaba 62 puntos por encima del borde de
  // la pantalla y ahi salia la banda negra (medido en la captura de Marco,
  // 2026-08-08). Para el teclado se usa `sticky` dentro de lo que se desplaza,
  // no elementos anclados con `fixed`.
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
