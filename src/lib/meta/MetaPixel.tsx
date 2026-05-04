"use client"

import Script from "next/script"
import { useTrackingConsent } from "@/lib/cookies/CookieConsent"

interface Props {
  pixelId?: string
}

/**
 * Carga el Pixel de Meta SOLO si el usuario aceptó cookies de tracking.
 * Cumple RGPD: cero tracking publicitario sin consent explícito.
 *
 * Eventos custom (mifge_lead, etc) se disparan desde código con
 * src/lib/meta/pixel-client.ts → track() — que llama a fbq("trackCustom").
 * Esa función internamente verifica `window.fbq` (existe solo si este Script cargó),
 * por lo que si el user rechazó cookies, los track() son no-op browser-side
 * (el server-side CAPI sigue activo bajo nuestro propio interés legítimo de auditoría).
 */
export function MetaPixel({ pixelId }: Props) {
  const id = pixelId ?? process.env.NEXT_PUBLIC_META_PIXEL_ID
  const consented = useTrackingConsent()

  if (!id || !consented) return null

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
