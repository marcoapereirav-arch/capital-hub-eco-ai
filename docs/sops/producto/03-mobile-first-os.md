---
title: Mobile-First — Capital Hub OS
order: 3
---

# Mobile-First — Capital Hub OS

Capital Hub OS se distribuye como **PWA instalable**. En el teléfono se debe sentir como una **aplicación nativa de iOS/Android**, no como un sitio web responsive.

> El OS es **mobile-first**. Cualquier pantalla nueva o cambio en `(main)` se diseña primero para móvil y después se escala a desktop. La versión desktop existente queda **intocada** salvo que el cambio lo requiera explícitamente.

---

## Regla de oro

**Siempre que se toque una página de `src/app/(main)/*`:**

1. Mirar primero cómo se ve y opera en móvil (≤767px).
2. Adaptar el layout móvil aplicando los patrones de esta SOP.
3. Solo después validar que el desktop (≥768px) sigue intacto.

Si la diferencia entre móvil y desktop es trivial → un solo componente con clases `md:*` y `useIsMobile()` cuando hay lógica.
Si la diferencia es estructural → dividir en `xxx-mobile.tsx` + `xxx-desktop.tsx` y elegir en el padre con `<div className="md:hidden">`/`<div className="hidden md:block">`.

---

## Patrones nativos obligatorios

### 1. Bottom tab bar (estilo iOS)
- Barra fija en la parte inferior con **4 destinos principales** + 1 botón "Más".
- Altura visible: 56px. Padding inferior con `env(safe-area-inset-bottom)`.
- Iconos `lucide-react` 22-24px + label 11px en `font-mono` uppercase.
- Estado activo: foreground full, indicador 2px arriba.
- En desktop: **oculta** (`md:hidden`).

Destinos: **Dashboard · Tareas · Board · Knowledge · Más**.
"Más" abre un `Sheet` desde abajo con: CRM, Webs, Content Intel, Integraciones, perfil, logout.

### 2. Top header móvil (56px)
- Sticky top, fondo `card` con borde inferior 1px.
- Título de la sección a la izquierda en `font-heading` uppercase tracking 0.15em.
- Avatar usuario a la derecha (tap → user menu en sheet).
- **Sin** `SidebarTrigger` en móvil (el sidebar no existe).

### 3. Safe-area insets (notch + home indicator)
Toda chrome fija (header, bottom nav, sheets, botones sticky) **debe** respetar:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

Equivalente Tailwind con utilidades del proyecto: `pt-safe`, `pb-safe`, `px-safe`.

Y en `viewport`: `viewportFit: "cover"` (en `layout.tsx`).

### 4. `100dvh` no `100vh`
En iOS la barra del navegador hace que `100vh` sobresalga. Usar siempre **`h-dvh` / `min-h-dvh` / `100dvh`** para layouts full-screen.

### 5. Tap targets ≥ 44px
Apple HIG mínimo 44×44pt. Cualquier elemento interactivo en móvil debe medir al menos 44px en su lado más corto.

### 6. Inputs ≥ 16px (font-size)
Si un input tiene `font-size < 16px`, iOS hace zoom al hacer focus. **Nunca** usar `text-xs`/`text-sm` en inputs móviles.

### 7. Sin hover-only
En móvil no hay hover. Todo lo que vive en `:hover` debe tener equivalente en `:active` o aparecer ya visible. No esconder acciones tras hover.

### 8. Sheets > dropdowns
En móvil los menús contextuales se muestran como **bottom sheets**. Ya tenemos `<Sheet side="bottom">` en `components/ui/sheet.tsx`.

### 9. Listas verticales > tablas
Cualquier tabla > 4 columnas se reorganiza en móvil como **lista de cards** con la info principal arriba y secundaria pequeña debajo.

### 10. Scroll vertical único
La página móvil scrollea verticalmente. Evitar scroll horizontal salvo en tabs/segmented controls intencionalmente horizontales.

---

## Breakpoints canónicos

| Tamaño | Breakpoint | Significado |
|---|---|---|
| `< 768px` | (default) | **Móvil**. MobileShell con bottom tab bar. |
| `≥ 768px` | `md:` | **Desktop**. Sidebar existente. |

> El proyecto solo distingue 2 modos. No hay tablet intermedio — un iPad usa el desktop.

Hook: `useIsMobile()` en [src/hooks/use-mobile.ts](../../src/hooks/use-mobile.ts) (breakpoint 768px, SSR-safe).

---

## Clases Tailwind canónicas

```tsx
// Mostrar solo en móvil
<div className="md:hidden">…</div>

// Mostrar solo en desktop
<div className="hidden md:block">…</div>

// Header sticky móvil con safe-area
<header className="sticky top-0 z-40 h-14 pt-safe bg-card border-b border-border md:hidden">

// Bottom tab bar fijo con safe-area
<nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-card border-t border-border md:hidden">

// Contenedor full-bleed móvil + padding desktop
<main className="px-4 md:px-8 pb-24 md:pb-8 min-h-dvh">

// Botón sticky bottom (form móvil)
<div className="sticky bottom-0 pb-safe bg-card pt-3 px-4 -mx-4">
```

---

## Anti-patrones (NO hacer)

- ❌ Mostrar el `AppSidebar` desktop en móvil — sustituirlo por MobileShell.
- ❌ Tablas con scroll horizontal como solución móvil.
- ❌ Modales `dialog` centrados en móvil — usar `Sheet side="bottom"`.
- ❌ `100vh` sin fallback `dvh`.
- ❌ Reducir tipografías por debajo de 14px en cuerpo, 16px en inputs.
- ❌ Esconder el bottom tab bar al hacer scroll (genera mareo de descubrimiento).
- ❌ Diseñar primero desktop y "después" adaptar a móvil.

---

## Cambios versionados

### 2026-05-01 — Creación
SOP creada al iniciar el rediseño Mobile Native OS (proyecto `p_mobile_native_os`).
Base: la app ya era PWA instalable pero el interior `(main)` estaba pensado desktop-first con sidebar fijo. Se introduce `MobileShell` con bottom tab bar y bifurcación a nivel de `(main)/layout.tsx`.
