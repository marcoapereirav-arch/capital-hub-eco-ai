# build-and-ship.md: construir, medir y publicar

## 1. ¿Necesita backend? (matriz de decisión)

Por defecto NO hay backend. Se añade solo por una razón real; añadir infraestructura que el encargo no pide desperdicia presupuesto y crea deuda de mantenimiento.

| Requisito | Solución |
|---|---|
| Mostrar info + formulario de contacto | Sin backend (form-to-email) |
| El cliente edita contenido a menudo | CMS ligero (headless) |
| Vender 1-10 productos fijos | Enlaces de pago (Payment Links) |
| Cuentas / login | Backend (base de datos + auth) |
| Pedidos guardados + checkout a medida | Backend + checkout + funciones serverless |

Stack genérico cuando hace falta backend: un **CMS headless** + una **base de datos tipo Postgres** + **pasarela de pago** + **email transaccional** + un **host con CDN**. (En cada proyecto se usan las herramientas concretas que ese proyecto ya tenga configuradas.)

Seguridad no negociable en base de datos: activar **RLS (row level security)** antes de exponer cualquier tabla por API; nunca dejar una tabla con API pública sin política.

## 2. Performance (Core Web Vitals)

Objetivos: **LCP < 2.5s · INP < 200ms · CLS < 0.1.**

Los 4 culpables del peso:
1. **Imágenes sobredimensionadas** → AVIF/WebP, dimensionar bien (hero <200KB, below-fold <80KB), `width`/`height` y `srcset`.
2. **JavaScript pesado** → diferir/lazy-load librerías no críticas (3D, players).
3. **Fuentes bloqueantes** → 2 pesos máx. (o una variable), `font-display: swap`, subset. En web real, `preload` de la principal y auto-hospedaje. En artifact, embebida como data URI (lista al parsear, sin FOUT). Vigilar que el base64 no dispare el peso: subsets por debajo de ~30 KB.
4. **Scripts de terceros** → 3 o menos, cargados tras el contenido.

`will-change` solo justo antes de animar y quitarlo al terminar (no permanente).

## 3. Checklist de polish (los 10 detalles caros)

El 5% que vale el 20% del esfuerzo. Recorrer los 10 antes de dar por cerrada la UI.

1. Números tabulares (`font-feature-settings: 'tnum'`), sobre todo en precios y métricas.
2. Comillas tipográficas (curly, no rectas).
3. Alineación óptica en iconos y formas redondas.
4. Contraste de verdad (evitar el gris medio turbio); sobre oscuro, escala sólida, nunca opacidad de texto.
5. Ritmo de espaciado consistente (múltiplos de 8).
6. Estados hover / focus-visible / active en todo lo interactivo.
7. Esquinas con jerarquía (no un radio uniforme aplicado a todo por inercia; ni 4px pobre ni 0 salvo que el concepto lo pida).
8. Favicon, og:image, 404 y loading personalizados.
9. Reduced-motion + alt text + skip-to-content.
10. Pase de "ojos frescos": mobile, incógnito, feedback de 3 personas.

## 4. QA pre-lanzamiento (la puerta final)

**A. Ejecución (medible):**
- Responsive medido en **375 / 768 / 1440**, 0 desbordes horizontales. Layout mobile rehecho, no solo encogido.
- Favicon, og:image, 404 y estados empty/loading personalizados.
- Formularios entregan a un inbox real (honeypot + validación en servidor + rate limit).
- Contraste alto verificado, alt text en imágenes, skip-to-content.
- `sitemap.xml`, `robots.txt`, HTTPS.
- Reduced-motion respetado, con estado de reposo con significado.
- Lighthouse 90+ desktop / 80+ mobile sobre perfil throttled.
- Fuente display embebida verificada en navegador (`document.fonts.check`): renderizó y no cayó al sistema.
- Botón/CTA del **final** de la página con aire lateral e inferior (bug recurrente: queda pegado al borde).

**B. Distinción (no la certifica la ejecución; se comprueba aparte).** Los gates de arriba miden que está pulido, rápido y accesible, no que no sea genérico. Una plantilla veloz y sin desbordes los pasa todos. Por eso, antes de cerrar, correr la **puerta de distinción** completa de `direccion-de-arte.md`:
- Test del logo intercambiable (primario).
- Test de las 2 referencias reales.
- Ley de coherencia: el ancla se rastrea a un elemento concreto en 3 de 4 palancas.
- Test de estructura: el concepto cambió al menos una decisión de layout/jerarquía.
- Escaneo de micro-defaults (glass card + borde tenue + sombra + blur, glow radial, blob 3D, iconos de línea uniformes, fade-in-up en cascada).
- Diversidad interna: ninguna sección repite tratamiento; el copy tiene voz, no es de plantilla.

Si un punto de B falla, la web está sin terminar aunque A esté en verde.

## 5. Orden de lanzamiento

Terminar el build → pasar la puerta de distinción → recortar peso (LCP<2.5s) → desplegar al host → dominio propio + HTTPS → metadatos + enviar a Search Console. **Publicar solo con la orden del dueño**, y verificar producción tras el push.

## 6. Playbooks de prompts (construyendo en código, no en generadores tipo plantilla)

**Dirección de arte (paso 1, antes de todo):**
> Antes de escribir código: vacía 10-15 sustantivos tangibles del mundo de [tema] (materiales, herramientas, jerga, gestos, sonidos). Elige 1-2 como ancla física. Tradúcela a una idea tipográfica por rasgo formal, una textura propia, una estructura de retícula, un color inesperado y un solo gesto de motion, todo dentro del brandkit. Devuélveme el concepto en una frase ("Esta web es [ancla] convertida en interfaz") y el riesgo en otra. No construyas hasta que esto esté.

**Build brief (arranque):**
> Actúa como diseñador y front-end senior. Construimos [tipo de página] para [WHO]. Objetivo: [WHAT]. Se diferencia por [WHY]. Concepto: [frase]. Riesgo: [frase]. El esqueleto de CONTENIDO en orden es [lista], pero su FORMA se rompe: nada de hero centrado + 3 cards + 3 tiers. Usa los tokens del brandkit (colores, tipografía, radios, superficies); si son genéricos, ténsalos. Embebe la fuente display como data URI (no de sistema). Monta primero el esqueleto completo con todas las secciones de pie; luego refinamos una a una desde el hero.

**Componer una sección (romper la retícula):**
> Compón [sección] eligiendo un sistema editorial que exprese el ancla [ancla]: asimetría, retícula desigual de 12, solape, full-bleed, off-center o un ancla visual grande. No la centres salvo que sea una frase manifiesto o un número monumento. Que no repita el sistema de la sección anterior.

**Refinar una sección (edición quirúrgica):**
> Deja TODO el resto igual. Cambia solo [sección/elemento]: [cambio concreto]. No reconstruyas nada más.

**Captura a código:**
> Recrea esta UI exacta como un componente [framework] de un solo archivo usando los tokens del brandkit. Respeta layout, espaciado, tipografía y colores.

**Integración (3D/Lottie/etc.):**
> Integra este asset [formato/URL]. Instálalo con [runtime], renderízalo en el hero con fallback estático bajo 768px, lazy-load y respeto de reduced-motion. En artifact, inlínealo o rediseña el gesto en CSS (la CSP bloquea recursos externos).

**Signature move:**
> Implementa [gesto] que dramatiza [ancla del concepto]. Comportamiento: [descripción]. Añade estado de reposo con significado para reduced-motion y para gama baja. Anima solo transform/opacity. Encájalo en las restricciones del brandkit.

**Auditoría antes de cerrar:**
> Revisa esta página contra dos bloques. Ejecución: contraste (escala sólida, sin opacidad de texto), márgenes (nada a <16px del borde), overflow horizontal en 375 y 1280, estados hover/focus, un solo momento de motion, fuente embebida renderizada. Distinción: test del logo intercambiable, 2 referencias reales a las que se parece, ancla rastreada a un elemento en 3 de 4 palancas, el concepto cambió al menos un layout, cero micro-defaults (glass+borde+sombra+blur, glow radial, blob 3D, iconos uniformes, cascada). Lista cada problema con archivo y línea.
