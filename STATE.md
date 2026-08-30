# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-30
---

## Qué se hizo el 2026-08-29 · el parte del setter deja de perder su propio historial

Marco: *"necesito un registro diario (historial) de las veces que se registra actividad del
setter... que ahí se pueda editar y se pueda ver quién registra y quién editó ya, qué hora y
TODO lo necesario para tener claridad"*.

**Lo que había, medido en el código y en la base, no supuesto:** el parte se guardaba
**pisando** la línea anterior. El valor viejo desaparecía para siempre. No se guardaba quién
lo escribió ni quién lo corrigió. No había ninguna pantalla del día a día: los números solo
salían **sumados** en el Dashboard. Y **nadie podía corregir el parte de otro**, ni un
administrador: si Juanda se equivocaba, solo Juanda podía arreglarlo.

- **El rastro lo escribe la BASE, no la pantalla.** Un disparador guarda una línea por cada
  guardado, con quién lo firmó, la hora, el antes y el después y qué campos cambiaron. Es
  imposible guardar sin dejar huella: da igual que venga del botón, de la API o de una
  consulta a mano. El historial **no tiene política de escritura**: nadie lo edita ni lo
  borra, ni un administrador. Un guardado que no cambia ningún número no deja línea.
- **Un administrador puede registrar y corregir el parte de un setter**, y queda firmado con
  su nombre. Abrir eso no pierde trazabilidad: la crea.
- **Pantalla nueva `/actividad`**, primera ruta de la sección **Ventas** del menú, que
  existía en el Knowledge y no en el OS. Registrado hoy · los cuatro totales · gráfico día a
  día · historial de 20 en 20 · ficha del día con la línea de tiempo completa y el botón de
  corregir.
- **Los días sin parte se ven, con un guion.** No registrar no es haber hecho cero.
- **Las horas son las de Madrid**, nunca el UTC crudo (REGLA #23).
- Los 4 partes que ya existían se rellenaron hacia atrás, marcados como **reconstruidos**.
  De los dos que se corrigieron antes de que esto existiera, la ficha dice en voz alta que
  hubo una corrección pero que los valores de antes no se guardaron, en vez de inventarlos.

**Dos decisiones de diseño que costaron una pasada cada una:**

| Qué pasaba | Por qué |
|---|---|
| La carta del historial alargaba tanto la página que el botón de **Siguiente** había que ir a buscarlo | Marco lo pidió: la lista se desplaza **por dentro**, con tope de alto y **sin** `overscroll-contain`. Con `contain`, una página con pocas filas se tragaría el gesto y congelaría la pantalla |
| El cajón de la ficha del día salía pegado a la **izquierda** | Las clases base de la hoja usan el selector `data-[side=bottom]:`, que pesa más que un `md:`. Se arregla con el importante, y en Tailwind 4 el `!` va **al final** |

Los dos eran **fallos mudos**: tipos, candados y build en verde. Solo se ven mirando.

**Anclado para que no se repita:**

| Qué | Dónde |
|---|---|
| El sistema entero (qué se mide, quién corrige, qué guarda el rastro) | [`producto/63`](docs/sops/producto/63-actividad-setter-historial.md) |
| La carta larga que se desplaza por dentro, y sus dos condiciones | [`producto/62`](docs/sops/producto/62-un-solo-scroll-por-pantalla.md) + skill `os-movil-primero` |
| El `!` de Tailwind 4 y la especificidad de las clases del kit | skill `os-movil-primero`, errores ya cometidos |
| El disparador, en el panel de Marco | `/automatizaciones` como `parte_diario_rastro` + [`producto/30`](docs/sops/producto/30-automatizaciones-estado.md) |

**Publicado y comprobado en producción.** Datos de prueba borrados: solo quedan los 3 partes
reales de Juanda y el de la cuenta de pruebas del 8 de agosto.

---

## Qué se hizo el 2026-08-11 · el panel de Ads y un fallo de números

**El panel de Campañas rehecho entero, siguiendo una referencia que pasó Marco.**

Antes de esto rechazó tres versiones seguidas: *"horrible, básico, no me estás diseñando el
gráfico que busco"*. El bloqueo era mío: **el chat no podía abrir la captura de referencia**
y estuve diseñando a ciegas. Se resolvió mandando a otro agente a leerla y describirla.

- **Siete gráficos, en rejilla con un héroe grande**: gasto y leads día a día (curva medida
  en píxeles, con ficha flotante), rosco del reparto del gasto, embudo que estrecha, medidor
  del coste por lead con la marca del periodo anterior, anillos por plataforma, barras por
  día de la semana y barras por edad.
- **El lenguaje visual quedó escrito como ley**: fuera rejilla y líneas de eje, el número
  encima de la barra, degradado dentro del trazo, rampa monocroma del verde, escalas
  redondeadas, una barra ocupa el 60-80% de su banda, un dibujo codifica una sola cosa.

**Y el fallo gordo, que no era de diseño: los leads venían contados TRES veces.**

Salió solo al poner el coste por lead al lado del embudo, porque los dos números se
contradecían en la misma pantalla. Meta devuelve el mismo lead con tres nombres y uno ya
incluye a los otros dos; el código los sumaba. Decía 75 leads cuando eran **25**, y 1.144
páginas cargadas de 1.011 clics: más gente llegando que saliendo. **Todos los números del
panel estaban inflados x3 desde que se construyó.**

**Doce defectos más** los encontró una revisión visual del panel ya terminado, midiendo
sobre la imagen: el eje sin redondear, la mini línea en 1 de 5 tarjetas, barras de 10 puntos
en bandas de 88, tres campañas que se leían iguales por su prefijo común, el aro pintando de
verde apagado al que se lleva el 68%.

**Anclado para que no se repita:**

| Qué | Dónde |
|---|---|
| Cómo se dibuja un gráfico del OS | skill `brandkit-capital-hub`, sección 8 bis |
| Qué hay en el panel y por qué | `docs/sops/marketing/10-panel-campanas-meta.md` |
| Si no puedo ver algo, lo mira otro agente | protocolo del agente, REGLA #30 |
| Lo que yo diseño lo revisa otro midiendo píxeles | protocolo del agente, REGLA #31 |

**Publicado y comprobado en producción.**

---

## Qué se hizo el 2026-08-07

**Afiliados pasa de una pantalla con un link fijo a un sistema completo.**

Marco: *"el link no puede ir solo a test de personalidad… yo lo quiero crear directamente
con cualquier funnel que yo quiera"*.

- **Dos pestañas** en `/afiliados`: Dashboard (visitas, personas, agendados, alumnos e
  ingresos, con el filtro de fechas del OS, ranking, cruce por funnel y evolución) y
  Configuración (cada persona, sus links, renombrar y activar o desactivar).
- **El link va al funnel que se elija.** El destino fijo escrito a fuego se retiró. La lista
  sale del catálogo único del OS, así que **un funnel nuevo aparece solo**.
- **Tres de los cinco funnels no guardaban de dónde venía el lead** (reservar, mifge, lt8):
  entraba con el link de Paolo y se guardaba sin fuente, en silencio. La atribución pasa a
  una pieza única con candado (`npm run check:afiliados`).
- **Los links apuntaban al dominio del OS**, no al público. Corregido.
- **Los contadores escondían gente**: seguimiento, no show, perdido y lead cualificado no
  salían en ningún número.
- **Etiquetado de punta a punta**: `fuente:<afiliado>` nace con el afiliado (no con su primer
  lead) y se rellenó hacia atrás en 18 contactos; el contacto guarda además por qué funnel
  entró; al registrar la venta el afiliado queda escrito en la venta y en el aviso.
- **Traqueo de cada link**: tabla `affiliate_visits` alimentada desde el layout público, así
  que se mide incluso en funnels sin formulario (LT8, MIFGE). Registrado en
  `/automatizaciones`.

Knowledge: [`marketing/11-afiliados.md`](docs/sops/marketing/11-afiliados.md).

**Dos fallos de raíz que Marco encontró y que ya no pueden volver:**

| Qué pasaba | Arreglo de raíz | Qué lo impide |
|---|---|---|
| La pantalla no se dejaba desplazar con el puntero encima de la lista | `ListaPaginada` ya no crea cajón propio (`propioScroll` como excepción). Cae en las 5 pantallas que la usan | `check:movil` mide los cajones que atrapan el gesto |
| El botón flotante tapaba el último botón de cada pantalla en ordenador | Una línea en `PageContainer` (`md:pb-24`), que cae en las 35 | `check:movil` mide los botones que el flotante deja sin pulsar |

Los dos eran **fallos mudos**: sin error, con los tipos y la construcción en verde, y con la
captura de pantalla completa viéndose perfecta. Reporte en
[`producto/62`](docs/sops/producto/62-un-solo-scroll-por-pantalla.md) y regla escrita en la
skill `os-movil-primero` (secciones 2 bis bis y 2 ter).

**Pendiente que no puedo cerrar yo:** la atribución de `/reservar` depende del webhook de
Calendly, que **nunca ha corrido** (`calendly_webhook_log` con 0 filas). El código ya manda
las UTMs dentro de la reserva y las lee de forma defensiva, pero hace falta **una reserva de
verdad** para confirmarlo. Las visitas de ese link sí se cuentan igual.

**Herramienta nueva:** `npm run db:sql <archivo.sql>` aplica migraciones a la base real sin
depender del MCP de Supabase, que en sesiones no interactivas no está autorizado. Sin esto,
el archivo de migración se escribía y **nunca llegaba a la base**.

---

## Qué se hizo el 2026-08-07

**Operaciones deja de ser un sistema y pasa a ser UNA lista.**

Marco: *"no lo hemos usado en meses… lo vamos a organizar solo en un nivel de tareas y ya
está"*. Se retiró el sistema GTD + PARA entero.

- **La tarea tiene cuatro cosas**: título, descripción, prioridad `P1/P2/P3` y responsable
  (una persona real del OS, leída de `profiles` — no una lista escrita a mano). Tres
  estados: pendiente, hecha, archivada. Y se puede eliminar.
- **Filtros** por estado, prioridad, responsable y texto; **orden** por prioridad o fecha.
  En el teléfono, hoja inferior; en el ordenador, una fila.
- **Borrado**: 247 tareas sin hacer, 67 de Misión, 33 proyectos, 4 áreas, 2 recursos, el
  foco del webinar, las pantallas Dashboard/Áreas/Proyectos/Board, y **Misión de raíz**
  (`/mision`, su feature y la tabla `launch_phases`). Fuera también `para_items` y `focuses`.
- **Se queda el historial**: 262 tareas hechas, con la prioridad traducida a la escala nueva
  y el responsable enganchado a su perfil real. Copia de seguridad de las 510 en
  `archivo/backup-operaciones-2026-08-07.json` (fuera de git).
- **Una sola ruta**: `/operaciones`. Las viejas (`/overview`, `/tasks`, `/board`,
  `/projects`, `/areas`, `/mision`) redirigen ahí: nadie se come un 404.
- **Permisos**: la política de `tasks` pasa de `is_admin()` (solo super_admin) a
  `is_os_user()` (cualquier usuario activo del OS). Con responsable por persona, una tarea
  que su responsable no puede abrir no sirve de nada.

Lo aprendido está en el SOP `producto/01` (que era el del board y ahora es el de la lista),
incluidas las dos trampas que costaron tiempo: el token `--color-brand` que pintaba
transparente y el `.next` viejo que tumbó la publicación dos veces.

**Pendiente de Marco:** confirmar que le parece bien que la lista la vea todo el equipo del
OS y no solo él y Adrián.

---

**El OS entero pasa al brandkit y a móvil primero. 29 de 30 pantallas sin ningún fallo.**

---

**El teléfono: cuatro cosas arregladas y UNA sin resolver.**

Marco abrió el OS en su iPhone y encontró cuatro fallos. Tres están resueltos y uno no.

| Lo que encontró | Estado |
|---|---|
| El menú de abajo con secciones que no usa, y "Más" sin salida | **Resuelto.** Dashboard, CRM, Ads, Instagram, y "Más" con su botón de Cerrar |
| El widget de registrar venta se solapaba y no se podía cerrar | **Resuelto.** Usaba `vh`, que en el iPhone incluye la zona del reloj, así que la X quedaba debajo del reloj |
| El avatar no llevaba a ningún sitio | **Resuelto.** Abre tu cuenta con Mi perfil y Cerrar sesión |
| **La franja negra de abajo** | **SIN RESOLVER.** Seis intentos |

De paso, un fallo real que llevaba ahí desde siempre: **los tres tonos oscuros del OS no
eran los del brandkit.** El fondo era `#040506`, casi negro puro, en vez del carbón
`#0F0F12`. Estaban escritos en otro formato y convertidos a ojo. Corregidos.

Y todas las ventanas emergentes del OS pasaron al patrón nativo: se pintan en el `body`,
un solo desplazamiento y salida visible a 44 puntos.

---

## Qué queda pendiente

**La franja negra del iPhone.** Todo lo aprendido, los seis intentos que NO funcionaron y
por dónde seguir están en [`producto/62`](docs/sops/producto/62-franja-negra-abajo-sin-resolver.md).
Falta **un solo dato** del teléfono de Marco, y ya está montado el medidor que lo manda
solo. Marco lo sigue en otro chat.

Lo demás que sigue abierto: las 20 listas viejas sin paginar y las comprobaciones que solo
se pueden hacer en un iPhone de verdad.

---

## Qué queda pendiente

- **20 listas viejas sin paginar** (Content Intel con 2.041 vídeos y Tareas con 501 son las
  que más urgen). Apuntadas como deuda en `.brandkit-debt.json`; las nuevas ya no pueden
  colarse.
- **Las tres comprobaciones que ninguna máquina puede hacer**: el notch, el teclado abierto
  y el teléfono girado. En Chromium sin pantalla la zona segura vale cero, así que salen
  limpias aunque estén rotas. Hay que mirarlas en un iPhone.
- **El Board** es la única pantalla con avisos, y es a propósito: su lienzo se arrastra.

---

## Qué queda pendiente

- **Pegar el prompt de [`sistemas/11b`](docs/sops/sistemas/11b-prompt-para-nvision.md) en el
  repo de NVISION.** Son 5 fallos de la plantilla, con la prueba que los cierra. Hasta que
  NVISION los corrija, los parches viven en local y **la próxima actualización los pisa**.
- **Los datos bancarios siguen en el historial de git.** Salieron del repo hoy, pero los
  commits viejos los conservan. Sacarlos de ahí es una operación aparte, con su decisión.
- **4 carpetas de chats ya publicadas sin recoger** (`ads-eventos`,
  `calendly-setter-metricas`, `dashboard-ads`, `operaciones-lista-simple`) y **2 fantasma**
  (`permisos-equipo`, `tutoriales`). Se recogen con `npm run chat:cerrar -- --limpiar`.
  No se tocaron: son de otros chats.

---

## Cómo trabaja el sistema ahora

```
Marco dice qué quiere
    ↓
npm run chat:nuevo <nombre>     ← su carpeta y su rama, de una vez
    ↓
PRP pegado en el chat + panel de tareas → SE ESPERA SU OK
    ↓
construir dentro de esa carpeta
    ↓
npm run publicar   (o npm run cerrar, que publica y además cierra)
```

La puerta bloquea todo lo que se salte esos pasos. No es un aviso: devuelve error.
