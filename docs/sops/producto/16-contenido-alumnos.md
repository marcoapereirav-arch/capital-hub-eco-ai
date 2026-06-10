---
title: Contenido alumnos · gestor con embed multi-provider
order: 16
area: producto
---

# Contenido alumnos — gestor de formaciones con embed multi-provider

Donde el equipo sube todo el material que verán los alumnos en la App. Sin tocar BD ni hacer deploys.

## URL
`https://ecoai.capitalhubapp.com/contenido`

## Estructura jerárquica

```
Routes (3 productos)
  └─ Formations (las formaciones del producto)
      └─ Modules (módulos del curso)
          └─ Lessons (lecciones con vídeo + descripción + adjuntos)
```

## Routes ↔ Productos vendidos

Hay 3 routes ya creadas en BD, cada una mapeada por `product_key`:

| product_key | Nombre route | Para alumnos que compran |
|-------------|--------------|--------------------------|
| ia_integrator | IA Integrator | IA Integrator (2.990€) |
| media_buyer_digital | Media Buyer Digital | Media Buyer Digital |
| comercial_closing | Comercial Closing | Comercial Closing |

> Cuando un alumno compra "IA Integrator" en `/contactos` o widget de venta, se le desbloquea la route con `product_key=ia_integrator`. Verá SOLO esa.

## UI del gestor

Vista de árbol expandible:
- Click flecha ▶ para expandir/colapsar
- Botones inline en cada nivel:
  - **+** añadir hijo (formación, módulo, lección)
  - **✎** editar
  - **🗑** borrar (con confirmación)
- En cada lección hay también botón **ojo 👁** para preview

## Crear / editar Lección — el corazón del sistema

Modal con campos:

### Título
Texto corto. Aparece en el catálogo y en el listado del módulo.

### Descripción / contenido
Texto largo con markdown. Lo que el alumno lee debajo del vídeo. Sirve para:
- Resumen de la lección
- Pasos a aplicar
- Enlaces externos
- Tareas que hacer

### Video URL ⭐ feature clave
Pegas la URL del vídeo donde sea que esté alojado. El sistema **detecta automáticamente** el proveedor y embebe correctamente.

Proveedores soportados:

| Pegas | Detecta | Embed |
|-------|---------|-------|
| youtube.com/watch?v=... | YouTube | iframe player oficial |
| youtu.be/... | YouTube | iframe player oficial |
| youtube.com/shorts/... | YouTube | iframe |
| vimeo.com/123 | Vimeo | iframe player |
| loom.com/share/abc | Loom | iframe embed |
| drive.google.com/file/d/ID/view | Google Drive | preview embed |
| wistia.com/medias/ID | Wistia | iframe |
| stream.mux.com/ID | Mux | HLS player |
| URL terminada en .mp4 / .webm / .mov | Vídeo directo | tag video HTML |

> Cuando pegas, el campo muestra **✓ Detectado: loom** en verde si reconoce, o **⚠ URL no reconocida** en amarillo si no.

### Duración (mm:ss)
Texto. Solo visual.

### Posición en módulo
Número. Define orden dentro del módulo (1, 2, 3...). Determina el desbloqueo progresivo (la lección 2 se desbloquea cuando se completa la 1).

### Adjuntos
Lista dinámica. Cada adjunto tiene:
- **Nombre** (PDF Guía Setup, Plantilla A, etc)
- **URL del archivo** (puede ser Drive, Notion, S3, GitHub, lo que sea)
- **Tipo** (PDF, ZIP, Doc, etc)

Se renderizan en el alumno como lista debajo del vídeo con icono según tipo. Click → descarga / abre en pestaña nueva.

## Preview (botón ojo)

Modal que renderiza la lección EXACTAMENTE como la verá el alumno:
- Reproductor del vídeo embebido según provider
- Descripción markdown
- Lista de adjuntos descargables

Útil para verificar que el embed funciona ANTES de que el alumno lo vea.

## Workflow recomendado para subir un curso completo

1. Crear o editar la **Route** del producto (ya existen las 3, no tocar product_key)
2. Crear la primera **Formación** dentro de esa route
3. Crear el primer **Módulo** dentro de la formación
4. Crear lecciones 1 por 1:
   - Subir vídeo a Loom / YouTube / Drive
   - Copiar URL
   - Pegar en el modal de lección
   - Verificar con preview
5. Continuar hasta tener todos los módulos

## Tablas BD
- `routes` (3 productos)
- `formations` (formaciones por route)
- `modules` (módulos por formación)
- `lessons` (con video_url, video_provider, attachments jsonb)

## Endpoints API
- `GET /api/admin/content/tree` — devuelve árbol completo
- `POST /api/admin/content/[type]` — crear (type = routes / formations / modules / lessons)
- `PATCH /api/admin/content/[type]?id=ID` — actualizar
- `DELETE /api/admin/content/[type]?id=ID` — borrar (cascada hijos)

## Datos demo en BD (estado actual)
Hay 3 formaciones demo, 3 módulos demo, 3 lecciones demo con vídeos Loom/YouTube de ejemplo. Esto permite probar el sistema sin grabar contenido aún. Se pueden borrar/editar libremente.

## Reglas
- **Nunca borrar la columna `product_key`** de las 3 routes seed. Eso rompe el mapeo con ventas.
- **Borrar una formación borra módulos y lecciones** en cascada (CASCADE en FK).
- **video_provider se auto-detecta** al guardar la URL. Si lo necesitas manual, edita el campo en BD directo.
- **attachments es jsonb array**. Cada item: `{name, url, type, size?}`.

## Limitaciones actuales
- No hay subida directa de archivos. Hay que usar Drive/S3/Notion como host externo.
- No hay editor markdown WYSIWYG en `content`. Es textarea plain (renderiza markdown en el alumno).
- No hay versión vista previa para móvil — el alumno la verá responsive automático.
