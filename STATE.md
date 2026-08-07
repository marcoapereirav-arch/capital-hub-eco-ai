# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-07

---

## Qué se hizo hoy

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
