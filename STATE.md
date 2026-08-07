# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-08

---

## Qué se hizo hoy

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

- **Los tokens dicen la verdad.** `accent` y `primary` valían gris y blanco: ahora valen el
  verde de marca `#22C55E` con tinta `#08130C`, y las dos familias tipográficas apuntan a
  Inter Tight de verdad (antes empezaban por `-apple-system`, así que en un Mac nunca se
  llegaba a ella).
- **Las 35 pantallas internas rehechas móvil primero**, en cinco oleadas con revisor.
  Medido a 375px con la versión de producción: botones más pequeños que un dedo **234 → 1**,
  textos ilegibles **1535 → 1**, señales de diseño viejo **619 → 0**, tapados por la barra
  **11 → 0**. Cero deslizamiento lateral en las 30.
- **Las 7 piezas del marco común**, que salen en todas a la vez: el notch, el teclado
  abierto, la hoja inferior, los flotantes que tapaban el menú, los márgenes, las zonas
  táctiles y la barra de abajo descuadrada.
- **Dashboard nuevo**: "la cadena". Contactos → Llamadas → Ventas, con cuánta gente se
  pierde en cada paso dibujado. Con ceros no queda vacío: señala el problema real.
- **Actividad reciente**: 10 en el panel, ventana con todo de 20 en 20, hora exacta y por
  dónde entró cada lead.
- **CRM minimalista**: buscador, acción principal y un solo botón de Filtros. Los ocho
  desplegables viven dentro.
- **Retirados**: los lead magnets (1 entrega en toda la base) y la agenda propia (0
  reservas). La agenda es Calendly.
- **Ads**: entra por Campañas y el gasto en euros.

**Tres cosas quedan ancladas para que no vuelva a pasar:**

| Qué | Dónde |
|---|---|
| Cómo se construye una pantalla | skill `os-movil-primero` (978 líneas) |
| Que no se pueda escribir diseño viejo | `scripts/check-brandkit.mjs`, al guardar y al construir |
| Que ninguna lista se pinte entera (máximo 20) | `src/components/ui/lista-paginada.tsx` + regla del candado |

El candado bloqueó mi propio trabajo cinco veces esta sesión, y las cinco tenía razón.

**Publicado y comprobado:** `/webs/lead-magnets` y `/agenda` dan 404 en producción, que es
la prueba de que la web sirve lo nuevo.

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
