---
title: Lead Magnets — flow end-to-end
order: 6
---
> # RETIRADO el 2026-08-07
>
> Los lead magnets se retiraron del OS entero: la pantalla, la entrada publica `/lm/<slug>`,
> el motor de entrega, el envio de eventos a Meta y el enlace de ManyChat.
>
> Marco: *"no funciona, no la estamos utilizando y por ende no tiene sentido tenerla ahi.
> Elimina lead magnet de raiz. Ya cuando vayamos a construirlo, lo construiremos"*.
>
> Comprobado antes de borrar: **1 lead magnet y 1 entrega** en toda la base.
>
> Se quedaron a proposito: las tablas de la base, el evento de Meta
> `mifge_lead_magnet_optin` (es historial de medicion ya enviado a Facebook, y quitarlo del
> catalogo romperia la lectura de lo que ya se disparo) y el tipo de web `lead_magnet`,
> porque hay webs guardadas con ese tipo.
>
> Lo de abajo queda como historico, por si algun dia se retoma.


# Lead Magnets — captura, entrega, atribución

SOP que define el sistema completo de lead magnets: cómo se capturan leads desde Instagram (comments → ManyChat → DM), cómo se entrega el recurso, cómo se trackea cada paso y cómo se atribuye a un Reel y a un anuncio Meta.

## Propósito

**Convertir un comentario en Instagram en un lead identificado dentro del CRM, automáticamente.**

Eso es todo. Los lead magnets son la **capa previa al free trial MIFGE**: capturan al avatar Andrés ANTES de que esté listo para meter tarjeta. Bajan el CAC, amplían el TOFU del funnel y añaden el escalón intermedio que hoy no existe entre "ve el anuncio/Reel" y "mete tarjeta".

## Decisiones cerradas (no se vuelven a debatir)

| Decisión | Valor |
|---|---|
| Stage del CRM al que entran los opt-ins | `lead` (nuevo stage 1, sin automatización de salida) |
| Atribución cuando el lead descarga 2+ LMs | **First-touch** (`first_touch_lead_magnet_id` nunca se sobreescribe) + lista cronológica completa visible al expandir la ficha |
| Dónde se entrega el recurso | **Siempre dentro de nuestro ecosistema**, slug interno (`os.capitalhubapp.com/lm/<slug>`). Nunca Drive, Notion ni links externos |
| Filtro anti-compartir el link del recurso | **Nivel A** (token JWT firmado por lead) en MVP. Diseñado pensando en Nivel C (Instagram OAuth + match con username) que va a Someday |
| Quién crea el lead magnet | **El agente Claude** (yo) en el 99% de los casos vía chat. Existe botón manual en `/webs/lead-magnets` para emergencias |
| Cuándo Adrián toca ManyChat | **UNA SOLA VEZ** en setup inicial (configura el flow "Lead Magnet Router"). Después nunca más |
| Naming keyword en ManyChat | Libre por LM, decidida en función de la palabra que se diga en el contenido. La tabla `lead_magnets.manychat_keywords` es array para soportar varias keywords por LM |
| Eventos Meta CAPI | 2 por opt-in: `mifge_lead_magnet_optin` (agregado) + `mifge_lm_<slug>` (granular). Ver SOP `marketing/05-tracking-meta` |

## Arquitectura del sistema

```
[Marco / Adrián piensan un lead magnet nuevo]
   │
   ▼
[Marco le dice a Claude en chat: "crea LM X con keyword Y"]
   │
   ▼
[Claude]
   ├─ Inserta en tabla lead_magnets (nombre, slug, recurso, keywords, activo)
   ├─ Construye página /lm/<slug> (estática si PDF; dinámica si quiz/calculadora)
   ├─ Registra evento CAPI mifge_lm_<slug> en Meta Events Manager
   └─ Commit + push
   │
   ▼
[Adrián publica Reel diciendo "comenta KEYWORD"]
   │
   ▼ (a partir de aquí, automático)
[Usuario comenta "KEYWORD" en el post]
   │
   ▼
[ManyChat detecta comment con su trigger nativo]
   ├─ Flow "Lead Magnet Router" (configurado UNA vez)
   └─ External Request → POST /api/manychat/lm-router
       body: { subscriber_id, ig_username, first_name, comment_text, comment_id, post_id }
   │
   ▼
[OS — endpoint /api/manychat/lm-router]
   ├─ Valida Bearer MANYCHAT_WEBHOOK_SECRET
   ├─ Busca lead_magnet activo con keyword == comment_text (lower, trim)
   ├─ Si NO match → return { matched: false }
   ├─ Si match:
   │    1. Upsert mifge_leads:
   │       - email = (vacío hasta que ManyChat lo recoja en step posterior)
   │       - manychat_subscriber_id, ig_username, first_name
   │       - pipeline_stage = 'lead' (default)
   │       - first_touch_lead_magnet_id = LM.id (solo si NULL — never overwrite)
   │       - lead_source = 'manychat'
   │    2. Insert lead_magnet_deliveries:
   │       - lead_id, lead_magnet_id, reel_post_id, jwt_token, delivered_at = now
   │    3. Genera JWT firmado con { lead_id, lm_id, exp: +30d }
   │    4. Dispara CAPI: mifge_lead_magnet_optin + mifge_lm_<slug>
   │    5. Return { matched: true, delivery_link: "/lm/<slug>?t=<jwt>" }
   │
   ▼
[ManyChat recibe response]
   ├─ Conditional: si matched=true → enviar DM con delivery_link
   └─ Conditional: si matched=false → terminar flow (no hacer nada)
   │
   ▼
[Usuario clica el link en el DM]
   │
   ▼
[Página /lm/<slug>?t=<jwt>]
   ├─ Valida JWT (firma, expiración, lead_id existe)
   ├─ Marca lead_magnet_deliveries.opened_at = now (idempotente)
   ├─ Sirve el recurso (PDF, quiz, herramienta)
   └─ Si JWT inválido o vencido → 404 / mensaje "este link no es válido o ha expirado"
   │
   ▼ [El lead se queda en stage 'lead' indefinidamente hasta que active free trial]
   ▼
[Si en algún momento activa free trial via Whop]
   ├─ Webhook Whop /api/whop/webhook detecta membership_activated
   ├─ Busca mifge_leads por email → match
   ├─ pipeline_stage: 'lead' → 'free_trial'
   ├─ first_touch_lead_magnet_id se conserva → el badge 🧲 sobrevive todo el journey
   └─ A partir de aquí, automatización MIFGE existente toma el control
       (ver SOP marketing/01-pipeline-mifge)
```

## Workflow operativo — cómo se crea un lead magnet (paso a paso)

### Setup inicial (UNA SOLA VEZ — ya casi todo hecho)

| # | Quién | Acción | Estado |
|---|---|---|---|
| 0a | Claude (Marco) | Construir entorno completo (BD, endpoint, /lm, admin /webs/lead-magnets, CAPI) | ⏳ Fase A |
| 0b | Adrián | Configurar UNA vez en ManyChat el flow "Lead Magnet Router" (External Request → OS) | ⏳ tarea `t_manychat_connect_panel`, bloqueada por 0a |

### Crear cada lead magnet nuevo (recurrente)

| # | Quién | Acción | Tiempo |
|---|---|---|---|
| 1 | Marco/Adrián | Decidir LM (formato + recurso) + keyword + qué Reel lo va a promocionar | mental |
| 2 | Marco | Decirle a Claude en chat: *"crea LM 'Test Vocacional', keyword TEST, quiz interactivo que diga al final si eres Closer/Setter/Media Buyer/Tech-IA/Marketer"* | 30 seg |
| 3 | Claude | Insert en `lead_magnets` · construir `/lm/<slug>` (estático o dinámico) · registrar CAPI `mifge_lm_<slug>` en Meta · commit + push | 10-30 min |
| 4 | Adrián | Subir el Reel diciendo "comenta KEYWORD para recibir el recurso" | 5 min |
| 5 | Adrián | **NO toca ManyChat.** El flow router ya configurado en 0b detecta automáticamente. | 0 min |
| 6 | Sistema | Cada comentario → DM con link → captura email → lead en CRM stage `lead` con badge 🧲 → CAPI a Meta | automático |

**Lead magnet #2, #3, #N → solo pasos 1-4. Cero infraestructura nueva, cero ManyChat, cero env vars.**

## Modelo de datos

### Tabla `lead_magnets`

```sql
CREATE TABLE public.lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,                  -- ej: 'test-vocacional'
  name text NOT NULL,                          -- ej: 'Test Vocacional Digital'
  description text,
  delivery_kind text NOT NULL CHECK (delivery_kind IN ('static', 'dynamic')),
                                               -- static = PDF/imagen servida con auth
                                               -- dynamic = página interactiva (quiz, herramienta)
  delivery_asset_url text,                     -- si static: URL del PDF en Storage
  delivery_route text,                         -- si dynamic: ruta interna (ej: /lm/test-vocacional)
  manychat_keywords text[] NOT NULL DEFAULT '{}',  -- array para soportar varias keywords
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Tabla `lead_magnet_deliveries` (pivote)

```sql
CREATE TABLE public.lead_magnet_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES mifge_leads(id) ON DELETE CASCADE,
  lead_magnet_id uuid NOT NULL REFERENCES lead_magnets(id) ON DELETE RESTRICT,
  reel_post_id text,                           -- post de IG que generó el opt-in (si lo conocemos)
  manychat_subscriber_id text,
  jwt_token text NOT NULL,                     -- token firmado para acceder al recurso
  delivered_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz                        -- null hasta que el usuario clica el link
);

CREATE INDEX idx_lmd_lead ON lead_magnet_deliveries(lead_id, delivered_at DESC);
CREATE INDEX idx_lmd_lm ON lead_magnet_deliveries(lead_magnet_id, delivered_at DESC);
```

### Cambios en `mifge_leads`

```sql
-- Stage 'lead' añadido al CHECK enum
ALTER TABLE mifge_leads DROP CONSTRAINT mifge_leads_pipeline_stage_check;
ALTER TABLE mifge_leads ADD CONSTRAINT mifge_leads_pipeline_stage_check
  CHECK (pipeline_stage IN ('lead', 'free_trial', 'agendados', 'no_show', 'no_agendados',
                             'won_ano', 'won_mes', 'pago_fallido', 'beta'));

-- Default cambiado a 'lead' (entrada por LM es lo más frío)
ALTER TABLE mifge_leads ALTER COLUMN pipeline_stage SET DEFAULT 'lead';

-- Columnas nuevas
ALTER TABLE mifge_leads ADD COLUMN first_touch_lead_magnet_id uuid REFERENCES lead_magnets(id);
ALTER TABLE mifge_leads ADD COLUMN lead_source text CHECK (lead_source IN ('manychat', 'web_form', 'api', 'direct_url'));
ALTER TABLE mifge_leads ADD COLUMN manychat_subscriber_id text UNIQUE;
```

## Filtro anti-compartir el link (Nivel A — MVP)

### Cómo funciona

El DM de ManyChat envía `https://os.capitalhubapp.com/lm/<slug>?t=<jwt>`. El JWT está firmado con `MANYCHAT_WEBHOOK_SECRET` (o un secret dedicado `LM_JWT_SECRET`) y lleva:

```json
{
  "lead_id": "uuid",
  "lm_id": "uuid",
  "iat": 1234567890,
  "exp": 1234567890   // delivered_at + 30 días
}
```

Cuando alguien abre la URL:
- Sin `t=` → 404
- `t=` inválido (firma rota, expirado, lead/lm no existe) → mensaje "Este enlace no es válido o ha expirado"
- `t=` válido → marca `opened_at` (idempotente, solo primer abrir) + sirve el recurso

### Por qué no Nivel C (Instagram OAuth) ahora

Nivel C requeriría que el usuario haga login con Instagram para validar que su username está en nuestra base. Es la opción más robusta (impide compartir 100%) pero añade fricción al recurso gratis y complejidad técnica significativa.

**Decisión:** vamos con A en MVP. Nivel A filtra el 90% del abuso (link compartido en grupo de WhatsApp con misma URL no funciona porque cada lead tiene su propio token). Si en 3 meses vemos abuso real → activamos C, ya está la columna `instagram_user_id` preparada en `mifge_leads` desde día 1.

### Tarea Someday: `t_lm_acceso_instagram_oauth`

Implementar Nivel C cuando lo demande el caso. NO es parche — el endpoint actual ya tiene `if (FEATURE_INSTAGRAM_AUTH)` preparado para flip de flag.

## Métricas — paneles independientes + agregado

| Panel | Qué muestra | Dónde vive |
|---|---|---|
| **Por lead magnet** | Mini-funnel 5 pasos · CAC · % a free trial · % a WON · histórico | `/webs/lead-magnets/<slug>` |
| **Por stage del pipeline** | Total leads en cada stage (incluyendo `lead`) · tiempo medio · tasa de salida | `/crm` (drill-down columna) |
| **Por funnel/web** | Conversion de cada landing pública | `/webs/<slug>` |
| **General agregado** | KPI 0 mini-funnel + 5 KPIs MIFGE + roll-up canales | `/dashboard` |

## Configuración ManyChat (lo que toca a Adrián UNA vez)

Ver tarea `t_manychat_connect_panel` para los pasos extremadamente detallados. Resumen funcional (no UI literal — los nombres exactos de los bloques pueden variar en ManyChat según versión/idioma — REGLA #4):

1. Crear nuevo Flow "Lead Magnet Router".
2. Trigger: cualquier comentario en cualquier post de IG.
3. Step 1: External Request → POST `https://os.capitalhubapp.com/api/manychat/lm-router` con Bearer auth.
4. Step 2: Conditional sobre `lm_matched` recibido.
5. Step 3 (si matched): DM con `{{lm_delivery_link}}`.
6. Step 4 (opcional): tag `lead_magnet_optin`.
7. Activar.

**Toggle "Only deliver if user follows account"** (nombre puede variar) — activarlo en este flow para forzar follow antes de entregar el recurso. Es feature nativa de ManyChat, no requiere código.

## Cambios versionados

- **2026-05-06 (v1)**: SOP creado con la arquitectura completa, decisiones cerradas, modelo de datos y workflow operativo. Aún no implementado — pendiente Fase A del PRP `prp-lead-magnets.md`. Tarea Adrián `t_manychat_connect_panel` actualizada a `waiting` con pasos detallados, bloqueada por Fase A.
