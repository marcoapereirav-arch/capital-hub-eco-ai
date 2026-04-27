---
name: Migrar HTMLs de funnels — EXACTO primero, mejoras despues
description: Cuando se migra un HTML existente (landing, funnel, lead magnet) al OS, primero replicarlo EXACTO 1:1 (tipografia, branding, efectos, estructura). Solo despues, sobre esa base, se aplican mejoras incrementales que el usuario apruebe.
type: feedback
---

# Migrar HTMLs existentes — fidelidad primero, mejoras despues

**Regla:** Cuando el usuario pasa el HTML de una landing/funnel/lead magnet existente y pide migrarla al OS, NO rediseno desde cero ni "mejoro" cosas por iniciativa. Cojo el HTML literal y lo replico 1:1: tipografia, branding, efectos, animaciones, estructura, copy. Solo DESPUES, ya con la base fiel, aplicamos mejoras una por una que el usuario aprueba.

**Why:** El usuario me corrigio explicitamente (2026-04-25) tras yo proponer "rediseno profesional desde cero". Su frase: *"tiene una estructura brutal: tiene toda su tipografia, su branding, sus efectos, sus peliculas. Tienes que cogerlo literalmente de forma exacta y a partir de ahi es que ya nosotros empezamos a mejorar cositas"*. La razon: lo que ya existe esta validado / le gusta y no quiere perderlo en una "mejora" mia.

**How to apply:**
- Cuando reciba HTML de una landing/funnel/lead magnet, replicarlo EXACTO en componentes React (Server Components donde se pueda) preservando estructura visual, animaciones, microinteracciones
- NO refactorizar a "mejor practica" si eso cambia el comportamiento visual
- NO cambiar copy aunque parezca mejorable
- Si veo algo que claramente esta roto o desactualizado, NO lo arreglo silenciosamente — lo apunto y se lo digo al usuario para que decida
- Solo despues de la migracion fiel, en iteraciones aprobadas, se aplican mejoras
- Aplica especificamente a: t_migrar_funnel_acceso_gratis_html, t_migrar_funnel_hub_html, y cualquier futura migracion de assets visuales del usuario
