# Gotchas del Knowledge 3D — léelos ANTES de codear

Estos 9 puntos son los errores reales que hacen que el cerebro se ralentice, se congele o quede en blanco. Cada uno costó una iteración de depuración.

## 1. Fuga de buffers GPU (el más grave)
**Síntoma:** va perfecto los primeros segundos y luego se arrastra cada vez más; nunca se recupera.
**Causa:** llamar `geometry.setFromPoints()` (o recrear geometría) en cada frame para las sinapsis → crea buffers GPU que no se liberan.
**Fix:** crear UNA vez un `BufferAttribute` con `setUsage(THREE.DynamicDrawUsage)` y, por frame, escribir los valores en su `array` + `attribute.needsUpdate = true`. Reutiliza el mismo buffer.

## 2. Etiquetas DOM congelan la escena
**Síntoma:** tirones, "se queda pegado" al mover.
**Causa:** `<Html>` de drei coloca un nodo DOM por etiqueta y recalcula su transform cada frame → reflows de layout síncronos.
**Fix:** etiquetas como **sprites**: dibujar el texto en un `<canvas>` 2D una vez, crear `THREE.CanvasTexture`, mapearla a un `THREE.Sprite`. Sin DOM, sin reflows.

## 3. troika `<Text>` (drei Text) deja el canvas en blanco
**Síntoma:** canvas completamente negro tras cambiar a `<Text>`.
**Causa:** troika descarga su fuente por red y **suspende**; si la red falla/bloquea, suspende para siempre.
**Fix:** usar sprites de canvas (punto 2). Si se quiere `<Text>`, servir una fuente local y envolver en `<Suspense>`.

## 4. dpr retina + bloom = lag de base
**Causa:** `dpr={[1,2]}` en pantalla retina = 4× píxeles; con bloom es carísimo.
**Fix:** `dpr={[1,1.5]}` + `gl={{ antialias:true, powerPreference:'high-performance' }}`.

## 5. Halos transparentes = sobredibujo
**Causa:** una esfera transparente extra por nodo multiplica el fillrate.
**Fix:** quitarlos; el Bloom sobre el material emisivo (`toneMapped={false}`) ya da el glow.

## 6. Dirección de rotación al revés
**Causa:** el signo de azimut/polar se siente invertido respecto a la intuición.
**Fix:** invertir el signo en `setAzimuthalAngle` / `setPolarAngle`. Es un cambio de un carácter; pruébalo y ajústalo.

## 7. SSR rompe WebGL
**Causa:** `<Canvas>` no puede renderizar en servidor.
**Fix:** cargar el orquestador con `next/dynamic(() => import(...), { ssr:false })`.

## 8. Altura 0 dentro del shell admin
**Síntoma:** canvas invisible al integrar en una pantalla con sidebar/topbar.
**Causa:** `h-full` colapsa si algún ancestro flex no tiene altura definida.
**Fix:** root del cerebro `h-full min-h-[80vh]` (el `min-h` garantiza altura aunque la cadena flex colapse).

## 9. `<line>` en TSX
**Causa:** el elemento intrínseco `<line>` de three choca con el tipo SVG `line`.
**Fix:** `{/* @ts-expect-error three line element */}` encima del `<line geometry={geo}>`.

## Verificación de rendimiento
Medir FPS al inicio y a los ~14s, y el `performance.memory.usedJSHeapSize`. Si el heap crece o el FPS baja con el tiempo → hay una fuga (revisar punto 1 y 2). Heap plano + FPS estable = OK.

## 10. Pinch-zoom mobile bloqueado por defecto
**Síntoma:** en el móvil, dos dedos hacen scroll de la página en vez de hacer zoom en el cerebro.
**Causa:** `enableZoom={false}` en `<OrbitControls>` y `touchAction` por defecto del navegador captura el pinch.
**Fix:**
- En `<OrbitControls>`: `enableZoom`, `zoomSpeed={0.7}`, `minDistance={5}`, `maxDistance={18}`, y `touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}` para que un dedo rote y dos dedos hagan zoom + rotate.
- En el `<div>` que envuelve el `<Canvas>`: `style={{ touchAction: 'none' }}` para que el navegador no se quede el gesto.

## 11. Editar documentos sin BD (mockup)
Si se necesita que el usuario edite documentos pero no hay BD detrás (propuesta tipo mockup), llevar las ediciones en estado local del componente padre que abre el modal: un `Record<slug, { title, body }>` que sobrescribe lo que viene del data file. El modal lee `overrides[slug] ?? doc`. Al guardar, actualizar el record. Esto se ve y se siente como editable sin necesidad de backend.

Para una implementación con BD real (Supabase u otra), el "Guardar" hace `UPDATE assistant_sops SET title=$, content_md=$ WHERE slug=$` y dispara revalidación.
