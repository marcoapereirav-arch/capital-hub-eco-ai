---
title: Producto — índice
order: 0
---

# Producto

Cómo se construye y opera el OS: arquitectura, mobile-first, deploy, protocolos del agente, integración con servicios externos.

| # | Documento | Qué contiene |
|---|---|---|
| 01 | [Board y sistema de tareas](01-board-y-sistema-tareas.md) | GTD + PARA, board visual, stages, regla auto-sync |
| 02 | [Arquitectura OS vs App](02-arquitectura-os-app.md) | Capital Hub OS (admin) vs Capital Hub App (cliente) — proyectos separados |
| 03 | [Mobile-First OS](03-mobile-first-os.md) | El OS es mobile-first. Bottom tab bar, safe-area, dvh, breakpoints |
| 04 | [Protocolo de trabajo del agente](04-protocolo-trabajo-agente.md) | Reglas auto-board, auto-knowledge, auto-commit, no inventar UI |
| 05 | [Protocolo de proyectos externos](05-proyectos-externos.md) | Verificar nombre/URL antes de tocar Supabase / Vercel / GitHub / Stripe / DNS |
| 06 | [Vercel - deploy y colaboración](06-vercel-deploy-y-colaboracion.md) | Producción en team Pro de Adrian. Workflow diario, env vars, dominios |
| 07 | [Misión Producto Terminado — dashboard /mision](07-mision-producto-terminado.md) | Dashboard del lanzamiento al 2026-05-31. Reutiliza tasks + para_items, añade fases y bloques. 66 tareas seedeadas |
| 47 | [Reglas de UI — contraste y legibilidad](47-reglas-ui-contraste-legibilidad.md) | Nunca texto/icono del color del fondo. Fix autofill blanco-sobre-blanco en dark mode + controles nativos |
| 48 | [Diseño dinámico y efecto WOW](48-diseno-dinamico-wow.md) | Regla principal: funnels/landings dinámicos, con motion y WOW, siempre dentro del brandkit |
| 49 | [Efecto de carga de marca (SIEMPRE)](49-efecto-de-carga.md) | `<LoadingScreen />` (anillo + monograma CH) en TODA carga. `app/loading.tsx` de raíz. Nada de spinners genéricos ni pantallas en blanco/gris |
| 50 | [Capital Hub App (alumnos) — Auditoría de estado](50-app-alumnos-auditoria-estado.md) | Estado real de la App del alumno (proyecto separado). Qué funciona, bugs P0/P1/P2, schema drift, hueco de pago→acceso. Se actualiza con cada cambio en la App |
| 51 | [Recursos de formación (App)](51-recursos-formacion-app.md) | Recursos por formación enlazables a lecciones (M2M) en la App. Guías visuales (type GUIDE) via registry. Tablas resources + resource_lessons + RLS |
| 52 | [Venta manual + ventas por completar](52-venta-manual-y-pendientes.md) | Mover a mano dispara notificaciones; popup ahora/más tarde al pasar a Alumno; botón "Registrar venta" en la ficha; bloque "Ventas por completar" en dashboard; columna `sale_pending` |
| 53 | [Notificaciones al equipo (in-app + push)](53-notificaciones-push.md) | Helper central `notifyAdmins` (in-app + web-push) en lead, agenda, venta, CRM manual y sistema. SIN emojis (REGLA #8). Click lleva al lugar del evento (tabla de destinos). Preferencias por usuario en `/perfil` (tabla `notification_preferences`). Interruptor push por dispositivo. Requisitos push iOS |

## Formaciones (material de presentación)

| Carpeta | Qué contiene |
|---------|--------------|
| [ia-integrator/](ia-integrator/00-readme.md) | **Formación IA Integrator**: los tres entrenamientos (cómo funciona todo · cómo usar el sistema · trabajar en equipo). Cada uno tiene su página visual en `/formacion/ia-integrator`. Se construyen con la skill `formacion-visual` |
