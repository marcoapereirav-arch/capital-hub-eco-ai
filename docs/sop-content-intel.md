# SOP — Content Intel

> Standard Operating Procedure para usar Content Intel como motor semanal de contenido.
> Este documento es la fuente de verdad de CÓMO se usa la herramienta.

---

## Filosofía (en 3 líneas)

1. **Sync es barato, transcribir es caro.** Sincroniza muchas cuentas. Transcribe solo los videos que vas a usar.
2. **No investigues, produce.** El valor está en convertir insights en guiones grabables cada semana, no en acumular análisis bonitos.
3. **Tu voz, no la suya.** Content Intel es brújula + mapa. El camino es tuyo. Nunca copies — destila patrones y aplícalos a TU tesis editorial (ver `docs/brand-playbook.md`).

---

## Fase 0 — Setup (una sola vez)

**Frecuencia:** única, al empezar.
**Tiempo:** 1-2 horas de reloj.
**Coste:** ~5-10€ (Apify).

1. Identifica 20-50 cuentas cuya **audiencia sea la tuya** (competencia por audiencia, no referentes de estilo). Mezcla:
   - 10-15 cuentas directas de tu nicho (formación digital, profesiones remotas, mentalidad en español)
   - 5-10 referentes anglosajones (Hormozi, Gadzhi, Koe, Bloom…)
   - 5-10 cuentas de mentalidad/filosofía/transurfing si encaja con el brand playbook
2. Añádelas todas en la pestaña **Cuentas** → Añadir cuenta.
3. Sync a todas (una por una, o en paralelo abriendo varias pestañas). No te preocupes por el tiempo, es background.
4. Resultado: tienes un corpus de 10.000-30.000 videos con metadata navegable.

**NO transcribas nada en esta fase.**

---

## Fase 1 — Ritual semanal (cada lunes, 2 horas)

### Bloque A · Inteligencia (45 min)

**Si han pasado ≥30 días desde el último sync:** re-sincroniza las cuentas activas (Sync actualiza métricas y añade nuevos posts publicados desde entonces).

1. Ve a **Videos**.
2. Filtra:
   - Cuenta: vacío (todas)
   - Min. views: `50000` (descarta ruido)
   - Orden: **Comments** (señal de intención, no vanity)
   - Top X: `20`
3. Clic en **Transcribir top 20 por comments** de **las 3 cuentas que esta semana te interesen más** (rotatorio, no siempre las mismas).
4. Coste total de este bloque: 2-5€.

### Bloque B · Análisis (15 min)

Ve a **Consultas & Guiones → Consulta cruzada**. Pega el **Prompt A** (más abajo). Ajústalo al foco de la semana si quieres (ej: "enfócate en temas de dinero" o "enfócate en temas de mindset").

**Output esperado:** mapa de 5 ángulos hot + cómo tú los harías.

### Bloque C · Fábrica de guiones (60 min)

Por cada uno de los 5 ángulos del análisis:

1. Ve a **Consultas & Guiones → Generar guion**.
2. Escribe el brief adaptando el ángulo a tu POV (usa el **Template de brief** más abajo).
3. Genera. Revisa. Edita si hace falta. Marca como **draft** o **ready**.

**Output:** 5 guiones listos para grabar.

---

## Fase 2 — Grabación en batch (martes, 1.5 h)

- Lleva los 5 guiones al móvil o impresos.
- Una sola sesión de grabación, ropa/setting consistente.
- No improvises durante la sesión. Sigue el guion. La creatividad ya la hiciste el lunes.

---

## Fase 3 — Publicación espaciada (miércoles → domingo)

- 3-5 piezas espaciadas en la semana.
- Usa **Brand Playbook → pilar** para etiquetar cada post.
- Trackea internamente (cuaderno, Notion, lo que sea) qué guion viene de Content Intel.

---

## Fase 4 — Feedback (viernes, 15 min)

- Mira métricas propias de lo publicado lunes/martes.
- Si algo petó: **rebloquea tiempo el lunes siguiente para doblar esa tecla**.
- Si algo murió: anota el patrón que NO te funcionó en el brand playbook.

---

# Prompts canónicos (copiar-pegar)

## Prompt A · Mapa de ángulos calientes (ritual semanal)

```
Actúa como analista de marca personal para Capital Hub (audiencia:
hombres 22-30 con ambición que no encajan en el sistema laboral
tradicional).

Revisa los videos del corpus y devuélveme los 5 ángulos / temas que están
generando más conversación (mira ratio comments/views, no solo views
absolutos).

Para cada ángulo dame:
1. Tema en 1 frase
2. Hook típico usado (cita @handle + snippet literal)
3. Tipo de CTA (lead magnet, DM, comentar palabra, link bio, etc.)
4. Por qué crees que está funcionando (qué nervio toca del avatar)
5. Cómo lo haría Adrián (fundador Capital Hub, tono directo, anti-humo,
   con profundidad filosófica) para destacar con ángulo propio

Estructura en markdown, una sección por ángulo.
```

## Prompt B · Biblioteca de hooks

```
Extrae los primeros 8-10 segundos (el hook) de los videos del corpus con
más views.

Clasifícalos:
A) Pregunta provocadora
B) Afirmación controvertida / contrarian
C) Número o estadística fuerte
D) Historia personal breve
E) Contraste "antes vs ahora" / transformación
F) Pattern interrupt (rompe el scroll)
G) Promesa de valor específico
H) Otro

Dame los 20 mejores hooks LITERALES como tabla markdown con columnas:
Hook | Tipología | @handle | Views.
```

## Prompt C · CTAs que convierten

```
De los videos del corpus que terminan con alguna llamada a la acción,
analiza:

1. Qué tipos de CTA aparecen más
2. Los 10 CTAs LITERALES que mayor ratio de comentarios/views generaron
3. Patrones observados (gratis / urgencia / identidad)
4. Para los que ofrecen lead magnet: qué recurso prometen

Cita cada ejemplo con @handle y métricas.
```

## Prompt D · Anatomía del video viral

```
Identifica los 5 videos del corpus con más views.

Para cada uno:
1. Por qué crees que explotó
2. Emoción principal (indignación, validación, aspiración, miedo,
   identificación, morbo, etc.)
3. Estructura narrativa (problem→solution | historia | tutorial |
   hot take | promesa→prueba | otro)
4. Duración percibida y ritmo
5. Tipo de CTA y nivel de presión comercial (0-10)

Análisis secuencial, no tabla.
```

## Prompt E · Generación de guion (template de brief)

Copia y adapta:

```
BRIEF: [1-2 frases: el tema + la tesis contrarian propia]

Ángulo MI opinión: [qué hace que este guion sea MÍO y no un refrito]

Cierra con CTA: [lead magnet / DM palabra / link bio / otro], promete
[qué entregas a cambio].

Tono: directo, exigente, sin postureo. Capital Hub, no motivador de IG.
```

**Configuración del formulario:**
- Plataforma: `instagram`
- Duración: 30-60s según el ángulo
- Pilar: elegir del brand playbook
  - `mentalidad-disciplina` (Pilar 1)
  - `ser-humano-biologia` (Pilar 2)
  - `transurfing-espiritualidad` (Pilar 3)
  - `libre` (si no encaja claro)
- Referencias: opcional (IDs de videos del corpus que quieras usar como base)

---

# Cuándo NO usar Content Intel

- Si el guion te va a salir orgánico de algo que viviste esta semana → **grábalo sin el sistema**. Lo espontáneo siempre gana.
- Si estás en mal estado mental → no fabriques contenido en piloto automático. Rompe la semana, haz otra cosa.
- Si un ángulo tiene que salir YA por un evento del mundo (crisis, noticia, tendencia) → improvisa, sistema después.

---

# Costes aproximados mensuales (uso normal)

| Concepto | Coste |
|---|---|
| Apify (sync mensual de 30 cuentas) | 3-8€ |
| Gemini (transcribir ~80 videos/mes) | 5-15€ |
| Claude/OpenRouter (consultas + guiones) | 3-10€ |
| **Total** | **~15-35€/mes** |

Si generas 3-5 guiones/semana = 15-20 guiones/mes grabados y publicados. Cada guion te cuesta 1-2€ al sistema. Comparado con contratar a un copywriter o un research assistant → x100 más barato.

---

# Evolución del SOP

Este doc se actualiza cada vez que aprendes algo nuevo sobre cómo usar mejor el sistema. Cuando algo te funcione muy bien o muy mal, añádelo a la sección correspondiente. Así la fábrica se blinda sola.
