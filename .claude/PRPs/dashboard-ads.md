---
rama: feature/dashboard-ads
estado: aprobado
---

<!-- Marco lo aprobó en el chat el 2026-08-07: "Empieza ahora". -->


# Dashboard de Ads completo

> Fecha: 2026-08-07 · Proyecto: Capital Hub OS · Pantalla: Ads, pestaña Campañas

## Objetivo

Convertir la pestaña "Campañas" de Ads en un panel de verdad: un solo selector de fechas
que manda sobre toda la pantalla, los gráficos primero (embudo, evolución diaria y
comparativa), debajo la lista de campañas como la del administrador de anuncios de Meta, y
un selector donde eliges qué métricas quieres ver, con las que de verdad se usan separadas
de las avanzadas.

## Qué voy a hacer

- Poner **un solo filtro de fechas** arriba. Todo lo que hay en la pantalla obedece a ese
  filtro: los números, los gráficos y la lista. Nada trae su propio periodo por su cuenta.
- Dejar esa regla escrita en el Knowledge, para que ninguna pantalla nueva se vuelva a
  inventar su propio filtro de fechas.
- **Primero los gráficos, después las tablas.** Al entrar se ve un embudo (de impresiones a
  leads), la evolución día a día del gasto y de los resultados, y cuánto sube o baja cada
  número respecto al periodo anterior.
- Cada gráfico con los **números a la vista**, los dos ejes rotulados y etiqueta al pasar el
  cursor. En móvil se rehace para que se siga leyendo, no se encoge.
- Debajo, la **lista de campañas igual que en el administrador de anuncios**: campaña, y al
  abrirla sus conjuntos y sus anuncios. Se ordena por cualquier columna y se busca por
  nombre.
- Un **selector de métricas** con todas las de Meta, en dos grupos: arriba "Las que
  funcionan", con el CTR saliente único y los clics salientes únicos de primeros, y debajo
  "Avanzadas". Cada una con una frase que explica qué es, sin tecnicismos.
- Lo que elijas **se queda guardado**: vuelves a entrar y están tus métricas, no las de
  fábrica.

## Fases

**A · El filtro de fechas manda**
- [ ] Un solo selector de fechas arriba de Campañas, con los mismos periodos que el resto del OS y con rango personalizado
- [ ] Todos los números, gráficos y la lista leen de ese selector: se quitan los botones de periodo sueltos que hay hoy
- [ ] El periodo elegido se queda en la dirección de la página, así que se puede recargar y compartir sin perderlo
- [ ] La regla queda escrita en el Knowledge: una pantalla, un filtro de fechas, y todo lo de dentro lo obedece

**B · Traer los datos de Meta de verdad**
- [ ] Una llamada de comprobación a Meta con la lista completa de métricas candidatas: Meta responde diciendo cuál no acepta, y la lista buena queda fijada en el código
- [ ] Traer los datos día a día del periodo elegido, que es lo que permite dibujar la evolución
- [ ] Traer los datos por campaña, por conjunto y por anuncio, que es como los enseña el administrador de anuncios
- [ ] Traer también el periodo anterior equivalente, para poder decir si sube o baja
- [ ] Si Meta tarda o falla, la pantalla lo dice en lenguaje normal y con el paso exacto para arreglarlo, no se queda en blanco

**C · Lo visual primero**
- [ ] Embudo: impresiones, clics salientes, visitas a la web y leads, con el número dentro de cada paso y el porcentaje que se pierde entre uno y el siguiente
- [ ] Evolución diaria del gasto y de los resultados, con ejes rotulados, números a la vista y etiqueta al pasar el cursor
- [ ] Comparativa contra el periodo anterior: cada número con su flecha de cuánto cambió y en qué porcentaje
- [ ] Versión móvil de los tres: si a 375 píxeles no se leen los números, se cambia la forma del gráfico
- [ ] Todo con el brandkit: carbón, verde de marca e Inter Tight, sin inventar colores nuevos

**D · La lista de campañas**
- [ ] Tabla de campañas que se abre y se cierra para ver conjuntos y anuncios dentro
- [ ] Se ordena pulsando cualquier columna
- [ ] Las columnas son exactamente las métricas elegidas en el selector, ni una más
- [ ] Estado de cada campaña (activa o pausada) y buscador por nombre
- [ ] Fila de totales abajo, para no tener que sumar a mano

**E · El selector de métricas**
- [ ] Panel con dos grupos separados: "Las que funcionan" y "Avanzadas"
- [ ] En el primer grupo y de primeras: CTR saliente único y clics salientes únicos
- [ ] Cada métrica con una frase que explica qué mide, sin tecnicismos
- [ ] Lo elegido se guarda y sigue ahí al volver a entrar
- [ ] Un botón para volver al conjunto recomendado de un toque

**F · Comprobación**
- [ ] Abrir la pantalla con el usuario de prueba y mirarla con mis ojos, en escritorio y en móvil
- [ ] `npm run build` en verde
- [ ] Knowledge actualizado en el mismo bloque

## Qué NO entra

- Google Ads y TikTok Ads: esto es solo Meta. La estructura queda preparada, pero no se construyen.
- Crear, pausar, editar o duplicar campañas desde el OS. La pantalla solo lee, no toca nada en Meta.
- Cruzar los datos de Meta con nuestro CRM (atribución por creativo, coste real por alumno). Es otro trabajo.
- Alertas automáticas cuando algo cae. Va después, cuando esta pantalla lleve semanas funcionando.
- Guardar histórico propio en base de datos. Se lee de Meta en vivo, sin tabla nueva.
- Las pestañas Eventos y Ajustes de Ads: no se tocan.
- La sección Afiliados: no se toca.

## Cómo lo verás

- Entras en Ads, pestaña **Campañas**, y arriba hay **un solo selector de fechas**. Lo mueves y cambia todo lo de abajo a la vez.
- Lo primero que ves son **gráficos, no una tabla**: el embudo con sus números dentro, la línea del gasto y los resultados día a día, y al lado de cada número cuánto subió o bajó frente al periodo anterior.
- Bajas y está la **lista de campañas como en el administrador de anuncios**: abres una campaña y salen sus conjuntos y sus anuncios.
- Arriba de la lista, un botón de **métricas**. Lo abres y ves dos grupos: las que funcionan (con CTR saliente único y clics salientes únicos arriba del todo) y las avanzadas. Marcas las que quieras y las columnas de la lista cambian al momento.
- Sales, vuelves a entrar y **tus métricas siguen elegidas**.

---

# Detalle técnico (esto es para mí, no hace falta que lo leas)

## Por qué

| Problema hoy | Solución |
|---|---|
| La pestaña Campañas trae su propio grupo de botones de periodo, distinto del resto del OS. Cada pantalla decide su fecha por su cuenta. | Un filtro de fechas por pantalla, y todo lo de dentro lo obedece. Regla anclada en el Knowledge. |
| Solo se ve un bloque agregado de la cuenta entera: 4 tarjetas y 3 mini datos. No se sabe qué campaña gasta ni cuál produce. | Lista jerárquica campaña, conjunto y anuncio, como en el administrador de anuncios. |
| No hay ni un gráfico. Todo es texto y números sueltos. Marco valora lo visual cien mil veces más (REGLA #15). | Embudo, evolución diaria y comparativa contra el periodo anterior, con números dentro y ejes rotulados. |
| Las métricas están fijas en el código. Faltan justo las que Marco usa para decidir (clics salientes únicos y su CTR). | Selector con todas las de Meta, separadas en "las que funcionan" y "avanzadas". |
| El ROAS sale como un guion, sin explicar por qué. | Cada dato que no se puede calcular dice por qué no y qué falta para tenerlo. |

## Estado real del código hoy (verificado el 2026-08-07)

| Archivo | Qué hace | Qué le pasa |
|---|---|---|
| `src/features/ads/components/ads-page.tsx` | Las tres pestañas: Campañas, Eventos, Ajustes | Sin cambios de estructura, solo se rellena Campañas |
| `src/features/ads/components/ads-insights.tsx` (258 líneas) | Todo lo que hay hoy en Campañas | Tiene su propio `PRESETS` local, 4 tarjetas y 3 mini datos. Cero gráficos. Cero desglose. El ROAS sale siempre como un guion fijo escrito en el código |
| `src/app/api/admin/ads/insights/route.ts` (71 líneas) | Trae los datos de Meta | Una sola llamada agregada. Sin `level`, sin `time_increment`, sin comparativa. Campos fijos en el código |
| `src/lib/meta/marketing-token.ts` | Busca la llave de lectura | Primero en `app_settings.meta_marketing_token`, luego en el entorno. Ya funciona, no se toca |
| `src/features/dashboard/services/date-ranges.ts` | Los periodos del OS | Es el patrón a seguir y a extender, no a duplicar |
| `src/features/dashboard/components/date-filter.tsx` | El selector de fechas del dashboard | Se sube a componente compartido para que Ads use el mismo |

## Arquitectura propuesta

```
src/features/ads/
├── components/
│   ├── ads-insights.tsx            reescrito: orquesta filtro + visuales + lista
│   ├── ads-funnel-chart.tsx        embudo con números dentro y % de caída
│   ├── ads-timeseries-chart.tsx    evolución diaria de gasto y resultados
│   ├── ads-comparison-row.tsx      cada número con su cambio vs periodo anterior
│   ├── ads-campaign-table.tsx      lista jerárquica campaña > conjunto > anuncio
│   └── ads-metric-picker.tsx       selector en dos grupos
├── services/
│   ├── ads-metrics-catalog.ts      catálogo de métricas: id de Meta, nombre normal, grupo, formato
│   └── ads-insights-client.ts      llamadas al endpoint
└── types/ads-insights.ts

src/shared/components/date-filter.tsx   el de dashboard, subido a compartido

src/app/api/admin/ads/insights/route.ts  ampliado: level, time_increment, comparativa
```

**Sin tabla nueva.** Las métricas elegidas se guardan por usuario en `localStorage`. Si más
adelante hace falta que viajen entre dispositivos, se mueve a `app_settings`, pero para el
MVP no justifica una migración.

**Gráficos:** `recharts` ya está en `package.json` (`^3.8.1`) y no se usa en ninguna parte de
`src/`. Se usa aquí, con carga diferida para que no pese en el primer render.

## Métricas de Meta: lo verificado y lo que falta verificar

Verificado hoy contra la referencia oficial de `ad-account/insights` de Meta. **Estos campos
existen con este nombre exacto**:

`spend` · `impressions` · `reach` · `frequency` · `clicks` · `ctr` · `cpc` · `cpm` · `cpp`
`outbound_clicks` · `outbound_clicks_ctr` · `cost_per_outbound_click` · `cost_per_unique_outbound_click`
`inline_link_clicks` · `inline_link_click_ctr` · `cost_per_inline_link_click` · `cost_per_unique_inline_link_click`
`unique_clicks` · `unique_impressions` · `cost_per_unique_click` · `cost_per_unique_action_type`
`website_ctr` · `actions` · `action_values` · `cost_per_action_type` · `total_unique_actions`
`instant_experience_outbound_clicks`

Parámetros confirmados: `level` (campaign, adset, ad), `time_increment`, `date_preset`,
`time_range`, `breakdowns`, `filtering`, `sort`, `limit`.

Valores de `date_preset` confirmados: `today`, `yesterday`, `this_month`, `last_month`,
`this_quarter`, `maximum`, `data_maximum`, `last_3d`, `last_7d`, `last_14d`, `last_28d`,
`last_30d`, `last_90d`, `last_week_mon_sun`, `last_week_sun_sat`, `last_quarter`,
`last_year`, `this_week_mon_today`, `this_week_sun_today`, `this_year`.

**Lo que NO pude confirmar en la tabla oficial de campos:** `unique_outbound_clicks`,
`unique_outbound_clicks_ctr`, `unique_ctr`, `unique_inline_link_clicks`,
`unique_inline_link_click_ctr`, `quality_ranking`, `engagement_rate_ranking`,
`conversion_rate_ranking`.

Que no aparezcan en esa tabla no significa que no existan: Meta documenta "Clics salientes
únicos" y "CTR saliente único" como métricas reales en su centro de ayuda para empresas, y
el campo `cost_per_unique_outbound_click` sí está en la tabla, lo que implica que la métrica
base existe. Además Meta separa parte de las métricas "únicas" en una página aparte de
métricas estimadas.

**Por eso la Fase B empieza con una llamada de comprobación**: se piden todos los candidatos
de una vez y Meta contesta nombrando el que no acepta. Con esa respuesta se fija la lista
buena en el código. Es lo correcto según la REGLA #5 del Knowledge: no afirmar capacidades de
una API externa sin verificarlas.

## El catálogo de métricas, en dos grupos

**Grupo 1, "Las que funcionan"** (las que se usan para decidir, en este orden):

| Nombre en pantalla | Campo de Meta | Qué mide, en una frase |
|---|---|---|
| Clics salientes únicos | por verificar en Fase B | Cuántas personas distintas salieron de Meta hacia tu web |
| CTR saliente único | por verificar en Fase B | De los que vieron el anuncio, qué porcentaje salió hacia tu web |
| Gasto | `spend` | Lo que llevas pagado |
| Coste por clic saliente único | `cost_per_unique_outbound_click` | Lo que te cuesta cada persona distinta que llega a tu web |
| Clics salientes | `outbound_clicks` | Clics que salieron de Meta, contando repetidos |
| CTR saliente | `outbound_clicks_ctr` | Porcentaje de clics que salieron de Meta |
| Leads | `actions` (tipo `lead`) | Cuánta gente dejó sus datos |
| Coste por lead | `cost_per_action_type` | Lo que te cuesta cada lead |
| Impresiones | `impressions` | Veces que se enseñó el anuncio |
| Alcance | `reach` | Personas distintas que lo vieron |
| Frecuencia | `frequency` | Cuántas veces lo vio de media cada persona |
| CPM | `cpm` | Lo que cuesta enseñarlo mil veces |

**Grupo 2, "Avanzadas"** (todo lo demás, plegado por defecto): `clicks`, `ctr`, `cpc`,
`cpp`, `unique_clicks`, `unique_impressions`, `cost_per_unique_click`, `inline_link_clicks`,
`inline_link_click_ctr`, `cost_per_inline_link_click`, `cost_per_unique_inline_link_click`,
`website_ctr`, `cost_per_outbound_click`, `instant_experience_outbound_clicks`,
`action_values`, `total_unique_actions`, y las de calidad si la Fase B confirma que existen.

## El embudo: de qué se compone

Cada paso sale de un dato real de Meta. Ninguno se inventa.

| Paso | De dónde sale |
|---|---|
| Impresiones | `impressions` |
| Alcance | `reach` |
| Clics salientes únicos | el campo que confirme la Fase B |
| Visitas a la web | `actions`, tipo `landing_page_view` |
| Leads | `actions`, tipo `lead` |

Entre paso y paso, el porcentaje que se pierde, marcado dentro del dibujo. La caída más
fuerte se señala en el propio gráfico, no en un texto aparte (REGLA #15).

## Gotchas

- [ ] **Las métricas únicas son lentas.** Meta recomienda pedirlas en una llamada aparte para
      no ralentizar el resto. Si la pantalla tarda, se separan en dos llamadas.
- [ ] **La llave de lectura es distinta de la de conversiones.** La de leer necesita permiso
      `ads_read` y se pega desde Ads, Ajustes. Ya está montado el guardado y la validación:
      esto no se reconstruye.
- [ ] **Si la llave no tiene permiso, la pantalla ya avisa hoy con el mensaje correcto.** Ese
      mensaje se conserva tal cual: dice los datos exactos que hacen falta y quién los da.
- [ ] **`date_preset` de Meta no es el mismo vocabulario que el del OS.** El OS usa
      `last_7`, `this_month`, `all_time`. Meta usa `last_7d`, `this_month`, `maximum`. Hace
      falta una traducción explícita, y para el rango personalizado se usa `time_range` en
      lugar de `date_preset`.
- [ ] **`time_increment=1` multiplica las filas.** Un mes por anuncio son cientos de filas.
      La evolución diaria se pide a nivel de cuenta, no a nivel de anuncio.
- [ ] **La comparativa contra el periodo anterior la calculamos nosotros.** Meta no la
      devuelve: son dos llamadas con dos `time_range` distintos.
- [ ] **`recharts` no se usa hoy en ningún sitio.** Hay que probar que no rompe el build de
      producción (que corre con Turbopack) antes de apoyar toda la pantalla en él.
- [ ] **La pantalla vive dentro de `PageContainer`.** Nada pegado al borde, y las tablas
      anchas hacen scroll dentro de su caja, nunca la página entera.
- [ ] **Ads abre por defecto en la pestaña Eventos.** Eso no se cambia en este trabajo salvo
      que Marco lo pida.

## Anti-patrones

- No crear una tabla en Supabase para esto. Se lee de Meta en vivo.
- No inventar nombres de campos de Meta: se verifican en la Fase B contra la propia API.
- No poner números de ejemplo ni de relleno. Si un dato no está, se dice qué falta.
- No dejar un gráfico sin números a la vista, sin ejes rotulados o sin etiqueta al pasar el
  cursor.
- No sustituir un gráfico por una frase.
- No inventar colores fuera del brandkit.
- No usar el icono `Sparkles`.
- No tocar las pestañas Eventos ni Ajustes.

## Aprendizajes

> Se rellena durante la construcción.

---

*PRP en estado propuesto. No se ha escrito ni una línea de código.*
