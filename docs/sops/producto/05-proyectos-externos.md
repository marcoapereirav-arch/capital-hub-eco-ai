---
title: Protocolo de proyectos externos
order: 5
---

# Protocolo de proyectos externos (CRÍTICO)

> Este proyecto local se llama **Capital Hub**. Toda plataforma externa usada aquí debe tener un nombre coherente con "Capital Hub" (ej: `capital-hub`, `capital-hub-eco-ai`, `ecoai-capitalhub`, `capitalhubapp`).

**Regla principal:** Antes de ejecutar cualquier operación sobre un servicio externo (Supabase, Vercel, GitHub, Stripe, Polar, DNS, cualquier cosa), SIEMPRE debo **verificar que el nombre del proyecto externo corresponda a Capital Hub**.

## Protocolo obligatorio

1. **Antes de tocar cualquier proyecto externo, listar los proyectos disponibles** (via MCP o CLI) y localizar el que tenga un nombre coherente con Capital Hub.
2. **Si el único proyecto que aparece NO se llama coherente con Capital Hub** (ej. aparece `nvision-saas`, `other-app`, etc.), **PARAR inmediatamente.** No asumir que es el correcto "por descarte". El usuario puede tener múltiples cuentas/organizaciones y el MCP/CLI puede estar conectado a la equivocada.
3. **Preguntar explícitamente al usuario** por el nombre/URL del proyecto correcto antes de ejecutar cualquier acción destructiva o mutativa (migraciones SQL, env vars, deploys, etc.).
4. **Para verificar coincidencia**, cotejar al menos uno de estos signos:
   - Nombre del proyecto externo incluye "capital" o "hub" o "ch" o "ecoai"
   - URL del servicio externo coincide con la que está en `.env.local` o Vercel env vars del proyecto local
   - El usuario confirma explícitamente por chat

## Aplica a

Supabase (migraciones, tablas, RLS, SQL), Vercel (env vars, deploys, projects), GitHub (commits, pushes, force-push), Stripe/Polar (webhooks, productos), dominios, DNS, y cualquier servicio externo.

**No excepciones.** Mejor perder 30 segundos preguntando que tocar un proyecto ajeno.

## Caso concreto: `nvision-saas` NO es Capital Hub (CRÍTICO)

`nvision-saas` (Supabase `oytssmypmvgpqmurwjme`, repo `marcoapereirav-arch/nvision-saas`) es el **proyecto personal de Marco**, separado de Capital Hub. Marco colabora con Adrián en Capital Hub, pero nvision es **otra cosa**.

- **El OS (este proyecto) usa el Supabase `aglyoyqtzozdnusltjxe`** (lo confirma `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`). Es la cuenta compartida con Adrián.
- **JAMÁS se toca `nvision` desde este proyecto.** Los cambios en nvision se hacen solo en su propia ventana/repo (`Marco-Codes/NVISION`).
- **Trampa detectada (2026-05-25):** el MCP de Supabase de Claude apunta a `nvision`, no a Capital Hub, porque es la cuenta a la que Marco tiene token. Había DOS conexiones a nvision: el conector Claude.ai (`mcp__claude_ai_Supabase`) y un servidor local en `.mcp.json` (`@supabase/mcp-server-supabase`) con un PAT personal de Marco.
- **Bloqueo aplicado:** en `.claude/settings.local.json` (gitignored, solo Marco) → `permissions.deny: ["mcp__claude_ai_Supabase", "mcp__supabase"]` + `disabledMcpjsonServers: ["supabase"]`. En este proyecto **es imposible tocar nvision por MCP**.
- **Cómo se hace trabajo de BD del OS:** NO por MCP (apunta a nvision). Se usa la conexión real de Capital Hub vía credenciales de `.env.local` (`aglyoyqtzozdnusltjxe` + service role) con la CLI de Supabase. Pendiente: configurar un acceso scoped a la cuenta de Capital Hub (token de la org de Adrián) si se quiere MCP propio del OS.
- **Consecuencia en el board:** `public.tasks` vive en el Supabase de Capital Hub. Hasta tener la vía CLI/token de esa cuenta, el auto-sync del board (REGLA #1) no puede hacerse por MCP — no se debe escribir en las `tasks` de nvision.

## Cambios versionados

### 2026-05-04 — Migrado desde CLAUDE.md
Este protocolo vivía inline en `CLAUDE.md`. Movido al Knowledge para que CLAUDE.md solo contenga la regla #0 ("lee Knowledge antes de actuar") y todas las reglas operativas vivan aquí versionadas.

### 2026-05-25 — Caso `nvision-saas` + bloqueo del MCP de Supabase
Marco aclaró que `nvision-saas` es su proyecto personal, NO Capital Hub. El MCP de Supabase apuntaba a nvision (única cuenta con token de Marco). Se bloqueó el MCP de Supabase en este proyecto (`.claude/settings.local.json`: deny + disabledMcpjsonServers) para que sea imposible tocar nvision desde aquí. Documentado cómo se hace el trabajo de BD del OS (CLI + `.env.local` → `aglyoyqtzozdnusltjxe`) y el impacto en el auto-sync del board.
