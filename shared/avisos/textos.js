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

/** El texto de un aviso de la campanita, tal como se lee en la lista. */
export function textoDelAviso(aviso) {
  const p = aviso.payload ?? {}
  switch (aviso.tipo) {
    case 'recomendacion':
      return titularDeRecomendacion(p.autor, p.tipo_rec, p.dia)
    case 'aceptada': {
      const que = p.tipo_rec === 'cambio' ? 'tu cambio' : p.tipo_rec === 'dia' ? 'tus cambios' : 'tu ruta'
      return `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha aceptado` : 'Han aceptado'} ${que}${p.tipo_rec === 'ruta' ? '' : enElDia(p.dia)}`
    }
    case 'rechazada':
      return `${nombreDe(p.admin) ? `${nombreDe(p.admin)} ha preferido` : 'Han preferido'} dejar ${Number.isInteger(p.dia) && p.dia > 0 ? `el día ${p.dia}` : 'tu ruta'} como estaba`
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
    default:
      return 'Tienes un aviso'
  }
}

/** El cuerpo del aviso en el móvil: el mismo texto y, en el de los 10 días, lo del pase («Tu Pase de Roma está activo para el viaje del 16 al 19 de octubre.»). */
export function textoDelPush(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo === 'd10' && p.con_pase && p.inicio && p.fin) return `${textoDelAviso(aviso)}. Tu Pase de ${p.destino} está activo para el viaje del ${rangoEnPalabras(p.inicio, p.fin)}.`
  return textoDelAviso(aviso)
}

/** Quién hace lo que cuenta el aviso (para la inicial del círculo): su nombre o, si no tiene, la inicial de su email; null si es un aviso de la app (o no hay ni una cosa ni otra: se pinta el icono). */
export function quienDelAviso(aviso) {
  const p = aviso.payload ?? {}
  const de = (nombre) => nombreDe(nombre) || String(p.inicial ?? '').trim().slice(0, 1).toUpperCase() || null
  if (aviso.tipo === 'recomendacion') return de(p.autor)
  if (aviso.tipo === 'aceptada' || aviso.tipo === 'rechazada') return de(p.admin)
  if (aviso.tipo === 'unido') return de(p.nombre)
  return null
}
