/**
 * LOS TEXTOS DE LOS AVISOS (cuentas parte 3, punto 4: la campanita). UN solo sitio, para el servidor (el aviso en el móvil) y para la app (la lista de la campanita). Sin React ni red.
 * El nombre de quien lo hace es su nombre de pila; si no tiene uno puesto, «Viajero». Ningún nombre de app escrito aquí: el título del aviso del móvil sale de data/marca.json.
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** «16 al 19 de octubre» (mismo mes) o «28 de octubre al 2 de noviembre». */
export function rangoEnPalabras(inicio, fin) {
  const [, mi, di] = String(inicio).split('-').map(Number)
  const [, mf, df] = String(fin).split('-').map(Number)
  if (mi === mf) return di === df ? `${di} de ${MESES[mi - 1]}` : `${di} al ${df} de ${MESES[mi - 1]}`
  return `${di} de ${MESES[mi - 1]} al ${df} de ${MESES[mf - 1]}`
}

const nombreDe = (n) => (n && String(n).trim() ? String(n).trim() : 'Viajero')

/** El lugar de la recomendación: «en el día 2» (con el número del día) o nada. */
const enElDia = (dia) => (Number.isInteger(dia) && dia > 0 ? ` en el día ${dia}` : '')

/** «Laura te recomienda un cambio en el día 2» · «cambios en el día 3» · «otra ruta». */
export function titularDeRecomendacion(nombre, tipoRec, dia = null) {
  if (tipoRec === 'cambio') return `${nombreDe(nombre)} te recomienda un cambio${enElDia(dia)}`
  if (tipoRec === 'dia') return `${nombreDe(nombre)} te recomienda cambios${dia ? enElDia(dia) : ' en un día'}`
  return `${nombreDe(nombre)} te recomienda otra ruta`
}

/** El texto de un aviso de la campanita, tal como se lee en la lista. */
export function textoDelAviso(aviso) {
  const p = aviso.payload ?? {}
  switch (aviso.tipo) {
    case 'recomendacion':
      return titularDeRecomendacion(p.autor, p.tipo_rec, p.dia)
    case 'aceptada': {
      const que = p.tipo_rec === 'cambio' ? 'tu cambio' : p.tipo_rec === 'dia' ? 'tus cambios' : 'tu ruta'
      return `${nombreDe(p.admin)} ha aceptado ${que}${p.tipo_rec === 'ruta' ? '' : enElDia(p.dia)}`
    }
    case 'rechazada':
      return `${nombreDe(p.admin)} ha preferido dejar ${Number.isInteger(p.dia) && p.dia > 0 ? `el día ${p.dia}` : 'tu ruta'} como estaba`
    case 'unido':
      return `${nombreDe(p.nombre)} se ha unido a tu viaje`
    case 'd10':
      return p.dias === 1 ? `Mañana empieza tu viaje a ${p.destino}` : `En ${p.dias ?? 10} días empieza tu viaje a ${p.destino}`
    case 'resumen':
      return 'Tu resumen del viaje está listo'
    case 'sorpresas':
      return p.texto ?? `Te quedan ${p.dias ?? 3} días para reclamar tus sorpresas`
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

/** Quién hace lo que cuenta el aviso (para la inicial del círculo): la persona, o null si es un aviso de la app. */
export function quienDelAviso(aviso) {
  const p = aviso.payload ?? {}
  if (aviso.tipo === 'recomendacion') return nombreDe(p.autor)
  if (aviso.tipo === 'aceptada' || aviso.tipo === 'rechazada') return nombreDe(p.admin)
  if (aviso.tipo === 'unido') return nombreDe(p.nombre)
  return null
}
