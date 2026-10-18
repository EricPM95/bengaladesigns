/**
 * LOS TEXTOS DE LA HOJA DE LOGROS (Tanda 8C2, «Logros · el botón del destino»). Funciones puras (sin React) para poder probarlas: de qué momento del viaje es la hoja y qué dice cada sello, cada
 * fila y la franja de arriba. Ningún número está escrito aquí: todo sale de lo que manda el servidor (`GET /api/logros/estado`).
 */
export type FaseDelViaje = 'antes' | 'durante' | 'despues'
export type GradoDeSelloNombre = 'bronce' | 'plata' | 'oro' | 'diamante'

/** Antes del viaje, durante o después: según el día de hoy en el destino (`viaje.hoy`, que manda el servidor) y las fechas del viaje. Sin viaje, «antes». */
export function faseDelViaje(viaje: { inicio?: string; fin?: string; hoy?: string } | null | undefined): FaseDelViaje {
  if (!viaje?.inicio || !viaje.fin || !viaje.hoy) return 'antes'
  if (viaje.hoy < viaje.inicio) return 'antes'
  if (viaje.hoy > viaje.fin) return 'despues'
  return 'durante'
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const partes = (f: string) => ({ a: Number(f.slice(0, 4)), m: Number(f.slice(5, 7)), d: Number(f.slice(8, 10)) })
const diaDeLaSemana = (f: string) => {
  const p = partes(f)
  return new Date(Date.UTC(p.a, p.m - 1, p.d)).getUTCDay()
}
const diasEntre = (a: string, b: string) => {
  const p = partes(a)
  const q = partes(b)
  return Math.round((Date.UTC(q.a, q.m - 1, q.d) - Date.UTC(p.a, p.m - 1, p.d)) / 86400000)
}

/** «29 oct – 1 nov» (o «13 – 16 oct» si es el mismo mes). */
export function rangoCorto(inicio: string, fin: string): string {
  const a = partes(inicio)
  const b = partes(fin)
  if (inicio === fin) return `${a.d} ${MESES[a.m - 1]}`
  return a.m === b.m ? `${a.d} – ${b.d} ${MESES[b.m - 1]}` : `${a.d} ${MESES[a.m - 1]} – ${b.d} ${MESES[b.m - 1]}`
}

/** La franja pequeña de arriba de la hoja: «Antes del viaje · 29 oct – 1 nov», «Jue 29 · día 1» («Sáb 31 · último día en Roma»), «Viaje terminado · 29 oct – 1 nov». */
export function etiquetaDeFase(fase: FaseDelViaje, viaje: { inicio?: string; fin?: string; hoy?: string } | null | undefined, ciudad: string): string | null {
  if (!viaje?.inicio || !viaje.fin) return null
  if (fase === 'antes') return `Antes del viaje · ${rangoCorto(viaje.inicio, viaje.fin)}`
  if (fase === 'despues') return `Viaje terminado · ${rangoCorto(viaje.inicio, viaje.fin)}`
  const hoy = viaje.hoy ?? viaje.inicio
  const dia = `${DIAS[diaDeLaSemana(hoy)]} ${partes(hoy).d}`
  if (hoy === viaje.fin && viaje.fin !== viaje.inicio) return `${dia} · último día${ciudad ? ` en ${ciudad}` : ''}`
  return `${dia} · día ${diasEntre(viaje.inicio, hoy) + 1}`
}

const NOMBRE_GRADO: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', diamante: 'Diamante' }
export const nombreDeGrado = (g: string | null | undefined): string => (g ? (NOMBRE_GRADO[g] ?? g) : 'Por conseguir')

const ARTICULO: Record<string, string> = { bronce: 'el bronce', plata: 'la plata', oro: 'el oro', diamante: 'el diamante' }

/** Lo que el sello grande dice debajo de su barra: «Empieza en bronce», «Te faltan 2 para la plata» / «Te falta 1 para el oro», después del viaje «Te quedan 2 para el diamante», y al llegar al diamante, lo que dice el destino (`alCompletar`). */
export function textoDelSiguiente(p: { fase: FaseDelViaje; grado: string | null; siguiente: { grado: string; faltan: number } | null; alCompletar?: string | null }): string {
  if (!p.grado) return p.siguiente ? `Empieza en ${p.siguiente.grado}` : ''
  if (!p.siguiente) return p.grado === 'diamante' ? (p.alCompletar ?? '') : ''
  const hasta = ARTICULO[p.siguiente.grado] ?? p.siguiente.grado
  if (p.fase === 'despues') return `Te quedan ${p.siguiente.faltan} para ${hasta}`
  return `${p.siguiente.faltan === 1 ? 'Te falta 1' : `Te faltan ${p.siguiente.faltan}`} para ${hasta}`
}

/** El texto de lo que dice el sello cuando ya está en diamante (es del sello, no del número). Solo Roma y el Vaticano tienen hoy; otro destino no dice nada. */
export const TEXTO_AL_COMPLETAR: Record<string, string> = { roma: 'Lo esencial, visto', vaticano: 'El país entero, visto' }

/** Debajo del nombre del grado: «Bronce · 3 de 8 imprescindibles» («… de 3 sitios»). `unidad` es lo que cuenta el sello. */
export function lineaDeGrado(grado: string | null, n: number, total: number, unidad: string): string {
  return grado ? `${nombreDeGrado(grado)} · ${n} de ${total} ${unidad}` : `${n} de ${total} ${unidad}`
}

/** El banner de antes del viaje: «Con tu ruta puedes completar 7 de las 11 colecciones». */
export function bannerAntes(puedes: number | null | undefined, total: number): string | null {
  return typeof puedes === 'number' && total > 0 ? `Con tu ruta puedes completar ${puedes} de las ${total} colecciones` : null
}

/** El banner de después del viaje: lo que le queda a Roma para el diamante y a dónde va lo que no vio. Sin nada que decir (ya tiene el diamante), nada. */
export function bannerDespues(ciudad: string, selloPrincipal: { grado: string | null; n: number; total: number } | undefined): string | null {
  if (!selloPrincipal || selloPrincipal.grado === 'diamante' || selloPrincipal.total <= selloPrincipal.n) return null
  const faltan = selloPrincipal.total - selloPrincipal.n
  return `Te ${faltan === 1 ? 'queda 1' : `quedan ${faltan}`} para el diamante de ${ciudad}. Lo que no viste te espera en tu próximo viaje.`
}

/** La marca de una fila de colección (la etiqueta pequeña y, si procede, el «para tu próximo viaje»). */
export function marcaDeColeccion(p: { fase: FaseDelViaje; completa: boolean; nuevo: boolean; enTuRuta: boolean; ciudad: string }): { etiqueta: 'completa' | 'nuevo' | 'en_ruta' | null; texto: string | null; faltaParaOtroViaje: string | null } {
  if (p.fase === 'antes') return p.enTuRuta ? { etiqueta: 'en_ruta', texto: 'En tu ruta', faltaParaOtroViaje: null } : { etiqueta: null, texto: null, faltaParaOtroViaje: null }
  if (p.completa) return { etiqueta: 'completa', texto: '✓ Completa', faltaParaOtroViaje: null }
  const aparte = p.fase === 'despues' ? `Para tu próximo viaje a ${p.ciudad}` : null
  if (p.nuevo) return { etiqueta: 'nuevo', texto: 'Nuevo', faltaParaOtroViaje: aparte }
  if (p.fase === 'durante' && p.enTuRuta) return { etiqueta: 'en_ruta', texto: 'En tu ruta', faltaParaOtroViaje: null }
  return { etiqueta: null, texto: null, faltaParaOtroViaje: aparte }
}

/** El título del bloque oscuro de los secretos: antes del viaje «Roma esconde 12 secretos»; durante y después «Roma aún esconde 9 secretos.» (lo que decidió Eric: nunca «N de 12 encontrados»). */
export function tituloDeSecretos(fase: FaseDelViaje, ciudad: string, total: number, encontrados: number): string | null {
  if (!(total > 0)) return null
  const lugar = ciudad || 'este destino'
  if (fase === 'antes') return `${lugar} esconde ${total} ${total === 1 ? 'secreto' : 'secretos'}`
  const quedan = total - encontrados
  if (quedan <= 0) return `Has encontrado todos los secretos de ${lugar}.`
  return `${lugar} aún esconde ${quedan} ${quedan === 1 ? 'secreto' : 'secretos'}.`
}

/** La nota de abajo del bloque de secretos. Con todos encontrados, ninguna. */
export function notaDeSecretos(fase: FaseDelViaje, total: number, encontrados: number): string | null {
  if (total - encontrados <= 0) return null
  return fase === 'despues' ? 'Los que faltan te esperan en tu próximo viaje.' : 'Nunca sabrás cuáles son ni dónde están: se descubren en el sitio.'
}
