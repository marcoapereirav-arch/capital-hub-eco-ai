/**
 * El parte diario y su historial.
 *
 * Los nombres de los campos son los mismos en la base, en la API y aqui, a proposito:
 * un dato que se llama de tres formas distintas se acaba sumando mal.
 */

export type CampoParte = "conversaciones" | "followups" | "ofertas" | "agendadas"

export type Numeros = Record<CampoParte, number>

/** Los cuatro numeros, con el nombre exacto que se enseña en pantalla (REGLA #27). */
export const CAMPOS_PARTE: {
  clave: CampoParte
  etiqueta: string
  corto: string
  ayuda: string
}[] = [
  {
    clave: "conversaciones",
    etiqueta: "Conversaciones nuevas abiertas",
    corto: "Conversaciones",
    ayuda: "Gente con la que habló por primera vez",
  },
  {
    clave: "followups",
    etiqueta: "Follow-ups nuevos",
    corto: "Follow-ups",
    ayuda: "Seguimientos que retomó",
  },
  {
    clave: "ofertas",
    etiqueta: "Ofertas de llamada tiradas",
    corto: "Ofertas",
    ayuda: "Veces que ofreció la llamada",
  },
  {
    clave: "agendadas",
    etiqueta: "Llamadas agendadas",
    corto: "Agendadas",
    ayuda: "Las que quedaron puestas en la agenda",
  },
]

export type CambioLinea = {
  campo: string
  antes: number | null
  despues: number | null
}

export type LineaHistorial = {
  /** creado = el alta · editado = una correccion · reconstruido = rellenado hacia atras */
  accion: "creado" | "editado" | "reconstruido"
  actor: string | null
  cuando: string
  valores: Numeros
  cambios: CambioLinea[]
}

export type DiaHistorial = {
  clave: string
  fecha: string
  profileId: string
  persona: string
  registrado: boolean
  conversaciones: number
  followups: number
  ofertas: number
  agendadas: number
  total: number
  creadoPor: string | null
  creadoEl: string | null
  editadoPor: string | null
  editadoEl: string | null
  correcciones: number
  lineas: LineaHistorial[]
}

/**
 * Una barra del grafico: UN dia, con la metrica sumada de toda la gente que se este
 * mirando. Sumar la MISMA metrica entre personas si vale (son conversaciones distintas);
 * lo que nunca se suma son las cuatro metricas entre si, porque se solapan.
 */
export type BarraDia = {
  fecha: string
  valor: number
  registrado: boolean
  /** Los partes de ese dia, solo los que existen. */
  partes: DiaHistorial[]
  sinRegistrar: number
}

export type RespuestaHistorial = {
  hoy: string
  desde: string
  hasta: string
  esAdmin: boolean
  yo: { id: string; nombre: string }
  /** `esSetter` = tiene el parte como tarea diaria. Solo a esos se les cuentan los huecos. */
  personas: { id: string; nombre: string; rol: string; esSetter: boolean }[]
  dias: DiaHistorial[]
  totales: Numeros & {
    diasRegistrados: number
    diasSinRegistrar: number
    correcciones: number
  }
}
