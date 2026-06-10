---
title: Sistema de venta · widget flotante
order: 15
area: producto
---

# Sistema de venta — widget flotante en todo el OS

Reemplazo del form de Fillout. Cualquier closer puede registrar una venta desde **cualquier página del OS** sin perder el contexto.

## Qué es y dónde está

Botón verde redondeado abajo derecha **"Registrar venta"**. Visible en todas las rutas del OS (montado en el layout principal).

Al hacer click → modal full-screen mobile / centrado desktop con form de 6 secciones.

## Secciones del form

### 1. Tipo de cierre (2 cards)
- **Sales Call** — el lead vino tras llamada agendada
- **Direct Close** — sin llamada previa (DM, referral, viejo lead)

### 2. Lead
- Nombre completo
- Email (única clave de identidad)
- Teléfono (opcional)
- Origen (instagram, ads, referral...)

> Si el email YA existe en contactos: se actualiza esa ficha. No se duplica.

### 3. Producto comprado (multi-select)
- IA Integrator
- Media Buyer Digital
- Comercial Closing

> Por norma se selecciona 1. La UI permite varios por flexibilidad excepcional.

### 4. Cifras
- **Revenue** (€) — facturación bruta editable manualmente
- **Cash collected** (€) — lo que realmente entró en caja
- **Método de pago**: Stripe full / Stripe split / Hotmart / SeQura / Transferencia / Whop manual / Otro

### 5. Quién cerró
Dropdown con perfiles activos role `super_admin` o `closer` (Marco, Adrián, Nagai, etc).

### 6. Notas internas (opcional)
Para contexto: "quiere empezar IA primero", "mencionó interés futuro en CC", etc.

## Qué pasa al hacer Submit (4 acciones en 1 click)

1. **Upsert contacto** en `public.contacts`
   - Si existe: stage → `won`, suma revenue al total, añade products[]
   - Si no existe: crea nuevo con todos los datos, stage = `won`

2. **Crea evento en `contact_journey_events`** tipo `sale` con todos los detalles (revenue, payment_method, close_type, productos, closer)

3. **Crea `student_invites`** con:
   - Token único (32 hex chars)
   - Expira en 7 días
   - Marca metadata con revenue + cash_collected + payment_method

4. **Email magic link al alumno** vía Resend (template `welcome_alumno_ht`)
   - Asunto brandeado
   - Botón "Activar mi acceso" → link a `app.capitalhubapp.com/accept-invite/<token>`
   - Si NO acepta en 3 días: cron `welcome_alumno_followup` reenvía 1 vez

5. **Notif a Marco** (push interno + email) con resumen de la venta

6. **(Meta CAPI Purchase)** — envía evento a Meta Ads para optimización (cuando esté activo)

## Pantalla de confirmación
Tras submit exitoso:
- ✓ "Venta registrada · {revenue}€ · email enviado al alumno"
- Link al magic link generado (por si el alumno no recibe email)
- Botón "Ver contactos" para ir directo a la nueva ficha

## Endpoint API
- `GET /api/admin/sales/register` — devuelve lista de closers + productos + métodos pago
- `POST /api/admin/sales/register` — registra la venta (todas las 4 acciones)

## Tablas BD afectadas
- `contacts` (upsert)
- `contact_journey_events` (insert sale)
- `student_invites` (insert con token)
- `email_logs` (insert tracking welcome_alumno_ht)

## Reglas operativas
- **Nunca registrar venta con email falso o test.** Cada venta dispara email real al alumno.
- **Revenue ≠ Cash Collected.** Revenue es facturación, cash es lo cobrado. Si split pay, revenue puede ser mayor.
- **Cerró ≠ Owner.** El closer es quien hizo la llamada. El owner del contacto se mantiene si ya estaba asignado a otro.
- **Si el alumno ya recibió un magic link antes (de otra venta):** se invalida el anterior cuando se genera el nuevo.

## Verificación post-venta
1. `/contactos` → buscar email → debe estar en columna "Won" con revenue actualizado
2. `/contactos` → drawer → timeline → debe ver evento `sale` con todos los datos
3. Email del alumno → debe haber llegado en menos de 30 seg
4. `/email-marketing` > Envíos → debe aparecer envío `welcome_alumno_ht`

## Errores comunes
- Email del alumno bounces → revisar en `/email-marketing` el log + estado
- Magic link expirado → re-generar desde drawer del contacto (botón "Reenviar acceso")
- Venta registrada por error → no se borra, se crea evento `sale_correction` con notas
