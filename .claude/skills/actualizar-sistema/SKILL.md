---
name: actualizar-sistema
scope: template
description: "Pone al dia el SISTEMA del ecosistema (las REGLAS DE FABRICA + los skills oficiales) a la ultima version de NVISION, SIN tocar NADA del alumno. Activar cuando el dueno dice: actualiza el sistema, hay version nueva, ponme al dia las reglas, actualizar-sistema, trae lo nuevo de NVISION, poner el ecosistema al dia."
allowed-tools: Read, Bash, Glob, Edit
---

# Actualizar el sistema — trae lo nuevo de NVISION sin romper nada tuyo

Este skill actualiza **el sistema** del ecosistema a la ultima version publicada por NVISION:

- El bloque **REGLAS DE FABRICA** del `AGENTS.md` (la "valla" entre las marcas `REGLAS-DE-FABRICA:INICIO` / `FIN`).
- Los **skills oficiales** (`.claude/skills/`), respetando los skills propios del dueno.

## Garantia dura — que NO se toca NUNCA

Este skill **jamas** modifica:

- `src/` (el codigo del producto), ni la base de datos, ni sus datos.
- Las reglas propias del dueno (todo lo que este **fuera** de las marcas `REGLAS-DE-FABRICA`).
- Los skills que el dueno haya anadido por su cuenta.
- `BUSINESS_LOGIC.md`, `.env`, `.env.local`, `.mcp.json`, `supabase/`.

Solo escribe **dentro de la valla** del `AGENTS.md` y sobre los **skills oficiales**. Nada mas.
Antes de tocar el `AGENTS.md` hace una **copia de seguridad**.

## Diferencia con `update-ecoai`

`update-ecoai` refresca solo las herramientas (skills, PRPs, design-systems). `actualizar-sistema`
ademas trae las **reglas de fabrica nuevas** a la valla del `AGENTS.md`, con numero de version y changelog.
Si tienes las dos, con `actualizar-sistema` basta.

---

## Proceso

### Paso 1 — Traer la ultima version de la madre (fresca de GitHub)

```bash
T=$(mktemp -d)
git clone -q --depth 1 https://github.com/marcoapereirav-arch/nvision-setup.git "$T"
MADRE="$T/nvision"
```

Si el clon falla (sin internet, repo movido), avisa al dueno y para. No inventes.

### Paso 2 — Comparar versiones

```bash
# Version de la madre
grep -m1 '^VERSION:' "$MADRE/.claude/SISTEMA.md" | awk '{print $2}'
# Version del proyecto del dueno (si no existe el archivo, va por la 0)
grep -m1 '^VERSION:' .claude/SISTEMA.md 2>/dev/null | awk '{print $2}' || echo 0
```

- Si son iguales → **"Ya estas en la ultima version del sistema (vN). Nada que hacer."** y termina.
- Si la del proyecto es menor → sigue.

Ensena al dueno el **changelog** (la seccion `## Changelog` de `$MADRE/.claude/SISTEMA.md`), de la version del proyecto hasta la ultima, para que vea EXACTAMENTE que va a cambiar. Espera su OK (REGLA #1).

### Paso 3 — Copia de seguridad del AGENTS.md

```bash
cp AGENTS.md ".test-artifacts/AGENTS.backup.$(date +%s).md" 2>/dev/null || { mkdir -p .test-artifacts && cp AGENTS.md ".test-artifacts/AGENTS.backup.md"; }
```

### Paso 4 — Actualizar la valla de REGLAS DE FABRICA

1. Lee el bloque de la madre (todo lo que hay entre `<!-- REGLAS-DE-FABRICA:INICIO -->` y
   `<!-- REGLAS-DE-FABRICA:FIN -->`, incluidas las dos marcas) de `$MADRE/AGENTS.md`.
2. En el `AGENTS.md` del dueno:
   - **Si ya tiene las marcas** `REGLAS-DE-FABRICA:INICIO` / `FIN` → reemplaza TODO lo que hay entre
     ellas (marcas incluidas) por el bloque nuevo de la madre. **No toques ni una linea fuera de las marcas.**
   - **Si NO tiene las marcas** (alumno viejo, primera vez) → inserta el bloque nuevo justo despues de
     la cabecera del archivo (tras el primer separador `---`, antes de la primera regla). No borres nada.

Hazlo con la tool `Edit` (leyendo ambos archivos y sustituyendo el bloque exacto) para poder verificarlo a ojo.
Helper opcional si prefieres script — extraer la valla de la madre:

```bash
awk '/REGLAS-DE-FABRICA:INICIO/{f=1} f{print} /REGLAS-DE-FABRICA:FIN/{f=0}' "$MADRE/AGENTS.md" > "$T/valla.md"
```

### Paso 5 — Refrescar los skills oficiales (sin tocar los del dueno)

Igual que `update-ecoai`: por cada skill que venga en la madre, reemplazalo o crealo; los skills que el
dueno tenga y que NO esten en la madre (los suyos) se quedan intactos.

```bash
for skill in "$MADRE"/.claude/skills/*/; do
  name=$(basename "$skill")
  rm -rf ".claude/skills/$name"
  cp -r "$skill" ".claude/skills/$name"
done
```

Los skills que existan en `.claude/skills/` del dueno y no en la madre **no se tocan** (son suyos).

### Paso 6 — Guardar la version nueva en el proyecto

```bash
mkdir -p .claude && cp "$MADRE/.claude/SISTEMA.md" .claude/SISTEMA.md
```

### Paso 7 — Limpiar y reportar

```bash
rm -rf "$T"
```

Informa al dueno, claro y corto:

```
Sistema actualizado: vX → vN.

Reglas de fabrica al dia (bloque REGLAS-DE-FABRICA del AGENTS.md):
- [las reglas del changelog]

Skills oficiales refrescados. Tus skills propios: intactos.

NO se toco nada tuyo: tus reglas (fuera de la valla), tu codigo, tu base de datos, tu .env.
Copia de seguridad del AGENTS.md en .test-artifacts/ por si acaso.
```

---

## Notas

- Este skill **NO publica nada** ni hace `git push`. Solo actualiza los archivos en local del dueno.
- **NO** ejecuta `rm -rf .claude/` (borraria skills propios). Reemplaza skill por skill.
- Si el dueno edito a mano algo DENTRO de la valla, esa edicion se sobrescribe (por eso la valla lleva el
  aviso "no editar aqui dentro"). Todo lo que este FUERA de la valla es suyo y no se toca.
- Idempotente: correrlo dos veces seguidas no cambia nada la segunda vez (misma version).
