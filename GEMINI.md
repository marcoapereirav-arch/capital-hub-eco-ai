# Capital Hub OS — instrucciones del agente

**Este archivo no contiene reglas propias. Lee [`CLAUDE.md`](./CLAUDE.md).**

`CLAUDE.md` es la única fuente de instrucciones del agente para este repo, sea cual sea la herramienta (Claude Code, Gemini CLI, Codex, la que sea).

## Por qué

Hasta 2026-07-22 este archivo era una copia de `CLAUDE.md` congelada el 10 de abril. Compartía el 77% del texto pero **le faltaba la REGLA #0 — KNOWLEDGE FIRST**, la regla más importante del proyecto. Un agente que leyera este archivo en vez del otro se saltaba el Knowledge entero.

Dos ficheros de reglas que divergen es peor que uno solo. Se elimina la duplicación.

## Lo mínimo que tienes que saber ahora mismo

1. Antes de hacer nada, lee `docs/sops/`. Es el Knowledge del proyecto y es ley.
2. `docs/sops/00-readme.md` es el índice.
3. Si una regla no está en el Knowledge, no es regla.
4. Si surge una decisión nueva, primero va al Knowledge (commit + push), después se aplica.

Todo lo demás — filosofía, ruteo de skills, stack, arquitectura — está en [`CLAUDE.md`](./CLAUDE.md).
