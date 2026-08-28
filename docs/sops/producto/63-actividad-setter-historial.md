---
title: Actividad del setter y su historial diario
order: 63
area: producto
---

# Actividad del setter y su historial diario

Qué se mide cada día, quién lo rellena, quién lo puede corregir y qué queda guardado de
cada cambio. Pantalla: `/actividad`.

## Qué se mide

Cuatro números, uno por persona y día. Los nombres son los que se ven en pantalla y los
mismos en la base de datos, a propósito: un dato que se llama de tres formas se acaba
sumando mal.

| Campo | Qué cuenta |
|---|---|
| `conversaciones` | Conversaciones nuevas abiertas: gente con la que habló por primera vez |
| `followups` | Follow-ups nuevos: seguimientos que retomó |
| `ofertas` | Ofertas de llamada tiradas: veces que ofreció la llamada |
| `agendadas` | Llamadas agendadas: las que quedaron puestas en la agenda |

**Los cuatro no se suman entre sí.** Una oferta ocurre dentro de una conversación: sumarlos
daría un total que no significa nada. Por eso el gráfico de `/actividad` dibuja **una sola
métrica a la vez**, elegida con un selector, y nunca una barra apilada.

## Quién rellena y quién corrige

| Quién | Qué puede hacer |
|---|---|
| `setter` | Registrar y corregir **su** parte, cualquier día que ya haya pasado. Ve solo sus días |
| `super_admin` / `admin` | Lo mismo con el suyo, **más** registrar y corregir el de cualquier setter. Lo ve todo |
| Los demás roles | No ven la pantalla ni la API |

El parte se abre desde el botón verde flotante ("Registrar actividad") o desde cualquier día
de `/actividad`.

**Hasta el 2026-08-28 nadie podía corregir el parte de otro, ni un administrador.** Se abrió
porque quien corrige queda firmado en el historial: abrirlo no pierde trazabilidad, la crea.

## Qué guarda la base

### `setter_daily_reports` — el estado de hoy

Una fila por persona y día, con `UNIQUE (profile_id, report_date)`. Ese único es lo que
impide que salgan dos partes del mismo día o que los números se sumen sin querer.

Campos de firma añadidos el 2026-08-28:

- `created_by` — quién lo dio de alta. **No se puede reescribir nunca**: el disparador lo
  vuelve a poner al valor viejo en cada actualización.
- `updated_by` — quién firmó el último guardado. Lo pone SIEMPRE la sesión, jamás el cuerpo
  de la petición.

### `setter_report_events` — el historial

**Una fila por cada guardado.** Es la tabla que responde a "quién registró, quién corrigió,
a qué hora y qué cambió".

| Campo | Qué es |
|---|---|
| `profile_id` | De quién es el parte |
| `actor_id` | Quién firmó **ese** guardado. Puede no ser el dueño del parte |
| `accion` | `creado` · `editado` · `reconstruido` |
| `antes` / `despues` | Los cuatro números completos antes y después del guardado |
| `cambios` | Qué campos cambiaron, por nombre |
| `created_at` | Cuándo. Se enseña siempre en hora de Madrid |

Reglas duras de esta tabla:

- **La escribe el disparador, no la pantalla.** `setter_report_rastro_trg` se dispara
  `AFTER INSERT OR UPDATE`. Es imposible guardar sin dejar rastro: da igual que venga del
  botón, de la API o de una consulta a mano.
- **No tiene política de INSERT, UPDATE ni DELETE.** Por la API no escribe nadie, ni un
  administrador. Un rastro que se puede reescribir no sirve como rastro.
- **Un guardado que no cambia ningún número no deja línea.** Abrir el parte y darle a
  guardar tal cual no es una corrección.
- `report_id` puede quedarse en nulo (`ON DELETE SET NULL`): si algún día se borrara un
  parte, su rastro **no** se va con él.
- `reconstruido` marca las líneas rellenadas hacia atrás al crear el sistema. De esas no
  existen los valores de antes y la pantalla lo dice en voz alta en vez de inventarlos.

## La pantalla `/actividad`

1. **Registrado hoy**: quién ya registró y a qué hora, y quién falta.
2. **Los cuatro totales del periodo**, siempre los cuatro aunque sean cero (REGLA #24).
3. **Gráfico día a día** de la métrica elegida. Barras verticales en ordenador y
   horizontales en el teléfono, el número siempre escrito, el mejor día en verde saturado y
   el resto apagado. Los días sin parte salen como una raya y con un guion, **nunca como un
   cero**: no registrar no es haber hecho cero.
4. **Historial diario** de 20 en 20 (`<ListaPaginada>`), con el día, los cuatro números,
   quién lo registró, a qué hora y cuántas correcciones lleva. **La carta no alarga la
   página**: la lista se desplaza por dentro con un tope de alto, para que la carta entera
   (cabecera, lista y el botón de Siguiente) quepa de una vez en un teléfono. Un botón de
   pasar de página que hay que ir a buscar scrolleando, no existe.

   Esa caja lleva `max-h` y **NO** `overscroll-contain`, a propósito: con `contain`, el día
   que una página traiga pocas filas la caja no tendría nada que desplazar y se tragaría el
   gesto, dejando la pantalla congelada (el fallo del SOP [`producto/62`](62-un-solo-scroll-por-pantalla.md)).
   Medido: con la lista al final, la página sigue moviéndose.
5. **Ficha de un día**: se abre al tocarlo. Los cuatro números y la línea de tiempo completa
   de guardados, con el campo, el valor de antes y el de después de cada corrección. Desde
   ahí se corrige.

Todo obedece al filtro de fechas único del OS. El gráfico dibuja como mucho 31 días; la
lista los tiene todos.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Migración | `supabase/migrations/20260828100000_historial_actividad_setter.sql` |
| API del parte | `src/app/api/setter/report/route.ts` |
| API del historial | `src/app/api/setter/historial/route.ts` |
| Pantalla | `src/features/setter/components/actividad-page.tsx` |
| Gráfico | `src/features/setter/components/actividad-grafico.tsx` |
| Ficha del día | `src/features/setter/components/actividad-detalle.tsx` |
| Formulario del parte | `src/features/setter/components/parte-diario-modal.tsx` |
| Permiso de la ruta | `src/lib/auth/role-access.ts` y tabla `role_permissions` |

## Cambios versionados

### 2026-08-28: nace el historial
Marco: *"necesito tener un registro diario (historial) de las veces que se registra
actividad del setter, para saber exactamente lo que ha sucedido de forma diaria, que ahí se
pueda editar y se pueda ver quién registra y quién editó ya, qué hora y TODO lo necesario
para tener claridad"*.

Lo que había antes, medido en el código y en la base:

- El parte se guardaba **pisando** la línea anterior. El valor viejo desaparecía para
  siempre y no había forma de saber qué decía.
- **No se guardaba quién lo escribió** (solo de quién era) ni quién lo corrigió. La hora de
  la última corrección sí se guardaba, pero no se enseñaba en ningún sitio.
- **No había pantalla de historial.** Los números solo salían **sumados** en el Dashboard.
- **Nadie podía corregir el parte de otro**, ni un administrador.

Se rellenaron hacia atrás los 4 partes que ya existían (3 de Juanda, 1 de la cuenta de
pruebas), con su hora real y marcados como `reconstruido`.

Y nace la sección **Ventas** en el menú del OS: existía en el Knowledge desde la
reorganización por cuadrantes, pero no tenía ninguna ruta.
