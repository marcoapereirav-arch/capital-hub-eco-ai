# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-08

---

## Qué se hizo hoy

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
