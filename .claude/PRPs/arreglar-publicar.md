---
rama: feature/arreglar-publicar
estado: aprobado
---

## Objetivo

Que `/publicar` y `/cerrar` funcionen solos en Capital Hub, sin que nadie tenga que
configurar nada a mano. Y meter la actualizacion de NVISION por el camino de siempre
(rama → dev → main), no sueltos en la carpeta principal como estan ahora.

## Qué voy a hacer

- Rescatar los cambios de la actualizacion, que ahora mismo estan sueltos en la carpeta
  principal sobre `main`, y llevarlos a la rama de este chat
- Hacer que `publicar` **descubra solo** la direccion de la web, leyendo lo que el
  proyecto ya tiene (`NEXT_PUBLIC_APP_URL`). Sin cajon `nvision`, sin configurar nada
- Hacer que `publicar` acepte tanto `version` como `sha` al preguntarle a la web que
  commit esta sirviendo, para que valga con cualquier proyecto
- Dejar la carpeta principal en `dev`, como manda el sistema
- Probarlo con el ensayo, que recorre todo el camino menos subir, y lo deshace

## Fases

**A · Recuperar la actualizacion y meterla en la rama**
- [ ] Mover los 13 archivos de la actualizacion de la carpeta principal a esta rama
- [ ] Dejar la carpeta principal limpia y con `dev` puesta
- [ ] Guardar la actualizacion como un commit en `feature/arreglar-publicar`

**B · Que `publicar` se adapte solo, sin configuracion**
- [ ] Que descubra la web mirando `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`
      (en el entorno y en los `.env` del proyecto), ademas de lo que ya miraba
- [ ] Que acepte `version` o `sha` en la respuesta de `/api/version`
- [ ] Comprobar que sin tocar `package.json` ya encuentra `os.capitalhubapp.com`

**C · Probar sin tocar la web**
- [ ] `npm run publicar -- --ensayo` desde esta carpeta
- [ ] Confirmar que sale "✓ Ensayo en verde" y que `check:flujo` esta en verde

**D · Dejar constancia**
- [ ] Anotar en el Knowledge los 3 fallos de la plantilla NVISION encontrados hoy
      (rutas con espacio, campo `version`, y la web que habia que configurar a mano)
      para poder reportarlos

## Qué NO entra

- No publico nada a la web: el ensayo deshace todo lo que hace
- No toco los 3 chats abiertos (`ads-eventos`, `agendas-y-reporte-setter`, `tokens-brandkit`)
- No toco el popup de "Refrescar": sigue leyendo `sha` y sigue igual
- No añado la clave `nvision` al `package.json`: la idea es justo no tener que configurar nada
- No te quito ningun freno de permisos
- No cambio el codigo del producto (`src/`) mas alla de lo que haga falta aqui

## Cómo lo verás

- `npm run check:flujo` en verde en vez de rojo
- El ensayo terminando en verde, diciendo que commit habria publicado y cuanto tardo
- A partir de ahi, decir "publicalo" o "cierra" es UNA orden, sin preguntas y sin esperas
  de 10 minutos
- La actualizacion de NVISION dentro de una rama, lista para ir a `dev` cuando lo digas
