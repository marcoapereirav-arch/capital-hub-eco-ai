import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Cookies — Capital Hub",
  description: "Información sobre las cookies y tecnologías de tracking utilizadas en Capital Hub.",
  robots: { index: true, follow: true },
}

export default function CookiesPage() {
  return (
    <article>
      <h1>Política de Cookies</h1>
      <p><strong>Última actualización:</strong> 4 de mayo de 2026</p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que un sitio web almacena en tu navegador para recordar información sobre
        tu visita: preferencias, sesión, tracking de comportamiento, etc.
      </p>

      <h2>2. Cookies que usamos</h2>

      <h3>Cookies estrictamente necesarias</h3>
      <p>Imprescindibles para el funcionamiento del sitio. No requieren consentimiento.</p>
      <ul>
        <li><strong>Cookie de sesión Whop</strong> (durante el checkout): permite procesar el pago y recordar la tarjeta entre el checkout MES y el upsell anual para 1-click.</li>
        <li><strong>Cookie técnica de Vercel</strong>: routing y caché de la aplicación.</li>
      </ul>

      <h3>Cookies de tracking publicitario (Meta / Facebook)</h3>
      <p>Requieren consentimiento explícito. Si las rechazas, no se cargan.</p>
      <ul>
        <li><strong>_fbp</strong> (Meta): identifica al navegador para asociar acciones del usuario con campañas de Facebook/Instagram. Duración: 90 días.</li>
        <li><strong>_fbc</strong> (Meta): captura el click ID de un anuncio cuando vienes desde Facebook/Instagram. Duración: 90 días.</li>
        <li><strong>Eventos de píxel</strong> (lead, free trial, compra, etc.): no son cookies pero envían información de tu actividad a Meta para optimizar campañas.</li>
        <li><strong>Conversions API</strong>: complementa el píxel con eventos enviados directamente desde nuestro servidor (con tu email/teléfono hasheado SHA-256, nunca en claro).</li>
      </ul>

      <h2>3. Cómo gestionar tu consentimiento</h2>
      <p>
        En tu primera visita verás un banner inferior con 3 opciones:
      </p>
      <ul>
        <li><strong>Aceptar todas</strong>: cargamos las cookies de tracking publicitario.</li>
        <li><strong>Rechazar</strong>: solo se cargan las estrictamente necesarias.</li>
        <li><strong>Personalizar</strong>: elige por categoría.</li>
      </ul>
      <p>
        Tu elección queda guardada en tu navegador (localStorage) durante 12 meses. Puedes cambiarla en cualquier
        momento desde el banner que reaparecerá si borras tu choice o limpias el navegador.
      </p>

      <h2>4. Cómo eliminar las cookies manualmente</h2>
      <p>
        Cada navegador permite borrar cookies y bloquear las de terceros desde sus ajustes:
      </p>
      <ul>
        <li><strong>Chrome</strong>: Configuración → Privacidad y seguridad → Cookies</li>
        <li><strong>Safari</strong>: Preferencias → Privacidad</li>
        <li><strong>Firefox</strong>: Ajustes → Privacidad y seguridad → Cookies y datos del sitio</li>
        <li><strong>Edge</strong>: Configuración → Cookies y permisos del sitio</li>
      </ul>

      <h2>5. Más información</h2>
      <p>
        Si tienes dudas escríbenos a <a href="mailto:adrian@mail.capitalhubapp.com">adrian@mail.capitalhubapp.com</a>.
        También puedes consultar nuestra <a href="/legal/privacidad">Política de Privacidad</a> para entender cómo
        tratamos los datos asociados a estas cookies.
      </p>
    </article>
  )
}
