# SOP 59 · El archivo ordenado de vídeos en Bunny

**Estado:** implementado 2026-07-30 · pendiente de que existan las claves de Storage
**Repos:** OS (`Capital Hub`) y App (`App Capital Hub`)
**Relacionado:** [56 · Estudio, panel del formador](56-estudio-panel-formador.md) ·
[30 · Automatizaciones](../sistemas/) · [55 · Formador vs admin](55-formador-vs-admin.md)

---

## El problema que resuelve

Todos los vídeos de Capital Hub caían en Bunny en un montón único, sin carpetas.
Cada lección subida se quedaba suelta con su título, y encontrar una era buscar a
mano entre todas.

> Marco, 2026-07-30: *"organizar el storage de Bunny, el lugar donde se hostean
> todos los vídeos. Tiene que ir cada vídeo para que haya un orden exacto en todo
> esto."*

---

## El árbol. Esto es lo que tiene que verse en Bunny

```
Testimonios/
VSLs/
Formaciones/
  IA Integrator/
    Módulo 1/
      Qué es un agente.mp4
      Tu primer flujo.mp4
    Módulo 2/
  Comercial Closing/
  Clipper/
```

- `Testimonios` y `VSLs` se llenan a mano desde el panel de Bunny. No salen de la App.
- Dentro de `Formaciones`, **todo es automático**: el formador crea un módulo y su
  carpeta aparece; sube una lección y el vídeo cae dentro con el nombre de la lección.

---

## Los dos Bunny, y por qué hacen falta los dos

Esta es la parte que se olvida y hace perder una hora cada vez. **No son lo mismo.**

| | **Bunny Stream** | **Bunny Storage** |
|---|---|---|
| Para qué | El reproductor. Transcodifica y sirve al alumno | El archivo. Guarda el fichero |
| Carpetas | **Un solo nivel** ("colecciones"), sin padre | Reales, todo lo hondas que haga falta |
| Se crean | A mano por API | Solas, al subir un archivo dentro |
| Claves | `BUNNY_STREAM_API_KEY`, `BUNNY_LIBRARY_ID`, `BUNNY_CDN_HOSTNAME` | `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_STORAGE_HOST` |

**Comprobado en su API el 2026-07-30:** el objeto colección de Stream tiene
`videoLibraryId`, `guid`, `name`, `videoCount`, `totalSize`, `previewVideoIds`,
`previewImageUrls`. **No tiene ningún campo de padre.** Por eso el árbol de tres
niveles NO puede vivir en Stream y hace falta Storage.

Lo que se hace en cada uno:

- **Storage** guarda el árbol completo, tal cual el dibujo de arriba.
- **Stream** guarda una colección por formación, y el vídeo lleva el resto de la
  ruta dentro del nombre: `Módulo 1 · 02 · Qué es un agente`. Al ordenar por
  nombre queda agrupado por módulo, que es lo más parecido a una carpeta que
  Stream permite.

De regalo, Storage es la **primera copia de seguridad real** de los vídeos: hasta
hoy, si Stream perdía uno, no había de dónde sacarlo.

---

## Cómo llega cada vídeo a su carpeta

1. El formador arrastra el vídeo en el Estudio.
2. La App llama a `POST /api/admin/lessons/bunny-create-video` mandando el
   **contexto entero**: formación, módulo, lección, posición y nombre de archivo.
3. El OS crea la entrada de Bunny **ya dentro de su colección y con su nombre
   completo**, y prepara la carpeta del módulo en el archivo.
4. El navegador sube el vídeo directo a Bunny (TUS, reanudable, sin límite de
   tamaño). El fichero no pasa por el OS.
5. Bunny procesa el vídeo. Eso tarda, y hasta que no termina no hay nada que copiar.
6. **Cada 10 minutos**, `/api/cron/bunny-archivar` mira qué falta, coge el mejor
   MP4 que Bunny ya generó y lo copia a su carpeta del archivo. Bunny a Bunny, sin
   pasar el vídeo por memoria. Guarda la ruta en `lessons.bunny_storage_path`.

**Por qué el archivado va por reloj y no al subir:** un vídeo largo tarda en
procesarse más de lo que puede durar una llamada. Si se intentara en el momento,
fallaría justo con los vídeos grandes. Con el reloj, lo que no salió esta vuelta
sale en la siguiente, solo, sin que nadie toque nada.

---

## Las mudanzas: el nombre cambia, la carpeta va detrás

| Qué pasa | Qué hace el sistema |
|---|---|
| Renombran un **módulo** | La App avisa a `POST /api/admin/bunny/carpeta` con `moduloAnterior`. La carpeta se mueve con sus vídeos dentro |
| Renombran una **lección** | El reloj ve que la ruta ya no coincide, guarda el vídeo con el nombre nuevo y retira la copia vieja |

Si esto no existiera, el mismo módulo acabaría con **dos carpetas** y el orden se
rompería justo por lo que se creó.

---

## La limpieza de nombres: `bunny-rutas.ts`

**Un solo archivo decide dónde va cada cosa.** El nombre que escribe el formador
acaba siendo una ruta de red: si en un sitio se limpia y en otro no, aparecen dos
carpetas para el mismo módulo.

- Se **conservan** tildes y eñes: Marco entra a Bunny a mirar y "Módulo 1" se lee
  mejor que "modulo-1".
- Se quitan `/ \ : * ? " < > |`, los invisibles de copiar y pegar, los puntos al
  principio y al final, y los espacios de sobra. Máximo 120 caracteres.

---

## Trampas ya pisadas. No repetirlas

### 1. La zona de Bunny solo sirve vídeos a nuestros dominios

La pull zone tiene **lista blanca de referentes**. Una petición sin cabecera
`Referer` recibe **403 en todo**: MP4, HLS y hasta la miniatura.

Esto por poco se queda como **bug mudo**. El archivado pedía el MP4 sin esa
cabecera, recibía 403 en todas las calidades, y como un vídeo que aún se está
procesando *también* deja de responder, el código lo daba por "todavía
procesándose" y **no archivaba nunca sin quejarse una sola vez**.

Dos reglas que salen de aquí:

1. Toda petición del servidor a la zona de Bunny lleva
   `Referer: https://os.capitalhubapp.com/`.
2. **Un 403 nunca se confunde con "aún no está listo".** Se cuenta como fallo y
   sale en el informe. Si dos situaciones distintas acaban en el mismo `continue`,
   una de ellas se está tapando.

### 2. El nombre de la zona es el nombre, no la URL

En `BUNNY_STORAGE_ZONE` va `capital-hub-media`, **no**
`https://storage.bunnycdn.com/capital-hub-media`. Con la URL entera, Bunny
responde 401 en todas las regiones y parece un problema de contraseña.

Cómo distinguir un fallo del otro sin volverse loco:

| Síntoma | Qué es |
|---|---|
| 401 en **todas** las regiones | Zona o contraseña mal. Mira si la zona trae `http` dentro |
| 403 en el CDN de vídeo | Falta el `Referer` |
| 404 al pedir el MP4 | El vídeo aún se está procesando |

### 3. Los nombres invisibles

Escribir un rango de caracteres invisibles **dentro de una expresión regular**
obliga a meter esos caracteres en el propio archivo. El archivo se guarda mal y el
patrón acaba invertido (`[^...]`), borrando todo lo que **no** es invisible. El
filtro va **carácter a carácter mirando su código**, nunca con expresión regular.

---

## Seguridad: quién puede tocar las carpetas

Hasta hoy los endpoints de Bunny **no comprobaban nada**: cualquiera que supiera
la dirección podía crear vídeos en la biblioteca. Con carpetas de por medio eso ya
no vale, porque un desconocido podría reorganizar o vaciar el archivo.

`src/lib/bunny-acceso.ts` verifica la sesión de quien llama contra la base:

| Quién | Qué puede |
|---|---|
| ADMIN **sin** formación asignada (super admin) | Todo |
| ADMIN **con** formación asignada (formador) | Solo las carpetas de la suya |
| Cualquier otro | Nada |

**La clave del archivo nunca sale del OS.** Si estuviera en el navegador, quien
abriera el inspector podría vaciar Bunny entero.

---

## Variables de entorno

En `.env.local` del OS **y** en Vercel:

```
BUNNY_STORAGE_ZONE=      # nombre de la Storage Zone
BUNNY_STORAGE_PASSWORD=  # su clave, pestaña "FTP & API Access" de la zona
BUNNY_STORAGE_HOST=storage.bunnycdn.com   # o ny. / la. / sg. / syd. según región
```

**No hay que pulsar nada para montar el árbol.** El reloj lo monta solo en la
primera vuelta que encuentra las claves puestas. `POST /api/admin/bunny/estructura`
existe solo para no esperar los 10 minutos.

Sin estas claves, **nada se rompe**: el formador sigue subiendo vídeos y los
alumnos siguen viéndolos. Solo falta el archivo ordenado, que se pondrá al día
solo en cuanto existan.

---

## Archivos

**OS (`Capital Hub`)**

| Archivo | Qué hace |
|---|---|
| `src/lib/bunny-rutas.ts` | Dónde va cada cosa. Limpieza de nombres |
| `src/lib/bunny-storage.ts` | Hablar con el archivo: listar, subir, borrar, mover carpeta |
| `src/lib/bunny-estructura.ts` | Montar el árbol base. Idempotente |
| `src/lib/bunny-archivo.ts` | El barrido que guarda cada vídeo en su carpeta |
| `src/lib/bunny-acceso.ts` | Quién puede tocar qué |
| `src/lib/bunny-cors.ts` | Cabeceras para que llame la App |
| `src/lib/bunny.ts` | Stream: colecciones + crear vídeo ya colocado |
| `src/app/api/admin/bunny/{estructura,carpeta,archivar}/route.ts` | Los endpoints |
| `src/app/api/cron/bunny-archivar/route.ts` | El reloj, cada 10 min |
| `src/app/api/admin/lessons/bunny-create-video/route.ts` | Subida con contexto |

**App (`App Capital Hub`)**

| Archivo | Qué hace |
|---|---|
| `web/src/features/estudio/carpetasBunny.ts` | Avisa al OS al crear o renombrar un módulo |
| `web/src/features/estudio/useEstudio.ts` | Engancha el aviso en `crearModulo` y `guardarModulo` |
| `web/src/features/estudio/InspectorLeccion.tsx` | Manda el contexto al subir + enseña en qué carpeta cayó |

Todo lo de `carpetasBunny.ts` es de **mejor esfuerzo y nunca lanza**: que Bunny
esté caído no puede impedirle al formador crear su módulo.

---

## Estado real a 2026-07-30 (verificado en Bunny, no supuesto)

Zona `capital-hub-media`, host `storage.bunnycdn.com`.

```
Formaciones/
  IA Integrator/Modulo 1/NOMBRE DE LA LECCION.mp4   (81.7 MB)
  Comercial Closing/
  Clipper/
Testimonios/
VSLs/
  Video Adri Post-Agenda - como aprovechar la llamada.mp4   (139.1 MB)
```

En el reproductor, cinco colecciones (IA Integrator, Comercial Closing, Clipper,
Testimonios, VSLs) y **2 vídeos**, los dos colocados. Antes había 7 sueltos y
ninguna carpeta.

**Pendiente al publicar:** las tres variables de Bunny Storage tienen que estar
también en Vercel, no solo en el `.env.local`. Sin ellas, en producción el reloj
se salta el archivado sin romper nada (`hayStorage()` devuelve falso).

---

## Historial

**2026-07-30 · Nace el archivo ordenado.** Marco pide carpetas exactas en Bunny.
Se comprueba que Stream no anida y se añade Storage para el árbol. Reloj de
archivado cada 10 min, registrado en `/automatizaciones`. Media Buyer Digital
sale y entra Clipper (ver [SOP 60](60-clipper-sustituye-media-buyer.md)).

---

## Quitar un vídeo lo quita de Bunny (2026-07-30, segunda pasada)

> Marco: *"si quito el vídeo y borro aquí la lección, lo que debería pasar es que
> se debería quitar de Bunny. Por lo que veo, sigue todavía ahí."*

Tenía razón y era un agujero que crece solo: cada vídeo reemplazado y cada
lección borrada dejaba su archivo en Bunny **para siempre**, ocupando y
ensuciando justo el orden que se acababa de montar.

`POST /api/admin/bunny/borrar` lo cierra. Se dispara en tres sitios:

| Acción del formador | Qué se lleva |
|---|---|
| **Quitar el vídeo** | Ese vídeo, del reproductor y del archivo |
| **Cambiar el vídeo** | El de ahora, y la lección queda lista para otro |
| Borrar la lección | Su vídeo |
| Borrar el módulo | Los vídeos de todas sus lecciones **y su carpeta** |

### Tres reglas que salen de aquí

1. **Se manda el `id`, nunca la ruta.** El servidor mira en la base a qué
   formación pertenece y comprueba el permiso. Si el navegador pudiera mandar
   una ruta, cualquiera con la consola abierta podría borrar otra cosa.
2. **Se llama ANTES de borrar la fila.** Después ya no se sabe qué vídeo era ni
   dónde vivía, y queda huérfano.
3. **Si Bunny falla, la fila NO se borra** y se dice por qué. Antes al revés
   habría sido: fila fuera, archivo dentro, y nadie enterándose.

### Un botón que no dice lo que hace es un bug

Había un solo botón, **"Cambiar vídeo"**, que por dentro borraba. Marco:
*"no es cambiar el vídeo... si aquí cambiar vídeo quiere decir también eliminar,
dale, claridad"*. Ahora son **dos botones con su verbo** ("Cambiar el vídeo" y
"Quitar el vídeo") y cada confirmación dice exactamente qué desaparece y de
dónde.

### Comprobado, no supuesto

Con un vídeo de usar y tirar, sin tocar el material de Marco:
sin sesión **401**; con sesión de administrador **200**; el vídeo desaparece del
reproductor (404) y del archivo (404).

Se descubrió de paso que `deleteBunnyVideo` **se tragaba el resultado sin
mirarlo**: si Bunny decía que no, nadie se enteraba. Ahora falla en alto (un 404
sí vale: significa que ya no estaba).
