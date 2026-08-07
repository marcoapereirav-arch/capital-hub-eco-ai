# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-07

---

## Qué se hizo hoy

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
