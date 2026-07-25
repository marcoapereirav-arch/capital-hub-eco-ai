# Capital Hub: reglas del agente

> Este archivo es `AGENTS.md`, el estandar abierto que leen las herramientas de IA.
> En Capital Hub, la fuente de verdad de las reglas operativas sigue siendo el
> **Knowledge** (`docs/sops/`) y `CLAUDE.md`. Este archivo NO los sustituye: anade
> la "valla" de REGLAS DE FABRICA que mantiene NVISION (se pone al dia con
> `/actualizar-sistema`) y, debajo, apunta a tus reglas propias, que viven FUERA
> de la valla y NUNCA se tocan con el update.

---

<!-- REGLAS-DE-FABRICA:INICIO -->
<!-- Este bloque lo mantiene NVISION y se pone al dia SOLO con el skill /actualizar-sistema. -->
<!-- NO escribas nada aqui dentro: en la proxima actualizacion se sobrescribe. -->
<!-- TUS propias reglas van FUERA de estas marcas (arriba o abajo). Ahi nunca se toca nada. -->

## ⚙️ REGLAS DE FABRICA (las mantiene NVISION · no editar aqui dentro)

> Estas reglas llegan de NVISION y se actualizan con `/actualizar-sistema`.
> Version de este bloque: **1**. Tus reglas propias van FUERA de las marcas `REGLAS-DE-FABRICA`.

### Regla de fabrica — NO dejar basura en la raiz

Prohibido generar archivos temporales (capturas, logs, salidas de tests, dumps) en la raiz del proyecto o en carpetas de produccion (`public/`, `src/`). Todo artefacto temporal va a `.test-artifacts/` (oculta, en el `.gitignore`).

- Capturas de Playwright → `.test-artifacts/screenshots/`.
- Logs, dumps, salidas de scripts → `.test-artifacts/<subcarpeta-descriptiva>/`.
- Si hace falta una carpeta nueva para artefactos, se crea DENTRO de `.test-artifacts/`, nunca en la raiz.
- Basura = cualquier archivo que solo sirve para depurar/verificar y no es parte del producto.

### Regla de fabrica — Cerrar una RLS obliga a barrer quien leia filas AJENAS (fallo MUDO)

Al endurecer una policy de RLS en Supabase, en el MISMO turno hay que revisar TODO el codigo que leia filas **ajenas** de esa tabla con el cliente del usuario (`createClient()`) y pasarlo a `createServiceRoleClient()` o a una RPC `SECURITY DEFINER`.

**Por que es traicionero: la RLS NO lanza error.** Filtra las filas y devuelve 0 con `error = null`. `maybeSingle()` → `null`, `select()` → `[]`. El codigo lo confunde con "no hay datos".

- Un fallo de sistema NUNCA es "no hay datos": si un dato de sistema SIEMPRE deberia existir, su ausencia es `throw`, no `[]`.
- FAIL-CLOSED en todo chequeo de permiso o conflicto: un error al comprobar es `throw`, jamas "adelante".
- Verificar SIEMPRE como el rol mas restringido, nunca como admin (siendo admin todo funciona y el bug es invisible).

<!-- REGLAS-DE-FABRICA:FIN -->

---

## Reglas propias de Capital Hub (FUERA de la valla: el update nunca las toca)

> La fuente de verdad completa esta en el Knowledge. Esto es solo el indice para no perderse.

- **REGLA #0 (Knowledge first):** antes de actuar, leer `docs/sops/`. Es ley. Detalle en `CLAUDE.md`.
- **Protocolo del agente (REGLAS #1 a #9):** `docs/sops/producto/04-protocolo-trabajo-agente.md`.
  Auto-board en cada turno, auto-knowledge en cada decision, auto-commit + push al cerrar bloque,
  no inventar UI de servicios externos, prohibido el guion largo, prohibido anadir emojis,
  el OS siempre en live, puerto local 3100 a 3200.
- **Arquitectura OS vs App, y contenido de alumnos SIEMPRE en la App:** `docs/sops/producto/02-arquitectura-os-app.md`.
- **Brandkit oficial (ley de diseno):** `docs/sops/marketing/brand/` (SOP 01).
- **Filosofia Agent-First, ruteo de skills, stack y arquitectura:** `CLAUDE.md`.

> Si una regla no esta en el Knowledge, no es regla. Si surge una decision nueva: primero al Knowledge, despues se aplica.
