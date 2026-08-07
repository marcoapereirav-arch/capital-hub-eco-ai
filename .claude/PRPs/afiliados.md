---
titulo: Afiliados, el sistema completo (dashboard, configuración, links a cualquier funnel y etiquetado de punta a punta)
rama: feature/afiliados
estado: aprobado
fecha: 2026-08-07
aprobado_por: Marco, "DALE!" (2026-08-07), con el enfasis de que el destino fijo al Test de Personalidad queda PROHIBIDO y el funnel se elige siempre
---

# Afiliados: de una pantalla suelta a un sistema

## Objetivo

Afiliados pasa a tener dos partes: un **Dashboard** con los números reales de la sección y una
**Configuración** donde creas el link de cada afiliado hacia **el funnel que tú elijas**. Todo
lead que entre por uno de esos links queda marcado con la etiqueta de la persona que lo trajo, y
esa marca sobrevive hasta la venta. Un funnel nuevo se conecta solo, sin tocar Afiliados.

## Qué voy a hacer

**Lo que hay hoy (mirado en el código, no supuesto):**

- Una sola pantalla, sin pestañas. Creas un afiliado poniendo un nombre y ya.
- El link **siempre** va al Test de Personalidad. Está escrito a fuego en el código.
- De los cinco funnels, **solo dos guardan de dónde vino el lead** (Test y Clase en directo).
  Reserva de sesión, MIFGE y LT8 **no guardan nada**: si mandas ahí el link de Paolo, la
  atribución se pierde entera y en silencio.
- Los contadores por afiliado son cuatro (leads, agendados, alumnos, ingresos). No hay totales,
  ni ranking, ni gráfico, ni filtro de fechas.
- No se puede renombrar, desactivar ni borrar un afiliado.

**1. El link va a donde tú digas**

Eliges afiliado y funnel, y sale el link. Los funnels que existen hoy:

| Funnel | Dirección |
|---|---|
| Clase en directo | `/webinar` |
| Reserva de sesión | `/reservar` |
| Test de personalidad | `/test-personalidad` |
| MIFGE | `/mifge` |
| LT8 | `/lt8` |

**2. Funnel nuevo = aparece solo (esto es "el sistema" que pediste)**

La lista de funnels **no se escribe a mano en Afiliados**. Se lee del catálogo único que el OS ya
usa para medir en Ads (`FUNNEL_CATALOG` + la tabla `webs`). Dar de alta un funnel ahí ya es
obligatorio hoy para que mida, así que no añado ningún paso nuevo: **el funnel nuevo aparece solo
en el selector de Afiliados**, con su link listo.

**3. Una sola pieza de atribución para todos los funnels**

Saco la lógica repartida por cada funnel a **una pieza única** que usan los cinco: guarda quién lo
trajo (first touch: la primera fuente manda), pone las etiquetas y anota por qué funnel entró.

Y le pongo un **candado**: `npm run check:afiliados` hace fallar la construcción si un funnel del
catálogo tiene opt-in y no pasa por esa pieza. Sin el candado, esto es una promesa; con él, es
imposible que un funnel nuevo nazca sin atribución. Es el mismo patrón que ya frena el diseño
viejo y las listas sin paginar en este proyecto.

**4. La etiqueta de quién lo trajo**

Cada afiliado tiene su etiqueta, `fuente:marco_antonio`, `fuente:paolo`, `fuente:jp`. Se pone sola
en el contacto en cuanto entra por el link, y se ve en su ficha, en el CRM y en los filtros.

- La etiqueta **se crea al crear el afiliado**, no al primer lead. Hoy nace tarde y si nadie entra
  nunca, no existe.
- **Relleno hacia atrás**: los contactos que ya tienen fuente guardada pero se quedaron sin
  etiqueta la reciben. Nadie se queda fuera.
- El contacto también guarda **por qué funnel entró**, para poder cruzar afiliado por funnel.

**5. Que llegue hasta la venta**

Cuando el closer registra la venta, el afiliado del contacto queda escrito **en el evento de la
venta y en el aviso que te llega**. Los ingresos ya suben al afiliado hoy; lo que falta es verlo
sin tener que buscarlo. Al abrir la venta lees "vino de Paolo".

**6. Dashboard (pestaña 1)**

Con el filtro de fechas del OS, el mismo de Ads y Dashboard:

- Fila de totales: leads, agendados, alumnos, ingresos y el porcentaje de lead a alumno.
- **Ranking de afiliados en barras**, con el número escrito dentro de la barra.
- **Cruce afiliado por funnel**: qué funnel le funciona a cada persona.
- Evolución en el tiempo.
- Aviso claro cuando un afiliado tiene links creados y **cero leads**: o el link está roto o no lo
  ha usado. Hoy eso es invisible.

**7. Configuración (pestaña 2)**

- Crear afiliado. El identificador se propone solo a partir del nombre y se puede corregir.
- Crear los links que quieras por afiliado, uno por funnel, con copiar al portapapeles.
- Renombrar, activar y desactivar sin perder el historial. Desactivar no borra nada: el link deja
  de ofrecerse, pero sus leads y sus ingresos siguen contando.
- Los números de ese afiliado a la vista.

**Lo que arreglo de paso, porque afecta a los números:**

- Los contadores de hoy ignoran a quien está en seguimiento, no show, perdido o lead cualificado.
  Un afiliado que trae 40 leads y tiene 30 en seguimiento parece que trajo 10. Pasan a contarse.
- Crear afiliados sigue siendo solo para super_admin. Eso no cambia.

## Fases

**A · La base: atribución única y funnels conectados solos**
- [ ] Una sola pieza de atribución, usada por los cinco funnels
- [ ] El contacto guarda por qué funnel entró (`funnel_slug`) y se rellena hacia atrás
- [ ] Candado `npm run check:afiliados`, enganchado a construir

**B · Los links a cualquier funnel**
- [ ] Tabla de links (afiliado + funnel), con alta y baja
- [ ] La lista de funnels sale del catálogo único, no escrita a mano
- [ ] Crear y copiar link desde la pantalla

**C · Etiquetas de punta a punta**
- [ ] La etiqueta `fuente:<afiliado>` se crea al crear el afiliado
- [ ] Relleno hacia atrás de los contactos que ya tienen fuente y no tienen etiqueta
- [ ] El afiliado viaja hasta la venta: evento de venta y aviso

**D · Dashboard**
- [ ] Totales, ranking en barras, cruce afiliado por funnel y evolución
- [ ] Filtro de fechas del OS
- [ ] Aviso de link sin un solo lead

**E · Configuración**
- [ ] Crear, renombrar, activar y desactivar afiliado
- [ ] Links por afiliado y sus números

**F · Comprobar de verdad**
- [ ] Un lead de prueba por cada funnel con link de afiliado, verificado en el CRM
- [ ] Móvil primero, brandkit y los candados del proyecto en verde
- [ ] SOP en el Knowledge y automatización registrada

## Qué NO entra

- **Comisiones, pagos, contratos ni facturas.** Nada de dinero a pagar al afiliado.
- **Un acceso para que el afiliado entre a ver sus propios números.** Esto es para ti.
- **Tocar el diseño o el copy de los funnels.** Solo se lee a dónde apuntan.
- **Cambiar el proceso de venta ni el formulario de registrar venta.** Solo se le añade el dato de
  qué afiliado trajo a esa persona.
- **Tocar Ads, Meta, píxel ni eventos.**
- **Atribución multi touch.** Se mantiene first touch: la primera fuente que trajo al contacto
  manda, aunque después entre por otro link.
- **Nada fuera de Afiliados.** Los contadores del CRM y del Dashboard general no se tocan.

## Cómo lo verás

Entras a `/afiliados` y hay **dos pestañas**.

En **Dashboard**: arriba el filtro de fechas, debajo la fila de totales, y luego los gráficos.
De un vistazo sabes quién te trae gente, quién te trae dinero y por qué funnel.

En **Configuración**: la lista de afiliados. Abres uno, eliges un funnel de una lista desplegable,
y sale el link listo para copiar. Creas todos los que quieras.

La prueba de que funciona: entro con el link de un afiliado a cada funnel, dejo un lead de prueba,
y ese lead aparece en el CRM con la etiqueta `fuente:<afiliado>` puesta y sumando en el dashboard.
Te paso el link de localhost para que lo veas tú antes de publicar nada.

## Decisiones que tomé por mi cuenta

- **El link usa `utm_source=<afiliado>` y nada más.** Es exactamente lo que ya entiende el sistema
  hoy, así que los links de Paolo y JP que estén sueltos por ahí siguen funcionando igual. El
  funnel no hace falta meterlo en el link: se sabe por la página en la que cae la persona.
- **El identificador del afiliado no se puede cambiar una vez creado.** El nombre sí. Si cambiara
  el identificador, los links repartidos dejarían de atribuir y perderías el historial.
- **Desactivar no borra.** Un afiliado desactivado deja de ofrecerse para links nuevos, pero sus
  números siguen contando.
