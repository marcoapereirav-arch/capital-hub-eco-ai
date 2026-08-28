---
titulo: Historial diario de la actividad del setter (quien registro, quien corrigio, a que hora, y que cambio)
rama: feature/historial-actividad-setter
estado: aprobado
aprobado_por: Marco, "Ok" (2026-08-28)
fecha: 2026-08-28
---

# Historial diario de la actividad

## Objetivo

Que exista una pantalla donde se vea, dia por dia, cada vez que alguien registro actividad:
los cuatro numeros de ese dia, quien los puso, a que hora, si alguien los corrigio despues,
quien y a que hora, y que numero cambio exactamente. Desde ahi se puede editar cualquier dia,
y cada correccion deja su propia linea. Los dias en los que nadie registro tambien se ven,
para que el hueco no se esconda.

## Lo que hay hoy (mirado en el codigo y en la base, no supuesto)

- El parte se rellena desde el boton verde flotante, "Registrar actividad": cuatro numeros
  (conversaciones nuevas, follow-ups, ofertas de llamada, llamadas agendadas) y un dia.
- La base guarda **una sola linea por persona y dia**. Si se vuelve a guardar, se **pisa**
  la anterior. El valor viejo **desaparece para siempre**. Hoy no hay forma de saber que
  decia antes.
- **No se guarda quien lo escribio**, solo de quien es el parte. Y **no se guarda quien lo
  corrigio**. La hora de la ultima correccion si se guarda, pero **no se enseña en ningun sitio**.
- **No hay ninguna pantalla de historial.** El unico sitio donde aparecen estos numeros es el
  Dashboard, y ahi salen **sumados** del periodo elegido: cuatro cifras y nada mas. No se puede
  ver un dia concreto ni abrir el detalle.
- **Nadie puede corregir el parte de otro**, ni siendo administrador. La base solo deja escribir
  el tuyo. Si Juanda se equivoca en un numero, solo Juanda puede arreglarlo.
- En la base hay **4 partes reales**: 3 de Juanda (12, 15 y 19 de agosto) y 1 de la cuenta de
  pruebas (8 de agosto). Hoy solo hay **un setter activo**, Juanda, pero todo esto se construye
  para varios.

## Que voy a hacer

**Fase A · La base guarda cada registro y cada cambio**

- El parte pasa a guardar **quien lo creo** y **quien lo edito la ultima vez**, no solo de quien es.
- Tabla nueva de historial: **una linea por cada guardado**, con quien firmo, a que hora, si fue
  alta o correccion, **como estaba antes y como quedo despues**, y que campos cambiaron.
- Ese historial lo escribe la **propia base de datos** con un disparador, no la pantalla. Asi es
  imposible guardar sin dejar rastro, venga de donde venga: del boton, de la API o de una consulta
  a mano.
- Los **4 partes que ya existen** se rellenan hacia atras con su linea de alta y su hora real,
  marcadas como reconstruidas para no fingir un dato que no tenemos.
- Quien puede leer que: cada persona ve lo suyo, el administrador lo ve todo. El historial es de
  **solo lectura** para todos, ni siquiera un administrador puede borrar una linea.

**Fase B · El administrador puede corregir, y queda firmado**

- Al guardar, la API escribe **quien firma** ese guardado.
- Un administrador puede **registrar o corregir el parte de un setter**. Cuando lo hace, en el
  historial queda claro: el parte es de Juanda, pero **lo corrigio Marco a las 19:42**.
- Entrega nueva de datos para la pantalla: la lista de dias con todo ya calculado, con las
  **horas de Madrid**, nunca en el huso crudo de la base.

**Fase C · La pantalla del historial**

Ruta nueva en el OS. La ve el administrador (todo) y el setter (lo suyo).

1. **Arriba, el grafico**: los dias del periodo, uno al lado del otro, con los cuatro numeros
   dibujados y **escritos encima**, los ejes rotulados, el mejor y el peor dia señalados dentro
   del propio dibujo, y los dias sin parte marcados como hueco. En el telefono se rehace, no se
   encoge.
2. **Debajo, la tabla del historial diario**, de 20 en 20 con flechas de pagina:

   | Dia | Persona | Conv. | Follow | Ofertas | Agendadas | Lo registro | Ultima correccion |
   |---|---|---|---|---|---|---|---|
   | mie 19 ago | Juanda | 1 | 2 | 0 | 0 | Juanda, 11:17 | sin correcciones |
   | mar 18 ago | Juanda | sin registrar | | | | | |

3. **Al tocar un dia se abre una ventana** con la ficha de ese dia y **la linea de tiempo completa**:

   ```
   Juanda lo registro    jue 13 ago, 11:36    0 conv · 5 follow · 0 ofertas · 0 agendadas
   Juanda lo corrigio    jue 13 ago, 11:37    follow-ups  5 -> 7
   Marco lo corrigio     vie 14 ago, 19:42    ofertas     0 -> 2
   ```

4. **Editar desde ahi**: el mismo formulario del parte, abierto sobre ese dia y esa persona.
   El setter edita el suyo; el administrador, cualquiera. Cada guardado añade su linea.
5. **Bloque de hoy**: quien ya registro hoy y a que hora, y quien falta por registrar.
6. **Filtros**: el filtro de fechas unico del OS, y filtro por persona cuando haya mas de una.

**Fase D · Knowledge y comprobacion**

- SOP nuevo con el sistema entero (que se mide, quien lo rellena, quien lo puede corregir, que
  guarda el historial), y punteros desde el SOP de roles y el del dashboard.
- Prueba real de punta a punta: registrar un dia, corregirlo, corregirlo siendo administrador,
  y comprobar que las tres lineas salen con su hora y su cambio. Verificado en la web, no solo
  en local.

## Que NO entra

- **No cambian los cuatro numeros del parte** ni el formulario que ya usa Juanda. Los mismos
  campos, el mismo boton, el mismo sitio.
- **No se toca el Dashboard.** Sus cuatro cifras del periodo siguen saliendo igual.
- **No se borra ni se pierde nada** de lo que ya hay.
- **No se cambia quien rellena el parte** (setter y administrador). Lo unico que se añade es que
  el administrador pueda corregir el de otro.
- **Sin avisos al telefono.** Se quitaron a proposito el 2026-08-07 y no vuelven.

## Cosas que decido yo (si alguna no te cuadra, la cambio)

1. **La pantalla se llama "Actividad"** y va en una seccion nueva del menu, **Ventas**, que hoy
   no existe en el menu aunque si en el Knowledge.
2. **El historial no se puede borrar ni editar.** Un rastro que se puede reescribir no sirve
   como rastro.
3. **Un dia sin parte se enseña igual**, escrito como "sin registrar". Es un dato, no un vacio.
4. **Se guarda el antes y el despues completos** de cada guardado, no solo lo que cambio. Ocupa
   nada y permite reconstruir cualquier dia tal como estaba en cualquier momento.

## Como lo veras

Entras en Actividad, eliges el periodo, y ves el grafico de los dias con sus numeros escritos.
Debajo, la lista de dias. Tocas el 13 de agosto y se abre una ventana que dice, en orden, que
Juanda lo registro a las 11:36 con 0/5/0/0, que un minuto despues subio los follow-ups de 5 a 7,
y que tu se los corregiste el dia siguiente a las 19:42. Con el boton de editar cambias el numero
que haga falta y aparece una linea mas, con tu nombre y la hora.
