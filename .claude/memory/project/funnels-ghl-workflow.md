---
name: Funnels HTML para Go High Level
description: Los funnels de ventas (landing, checkout, thank you) se crean en HTML puro para Go High Level, brandeados con el brandkit, guardados en src/funnels/
type: project
---

Los funnels de ventas del proyecto se crean como HTML puro para subir a Go High Level (GHL).

**Estructura de archivos:**
```
src/funnels/[nombre-del-funnel]/
├── landing.html
├── checkout.html
└── thank-you.html
```

**Reglas:**
- HTML puro, listo para copiar/pegar en GHL
- Siempre brandeados con Brandkit_Capital_Hub.html (colores, tipografia, espaciado, estilo visual)
- Separados de la app Next.js — no son parte del App Router
- Las ediciones se hacen quirurgicamente: solo lo que el usuario pide cambiar

**Flujo anterior (descontinuado):** Claude generaba un prompt → se llevaba a Google AI Studio → generaba HTML
**Flujo actual:** Claude Code hace todo directamente — diseño, codigo y ediciones

**Why:** El usuario trabaja directamente con GHL y necesita HTML listo para produccion, no componentes React.
**How to apply:** Cuando el usuario pida crear o editar un funnel, trabajar en src/funnels/ con HTML puro brandeado.
