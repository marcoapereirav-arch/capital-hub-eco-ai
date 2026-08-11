/**
 * Los colores de las etiquetas que crea el sistema solo.
 *
 * Esto NO es diseno de pantalla: es un DATO que se guarda en la fila de la etiqueta
 * (`tags.color`) y que despues se pinta donde toque. Por eso se escribe el valor y no un
 * token del tema: el token no existe dentro de una fila de la base de datos.
 *
 * Los dos valores son los que ya llevaban las etiquetas creadas por los funnels desde
 * junio de 2026. Cambiarlos aqui no repinta las que ya existen.
 */

/** `origen:<funnel>` — por que puerta entro el lead. Grafito. */
export const COLOR_ETIQUETA_ORIGEN = "#2A2D34"

/** `fuente:<afiliado>` — quien lo trajo. Grafito un punto mas claro. */
export const COLOR_ETIQUETA_FUENTE = "#3F3F46"
