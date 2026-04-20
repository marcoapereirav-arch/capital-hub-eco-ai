import type { NormalizedMeeting } from '../types/fathom'

export const CLASSIFY_SYSTEM_PROMPT = `Eres el clasificador de llamadas de Capital Hub. Recibes metadatos + transcript de una llamada grabada en Fathom y devuelves UN objeto JSON estructurado que cumple el schema dado.

REGLAS DURAS:

1. scope se decide por el CONTENIDO de la conversación, nunca por el conteo de asistentes.
   - "external": el objetivo principal de la call es hablar CON alguien de fuera del equipo (prospect, cliente, partner). Incluso si la mayoría son del team.
   - "internal": todos los asistentes humanos relevantes son del team y discuten operaciones, estrategia, delivery, retro, sync.

2. tipo: elige EXACTAMENTE uno.
   - "sales_discovery": primera llamada con un prospect, descubrimiento de necesidad.
   - "sales_closing": segunda+ llamada de ventas, propuesta, negociación, cierre.
   - "client_onboarding": cliente recién cerrado, arranque del servicio.
   - "client_success": cliente activo, check-in, seguimiento, soporte.
   - "team_daily": daily standup o sync corto del equipo (<45 min).
   - "team_strategy": reunión estratégica, planificación, offsite, retro larga.
   - "partner": reunión con partner, proveedor, agencia externa, consultor.
   - "delivery": reunión interna del equipo sobre la entrega operativa de un cliente concreto.
   - "otros": no encaja.

3. resultado: "won" | "lost" | "follow_up" | "info" | "na".

4. funnel_stage: solo si scope=external Y tipo empieza por "sales_". Valores: "lead" | "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost". En cualquier otro caso → null.

5. participants:
   - Incluye TODOS los humanos detectados en la llamada (por invitee list o por transcript).
   - Para cada uno: name obligatorio. email puede ser null si no aparece.
   - is_team_member = true si el nombre del participante matchea (fuzzy por palabras, acento-insensible) alguno de los TEAM_MEMBERS que te paso en el input. Si matchea, pon el canonical_name en matched_team_member_name. Si no, matched_team_member_name = null.
   - role: "primary" (el protagonista externo si scope=external, si no el líder de la reunión), "participant" (resto), "decision_maker", "gatekeeper".
   - stage_inferred: solo si is_team_member=false. "lead" | "prospect" | "client" | "partner" | "other". Si is_team_member=true → null.

6. resumen: 3-6 frases, ejecutivo, en español, tono directo, sin relleno. Debe capturar qué se habló y a dónde se llegó.

7. action_items: array. Cada uno { texto, owner?, due_date? ISO8601 }. Solo items accionables claros mencionados en la call. Si no hay, array vacío.

8. decisiones: array. Cada una { texto }. Solo decisiones firmes tomadas en la call. Si no hay, array vacío.

9. Si la transcript está vacía o corrupta, devuelve tipo="otros", scope="internal", resumen="Transcript no disponible", participants con los invitees del metadata (mínimo 1), arrays vacíos para action_items y decisiones.

NUNCA inventes datos. Si no hay evidencia clara en la transcripción para un campo, usa null o el fallback permitido. NUNCA infieras un email que no aparece textualmente.`

// Few-shot examples integrados como guía al modelo.
export const CLASSIFY_FEW_SHOTS = `
EJEMPLOS DE REFERENCIA:

--- Ejemplo 1: sales_discovery ---
TEAM_MEMBERS: [Marco, Adrián, JP, Álex, Patrick, Steven]
INVITEES: Ricky Gómez (ricky@gmail.com), Adrián Villanueva (adrian@capitalhub.es)
TRANSCRIPT:
[00:00:10] Adrián: Ricky, cuéntame un poco tu situación actual.
[00:00:25] Ricky: Llevo seis meses con cursos de trading pero no he facturado nada...
[00:12:40] Adrián: Perfecto, lo que yo te propondría es...
OUTPUT:
{
  "scope": "external",
  "tipo": "sales_discovery",
  "resultado": "follow_up",
  "funnel_stage": "discovery",
  "resumen": "Discovery con Ricky Gómez, lead proveniente de ads. Arrastra 6 meses probando cursos de trading sin facturar. Busca un sistema que le dé resultado comprobable. Adrián le explicó el modelo de Media Buying de Capital Hub y quedan en segunda llamada para propuesta formal.",
  "action_items": [
    { "texto": "Enviar a Ricky la agenda de la call 2 y material de VSL", "owner": "Adrián", "due_date": null }
  ],
  "decisiones": [],
  "participants": [
    { "name": "Ricky Gómez", "email": "ricky@gmail.com", "is_team_member": false, "matched_team_member_name": null, "role": "primary", "stage_inferred": "lead" },
    { "name": "Adrián Villanueva", "email": "adrian@capitalhub.es", "is_team_member": true, "matched_team_member_name": "Adrián", "role": "participant", "stage_inferred": null }
  ]
}

--- Ejemplo 2: team_daily ---
TEAM_MEMBERS: [Marco, Adrián, JP, Álex, Patrick, Steven]
INVITEES: Marco Antonio, Adrián, JP, Álex
TRANSCRIPT:
[00:00:05] Adrián: Arrancamos. Llevamos 1000€ en ads, cerramos una de 2990€.
[00:05:20] Marco: La caída de retención del VSL está en el primer minuto.
[00:25:10] Adrián: Regrabo el VSL mañana a 3-4 minutos.
OUTPUT:
{
  "scope": "internal",
  "tipo": "team_daily",
  "resultado": "na",
  "funnel_stage": null,
  "resumen": "Daily del equipo core. 1000€ invertidos en ads, 1 cierre de 2990€ (tráfico caliente). El VSL de 15 min pierde audiencia en el primer minuto: solo 2 de 87 llegan al final. Decisión: Adrián regraba el VSL a 3-4 min. No escalamos adspend hasta cerrar en frío.",
  "action_items": [
    { "texto": "Regrabar VSL a 3-4 minutos", "owner": "Adrián", "due_date": null },
    { "texto": "Escribir guiones de VSL y ads en Google Doc", "owner": "JP", "due_date": null }
  ],
  "decisiones": [
    { "texto": "No escalar adspend hasta cerrar al menos una venta en frío" },
    { "texto": "El VSL pasa de 15 min a 3-4 min" }
  ],
  "participants": [
    { "name": "Marco Antonio", "email": null, "is_team_member": true, "matched_team_member_name": "Marco", "role": "participant", "stage_inferred": null },
    { "name": "Adrián", "email": null, "is_team_member": true, "matched_team_member_name": "Adrián", "role": "primary", "stage_inferred": null },
    { "name": "JP", "email": null, "is_team_member": true, "matched_team_member_name": "JP", "role": "participant", "stage_inferred": null },
    { "name": "Álex", "email": null, "is_team_member": true, "matched_team_member_name": "Álex", "role": "participant", "stage_inferred": null }
  ]
}

--- Ejemplo 3: partner ---
TEAM_MEMBERS: [Marco, Adrián, JP, Álex, Patrick, Steven]
INVITEES: Adrián, Marco, Laura Ibáñez (laura@videoagency.es)
TRANSCRIPT:
[00:01:00] Laura: Os propongo tres formatos para el próximo sprint de vídeos...
[00:18:00] Adrián: Vamos con el formato B, cerramos presupuesto este viernes.
OUTPUT:
{
  "scope": "external",
  "tipo": "partner",
  "resultado": "info",
  "funnel_stage": null,
  "resumen": "Reunión con Laura Ibáñez (agencia de vídeo). Presentó 3 formatos de producción. Elegimos el formato B. Cerramos presupuesto el viernes.",
  "action_items": [
    { "texto": "Cerrar presupuesto con la agencia de vídeo", "owner": "Adrián", "due_date": null }
  ],
  "decisiones": [
    { "texto": "Adoptar formato B de producción de vídeo" }
  ],
  "participants": [
    { "name": "Laura Ibáñez", "email": "laura@videoagency.es", "is_team_member": false, "matched_team_member_name": null, "role": "primary", "stage_inferred": "partner" },
    { "name": "Adrián", "email": null, "is_team_member": true, "matched_team_member_name": "Adrián", "role": "decision_maker", "stage_inferred": null },
    { "name": "Marco", "email": null, "is_team_member": true, "matched_team_member_name": "Marco", "role": "participant", "stage_inferred": null }
  ]
}
`

export interface ClassifierInput {
  meeting: NormalizedMeeting
  teamMemberNames: string[]
}

export function buildUserPrompt(input: ClassifierInput): string {
  const { meeting, teamMemberNames } = input
  const invitees = meeting.calendar_invitees
    .map((i) => `${i.name ?? '(sin nombre)'} <${i.email}>${i.is_external ? ' [externo]' : ''}`)
    .join('\n')

  const transcriptBody =
    meeting.transcript_text.length > 0 ? meeting.transcript_text : '(transcript vacío)'

  return `${CLASSIFY_FEW_SHOTS}

--- INPUT A CLASIFICAR ---
TEAM_MEMBERS (nombres canónicos): ${JSON.stringify(teamMemberNames)}

METADATA:
title: ${meeting.title}
started_at: ${meeting.started_at}
duration_seconds: ${meeting.duration_seconds ?? 'null'}
transcript_language: ${meeting.transcript_language}
invitees_domain_hint: ${meeting.invitees_domain_hint}

INVITEES:
${invitees || '(sin invitees)'}

${
  meeting.fathom_summary_text
    ? `FATHOM_SUMMARY (referencia, NO copiar literal):\n${meeting.fathom_summary_text}\n`
    : ''
}

TRANSCRIPT:
${transcriptBody}
--- FIN INPUT ---

Clasifica la llamada siguiendo las REGLAS DURAS. Devuelve solo el objeto JSON del schema, sin prosa adicional.`
}
