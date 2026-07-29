---
title: App · Formador vs Administrador (identidad, permisos y alcance)
order: 55
area: producto
---

# Formador vs Administrador en la App

> Creado 2026-07-29. Nace de un fallo de Marco: "los formadores no pueden ver el
> widget de administrador". El widget era el síntoma; el problema era que **la
> App no sabía quién era formador**.

---

## La regla, en una línea

**Un formador es un `ADMIN` que tiene `users.formacion_asignada`. Un super admin
es un `ADMIN` que NO la tiene.**

No existe un rol "formador" en la base. Marco, Adrián y los formadores comparten
`role = 'ADMIN'`; lo único que los separa es ese campo.

| Quién | `role` | `formacion_asignada` | Puede |
|---|---|---|---|
| Super admin (Marco, Adrián) | `ADMIN` | `null` | Todo |
| Formador (Juan Pablo, nagai) | `ADMIN` | `media-buyer-digital`, ... | **Solo su formación** |
| Equipo del OS | `USER` | - | Ve, no edita |
| Alumno | `REP` | - | Su formación comprada |

`PROFESSOR` existe en los tipos por herencia del port viejo: **ningún usuario real
lo tiene**. No usarlo como sinónimo de formador (ver el bug 2 de abajo).

---

## El fallo (2026-07-29)

### Bug raíz: la App leía la identidad del token, no de la base

`utils/session.ts` sacaba `role` y `formacion_asignada` de `user_metadata` del
JWT. En la base **ningún usuario tiene `formacion_asignada` en el token**: solo
está en `public.users` (comprobado: Juan Pablo la tiene en BD, en el token no).

Como en el navegador salía `formacion_asignada = null`, y eso es literalmente la
definición de super admin, **la App trataba a cada formador como si fuera Marco**.

De ahí salían tres cosas, todas reales:

1. El widget flotante "Ver como" (administración pura) le aparecía a los formadores.
2. `canEditFormacion()` devolvía `true` para todas las rutas: un formador podía
   editar las formaciones de los demás.
3. El panel `/admin` entero era alcanzable, **incluida la gestión de usuarios**
   (crear, borrar, cambiar roles).

### Bug 2: la previsualización enseñaba una pantalla que no existe

"Ver como Formador" ponía `role = 'PROFESSOR'`, un rol que **ningún formador
tiene**. Es decir, al comprobarlo se veía una pantalla inventada, no la del
formador real. Por eso el fallo pasó meses sin detectarse.

---

## Cómo quedó

### 1. Una sola fuente de identidad: `public.users`

Las tres capas leen del mismo sitio, así que no pueden discrepar:

| Capa | Cómo |
|---|---|
| Navegador | `AuthContext.cargarPerfil()` consulta `public.users` al abrir sesión |
| API (edge function) | `_shared/auth.ts` → `resolveActor()` |
| Base | `current_app_role()` y `mi_formacion_asignada()` |

`isLoading` no baja hasta tener el perfil real: si bajara antes, el formador
vería medio segundo la pantalla de administrador.

### 2. Tres candados, no uno

Esconder botones no es seguridad. **El editor de formación escribe DIRECTO a
Supabase con el anon key**, así que cualquiera con la consola del navegador
abierta se saltaba la UI. Por eso hay tres capas:

- **UI**: `useCanEdit()` expone `isSuperAdmin`, `isFormador`, `canEditFormacion(slug)`.
- **API**: `requireSuperAdmin()` para usuarios y rutas; `assertAlcance()` en
  formaciones, módulos y lecciones.
- **Base (la que manda)**: `puede_editar_ruta / formacion / modulo / leccion` en
  las policies de escritura. Migración `20260729140000_alcance_formador_rls.sql`.

### 3. Qué ve cada uno

| Pantalla | Super admin | Formador |
|---|---|---|
| Widget "Ver como" | Sí | **No** |
| `/admin/*` (rutas, usuarios, feedback) | Sí | **No** (`requireSuperAdmin`) |
| `/admin/formaciones` | Todas | **Solo la suya** |
| Ajustes del Home | "Gestionar formaciones · admin" | "Mi formación · formador" |

### 4. La previsualización, arreglada

"Ver como" ahora ofrece **Formador de \<cada ruta\>**, con identidad real
(ADMIN + esa formación). Marco puede ver exactamente lo que ve Juan Pablo.

El widget mira el rol **real**, no el efectivo: si mirara el efectivo,
desaparecería al activar la previsualización y el admin se quedaría atrapado.

---

## Verificación (hecha en producción, 2026-07-29)

**En la base**, simulando a Juan Pablo dentro de una transacción revertida:

| Intento | Resultado |
|---|---|
| Editar formación ajena (IA Integrator) | 0 filas (bloqueado) |
| Editar la suya (Media Buyer) | 1 fila (permitido) |
| Editar una ruta | 0 filas (bloqueado) |
| Super admin, formación ajena | 1 fila (permitido) |

**Por API**, poniéndole `formacion_asignada` a `test-agent` y quitándosela después:

| Llamada | Antes | Después |
|---|---|---|
| `GET /admin/users` | 403 a todos | **403 al formador**, 200 al super admin |
| `GET /admin/training/routes` | 403 a todos | **403 al formador**, 200 al super admin |
| `PUT` formación ajena | 403 a todos | **403 al formador** |
| `GET` lista de formaciones | 403 a todos | Formador ve **1 de 3** |

---

## Checklist al tocar permisos de la App

- [ ] ¿Estoy usando `role === 'ADMIN'` a secas? Casi siempre está mal: decide si
      es `isSuperAdmin` o `canEditFormacion(slug)`.
- [ ] ¿El candado está también en la base? Si solo está en la UI, no existe.
- [ ] ¿Lo he probado como el rol MÁS restringido? Siendo admin todo funciona y
      el fallo es invisible.
- [ ] ¿La previsualización simula una identidad que existe de verdad?

---

## Cambios versionados

### 2026-07-29 — Creación
Fallo reportado por Marco. Causa raíz: identidad leída del JWT en vez de
`public.users`. Arreglado en las tres capas, previsualización de formador
rehecha, y verificado en producción por simulación (base) y por llamadas reales
(API). Commits App `c1f512f`. Relacionado: SOP [`producto/50`](50-app-alumnos-auditoria-estado.md)
(hallazgo P1 "gating de edición de admin solo en UI", ahora cerrado).
