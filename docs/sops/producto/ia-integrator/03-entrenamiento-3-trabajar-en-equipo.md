---
title: Entrenamiento 3 · Trabajar en equipo
order: 3
---

> **Versión visual**: guía `entrenamiento-3` en la App, dentro del [hub de recursos de la formación](https://app.capitalhubapp.com/training/formations/1/hub). El código vive en el repo `capital-hub-app` (`web/src/features/guides/entrenamiento-3/`), no en el OS.

# Entrenamiento 3 · Trabajar en equipo

**Cuándo:** cuando en tu proyecto va a trabajar más de una persona.

**Si trabajas solo, no lo necesitas.**

**Antes:** los Entrenamientos 1 y 2.

---

# 1 · Lo que cambia

**Nada de lo que aprendiste cambia. Se añaden dos cosas:**

```
1. Antes de trabajar, te bajas lo que hayan subido los demás
2. Cuando terminas, avisas
```

**Cada uno trabaja en su ordenador, en su rama, y publica lo suyo. Sin pedir permiso a nadie.**

---

# 2 · Cómo está montado

```
              GITHUB
        (el proyecto oficial)
           ↙            ↘
      copia de       copia de
        ANA            LUIS
   (su ordenador)  (su ordenador)
```

**Cada persona tiene el proyecto entero en su ordenador.** No comparten carpeta. Se comunican solo a través de GitHub.

---

# 3 · Meter a alguien nuevo

**Lo hace el dueño. Dos cosas.**

## 3.1 · Invitarla en GitHub

```
1. Entras en tu proyecto en GitHub
2. Settings  →  Collaborators  →  "Add people"
3. Escribes su usuario o su correo  →  Add
4. Le llega un correo con la invitación y la acepta
```

## 3.2 · Pasarle las claves

**Los archivos de claves NO están en GitHub.** `.env.local` y `.mcp.json` están excluidos a propósito.

**Consecuencia:** cuando se baje el proyecto, **no le va a arrancar.** No está roto: le faltan las claves.

**Cómo se las pasas:** por un **gestor de contraseñas** — Dashlane, 1Password o Bitwarden. **Nunca por chat, correo ni WhatsApp:** ahí quedan guardadas para siempre.

**Qué le pasas exactamente:** el contenido de tus dos archivos, `.env.local` y `.mcp.json`.

---

# 4 · El primer día de la persona nueva

## 4.1 · Instala las herramientas

Hace **el setup, pero solo hasta la mitad.**

```
SÍ hace:
   Instalar el IDE
   Instalar el chat de la IA (la extensión)
   Crear su cuenta de la IA
   Crear su cuenta de GitHub

NO hace:
   Crear un proyecto nuevo
   /new-ecoai
   /visual-knowledge
   /add-login
   Crear una base de datos
   Conectar un servicio de publicación
```

**Por qué:** el proyecto **ya existe**. Ella no lo crea: se une a uno que está hecho. Todo lo que crea cosas nuevas se lo salta.

## 4.2 · Descarga el proyecto

**Crea una carpeta vacía** donde quiera guardar el proyecto. La abre en el IDE. Abre el chat y escribe:

```
Clona en esta carpeta el repositorio
https://github.com/USUARIO/NOMBRE-DEL-PROYECTO
y deja el proyecto listo para trabajar.
```

**El dueño le pasa ese enlace.** Se copia de la barra del navegador estando dentro del proyecto en GitHub.

**Qué hace la IA:** descarga todos los archivos e instala lo que el proyecto necesita para funcionar.

## 4.3 · Pone las claves

**El proyecto ya está en su ordenador, pero todavía no arranca.** Le faltan las claves.

Escribe en el chat:

```
Crea los archivos .env.local y .mcp.json con los nombres
de las claves que necesita este proyecto, y déjalos vacíos.
```

**La IA crea los dos archivos con los nombres y los huecos en blanco**, así:

```
SUPABASE_URL=
SUPABASE_KEY=
RESEND_KEY=
```

**Entonces ella abre esos dos archivos y pega los valores** que el dueño le pasó por el gestor de contraseñas, cada uno detrás de su nombre.

**Los valores los pega ella a mano. No se los da a la IA por el chat.** Si los pega en el chat, quedan guardados en el historial.

## 4.4 · Arranca el proyecto

Escribe en el chat:

```
Arranca el proyecto y dime la dirección exacta con el puerto.
```

**Qué pasa:** la IA enciende tu web dentro de su ordenador y le devuelve una dirección tipo `http://localhost:3000`.

**Ella abre esa dirección en su navegador.** Si la web carga, **ya está dentro y puede trabajar.**

**Si sale un error:** lo copia y lo pega en el chat. La IA lo arregla.

## 4.5 · Empieza

Abre un chat, escribe `/primer`, y a trabajar.

---

# 5 · El día a día

**Cada persona, cada vez que se sienta a trabajar.**

## Al empezar

```
1. Abre el IDE en la carpeta del proyecto
2. Abre UN chat
3. Escribe:  "bájate lo último del proyecto y déjalo listo"
4. Escribe:  /primer
```

**El paso 3 es el que no se puede saltar.** Trae lo que los demás hayan subido desde la última vez. Si no lo haces, construyes sobre una versión vieja y chocas al subir lo tuyo.

**Va con "déjalo listo" a propósito:** si alguien añadió algo nuevo al proyecto, con bajarse el código no basta. Hay que instalarlo, y así la IA lo hace en el mismo paso.

## Trabajar

**Igual que si estuvieras solo.** Dices tu objetivo, apruebas el plan, la IA construye en una rama, tú lo miras en tu ordenador.

## Al terminar

```
5. /publicar
6. /cerrar
7. Avisas al equipo: "subí X, bajaos lo último"
```

**Qué hace `/publicar`:** une tu rama con `main`, lo sube a GitHub, y comprueba que tu web ya está sirviendo tu código nuevo. **Es el mismo camino de siempre: tu rama pasa por `main`, y de `main` sale a la web.** No hay atajos.

**El paso 7 es lo que evita que el siguiente choque.**

---

# 6 · Cuando dos tocan lo mismo

Dos personas cambian **la misma línea del mismo archivo**. Eso es un **conflicto**.

**Cuándo aparece:** al bajarte lo último o al publicar. No mientras escribes.

**No se pierde el trabajo de nadie.** Las dos versiones están guardadas.

**Lo resuelve el que llega segundo**, y no lo resuelves tú:

```
Hay un conflicto, resuélvelo.
```

La IA mira las dos versiones y decide. Si hay algo que solo tú puedes decidir, te pregunta.

---

# 7 · Cómo evitar chocar

## Reparto por zonas

Cada persona en **una parte distinta de la aplicación**:

```
Ana   → cobros
Luis  → calendario
```

**Hay archivos que son de todos** (el menú, la configuración). Ahí sí se choca aunque el reparto sea bueno. **Si vas a tocar uno, avisa antes.**

## La base de datos es UNA sola

```
Ana en su ordenador     ┐
Luis en el suyo         ├──►  LA MISMA BASE DE DATOS
La web publicada        ┘
```

**Si uno borra o cambia datos, se los cambia a todos y a los usuarios de la web.** Al instante y sin marcha atrás.

**Añadir cosas nuevas es seguro. Borrar o cambiar lo que existe se avisa antes.**

---

# 8 · Si quieres que alguien revise antes de publicar

**Opcional. No hace falta para trabajar en equipo.**

En vez de publicar directamente, subes tu rama a GitHub y abres un **Pull Request**: un botón que dice *"he terminado, ¿lo metemos?"*. GitHub le enseña al otro **qué líneas cambiaste**. Cuando aprueba, tu trabajo entra en `main` y sale a la web igual que siempre.

**Cuándo tiene sentido:** cobros, cuentas de usuario, datos de clientes. O alguien nuevo del que aún no sabes cómo trabaja.

**Cuándo no:** el día a día, con gente que se conoce y cada uno en su zona.

---

# 9 · Las reglas del equipo

**1 · Cada persona, su ordenador y su rama.**

**2 · Bájate lo último cada vez que te sientes a trabajar.**

**3 · Avisa cuando subas algo.**

**4 · Avisa antes de tocar la base de datos.** Es la misma para todos y no tiene marcha atrás.

**5 · Avisa antes de tocar un archivo que use todo el mundo.**

---

# El recorrido completo

```
UNA VEZ, al entrar alguien nuevo
   El dueño: la invita en GitHub  →  le pasa las claves
   Ella: setup a medias  →  clona  →  pone las claves  →  arranca

CADA DÍA
   "bájate lo último"  →  /primer  →  trabaja  →  lo prueba
   →  /publicar  →  /cerrar  →  avisa
```

---

*Anterior: **Entrenamiento 1 · Cómo funciona** · **Entrenamiento 2 · Cómo usar el sistema***
