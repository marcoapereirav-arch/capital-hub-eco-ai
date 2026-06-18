---
title: Sistema de roles y permisos del OS
order: 41
area: producto
---

# Roles y permisos del OS

Cómo se gestiona quién ve qué dentro del panel interno.

## Roles definidos (actualizado 2026-06-18 SOP 05)

| Rol | OS (qué ve) | App (qué rol/permiso tiene) |
|---|---|---|
| `super_admin` / `admin` | TODO el OS + dropdown "Ver como Rol" | ADMIN total |
| **`marketing`** | dashboard · operaciones · CRM (con contactos) · webs | (sin acceso o lectura, por confirmar) |
| **`formador`** | dashboard · operaciones · CRM (con contactos) | **ADMIN** — puede editar su formación |
| **`closer`** | dashboard · operaciones · CRM (con contactos) | (sin acceso o lectura, por confirmar) |
| **`setter`** | dashboard · operaciones · CRM (con contactos) | (sin acceso o lectura, por confirmar) |

**Nota formador en App:** cuando clica "Ir a App" desde el OS entra con su mismo usuario (vía Magic Link Bridge cuando Adrián termine la Edge Function). Mapeo: `profiles.role = 'formador'` (OS) → `auth.users.raw_user_meta_data.role = 'ADMIN'` (App).

## Implementación

### 1. Mapa de rutas por rol

Archivo: `src/lib/auth/role-access.ts`

```ts
export const ROLE_ROUTES: Record<Role, string[] | "*"> = {
  super_admin: "*",
  admin: "*",
  marketing: ["/dashboard", "/overview", "/operaciones", "/crm", "/contactos", "/webs"],
  formador:  ["/dashboard", "/overview", "/operaciones", "/crm", "/contactos"],
  closer:    ["/dashboard", "/overview", "/operaciones", "/crm", "/contactos"],
  setter:    ["/dashboard", "/overview", "/operaciones", "/crm", "/contactos"],
}
```

**Nota:** lo que en sidebar se llama "Operaciones" mapea a la ruta `/overview`. `/contactos` se incluye junto a `/crm` porque es sub-CRM.

### 2. Sidebar filtra items

`src/features/shell/components/app-sidebar.tsx` filtra `nav-config.ts` según `canAccessRoute(role, item.href)`. Grupo entero se oculta si quedan 0 items.

`mobile-bottom-nav.tsx` filtra `navPrimary` y `navSecondary` igual.

### 3. Proxy bloquea acceso directo

`src/lib/supabase/proxy.ts`:

```ts
if (user && !pathname.startsWith('/api/') && !pathname.startsWith('/auth/') && !isAuthRoute) {
  const profile = await fetchProfile(user.id)
  if (!canAccessRoute(profile.role, pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

Esto significa que aunque alguien intente abrir `/equipo` siendo `marketing`, el server lo redirige a `/dashboard`. Defensa en server-side, no solo cosmética en cliente.

## Cómo añadir un rol nuevo

1. Editar `src/lib/auth/role-access.ts`:
   - Añadir el rol al tipo `Role`
   - Añadir entrada al `ROLE_ROUTES` con sus rutas
2. (Opcional) Añadir el rol al constraint de la columna `profiles.role` si tiene check
3. Actualizar `team-page.tsx` ROLE_OPTIONS para que aparezca al invitar
4. Documentar en este SOP qué secciones ve

## Cómo añadir una ruta nueva al OS

1. Crear `src/app/(main)/<ruta>/page.tsx`
2. Añadir entrada en `src/features/shell/components/nav-config.ts`
3. **IMPORTANTE:** decidir quién la ve. Si nadie del equipo la necesita, basta con super_admin. Si la necesitan marketing/formador, añadirla a sus prefijos en `ROLE_ROUTES`.
4. Verificar con un usuario test del rol que la ve / no la ve según diseño.

## Flow de invitación al equipo

Documentado en SOP separado: ver `42-flow-invitaciones-equipo.md`.

## Decisiones tomadas

- **2026-06-16:** Roles definidos. Primera versión: marketing y formador con 8 secciones, closer/setter solo dashboard.
- **2026-06-16:** Gate aplicado en proxy (server-side) además del sidebar (cosmético) para defensa en profundidad.
- **2026-06-17:** Marco simplifica los accesos (SOP 05 sprint arreglos):
  - marketing: solo 4 secciones (dashboard + operaciones + CRM + webs)
  - formador: 3 secciones en OS + ADMIN en App para editar su formación
  - closer + setter: 3 secciones (dashboard + operaciones + CRM)
- **2026-06-17:** Confirmado que el formador en la App debe tener rol ADMIN (mapeo vía Magic Link Bridge cuando exista).
