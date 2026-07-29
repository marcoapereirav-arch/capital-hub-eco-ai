# SOP 58 · Purga del brandkit antiguo en la App

**Estado:** aplicado en rama `arreglo-entrada-formador` de `App Capital Hub` (sin publicar)
**Fecha:** 2026-07-29
**Manda:** `docs/sops/marketing/brand/01-brandkit-oficial.md`. No hay otra fuente.

---

## Por qué existe este SOP

Marco, tres veces seguidas, sobre la misma pantalla:

> *"Estás usando el diseño antiguo del brandkit, te lo dije antes y NO lo has
> arreglado. ELIMINA DE RAÍZ ESE DISEÑO."*
> *"El ÚNICO brandkit que existe es el que está en el Knowledge y es el ÚNICO
> que vas a usar."*

La causa no era despiste: **la App tenía DOS brandkits a la vez** y los dos se
llamaban igual.

---

## La causa raíz (esto es lo que hay que recordar)

`web/tailwind.config.js` definía `accent: "#FFFFFF"` con el comentario "ÚNICO
acento, monochrome". Es decir: **el token tenía el nombre correcto y el valor
del brandkit viejo.** Cualquier pantalla nueva escrita con `bg-accent` salía
BLANCA creyendo estar usando el brandkit oficial.

Encima, media docena de pantallas ni siquiera usaban tokens: llevaban un objeto
`const C = { bg: '#0F0F12', white: '#FFFFFF', ... }` y `style={{}}` en cada
nodo, más `fontFamily: "'JetBrains Mono'"` con mayúsculas muy espaciadas para
etiquetas de interfaz.

**Lección permanente: el nombre de un token no garantiza su valor.** Antes de
construir sobre `bg-accent`, se abre `tailwind.config.js` y se comprueba.

---

## Qué se hizo

1. **`tailwind.config.js` reescrito** desde el brandkit del Knowledge:
   - `accent` `#FFFFFF` → **`#22C55E`** (verde). `accent-soft` `#4ADE80`.
   - Fuera `accent-glow`, `boxShadow.glow`, `appleGray`, `ultra`, `secondary`.
   - Tipografía: **Inter Tight y nada más** (fuera el stack de fuentes de
     sistema). `JetBrains Mono` queda solo como `font-mono`.
   - Añadida la escala de **cinturones**: `belt-white #F5F6F7`,
     `belt-blue #4F7CC0`, `belt-purple #7B5BA6`, `belt-brown #856046`,
     `belt-black #0F0F12`. Rayas SOLO en la cinta blanca; nunca como color de
     interfaz.
2. **`index.css`**: variables de acento a verde, `font-family` a Inter Tight,
   eliminada la clase `.accent-glow`.
3. **Pantallas barridas** (objeto de colores + `style` + `fontFamily` fuera,
   tokens dentro, esquinas rectas, zonas táctiles de 44px):
   Inicio, Panel Formativo (aula), Comunidad, Mensajes, Entrar, marco de acceso,
   Invitación, 404, Perfil público y el efecto de carga (su anillo era BLANCO y
   ahora es VERDE).
4. **Icono `Sparkles` eliminado** de la pantalla de invitación. Está prohibido en
   todo el producto.

---

## Dónde entra el formador a editar (lo que Marco no encontraba)

Dos accesos, los dos desde donde ya está mirando. Ninguno en Ajustes.

| Sitio | Forma | Quién lo ve |
|---|---|---|
| Inicio de la App | Tarjeta "Mi formación" (formador) / "Gestionar formaciones" (super admin), al mismo nivel que Panel Formativo y Marketplace | Quien puede editar algo |
| Tarjeta de la formación, en el aula | Icono de lápiz en la esquina superior derecha de la portada | Solo quien puede editar ESA formación |

Los dos llevan al Estudio (`/formador`), que ya está acotado por
`formacion_asignada` en la interfaz, en la API y en RLS (SOP 55 y 56).

La versión intermedia (una barra ancha "Editar formación" debajo de cada
tarjeta) **fue rechazada**: rompía la rejilla y competía con el contenido. No se
vuelve a esa forma.

---

## Regla que queda viva

Cualquier trabajo visual en la App pasa por la skill `brandkit-capital-hub`, que
a su vez **manda leer el brandkit del Knowledge antes de diseñar**. Si un archivo
que tocas todavía trae diseño antiguo, se deja limpio en esa misma pasada. No se
parchea alrededor.

Pendiente de verificación con credenciales: las pantallas que exigen sesión
(Inicio, aula, Comunidad, Mensajes, Estudio) no se han podido mirar en el
navegador todavía. Las públicas (Entrar, 404) sí, a 375 y a 1280.
