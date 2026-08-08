---
title: La franja negra de abajo en el iPhone (SIN RESOLVER)
order: 62
area: producto
---

# La franja negra de abajo en el iPhone

> **ESTADO: SIN RESOLVER a 2026-08-08.** Seis intentos fallidos. Este documento existe
> para que el siguiente chat **no repita ninguno**.

## Qué ve Marco

Abre el OS en su iPhone (instalado en la pantalla de inicio) y debajo de la barra de
pestañas hay una franja negra pegada al borde que no encaja. Sus palabras: *"no está
adaptado al teléfono, no está diseñado como una aplicación nativa, se sigue viendo
arcaico"*.

## El único dato duro que hay

Medido **píxel a píxel** sobre su captura (`1320x2868`, iPhone 16 Pro Max), no deducido:

- La superficie de la barra (`rgb(22,23,25)`) **acaba a 62 puntos del borde** de la pantalla.
- Esos 62 puntos son de color `rgb(4,5,6)`.
- La barra mide 83 puntos (49 de contenido + 34 de zona segura), que es lo correcto.
- **62 puntos es exactamente el alto de la zona del reloj** de ese teléfono.

O sea: **lo que se ancla con `fixed bottom-0` no llega al borde de la pantalla, se queda 62
puntos corto.** No es un color mal puesto ni falta de relleno: es que la ventana es más
corta que la pantalla.

## Los seis intentos que NO funcionaron

No repetirlos.

| # | Qué se probó | Por qué no era |
|---|---|---|
| 1 | Quitar la transparencia y el desenfoque de la barra (`bg-card/95 backdrop-blur` a opaco) | El problema no era la transparencia |
| 2 | Poner la barra del mismo color que la página | Hizo la franja MÁS visible |
| 3 | Pintar el fondo también en el `html` | El color no era el problema |
| 4 | Dar superficie propia a la barra (`bg-popover`) y bajar la fila a 49 puntos | Mejoró el aspecto, no quitó la franja |
| 5 | Poner el color de la barra en el lienzo del navegador (`html`) | No llegó a verse: la franja sigue |
| 6 | Quitar `interactive-widget` del meta del viewport | Era una sospecha razonable (es de Android), pero no lo resolvió |

## Lo que SÍ salió de aquí, y era un fallo real

**Los tres tonos oscuros del OS no eran los del brandkit.** Estaban escritos en `oklch` a
ojo y al convertirlos daban otra cosa:

| Token | Daba | El brandkit dice |
|---|---|---|
| `--background` | `#040506` | `#0F0F12` |
| `--card` | `#121314` | `#131318` |
| `--popover` | `#161719` | `#16161B` |

El fondo del OS era **casi negro puro** en vez del carbón de la marca. Corregido: ahora van
con el valor exacto. **Regla que sale de esto: los colores del brandkit se escriben con su
valor exacto, nunca convertidos a ojo a otro formato.**

## Por qué se falló seis veces (la causa de fondo)

**Un navegador sin pantalla da CERO en las zonas seguras.** Todas las comprobaciones salían
limpias con el marco roto. Cada intento fue una hipótesis leyendo código, publicada como si
fuera un arreglo.

Y esta máquina **no tiene Xcode**, así que no hay simulador de iPhone.

## Lo que ya está montado para el siguiente chat

**1. Las zonas seguras se pueden simular.** Ya no se usa `env(safe-area-inset-*)` suelto por
el código: todo pasa por `--sat` / `--sab` / `--sal` / `--sar`, declaradas en el `html`. En
el teléfono valen lo que diga el sistema; en una prueba se les puede dar un valor:

```js
await page.addStyleTag({ content: ':root{--sat:62px !important;--sab:34px !important}' })
```

**2. La app manda las medidas del teléfono sola.** Al abrirla desde un iPhone, envía una vez
a `/api/diag/marco`: alto de ventana contra alto de pantalla, valor real de las zonas
seguras, dónde acaba de verdad lo que se ancla abajo, dónde acaba la barra, y si va
instalada.

Se leen así:

```sql
select value from public.app_settings where key = 'diag_movil';
```

Guarda las **últimas 10**, y el filtro está en el servidor (solo iPhone y Android, fuera
robots). Eso es porque **dos medidas buenas se perdieron**: una la pisó el Mac de Marco y
otra el propio robot de verificación al terminar de publicar.

**Es código TEMPORAL.** Se borra en cuanto la franja quede resuelta:
`src/app/api/diag/marco/route.ts`, `src/features/shell/components/diag-movil.tsx`, su
montaje en `src/app/(main)/layout.tsx`, y la pantalla `src/app/(public)/diag/`.

## Por dónde seguir

Lo que falta es **un solo dato**: `window.innerHeight` contra `window.screen.height` en su
teléfono. Con eso se sabe cuál de las dos causas es, y piden arreglos **opuestos**:

- **Si la ventana es más corta que la pantalla:** lo anclado nunca llegará al borde. Hay que
  atacar por qué el `viewport-fit=cover` no se está aplicando (posible caché de iOS al
  instalar la app: desinstalar y volver a añadir a la pantalla de inicio lo descartaría en
  un minuto).
- **Si la ventana mide lo mismo que la pantalla:** entonces lo anclado sí llega, y el hueco
  lo está metiendo algún contenedor. Habría que buscar el ancestro que crea marco de
  referencia (`transform`, `filter`, `backdrop-filter`, `contain`, `will-change`), que es la
  causa raíz 3 del SOP [`producto/47`](47-reglas-ui-contraste-legibilidad.md).

**Probar a ciegas puede empeorarlo:** los dos arreglos son contrarios.

## Lo demás del teléfono que SÍ quedó resuelto

- La barra de abajo son **Dashboard, CRM, Ads e Instagram**, y la hoja "Más" tiene su botón
  de Cerrar (antes no tenía ninguno y Marco se quedaba atrapado).
- El widget de registrar venta ya no se mete debajo del reloj: usaba `vh`, que en el iPhone
  **incluye la zona del reloj**. Ahora usa `dvh` descontándola.
- Todas las ventanas del OS se pintan en el `body`, tienen un solo desplazamiento y salida
  visible a 44 puntos. Un hallazgo del barrido: en las hojas del kit el botón de cerrar va
  anclado **dentro de lo que se desplaza**, así que en un formulario largo desaparecía.
- El avatar abre tu cuenta con Mi perfil y Cerrar sesión.

## Cambios versionados

### 2026-08-08: creado
Tras seis intentos fallidos con la franja. Se documenta para que el siguiente chat empiece
por el dato y no por una hipótesis.
