---
title: Reglas de UI — contraste y legibilidad
order: 47
area: producto
---

# Reglas de UI — contraste y legibilidad

El OS y los funnels son **uniformemente oscuros** (brandkit: `#0F0F12` fondo, `#F5F6F7` texto). En tema oscuro hay una clase de bug recurrente: **elementos del mismo color que su fondo → invisibles**. Este SOP la cierra de raíz.

## 🚨 Regla absoluta (dictada por Marco, 2026-06-20, reforzada 2026-06-26)

> **PROHIBIDO** poner texto, iconos, placeholders, bordes, cajas, fichas o cualquier elemento del **mismo color (o casi) que su fondo.** Si no se ve, está mal. No hay excepción "estética".
>
> **PROHIBIDO añadir nuevas secciones/UI sin contraste real.** Cada caja, ficha, input o panel DEBE separarse claramente de su fondo. Esto NO es negociable y se verifica SIEMPRE antes de cerrar.

Antes de dar por terminada cualquier UI: comprobar que TODO lo que debe leerse tiene contraste real contra su fondo — incluido lo que pinta el **navegador** (autofill, controles nativos), no solo lo que pinto yo en JSX.

## 🎨 Contrato de tokens de contraste (la fuente de verdad, `src/app/globals.css` `.dark`)

El contraste se resuelve en **los tokens**, no caja por caja. Valores mínimos vigentes (2026-06-26):

| Token | Valor | Para qué | Regla |
|---|---|---|---|
| `--background` | `oklch(0.113…)` (#0F0F12) | Fondo base | — |
| `--card` | `oklch(0.185…)` | Fichas/cajas elevadas | DEBE separarse del fondo. No bajar de 0.18. |
| `--popover` | `oklch(0.205…)` | Menús, dropdowns, sheets | Un punto por encima de card. |
| `--border` / `--input` | `oklch(0.275…)` | Bordes de cajas e inputs | Visibles aunque se diluyan. No bajar de 0.27. |
| `--muted-foreground` | `oklch(0.62…)` | Texto secundario | Legible de verdad. No bajar de 0.60. |
| `--foreground` | `oklch(0.97…)` | Texto principal | — |

### ⛔ Prohibido diluir los tokens semánticos por debajo de visibilidad

El problema sistémico NO era solo los tokens: era **diluirlos** con opacidades en cada componente. Reglas:

- **PROHIBIDO** `bg-card/30`, `bg-card/40` para una **ficha/caja** que debe verse → usar `bg-card` a plena fuerza (las opacidades bajas solo valen para *backdrops* de columnas/kanban, nunca para la ficha en sí).
- **PROHIBIDO** `border-border/40`, `/30` en bordes que delimitan cajas/inputs → usar `border-border` a plena fuerza.
- **PROHIBIDO** `bg-white/[0.04]`, `border-white/25` como fondo/borde de inputs → usar `bg-card` + `border-border`.
- Para texto secundario usar `text-muted-foreground` (ya es legible); **no** añadir `/60`, `/40` encima salvo placeholders muy terciarios.
- **Inputs**: siempre `border-border` + `bg-card` (o `bg-background` con borde pleno). Nunca un input sin borde visible.

> Regla mental: si para que algo se vea tienes que entrecerrar los ojos, está MAL. Usa el token pleno.

Ofensores corregidos a raíz el 2026-06-26: `src/components/ui/card.tsx` (Card compartido), `registrar-venta-modal.tsx` (cajas de registrar venta), `pipelines-kanban.tsx` (fichas del pipeline), `contact-drawer.tsx` (ficha de contacto). Quedan ~300 usos diluidos en el resto del SaaS: el subir los tokens base ya los levanta, pero al tocar cualquier archivo se migran sus diluciones a tokens plenos.

## Causa raíz #1 — Autofill de Chrome/Safari en tema oscuro

**Síntoma:** al rellenar un campo (sobre todo cuando el navegador recuerda el email/contraseña), el campo queda con **fondo claro y texto blanco → ilegible**.

**Por qué:** el `<html className="dark">` hace que `--foreground` sea blanco, así que el texto del input es blanco. Pero el autofill del navegador pinta su **propio fondo claro** (amarillo/blanco) por debajo del `bg-transparent` del input, y mantiene el texto blanco del tema. Resultado: blanco sobre blanco.

**Fix (en `src/app/globals.css`, aplica a TODA la app):**

1. `html { color-scheme: dark; }` — declara el documento como oscuro; el navegador renderiza autofill, scrollbars y controles nativos en modo oscuro.
2. Override explícito de `:-webkit-autofill` (belt-and-suspenders, porque el render varía por versión de navegador):

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
select:-webkit-autofill {
  -webkit-text-fill-color: var(--foreground);   /* texto siempre visible */
  caret-color: var(--foreground);
  -webkit-box-shadow: 0 0 0 1000px var(--card) inset;  /* repinta el fondo del tema */
  box-shadow: 0 0 0 1000px var(--card) inset;
  transition: background-color 9999s ease-in-out 0s;   /* retrasa el fondo claro nativo */
}
```

## Causa raíz #2 — Controles nativos invisibles (date/time pickers)

Mismo origen: el icono del calendario nativo aparece **negro sobre fondo oscuro**. Fix ya vigente: `color-scheme: dark` sobre `input[type="date|time|datetime-local|month|week"]` (ahora reforzado por el `color-scheme: dark` global del `html`).

## Causa raíz #3 — Overlays/drawers `fixed` atrapados por un ancestro con `backdrop-filter`/`transform`

**Síntoma:** un drawer/modal con `fixed inset-0` (que debería cubrir toda la pantalla) se renderiza diminuto y descolocado en una esquina (típicamente arriba a la derecha), "todo apretado", solapando otra UI.

**Por qué:** por spec de CSS, si un ancestro tiene `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change` o `contain`, ese ancestro se convierte en el **containing block** de los descendientes `position: fixed`. Entonces `fixed inset-0` ya **no** se ancla al viewport, sino a ese ancestro. Caso real: la campana de notificaciones vivía dentro de la píldora global `<OsTopBar>` (`fixed ... rounded-full backdrop-blur-md`); su drawer `fixed inset-0` quedaba atrapado dentro de la píldora del top-right → "se expandía toda jodida arriba a la derecha". Se intentó arreglar varias veces moviendo clases, sin tocar la causa.

**Fix de raíz:** los overlays (drawers, modales, popovers, tooltips) **se renderizan SIEMPRE con un portal a `document.body`**, nunca anidados como `fixed` dentro del árbol de un componente con blur/transform.

- Usar los primitivos de Radix del kit, que portalean por defecto: `Sheet` (drawer), `DropdownMenu`, `Tooltip`, `Dialog`. Ej.: la campana ahora usa `<Sheet>` (`src/components/ui/sheet.tsx`) y el selector "quién cerró" usa `<DropdownMenu>`.
- Si hay que portalear a mano: `createPortal(node, document.body)`.
- Regla mental: **un overlay nunca debe depender de dónde vive su botón.** Si moverlo de sitio lo rompe, es que no está portaleado.

## Checklist antes de cerrar una UI

- [ ] ¿Hay inputs? → probar autofill (con email guardado en el navegador), no solo tecleo manual.
- [ ] ¿Hay controles nativos (date/time/select)? → verificar que su UI nativa es legible en oscuro.
- [ ] ¿Algún texto/icono usa un color hardcodeado cercano al fondo? → subir contraste.
- [ ] ¿Hay un drawer/modal/popover? → ¿portalea a `body`? ¿algún ancestro tiene `backdrop-blur`/`transform`? Si sí y NO portalea → bug latente, portalear.
- [ ] Verificación visual real (screenshot/producción), no solo "el JSX se ve bien".

## Chrome superior coherente — una sola barra (`<TopBar>`)

El chrome superior (trigger del sidebar + título de sección + campana) DEBE ser idéntico en TODAS las secciones. Antes era incoherente: la campana era una píldora `fixed top-2 right-2` (8px) flotando por encima de la línea del header (56px), 8 páginas tenían `ShellHeader` y 24 no tenían header de sección → las líneas no cuadraban.

**Estándar vigente (2026-06-26):**
- Una única `<TopBar>` global (`src/features/shell/components/top-bar.tsx`) montada en `(main)/layout.tsx`. Desktop: `h-14` + `border-b border-border` → su línea se alinea EXACTA con la del header del sidebar (también `h-14 border-b`).
- Izquierda: `SidebarTrigger` + título derivado de la ruta (`navAll`). Derecha: la campana, anclada a la línea.
- Las sub-navegaciones (operaciones `Dashboard·Áreas·Proyectos·Tareas·Board`, CRM `Contactos·Pipeline·Tags`) viven SIEMPRE **debajo** de la TopBar, con su propio `border-b`. Nunca por encima.
- `ShellHeader` quedó deprecado (no-op): el título ya no se pinta por página. En móvil la campana vive en `MobileHeader` (derecha, junto al avatar).
- **Regla:** no volver a crear chrome superior por página ni píldoras flotantes. Todo lo superior pasa por `<TopBar>`.

## Emails — SIEMPRE brandkit monocromo

Los emails son parte del producto: aplican el brandkit igual que la app. Reglas:

- **Dos layouts compartidos, mismo lenguaje visual:** `src/lib/email/templates/_base-layout.ts` (emails token-based: reset, confirmación, cambio de email — HTML string) y `_layout.tsx` (resto, React Email). Cualquier email nuevo usa uno de los dos; NO se inventa un layout suelto.
- **Monocromo**: fondo `#0F0F12`, texto `#D1D5DB`/`#FAFAFA`, separadores `#2A2D34`, eyebrow "CAPITAL HUB" muted. Botón **blanco** (`#FFFFFF` bg, texto `#0F0F12`). **PROHIBIDO** verde/neon (antes había `#37ca37` y cajas `rgba(55,202,55,...)` — eliminados). Único accent = blanco. Excepción: alertas internas de error a Marco pueden usar rojo semántico.
- **Tipografía sans** (system/Inter), NUNCA serif (Georgia estaba mal).
- **Sin caja gris pesada**: contenido limpio sobre el fondo con separadores finos (estilo `password-changed`). Las cajas callout son contenedores sutiles `#18181B` + borde `#2A2D34`.
- **Emails/URLs sin link azul**: Gmail auto-enlaza en azul el texto que parece email/URL. Para mostrar un email, usar el helper `emailChip()` (lo envuelve en `<a mailto>` con color de marca → Gmail no lo recolorea). Nunca dejar un email/URL como texto plano en el cuerpo.
- **Verificar render real** antes de cerrar: renderizar el HTML (no solo leer el código) — `npx tsx` + screenshot, o enviar a un inbox propio y mirarlo.

## Márgenes de página: candado automático, ya no se vigila a mano

**Regla:** toda pantalla del OS que pinte `<ShellHeader>` tiene que pintar también
`<PageContainer>`. Sin él, el contenido no tiene ancho máximo ni márgenes y se pega a los
bordes de la aplicación en pantallas anchas.

**Por qué hay un candado y no solo una regla escrita:** este bug se arregló a mano varias
veces (mayo, junio y julio de 2026) y volvió cada vez. Marco, 31-jul-2026: *"eso ya lo
hemos arreglado varias veces en diferentes ocasiones, veo que se está repitiendo, ya estoy
un poco cansado de repetir esto, ¿cómo puedes hacer para que esto nunca ocurra?"*.

Escribir la regla no bastaba por una razón concreta: **14 de las 22 pantallas del OS ya la
incumplían**, así que el mal ejemplo era la mayoría, y cualquiera que copiase de una
pantalla existente reintroducía el bug.

**El candado:** `scripts/check-layout.mjs`, enganchado a `predev` y a `prebuild`. Si una
pantalla nueva no lleva `PageContainer`, **ni arranca en local ni se despliega**. Se corre
suelto con `npm run check:layout`.

**La deuda vieja está en una lista visible** dentro del script (`DEUDA_CONOCIDA`), no
escondida: son las 12 pantallas reales que ya estaban rotas antes del candado. Se van
quitando de ahí según se toque cada una. **Prohibido añadir nada nuevo a esa lista.**

## Los tokens del OS NO son el brandkit (trampa activa)

Comprobado el 31-jul-2026 en `globals.css`:

| Token | Lo que vale de verdad | Lo que dice el brandkit |
|---|---|---|
| `--accent` (oscuro) | `#2A2D34`, gris grafito | verde `#22C55E` |
| `--font-heading` | `-apple-system`, `SF Pro Display` | Inter Tight, y solo esa |

O sea: escribir `bg-accent` en el OS pinta **gris**, no verde, y `font-heading` renderiza
**la fuente del sistema** en un Mac, no Inter Tight (que sí está cargada, pero solo entra
como respaldo fuera de Apple). Es la misma trampa que ya pasó en la App con
`accent: #FFFFFF`.

**Mientras esos tokens no se cambien:** una pantalla nueva que quiera el brandkit de
verdad pone los valores explícitos (`#22C55E`, `#4ADE80`, `#0F0F12`, `#131318`, hairline
`rgba(245,246,247,0.1)`) y declara `fontFamily: "'Inter Tight', sans-serif"`.

**No se tocan los tokens globales sin encargo:** cambiarlos repinta el OS entero de golpe.
Es un trabajo aparte, y lo decide Marco.

## Scroll: la caja que RECORTA y la caja que DEJA BAJAR no pueden ser la misma

Clase de bug nueva, encontrada el 2026-08-06 en el CRM y con pinta de poder repetirse en
cualquier pantalla que monte su propio armazón de alto completo.

**Síntoma:** la pantalla "se queda pegada". El contenido continúa por debajo del borde pero
no hay barra de scroll y la rueda no mueve nada.

**Por qué:** el OS ya tiene UN contenedor con scroll vertical, en `(main)/layout.tsx`. Si una
sección monta dentro su propio armazón (`flex h-full flex-col` + cabecera fija + hueco de
contenido) y a ese hueco le pone `overflow-hidden`, pasan las dos cosas a la vez:

1. el hueco recorta el contenido que sobra, y
2. como lo recorta, el contenedor de fuera **nunca llega a desbordar**, así que tampoco
   saca su barra.

El contenido desaparece sin que nada falle: no hay error de consola, ni aviso de tipos, ni
build roto. En el CRM eran 1508px de contactos invisibles.

**Reglas:**

- El hueco de contenido de una sección lleva `overflow-y-auto`, nunca `overflow-hidden`.
- Una sección tiene **un solo** scroll vertical. Si una vista concreta necesita ocupar el
  alto exacto sin scroll de página (un kanban con columnas que scrollean por dentro),
  **pide `h-full` al hueco**; no recorta el hueco para todas las demás vistas.
- **Prohibido adivinar la altura con `h-[calc(100vh-Xrem)]`.** Ese número sale de contar a
  ojo las barras de arriba y deja de cuadrar en cuanto una cambia de alto o aparece un
  banner. `h-full` la hereda del hueco real.
- La barra inferior de móvil se reserva con `pb-mobile-nav` **en el contenedor con scroll**,
  una sola vez, no en cada página hija.
- **Cómo se comprueba** (mirarlo no basta, la pantalla parece normal): en el navegador,
  buscar los contenedores con `overflow-y` scrollable y comparar `scrollHeight` con
  `clientHeight`. Si el contenido desborda y ninguno puede bajar, está roto.

## Aplicar el brandkit a una pantalla del OS (referencia: el CRM)

El CRM (`/crm`, las 3 pestañas) se rehizo con el brandkit oficial el 2026-08-06 y sirve de
patrón para las siguientes. Lo que se hizo:

- Los valores del brandkit viven en **un módulo por sección**
  (`src/features/crm/lib/brand.ts`): colores, clases de tarjeta, campo y botones, y el tono
  de cada stage. Nada de repetir hex por los componentes.
- **Los tokens del OS NO se tocan** (siguen siendo la trampa de la sección anterior): se
  escriben los valores explícitos y `fontFamily: var(--font-inter-tight)`.
- Fuera del CRM: mono en mayúsculas espaciadas, textos de 9-10px, esquinas rectas, acento
  blanco y los neones por stage (cian, violeta, naranja). El acento es **el verde**, y ahora
  además significa algo: gris que se aclara según avanza el funnel, verde en la venta, ámbar
  en el aviso (`no_show`), apagado en `perdido`.

**Trampa de Tailwind que costó un rato:** las clases se escriben **literales**. Tailwind lee
el código como texto y solo genera las clases que ve escritas enteras, así que un
`border-[${color}]` montado en tiempo de ejecución **no existe en el CSS** y el elemento sale
sin estilo, sin ningún error. Los colores calculados van por `style`, nunca por `className`.

Deuda de layout resuelta de paso (quitadas de `DEUDA_CONOCIDA` en `scripts/check-layout.mjs`,
y prohibido volver a meterlas): `crm/tags/page.tsx` y `crm-tabs-header.tsx`.

## Cambios versionados

- **2026-08-06** (v6): clase de bug nueva documentada, **"la caja que recorta y la caja que
  deja bajar no pueden ser la misma"**, tras quedarse pegada la pantalla del CRM (1508px de
  contactos recortados sin barra de scroll, ningún error en ningún sitio). Añadida la
  sección de cómo aplicar el brandkit a una pantalla del OS, con el patrón del módulo
  `lib/brand.ts` por sección y la trampa de las clases de Tailwind montadas con plantilla.
  Resuelta deuda de layout de 2 pantallas. Disparador: Marco, *"la pantalla se queda pegada,
  no puedo hacer scroll... y quiero que todo esté funcional y con el diseño nuevo"*.

- **2026-07-31** (v5): candado automático de márgenes (`scripts/check-layout.mjs` en
  `predev` + `prebuild`) tras repetirse el bug por cuarta vez. Documentada la deuda de 12
  pantallas y la prohibición de ampliarla. Documentada la trampa de los tokens del OS
  (`accent` gris y `font-heading` de sistema), que es la razón de fondo de que el OS se vea
  antiguo aunque el brandkit diga otra cosa. Disparador: Marco, sobre la sección de Ads
  pegada al borde.

- **2026-06-20** (v1): creado. Bug raíz: Adrián no veía lo que escribía en los campos de login/forgot-password (autofill blanco-sobre-blanco). Fix global `color-scheme: dark` en `html` + override `:-webkit-autofill`. Regla absoluta "nunca mismo color que el fondo" elevada a Knowledge.
- **2026-06-26** (v2): añadida Causa raíz #3 — overlays `fixed` atrapados por ancestros con `backdrop-filter`/`transform`. Bug recurrente de la campana (drawer "se expandía toda jodida arriba a la derecha") cerrado de raíz: drawer → `<Sheet>` de Radix (portal a `body`). Regla: overlays SIEMPRE portalean a body.
- **2026-06-26** (v4): añadida sección "Emails — SIEMPRE brandkit monocromo". Disparador: Marco — el email de cambio de email salía feo (caja gris pesada + link azul de Gmail) y el `_layout.tsx` usaba Georgia serif + botón verde. Alineadas las ~20 plantillas a monocromo (botón blanco, sans, sin caja, `emailChip()` anti-azul, fuera todos los verdes). Regla: emails siempre brandkit, verificar render real.
- **2026-06-26** (v3): problema SISTÉMICO de contraste atacado de raíz. (1) Tokens subidos en `globals.css`: `--card` 0.153→0.185, `--popover`→0.205, `--border`/`--input` 0.24→0.275, `--muted-foreground` 0.52→0.62. (2) Contrato de tokens + prohibición de diluir tokens semánticos (`bg-card/30`, `border-border/40`, `bg-white/[0.04]`) documentados como ley. (3) Ofensores nombrados corregidos (Card, registrar-venta, pipelines-kanban, contact-drawer). (4) Chrome superior unificado en una `<TopBar>` coherente; eliminada la píldora flotante `OsTopBar` y el `ShellHeader` por página. Disparador: Marco — "este problema está en todo el SaaS, soluciónalo de raíz antes de seguir construyendo; prohibido añadir UI sin contraste".
