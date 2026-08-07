---
title: Producto — índice
order: 0
---

# Producto

Cómo se construye y opera el OS: arquitectura, mobile-first, deploy, protocolos del agente, integración con servicios externos.

| # | Documento | Qué contiene |
|---|---|---|
| 01 | [Operaciones — la lista de tareas](01-board-y-sistema-tareas.md) | UNA lista, un solo nivel: título, descripción, P1/P2/P3 y responsable. Se tiró el sistema GTD + PARA (board, proyectos, áreas, focos) el 2026-08-07 |
| 02 | [Arquitectura OS vs App](02-arquitectura-os-app.md) | Capital Hub OS (admin) vs Capital Hub App (cliente) — proyectos separados |
| 03 | [Mobile-First OS](03-mobile-first-os.md) | El OS es mobile-first. Bottom tab bar, safe-area, dvh, breakpoints |
| 04 | [Protocolo de trabajo del agente](04-protocolo-trabajo-agente.md) | Reglas auto-board, auto-knowledge, auto-commit, no inventar UI, hablar claro y sin tecnicismos |
| 05 | [Protocolo de proyectos externos](05-proyectos-externos.md) | Verificar nombre/URL antes de tocar Supabase / Vercel / GitHub / Stripe / DNS |
| 06 | [Vercel - deploy y colaboración](06-vercel-deploy-y-colaboracion.md) | Producción en team Pro de Adrian. Workflow diario, env vars, dominios |
| 07 | ~~Misión Producto Terminado~~ | **RETIRADO el 2026-08-07.** La pantalla `/mision`, su tabla y sus 67 tareas se borraron de raíz: era el mismo sistema de tareas con otra cara. `/mision` redirige a `/operaciones`. Ver SOP 01 |
| 47 | [Reglas de UI — contraste y legibilidad](47-reglas-ui-contraste-legibilidad.md) | Nunca texto/icono del color del fondo. Fix autofill blanco-sobre-blanco en dark mode + controles nativos |
| 48 | [Diseño dinámico y efecto WOW](48-diseno-dinamico-wow.md) | Regla principal: funnels/landings dinámicos, con motion y WOW, siempre dentro del brandkit |
| 49 | [Efecto de carga de marca (SIEMPRE)](49-efecto-de-carga.md) | `<LoadingScreen />` (anillo + monograma CH) en TODA carga. `app/loading.tsx` de raíz. Nada de spinners genéricos ni pantallas en blanco/gris |
| 50 | [Capital Hub App (alumnos) — Auditoría de estado](50-app-alumnos-auditoria-estado.md) | Estado real de la App del alumno (proyecto separado). Qué funciona, bugs P0/P1/P2, schema drift, hueco de pago→acceso. Se actualiza con cada cambio en la App |
| 51 | [Recursos de formación (App)](51-recursos-formacion-app.md) | Recursos por formación enlazables a lecciones (M2M) en la App. Guías visuales (type GUIDE) via registry. Tablas resources + resource_lessons + RLS |
| 52 | [Venta manual + ventas por completar](52-venta-manual-y-pendientes.md) | Mover a mano dispara notificaciones; popup ahora/más tarde al pasar a Alumno; botón "Registrar venta" en la ficha; bloque "Ventas por completar" en dashboard; columna `sale_pending` |
| 53 | [Notificaciones al equipo (in-app + push)](53-notificaciones-push.md) | Helper central `notifyAdmins` (in-app + web-push) en lead, agenda, venta, CRM manual y sistema. SIN emojis (REGLA #8). Click lleva al lugar del evento (tabla de destinos). Preferencias por usuario en `/perfil` (tabla `notification_preferences`). Interruptor push por dispositivo. Requisitos push iOS |
| 55 | [Formador vs Administrador (App)](55-formador-vs-admin.md) | Un formador es ADMIN con `formacion_asignada`. Identidad desde `public.users` (no del token), candados en UI + API + RLS, previsualización de formador real |
| 56 | [El Estudio: panel del formador](56-estudio-panel-formador.md) | Árbol + inspector en una sola pantalla. Seguimiento de alumnos con gráficas, borrador/publicado por módulo y lección, las tres formaciones son fijas, taller de presentaciones y editor de solo texto |
| 57 | [Sistema visual — hub](57-sistema-visual-hub.md) | `/sistemas`: hub con una tarjeta por sistema/workflow (fuera de `/webs`, ya no se agrupa con Webs). Board estilo Miro del **Funnel del Webinar** en `/sistemas/webinar` (fecha y tag en vivo). Cómo añadir un sistema nuevo |
| 58 | [Purga del brandkit antiguo (App)](58-purga-brandkit-antiguo-app.md) | La App tenía DOS brandkits: `accent` se llamaba bien pero valía `#FFFFFF`. Acento a VERDE, Inter Tight única, cinturones, `Sparkles` fuera. Dónde entra el formador a editar (tarjeta en Inicio + lápiz en la tarjeta de la formación) |
| 59 | [Archivo ordenado de vídeos en Bunny](59-bunny-archivo-ordenado.md) | El árbol `Testimonios / VSLs / Formaciones / [formación] / [módulo] / [lección].mp4`. Stream NO anida carpetas (comprobado en su API): el árbol vive en Bunny **Storage**. Reloj cada 10 min que archiva solo. Las carpetas siguen al nombre si lo renombran |
| 60 | [Clipper sustituye a Media Buyer](60-clipper-sustituye-media-buyer.md) | Las tres formaciones pasan a ser IA Integrator, Comercial Closing y **Clipper**. Migración con freno: se detiene sola si alguien tuviera Media Buyer comprado. Los cinco sitios donde el nombre estaba escrito a mano |
| 61 | [Tutoriales (formación interna)](61-tutoriales-formacion-interna.md) | `/tutoriales` en el OS: vídeos en carpetas para **todo el equipo interno**. Dos formas de meter vídeo (archivo a Bunny en `Tutoriales OS`, o link de Loom). Candado copiado de `knowledges`: alumno cero. **Pendiente de seguridad** de la puerta de subida de la App, y por qué no se cerró todavía |

## Formaciones (material de presentación)

| Carpeta | Qué contiene |
|---------|--------------|
| [ia-integrator/](ia-integrator/00-readme.md) | **Formación IA Integrator**: los tres entrenamientos (cómo funciona todo · cómo usar el sistema · trabajar en equipo). Cada uno tiene su página visual en `/formacion/ia-integrator`. Se construyen con la skill `formacion-visual` |
