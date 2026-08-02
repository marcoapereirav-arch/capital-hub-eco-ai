# PRP-009: Barrido visual del OS interno (retirar el diseño viejo, móvil primero)

> **Estado**: EN CURSO. Fases 0, 1 y 10 ya hechas y guardadas.
> **Fecha**: 2026-08-02
> **Rama**: `feature/tokens-brandkit`
> **Proyecto**: Capital Hub OS (`src/app/(main)`)
> **Manda**: `docs/sops/marketing/brand/01-brandkit-oficial.md` (ley de diseño) + `.claude/skills/os-movil-primero/SKILL.md` (cómo se construye cada pantalla)

---

## Estado real al escribir esto (2026-08-02)

Este documento se redactó leyendo la carpeta principal, que aún no tenía el trabajo de hoy.
Corregido. Lo que **YA está hecho y guardado** en esta rama:

| Fase | Qué era | Estado |
|---|---|---|
| **1** | Los colores y las letras (tokens de `globals.css`) | **HECHA.** `accent` y `primary` al verde `#22C55E` con tinta `#08130C`, foco y menú lateral en verde, Inter Tight de verdad. Medido antes y después: cero regresiones de contraste. Commit `1b9fbea` |
| **10** | El candado para que el diseño viejo no vuelva | **HECHA.** `scripts/check-brandkit.mjs` (1249 líneas) enganchado al guardado, al arranque y a la construcción, más el acta `.brandkit-debt.json` con 5347 señales en 219 archivos. Probado con 11 trampas: las caza las 11. Commit `9c86979` |
| **0** | Red de seguridad y capturas del antes | **HECHA.** 30 pantallas capturadas a 375px y 5 a 1280px, más el medidor de contraste y el de móvil |

Además existe la skill **`os-movil-primero`** (978 líneas), que es la ley operativa de este
barrido: recetas por tipo de bloque, los seis números que no se negocian y la tabla de
sustitución del diseño viejo. **Todo lo que sigue se ejecuta siguiéndola.**

**Corrección importante a este PRP:** decía que `--primary` vale blanco y `--accent` gris.
Eso era cierto esta mañana; ya no. Lo que queda pendiente NO es cambiar los tokens: es que
las pantallas **los usen**, porque hoy casi todas llevan el color escrito a mano y por eso
el cambio de tokens apenas se notó.

---

## Objetivo

Retirar de raíz el diseño antiguo del OS interno y dejar las 35 pantallas de `(main)` construidas
con el brandkit oficial (carbón + verde `#22C55E`, Inter Tight, esquinas 4 y 8px, hairlines
translúcidos), diseñadas primero para el teléfono y después comprobadas en escritorio.

El barrido empieza por las **7 piezas del marco común** (lo que envuelve a todas las pantallas),
porque arreglar el marco arregla el 70% de lo que se ve antes de tocar una sola pantalla.

---

## Por Qué

| Problema | Solución |
|---|---|
| El OS se ve antiguo aunque el brandkit diga otra cosa. `--primary` vale **blanco puro** y `--accent` vale **gris grafito**: escribir `bg-accent` pinta gris, no verde | Reescribir los tokens de `globals.css` desde el brandkit vivo. El nombre del token pasa a coincidir con su valor |
| `--font-heading` resuelve a **SF Pro de Apple** en el Mac de Marco, así que Inter Tight casi nunca se ve, y 118 archivos usan `font-mono` con mayúsculas espaciadas (vibe antiguo) | Una sola familia: Inter Tight de 400 a 900. La jerarquía se hace con peso, tamaño y color |
| Cada pantalla se pintó a su manera: 9 llevan el patrón completo, 8 llevan un `ShellHeader` que **no pinta nada** (está deprecado y devuelve `null`), 12 no tienen márgenes y están en la lista de deuda del candado, y varias llevan hex sueltos con `style={{}}` en cada nodo | Un marco común de 7 piezas que todas consumen, y el candado del repo ampliado para que el diseño viejo no pueda volver a entrar |
| El OS se reparte como app instalable, pero el móvil es hoy un escritorio encogido: de 100 archivos que usan `md:`, solo 3 usan `md:hidden` y 2 usan zonas táctiles de 44px. Tablas anchas, modales centrados, textos pequeños | Cada pantalla se rehace primero a 375px siguiendo los 10 patrones nativos de la SOP 03, y después se comprueba que el escritorio sigue bien |
| El mismo error visual se ha arreglado a mano en mayo, junio y julio, y volvió las tres veces | El barrido termina con candados automáticos, no con una regla escrita más |

**Valor de negocio**: el OS es la herramienta que Marco y el equipo usan todos los días y la cara
del producto ante Adrián y ante cualquier persona nueva del equipo. Hoy transmite "hecho a
trozos". Además, el trabajo diario se hace desde el teléfono y ahí la herramienta cuesta de usar,
lo que se traduce en tareas que no se marcan y datos que no se meten. El resultado esperado:
una sola herramienta coherente, usable con una mano, y un candado que impide volver atrás.

---

## Qué

### Qué es "el diseño viejo" (definición cerrada, para que el barrido sea comprobable)

Se considera diseño viejo, y por tanto se retira, todo esto:

1. Acento **blanco** (`--primary: oklch(1 0 0)`, botones blancos como acción principal).
2. `--accent` en gris grafito llamándose accent.
3. Tipografías de sistema de Apple por delante de Inter Tight.
4. `font-mono` en etiquetas de interfaz, y las mayúsculas muy espaciadas fuera del wordmark.
5. Objetos de color sueltos (`const C = { bg: '#0F0F12', ... }`) y `style={{}}` hex por nodo.
6. Bordes sólidos `#2A2D34` donde el brandkit pide hairline translúcido `rgba(245,246,247,0.1)`.
7. Esquinas rectas y `rounded-none` (el brandkit redondea: 4px tarjeta/botón/campo, 8px panel/hoja).
8. Peso 500 para todo, en vez del rango real (900 titular, 800 sección, 600 etiqueta, 400 cuerpo).
9. Gradientes y verdes crudos de Tailwind (`from-green-500`) en vez del verde de marca.
10. Icono `Sparkles` (prohibido en todo el producto, REGLA #13).
11. Rayas por todos lados: `border-b` en cada fila de una lista, dos líneas pegadas.
12. Modales hechos a mano con `fixed inset-0` sin portal a `body` (bug recurrente de la SOP 47).
13. Tablas anchas con scroll horizontal como solución de móvil.

### Las 7 piezas del marco común

| # | Pieza | Qué es en pantalla | Archivos |
|---|---|---|---|
| 1 | **Los colores y las letras** | La base de todo: el verde de marca, el carbón, los grises, Inter Tight, las esquinas, los bordes finos | `src/app/globals.css`, `src/app/layout.tsx` |
| 2 | **La barra lateral** (escritorio) | El menú de la izquierda con las secciones, el logo, el pie con el usuario | `src/features/shell/components/app-sidebar.tsx`, `nav-config.ts`, `user-menu.tsx`, `src/components/ui/sidebar.tsx` |
| 3 | **La barra de arriba** (escritorio) | La franja de 56px con el botón de plegar, el título de la sección y la campana | `src/features/shell/components/top-bar.tsx`, `page-nav-header.tsx`, `crm-tabs-header.tsx`, `(operaciones)/layout.tsx` |
| 4 | **La cabecera del móvil** | La franja de arriba del teléfono con el título, la campana y el avatar | `src/features/shell/components/mobile-header.tsx` |
| 5 | **La barra de abajo del móvil** | Las 5 pestañas fijas abajo y la hoja "Más" con el resto de secciones | `src/features/shell/components/mobile-bottom-nav.tsx` |
| 6 | **El contenedor de página** | Los márgenes y el ancho máximo que hacen que nada quede pegado al borde | `src/components/ui/page-container.tsx`, `scripts/check-layout.mjs` |
| 7 | **Las piezas repetidas** | Tarjeta, botón, campo, chip, pestañas, hoja, ventana, estado vacío, pantalla de carga | `src/components/ui/*` (17 archivos) |

### Criterios de Éxito

- [ ] **Los tokens dicen la verdad**: `--accent` y `--primary` valen el verde de marca `#22C55E`, `--font-heading` empieza por Inter Tight. Comprobable abriendo `globals.css`.
- [ ] **Una sola tipografía**: 0 usos de `font-mono` en interfaz del OS (queda permitido solo para mostrar código o identificadores literales), y 0 mayúsculas espaciadas fuera del wordmark "CAPITAL HUB".
- [ ] **Cero hex sueltos**: 0 objetos de color locales (`const C = {`) y 0 `style={{ color: '#...' }}` en `src/app/(main)` y `src/features` (excepción declarada: `src/app/brandkit/`, que es la fuente).
- [ ] **La lista de deuda del candado queda VACÍA**: `DEUDA_CONOCIDA` en `scripts/check-layout.mjs` pasa de 12 entradas a 0.
- [ ] **`ShellHeader` eliminado**: 0 imports en todo el repo (hoy son 26 archivos importando algo que devuelve `null`), y borrados los dos archivos muertos (`mobile-shell.tsx`, `crm-page.tsx`).
- [ ] **Las 35 pantallas comprobadas a 375px** con sesión real (test-agent) y captura guardada: 32 pantallas de verdad más 3 redirecciones que solo se comprueba que redirigen.
- [ ] **Y comprobadas a 1280px**: ninguna pantalla de escritorio queda peor que antes.
- [ ] **Ninguna tabla con scroll horizontal en móvil**: toda tabla de más de 4 columnas se ve como lista de fichas.
- [ ] **Zonas táctiles de 44px** en todo lo que se toca en móvil, y campos de 16px (para que iOS no haga zoom).
- [ ] **El candado nuevo funciona**: se añade una pantalla de prueba con diseño viejo y `npm run build` la rechaza.
- [ ] **Verde en dosis de brandkit**: el verde es acento (aproximadamente el 8% de la superficie), no el color de fondo de medio OS.
- [ ] `npm run typecheck`, `npm run build` y `npm run check:layout` pasan en verde.
- [ ] Cada fase queda documentada en el Knowledge en su mismo bloque (REGLA #2).

### Comportamiento Esperado (Happy Path)

Marco abre el OS en el teléfono. Ve una cabecera limpia de 56px con el título de la sección, y
abajo una barra de 5 pestañas que respeta el borde inferior del iPhone. Todo está en Inter Tight,
el fondo es carbón, y lo único de color es el verde: el botón de la acción principal, el estado
activo de la pestaña, el foco de un campo. Nada está pegado a los bordes. Toca una lista y no hay
tabla que se desplace de lado: hay fichas. Abre un menú y sube una hoja desde abajo, no un modal
en medio. Cierra y entra desde el ordenador: la misma pantalla, con la barra lateral, y nada roto.

Y lo importante para que no vuelva a pasar: si mañana alguien escribe una pantalla con el estilo
antiguo, el proyecto **no arranca en local ni se despliega** hasta que lo arregle.

---

## Contexto

### Referencias (leído antes de escribir este PRP)

**Knowledge (es ley):**
- `docs/sops/marketing/brand/01-brandkit-oficial.md`: el brandkit oficial. Inter Tight única, acento solo verde, cinturones, isotipo CH, cero guion largo. Y la REGLA #1 de diseño: el brandkit manda por encima de lo que se pida en el chat.
- `docs/sops/producto/03-mobile-first-os.md`: los 10 patrones nativos obligatorios y los anti-patrones. Un solo breakpoint (768px). `useIsMobile()` en `src/hooks/use-mobile.ts`.
- `docs/sops/producto/47-reglas-ui-contraste-legibilidad.md`: contrato de tokens de contraste (los mínimos que NO se pueden bajar), autofill del navegador, overlays que hay que portalear a `body`, el candado de márgenes y **la trampa de los tokens** (`accent` gris, `font-heading` de sistema). Dice literalmente que cambiar los tokens globales es un trabajo aparte que decide Marco: **este PRP es ese encargo**.
- `docs/sops/producto/48-diseno-dinamico-wow.md`: el movimiento es obligatorio, dentro del brandkit, respetando `prefers-reduced-motion`.
- `docs/sops/producto/49-efecto-de-carga.md` y `src/components/ui/loading-screen.tsx`: el anillo con el monograma CH en cualquier carga. Prohibido el spinner genérico.
- `docs/sops/producto/58-purga-brandkit-antiguo-app.md`: **el precedente exacto de este trabajo, hecho en la App**. De ahí sale la lección clave: *el estilo no se deduce, se lee del brandkit vivo*, y la causa raíz: *el nombre de un token no garantiza su valor*.
- `docs/sops/producto/04-protocolo-trabajo-agente.md`: REGLA #17 (el copy del dueño no se toca), #18 (se toca solo lo pedido), #22 (no se guarda en `dev` ni en `main`), #10 (link de localhost), #20 (las llaves ya las tengo), #7 y #8 (cero guion largo, cero emojis).

**Código (la fuente del estilo, no el markdown):**
- `src/app/brandkit/version-two.tsx` (1742 líneas): **el brandkit vivo**. De aquí se copian los valores exactos, no de la memoria. Reparto de color declarado: carbón 45%, papel hueso 30%, grafito 15%, verde 8%, verde claro 2%.
- `src/app/globals.css` (269 líneas): donde viven todos los tokens (Tailwind v4, `tailwind.config.ts` está vacío a propósito).
- `src/app/(main)/layout.tsx` (91 líneas): el punto de entrada del marco. Todo cuelga de aquí.

### Estado real de las 35 pantallas (inventario, 2026-08-02)

35 archivos `page.tsx` bajo `(main)`, de los cuales **3 son solo redirecciones** (`/contactos`,
`/crm`, `/webs/sistema`) y **32 son pantallas de verdad**.

Reparto por consistencia actual:

| Situación | Nº | Cuáles |
|---|---|---|
| Patrón completo (cabecera + contenedor) | 9 | ads, afiliados, automatizaciones, calendario, email-marketing, sistemas, sistemas/[slug], team, tutoriales |
| Solo contenedor | 3 | crm/contactos, crm/pipeline, perfil |
| Solo `ShellHeader` (que no pinta nada, o sea: sin márgenes) | 9 | board, content-intel, crm/tags, dashboard, instagram, integrations, invitaciones, manychat, mision |
| Sin nada, maquetación propia | 11 | overview, areas, areas/[id], projects, projects/[id], tasks, knowledge, knowledge/[slug], crm/contactos/[id], webs, webs/lead-magnets |

Las 3 más grandes, que se llevarán más tiempo: `dashboard` (1047 líneas), `operaciones-dashboard`
(787), `mision` (707), `email-marketing` (755), `medicion-ads-workflow` (626), `team` (595).

### Arquitectura Propuesta

No se inventa carpeta nueva. Se usa la que ya existe y se rellenan los huecos:

```
src/app/globals.css                  Pieza 1: los tokens (la única fuente de color/letra/esquina)
src/app/(main)/layout.tsx            El marco: monta piezas 2, 3, 4, 5
src/features/shell/components/       Piezas 2 a 5 (sidebar, top-bar, mobile-header, bottom-nav)
src/components/ui/                    Piezas 6 y 7 (page-container + las piezas repetidas)
  ├── page-container.tsx             ya existe
  ├── card / button / input / badge / tabs / sheet / tooltip / loading-screen   ya existen
  ├── dialog.tsx                     NUEVO (hoy hay 20+ modales hechos a mano)
  ├── empty-state.tsx                NUEVO (hoy no existe ninguno)
  └── data-list.tsx                  NUEVO (tabla en escritorio, fichas en móvil)
scripts/check-layout.mjs             El candado: se amplía a "candado de estilo"
```

Nota: `src/shared/components/` está vacío (solo un `.gitkeep` del template). No se usa: el kit
del proyecto es `src/components/ui/`, que es donde ya miran los 100+ archivos.

### Modelo de Datos

**No aplica.** Este PRP no toca base de datos, ni APIs, ni permisos, ni lógica de negocio.
Solo lo que se ve. Cualquier hallazgo funcional que aparezca por el camino se anota y se
propone, no se arregla dentro de este barrido (REGLA #18).

---

## Blueprint (línea de montaje)

> Solo fases. Las subtareas de cada fase se generan al entrar en ella, mapeando el contexto real
> (bucle agéntico). Cada fase termina con su commit, su push y su entrada en el Knowledge.

### Fase 0: Preparar la red de seguridad  [HECHA]

**Objetivo**: poder demostrar qué cambió y poder volver atrás.
Rama de chat abierta (hoy el repo está en `main` y la REGLA #22 lo prohíbe para guardar).
Sesión con el test-agent lista en Playwright. Capturas del **antes** de las 32 pantallas a 375px
y a 1280px, guardadas fuera del repo. Inventario congelado en una tabla de seguimiento.

**Validación**: existen 64 capturas del antes y la sesión entra en las 32 pantallas sin fallo.

---

### Fase 1: Pieza 1, los colores y las letras  [HECHA]

**Objetivo**: que el token diga la verdad. `globals.css` reescrito desde `version-two.tsx`:
verde de marca como acento y como acción principal, Inter Tight primero de todo (fuera el stack
de Apple), esquinas 4 y 8px, hairlines translúcidos, y el bloque de tema claro muerto retirado
(el documento es oscuro fijo). Respetando los mínimos de contraste de la SOP 47, que no se bajan.

**Validación**: `/brandkit` sigue idéntica (es la fuente, no debe moverse ni un pixel), y una
pantalla de control se ve repintada sola, sin haberla tocado. Contraste verificado contra la
tabla de mínimos de la SOP 47.

---

### Fase 2: Piezas 2 a 5, el marco que se ve en todas partes

**Objetivo**: barra lateral, barra de arriba, cabecera del móvil y barra de abajo del móvil
rehechas con el brandkit y con los patrones nativos de la SOP 03. Se arregla de paso el widget
de registrar venta, que hoy flota por encima de la barra inferior del teléfono y usa un degradado
con verdes crudos (prohibidos por el propio encabezado de `globals.css`).

**Validación**: en un iPhone real o a 375px, la barra de abajo no queda tapada por nada, respeta
el borde inferior, y todo lo que se toca mide 44px. En escritorio, la línea de la barra de arriba
sigue cuadrando exactamente con la del sidebar (regla de la SOP 47).

---

### Fase 3: Pieza 6, los márgenes, y muerte del `ShellHeader`

**Objetivo**: `PageContainer` en las 32 pantallas, la lista `DEUDA_CONOCIDA` vaciada, y
`ShellHeader` retirado de los 26 archivos que lo importan (es un componente que devuelve `null`:
retirarlo no cambia nada en pantalla, limpia 26 archivos y elimina la confusión de "esta pantalla
tiene cabecera"). Se borran también los dos archivos muertos que nadie importa.

**Validación**: `npm run check:layout` pasa con la lista de deuda a 0. Ninguna pantalla queda
pegada al borde a 1280px ni a 1920px.

---

### Fase 4: Pieza 7, el kit de piezas repetidas

**Objetivo**: las piezas que se repiten en todas las pantallas, con el brandkit y en dos formas
(móvil y escritorio). Se rehacen las que ya existen y se crean solo las tres que hoy se están
copiando a mano en cada pantalla: la ventana (20+ modales artesanales, varios con el bug de no
portalear a `body`), el estado vacío (no existe ninguno) y la lista de datos (tabla en escritorio,
fichas en móvil, que es lo que exige la SOP 03).

**Validación**: una pantalla piloto reconstruida solo con piezas del kit, verificada a 375px y a
1280px. Los modales abren bien estando dentro de contenedores con desenfoque (el bug de la SOP 47).

---

### Fase 5: Oleada A, Operaciones (7 pantallas)

`/overview`, `/areas`, `/areas/[id]`, `/projects`, `/projects/[id]`, `/tasks`, `/board`.
Es la zona de más uso diario y la que más deuda tiene: ninguna de las 7 usa hoy el marco común.

**Objetivo**: las 7 rehechas móvil primero, sobre el kit, sin tocar lógica ni copy.
**Validación**: capturas antes/después a 375px y 1280px, con datos reales, sesión test-agent.

---

### Fase 6: Oleada B, Contactos y calendario (5 pantallas)

`/crm/contactos`, `/crm/pipeline`, `/crm/contactos/[id]`, `/crm/tags`, `/calendario`.
Aquí está el kanban y la ficha de contacto: son los casos más duros de convertir a móvil.

**Validación**: el pipeline se puede operar con el pulgar. Ninguna tabla se desplaza de lado.

---

### Fase 7: Oleada C, Marketing y anuncios (6 pantallas)

`/ads`, `/afiliados`, `/email-marketing`, `/instagram`, `/manychat`, `/content-intel`.
Aquí viven la mayoría de los gráficos, así que aplica entera la REGLA #15: números a la vista,
ejes rotulados, etiqueta al pasar el cursor, y en móvil el gráfico **se rehace, no se encoge**.

**Validación**: cada gráfico se entiende sin preguntar, también a 375px.

---

### Fase 8: Oleada D, Conocimiento y webs (6 pantallas)

`/knowledge`, `/knowledge/[slug]`, `/sistemas`, `/sistemas/[slug]`, `/webs`, `/webs/lead-magnets`.
Cuidado especial con el cerebro 3D (WebGL) y con los tableros tipo Miro, que ya están bien y solo
necesitan que el marco y las piezas de alrededor dejen de desentonar.

**Validación**: el cerebro 3D y los tableros siguen funcionando igual, con el estilo nuevo.

---

### Fase 9: Oleada E, Casa y equipo (8 pantallas)

`/dashboard`, `/mision`, `/team`, `/invitaciones`, `/integrations`, `/automatizaciones`,
`/tutoriales`, `/perfil`. La más pesada: el dashboard son 1047 líneas y la misión 707.

**Validación**: el dashboard se lee entero en un teléfono sin hacer zoom.

---

### Fase 10: El candado de estilo (para que esto no vuelva)  [HECHA, adelantada]

**Objetivo**: convertir `scripts/check-layout.mjs` en un candado de estilo que corre en `predev` y
`prebuild` y rechaza el diseño viejo: hex sueltos fuera de la paleta, objetos de color locales,
`font-mono` en interfaz, `rounded-none`, el icono prohibido, verdes crudos de Tailwind y
gradientes. Con la lista de excepciones a la vista, nunca escondida, y prohibido ampliarla.

**Validación**: se crea a propósito una pantalla con estilo antiguo y `npm run build` la rechaza
con un mensaje que explica qué hacer.

---

### Fase 11: Validación final y Knowledge

**Objetivo**: cerrar con pruebas, no con afirmaciones.
**Validación**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` pasa (es el comando real del despliegue, REGLA #16)
- [ ] `npm run check:layout` pasa con deuda 0
- [ ] Las 32 pantallas abiertas con sesión real a 375px y a 1280px, comparadas contra el antes
- [ ] Cero guion largo y cero emojis en todo lo tocado (REGLAS #7 y #8)
- [ ] SOP nuevo de producto con el barrido completo, más actualizados 47, 03 y 58, e índice `00-readme.md`
- [ ] Tareas del board sincronizadas (REGLA #1) y link de localhost entregado a Marco (REGLA #10)

---

## Aprendizajes (se llena durante la ejecución)

> Esta sección CRECE con cada error encontrado. El mismo error no ocurre dos veces.

*(vacío: el PRP todavía no se ha ejecutado)*

---

## Gotchas (leer ANTES de empezar)

- [ ] **El estilo no se deduce, se LEE del brandkit vivo.** La fuente es `src/app/brandkit/version-two.tsx`, no el markdown y no la memoria. Es la lección literal de la SOP 58: por deducir, media App acabó con esquinas rectas.
- [ ] **El nombre de un token no garantiza su valor.** Hoy `bg-accent` pinta gris. Antes de construir sobre cualquier token, se abre `globals.css` y se comprueba.
- [ ] **El repo está en `main` ahora mismo.** La REGLA #22 prohíbe guardar en `main` y en `dev`, y hay un gancho de git que lo rechaza. Se abre rama con `npm run chat:nuevo` antes de tocar nada.
- [ ] **El puerto local es del rango 3100 a 3200, nunca 3000.** Ojo: el `dev` de `package.json` NO fija el puerto (dice `next dev --turbopack` a secas, aunque la SOP 04 afirme que lleva `-p 3100`). Hay que arrancar con `npm run dev -- -p 31XX` sobre un puerto comprobado libre.
- [ ] **Para verificar se entra con el test-agent**, cuya contraseña está en `.env.local` y está documentada en `docs/sops/sistemas/02-test-agent.md`. No se pide login a Marco (REGLA #20).
- [ ] **Los mínimos de contraste de la SOP 47 no se bajan** al repintar: `--card` no baja de 0.18, `--border` no baja de 0.27, `--muted-foreground` no baja de 0.60.
- [ ] **Los overlays se portalean a `body`.** Si un modal vive dentro de un contenedor con desenfoque o transform, se renderiza diminuto en una esquina. Ya pasó con la campana.
- [ ] **El verde es acento, no fondo.** El brandkit le asigna el 8% de la superficie. Poner verde en todos los botones del OS sería incumplir el brandkit igual que no ponerlo en ninguno.
- [ ] **Los emails NO entran en este barrido**, y hay una contradicción viva que decide Marco: la SOP 47 dice que el botón de los emails es blanco y prohíbe el verde, y el brandkit dice que el único acento es verde. Se pregunta, no se resuelve por cuenta propia.
- [ ] **`/brandkit` y `/reportes/...` viven fuera de `(main)`** y por tanto no llevan el marco del OS, aunque se enlacen desde dentro. `/brandkit` es la fuente: no se toca.
- [ ] **Autofill del navegador**: al tocar cualquier formulario, probar con el autorrelleno puesto, no solo tecleando.
- [ ] **Cambiar los tokens repinta el OS entero de golpe.** Por eso la Fase 1 va sola, con su verificación, antes de tocar ninguna pantalla.

## Anti-Patrones (lo que este PRP tiene PROHIBIDO hacer)

- **NO tocar el copy de las pantallas.** Es de Marco (REGLA #17). Si un texto no cabe en el diseño nuevo, se ajusta el diseño, nunca el texto.
- **NO cambiar funcionalidad, lógica, permisos, consultas ni base de datos.** Este barrido es visual. Lo que se descubra roto se anota y se propone (REGLA #18).
- **NO rediseñar por iniciativa propia** lo que no está en la lista de 35 pantallas. Ni la App de alumnos, ni las landings públicas, ni los emails.
- **NO añadir secciones, bloques ni funciones que nadie pidió.** La lección de la SOP 58: quitar, no añadir.
- **NO ampliar la lista de excepciones del candado.** Se vacía, no se alarga.
- **NO dar una pantalla por hecha sin haberla abierto** con sesión real y mirado a 375px. TypeScript en verde no significa que se vea bien.
- **NO verificar todo al final.** Cada oleada se comprueba en cuanto se sube, en paralelo con la siguiente. Si se apilan, es imposible saber qué la rompió.
- **NO usar `--no-verify` ni saltarse los candados.** Si un candado molesta, es que algo está mal.
- **NO inventar colores nuevos** ni degradados ni neones. La energía visual se consigue con peso tipográfico, tamaño, contraste y movimiento.
- **NO usar guion largo ni emojis** en nada de lo que se escriba (REGLAS #7 y #8).

---

*PRP pendiente de aprobación. No se ha modificado ni una línea de código.*
