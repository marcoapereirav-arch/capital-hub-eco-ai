---
rama: feature/calendly-setter-metricas
estado: aprobado
---

> **Aprobado por Marco el 2026-08-07** ("empieza todo de una vez, arreglalo todo ya").
> Con dos recortes suyos sobre la version que se le presento:
> - **Solo hay UNA agenda**: la del funnel de reserva ("Sesion de orientacion profesional").
>   Es la unica que usa el equipo. Las otras dos (arranque de clientes y la personal de
>   Adrian) se guardan para el historial pero NO cuentan en ningun numero.
> - **Fuera los enlaces por setter.** Solo hay un setter y usa esa misma agenda, asi que la
>   comparacion que pidio Adrian sale de su reporte diario contra el total de Calendly. No
>   hace falta atribuir por enlace. Si algun dia hay mas de un setter, se retoma.

# Agendas de Calendly de raíz + reporte del setter + métricas en el dashboard

> Fecha: 2026-08-07
> Proyecto: Capital Hub OS
> Origen: llamada Marco + Adrián del 6 de agosto de 2026

---

## Objetivo

Que todas las llamadas que se reservan en Calendly entren al OS solas y sin perderse ni una, que el setter reporte su trabajo diario desde el móvil, y que todo eso se vea en números reales en el dashboard principal.

---

## Lo que pidió Adrián en la llamada

1. **Que las agendas de Calendly muevan al lead solas** en el pipeline. Lo probó y no pasaba.
2. **Cinco métricas en el dashboard**: conversión de llamada a venta, contactos nuevos, llamadas hechas, show rate y ticket medio. Booking rate lo descartó de momento.
3. **Un reporte diario del setter**: entra al OS desde su teléfono y rellena un formulario corto con cuatro números del día.
   - conversaciones nuevas abiertas
   - follow-ups nuevos
   - ofertas de llamada tiradas
   - llamadas agendadas

Marco añadió: que sea **el mismo widget** que el de Registrar venta, que al tocarlo dé a elegir entre "Registrar venta" y "Reporte setter", y que **todas** las métricas del setter se vean dentro del dashboard principal.

---

## Lo que encontré al mirar la cuenta real

- **Se están perdiendo llamadas ahora mismo.** En Calendly hay 12 reservas. En el OS solo hay 5. Faltan 5 personas reales (Diego Silva, Aroon, Susana Aguirre, Kenneth, Meritxell Martí) reservadas entre el 4 y el 6 de agosto. **Dos de esas llamadas son hoy y dos mañana.** No están en el CRM y nadie recibió aviso.
- **Nadie se entera cuando falla.** La puerta de entrada de Calendly le contesta "todo bien" aunque por dentro no haya guardado nada. Por eso Calendly cree que las entregó, no reintenta, y llevamos diez días perdiendo llamadas en silencio. Esta es la causa raíz.
- **Nunca se trajo el histórico.** El sistema solo escucha reservas nuevas. Lo que ya existía no se trajo jamás.
- **Se tira a la basura lo mejor que llega.** Al reservar, la persona rellena 9 preguntas: teléfono con prefijo, su Instagram, a qué se dedica, qué quiere conseguir, qué ruta le interesa, cuánto tiempo tiene y si se compromete a asistir. **De todo eso el OS no guarda nada.** Por eso el teléfono en el CRM sale siempre vacío, aunque la persona lo escribió.
- **Están mezcladas las agendas.** Hay 3 en la cuenta: la de ventas ("Sesión de orientación profesional"), la de arranque de clientes ("Kick Off Meeting") y una personal de Adrián ("Invisalign"). El OS las cuenta todas por igual, así que cualquier número de ventas sale contaminado.
- **Los números de llamadas del dashboard están rotos.** "Llamadas hechas", "Show rate", "No-shows" y "Conversión llamada a venta" se calculan sobre la tabla del calendario propio, que está **vacía** y que nadie usa. Salen siempre en cero, pase lo que pase.
- **No se sabe qué setter trajo cada llamada.** Solo hay un asiento de Calendly (el de Adrián), así que no se puede dar una agenda propia a cada setter sin pagar más. **Comprobado que sí funciona otra vía:** Calendly guarda y devuelve las etiquetas del enlace, así que a cada setter se le da su enlace propio y la reserva llega marcada con su nombre.

---

## Fases

**A · Que no se pierda ni una llamada (urgente, hoy)**
- [ ] Guardar todo lo que llega de Calendly tal cual llega, para dejar de investigar a ciegas
- [ ] Hacer una reserva de prueba real y ver qué llega exactamente, para encontrar la causa sin adivinar
- [ ] Arreglar la causa que salga de ahí
- [ ] Quitar el "todo bien" falso: si algo falla, se contesta que falló, Calendly reintenta solo y salta un aviso al equipo
- [ ] Segunda reserva de prueba para comprobar que entra, y borrar las dos pruebas
- [ ] Recuperar las 5 personas que faltan y meterlas en el CRM **en silencio: sin correos ni avisos**, porque sus llamadas ya están agendadas

**B · Traer todo Calendly de raíz**
- [ ] Traer el histórico completo de reservas al OS, una sola vez, sin reenviar ningún correo
- [ ] Guardar quién atiende cada llamada, que hoy se lee y se tira
- [ ] Guardar las 9 respuestas del formulario y rellenar teléfono e Instagram en la ficha del contacto

**C · Separar las agendas** *(añadido mío: sin esto los números de ventas salen contaminados)*
- [ ] Marcar en cada agenda para qué sirve: venta, arranque de cliente o personal
- [ ] Que la pantalla de Calendario y todos los números usen solo las agendas de venta
- [ ] Que una agenda nueva entre sin contar hasta que se clasifique, en vez de colarse en los números

**D · Saber qué setter trajo cada llamada** *(añadido mío: es la única forma de contestar "cuánto trae el setter y cuánto entra por otro lado")*
- [ ] Generar a cada setter su enlace propio de reserva, y una pantalla donde lo copie
- [ ] Guardar el setter en la reserva y en la ficha del contacto
- [ ] Poder corregirlo a mano para las que entren sin enlace marcado

**E · El widget y el reporte del setter** *(lo que pidió Adrián)*
- [ ] El botón verde de abajo a la derecha pasa a abrir un menú con dos opciones: "Registrar venta" y "Reporte setter"
- [ ] Cada quien ve lo que le toca: el setter solo ve "Reporte setter"
- [ ] Formulario hecho para el teléfono con los 4 números del día: conversaciones nuevas, follow-ups nuevos, ofertas de llamada, llamadas agendadas
- [ ] Un reporte por persona y por día. Si vuelve a entrar el mismo día, le salen sus números ya escritos en las casillas y los corrige encima. Nunca se crea una segunda línea ni se suman por error
- [ ] Sin avisos al móvil

**F · Todas las métricas dentro del dashboard principal**
- [ ] Arreglar las 4 métricas de llamadas para que salgan de Calendly y no de la tabla vacía: llamadas hechas, show rate, no-shows y conversión de llamada a venta
- [ ] Los 4 números del setter tal cual, con el filtro de fechas que ya existe
- [ ] Los ratios que salen de cruzarlos: de conversación a oferta, de oferta a llamada agendada, y de conversación a llamada agendada
- [ ] Agendadas por el setter contra el total de Calendly, para ver de un vistazo cuánto trae él y cuánto entra por otro lado
- [ ] Gráfico con los números escritos, los ejes rotulados y etiqueta al pasar el cursor
- [ ] Comprobar en pantalla que los números cuadran con lo que hay en Calendly

**G · Cierre**
- [ ] Guardar todo en el Knowledge
- [ ] Repasar en el navegador, con sesión iniciada, que cada pantalla se ve bien y en móvil

---

## Qué NO entra

- **No hay repaso automático cada rato.** Marco lo rechazó por ser un parche, y tiene razón: con el aviso cuando falla, el reintento de Calendly y el registro de todo lo que entra, no hace falta. El histórico se trae **una sola vez**.
- **No hay avisos al móvil** para el reporte del setter.
- **No se avisa de las 5 llamadas recuperadas.** Entran calladas.
- **No se construye el calendario propio.** Ese proyecto sigue pausado.
- **No se compran asientos nuevos de Calendly** ni se crea una agenda por persona: se resuelve con enlaces marcados.
- **No se tocan los correos automáticos** al lead más allá de que ahora sí lleguen a quien toque.
- **No se rediseña Calendario ni el dashboard.** Solo se arreglan los números rotos y se añade lo del setter.
- **No se tocan los embudos ni el CRM.** Quien agenda sin venir de ningún funnel sigue cayendo en el embudo General, que es para lo que está.
- **No se borra nada** de lo que ya hay.

---

## Cómo lo verás

- En **Calendario**, las 12 reservas reales con su teléfono, su Instagram y lo que contestó cada persona.
- En el **CRM**, las 5 personas que faltaban ya como "Agendado", con teléfono para escribirles por WhatsApp.
- La agenda personal de Adrián deja de contar en los números de ventas.
- Cada setter con **su enlace** para copiar, y cada llamada con el nombre de quien la trajo.
- El **botón verde** pasa a dar a elegir: Registrar venta o Reporte setter.
- Juanda entra desde su teléfono, mete sus 4 números y listo.
- En el **Dashboard**: llamadas hechas, show rate, no-shows y conversión de llamada a venta dejan de estar en cero, y debajo todos los números del setter con sus ratios.
- Y si algún día Calendly deja de entregar reservas, **salta un aviso** en vez de pasar diez días en silencio.

---

## Contexto técnico (referencia interna, no hace falta leerlo)

### Estado verificado el 2026-08-07

| Comprobación | Resultado |
|---|---|
| Reservas en Calendly (API real) | 12 |
| Reservas en `calendly_scheduled_events` | 5 |
| Última que entró bien | Daniil, reservada 2026-07-27 |
| Perdidas | Diego Silva (08-04), Aroon / Susana / Kenneth / Meritxell (08-06) |
| Estado del webhook en Calendly | `active`, scope `organization`, 3 eventos suscritos, sin reintentos (`retry_started_at: null`) |
| Respuesta del endpoint en producción | 401 correcto ante firma inválida: la puerta está viva |
| Asientos de Calendly | 1 (Adrián, owner) |
| `tracking` en el invitee | Existe: `utm_source/medium/campaign/content/term`, hoy todos null |
| `questions_and_answers` | 9 preguntas con teléfono, IG, ocupación, objetivo, ruta, tiempo, compromiso. No se guarda ninguna |
| `invitee_phone` en BD | null en las 5 filas (se lee `text_reminder_number`, que viene null; el teléfono real está en Q&A) |
| `calendar_bookings` | 0 filas |
| Equipo | 1 setter (Juanda), 1 closer (Paolo), 3 super_admin |

### Archivos implicados

- `src/app/api/webhooks/calendly/route.ts`: receptor. Devuelve 200 aunque falle, y hace `return ok:true, skipped:true` si no reconoce la forma del mensaje
- `src/lib/calendly.ts`: cliente API. `listScheduledEvents()` existe pero **no lo llama nadie**
- `src/app/api/admin/calendly/setup/route.ts`: sincroniza solo event types, no reservas
- `src/app/api/admin/calendly/events/route.ts`: lee la tabla para la pestaña Calendly
- `src/features/calendario/components/calendario-admin.tsx`: pantalla `/calendario`
- `src/features/dashboard/components/main-dashboard.tsx:566` y `:630-638`: lee `calendar_bookings` (vacía) y filtra `status === "completed"`, un valor que no existe en su CHECK
- `src/features/sales/components/registrar-venta-widget.tsx` y `registrar-venta-modal.tsx`: el widget que pasa a tener menú
- `src/app/(main)/layout.tsx:88`: donde se monta el widget
- `supabase/migrations/20260620_calendly_integration.sql`: tablas `calendly_*`

### Modelo de datos previsto

```sql
-- Atribución y datos que hoy se tiran
ALTER TABLE calendly_scheduled_events
  ADD COLUMN IF NOT EXISTS host_email    text,
  ADD COLUMN IF NOT EXISTS setter_id     uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS setter_source text,   -- 'utm' | 'manual'
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS utm_content   text,
  ADD COLUMN IF NOT EXISTS answers       jsonb,
  ADD COLUMN IF NOT EXISTS contact_id    uuid REFERENCES contacts(id),
  ADD COLUMN IF NOT EXISTS synced_from   text DEFAULT 'webhook'; -- 'webhook' | 'backfill'

-- Registro crudo de todo lo que entra: sin esto se investiga a ciegas
CREATE TABLE IF NOT EXISTS calendly_webhook_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event        text,
  signature_ok boolean,
  outcome      text,        -- 'processed' | 'skipped' | 'error'
  reason       text,
  raw          jsonb,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE calendly_webhook_log ENABLE ROW LEVEL SECURITY;

-- Clasificar la agenda: sin esto los números mezclan Invisalign con ventas
ALTER TABLE calendly_event_types
  ADD COLUMN IF NOT EXISTS purpose text
    CHECK (purpose IN ('venta','onboarding','personal','sin_clasificar'))
    DEFAULT 'sin_clasificar';

-- Enlace propio de cada setter
CREATE TABLE IF NOT EXISTS setter_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug       text NOT NULL UNIQUE,   -- viaja en utm_content
  created_at timestamptz DEFAULT now()
);
ALTER TABLE setter_links ENABLE ROW LEVEL SECURITY;

-- Reporte diario del setter: UNA fila por persona y día
CREATE TABLE IF NOT EXISTS setter_daily_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date    date NOT NULL,
  conversaciones integer NOT NULL DEFAULT 0 CHECK (conversaciones >= 0),
  followups      integer NOT NULL DEFAULT 0 CHECK (followups      >= 0),
  ofertas        integer NOT NULL DEFAULT 0 CHECK (ofertas        >= 0),
  agendadas      integer NOT NULL DEFAULT 0 CHECK (agendadas      >= 0),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (profile_id, report_date)
);
ALTER TABLE setter_daily_reports ENABLE ROW LEVEL SECURITY;
```

El `UNIQUE (profile_id, report_date)` es lo que hace que "un día, una línea". Al abrir el formulario se busca la fila de hoy de esa persona: si existe, sus números salen ya escritos en las casillas y al guardar se actualiza esa misma fila. Si no existe, se crea. Es imposible que salgan dos líneas del mismo día ni que se sumen sin querer.

### Gotchas

- [ ] El webhook **devuelve 200 aunque falle**, y también cuando no reconoce el mensaje. Es la causa más probable del silencio de diez días.
- [ ] El teléfono **no** está en `text_reminder_number` (viene null): está en `questions_and_answers`, pregunta "Teléfono (con prefijo de tu país)".
- [ ] Adrián tiene Calendly en **Asia/Dubai**; el OS asume Europe/Madrid. Cuidado al agrupar por día, tanto en las llamadas como en el reporte diario del setter.
- [ ] Las preguntas del formulario se identifican por **texto**, y Adrián puede renombrarlas. Guardar el jsonb entero y mapear con tolerancia, nunca por posición fija.
- [ ] Traer el histórico **no puede** disparar correos de confirmación, avisos al equipo, ni bajar de escalón a un `alumno` (guarda de `stage-guard.ts`).
- [ ] Solo hay 1 asiento de Calendly: la atribución por setter no se puede resolver con una agenda por persona.
- [ ] La pantalla del reporte necesita permiso por rol (la matriz de Equipo se deriva del menú) y respetar `ShellHeader` + `PageContainer`.
- [ ] El setter solo puede ver y escribir **su propia** fila. Verificarlo entrando como Juanda, no como admin: siendo admin todo funciona y el fallo es invisible.

### Anti-patrones

- NO borrar ni reescribir filas existentes al traer el histórico: siempre upsert por `uri`.
- NO inventar columnas ni valores fuera de los CHECK vigentes.
- NO dejar que una agenda nueva entre contando en los números sin clasificar.
- NO sustituir el gráfico por texto (REGLA #15).
- NO dejar que el reporte del setter cree dos filas del mismo día.

---

*PRP pendiente de aprobación. No se ha modificado ni una línea de código.*
