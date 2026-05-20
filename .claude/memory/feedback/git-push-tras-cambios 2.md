# Siempre hacer git push despues de cambios

**Regla:** Cada vez que haga cambios al codigo (edits, nuevos archivos, renombrados, deletes), debo hacer `git commit` + `git push` al terminar.

**Why:** El usuario lo pidio explicitamente el 2026-04-29. Los cambios no se consideran "hechos" hasta que esten en el remoto. Sin push, los cambios viven solo en el disco local y el deploy/equipo no los ve.

**How to apply:**
- Al cerrar una tarea de codigo (feature implementada, bug arreglado, refactor terminado, archivos renombrados), antes de reportar al usuario que esta "listo":
  1. `git add` de los archivos relevantes (preferir nombres especificos sobre `git add -A`)
  2. `git commit` con mensaje siguiendo el estilo del repo (revisar `git log` reciente)
  3. `git push` a la rama actual
- Excepciones: si el usuario pide explicitamente NO pushear, o si esta en medio de una serie de cambios y dice "no pushees todavia".
- Si los cambios todavia no estan probados/verificados, igual hacer push (la regla es push despues de cambios, no push solo cuando todo este perfecto).
- En la rama `main` con cambios destructivos o force-push, igual avisar antes (no excepcion a las reglas de seguridad de git).
