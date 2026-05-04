import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad — Capital Hub",
  description: "Política de privacidad de Capital Hub. Cómo tratamos tus datos personales según el RGPD.",
  robots: { index: true, follow: true },
}

export default function PrivacidadPage() {
  return (
    <article>
      <h1>Política de Privacidad</h1>
      <p><strong>Última actualización:</strong> 4 de mayo de 2026</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos es <strong>Adrián Villanueva</strong>, titular del proyecto
        Capital Hub, con email de contacto <a href="mailto:adrian@mail.capitalhubapp.com">adrian@mail.capitalhubapp.com</a>.
      </p>

      <h2>2. Qué datos recopilamos</h2>
      <ul>
        <li><strong>Datos de identificación</strong>: nombre completo, email, teléfono — facilitados por ti al activar la prueba gratuita o al agendar una llamada.</li>
        <li><strong>Datos de pago</strong>: gestionados directamente por nuestro proveedor de pago Whop (no almacenamos datos de tarjeta).</li>
        <li><strong>Datos de navegación y tracking</strong>: cookies del píxel de Meta (Facebook), dirección IP, user agent del navegador, páginas visitadas dentro del funnel, eventos de conversión.</li>
        <li><strong>Datos de uso</strong>: bookings de llamadas, historial de pagos y suscripciones, interacciones con emails.</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <ul>
        <li>Prestación del servicio (acceso a la formación, bolsa de empleo, comunidad, llamadas de diagnóstico).</li>
        <li>Gestión de pagos y suscripciones.</li>
        <li>Envío de comunicaciones transaccionales (confirmaciones, recordatorios) y comerciales relacionadas con el servicio.</li>
        <li>Optimización de campañas publicitarias en Meta (Facebook, Instagram) mediante eventos de conversión enviados al píxel y a la Conversions API.</li>
        <li>Análisis estadístico y mejora del producto.</li>
      </ul>

      <h2>4. Base legal</h2>
      <ul>
        <li><strong>Ejecución de contrato</strong>: para prestar el servicio que has contratado.</li>
        <li><strong>Consentimiento</strong>: para tracking publicitario y comunicaciones comerciales (puedes retirarlo en cualquier momento).</li>
        <li><strong>Interés legítimo</strong>: para análisis interno y prevención de fraude.</li>
      </ul>

      <h2>5. Destinatarios y proveedores</h2>
      <p>Compartimos datos solo con los proveedores estrictamente necesarios para la prestación del servicio:</p>
      <ul>
        <li><strong>Whop</strong>: procesador de pagos.</li>
        <li><strong>Resend</strong>: servicio de envío de emails transaccionales.</li>
        <li><strong>Supabase</strong>: alojamiento de la base de datos.</li>
        <li><strong>Vercel</strong>: alojamiento de la aplicación.</li>
        <li><strong>Meta (Facebook)</strong>: tracking publicitario (Pixel + Conversions API).</li>
      </ul>
      <p>Todos los proveedores cumplen con el RGPD. Los datos pueden almacenarse en servidores ubicados en la UE o en EE.UU. (con garantías adecuadas según las cláusulas contractuales tipo).</p>

      <h2>6. Conservación de los datos</h2>
      <ul>
        <li>Datos de cliente activo: mientras dure la relación contractual.</li>
        <li>Datos de cliente baja: 6 años por obligación fiscal y mercantil.</li>
        <li>Datos de tracking publicitario: 90 días desde la última visita o conversión.</li>
        <li>Logs de email y eventos: 12 meses por auditoría.</li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>Acceder a los datos que tenemos sobre ti.</li>
        <li>Rectificarlos si son inexactos.</li>
        <li>Suprimirlos (derecho al olvido) cuando ya no sean necesarios.</li>
        <li>Oponerte al tratamiento o limitarlo.</li>
        <li>Portabilidad: recibir tus datos en formato estructurado.</li>
        <li>Retirar el consentimiento al tracking en cualquier momento.</li>
      </ul>
      <p>
        Para ejercer cualquier derecho, escribe a <a href="mailto:adrian@mail.capitalhubapp.com">adrian@mail.capitalhubapp.com</a>.
        Resolveremos en un plazo máximo de 30 días.
      </p>
      <p>
        Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar reclamación ante la
        Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener" target="_blank">www.aepd.es</a>).
      </p>

      <h2>8. Cookies y tracking</h2>
      <p>
        Consulta nuestra <a href="/legal/cookies">Política de Cookies</a> para más detalle sobre el píxel de Meta y demás
        tecnologías de tracking que usamos en el funnel.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política puntualmente. La fecha de la última actualización aparece arriba. Si los
        cambios son sustanciales, te avisaremos por email.
      </p>
    </article>
  )
}
