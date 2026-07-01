---
title: Git explicado sin tecnicismos
order: 3
formacion: IA Integrator
---

# Manual de Git — para entenderlo de verdad

> Para Marco. Sin tecnicismos innecesarios. La idea es que cuando yo (la IA) te diga
> "hago commit y push a main", sepas EXACTAMENTE qué está pasando con tu trabajo.

---

## 1. ¿Qué es Git y por qué existe?

**Git es la "máquina del tiempo" de tu código.** Guarda fotos de tu proyecto en cada momento importante, para que:

1. Si algo se rompe, puedas **volver atrás** a una versión que funcionaba.
2. Veas **qué cambió, cuándo y por qué** en toda la historia del proyecto.
3. Tengas una **copia de seguridad** en la nube (GitHub) por si tu ordenador muere.
4. Puedas trabajar en **cosas experimentales sin romper** lo que ya funciona.

Analogía: es como el historial de versiones de Google Docs, pero mucho más potente y para carpetas enteras de código.

---

## 2. El viaje de un cambio (lo más importante de entender)

Cuando se cambia algo en el proyecto, ese cambio pasa por **3 lugares**, en orden:

```
   TU ORDENADOR                                      LA NUBE
┌───────────────────────────────────────┐      ┌──────────────┐
│                                        │      │              │
│  1) Archivos        2) Historial       │      │  3) GitHub   │
│     editados   ──►     local (commits) │ ──►  │   (main)     │
│   "trabajando"        "foto guardada"  │      │  "oficial"   │
│                                        │      │              │
└───────────────────────────────────────┘      └──────────────┘
        edito              COMMIT                    PUSH
```

- **1) Editar** → cambio archivos. Todavía no hay "foto", solo cambios sueltos.
- **2) Commit** → saco una **foto** de esos cambios con una nota ("qué cambié"). **Vive solo en tu ordenador.**
- **3) Push** → **subo** esas fotos a GitHub (la nube). **Ahora sí están fuera de tu ordenador y a salvo.**

> ⚠️ **Clave:** un commit SIN push está **solo en tu ordenador**. Si no hago push, nadie más lo ve y no está en GitHub. Por eso cuando termino algo importante, hago **commit + push**.

---

## 3. Los conceptos, uno por uno

### Repositorio (repo)
La **carpeta de tu proyecto + todo su historial**. Capital Hub OS es un repo. La App del alumno es otro repo.

### Commit
**Una foto guardada** del proyecto en un momento, con un mensaje que explica qué cambió.
- Ejemplo real: `fix(roadmap): acentos completos + escala ink + toast nº correcto`
- Cada commit tiene un **código único** (un "hash"), ej. `9adcd3c`. Es como el número de esa foto.
- Analogía: el **punto de guardado** de un videojuego.

### Push
**Subir** tus commits de tu ordenador a GitHub.
- Antes del push: el cambio está solo en tu máquina.
- Después del push: está en la nube, a salvo, y quien clone lo recibe.

### Pull
Lo contrario del push: **bajar** de GitHub a tu ordenador los cambios que haya hecho otra persona (o tú desde otro sitio). Sirve para estar al día.

### GitHub
La **nube** donde viven los repos. Es: copia de seguridad + el sitio desde donde la gente descarga tu código.
- Capital Hub OS vive en `github.com/marcoapereirav-arch/capital-hub-eco-ai`
- La App del alumno en `github.com/marcoapereirav-arch/capital-hub-app`

### Clonar (clone)
**Descargar** una copia completa de un repo desde GitHub a tu ordenador.
- Ejemplo: si empiezas en un ordenador nuevo, **clonas** el repo de Capital Hub desde GitHub y vuelves a tener todo el proyecto en esa máquina.

### Remoto / origin
"**origin**" es el apodo de tu GitHub (el remoto por defecto). Cuando digo "push a origin", quiero decir "subir a GitHub".

### .gitignore
Una lista de archivos que Git **debe ignorar** (nunca subir). Aquí vive una regla de oro:
- **`.env.local` (tus claves secretas) NUNCA se sube a GitHub.** Está en `.gitignore` justo para eso.

---

## 4. Ramas (branches) y merge — el concepto que te lía

Imagina que main es la **carretera principal** (la versión oficial, la que funciona).

Si quiero hacer algo arriesgado o a medias (ej. una regla de seguridad nueva), **no lo hago directamente en la carretera principal** — abro un **desvío (rama)**, trabajo ahí tranquilo, y cuando está perfecto, **uno el desvío de vuelta a la carretera (merge)**.

```
main (oficial)  ●────●────●──────────────●  ← aquí se unió (merge)
                           \             /
rama "seguridad"            ●────●────●     ← trabajo aparte, sin romper main
```

- **Rama (branch):** una línea de trabajo paralela. No afecta a main hasta que la unes.
- **main:** la rama oficial. **Lo que el alumno descarga al clonar.**
- **Merge:** unir una rama dentro de main (llevar ese trabajo a la versión oficial).

### Un ejemplo para verlo claro

Imagina que abrimos una rama llamada `rediseno-funnel-test` para rehacer el funnel del Test de Personalidad, con **2 commits**:
1. El **nuevo diseño** de la landing.
2. El **arreglo** de un botón que no guardaba en el móvil.

Esos 2 commits están **en la rama, en tu ordenador**. **NO están en main, NO están en GitHub, NO están en tu web real.**

👉 Mientras no haga **merge a main + push**, tu web pública (`ecoai.capitalhubapp.com`) sigue mostrando la versión **vieja**. Cuando me digas que está listo, hago el merge, subo a GitHub y pasa a producción para todos.

---

## 5. El flujo de trabajo real (cómo trabajamos tú y tú IA)

Tú **no tocas comandos**. Tú dices QUÉ quieres; yo hago el git por debajo. Pero este es el ciclo que ocurre cada vez:

```
1. Tú me pides un cambio  ("arregla el roadmap")
2. Yo edito los archivos
3. Yo verifico que funciona (typecheck, etc.)
4. Yo hago COMMIT  (guardo la foto con un mensaje claro)
5. Yo hago PUSH a main  (lo subo a GitHub)
6. Vercel detecta el push y despliega solo  → lo ves live en tu web
```

Por eso, cuando te digo *"hecho, pusheado a main, commit 9adcd3c"*, significa: **está guardado, subido a GitHub, y desplegándose en tu web.** Ya no está solo en mi ordenador.

Y cuando te digo *"committeado pero NO en main"* (como el add-login ahora), significa: **lo guardé, pero está esperando tu OK para subirlo a la versión oficial.**

---

## 5-bis. Localhost, main y prod — y cuándo se hace merge

Tres palabras que se confunden mucho:

| Palabra | Qué es | Quién lo ve |
|---|---|---|
| **Localhost** | La versión corriendo **en tu ordenador** para previsualizar (`npm run dev`). | **Solo tú**, mientras la pruebas. |
| **main** | El **código oficial** guardado en GitHub. | Quien clone el repo. |
| **Prod (live)** | Tu **web real**, ya desplegada (Vercel la publica sola tras el push a main). | **Todo el mundo.** |

### ¿Se trabaja siempre en local?
**Sí.** Yo edito y valido en tu ordenador (localhost + typecheck) ANTES de subir nada. Lo que ves en localhost es el ensayo; nadie más lo ve todavía.

### Tu intuición sobre el merge: casi exacta, con un matiz
Lo que dijiste es correcto: **se sube a main / se hace merge cuando ya está listo y validado en local.** Es el momento de decir "esto ya está bien, que pase a la versión oficial".

Dos matices para que sea redondo:

1. **No siempre hay una rama.** En la mayoría de cambios normales, cuando algo está validado en local hago **commit + push directo a main** (nuestro flujo "prod-first": quieres verlo live rápido). La **rama aparte + merge** se usa solo para cosas **grandes o arriesgadas** que conviene aislar hasta que estén listas (como la regla de seguridad).

2. **Merge no es "congelado para siempre".** Significa "listo para ser oficial **ahora**", no "no se toca nunca más". Si mañana hay que cambiar algo, se hace con un **commit nuevo**. La historia siempre sigue creciendo.

### La película, en los dos casos

**Cambio normal (la mayoría):**
```
edito en local → valido en local → commit → push a main → Vercel despliega → LIVE en tu web
```

**Cambio grande / arriesgado:**
```
abro una rama → trabajo y valido aislado → cuando está listo → merge a main → push → LIVE
```

En ambos, "subir a main" = **cuando está validado y listo para ser la versión oficial.** Tal cual lo intuiste.

---

## 6. Situaciones comunes (tu chuleta)

| Lo que quieres | Lo que pido yo a Git (lo hago yo, es para que lo reconozcas) |
|---|---|
| "¿Qué se ha cambiado últimamente?" | `git log` — la lista de fotos (commits) |
| "Guarda esto" | `git commit` |
| "Súbelo a GitHub / ponlo live" | `git push` |
| "Tráete lo último de GitHub" | `git pull` |
| "Quiero probar algo sin romper nada" | `git branch` (abrir un desvío) |
| "Únelo a lo oficial" | `git merge` a main |
| "Vuelve a como estaba antes" | volver a un commit anterior |
| "¿Está todo subido?" | comparar tu ordenador con `origin/main` |

---

## 7. Reglas de oro (ciberseguridad incluida)

1. **`.env.local` (claves secretas) NUNCA se sube a GitHub.** Ni él ni copias suyas (`.bak`, `.old`, etc.). Solo el `.env.local.example` con placeholders (sin secretos) puede subirse.
2. **Commit ≠ subido.** Hasta el push, está solo en tu ordenador.
3. **main = lo oficial.** Lo que toca main lo recibe quien clona. Por eso a main solo va lo que está listo.
4. **Mensajes de commit claros.** Cada foto explica qué cambió y por qué, para poder navegar la historia.
5. **Lo arriesgado va en una rama**, no directo en main.

---

## 8. Glosario rápido

- **Repo** → carpeta del proyecto + su historial.
- **Commit** → foto guardada (local).
- **Push** → subir a GitHub.
- **Pull** → bajar de GitHub.
- **main** → la versión oficial (lo que se clona).
- **Branch (rama)** → línea de trabajo paralela.
- **Merge** → unir una rama a main.
- **Clone** → descargar el repo desde GitHub.
- **origin** → apodo de tu GitHub.
- **GitHub** → la nube donde viven los repos.

---

*Si en algún momento te pierdes con un término que yo use, dímelo y lo añado aquí.*
