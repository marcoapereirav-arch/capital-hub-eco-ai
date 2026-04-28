# Handoff — Sistema de Edición de Video (Capital Hub)

> Última actualización: 2026-04-28
>
> Este documento es el handoff entre lo que está construido técnicamente y lo
> que falta de inputs creativos del usuario para terminar de cerrar el sistema.

---

## ESTADO ACTUAL

### Construido y funcional

**Variante 1 — Vertical Clean** (`vertical-clean`)
- Pipeline end-to-end completo:
  1. Upload del video (drag & drop, max 500 MB)
  2. Transcripción automática (Replicate Whisper)
  3. Detección de silencios > 400ms y corte automático
  4. Subtítulos palabra a palabra (sliding window de hasta 3 palabras visibles, posición lower-third)
  5. Render Shotstack (sandbox = marca de agua) → MP4 9:16 1080×1920 30fps
  6. Descarga directa
- Tipografía provisional: **Inter ExtraBold** (Apple-style cross-platform). Cuando lleguen las capturas y se confirme SF Pro Display, se sube como custom font asset a Shotstack.

### Construido pero stub (esperando capturas)

**Variante 2 — Horizontal Framed** (`horizontal-framed`)
- Tabla `ci_video_presets` registrada y seleccionable en UI.
- Builder lanza error `preset_pending_references` hasta que se confirmen:
  - Altura exacta de las franjas negras superior/inferior.
  - Tipografía exacta del headline.
  - Si hay borde/sombra entre franja y zona central del video.

**Variante 3 — Edit Dinámico** (`edit-dinamico`)
- Tabla registrada y seleccionable.
- Builder lanza error hasta que se confirmen:
  - Tipografía de palabras destacadas grandes.
  - Color de acento (si lo hay).
  - Estilo y cadencia de transiciones marcadas.
  - Cadencia de inserción de b-roll (ej: cada cuántos segundos).

**Variante 4 — Clip Podcast** (`podcast-clip`)
- Contenedor que aplica el pipeline de la variante elegida. Por ahora cae a Variante 1.

---

## INFRAESTRUCTURA

### Tablas Supabase
- `ci_brand_pack` (1 fila por marca) — tokens visuales/sonoros del brand.
- `ci_video_presets` (4 filas seed) — variantes del playbook con `pipeline_config` JSON.
- `ci_video_edits` (jobs de edición) — ahora con `preset_slug`, `headline_text`, `piece_type`, `cta_word`, `shotstack_render_id`, `output_url`.

### Servicios
- `src/features/video-edit/services/shotstack.ts` — cliente del API.
- `src/features/video-edit/services/silence-trim.ts` — detector de islas de habla.
- `src/features/video-edit/services/subtitle-builder.ts` — karaoke builder palabra a palabra.
- `src/features/video-edit/services/timeline-builder.ts` — builders por preset (`buildPayloadByPreset`).
- `src/features/video-edit/services/brand-pack-repo.ts` — carga tokens del brand pack desde BD.

### Endpoints
- `POST /api/video-edit/upload-url` — acepta `preset_slug`, `headline_text`, `piece_type`, `cta_word`.
- `POST /api/video-edit/process` — dispara pipeline (transcripción).
- `POST /api/video-edit/[id]/render` — encola render Shotstack según preset + brand pack.
- `GET /api/video-edit/[id]/render` — poll status + sincroniza BD.
- `GET /api/video-edit/presets` — lista variantes habilitadas para el selector UI.
- `GET /api/video-edit/[id]` · `DELETE /api/video-edit/[id]` · `GET /api/video-edit` — CRUD básico.

### Variables de entorno (.env.local)
- `SHOTSTACK_API_KEY` — sandbox/staging key (gratis, output con marca de agua).
- `SHOTSTACK_ENV` — `stage` (sandbox) o `v1` (producción).
- `REPLICATE_API_TOKEN` — Whisper para transcripción.

---

## QUÉ FALTA DEL USUARIO

### Crítico (sin esto Variantes 2 y 3 no se pueden renderizar)

1. **Capturas de Variante 1 (3-5 frames)** — para confirmar:
   - ¿Tipografía Inter ExtraBold pasa el listón Apple-style? Si no, mandar SF Pro Display real (archivo) o referencia exacta para subir como custom font.
   - Tamaño exacto del subtítulo en pantalla.
   - ¿Lleva fondo/sombra/borde? (actualmente solo stroke negro 4px sobre texto blanco).

2. **Capturas de Variante 2 (3-5 frames)** — para confirmar:
   - Altura exacta de franjas (default 425px arriba + 425px abajo).
   - Color exacto (default `#000000`).
   - Tipografía y tamaño del headline en franja superior.
   - Estética del headline (mayúsculas, espaciado, alineación).

3. **Capturas de Variante 3 (3-5 frames)** — para confirmar:
   - Tipografía de palabras destacadas grandes (¿display font con personalidad? ¿condensed? ¿cursiva?).
   - **Color de acento** — si las palabras grandes llevan algún color (no blanco), cuál exacto en hex.
   - Estilo de transiciones marcadas (whip pan, glitch, flash blanco).
   - Cadencia de b-roll: cada N segundos.

### Inputs adicionales útiles (no bloqueantes)

4. **Biblioteca de música del brand pack** — Lista de tracks para que la IA pueda elegir según mood/categoría del playbook (épico-oscuro / groove-atmosférico / brutal-agresivo / melancólico-cinematográfico / atmosférico-medio).
   - Por ahora todo es manual: el usuario sube el video sin música y la añade fuera o pendiente de feature.

5. **Carpeta Drive de B-roll** — Para Variante 3 con `broll_strategy=ai-suggested`.
   - URL de la carpeta + OAuth del usuario para que la app lea metadata.

6. **LUT cinematic-warm** — Si tiene un archivo .cube o .3dl con la look exacta, subirlo.
   - Por ahora Shotstack aplica una corrección genérica.

7. **Logo / watermark** (si llevan los Reels) — PNG transparente + posición.
   - Playbook dice que NO lleva watermark. Mantener vacío salvo que cambie la decisión.

---

## PRÓXIMOS BLOQUES (cuando llegue lo de arriba)

1. **Cerrar Variante 1 visualmente exacta** (con capturas) → 2-4h.
2. **Implementar Variante 2** (frame layout + headline) → 1 día.
3. **Implementar Variante 3** (b-roll insertion + key word emphasis + transitions) → 2-3 días.
4. **Multi-asset upload** (subir N b-rolls junto al main video) → 1 día.
5. **Biblioteca de música** (tabla + bucket + selector manual + auto por mood) → 1-2 días.
6. **Drive integration** (OAuth + indexador de clips) → 2-3 días.
7. **Migración a Shotstack Pro** (API key v1, sin marca de agua) → 30 min cuando se decida lanzar.

---

## CHECKLIST DE VALIDACIÓN — Variante 1

Cuando el usuario suba un video real y pulse "Generar con subtítulos", verificar:

- [ ] Aspect 9:16 1080×1920.
- [ ] 30fps.
- [ ] H.264 mp4.
- [ ] Silencios > 400ms cortados (revisar contra el original).
- [ ] Subtítulos sincronizados palabra a palabra.
- [ ] Posición lower-third (no tapa la boca, no pegado al borde).
- [ ] Color blanco puro, sin acento.
- [ ] Sin fondo coloreado tras el texto (solo stroke negro 4px).
- [ ] Marca de agua de Shotstack visible (esperado en sandbox).
