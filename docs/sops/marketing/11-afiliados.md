---
title: Afiliados · links a cualquier funnel, atribución y etiquetado
order: 11
area: marketing
---

# Afiliados

Un afiliado es **una persona que trae tráfico con su propio enlace**. No es una campaña de
pago (eso es Ads) ni un canal automático: es alguien con nombre y apellido.

La sección vive en `/afiliados` y tiene **dos pestañas**: Dashboard (los números) y
Configuración (las personas y sus links).

## La regla que manda

> Marco, 2026-08-07: *"el link no puede ir solo a test de personalidad... yo lo quiero crear
> directamente con cualquier funnel que yo quiera... tienes que crear este sistema"*.

**Está prohibido escribir a fuego el destino de un link de afiliado.** El funnel se elige
siempre, y la lista de funnels **no se escribe a mano**: sale del catálogo único del OS
(`src/lib/meta/funnel-catalog.ts`), el mismo que usa la pantalla de Eventos de Ads.

**Consecuencia práctica: un funnel nuevo aparece solo en Afiliados.** Dar de alta el funnel
en el catálogo ya es obligatorio hoy para que mida en Ads, así que no hay ningún paso nuevo
que recordar.

## Cómo funciona, de punta a punta

```
Link del afiliado            ch.capitalhubapp.com/<funnel>?utm_source=<afiliado>
        ↓
La persona abre el link      se registra la VISITA (funnel + navegador + día)
        ↓
Deja sus datos               contacto con affiliate_slug + funnel_slug
                             + etiqueta fuente:<afiliado>  + etiqueta origen:<funnel>
        ↓
Compra                       la venta guarda de qué afiliado vino, y el aviso lo dice
        ↓
Dashboard                    visitas, personas, agendados, alumnos e ingresos por persona
```

### Las piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| Catálogo de funnels | `src/lib/meta/funnel-catalog.ts` | La lista de funnels que existen. Fuente única. |
| Funnels para links | `src/lib/afiliados/funnels.ts` | Deriva del catálogo y construye el link. **Único sitio que arma un link.** |
| Atribución | `src/lib/atribucion/atribucion.ts` | Decide quién trajo al lead y le pone sus etiquetas. **Único sitio.** |
| Traqueo de visitas | `src/lib/utm/UtmCapture.tsx` + `/api/afiliados/visita` | Cuenta quién abrió cada link, en cualquier funnel. |
| Pantalla | `src/features/afiliados/` | Las dos pestañas. |
| Candado | `scripts/check-afiliados.mjs` | Impide que esto se rompa. Corre al construir. |

### Las tablas

| Tabla | Para qué |
|---|---|
| `affiliates` | La persona: identificador, nombre, activo. |
| `affiliate_links` | Un link = un afiliado + un funnel. |
| `affiliate_visits` | Cada visita, con su funnel. Una por navegador, funnel y día. |
| `contacts.affiliate_slug` | Quién lo trajo (first touch). |
| `contacts.funnel_slug` | Por qué funnel entró. |

## Reglas que no cambian

1. **First touch.** La primera fuente que trajo al contacto manda. Si vuelve por otro link,
   la fuente original no se pisa. Vale igual para el funnel.
2. **El identificador de un afiliado no se cambia nunca.** El nombre sí. Cambiar el
   identificador dejaría sin atribuir todos los links ya repartidos y partiría el historial.
3. **Desactivar no borra.** Deja de ofrecerse para links nuevos; sus números siguen contando.
4. **Los links van al dominio público** (`ch.capitalhubapp.com`), nunca al del OS.
5. **La etiqueta nace con el afiliado**, no con su primer lead.
6. **Solo super_admin** crea, edita o borra afiliados y links. Leer, cualquiera del OS.

## De dónde sale cada número del Dashboard

| Número | Fuente | Fecha que manda |
|---|---|---|
| Visitas | `affiliate_visits` | la de la visita |
| Personas, agendados, alumnos | `contacts` con `affiliate_slug` | el alta del contacto |
| Ingresos | eventos `sale` de `contact_journey_events` | **la de la venta** |

Los ingresos salen del evento de venta y **no** de `contacts.total_revenue` a propósito: ese
campo es un acumulado sin fecha, y con un filtro de "esta semana" metería ventas viejas.

Cada contacto cae en **una sola** casilla, y las casillas suman el total:
`dm/lead/lead_cualificado` → Personas nuevas · `agendado` → Agendaron ·
`seguimiento/no_show` → en juego · `alumno` → Alumnos · `perdido` → Perdidos.

## El candado

`npm run check:afiliados`, enganchado a `prebuild`. Comprueba tres cosas y para la
construcción si alguna falla:

1. La lista de funnels sale del catálogo, no escrita a mano.
2. Todo opt-in público (`src/app/api/optin/**`) usa la pieza única de atribución.
3. Nadie construye un link con `utm_source` por su cuenta.

## Lo que estaba roto antes del 2026-08-07

Todo esto se encontró mirando el código, y está arreglado:

- **El link iba siempre al Test de Personalidad**, escrito a fuego en la API.
- **Y al dominio equivocado**: usaba `NEXT_PUBLIC_SITE_URL` (que no está definida) y caía en
  `os.capitalhubapp.com`, que es el OS, no por donde entran los leads.
- **Tres de los cinco funnels no guardaban la fuente.** Reserva de sesión, MIFGE y LT8: un
  lead que entrara por ahí con el link de Paolo se guardaba sin fuente, **en silencio**.
- **Los contadores escondían gente.** Solo contaban lead, agendado y alumno; quien estaba en
  seguimiento, no show, perdido o lead cualificado no aparecía en ningún número.
- **No se podía renombrar, desactivar ni borrar** un afiliado. La columna `active` existía y
  la pantalla no la usaba.
- **Un afiliado con visitas y sin leads desaparecía del ranking**, porque el gráfico se
  escondía entero cuando la métrica elegida valía cero. Encontrado por la prueba, no
  deducido.

## Lo que queda por confirmar

**La atribución de `/reservar` depende del webhook de Calendly, y ese webhook nunca ha
corrido**: `calendly_webhook_log` tiene 0 filas. El código ya manda las UTMs dentro del
widget y lee `tracking.utm_source` de la respuesta de forma defensiva, pero **eso no está
visto con una reserva de verdad**. Hasta que se vea: las visitas de `/reservar` sí se
cuentan, el contacto de esa reserva puede quedar sin fuente. Ver SOP `producto/45`.

## Cambios versionados

### 2026-08-07 — El sistema completo
Afiliados pasa de una pantalla con un link fijo a un sistema: dos pestañas, links a
cualquier funnel, atribución en una sola pieza para los cinco funnels, traqueo de visitas
que funciona hasta en los funnels sin formulario, etiqueta creada con el afiliado y
rellenada hacia atrás en los 18 contactos que ya tenían fuente, el afiliado visible en la
venta y en el aviso, y un candado que impide que vuelva a romperse.
