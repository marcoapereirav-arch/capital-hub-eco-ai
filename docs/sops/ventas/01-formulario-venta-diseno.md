---
title: Formulario Venta - Diseno propuesto
order: 1
---

# Formulario "Registrar venta" — propuesta de diseño

> Estado: **pendiente de aprobación de Marco**. Cuando dé OK, se construye el formulario en `/contactos` y/o como sección propia.

## Inspiración

- **Fillout IdealOps "Master Form"**: https://idealops.fillout.com/t/ttPou5KM5Fus
- **Blog**: https://docs.ideal-ops.io/start/master-form/

El master form de IdealOps tiene 5 tipos de close (Sales Call, Direct, Scheduled Payment, Refund, Invoice) + integración Close.com + UTM tracking + variables auto-pobladas por sales_call_id. **Nosotros lo simplificamos** a lo que necesitamos hoy.

## Decisiones tomadas (extraídas del transcript 3 jun + análisis IdealOps)

| Aspecto | Decisión |
|---|---|
| Trigger | Closer rellena DESPUÉS de cerrar la venta por llamada o por DM |
| 3 efectos en 1 submit | (1) crea/actualiza contacto, (2) vuelca al KPI dashboard, (3) dispara email con acceso a la App |
| Distinguir source de cierre | Dropdown: Sales Call vs Direct Close (sin call previa) |
| Pago multi-vía | Todo manual: closer registra cuánto y por dónde llegó |
| Revenue vs Cash Collected | Separados (transcript Adrián lo dejó claro) |
| Multi-producto | Permitido por BD, default 1 (anti objeto-brillante) |
| Auto-acceso alumno | Sí: al guardar dispara email Resend con magic link a la App |
| Brandeado | Todos los emails usan template `_layout.tsx` con colores Capital Hub |

---

## Diseño del formulario — 5 secciones

### Sección 1 — Tipo de cierre (radio buttons, default según contexto)
```
( ) Sales Call (cierro tras llamada agendada)
( ) Direct Close (cierro por DM / referencia / cold sin call previa)
```

Si **Sales Call** → muestra dropdown "Vincular con call existente" que busca en `calendar_bookings` del lead por email/teléfono. Auto-rellena: contact_id, nombre, email, teléfono, source, owner_assignee.

Si **Direct Close** → muestra campos manuales del lead (nombre, email, teléfono, source).

### Sección 2 — Lead
```
* Nombre completo          [text]
* Email                    [email]
  Teléfono                 [tel]
  Origen / source del lead [text]  ej: instagram, follow-me ad, referido X
```

### Sección 3 — Producto
```
* Producto (selección múltiple, default 1)
  [ ] IA Integrator
  [ ] Media Buyer Digital
  [ ] Comercial Closing
```

Nota: la BD permite varios productos por contacto, pero la UI default selecciona 1. Si marcan más de 1 se acepta sin pelear.

### Sección 4 — Cifras
```
* Facturación / Revenue (€)         [number, 2 decimals]
* Cash Collected (€)                 [number, 2 decimals]
* Método de pago                     [select]
  · Stripe (full pay)
  · Stripe (split pay)
  · Hotmart (financiación hasta 5K)
  · SeQura (financiación hasta 6K)
  · Transferencia bancaria
  · Whop (manual, no automático)
  · Otro (texto libre)

  Si "split pay": campos extras
  · Importe inicial pagado hoy (€)   [number]
  · Número de cuotas restantes       [int]
  · Importe por cuota (€)            [number]
  · Frecuencia                       [select: mensual, bimestral]
```

### Sección 5 — Quién cerró
```
* Quién cerró    [dropdown brandkit, NO <select> nativo]
  (poblar desde tabla profiles — TODAS las personas activas del SaaS, cualquier rol)
  · Cada persona con avatar de iniciales + nombre + rol
  · (al invitar a alguien nuevo al equipo aparece aquí automáticamente)
```

**Regla (2026-06-26):** la lista de "quién cerró" la alimenta `GET /api/admin/sales/register` desde `profiles WHERE active = true` — **sin filtrar por rol**. Cualquiera del equipo (super_admin, marketing, closer, setter, formador) puede figurar como cerrador. Antes filtraba `role IN ('super_admin','closer')` y faltaban nombres. Se sincroniza en vivo: el modal refetchea el endpoint cada vez que se abre, así que un miembro recién invitado aparece sin redeploy. La UI es un `DropdownMenu` de Radix (portaleado, brandkit) en vez de un `<select>` nativo, porque las opciones nativas en dark se ven apretadas/ilegibles ("pegadas").

### Sección 6 — Notas del closer (opcional)
```
Notas internas               [textarea, max 2000 chars]
  ej: "Quiere empezar Comercial primero. Mencionó que su hermano también
       está interesado. Sentí buena conexión, fácil de cerrar."
```

### Botón submit
```
[ Registrar venta y enviar acceso al alumno ]
```

---

## Flujo backend al submit

```
1. Validar datos (Zod schema)
2. Si Sales Call:
   - Buscar booking en calendar_bookings por email
   - Si encuentra, marcar booking.status = 'attended'
   - Usar contact_id ya vinculado al booking
3. Si Direct Close:
   - Buscar contacto por email
   - Si no existe, crear contacto nuevo con stage='won'
   - Si existe, actualizar a stage='won'
4. Update contacto:
   - products = (existentes) UNION (nuevos seleccionados)
   - total_revenue += revenue de este cierre
   - total_cash_collected += cash_collected
   - owner_assignee = closer que cerró
   - last_call_at = now() si Sales Call
5. Crear contact_journey_event:
   - type = 'sale'
   - title = "Venta cerrada: {productos} por {revenue}€ (cash {cash_collected}€)"
   - data = { revenue, cash_collected, payment_method, split_pay, closer }
6. Si split_pay:
   - Crear tabla sale_payments con plan de cuotas pendientes
   - (TODO: cron mensual que recuerda al admin que vence cuota)
7. Disparar email Resend al alumno con magic link a app.capitalhubapp.com/accept/[token]
   - Token único guardado en student_invites (tabla nueva)
   - Brandeado con template _layout
   - Subject: "🎉 Bienvenido a Capital Hub — accede aquí"
8. Disparar notif a Marco con notifyMarcoPurchase (estado actual del flow MIFGE reutilizable)
9. Respond 200 con { ok: true, contact_id, sale_event_id }
```

---

## Diferencias deliberadas vs IdealOps

| IdealOps tiene | Nosotros | Razón |
|---|---|---|
| 5 tipos de close (Sales Call, Direct, Scheduled, Refund, Invoice) | Solo 2 al principio (Sales Call, Direct). Refund + Scheduled Payment los añadiremos cuando aparezcan casos reales. | Simpleza MVP |
| Integración Close.com CRM | Nuestro CRM `/contactos` es el destino | Tenemos uno propio |
| UTM tracking auto desde sales_call | Nuestro `source` se rellena manual o desde IG outreach | Tracking se hace en otra capa |
| Variables R3:R12 con reset manual | Submit limpio sin reset (es Next.js) | Stack diferente |
| Auto-populated setter/triager/closer/affiliate | Solo "closer" porque al principio NO habrá setter ni triager separados (Adrián cerrará y los juniors solo hacen DMs) | Roles más simples |
| Generación de invoice oficial | NO en MVP. Cuando llegue el contable se hace. | Pendiente |

---

## Estructura de tablas nuevas necesarias

### `sale_payments` (para split-pay)
```sql
id uuid primary key
contact_id uuid references contacts
journey_event_id uuid references contact_journey_events
sequence int (1, 2, 3...)
due_date date
amount numeric(10,2)
status text (pending, paid, late, refunded)
paid_at timestamptz
```

### `student_invites` (para auto-acceso a App via BYOE)
```sql
id uuid primary key
contact_id uuid references contacts
email text not null
token text not null unique  -- el magic link token
expires_at timestamptz
accepted_at timestamptz
products text[]  -- a qué formación tiene acceso
created_at timestamptz
```

---

## Wireframe (cómo se ve en la UI)

```
┌─────────────────────────────────────────────────────────────────┐
│ REGISTRAR VENTA                                          [X]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo de cierre                                                 │
│  ● Sales Call    ○ Direct Close                                 │
│                                                                 │
│  ┌─ Vincular con call existente ────────────────────────┐       │
│  │ [▼ Israel Ramírez · 3 jun 18:00 · israis007@... ]    │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  Lead                                                           │
│  Nombre [Israel Ramírez       ]  Email [israis007@gmail.com ]   │
│  Teléfono [+34...     ]  Origen [instagram     ]                │
│                                                                 │
│  Producto (puedes seleccionar varios, default 1)                │
│  [✓] IA Integrator    [ ] Media Buyer    [ ] Comercial          │
│                                                                 │
│  Cifras                                                         │
│  Revenue (€)   [2990.00]    Cash collected (€)  [2300.00]       │
│  Método pago   [▼ SeQura — financiación hasta 6K            ]   │
│                                                                 │
│  [▼] Cuotas (si split pay)                                      │
│      Inicial hoy [800] · Cuotas restantes [6] x [365.00] · /mes │
│                                                                 │
│  Cerró                                                          │
│  Comercial [▼ Adrián                                       ]    │
│                                                                 │
│  Notas internas                                                 │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ Quiere empezar Comercial primero. Sentí buena…       │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  [ REGISTRAR VENTA Y ENVIAR ACCESO AL ALUMNO ]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dónde vive el formulario en el OS

**Opción A (recomendada):** botón "+ Registrar venta" en el header de `/contactos`. Abre modal grande con este formulario.

**Opción B:** sección dedicada `/ventas/registrar`. Más visible pero rompe el flow natural (closer ya está en Contactos buscando al lead).

**Mi voto: A.** Cuando me confirmes empiezo a construir.

---

## Preguntas que no puedo decidir solo

1. **¿OK con los nombres exactos de productos** (`IA Integrator`, `Media Buyer Digital`, `Comercial Closing`)? ¿Algún cambio?
2. **¿OK con los métodos de pago listados**? (Stripe full/split, Hotmart, SeQura, Transferencia, Whop, Otro)
3. **¿Hay tier de precio o todos los productos son ~2.990€**? Si hay tiers, el campo Revenue puede sugerir importes default.
4. **¿Sale_payments con cron de recordatorios** o lo dejamos sin cron al principio (closer revisa manual)?
5. **¿El email de acceso lleva token magic link** (BYOE) o solo enlace genérico a app.capitalhubapp.com/login?
   - Mi recomendación: **magic link**. Pero necesita que la tabla student_invites + endpoint /accept/[token] + middleware en la App estén listos.
6. **Opción A o B** (modal en `/contactos` o sección dedicada)?

Cuando me respondas las 6 preguntas (o me digas "decide tú las 6, procede"), construyo el formulario.

---

## Tiempo estimado de construcción

- Backend (endpoint + lógica + envío email): 3h
- UI form modal con condicionales: 3h
- Integración con BYOE auth + student_invites: 2h
- Testing flow completo: 1h

**Total ~9h.**
