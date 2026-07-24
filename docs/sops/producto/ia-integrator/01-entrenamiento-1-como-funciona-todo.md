---
title: Entrenamiento 1 · Cómo funciona todo
order: 1
---

> **Versión visual**: guía `entrenamiento-1` en la App, dentro del [hub de recursos de la formación](https://app.capitalhubapp.com/training/formations/1/hub). El código vive en el repo `capital-hub-app` (`web/src/features/guides/entrenamiento-1/`), no en el OS.

# Entrenamiento 1 · Cómo funciona construir un software con IA

## Qué es esto

**Construyes software hablándole a una IA.** Tú dices qué quieres lograr; ella escribe el código, lo prueba y lo deja funcionando.

Este entrenamiento explica **cómo funciona eso por dentro.** No vas a escribir código en ningún momento, ni aquí ni después.

## Por qué necesitas entenderlo

Porque **tú vas a decidir qué se construye y qué sale a internet.** Para decidir bien tienes que saber dónde vive tu trabajo, qué es cada herramienta, y qué acciones no tienen vuelta atrás.

## Qué vas a ver, en orden

```
 0 · Las palabras que vas a oír
 1 · Quién hace qué: tú y la IA
 2 · Tu proyecto es una carpeta
 3 · Tus herramientas
 4 · El viaje de tu código
 5 · LA REGLA DE ORO           ← lo más importante
 6 · Tus API keys y dónde se guardan
 7 · La base de datos
 8 · Por qué se parte de un sistema ya montado
 9 · Las skills: las órdenes de tu sistema
10 · El contexto: lo que la IA puede tener en la cabeza a la vez
11 · Cómo construye la IA dentro de tu sistema
12 · Las reglas
```

---

# 0 · Las palabras que vas a oír

Empezamos por aquí porque sin esto el resto no se entiende.

## Un software tiene dos mitades

```
FRONTEND  →  lo que el usuario VE y TOCA
BACKEND   →  lo que pasa POR DETRÁS, que el usuario no ve
```

### FRONTEND
**Todo lo que se ve en la pantalla:** los botones, los textos, los colores, los formularios.

Si abres tu web y ves un botón que dice "Comprar", **eso es frontend.**

### BACKEND
**Todo lo que ocurre por detrás cuando alguien usa tu web.**

Haces clic en "Comprar" y algo tiene que: comprobar que iniciaste sesión, mirar si queda producto, cobrar, guardar el pedido y mandarte el correo. **Nada de eso se ve. Todo eso es backend.**

**Para qué te sirve saberlo:** cuando algo falle, vas a poder decir dónde. *"El botón no se ve bien"* es frontend. *"Hago clic en comprar y no me llega el correo"* es backend.

## Dentro del frontend: UI y UX

### UI · *User Interface*, interfaz de usuario
**Cómo se ve.** Los colores, las tipografías, el tamaño de los botones, la separación entre las cosas.

### UX · *User Experience*, experiencia de usuario
**Cómo se usa.** Si es fácil llegar a lo que buscas, si se entiende qué hacer, si hacen falta tres pasos o siete.

> **La UI es cómo se ve. La UX es lo fácil que resulta usarlo.**
>
> Una web puede ser preciosa y aun así ser un infierno para comprar.

## Dónde se guarda la información: la base de datos

**El frontend y el backend son CÓDIGO:** instrucciones escritas en archivos de tu carpeta.

**La información NO es código.** Las cuentas de tus usuarios, sus compras, sus mensajes: eso vive en un sitio aparte llamado **base de datos**.

```
FRONTEND        el usuario hace clic en "ver mi perfil"
    ↓
BACKEND         recibe la orden y va a buscar los datos
    ↓
BASE DE DATOS   devuelve: nombre, correo, sus compras
    ↓
FRONTEND        los pinta en la pantalla
```

**Los tres trabajan juntos en cada clic.**

**Cómo está organizada por dentro:** en **tablas**. Una tabla es una lista de cosas del mismo tipo: la tabla de usuarios, la tabla de pedidos. Cada tabla tiene **campos**: la de usuarios tiene el campo nombre, el campo correo, el campo teléfono.

## Cómo hablan entre ellos: la API

### API · *Application Programming Interface*, interfaz de programación

**Es el punto de entrada por el que dos programas se piden cosas entre sí.**

Tu frontend no entra en la base de datos por su cuenta. **Se lo pide al backend a través de una API**: *"dame los datos del usuario 47"*. La API responde.

**Y también funciona hacia fuera.** Tu web no sabe cobrar con tarjeta. Lo que hace es **hablar con la API de Stripe**: *"cóbrale 50 euros a esta tarjeta"*. Stripe cobra y responde *"hecho"*.

> **Cada vez que tu software usa un servicio externo, lo hace a través de su API.**

### API KEY · el código de acceso a esa API

**Para usar la API de un servicio, ese servicio te da una API key.**

Es un texto largo, tipo `sk_live_ESTO_ES_UN_EJEMPLO...`, que identifica que la petición viene de tu cuenta.

**Lo importante de todo el punto:**

> **Una API key NO es una contraseña de las que tú escribes en una pantalla.**
>
> La usa **tu programa**, sin que nadie la teclee. **Quien tenga esa cadena de texto, tiene tu cuenta.** No hay usuario, ni segundo paso, ni nada.

**Vas a tener varias:** la de tu base de datos, la de tu servicio de correos, la de tu pasarela de cobros. De dónde se guardan va el punto 6.

## Resumen

| Palabra | Qué es |
|---|---|
| **Frontend** | Lo que se ve y se toca |
| **Backend** | Lo que ocurre por detrás |
| **UI** | Cómo se ve |
| **UX** | Lo fácil que resulta usarlo |
| **Base de datos** | Donde vive la información de tus usuarios |
| **Tabla** | Una lista de cosas del mismo tipo dentro de la base de datos |
| **Campo** | Cada dato de esa lista: nombre, correo, teléfono |
| **API** | El punto de entrada por el que dos programas se piden cosas |
| **API key** | El código de acceso a una API. Quien lo tiene, entra |

---

# 1 · Quién hace qué

| Tú | La IA |
|---|---|
| Dices qué quieres lograr | Decide cómo hacerlo |
| Apruebas el plan | Escribe el código |
| Miras el resultado | Lo prueba y lo corrige |
| Decides cuándo sale a internet | Lo publica cuando tú lo dices |

**Ella construye todo lo que le pidas. Publicar es tuyo.**

## Cómo se le habla: dile el objetivo

**Le dices QUÉ quieres lograr. No CÓMO hacerlo.**

El cómo es su trabajo: qué archivos tocar, qué tecnología usar, en qué orden.

```
Objetivo claro:
"Quiero que mis clientes puedan reservar una cita desde mi web
 y que me llegue un aviso cuando alguien reserve."

Objetivo poco claro:
"Quiero mejorar la web."
```

**Si tú no tienes claro tu objetivo, ella tampoco.**

---

# 2 · Tu proyecto es una carpeta

Tu software es **una carpeta** en tu ordenador, con cientos de archivos dentro.

Cuando abres esa carpeta y arrancas un chat, **la IA trabaja con los archivos de esa carpeta.** No abre tus otros proyectos ni tus documentos personales.

## Carpeta madre y carpeta de proyecto

```
Mis-Proyectos          ← la carpeta MADRE
   ├── mi-tienda       ← un proyecto
   ├── mi-app          ← otro
   └── mi-web          ← otro
```

**Abres SIEMPRE la carpeta del proyecto. NUNCA la madre.**

**Por qué:** si abres la madre, la IA ve tres proyectos mezclados y va a tocar archivos del equivocado.

## Los chats no viajan

**Cada proyecto tiene sus propios chats.** Si abres otro proyecto, esos chats no están.

**Y cada chat empieza en blanco**, incluso dentro del mismo proyecto.

**Por eso lo primero que se escribe en un chat nuevo es `/primer`**, una orden que hace que la IA lea tu proyecto entero y se ponga al día. Las órdenes con barra son las **skills**, y van en el punto 9.

---

# 3 · Tus herramientas

## El IDE

**IDE** significa *Integrated Development Environment*: **entorno de desarrollo integrado.** Es **el programa donde se abre tu proyecto y donde ocurre todo tu trabajo.**

Se llama "integrado" porque junta en una sola ventana todo lo que necesitas:

```
┌─────────────┬──────────────────────┬──────────────┐
│  ARCHIVOS   │   El archivo abierto │   EL CHAT    │
│  de tu      │                      │   con la IA  │
│  proyecto   │                      │              │
│             ├──────────────────────┤              │
│             │   LA TERMINAL        │              │
└─────────────┴──────────────────────┴──────────────┘
```

**Los tres más usados: Antigravity, VS Code y Cursor.** Los tres sirven igual para esto. Elige uno y quédate con él.

## La terminal

**Es donde le das órdenes escritas al ordenador**, en lugar de con clics.

**Existe de dos formas:** como programa suelto de tu ordenador, y **como panel dentro del IDE**. Son la misma cosa. **Aquí siempre vas a usar la del IDE**, para no saltar entre ventanas.

**Para qué la vas a usar:** instalar programas y arrancar tu proyecto. Casi siempre pegando algo que la IA te da.

**Cómo saber si puedes escribir en ella:** mira el cursor, el cuadradito que parpadea al final de la línea.

```
Cuadradito RELLENO  →  la terminal está activa. Puedes escribir.
Cuadradito HUECO    →  no estás dentro de la terminal.
                       Haz clic sobre ella primero.
```

**Es el tropiezo más común al empezar:** escribir creyendo que estás en la terminal y que no aparezca nada.

**Y cuando escribas una contraseña ahí, no vas a ver nada.** Ni puntos ni asteriscos. Está escribiendo. Es a propósito.

## El chat con la IA

**No es el chat que trae el IDE de fábrica.**

Los IDE modernos vienen con su propio asistente incluido. **Ese no es el que vas a usar.**

**El tuyo se instala aparte, como una extensión.** Una **extensión** es un añadido que instalas dentro del IDE desde su propio catálogo, en un panel que se llama Extensiones. Lo vas a hacer en el setup.

**Por qué importa:** el chat de fábrica **no conoce tus reglas, no puede ejecutar tus procedimientos y no entra en tu base de datos.** Te va a dar respuestas genéricas que no encajan con tu proyecto.

## Los MCPs

**MCP** significa *Model Context Protocol*: **protocolo de contexto para modelos.**

Es **un estándar que permite conectar una IA con una herramienta externa.** Cada conexión de esas es "un MCP".

```
SIN MCPs   →  la IA escribe código y no sabe si funcionó.

CON MCPs   →  entra en tus herramientas y trabaja dentro de ellas.
              Comprueba el resultado y lo corrige sola.
```

**Vas a instalar tres. Estos son sus nombres reales:**

| MCP | Qué le permite hacer |
|---|---|
| **Supabase** | Entrar en tu base de datos: crear tablas, consultar datos, poner la seguridad |
| **Playwright** | Abrir tu web en un navegador de verdad y comprobar que se ve bien |
| **Next.js DevTools** | Ver los errores de tu proyecto mientras se ejecuta |

**Ejemplo concreto:** le pides una pantalla nueva. Sin MCPs la escribe y te dice "listo". Con MCPs la escribe, **abre tu web en un navegador, ve que un botón se sale en el móvil, lo arregla y vuelve a mirar.**

---

# 4 · El viaje de tu código

Tu código pasa por cuatro lugares, siempre en el mismo orden.

```
   ── TU ORDENADOR ──        ── INTERNET ──
1. LOCALHOST  →  2. RAMA  →  3. GITHUB  →  4. PRODUCCIÓN
   pruebas       aparte       tu proyecto   tu web pública
   solo tú                    en internet   todo el mundo
```

## 1 · Localhost

**Tu web corriendo dentro de tu ordenador.** Se abre en el navegador en una dirección tipo `localhost:3000`.

**Solo la ves tú.** Nadie más puede entrar, aunque le pases el enlace.

**Para qué:** construir y probar sin consecuencias.

**Ese número del final es el puerto.** Un **puerto** es un número que identifica a qué programa de tu ordenador va cada conexión. Tu ordenador puede tener varias webs corriendo a la vez, y cada una usa un puerto distinto. Si el 3000 está ocupado, se abre en el 3001. **Por eso conviene pedirle la dirección a la IA en vez de escribirla de memoria.**

## 2 · Rama

**Una versión paralela de tu proyecto donde se trabaja sin tocar la que ya funciona.**

- La versión que ya funciona se llama **`main`**
- Mientras se trabaja en la rama, `main` sigue exactamente igual
- Si sale mal, se descarta la rama y `main` no se ha alterado

**Cuándo se usa:** algo nuevo, grande o delicado (cobros, cuentas de usuario, datos). Para un texto o un color no hace falta.

**Lo decide la IA.** Tú no tienes que pedirlo.

## 3 · GitHub

**GitHub es donde vive tu proyecto en internet.**

Tu carpeta está en tu ordenador. **GitHub tiene una copia de esa carpeta en internet**, con todo su historial.

Sirve para tres cosas:

1. **Copia de seguridad.** Si tu ordenador muere, tu proyecto sigue ahí.
2. **Es de donde se publica tu web.**
3. **Es el punto de encuentro** si trabajan varias personas.

**Tu proyecto tiene la misma estructura en los dos sitios:** su `main` y sus ramas.

```
TU ORDENADOR              GITHUB
   main                     main        ← las dos versiones de lo mismo
   rama "cobros"            (vacío)     ← hasta que subes tu rama
```

**`main` es la versión oficial**, y existe en los dos sitios. **La que cuenta es la de GitHub**, porque es la que se publica.

> **El `main` de GitHub tiene que estar siempre igual o más nuevo que tu web. Nunca más viejo.**

## 4 · Producción

**Tu web pública.**

Para que esto funcione hay que conectar **un servicio de publicación** a tu GitHub. Es un servicio externo que vigila tu proyecto y publica tu web cada vez que cambia. **Se conecta una sola vez, en el setup, y ya no lo tocas más.**

A partir de ahí, en cuanto algo entra en el `main` de GitHub:

```
1. GitHub avisa al servicio de publicación
2. Tu web se COMPILA          ← 2-4 minutos
3. Tu web pública sirve el código nuevo
```

**Compilar** es montar tu web con todas sus piezas antes de servirla. Puede fallar si una pieza no encaja.

> **Si la compilación falla, tu web no se toca.** Sigue funcionando como antes. Un error de código no puede tumbar tu web.

---

## Las 4 palabras del viaje

Tú nunca las vas a escribir. **Pero cuando la IA te diga que hizo una, tienes que saber qué acaba de pasar.**

### COMMIT · guardar
**Guarda el estado de tu proyecto en ese momento**, con una nota de qué cambió. Queda **en tu ordenador, solo ahí.** La IA lo hace sin pedirte permiso.

> **Un commit no está publicado.**

### PUSH · subir a GitHub
Manda a GitHub lo que has guardado en tu ordenador. **Hasta que no se hace push, tu trabajo no tiene copia de seguridad y no puede publicarse.**

### PULL · bajar de GitHub
Lo contrario: trae a tu ordenador lo que haya en GitHub. **Lo necesitas si trabajan varias personas, o si usas dos ordenadores.**

### MERGE · unir tu rama con main
Coge lo que hiciste en tu rama y lo mete en `main`.

## Merge y push no son lo mismo

```
MERGE  = unir tu rama con main.  Ocurre EN TU ORDENADOR.  No sale nada.
PUSH   = subir main a GitHub.    ESTE es el que publica.
```

El merge por sí solo **no publica nada.** Es el push el que enciende todo lo demás.

Cuando publicas, la IA hace los dos seguidos. Por eso parece una sola acción. **Pero si algún día algo "no aparece" en tu web, la causa casi siempre es esta: se hizo el merge y no el push.**

---

# 5 · LA REGLA DE ORO

## Los archivos de tu carpeta son los de la rama activa

Cuando se cambia de rama, **esos archivos se reemplazan** por los de la otra rama. Solo hay un juego de archivos: el de la rama que esté puesta.

Por eso **una carpeta solo puede tener una rama a la vez.**

## Y por eso: una carpeta = una rama = un chat

Mucha gente cree que la rama vive en el chat. **No: vive en la carpeta.** Todos los chats que abras ahí trabajan sobre **los mismos archivos**.

**Qué pasa si abres dos chats en la misma carpeta:**

```
1. Chat 1: trabaja en la rama "cobros".
2. Chat 2: le pides otra cosa y cambia a la rama "calendario".
   Los archivos de la carpeta pasan a ser los de calendario.
3. El chat 1 no se enteró. Sigue creyendo que está en cobros.
   Todo lo que escriba se guarda en calendario.
4. La rama de calendario acaba con código de cobros dentro.
   Nadie lo nota hasta que algo revienta días después.
```

```
UNA ventana del IDE  =  UNA carpeta  =  UNA rama  =  UN chat
```

## Si necesitas hacer dos cosas a la vez

**Lo normal: no lo necesitas.** Termina una, publícala, empieza la otra.

**Si de verdad lo necesitas:** se lo pides a la IA y **ella prepara una carpeta de trabajo aparte**, conectada al mismo proyecto. Tú no la copias a mano: la crea ella, y cuando terminas, la borra.

> **Esto no es lo mismo que duplicar tu proyecto.** Duplicarlo tú a mano es lo que está prohibido (regla 3). Lo que hace la IA es abrir una segunda vista del mismo proyecto, no una copia suelta.

## Nunca guardes tu proyecto en una nube que sincroniza sola

iCloud, Drive o Dropbox **duplican, renombran y a veces corrompen archivos** sin avisar. Acabas con dos carpetas parecidas y un día abres la que no toca.

**Tu proyecto va en una carpeta normal de tu ordenador. La copia de seguridad la hace GitHub.**

---

# 6 · Tus API keys y dónde se guardan

Ya sabes qué es una API key: el código de acceso que usa tu programa para entrar en un servicio.

## El problema

Tu código necesita la API key para funcionar. Pero **tu código viaja**: sube a GitHub, se comparte, se descarga.

**Si la key está escrita dentro del código, viaja con él.**

## La solución: la variable de entorno

**Una variable de entorno es un dato que vive fuera del código, en un archivo aparte, y que tu programa va a buscar cuando arranca.**

**MAL — la key dentro del código:**
```
conectar_a_stripe("sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY")
```
Esa línea está en un archivo de tu carpeta. **Sube a GitHub con la key dentro.**

**BIEN — la key fuera del código:**
```
conectar_a_stripe(STRIPE_KEY)
```
Aquí `STRIPE_KEY` **no es la key: es su nombre.** Una etiqueta que dice *"ve a buscar el valor guardado con este nombre"*.

**¿Y dónde está el valor de verdad?** En un archivo aparte llamado **`.env.local`**:

```
STRIPE_KEY=sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
RESEND_KEY=re_8fH2kL9mNp...
```

**Ese archivo nunca sube a GitHub.** Se queda en tu ordenador.

**Resultado:** tu código puede ir a donde sea, porque **no lleva ninguna key dentro**. Solo lleva los nombres.

## El otro archivo de claves: `.mcp.json`

Tu proyecto tiene **dos** archivos con claves:

```
.env.local    las keys que usa TU WEB
.mcp.json     las keys que usa LA IA para entrar en tus herramientas
```

**En el setup vas a pegar claves en los dos.** Los dos se protegen igual: nunca suben a GitHub.

## Cómo te protege el sistema

**Tres capas, ya puestas.** No configuras nada:

**1 · Los dos archivos están excluidos desde el primer día.** Hay una lista de lo que nunca sube a GitHub, y los dos están en ella desde antes de que escribas la primera línea.

**2 · La IA tiene prohibido leer su contenido.** Puede comprobar que una key existe, pero **no puede ver su valor**. Así no acaba escrita en el historial de un chat.

**3 · El proyecto trae un archivo de ejemplo** con los nombres y los valores vacíos, para que sepas qué keys necesitas.

## Lo único que te toca a ti

**No sacar las keys de sus archivos.** Ni a un chat, ni a un correo, ni a un mensaje. **Tampoco a la IA.**

**Por qué:** si una key llega a GitHub, cualquiera entra en tu cuenta de ese servicio. **Y queda registrada en el historial**, así que borrarla del archivo no basta: hay que pedir una nueva y cambiarla en todos lados.

---

# 7 · La base de datos

**Ya la viste en el punto 0: es donde vive la información de tus usuarios, organizada en tablas y campos.**

Aquí va lo que la hace distinta de todo lo demás, y es lo más delicado del entrenamiento.

## Tu código tiene marcha atrás. Tu base de datos no

**Cada vez que la IA guarda un punto de control, queda una versión más del código, y ninguna se borra.** Si algo se rompe, se vuelve a la de ayer.

**En la base de datos no hay nada de eso.** Si borras una fila, no hay una versión de ayer a la que volver desde tu proyecto.

```
CÓDIGO            todas las versiones guardadas  →  vuelves atrás cuando quieras
BASE DE DATOS     no hay versiones               →  lo borrado, borrado
```

> Los servicios de base de datos suelen hacer copias de seguridad diarias por su cuenta, pero **recuperarlas es un proceso aparte, lento, y se pierde todo lo que pasó desde la última copia.** No es marcha atrás.

## Y solo hay una

```
Tu web en tu ordenador     ┐
                           ├──►   LA MISMA BASE DE DATOS
Tu web publicada           ┘
```

**Cuando arrancas tu web en tu ordenador para probar, no se conecta a una copia de prueba. Se conecta a la de verdad**, la que están usando tus usuarios en ese momento.


---

# 8 · No reinventes la rueda

Podrías empezar con una carpeta vacía y decirle a la IA "constrúyeme una web". **Esto es lo que pasa cuando lo haces.**

## Sin sistema

**Cada decisión técnica es tuya, y no sabes cuál es la buena.** La IA elige una, tú no puedes juzgarla, y lo descubres tres semanas después cuando ya construiste encima.

**Cada vez que pides lo mismo, sale distinto.** Pides el registro de usuarios hoy y lo hace de una forma. Lo pides el mes que viene en otro chat y lo hace de otra.

**La IA no recuerda nada.** Cada chat empieza en blanco. Le explicas tus preferencias, tus reglas y cómo funciona tu negocio. Mañana, chat nuevo, vuelves a explicarlo todo.

**Los errores se repiten.** Algo falla, lo arreglas, y a la semana vuelve a fallar igual, porque nadie escribió qué pasó.


## Con el sistema

**Nada de eso lo resuelves tú:**

- **Las decisiones técnicas ya están tomadas y probadas.**
- **Los procedimientos ya están escritos.** Pides el registro de usuarios y se monta igual hoy que dentro de un año, con su seguridad puesta.
- **Tus reglas y tu memoria viven en el proyecto.** La IA las lee al empezar cada chat.
- **Los errores quedan registrados solos** y no vuelven.

> **Sin sistema, tu trabajo es vigilar a la IA.**
> **Con sistema, tu trabajo es dar la idea.**

**Y hay algo más, que es lo que más se nota:** ese sistema **obliga a la IA a trabajar de una forma concreta.** De eso va el punto siguiente.

---

# 9 · Las skills: las órdenes de tu sistema

**Una skill es un procedimiento completo guardado.** Escribes una orden en el chat y **se ejecuta entero, siempre igual, sin saltarse pasos.**

**Se escriben con una barra delante.** Cuando pones `/` en el chat **no estás escribiendo una frase: estás ejecutando un procedimiento.**

```
Le pides "monta el registro de usuarios"
   →  la IA improvisa. Hoy lo hace de una forma, mañana de otra.

Escribes /add-login
   →  se ejecuta el procedimiento probado: las tablas, la seguridad,
      las pantallas de entrada y el recuperar contraseña, en su orden.
```

**Esa es la diferencia entre pedir algo y ejecutar un procedimiento.**

## Las que vas a usar

| Skill | Qué hace |
|---|---|
| `/primer` | Lee tu proyecto entero y pone al día a la IA |
| `/prp` | Escribe el plan antes de construir |
| `/new-ecoai` | Monta la base de tu sistema |
| `/add-login` | Cuentas de usuario con su seguridad |
| `/publicar` | Publica tu trabajo y comprueba que llegó a tu web |
| `/cerrar` | Deja el trabajo cerrado antes de cerrar el chat |

**Hay más**, y las tienes todas en el **Catálogo de Skills**.

## Tú puedes crear las tuyas

**Cualquier proceso que repitas en tu negocio** —hacer una factura, publicar contenido, preparar un informe mensual— **puede convertirse en una skill.**

Lo explicas bien una vez. **A partir de ahí sale igual de bien siempre**, sin que vuelvas a explicarlo.

Ese es el objetivo final: que tu sistema no solo construya software, sino que **ejecute los procesos de tu negocio.**

---

# 10 · El contexto: lo que la IA puede tener en la cabeza a la vez

Esto no se suele explicar, y es lo que separa a quien va rápido de quien pierde horas.

## Token

**Es la unidad en la que la IA cuenta el texto.**

En español, **un token son unas 3 o 4 letras**. Una palabra normal son 1 o 2 tokens.

## Ventana de contexto

**Es todo lo que cabe en una conversación.** Y "todo" es literal:

```
Lo que tú escribes
+ Lo que responde la IA
+ TODOS los archivos que lee para trabajar
+ TODOS los resultados de las órdenes que ejecuta
+ Las reglas de tu proyecto, que se cargan enteras al empezar
```

**Lo que más gasta no eres tú: es la IA leyendo archivos.** Un documento largo se come más espacio que una hora de conversación.

## Qué pasa cuando se llena

**La conversación se corta.** Antes de llegar ahí, se compacta.

## Compactar

**Es resumir la conversación entera y seguir con el resumen en lugar del original.**

```
SE CONSERVA     las decisiones, los acuerdos, dónde estás
SE PIERDE       el detalle literal, los matices, lo que dijiste
                con tus palabras exactas
```

**Lo que NO se pierde nunca, porque no vive en la conversación:**

- Los archivos de tu proyecto
- Tu base de datos
- Las reglas y el Knowledge

> **Por eso todo lo importante se escribe.** Lo que solo se dijo en un chat, desaparece.

## Las 4 reglas del contexto

**1 · Un chat, una cosa.**
Mezclar dos temas llena el espacio con el doble de ruido y baja la calidad de los dos.

**2 · Todo lo que importe, escrito.**
En un archivo, en tu base de datos o en el Knowledge. **Nunca solo dicho.**

**3 · Compacta entre tareas, no a mitad.**
A mitad se pierde justo lo que estabas usando.

**4 · Para trabajos que exigen leer mucho, sub-agentes.**
Un **sub-agente** es una IA auxiliar que la principal lanza para una tarea concreta. **Lee lo que haga falta y devuelve solo el resultado.** Todo lo que leyó no ocupa espacio en tu conversación. Se lo pides así: *"lanza sub-agentes para revisar esto"*.

---

# 11 · Cómo construye la IA dentro de tu sistema

**Esto no es cómo trabajan las IAs en general.**

Una IA sin configurar **se pone a escribir código en cuanto le pides algo**. Improvisa, no te enseña un plan y no comprueba lo que hizo.

**La tuya no va a hacer eso, porque el sistema está configurado para impedirlo.** Está obligada a seguir dos pasos.

## Primero: el PRP

**PRP** significa *Product Requirements Proposal*: **propuesta de requisitos del producto.**

**Es el plan de lo que se va a construir, escrito antes de tocar nada.** Contiene:

- Qué entendió de lo que pediste
- Qué va a construir exactamente
- Qué datos hacen falta
- En qué fases lo va a hacer
- Qué decisiones tomó por su cuenta

**Tú lo lees y decides:** está bien, cambia esto, o no es lo que quería.

**Por qué está puesto:** corregir un plan cuesta un minuto. Corregir algo ya construido cuesta horas.

> **Sin tu aprobación no se construye nada.**

## Después: el bucle agéntico

**Es un sistema de agentes de IA que planifican, ejecutan, comprueban y corrigen hasta que la tarea está completa.**

Un **agente** es una IA que además de responder **hace cosas**: abre archivos, escribe código, ejecuta órdenes y revisa el resultado. Por eso puede trabajar sola un rato largo.

Se llama bucle porque **repite el mismo ciclo en cada fase**, y son cuatro:

```
1. DELIMITAR            se define el problema con claridad
2. INGENIERÍA INVERSA   se desarma en piezas pequeñas, mirando cómo
                        está tu proyecto AHORA MISMO
3. PLANEAR              se escribe la lista de tareas antes de tocar código
4. EJECUTAR             se hace tarea por tarea, comprobando cada una
        ↓
   siguiente fase, y vuelve a empezar
```

**En el paso 4 no se avanza hasta que lo anterior funciona.**

**Por qué se mira el proyecto antes de cada fase:** porque cambia mientras se trabaja. Si se decidieran los cuarenta pasos al principio, el paso treinta estaría basado en un proyecto que ya no existe.

## El auto-blindaje

**Cada error que la IA encuentra se documenta automáticamente.**

**Tú no haces nada.** No tienes que apuntarlo ni recordarlo. Ocurre solo, mientras trabaja.

**Por qué importa:** ese registro se consulta en los chats siguientes. **El mismo error no vuelve a ocurrir.**

---

# 12 · Las reglas

**1 · Un solo chat por carpeta.**
Dos chats en la misma carpeta acaban mezclando código de ramas distintas.

**2 · Abre siempre la carpeta del proyecto, nunca la carpeta madre.**
Si abres la madre, la IA ve todos tus proyectos mezclados y toca el que no es.

**3 · No copies ni dupliques la carpeta de tu proyecto.**
Si hay que moverlo o trabajar en dos cosas a la vez, se lo pides a la IA y lo hace ella.

**4 · No guardes tu proyecto en iCloud, Drive ni Dropbox.**
Duplican y renombran archivos sin avisar. La copia de seguridad la hace GitHub.

**5 · Usa tu chat, el que instalaste como extensión.**
El que trae el IDE de fábrica no conoce tus reglas ni puede entrar en tus herramientas.

**6 · Empieza cada chat con `/primer`.**
Es lo que le da a la IA el contexto de tu proyecto.

**7 · No se construye nada hasta que apruebas el plan.**
Si empieza a escribir código sin haberte enseñado el plan, párala.

**8 · Nada se publica hasta que lo pruebas en tu ordenador y lo dices tú.**

**9 · Las API keys nunca salen de `.env.local` ni de `.mcp.json`.**
Ni a un chat, ni a un correo, ni a un mensaje.

---

# El mapa completo

```
        TU ORDENADOR                          INTERNET
┌──────────────────────────────┐      ┌─────────────────────┐
│                              │      │                     │
│  localhost      rama         │      │   GITHUB            │
│  (pruebas)      (aparte)     │      │   (tu proyecto)     │
│       │            │         │      │        │            │
│       └──► commit ──► merge  │─push─►      main           │
│                              │      │        │            │
│         ↑                    │      │        ▼            │
│    solo tú lo ves            │      │    TU WEB           │
└──────────────────────────────┘      └─────────────────────┘
                                             ↑
                                       lo ve todo el mundo
```

---

## Qué viene ahora

**Dos pasos, en este orden:**

```
1. ENTRENAMIENTO 2 · Cómo usar el sistema
   Qué haces tú cada día: qué escribes y en qué orden.

2. EL SETUP DE INSTALACIÓN
   Instalas tus herramientas, creas tus cuentas y
   levantas tu proyecto por primera vez.
```

Cuando en el setup veas una terminal, una API key, un archivo `.env.local` o un MCP, **ya sabes qué es.**
