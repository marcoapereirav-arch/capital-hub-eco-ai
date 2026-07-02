---
title: Recursos de formación (App)
order: 51
---

# Recursos de formación (App del alumno)

Sistema de **recursos por formación** en la App: materiales que cuelgan de una formación y que se pueden **enlazar a las lecciones que se quiera** (M2M). Vive en la App (`capital-hub-app`), donde va todo el contenido de alumnos (ver REGLA DE ORO en SOP 02). Creado 2026-07-02.

## Qué resuelve

Cada formación tiene una sección **"Recursos"**. Un admin crea recursos (guías visuales, enlaces, archivos, texto) y los enlaza a lecciones concretas. El alumno los ve en dos sitios: en la sección Recursos de la formación (con las lecciones a las que están enlazados, visible) y dentro de cada lección enlazada ("Recursos de esta lección").

## Datos (Supabase compartida `aglyoyqtzozdnusltjxe`)

- `resources`: `id`, `formation_id` (FK formations), `title`, `description`, `type` (`GUIDE` | `LINK` | `FILE` | `TEXT`), `url` (LINK/FILE), `content` (TEXT), `guide_key` (GUIDE), `display_order`, `active`.
- `resource_lessons`: M2M `resource_id` <-> `lesson_id` (`unique(resource_id, lesson_id)`).
- RLS (calcado de `lessons`/`modules`): SELECT `true` para authenticated; INSERT/UPDATE/DELETE solo `current_app_role() in ('ADMIN','PROFESSOR')`.
- Migración en el repo App: `supabase/migrations/20260702120000_resources.sql`. **Aplicada a la BD viva** por Management API (las migraciones del repo App no son el esquema vivo, ver SOP 02 v6).

## Código (repo `capital-hub-app`, `web/src/`)

- `api/resources.ts`: capa de datos (supabase-js directo, patrón moderno como `training.ts`). `getFormationResources`, `getLessonResources`, `getResource`, `createResource`, `updateResource`, `deleteResource`, `setResourceLessons`.
- Admin: `pages/admin/AdminFormacionDetailPage.tsx` (sección Recursos: crear, editar, borrar, y enlazar a lecciones con chips que muestran a qué lección va cada uno).
- Alumno: `pages/training/FormationDetailPage.tsx` (sección Recursos + chips de lección enlazada), `pages/training/LessonViewer.tsx` (tarjeta "Recursos de esta lección"), `pages/training/ResourceViewer.tsx` (visor a pantalla completa).
- Ruta: `/training/recursos/:resourceId` (en `routes.tsx`, hereda el gate de `/training`).

## Guías visuales (type `GUIDE`)

Una guía visual es una página animada dentro de la App (React + SVG + reveals al scroll), servida por `ResourceViewer`. Se registran por clave:

- `web/src/features/guides/registry.tsx`: mapa `guide_key -> componente`.
- Primera guía: `vibe-coding` -> `features/guides/vibe-coding/VibeCodingGuide.tsx` (portada del OS, formación IA Integrator, con la marca Capital Hub: negro + verde acento, diagramas de los 4 lugares, main vs rama, commit/push/merge).

**Para añadir una guía nueva:** crear el componente en `features/guides/<key>/`, registrarlo en `registry.tsx` con su `guide_key`, y crear un recurso `type='GUIDE'` con ese `guide_key`. El resto (admin, enlace a lecciones, visor) ya funciona.

## Estado

- Verificado en producción (`app.capitalhubapp.com`) el 2026-07-02: sección Recursos en la formación IA Integrator, enlace visible a la lección "Bienvenida a IA Integrator", guía Vibe Coding renderizando, tarjeta en la lección, y panel de admin. Commit App `d96ac46`.
- Recurso seed: "Vibe Coding (al grano)" (`GUIDE`, `guide_key=vibe-coding`) en la formación IA Integrator (id 1), enlazado a la lección id 1.

## Cambios versionados

- **2026-07-02**: Creación de la feature. Tablas + RLS, API, admin, alumno, ResourceViewer, registry de guías + primera guía Vibe Coding. Pendiente: retirar la versión vieja del OS (`/formacion/ia-integrator`), y portar los otros dos manuales (método completo, Git) como guías.
