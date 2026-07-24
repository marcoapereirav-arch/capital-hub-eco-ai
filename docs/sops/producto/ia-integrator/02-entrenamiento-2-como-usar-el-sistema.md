---
title: Entrenamiento 2 · Cómo usar el sistema
order: 2
---

> Versión visual: [/formacion/ia-integrator/entrenamiento-2](/formacion/ia-integrator/entrenamiento-2)

# Entrenamiento 2 · Cómo usar el sistema

**Qué es esto:** lo que haces tú cada día, desde que se te ocurre algo hasta que está funcionando en tu web.

**Antes de esto:** el Entrenamiento 1. Aquí se dan por sabidos: IDE, terminal, MCP, skill, PRP, bucle agéntico, localhost, rama, main, commit, merge, push.

**El ciclo completo, de un vistazo:**

```
Abres el chat  →  /primer  →  dices tu objetivo  →  la IA te da el plan
                    ↑
        PRIMERO esto. Sin contexto de tu proyecto,
        lo que construya no va a encajar.
     ↓
Tú apruebas  →  construye  →  tú lo miras  →  pides cambios
     ↓
Publicas  →  cierras
```

---

# 1 · Abrir una sesión

```
1. Abre tu IDE en la carpeta DE TU PROYECTO (nunca la carpeta madre)
2. Abre TU chat de IA (el de la extensión, no el que trae el IDE de fábrica)
3. Escribe:  /primer
```

**Qué hace `/primer`:** la IA lee tu proyecto entero. Qué hay construido, cómo está hecho, qué reglas tiene, qué se hizo últimamente.

**Por qué siempre:** cada chat empieza en blanco. Sin `/primer` la IA no sabe nada de tu proyecto y se inventa cosas.

**Un solo chat en esa ventana.** Nunca dos.

---

# 2 · Decir tu objetivo

**Le dices qué quieres lograr. El cómo es su trabajo.**

```
"Quiero que mis clientes puedan reservar una cita desde mi web
 y que me llegue un aviso cuando alguien reserve."
```

Eso es suficiente. No necesitas saber qué archivos hay que tocar ni qué tecnología usar.

**Lo que sí ayuda:**
- Para quién es
- Si hay algo que **no** debe cambiar

**Si tu objetivo no está claro para ti, tampoco va a estarlo para ella.** Antes de escribir, ten claro qué quieres que pase.

---

# 3 · El plan (PRP)

Antes de tocar nada, la IA te devuelve el plan: qué entendió, qué va a construir, en qué fases, y qué decidió por su cuenta.

**Tú respondes una de tres cosas:**

- Está bien → adelante
- Cambia esto → te rehace el plan y vuelve a preguntar
- No es eso → vuelve a empezar

> **Sin tu aprobación no se construye nada.** Si empieza a escribir código sin haberte presentado el plan, párala.

---

# 4 · La construcción

Con tu OK, la IA construye por fases. **Puedes irte mientras trabaja.** Cuando vuelvas te dice qué hizo.

**Dos cosas no las hace sin ti: publicar, y borrar o cambiar datos que ya existen** en tu base de datos.

---

# 5 · Revisarlo

Abres tu navegador en la dirección de localhost y lo pruebas tú.

**Tú eres el último filtro.** La IA comprueba que el código no falla, pero no si el resultado es lo que tenías en la cabeza.

**Qué mirar:**
- ¿Hace lo que pediste?
- ¿Se ve bien en el móvil, además de en el ordenador?
- ¿Se rompió algo que antes funcionaba?

Si algo no está bien, se lo dices con tus palabras y lo corrige. Las veces que haga falta.

---

# 6 · Publicar

```
/publicar
```

**Es una skill, no una petición.** Publicar son cuatro cosas y las cuatro tienen que pasar en orden. Con la skill pasan siempre; pidiéndolo con tus palabras, no.

```
1. Guarda tu trabajo y lo une a main
2. Lo sube a GitHub
3. Espera a que tu web se monte              (2-4 minutos)
4. COMPRUEBA que tu web sirve tu código nuevo
```

**El paso 4 es el que existe la skill para garantizar.** Es el que se salta cualquiera que publique a mano, y es el que hace que te quedes creyendo que publicaste algo que nunca llegó.

**Si la compilación falla:** tu web no se toca, sigue funcionando como antes. Se arregla y se vuelve a publicar.

**Cuándo está publicado de verdad:** cuando entras en tu web y lo ves.

---

# 7 · Cerrar

```
/cerrar
```

**También es una skill.** Hace tres comprobaciones y te dice qué quedó pendiente:

```
1. Que no queda nada tuyo sin publicar
2. Que no quedan ramas abiertas olvidadas
3. Que lo aprendido queda guardado en tu Knowledge
```

## Por qué se cierra siempre

**Las ramas se acumulan.** Cada trabajo sin cerrar deja una rama abierta. Al mes tienes quince y no sabes qué hay en cada una.

**Crees que algo está publicado y no lo está.** Cierras convencido de que sí, y semanas después descubres que tu web nunca lo recibió.

**Aunque el trabajo haya sido corto, se cierra.**

---

# 8 · Si surge algo urgente a mitad

Estás construyendo A y ves que B está roto.

**Apúntalo y sigue.** Le dices que lo guarde para después, terminas A, y entonces lo retomas.

**Por qué:** un chat tiene un contexto limitado. Si a mitad de un trabajo lo desvías a otra cosa, ese contexto se llena de dos temas mezclados y la calidad baja en los dos.

**Terminar una cosa antes de empezar otra no es una preferencia: es lo que hace que salga bien.**

---

# 9 · Dónde vive la información de tu proyecto

Tres sitios. Cada uno responde a una pregunta distinta.

### `AGENTS.md` — las reglas que obedece la IA

**Se carga entero en cada chat que abres.** Por eso es corto: los comandos de tu proyecto, cómo se escribe el código aquí, y las reglas duras que la IA no puede adivinar sola.

**Por qué se llama así y no "reglas.md":** porque **es un estándar abierto que leen muchas herramientas de IA distintas**, no solo una. Si mañana cambias de IA, lee el mismo archivo. **No dependes de ninguna marca.**

**Si ves también un `CLAUDE.md`:** algunas IAs buscan un archivo con su propio nombre. Para no escribir las reglas dos veces, ese archivo **no es un archivo aparte: es un acceso directo a `AGENTS.md`**. El mismo archivo con dos nombres, así que es imposible que se desincronicen.

### `BUSINESS_LOGIC.md` — cómo está hecho tu proyecto

La ficha técnica: qué tecnologías usa, cómo está organizado, qué tablas tiene, con qué servicios se conecta. **Es donde la IA aprende cómo está montado lo tuyo.**

### El Knowledge — la memoria de tu negocio

**Es una sección de tu propia web** donde vive cómo se hacen las cosas en tu negocio: procesos, decisiones, aprendizajes.

**Vive en tu base de datos, no en un archivo.** Eso significa que **lo ves y lo editas tú desde tu web**, y que no se pierde si cambias de ordenador o de IA.

## Dónde va cada cosa

```
Una orden corta que la IA debe obedecer siempre  →  AGENTS.md
Un proceso, una decisión, un aprendizaje         →  KNOWLEDGE
Cómo está construido el proyecto                 →  BUSINESS_LOGIC.md
```

---

# 10 · Las skills

**Una skill es un procedimiento completo guardado.** Escribes una palabra y se ejecuta entero, siempre igual, sin saltarse pasos.

**Se escriben con una barra delante.** Cuando pones `/` en el chat no estás escribiendo una frase: **estás ejecutando un procedimiento.**

## Las que usas en el roadmap

| Skill | Qué hace |
|---|---|
| `/primer` | Lee tu proyecto entero y se pone al día |
| `/new-ecoai` | Monta la base de tu sistema |
| `/visual-knowledge` | Construye tu Knowledge navegable en 3D |
| `/add-login` | Monta el registro y la entrada de usuarios, con su seguridad |
| `/prp` | Escribe el plan de lo que vas a construir |

## Las que activas cuando las necesitas

Tu sistema trae más guardadas: correos, notificaciones, trabajo con la base de datos, pruebas en el navegador, generación de imágenes.

**No vienen puestas en tu proyecto: se activan con una orden cuando te hacen falta.**

**Para ver todas las que tienes, se lo preguntas.**

## Crea las tuyas

Las skills que trae el sistema montan software. **Las que más valor te van a dar son las tuyas, porque ejecutan los procesos de tu negocio.**

**Cualquier cosa que repitas** —hacer una factura, publicar contenido, preparar un informe mensual, procesar la grabación de una reunión— puede ser una skill.

**Cómo se crea:** se lo pides. Le explicas el proceso una vez, con detalle: qué pasos tiene, qué reglas hay que respetar, qué no se puede olvidar.

**A partir de ahí sale igual de bien siempre**, sin que vuelvas a explicarlo.

---

# El ciclo completo

```
 1. IDE en la carpeta del proyecto, un chat dentro
 2. /primer
 3. Dices tu objetivo
 4. La IA te presenta el plan
 5. Tú apruebas
 6. Construye por fases
 7. Tú lo miras en el navegador
 8. Pides cambios hasta que esté bien
 9. Publicas
10. Cierras
```

---

# Las 5 que no se saltan

**1 · `/primer` al empezar cada chat.** Sin contexto, la IA se inventa cosas.

**2 · Un solo chat por carpeta.** Dos chats mezclan código sin que nadie lo note.

**3 · Nada se construye sin que apruebes el plan.** Si empieza a editar sin explicarte, párala.

**4 · Nada se da por bueno sin que lo veas tú en el navegador.**

**5 · Se cierra siempre**, aunque el trabajo haya sido corto.

---

*Anterior: **Entrenamiento 1 · Cómo funciona todo** · Si trabajan varias personas: **Entrenamiento 3***
