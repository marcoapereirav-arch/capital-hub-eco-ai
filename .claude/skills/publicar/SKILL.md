---
name: publicar
scope: template
description: "Publicar el trabajo en la web del dueño y COMPROBAR que llego. Guarda lo que falte, lleva la rama de ESTE chat por el recorrido rama -> dev -> main, sube las dos ramas, espera al despliegue y verifica que la web esta sirviendo el codigo nuevo. Activar cuando el dueño dice: publicalo, subelo, ponlo live, sacalo a produccion, mandalo a la web, ya esta listo subelo, /publicar. NUNCA se activa sola: publicar necesita una orden explicita del dueño (REGLA #2 de AGENTS.md)."
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
git worktree list                     # los chats abiertos, cada uno con su carpeta
git log --oneline dev..main           # dev esta al dia?
```

**Reporta al dueño, en una linea:** en que carpeta y rama esta, cuantos archivos hay sin guardar, **y que otros chats hay abiertos** (cada uno en su carpeta: no se tocan).

Si `dev` esta atras de `main`, **ponla al dia antes de nada** (`git checkout dev && git merge main --ff-only`). Publicar sobre una `dev` atrasada arrastra la foto vieja.

### 2 · Guardar lo que falte

Si hay cambios sin guardar, guardalos con un mensaje que **explique el cambio**, no que lo repita:

```bash
git add <los archivos del trabajo>
git commit -m "<titulo corto: que cambia>

<cuerpo: por que, si no se ve solo mirando el codigo>"
```

**Nunca `git add .` a ciegas.** Mira la lista primero. Si hay algo que no es de este trabajo, **no lo incluyas y avisa** de que se queda fuera.

**Nunca incluyas** `.env`, `.env.local`, `.mcp.json`, `*.pem`, `*.key` ni nada con claves.

### 3 · El recorrido · rama → `dev` → `main`

> **EL WORKFLOW (regla de fabrica `EL WORKFLOW` en `AGENTS.md`):**
> `dev` → rama → `dev` → `main` → la web.
> **PROHIBIDO** llevar la rama directo a `main`. Siempre pasa por `dev`.

**3a · La rama vuelve a `dev`:**

```bash
git checkout dev
git pull --ff-only          # traer lo que haya subido alguien mas
git merge <rama>            # la rama de ESTE chat, ninguna otra
```

**Si sale un conflicto aqui:** para, resuelvelo **en `dev`**, y avisa al dueño de que lo hubo y como se resolvio. Ese es justo el motivo de que `dev` exista: el choque ocurre aqui y **la web no se entera**.

**3b · Comprobar en `dev` antes de tocar la web:**

```bash
npm run typecheck
npm run build               # dispara los vigilantes (prebuild)
```

Si falla, **se para aqui**. `main` no recibe nada roto.

**3c · `dev` pasa a `main`:**

```bash
git checkout main
git pull --ff-only
git merge dev --ff-only     # main solo avanza, nunca diverge
```

Si el dueño trabajaba sobre `dev` sin rama (cambio trivial), se salta el 3a.

### 4 · Subir

```bash
git push origin main
git push origin dev         # dev queda al dia · si no, la siguiente rama nace vieja
```

**Aqui va a saltar el aviso de confirmacion** (el freno de `.claude/settings.json`). Es lo esperado: el dueño confirma y sigue.

**Las dos ramas se suben.** Si solo se sube `main`, `dev` se queda atras y la siguiente rama nace de una foto vieja. Fue exactamente lo que paso entre el 2026-07-25 y el 2026-07-30: `dev` un mes sin recibir nada.

### 4-bis · Cerrar el sitio de trabajo de este chat

Ya esta todo dentro de `dev` y de `main`. **UN comando** borra su rama Y su carpeta:

```bash
npm run chat:cerrar
```

Comprueba antes que no queda nada sin guardar ni sin publicar. **Si falta algo, se niega
y no borra nada.**

**Solo el de este chat.** Los otros chats abiertos, con sus carpetas y sus ramas, **no se tocan**.

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
2. **Siempre por `dev`.** Nunca de la rama directo a `main`.
3. **Se suben las DOS ramas** (`main` y `dev`). Si `dev` se queda atras, la siguiente rama nace vieja.
4. **Solo la rama de ESTE chat.** Los otros chats abiertos tienen las suyas y no se tocan.
5. **Nunca `--force`.** Reescribe la historia y puede borrar trabajo de otro chat.
6. **Nunca incluir secretos** en un commit.
7. **Un fallo al compilar NO rompe la web.** La web se queda como estaba. Decirselo al dueño para que no se asuste.
8. **"Publicado" solo se dice despues de comprobarlo.** Un push que salio bien no es una web que sirve el cambio.

---

## Errores ya cometidos (auto-blindaje)

| Error | Que hacer |
|---|---|
| **Unir la rama directo a `main`, saltandose `dev`** | Siempre `rama → dev → main`. Es EL workflow |
| **Subir solo `main` y dejar `dev` atras** | `git push origin main` **y** `git push origin dev`. Paso 4 |
| **Tocar la rama de otro chat** | Solo la de este chat. Ver que ramas hay abiertas antes de mover nada |
| Decir "publicado" justo despues del push, sin esperar | Esperar el despliegue y comprobar con `curl`. Siempre |
| `git add .` metiendo archivos de otro trabajo | Mirar `git status` y añadir solo lo de este trabajo |
| Publicar sin que lo pidieran | Solo con orden explicita |
| Subir con `--force` y borrar trabajo ajeno | Nunca `--force` |
| Dar por hecho que el dominio responde | Comprobarlo, y comprobar que trae lo NUEVO |

**Caso real (2026-07-25 → 2026-07-30):** la regla "toda rama nace de `dev`" se escribio en `AGENTS.md` pero **este skill no nombraba `dev` ni una vez**. Durante un mes cada publicacion fue rama → `main`, y `dev` no recibio nada. Una regla sin la maquina que la ejecuta no se cumple sola.
