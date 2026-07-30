# Capital Hub: reglas del agente

> Este archivo es `AGENTS.md`, el estandar abierto que leen las herramientas de IA.
> En Capital Hub, la fuente de verdad de las reglas operativas sigue siendo el
> **Knowledge** (`docs/sops/`) y `CLAUDE.md`. Este archivo NO los sustituye: anade
> la "valla" de REGLAS DE FABRICA que mantiene NVISION (se pone al dia con
> `/actualizar-sistema`) y, debajo, apunta a tus reglas propias, que viven FUERA
> de la valla y NUNCA se tocan con el update.

---

<!-- REGLAS-DE-FABRICA:INICIO -->
<!-- Este bloque lo mantiene NVISION y se pone al dia SOLO con el skill /actualizar-sistema. -->
<!-- NO escribas nada aqui dentro: en la proxima actualizacion se sobrescribe. -->
<!-- TUS propias reglas van FUERA de estas marcas (arriba o abajo). Ahi nunca se toca nada. -->

## ⚙️ REGLAS DE FABRICA (las mantiene NVISION · no editar aqui dentro)

> Estas reglas llegan de NVISION y se actualizan con `/actualizar-sistema`.
> Version de este bloque: **5**. Tus reglas propias van FUERA de las marcas `REGLAS-DE-FABRICA`.
>
> **Novedades de la v5:** **un chat = una rama = una CARPETA** (varios chats trabajando a la vez, de verdad) · EL WORKFLOW completo (`dev` → rama → `dev` → `main`) · UN solo juego de skills · el PLAN se escribe antes de construir.

### Regla de fabrica — EL WORKFLOW · `dev` → rama → `dev` → `main`

**Este es EL workflow. No hay otro.** El mismo texto vive en los manuales del dueño; si dos sitios dicen cosas distintas, es un bug.

**Los tres sitios**

| Nombre | Que es | Se trabaja ahi? |
|---|---|---|
| **`main`** | La web publica. | **NUNCA.** Solo recibe lo terminado. |
| **`dev`** | Puesto de control. De aqui sale cada rama y aqui vuelve. | **NUNCA.** Es de paso. |
| **rama** | El trabajo de un chat. **UNA POR CHAT.** | **Si. Aqui se trabaja. Siempre.** |

`dev` y `main` tienen siempre lo mismo dentro: **lo publicado**. `dev` nunca guarda trabajo a medias — una rama entra en `dev` solo cuando el dueño dice "publicalo".

**UN CHAT = UNA RAMA = UNA CARPETA · SIN EXCEPCION**

Cada chat trabaja en **su propia carpeta**, con su rama puesta. **No hay excepcion para cambios triviales**: una regla con excepciones se acaba aplicando mal.

```
<proyecto>/                 ← aqui vive `dev`. NO se trabaja aqui.
<proyecto>-chats/
  ├── order-bump/           ← chat 1 · rama feature/order-bump
  ├── calendario/           ← chat 2 · rama feature/calendario
  └── emails/               ← chat 3 · rama feature/emails
```

**No son copias.** Es el MISMO proyecto y el MISMO git (`git worktree`), con varias ventanas abiertas a la vez.

**Por que hace falta:** una carpeta solo puede tener **una** rama puesta. Con una sola carpeta, dos chats en dos ramas **se turnan** el checkout y el que tiene trabajo sin guardar puede perderlo. Con una carpeta cada uno trabajan **de verdad a la vez**, y es **imposible** que se pisen (git prohibe dos carpetas con la misma rama).

| Cuando | Comando | Que hace |
|---|---|---|
| Al empezar el trabajo del chat | `npm run chat:nuevo <nombre>` | Pone `dev` al dia · crea la rama desde `dev` · crea la carpeta · deja `node_modules` y las claves listas. Segundos, y sin ocupar disco. |
| Al cerrar el chat | `npm run chat:cerrar [nombre]` | Comprueba que no queda nada sin guardar **ni sin publicar** · borra rama y carpeta. **Si falta algo se niega y no borra nada.** |
| Recoger chats mal cerrados | `npm run chat:cerrar -- --limpiar` | Solo las carpetas cuyo trabajo ya esta en `dev`. |

**El dueño no crea ni borra ninguna carpeta.** Lo hace la IA. Lo unico que cambia para el: cada chat abre en **su propio link de localhost** y la IA se lo da.

**El recorrido**

```
dev  →  rama  →  dev  →  main  →  la web
 ①       ②       ③       ④
```

1. **`dev` → rama** · nace la rama del chat, copia limpia de lo publicado. **Nunca de `main` ni de otra rama.**
2. **rama** · aqui ocurre TODO el trabajo del chat. `commit` libre (punto de guardado, no publica nada).
3. **rama → `dev`** · SOLO con la orden del dueño. Se comprueba que no rompio nada.
4. **`dev` → `main`** · sale a la web, y **se verifica que llego** antes de decir "listo".

**PROHIBIDO** ir de la rama directo a `main`. **PROHIBIDO** `git push` por iniciativa propia, y prohibido igual `vercel --prod` o cualquier otra forma de sacar codigo a la web.

**Al publicar se suben LAS DOS ramas** (`main` y `dev`). Si solo se sube `main`, `dev` se queda atras y la siguiente rama nace de una foto vieja.

**Varios chats a la vez**

Cada chat tiene **su propia rama y su propia carpeta**, nacidas de `dev`. Trabajan **de verdad a la vez**: los tres pueden tener su `npm run dev` abierto en su puerto. Publicar el chat 2 lleva **solo** su rama por el recorrido; las de los chats 1 y 3 no se mueven. Una rama puede vivir 1 hora o 3 semanas.

Si dos ramas tocan el mismo archivo, el choque se resuelve **en `dev`** y la web no se entera. Sin `dev`, ese mismo choque ocurre **dentro de `main`**.

⚡ **Los dos incidentes que obligaron a esto (2026-07-30):** (1) dos chats en la MISMA carpeta y la MISMA rama — uno borro 4 carpetas y otro, un minuto despues, descarto los cambios sin guardar y las restauro; (2) dos chats en la MISMA carpeta con ramas DISTINTAS — el segundo hizo `checkout` y los archivos del primero desaparecieron de su vista a media frase. **Una rama sola no basta: hace falta la carpeta.**

**Lo que dice el dueño (6 palabras)**

```
/primer  ·  "quiero X"  ·  "dale"  ·  "cambia esto"  ·  "publicalo"  ·  "cierralo"
```

**El dueño NUNCA dice `dev`, ni `rama`, ni `main`, ni nombres de git.** Lo decide y lo hace la IA.

**Las 3 reglas que no se saltan**

1. **`/primer` siempre al empezar.** Sin contexto la IA trabaja a ciegas, repite cosas o se las inventa.
2. **Nada sale a la web sin que el dueño diga "publicalo".** `commit` si, `push` no.
3. **No esta terminado hasta que esta live y verificado.** Localhost no es la web.

**Cuando hay rama y carpeta: SIEMPRE.** No hay excepcion. Da igual que sea un rediseño o cambiar una palabra. Queda **derogada** la excepcion anterior ("trivial → sobre `dev` directamente"): abria el hueco de dos chats compartiendo `dev` y pisandose.

**Vocabulario (para entenderlo, no para usarlo).** *GitFlow* es el nombre de este metodo. *Hotfix* es sacar la rama de `main` en vez de `dev`; solo tiene sentido si algo espera en `dev` sin publicar, y aqui cada cosa se publica cuando esta lista, asi que **no aplica**.

**Base de datos:** las migraciones tocan la base de datos real al instante, este el codigo publicado o no. Avisar ANTES de cualquier migracion que cambie o borre datos que ya existen.

### Regla de fabrica — UN SOLO juego de skills, el del proyecto

**Las skills viven SOLO en `.claude/skills/` del proyecto.** Prohibido copiarlas a la carpeta global del usuario (`~/.claude/skills/`) y prohibido tener una segunda carpeta de skills dentro del proyecto (`.agents/skills/`).

**Por que es traicionero:** cuando la misma skill existe en dos sitios, **gana la copia global** y la del proyecto se ignora **en silencio**. Nadie ve un error. La skill se sigue mejorando en el proyecto, versionada en git, y el agente carga la copia vieja durante semanas.

- Caso real (NVISION, 2026-06-10 → 2026-07-30): 19 skills copiadas a la carpeta global en un solo comando. Mes y medio despues, el agente seguia cargando esas versiones de junio. Una regla escrita en julio dentro del skill **nunca se cumplio** porque la copia que se cargaba no la tenia.
- Si una skill hace falta en varios proyectos, se copia **al `.claude/skills/` de cada proyecto**, no a la carpeta global.
- **Vigilante:** `npm run check:skills`, enganchado a `predev` y a `prebuild`. Si aparece una skill en global o una segunda carpeta de skills, el arranque y el despliegue fallan.

### Regla de fabrica — El PLAN se escribe antes de construir (PRP)

**Antes de construir algo con varias partes, se escribe el PLAN y el dueño lo aprueba.** Ese plan es el **PRP**: un documento (`.md`) con el objetivo, las fases y los criterios de cierre. Lo escribe el skill `/prp`.

- **El PRP se escribe, no se improvisa.** Presentar el plan en el chat NO sustituye al documento: el chat se pierde, el documento queda.
- **El PRP no escribe codigo.** Devuelve que entendio, que va a construir, en que fases y que decidio por su cuenta. Con el OK del dueño, se ejecuta.
- **Un PRP aprobado que nadie registra no existe:** si el dueño no lo ve reflejado en algun sitio, para el no se esta haciendo.
- Trabajo mecanico (una limpieza, un cambio de texto, un arreglo pequeño) no necesita PRP. Si hay algo que decidir, si.

### Regla de fabrica — NO dejar basura en la raiz

Prohibido generar archivos temporales (capturas, logs, salidas de tests, dumps) en la raiz del proyecto o en carpetas de produccion (`public/`, `src/`). Todo artefacto temporal va a `.test-artifacts/` (oculta, en el `.gitignore`).

- Capturas de Playwright → `.test-artifacts/screenshots/`.
- Logs, dumps, salidas de scripts → `.test-artifacts/<subcarpeta-descriptiva>/`.
- Si hace falta una carpeta nueva para artefactos, se crea DENTRO de `.test-artifacts/`, nunca en la raiz.
- Basura = cualquier archivo que solo sirve para depurar/verificar y no es parte del producto.

### Regla de fabrica — Cerrar una RLS obliga a barrer quien leia filas AJENAS (fallo MUDO)

Al endurecer una policy de RLS en Supabase, en el MISMO turno hay que revisar TODO el codigo que leia filas **ajenas** de esa tabla con el cliente del usuario (`createClient()`) y pasarlo a `createServiceRoleClient()` o a una RPC `SECURITY DEFINER`.

**Por que es traicionero: la RLS NO lanza error.** Filtra las filas y devuelve 0 con `error = null`. `maybeSingle()` → `null`, `select()` → `[]`. El codigo lo confunde con "no hay datos".

- Un fallo de sistema NUNCA es "no hay datos": si un dato de sistema SIEMPRE deberia existir, su ausencia es `throw`, no `[]`.
- FAIL-CLOSED en todo chequeo de permiso o conflicto: un error al comprobar es `throw`, jamas "adelante".
- Verificar SIEMPRE como el rol mas restringido, nunca como admin (siendo admin todo funciona y el bug es invisible).

<!-- REGLAS-DE-FABRICA:FIN -->

---

## Reglas propias de Capital Hub (FUERA de la valla: el update nunca las toca)

> La fuente de verdad completa esta en el Knowledge. Esto es solo el indice para no perderse.

- **REGLA #0 (Knowledge first):** antes de actuar, leer `docs/sops/`. Es ley. Detalle en `CLAUDE.md`.
- **Protocolo del agente (REGLAS #1 a #9):** `docs/sops/producto/04-protocolo-trabajo-agente.md`.
  Auto-board en cada turno, auto-knowledge en cada decision, auto-commit + push al cerrar bloque,
  no inventar UI de servicios externos, prohibido el guion largo, prohibido anadir emojis,
  el OS siempre en live, puerto local 3100 a 3200.
- **Arquitectura OS vs App, y contenido de alumnos SIEMPRE en la App:** `docs/sops/producto/02-arquitectura-os-app.md`.
- **Brandkit oficial (ley de diseno):** `docs/sops/marketing/brand/` (SOP 01).
- **Filosofia Agent-First, ruteo de skills, stack y arquitectura:** `CLAUDE.md`.

> Si una regla no esta en el Knowledge, no es regla. Si surge una decision nueva: primero al Knowledge, despues se aplica.
