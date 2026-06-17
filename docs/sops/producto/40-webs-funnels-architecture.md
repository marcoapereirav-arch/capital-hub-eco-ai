---
title: Sistema de Webs/Funnels — arquitectura y convenciones
order: 40
area: producto
---

# Sistema de Webs y Funnels del OS

Cómo está construido el panel `/webs` y la convención **OBLIGATORIA** para que los links de cada landing funcionen sin 404.

## Para qué sirve

`/webs` es el panel donde Marco gestiona TODOS los embudos públicos (funnels, lead magnets, presentaciones). Por cada uno:
- Toggle Draft / Published
- Editor de nombre y slug del funnel
- Editor de nombre y slug de cada STEP
- Botones copiar / abrir cada landing

## Modelo de datos

### Tabla `webs`

```sql
id           text PRIMARY KEY  -- ej. 'web_funnel_test_personalidad'
type         text              -- 'funnel' | 'lead_magnet' | 'presentation' | 'other'
slug         text UNIQUE       -- nombre corto (para mostrar/agrupar). NO se usa en URLs reales.
name         text              -- nombre legible
description  text
status       text              -- 'draft' | 'published' | 'archived'
created_at   timestamptz
```

### Tabla `web_steps`

```sql
id           text PRIMARY KEY  -- ej. 'step_ftp_landing'
web_id       text REFERENCES webs(id)
slug         text              -- ⚠️ ES EL PATH ABSOLUTO desde la raíz del dominio
name         text              -- nombre legible del step
position     int               -- orden visual
is_entry     bool              -- true si es la entrada del funnel
description  text
```

## 🚨 CONVENCIÓN CRÍTICA — slug del step

**`web_steps.slug` es el path absoluto desde la raíz del dominio**, sin barra inicial.

### Correcto
```
step "Landing opt-in"  slug = 'test-personalidad'
step "Thank you"        slug = 'test-personalidad/gracias'
step "Login"            slug = 'login'
step "Olvidé contraseña" slug = 'forgot-password'
step "Checkout MIFGE"   slug = 'mifge/checkout'
```

### Incorrecto (lo que generaba 404)
```
step "Login" del funnel auth con slug='login' y web.slug='login'
→ URL final = /login/login → 404
```

### Por qué

La URL final se calcula con UNA SOLA concatenación:

```ts
url = `${publicBaseUrl}/${step.slug}`
```

No se concatena `web.slug` en medio. El campo `webs.slug` solo es agrupador interno.

## Cómo añadir un funnel nuevo

```sql
INSERT INTO webs (id, type, slug, name, description, status)
VALUES ('web_my_funnel', 'funnel', 'my-funnel', 'Mi Funnel', '...', 'draft');

INSERT INTO web_steps (id, web_id, slug, name, position, is_entry, description) VALUES
  ('step_entry',  'web_my_funnel', 'my-funnel',            'Landing',    1, true,  'Entrada'),
  ('step_thanks', 'web_my_funnel', 'my-funnel/gracias',    'Thank you',  2, false, 'Salida');
```

**Regla:** el `step.slug` siempre tiene que coincidir con la ruta real que existe en `src/app/(public)/.../page.tsx` o equivalente.

## Cómo añadir un step a un funnel existente

```sql
INSERT INTO web_steps (id, web_id, slug, name, position, is_entry, description)
VALUES ('step_X', '<web_id>', '<path-absoluto>', '<nombre>', <pos>, false, '<descripcion>');
```

Antes de insertar, **VERIFICAR** que la ruta `'<path-absoluto>'` exista en el código (sea pública o protegida según corresponda).

## Bug histórico — qué pasó y por qué nunca más

### 2026-06-17 — "Todas las landings dan 404 menos test-personalidad"

**Síntoma:** Marco al copiar el link de `/webs` → pegar en otro navegador → 404.

**Causa raíz:** `urlForStep()` en `web-card.tsx` concatenaba `web.slug` + `step.slug`:
```ts
// MAL (antes del fix)
const baseUrl = `${publicBaseUrl}/${web.slug}`
return `${baseUrl}/${stepSlug}`

// → /login/login, /test-personalidad/thanks (no existen)
```

**Por qué pasó:** la convención original era `web.slug` = nombre corto del funnel + `step.slug` = sub-path relativo. Funcionaba para MIFGE y LT8 porque sus rutas reales **eran** `/mifge/checkout`, `/lt8/checkout`. Pero falló para el funnel "Acceso al OS" (rutas reales son `/login`, `/forgot-password`, no `/login/login`).

**Fix definitivo (commit `8776640`):**
1. Migrar todos los slugs en BD a path absoluto desde la raíz
2. Simplificar `urlForStep` a `${publicBaseUrl}/${step.slug}` (sin concatenar `web.slug`)

**Cómo prevenirlo en el futuro:**
- ✅ Cuando crees un step nuevo, escribir el slug como el **path completo desde el dominio**
- ✅ Antes de crear el step, abrir esa URL en un navegador para confirmar que existe
- ✅ Si el funnel anida sub-rutas, incluir el prefijo en el slug del step (ej. `mifge/checkout` no solo `checkout`)
- ❌ NO usar nombres relativos como `landing`, `thanks`, `checkout` sin el prefijo del funnel

## Componentes implicados

- `/webs` página: `src/app/(main)/webs/page.tsx`
- UI cards: `src/features/webs/components/web-card.tsx` (editor inline de nombre+slug del funnel y de cada step)
- Endpoint funnel: `PATCH /api/admin/webs/[id]` (acepta `name`, `slug`, `description`, `status`)
- Endpoint step: `PATCH /api/admin/webs/[id]/steps/[stepId]` (acepta `name`, `slug`, `description`)
- Toggle draft/published: dentro del mismo endpoint del funnel

## Decisiones tomadas (histórico)

- **2026-06-15:** Eliminar pestaña "Llamadas" de `/webs` (calendario se gestiona en `/calendario`).
- **2026-06-16:** Editor de slug del funnel siempre visible (antes era hover, Marco no lo veía).
- **2026-06-16:** Editor de nombre del funnel inline (Marco quiere full libertad).
- **2026-06-17:** Editor de nombre + slug por STEP individual.
- **2026-06-17:** `step.slug` cambia convención → **path absoluto**. Bug raíz fixed.
