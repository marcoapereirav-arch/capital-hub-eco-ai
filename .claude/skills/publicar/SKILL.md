---
name: publicar
scope: template
description: "Publicar el trabajo en la web del dueño y COMPROBAR que llego. Guarda lo que falte, une la rama a main, sube a GitHub, espera al despliegue y verifica que la web esta sirviendo el codigo nuevo. Activar cuando el dueño dice: publicalo, subelo, ponlo live, sacalo a produccion, mandalo a la web, ya esta listo subelo, /publicar. NUNCA se activa sola: publicar necesita una orden explicita del dueño (REGLA #2 de AGENTS.md)."
allowed-tools: Bash, Read, Grep, Glob
---

# Skill: Publicar

> Sacar a la web lo que esta en local, y **comprobar que llego de verdad**.

---

## Antes de nada: ¿hay orden?

**Esta skill SOLO se ejecuta si el dueño lo ha pedido con palabras.** "publicalo", "subelo", "ponlo live" o equivalente.

Si llegaste aqui por iniciativa propia, **para**. No publiques. Es la REGLA #2 de `AGENTS.md`.

---

## Por que existe

Publicar son varios pasos y **el ultimo es el que todo el mundo se salta**: comprobar que llego.

Sin ese paso, el dueño cierra el chat convencido de que su cambio esta en la web, y semanas despues descubre que nunca llego. Esta skill existe para que ese paso ocurra **siempre**.

---

## Los pasos

### 1 · Mirar donde estamos

```bash
git status --short
git branch --show-current
git log --oneline -1
```

**Reporta al dueño, en una linea:** en que rama esta, cuantos archivos hay sin guardar.

### 2 · Guardar lo que falte

Si hay cambios sin guardar, guardalos con un mensaje que **explique el cambio**, no que lo repita:

```bash
git add <los archivos del trabajo>
git commit -m "<titulo corto: que cambia>

<cuerpo: por que, si no se ve solo mirando el codigo>"
```

**Nunca `git add .` a ciegas.** Mira la lista primero. Si hay algo que no es de este trabajo, **no lo incluyas y avisa** de que se queda fuera.

**Nunca incluyas** `.env`, `.env.local`, `.mcp.json`, `*.pem`, `*.key` ni nada con claves.

### 3 · Unir la rama a main

Si esta en una rama de trabajo:

```bash
git checkout main
git pull --ff-only          # traer lo que haya subido alguien mas
git merge <rama>
```

**Si sale un conflicto:** para, resuelvelo, y avisa al dueño de que lo hubo y como se resolvio.

Si ya estaba en `main`, salta este paso.

### 4 · Subir

```bash
git push
```

**Aqui va a saltar el aviso de confirmacion** (el freno de `.claude/settings.json`). Es lo esperado: el dueño confirma y sigue.

### 5 · Esperar al despliegue

La web tarda **2 a 4 minutos** en montarse. Esperar de verdad, sin dar nada por hecho.

Si el proyecto usa Vercel:
```bash
npx vercel ls | head -5      # el ultimo debe quedar en Ready
```

### 6 · COMPROBAR que llego · el paso que no se salta

```bash
curl -sI https://<dominio-del-proyecto>/ | head -1
```

**Tiene que devolver `200`.**

Y ademas, **comprobar que trae lo nuevo**, no solo que responde: pedir una ruta o un texto que solo exista despues de este cambio.

Si el proyecto tiene Playwright, abrir la pagina y mirarla.

### 7 · Decirlo claro

**Si llego:**
```
Publicado. Tu web ya esta sirviendo el cambio.
Enlace: https://<dominio>/<la pantalla que cambio>
```

**Si fallo:**
```
No llego. Tu web sigue funcionando como antes, no se rompio nada.
Fallo en: <el paso>
Motivo: <el error, en una linea>
```

**Nunca decir "listo" sin haber pasado el paso 6.**

---

## Reglas duras

1. **Sin orden del dueño, no se publica.** Ni "de paso", ni "ya que estaba".
2. **Nunca `--force`.** Reescribe la historia y puede borrar trabajo de otra persona.
3. **Nunca incluir secretos** en un commit.
4. **Un fallo al compilar NO rompe la web.** La web se queda como estaba. Decirselo al dueño para que no se asuste.
5. **"Publicado" solo se dice despues de comprobarlo.** Un push que salio bien no es una web que sirve el cambio.

---

## Errores ya cometidos (auto-blindaje)

| Error | Que hacer |
|---|---|
| Decir "publicado" justo despues del push, sin esperar | Esperar el despliegue y comprobar con `curl`. Siempre. |
| `git add .` metiendo archivos de otro trabajo | Mirar `git status` y añadir solo lo de este trabajo |
| Publicar sin que lo pidieran | Solo con orden explicita |
| Subir con `--force` y borrar trabajo ajeno | Nunca `--force` |
| Dar por hecho que el dominio responde | Comprobarlo, y comprobar que trae lo NUEVO |
