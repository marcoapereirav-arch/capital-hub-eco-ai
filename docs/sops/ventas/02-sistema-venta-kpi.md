---
title: KPI de ventas · cómo medir y dónde verlo
order: 2
area: ventas
---

# Sistema de KPI de ventas

## Para qué sirve
Medir el rendimiento real del negocio en tiempo real: revenue, cash collected, conversion rate, performance por closer.

## Dónde se ven los datos

### Dashboard general `/`
Hero del modo Foco webinar muestra:
- Tareas completadas del foco
- Tiempo transcurrido

PERO el KPI de ventas dedicado todavía está pendiente de UI. Hoy los datos están en BD pero la vista visual está en construcción.

### Contactos `/contactos`
Cada columna del pipeline muestra:
- Count de contactos en ese stage
- (Pendiente UI) suma de revenue de la columna

### Drawer de contacto
- total_revenue: facturación acumulada de ese contacto
- total_cash_collected: cash real ingresado
- products[]: qué compró

## KPIs primarios

### Revenue
Facturación bruta. Suma de `contacts.total_revenue` o `contact_journey_events.data->>revenue` para eventos tipo `sale`.

### Cash collected
Lo que realmente entró en caja. Para split pay puede ser menor que revenue (resto se cobra en cuotas).

### Conversion rate
- booked → attended: % de leads que vienen a la llamada
- attended → won: % de llamadas que cierran (closing rate)
- booked → won: conversion total del agenda

### Performance por closer
- Revenue cerrado por closer en el mes
- Closing rate por closer
- Ticket medio por closer

### Ticket medio (AOV)
Revenue total / número de ventas.

### LTV (Lifetime Value)
Total revenue por contacto en su historia.

## Cómo se calcula (queries clave)

### Revenue del mes actual
```sql
SELECT SUM((data->>'revenue')::numeric) AS revenue_mes
FROM contact_journey_events
WHERE type = 'sale'
  AND created_at >= date_trunc('month', now());
```

### Ventas por closer en últimos 30 días
```sql
SELECT
  data->>'closer_name' AS closer,
  COUNT(*) AS ventas,
  SUM((data->>'revenue')::numeric) AS revenue
FROM contact_journey_events
WHERE type = 'sale'
  AND created_at >= now() - interval '30 days'
GROUP BY data->>'closer_name'
ORDER BY revenue DESC;
```

### Conversion rate booked → won
```sql
WITH booked AS (
  SELECT COUNT(*) AS n FROM contacts WHERE stage IN ('booked', 'attended', 'won')
),
won AS (
  SELECT COUNT(*) AS n FROM contacts WHERE stage = 'won'
)
SELECT (won.n * 100.0 / booked.n) AS conv_pct FROM booked, won;
```

## Fuente de verdad
`contact_journey_events` con `type='sale'`. Cada venta es un evento ahí con todos los datos en `data` jsonb.

## Datos pendientes de capturar (no se miden hoy)
- **CAC** (Customer Acquisition Cost): requiere data de gasto en ads
- **CPL** (Cost per Lead): igual
- **MRR / ARR**: la mayoría son ventas one-shot, hay poca recurrencia
- **Churn**: no aplica a HT one-shot

## Reglas
- **Revenue solo cuenta cuando hay evento `sale` en BD.** No se cuenta venta hasta que el closer rellena el widget.
- **Cancelaciones**: si hubo error en una venta, NO se borra el journey_event. Se crea uno nuevo tipo `sale_refund` o `sale_correction` con monto negativo.
- **Splits y planes de pago**: revenue = total prometido, cash = solo lo cobrado HOY.

## Reportes que se podrían construir (UI pendiente)
- Dashboard ventas con todos los KPIs en vivo
- Reporte mensual exportable a CSV
- Leaderboard de closers
- Funnel visual con conversion rates por stage
- Cohorts por mes / canal de adquisición

## Tareas operativas para producción
- Revisar diariamente cada nueva venta en /contactos
- Marcar booking como `attended` o `no_show` tras cada llamada (en /calendario)
- Si venta fue por error: crear evento de corrección, no borrar
- Mantener owner_assignee actualizado para tracking de pipeline
