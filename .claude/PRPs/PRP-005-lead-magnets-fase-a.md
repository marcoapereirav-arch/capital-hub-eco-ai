# PRP-005 — Lead Magnets · Fase A (entorno)

**Estado:** propuesto, pendiente aprobación de Marco para arrancar `/bucle-agentico`.
**Fecha:** 2026-05-06.
**SOP de referencia:** [`docs/sops/marketing/06-lead-magnets.md`](../../docs/sops/marketing/06-lead-magnets.md).
**Decisiones cerradas:** ya versionadas en el SOP. No se vuelven a debatir aquí.

---

## 1. Objetivo

Construir el **entorno completo** que permite convertir un comentario en Instagram en un lead identificado dentro del CRM, automáticamente y con tracking end-to-end (Reel → comentario → DM → email → recurso → CRM stage Lead → CAPI a Meta).

**Esta Fase NO crea ningún lead magnet específico.** Crea la infraestructura sobre la que después se publicarán N lead magnets sin tocar código nuevo.

---

## 2. Comportamiento esperado al final de Fase A

1. Adrián publica el flow "Lead Magnet Router" en ManyChat (UNA sola vez, tarea `t_manychat_connect_panel`).
2. En el OS, Marco/Claude pueden insertar registros en `lead_magnets` vía SQL o vía `/webs/lead-magnets` (UI admin).
3. Cuando alguien comenta una keyword registrada en un Reel:
   - ManyChat dispara su flow → External Request a `/api/manychat/lm-router`.
   - El OS resuelve el match, crea/actualiza el lead en stage `lead`, registra delivery con JWT, dispara CAPI.
   - El OS devuelve `delivery_link` que ManyChat envía por DM.
4. El usuario clica el link → `/lm/<slug>?t=<jwt>` valida, marca `opened_at`, sirve el recurso.
5. El lead aparece en `/crm` columna "Lead" con badge 🧲 mostrando el lead magnet de origen.
6. Si después activa free trial vía Whop, el badge persiste en su ficha hasta WON (atribución first-touch).
7. El dashboard muestra KPI 0 mini-funnel agregado.

---

## 3. Modelo de datos final

```sql
-- mifge_leads (alterado)
ALTER TABLE mifge_leads DROP CONSTRAINT mifge_leads_pipeline_stage_check;
ALTER TABLE mifge_leads ADD CONSTRAINT mifge_leads_pipeline_stage_check
  CHECK (pipeline_stage IN ('lead', 'free_trial', 'agendados', 'no_show', 'no_agendados',
                             'won_ano', 'won_mes', 'pago_fallido', 'beta'));
ALTER TABLE mifge_leads ALTER COLUMN pipeline_stage SET DEFAULT 'lead';
ALTER TABLE mifge_leads ADD COLUMN first_touch_lead_magnet_id uuid REFERENCES lead_magnets(id);
ALTER TABLE mifge_leads ADD COLUMN lead_source text CHECK (lead_source IN ('manychat', 'web_form', 'api', 'direct_url'));
ALTER TABLE mifge_leads ADD COLUMN manychat_subscriber_id text UNIQUE;

-- lead_magnets (nueva)
CREATE TABLE public.lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  delivery_kind text NOT NULL CHECK (delivery_kind IN ('static', 'dynamic')),
  delivery_asset_url text,
  delivery_route text,
  manychat_keywords text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- lead_magnet_deliveries (nueva, pivote)
CREATE TABLE public.lead_magnet_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES mifge_leads(id) ON DELETE CASCADE,
  lead_magnet_id uuid NOT NULL REFERENCES lead_magnets(id) ON DELETE RESTRICT,
  reel_post_id text,
  manychat_subscriber_id text,
  jwt_token text NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz
);

CREATE INDEX idx_lmd_lead ON lead_magnet_deliveries(lead_id, delivered_at DESC);
CREATE INDEX idx_lmd_lm ON lead_magnet_deliveries(lead_magnet_id, delivered_at DESC);

-- RLS admin-only en ambas tablas nuevas (igual patrón que el resto del OS).
```

---

## 4. Plan por fases (ordenado por dependencias)

Cada fase = una tarea del board ya creada con `para_id = 'p_lead_magnets'`.

### Fase A1 — BD (`t_lm_db_migration`)
- Migración Supabase con todo el SQL de la sección 3.
- Verificación: query `SELECT pipeline_stage, COUNT(*) FROM mifge_leads GROUP BY pipeline_stage` no rompe.
- Sin downtime — los leads existentes se quedan en su stage actual (`free_trial`, etc.).

### Fase A2 — CAPI events (`t_lm_capi_events`)
- Extender `src/features/ads/services/ads-events-service.ts` con `mifge_lead_magnet_optin` + `mifge_lm_<slug>`.
- Verificación: test con `META_TEST_EVENT_CODE` desde panel `/ads → Configuración`. Los eventos aparecen en pestaña "Probar eventos" de Meta Events Manager.

### Fase A3 — Endpoint router (`t_lm_router_endpoint`)
- POST `/api/manychat/lm-router` con auth Bearer.
- Lógica completa de match keyword → upsert lead → insert delivery → CAPI → JWT.
- Verificación: curl con body de prueba responde 200 con `delivery_link` válido cuando hay match, `{matched: false}` cuando no.

### Fase A4 — Página entrega (`t_lm_delivery_page`)
- Ruta `src/app/(public)/lm/[slug]/page.tsx`.
- Validación JWT, marca `opened_at`, sirve recurso (genérico para MVP, especializa después).
- Verificación: link generado por endpoint A3 abre la página correctamente. Sin token o token inválido → 404.

### Fase A5 — Admin CRUD (`t_lm_admin_crud`)
- `/webs/lead-magnets` con lista, detalle, form crear/editar.
- Mobile-first.
- Verificación: crear LM de prueba "Test LM" desde la UI. Aparece en lista. Edit/delete funciona.

### Fase A6 — Stage Lead en CRM (`t_lm_crm_stage_lead`)
- Añadir columna "Lead" al kanban `/crm`.
- Cards con badge 🧲, drill-down con histórico de LMs descargados.
- Realtime subscription.
- Verificación: insertar lead con `stage='lead'` en BD → aparece en la columna en vivo.

### Fase A7 — KPI dashboard (`t_lm_kpi_dashboard`)
- Mini-funnel 5 pasos en `/dashboard`.
- Agregado de todos los LMs activos.
- Verificación: con datos de prueba en BD, el funnel muestra los counts correctos.

---

## 5. Dependencias entre fases

```
A1 (BD) ─┬─→ A3 (router) ─┬─→ A6 (CRM stage)
         │                  └─→ A7 (KPI dashboard)
         ├─→ A4 (delivery page)
         ├─→ A5 (admin CRUD)
         │
A2 (CAPI) ┘
```

**A1 y A2 son independientes** y se pueden ejecutar en paralelo.
**A3 depende de A1 y A2.**
**A4, A5, A6 dependen solo de A1** — pueden correr en paralelo después de A1.
**A7 depende de A3** (necesita el endpoint para que haya datos reales).

---

## 6. Lo que NO está en Fase A

- **Crear lead magnets específicos** (Test Vocacional, Calculadora ingresos, etc.) — eso es Fase B, después de validar el entorno.
- **Filtro nivel C (Instagram OAuth)** — tarea `t_lm_acceso_instagram_oauth` en Someday.
- **Configuración real del flow en ManyChat** — tarea `t_manychat_connect_panel` (Adrián), bloqueada por A3.
- **Métricas avanzadas Meta Insights** (gasto, ROAS, CAC por LM) — bloqueado por `t_sms_2fa_meta_ads` (Marco).

---

## 7. Validación end-to-end al cerrar Fase A

Test de aceptación: simular flujo completo sin necesidad de un Reel real ni de configurar ManyChat.

1. Crear LM de prueba en BD: slug `lm-test`, keyword `TESTLM`, delivery_kind `dynamic`, delivery_route `/lm/lm-test`.
2. POST a `/api/manychat/lm-router` con body simulando comentario:
   ```json
   { "subscriber_id": "fake_001", "ig_username": "test_user",
     "first_name": "Test", "comment_text": "TESTLM",
     "comment_id": "cmt_001", "post_id": "post_001" }
   ```
3. Verificar response: `{ matched: true, delivery_link: "..." }`.
4. Verificar BD: `mifge_leads` tiene nueva row con `stage='lead'`, `lead_source='manychat'`, `first_touch_lead_magnet_id` apuntando al LM, `manychat_subscriber_id='fake_001'`.
5. Verificar BD: `lead_magnet_deliveries` tiene la row con JWT, `opened_at=null`.
6. Abrir `delivery_link` en navegador → ver página `/lm/lm-test`.
7. Re-query: `lead_magnet_deliveries.opened_at != null`.
8. Verificar Meta Events Manager → pestaña "Probar eventos" → llegaron `mifge_lead_magnet_optin` y `mifge_lm_lm_test`.
9. Abrir `/crm` → ver la card en columna "Lead" con badge 🧲 "lm-test".
10. Abrir `/webs/lead-magnets/lm-test` → ver el opt-in registrado.
11. Abrir `/dashboard` → ver KPI 0 con count 1 en pasos "Email capturado" y "Recurso abierto".

Si los 11 pasos pasan → Fase A cerrada. Se desbloquea `t_manychat_connect_panel` (Adrián configura ManyChat real) y se puede arrancar Fase B (primer lead magnet de verdad).

---

## 8. Riesgos / abiertos para revisar antes de ejecutar

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | El `JWT_SECRET` para firmar tokens — ¿uso `MANYCHAT_WEBHOOK_SECRET` existente o creo `LM_JWT_SECRET` dedicado? | Recomendación: dedicado (`LM_JWT_SECRET`). Más limpio, menos blast-radius si se rota. Adrián lo añade a Vercel cuando se ejecute A3. |
| 2 | El `default 'lead'` en `pipeline_stage` cambia el comportamiento del webhook Whop existente | Revisar `/api/whop/webhook`: cuando llega `membership_activated`, debe hacer UPDATE forzando `stage='free_trial'` (no INSERT con default). Verificar en A1 que esto sigue siendo el caso. |
| 3 | Si dos personas comentan al mismo tiempo la misma keyword desde diferentes posts, ¿cómo se atribuye el `reel_post_id`? | Cada `lead_magnet_delivery` lleva su propio `reel_post_id`. Atribución por delivery, no por lead. El lead solo tiene `first_touch_lead_magnet_id` (qué LM, no qué post). Si Marco quiere "first_touch_reel_id" también, decirlo antes de A1 para añadirlo en la migración. |
| 4 | Convención de keywords case-insensitive | El endpoint normaliza con `.toLowerCase().trim()` antes de buscar. La columna `manychat_keywords text[]` también guarda lowercase. |

---

## 9. Cuándo arrancar

Con tu green light. Yo ejecuto vía `/bucle-agentico` con commits + push por fase. Cada fase = un commit independiente para que puedas validar incremental. Sin tu OK, no arranco.
