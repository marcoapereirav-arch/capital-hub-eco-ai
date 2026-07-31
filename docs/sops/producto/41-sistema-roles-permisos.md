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

**Notas importantes:**
- Lo que en sidebar se llama "Operaciones" mapea a la ruta `/overview`. `/contactos` se incluye junto a `/crm` porque es sub-CRM.
- **Cada item del sidebar es independiente.** Si `/webs/sistema` es un item separado en `nav-config`, NO se hereda del permiso de `/webs`. Marketing tiene `/webs` pero NO `/webs/sistema` ni `/webs/lead-magnets` — esos son items propios y necesitan estar explícitamente en la lista del rol.
- **Sub-rutas dinámicas SÍ heredan del padre.** `/webs/[funnelId]` (ficha de un funnel concreto) hereda del permiso de `/webs`. `/contactos/[id]` hereda de `/contactos`. Solo se considera "ítem hijo independiente" si tiene un href propio en el sidebar.

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

## 🚨 Checklist al añadir / cambiar un rol (regla operativa)

Cada vez que se añade un rol nuevo o se cambia un permiso, hay que sincronizar TODOS los lugares donde el rol aparece, INCLUYENDO la BD. Si no, el usuario verá descripciones viejas o las invitaciones fallarán silenciosamente.

Lugares a actualizar en el mismo commit:

1. **Código frontend / backend**
   - `src/lib/auth/role-access.ts` — `ROLE_ROUTES` (la fuente de verdad)
   - `src/features/team/components/team-page.tsx` — `ROLE_OPTIONS` (descripciones visibles al invitar / cambiar rol)
   - `src/app/api/admin/team/route.ts` — array `ROLES` del Zod schema (acepta el rol)
   - Cualquier otro componente que liste roles humanos
2. **BD constraints**
   - `public.profiles` → CHECK constraint `profiles_role_check` debe incluir el rol
   - `public.team_invitations` → CHECK constraint `team_invitations_role_check` debe incluir el rol
3. **Documentación**
   - Este SOP (lista de roles + permisos)

### Antípatrones que YA pasaron

- **2026-06-17:** cambié `role-access.ts` y dejé `team-page.tsx` con "Permisos pendientes de definir". Marco veía descripciones viejas al invitar.
- **2026-06-18:** mismo error pero con BD. Añadí `marketing` y `setter` al código pero el CHECK constraint de la BD solo aceptaba `super_admin/closer/formador/equipo`. Invitar a `marketing` fallaba con "Error guardando invitación" + dejaba un user huérfano en `auth.users` que bloqueaba reintentos. Migración `20260618093434_fix_role_check_constraints.sql` arregló el constraint. Cuando esto ocurra, **borrar el user huérfano** del intento fallido para que Marco pueda reintentar.

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

## "Ver como Rol" (admin impersona UI)

Cualquier `super_admin` / `admin` puede impersonar visualmente un rol no-admin para ver el OS exactamente como lo vería un marketing/formador/closer/setter.

### Cómo se usa
- Sidebar (footer, solo visible si rol real es admin) → dropdown "Ver como rol"
- Seleccionas: Marketing / Formador / Closer / Setter
- La UI se renderiza con los permisos de ese rol (sidebar filtrado, gate del proxy aplicado)
- Banner persistente arriba: "Vista impersonada · estás viendo el OS como X" + botón "Volver a vista admin"

### Cómo está implementado
- Cookie HttpOnly `view_as_role` (24h TTL) seteada por `POST /api/admin/view-as`
- Endpoint valida que el caller sea super_admin/admin → 403 si no
- Helper `getEffectiveRole(realRole, viewAsCookie)` en `src/lib/auth/role-access.ts`
- `proxy.ts` calcula el rol efectivo y aplica `canAccessRoute(effectiveRole, pathname)`
- `app/(main)/layout.tsx` calcula el rol efectivo y se lo pasa al sidebar como `userRole`. También pasa `realRole` para que el sidebar sepa si debe mostrar el dropdown.

### ⚠️ READ-ONLY de UI
- El override afecta SOLO el render del OS: sidebar visible, redirects del proxy, gates cosméticos.
- **Las mutaciones server-side (escritura en BD, endpoints admin) siguen verificándose contra el rol REAL del usuario.** Esto NO es impersonación real — es preview visual.
- Eso protege contra usar "Ver como Rol" para hacer cosas que no debería poder hacer un admin (ninguna, porque admin tiene acceso total, pero es buena disciplina).

## Decisiones tomadas

- **2026-06-16:** Roles definidos. Primera versión: marketing y formador con 8 secciones, closer/setter solo dashboard.
- **2026-06-16:** Gate aplicado en proxy (server-side) además del sidebar (cosmético) para defensa en profundidad.
- **2026-06-17:** Marco simplifica los accesos (SOP 05 sprint arreglos):
  - marketing: solo 4 secciones (dashboard + operaciones + CRM + webs)
  - formador: 3 secciones en OS + ADMIN en App para editar su formación
  - closer + setter: 3 secciones (dashboard + operaciones + CRM)
- **2026-06-17:** Confirmado que el formador en la App debe tener rol ADMIN (mapeo vía Magic Link Bridge cuando exista).


## La matriz de Equipo se deriva del menu (2026-07-31)

**El problema:** habia **dos listas de secciones escritas a mano**. Una en
`src/features/shell/components/nav-config.ts` (el menu lateral) y otra dentro de
`src/app/api/admin/role-permissions/route.ts` (la matriz de Equipo). Cada seccion
nueva habia que escribirla en los dos sitios.

Marco lo detecto al no poder dar acceso a Tutoriales: la seccion estaba en el
menu pero **no tenia fila en la matriz**, asi que no habia forma de concedersela
a ningun rol. Ademas la matriz arrastraba dos filas (`/contactos` sin entrada de
menu y una `/operaciones (alt)` duplicada) que ya no correspondian.

**El arreglo:** la segunda lista **desaparece**. La matriz se construye leyendo
`navSections` del menu. Cualquier seccion nueva aparece sola, para siempre.

Queda una unica excepcion, `RUTAS_SIN_MENU`, para pantallas a las que se llega
desde dentro de otra seccion y que aun asi necesitan permiso propio. Cada linea
dice por que existe. Hoy son dos: `/contactos` y `/operaciones`.

**No se hizo con una skill.** Marco pregunto si hacia falta crear una que
recordara actualizar la matriz al añadir una seccion. Una skill es un
recordatorio: sigue dependiendo de que alguien se acuerde. Borrar la lista
duplicada elimina la posibilidad del olvido. Mismo criterio que la regla de
fabrica: *una regla sin la maquina que la ejecuta no se cumple*.

**Tambien se quitaron los permisos escritos a mano** en el desplegable de
invitar (`ROLE_OPTIONS.desc` decia "Dashboard / Operaciones / CRM"). Esa frase
envejecia sola y acababa diciendo lo contrario de lo que hacia el sistema. Ahora
solo se anota lo que la matriz NO cubre (que super_admin lo ve todo, y que el
formador es administrador de su formacion en la App).

**`/perfil` no entra en la matriz** a proposito: es la ficha de cada uno y todo
el mundo tiene que poder abrir la suya.

**Comprobado** con `.test-artifacts/verificar-equipo.mjs`: se leen las secciones
del menu ya pintado, se comparan con las filas de la matriz, y se enciende y
apaga el acceso a Tutoriales comprobando que persiste tras recargar. Dos pasadas
en verde. La comprobacion falla a proposito si lee 0 secciones del menu: comparar
contra una lista vacia no comprueba nada.
