---
title: Prioridad actual — junio 2026
order: 4
area: operacion
---

# Prioridad actual del proyecto — junio 2026

> Este SOP captura el **orden estratégico vigente** que dicta Marco. Cuando una decisión nueva del usuario cambia el orden, se actualiza este archivo en el mismo commit.

## 🎯 Bloque #1 — PRODUCTO end-to-end (ahora)

**Objetivo:** Cualquier alumno puede pagar, entrar a la App y consumir su producto SIN fricciones técnicas.

El flow canónico está documentado en [`12-sistema-end-to-end.md`](../producto/12-sistema-end-to-end.md). El closer apunta la venta → se dispara magic link → alumno activa → entra a la App → ve su contenido → consume → comunidad funciona.

### Sub-bloques

1. **Smoke test e2e del flow venta → alumno activado** (Marco quiere ver esto pasar end-to-end con un user real)
2. **Catálogo App: bloqueo por producto** (`user_formation_unlocks` o filtrado por `routes.product_key` matcheando `student_invites.products`) — sin esto el alumno entra pero NO ve su contenido
3. **Comunidad operativa** (1 comunidad por producto, feed posts, reacciones+comments básicos)
4. **Q&A por formación** (alto valor experiencia, estructura BD existe)
5. **Reenviar magic link** desde drawer del contacto (si alumno pierde email)

## 🎯 Bloque #2 — ACCESO al EQUIPO (después del #1)

**Objetivo:** Marketing, formador, closer y setter pueden entrar al OS con sus credenciales y ven exactamente lo que necesitan.

1. **Definir permisos exactos closer / setter** (pendiente — Marco)
2. **Verificar `canAccessRoute()` en todas las rutas** (gate server-side, ver SOP 41)
3. **Test con 4 usuarios test** (uno por rol marketing / formador / closer / setter)
4. **Reenviar invitación de equipo** (endpoint análogo al de alumnos)

## ⏸ Bloqueado por Adrián (no toco)

| Item | Bloqueado por | Estado |
|---|---|---|
| Instagram metrics reales | Adrián completar checkpoint Meta + generar System User Token | tarea urgent BD |
| Meta Ads dashboard | Mismo token | tarea urgent BD |
| SSO OS↔App (Magic Link Bridge) | Adrián crear Edge Function `magic-link-for-staff` en repo App | tarea urgent BD |
| Webinar 8/8/2026 formato | Adrián | tarea urgent BD |

## 🕓 Después (post #1 y #2)

- ManyChat flows (DM bot automation del orgánico)
- Funnel `/test-personalidad` placeholders
- Bunny Stream (player + upload)
- Calendly clonado interno
- Tracker Ads completo
- Stories metrics

## Reglas de este SOP

- Si Marco re-prioriza, este archivo cambia **en el mismo commit** que la primera acción del bloque nuevo
- Lo que está en "Bloqueado por Adrián" NO se intenta empujar yo desde aquí
- Lo que está en "Bloque #1" tiene prioridad sobre **cualquier otra tarea urgent** en BD que no sea de este bloque

## Histórico

- **2026-06-17 13:30**: Marco dicta orden vigente. Producto end-to-end primero, equipo después, IG/Meta/Funnel/ManyChat después. Esto reemplaza la propuesta previa (que ponía el funnel test-personalidad como #1).
