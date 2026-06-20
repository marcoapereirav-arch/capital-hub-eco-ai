---
title: Reglas de UI — contraste y legibilidad
order: 47
area: producto
---

# Reglas de UI — contraste y legibilidad

El OS y los funnels son **uniformemente oscuros** (brandkit: `#0F0F12` fondo, `#F5F6F7` texto). En tema oscuro hay una clase de bug recurrente: **elementos del mismo color que su fondo → invisibles**. Este SOP la cierra de raíz.

## 🚨 Regla absoluta (dictada por Marco, 2026-06-20)

> **PROHIBIDO** poner texto, iconos, placeholders, bordes o cualquier elemento del **mismo color (o casi) que su fondo.** Si no se ve, está mal. No hay excepción "estética".

Antes de dar por terminada cualquier UI: comprobar que TODO lo que debe leerse tiene contraste real contra su fondo — incluido lo que pinta el **navegador** (autofill, controles nativos), no solo lo que pinto yo en JSX.

## Causa raíz #1 — Autofill de Chrome/Safari en tema oscuro

**Síntoma:** al rellenar un campo (sobre todo cuando el navegador recuerda el email/contraseña), el campo queda con **fondo claro y texto blanco → ilegible**.

**Por qué:** el `<html className="dark">` hace que `--foreground` sea blanco, así que el texto del input es blanco. Pero el autofill del navegador pinta su **propio fondo claro** (amarillo/blanco) por debajo del `bg-transparent` del input, y mantiene el texto blanco del tema. Resultado: blanco sobre blanco.

**Fix (en `src/app/globals.css`, aplica a TODA la app):**

1. `html { color-scheme: dark; }` — declara el documento como oscuro; el navegador renderiza autofill, scrollbars y controles nativos en modo oscuro.
2. Override explícito de `:-webkit-autofill` (belt-and-suspenders, porque el render varía por versión de navegador):

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
select:-webkit-autofill {
  -webkit-text-fill-color: var(--foreground);   /* texto siempre visible */
  caret-color: var(--foreground);
  -webkit-box-shadow: 0 0 0 1000px var(--card) inset;  /* repinta el fondo del tema */
  box-shadow: 0 0 0 1000px var(--card) inset;
  transition: background-color 9999s ease-in-out 0s;   /* retrasa el fondo claro nativo */
}
```

## Causa raíz #2 — Controles nativos invisibles (date/time pickers)

Mismo origen: el icono del calendario nativo aparece **negro sobre fondo oscuro**. Fix ya vigente: `color-scheme: dark` sobre `input[type="date|time|datetime-local|month|week"]` (ahora reforzado por el `color-scheme: dark` global del `html`).

## Checklist antes de cerrar una UI

- [ ] ¿Hay inputs? → probar autofill (con email guardado en el navegador), no solo tecleo manual.
- [ ] ¿Hay controles nativos (date/time/select)? → verificar que su UI nativa es legible en oscuro.
- [ ] ¿Algún texto/icono usa un color hardcodeado cercano al fondo? → subir contraste.
- [ ] Verificación visual real (screenshot/producción), no solo "el JSX se ve bien".

## Cambios versionados

- **2026-06-20** (v1): creado. Bug raíz: Adrián no veía lo que escribía en los campos de login/forgot-password (autofill blanco-sobre-blanco). Fix global `color-scheme: dark` en `html` + override `:-webkit-autofill`. Regla absoluta "nunca mismo color que el fondo" elevada a Knowledge.
