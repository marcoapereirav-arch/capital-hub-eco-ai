import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones — Capital Hub",
  description: "Términos y condiciones del servicio Capital Hub.",
  robots: { index: true, follow: true },
}

export default function TerminosPage() {
  return (
    <article>
      <h1>Términos y Condiciones</h1>
      <p><strong>Última actualización:</strong> 4 de mayo de 2026</p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al activar la prueba gratuita, contratar una suscripción o agendar una llamada en Capital Hub aceptas estos
        términos. Si no estás de acuerdo, no debes utilizar el servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        Capital Hub es una plataforma de formación digital + bolsa de empleo + comunidad orientada a personas que
        quieren conseguir un trabajo remoto en una profesión digital (IA, marketing digital o comercial digital).
      </p>

      <h2>3. Planes y precios</h2>
      <ul>
        <li><strong>Prueba gratuita</strong>: 14 días de acceso completo sin coste. Requiere registro de tarjeta para activación.</li>
        <li><strong>Plan mensual</strong>: 97 €/mes. Renovación automática mensual. Cancelable en cualquier momento.</li>
        <li><strong>Plan anual</strong>: 970 €/año (equivalente a 81 €/mes). Renovación automática anual.</li>
        <li><strong>Bonus Bundle</strong>: pago único de 19 € disponible solo durante el checkout inicial.</li>
      </ul>
      <p>Los precios incluyen IVA cuando sea aplicable según la normativa fiscal.</p>

      <h2>4. Renovación y cancelación</h2>
      <p>
        Las suscripciones se renuevan automáticamente al final de cada periodo. Puedes cancelar en cualquier momento
        desde tu perfil con un click. La cancelación tiene efecto al final del periodo de facturación en curso —
        mantienes el acceso hasta esa fecha y no se cobran nuevos periodos.
      </p>
      <p>
        Si cancelas durante la prueba gratuita (antes del día 14), no se realiza cobro alguno.
      </p>

      <h2>5. Política de reembolso</h2>
      <p>
        Garantía de devolución de 30 días desde el primer cobro real (no aplica al periodo de prueba gratuita): si
        consideras que el servicio no cumple expectativas, contactando a
        <a href="mailto:adrian@mail.capitalhubapp.com"> adrian@mail.capitalhubapp.com</a> en los primeros 30 días te
        devolvemos el 100% de lo cobrado, sin preguntas.
      </p>
      <p>
        Pasado ese plazo no se aplican reembolsos por meses ya transcurridos. Sí puedes cancelar la suscripción para
        que no se cobre el siguiente periodo.
      </p>

      <h2>6. Uso aceptable</h2>
      <p>Te comprometes a:</p>
      <ul>
        <li>No compartir tu cuenta con terceros.</li>
        <li>No descargar o redistribuir las masterclasses, plantillas u otros materiales.</li>
        <li>No usar el servicio para fines ilegales o que infrinjan derechos de terceros.</li>
      </ul>
      <p>El incumplimiento puede resultar en la suspensión inmediata sin derecho a reembolso.</p>

      <h2>7. Bolsa de empleo</h2>
      <p>
        Las ofertas de la bolsa de empleo provienen de empresas externas. Capital Hub actúa como intermediario y no
        garantiza la contratación. La relación laboral se establece directamente entre ti y la empresa contratante.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        Todo el contenido (vídeos, materiales, textos, plantillas) es propiedad de Capital Hub o sus licenciantes.
        Te concedemos una licencia personal, intransferible y revocable para uso individual mientras dure tu
        suscripción.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        Capital Hub no garantiza resultados específicos en términos de empleabilidad, salario o tiempo de colocación
        — los resultados dependen de tu esfuerzo, dedicación y circunstancias del mercado.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Podemos modificar estos términos puntualmente. Si los cambios son sustanciales, te avisaremos por email con
        al menos 15 días de antelación. Si no estás de acuerdo, puedes cancelar sin penalización.
      </p>

      <h2>11. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por la legislación española. Cualquier conflicto se resolverá ante los juzgados de
        la localidad del responsable del servicio.
      </p>
    </article>
  )
}
