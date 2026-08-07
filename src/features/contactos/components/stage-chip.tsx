/**
 * Colores del chip de stage, con los tokens del tema.
 *
 * Antes cada stage tenia su propia familia de Tailwind (cyan, ambar, violeta,
 * naranja...), o sea seis colores que no son de la marca conviviendo en la misma
 * lista. La marca es carbon + verde, con rojo para el error y ambar SOLO para
 * avisar. Aqui se traduce el significado del stage a esos cuatro:
 *
 *   ganado (alumno, won) ....... verde
 *   perdido .................... rojo
 *   no se presento ............. ambar de aviso
 *   el resto (en marcha) ....... gris del tema
 */
export function clasesDeStage(stage: string | null | undefined): string {
  switch (stage) {
    case "alumno":
    case "won":
    case "won_mes":
    case "won_ano":
      return "border-primary/40 bg-primary/10 text-primary"
    case "perdido":
    case "lost":
      return "border-destructive/40 bg-destructive/10 text-destructive"
    case "no_show":
      return "border-warn/40 bg-warn/10 text-warn"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

/** El mismo criterio, solo para el borde de una columna del tablero. */
export function bordeDeStage(stage: string | null | undefined): string {
  switch (stage) {
    case "alumno":
    case "won":
    case "won_mes":
    case "won_ano":
      return "border-primary/40"
    case "perdido":
    case "lost":
      return "border-destructive/40"
    case "no_show":
      return "border-warn/40"
    default:
      return "border-border"
  }
}
