---
title: IA Integrator — índice de la formación
order: 0
---

# Formación IA Integrator — material de presentación

Esta carpeta contiene los manuales que se usan como **material de presentación de la formación IA Integrator** de Capital Hub. Enseñan a una persona **no técnica** a construir su propio software **hablándole a una IA** (Vibe Coding), con las mismas reglas de orden y seguridad que usa un programador de verdad.

## El flow que enseñan (de qué van)

Los tres documentos cuentan la misma historia, en capas de profundidad creciente:

1. **La idea central** — Tú dices **QUÉ** quieres; la IA escribe el código, lo prueba y lo deja funcionando. Tu trabajo es **dirigir, mirar y aprobar** (eres el director de la película, no el que maneja la cámara).

2. **Los 4 lugares donde vive el trabajo** — y su viaje, siempre en el mismo orden:
   - **Localhost** (tu ordenador, solo lo ves tú) → se construye y se prueba SIEMPRE aquí primero.
   - **Rama** (una mesa aparte) → solo para cosas grandes o arriesgadas, sin tocar lo bueno.
   - **main** (la versión oficial, en la nube) → solo entra lo que ya está listo.
   - **Producción** (la web pública) → se publica sola al llegar a `main`.

   `idea → localhost → [rama si es grande] → main → producción (live)`

3. **Guardar y publicar** — `commit` (guardar una versión = cerrar un sobre etiquetado), `push` (subirla a la nube = echarlo al buzón), `merge` (unir una rama a main = volver del desvío a la carretera). El alumno **no dice estas palabras**: dice *"publícalo"* y la IA hace la secuencia correcta.

4. **¿main o rama?** — Lo decide la IA: pequeño y seguro → directo a `main`; grande, nuevo o delicado (pagos, login, datos) → primero una `rama`.

5. **El vocabulario del alumno** — es mínimo: `/primer` · *"quiero que…"* · *"cambia esto"* · **"publícalo"** · *"tíralo"* · *"ciérralo"*.

6. **Las 3 reglas que no se saltan** — `primer` siempre al empezar; no dar nada por bueno sin verlo en local; no está terminado hasta que está live.

## Los documentos

| # | Documento | Qué es | Cuándo usarlo en la formación |
|---|-----------|--------|-------------------------------|
| 01 | [Vibe Coding — Al grano](01-vibecoding-al-grano.md) | El método entero en 1 página | Primer contacto / resumen para tener a mano |
| 02 | [Vibe Coding — El método completo](02-vibecoding-workflow.md) | La versión larga: paso a paso, ejemplos, chuletas, glosario | El cuerpo de la clase |
| 03 | [Git explicado sin tecnicismos](03-git-explicado.md) | Profundización solo en Git (commit/push/merge, ramas) | Deep dive para quien quiera entender el "por debajo" |

## Notas de trabajo

- **Origen:** los 3 manuales vienen de NVISION y se **adaptaron a Capital Hub** (2026-07-01). El doc 03 (Git) ya usa los repos reales (`capital-hub-eco-ai` / `capital-hub-app`), el dominio real (`ecoai.capitalhubapp.com`) y su ejemplo dejó de ser una foto congelada de otro proyecto: ahora es un caso de Capital Hub (rediseño del funnel Test de Personalidad).
- **Docs 01 y 02** son el mismo manual en dos tamaños (resumen y completo): coherentes entre sí, terminología idéntica, ya genéricos (sin marca ajena).
- **Voz:** el doc 03 conserva el tono "Para Marco / la IA te dice". Si la formación es 100% para alumnos, en la pasada visual se puede generalizar a "Para ti". Lo dejo tal cual hasta que lo decidas.
- Estos manuales describen el flujo Vibe Coding **de libro**. En Capital Hub el agente trabaja **prod-first** (casi siempre `commit + push` directo a `main`; ramas solo para lo grande) y **sube solo al terminar cada bloque** sin que el usuario lo pida (SOP `producto/04`, regla #3). Es material general para alumnos, no el reglamento interno de este repo.

## Cambios versionados

- **2026-07-01** — Creación. Se movieron aquí los 3 manuales que estaban sueltos en `docs/` (`Manual_VibeCoding_AlGrano`, `Manual_VibeCoding_Workflow`, `Manual_Git_NVISION`), renombrados y con frontmatter. Material de presentación de la formación IA Integrator.
- **2026-07-01** — Adaptación NVISION → Capital Hub. Doc 03 (Git): repos `nvision-saas`/`nvision-setup` → `capital-hub-eco-ai`/`capital-hub-app`; ejemplo "caso real" congelado (rama `security/regla-no-leer-secretos` + add-login) → ejemplo Capital Hub (rediseño funnel Test de Personalidad) con dominio real. Docs 01/02 no tenían marca ajena. Pendiente: pasada visual + (opcional) render en `/knowledge` del OS (hoy el servicio no lee subcarpetas).
