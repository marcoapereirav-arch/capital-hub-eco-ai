---
title: Venta manual desde la ficha + movimientos manuales que disparan todo
order: 52
---

# Venta manual + "Ventas por completar"

Feature pedida por Marco (2026-07-07). Objetivo: ser autosuficiente para hacer a mano lo que hacen las automatizaciones, sin que nada se quede a medias.

## Reglas

1. **Mover una tarjeta a mano dispara las notificaciones.** Antes, arrastrar un contacto en el CRM (kanban) o cambiarlo de stage en la ficha solo cambiaba de columna. Ahora, cada cambio de stage manual inserta una notificación in-app a los super_admins (tipo `manual_stage_change`), igual que hacen las automatizaciones. Se dispara desde el `PATCH /api/admin/contacts/[id]`.

2. **Mover a "Alumno" abre el flujo de venta (no mueve a ciegas).** Al soltar/seleccionar Alumno salta un popup: *rellenar la venta ahora o más tarde*.
   - **Ahora** → abre el formulario de "Registrar venta" (el mismo widget) prefilled con los datos del contacto. Al guardar, se registra la venta y se le da el acceso a la App (student_invite + email magic link).
   - **Más tarde** → el contacto pasa a Alumno pero marcado como **pendiente** (`contacts.sale_pending = true`). Queda en el bloque **"Ventas por completar"** del dashboard.

3. **Registrar venta desde la ficha.** La ficha del contacto tiene un botón verde **"Registrar venta"** que abre el mismo formulario prefilled. Ese formulario ES lo que da el acceso (por eso pide producto, cifras, quién cerró).

4. **El acceso va ligado al producto.** Mover a Alumno no manda el acceso a ciegas: necesita saber qué formación se le da. Por eso el formulario de venta es el que lo entrega.

## Dónde se completa un pendiente

Desde 3 sitios, todos abren el mismo formulario prefilled:
- **Ficha** del contacto → botón "Registrar venta".
- **Popup** al mover a Alumno → "rellenar ahora".
- **Dashboard** → bloque "Ventas por completar" → "Registrar venta" por fila.

Al registrar la venta, `sale_pending` se pone en `false` y el contacto deja de aparecer en "Ventas por completar".

## Datos

- `contacts.sale_pending` (boolean) + `contacts.sale_pending_since` (timestamptz). Migración `20260707100000_contacts_sale_pending.sql`.
- `/api/admin/sales/register` limpia `sale_pending` al completar.
- `/api/admin/contacts/[id]` (PATCH) acepta `sale_pending` y notifica en cambios manuales.

## Archivos

- Popup: `src/features/sales/components/sale-stage-prompt.tsx`.
- Modal de venta (ahora acepta `prefill` + `onRegistered`): `src/features/sales/components/registrar-venta-modal.tsx`.
- Kanban/interceptación: `src/features/contactos/components/contactos-page.tsx`.
- Ficha: `src/features/contactos/components/contact-drawer.tsx`.
- Dashboard (bloque pendientes): `src/features/dashboard/components/main-dashboard.tsx`.
- PATCH + notificaciones: `src/app/api/admin/contacts/[id]/route.ts`.

## Aplica a cualquier funnel

El movimiento automático (Calendly → Agendado, venta → Alumno) trabaja por email y sirve para CUALQUIER pipeline/funnel, no solo el del webinar. Esta feature añade la vía manual con los mismos efectos.

## Registrado en

- Panel `/automatizaciones`: entradas `manual_stage_change` y `register_sale` (actualizada). Ver SOP producto/21.

## Cambios versionados

- **2026-07-07**: creación. Movimiento manual notifica; popup ahora/más tarde al pasar a Alumno; botón "Registrar venta" en la ficha; bloque "Ventas por completar" en el dashboard; columna `sale_pending`.
