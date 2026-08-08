---
rama: feature/movil-nativo
estado: aprobado
---

# Que el OS se comporte como una app nativa en el telefono

## Objetivo

Arreglar los cuatro fallos que Marco encontro abriendo el OS en su iPhone el 2026-08-08, y
la causa comun de todos: **ninguno se puede ver con un navegador sin pantalla**, porque ahi
la zona del notch y de los gestos vale cero y el teclado no existe.

Textual: *"hay una barra negra abajo que no encaja... cuando toco el widget se solapa todo
y no puedo salir tampoco... no parece una aplicacion nativa... cuando le doy a mas no tengo
ningun lugar para poder salir"*.

## Que voy a hacer

**1. La barra negra de abajo.** La barra era medio transparente con desenfoque, asi que la
franja de gestos del iPhone quedaba de otro color y se veia una banda pegada abajo que no
encajaba. Pasa a ser **opaca**, como en cualquier app nativa. La cabecera de arriba tenia el
mismo fallo.

**2. Las ventanas emergentes.** El widget de registrar venta tenia cinco cosas mal a la vez,
y la peor explica por que no se podia cerrar: usaba `vh` para el alto, y en el iPhone `vh`
**incluye la zona del reloj**, asi que la cabecera con la X se metia debajo del reloj. Ademas
el fondo y el formulario se desplazaban a la vez. Se aplica el mismo patron a **todas** las
ventanas del OS: se pintan en el `body`, alto en `dvh` dejando fuera el reloj, un solo
scroll, y **salida visible siempre**.

**3. El menu de abajo.** Pasa a ser **Dashboard, CRM, Ads e Instagram**, en ese orden, que
son las cuatro secciones que Marco usa a diario. El resto vive detras de "Mas", y esa hoja
gana su **boton de Cerrar**: hoy no tiene ninguno y se queda atrapado dentro.

**4. El avatar de arriba a la derecha**, que no lleva a ningun sitio.

## Fases

- [ ] Barra de abajo y cabecera opacas, cubriendo la franja de gestos y el notch
- [ ] Menu de abajo con las cuatro secciones que pidio, y salida en la hoja "Mas"
- [ ] El widget de registrar venta rehecho con el patron de hoja nativa
- [ ] El mismo patron en las otras ventanas del OS (webs, llamadas, tutoriales, avisos)
- [ ] El avatar lleva a su sitio
- [ ] Construir, comprobar y publicar

## Que NO entra

- Rediseñar pantallas que Marco no ha nombrado. Solo se toca el marco comun, las ventanas
  emergentes y las cuatro cosas de arriba.
- Las paginas publicas (funnels, checkout, gracias). Ahi el `fixed inset-0` suele ser un
  fondo de pagina, no una ventana, y tocarlo sin motivo es rediseñar lo que nadie pidio.
- Cambiar logica, datos, consultas, permisos, ni una palabra del texto ya escrito.
- Paginar las 20 listas viejas que quedan pendientes de otro trabajo.

## Como lo veras

Abres el OS en tu iPhone y:

- Abajo **no hay ninguna banda negra**: la barra llega hasta el borde.
- En la barra ves **Dashboard, CRM, Ads, Instagram** y el boton de Mas.
- Tocas **Mas** y hay un boton de **Cerrar** arriba a la derecha, con su palabra.
- Tocas el **boton verde** de registrar venta: la ventana empieza por debajo del reloj, la X
  se ve y funciona, y se cierra tambien tocando fuera.
- Tocas tu **avatar** y te lleva a tu perfil.
