---
rama: feature/ads-filtros-metricas
estado: aprobado
fecha: 2026-08-28
---

# Panel de Ads: filtros por conjunto y anuncio, y metricas iguales a Facebook

## Objetivo

Que el panel de Ads deje ver los numeros al nivel que haga falta (campana, conjunto o
anuncio) y que TODAS las metricas se llamen exactamente igual que en Facebook Ads.

## Los cinco fallos, ya localizados

1. **No se puede elegir el nivel.** El panel decide solo: si marcas una campana te baja a
   conjuntos, y si no, te deja en campanas. Anuncios no existe en ningun sitio.
   `panel.ts` pide `campaign` y `adset`, nunca `ad`.
2. **Los nombres estan inventados.** El catalogo traduce a mano: "Personas que hicieron
   clic", "CTR por persona", "Llegaron a la mitad". En Facebook se llaman
   "Clics unicos (todos)", "CTR unico (todos)", "Reproducciones de video hasta el 50%".
3. **El cartel "la que pediste".** Esta en `ads-selector-metricas.tsx` linea 291, colgado
   de un campo `destacada` que llevan tres metricas de clics salientes.
4. **Faltan metricas.** "Visitas a la pagina de destino" (`landing_page_views`) no esta en
   el catalogo, ni su coste.
5. **Eliges 9 y ves 5.** `ads-panel.tsx` linea 244: `.slice(0, 5)`.

## Que voy a hacer

- Poner a cada metrica el nombre EXACTO que tiene en Facebook Ads, las 50.
- Quitar el cartel "la que pediste" de todas partes.
- Anadir las que faltan: visitas a la pagina de destino, su coste, clientes potenciales y su coste.
- Arreglar que se vean todas las metricas que elijas, no solo cinco.
- Anadir pestanas para ver Campanas, Conjuntos o Anuncios.
- Dejar marcar conjuntos y anuncios sueltos en el filtro de arriba.

## Fases

**A - Los nombres, iguales que en Facebook**
- [x] Reescribir el nombre de las 53 metricas al oficial de Meta
- [x] Quitar el cartel "la que pediste" y el campo `destacada` que lo alimenta
- [x] Anadir las que faltan: visitas a la pagina de destino, su coste, clientes potenciales y su coste

**B - Que se vean todas las que eliges**
- [x] Quitar el corte de 5 y que la rejilla se adapte al numero que haya
- [ ] Comprobado con 9 y con 12 elegidas (falta mirarlo en pantalla)

**C - Elegir el nivel: campanas, conjuntos o anuncios**
- [x] Traer el nivel anuncio en `panel.ts`
- [x] Conmutador Campanas / Conjuntos / Anuncios encima de la tabla
- [x] El reparto y la tabla obedecen al conmutador

**D - Filtrar por conjunto y por anuncio**
- [x] En el selector, poder marcar conjuntos sin tener que marcar la campana antes
- [x] Poder marcar anuncios sueltos
- [x] Los totales, el embudo y los graficos respetan lo marcado

**E - Verificar en el navegador**
- [ ] Los numeros del panel cuadran con Facebook Ads en el mismo periodo
- [ ] Probado a 375px y a 1280px

## Que NO entra

- No se tocan los graficos ni el diseno del panel: solo los nombres, el corte y los filtros.
- No se toca el filtro de fechas: sigue siendo el `PeriodFilter` del OS.
- No se toca nada de Supabase.

## Como lo veras

Arriba, donde pone "Viendo", vas a poder marcar campanas, conjuntos Y anuncios.
Encima de la tabla, tres pestanas: Campanas, Conjuntos, Anuncios.
En el selector de metricas, cada una con su nombre de Facebook y sin ningun cartel raro.
Y si eliges nueve, ves nueve.

## UNA pregunta antes de empezar

Los nombres de Meta cambian segun el idioma de la cuenta. Necesito saber cual ves tu:

- **"Importe gastado"** o **"Gasto"**
- **"Coste por resultado"** (Espana) o **"Costo por resultado"** (Latam)

Con eso pongo los 48 nombres bien a la primera. Si me mandas una captura de tu columna de
metricas en Facebook Ads, mejor todavia.


---

## Estado 2026-08-28

Construido y con `tsc` y `npm run build` limpios. Falta la mirada real en el navegador:
el panel pide sesion y este chat no tiene credenciales del OS.

Servidor levantado en http://localhost:3131/ads
