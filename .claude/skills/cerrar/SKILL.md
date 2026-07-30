---
name: cerrar
scope: template
description: "Dejar el trabajo cerrado antes de cerrar el chat. Comprueba que no queda nada sin guardar ni sin publicar, cierra la carpeta y la rama de ESTE chat sin tocar las de los otros chats abiertos, comprueba que dev esta al dia, guarda lo aprendido en el Knowledge, actualiza STATE.md, y termina diciendo si el chat se puede cerrar o no. Activar cuando el dueño dice: cierra, cerramos, ya termine, cierra el chat, damos por terminado, /cerrar, o cuando el dueño se despide al final de una sesion de trabajo."
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# Skill: Cerrar

> Dejar el trabajo cerrado y decirle al dueño si ya puede cerrar el chat.

**Esta skill NO cierra la ventana.** Ninguna skill puede. Lo que hace es dejar el trabajo **literalmente cerrado** y terminar con una frase clara: se puede cerrar, o falta esto.

---

## Por que existe

Cerrar un chat sin cerrar el trabajo tiene tres consecuencias, y las tres pasan de verdad:

1. **Las ramas se acumulan.** Al mes hay quince y nadie sabe que hay en cada una.
2. **Lo aprendido se pierde.** Lo que se descubrio en el chat muere con el chat.
3. **Se cree publicado lo que no lo esta.** Y se descubre semanas despues.

---

## Los pasos

### 1 · ¿Queda algo sin guardar?

```bash
git status --short
```

**Si hay algo:** enseñarselo al dueño y preguntarle si entra o se queda fuera. **No decidirlo solo.**

### 2 · ¿Queda algo sin publicar?

```bash
git log origin/main..HEAD --oneline
```

**Si hay commits sin subir:** decirselo tal cual.

```
Tienes N cambios guardados pero sin publicar:
  - <titulo>
  - <titulo>
¿Los publico? (Si dices que si, ejecuto /publicar)
```

**No publicar por iniciativa propia.** Es la REGLA #2.

### 3 · El sitio de trabajo de ESTE chat

> **UN CHAT = UNA RAMA = UNA CARPETA** (regla de fabrica `EL WORKFLOW` en `AGENTS.md`).
> Cerrar un chat cierra **su** carpeta y **su** rama. Las de los otros chats **no se tocan**.

**3a · Cerrarlo. Es UN comando:**

```bash
npm run chat:cerrar
```

Comprueba, en este orden, y **se niega sin borrar nada** si algo falla:
1. Que no queda **nada sin guardar** en esa carpeta.
2. Que no queda **nada sin publicar** (nada en la rama que no este ya en `dev`).

Solo si las dos pasan, borra la carpeta y la rama.

**Si se niega:** enseñarle al dueño lo que falta y preguntarle. **No forzar nunca.**

**3b · ¿Que otros chats hay abiertos?**

```bash
git worktree list
```

Se listan para que el dueño sepa que tiene en marcha, y **no se tocan**:

```
Tienes N chats abiertos:
  - <nombre>  ·  <su rama>  ·  <ultimo commit>  ·  <hace cuanto>
Los dejo como estan.
```

**3c · ¿Quedan carpetas de chats mal cerrados?**

```bash
npm run chat:cerrar -- --limpiar
```

Recoge **solo** las carpetas cuyo trabajo ya esta en `dev`. Ofrecerlo, no hacerlo a la
brava.

**3d · ¿`dev` esta al dia?**

```bash
git log --oneline dev..main
```

**Si devuelve algo, es un bug del flujo:** alguien publico saltandose `dev`. Avisar y
ponerla al dia (`git checkout dev && git merge main --ff-only`). Si `dev` se queda atras,
**la siguiente rama nace de una foto vieja** — es lo que paso entre el 2026-07-25 y el
2026-07-30.

### 4 · Guardar lo aprendido

Repasar el chat y sacar **lo que sirve para la proxima vez**:

- Una decision que se tomo y por que
- Un fallo que costo encontrar, y como se arreglo
- Una regla nueva que dijo el dueño
- Una forma de hacer algo que quedo establecida

**Donde va cada cosa:**

| Que es | Donde |
|---|---|
| Una regla, un proceso, una decision del negocio | **Knowledge** (la base de datos del proyecto) |
| Como esta construido algo tecnico | `BUSINESS_LOGIC.md` |
| Una orden corta que la IA debe obedecer siempre | `AGENTS.md` |

**Si no hay nada que guardar, decirlo.** Inventar aprendizajes ensucia el Knowledge.

### 5 · Actualizar el estado

Si el proyecto tiene `STATE.md`, dejarlo diciendo la verdad de hoy: que quedo hecho, que quedo a medias, que viene despues.

**Un `STATE.md` que miente es peor que no tenerlo.**

### 6 · El veredicto

Terminar SIEMPRE con una de estas dos frases, sin rodeos:

**Todo cerrado:**
```
Cerrado. Ya puedes cerrar el chat.

  Publicado:  <que se publico, o "nada, no hacia falta">
  Ramas:      <limpias, o las que quedan y por que>
  Aprendido:  <que se guardo, o "nada nuevo">
```

**Queda algo:**
```
NO cierres todavia. Queda esto:

  - <lo que falta>
  - <lo que falta>

Dime que hago con cada cosa.
```

---

## Reglas duras

1. **Nunca decir "cerrado" si queda algo sin publicar.** Es justo el fallo que esta skill existe para evitar.
2. **Nunca borrar una carpeta ni una rama con trabajo sin unir.** El comando ya se niega; no forzarlo.
3. **Nunca publicar por iniciativa propia** dentro del cierre. Se ofrece; decide el dueño.
4. **Nunca inventar aprendizajes** para que el paso 4 parezca productivo.
5. **Se cierra siempre**, aunque el trabajo haya durado diez minutos.

---

## Errores ya cometidos (auto-blindaje)

| Error | Que hacer |
|---|---|
| Cerrar dejando cambios sin publicar | Paso 2, sin excepcion |
| Ramas acumuladas durante semanas | Paso 3, en cada cierre |
| Lo aprendido en el chat, perdido | Paso 4, al Knowledge |
| `STATE.md` diciendo algo de hace un mes | Paso 5 |
| Decir "listo" sin comprobar nada | El veredicto del paso 6 sale de las comprobaciones, no de la sensacion |
