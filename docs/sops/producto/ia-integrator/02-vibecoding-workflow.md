---
title: Vibe Coding — El método completo, paso a paso
order: 2
formacion: IA Integrator
---

# Manual: Cómo crear tu software hablando con la IA (Vibe Coding)

> **Para quién es esto:** para cualquier persona que empieza de cero y quiere construir su propio software **hablando con una IA**, sin escribir el código a mano.
> **Objetivo:** que al terminar de leer sepas EXACTAMENTE cómo se trabaja bien, paso a paso, desde que abres el chat hasta que tu web está publicada para todo el mundo.

---

## 1 · La idea en una frase

**Tú dices QUÉ quieres. La IA escribe el código, lo prueba y lo deja funcionando. Tu trabajo es dirigir, mirar y aprobar.**

Es como ser el **director de una película**: tú no manejas la cámara ni montas las luces (eso es la IA). Tú decides la escena que quieres, la ves, y dices "así sí" o "repítela más grande". El resultado es tuyo, pero el trabajo manual lo hace el equipo.

Que no escribas el código **no significa que el código no exista.** Existe, y por eso hay que tratarlo con las mismas reglas de orden y seguridad que usa un programador de verdad (guardar versiones, trabajar en zonas seguras, probar antes de publicar). Tú operas en la **capa de decisiones**, no en la de teclear.

---

## 2 · Los 4 lugares donde vive tu trabajo

```
   TU ORDENADOR                              LA NUBE (GitHub)         INTERNET
┌────────────────────────────────┐        ┌──────────────┐      ┌──────────────┐
│  1) LOCALHOST      2) RAMA      │        │  3) main     │      │ 4) PRODUCCIÓN│
│     (tu taller)      (mesa      │  ───►  │ (lo oficial) │ ───► │  (tu web     │
│                      aparte)    │        │              │      │   pública)   │
└────────────────────────────────┘        └──────────────┘      └──────────────┘
```

### 1) Localhost — tu taller privado
**Localhost es tu propia web funcionando DENTRO de tu ordenador, donde solo tú la ves.**

- La palabra "localhost" significa *"el anfitrión local"* = **tu propio ordenador**. Cuando enciendes el proyecto, tu ordenador se convierte, durante un rato, en el sitio que sirve la web… pero solo para ti.
- **¿Por qué se ve en un navegador (Chrome, Safari)?** Porque lo que estás construyendo **es una página web**, y las páginas web se miran con un navegador, siempre. Da igual que aún no esté en internet: tu navegador puede abrir una web que vive dentro de tu propio ordenador.
- La dirección suele ser algo como **`localhost:3000`**. Ese `:3000` es el **número de puerta** por la que tu navegador entra a ver tu web dentro de tu ordenador.
- **Nadie más en el mundo puede ver tu localhost.** No está en internet. Está solo en tu máquina. Si apagas el proyecto, desaparece.

Es tu restaurante montado dentro de casa **antes de abrir al público**: la cocina funciona y los platos se cocinan de verdad, pero la única persona que puede entrar a probarlos eres tú. El navegador es la puerta por la que entras; `localhost:3000` es su dirección privada.

**¿Cuándo se usa localhost? SIEMPRE, y siempre PRIMERO.** Cada cambio se construye y se mira aquí antes de ir a ningún otro sitio. Es el ensayo.

### 2) Rama (branch) — una mesa de trabajo aparte
Una **rama** es una copia paralela de tu proyecto donde se trabaja en algo **sin tocar la versión buena**, hasta que esté listo.

`main` es la **carretera principal** por la que circula tu web oficial. Una rama es un **desvío**: te sales a trabajar tranquilo en un carril aparte y, cuando terminas, te reincorporas a la carretera. Mientras trabajas en el desvío, la carretera principal sigue funcionando como si nada.

### 3) main — la versión oficial
`main` es la **versión oficial** de tu proyecto, guardada en la nube (GitHub). Lo que está en `main` se considera **lo bueno y lo terminado**, y es lo que se publica. Es la **carretera principal**.

### 4) Producción ("prod") — tu web abierta al público
**Producción es tu web de verdad, en internet, que usa todo el mundo.** Se publica **sola** en cuanto algo llega a `main` (lo hace una herramienta llamada Vercel, sin que tú hagas nada). Es el **restaurante ya abierto al público**: cualquiera entra por la calle y come. Aquí no se experimenta.

**El viaje de CUALQUIER cambio, siempre el mismo:**
`idea → localhost (se construye y se prueba) → [rama, si es grande] → main (se guarda y se sube) → producción (se publica sola) → live`

---

## 3 · Guardar tu trabajo y publicarlo: commit, push y merge

Cuando terminas algo en tu taller (localhost), ese trabajo todavía está **suelto**: existe en tu ordenador, pero no está ni guardado como versión ni subido a ningún sitio. Aquí entran tres acciones. Las vemos una a una y respondemos de una vez tu duda: *"¿por qué tengo que decir commit si solo quiero subirlo?"*.

### Antes de nada: tú NO dices estas palabras
commit, push y merge son **acciones que hace la IA por dentro**, no cosas que tú tengas que escribir. Tú dices *"súbelo"* o *"publícalo"* y la IA hace lo que haga falta. Así que si tu duda es *"¿por qué tengo que decir commit?"*, la respuesta corta es: **no tienes que decirlo.** Pero para que entiendas qué pasa por debajo (y por qué existe), aquí va la película completa.

### commit — guardar una versión de tu trabajo
Un **commit** es el momento en que tu trabajo suelto se **empaqueta en una versión guardada**, con una etiqueta que dice qué cambiaste. Esa versión se guarda **en tu ordenador**.

Imagínalo así: estás escribiendo y, cuando terminas una parte, metes esas hojas en un **sobre cerrado** y escribes por fuera *"versión 1: añadí el botón de Google"*. Ese sobre cerrado y etiquetado es el commit. **Antes** del commit, tus hojas están sueltas encima de la mesa; **después**, están guardadas como una versión con nombre.

**¿Para qué se hace? (por qué existe)**
1. **Para no perder el avance.** Es un punto de guardado, como en un videojuego. Si más adelante algo se rompe, puedes volver a esta versión que funcionaba.
2. **Para tener un historial.** Cada versión guardada deja constancia de qué cambió y cuándo. Puedes mirar atrás o deshacer hasta cualquier punto.
3. **Porque sin una versión guardada, no hay nada que subir.** (Esto responde tu duda; sigue leyendo.)

**¿En qué momento se hace un commit?** Cuando una parte del trabajo está terminada y merece quedar guardada. En la práctica, la IA hace un commit **justo antes de publicar**, y también en puntos intermedios si el trabajo es largo (para no perder avance).

### push — subir tus versiones guardadas a la nube
Un **push** es **enviar** las versiones que guardaste (los commits) desde tu ordenador a la nube (GitHub). A partir de ahí están **fuera de tu ordenador, a salvo, y son oficiales.** Es **echar los sobres al buzón**.

### AHORA SÍ: "¿por qué no digo solo `push` y ya?"
Porque **`push` no envía 'tu trabajo de ahora mismo': envía los sobres cerrados (los commits).** El correo no manda hojas sueltas de encima de la mesa; solo manda **sobres cerrados y etiquetados**. Así que **para poder enviar algo, antes tiene que existir un sobre** (un commit). No puedes echar al buzón un sobre que nunca cerraste.

Por eso son dos cosas distintas:
- **commit** = cerrar el sobre (guardar la versión) → pasa en tu ordenador.
- **push** = echarlo al buzón (subirlo a la nube).

**Tú no haces esto en dos frases.** Dices *"súbelo"* y la IA **cierra el sobre (commit) y lo echa al buzón (push) de un tirón.** Los dos pasos existen por dentro, pero para ti es **una sola orden**.

¿Y por qué no lo juntan en una sola acción para siempre? Porque a veces conviene **cerrar varios sobres** (varios commits, varios puntos de guardado) mientras trabajas, y **echarlos todos al buzón más tarde** de una vez. Guardar y enviar son cosas distintas: una es *"guardo esta versión"*, la otra es *"mando lo guardado a la nube"*.

### merge — unir una rama a main
El **merge** solo aparece **cuando se trabajó en una rama (un desvío)**. Es el paso de **unir todo el trabajo de la rama a `main`** (la versión oficial). Es **reincorporarte del desvío a la carretera principal**, llevándote contigo todo lo que hiciste en el carril aparte.

### Cómo encajan las tres (esto responde tu duda exacta)

**Caso A — se trabaja DIRECTO en la carretera principal (main), sin desvío:**
```
1. commit  (se cierra el sobre)
2. push    (se echa al buzón → main)
```
👉 Aquí **NO hay merge**, porque no hubo ningún desvío que unir.

**Caso B — se trabaja en un desvío (una rama):**
```
1. commit  (se cierra el sobre, dentro de la rama)
2. push    (se sube la rama a la nube)
3. merge   (se une la rama a main → ahora sí es oficial)
```
👉 Aquí el **merge es un paso EXTRA al final**, porque hubo un desvío que reincorporar.

### "¿Puedo decir solo 'haz merge' en vez de commit + push?"

**No exactamente, y este es el motivo:** el merge **une sobres ya cerrados (commits)** de la rama a main. Si no se cerró ningún sobre primero (si no hay commits), **no hay nada que unir.** Por eso el merge **no sustituye** al commit ni al push: es un paso **adicional** que solo tiene sentido cuando ya hay sobres cerrados y subidos en una rama.

En corto:
- **commit** = cerrar el sobre.
- **push** = echarlo al buzón.
- **merge** = juntar los sobres de la rama con los de la versión oficial.

No puedes "juntar" (merge) sobres que nunca cerraste (commits).

### Lo importante para ti como director

**Tú NO necesitas decir ninguna de estas palabras.** Son **las herramientas de la IA**, no tu vocabulario obligatorio. Tú dices la **intención** y la IA hace la secuencia correcta:

| Lo que TÚ dices | Lo que la IA hace por debajo |
|---|---|
| *"Guárdalo por si acaso"* (un punto de guardado a medias) | **commit** |
| *"Súbelo" / "Publícalo" / "Ponlo live"* | **commit + push** (y **+ merge** si estaba en una rama) + se publica solo |
| *"Únelo a lo oficial" / "Pásalo a main"* | **merge** (usando los commits que ya hay) **+ push** |

**Regla mental para ti:** normalmente solo usas **una** frase: **"publícalo"**. La IA se encarga de cerrar el sobre, echarlo al buzón y, si hacía falta, unir la rama. Tú diriges el destino; la IA elige los pasos.

---

## 4 · ¿main o rama? (tú no lo decides — lo decide la IA)

**Aclaración primero:** tú **no** tienes que decirle "abre una rama" o "hazlo en main". **Le das tu idea, y la IA decide sola dónde trabajar** (directo o en una rama) y te lo dice en su plan. Lo de abajo es solo para que **entiendas por qué** elige una u otra, no para que lo decidas tú. (Si algún día quieres forzarlo, puedes; pero no es lo normal.)

**La regla que sigue la IA, en una frase:**
> **Pequeño y seguro → directo a `main`. Grande, nuevo, o que da miedo romper → primero una `rama`.**

**¿Por qué?** Una rama deja trabajar en algo gordo **sin poner en peligro la web que ya funciona**. Para un cambio minúsculo, abrir una rama es matar moscas a cañonazos; para uno grande, ir directo a `main` es jugar con fuego.

Para cambiar una bombilla, lo haces directamente (main). Para tirar una pared, primero montas andamios y proteges los muebles (una rama), porque puede salir mal y no quieres que te pille toda la casa por medio.

| Lo que se va a hacer | ¿Puede romper algo? | Va a… | Por qué |
|---|---|---|---|
| Cambiar un texto, un color, un margen | Casi nada | **`main` directo** | Es trivial y lo quieres ya |
| Arreglar un bug pequeño | Poco | **`main` directo** | Arreglo acotado, sin peligro |
| Crear una **función nueva** | Bastante (código nuevo) | **`rama` → merge** | Si falla, `main` sigue intacto |
| Un **rediseño grande** | Bastante | **`rama` → merge** | Se prueba entero antes de oficializar |
| Un **experimento** ("a ver si me gusta") | Medio | **`rama` desechable** | Si no gusta, se tira y no pasó nada |
| Un **bug delicado** (pagos, login, datos) | **Mucho** | **`rama` → merge** | Un fallo aquí hace daño real; hay que probarlo a fondo |

---

## 5 · El paso a paso EXACTO de una sesión de trabajo

Flujo completo, sin saltarse nada, explicado para alguien que empieza de cero. Cada paso: **qué haces**, **qué pasa** y **por qué**.

### Paso 1 — Abres un chat nuevo con la IA
Empiezas una conversación limpia con tu asistente. Todavía no le pides nada.

### Paso 2 — Le das CONTEXTO con nuestro skill `primer`
Antes de pedir nada, tienes que poner a la IA al día sobre tu proyecto. Eso se hace con **nuestro skill `primer`**: **escribes `/primer` en el chat** y lo lanzas. Con eso la IA **lee tu proyecto entero** (qué hay hecho, qué reglas hay, dónde está cada cosa) y queda lista para trabajar con criterio.

- **Por qué:** la IA **no recuerda** lo que hicisteis en otro chat. Cada chat empieza en blanco. Si no lanzas `primer`, la IA trabaja a ciegas, repite cosas o se inventa. `primer` es lo que le da la memoria del proyecto en esta sesión.
- Es como cuando entra **alguien nuevo a tu equipo**: antes de mandarle una tarea, le enseñas la oficina y le cuentas en qué estáis. `primer` es ese "ponte al día" en un solo paso.

### Paso 3 — Le explicas tu IDEA (qué quieres)
Le escribes, en lenguaje normal, el resultado que buscas. Ejemplo: *"quiero que los usuarios puedan entrar con su cuenta de Google"*.

- **Por qué así:** tú describes el **destino**, no el camino. El "cómo" (el código) es trabajo de la IA.
- **No le dices dónde hacerlo.** No tienes que decir "en una rama" ni "en main". Con tu idea, la IA ya sabe decidirlo (Paso 4).

### Paso 4 — La IA te propone un PLAN y tú lo APRUEBAS
La IA te responde en el chat con: **qué va a hacer** (los pasos) y **dónde lo hará** (directo en `main` o en una rama, y por qué). Y te pregunta si le das luz verde. Tú respondes *"sí, adelante"* (o le ajustas algo).

- **Por qué:** para **acordar ANTES de gastar trabajo**. Si construye sin acordar y no era lo que querías, se tiran horas a la basura. El plan es tu punto de control.
- **"Aprobar" es simplemente decir que sí** a ese plan. No es nada técnico; es dar el OK para que empiece.

### Paso 5 — La IA CONSTRUYE en localhost (tu taller)
La IA escribe el código en tu ordenador. Todavía no está en internet ni lo ve nadie. Tú, mientras, no tocas nada: esperas a que te diga que está listo para mirar.

- **Por qué en local:** porque aquí se puede **crear, romper y rehacer sin consecuencias**. Nunca se construye "en vivo" delante de los usuarios.

### Paso 6 — Lo VES tú en el navegador (en localhost)
Abres tu navegador en la dirección `localhost:...` (la IA te dice cuál) y ahí está tu cambio funcionando de verdad. Lo pruebas con tus manos: haces clic, rellenas, navegas.

- **Por qué:** para comprobar con tus propios ojos que es lo que querías. Es tu **pase privado** de la película antes del estreno: solo tú en la sala.

### Paso 7 — Das FEEDBACK y se REPITE hasta que esté bien
Si algo no te convence, se lo dices tal cual (*"el botón muy pequeño"*, *"que sea dorado"*). La IA lo ajusta y **vuelves al Paso 6** a mirarlo otra vez. Esto se repite las veces que haga falta.

- **Por qué:** casi nada sale perfecto a la primera. Se pule en vueltas cortas.

### Paso 8 — Cuando te gusta, dices "PUBLÍCALO"
Con una sola frase (*"súbelo" / "ponlo live" / "publícalo"*), la IA hace por debajo lo que toque, sin que tú pienses en ello:
- guarda la versión (**commit**),
- la sube a la nube (**push**),
- y si estaba en una rama, la une a `main` (**merge**).

- **Por qué una sola frase:** como director, tú solo decides el destino ("quiero verlo publicado"); los pasos técnicos los pone la IA.

### Paso 9 — Se PUBLICA solo → live en producción
En cuanto el cambio llega a `main`, tu web real se actualiza **sola**. Ahora sí lo ve todo el mundo.

- **Por qué automático:** para que no haya un paso manual que se pueda olvidar. Lo que llega a `main`, llega a los usuarios.

### Paso 10 — Se VERIFICA en producción y se CIERRA
La IA comprueba que el cambio está **de verdad** en tu web pública (no solo en tu ordenador). Y tú das el **OK final** de que está terminado.

- **Por qué:** "funciona en mi ordenador" no basta; lo que importa es la web real. Y el cierre lo decides **tú**, no la IA.

---

## 6 · Ejemplos completos, de principio a fin

### Ejemplo A — Crear una FUNCIÓN NUEVA (entrar con Google)
1. **Abres el chat** y **escribes `/primer`** para darle contexto.
2. **Le dices:** *"Quiero que los usuarios puedan entrar con su cuenta de Google."*
3. **La IA propone plan:** "necesita un botón de Google, conectar con Google y guardar al usuario; como es una función nueva, la haré en una **rama** para no tocar tu web actual. ¿Adelante?" → **tú apruebas.**
4. **La IA construye en localhost**, dentro de esa rama.
5. **Tú lo ves en el navegador** (`localhost:...`) y pruebas a entrar con Google tú mismo. El botón está pequeño.
6. **Feedback:** *"hazlo más grande y dorado"* → la IA ajusta → lo miras otra vez → ahora sí.
7. **Dices "publícalo".** La IA guarda la versión (commit), la sube (push) y **une la rama a `main`** (merge).
8. **Se publica solo →** entrar con Google ya está **live** en tu web real.
9. **La IA verifica en producción** y tú das el **OK**. Cerrado.

Montaste una **habitación nueva** en tu casa. Como era obra grande, la hiciste en una zona acordonada (la rama) para no llenar de polvo el resto. Cuando quedó perfecta, uniste esa habitación al resto de la casa (merge).

### Ejemplo B — Arreglar un BUG PEQUEÑO (botón que no guarda en móvil)
1. **Abres el chat** y **escribes `/primer`.**
2. **Le dices:** *"El botón de guardar no funciona en el móvil."*
3. **La IA primero reproduce el fallo** (consigue que falle) para entenderlo.
   - **Por qué:** sin ver el fallo con sus propios ojos, arreglaría a ciegas y quizá no lo arregla.
4. Es **pequeño y seguro** → la IA lo hace **directo en `main`** (sin rama).
5. **La IA lo arregla en localhost** y prueba que ahora **sí** guarda en el móvil.
6. **Tú lo confirmas** en el navegador (localhost).
7. **Dices "súbelo".** La IA guarda la versión (commit) y la sube (push) a `main`.
8. **Se publica solo →** arreglado y **live.** La IA verifica en prod.

Se te fue una bombilla y la cambias en el momento, sin acordonar nada. Cosa de dos minutos.

### Ejemplo C — Un EXPERIMENTO ("a ver si me gusta")
1. **Contexto con `/primer`** + **le dices:** *"Quiero ver cómo quedaría el panel con las tarjetas en otro estilo, pero no sé si me gustará."*
2. La IA lo hace en una **rama desechable** (un "a ver qué tal"), sin tocar lo oficial.
3. **Lo ves en el navegador** (localhost).
4. **Dos finales posibles:**
   - **Te gusta** → dices *"publícalo"* → se une a `main` → **live.**
   - **No te gusta** → dices *"tíralo"* → se **borra la rama** y **no pasó absolutamente nada** en tu web real.

Pintas una pared en un **lienzo aparte** para ver el color. Si te gusta, lo llevas a la pared de verdad. Si no, tiras el lienzo y tu pared sigue igual.

### Ejemplo D — Un BUG DELICADO (fallo cobrando a clientes)
1. **Contexto con `/primer`** + **le dices:** *"A veces al cobrar no se registra el pago."*
2. Aunque es un bug, **toca dinero** → la IA lo trabaja en una **rama** (no directo a `main`).
   - **Por qué:** un error aquí puede cobrar de más o perder registros. Hay que probarlo a fondo y aislado.
3. **La IA investiga, reproduce el fallo, lo arregla en la rama** y prueba muchos casos.
4. **Tú revisas** y, cuando está **seguro** → *"publícalo"* → se une a `main` → **live** → **verificar en prod con lupa.**

Un problema en la **caja registradora** de tu tienda: no te pones a trastear con clientes delante. Llevas la caja al **taller** (la rama), la arreglas, la pruebas mil veces, y solo cuando estás seguro la devuelves a la tienda.

---

## 7 · Chuleta: qué dices TÚ vs qué hace la IA

| Lo que quieres | Lo que dices (en cristiano) | Lo que hace la IA por debajo |
|---|---|---|
| Empezar bien la sesión | *Escribes `/primer`* | Lee tu proyecto entero y coge contexto |
| Pedir algo | *"Quiero que… [idea]"* | Propone un plan (y decide main o rama) y espera tu OK |
| Ver el avance | *(abres `localhost:...` en el navegador)* | Ya lo construyó ahí para que lo mires |
| Pulir | *"Cambia esto, ajusta lo otro"* | Modifica y te lo enseña otra vez |
| Publicar | *"Súbelo / Publícalo / Ponlo live"* | commit + push (+ merge si había rama) + se publica |
| Guardar a medias | *"Guárdalo por si acaso"* | commit (solo la versión, sin publicar) |
| Descartar un experimento | *"Tíralo"* | Borra la rama; tu web no se entera |
| Dar por terminado | *"OK, ciérralo"* | Verifica en prod y marca hecho |

---

## 8 · Errores típicos de quien empieza (evítalos)

- ❌ **Pedir sin lanzar `primer` primero** → la IA se inventa cosas. **Contexto SIEMPRE al principio.**
- ❌ **Querer meter algo grande directo a `main`** → si rompe, rompe tu web real. Eso va en una rama (y la IA ya lo decide).
- ❌ **Dar algo por bueno sin mirarlo tú en el localhost** → "funciona" no siempre es "es lo que yo quería".
- ❌ **Creer que "guardado" = "publicado"** → una versión guardada (commit) sin subir (push) está **solo en tu ordenador**.
- ❌ **Decir "está hecho" antes de verlo live en producción** → localhost no es la web real.

---

## 9 · Glosario rápido

| Palabra | Qué es | Con qué compararlo |
|---|---|---|
| **Localhost** | Tu web funcionando dentro de tu ordenador, solo para ti | Tu taller / restaurante antes de abrir |
| **Navegador** | El programa para ver webs (Chrome, Safari) | La ventana por la que miras la web |
| **Rama (branch)** | Zona de trabajo aparte, sin tocar lo oficial | Un desvío de la carretera |
| **main** | La versión oficial, en la nube | La carretera principal |
| **Producción ("prod")** | Tu web real, pública, que usa todo el mundo | El restaurante abierto al público |
| **Commit** | Guardar una versión de tu trabajo (en tu ordenador) | Cerrar un sobre etiquetado / punto de guardado |
| **Push** | Subir tus versiones guardadas a la nube | Echar los sobres al buzón |
| **Merge** | Unir una rama a `main` | Volver del desvío a la carretera |
| **Deploy** | Publicar la web (se hace solo al llegar a `main`) | Abrir las puertas del restaurante |
| **Build** | Preparar/montar el proyecto para que funcione | Montar el mueble antes de usarlo |

---

*Borrador de trabajo. Cuando esté "exacto", se convierte en el documento visual formativo.*
