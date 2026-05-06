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

## Cambios versionados

### 2026-05-04 — Migrado desde CLAUDE.md
Este protocolo vivía inline en `CLAUDE.md`. Movido al Knowledge para que CLAUDE.md solo contenga la regla #0 ("lee Knowledge antes de actuar") y todas las reglas operativas vivan aquí versionadas.
