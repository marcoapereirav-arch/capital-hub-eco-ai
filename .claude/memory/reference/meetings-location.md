---
name: Ubicación de resúmenes de reuniones
description: Dónde viven los resúmenes de llamadas del equipo y cómo organizarlos
type: reference
---

Los resúmenes de reuniones viven en `/docs/meetings/`, organizados por tipo de llamada:

- `/docs/meetings/daily/YYYY-MM-DD.md` — dailies del equipo
- Otras subcarpetas se crearán a demanda: `sales-calls/`, `strategy/`, `1-on-1s/`, etc.

**Flujo cuando el usuario pase una transcripción:**
1. Identificar el tipo de llamada (daily, venta, estrategia…) y usar/crear la subcarpeta correspondiente.
2. Guardar el resumen como `YYYY-MM-DD.md` (o `YYYY-MM-DD-[contexto].md` si hay varias del mismo tipo el mismo día).
3. **No usar plantilla fija.** Adaptar la estructura al contenido real de cada reunión — narrativa por temas, no checklist rígido.
4. Responder en chat con análisis resumido y enlace al archivo.
5. Solo replicar a `.claude/memory/project/` cuando haya una decisión duradera que deba condicionar futuras tareas (ej. reglas de escalado, políticas de desarrollo). El archivo completo vive en `/docs/`.

**Por qué `/docs/`:** `CLAUDE.md` declara `/docs/` como lectura obligatoria antes de cualquier tarea, así que los resúmenes quedan automáticamente en contexto futuro.
