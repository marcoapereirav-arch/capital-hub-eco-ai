---
title: Nomenclatura de anuncios en Meta
order: 12
---

# Nomenclatura de anuncios en Meta

Cómo se llaman los anuncios en Facebook Ads. **El nombre del archivo de vídeo ES el nombre
del anuncio**: se renombran los `.MP4` antes de subirlos y se copia el nombre tal cual.

Decidido el 2026-08-28 con la primera tanda grabada en Georgia.

---

## La regla

```
B02  -  09  -  AD  -  Georgia  -  EMP  -  PuntoIntermedio  -  A
 │       │      │        │         │            │            │
 │       │      │        │         │            │            variante: mismo guion, cambia un detalle
 │       │      │        │         │            de qué va el gancho
 │       │      │        │         familia del mensaje
 │       │      │        tanda de grabación
 │       │      es un anuncio
 │       número correlativo dentro del conjunto
 código del conjunto de anuncios
```

## Las familias

Tres letras que dicen **qué promete** el anuncio, no de qué habla. Es lo que permite leer un
informe de Facebook y saber qué ángulo está funcionando sin abrir un solo vídeo.

| Código | Familia | Qué promete |
|---|---|---|
| `REC` | Reclutamiento | "Estoy contratando a 70 personas, hacen falta manos, hay trabajo para ti" |
| `EMP` | Emprendedor | "Tienes perfil emprendedor y no ganas. La profesión digital es el puente hasta tu negocio" |
| `SUE` | Sueldo | "Gana 3, 4 o 5 veces tu sueldo actual sin montar nada de cero" |

Si se abre una familia nueva, se le dan **tres letras** y se apunta aquí. No se improvisa.

## Reglas duras

1. **El número no se reutiliza nunca** una vez que el anuncio ha estado en Facebook. Así el
   09 sigue siendo el 09 dentro de un año, aunque se haya pausado o borrado.
2. **Gancho distinto = número nuevo.** No es una variante.
3. **Mismo guion y solo cambia un detalle** (un corte, una miniatura, un subtítulo): misma
   raíz y sufijo `-A`, `-B`, `-C`.
4. **Sin espacios, sin acentos y sin barras.** Solo letras, números y guiones. El motivo es
   práctico: así el nombre sobrevive cuando se exportan los datos de Facebook a Excel.
5. **Para la tanda siguiente solo cambia la palabra de la tanda**: `B02-17-AD-Barcelona-REC-LoQueSea`.

## Antes de subir una tanda

Lo que salió de revisar los 18 archivos de Georgia, y que conviene repetir siempre:

- **Buscar duplicados byte a byte.** Dos de los 18 eran el mismo archivo (`md5` idéntico).
- **Buscar tomas repetidas.** Otros dos tenían el mismo guion palabra por palabra, la misma
  toma y medio segundo de diferencia de metraje. Subirlos los dos reparte presupuesto entre
  dos anuncios iguales.
- **Comprobar que el vídeo es vertical de verdad.** Uno estaba grabado en horizontal y
  exportado en vertical: barras negras enormes y el vídeo real en una franja del centro.
  Se detecta sacando un fotograma con `ffmpeg` y mirándolo.
- **Transcribir todo.** Con `whisper` sobre el audio extraído. Es lo que permite clasificar
  por familia y por gancho sin ver 18 vídeos enteros.

De 18 archivos salieron **16 anuncios**.

## La tanda 1 (Georgia, agosto 2026)

Campaña `B | Lead | ABO | Test` · Conjunto `B02 | ESP | Giorgia Test`.

16 anuncios, del 01 al 16 sin huecos: 8 `REC`, 6 `EMP`, 2 `SUE`. Todos llevan al mismo sitio,
el [funnel del test de personalidad](07-funnel-test-personalidad.md). Lo que cambia es el
ángulo y los primeros segundos.

Aprobados por Facebook sin un solo rechazo el 2026-08-28.

## Lo que enseñó esta tanda sobre el presupuesto

El conjunto arrancó con **24 €/día y 16 anuncios**: 1,50 € por anuncio y día. Con el CPM de
la cuenta (unos 5 €) eso son ~300 impresiones diarias por anuncio, cuando para saber si un
creativo funciona hacen falta entre 1.000 y 2.000. Y Meta no reparte por igual: elige dos o
tres y a los demás no les da casi nada.

Además el conjunto no sale de la fase de aprendizaje. Meta pide ~50 conversiones por semana
y con el coste por lead histórico (10,67 € en `B01 | ESP` a 30 días) 24 €/día da para 10-16.

**La regla que sale de aquí: el presupuesto diario dividido entre el número de anuncios tiene
que dar señal en pocos días, no en semanas.** Con 24 €/día se testean 5 o 6 creativos, no 16.
Para 16 harían falta 80-100 €/día.
