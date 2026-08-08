---
title: Protocolo de trabajo del agente
order: 4
---

# Protocolo de trabajo del agente

Estas son las **3 reglas operativas que rigen cómo trabajo yo (el agente Claude) en este proyecto**. Se aplican en cada turno, sin recordatorio del usuario.

---

## REGLA #1 — Auto-sync de la lista EN CADA TURNO

La lista de Operaciones (BD `public.tasks`, pantalla `/operaciones`) es la fuente de verdad
de qué está pendiente y qué está hecho. **Antes de cerrar cualquier respuesta** que implique
trabajo de código, decisión o avance:

1. Si la tarea del turno **no existía** → la creo, con su prioridad y su responsable.
2. Si **la termino** → `status='hecha'` (la fecha de completado la sella el sistema solo).
3. Si deja de tener sentido pero no quiero perderla → `status='archivada'`.
4. Si ya no sirve para nada → la elimino. No se dejan tareas zombi.

**Why:** Sin esto la lista queda desincronizada y Marco pierde visibilidad real del estado.
Pasó antes — quedaba sólo "lo que recordaba el chat".

**How to apply:**
- Estados válidos: `pendiente | hecha | archivada`. **No hay más.**
- Prioridades válidas: `P1 | P2 | P3`. P1 lo primero, P2 normal, P3 cuando haya hueco.
- `assignee_id` es el **uuid de un perfil real del OS** (`public.profiles`), o `null`.
  No hay `'ai'` ni `'equipo'`: si la ejecuto yo, va sin responsable o a nombre de quien la
  tenga que revisar.
- **No hay proyectos, áreas, focos, fechas límite, dependencias ni subtareas.** Si una tarea
  es demasiado grande, se parte en varias tareas sueltas. Ver SOP `producto/01`.

> Esta regla se reescribió el 2026-08-07, cuando el sistema GTD + PARA se sustituyó por una
> lista de un solo nivel. Lo de antes (board, `para_items`, `depends_on`, `is_in_progress`)
> ya no existe en la base de datos.

---

## REGLA #2 — Auto-sync del Knowledge (URGENTE, SIEMPRE, SIN RECORDATORIO)

**SIEMPRE. SIEMPRE. SIEMPRE. TODO va al Knowledge.** Cada feature, fix, bug, decisión (arquitectura, copy, pricing, pipeline, protocolo), aprendizaje o cambio de comportamiento — **se versiona en `docs/sops/` en el MISMO bloque en que se hace**, ANTES de cerrar la respuesta. Sin pedir permiso, sin esperar a que Marco lo pida.

**Si Marco tiene que pedirte "guarda esto en el Knowledge" → HAS FALLADO la regla.** No es una tarea final ni un "luego"; es parte de cada cambio, como el commit.

1. Encaja en un SOP existente → lo actualizo + entrada en "Cambios versionados" con la fecha.
2. Dominio nuevo → SOP nuevo (`NN-titulo.md` con `order: NN`).
3. **Actualizo el índice `00-readme.md`** de la carpeta para que aparezca (no dejarlo fuera del índice).
4. Bug o incidente → va al histórico de bugs del SOP del área (regla derivada + cómo evitarlo).
5. Versiones antiguas se conservan, no se reescribe el histórico.

**Checklist antes de cerrar CUALQUIER bloque de trabajo:** ¿toqué código/BD/config/copy? → ¿hay SOP que lo recoja? → ¿está en el índice? → ¿commit incluye el `.md`? Si algo es "no" → no cierro.

**Why:** El Knowledge es **el manual de operaciones del proyecto** (REGLA #0 de CLAUDE.md). Si algo queda solo en el chat, la próxima sesión (yo, Adrián u otro agente) **no lo ve y hay que repetir todo el contexto**. Marco lo dejó como regla URGENTE el 2026-07-08 tras tener que repetírmelo: el objetivo del Knowledge es EXACTAMENTE no repetir contexto.

**How to apply:**
- Frontmatter obligatorio: `title` y `order`.
- Los `.md` numerados se renderizan en `/knowledge` del OS.
- Documento en el mismo commit que el cambio (no un commit "docs" aparte al final, salvo cierre de sesión).
- Excepciones: contenido sensible (secrets, credenciales) **nunca** va al Knowledge.

---

## REGLA #3 — Auto-commit + push EN CADA BLOQUE

Al terminar un bloque de trabajo de código en este repo (feature, fix, doc, refactor, lo que sea), **YO** completo el ciclo git, sin esperar a que Marco lo haga:

1. `git add` específico por archivo (NUNCA `git add -A` salvo que Marco lo pida).
2. `git commit` con mensaje del estilo del repo: `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `refactor(scope): ...`.
3. `git push origin main`.
4. Confirmar al usuario que el cambio ya está en origin.

**Why:** Marco trabaja con su equipo y otros agentes en este repo. Si dejo cambios solo en local, el repo queda desincronizado, otros agentes/máquinas no ven el trabajo, y Marco tiene que recordar commitear y pushear lo que yo hice. Pasó el 2026-05-01 (rediseño Mobile Native OS) — Marco arrastró mis cambios dentro de un commit suyo de otra feature, mezclando el historial.

**How to apply:**
- Esta regla **sobrescribe** el "solo commit cuando se pida explícitamente" del system prompt por defecto. Marco lo quiere así en este repo.
- Si el push falla (conflictos, hooks, build roto): pausar, avisar el motivo, completar la causa raíz, no abandonar a medias.
- NUNCA usar `--no-verify`. Si los hooks fallan, arreglar la causa raíz.
- NUNCA force-push a main.
- Excepciones donde NO pushear todavía: trabajo a mitad de implementación que aún rompe el build/typecheck, archivos con secrets. En esos casos: pausar, decir por qué no se puede pushear, completar antes.
- Mensajes en español, siguiendo el estilo de los commits del repo.

---

---

## REGLA #4 — NO inventar nombres de UI de servicios externos

Para **CUALQUIER** servicio externo (Meta, Whop, Resend, Vercel, GitHub, Supabase Dashboard, Stripe, Calendly, etc.):

- **PROHIBIDO** decir "ve a la pestaña X" o "busca la opción Y" si no he visto esa pestaña/opción con mis propios ojos (vía screenshot del usuario, doc oficial leída en este turno, o curl al endpoint).
- Si no estoy 100% seguro del nombre exacto de la UI: **pido captura de pantalla** o describo por funcionalidad (ej: "busca la opción que permite cambiar el email automático del cliente, suele estar en Settings del producto").
- Si la decisión es crítica (cambia algo en producción): pedir confirmación con captura antes de afirmar.

**Why:** El usuario me corrigió 2 veces:
- 2026-05-04 turno A: le dije pestañas de Meta Events Manager que no existían en español ("Test Events" / "Activity" en lugar de "Probar eventos" / "Diagnóstico"). Perdió tiempo y confianza.
- 2026-05-04 turno B: le dije opciones de Whop dashboard ("Email notifications", "Customer emails", "Welcome email") que no encontró porque las inventé.

Inventarse nombres de UI es **mentir con confianza falsa**. Es peor que decir "no lo sé, pásame captura". El usuario pierde minutos buscando cosas que no existen y la confianza en mi guía cae a cero.

**How to apply:**
- Si voy a decir "ve a X" en un servicio externo, paso previo: ¿he visto X en este chat? ¿En screenshot del usuario? ¿En doc oficial que leí esta sesión?
- Si la respuesta es NO → reemplazar por "no conozco la UI exacta, ¿me pasas captura del settings de [contexto] y te indico?"
- Tampoco vale extrapolar de otros servicios ("Stripe lo llama así, Whop probablemente igual").

---

## REGLA #5 — JAMÁS inventar info NI prometer features sin verificar

Extensión universal de la REGLA #4. Aplica a **CUALQUIER información**, no solo nombres de UI:

- **PROHIBIDO** afirmar que algo "funciona así" / "se puede hacer así" / "tiene tal feature" sin haberlo VERIFICADO en la fuente oficial este turno (doc oficial, API call, curl, screenshot).
- **PROHIBIDO** describir capacidades de APIs externas (ManyChat, Meta, Whop, Resend, Bunny, Stripe, etc.) de memoria. Si no leí la doc esta sesión, no lo afirmo.
- **PROHIBIDO** mostrar números, métricas, ejemplos con data fake/demo sin marcarlos claramente como "demo".
- **PROHIBIDO** prometer "te lo automatizo" / "lo hago vía API" si no verifiqué que la API lo soporta.
- **PROHIBIDO** rellenar campos de UI con placeholders que parezcan reales.

**Si no estoy 100% seguro:**
- "No estoy seguro al 100%, déjame verificar la doc oficial X antes de prometer."
- "Voy a leer developers.manychat.com/reference y vuelvo con respuesta verificada."
- "Pásame captura/doc/link y confirmo."

**Why:**
- 2026-06-12: Marco me preguntó si todas las automatizaciones de ManyChat que describí eran reales. Le respondí asumiendo conocimiento de memoria sobre webhooks `conversation_opened`, etc. Marco me cortó: "Tienes prohibido inventar info o recomendarme cosas sin antes saber realmente si se puede hacer."
- Pasó antes con Meta UI (REGLA #4) y Whop UI. Ahora se generaliza a TODA información.

**How to apply:**
- Antes de afirmar capacidad de servicio externo: verificar doc oficial este turno o decir "no verificado".
- Antes de prometer flujo automatizado: confirmar que existe API/webhook para cada paso.
- Si el usuario me pide certeza ("¿estás 100% seguro?") y no la tengo: decirlo, no fingir.

---

## REGLA #6 — La lista del OS SIEMPRE en LIVE

La lista de Operaciones (`public.tasks`) debe estar **sincronizada y visible en vivo en TODO
momento**. Insertar en BD no es suficiente; el usuario tiene que VERLO actualizado sin tocar
nada.

- Si añado o cambio tareas en BD durante un turno, `/operaciones` lo enseña sin F5.
- Si una vista no lo refleja, es bug del producto y se arregla en ese mismo turno.
- El orden por defecto es **por prioridad** (P1 → P2 → P3) y, dentro de cada una, lo más
  reciente primero.

**Why:**
- 2026-06-12: Marco no veía los bloques que yo añadí en BD. Asumía que estaba en chat pero
  no en producto. Me dijo: "El OS SIEMPRE SIEMPRE debe estar actualizado, IN LIVE SIEMPRE."

**How to apply:**
- La pantalla está suscrita a Supabase Realtime sobre `tasks` (INSERT, UPDATE y DELETE), así
  que un cambio se ve en todas las pantallas abiertas en menos de un segundo.
- Nada de `display_order` ni de reordenar a mano: eso murió con el sistema viejo. El orden
  sale de la prioridad y de la fecha.

---

## REGLA #7: PROHIBIDO el guion largo (em dash)

**NUNCA escribir el guion largo** (em dash, el carácter `—`, U+2014) en NINGÚN texto que yo produzca: copy de UI, landing pages, emails, documentos del Knowledge, comentarios de código, nombres, ni mensajes de chat a Marco. Cero excepciones (salvo nombrar la propia regla, como aquí).

**How to apply:**
- En su lugar: dos puntos (`:`), coma, punto y seguido, o paréntesis. Reescribir la frase antes que meter un guion.
- Si de verdad hiciera falta un guion, usar el corto normal (`-`) con espacios. Pero preferir siempre puntuación normal.
- El guion medio (`–`, en dash) tampoco.
- Antes de cerrar cualquier bloque (código, doc, email, chat), revisar que no quede ni un `—`.

**Why:** Marco lo pidió como regla dura el 2026-07-02. El em dash delata texto generado por IA y no encaja con su tono. Sin excepciones.

---

## REGLA #8: PROHIBIDO añadir emojis sin consentimiento de Marco

**NUNCA añadir emojis** en NINGÚN texto que yo produzca para el producto: notificaciones (títulos y cuerpos), copy de UI, landing pages, emails, documentos del Knowledge, títulos de tareas del board, mensajes de chat. Cero excepciones salvo que Marco lo pida o lo apruebe explícitamente para un caso concreto.

**How to apply:**
- Para dar tono o categoría visual: iconos del sistema (lucide-react) con el color del brandkit, NUNCA un emoji en el texto.
- Si un texto existente ya tiene emojis y lo estoy tocando: los quito en esa misma pasada.
- Antes de cerrar cualquier bloque (código, doc, notificación, chat), revisar que no quede ningún emoji nuevo.
- Tampoco símbolos tipográficos raros como sustituto (flechas `→`, etc.): lenguaje normal.

**Why:** Marco lo pidió como regla dura el 2026-07-08 al revisar las notificaciones del OS (llevaban emojis en los títulos sin que él lo pidiera). Mismo espíritu que la REGLA #7: los adornos que él no pidió ensucian su producto y delatan texto generado.

---

## REGLA #9: Puerto local FIJO 3100 a 3200 (solo Capital Hub)

**El servidor de desarrollo de Capital Hub usa SIEMPRE un puerto del rango 3100 a 3200.** Prohibido 3000 u otros. El script `dev` de `package.json` fija `-p 3100` (Next sube al siguiente libre dentro del rango si 3100 está ocupado). Así el localhost no colisiona con otros proyectos ni se cae a cada rato.

**How to apply:**
- `npm run dev` arranca en 3100 (o el siguiente 31xx libre).
- Al abrir en navegador o Playwright, usar `http://localhost:3100`.
- Liberar el puerto si hace falta: `lsof -ti tcp:3100 | xargs kill`.

**Why:** Marco lo pidió el 2026-07-08. El puerto por defecto (3000) colisionaba con otras cosas y el server se caía a cada rato. Un rango dedicado a Capital Hub lo estabiliza.

---

## REGLA #10: SIEMPRE entregar el link de localhost (en puerto LIBRE)

**Cada vez que haga o entregue algo en localhost, le doy a Marco el link. SIEMPRE, sin que lo pida.** Un cambio visual "terminado" del que Marco no tiene link es una entrega a medias: él necesita abrirlo y verlo con sus propios ojos.

**How to apply:**
- Al terminar cualquier trabajo que se ve en local (página, UI, rediseño, fix visual): termino el mensaje con el link exacto, ej: `http://localhost:3101/dashboard`.
- El servidor **tiene que estar CORRIENDO** cuando doy el link (no vale un link a un server apagado). No mato el `dev` después de entregar.
- Uso un puerto **LIBRE** del rango 3100 a 3200 (REGLA #9). **Nunca el 3000** (siempre ocupado por otra cosa de Marco). Antes de dar el link, verifico que el puerto está libre y sirviendo ESTE proyecto: `for p in 3100 3101 3102 3103; do lsof -ti tcp:$p >/dev/null 2>&1 && echo "$p ocupado" || echo "$p libre"; done`, y arranco en uno libre: `npm run dev -- -p 31XX`.
- Si la pantalla necesita login (ej: `/dashboard`), se lo digo: "abre el link y entra con tu usuario; verás el cambio con tus datos reales".
- Este link NO es publicar. Publicar (push a main a producción) sigue necesitando orden explícita ("publícalo"). El link de localhost es solo para que Marco revise antes.

**Why:** Marco lo pidió el 2026-07-26. Rediseñé el embudo del dashboard y le describí el resultado sin darle ningún link para verlo, así que no pudo revisar nada. Regla dura: si toco algo que se ve en local, entrego el link, en un puerto libre y con el server encendido.

---

## REGLA #11: SIEMPRE español neutro (nunca castellano de España)

Todo lo que yo escriba (chat **Y** copy de producto) va en **español neutro**. Prohibido el castellano de España.

**How to apply:**
- Usar **ustedes / tú**, NUNCA "vosotros / os / vuestro / -áis / -éis".
- Fuera vocabulario y muletillas de España: "vale", "coño", "tío", "guay", "flipar", "curro", "majo", etc.
- Antes de cerrar cualquier bloque (chat, copy, doc), revisar que no quede ni un "vosotros" ni jerga de España.

**Why:** Marco lo pidió como regla dura el 2026-07-28. Es latinoamericano; el castellano de España no encaja con su tono ni con su avatar.

---

## REGLA #12: Copy SIEMPRE al grano, sin marketing

Todo el copy corto y directo, en español neutro, sin adornos ni lenguaje de marketing. Aplica **por defecto** salvo que Marco diga lo contrario para un caso concreto.

**How to apply:**
- Frases cortas. Decir la cosa, no adornarla.
- Fuera muletillas de marketing: "sin compromiso", "plazas limitadas", "no te lo pierdas", "exclusivo", exclamaciones vacías.
- Perspectiva del usuario, no de nosotros pidiendo: "Deja tus datos para acceder al evento" (es lo necesario para entrar), NO "Déjanos tus datos" ni "te enviamos tu invitación".

**Why:** Marco lo pidió como regla anclada el 2026-07-28. El copy inflado le resta credibilidad y delata plantilla.

---

## REGLA #13: PROHIBIDO el icono estrellita (Sparkles) en TODO el producto

El icono `Sparkles` de lucide-react está prohibido en **todo el producto**, no solo en formación (donde ya estaba vetado, SOP `producto/ia-integrator`). Si un elemento necesita icono, usar uno que signifique la acción real (ej. `BadgeCheck` = confirmado, `Mail` = email, `Ticket` = entrada). Si no hace falta, ninguno.

**Why:** Marco lo re-pidió el 2026-07-28 al verlo en la gracias del funnel del webinar. Es un icono genérico de "IA" que delata plantilla y no significa nada concreto.

---

## REGLA #14: Hablarle a Marco claro, completo y SIN tecnicismos

**Marco no es técnico y no tiene por qué serlo.** Todo lo que yo le escriba en el
chat va en lenguaje normal: como se lo explicarías a alguien de 14 años que es
listo pero no programa. Ni infantil ni por encima del hombro: normal.

**Si Marco tiene que preguntarme "esto no lo entendí", HE FALLADO la regla.**

**How to apply:**

- **Prohibido soltar un término técnico sin traducirlo.** RLS, migración, policy,
  endpoint, bucket, deploy, schema, RPC, RLS, JWT, commit, rama: si no hay forma
  de evitar la palabra, se explica en la misma frase con palabras normales.
- **Se dice el efecto, no el mecanismo.** Mal: *"las métricas necesitan un
  permiso nuevo en la base"*. Bien: *"ahora mismo el formador entra y ve el
  panel vacío, porque el sistema solo deja que cada persona vea su propio avance.
  Hay que abrirle la puerta para que vea el de sus alumnos, y solo los suyos"*.
- **Completo, no a medias.** Decir la consecuencia real para él: qué va a ver,
  qué va a cambiar, qué se rompe si no se hace.
- **Al grano.** Sin rodeos, sin repetir lo que ya sabe, sin listas de opciones
  cuando lo que toca es decidir (ver la memoria `feedback_decisive_best_practice`).
- **Nada de rutas de archivos ni nombres de funciones** en el chat, salvo que él
  los pida. Le importa la pantalla y el resultado, no dónde vive el archivo.
- Antes de enviar cualquier mensaje: releerlo y preguntarse *"¿esto lo entiende
  alguien que no programa?"*. Si la respuesta es no, se reescribe.

**Why:** Marco me lo ha repetido muchas veces, y el 2026-07-30 tuvo que
decírmelo otra vez tras leerme *"las métricas necesitan un permiso nuevo en la
base"*, una frase que no significa nada para quien no toca bases de datos. Sus
palabras: *"acostúmbrate a hablarme claro, completo, al grano y que entienda
perfectamente y sin ser técnico (agrega esto a alguna regla porque te lo he
repetido muchas veces)"*. Ya estaba en la memoria privada del agente; ahora es
regla del Knowledge, que es lo que manda.

---

## REGLA #15: SIEMPRE visual. Nunca cambiar un gráfico por texto

**Marco valora lo visual cien mil veces más que el texto.** Ante la duda entre
contar algo con palabras o enseñarlo con un gráfico, **siempre el gráfico**.

**Prohibido "simplificar" quitando un elemento visual y dejando una frase en su
lugar.** Eso es empeorar el producto, no simplificarlo.

**How to apply:**

- Un dato que se puede ver, se dibuja: barras, curvas, anillos, mapas de calor,
  medidores. El texto acompaña, nunca sustituye.
- **Y lo visual tiene que EXPLICARSE SOLO.** Un gráfico que hay que adivinar es
  peor que no ponerlo. Obligatorio en cada gráfico:
  - Los **números a la vista** en los propios puntos o barras.
  - **Los dos ejes rotulados**, con sus unidades y sus extremos.
  - **Al pasar el cursor**, una etiqueta que diga qué es ese punto en palabras
    normales ("Lección 4: la terminaron 6 de 12 alumnos").
  - **Lo importante señalado dentro del dibujo** (la caída más fuerte marcada,
    no explicada aparte).
  - Un título que diga qué estás mirando, sin jerga.
- Nada de puntos y líneas sueltas sin contexto: si Marco tiene que preguntar
  "qué significa esto", el gráfico está mal hecho.
- En móvil el gráfico se rehace, no se encoge: si a 375px no se leen los
  números, se cambia la forma (barras en vertical, lista con barras, lo que sea
  legible).

**Why:** Marco, 2026-07-30, dos veces en el mismo día. Primero: *"valoro cien
mil veces más lo visual que el texto, limítate de siempre estar poniendo texto y
sustitúyelo por cosas visuales"*. Y sobre la curva de abandono que le entregué:
*"en este gráfico no me sale nada. Si paso el cursor por encima, no me dice
nada. Lo que veo son puntos y una línea ahí degradada"*. Yo había propuesto
quitar el gráfico y dejar una frase: la respuesta correcta era **dejarlo y
hacerlo claro**.

Va de la mano de la REGLA #14: hablar claro también es dibujar claro.

---

## Cambios versionados

### 2026-07-30: REGLA #15 añadida (siempre visual, y que se explique solo)
Marco: *"valoro cien mil veces más lo visual que el texto... ánclalo en una regla
para no estar repitiéndotelo"*. Detonante: entregué una curva de abandono sin
números, sin ejes y sin etiqueta al pasar el cursor, y encima propuse
sustituirla por texto. Lo visual se queda; lo que se arregla es su claridad.

### 2026-07-30: REGLA #14 añadida (hablar claro y sin tecnicismos)
Marco tuvo que pedirlo otra vez: *"agrega esto a alguna regla porque te lo he
repetido muchas veces"*. Detonante: le escribí "las métricas necesitan un permiso
nuevo en la base" y no se entendía nada. La regla obliga a traducir todo término
técnico y a decir el efecto en pantalla, no el mecanismo.

### 2026-07-28: REGLAS #11, #12, #13 añadidas
- **#11 español neutro** (nunca castellano de España): ustedes/tú, sin "vosotros" ni jerga de España. Chat y copy.
- **#12 copy al grano, sin marketing:** frases cortas, sin muletillas, perspectiva del usuario.
- **#13 icono estrellita (Sparkles) prohibido en TODO el producto** (antes solo en formación).
Detonante: feedback de Marco al revisar el funnel del webinar del lanzamiento del 8.

### 2026-07-26: REGLA #10 añadida (link de localhost siempre)
Marco: siempre que entregue o haga algo en localhost, tengo que darle el link, en un puerto libre (nunca el 3000) y con el server corriendo. Detonante: rediseñé el embudo del dashboard y solo se lo describí, sin link para que lo viera.

### 2026-07-08: REGLA #9 añadida (puerto local)
Fijado el rango de puerto local 3100 a 3200 para Capital Hub (`-p 3100` en `package.json`). Detonante: el localhost se caía por choque de puertos con otras cosas.

### 2026-07-08: REGLA #8 añadida
Prohibido añadir emojis sin consentimiento explícito de Marco, en cualquier soporte (notificaciones, UI, emails, Knowledge, board, chat). Detonante: las notificaciones del equipo salían con emojis en los títulos. Barrido aplicado ese mismo día a todos los títulos de notificación del OS.

### 2026-07-08: REGLA #2 elevada a URGENTE
Marco: "acostúmbrate a guardar SIEMPRE SIEMPRE SIEMPRE TODO en el Knowledge, no quiero estar repitiéndotelo". Pasó porque documenté las cosas de la sesión (webinar, notificaciones, bugs) pero de forma completa solo cuando él lo pidió al final. Regla dura: cada cambio se documenta EN SU MISMO BLOQUE, sin recordatorio; si Marco tiene que pedirlo, es un fallo. Añadido checklist de cierre y actualización obligatoria del índice `00-readme.md`.

### 2026-07-06: REGLA #7 reforzada
Marco la re-enfatizó al revisar la landing del webinar: el guion largo (`—`) se elimina de CUALQUIER lugar donde aparezca y no se vuelve a añadir nunca (landing, gracias, emails, Knowledge, comentarios, chat). Barrido aplicado al funnel webinar completo. Cero excepciones salvo nombrar la propia regla.

### 2026-07-02: REGLA #7 añadida
Prohibido el guion largo (em dash) en todo texto que yo escriba, en cualquier soporte. Marco lo pidió explícitamente. Se aplica desde ya.

### 2026-05-04: Creación
Las 3 reglas vivían dispersas: REGLA #1 y #2 en `~/.claude/.../memory/` (memoria privada local), REGLA #3 todavía no estaba escrita. Marco corrigió: **el Knowledge es la fuente única**. Movidas aquí, indexadas en `00-readme.md`. CLAUDE.md ahora solo tiene la REGLA #0 ("lee Knowledge antes de actuar") y apunta a este SOP indirectamente.

### 2026-05-04 — REGLA #4 añadida
Aplicación universal de la regla "no inventar UI de servicios externos". Estaba sólo para Meta en `07-tracking-meta.md` (versión 3) — Marco la rompió otra vez con Whop (le di opciones de dashboard que no existen). Ascendida a regla principal del agente, aplica a TODOS los servicios.

### 2026-06-12 — REGLAS #5 y #6 añadidas
- REGLA #5: generalización de #4. Prohibido inventar info de cualquier tipo (no solo UI). Aplica a APIs externas, métricas, ejemplos, números, promesas de automatización.
- REGLA #6: el OS de tareas/proyectos debe estar SIEMPRE actualizado en live. Bug visible: yo añadía en BD y Marco no lo veía. Solución: orden por display_order + auto-refresh.

---

## REGLA #18 — Se toca SOLO lo que se pidió. Lo demás se propone, no se hace

Cuando Marco pide un ajuste, se cambia **ese** ajuste y nada más. Si de paso creo que otra
cosa quedaría mejor, **se propone en una frase y se espera**. No se cambia y se informa después.

Y **"un poco" quiere decir un poco.** Si el encargo trae un límite ("no exageres", "solo un
poco"), ese límite es parte del encargo: pasarse es incumplirlo igual que quedarse corto.

**Why:** 2026-07-31, tres veces el mismo fallo en un día. (1) Pidió cambiar el verde por lila y
lo hice sin avisar de que chocaba con el brandkit. (2) Quité "Plazas limitadas" por una regla de
estilo, sin permiso. (3) Pasé el hero de dos columnas a una sin que nadie lo pidiera: *"¿quién
carajos te dijo a ti que tienes que pasarlo a una sola columna?"*. Y en el mismo turno, pidiendo
acercar "un poco" dos bloques, los dejé pegados.

**How to apply:**
- Antes de cada cambio: ¿está esto en lo que me pidió? Si no, no se toca.
- Un rediseño de layout (columnas, orden de secciones, estructura) **siempre** necesita petición
  explícita. No es un detalle de ajuste.
- Si el encargo trae una medida difusa ("un poco", "algo más"), moverse en pasos pequeños y
  enseñar el resultado, no dar el salto máximo.

---

## REGLA #17 — El copy del dueño NO se toca. Nunca. Ni para cumplir otra regla

**Todo texto que Marco haya dictado, aprobado o simplemente mantenido en una página es SUYO.**
No se cambia, no se acorta, no se "mejora" y no se quita ni una palabra sin permiso explícito.

Esto **está por encima de la REGLA #12** (copy al grano, sin muletillas de marketing). La #12
es una guía para el texto que YO escribo de cero. No es una licencia para reescribir el suyo.

**Si una regla del Knowledge choca con el copy vivo de una página:** se avisa, se explica en una
frase por qué choca, y **decide Marco**. Nunca se cambia primero y se informa después.

**Why:** 2026-07-31. Una revisión marcó "Plazas limitadas" en el opt-in de la clase en directo
por incumplir la #12 y lo cambié por iniciativa propia. Marco: *"al inicio de este chat yo te he
dado un copy exacto... tienes terminantemente prohibido tocar el copy si yo te lo he dado"*.
Revertido. El daño no es la frase: es que si toco su copy sin permiso, deja de poder fiarse de
que lo que aprueba sigue ahí.

**How to apply:**
- Antes de cambiar CUALQUIER texto visible: ¿lo escribí yo de cero en este mismo bloque? Si la
  respuesta es no, no se toca sin permiso.
- Vale para acortar por espacio: si no cabe, se ajusta el diseño, no el texto.
- Un hallazgo de revisión sobre copy NO se aplica solo. Se reporta y espera.

---

## REGLA #16 — Comprobar con el comando que corre al publicar

`tsc --noEmit` **no** es lo que corre al desplegar. La App usa `tsc -b`, que
avisa de cosas que el otro se traga: un import que se quedó sin usar tumbó el
despliegue entero el 2026-07-30, y durante media hora se dio por publicado algo
que nunca llegó a construirse.

**Antes de decir que algo está publicado:**

1. Correr **`npm run build`**, el comando de verdad. No `tsc --noEmit`.
2. Mirar el estado del despliegue (`vercel ls`). Un push no es un despliegue, y
   un despliegue en **Error** deja la web sirviendo lo viejo sin avisar a nadie.
3. Comprobar en el sitio publicado que está **lo nuevo**, buscando algo que solo
   exista después del cambio. Que la web responda 200 no significa nada.

**Y el error de bulto que lo hizo largo:** buscar en el paquete publicado una
cadena que también aparece en un comentario, o en otro archivo legítimo, y
concluir en falso. La cadena que se busque tiene que existir **solo** en el
código nuevo.

---

## REGLA #19 — Todo lo que le mando a Marco tiene que ABRIRSE de un clic

Si le nombro un documento, una página o cualquier cosa que él pueda querer ver,
**tiene que poder llegar ahí con un clic.** Nombrar un archivo y que no pase nada
al pulsarlo es una entrega rota.

**How to apply:**

- **Documento del Knowledge:** el link va a la **página del OS** donde se lee
  (`http://localhost:31XX/knowledge/<slug>` en local, `https://os.capitalhubapp.com/knowledge/<slug>`
  publicado). Nunca al `.md` suelto: en su pantalla eso no abre nada.
- **Pantalla del producto:** link completo con `http://`, no el nombre de la ruta.
- **Si de verdad no hay nada que abrir** (un archivo interno, una tabla), entonces
  se da la **ruta en un bloque de código en su propia línea**, para que la copie de
  un toque. Nunca suelta dentro de una frase.
- Antes de enviar: releer el mensaje y preguntarse *"¿cada cosa que he nombrado
  aquí se abre?"*. Si algo no se abre, o se arregla el link o se quita.

**Why:** Marco, 2026-07-31. Le entregué un SOP nuevo nombrando el archivo `.md` y
al pulsarlo no pasaba nada: *"aquí estoy intentando dar al MD y no me clica y no
me hace nada, o al menos que lo pueda copiar rápido"*. Un enlace que no abre le
obliga a ir a buscarlo a mano, que es justo lo que yo tenía que ahorrarle.

Va de la mano de la REGLA #10 (siempre entregar el link de localhost).

---

## REGLA #20 — Las llaves ya las tengo. Se buscan, no se piden

**PROHIBIDO decirle a Marco "necesito tu login", "no puedo verificar esto porque hace
falta acceso" o cualquier variante.** Casi siempre ya tengo lo que hace falta y no lo he
buscado. Pedirlo es hacerle trabajar a él por pereza mía.

**Antes de decir que no puedo entrar a algo, se agota ESTA lista, en este orden:**

| Dónde | Qué hay |
|---|---|
| `.env.local` del repo | Todas las claves de servicios: Supabase, Resend, OpenRouter, Meta, Bunny, Calendly. **Y `TEST_AGENT_PASSWORD`** |
| `.mcp.json` | El token de administración de Supabase (`sbp_...`), que ejecuta SQL contra la base real |
| `docs/sops/sistemas/02-test-agent.md` | La cuenta con la que entro al OS y a la App: `test-agent@capitalhubapp.com`, rol `super_admin` |
| `npx vercel env ls production` | Lo que hay puesto en producción |

**Para ver una pantalla del OS con mis ojos:** entro con el test-agent en Playwright. No
hay excusa para entregar una pantalla sin haberla mirado.

**Solo se le pide algo a Marco cuando, después de mirar los cuatro sitios, de verdad no
está.** Y entonces se le dice exactamente qué falta, dónde ponerlo y para qué, nunca "pásame
la contraseña" (ver la regla de credenciales solo en `.env.local`).

**Why:** Marco, 2026-07-31: *"me lo tienes siempre, no entiendo por qué me lo sigues
preguntando y esto ya ha pasado varias veces"*. Detonante: entregué la sección de Ads
diciendo "no pude comprobar cómo se ve por dentro porque necesita tu login", teniendo la
contraseña del test-agent en el `.env.local` y el SOP que la documenta desde junio. Al
buscarla, entré en dos minutos y encontré un fallo de la pantalla que él habría
malinterpretado.

---

## REGLA #21 — Un problema sin solución no se reporta

**Nunca se le entrega a Marco un problema pelado.** Todo problema va con su salida
concreta: qué se hace, quién lo hace y cuál es el siguiente paso exacto.

**Prohibido:** *"falta el permiso X"*, *"está bloqueado por Y"*, *"no se puede hasta que Z"*.
**Obligatorio:** *"falta esto, se arregla así, lo hace tal persona en tal sitio, y mientras
tanto seguimos con esto otro"*.

Y antes de reportarlo: **¿lo puedo resolver yo?** Si la respuesta es sí, se resuelve y se
cuenta ya resuelto. Reportar algo que yo mismo podía arreglar es pasarle mi trabajo a él.

**Why:** Marco, 2026-07-31: *"deja de estar diciéndome los problemas sin la solución, dame
siempre las soluciones o soluciónalo tú mismo... ¿cómo carajo soluciono esto? ¿cuál es el
otro permiso? ¿cómo muevo la energía hacia adelante?"*. Detonante: le dije que la llave de
Meta no podía leer campañas y lo dejé ahí, sin decirle qué permiso era exactamente ni los
pasos para conseguirlo.

---

## REGLA #22 — No se guarda en `dev` ni en `main`. Hay un freno que lo impide

> Nació con el número 17, pero ese ya era el del copy del dueño. Renumerada al
> unir las dos ramas el 2026-07-31: dos reglas con el mismo número no valen.

**Prohibido hacer `commit` estando en `dev`, `main` o `master`.** Todo trabajo va
en la rama de su chat, abierta con `npm run chat:nuevo <nombre>`.

**Ya no depende de que la IA se acuerde.** Hay un gancho de git en
`.githooks/pre-commit` que rechaza el guardado y explica que hacer. Vale para
todas las carpetas de chat a la vez (`core.hooksPath` es de todo el repo), y
`chat:nuevo` lo deja puesto, asi que un proyecto recien clonado lo tiene desde
el primer chat.

**Why:** el 2026-07-31 un chat trabajo toda la tarde en la carpeta principal, sin
abrir la suya. Consecuencias reales de ese mismo dia:

- Seis cambios entraron directos a `main` saltandose `dev`.
- `dev` quedo atras tres veces, y hubo que repararla tres veces.
- La construccion se bloqueo dos veces a mitad de otro trabajo.
- Otro chat quedo con una copia vieja y a punto de publicar encima.

La regla estaba escrita en `AGENTS.md` desde la v5 del sistema, y aun asi paso.

**El agujero que faltaba tapar.** Ese mismo dia se añadio una guardia en
`check-flujo.mjs`, pero:

1. Solo salta al **arrancar el servidor o construir**, nunca al guardar. Para
   entonces el commit ya existe.
2. Su condicion era `carpeta principal Y rama distinta de dev`, asi que **dejaba
   pasar justo el caso que estaba ocurriendo**: la carpeta principal con `dev`
   puesta.
3. Corria tambien en Vercel, donde no hay carpetas de chat, y **tumbo todos los
   despliegues** (ver SOP `producto/06`).

El gancho ataca el momento exacto del daño (guardar) y no depende de la carpeta
ni de la rama que se tenga puesta.

**How to apply:**

- Si el freno salta, no se ha perdido nada: el trabajo sigue sin guardar. Se abre
  `npm run chat:nuevo <nombre>` y se lleva ahi.
- **Nunca saltarselo con `--no-verify`.** Si el freno molesta, es que se esta
  trabajando donde no toca.
- Publicar sigue igual: la rama entra en `dev` y `dev` en `main` por union, y
  unir no es guardar, asi que el freno no estorba.

---

## REGLA #23 — Antes de borrar algo, comprobar QUIEN lo usa de verdad

Marco pide retirar una pantalla y la reaccion facil es borrar todo lo que se llame igual.
**Eso rompe cosas vivas sin dar ningun error.**

Pasos, en este orden, ANTES de borrar una linea:

1. **Mirar los datos.** Si tiene tabla, contar filas. El calendario propio tenia **0
   reservas en toda su vida** y los lead magnets **1 entrega**: eso confirmo que se podian
   ir. Si hubiera habido cientos, la conversacion era otra.
2. **Buscar quien lo importa desde FUERA de su carpeta.** Ahi aparecen las sorpresas.
3. **Mirar si alguna pagina PUBLICADA depende de ello.** Una web en borrador se puede
   romper; una publicada la ve un lead.
4. **Desconfiar de los nombres.** Los correos `agenda-*` no eran de la agenda propia: los
   manda el reloj de **Calendly**. Llegue a borrarlos y los restaure al comprobarlo. Sin
   esa comprobacion, los leads se habrian quedado **sin recordatorio de su llamada** y
   nadie se habria enterado hasta que alguien no apareciera a una llamada.
5. **Despues de borrar, buscar los enlaces que apuntaban ahi.** Quedaron dos enlaces a
   `/agenda` en la pantalla del calendario, llevando a un 404.

**Y lo que NO se borra sin permiso explicito:** las tablas y los datos de la base, y los
eventos de medicion ya enviados a Meta (quitarlos del catalogo rompe la lectura de lo que
ya se disparo).

**Why:** 2026-08-07, retirando los lead magnets y la agenda propia. Los dos borrados eran
correctos; lo que casi sale mal fueron las cosas que se llamaban igual y las que quedaron
apuntando a lo borrado.

---

## REGLA #23: Las horas que se enseñan son las horas REALES

**Toda hora que se le enseñe a Marco, en chat o en pantalla, tiene que ser la hora real de lo que pasó.**

**How to apply:**

- Las APIs devuelven UTC. **Nunca se le pasa a Marco el texto crudo de una API.**
- La hora se saca de la base de datos ya convertida, o se convierte antes de escribirla.
- Antes de decir una hora: comprobarla contra la base de datos, no contra la respuesta de la API.

**Why:** 2026-08-07. Le pasé a Marco cinco horas de llamadas leídas en UTC, con **dos horas de error**. Se lo corrigió su equipo en una reunión. Y de paso salió que la cuenta de Calendly de Adrián está en **Asia/Dubái**, así que ni la API ni lo que ve Adrián coinciden con la hora del negocio.

---

## REGLA #24: Todas las métricas se enseñan SIEMPRE

**Ninguna métrica desaparece de la pantalla porque no tenga datos.** Todas se pintan siempre, con su nombre y su número propio.

**How to apply:**

- Un **conteo** vacío es `0`. Cero contactos es un dato: se escribe 0.
- Un **porcentaje o una media sin divisor** no es 0: es que no se puede calcular. Ahí va un **guion**. Escribir "0%" cuando no hubo ni una llamada es mentir.
- **Prohibido** el patrón `if (valor <= 0) return null` en una métrica. Eso es lo que rompió el dashboard.

**Why:** 2026-08-07. El revenue y el cash collected estaban escritos para NO pintarse si no había dinero. Como el periodo venía sin ventas, la pantalla no enseñaba nada de dinero y Marco no entendía qué estaba mirando: *"siempre tienen que estar mostrando todas las fichas, todas las métricas, independientemente de si hay o no haya"*.

---

## REGLA #25: Un gráfico que no se explica solo, no sube

**Si un dibujo necesita que alguien lo explique, está mal hecho y no entra en el producto.**

**How to apply:**

- **El número va escrito**, siempre, encima o dentro del dibujo. En un teléfono no hay ratón: un dato que solo aparece al pasar por encima **no existe**.
- **Lo que se pierde se dibuja, no se cuenta.** En un embudo, la caída entre paso y paso es una forma con su número dentro, no un porcentaje flotando.
- **Un solo idioma visual** para todo el panel: los embudos se dibujan todos igual, y los gráficos de tiempo también. Si cada uno es distinto, hay que aprender a leer cada uno.
- **Colores con significado fijo:** verde avanza, gris no avanzó, **ámbar solo donde se pierde más** y en ningún otro sitio.
- **Cero diagonales, sombras o trozos de color sin rótulo.**
- **Los números se pueden abrir:** al tocar una barra se ve quién hay dentro. Un número que obliga a irse a otra pantalla a buscar el detalle está a medias.

**Why:** 2026-08-08. El dashboard tenía **siete gráficos** y Marco no entendía ninguno: *"no entiendo ninguno de los gráficos... TU OBJETIVO ES CLARIDAD"*. Cada uno estaba dibujado de una forma distinta, con diagonales que no significaban nada y porcentajes sueltos. Se quedaron **tres**, con un solo idioma.

---

## REGLA #26: Toda lista se abre en VENTANA y nunca enseña más de 20

> Marco, 2026-08-08: *"cuando toco una barra, no quiero que esa vaina se despliegue hacia abajo. Quiero ver un pop-up donde me muestre todos los contactos y recuerda siempre: nunca me muestras más de veinte contactos. Si hay más de veinte, se mueve con una flecha en la otra. Eso anótalo como regla para no estar repitiéndotelo cada rato."*

**Por defecto, en todo el OS, sin que haga falta pedirlo:**

- Al tocar algo que representa un grupo de personas (una barra, una etapa, un número), la lista se abre en una **ventana**, no desplegándose hacia abajo y empujando lo demás.
- **Máximo 20 filas a la vez. Siempre.** Con más, se pasa de página con **una flecha atrás y una flecha adelante**, y se dice en qué punto estás ("21 a 40 de 132").
- El tamaño de página es una **constante única del OS**, no un parámetro por pantalla: el día que cambie, cambia en todos lados a la vez.
- En el teléfono la ventana entra desde abajo; en el ordenador, centrada. El lado se decide con clases, nunca con JavaScript.
- Mientras la ventana está abierta, la página de detrás **no se mueve**.

Componentes: `<ListaEnVentana>` (`src/components/ui/lista-en-ventana.tsx`) para la ventana, y `<ListaPaginada>` para listas en línea dentro de una pantalla.

---

## REGLA #27: Un número que se enseña tiene que poder explicarse en una frase

> Marco, 2026-08-08: *"¿Cómo que vinieron? ¿Qué carajo es vinieron, bro? Habla específicamente con el lenguaje exacto que es."*

**Antes de escribir el rótulo de una métrica, hay que poder terminar esta frase: "esto cuenta ___ , medido desde ___ , en el periodo ___".** Si no se puede, la métrica no está lista para salir a pantalla.

**How to apply:**

- **Nada de verbos vagos.** "Vinieron" no significa nada: es **"se conectaron a la llamada"**. "Llamadas hechas" es **"llamadas celebradas"**. "No vinieron" es **"no se presentaron"**.
- **El pie de cada número dice de dónde sale**, con las dos cantidades: no "de 8 agendadas, 3 por venir", sino **"se reservaron 8. Quedan 3 por celebrar"**.
- **Un porcentaje dice siempre de qué es**: no "0%", sino "0 ventas de 5 llamadas celebradas".
- Si el rótulo no cabe, se acorta el rótulo, **nunca el significado**.

---

## REGLA #28: Un embudo solo se dibuja como embudo si de verdad lo es

**Un embudo supone que cada paso es un subconjunto del anterior.** Si no lo es, dibujarlo como embudo es mentir.

**How to apply:**

- **Recorrido** (cada paso sale del anterior): se dibuja como embudo, con la caída entre paso y paso.
- **Reparto** (dónde está cada persona ahora): se dibuja como barras con su porcentaje del total. **Sin caídas**, porque nadie se ha caído: están repartidos.
- **Nunca se deduce por dónde pasó alguien a partir de dónde está ahora.** Eso solo lo sabe su historial.

**Why:** 2026-08-08. El panel decía **"23 en DM"** en el embudo del webinar cuando en DM no había **nadie**, y "23 en Lead" cuando había 19. El cálculo sumaba a cada escalón todos los siguientes, dando por hecho que quien está en "Agendado" pasó antes por "Lead" y antes por "DM". Falso: al webinar se entra directamente en "Lead" al dejar los datos. **El CRM decía la verdad y el panel otra cosa**, y lo cazó Marco.
