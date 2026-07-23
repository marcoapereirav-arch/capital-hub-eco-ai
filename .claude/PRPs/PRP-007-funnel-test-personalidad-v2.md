# PRP-007: Funnel Test Personalidad v2 (VSL + email a los 7 min + landing del test + stage Lead cualificado)

> **Estado**: APROBADO por Marco (2026-07-23). En ejecución en la rama `feat/funnel-test-personalidad-v2`.
> **Regla de este bloque**: se entrega en localhost. **PROHIBIDO hacer push sin consentimiento explícito de Marco.**
> **Fecha**: 2026-07-23
> **Proyecto**: Capital Hub OS
> **Knowledge de referencia**: `docs/sops/marketing/07-funnel-test-personalidad.md` (v1), `docs/sops/producto/13-contactos-pipeline.md` (stages), `docs/sops/producto/18-email-marketing.md` (Resend), `docs/sops/producto/30-automatizaciones-estado.md` (registro), `docs/sops/producto/40-webs-funnels-architecture.md` (webs/steps)

---

## Objetivo

Convertir el funnel del Test de Personalidad (hoy: opt-in y salto directo a Equilibria) en un funnel de **VSL con calificación automática**: tras el opt-in el lead ve un vídeo de Adrián, a los 7 minutos le llega por email su acceso al test, entra a una **landing propia del test** y, en el momento en que pulsa para abrir Equilibria, el CRM lo marca solo como **Lead cualificado**.

## Por Qué

| Problema (v1) | Solución (v2) |
|---|---|
| El lead salta a Equilibria en 3 segundos, sin escuchar nada de Capital Hub. Cero venta, cero contexto | VSL en la página de gracias: Adrián vende la idea antes de soltar el test |
| Si el lead no pulsa el botón en ese momento, se pierde: no hay ningún reenganche | Email automático a los 7 minutos con su acceso al test (llega justo cuando termina el vídeo) |
| El link al test es un `<a>` externo: no sabemos quién lo abrió ni quién se quedó a medias | Landing propia del test: el clic pasa por nosotros y queda registrado |
| Todos los opt-in valen igual en el kanban (`lead`). El setter no sabe a quién escribir primero | Stage **Lead cualificado**: quien de verdad abrió el test sube solo de columna |

**Valor de negocio**: el setter deja de escribir a ciegas a todos los opt-in y prioriza a los que abrieron el test (intención real). Además se recupera el tráfico que hoy se cae entre la gracias y el test, con el email de los 7 minutos.

## Qué

### Criterios de Éxito

- [ ] `/test-personalidad/gracias` muestra el VSL de Adrián (Bunny Stream) con el GUID editable desde el engranaje de `/webs`, sin deploy.
- [ ] **`/test-personalidad/gracias` lleva el Calendly embebido justo debajo del vídeo, visible desde el segundo 0**, y al reservar redirige a `/reservar/gracias` (post agenda ya existente).
- [ ] Existe `/test-personalidad/test` (landing propia del test) con el protocolo de captura y el botón grande hacia Equilibria.
- [ ] Al pulsar el botón del **email**, el contacto pasa a stage `lead_cualificado` en el CRM (verificable en `/crm/pipeline`) y queda un evento en su journey.
- [ ] Cada opt-in programa un email que llega a los 7 minutos con el acceso al test, visible en `/email-marketing` (Envíos) y editable/pausable en Plantillas.
- [ ] La columna **Lead cualificado** aparece en el kanban del pipeline Test Personalidad entre `Lead` y `Agendado`, y ningún automatismo degrada a un alumno.
- [ ] La automatización nueva aparece registrada en `/automatizaciones` y en el SOP 30, y el SOP marketing/07 refleja el funnel v2.

### Comportamiento Esperado (Happy Path)

```
1. Lead entra en /test-personalidad (landing v1, sin cambios de copy)
2. Pop-up: nombre + email + teléfono. POST /api/optin/test-personalidad
   - Todo lo de v1 (contacto, pipeline, tags, atribución, CAPI, notificaciones)
   - NUEVO: programa el email de los 7 minutos
   - NUEVO: devuelve el token público del contacto
3. Redirige a /test-personalidad/gracias?c=<token>
   - "Tu test llega a tu correo en 7 minutos. Mientras tanto, mira este video"
   - VSL de Adrián (Bunny)
   - CALENDLY EMBEBIDO justo debajo, visible desde el segundo 0
   - Si reserva -> /reservar/gracias (video post agenda, ya existe) -> stage agendado
     (lo mueve el webhook de Calendly que ya funciona)
4. A los 7 minutos llega el email "Aquí tienes tu acceso al test"
   - Botón que apunta a /api/funnel/test-personalidad/acceso?c=<token>
5. Ese endpoint (el clic del email es el disparador de calificación):
   - Marca stage lead_cualificado (con guarda de no retroceso)
   - Journey event + Meta CAPI (test_personalidad_cualificado) + notificación al equipo
   - Redirige (302) a /test-personalidad/test?c=<token>
6. Landing del test: qué va a ver, botón "Abrir el test" (Equilibria, pestaña nueva),
   protocolo de captura y botón de WhatsApp para mandar el resultado
7. El lead hace el test, manda la captura por WhatsApp o Instagram (igual que en v1)
8. El setter ve en el kanban quién está en Lead cualificado y escribe primero a esos
```

---

## Contexto

### Referencias (código real ya existente)

| Qué | Dónde | Para qué sirve aquí |
|---|---|---|
| Funnel v1 completo | `src/features/funnel-test-personalidad/` (`config.ts`, `get-settings.ts`, `components/landing.tsx`, `components/thank-you.tsx`) | Base sobre la que se construye v2 |
| Opt-in v1 | `src/app/api/optin/test-personalidad/route.ts` | Se extiende (email programado + devolver token) |
| Opt-in con email (patrón a copiar) | `src/app/api/optin/webinar/route.ts` líneas 190 a 215 | Cómo se renderiza y envía un template editable desde el opt-in |
| Reproductor Bunny ya en producción | `src/features/funnel-reservar/components/thanks-agenda.tsx` + `src/features/funnel-reservar/config.ts` (`VIDEO_GUID`) + `src/lib/bunny.ts` | Patrón exacto del embed `iframe.mediadelivery.net/embed/686883/<guid>` |
| Ajustes editables por funnel | `src/features/webs/lib/funnel-settings-manifest.ts` + `src/features/funnel-test-personalidad/get-settings.ts` | Añadir `video_guid` y `email_delay_minutes` sin deploy |
| Motor de email + overrides + pausa | `src/lib/email/send-email.ts` (tabla `email_template_overrides`, sustitución `{{var}}`, status `skipped_paused`) | El email nuevo pasa por aquí, no se hardcodea copy suelto |
| Catálogo de plantillas del panel | `src/app/api/admin/email-templates/route.ts` (array `TEMPLATES`) | Registrar la plantilla nueva para que sea editable en `/email-marketing` |
| Guarda de stages | `src/lib/pipeline/stage-guard.ts` (`STAGE_RANK`, `resolveAutoStage`) | Insertar `lead_cualificado` en la escalera |
| Stages dinámicos en UI | `src/features/contactos/components/contactos-page.tsx` (lee `activePipeline.stages`), `pipelines-kanban.tsx` | La UI lee los stages de BD: añadir stage NO exige tocar la UI, solo el color opcional |
| Migración de stage nuevo (patrón) | `supabase/migrations/20260708_pipeline_stage_dm.sql` | Plantilla exacta: ampliar el CHECK + insertar en `pipeline_stages`, idempotente |
| Meta CAPI | `src/lib/meta/capi-client.ts` (`CapiEventName`), `src/app/api/meta/capi/track/route.ts` (`ALLOWED_EVENTS`), `src/features/ads/services/ads-events-service.ts` (`KNOWN_EVENTS` + labels) | Registrar `test_personalidad_started` en los 3 sitios |
| Registro de automatizaciones | `src/app/api/admin/automations/route.ts` (`test_personalidad_optin`, línea ~460) | Añadir las 2 automatizaciones nuevas |
| Notificaciones al equipo | `src/lib/notifications/notify-admins.ts`, `src/lib/notifications/prefs-catalog.ts` | Aviso "X abrió el test" |

### Hechos verificados en el repo (no suposiciones)

- **Resend SDK v6.12.2 soporta `scheduledAt`** y `emails.cancel()`: confirmado en `node_modules/resend/dist/index.d.mts` (`scheduledAt?: string` en el payload de envío). Esto permite el email de los 7 minutos **sin tabla de cola nueva y sin cron nuevo**. Límite de la API: la programación es a futuro corto (horas), 7 minutos entra de sobra.
- **Los stages del kanban se leen de `pipeline_stages` en BD**, no de una constante del front (`contactos-page.tsx` línea 63). Añadir la columna es migración, no refactor de UI.
- **`contacts.stage` tiene CHECK constraint** (`contacts_stage_check`, hoy `dm, lead, agendado, alumno, seguimiento, no_show, perdido`). Si no se amplía, el UPDATE falla en silencio. Es exactamente el bug que documenta la migración `20260615150000`.
- **El vídeo de Bunny ya está resuelto en `/reservar/gracias`**: library `686883`, embed `iframe.mediadelivery.net/embed/686883/<guid>`. Se reusa el mismo patrón.
- **`contacts.slug`** ya existe y es un identificador opaco por contacto (`nombre_ab12cd`), generado en el opt-in. Candidato natural a token público sin inventar tabla nueva.

### Arquitectura Propuesta (Feature-First)

```
src/features/funnel-test-personalidad/
├── components/
│   ├── landing.tsx              (existente, sin tocar copy)
│   ├── thank-you.tsx            (se reescribe: VSL arriba, protocolo se va a la landing del test)
│   ├── test-landing.tsx         (NUEVO: landing del test)
│   └── vsl-player.tsx           (NUEVO: embed Bunny, patrón de funnel-reservar)
├── config.ts                    (+ VIDEO_GUID, EMAIL_DELAY_MINUTES)
└── get-settings.ts              (+ videoGuid, emailDelayMinutes)

src/app/(public)/test-personalidad/
├── page.tsx                     (existente)
├── gracias/page.tsx             (existente, ahora pinta el VSL)
└── test/page.tsx                (NUEVO: landing del test)

src/app/api/
├── optin/test-personalidad/route.ts                (extendido)
└── funnel/test-personalidad/abrir/route.ts         (NUEVO: GET, marca y redirige a Equilibria)

src/lib/email/templates/test-personalidad-acceso.tsx (NUEVO template)
```

### Modelo de Datos

No hay tabla nueva. Solo migración de stage y ajustes en `app_settings`.

```sql
-- 1. Ampliar el CHECK de contacts.stage con 'lead_cualificado' (idempotente)
alter table public.contacts drop constraint if exists contacts_stage_check;
alter table public.contacts add constraint contacts_stage_check
  check (stage = any (array[
    'dm','lead','lead_cualificado','agendado','alumno','seguimiento','no_show','perdido'
  ]::text[]));

-- 2. Insertar la columna en el pipeline del funnel (y reordenar)
insert into public.pipeline_stages (pipeline_id, key, name, color, kind, sort_order)
select p.id, 'lead_cualificado', 'Lead cualificado', '#22C55E', 'active', 2
from public.pipelines p
where p.slug = 'test-personalidad'
  and not exists (
    select 1 from public.pipeline_stages s
    where s.pipeline_id = p.id and s.key = 'lead_cualificado'
  );
-- Reordenar el resto: lead(1) lead_cualificado(2) agendado(3) seguimiento(4)
-- no_show(5) alumno(6) perdido(7) en ese pipeline.
```

Ajustes editables (`app_settings`, key `funnel:test-personalidad`), campos nuevos:

| Campo | Qué es |
|---|---|
| `video_guid` | GUID del VSL en Bunny Stream. Vacío: la gracias cae al layout sin vídeo (no se rompe). |
| `email_delay_minutes` | Retraso del email. Default 7. |

Escalera de stages actualizada en `stage-guard.ts`:

```
dm(0) -> lead(1) -> lead_cualificado(2) -> agendado(3) -> alumno(4)
Ramas fuera de escalera: seguimiento, no_show, perdido (permiten reenganche hacia adelante)
```

---

## Blueprint (Assembly Line)

> Solo FASES. Las subtareas se generan al entrar en cada fase con `/bucle-agentico`,
> mapeando el contexto real del código en ese momento.

### Fase 1: Stage "Lead cualificado" en el pipeline
**Objetivo**: la columna existe en BD, en el kanban y en la escalera de la guarda, sin romper ningún automatismo actual (booking, Calendly, no-show, registrar venta).
**Validación**: `/crm/pipeline` muestra la columna entre Lead y Agendado; mover una ficha a mano funciona; un contacto `alumno` no se degrada; SOP 13 actualizado.

### Fase 2: Landing del test + endpoint de acceso que califica
**Objetivo**: `/test-personalidad/test` publicada, con el botón a Equilibria y el protocolo de captura (lo que hoy vive en la gracias). El **clic del email** pasa por `/api/funnel/test-personalidad/acceso`, que marca `lead_cualificado` y redirige a esa landing.
**Validación**: abrir el endpoint con un token real, comprobar en `/crm/contactos/<id>` que el stage subió y que hay journey event; sin token o con token inválido, igualmente aterriza en la landing (nunca se rompe la experiencia del lead).

### Fase 3: VSL + Calendly en la página de gracias
**Objetivo**: la gracias pasa a ser la página de venta: mensaje de espera de 7 minutos, reproductor Bunny y **Calendly embebido justo debajo, visible desde el segundo 0**, reusando `booking-embed.tsx` de `funnel-reservar` (que ya captura `calendly.event_scheduled` y redirige). Al reservar va a `/reservar/gracias`. GUID y URL de Calendly editables desde el engranaje de `/webs`.
**Validación**: Playwright (desktop y móvil 390x844); con `video_guid` vacío la página no se rompe; el Calendly carga; brandkit y márgenes respetados.

### Fase 4: Email de los 7 minutos
**Objetivo**: cada opt-in programa (Resend `scheduledAt`) el email con el acceso al test; plantilla registrada, editable y pausable desde `/email-marketing`.
**Validación**: opt-in de prueba, el envío aparece en `/email-marketing` (Envíos), el email llega a los 7 minutos y su botón lleva a la landing del test con el token correcto.

### Fase 5: Tracking, panel y Knowledge
**Objetivo**: evento `test_personalidad_started` en Pixel y CAPI, notificación al equipo, las 2 automatizaciones nuevas registradas en `/automatizaciones`, step nuevo en `/webs`, y SOPs 07, 13, 18 y 30 actualizados.
**Validación**: el evento se ve en `/ads` (Tracker); `/automatizaciones` lista las nuevas con estado honesto; `/webs` abre la landing del test sin 404.

### Fase 6: Validación Final
**Objetivo**: funnel v2 funcionando end to end en producción.
**Validación**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Recorrido completo con Playwright en producción: opt-in de prueba, gracias con vídeo, email recibido, landing del test, clic, stage `lead_cualificado` en el CRM
- [ ] Criterios de éxito cumplidos
- [ ] Tareas del sprint cerradas en Operaciones

---

## Decisiones cerradas (2026-07-23)

Resueltas con el transcript de la reunión del 18-jul-2026 y el Knowledge. No quedan preguntas abiertas.

| # | Decisión | Fundamento |
|---|---|---|
| 1 | **7 minutos desde el opt-in.** Editable sin deploy (`email_delay_minutes`). | Recap de la reunión (57:45): "aguanta siete minutos y mira este video mientras te llega el correo". |
| 2 | **El email va a todos, siempre.** Sin cancelaciones. | El acceso al test SOLO llega por email, así que nadie puede haberlo abierto antes. Y es la promesa a cambio de sus datos: se cumple aunque ya haya agendado. KISS. |
| 3 | **El protocolo de captura se mueve entero a la landing del test.** La gracias queda para vídeo y Calendly. | Decisión explícita de la reunión (56:16 a 56:53): Giustina señala la fricción del WhatsApp en la gracias, Marco lo mueve a la landing del test. |
| 4 | **Stage nuevo solo en el pipeline Test Personalidad.** | El pipeline Webinar no tiene la señal del clic del email. Una columna vacía es ruido. Se replica si el webinar gana esa señal. |
| 5 | **No existe el vídeo VSL.** Se entrega con el hueco preparado y `video_guid` vacío. | Adrián lo tiene en su lista de grabación (reunión, 1:01:40). La página no se rompe sin él. |
| 6 | **Rótulo: "Lead cualificado"** (key `lead_cualificado`). | Es el término del recap final de Adrián (57:13): "se mueven a lead cualificado, como ha dicho JP". |

### Correcciones al borrador inicial del PRP

Dos cosas que el borrador tenía mal respecto a lo que se decidió en la reunión:

1. **Faltaba el Calendly en la página de gracias.** El borrador ponía un CTA hacia la landing del test. La reunión decidió Calendly embebido debajo del vídeo, visible desde el segundo 0 (57:45: "calendario embebido ahí directamente"; y 22:20, Pat: "yo lo pondría desde el principio"). Corregido.
2. **El disparador de la calificación era el clic en "Abrir el test" dentro de la landing.** La reunión decidió que es el **clic del botón del email** (48:26 y 57:09: "todos los que lleguen y toquen ese botón se mueven de pipeline"). Corregido: califica el endpoint de acceso, antes de aterrizar en la landing.

---

## Aprendizajes (Self-Annealing)

> Esta sección crece durante la implementación. Vacía hasta la Fase 1.

---

## Gotchas

- [ ] **`contacts_stage_check`**: si se inserta el stage en `pipeline_stages` pero no se amplía el CHECK, los UPDATE fallan en silencio y la ficha nunca sube de columna. Ya pasó (migración `20260615150000`). Ampliar el CHECK primero.
- [ ] **`STAGE_RANK` en `stage-guard.ts`**: si `lead_cualificado` no entra en la escalera, cae por la rama de "stage desconocido" y permitiría degradar a un `agendado`. Hay que insertarlo con rank 2 y correr los siguientes.
- [ ] **Pausa de plantilla y envío programado**: `sendEmail` comprueba `email_template_overrides.paused` en el momento de programar, no en el de entregar. Si Marco pausa la plantilla dentro de esos 7 minutos, el email igualmente sale. Documentarlo en el SOP 18.
- [ ] **El endpoint `abrir` nunca debe fallarle al lead**: si el token no resuelve, si la BD falla o si Meta falla, igualmente hace 302 a Equilibria. Marcar es secundario, abrir el test es lo principal.
- [ ] **Token en URL**: se usa `contacts.slug` (opaco, ya existente). No exponer nunca el UUID del contacto ni el email en la query string.
- [ ] **`get-settings.ts` con try/catch**: los campos nuevos siguen el mismo patrón, si la BD falla se cae a los defaults de `config.ts` y la landing no se rompe.
- [ ] **Bunny**: el reproductor va en `<iframe>` con `loading="lazy"` y aspecto 16:9; en móvil no debe desbordar el contenedor.
- [ ] **`/webs`**: `web_steps.slug` es el path absoluto sin barra inicial (`test-personalidad/test`). Si se pone mal, 404 (SOP 40).
- [ ] **Meta CAPI**: registrar el evento nuevo en los TRES sitios (`capi-client.ts`, `api/meta/capi/track`, `ads-events-service.ts`) o el Tracker lo muestra como desconocido.
- [ ] **No tocar Supabase Storage, credenciales ni cuentas externas** sin permiso explícito (reglas del Knowledge).

## Anti-Patrones

- NO crear una tabla de cola de emails ni un cron nuevo si `scheduledAt` de Resend resuelve el caso.
- NO hardcodear copy de email en el `.tsx`: el override en BD es la fuente de verdad (`/email-marketing`).
- NO inventar stages fuera de los canónicos del SOP 13 (este PRP añade uno, y queda documentado ahí).
- NO cambiar el copy aprobado de la landing v1 sin que Marco lo pida.
- NO usar guion largo, emojis ni flechas tipográficas en el copy del producto (REGLAS 7 y 8).
- NO usar colores fuera del brandkit: monocromo mas verde `#22C55E`.
- NO dar por bueno nada sin verificarlo en producción con Playwright.

---

*PRP aprobado. Fuente de negocio: transcript `Transcript-ch-marketing-funnel-ht` (reunión Capital Hub, 18-jul-2026, Adrián + Marco + Pat + JP + Giustina).*
