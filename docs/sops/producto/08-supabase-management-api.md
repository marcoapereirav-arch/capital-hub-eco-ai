---
title: Supabase - Management API + DDL desde agente
order: 8
---

# Supabase — Management API + DDL desde el agente

> Cuando el MCP de Supabase no esté disponible, el agente puede ejecutar SQL arbitrario (incluyendo DDL) contra el proyecto via la **Management API oficial**.

## Credenciales

| Cosa | Dónde vive | Valor (parcial) |
|---|---|---|
| Project Ref | `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` (slug) | `aglyoyqtzozdnusltjxe` |
| Service Role Key | `.env.local` → `SUPABASE_SERVICE_ROLE_KEY` | JWT (REST API admin, NO sirve para DDL via Management) |
| Personal Access Token (PAT) | `.mcp.json` → `mcpServers.supabase.args` (flag `--access-token`) | `sbp_...` (válido para Management API) |
| DB Password | NO está en repo. Solo en dashboard Supabase de Adrián si se necesita psql directo. | - |

El **PAT** del proyecto está embebido en `.mcp.json` para que los MCP servers se puedan autenticar. Es el mismo token que se usa al hacer `supabase login --token sbp_...`.

## Endpoint Management API

```
POST https://api.supabase.com/v1/projects/{ref}/database/query
Authorization: Bearer <PAT>
Content-Type: application/json

{ "query": "<SQL aquí>" }
```

- Acepta SQL crudo incluyendo `ALTER TABLE`, `CREATE TABLE`, `BEGIN/COMMIT`, etc.
- Response: array JSON con los rows si el SQL devuelve algo, `[]` si no.
- HTTP 201 en éxito, 4xx con `{ "message": "..." }` en error.

## Uso desde Bash en el agente

```bash
PAT=$(grep -oE '"sbp_[A-Za-z0-9_-]+"' .mcp.json | head -1 | tr -d '"')
REF=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | sed -E 's|.*//([^.]+)\..*|\1|')

# Inline (cuidado con escape de comillas)
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{"query":"select current_database()"}'

# Mejor: SQL en archivo para evitar escapes
cat > /tmp/q.json <<EOF
{"query":"ALTER TABLE public.foo ADD COLUMN IF NOT EXISTS bar text"}
EOF
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/q.json
```

## Patrones útiles

**Listar tablas:**
```sql
select tablename from pg_tables where schemaname = 'public' order by tablename
```

**Listar columnas de una tabla:**
```sql
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'foo' order by ordinal_position
```

**Aplicar migración multi-statement (envolver en BEGIN/COMMIT):**
```sql
BEGIN;
ALTER TABLE ...;
INSERT INTO ...;
UPDATE ...;
COMMIT;
```

**Errores de quote escape:** usar `$$texto$$` para strings literales evita problemas con bash `$1`/`$2`. O mejor: archivo `.json` con `--data-binary @file`.

## Cuándo usar esto vs. MCP Supabase

- MCP Supabase disponible → preferir MCP (tiene helpers `list_tables`, `apply_migration`, etc.)
- MCP Supabase desconectado → usar Management API directo (este SOP)
- DDL/migraciones críticas → siempre hacer commit de la migration SQL en `supabase/migrations/` aunque la apliques via API, para tener histórico

## Aprendizaje (2026-06-03)

El agente intentó pedir al usuario que aplicara una migración manualmente porque "no tenía credenciales para DDL". **Estaba equivocado**: el PAT está en `.mcp.json` y la Management API acepta DDL. El usuario corrigió y se documentó este SOP.

Regla derivada para el agente: **antes de pedir al usuario una acción manual sobre BD/deploy, agotar todas las credenciales disponibles** (`.env.local`, `.mcp.json`, `vercel env`, archivos de config de CLIs).
