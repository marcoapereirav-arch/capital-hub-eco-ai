---
name: brandkit-capital-hub
description: "LEY DE DISEÑO de Capital Hub. Se usa SIEMPRE, sin excepción, antes de diseñar o tocar CUALQUIER cosa visual del SaaS: una pantalla, un panel, un componente, un botón, un email, una landing, un estado vacío. Define el único brandkit permitido (carbón + verde, Inter Tight), prohíbe el diseño antiguo (acento blanco, fuentes de sistema), y fija el método de UI/UX: mobile-first de verdad, simplicidad, cada botón se entiende. Se activa aunque Marco no nombre el diseño: si el trabajo se ve en pantalla, esta skill manda."
---

# Brandkit Capital Hub: ley de diseño

> Marco, 2026-07-29: *"TIENES PROHIBIDO USAR EL DISEÑO ANTIGUO. Necesito que lo
> elimines de raíz del código y uses únicamente el único brandkit que tenemos.
> SIEMPRE debe ser mobile first. Quiero simplicidad. Quiero que se entienda todo
> claramente."*

**Si lo que estás haciendo se ve en una pantalla, esta skill manda.** No se
improvisa diseño en Capital Hub.

---

## 1. El diseño ANTIGUO está prohibido

Existía un brandkit viejo, monocromo, que sigue apareciendo en código heredado.
**Reconócelo y mátalo en cuanto lo toques:**

| Señal del diseño antiguo | Qué es lo correcto |
|---|---|
| `accent: #FFFFFF` o "monochrome" | El acento es **VERDE** `#22C55E` |
| `accent-glow`, `shadow-glow` (resplandor blanco) | No existe. Fuera. |
| Fuentes de sistema: `-apple-system`, `SF Pro`, `Segoe UI`, `Helvetica`, `Arial` | **Inter Tight**, y solo esa |
| `appleGray`, `#f5f5f7` | `carbon` `#0F0F12` |
| `panel: #18181B` | `panel: #141418` |
| Botón principal blanco sobre oscuro | Botón principal **verde**, texto carbón |

Regla: **si tocas un archivo que trae diseño antiguo, lo dejas limpio en esa
misma pasada.** No se parchea alrededor.

---

## 2. La paleta. No hay más colores

| Uso | Valor | Clase |
|---|---|---|
| Fondo de página | `#0F0F12` | `bg-carbon` |
| Superficie de tarjeta | `#141418` | `bg-panel` |
| Superficie suave | `#131316` | `bg-panel-soft` |
| Superficie de código | `#0C0C0F` | `bg-code` |
| Hairline (bordes) | `#2A2D34` | `border-graphite` |
| Hairline suave | `#1F2126` | `border-graphite-soft` |
| Texto principal | `#F5F6F7` | `text-offwhite` |
| Texto secundario | `#C7CBD1` → `#9CA3AF` → `#7B818C` → `#6B7280` | `text-ink-soft`, `text-muted`, `text-deepmute`, `text-faint` |
| **Acento (verde)** | `#22C55E` | `bg-accent` / `text-accent` |
| **Verde de iconos** | `#4ADE80` | `text-accent-soft` |
| Superficie verde (lo bueno) | fondo `#101710`, borde `#24462F` | `bg-accent-surface`, `border-accent-border` |
| Ámbar **SOLO avisos** | `#E5B567` / `#17150F` / `#3A2F1E` | `text-warn`, `bg-warn-surface`, `border-warn-border` |
| Papel hueso (paneles claros) | `#F4F1E8` sobre tinta `#141414` | `bg-paper text-paper-ink` |

**Prohibido cualquier otro color.** Nada de violeta, cian, rosa, ámbar
decorativo ni degradados de color. Base monocroma más verde. El rojo solo como
texto apagado en acciones destructivas.

---

## 3. Tipografía: UNA sola

- **Inter Tight**, y nada más. Ni Inter, ni JetBrains Mono como cara principal.
- La jerarquía se hace con **grosor, tamaño y color**, nunca con otra fuente.
- `font-mono` (JetBrains Mono) queda **solo** para código, números tabulares,
  duraciones y claves. Nunca para texto corrido.
- **Tracking ancho SOLO para el wordmark "CAPITAL HUB"** (`tracking-wordmark`).
  Todo lo demás con espaciado normal. Las mayúsculas espaciadas en cuerpo de
  texto están prohibidas: cuestan leer.
- Etiquetas pequeñas de sección: 12-13px, mayúsculas, `tracking-[0.12em]`. Ahí sí.

---

## 4. Mobile-first, siempre. No es una fase final

**Se diseña la pantalla de móvil primero y después se ensancha.** No al revés,
y no "encogiendo" el escritorio.

- Zonas táctiles mínimo **44x44**. Siempre.
- Cero scroll horizontal, en ninguna parte, nunca.
- Nada pegado al borde: padding mínimo **20px en móvil**, 24px en escritorio.
- Los menús y desplegables en móvil van como **hoja inferior** (portal a
  `document.body`) con `pb-[calc(1rem+env(safe-area-inset-bottom))]`. Nunca un
  desplegable flotante que se sale de pantalla.
- Respetar las zonas seguras: `env(safe-area-inset-*)` arriba y abajo.
- El layout de móvil se **rehace**, no se comprime. Si en escritorio hay dos
  columnas, en móvil una manda y la otra entra por encima.
- Se prueba a **375px** y a **1280px**. Las dos.

---

## 5. Simplicidad: el criterio de Marco

> *"Quiero simplicidad. Que se entienda perfectamente cada botón. Ahora mismo no
> se entiende una mierda."*

Reglas duras que salen de ahí:

1. **Si no sabes explicar en una frase para qué sirve un bloque, se quita.**
   Un formador no tiene que descifrar nada.
2. **Cero jerga en pantalla.** Nada de "min_tier", "display_order",
   "is_intro_module", "content_type". Si un dato técnico no cambia lo que el
   usuario va a hacer, no se enseña. Si lo cambia, se dice en cristiano.
3. **Un botón dice lo que hace, con un verbo.** "Guardar cambios", "Crear
   formación", "Borrar el módulo". Nunca "Aceptar", "OK" ni un icono solo sin
   etiqueta accesible.
4. **Nunca un botón visible que al pulsarlo no hace nada.** Si no se puede, no se
   pinta. Botón apagado que no responde está prohibido.
5. **Máximo una acción principal por pantalla**, en verde. El resto en texto o
   con borde.
6. **Menos bloques.** Antes de añadir una sección, mira si puede vivir dentro de
   otra. La pantalla llena de cajas es el error a matar.
7. **Estado vacío con salida.** Todo estado vacío lleva DENTRO el botón que lo
   resuelve, no lejos.

---

## 6. Navegación: siempre hay salida

> *"No tengo ningún botón para poder salir del editor. Tengo que darle atrás.
> Dentro de la aplicación siempre tiene que haber botones para ir para atrás."*

- **Toda pantalla tiene un botón de volver visible**, arriba a la izquierda, con
  texto ("Volver"), no solo una flecha.
- **Nunca se depende del botón atrás del navegador.**
- Lo que se edita a menudo se alcanza desde **donde se está mirando**, no
  saliendo a un menú. Si un formador está viendo su formación, el botón de
  editarla está ahí mismo.
- La ruta de vuelta lleva al sitio exacto de donde se vino, no al principio.

---

## 7. Movimiento

- Existe, pero **contenido**: un solo momento fuerte por pantalla.
- Se anima `transform` y `opacity`. Nunca `width`, `height`, `top` ni `margin`.
- Todo degrada con `prefers-reduced-motion`.
- Las cargas usan el **efecto de marca** (`<LoadingScreen />`, anillo con el
  monograma CH). Prohibido el spinner genérico y la pantalla en blanco.

---

## 8. Iconos

- De `lucide-react`, y **cada icono significa algo real** de lo que acompaña.
- **`Sparkles` está PROHIBIDO** en todo el producto. Es el icono genérico de
  "IA" y delata plantilla.
- Cero emojis en cualquier texto del producto.
- Un icono solo (sin texto) necesita `aria-label` y zona táctil de 44px.

---

## 9. Copy

- **Español neutro.** Nunca castellano de España ("vosotros", "os", "vale").
- **Al grano.** Frases cortas, sin muletillas de marketing.
- **Cero guion largo** (`—`). Dos puntos, coma o punto.
- Perspectiva del usuario: "Deja tus datos para acceder", no "Déjanos tus datos".
- Los errores dicen **qué pasó y qué hacer**, nunca un código.

---

## 10. Checklist antes de dar por hecha una pantalla

- [ ] Ni un color fuera de la tabla de la sección 2.
- [ ] Inter Tight. Cero fuentes de sistema, cero `font-family` a pelo.
- [ ] Cero restos del diseño antiguo en los archivos tocados.
- [ ] Probada a 375px y a 1280px. Cero scroll horizontal.
- [ ] Todas las zonas táctiles ≥ 44px.
- [ ] Botón de volver visible, con texto.
- [ ] Cada botón se entiende sin explicación. Ninguno apagado que no responda.
- [ ] Cero jerga técnica en pantalla.
- [ ] Estados vacíos con su botón dentro.
- [ ] Cero emojis, cero guion largo, cero `Sparkles`.
- [ ] Las cargas usan el efecto de marca.
- [ ] `tsc` y `npm run build` limpios.

---

## Errores ya cometidos (no repetirlos)

**2026-07-29, el panel del formador.** Se construyó El Estudio y Marco lo
rechazó: *"no se entiende nada, hay mucho caos, y además está el diseño antiguo"*.
Tres fallos concretos:
1. Se usó `bg-panel`, `text-accent` y demás tokens **sin mirar que apuntaban al
   brandkit viejo** (acento blanco, fuentes de sistema). El token tenía el nombre
   correcto y el valor equivocado.
2. Se enseñó jerga en pantalla: un bloque "Quién la ve" con "Acceso completo ·
   Módulo introductorio: no · Orden dentro de la ruta: 1". Marco preguntó
   literalmente *"esto qué es y por qué está aquí"*.
3. No había botón de volver, y para llegar a editar había que salir e ir a
   Ajustes.

Lección: **el nombre de un token no garantiza que su valor sea el del brandkit.**
Abrir `tailwind.config.js` y comprobarlo antes de construir.

---

## Dónde está la verdad

- Knowledge: `docs/sops/marketing/brand/01-brandkit-oficial.md`.
- En vivo: la página `/brandkit` del OS.
- En código (App): `web/tailwind.config.js` y `web/src/index.css`.
- Para páginas de formación, además: la skill `formacion-visual`.
