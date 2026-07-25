# Version del sistema NVISION

VERSION: 3

> Este numero sube cada vez que NVISION publica una actualizacion del sistema
> (reglas de fabrica o skills). El skill `/actualizar-sistema` compara este numero
> con la version del proyecto del alumno para saber que traer.
>
> QUE cuenta como "sistema": el bloque `REGLAS-DE-FABRICA` del `AGENTS.md` + los skills oficiales.
> QUE NO se toca NUNCA: el codigo del alumno (`src/`), sus datos, su base de datos,
> sus reglas propias (fuera de la valla), sus skills propios, su `.env`, su `.mcp.json`.

---

## Changelog

### v3 — 2026-07-25
- **Nuevo skill `/add-dashboard`:** anade el Home del OS (el HUD: orbe, ingresos, embudo, mapa mundi, radar, feed) al proyecto. OPCIONAL — cada dueno lo mete si quiere. Viene con datos de ejemplo y luego el dueno lo configura con sus metricas y elige secciones. NO destructivo: detecta si ya hay dashboard, hace copia de seguridad y pregunta antes de sobrescribir. Toca `src/` (solo los archivos del dashboard).

### v2 — 2026-07-25
- **Nuevo skill `/conectar-knowledge`:** conecta un ecosistema viejo (sin Knowledge, o con Knowledge en esquema viejo) al **Knowledge 3D** (cerebro neuronal + carpetas + parte OS). ADITIVO e IDEMPOTENTE, nunca toca roles, y trae una PUERTA DE DETECCION: a quien ya lo tiene no le hace nada. Reconstruye la funcion del antiguo `migrate-ecoai`, ahora clara y con detección.

### v1 — 2026-07-25
- **Nuevo:** sistema de versiones del sistema (este archivo) + skill `/actualizar-sistema`.
- **Nuevo:** bloque `REGLAS-DE-FABRICA` (la "valla") en `AGENTS.md` — el unico sitio que el update reescribe.
- **Regla de fabrica anadida:** "No dejar basura en la raiz" (temporales a `.test-artifacts/`).
- **Regla de fabrica anadida:** "Cerrar una RLS obliga a barrer las lecturas ajenas" (fallo mudo de Supabase: la RLS filtra y devuelve 0 sin error).
- **Ya presente de antes (base):** explicar antes de hacer y esperar OK · codigo en local, publica el dueno · toda rama nace de `dev` · prohibido leer ficheros de secretos.
