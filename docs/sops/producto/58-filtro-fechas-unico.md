---
title: Un solo filtro de fechas en todo el OS
order: 58
---

# Un solo filtro de fechas en todo el OS

**El OS tiene UN filtro de fechas. Ninguna pantalla se fabrica el suyo.**

Es `<PeriodFilter>`, en `src/components/ui/period-filter.tsx`. El desplegable que se ve
arriba en el dashboard principal.

---

## La regla

Toda pantalla que enseñe datos de un periodo usa ese filtro. Sin excepciones. Y **todo lo
que hay en esa pantalla obedece al mismo filtro**: los números, los gráficos y las tablas.
Nada trae su propio periodo por su cuenta.

```tsx
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"

const [rango, setRango] = useState<PeriodRange | null>(null)

<PeriodFilter value={rango ?? undefined} onChange={setRango} defaultPreset="30d" />
```

Devuelve `{ from, to, preset, label }`. Ese rango se pasa a todas las consultas de la
pantalla.

**Periodos que ofrece:** Hoy, Esta semana, Este mes, Últimos 7 días, Últimos 15 días,
Últimos 30 días, Este año y Personalizado con dos calendarios.

**Si falta un periodo, se añade AL FILTRO**, no se hace uno nuevo al lado.

---

## Por qué es regla dura

Marco, 2026-08-07: *"hay un filtro madre que siempre tiene que estar en todos los lugares
en los que haya que poner fecha... debes de anclarlo en un skill o debe estar claro que
siempre, siempre, siempre se debe utilizar el mismo patrón"*.

**El daño concreto:** la pestaña Campañas de Ads tenía siete botones propios (Hoy, Ayer,
7 días, 14 días, 30 días, Este mes, Mes pasado). Sus periodos no coincidían con los del
resto del OS, así que **el mismo "este mes" daba un número en el dashboard principal y otro
distinto en Ads**, y no había forma de saber cuál era el bueno. Un panel en el que dos
pantallas se contradicen no sirve para decidir nada.

---

## Lo que lo causó, y que ya no está

Había **un segundo filtro de fechas muerto** en el repo:
`features/dashboard/components/date-filter.tsx` y su
`features/dashboard/services/date-ranges.ts`. **No lo usaba nadie**, pero estaba ahí, y al
buscar "el filtro del OS" aparecía antes que el bueno. Eso fue exactamente lo que hizo que
Ads acabara con un tercero.

**Los dos archivos se borraron el 2026-08-07.** Regla derivada: un componente que no usa
nadie no es inofensivo. Es una trampa para el siguiente que busque, y se borra.

---

## El candado

`scripts/check-filtros.mjs`, enganchado a `predev` y `prebuild`. Una pantalla que junte
etiquetas de periodo escritas a mano sin usar `PeriodFilter` **ni arranca en local ni se
despliega**. Se corre suelto con `npm run check:filtros`.

**Excepciones**, en una lista visible dentro del script y siempre con su motivo:

| Pantalla | Por qué no es un filtro de informe |
|---|---|
| Calendario | Define franjas horarias y días de disponibilidad |

Si una pantalla nueva salta y de verdad no es un filtro de informe, se añade ahí
**explicando por qué**. Si es un filtro de informe, se arregla usando `PeriodFilter`.

---

## Y con Meta, traducción a fechas concretas

Meta tiene sus propios atajos (`date_preset=last_30d`, `this_month`) y **no coinciden con
los del OS**: "esta semana" del OS empieza el lunes, el de Meta no tiene por qué.

Por eso a Meta se le manda siempre el rango exacto (`time_range` con dos fechas), nunca su
atajo. Así lo que se ve en Ads cuadra con lo que se ve en el resto del OS. La traducción
vive en `src/lib/meta/insights.ts`.

---

## Cambios versionados

### 2026-08-07: creación
Ads dejó de tener sus siete botones propios y pasó a usar `PeriodFilter`. Borrado el filtro
muerto que causaba la confusión. Creado el candado `check-filtros.mjs` y enganchado a
`predev` y `prebuild`. Documentadas las dos excepciones legítimas. Fijado que a Meta se le
manda rango exacto y no sus atajos.
