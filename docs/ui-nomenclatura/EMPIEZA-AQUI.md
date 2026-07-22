# EMPIEZA AQUÍ

Esta carpeta es un documento visual **completo y autocontenido**: el manual "Cómo se
llama cada cosa" (nomenclatura de interfaces, ~78 elementos con mockups animados).
Solo depende de `react` y `framer-motion`.

## Cómo usarla (3 pasos)

1. **Arrastra esta carpeta entera** dentro de tu proyecto (donde guardes componentes).
2. En ese proyecto: `npm i framer-motion`
3. Abre el chat de tu IA y **pégale el prompt de abajo**.

Eso es todo. La IA se encarga de adaptarlo a tu marca (los detalles técnicos están
en `README.md`, dentro de esta misma carpeta).

---

## Prompt para pegar a tu IA

> Te acabo de dejar una carpeta (`ui-nomenclatura-doc/`) con un documento visual de
> nomenclatura de interfaces: React + Tailwind + framer-motion, ~78 elementos de UI,
> cada uno con su mini-mockup animado. Está hecho para adaptarse a la marca del proyecto.
>
> Léete su `README.md` y **adáptalo a NUESTRO branding**, SIN cambiar el contenido (los
> nombres y descripciones de los elementos se quedan igual). En concreto:
> 1. En `theme.ts`, pon nuestros colores (`ACCENT`, `ACCENT_SOFT`, `ACCENT_RGB`, `SECONDARY`).
> 2. En `tailwind.config`, define los tokens `accent`, `accent-soft`, `secondary`,
>    `canvas`, `ink`, `ink-soft`, `ink-muted` con nuestros valores, y `fontFamily.display`
>    / `fontFamily.body` con nuestras tipografías.
> 3. En el CSS global, añade las utilidades `surface-elevated`, `text-eyebrow`,
>    `text-gradient-accent` y `safe-*` (el snippet está en el README) con nuestros valores.
> 4. Find/replace en la carpeta de los hex sueltos (`#C2A665`, `#E1CD91`, `#8a4ed8`,
>    `194,166,101`) por los de nuestra marca.
> 5. Monta la página `NomenclaturaDoc` en la ruta que decidamos y pásale `backHref`
>    a nuestra ruta de vuelta.
> 6. Contraste alto: texto con la escala `ink/ink-soft/ink-muted` sobre `canvas` oscuro,
>    cards con superficie elevada visible. Verifica que nada se corte ni se desborde en
>    móvil (375px) ni en escritorio (1280px).
>
> Cuando termines, dime la ruta exacta donde lo montaste para revisarlo.
