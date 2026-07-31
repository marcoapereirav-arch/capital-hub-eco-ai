---
title: Tutoriales (formación interna del equipo)
order: 61
area: producto
---

# Tutoriales: la formación interna del equipo

> Creada 2026-07-31. Marco: *"quiero crear una nueva sección dentro del OS que se
> llame Tutoriales. Yo voy a subir lecciones para que los formadores vean cómo ir
> utilizando el sistema y las acciones que voy a ir añadiendo"*.

---

## La idea, en una línea

**Marco graba una vez, y queda ahí para siempre.** Vídeos organizados en
carpetas, dentro del OS, para todo el equipo interno.

Vive en `/tutoriales`. No confundir con la formación de alumnos: aquella va en la
App (REGLA DE ORO del SOP [`producto/02`](02-arquitectura-os-app.md)). Esto es
para el equipo, y el equipo trabaja en el OS.

## Por qué en el OS y no en la App

Se comprobó antes de construir, porque la primera propuesta se equivocó y decía
que iba en la App:

- El formador **tiene cuenta en el OS** (`profiles.role = 'formador'`) y desde
  ahí salta a la App con "Ir a App" (SOP [`producto/41`](41-sistema-roles-permisos.md)).
- Añadir una sección al OS y decidir quién la ve es el procedimiento ya
  documentado en ese mismo SOP.
- Marco decidió además (2026-07-31) que la vea **todo el equipo interno**, no
  solo formadores: marketing, closers y setters también.

## Quién ve qué

| Quién | Ve la sección | Ve borradores | Puede administrar |
|---|---|---|---|
| `super_admin` / `admin` | Sí | Sí | Sí |
| `formador`, `marketing`, `closer`, `setter` | Sí | **No** | **No** |
| Alumno de la App | **No** | No | No |

El candado copia el patrón ya probado de `knowledges` (SOP [`producto/54`](54-knowledge-3d.md)):

- **Leer:** tener fila activa en `profiles`. Los alumnos viven en `users`, no en
  `profiles`, así que quedan fuera **sin tener que enumerarlos**.
- **Escribir:** `public.is_admin()`, el helper que ya existía.

## Las dos formas de meter un vídeo

Marco eligió las dos, y conviven en la misma ficha:

| Forma | Dónde acaba el vídeo | Cuándo usarla |
|---|---|---|
| **Subir el archivo** | Bunny, colección **`Tutoriales OS`** (se crea sola) | Lo que deba durar |
| **Pegar link de Loom** | Se queda en Loom. Solo se guarda el link | Algo rápido |

**Contrapartida de Loom, dicha en voz alta:** el vídeo sigue siendo de Loom. Si
se borra allí o se pone en privado, la ficha se queda sin vídeo. Por eso lo
importante se sube como archivo.

La subida va **directa del navegador a Bunny** (protocolo TUS): sin límite de
tamaño y se reanuda si se corta. El OS solo firma el permiso.

## Modelo de datos

`tutorial_folders` (carpetas) y `tutorials` (fichas). Dos candados de integridad
que evitan fichas rotas en pantalla:

- `tutorials_fuente_coherente`: cada fuente exige su dato y **solo** el suyo.
- `tutorials_publicado_con_video`: no se puede publicar una ficha sin vídeo.

Todo nace en **borrador**, también el de Loom (aunque se pueda ver al instante),
para que un link mal pegado no salga al equipo sin que nadie lo mire.

Borrar un tutorial de Bunny lo borra **también en Bunny**, mismo criterio que el
Estudio (SOP [`producto/59`](59-bunny-archivo-ordenado.md)). Un Loom no se toca.

## Comprobado el 2026-07-31

Con el usuario de pruebas (SOP [`sistemas/02`](../sistemas/02-test-agent.md)) y en base de datos:

- Crear carpeta, añadir Loom, nace en borrador, publicar, reproducir: **todo bien**.
- Rechaza un link que no es de Loom; acepta el válido.
- En móvil (390px) no se desborda.
- **Como formador:** ve el publicado, **no** ve el borrador, y crear una carpeta
  le da error de permiso. **Como alumno:** cero. **Sin sesión:** cero.
- La subida crea la colección `Tutoriales OS` en Bunny (verificado y limpiado).

**Lo único sin confirmar:** que un Loom **real** se incruste. La prueba se hizo
con un identificador inventado y Loom respondió `X-Frame-Options: deny` al
redirigir a su portada, que es lo esperado con un enlace que no existe. Falta
repetirlo con un link de verdad de Marco.

---

## PENDIENTE DE SEGURIDAD: la puerta de subida de la App

**Detectado el 2026-07-31 leyendo el código.**

`/api/admin/lessons/bunny-create-video` **no comprueba quién llama**. Cualquiera
que sepa la dirección obtiene una firma de subida a Bunny válida 24 horas y
puede llenar la biblioteca. Su CORS además devuelve como permitido el origen que
le llegue, sea cual sea.

Las rutas de carpetas ya se cerraron con `quienLlama` (`lib/bunny-acceso.ts`, ver
SOP 59). **Esta se quedó fuera.**

**Se intentó cerrar en este mismo bloque y se revirtió**, porque rompía
producción: la App llama **sin cabecera `Authorization`**
(`web/src/features/estudio/InspectorLeccion.tsx`), así que cerrarla hoy dejaría a
los formadores sin poder subir lecciones.

**El arreglo son dos pasos, en este orden:**

1. **App:** mandar el token de sesión en `Authorization` al llamar al OS.
2. **OS:** exigir `quienLlama(...)` en esa ruta.

Invertir el orden rompe las subidas en producción. La ruta nueva de tutoriales
(`/api/tutoriales/subida`) **sí** comprueba, desde el primer día.

---

## Aprendizaje: el vigilante avisó, la regla no bastó

Al construir esto, `npm run build` se negó a arrancar: `dev` iba **3 cambios por
detrás de `main`** porque otro chat publicó saltándose `dev`.

- La parte automática del método (**un chat = una rama = una carpeta**) funcionó:
  los dos chats no se pisaron ni un archivo.
- La parte no automática (**publicar = rama, `dev`, `main`, subiendo las dos**)
  falló, porque nada la **impide**: es una regla escrita.

`dev` se reparó con un avance limpio (`git push . main:dev`), sin tocar la
carpeta del otro chat y sin subir nada a la web.

**Queda propuesto** convertir esa regla en candado de verdad (que publicar
saltándose `dev` sea imposible, no solo desaconsejado). No se aplicó todavía
porque toca a los dos chats a la vez.

---

## Fuera de alcance a propósito

Marcar como visto, buscador, comentarios, y que suba tutoriales alguien que no
sea Marco o Adrián. Con dos vídeos serían botones que no sirven. Se añaden cuando
haya volumen que los pida.

## Cambios versionados

### 2026-07-31: creación
Sección completa: base de datos con candados, pantalla, panel de administración,
subida a Bunny en `Tutoriales OS` y soporte de Loom. Carpeta "Montar tu
formación" creada y esperando los dos vídeos de Marco. PRP-008.
