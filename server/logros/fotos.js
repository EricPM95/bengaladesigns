/**
 * QUÉ FOTO Y QUÉ VISTO VALEN (Tanda 8A). Funciones puras: las usa el servidor al recibir un hecho del móvil y la prueba.
 *
 * El móvil manda los HECHOS (la hora del Visto, la ubicación de ese momento, los datos de la foto leídos en el móvil); el servidor decide.
 * La ubicación solo se usa para decidir: aquí se convierte en `cerca` / `lejos` / `sin` y las coordenadas no se guardan.
 *
 * La foto válida:
 *   - de la cámara de la app; o de la galería si es de una cámara (no una captura ni una imagen de internet), su fecha cae en las fechas del viaje
 *     y, si trae ubicación, es en el sitio. Sin ubicación, vale. Vale también la foto de un amigo del grupo.
 *   - No se mira lo que sale en la foto.
 *   - Plazo: durante el viaje vale cualquiera; hasta 30 días después del último día, solo fotos de la galería de esas fechas; pasados los 30 días, nada
 *     (el día 30 vale, el 31 no).
 */

import { conArticulo } from './articulos.js'
import { diasEntre, parteLocal, sumarDias } from './motor.js'

/** Distancia en metros entre dos puntos. */
export function metros(a, b) {
  const R = 6371000
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/** `cerca` si la ubicación cae dentro del radio del sitio, `lejos` si no, `sin` si no hay ubicación. */
export function dondeEstoy(ubicacion, sitioCoords, radioM) {
  if (!ubicacion || !Number.isFinite(ubicacion.lat) || !Number.isFinite(ubicacion.lng) || !sitioCoords) return 'sin'
  return metros(ubicacion, sitioCoords) <= radioM ? 'cerca' : 'lejos'
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** «2 de septiembre». */
export function fechaLarga(fecha) {
  return `${Number(fecha.slice(8, 10))} de ${MESES[Number(fecha.slice(5, 7)) - 1]}`
}
/** «10 al 14 de octubre» / «30 de septiembre al 2 de octubre». */
export function rangoLargo(desde, hasta) {
  if (desde === hasta) return fechaLarga(desde)
  return desde.slice(0, 7) === hasta.slice(0, 7) ? `${Number(desde.slice(8, 10))} al ${fechaLarga(hasta)}` : `${fechaLarga(desde)} al ${fechaLarga(hasta)}`
}

const rellenar = (texto, valores) => texto.replace(/\{(\w+)\}/g, (_, k) => valores[k] ?? `{${k}}`)

/**
 * La hora de la toma como instante. `tomada_en` puede venir «AAAA-MM-DDTHH:MM:SS» sin zona (la hora de reloj de la cámara: se toma como hora del destino)
 * o con zona («+02:00» / «Z»).
 */
export function instanteDeToma(tomadaEn, tz) {
  if (!tomadaEn) return null
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(tomadaEn)) {
    const t = new Date(tomadaEn)
    return Number.isNaN(t.getTime()) ? null : t.toISOString()
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(tomadaEn)
  if (!m) return null
  // Buscar el instante UTC cuya hora local en `tz` sea esa (dos pasadas bastan, salvo en el cambio de hora).
  const querido = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0))
  let t = querido
  for (let i = 0; i < 3; i++) {
    const p = parteLocal(new Date(t), tz)
    const obtenido = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, 0)
    const dif = querido - (obtenido + (Number(m[6] ?? 0)) * 1000)
    if (Math.abs(dif) < 1000) break
    t += dif
  }
  return new Date(t).toISOString()
}

/**
 * Un Visto: ¿dónde estaba y cuenta para logros?
 * @returns {{ cuenta: boolean, ubic: 'cerca'|'lejos'|'sin', motivo: string|null, mensaje: string|null }}
 */
export function evaluarVisto({ instante, recibidoEn, ubicacion, sitio, viaje, destino, nombreSitio, ajustes }) {
  const tz = destino.timezone
  const loc = parteLocal(instante, tz)
  const ubic = dondeEstoy(ubicacion, sitio.coords, sitio.radio_m)
  if (!loc || loc.fecha < viaje.inicio || loc.fecha > viaje.fin) {
    return { cuenta: false, ubic, motivo: 'fuera_de_fechas', mensaje: ajustes.mensajes.fuera_de_fechas }
  }
  const recibido = parteLocal(recibidoEn ?? instante, tz)
  if (recibido && recibido.fecha > sumarDias(viaje.fin, ajustes.plazo_reclamar_dias)) {
    return { cuenta: false, ubic, motivo: 'fuera_de_plazo', mensaje: ajustes.mensajes.fuera_de_plazo }
  }
  if (ubic === 'lejos') return { cuenta: false, ubic, motivo: 'lejos', mensaje: rellenar(ajustes.mensajes.lejos, { sitio: nombreSitio, en_sitio: conArticulo(destino.clave ?? 'roma', nombreSitio, 'en') }) }
  // Sin ubicación se guarda el Visto igualmente: el pedazo espera una foto («Activa tu ubicación o haz una foto para ganar tu pedazo»).
  return { cuenta: true, ubic, motivo: ubic === 'sin' ? 'sin_ubicacion' : null, mensaje: ubic === 'sin' ? ajustes.mensajes.sin_ubicacion : null }
}

/**
 * Una foto: ¿vale?
 * @param {object} p
 * @param {'app'|'galeria'} p.origen
 * @param {string|null} p.tomadaEn      la hora de la toma (de la cámara de la app: la hora de ahora)
 * @param {boolean} p.conCamara         la foto trae marca o modelo de cámara (la foto de la cámara de la app siempre)
 * @param {{lat,lng}|null} p.ubicacion  la que traiga la foto (o, si es de la app, la del móvil en ese momento)
 * @returns {{ valida: boolean, ubic: 'cerca'|'lejos'|'sin', instante: string|null, motivo: string|null, mensaje: string|null }}
 */
export function evaluarFoto({ origen, tomadaEn, conCamara, ubicacion, sitio, viaje, destino, nombreSitio, recibidoEn, ajustes }) {
  const tz = destino.timezone
  const M = ajustes.mensajes
  const no = (motivo, mensaje, ubic = 'sin', instante = null) => ({ valida: false, ubic, instante, motivo, mensaje })
  const recibido = parteLocal(recibidoEn, tz)
  if (!recibido) return no('sin_datos', M.foto_sin_datos)
  const limite = sumarDias(viaje.fin, ajustes.plazo_reclamar_dias)
  if (recibido.fecha > limite) return no('fuera_de_plazo', M.fuera_de_plazo)
  const desdeCasa = recibido.fecha > viaje.fin
  if (origen === 'app' && desdeCasa) return no('desde_casa', M.desde_casa)
  if (origen !== 'app' && origen !== 'galeria') return no('origen_raro', M.foto_sin_datos)

  let instante
  if (origen === 'app') {
    // La foto de la cámara de la app se hace en ese momento: manda la hora del móvil si es sensata, y si no, la de la recepción.
    const t = tomadaEn ? instanteDeToma(tomadaEn, tz) : null
    instante = t && Math.abs(new Date(t) - new Date(recibidoEn)) < 36 * 3600 * 1000 ? t : new Date(recibidoEn).toISOString()
  } else {
    if (!conCamara) return no('no_camara', M.foto_no_camara)
    instante = instanteDeToma(tomadaEn, tz)
    if (!instante) return no('sin_fecha', M.foto_sin_fecha)
  }
  const loc = parteLocal(instante, tz)
  if (loc.fecha < viaje.inicio || loc.fecha > viaje.fin) {
    return no('otra_fecha', rellenar(M.foto_otra_fecha, { fecha: fechaLarga(loc.fecha), ...desdeHasta(viaje) }), 'sin', instante)
  }
  const ubic = dondeEstoy(ubicacion, sitio.coords, sitio.radio_m)
  if (ubic === 'lejos') return no('otro_sitio', rellenar(M.foto_otro_sitio, { sitio: nombreSitio, de_sitio: conArticulo(destino.clave ?? 'roma', nombreSitio, 'de') }), 'lejos', instante)
  return { valida: true, ubic, instante, motivo: null, mensaje: null }
}

/** «10» y «14 de octubre» para «Elige una del 10 al 14 de octubre.» */
function desdeHasta(viaje) {
  const r = rangoLargo(viaje.inicio, viaje.fin)
  const partes = r.split(' al ')
  return { desde: partes[0], hasta: partes[1] ?? partes[0] }
}

/** Días que quedan para reclamar fotos de un viaje (0 si es el último día del plazo; null si el viaje no ha acabado o ya pasó el plazo). */
export function diasParaReclamar(viaje, hoy) {
  if (hoy <= viaje.fin) return null
  const quedan = diasEntre(hoy, sumarDias(viaje.fin, 30))
  return quedan >= 0 ? quedan : null
}
