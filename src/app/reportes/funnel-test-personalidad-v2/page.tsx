import type { CSSProperties, ReactNode } from "react"

export const dynamic = "force-static"

export const metadata = {
  title: "Reporte técnico · Funnel Test Personalidad v2",
  description: "Qué se construyó, dónde vive cada pieza y qué falta.",
  robots: { index: false, follow: false },
}

/**
 * Reporte técnico del funnel v2, embebido en el Knowledge del OS.
 *
 * Sigue el patrón del brandkit: página VIVA dentro de la app, embebida por iframe
 * desde /knowledge. NO se crea un .html estático en public/ (sería una segunda
 * fuente que se desincroniza, ver SOP marketing/brand/01).
 *
 * Tono: técnico, neutro, al grano. Sin marketing. Sin guion largo, sin emojis
 * (REGLAS 7 y 8 del SOP producto/04).
 */

const C = {
  bg: "#0F0F12",
  panel: "#141418",
  border: "#2A2D34",
  text: "#F5F6F7",
  body: "#D1D5DB",
  dim: "#9CA3AF",
  muted: "#6B7280",
  green: "#22C55E",
  greenSoft: "#4ADE80",
}

const OS = "https://os.capitalhubapp.com"
const CH = "https://ch.capitalhubapp.com"

const heading: CSSProperties = { fontFamily: "'Inter Tight', Inter, sans-serif" }

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
        <span style={{ color: C.green, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        <h2 style={{ ...heading, fontSize: 20, fontWeight: 600, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Row({
  what,
  did,
  href,
  linkLabel,
}: {
  what: string
  did: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: "14px 0",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ ...heading, fontSize: 15, fontWeight: 600, color: C.text }}>{what}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: C.body }}>{did}</div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: C.greenSoft, textDecoration: "none", wordBreak: "break-all" }}
        >
          {linkLabel ?? href}
        </a>
      ) : null}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderLeft: `2px solid ${C.green}`,
        background: C.panel,
        padding: "14px 16px",
        fontSize: 14,
        lineHeight: 1.65,
        color: C.body,
        margin: "16px 0",
      }}
    >
      {children}
    </div>
  )
}

export default function ReporteFunnelTestV2() {
  return (
    <main
      style={{
        background: C.bg,
        color: C.text,
        minHeight: "100dvh",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Cabecera */}
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              ...heading,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.muted,
              marginBottom: 18,
            }}
          >
            Capital Hub · Reporte técnico
          </div>
          <h1 style={{ ...heading, fontSize: 30, fontWeight: 600, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Funnel Test de Personalidad v2
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: C.body, margin: 0 }}>
            Qué se construyó, dónde vive cada pieza y qué falta. Publicado en producción el
            2026-07-24, commits <code style={{ color: C.greenSoft }}>14b4ca9</code> y{" "}
            <code style={{ color: C.greenSoft }}>8037fce</code>.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: C.dim, margin: "10px 0 0" }}>
            Origen: reunión del 18-jul-2026 (Adrián, Marco, Pat, JP, Giustina). Plan de
            construcción en <code>.claude/PRPs/PRP-007</code>. Doc de referencia:{" "}
            <strong>SOP marketing/07</strong>.
          </p>
        </header>

        {/* 01 Qué cambia */}
        <Section n="01" title="Qué cambia respecto a la v1">
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["El lead saltaba a Equilibria en 3 segundos, sin escuchar nada de Capital Hub.", "La página de gracias pasa a ser la página de venta: VSL más Calendly."],
              ["Si no pulsaba en ese momento, se perdía. No había reenganche.", "Email automático a los 7 minutos con su acceso al test."],
              ["El enlace al test era externo. No sabíamos quién lo abría.", "El clic pasa por nuestro dominio y queda medido."],
              ["Todos los opt-in valían igual. El setter escribía a ciegas.", "Stage Lead cualificado: el que abre el test sube solo de columna."],
            ].map(([antes, ahora]) => (
              <div key={antes} style={{ border: `1px solid ${C.border}`, padding: "12px 14px", background: C.panel }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Antes: {antes}</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>Ahora: {ahora}</div>
              </div>
            ))}
          </div>

          <Note>
            <strong>Restricción que manda en todo el diseño:</strong> el test es de Equilibria,
            vive fuera de nuestro dominio y no se puede detectar cuándo lo termina ni redirigir
            de vuelta. Por eso la medición se hace en el clic del email, que es el último punto
            que sí controlamos.
          </Note>
        </Section>

        {/* 02 Flujo */}
        <Section n="02" title="Flujo completo">
          <pre
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              padding: 18,
              fontSize: 12.5,
              lineHeight: 1.75,
              color: C.body,
              overflowX: "auto",
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
{`Anuncio
   |
[1] /test-personalidad          opt-in: nombre + email + telefono
   |                            -> contacto creado, stage LEAD
   |                            -> se programa el email a los 7 min
   v
[2] /test-personalidad/gracias  "tu test llega en 7 minutos"
   |                            VSL de Adrian
   |                            Calendly embebido, visible desde el segundo 0
   |
   +--> si reserva -> /reservar/gracias -> stage AGENDADO
   |
   v  (pasan 7 minutos)
[3] Email "Aqui tienes tu test"
   |    boton -> /api/funnel/test-personalidad/acceso?c=<slug>
   v
[4] Ese endpoint califica y redirige
   |    -> stage LEAD CUALIFICADO
   |    -> journey event + evento Meta + aviso al equipo
   v
[5] /test-personalidad/test     boton a Equilibria
                                botones de Instagram y WhatsApp
   |
   v
    Setter / closer`}
          </pre>
        </Section>

        {/* 03 Páginas */}
        <Section n="03" title="Páginas del funnel">
          <Row
            what="Landing de opt-in"
            did="Sin cambios. Copy y formulario intactos. Solo se modificó la redirección: ahora lleva el identificador opaco del contacto para poder prellenar el Calendly."
            href={`${CH}/test-personalidad`}
          />
          <Row
            what="Página de gracias (reescrita)"
            did="Deja de entregar el test. Muestra el aviso de espera, el hueco del vídeo en 16:9 y el Calendly embebido justo debajo. El hueco del vídeo se pinta siempre: mientras no haya vídeo muestra un placeholder, y al pegar el GUID el reproductor aparece en ese hueco exacto sin mover nada."
            href={`${CH}/test-personalidad/gracias`}
          />
          <Row
            what="Landing del test (nueva)"
            did="Destino del botón del email. Contiene el botón a Equilibria y el protocolo de captura con los botones de Instagram y WhatsApp, que antes vivían en la página de gracias. Marcada como no indexable."
            href={`${CH}/test-personalidad/test`}
          />
          <Row
            what="Post agenda (reutilizada)"
            did="No se tocó. Es el destino tras reservar en el Calendly de la página de gracias. Ya tenía el vídeo de preparación de la llamada."
            href={`${CH}/reservar/gracias`}
          />
        </Section>

        {/* 04 CRM */}
        <Section n="04" title="CRM">
          <Row
            what="Columna Lead cualificado"
            did="Nueva columna entre Lead y Agendado, solo en el pipeline Test Personalidad. Se mueve sola cuando el lead pulsa el botón del email y llega a la landing del test. El pipeline Webinar no la lleva porque no tiene esa señal."
            href={`${OS}/crm/pipeline`}
            linkLabel="os.capitalhubapp.com/crm/pipeline"
          />
          <Row
            what="Guarda de no retroceso"
            did="Escalera actualizada a dm, lead, lead_cualificado, agendado, alumno. Las automatizaciones nunca bajan de escalón y nunca degradan a un alumno. Verificado: un contacto en Agendado o Alumno que vuelve a pulsar el enlace no retrocede."
          />
          <Row
            what="Migración de base de datos"
            did="Amplía el CHECK de contacts.stage, inserta la columna en pipeline_stages y corre el orden del resto. Idempotente. Fichero 20260723120000_pipeline_stage_lead_cualificado.sql."
          />
        </Section>

        {/* 05 Email */}
        <Section n="05" title="Email">
          <Row
            what="Plantilla del acceso al test"
            did="Editable y pausable sin deploy. Tres botones: acceso al test, Instagram y WhatsApp. Los dos últimos con los mismos destinos que la landing del test."
            href={`${OS}/email-marketing`}
            linkLabel="os.capitalhubapp.com/email-marketing"
          />
          <Row
            what="Vista previa"
            did="Renderiza el email tal cual le llega al lead, para comprobar a dónde apunta cada botón sin enviar nada. Requiere estar logueado en el OS."
            href={`${OS}/api/admin/email/preview/test_personalidad_acceso`}
            linkLabel="Ver la vista previa"
          />
          <Row
            what="Envío programado"
            did="Se programa en el propio opt-in con la función de envío diferido de Resend. Sin cron y sin tabla de cola. El retraso por defecto es 7 minutos y es editable sin deploy."
          />

          <Note>
            <strong>Regla que no se debe romper:</strong> el botón principal del email apunta a{" "}
            <code>/api/funnel/test-personalidad/acceso</code>, no al enlace directo de Equilibria.
            Ese paso intermedio es el que marca al contacto como Lead cualificado y alimenta a
            Meta. Si se cambia por el enlace directo, se pierde la medición del funnel.
          </Note>
        </Section>

        {/* 06 Automatizaciones y tracking */}
        <Section n="06" title="Automatizaciones y tracking">
          <Row
            what="Email del acceso a los 7 minutos"
            did="Cada opt-in programa el envío. Registrada en el panel con su estado real."
            href={`${OS}/automatizaciones`}
            linkLabel="os.capitalhubapp.com/automatizaciones"
          />
          <Row
            what="El clic del email cualifica al lead"
            did="Sube el stage, deja evento en el historial del contacto, dispara el evento a Meta y avisa al equipo por campana y push."
            href={`${OS}/automatizaciones`}
            linkLabel="os.capitalhubapp.com/automatizaciones"
          />
          <Row
            what="Evento nuevo de Meta"
            did="test_personalidad_cualificado, dado de alta en los tres sitios que exige el sistema. Permite optimizar campañas por calidad de lead y no solo por volumen. Petición de JP en la reunión."
            href={`${OS}/ads`}
            linkLabel="os.capitalhubapp.com/ads"
          />

          <Note>
            Las automatizaciones aparecen en gris mientras no haya tráfico real. Es
            intencionado: solo pasan a verde con evidencia de ejecución. No se muestran como
            activas cosas que no lo están.
          </Note>
        </Section>

        {/* 07 Ajustes */}
        <Section n="07" title="Ajustes editables sin deploy">
          <Row
            what="Engranaje del funnel en el panel de webs"
            did="Seis campos: GUID del vídeo VSL, URL del Calendly, minutos hasta el email, URL del test, WhatsApp e Instagram. Cambiar cualquiera no requiere tocar código ni desplegar."
            href={`${OS}/webs`}
            linkLabel="os.capitalhubapp.com/webs"
          />
          <Row
            what="Pasos del funnel actualizados"
            did="La página de gracias se renombró a Gracias (VSL + Calendly) y se añadió el paso Landing del test."
            href={`${OS}/webs`}
            linkLabel="os.capitalhubapp.com/webs"
          />
        </Section>

        {/* 08 Documentación */}
        <Section n="08" title="Documentación y seguimiento">
          <Row
            what="SOP del funnel reescrito a v2"
            did="La v1 se conserva como histórico. Incluye las decisiones cerradas en la reunión para no volver a debatirlas: fuera el WhatsApp de la página de gracias, nada de automatizar WhatsApp por ahora, no se quita el formulario, se sigue con Equilibria, el botón de agenda visible desde el principio."
            href={`${OS}/knowledge`}
            linkLabel="os.capitalhubapp.com/knowledge"
          />
          <Row
            what="Otros SOPs actualizados"
            did="Pipeline (stages canónicos más checklist para añadir stages), Email marketing (envío programado), Automatizaciones (las dos nuevas), Sistema end to end y el índice del Knowledge."
            href={`${OS}/knowledge`}
            linkLabel="os.capitalhubapp.com/knowledge"
          />
          <Row
            what="Tareas del sprint"
            did="Ocho tareas en el proyecto BLOQUE 2D: cinco cerradas y tres pendientes con su responsable."
            href={`${OS}/projects`}
            linkLabel="os.capitalhubapp.com/projects"
          />
        </Section>

        {/* 09 Verificación */}
        <Section n="09" title="Verificación realizada">
          <div style={{ fontSize: 14, lineHeight: 1.75, color: C.body }}>
            Recorrido completo ejecutado de verdad contra la base de datos real, con el usuario
            de pruebas del sistema, en móvil 390x844. Comprobado: creación del contacto con
            teléfono y pipeline correctos, carga de la página de gracias y del Calendly,
            programación del email aceptada por el proveedor, subida de stage al pulsar el
            enlace, envío del evento a Meta, no duplicación en clics repetidos, no retroceso
            desde Agendado y Alumno, y redirección al test incluso con enlace roto o sin
            identificador. TypeScript y build de producción limpios. Todos los datos de prueba
            fueron borrados después.
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: C.body, marginTop: 12 }}>
            En producción se verificó que el servidor sirve el commit publicado, que las dos
            páginas públicas cargan sin errores, y que dentro del OS aparecen la columna nueva,
            la plantilla de email, las automatizaciones y los pasos del funnel.
          </div>
        </Section>

        {/* 10 Falta */}
        <Section n="10" title="Qué falta">
          <Row what="Grabar la VSL" did="Adrián. Es el único bloqueo del funnel. Al recibirla se sube y se pega el GUID en el engranaje de webs. Sin deploy." />
          <Row what="Poner Meta en modo Live" did="Pendiente de orden. Ahora está en modo Test: los eventos no optimizan campañas. Hacerlo antes de encender presupuesto." />
          <Row what="Grabar los anuncios" did="Adrián." />
          <Row what="Montar las campañas" did="JP." />
          <Row what="Prueba real en producción" did="Pendiente de autorización. Crearía un contacto real y enviaría notificación al equipo." />
          <Row what="Bug del registro de plantillas pausadas" did="Preexistente, no introducido aquí. Al pausar una plantilla, el bloqueo no queda registrado porque el motivo no está en la lista permitida de la base de datos. No afecta al envío, solo al historial. Documentado con su solución." />
        </Section>

        <footer style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, fontSize: 12.5, color: C.muted }}>
          Capital Hub OS · Reporte técnico generado el 2026-07-24. Fuente de verdad operativa:
          SOP marketing/07 en el Knowledge.
        </footer>
      </div>
    </main>
  )
}
