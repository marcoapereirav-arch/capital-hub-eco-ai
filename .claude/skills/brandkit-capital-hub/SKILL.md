---
name: brandkit-capital-hub
description: "LEY DE DISEÑO de Capital Hub. Se usa SIEMPRE, sin excepción, antes de diseñar o tocar CUALQUIER cosa visual del SaaS: una pantalla, un panel, un componente, un botón, un email, una landing, un estado vacío. Contiene el ÚNICO brandkit permitido, copiado del brandkit vivo del OS: carbón + verde #22C55E, Inter Tight 400-900, esquinas suaves de 4px y 8px, bordes translúcidos, papel hueso. Prohíbe el diseño antiguo (acento blanco, esquinas rectas, fuentes de sistema, mono con mayúsculas espaciadas) aunque sea lo que hay en la mayor parte del SaaS. Se activa aunque Marco no nombre el diseño: si el trabajo se ve en pantalla, esta skill manda."
---

# Brandkit Capital Hub: ley de diseño

## La fuente. No hay otra.

**El brandkit vivo es `src/app/brandkit/version-two.tsx` del repo del OS**, que se
ve en la página `/brandkit`. Sus reglas escritas están en
`docs/sops/marketing/brand/01-brandkit-oficial.md`.

**Antes de diseñar nada: se abren esos dos y se leen.** Los valores de abajo son
una copia de trabajo; si alguna vez discrepan, manda el brandkit vivo y esta
skill se corrige en el mismo bloque.

> Marco, 2026-07-29: *"El ÚNICO brandkit que existe es el que está en el
> Knowledge y es el ÚNICO que vas a usar. Tienes PROHIBIDO usar otra cosa."*
> *"Todo lo que sea esquinas puntiagudas y todo ese vibe antiguo, fuera."*

---

## 0. La trampa: la mayoría del SaaS está con el diseño VIEJO

Gran parte del producto sigue construido con el brandkit antiguo. **Eso no lo
convierte en referencia.** Se rediseñará entero más adelante, en su momento y
cuando Marco lo pida.

Por lo tanto: **nunca se copia el estilo de una pantalla existente.** Se copia
del brandkit. Si abres un archivo y encuentras diseño viejo, o lo dejas limpio
en esa misma pasada o no lo tocas, pero jamás lo imitas.

---

## 1. Las señales del diseño ANTIGUO

| Señal | Lo correcto |
|---|---|
| `accent: #FFFFFF`, botones blancos, "monochrome" | El acento es **VERDE** `#22C55E`, con tinta `#08130C` encima |
| **Esquinas rectas** (`rounded-none`, sin radio) | **4px** tarjetas y botones, **8px** paneles grandes, 2-3px fichas |
| Esquinas muy redondeadas (`rounded-2xl`, `rounded-3xl`, `rounded-full` en botones) | Lo mismo: 4px / 8px. Círculo solo en avatares |
| Bordes `#2A2D34` sólidos por todos lados | Hairlines **translúcidos** `rgba(245,246,247,0.1)` |
| `accent-glow`, `shadow-glow` (resplandor blanco) | No existe |
| Fuentes de sistema (`-apple-system`, `SF Pro`, `Segoe`, `Helvetica`) | **Inter Tight**, y solo esa |
| JetBrains Mono para etiquetas de interfaz | Inter Tight. Mono no se usa |
| `text-[10px] uppercase tracking-wider` en etiquetas | Texto normal, 13-15px, legible |
| `appleGray`, `#f5f5f7`, `panel: #18181B` | `carbon #0F0F12`, `panel #131318` |
| Fondo de rejilla | Prohibido por Marco |

---

## 2. Color. No hay más

| Uso | Valor | Clase |
|---|---|---|
| Fondo de página | `#0F0F12` | `bg-carbon` |
| Superficie de tarjeta | `#131318` | `bg-panel` / `bg-carbon-2` |
| Superficie elevada | `#16161B` | `bg-panel-soft` |
| Hairline | `rgba(245,246,247,0.1)` | `border-line` |
| Hairline fuerte | `rgba(245,246,247,0.2)` | `border-line-strong` |
| Grafito (bordes marcados) | `#2A2D34` | `border-graphite` |
| Texto principal | `#F5F6F7` | `text-offwhite` |
| Texto secundario | `#A6AAB2` | `text-muted` |
| Texto terciario | `#7C818A` | `text-deepmute` |
| **Acento** | `#22C55E` | `bg-accent` / `text-accent` |
| Verde claro (iconos, enlaces) | `#4ADE80` | `text-accent-soft` |
| **Tinta sobre verde** | `#08130C` | `text-greenink` |
| Superficie verde | `#101710` + borde `#24462F` | `bg-accent-surface border-accent-border` |
| Papel hueso (el "gi") | `#F4F1E8` sobre tinta `#141414` | `bg-paper text-paper-ink` |
| Papel, línea | `#D8D1BE` | `border-paper-line` |
| Ámbar SOLO avisos | `#E5B567` | `text-warn` |

Cinturones (jiu-jitsu): blanco `#F5F6F7`, azul `#4F7CC0`, púrpura `#7B5BA6`,
marrón `#856046`, negro `#0F0F12`. **Son lenguaje de progresión del alumno,
nunca color de interfaz.** Las rayas son EXCLUSIVAS de la cinta blanca y solo
aparecen en landings y funnels. En la App el cinturón va limpio, en su color.

**Prohibido cualquier otro color.** Nada de violeta, cian, rosa, dorado ni
degradados de color.

---

## 3. Forma: esquinas suaves, nunca rectas

```
tarjeta, botón, campo ....... rounded-card   (4px)
panel grande, modal ......... rounded-panel  (8px)
ficha, chip, etiqueta ....... rounded-pill   (3px) / rounded-chip (2px)
avatar ...................... rounded-full
```

Sombras solo dos: `shadow-card` para elevar un panel y `shadow-green` para el
hover del botón principal. Nada más.

---

## 4. Tipografía: UNA sola, con TODO el rango de peso

- **Inter Tight**, de 400 a 900. La jerarquía se hace con **grosor**, tamaño y
  color, nunca con otra fuente.
- Titular grande: **900**, tamaño fluido, `tracking-tight`.
- Titular de sección: **800**. Etiquetas y botones: **600**. Cuerpo: **400**.
- Cuerpo a 15-16px con interlineado holgado (1.7). Nada de 10-12px para leer.
- **Tracking ancho SOLO en el wordmark "CAPITAL HUB"** (`tracking-wordmark`,
  0.3em). Todo lo demás normal. Las mayúsculas espaciadas en cuerpo de texto
  están prohibidas: cuestan leer.
- Un "kicker" de sección puede ir en 12px, 600, VERDE, con una línea fina al
  lado. Ese es el único uso de mayúsculas pequeñas.

---

## 5. Mobile-first, siempre

**Se diseña la pantalla de móvil primero y después se ensancha.**

- Zonas táctiles mínimo **44x44**.
- Cero scroll horizontal, nunca.
- Padding mínimo **20px en móvil**, 24-48px en escritorio.
- Menús y desplegables en móvil: **hoja inferior** con
  `pb-[calc(1rem+env(safe-area-inset-bottom))]`, no un flotante que se sale.
- El layout de móvil se **rehace**, no se comprime.
- Se prueba a **375px** y a **1280px**. Las dos.

---

## 6. Simplicidad: el criterio de Marco

> *"Necesito que sea ultra intuitiva, minimalista, que se entienda exactamente
> dónde están las cosas, que no haya bugs y que todo esté visualmente perfecto."*

1. **Si no sabes explicar en una frase para qué sirve un bloque, se quita.**
2. **Cero jerga en pantalla.** Nada de `min_tier`, `display_order`,
   `content_type`. Si un dato técnico no cambia lo que el usuario va a hacer, no
   se enseña.
3. **Un botón dice lo que hace, con un verbo.** Nunca "Aceptar" ni un icono
   suelto sin etiqueta accesible.
4. **Nunca un botón visible que al pulsarlo no hace nada.**
5. **Una sola acción principal por pantalla**, en verde. El resto con borde o en
   texto.
6. **Menos bloques.** Antes de añadir una sección, mira si cabe dentro de otra.
7. **Estado vacío con su salida dentro**: el botón que lo resuelve va ahí mismo.

---

## 7. Navegación: siempre hay salida

- **Toda pantalla lleva un botón de volver visible**, arriba a la izquierda, con
  texto. Nunca se depende del botón atrás del navegador.
- Lo que se edita a menudo se alcanza **desde donde se está mirando**.
- La vuelta lleva al sitio exacto de donde se vino.

---

## 8. Movimiento

- Curva oficial: `cubic-bezier(0.16, 1, 0.3, 1)` (`ease-brand`).
- Un solo momento fuerte por pantalla. El resto, quieto.
- Se anima `transform`/`translate` y `opacity`. Nunca `width`, `height` ni
  `margin`.
- Hover del botón principal: sube 2px y saca la sombra verde.
- Todo degrada con `prefers-reduced-motion`.
- Las cargas usan `<LoadingScreen />` (anillo verde + monograma CH). Prohibido
  el spinner suelto y la pantalla en blanco.

---

## 8 bis. Gráficos: lo visual manda, y tiene que explicarse solo

**Lo visual vale más que el texto. PROHIBIDO quitar un gráfico y dejar una frase
en su lugar** (Marco, 2026-07-30). Ver REGLA #15 del protocolo del agente.

Todo gráfico lleva, sin excepción:

- Los **dos ejes rotulados**, con sus extremos.
- El **número a la vista** en cada punto o barra.
- **Al pasar el cursor o tocar**: una etiqueta en palabras normales.
- **Lo importante señalado DENTRO del dibujo** (la caída marcada en ámbar, no
  contada aparte).
- Un **título sin jerga** que diga qué estás mirando.

### Dos fallos ya cometidos. No repetirlos.

**1. Un gráfico con líneas NUNCA se estira.** La primera curva usaba un lienzo
de 100x100 con `preserveAspectRatio="none"` estirado a lo ancho. Resultado:
**faltaban tramos de línea**. Al deformar el lienzo de forma distinta en ancho y
alto, el patrón de guiones de la animación de dibujado se calcula sobre esa
deformación y algunos tramos caen en el hueco del guion.
**Se mide el hueco real y se dibuja en píxeles** (`ResizeObserver`), con el
`viewBox` igual al tamaño real. Nada de `preserveAspectRatio="none"` con trazos.

**2. Si el componente se mide a sí mismo y puede devolver `null` antes de
tiempo, se mide con REF DE FUNCIÓN.** Mientras cargan los datos el gráfico
devuelve `null`, así que en el primer pintado el hueco no existe. Un
`useLayoutEffect` con lista vacía se ejecuta una sola vez, mide cero y no vuelve
a mirar: **el gráfico se queda en blanco para siempre**. La ref de función se
dispara justo cuando el hueco aparece.

**3. Una etiqueta que califica a alguien dice SU MOTIVO con el número.** Salía
"Parado" al lado de "entró hace 1 semana" y parecía una contradicción. Eran dos
cosas distintas (visitar no es avanzar) pero la pantalla no lo decía. Ahora pone
"Parado: hace 1 mes que no avanza". **Si un cartel puede leerse como una
contradicción, le falta el porqué.**

**4. Los datos de ejemplo tienen que ser coherentes entre sí.** El ejemplo daba
fechas al azar por separado y salían imposibles (última visita anterior a la
última lección hecha). Se generan en cadena, respetando el orden real de los
hechos.

---

## 9. Iconos y copy

- Iconos de `lucide-react`, y cada uno significa algo real.
- **`Sparkles` está PROHIBIDO** en todo el producto.
- Cero emojis. Cero guion largo. Español neutro, nunca de España.
- Los errores dicen **qué pasó y qué hacer**, nunca un código.

---

## 10. Checklist antes de dar una pantalla por hecha

- [ ] Ni un color fuera de la sección 2.
- [ ] Radios 4px/8px. Cero esquinas rectas y cero `rounded-2xl/3xl`.
- [ ] Bordes hairline translúcidos.
- [ ] Inter Tight, con peso real (900/800/600/400). Cero mono, cero fuentes de
      sistema.
- [ ] Probada a 375px y 1280px. Cero scroll horizontal.
- [ ] Zonas táctiles ≥ 44px.
- [ ] Botón de volver visible, con texto.
- [ ] Cada botón se entiende sin explicación.
- [ ] Cero jerga técnica en pantalla.
- [ ] Cero emojis, cero guion largo, cero `Sparkles`.
- [ ] `tsc` y `npm run build` limpios, y **mirada real en el navegador**.

---

## Errores ya cometidos (no repetirlos)

**El token con el nombre correcto y el valor viejo.** `tailwind.config.js`
definía `accent: "#FFFFFF"`. Todo lo escrito con `bg-accent` salía blanco
creyendo usar el brandkit. **El nombre de un token no garantiza su valor:** se
abre la config y se comprueba antes de construir.

**Las esquinas rectas.** Se asumió que "brandkit sobrio" era esquina recta y se
puso `rounded-none` en media App. Marco: *"todo lo que sea esquinas puntiagudas
y ese vibe antiguo, fuera"*. El brandkit real redondea 4px y 8px. **No se
deduce el estilo: se lee del brandkit vivo.**

**Copiar de pantallas existentes.** La mayor parte del SaaS está con el diseño
viejo. Copiar de ahí es reintroducirlo.

**Rediseñar lo que nadie pidió.** Se tocó el panel formativo (comunidad,
mensajes, aula) sin encargo. Marco: *"nunca te he pedido que rediseñes el
school, deja de perder tokens"*. **Se toca exactamente lo que se pidió.**
