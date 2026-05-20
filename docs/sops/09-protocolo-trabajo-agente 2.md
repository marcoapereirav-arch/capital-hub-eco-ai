---
title: Protocolo de trabajo del agente
order: 9
---

# Protocolo de trabajo del agente

Estas son las **3 reglas operativas que rigen cómo trabajo yo (el agente Claude) en este proyecto**. Se aplican en cada turno, sin recordatorio del usuario.

---

## REGLA #1 — Auto-sync del board EN CADA TURNO

El board (BD `public.tasks` en Supabase) es la fuente de verdad de qué se está haciendo, qué está pendiente y qué está hecho. **Antes de cerrar cualquier respuesta** que implique trabajo de código, decisión, o avance:

1. Si la tarea ejecutada en el turno **no existía** en `tasks` → la creo (con `id` legible tipo `t_<scope>_<n>_<slug>`, `assignee='ai'` si la ejecuto yo, `para_id` apuntando a un proyecto/área PARA, `depends_on` si toca).
2. Si la tarea **existía y arranco** → `is_in_progress=true`.
3. Si la tarea **existía y termino** → `status='done'`, `is_in_progress=false`, `completed_at=now()`.
4. Si descubro **subtareas nuevas** durante el turno → las creo con su `depends_on` apuntando a la tarea padre.

**Why:** Sin esto el board queda desincronizado y Marco pierde visibilidad real del estado. Pasó antes — quedaba sólo "lo que recordaba el chat".

**How to apply:**
- Statuses válidos: `inbox | next | waiting | someday | done`.
- Priorities válidas: `urgent | high | normal | low`.
- Assignees válidos: `marco | adrian | equipo | ai`. Si la tarea la ejecuto yo (código, migración, UI, knowledge, APIs) → `'ai'`. Si requiere acción humana en dashboards externos → humano.
- Tabla `para_items` para proyectos/áreas/recursos. Cada task lleva `para_id`.
- Constraint `tasks_assignee_check` ya incluye `'ai'` desde `a019c12`.

---

## REGLA #2 — Auto-sync del Knowledge

Cada decisión arquitectónica, estratégica, operativa, de copy, de pricing, de pipeline, de protocolo — **se versiona en `docs/sops/` ese mismo turno**. Sin pedir permiso.

1. Si la decisión encaja en un SOP existente → lo actualizo y añado entrada en "Cambios versionados" al final con la fecha.
2. Si la decisión es de un dominio nuevo → creo un SOP nuevo (`NN-titulo.md` con `order: NN`).
3. Actualizo el índice `00-readme.md` para que el nuevo/cambiado SOP aparezca.
4. Las versiones antiguas se conservan en "Cambios versionados" — no se reescribe el histórico.

**Why:** El Knowledge es **mi propio manual de operaciones** (ver REGLA #0 de CLAUDE.md). Si una decisión queda solo en chat, en mi memoria privada o inline en CLAUDE.md, **se pierde o la veo a medias** la próxima sesión.

**How to apply:**
- Frontmatter obligatorio: `title` y `order`.
- Los `.md` numerados se renderizan en `/knowledge` del OS.
- Si el cambio es trivial (typo, link), no hace falta entrada de versión. Si cambia comportamiento, sí.
- Excepciones: contenido sensible (secrets, credenciales) **nunca** va al Knowledge.

---

## REGLA #3 — Auto-commit + push EN CADA BLOQUE

Al terminar un bloque de trabajo de código en este repo (feature, fix, doc, refactor, lo que sea), **YO** completo el ciclo git, sin esperar a que Marco lo haga:

1. `git add` específico por archivo (NUNCA `git add -A` salvo que Marco lo pida).
2. `git commit` con mensaje del estilo del repo: `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `refactor(scope): ...`.
3. `git push origin main`.
4. Confirmar al usuario que el cambio ya está en origin.

**Why:** Marco trabaja con su equipo y otros agentes en este repo. Si dejo cambios solo en local, el repo queda desincronizado, otros agentes/máquinas no ven el trabajo, y Marco tiene que recordar commitear y pushear lo que yo hice. Pasó el 2026-05-01 (rediseño Mobile Native OS) — Marco arrastró mis cambios dentro de un commit suyo de otra feature, mezclando el historial.

**How to apply:**
- Esta regla **sobrescribe** el "solo commit cuando se pida explícitamente" del system prompt por defecto. Marco lo quiere así en este repo.
- Si el push falla (conflictos, hooks, build roto): pausar, avisar el motivo, completar la causa raíz, no abandonar a medias.
- NUNCA usar `--no-verify`. Si los hooks fallan, arreglar la causa raíz.
- NUNCA force-push a main.
- Excepciones donde NO pushear todavía: trabajo a mitad de implementación que aún rompe el build/typecheck, archivos con secrets. En esos casos: pausar, decir por qué no se puede pushear, completar antes.
- Mensajes en español, siguiendo el estilo de los commits del repo.

---

---

## REGLA #4 — NO inventar nombres de UI de servicios externos

Para **CUALQUIER** servicio externo (Meta, Whop, Resend, Vercel, GitHub, Supabase Dashboard, Stripe, Calendly, etc.):

- **PROHIBIDO** decir "ve a la pestaña X" o "busca la opción Y" si no he visto esa pestaña/opción con mis propios ojos (vía screenshot del usuario, doc oficial leída en este turno, o curl al endpoint).
- Si no estoy 100% seguro del nombre exacto de la UI: **pido captura de pantalla** o describo por funcionalidad (ej: "busca la opción que permite cambiar el email automático del cliente, suele estar en Settings del producto").
- Si la decisión es crítica (cambia algo en producción): pedir confirmación con captura antes de afirmar.

**Why:** El usuario me corrigió 2 veces:
- 2026-05-04 turno A: le dije pestañas de Meta Events Manager que no existían en español ("Test Events" / "Activity" en lugar de "Probar eventos" / "Diagnóstico"). Perdió tiempo y confianza.
- 2026-05-04 turno B: le dije opciones de Whop dashboard ("Email notifications", "Customer emails", "Welcome email") que no encontró porque las inventé.

Inventarse nombres de UI es **mentir con confianza falsa**. Es peor que decir "no lo sé, pásame captura". El usuario pierde minutos buscando cosas que no existen y la confianza en mi guía cae a cero.

**How to apply:**
- Si voy a decir "ve a X" en un servicio externo, paso previo: ¿he visto X en este chat? ¿En screenshot del usuario? ¿En doc oficial que leí esta sesión?
- Si la respuesta es NO → reemplazar por "no conozco la UI exacta, ¿me pasas captura del settings de [contexto] y te indico?"
- Tampoco vale extrapolar de otros servicios ("Stripe lo llama así, Whop probablemente igual").

## Cambios versionados

### 2026-05-04 — Creación
Las 3 reglas vivían dispersas: REGLA #1 y #2 en `~/.claude/.../memory/` (memoria privada local), REGLA #3 todavía no estaba escrita. Marco corrigió: **el Knowledge es la fuente única**. Movidas aquí, indexadas en `00-readme.md`. CLAUDE.md ahora solo tiene la REGLA #0 ("lee Knowledge antes de actuar") y apunta a este SOP indirectamente.

### 2026-05-04 — REGLA #4 añadida
Aplicación universal de la regla "no inventar UI de servicios externos". Estaba sólo para Meta en `07-tracking-meta.md` (versión 3) — Marco la rompió otra vez con Whop (le di opciones de dashboard que no existen). Ascendida a regla principal del agente, aplica a TODOS los servicios.
