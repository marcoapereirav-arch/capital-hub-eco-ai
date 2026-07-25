---
name: template-doctor
scope: template
description: "Repara un proyecto NVISION ya creado aplicando los arreglos de base de la plantilla que update-ecoai NO alcanza (package.json, configs, scaffold, migraciones, docs). Para alumnos que clonaron una version vieja. Activar cuando el usuario dice: arregla mi proyecto, pon al dia mi base, aplica las mejoras de la plantilla, template doctor, repara el setup, actualiza la base de mi ecosistema."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Template Doctor — pone al dia un proyecto NVISION ya creado

`update-ecoai` solo actualiza `.claude/` (skills). Este skill aplica los arreglos de base
que viven FUERA de ahi (package.json, configs, scaffold, migraciones, docs raiz) en un
proyecto que ya clono una version vieja de la plantilla.

Regla de oro: arreglos SEGUROS se aplican solos; los que pueden tocar codigo del dueño se
DETECTAN y se PIDE confirmacion. NUNCA borrar codigo del dueño sin OK. Idempotente: correr
el doctor dos veces no rompe nada.

## Paso 1 — Diagnostico (antes de tocar nada)

Recorre el proyecto y reporta una tabla OK / Arreglar:

| Check | Como detectar |
|-------|---------------|
| skill `sprint` filtrado | existe `.claude/skills/sprint/` (es privado de NVISION, no deberia estar) |
| deps golden path | `zod` y `zustand` en package.json |
| script typecheck | `"typecheck"` en package.json scripts |
| lockfile reproducible | `package-lock.json` NO esta en `.gitignore` |
| components.json | aliases apuntan a `@/shared/...` (feature-first) |
| security headers | `next.config.ts` define `headers()` |
| `.env.local.example` | existe en la raiz |
| inventario skills | `npm run skills:inventory` no deja diff |
| GEMINI.md | igual a CLAUDE.md |
| route groups | usa `(app)` (no `(main)` huerfano) |
| profiles idempotente | la migracion usa `IF NOT EXISTS` + `DROP POLICY IF EXISTS` |
| emails sin Supabase | no hay `resetPasswordForEmail` / `signInWithOtp` |
| REGLA ABSOLUTA secretos | `CLAUDE.md` contiene la seccion "PROHIBIDO LEER FICHEROS DE SECRETOS" |
| `.env.local.example` con contrato | la cabecera explica "ningun agente lee el contenido / solo copia opaca" |
| skills no leen secretos | NINGUN skill hace `cat .env`, `Read` sobre `.env*`, `grep .env \| cut`, `echo $SECRET`, `printenv` (excepto el `export` sancionado de `supabase`) |

## Paso 2 — Arreglos SEGUROS (auto, no pisan codigo del dueño)

1. **sprint filtrado**: si existe `.claude/skills/sprint/` y este NO es el repo del autor, borrarlo (avisar). Es un skill `nvision-only` que no debe viajar.
2. **package.json**: anadir deps `zod` + `zustand` si faltan; scripts `typecheck` (`tsc --noEmit`), `skills:inventory`, `docs:gemini`. Sin tocar lo demas.
3. **.gitignore**: quitar `package-lock.json` de los ignorados.
4. **components.json**: aliases a `@/shared/components`, `@/shared/components/ui`, `@/shared/hooks`.
5. **next.config.ts**: anadir `headers()` de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) si faltan.
6. **.env.local.example**: crear si no existe.
7. **scope + inventario**: `npm run skills:inventory` (etiqueta scope y regenera SKILLS_README).
8. **GEMINI.md**: `npm run docs:gemini` si esta desincronizado.
9. **Instruccion de Knowledge en CLAUDE.md**: si CLAUDE.md NO tiene la seccion **MEMORIA & KNOWLEDGE** (toda IA lee/guarda Knowledge + mapa de memoria + 6 cuadrantes + seguridad de memoria), añadirla.
10. **`.mcp.json` / `.env.local`**: si faltan, crearlos copiando `example.mcp.json` / `.env.local.example` (con placeholders; el dueño pega luego sus credenciales). NUNCA leer el contenido de `.env.local` (regla dura).
11. **REGLA ABSOLUTA de secretos en CLAUDE.md**: si CLAUDE.md NO tiene la seccion **"⚡⚡⚡ REGLA ABSOLUTA — PROHIBIDO LEER FICHEROS DE SECRETOS"**, añadirla (toda IA solo copia `.env*` de forma opaca; nunca lee su contenido; los valores los pega el dueño; existencia con `grep -c`). Y si `.env.local.example` no tiene la cabecera con ese contrato, añadirla. Ambos son cambios aditivos y seguros.

## Paso 3 — Arreglos que PIDEN confirmacion (pueden tocar codigo del dueño)

12. **Route groups `(main)` -> `(app)`**: si usa `(main)`, mostrar que rutas hay dentro y CONFIRMAR antes de `git mv`. (Los route groups no se importan por nombre, pero el dueño debe decidir.)
13. **profiles idempotente**: si la migracion no es idempotente, proponer la version canonica (`CREATE TABLE IF NOT EXISTS` + `DROP POLICY IF EXISTS` + nombres unificados). No re-ejecutar en BD viva sin OK.
14. **Emails por Supabase**: si hay `resetPasswordForEmail` / `signInWithOtp`, proponer correr `/email-token-based` (sistema de emails sin Supabase).
15. **Skills que leen valores de secretos**: si el barrido encuentra un skill con `cat .env`, `Read` sobre `.env*`, `grep .env | cut`, `echo $SECRET` o `printenv` (excepto el `export` sancionado de `supabase`), proponer reescribirlo (preferir MCP / patrón "genera-a-fichero" para claves generadas). Toca contenido de skill → pedir OK antes. Barrido sugerido:
    ```bash
    grep -rnE "cat +\.env|\bRead\b.*\.env|\.env[a-z.]* *\| *cut|echo +\\\$[A-Z_]+|printenv" .claude/skills --include="*.md" | grep -v "process.env" | grep -v "appendFileSync"
    ```

## Paso 4 — Verificar y reportar

1. `npm run typecheck` para confirmar que nada se rompio.
2. Reporte final: que se arreglo (seguros), que queda pendiente de tu OK (confirmacion), y que ya estaba bien.

## Reglas

- NUNCA borrar codigo/archivos del dueño sin confirmacion explicita.
- Solo aplicar arreglos SEGUROS sin preguntar; el resto se confirma uno a uno.
- Si el proyecto ya esta al dia, decirlo y no tocar nada.
