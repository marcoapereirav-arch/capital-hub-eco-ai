---
title: Reset cache PWA — limpiar Service Worker del navegador
order: 3
area: sistemas
---

# Reset cache de PWA del OS

Cuando un usuario ve contenido viejo (ej. 404 en una ruta que ya funciona, UI sin actualizar tras deploy), suele ser cache del **Service Worker** del navegador. El OS es PWA y guarda copias offline.

## Solución rápida — `/reset-cache`

**URL para limpiar TODO automáticamente:**
```
https://os.capitalhubapp.com/reset-cache
```

Opcional con redirect después de limpiar:
```
https://os.capitalhubapp.com/reset-cache?next=/cualquier-ruta
```

### Qué hace la página

1. `navigator.serviceWorker.getRegistrations()` → unregister TODOS
2. `caches.keys()` → `caches.delete()` cada uno
3. `localStorage.clear()` + `sessionStorage.clear()`
4. Redirige a `?next=...` (o `/test-personalidad` por defecto) con `window.location.replace` para forzar reload completo

Implementación: `src/features/reset-cache/components/reset-cache-page.tsx` (public).

## Cuándo usar

- Cuando un usuario reporta 404 en una URL que SÍ funciona (confirmado por curl o Playwright)
- Tras deploy de cambios en rutas públicas o el propio SW
- Cuando aparece UI vieja después de un push

## Alternativa manual

Si por alguna razón `/reset-cache` no carga (raro), instrucciones manuales:

### Chrome / Edge
1. F12 → Application → Service Workers → "Unregister"
2. Application → Storage → "Clear site data" → "Clear"

### Safari / iOS
1. Ajustes → Safari → Borrar historial y datos de sitios web
2. O en macOS: Develop → Empty Caches

### Firefox
1. F12 → Storage → Cache Storage → click derecho → Delete All
2. Application → Service Workers → Unregister

## SW versionado — política

Archivo: `public/sw.js`

```js
const CACHE_NAME = 'capital-hub-v2-2026-06-17';
```

**Cada vez que cambie comportamiento crítico de páginas o se necesite invalidar cache global:** bump el `CACHE_NAME` con la fecha de hoy. El listener `activate` del SW borra cualquier cache que no coincida con el nombre actual.

## ⚠️ Crítico

**NO añadir fetch handler al sw.js.** Rompe iOS Safari PWA. La política de servicio actual es: el SW solo gestiona push notifications y cache offline opcional. NO intercepta fetches normales.

## Decisiones tomadas

- **2026-06-17:** Creada `/reset-cache` tras incidente donde Marco veía 404 en rutas que sí funcionaban (cache stale del SW por versión anterior con `notFound()`).
- **2026-06-17:** `CACHE_NAME` con fecha para forzar invalidación al deployar cambios críticos.
