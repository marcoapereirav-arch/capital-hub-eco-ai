---
title: Proceso end-to-end completo del sistema (cómo probar en vivo)
order: 8
area: sistemas
---

# Proceso end-to-end completo — del lead a alumno activo

> SOP para probar en vivo todo el sistema. Decisión Marco 2026-06-18.

## Visión a vista de pájaro

```
┌────────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌─────────────┐
│  CAPTACIÓN │ → │  AGENDA  │ → │ LLAMADA │ → │  VENTA   │ → │  ALUMNO     │
│  (Marketing│   │ (Closer) │   │ (Zoom)  │   │ (Closer) │   │  (App)      │
│   o canal) │   └──────────┘   └─────────┘   └──────────┘   └─────────────┘
└────────────┘                                       │             │
                                                     ↓             ↓
                                              Email magic link    Onboarding
                                              + Notif Marco       + Comunidad
                                                                  + Mensajes
                                                                  + Catálogo
```

## Cómo probar TODO el sistema en vivo (paso a paso)

### Pre-requisitos
- Tener acceso al OS como super_admin (ya lo tienes)
- Un email de prueba al que puedas acceder (puedes usar `test-agent@capitalhubapp.com` + alias `test-agent+alumno1@`)
- Browser limpio (cookies/cache borradas)

---

### PASO 1 — Verificar el equipo (Bloque #1 OS)

#### 1.1 Roles del equipo
1. Entra al OS: `https://os.capitalhubapp.com/team`
2. Verifica que aparece la lista de roles correctamente en el dropdown "Invitar miembro":
   - `Super Admin` · `Marketing` · `Closer` · `Setter` · `Formador`
3. Selecciona "Formador" → aparece dropdown formación con 3 opciones (IA Integrator / Media Buyer Digital / Comercial Closing).
4. Confirma que las descripciones de cada rol son las reales (no "Permisos pendientes").

#### 1.2 Ver como Rol
1. Sidebar abajo: botón "Ver como rol"
2. Elige "Marketing" → la UI cambia a vista marketing (solo Dashboard + Operaciones + CRM + Webs)
3. Banner arriba "Vista impersonada · Marketing" + botón "Volver a vista admin"
4. Volver a vista admin.

#### 1.3 Invitación real de equipo
1. Click "Invitar miembro"
2. Email + nombre + rol Marketing
3. Submit → el sistema:
   - Crea `auth.users` con `user_metadata.role = USER` (clave del SSO)
   - Crea `public.profiles` con role marketing
   - Crea `public.users` con role USER
   - Envía email Resend con magic link
4. El invitado recibe email → clica → activa cuenta → entra a `/dashboard` sin loop

#### 1.4 Cancelar invitación / reenviar
- Botón X en cualquier invitación pendiente → confirma → libera email para reinvitar

---

### PASO 2 — Verificar Dashboard + Pipelines

#### 2.1 Dashboard
1. `/dashboard`
2. Las 4 KPIs principales (Revenue · Cash · Ventas · Conversión llamada→venta) son **del negocio completo**
3. Cambiar el dropdown "Vista por funnel" (abajo) NO afecta a las 4 métricas de arriba
4. Sección "Vista por funnel" muestra el embudo del pipeline seleccionado
5. Default = **General**, NO Test Personalidad

#### 2.2 Pipelines
1. `/crm/pipeline` → dropdown muestra "General" (default) y "Test Personalidad"
2. Ambos tienen los stages canónicos: Lead → Agendado → Alumno + Salidas (Seguimiento / No show / Perdido)

#### 2.3 Contactos con filtros completos
1. `/crm/contactos` → 8 filtros: Tags · Pipeline · Stage · Origen · Owner · Producto · Fecha · Llamada
2. Botón Limpiar (N) cuando hay filtros activos

---

### PASO 3 — Probar el flow VENTA (e2e crítico)

> **Este es el corazón del sistema.** Lo que pasa cuando un closer apunta una venta real.

#### 3.1 Registrar venta desde el widget
1. Estando en cualquier página del OS, botón verde **"Registrar venta"** abajo derecha
2. Click → modal con 6 secciones:
   - Tipo cierre: **Sales Call** o **Direct**
   - Lead: nombre, email (usa un email REAL al que puedas acceder, ej. `tu+alumno1@gmail.com`), teléfono, origen
   - Producto: **IA Integrator** (uno por test)
   - Cifras: Revenue 2990€, Cash collected 997€
   - Método pago: Stripe (full pay)
   - Quién cerró: dropdown con team_members (selecciona Test Agent)
   - Notas internas

3. Click **"Registrar venta y enviar acceso"** → al submit, el sistema:
   - **Upsert `contacts`**: stage `alumno`, products, revenue, cash collected, slug auto, source
   - **Insert `contact_journey_events`**: tipo `sale` con todo el detalle
   - **Insert `student_invites`**: token único + expira en 7d
   - **Email Resend** al alumno con magic link a `https://app.capitalhubapp.com/accept-invite/<token>`
   - **Notif a Marco** (email interno) con resumen de la venta

4. **Verificar en BD** (opcional via Supabase Studio):
   ```sql
   SELECT email, full_name, stage, total_revenue FROM contacts WHERE email = 'tu-email-test';
   SELECT * FROM contact_journey_events ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM student_invites WHERE email = 'tu-email-test';
   ```

#### 3.2 Reenviar magic link (si lo necesitas)
1. `/contactos` → busca el email de la venta de prueba
2. Abre drawer → header del drawer botón **"↻ Reenviar acceso"**
3. Confirma → el sistema reenvía el mismo magic link al email

---

### PASO 4 — Probar el flow ALUMNO (App)

#### 4.1 Activación de la cuenta
1. Abre el email recibido como alumno
2. Click "Activar mi acceso" → te lleva a `https://app.capitalhubapp.com/accept-invite/<token>`
3. Pantalla brandkit Capital Hub con: nombre + email + producto + form contraseña
4. Define contraseña (mín 8 chars) → submit
5. Spinner overlay "Activando…" + auto-login → redirige a `/onboarding`

#### 4.2 Onboarding
1. Form con: foto avatar (opcional) + nombre + apellidos + **profesión** (default "Estudiante en Capital Hub") + bio
2. Submit → te lleva a `/training/routes` (catálogo)

#### 4.3 Home (Panel Formativo)
1. `/home` muestra 2 cards: **Panel Formativo** + **Marketplace**
2. (Mensajes ya NO está aquí; va dentro del Panel Formativo)
3. Click "Panel Formativo" → entra a `/skool`

#### 4.4 Skool (Panel Formativo) — 7 tabs
- **Comunidad**: 3 comunidades herméticas (IA / MBD / CC). Como REP solo ves la de tu producto. Posts con título + body + categoría (wins/soporte/general) + like + comentarios anidados
- **Formación**: cards de tu formación con progreso. Skeleton carga rápida.
- **Mensajes**: split vertical lista chats + chat activo + badge unread + notif web nativa
- **Calendario**: eventos próximos
- **Miembros**: grid de miembros. Click → perfil público clicable
- **Leaderboards**: ranking (placeholder por ahora)
- **Perfil**: editar tus datos (grid 2 columnas ancho completo)

#### 4.5 Perfil público de otro miembro
1. Skool → tab Miembros → click cualquier card
2. `/perfil/:id` muestra avatar + nombre + profesión + bio + fecha alta + badge ADMIN
3. Botón **"Enviar mensaje"** → te lleva a Skool tab Mensajes con ese chat ya abierto

#### 4.6 Chat 1-a-1
1. Tab Mensajes → lista de chats izda + chat seleccionado derecha
2. Escribe + envío → aparece en tu burbuja blanca a la derecha
3. La otra persona (en otro browser/usuario) recibe realtime sin reload
4. Cuando le llega un mensaje y NO está en el tab Mensajes → notif web nativa del navegador

---

### PASO 5 — Verificar SSO OS↔App

#### 5.1 Como super_admin (tú)
1. Estando logueado en OS → sidebar footer → "Ir a la App ↗"
2. Abre `app.capitalhubapp.com` SIN pedir login adicional
3. Entras como ADMIN: puedes editar TODO

#### 5.2 Como marketing/closer/setter (USER en App)
1. Login con ese usuario en OS → entra a OS sin loop
2. Click "Ir a la App" → entra a App como USER
3. Ve TODAS las rutas/comunidades/posts en read-only (no aparece "Editar" en ningún lado)

#### 5.3 Como formador (ADMIN con `formacion_asignada`)
1. Login con usuario formador (ruta = IA Integrator) en OS
2. Click "Ir a la App" → entra como ADMIN
3. Va a `/admin/formaciones`:
   - Solo la formación de IA Integrator es clicable
   - Las de MBD y Comercial Closing aparecen disabled + "🔒 Sin permiso"
4. En su formación: puede editar todos los módulos/lecciones

---

### PASO 6 — Verificar Knowledge

1. `/knowledge` OS muestra 5 cuadrantes:
   - Brand (Brandkit canonical)
   - Marketing · Producto · Ventas · Finanzas
   - **Sistemas** (incluye este SOP y todos los protocolos)

2. Click cualquier cuadrante → lista de SOPs → click un SOP → ver contenido markdown

---

## Lo que YA está hecho y verificado en producción

| Capa | Estado |
|---|---|
| **OS — Equipo & Roles** | ✅ Permisos por rol · Invitaciones equipo · Reenviar · Cancelar · Ver como Rol |
| **OS — Dashboard** | ✅ 4 KPIs globales · Vista por funnel · Filtros completos contactos |
| **OS — Pipelines** | ✅ General default · Test Personalidad sin default · Endpoints asignan correctamente |
| **OS — Knowledge** | ✅ Cuadrante Sistemas visible · SOPs 03-08 |
| **OS — Auth** | ✅ Token-based (BYOE Resend) · Spinners en todos los forms · PATCH /team sincroniza metadata |
| **OS — Sales widget** | ✅ Smoke test verificado · 2 bugs fix (slug + invite URL) |
| **App — SSO** | ✅ user_metadata.role propagado · accept-invite con defensa · Marketing/Closer/Setter entran como USER · Formador como ADMIN con gate por formacion_asignada |
| **App — Catálogo** | ✅ Bloqueo por producto · Skeleton de carga rápida |
| **App — Onboarding** | ✅ Foto + nombre + profesión (default) + bio |
| **App — Comunidad Skool** | ✅ 3 comunidades herméticas · Posts + reacciones + comentarios anidados |
| **App — Mensajes dentro Skool** | ✅ Tab "Mensajes" con badge unread + notif web · Chat 1-a-1 con realtime + perfil clicable |
| **App — Perfil público** | ✅ /perfil/:id ancho completo · Botón "Enviar mensaje" → abre chat en Skool |
| **App — Permisos formador** | ✅ AdminFormacionesPage + Detail con canEditFormacion · 🔒 en rutas no asignadas |
| **App — Q&A** | ✅ Por formación con respuestas marcadas como aceptadas |
| **App — Brandkit canonical** | ✅ Tokens del HTML oficial · LoginPage · HomePage · SkoolPage · AuthLayout · AcceptInvite · Onboarding |

## Lo que falta (en orden de prioridad)

### Prioridad ALTA — entrega inmediata
1. **Bunny Stream** (Marco hace ahora — Library ID + CDN Hostname al .env.local del repo App)
2. **Refactor visual Skool internal tabs** (Calendar/Members/Leaderboards) — pulir Inter Tight + letter-spacing canonical
3. **Refactor visual Admin pages** (FormacionDetail, Formations, Lessons, Modules, Routes, Users, Feedback) — mismo barrido brandkit

### Prioridad MEDIA — siguiente sub-sprint
4. **Endpoint reenviar invitación de equipo** (`/api/admin/team/[id]/resend`) — el de alumno ya existe
5. **PWA install + Service Worker fetch** (notif push real cuando la pestaña está cerrada)

### En pausa (decisión Marco — después de cerrar producto)
- **Funnel test personalidad** (placeholders + integración test externo)
- **ManyChat flows** (Welcome New Follower + User Replied)
- **Calendly API integración temporal** (Adrián pendiente generar PAT)
- **Bolsa de trabajo / Marketplace real** (post 8/8)
- **Email Marketing dashboard** (métricas Resend)
- **Tracker Ads** (bloqueado por Meta API + Adrián)
- **Calendario propio** (clon Calendly completo — post Calendly API)

### Bloqueado por Adrián (no puedo tocar)
- Calendly API: PAT + webhook signing key + verificar plan Standard
- Token Meta (IG metrics + Ads): checkpoint developer.facebook.com
- Webinar 8/8 formato + scripts cierre high-ticket
- Contenido formativo grabado de las 3 rutas

## Cómo se trackea el progreso

Todo el progreso está en `public.tasks` (BD del OS) bajo el sistema PARA.

Para ver estado de un bloque:
```sql
SELECT title, status, priority, assignee, is_in_progress
FROM public.tasks
WHERE para_id = 'proj_blockA3_roles'  -- o el que toque
ORDER BY priority, title;
```

Para listar todos los proyectos activos:
```sql
SELECT id, name, status, priority, display_order
FROM public.para_items
WHERE status = 'active'
ORDER BY display_order;
```

## Decisiones tomadas

- **2026-06-18:** Mensajes integrado DENTRO del Skool (no como ruta externa)
- **2026-06-18:** Brandkit canonical extraído del HTML oficial (paleta exacta + Inter Tight 500 + letter-spacing 0.45em)
- **2026-06-18:** Permisos formador con gate per `formacion_asignada`
- **2026-06-18:** Smoke test e2e venta → alumno verificado (encontró + arregló 2 bugs)
