---
title: RLS y roles - regla para no romper la lectura
order: 11
---

# RLS + Roles — REGLA DE ORO para no volver a romper el OS

> El 5 jun 2026 el agente migró `profiles.role` de `'admin'` → `'super_admin'`
> sin actualizar las RLS policies. Resultado: Marco y Adrián vieron el OS vacío
> durante minutos porque cada query devolvía 0 filas. Para que NUNCA vuelva
> a pasar, antes de tocar el valor de un rol seguir estos 3 pasos.

## Por qué pasó

Supabase Auth + Postgres RLS funciona así:
- Cada tabla pública tiene policies que comparan `auth.uid()` y/o `role` del profile
- Si la policy dice `role = 'admin'` y tu profile.role pasa a `'super_admin'`,
  la policy **devuelve 0 filas** silenciosamente. NO da error 403, simplemente
  no devuelve datos.
- El frontend cree que "la BD está vacía" cuando en realidad el filtro RLS
  te bloqueó.

## ANTES de renombrar un valor de rol, comprobar 3 sitios:

### 1. Funciones SECURITY DEFINER de Postgres
Cualquier función tipo `is_admin()`, `is_super_admin()`, `is_closer()` que se
use en policies. Hay que recrearlas para aceptar el nuevo valor.

```sql
-- Comprobar qué funciones existen
select proname, prosrc
from pg_proc
where prosrc like '%role%' and pronamespace = 'public'::regnamespace;
```

### 2. Policies RLS con string literal
```sql
-- Buscar policies que comparan literal 'admin' (o el valor viejo)
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where qual like '%role%''admin''%' or with_check like '%role%''admin''%';
```

Recrearlas con `is_admin()` o con `role IN ('super_admin', 'admin')`.

### 3. Código frontend/backend con comparaciones literal
```bash
grep -rn "role.*'admin'\|role.*\"admin\"\|role === \"admin\"" src \
  --include="*.ts" --include="*.tsx" | grep -v super_admin
```

Sitios típicos a chequear:
- `src/app/(main)/<ruta>/page.tsx` — guards de página con `if (role !== 'admin') notFound()`
- `src/features/shell/components/user-menu.tsx`, `mobile-bottom-nav.tsx` — labels
- `src/features/*/lib/require-admin.ts` — guards de endpoints API
- Middleware si lo hay (`middleware.ts`)

## Patrón recomendado: helper centralizado

En lugar de hardcodear el rol en 30 sitios, usar un solo helper:

```ts
// src/lib/auth/roles.ts
export const ADMIN_ROLES = ['super_admin', 'admin'] as const
export type AdminRole = typeof ADMIN_ROLES[number]

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role)
}
```

Y en Postgres:
```sql
-- Usar siempre is_admin() en lugar de role = 'admin' en policies
-- is_admin() acepta ambos roles + chequea active=true
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin')
      and coalesce(active, true) = true
  )
$$;
```

Si cambia la taxonomía de roles, **solo se modifica una función + una constante**.

## Test de smoke ANTES de mergear migración que toque roles

```sql
-- 1. ¿is_admin() devuelve true para los usuarios admin reales?
select email, role, public.is_admin() as is_admin_check
from public.profiles
where role in ('super_admin', 'admin');

-- 2. ¿Cuántas policies hardcodean 'admin' literal?
select count(*)
from pg_policies
where (qual like '%role%''admin''%' or with_check like '%role%''admin''%')
  and qual not like '%is_admin%';
-- Si > 0, no mergear hasta arreglarlas.

-- 3. ¿Hay funciones SECURITY DEFINER que comparan rol literal?
select proname
from pg_proc
where prosrc like '%role%''admin''%'
  and pronamespace = 'public'::regnamespace
  and proname != 'is_admin';
```

## Síntoma del bug si vuelve a pasar

- Usuario hace login OK
- Cookie de sesión presente
- API routes con service_role funcionan (porque NO usan RLS)
- Browser queries via cliente anon JS devuelven `[]` para todo
- En consola del browser NO hay errores, solo respuestas con 0 rows
- El usuario cree que se borró todo

**Diagnóstico rápido:**
```bash
# Conectar como Marco (logueado) en browser DevTools:
# Network tab → ver respuestas de Supabase REST → verificar que llegan vacías
# Si llegan vacías pero los datos están en BD via Management API → BUG DE POLICY
```

## Migración 0029 — lecciones

La migración que rompió todo cambió:
1. `update public.profiles set role = 'super_admin' where role = 'admin'` ← causó la bomba
2. Constraint check actualizado para no admitir 'admin' como valor válido nuevo

Lo que faltaba haber hecho en la misma migración:
1. Actualizar `is_admin()` para aceptar ambos roles (o solo super_admin)
2. Buscar todas las policies con literal 'admin' y recrearlas
3. Smoke test de las 3 queries arriba antes de cerrar la migración

## Recordatorio: las policies en `storage.objects`

Las policies del schema `storage` (buckets de archivos) también pueden tener
literal `role='admin'`. No olvidarlas. Migration 0030 las arregló.
