---
name: Proyectos externos — nombres coherentes
description: Antes de operar sobre cualquier servicio externo (Supabase, Vercel, GitHub, etc.) verificar que el nombre del proyecto remoto coincida con Capital Hub. Nunca asumir.
type: feedback
---

# Proyectos externos — nombres coherentes con Capital Hub

**Regla:** Cuando trabajo en Capital Hub, todo proyecto externo (Supabase, Vercel, GitHub, Stripe, Polar, DNS, cualquier servicio) debe tener un nombre coherente con "Capital Hub" (ej: `capital-hub`, `capital-hub-eco-ai`, `ecoai-capitalhub`, `capitalhubapp`).

Antes de ejecutar cualquier operacion mutativa o destructiva sobre un servicio externo, DEBO:
1. Listar los proyectos disponibles via MCP/CLI
2. Identificar el que tenga nombre coherente con Capital Hub
3. Si el unico proyecto disponible NO se llama coherente (ej. `nvision-saas`, `other-app`), PARAR y preguntar explicitamente al usuario. NO actuar "por descarte".

**Why:** El 2026-04-11 aplique una migracion SQL (`0006_push_notifications`) al proyecto Supabase `nvision-saas` asumiendo que era Capital Hub porque era el unico que aparecia en el MCP. Era otro proyecto completamente distinto del usuario. La migracion fue aditiva y no causo dano, pero podia haber sido catastrofico. La cuenta Supabase del MCP puede estar conectada a una organizacion distinta a la de Capital Hub. El usuario puede tener multiples cuentas/orgs.

**How to apply:**
- Aplica a: Supabase, Vercel, GitHub, Stripe, Polar, DNS, Resend, cualquier servicio externo
- Acciones que lo disparan: migraciones SQL, DROP/ALTER/CREATE, env vars, deploys, force-push, crear webhooks, comprar dominios
- Senales de alerta: el MCP/CLI devuelve un solo proyecto con nombre que no contiene "capital", "hub", "ch", "ecoai"; el dominio publico es `ecoai.capitalhubapp.com` pero el proyecto remoto se llama distinto; multiples proyectos y ninguno coincide exactamente
- Formato de pregunta al usuario: "Veo el proyecto X en [servicio]. No corresponde a Capital Hub. Cual es el proyecto correcto? Puedes darme la URL/ID/nombre exacto?"
- Verificacion alternativa: cotejar con `NEXT_PUBLIC_SUPABASE_URL` de Vercel env vars o de `.env.local` del repo

**Mejor perder 30 segundos preguntando que tocar el proyecto de otra app.**
