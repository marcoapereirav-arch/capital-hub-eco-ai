---
name: migrate-ecoai
scope: template
description: "Migra un Ecosistema de IA EXISTENTE (creado con una version vieja de new-ecoai) al contrato nuevo del Knowledge (tablas knowledges/knowledge_folders/knowledge_settings + Visual Knowledge). ADITIVA e IDEMPOTENTE: nunca borra columnas viejas hasta que el dueno confirme, y NUNCA toca el sistema de roles existente. Usar cuando un alumno con un ecoai viejo quiere actualizarlo al modelo OS+APP / Visual Knowledge sin empezar de cero. Triggers: migrar ecoai, actualizar mi knowledge viejo, pasar al visual knowledge, migrate-ecoai, mi cerebro 3d sale vacio, tengo el knowledge viejo."
license: MIT
---

# migrate-ecoai — actualizar un Ecosistema viejo al contrato nuevo del Knowledge

## Cuándo usar
Un proyecto que YA corrió una versión vieja de `/new-ecoai` y tiene el Knowledge en el esquema viejo (`knowledges` con `cuadrante`/`content`/`format`/`owner_id`, o la tabla `assistant_sops`), y quiere el modelo nuevo (**Visual Knowledge** + contrato `knowledges` con `slug`/`content_md`/`quadrant`/`folder_id`) **sin re-crear el proyecto**.

## ⚠️ Reglas DURAS (no negociables)
1. **ADITIVA.** Añade columnas/tablas nuevas y COPIA datos. **NUNCA** `DROP COLUMN` / `DROP TABLE` hasta que el dueño confirme por escrito que todo se ve bien.
2. **IDEMPOTENTE.** Se puede correr 2+ veces sin romper nada (`IF NOT EXISTS` / `IF EXISTS` / `ON CONFLICT` / updates condicionados a `IS NULL`).
3. **NUNCA toca el sistema de ROLES.** La mayoría de proyectos tienen sus roles **ultra-definidos** (p. ej. NVISION). migrate-ecoai **NO crea, NO altera, NO borra** la tabla `roles` ni sus filas ni `profiles.role_id`. Solo **VERIFICA** que exista un rol admin para la RLS del Knowledge; si no, **PARA y pregunta** al dueño.
4. **BACKUP primero.** Antes de tocar nada, exporta los `knowledges` actuales (guarda el SELECT en un archivo / muéstraselo al dueño).
5. **Nada visual lo hace este skill.** La cara 3D la monta `/visual-knowledge` (paso 5).

---

## Flujo

### Paso 0 — Detectar el estado actual (READ-ONLY, no toca nada)
```sql
-- Columnas actuales de knowledges
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='knowledges' ORDER BY ordinal_position;
-- ¿Existe el modelo aún más viejo (assistant_sops)?
SELECT to_regclass('public.assistant_sops') AS assistant_sops;
-- ¿Sistema de roles?
SELECT to_regclass('public.roles') AS roles_table;
SELECT count(*) FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles' AND column_name='role_id';
-- ¿Hay un rol admin? (solo lectura)
SELECT EXISTS (SELECT 1 FROM roles WHERE name='admin') AS hay_admin;  -- si roles existe
```
**Reporta al dueño lo encontrado.** Si la tabla del Knowledge se llama `assistant_sops` (no `knowledges`), díselo: la migración aplica igual, mapeando esa tabla.

### Paso 1 — Backup del Knowledge (no destructivo)
```sql
SELECT * FROM knowledges ORDER BY created_at;
```
Guarda el resultado. Es la red de seguridad antes de cualquier `UPDATE`.

### Paso 2 — Añadir las columnas nuevas (ADITIVO, idempotente)
```sql
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS content_md text;
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS quadrant text;
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS subfolder text;
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.knowledges ADD COLUMN IF NOT EXISTS archived_at timestamptz;
```

### Paso 3 — Copiar datos viejos → columnas nuevas (solo donde estén vacías)
```sql
-- cuadrante (enum viejo) -> quadrant (text). Solo si quadrant está NULL.
UPDATE public.knowledges SET quadrant = cuadrante::text
  WHERE quadrant IS NULL AND cuadrante IS NOT NULL;
-- content -> content_md
UPDATE public.knowledges SET content_md = content
  WHERE content_md IS NULL AND content IS NOT NULL;
UPDATE public.knowledges SET content_md = COALESCE(content_md, '') WHERE content_md IS NULL;
```
**Slug:** la IA genera un `slug` en kebab-case a partir del `title` para cada fila con `slug IS NULL`, garantizando unicidad (si dos chocan, añade `-2`, `-3`...). Hazlo fila por fila o con una función de slugify; verifica al final que no hay `slug` NULL ni duplicados.

### Paso 4 — Aplicar las restricciones del contrato (con los datos ya copiados)
```sql
ALTER TABLE public.knowledges ALTER COLUMN content_md SET DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS knowledges_slug_key ON public.knowledges(slug);
CREATE INDEX IF NOT EXISTS idx_knowledges_quadrant ON public.knowledges(quadrant);
```

### Paso 5 — Folders + settings + folder_id + la cara 3D (vía Visual Knowledge)
Ejecuta **`/visual-knowledge`**. Sus migraciones (`knowledge_folders` + `knowledge_settings` + `folder_id` en `knowledges`) son **idempotentes** (`IF NOT EXISTS`). Eso completa el contrato y monta el cerebro 3D sobre los datos ya migrados.

### Paso 6 — Roles + RLS del Knowledge: VERIFICAR, NUNCA TOCAR los roles
- Si el Paso 0 encontró `roles` + `profiles.role_id` + un rol `admin` → **no toques nada de roles**. Solo asegura la RLS del Knowledge (idempotente):
  ```sql
  ALTER TABLE public.knowledges ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "admin_all_knowledges" ON public.knowledges;
  CREATE POLICY "admin_all_knowledges" ON public.knowledges FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
                 WHERE p.id = auth.uid() AND r.name = 'admin'));
  ```
  > Si el rol admin del proyecto se llama distinto (no `'admin'`), **pregunta al dueño el nombre** y ajusta SOLO esta policy — no sus roles.
- Si falta `roles` / `profiles.role_id` / el rol admin → **PARA y avisa**: *"Tu proyecto necesita un rol admin para proteger el Knowledge, pero no voy a tocar tu sistema de roles. Dime cómo gestionas el admin y ajusto solo la RLS del Knowledge."*

### Paso 7 — Verificar
```sql
-- Todas las filas migradas:
SELECT count(*) AS total,
       count(*) FILTER (WHERE quadrant IS NOT NULL AND content_md IS NOT NULL AND slug IS NOT NULL) AS migradas
FROM public.knowledges;
```
`migradas` debe == `total`. Luego abre `/visual-knowledge` y confirma que el cerebro 3D sale **con los datos dentro**.

### Paso 8 — Limpieza (OPCIONAL, solo con OK EXPLÍCITO del dueño)
Cuando el dueño confirme que todo se ve bien, **y solo entonces**, se pueden quitar las columnas viejas:
```sql
-- SOLO tras confirmación explícita del dueño:
-- ALTER TABLE public.knowledges DROP COLUMN IF EXISTS cuadrante;
-- ALTER TABLE public.knowledges DROP COLUMN IF EXISTS content;
-- ALTER TABLE public.knowledges DROP COLUMN IF EXISTS format;
-- ALTER TABLE public.knowledges DROP COLUMN IF EXISTS owner_id;
```
Si el dueño no lo pide, **se quedan**. No estorban.

---

## Anti-patrones (PROHIBIDO)
- ❌ Borrar columnas/tablas antes de verificar y sin OK explícito.
- ❌ Crear, alterar o borrar la tabla `roles` o sus filas, o `profiles.role_id`.
- ❌ Asumir el nombre del rol admin sin verificarlo.
- ❌ Correr sin backup (Paso 1).
- ❌ Construir la pantalla del Knowledge aquí (eso es `/visual-knowledge`).

## Qué deja listo
Tu Knowledge viejo, migrado al contrato nuevo (`knowledges` + `knowledge_folders` + `knowledge_settings`), con tus datos intactos, listo para el **Visual Knowledge** (cerebro 3D). Tus roles, sin un solo cambio.
