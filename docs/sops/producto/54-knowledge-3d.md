---
title: Knowledge 3D (cerebro neuronal) + BD
order: 54
---

# Knowledge 3D: el Knowledge pasa a la base de datos y a un cerebro neuronal

Desde 2026-07-25 el Knowledge del OS deja de ser una lista de archivos y pasa al **modelo NVISION**: vive en la **base de datos** y se ve como un **cerebro neuronal 3D** navegable (WebGL) en `/knowledge`. Es lo que Marco quería: adaptar Capital Hub al sistema de NVISION.

## Cómo está montado

- **3 tablas nuevas** en la Supabase compartida (`aglyoyqtzozdnusltjxe`): `knowledges` (los documentos), `knowledge_folders` (carpetas jerárquicas N-nivel), `knowledge_settings` (nombre, color del núcleo, cuadrantes; editable desde el engranaje de la propia pantalla).
- **Cuadrantes**: los 5 de siempre: marketing, producto, ventas, finanzas, sistemas. Definidos en `src/features/knowledge/services/quadrants.ts` (colores verdes del brandkit).
- **Código**: `src/features/knowledge/` (cerebro + vista Carpetas + editor + archivador) y `src/app/(main)/knowledge/`. Server actions en `src/actions/knowledge.ts`. Portado de la skill `visual-knowledge` y rebrandeado a verde.
- **Páginas vivas** (brandkit, reporte del funnel): se preservan via `SPECIAL_RESOURCE_REDIRECTS` en `(main)/knowledge/[slug]/page.tsx` (al clicarlas abren su página real, no markdown).

## Seguridad (regla dura)

La RLS de las 3 tablas está a la medida de Capital Hub, **NO** el modelo `roles` de la plantilla:
- **super_admin** (`profiles.role='super_admin'` y activo): acceso total (leer + editar).
- **Equipo** (cualquier `profiles.active`): solo lectura.
- **Alumnos**: viven en la tabla `users`, **no** en `profiles`. La RLS exige fila en `profiles` para TODO. Por eso un alumno recibe **cero filas**. Estructural, no depende de acordarse.
- Se cerraron las policies `auth_read_*` que la plantilla dejaba abiertas a cualquier logueado (habrían filtrado el Knowledge a los alumnos, que comparten la misma BD). Si alguien re-aplica la plantilla, hay que volver a cerrarlas.

## docs/sops: qué papel juega ahora

Los archivos `docs/sops/` **se conservan** (git, con historial) y fueron la **fuente de la que se sembró** el Knowledge (67 documentos). Tras la migración, la **pantalla del OS lee de la BD**, no de los archivos.

> Pendiente de decidir con Marco: cuál es la fuente de verdad de aquí en adelante (editar en el cerebro 3D = BD, o seguir en archivos = git). Mientras se decide, conviven: la BD es lo que se ve, los archivos son el respaldo versionado. Si se edita en un lado, hay que sincronizar el otro.

## Cambios versionados

### 2026-07-25 — Creación
Migración del Knowledge de archivos a BD + cerebro 3D (modelo NVISION). 3 tablas aditivas con RLS admin/equipo/alumnos-cero, 67 docs sembrados, cerebro rebrandeado a verde en `(main)/knowledge`. Libs three + react-three-fiber. Verificado: build OK, cerebro con datos, cero errores, resto del OS intacto.
