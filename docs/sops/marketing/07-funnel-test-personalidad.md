---
title: Funnel Test de Personalidad (Equilibria)
order: 7
---

# Funnel Test de Personalidad

Canal **principal** de captación de leads de Capital Hub (confirmado Marco 2026-06-15). No confundir con "captura solo desde Instagram": este funnel es la fuente real de leads.

## Qué es

Una landing pública (`/test-personalidad`) que ofrece **gratis** el test de personalidad de **Equilibria** (empresa colaboradora, el test NO es nuestro). El lead hace opt-in, recibe el acceso al test en la página de gracias, lo hace fuera de nuestro sitio y vuelve con el resultado por Instagram o WhatsApp, donde el setter conversa **manualmente**.

## Flujo end-to-end

```
1. Adrián difunde el test (Reels, stories, ads, conversaciones)
2. Lead llega a /test-personalidad (landing)
3. Pulsa un botón → se abre el POP-UP con el formulario opt-in
4. Rellena: nombre + email + teléfono (LOS 3 OBLIGATORIOS)
5. Submit → POST /api/optin/test-personalidad:
   - Upsert contacto por email (stage='lead' si es nuevo)
   - pipeline = "Test Personalidad" (slug 'test-personalidad') — NO el General.
     Si el contacto ya tenía pipeline_id, se PRESERVA (SOP 12/13).
   - phone guardado en el contacto (contactable por WhatsApp)
   - tag auto 'origen:test_personalidad' · origin/source 'landing_test_personalidad'
   - journey event 'optin_test_personalidad'
   - redirige a /test-personalidad/gracias
6. Gracias: agradece + botón "Abrir el test" (link Equilibria, pestaña nueva)
   + protocolo de 3 pasos: captura del resultado → enviarla por el MISMO chat
   de Instagram que ya tenían abierto, o por WhatsApp de Adrián.
7. Lead hace el test en Equilibria y manda screenshot → setter conversa manual
8. Si quiere agendar → setter le pasa /agenda?email=... → stage 'agendado' auto
9. Llamada → 'alumno'/'seguimiento'/'perdido' auto vía Registrar venta
```

## Estructura de la landing (copy aprobado por Marco)

Fuente del copy: `ch-copy-test-landing-optin.md` (raíz del repo).

- **Sección 1 — Hero**: eyebrow `Test gratis · 15 minutos · +500.000 personas lo han hecho`; titular *"Hay mil formas de vivir de internet. Esta te dice cuál es la tuya"*; subtítulo al avatar; botón **"Quiero hacer el test gratis"** → abre el pop-up.
- **Sección 2 — Qué es este test**: bloque Equilibria (lo usan multinacionales, +500.000 personas) + bloque resultado en 4 colores (fortalezas y limitadores); botón **"Hacer el test gratis"** → mismo pop-up.
- **Pop-up — Formulario**: título *"Déjame tus datos y entra al test"*; 3 campos (nombre · email · teléfono); botón **"Quiero hacer el test gratis"**; microcopy *"Te llega tu acceso y entras directo al test. Sin tarjeta, sin compromiso."*

> **Vídeo:** el copy contempla un vídeo de Adrián bajo el hero (PandaVideo/VTurb), pero **se lanza SIN vídeo**. Se añadirá cuando Marco facilite la URL.

## Configuración centralizada

`src/features/funnel-test-personalidad/config.ts` (un solo sitio):

| Valor | Contenido |
|---|---|
| `TEST_URL` | `https://pdi.equilibria.com/#/instructions/FULLES` |
| `WHATSAPP_NUMBER` | `34611874062` (Adrián, sin `+` ni espacios) |
| `INSTAGRAM_HANDLE` | `adrianvillanuevarios` |

## Archivos

- Landing: `src/features/funnel-test-personalidad/components/landing.tsx`
- Gracias: `src/features/funnel-test-personalidad/components/thank-you.tsx`
- Config: `src/features/funnel-test-personalidad/config.ts`
- Endpoint: `src/app/api/optin/test-personalidad/route.ts`
- Rutas: `src/app/(public)/test-personalidad/page.tsx` (+ `/gracias`)

La landing se muestra **siempre** (force-dynamic), sin gate draft/published, hasta nueva orden.

## Reglas

- Los 3 campos del opt-in son **obligatorios**. El teléfono es necesario porque el seguimiento es manual por WhatsApp/IG.
- El test es de **Equilibria** (externo): solo medimos opt-ins, no si terminó el test.
- El pipeline contextual es **"Test Personalidad"**; nunca sobreescribir un `pipeline_id` ya existente.
- Si cambia el copy de la landing, la fuente sigue siendo `ch-copy-test-landing-optin.md` + este SOP.

## ManyChat (futuro, no ahora)

De momento SIN ManyChat: el setter abre IG/WhatsApp manualmente. Cuando se reactive: comentario en Reel con keyword o story reply → envía el link de la landing. La fuente única hoy es `/test-personalidad`.

## Cambios versionados

### 2026-06-22 — Copy nuevo + pop-up + teléfono + URLs reales
- Rediseño de la landing con el copy aprobado de Marco (`ch-copy-test-landing-optin.md`): 2 secciones (Hero + "Qué es este test") y formulario en **pop-up** (antes era inline de 1 pantalla).
- Añadido **3er campo: teléfono (obligatorio)**, tanto en la UI como en el endpoint (Zod + guardado en `contacts.phone`).
- Página de gracias reescrita: agradecimiento + link al test + protocolo de 3 pasos (captura → Instagram/WhatsApp).
- Placeholders reemplazados por valores reales: `TEST_URL` = Equilibria, `WHATSAPP_NUMBER` = Adrián.
- Se lanza **sin vídeo** (pendiente URL de Adrián).
