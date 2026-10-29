/**
 * LOS TEXTOS DE LOS AVISOS (cuentas parte 3, punto 4: la campanita). UN solo sitio, para el servidor (el aviso en el móvil) y para la app (la lista de la campanita). Sin React ni red.
 * El nombre de quien lo hace es su nombre de pila; si no tiene uno puesto (cuentas parte 3B), el aviso no inventa uno: «Te recomiendan un cambio…», «Han aceptado tu cambio» y, en el círculo, la inicial de su email. Ningún nombre de app escrito aquí: el título del aviso del móvil sale de data/marca.json.
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** «16 al 19 de octubre» (mismo mes) o «28 de octubre al 2 de noviembre». */
export function rangoEnPalabras(inicio, fin) {
  const [, mi, di] = String(inicio).split('-').map(Number)
  const [, mf, df] = String(fin).split('-').map(Number)
  if (mi === mf) return di === df ? `${di} de ${MESES[mi - 1]}` : `${di} al ${df} de ${MESES[mi - 1]}`
  return `${di} de ${MESES[mi - 1]} al ${df} de ${MESES[mf - 1]}`
}

import { formatoImporte } from '../dinero/formato.js'
import { elDiaDicho, limpiarListas, rangoDelViaje } from './cambioViaje.js'
import { nombreVisible } from '../nombres/nombreVisible.js'

/** «el Coliseo» → «del Coliseo»; «Panteón» → «de Panteón». */
export const conDe = (sitio) => String(sitio ?? '').replace(/^el /i, 'del ').replace(/^(la|las|los) /i, (m) => `de ${m}`).replace(/^(?!del |de la |de las |de los )/i, 'de ')

/** El nombre de pila, o '' si la persona aún no ha puesto uno. */
const nombreDe = (n) => (n && String(n).trim() ? nombreVisible(String(n)) : '')

/** El lugar de la recomendación: «en el día 2» (con el número del día) o nada. */
const enElDia = (dia) => (Number.isInteger(dia) && dia > 0 ? ` en el día ${dia}` : '')

/** «Laura te recomienda un cambio en el día 2» · «cambios en el día 3» · «otra ruta». */
export function titularDeRecomendacion(nombre, tipoRec, dia = null) {
  const quien = nombreDe(nombre) ? `${nombreDe(nombre)} te recomienda` : 'Te recomiendan'
  if (tipoRec === 'cambio') return `${quien} un cambio${enElDia(dia)}`
  if (tipoRec === 'dia') return `${quien} cambios${dia ? enElDia(dia) : ' en un día'}`
  return `${quien} otra ruta`
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** «sábado 28» a partir de «2026-11-28». Vacío si la fecha no vale. */
function diaEnPalabras(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return `${DIAS_SEMANA[d.getUTCDay()]} ${Number(m[3])}`
}

/**
 * (Tanda 10N §10) Lo que cambió en el viaje, en lenguaje normal: «ha quitado 2 días», «ha añadido Fontana di Trevi al sábado 28», «ha cambiado las fechas». `plural`: sin nombre de quien lo hace
 * («han quitado 2 días»). Varios cambios seguidos se juntan en uno: «ha quitado 2 días y ha añadido Fontana di Trevi al sábado 28».
 */
let TABLA_DE_ARTICULOS = {}
/** (10N3 §2.2) La tabla nombre del sitio → 'el' | 'la' | 'los' | 'las' | '' (data/logros/articulos.json, todos los destinos juntos). La pone el servidor al arrancar; sin ella, los nombres salen sin artículo. */
export function ponerTablaDeArticulos(tabla) {
  TABLA_DE_ARTICULOS = tabla ?? {}
}
const normaSitio = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim().toLowerCase()
/** «la Fontana de Trevi», «el Coliseo»; sin artículo en la tabla (o sin tabla): «Piazza Navona». */
export function sitioConArticulo(nombre) {
  const limpio = String(nombre ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()
  const clave = normaSitio(limpio)
  for (const [k, v] of Object.entries(TABLA_DE_ARTICULOS)) if (normaSitio(k) === clave) return v ? `${v} ${limpio}` : limpio
  return limpio
}

/** «el Free Tour» (el nombre del Free Tour del destino empieza siempre por «Free Tour»), o el sitio con su artículo. */
const sitioDicho = (nombre) => (/^free tour/i.test(String(nombre ?? '').trim()) ? 'el Free Tour' : sitioConArticulo(nombre))

/** (10N9) «ida el martes 10 a las 11:15 y vuelta el viernes 13 a las 18:05» (lo que falte, no se dice). */
function ladosDelVuelo(a) {
  const dicho = (nombre, t) => (t && t.hora ? nombre + (diaEnPalabras(t.fecha) ? ' el ' + diaEnPalabras(t.fecha) : '') + ' a las ' + t.hora : '')
  return [dicho('ida', a.ida), dicho('vuelta', a.vuelta)].filter(Boolean)
}

/**
 * (10N5 §2 y §2b) Una línea con lo que de verdad ha pasado, sin punto final y sin el nombre: «ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días», «ha movido el Coliseo al jueves 12 y 2 sitios más»,
 * «ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento)», «ha vuelto a la ruta inicial». Un cambio con nombre propio (`cambio.accion`, lo apunta el móvil de quien lo hace) manda sobre la lista de lo que se movió.
 * `plural`: sin nombre de quien lo hace («han añadido…»).
 */
export function queCambioEnElViaje(p, plural = false) {
  const v = (singular, pluralForma) => (plural ? pluralForma : singular)
  const c = p.cambio && typeof p.cambio === 'object' ? p.cambio : null
  const a = c?.accion
  if (a && typeof a === 'object') {
    const dia = elDiaDicho(a)
    if (a.tipo === 'free_tour') {
      const n = Number(a.reorganizados) || 0
      const resto = n > 0 ? ` y se ${n === 1 ? 'ha reorganizado 1 día' : `han reorganizado ${n} días`}` : ''
      return `${v('ha añadido', 'han añadido')} el Free Tour al ${diaEnPalabras(a.fecha) || (Number.isInteger(a.dia_n) ? `día ${a.dia_n}` : 'viaje')}${resto}`
    }
    if (a.tipo === 'excursion') {
      if (a.a === 'excursion') return `${v('ha cambiado', 'han cambiado')} ${dia} a día de excursión${a.excursion ? ` (${a.excursion})` : ''}`
      return `${v('ha cambiado', 'han cambiado')} ${dia} a un día en ${a.ciudad || 'la ciudad'}`
    }
    if (a.tipo === 'recuperar_ruta') return v('ha vuelto a la ruta inicial', 'han vuelto a la ruta inicial')
    if (a.tipo === 'recuperar_dia') return `${v('ha recuperado', 'han recuperado')} ${dia} como estaba`
    // (Nunca «ha cambiado las fechas» si las fechas son las mismas: rehacer la ruta con las mismas fechas es «ha rehecho la ruta».)
    if (a.tipo === 'fechas' && !(c.fechas && JSON.stringify(c.fechas.antes) !== JSON.stringify(c.fechas.despues))) return v('ha rehecho la ruta', 'han rehecho la ruta')
    if (a.tipo === 'fechas') {
      const f = c.fechas?.despues ? rangoDelViaje(c.fechas.despues.inicio, c.fechas.despues.fin) : ''
      return `${v('ha cambiado', 'han cambiado')} las fechas del viaje${f ? ` (${f})` : ''}`
    }
    if (a.tipo === 'rehacer') return v('ha rehecho la ruta', 'han rehecho la ruta')
    if (a.tipo === 'vuelo') {
      const lados = ladosDelVuelo(a)
      return `${v('ha guardado', 'han guardado')} el ${a.medio || 'vuelo'}${lados.length ? ` (${lados.join(' y ')})` : ''}`
    }
  }
  // (10N8 §4) Cambiar el orden de los días: «ha cambiado el orden de los días».
  if (c?.orden_dias) return `${v('ha cambiado', 'han cambiado')} el orden de los días`
  const base = c ?? p
  const partes = []
  // (Un aviso de antes puede traer «quitó 1 día» y «añadió 1 día» sumados: quitar un día y volver a ponerlo es nada, se cuenta la diferencia.)
  const diasQ = c ? Math.max((Number(c.dias_antes) || 0) - (Number(c.dias_despues) || 0), 0) : Number(p.dias_quitados) || 0
  const diasA = c ? Math.max((Number(c.dias_despues) || 0) - (Number(c.dias_antes) || 0), 0) : Number(p.dias_anadidos) || 0
  const quitados = Math.max(diasQ - diasA, 0)
  const anadidos = Math.max(diasA - diasQ, 0)
  const listaQuitados = Array.isArray(c?.dias_quitados_lista) ? c.dias_quitados_lista : []
  // (10N8 §4) Un día quitado se dice con su fecha: «ha quitado el sábado 14».
  if (quitados > 0) partes.push(`${v('ha quitado', 'han quitado')} ${quitados === 1 && listaQuitados.length === 1 ? elDiaDicho(listaQuitados[0]) : quitados === 1 ? '1 día' : `${quitados} días`}`)
  if (anadidos > 0) partes.push(`${v('ha añadido', 'han añadido')} ${anadidos === 1 ? '1 día' : `${anadidos} días`}`)
  const L = limpiarListas(base)
  if (L.anadidas.length > 0) {
    const primera = L.anadidas[0]
    const cuando = diaEnPalabras(primera.fecha) ? ` al ${diaEnPalabras(primera.fecha)}` : Number.isInteger(primera.dia_n) ? ` al día ${primera.dia_n}` : ''
    // (10N8 §4) «ha añadido el Panteón y 2 sitios más al jueves 12» (todos en el mismo día); si son de días distintos, «ha añadido el Panteón al jueves 12 y 2 sitios más».
    const mismoDia = L.anadidas.every((x) => (x.fecha ?? x.dia_n) === (primera.fecha ?? primera.dia_n))
    const mas = L.nAnadidas - 1 === 1 ? '1 sitio más' : `${L.nAnadidas - 1} sitios más`
    partes.push(L.nAnadidas > 1 ? (mismoDia ? `${v('ha añadido', 'han añadido')} ${sitioDicho(primera.nombre)} y ${mas}${cuando}` : `${v('ha añadido', 'han añadido')} ${sitioDicho(primera.nombre)}${cuando} y ${mas}`) : `${v('ha añadido', 'han añadido')} ${sitioDicho(primera.nombre)}${cuando}`)
  }
  // Quitar un día se lleva sus sitios: no se cuentan aparte.
  if (L.quitadas.length > 0 && quitados === 0) partes.push(`${v('ha quitado', 'han quitado')} ${L.nQuitadas === 1 ? sitioDicho(L.quitadas[0].nombre) : `${L.nQuitadas} sitios`}`)
  if (L.movidas.length > 0 && L.anadidas.length === 0 && quitados === 0 && anadidos === 0) {
    const primera = L.movidas[0]
    const cuando = diaEnPalabras(primera.fecha) ? ` al ${diaEnPalabras(primera.fecha)}` : Number.isInteger(primera.dia_n) ? ` al día ${primera.dia_n}` : ''
    partes.push(`${v('ha movido', 'han movido')} ${sitioDicho(primera.nombre)}${cuando}${L.nMovidas > 1 ? ` y ${L.nMovidas - 1 === 1 ? '1 sitio más' : `${L.nMovidas - 1} sitios más`}` : ''}`)
  }
  // (Aviso de un móvil o disparador anterior: solo sabe CUÁNTAS paradas cambiaron de día.)
  if (!c && L.movidas.length === 0 && L.anadidas.length === 0 && L.quitadas.length === 0 && Number(p.movidas) > 0) partes.push(`${v('ha movido', 'han movido')} ${Number(p.movidas) === 1 ? '1 sitio' : `${Number(p.movidas)} sitios`}`)
  const fechas = c ? Boolean(c.fechas && JSON.stringify(c.fechas.antes) !== JSON.stringify(c.fechas.despues)) : Boolean(p.fechas)
  if (fechas && !((quitados > 0 || anadidos > 0) && c && c.fechas && c.fechas.antes?.inicio === c.fechas.despues?.inicio)) partes.push(`${v('ha cambiado', 'han cambiado')} las fechas`)
  const huboOrden = c ? Number(c.reordenados) > 0 : (Number(p.movidas) || 0) > 0 || p.reordenado
  if (partes.length === 0 && huboOrden) partes.push(`${v('ha cambiado', 'han cambiado')} el orden de las paradas`)
  if (partes.length === 0) return ''
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
}

/** El texto de un aviso de la campanita, tal como se lee en la lista. */
export function textoDelAviso(aviso) {
  const p = aviso.payload ?? {}
  switch (aviso.tipo) {
    case 'recomendacion':
      // Tanda 10N: una propuesta de cambios sueltos (migración 0039 pone `n_cambios`): «Ana te propone 5 cambios en tu viaje a Roma».
      if (Number.isInteger(p.n_cambios) && p.n_cambios > 0) return `${nombreDe(p.autor) ? `${nombreDe(p.autor)} te ha mandado` : 'Te han mandado'} una propuesta de ${p.n_cambios} ${p.n_cambios === 1 ? 'cambio' : 'cambios'}${p.destino ? ` para el viaje a ${p.destino}` : ''}`
      // (10N4) En la campana, en pasado como el resto («Laura te ha recomendado…»); el título de la hoja R2 sigue en presente («te recomienda»).
      return titularDeRecomendacion(p.autor, p.tipo_rec, p.dia).replace(/te recomienda /, 'te ha recomendado ').replace(/^Te recomiendan /, 'Te han recomendado ')
    case 'aceptada': {
      // Tanda 10N: «Eric ha aceptado 3 de tus 5 cambios».
      if (Number.isInteger(p.n_total) && p.n_total > 0) {
        const n = Number(p.n_aceptados) || 0
        const admin = nombreDe(p.admin)
        if (n >= p.n_total) return `${admin ? `${admin} ha aceptado` : 'Han aceptado'} ${p.n_total === 1 ? 'tu cambio' : `tus ${p.n_total} cambios`}`
        return `${admin ? `${admin} ha aceptado` : 'Han aceptado'} ${n} de tus ${p.n_total} cambios`
      }
      const que = p.tipo_rec === 'cambio' ? 'tu cambio' : p.tipo_rec === 'dia' ? 'tus cambios' : 'tu ruta'
      return `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha aceptado` : 'Han aceptado'} ${que}${p.tipo_rec === 'ruta' ? '' : enElDia(p.dia)}`
    }
    case 'rechazada':
      if (Number.isInteger(p.n_total) && p.n_total > 0) return `${nombreDe(p.admin) ? `${nombreDe(p.admin)} no ha aceptado` : 'No han aceptado'} ${p.n_total === 1 ? 'tu cambio' : `ninguno de tus ${p.n_total} cambios`}`
      return `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha preferido` : 'Han preferido'} dejar ${Number.isInteger(p.dia) && p.dia > 0 ? `el día ${p.dia}` : 'tu ruta'} como estaba`
    // Tanda 10N: el día antes del viaje, a quien tiene cambios sin enviar.
    case 'sin_enviar':
      return `Tienes ${p.n} ${p.n === 1 ? 'cambio' : 'cambios'} sin enviar${nombreDe(p.admin) ? ` a ${nombreDe(p.admin)}` : ''}. ${p.n === 1 ? 'Envíalo' : 'Envíalos'} hoy, que mañana empieza el viaje.`
    case 'unido': {
      // (Tanda 10N7 §2 y §2b-2) Si entra la primera persona a un viaje solo, o un tercero a una cuenta conjunta, al administrador se le pregunta cómo llevan las cuentas.
      const base = nombreDe(p.nombre) ? `${nombreDe(p.nombre)} se ha unido a tu viaje` : 'Alguien se ha unido a tu viaje'
      return base // (Tanda 10N10 §5a) Ya no se pregunta nada de las cuentas: las decide la app.
    }
    case 'd10':
      return p.dias === 1 ? `Mañana empieza tu viaje a ${p.destino}` : `En ${p.dias ?? 10} días empieza tu viaje a ${p.destino}`
    case 'resumen':
      return p.destino ? `Tu resumen del viaje a ${p.destino} está listo` : 'Tu resumen del viaje está listo'
    case 'sorpresas':
      return p.texto ?? (Number(p.dias) === 1 ? 'Te queda 1 día para reclamar tus sorpresas' : `Te quedan ${p.dias ?? 3} días para reclamar tus sorpresas`)
    // Tanda 10P: el aviso dorado del día que se entra en el sorteo (una sola vez) y el de quien invita cuando su amigo completa su primer viaje con HOY.
    case 'sorteo':
      return `¡Ya estás en el sorteo de ${p.anio}!`
    case 'amigo_viaje':
      return `${nombreDe(p.nombre) || 'Un amigo'} ha hecho su primer viaje con HOY: +${p.exp} EXP`
    // Tanda 10N (apartado 9, el presupuesto compartido): «Ana quiere añadir al presupuesto» (a quien decide, con el gasto dentro) y, a quien lo añadió, lo que han decidido.
    case 'gasto_pendiente':
      return nombreDe(p.autor) ? `${nombreDe(p.autor)} quiere añadir al presupuesto` : 'Quieren añadir un gasto al presupuesto'
    // Tanda 10N2 (cuentas del grupo): «Eric ha marcado como pagados los 15 € que le debías.» (el otro, siempre en su campana).
    case 'pago_marcado': {
      const quien = nombreDe(p.actor) || 'Alguien'
      const x = p.importe && Number.isFinite(Number(p.importe.amount)) ? formatoImporte({ amount: Number(p.importe.amount), currency: p.importe.currency }) : ''
      if (p.para === 'acreedor') return p.actor_id && p.actor_id === p.deudor_id ? `${quien} ha marcado como pagados los ${x} que te debía.` : `${quien} ha marcado como pagados los ${x} que ${nombreDe(p.deudor) || 'alguien'} te debía.`
      return p.actor_id && p.actor_id === p.acreedor_id ? `${quien} ha marcado como pagados los ${x} que le debías.` : `${quien} ha marcado como pagados los ${x} que le debías a ${nombreDe(p.acreedor) || 'alguien'}.`
    }
    case 'gasto_resuelto':
      return p.resultado === 'aceptado' ? `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha aceptado` : 'Han aceptado'} tu gasto` : `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha preferido` : 'Han preferido'} no sumar tu gasto`
    // Tanda 10N §8 (la entrada que el dueño compra para varios): «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.» · «Eric ha reservado el Coliseo el jueves 26 a las 8:00.»
    case 'reserva_grupo': {
      // «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26.» (la del invitado que no cuadra con la ruta; la crea la base de datos o la calcula el móvil)
      if (p.caso === 'no_cuadra') return `Tu entrada ${conDe(sitioConArticulo(p.sitio))} es el ${p.dia_reserva}, y en la ruta está el ${p.dia_ruta}.`
      // (Tanda 10N5 §6c) Lo de cada uno: «Ana ha puesto su propio vuelo.» (al administrador) · «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» (a quien el administrador le cambia el suyo).
      // (10N10) El vuelo que alguien pone solo para sí, con sus horas: «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.»
      if (p.caso === 'vuelo_propio' && p.con_horas === true && p.detalle) return `${nombreDe(p.quien) || 'Alguien'} ha puesto su vuelo: ${String(p.detalle).replace(/\.$/, '')}.`
      if (p.caso === 'vuelo_propio' || p.caso === 'alojamiento_propio') return `${nombreDe(p.quien) || 'Alguien'} ha puesto su propio ${p.caso === 'vuelo_propio' ? 'vuelo' : 'alojamiento'}.`
      // (Tanda 10N8 §7d) Un vuelo o alojamiento puesto por un invitado para varios: ida y vuelta juntas, en un solo aviso, con los nombres vistos desde quien lo lee.
      if ((p.caso === 'vuelo_cambiado' || p.caso === 'alojamiento_cambiado') && p.para_txt) return `${nombreDe(p.quien) || 'Alguien'} ha puesto ${p.caso === 'vuelo_cambiado' ? 'el vuelo' : 'el alojamiento'} para ${p.para_txt}${p.detalle ? `: ${p.detalle}` : ''}.${p.suyo_cambiado === true ? SUYO_CAMBIADO : ''}`
      if (p.caso === 'vuelo_cambiado' || p.caso === 'alojamiento_cambiado') return `${nombreDe(p.quien) || 'El administrador'} ha puesto ${p.caso === 'vuelo_cambiado' ? 'el vuelo' : 'el alojamiento'} ${PARA_DE_LO_SUYO[p.para] ?? 'para todos'}.${p.suyo_cambiado === true ? SUYO_CAMBIADO : ''}`
      const { quien, verbo } = quienesReservan(p)
      const [h, m] = String(p.hora ?? '').split(':')
      const hora = m === undefined ? String(p.hora ?? '') : `${Number(h)}:${m}`
      const sitio = sitioConArticulo(p.sitio)
      // (10N6 §1l) «Eric ha reservado el Coliseo para ti · jueves 12 · 9:15» · «Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?»
      const cuando = [p.dia, hora].filter(Boolean).join(' · ')
      return p.incluido ? `${nombreDe(p.quien) || 'El dueño'} ha reservado ${sitio} para ti · ${cuando}` : `${quien} ${verbo} ${sitio} · ${cuando}. ¿Reservas la tuya a la misma hora?`
    }
    // Tanda 10N §4a: a quien le cambian el permiso, a quien quitan del viaje, y los cambios del viaje que hacen el dueño o quien puede editar (§10).
    case 'permiso': {
      const quien = nombreDe(p.admin)
      if (p.permiso === 'editar') return quien ? `${quien} te ha dado permiso para editar el viaje a ${p.destino}` : `Te han dado permiso para editar el viaje a ${p.destino}`
      return quien ? `${quien} ha cambiado tu permiso: ahora puedes recomendar cambios en el viaje a ${p.destino}` : `Ahora puedes recomendar cambios en el viaje a ${p.destino}`
    }
    case 'quitado':
      return `Ya no formas parte del viaje a ${p.destino}`
    case 'viaje_cambiado': {
      // (10N4 §4b2) Lo que ha decidido la persona, dicho como lo diría ella: «Eric ha añadido la Fontana di Trevi al sábado 28». Sin lista de lo que la app ha movido por detrás.
      const quien = nombreDe(p.quien)
      const que = queCambioEnElViaje(p, !quien)
      return que ? `${quien ? '' : 'Han '}${quien ? `${quien} ` : ''}${que}.`.replace(/^Han han /, 'Han ') : quien ? `${quien} ha cambiado el viaje.` : 'Han cambiado el viaje.'
    }
    default:
      return 'Tienes un aviso'
  }
}

/** La segunda línea de un aviso de gasto (Tanda 10N): «Cena día 1 · 30 € · ya suma en el grupo» / «… · se queda solo para ti»; null en los demás avisos. */
export function detalleDelAviso(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo !== 'gasto_resuelto') return null
  const importe = p.precio && Number.isFinite(Number(p.precio.amount)) ? formatoImporte({ amount: Number(p.precio.amount), currency: p.precio.currency }) : null
  return [p.nombre, importe, p.resultado === 'aceptado' ? 'ya suma en el grupo' : 'se queda solo para ti'].filter(Boolean).join(' · ')
}

/** El cuerpo del aviso en el móvil: el mismo texto y, en el de los 10 días, lo del pase («Tu Pase Roma está activo para el viaje del 16 al 19 de octubre.»). */
export function textoDelPush(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo === 'd10' && p.con_pase && p.inicio && p.fin) return `${textoDelAviso(aviso)}. Tu Pase ${p.destino} está activo para el viaje del ${rangoEnPalabras(p.inicio, p.fin)}.`
  const detalle = detalleDelAviso(aviso)
  return detalle ? `${textoDelAviso(aviso)}. ${detalle}` : textoDelAviso(aviso)
}

/** Quién hace lo que cuenta el aviso (para la inicial del círculo): su nombre o, si no tiene, la inicial de su email; null si es un aviso de la app (o no hay ni una cosa ni otra: se pinta el icono). */
export function quienDelAviso(aviso) {
  const p = aviso.payload ?? {}
  const de = (nombre) => nombreDe(nombre) || String(p.inicial ?? '').trim().slice(0, 1).toUpperCase() || null
  if (aviso.tipo === 'recomendacion') return de(p.autor)
  if (aviso.tipo === 'aceptada' || aviso.tipo === 'rechazada' || aviso.tipo === 'gasto_resuelto') return de(p.admin)
  if (aviso.tipo === 'gasto_pendiente') return de(p.autor)
  if (aviso.tipo === 'pago_marcado') return de(p.actor)
  if (aviso.tipo === 'unido') return de(p.nombre)
  if (aviso.tipo === 'reserva_grupo') return de(p.quien)
  if (aviso.tipo === 'permiso') return de(p.admin)
  if (aviso.tipo === 'viaje_cambiado') return de(p.quien)
  return null
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
/* (Tanda 10N4 §4b) LA FRANJA DE AVISO NUEVO: el título corto («Eric ha añadido un sitio») y el detalle («Fontana di Trevi · sábado 14») de cada aviso, y su icono.       */
/* `icono`: 'persona' (la inicial o la foto de quien lo hizo, en la moneda dorada) · 'calendario' (fechas especiales: «Mañana empieza tu viaje») · 'info' (información:   */
/* «cierran los Museos Vaticanos», «ya no formas parte…») · 'estrella' (el sorteo y los logros) · 'ticket' (las entradas que avisa la app). Pura, sin React ni red.         */
/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------ */

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** «26 – 29 nov» (mismo mes) o «28 oct – 2 nov». Vacío si las fechas no valen. */
export function rangoCorto(inicio, fin) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(inicio ?? ''))
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fin ?? ''))
  if (!a) return ''
  const [da, ma] = [Number(a[3]), Number(a[2])]
  if (!b) return `${da} ${MESES_CORTOS[ma - 1]}`
  const [db, mb] = [Number(b[3]), Number(b[2])]
  return ma === mb ? (da === db ? `${da} ${MESES_CORTOS[ma - 1]}` : `${da} – ${db} ${MESES_CORTOS[ma - 1]}`) : `${da} ${MESES_CORTOS[ma - 1]} – ${db} ${MESES_CORTOS[mb - 1]}`
}

const nombreSinMarca = (n) => String(n ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()
const con = (quien, haHecho, sinNombre) => (nombreDe(quien) ? `${nombreDe(quien)} ${haHecho}` : sinNombre)
/** (10N5 §6c) «para todos» · «para ti» · «para algunos»: a quién le ha puesto el administrador su vuelo o su alojamiento. */
const PARA_DE_LO_SUYO = { todos: 'para todos', ti: 'para ti', algunos: 'para algunos' }
/** (10N6 §1l) «Eric», «Eric y Ana», «Eric, Ana y Laura» (los nombres de quienes tienen la entrada, que la base de datos guarda en `tienen`). */
const unirNombres = (lista) => {
  const n = (Array.isArray(lista) ? lista : []).map((x) => nombreDe(x)).filter(Boolean)
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
}
/** (10N6 §1l) Quién(es) y el verbo de «han reservado»: con más de uno que la tienen, en plural y con los nombres; si no, solo quien la reservó. */
const quienesReservan = (p) => {
  const varios = Array.isArray(p.tienen) && p.tienen.filter(Boolean).length > 1
  return varios ? { quien: unirNombres(p.tienen), verbo: 'han reservado' } : { quien: nombreDe(p.quien) || 'El dueño', verbo: 'ha reservado' }
}
/** (10N6 0a-6) «Se ha cambiado el tuyo.» solo a quien tenía su propio vuelo o alojamiento. */
const SUYO_CAMBIADO = ' Se ha cambiado el tuyo.'
const dineroDe = (precio) => (precio && Number.isFinite(Number(precio.amount)) ? formatoImporte({ amount: Number(precio.amount), currency: precio.currency }) : '')
const mayuscula = (t) => String(t ?? '').replace(/^./, (c) => c.toUpperCase())

/** Lo que cuenta un «viaje_cambiado» para la franja: { verbo («ha añadido un sitio»), detalle }. */
function franjaDeCambioDelViaje(p) {
  // (10N5) Un cambio con nombre propio (añadir el Free Tour, pasar un día a excursión, recuperar…) se dice como es.
  const ac = p.cambio?.accion
  if (ac && typeof ac === 'object') {
    const dia = diaEnPalabras(ac.fecha) || (Number.isInteger(ac.dia_n) ? `día ${ac.dia_n}` : '')
    const viaje = p.destino ? `Viaje a ${p.destino}` : ''
    const n = Number(ac.reorganizados) || 0
    if (ac.tipo === 'free_tour') return { verbo: 'ha añadido el Free Tour', detalle: mayuscula([dia, n > 0 ? (n === 1 ? 'se ha reorganizado 1 día' : `se han reorganizado ${n} días`) : ''].filter(Boolean).join(' · ')) }
    if (ac.tipo === 'excursion') return { verbo: `ha cambiado ${elDiaDicho(ac)}`, detalle: ac.a === 'excursion' ? ['A día de excursión', ac.excursion].filter(Boolean).join(' · ') : `A un día en ${ac.ciudad || 'la ciudad'}` }
    if (ac.tipo === 'recuperar_ruta') return { verbo: 'ha vuelto a la ruta inicial', detalle: viaje }
    if (ac.tipo === 'recuperar_dia') return { verbo: `ha recuperado ${elDiaDicho(ac)}`, detalle: 'Como estaba' }
    if (ac.tipo === 'fechas') return p.cambio.fechas && JSON.stringify(p.cambio.fechas.antes) !== JSON.stringify(p.cambio.fechas.despues) ? { verbo: 'ha cambiado las fechas', detalle: viaje } : { verbo: 'ha rehecho la ruta', detalle: viaje }
    if (ac.tipo === 'rehacer') return { verbo: 'ha rehecho la ruta', detalle: viaje }
    if (ac.tipo === 'vuelo') return { verbo: `ha guardado el ${ac.medio || 'vuelo'}`, detalle: mayuscula(ladosDelVuelo(ac).join(' · ')) || viaje }
  }
  // (10N8 §4) El orden de los días y un día quitado con su fecha.
  if (p.cambio?.orden_dias) return { verbo: 'ha cambiado el orden de los días', detalle: p.destino ? `Viaje a ${p.destino}` : '' }
  const unDiaQuitado = Array.isArray(p.cambio?.dias_quitados_lista) && p.cambio.dias_quitados_lista.length === 1 && Math.max((Number(p.cambio.dias_antes) || 0) - (Number(p.cambio.dias_despues) || 0), 0) === 1
  if (unDiaQuitado && !(p.cambio.anadidas ?? []).length) return { verbo: `ha quitado ${elDiaDicho(p.cambio.dias_quitados_lista[0])}`, detalle: p.destino ? `Viaje a ${p.destino}` : '' }
  const dato = p.cambio ?? p
  const L = limpiarListas(dato)
  const anadidas = L.anadidas
  const quitadas = L.quitadas
  if (p.cambio && !(p.dias_quitados || p.dias_anadidos)) {
    const dq = Math.max((Number(p.cambio.dias_antes) || 0) - (Number(p.cambio.dias_despues) || 0), 0)
    const da = Math.max((Number(p.cambio.dias_despues) || 0) - (Number(p.cambio.dias_antes) || 0), 0)
    p = { ...p, dias_quitados: dq, dias_anadidos: da, fechas: Boolean(p.cambio.fechas && JSON.stringify(p.cambio.fechas.antes) !== JSON.stringify(p.cambio.fechas.despues)) }
  }
  if (L.movidas.length > 0 && anadidas.length === 0 && quitadas.length === 0 && !p.dias_quitados && !p.dias_anadidos && !p.fechas) {
    return L.nMovidas === 1
      ? { verbo: 'ha movido un sitio', detalle: [nombreSinMarca(L.movidas[0].nombre), diaEnPalabras(L.movidas[0].fecha) || (Number.isInteger(L.movidas[0].dia_n) ? `día ${L.movidas[0].dia_n}` : '')].filter(Boolean).join(' · ') }
      : { verbo: `ha movido ${L.nMovidas} sitios`, detalle: `${nombreSinMarca(L.movidas[0].nombre)} y ${L.nMovidas - 1 === 1 ? 'otro más' : `${L.nMovidas - 1} más`}` }
  }

  const quitados = Number(p.dias_quitados) || 0
  const anadidos = Number(p.dias_anadidos) || 0
  const tipos = [anadidas.length > 0, quitadas.length > 0 && quitados === 0, quitados > 0, anadidos > 0, Boolean(p.fechas)].filter(Boolean).length
  const viaje = p.destino ? `Viaje a ${p.destino}` : ''
  if (tipos === 1) {
    if (anadidas.length === 1) {
      const dia = diaEnPalabras(anadidas[0].fecha) || (Number.isInteger(anadidas[0].dia_n) ? `día ${anadidas[0].dia_n}` : '')
      return { verbo: 'ha añadido un sitio', detalle: [nombreSinMarca(anadidas[0].nombre), dia].filter(Boolean).join(' · ') }
    }
    if (anadidas.length > 1) return { verbo: `ha añadido ${anadidas.length} sitios`, detalle: `${nombreSinMarca(anadidas[0].nombre)} y ${anadidas.length - 1 === 1 ? 'otro más' : `${anadidas.length - 1} más`}` }
    if (quitadas.length === 1 && quitados === 0 && /^free tour/i.test(String(quitadas[0].nombre ?? '').trim())) return { verbo: 'ha quitado el Free Tour', detalle: viaje }
    if (quitadas.length > 0 && quitados === 0) return quitadas.length === 1 ? { verbo: 'ha quitado un sitio', detalle: nombreSinMarca(quitadas[0].nombre) } : { verbo: `ha quitado ${quitadas.length} sitios`, detalle: viaje }
    if (quitados > 0) return { verbo: `ha quitado ${quitados === 1 ? '1 día' : `${quitados} días`}`, detalle: viaje }
    if (anadidos > 0) return { verbo: `ha añadido ${anadidos === 1 ? '1 día' : `${anadidos} días`}`, detalle: viaje }
    if (p.fechas) return { verbo: 'ha cambiado las fechas', detalle: viaje }
  }
  return { verbo: 'ha cambiado el viaje', detalle: tipos > 1 ? `${tipos} cambios` : viaje }
}

/** { titulo, detalle, icono } de un aviso de la campanita para la franja de arriba (Design 11). `detalle` puede ir vacío. */
export function franjaDelAviso(aviso) {
  const p = aviso.payload ?? {}
  const quien = quienDelAviso(aviso)
  const persona = (titulo, detalle = '') => ({ titulo, detalle, icono: quien ? 'persona' : 'info' })
  switch (aviso.tipo) {
    case 'recomendacion': {
      const nombre = nombreDe(p.autor)
      if (Number.isInteger(p.n_cambios) && p.n_cambios > 0) return persona(con(p.autor, 'te ha mandado una propuesta', 'Te han mandado una propuesta'), `${p.n_cambios} ${p.n_cambios === 1 ? 'cambio' : 'cambios'}`)
      const que = p.tipo_rec === 'cambio' ? 'un cambio' : p.tipo_rec === 'dia' ? 'cambios' : 'otra ruta'
      return persona(nombre ? `${nombre} te ha recomendado ${que}` : `Te han recomendado ${que}`, Number.isInteger(p.dia) && p.dia > 0 ? `En el día ${p.dia}` : '')
    }
    case 'aceptada': {
      const n = Number(p.n_aceptados) || 0
      const total = Number(p.n_total) || 0
      const detalle = total > 0 ? (n >= total ? (total === 1 ? 'Tu cambio' : `Tus ${total} cambios`) : `${n} de tus ${total} cambios`) : p.tipo_rec === 'ruta' ? 'Tu ruta' : p.tipo_rec === 'dia' ? 'Tus cambios' : 'Tu cambio'
      return persona(con(p.admin, 'ha aceptado tu propuesta', 'Han aceptado tu propuesta'), detalle)
    }
    case 'rechazada': {
      const total = Number(p.n_total) || 0
      return persona(con(p.admin, 'no ha aceptado tu propuesta', 'No han aceptado tu propuesta'), total > 1 ? `Ninguno de tus ${total} cambios` : total === 1 ? 'Tu cambio' : '')
    }
    case 'sin_enviar':
      return { titulo: `Tienes ${p.n === 1 ? 'un cambio' : `${p.n} cambios`} sin enviar`, detalle: 'Envíalos hoy, que mañana empieza el viaje', icono: 'calendario' }
    case 'unido':
      return persona(nombreDe(p.nombre) ? `${nombreDe(p.nombre)} se ha unido al viaje` : 'Alguien se ha unido al viaje', p.destino ? `Viaje a ${p.destino}` : '')
    case 'd10':
      return { titulo: p.dias === 1 ? 'Mañana empieza tu viaje' : `Tu viaje empieza en ${p.dias ?? 10} días`, detalle: [p.destino, rangoCorto(p.inicio, p.fin)].filter(Boolean).join(' · '), icono: 'calendario' }
    case 'resumen':
      return { titulo: 'Tu resumen del viaje está listo', detalle: p.destino ?? '', icono: 'estrella' }
    case 'sorpresas':
      return { titulo: Number(p.dias) === 1 ? 'Te queda 1 día para tus sorpresas' : `Te quedan ${p.dias ?? 3} días para tus sorpresas`, detalle: p.destino ?? '', icono: 'estrella' }
    case 'sorteo':
      return { titulo: 'Ya tienes tu billete', detalle: p.anio ? `Para el sorteo de ${p.anio}` : 'Para el sorteo', icono: 'estrella' }
    case 'amigo_viaje':
      return persona(`${nombreDe(p.nombre) || 'Un amigo'} ha hecho su primer viaje`, `Has ganado ${p.exp} EXP`)
    case 'gasto_pendiente':
      return persona(con(p.autor, 'ha añadido un gasto', 'Han añadido un gasto'), [p.nombre, dineroDe(p.precio)].filter(Boolean).join(' · '))
    case 'gasto_resuelto':
      return persona(p.resultado === 'aceptado' ? con(p.admin, 'ha aceptado tu gasto', 'Han aceptado tu gasto') : con(p.admin, 'ha preferido no sumar tu gasto', 'Han preferido no sumar tu gasto'), detalleDelAviso(aviso) ?? '')
    case 'pago_marcado':
      return persona(con(p.actor, 'ha marcado un pago', 'Han marcado un pago'), dineroDe(p.importe))
    case 'reserva_grupo': {
      if (p.caso === 'vuelo_propio' && p.con_horas === true && p.detalle) return persona(`${nombreDe(p.quien) || 'Alguien'} ha puesto su vuelo`, String(p.detalle))
      if (p.caso === 'vuelo_propio' || p.caso === 'alojamiento_propio') return persona(`${nombreDe(p.quien) || 'Alguien'} ha puesto su propio ${p.caso === 'vuelo_propio' ? 'vuelo' : 'alojamiento'}.`, p.detalle ?? '')
      if ((p.caso === 'vuelo_cambiado' || p.caso === 'alojamiento_cambiado') && p.para_txt) return persona(`${nombreDe(p.quien) || 'Alguien'} ha puesto ${p.caso === 'vuelo_cambiado' ? 'el vuelo' : 'el alojamiento'} para ${p.para_txt}.`, [p.detalle, p.suyo_cambiado === true ? 'Se ha cambiado el tuyo.' : ''].filter(Boolean).join(' · '))
      if (p.caso === 'vuelo_cambiado' || p.caso === 'alojamiento_cambiado') return persona(`${nombreDe(p.quien) || 'El administrador'} ha puesto ${p.caso === 'vuelo_cambiado' ? 'el vuelo' : 'el alojamiento'} ${PARA_DE_LO_SUYO[p.para] ?? 'para todos'}.`, p.suyo_cambiado === true ? 'Se ha cambiado el tuyo.' : '')
      if (p.caso === 'no_cuadra') return { titulo: 'Tu entrada no cuadra con la ruta', detalle: `${mayuscula(sitioConArticulo(p.sitio))} · ${p.dia_reserva}`, icono: 'ticket' }
      const [h, m] = String(p.hora ?? '').split(':')
      const hora = m === undefined ? String(p.hora ?? '') : `${Number(h)}:${m}`
      {
        const { quien, verbo } = p.incluido ? { quien: nombreDe(p.quien) || 'El dueño', verbo: 'ha reservado' } : quienesReservan(p)
        return persona(`${quien} ${verbo} ${sitioConArticulo(p.sitio)}${p.incluido ? ' para ti' : ''}`, [mayuscula(p.dia), hora].filter(Boolean).join(' · '))
      }
    }
    case 'permiso':
      return p.permiso === 'editar'
        ? persona(con(p.admin, 'te ha dado permiso', 'Te han dado permiso'), `Para editar el viaje a ${p.destino}`)
        : persona(con(p.admin, 'ha cambiado tu permiso', 'Han cambiado tu permiso'), `Ahora puedes recomendar cambios en el viaje a ${p.destino}`)
    case 'quitado':
      return { titulo: 'Ya no formas parte del viaje', detalle: p.destino ? `Viaje a ${p.destino}` : '', icono: 'info' }
    case 'viaje_cambiado': {
      const { verbo, detalle } = franjaDeCambioDelViaje(p)
      return persona(nombreDe(p.quien) ? `${nombreDe(p.quien)} ${verbo}` : `Han ${verbo.replace(/^ha /, '')}`, detalle)
    }
    default:
      return { titulo: 'Tienes un aviso', detalle: '', icono: 'info' }
  }
}
