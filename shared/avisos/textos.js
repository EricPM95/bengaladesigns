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

/** «el Coliseo» → «del Coliseo»; «Panteón» → «de Panteón». */
export const conDe = (sitio) => String(sitio ?? '').replace(/^el /i, 'del ').replace(/^(la|las|los) /i, (m) => `de ${m}`).replace(/^(?!del |de la |de las |de los )/i, 'de ')

/** El nombre de pila, o '' si la persona aún no ha puesto uno. */
const nombreDe = (n) => (n && String(n).trim() ? String(n).trim() : '')

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

export function queCambioEnElViaje(p, plural = false) {
  const v = (singular, pluralForma) => (plural ? pluralForma : singular)
  const partes = []
  const quitados = Number(p.dias_quitados) || 0
  const anadidos = Number(p.dias_anadidos) || 0
  if (quitados > 0) partes.push(`${v('ha quitado', 'han quitado')} ${quitados === 1 ? '1 día' : `${quitados} días`}`)
  if (anadidos > 0) partes.push(`${v('ha añadido', 'han añadido')} ${anadidos === 1 ? '1 día' : `${anadidos} días`}`)
  const anadidas = Array.isArray(p.anadidas) ? p.anadidas : []
  if (anadidas.length > 0) {
    const primera = anadidas[0]
    const cuando = diaEnPalabras(primera.fecha) ? ` al ${diaEnPalabras(primera.fecha)}` : Number.isInteger(primera.dia_n) ? ` al día ${primera.dia_n}` : ''
    partes.push(`${v('ha añadido', 'han añadido')} ${sitioConArticulo(primera.nombre)}${cuando}${anadidas.length > 1 ? ` y ${anadidas.length - 1 === 1 ? 'otro sitio' : `otros ${anadidas.length - 1} sitios`}` : ''}`)
  }
  const quitadas = Array.isArray(p.quitadas) ? p.quitadas : []
  if (quitadas.length > 0 && quitados === 0) partes.push(`${v('ha quitado', 'han quitado')} ${quitadas.length === 1 ? sitioConArticulo(quitadas[0].nombre) : `${quitadas.length} sitios`}`)
  if (p.fechas) partes.push(`${v('ha cambiado', 'han cambiado')} las fechas`)
  if (partes.length === 0 && ((Number(p.movidas) || 0) > 0 || p.reordenado)) partes.push(`${v('ha movido', 'han movido')} paradas`)
  if (partes.length === 0) return ''
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
}

/** El texto de un aviso de la campanita, tal como se lee en la lista. */
export function textoDelAviso(aviso) {
  const p = aviso.payload ?? {}
  switch (aviso.tipo) {
    case 'recomendacion':
      // Tanda 10N: una propuesta de cambios sueltos (migración 0039 pone `n_cambios`): «Ana te propone 5 cambios en tu viaje a Roma».
      if (Number.isInteger(p.n_cambios) && p.n_cambios > 0) return `${nombreDe(p.autor) ? `${nombreDe(p.autor)} te propone` : 'Te proponen'} ${p.n_cambios} ${p.n_cambios === 1 ? 'cambio' : 'cambios'} en tu viaje${p.destino ? ` a ${p.destino}` : ''}`
      return titularDeRecomendacion(p.autor, p.tipo_rec, p.dia)
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
      return `Tienes ${p.n} ${p.n === 1 ? 'cambio' : 'cambios'} sin enviar${nombreDe(p.admin) ? ` a ${nombreDe(p.admin)}` : ''}. Envíalos hoy, que mañana empieza el viaje.`
    case 'unido':
      return nombreDe(p.nombre) ? `${nombreDe(p.nombre)} se ha unido a tu viaje` : 'Alguien se ha unido a tu viaje'
    case 'd10':
      return p.dias === 1 ? `Mañana empieza tu viaje a ${p.destino}` : `En ${p.dias ?? 10} días empieza tu viaje a ${p.destino}`
    case 'resumen':
      return 'Tu resumen del viaje está listo'
    case 'sorpresas':
      return p.texto ?? `Te quedan ${p.dias ?? 3} días para reclamar tus sorpresas`
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
      if (p.caso === 'no_cuadra') return `Tu entrada ${conDe(p.sitio)} es el ${p.dia_reserva}, y en la ruta está el ${p.dia_ruta}.`
      const quien = nombreDe(p.quien) || 'El dueño'
      const [h, m] = String(p.hora ?? '').split(':')
      const hora = m === undefined ? String(p.hora ?? '') : `${Number(h)}:${m}`
      return p.incluido ? `${quien} ha reservado ${p.sitio} para ti: ${p.dia}, ${hora}.` : `${quien} ha reservado ${p.sitio} el ${p.dia} a las ${hora}.`
    }
    // Tanda 10N §4a: a quien le cambian el permiso, a quien quitan del viaje, y los cambios del viaje que hacen el dueño o quien puede editar (§10).
    case 'permiso': {
      const quien = nombreDe(p.admin)
      if (p.permiso === 'editar') return quien ? `${quien} te ha dado permiso para editar el viaje a ${p.destino}` : `Te han dado permiso para editar el viaje a ${p.destino}`
      return quien ? `${quien} ha cambiado tu permiso en el viaje a ${p.destino}: ahora puedes recomendar cambios` : `Ahora puedes recomendar cambios en el viaje a ${p.destino}`
    }
    case 'quitado':
      return `Ya no formas parte del viaje a ${p.destino}`
    case 'viaje_cambiado': {
      const quien = nombreDe(p.quien)
      const que = queCambioEnElViaje(p, !quien)
      return quien ? `${quien} ha cambiado el viaje${que ? `: ${que}` : ''}` : `Han cambiado el viaje${que ? `: ${que}` : ''}`
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

/** El cuerpo del aviso en el móvil: el mismo texto y, en el de los 10 días, lo del pase («Tu Pase de Roma está activo para el viaje del 16 al 19 de octubre.»). */
export function textoDelPush(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo === 'd10' && p.con_pase && p.inicio && p.fin) return `${textoDelAviso(aviso)}. Tu Pase de ${p.destino} está activo para el viaje del ${rangoEnPalabras(p.inicio, p.fin)}.`
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
