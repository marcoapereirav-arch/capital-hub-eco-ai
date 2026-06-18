---
title: Repos separados OS y App — JAMÁS mezclar commits
order: 7
area: sistemas
---

# Repos separados OS y App — regla absoluta

> Decisión Marco 2026-06-18. Apuntada para no repetirme.

## Los dos repos

| Componente | Directorio local | Repo GitHub | Vercel project | Dominio |
|---|---|---|---|---|
| **OS** (interno equipo) | `/Users/marcoantonio/Desktop/Marco-Codes/Capital Hub/` | `capital-hub-eco-ai` | `capital-hub-eco-ai` | `ecoai.capitalhubapp.com` |
| **App** (alumnos) | `/Users/marcoantonio/Desktop/Marco-Codes/App Capital Hub/` | `capital-hub-app` | `capital-hub-app` | `app.capitalhubapp.com` |

## Regla absoluta

**JAMÁS mezclar commits o pushes entre repos.**

- Cambio en código del OS → `cd Capital\ Hub` → commit + push al repo del OS
- Cambio en código de la App → `cd App\ Capital\ Hub` → commit + push al repo de la App
- Cambio que toca ambos lados → DOS commits separados, uno en cada repo, con mensaje claro de coordinación

## Comparten

- **Misma Supabase** (`aglyoyqtzozdnusltjxe`) — auth.users + las tablas compartidas (`profiles`, `users`, `contacts`, `student_invites`, etc.)
- **Misma cuenta de email** Resend, mismas variables de entorno comunes
- **Misma cuenta admin** de Adrián para Vercel / GitHub

## NO comparten

- Stack: OS es Next.js 16, App es React + Vite
- Componentes UI: cada repo tiene su carpeta `src/components`
- Estilos: cada repo tiene su Tailwind config y sus tokens
- **Brandkit actual**: el OS usa el brandkit Capital Hub (paleta `#0F0F12 / #2A2D34 / #F5F6F7 / #FFFFFF`). La App **todavía tiene un diseño antiguo** que no sigue el brandkit. **Cuando trabajemos en la App, los componentes nuevos siguen el brandkit Capital Hub** aunque rompan visualmente con lo antiguo. El refactor completo del diseño de la App es trabajo aparte.

## Antípatrones que NO hago

- ❌ Poner cambios de la App en un commit del repo del OS porque "están relacionados"
- ❌ Pushear desde el directorio equivocado
- ❌ Modificar archivos físicamente situados en `App Capital Hub/` desde el repo del OS
- ❌ Suponer que el repo de la App tiene la misma estructura que el OS

## Antes de cada commit

Checklist mental:
1. ¿Dónde están los archivos que modifiqué? → `pwd` o ver path absoluto
2. ¿Estoy en el directorio del repo correcto? → `git rev-parse --show-toplevel`
3. ¿El cambio es 100% de UN solo repo? Si toca los dos → split en 2 commits, uno en cada repo

## Histórico

- **2026-06-18:** Marco dicta la regla tras incidente donde casi tropiezo. Anclada al Knowledge antes de tocar Bloque #2.
