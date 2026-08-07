# Estado del proyecto

> Se actualiza en cada cierre de chat. Dice la verdad de hoy, no la intención.

**Última actualización:** 2026-08-07

---

## Qué se hizo hoy

**El sistema NVISION al día, y sus tres piezas rotas arregladas.**

- Llegó la **puerta de entrada** (`.claude/hooks/puerta-de-entrada.mjs`): no se escribe en
  la carpeta principal, y no se escribe sin un PRP que Marco haya aprobado. Está activa y
  probada — bloqueó de verdad durante esta misma sesión.
- Llegaron `npm run publicar` y `npm run cerrar`: una sola orden cada una, sin preguntas.
  Faltaban por completo las dos máquinas (`scripts/publicar.mjs`, `scripts/cerrar.mjs`).
- Tres supuestos de la plantilla no se cumplían aquí y se arreglaron: la puerta no leía
  rutas con espacio (`Capital Hub`), `publicar` exigía escribir a mano la dirección de la
  web, y exigía un campo `version` que este proyecto llama `sha`.
- **Publicado y comprobado:** la web sirve `469d15a`. Tardó 8m 41s (el grueso es Vercel).

**La carpeta del repo, limpia.** 42 capturas, un vídeo de 241 MB y las fotos de Adrián a
`assets/`. Todo lo que no es del producto (restos de pruebas, entregas viejas, dos ficheros
con datos bancarios que estaban DENTRO de git) a `Capital Hub-archivo/`, fuera del repo.

Detalle completo: [`docs/sops/sistemas/11`](docs/sops/sistemas/11-plantilla-nvision-no-se-adapta-sola.md).

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
