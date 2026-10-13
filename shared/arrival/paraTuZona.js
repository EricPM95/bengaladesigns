/**
 * «Para tu zona» (Tanda 7, punto 13): dada una zona, un punto y una hora de llegada (o de salida), la mejor opción y las
 * otras que siguen funcionando a esa hora. Función PURA: lee las tablas de `data/dias/<destino>/_llegada.json`
 * (`tramos` + `para_tu_zona`) y no escribe ningún texto de pantalla; lo único que devuelve en palabras son los textos que
 * ya vienen en los datos (el aviso del último tren, la nota «es otro billete»).
 *
 * La hora que entra es la del viajero (la de aterrizar) o, a la vuelta, la de SALIR de su zona (vuelo − margen): se usa por
 * dentro y nunca se enseña. Con `margenMin` (por defecto 0) se puede exigir un margen entre la hora y el tren.
 *
 * Reglas:
 *  - La zona «nose» ('Aún no lo sé') usa la zona de `zona_sin_saber.usar_zona` (Termini) y devuelve `quitarDelResumen: [2, 3]`.
 *  - «Modo noche»: si el punto tiene un servicio de referencia (`columnas[col].referencia_horaria`: el Leonardo Express en Fiumicino) con
 *    horario conocido para esa fecha, y la hora cae fuera de [primero, último], «tu mejor opción» es el traslado privado con el aviso
 *    del tramo, y «otras» son solo las opciones cuyos tramos tienen TODOS horario conocido y se cumple (un metro sin horario no cuenta
 *    como «sigue funcionando»). En modo normal, «otras» no lleva las opciones con algún tramo que ya no funciona a esa hora.
 *  - Sin datos de horario (Ciampino, Tiburtina, Civitavecchia, fuera del tramo de fechas, sin fecha): modo normal, `horarioConocido: false`.
 *  - A la vuelta, cada opción se lee al revés (tramos invertidos, de/a cambiados, horario `vuelta`).
 */
import { dateInTramo } from '../routeEngine/openingHours.js'

const aMinutos = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** La clave de la columna de la tabla a la que pertenece un punto ('fco' → 'fco'; 'tibus' → 'tiburtina'). */
export function columnaDePunto(paraTuZona, puntoId) {
  for (const [col, def] of Object.entries(paraTuZona?.columnas ?? {})) if ((def.puntos ?? []).includes(puntoId)) return col
  return null
}

/** La fecha a mirar: la del viaje o, sin ella, el día 15 del mes (0-11) con el año dado (2026 si no se dice). */
export function fechaParaHorario({ fecha, mes, anio }) {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.slice(0, 10)
  if (Number.isInteger(mes)) return `${anio ?? 2026}-${String(mes + 1).padStart(2, '0')}-15`
  return null
}

/** ¿Funciona el servicio a esa hora ese día? true / false / null (null = sin dato para esa fecha). `quePasa`: 'tarde' | 'pronto' | null. */
export function funcionaA(horarioDeUnSentido, minutos, fechaIso, margenMin = 0) {
  if (!horarioDeUnSentido || minutos == null) return { funciona: null, quePasa: null }
  const filas = horarioDeUnSentido.tramos_de_fechas ?? []
  const fila = filas.find((f) => {
    if (!f.from && !f.to) return true
    if (!fechaIso) return false
    if (f.anio != null && Number(fechaIso.slice(0, 4)) !== f.anio) return false
    return dateInTramo({ from: f.from, to: f.to }, fechaIso)
  })
  if (!fila) return { funciona: null, quePasa: null }
  const primero = aMinutos(fila.primero)
  const ultimo = aMinutos(fila.ultimo)
  const h = minutos + margenMin
  if (primero == null || ultimo == null) return { funciona: null, quePasa: null }
  const dentro = ultimo >= primero ? h >= primero && h <= ultimo : h >= primero || h <= ultimo
  if (dentro) return { funciona: true, quePasa: null }
  return { funciona: false, quePasa: minutos < primero && !(ultimo < primero) ? 'pronto' : 'tarde', fila }
}

function leerOpcion(info, opcion, { vuelta, minutos, fechaIso, margenMin }) {
  const ids = vuelta ? [...opcion.tramos].reverse() : opcion.tramos
  const tramos = ids.map((id) => {
    const base = info.tramos[id]
    const t = vuelta ? { ...base, de: base.a, a: base.de } : { ...base }
    const horario = base.horario?.[vuelta ? 'vuelta' : 'ida'] ?? null
    const r = funcionaA(horario, minutos, fechaIso, margenMin)
    return { ...t, funciona: r.funciona, horario: horario ? { ...horario } : null }
  })
  return {
    id: opcion.id,
    tramos,
    pasaPorTermini: !!opcion.pasa_por_termini,
    // Posición (en el orden de lectura) del primer tramo que es «otro billete»; solo a la ida tiene sentido tal cual.
    otroBilleteDesde: opcion.pasa_por_termini ? (vuelta ? 0 : opcion.otro_billete_desde ?? null) : null,
    notaOtroBillete: opcion.pasa_por_termini ? info.para_tu_zona.nota_otro_billete : null,
    horarioConocido: tramos.some((t) => t.horario != null),
    // Funciona si ningún tramo con horario falla; en modo noche además hace falta que TODOS los tramos tengan horario que se cumpla.
    funcionaTodo: tramos.every((t) => t.funciona === true),
    falla: tramos.some((t) => t.funciona === false),
  }
}

/**
 * @param {object} info  el contenido de _llegada.json
 * @param {{ zona: string, puntoId: string, hora?: string|null, fecha?: string|null, mes?: number|null, anio?: number, sentido?: 'llegada'|'vuelta', margenMin?: number }} entrada
 */
export function paraTuZona(info, { zona, puntoId, hora = null, fecha = null, mes = null, anio, sentido = 'llegada', margenMin = 0 } = {}) {
  const ptz = info?.para_tu_zona
  const col = columnaDePunto(ptz, puntoId)
  if (!ptz || !col) return null
  const sinZona = !zona || zona === ptz.zona_sin_saber?.id || !ptz.zonas[zona]
  const zonaUsada = sinZona ? ptz.zona_sin_saber.usar_zona : zona
  const celda = ptz.zonas[zonaUsada]?.[col]
  if (!celda) return null
  const vuelta = sentido === 'vuelta'
  const minutos = aMinutos(hora)
  const fechaIso = fechaParaHorario({ fecha, mes, anio })
  const contexto = { vuelta, minutos, fechaIso, margenMin }
  const opciones = celda.map((o) => leerOpcion(info, o, contexto))

  // ¿El servicio de referencia del punto (el Leonardo Express) deja de funcionar a esa hora?
  const refId = ptz.columnas[col].referencia_horaria ?? null
  let modo = 'normal'
  let aviso = null
  let horarioReferencia = false
  if (refId && minutos != null) {
    const horario = info.tramos[refId]?.horario?.[vuelta ? 'vuelta' : 'ida']
    const r = funcionaA(horario, minutos, fechaIso, margenMin)
    horarioReferencia = r.funciona !== null
    if (r.funciona === false) {
      modo = 'noche'
      aviso = r.quePasa === 'pronto' ? horario.texto_pronto ?? null : horario.texto_tarde ?? null
    }
  }
  const resultado = {
    columna: col,
    zona: zonaUsada,
    sinZona,
    quitarDelResumen: sinZona ? [...(ptz.zona_sin_saber.quitar_del_resumen ?? [])] : [],
    avisoSinZona: sinZona ? ptz.zona_sin_saber.arriba ?? null : null,
    sentido,
    modo,
    aviso,
    horarioConocido: refId ? horarioReferencia : opciones.some((o) => o.horarioConocido),
  }
  if (modo === 'noche') {
    return {
      ...resultado,
      mejor: { tipo: 'traslado_privado' },
      // «Solo lo que sigue funcionando»: todos los tramos con horario conocido y cumplido (un metro sin horario no cuenta).
      otras: opciones.filter((o) => o.funcionaTodo),
      sinOtras: opciones.every((o) => !o.funcionaTodo),
    }
  }
  const validas = opciones.filter((o) => !o.falla)
  if (validas.length === 0) return { ...resultado, modo: 'noche', mejor: { tipo: 'traslado_privado' }, otras: [], sinOtras: true }
  const [mejor, ...otras] = validas
  return { ...resultado, mejor: { tipo: 'opcion', ...mejor }, otras, sinOtras: otras.length === 0 }
}
