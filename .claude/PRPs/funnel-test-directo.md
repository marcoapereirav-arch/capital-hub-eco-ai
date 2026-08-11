---
titulo: Funnel Test de Personalidad · directo al test + los eventos que faltan
rama: feature/funnel-test-directo
estado: aprobado
fecha: 2026-08-11
origen: Marco, chat del 2026-08-11
sop: docs/sops/marketing/07-funnel-test-personalidad.md · docs/sops/marketing/09-eventos-meta-catalogo.md
---

# Funnel Test de Personalidad · directo al test + los eventos que faltan

## Objetivo

Que el lead que deja sus datos entre al test **en ese mismo momento**, sin página
intermedia y sin esperar ningún correo. Y que todo lo que hace desde que ve el anuncio
hasta que nos escribe quede medido en Meta, tanto con los eventos que Meta ya conoce como
con los nuestros.

## Qué voy a hacer

- Poner **en pausa** (no borrar) la página de gracias con el vídeo y el calendario.
- Poner **en pausa** el correo de los 7 minutos. La plantilla se queda donde está.
- Al dejar los datos, el lead va **directo a nuestra página del test**, que es la que tiene
  el botón para abrir el test, el protocolo de 3 pasos y los botones de Instagram y
  WhatsApp.
- Mover la señal de "Lead cualificado" del clic del correo al **clic de "Abrir el test"**.
- Añadir los eventos que faltan: ver la landing, ver la página del test, abrir el test,
  escribirnos por Instagram y escribirnos por WhatsApp.
- Que cada uno de esos salga **por los dos caminos** (navegador y servidor) y **por
  duplicado**: el de Meta y el nuestro, con el mismo identificador para que no se cuente dos
  veces.
- Que la pantalla de **Ads → Eventos** los liste, para que deje de pintar verde un funnel
  al que le faltan señales.

## Dos decisiones que tomo yo, para que las veas escritas

1. **El lead aterriza en NUESTRA página del test, no en Equilibria directamente.** Si lo
   soltamos en Equilibria perdemos las tres cosas que nos importan: el botón para mandarnos
   el resultado, el protocolo para que sepa qué hacer, y la medición. Nuestra página tiene
   el botón "Abrir el test" que le abre Equilibria en otra pestaña: para el lead es un clic
   más, para nosotros es la diferencia entre medir y no medir.
2. **"Lead cualificado" pasa a dispararse al pulsar "Abrir el test".** Esa columna existía
   porque el clic del correo era la única señal de intención real. Sin correo, la señal
   equivalente es abrir el test. Si no lo movemos, esa columna del CRM se queda vacía para
   siempre.

## Fases

**A · Apagar la gracias y el correo, el funnel pasa a directo**
- [ ] Interruptor nuevo en el engranaje de `/webs` ("paso intermedio": encendido/apagado),
      apagado por defecto. Se vuelve a encender con un clic, sin tocar código ni publicar.
- [ ] Con el paso apagado, al dejar los datos el lead va a `/test-personalidad/test`.
- [ ] Con el paso apagado, no se programa el correo de los 7 minutos.
- [ ] La página de gracias no se borra: sigue ahí, fuera de buscadores, y si alguien entra
      con el paso apagado se le manda al test para que no quede una página huérfana viva.

**B · Los eventos que faltan**
- [ ] Landing `/test-personalidad`: `ViewContent` + `test_personalidad_ver_landing`.
- [ ] Página del test: `ViewContent` + `test_personalidad_ver_test`.
- [ ] Botón "Abrir el test": `test_personalidad_cualificado` + sube al lead a "Lead
      cualificado" en el CRM y avisa al equipo.
- [ ] Botón Instagram: `Contact` + `test_personalidad_contacto_instagram`.
- [ ] Botón WhatsApp: `Contact` + `test_personalidad_contacto_whatsapp`.
- [ ] El del formulario (`Lead` + `test_personalidad_lead`) ya funciona: no se toca.

**C · Que el panel de Ads deje de mentir**
- [ ] Dar de alta los eventos nuevos en los cuatro sitios donde hay que registrarlos, para
      que la pantalla de Eventos los espere y avise si alguno no llega.
- [ ] Dejar el funnel del test con la misma lista completa que ya tiene la clase en directo.

**D · Comprobarlo de verdad**
- [ ] Abrir las dos páginas en el navegador y ver salir cada evento.
- [ ] Recorrido completo de punta a punta con un correo de prueba, y enseñarte la ficha
      moviéndose en el CRM y el evento llegando a Meta.

## Qué NO entra

- **No se borra nada.** Ni la página de gracias, ni el calendario, ni la plantilla del
  correo. Todo queda en pausa y se recupera con un interruptor.
- No se toca el funnel de la clase en directo ni el de reserva de sesión.
- No se toca el vídeo de Adrián (sigue pendiente, y ahora ya no bloquea nada).
- No se toca ninguna columna ni ningún contacto del CRM.
- No se publica en la web hasta que tú lo digas.

## Cómo lo verás

- Un enlace de tu ordenador para probarlo antes de que lo vea nadie:
  `http://localhost:3101/test-personalidad`
- Dejas los datos y caes directo en la página del test. Sin página intermedia, sin correo.
- En **Ads → Eventos**, el funnel del test pasa de 4 señales a 8, cada una con su hora de
  llegada.
- En el CRM, el que pulsa "Abrir el test" sube solo a la columna "Lead cualificado".

## Aviso

La conexión a la base de datos está sin autorizar en esta sesión, así que **no puedo crear
las tareas en el panel de Operaciones yo mismo**. Las fases están aquí; en cuanto la
autorices las paso al panel.
