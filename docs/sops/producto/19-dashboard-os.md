---
title: Dashboard OS · operaciones + foco
order: 19
area: producto
---

# Dashboard operaciones — vista panorámica del negocio

## URL
`https://os.capitalhubapp.com/` (raíz del OS)

## Para qué sirve
Pantalla principal del OS. Es lo primero que ve un admin al entrar. Muestra el estado del negocio en una sola vista.

## Dos modos

### General (default)
Muestra **TODOS los proyectos activos + pausados + completados**. Vista panorámica de TODO el negocio. Y TODAS las tareas (incluido someday e inbox).

### Foco webinar 8/8
Muestra solo proyectos `status=active` con `focus_id=focus_webinar_880`. Vista de ejecución pura del plan webinar.

Toggle arriba a la derecha cambia entre los dos.

## Hero

### En modo General
- "X proyectos activos · Y pausados · Z completados · W tareas totales"
- Barra de progreso global

### En modo Foco
- Countdown gigante: "Quedan X semanas Y días" al webinar 8/8
- Barra de tiempo transcurrido
- Barra de tareas del foco completadas

## Stats cards

4 cards clicables que llevan a `/tasks` con filtros pre-aplicados (ahora cambian a vista list):

1. **Total tareas** → lista todas
2. **Pendientes** → status=next
3. **Vencidas** → dueRange=overdue (solo si hay vencidas)
4. **Esta semana** → dueRange=week

## Secciones

### Acciones humanas pendientes (top 10)
Lista de tareas más urgentes (por prioridad + due_date). Click en una → drawer con detalle + acciones rápidas.

### Próximos deadlines
Tareas con due_date cercano. Visual de timeline.

### Carga por persona
Cada admin/colaborador con su contador de tareas abiertas. Click → /tasks filtrado por assignee.

### Proyectos con progreso
Lista de proyectos con barra de progreso visual. Click → /projects/{id}. Badges:
- "pausado" amber
- "completado" green

### Áreas (Marketing, Producto, Ventas, Finanzas)
Bloques con resumen de tareas pendientes por área PARA.

## Filtros aplicados al hacer click en card

Cuando haces click en una stats card, el sistema:
1. Resetea filtros previos
2. Aplica el filtro específico (status / dueRange / assignee)
3. **Cambia viewMode a "list"** (no board, para que veas claramente las filtradas)
4. Navega a `/tasks`

Si en `/tasks` quieres volver al kanban general → cambia viewMode con el toggle de la toolbar.

## Tasks dentro de cada Proyecto

Click en un proyecto → `/projects/{id}`. Verás:
- Header con progreso del proyecto
- Toolbar con toggle **Pendientes (N)** / **Todas (M)** (por default solo pendientes)
- Lista de tareas filtrada
- Click en tarea → drawer con detalle

## Tabla BD
- `tasks` (todas las tareas con paraId, assignee, status, priority, due_date)
- `para_items` (proyectos + áreas + recursos + archivo)
- `focuses` (el foco webinar 8/8 vive aquí)

## Reglas operativas
- **General incluye tareas Someday e Inbox.** Foco las excluye para mantener limpieza.
- **Project detail oculta done por default.** Hay toggle para verlas si quieres revisar el histórico.
- **Si una task no tiene paraId, va a Inbox** (vista alternativa, no por defecto en Dashboard).
- **El countdown del foco usa endDate 2026-08-08.** Sólo cambiable editando el row de `focuses` en BD.

## Real-time
El store de tasks tiene Supabase Realtime. Cuando alguien actualiza una task en otra sesión, se refleja en vivo en el dashboard.

## Quick Capture
Caja flotante en la esquina (o atajo de teclado). Crea task en Inbox con assignee = usuario actual logueado (mapping email → assignee). No por defecto Marco como antes.

## Verificación
- Carga `/` → debe mostrar estado actual sin errores
- Toggle General ↔ Foco debe filtrar correctamente
- Click "Vencidas" → debe ir a `/tasks` viendo solo las vencidas en lista, NO el board completo
- Click en proyecto → `/projects/{id}` debe ocultar tareas done por default

## Cambios versionados

### 2026-07-27 · `/dashboard` = Centro de mando sobre metricas reales (piel minimalista)
El dashboard de proyectos/tareas descrito arriba fue SUSTITUIDO en `/dashboard` por una cara nueva ("Centro de mando") montada sobre las **metricas reales** del negocio, NO sobre tareas. Componente: `src/features/dashboard/components/main-dashboard.tsx`. Datos reales (queries a `contacts`, `student_invites`, `calendar_bookings`): facturacion del periodo, cash collected, ventas, ticket medio, embudo del pipeline activo, actividad reciente, 8 KPIs, ingresos 30 dias, ventas por completar, invitaciones App. Filtro de periodo (`PeriodFilter`) arriba a la derecha.

**Diseno (decidido por Marco, iterado):** minimalista y sobrio. Fondo carbon parejo, tarjetas limpias (borde 1px, radio suave), mucho aire, Inter Tight, verde SOLO como acento minimo. Se descartaron versiones recargadas (orbe HUD, y el "papel hueso / sello CH / cinturones" que se probo): no eran minimalistas. El brandkit es la referencia pero aplicado con contencion.

**Dos cambios de componentes en el mismo bloque:**
- `PeriodFilter` (`src/components/ui/period-filter.tsx`) rediseñado: de mono + mayusculas espaciadas a Inter Tight limpio (chip + dropdown sobrios, acento verde). Afecta a las 4 pantallas que lo usan (calendario, manychat, email-marketing, dashboard).
- En la card del embudo se usa un `select` nativo limpio para SOLO cambiar de embudo. Se quito el `PipelineSelector` (con su boton "Configurar" que abria el gestor de pipelines viejo dentro del dashboard). Ese gestor sigue existiendo en el CRM (vista kanban de contactos), que es su sitio.

> Pendiente: reescribir el cuerpo de este SOP (arriba describe el dashboard viejo de tareas/foco). Se conserva por historico hasta la reescritura.

---

## 2026-08-08 · El dashboard reconstruido: 3 gráficos, no 7

Origen: llamada Marco + Adrián del 6 de agosto, y la revisión de Marco del 7 y 8.

### Qué había roto

1. **Las 8 métricas se habían borrado.** El barrido de móvil del 7 de agosto (`6416d1b`) dejó `main-dashboard.tsx` de 1047 a 595 líneas y quitó la fila de tarjetas. Los números se seguían calculando y no se pintaban.
2. **El dinero se escondía solo.** `revenue` y `cash collected` estaban dentro de `if (kpis.revenue <= 0) return null`. Sin ventas en el periodo, la pantalla no enseñaba nada de dinero.
3. **Las llamadas se contaban en una tabla vacía.** Se leía `calendar_bookings` (el calendario propio, 0 filas, nadie lo usa) y se filtraba por `status === "completed"`, un valor que no existe en su CHECK. Llamadas hechas, show rate, no-shows y conversión salían siempre en cero.
4. **Siete gráficos, ninguno legible.** Cada uno con su propio dibujo.

### Cómo quedó

**Orden de la pantalla:** mosaico de métricas · separador · los 4 números de prospección (sin título) · el embudo · cómo va el mes · ventas por completar · actividad.

**Los 3 gráficos y qué contesta cada uno:**

| Gráfico | Pregunta |
|---|---|
| Facturación en el tiempo (dentro de la pieza grande) | ¿Cuánto dinero y cómo voy? |
| **El embudo** (con desplegable) | ¿Dónde se me cae la gente? |
| **Cómo va el mes** | ¿Entra gente, se agenda, se cierra? |

**Borrados por decir lo mismo desde seis sitios:** `dashboard-chain`, `dashboard-pulse`, `dashboard-funnel`, y los tres de día a día. También se recortó `dashboard-lecturas.ts` (`construirCadena` y `construirPulso` ya no existen).

### Definiciones cerradas de las métricas de llamadas

Salen de `calendly_scheduled_events`, filtrando **solo las agendas con `purpose = 'venta'`** en `calendly_event_types`.

| Métrica | Cómo se cuenta |
|---|---|
| Llamadas agendadas | reservas de venta del periodo, en cualquier estado, **incluidas las que aún no han ocurrido** |
| Canceladas | `status = 'canceled'` |
| No shows | `status = 'no_show'` |
| Llamadas hechas | ya pasó su hora, y no está cancelada ni marcada no show |
| Show rate | hechas / (hechas + no shows). Sin base: **guion** |
| Conversión llamada a venta | ventas / hechas. Sin base: **guion** |
| Ticket medio | revenue / ventas. Sin ventas: **guion** |

**Por qué "agendadas" incluye las futuras:** si solo contara las pasadas sería idéntico a "hechas", el primer salto del embudo saldría siempre 100% y Adrián vería 3 aquí y 8 en Calendly.

### Reglas que nacen de aquí

Están en [`producto/04`](04-protocolo-trabajo-agente.md): **REGLA #23** (horas reales), **REGLA #24** (todas las métricas siempre, guion nunca cero) y **REGLA #25** (un gráfico que no se explica solo, no sube).

### Archivos

- `src/features/dashboard/components/main-dashboard.tsx` (compone y calcula)
- `dashboard-metricas.tsx` (el mosaico: pieza grande, anillos, piezas)
- `dashboard-embudo.tsx` (el embudo + su desplegable)
- `dashboard-como-va.tsx` (el gráfico de tiempo, con las barras abribles)
- `dashboard-kpis.tsx` (los 4 números de prospección)

---

## 2026-08-08 · Tres fallos encontrados auditando el dashboard con el navegador

Marco: *"el filtro de fecha NO funciona... tienes terminantemente prohibido decirme que ya está listo si aún no has verificado cada detalle"*. Se escribió una auditoría que toca CADA control y comprueba que hace algo: `.test-artifacts/auditar-dashboard.mjs` (71 comprobaciones, ordenador y teléfono). Salieron tres fallos reales, dos de ellos de TODO el OS y no solo del panel.

### 1. El filtro de fechas no aplicaba nada. En ninguna pantalla

`PeriodFilter` dibuja su desplegable en el `body` (portal) para que ningún contenedor con recorte lo corte. Pero el manejador de "cerrar al tocar fuera" solo miraba dentro de `containerRef`, que es el botón. **El desplegable quedaba fuera de sí mismo**: al pulsar una opción se cerraba en el `mousedown`, React lo quitaba del documento, y el `click` posterior no encontraba botón. `selectPreset` **nunca se ejecutaba**.

Se abría el filtro, elegías periodo, y no pasaba nada. En el dashboard, en Ads, en Calendario, en Email Marketing y en ManyChat.

**Arreglo:** el desplegable tiene su propia referencia y "tocar fuera" mira las dos.

**Regla derivada:** cuando un desplegable se dibuja con portal, el "cerrar al tocar fuera" tiene que conocer AMBOS nodos. Si no, el componente se cierra a sí mismo antes de poder usarse.

### 2. La etiqueta del filtro se quedaba clavada

`PeriodFilter` pinta su etiqueta con `value?.label`. El dashboard no le pasaba `value`, así que ponía siempre "Últimos 30 días" eligieras lo que eligieras. **Toda pantalla tiene que pasar `value`**, como ya documenta la skill del brandkit.

**Pendiente:** `src/features/manychat/components/manychat-period-kpis.tsx` tiene el mismo fallo (no pasa `value`). No se tocó por no salir del encargo.

### 3. Las variables de zona segura llegan VACÍAS, y tumban las medidas que las usan

Medido en el navegador: `getComputedStyle(document.documentElement).getPropertyValue('--sab')` devuelve **cadena vacía**, igual que `--sat`. Están declaradas en `html { }` dentro de `@layer base` de `globals.css`, pero no llegan.

Consecuencia: `calc(3.5rem + var(--sab) + 1rem)` es inválido, **el navegador tira la declaración entera**, y un elemento "fijo abajo" se queda en su posicion natural: **arriba del todo**. El botón flotante del OS salía en `y=0` y tapado: no se podía pulsar en el teléfono.

**Arreglo aplicado al botón flotante:** la altura se pone en `style` con `env(safe-area-inset-bottom, 0px)` directo, sin variable que pueda faltar.

**Pendiente, y afecta a más pantallas:** hay ~10 sitios más con el mismo patrón (`mobile-shell`, `mobile-header`, `contact-detail`, `pipelines-kanban`, `KnowledgeEditorClient`, `KnowledgeBrain`, `PushNotificationPrompt`, `UpdateNotifier`). Todos están silenciosamente rotos en el teléfono mientras `--sab` y `--sat` no lleguen. **Lo que hay que arreglar es la causa: por qué esas variables no llegan.** No se tocó aquí por no salir del encargo.

**Regla derivada:** una medida que depende de una variable CSS se cae ENTERA si la variable falta, y no avisa. Se comprueba en el navegador con `getComputedStyle`, no leyendo el código.

---

## 2026-08-08 (segunda pasada) · Los números no cuadraban con el CRM

Marco: *"hay 23 DMs y 23 leads, ¿por qué dices que hay 23 DMs?... en el CRM sale otra cosa"*.

### El dinero se apuntaba al mes equivocado

`Facturado` y `Cobrado` salían de `contacts.total_revenue` de los contactos **creados** en el periodo. Es decir: una venta cerrada en agosto a un lead que entró en julio **no contaba en agosto**. El dinero se apuntaba al mes en que entró la persona, no al mes en que se cobró.

**Arreglo:** el dinero, las ventas y el ticket medio salen ahora de `contact_journey_events` con `type='sale'`, que es la fuente de verdad del SOP `ventas/02` y lleva **su propia fecha**. Cada venta registrada con el botón verde escribe ese evento con `revenue`, `cash_collected` y `closer_name`.

Con una sola venta de prueba en toda la base (18-jun, 3.000 €) el fallo no se veía. Con ventas de verdad, los números habrían sido falsos.

### El embudo del CRM inventaba gente

Detalle y regla derivada en [`producto/04`](04-protocolo-trabajo-agente.md), **REGLA #28**. Resumen: cada escalón sumaba los siguientes, dando por hecho que quien está en "Agendado" pasó por "Lead" y por "DM". Al webinar se entra **directo en Lead**. El panel decía 23 en DM con **cero** en DM.

Ahora los embudos tienen dos modos: **recorrido** (embudo de verdad, con las caídas dibujadas) y **reparto** (dónde está cada persona ahora, con su porcentaje del total y sin caídas inventadas). Los pipelines del CRM van en modo reparto y cuadran al dedillo con el kanban: Webinar 34 en total, DM 0, Lead 19, Agendado 4, Seguimiento 10, Perdido 1.

### El lenguaje de cada métrica

Marco: *"¿Qué carajo es vinieron?"*. Regla nueva en `producto/04`, **REGLA #27**. Cambios aplicados:

| Antes | Ahora |
|---|---|
| Facturación del periodo | **Facturado** |
| Cash collected | **Cobrado** |
| Ventas | **Ventas cerradas** |
| Contactos nuevos | **Personas nuevas** |
| Llamadas hechas · "De 8 agendadas · 3 por venir" | **Llamadas celebradas** · "Se reservaron 8. Quedan 3 por celebrar" |
| Show rate · "5 vinieron, 0 no" | **Asistencia a las llamadas** · "5 se conectaron · 0 no se presentaron" |
| Conversión llamada a venta | **De llamada a venta** · "0 ventas de 5 llamadas celebradas" |
| No vinieron | **No se presentaron** |
| Vinieron (paso del embudo) | **Se conectaron a la llamada** |

### Quién movió a los contactos

Los 10 pases a "Seguimiento" del webinar los hizo **una persona a mano**, uno por uno, el 7 de agosto entre las 10:46 y las 14:55. Queda registrado el cambio, pero **no quién lo hizo**: `contact_journey_events` guarda `{from, to}` y no el usuario. Vale la pena añadirlo.

### Por qué el OS iba lento (medido)

Cada pantalla se para ~500 ms antes de cargar nada, porque el marco del OS hace **tres viajes en cadena** a Supabase (quién eres, qué permisos hay, tu perfil) y ninguno empieza hasta que acaba el anterior. Prueba limpia: `/login`, fuera del marco, responde en 83 ms; `/perfil`, dentro y casi vacía, tarda 586 ms.

No es la base (todas las consultas por debajo de 1 ms), ni faltan índices, ni es RLS, ni es el volumen (40 contactos).

**Aplicado aquí:** el menú apunta a `/crm/contactos` en vez de a `/crm`. `/crm` solo hacía un desvío, y el marco se ejecutaba **entero dos veces**: medido, **746 ms tirados** antes de empezar a cargar la página buena.

**Pendiente (no tocado, fuera del encargo):** poner esos tres viajes en paralelo y guardar en memoria los permisos por rol (hoy se releen con `no-store` en cada navegación, 29 filas que casi nunca cambian). Ahorro estimado ~175 ms en TODAS las pantallas.

---

## 2026-08-11 · Los embudos del dashboard son los del CRM, y nada más

Marco: *"solo y exclusivamente tienen que estar estos pipelines. No pueden estar más, ya que va directamente conectado"*.

La tarjeta **"Los embudos del CRM"** ya no tiene ni un embudo escrito a mano. Su lista **sale de `pipelines`**: si mañana se crea uno en el CRM aparece solo, y si se borra desaparece. Antes había dentro dos inventados aquí ("Embudo de la venta" y "De conversación a llamada") que no existían en el CRM, y eso era justo lo que rompía la correspondencia.

Se enseña por defecto **el embudo con más gente**, que es el vivo del negocio. Antes se fijaba en el primero que llegara y, como los contactos tardan un instante más que la lista de embudos, se quedaba clavado en el que tocara: salía "General" con 5 personas teniendo el del webinar 34.

## 2026-08-11 · La venta de prueba, borrada

Había **una sola venta en toda la base** y era una prueba (`Prueba Marco`, `marcoantonio@n-vision.cc`, 18-jun-2026, 3.000 € facturados y 2.800 € cobrados, producto "IA Integrator"). Ensuciaba el facturado, el cobrado, el ticket medio y contaba como 1 alumno en el embudo General.

Borrado el contacto entero con su venta, su invitación a la App y sus etiquetas. La base queda con **0 ventas y 0 € de facturación**, que es lo real.

## 2026-08-11 · Lo que iba lento, arreglado

Medido el 2026-08-08: el marco del OS hacía **tres viajes a Supabase en cadena** antes de cargar nada (quién eres, qué permisos hay, tu perfil), y ninguna petición de la página arrancaba hasta terminarlos.

1. **Los permisos por rol se guardan en memoria un minuto.** Se releían con `no-store` en **cada navegación**: 29 filas que solo cambian cuando alguien edita la matriz de permisos. Al guardar la matriz se tira la copia (`olvidarPermisosCacheados()`), así que un cambio se nota al instante.
2. **Las dos consultas que quedan van a la vez**, no en cadena.
3. **El menú de CRM apunta a `/crm/contactos`.** `/crm` solo desviaba, y el marco se ejecutaba entero dos veces: 746 ms tirados en el clic que más se usa.

## 2026-08-11 · La causa de que se rompieran diez pantallas en el teléfono

`--sat`, `--sab`, `--sal` y `--sar` (las zonas seguras del iPhone) estaban declaradas **dentro de `@layer base`** y llegaban **vacías** al navegador. Medido: `getComputedStyle(document.documentElement).getPropertyValue('--sab')` devolvía cadena vacía, y un elemento con `bottom: calc(3.5rem + var(--sab) + 1rem)` calculaba `auto`.

**Una variable que no llega no falla sola: se lleva por delante la declaración entera que la usa**, porque el `calc()` se vuelve inválido y el navegador tira la regla sin avisar. Por eso el botón flotante, escrito para quedarse fijo abajo, salía pegado arriba y tapado.

Movidas **fuera de toda capa**, al principio de `globals.css`. Comprobado después: `--sab` devuelve `0px` y el mismo `calc()` da `72px`. Con eso se reparan de golpe las diez pantallas que usan ese patrón (barra de arriba, detalle de contacto, kanban, editor del Knowledge, avisos, notificador de actualización).

**Regla derivada:** una medida que depende de una variable CSS se cae entera si la variable falta, y no avisa. Se comprueba en el navegador con `getComputedStyle`, nunca leyendo el código.

## 2026-08-11 · Quién mueve a cada contacto

`contact_journey_events` guardaba `{from, to}` pero no la persona. Ahora el evento `stage_change` guarda `movido_por` y `movido_por_id`, y el título se lee solo: *"Movido de lead a seguimiento por Adrián Villanueva"*.

## 2026-08-11 · El filtro de ManyChat

Le faltaba `value`, igual que le faltaba al dashboard: la etiqueta se quedaba clavada. **Todas las pantallas del OS con filtro lo pasan ya.**
