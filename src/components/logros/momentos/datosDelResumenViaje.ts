import type { EstadoLogros, LogrosViajero, ResumenLogros } from './api'
import { lineaDeSecretos } from './textosResumen'

/**
 * (V79, apartado 2; Design «La vuelta en HOY», VL7a y VL7b) LO QUE ENSEÑA «RESUMEN DE TU VIAJE A ROMA»: funciones PURAS (sin React, para poder probarlas). SOLO lo ganado EN ESTE VIAJE
 * (`resumen.ganado`: el servidor ya lo corta por las fechas del viaje) más lo que lleva cada cosa ahora (`estado`).
 *  · la medalla principal del destino, con su grado y su frase («Has conseguido el oro en este viaje.» / «Te quedan 2 para la plata.»);
 *  · «Más medallas»: SOLO en los destinos con más de una medalla (hoy Roma: Roma y el Vaticano) y SOLO la otra medalla si en este viaje se ganó. En un destino con una sola (Lanzarote), nunca;
 *  · «Colecciones que han avanzado»: las que sumaron algún pedazo en este viaje, con «4 de 8»;
 *  · «Emblemas ocultos descubiertos»: los encontrados en este viaje;
 *  · «Logros de viajero»: los de viajero y los que van contando (país, destino, maravilla, patrimonio) ganados en este viaje; cada uno con la medalla del nivel que le toca por su TOTAL (`n`, del servidor);
 *  · la línea de abajo, «Roma aún esconde 9 secretos: vuelve cuando quieras».
 * Con pocos logros no queda vacío: lo que no tiene nada, no sale (cada lista vuelve vacía).
 */
export const ORDEN_DE_GRADOS = ['bronce', 'plata', 'oro', 'diamante']
const CON_ARTICULO: Record<string, string> = { bronce: 'el bronce', plata: 'la plata', oro: 'el oro', diamante: 'el diamante' }
export const articuloDelGrado = (g: string): string => CON_ARTICULO[g] ?? g

export interface TarjetaDeLogroDelViaje {
  clave: string
  /** Quién es: un logro de viajero (`id` de viajero.json) o uno que cuenta (país, destino, maravilla, patrimonio). */
  tipo: 'viajero' | 'pais' | 'destino' | 'maravilla' | 'patrimonio'
  /** El id de la chapa que se dibuja (`Chapa logro=…`): 'paises', 'destinos', 'maravillas', 'patrimonios' o el del logro de viajero. */
  logro: string
  /** El escalón o el TOTAL con que se dibuja (`Chapa escalon=…`): de él sale la medalla «que toca». */
  escalon: number | string | null
  destino: string
  nombre: string
  /** Solo en un país nuevo: el nombre del país (para su bandera redonda). */
  pais?: string
}

export interface DatosDelResumenViaje {
  medalla: { id: string; grado: string | null; nombreGrado: string | null; ganadaEnElViaje: boolean; frase: string; frase2: string | null } | null
  masMedallas: { id: string; grado: string; nombre: string }[]
  colecciones: { id: string; nombre: string; n: number; total: number; completa: boolean; mas: number }[]
  emblemas: { id: string; nombre: string }[]
  logros: TarjetaDeLogroDelViaje[]
  secretos: string | null
}

/** «roma» → «Roma»; «el_vaticano» → «El vaticano»: el nombre de una clave que el servidor no traduce. */
const humanizar = (t: string): string => {
  const s = t.replace(/[_-]+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** «{ciudad} {anio}» → «Lanzarote 2026»: los nombres de los logros llevan huecos que se rellenan con el destino y el año del escalón. Nunca sale una llave suelta. */
function rellenar(nombre: string | null | undefined, ciudad: string, anio: string | number | null | undefined): string | null {
  if (!nombre) return null
  return nombre.replace(/\{ciudad\}/g, ciudad || 'tu destino').replace(/\{anio\}/g, anio != null && anio !== '' ? String(anio) : String(new Date().getFullYear())).replace(/\{[a-z_]+\}/gi, '').replace(/\s{2,}/g, ' ').trim()
}

/** «Roma aún esconde 9 secretos: vuelve cuando quieras» (con todos: «Has encontrado todos los secretos de Roma.»; sin secretos en el destino, nada). */
export function lineaFinalDelViaje(ciudad: string, total: number, encontrados: number): string | null {
  // La misma línea de secretos del resumen del día y de la página del destino; aquí, con su remate «: vuelve cuando quieras».
  const base = lineaDeSecretos(ciudad, total, encontrados)
  return base && encontrados < total ? base.replace(/\.$/, ': vuelve cuando quieras') : base
}

export function datosDelResumenViaje(estado: EstadoLogros, resumen: ResumenLogros | null, viajero: LogrosViajero | null): DatosDelResumenViaje {
  const ganado = resumen?.ganado ?? []
  const ciudad = estado.ciudad ?? ''

  // Las medallas de ciudad ganadas EN ESTE VIAJE (escalón «id:grado»): el grado más alto de cada una.
  const gradoGanado = new Map<string, string>()
  for (const g of ganado) {
    if (g.logro !== 'sello') continue
    const [id, grado] = g.escalon.split(':')
    if (!id || !grado) continue
    const antes = gradoGanado.get(id)
    if (!antes || ORDEN_DE_GRADOS.indexOf(grado) > ORDEN_DE_GRADOS.indexOf(antes)) gradoGanado.set(id, grado)
  }

  const principal = estado.sellos[0] ?? null
  let medalla: DatosDelResumenViaje['medalla'] = null
  if (principal) {
    const ganada = gradoGanado.get(principal.id)
    const grado = principal.grado ?? null
    const sig = principal.siguiente ?? null
    const frase2 = sig && sig.faltan > 0 ? `Te quedan ${sig.faltan} para ${articuloDelGrado(sig.grado)}.` : null
    const frase1 = ganada ? `Has conseguido ${articuloDelGrado(ganada)} en este viaje.` : null
    medalla = { id: principal.id, grado, nombreGrado: principal.nombre_grado ?? null, ganadaEnElViaje: Boolean(ganada), frase: frase1 ?? frase2 ?? '', frase2: frase1 && frase2 ? frase2 : null }
  }
  // «Más medallas»: solo si el destino tiene más de una y en este viaje se ganó la otra.
  const masMedallas = estado.sellos
    .slice(1)
    .filter((s) => s.grado && gradoGanado.has(s.id))
    .map((s) => ({ id: s.id, grado: s.grado as string, nombre: s.nombre }))

  // Colecciones que han sumado algún pedazo en este viaje.
  const por = new Set<string>()
  for (const g of ganado) if (g.logro === 'pedazo') por.add(g.escalon.split(':')[0]!)
  const sumas = new Map<string, number>()
  for (const g of ganado) if (g.logro === 'pedazo') sumas.set(g.escalon.split(':')[0]!, (sumas.get(g.escalon.split(':')[0]!) ?? 0) + 1)
  const colecciones = [...por]
    .map((id) => ({ id, c: estado.colecciones.find((c) => c.id === id) }))
    .filter((x) => x.c)
    .map(({ id, c }) => ({ id, nombre: c!.nombre, n: c!.n, total: c!.total, completa: c!.completa, mas: sumas.get(id) ?? 0 }))

  // Emblemas ocultos descubiertos en este viaje.
  const ids = new Set(ganado.filter((g) => g.logro === 'emblema').map((g) => g.escalon))
  const emblemas = (estado.secretos.encontrados_lista ?? []).filter((e) => ids.has(e.id)).map((e) => ({ id: e.id, nombre: e.nombre }))

  // Logros: los de viajero (el escalón más alto de cada uno) y los que van contando.
  const logros: TarjetaDeLogroDelViaje[] = []
  const viajeros = new Map<string, TarjetaDeLogroDelViaje>()
  for (const g of ganado) {
    if (g.logro.startsWith('viajero:')) {
      const id = g.logro.slice('viajero:'.length)
      const def = viajero?.logros?.find((l) => l.id === id)
      const esc = def?.escalones?.find((e) => String(e.n) === String(g.escalon))
      const nombre = rellenar(esc?.nombre ?? def?.nombre ?? null, ciudad, g.escalon)
      if (!nombre) continue
      const antes = viajeros.get(id)
      if (antes && Number(antes.escalon ?? 0) >= Number(g.escalon || 0)) continue
      viajeros.set(id, { clave: g.clave, tipo: 'viajero', logro: id, escalon: g.escalon || null, destino: g.destino, nombre })
    } else if (g.logro === 'pais') {
      logros.push({ clave: g.clave, tipo: 'pais', logro: 'paises', escalon: g.n ?? 1, destino: g.destino, nombre: `${g.escalon} · país nuevo`, pais: g.escalon })
    } else if (g.logro === 'destino_nuevo') {
      const nombre = g.escalon === estado.destino ? ciudad : humanizar(g.escalon)
      logros.push({ clave: g.clave, tipo: 'destino', logro: 'destinos', escalon: g.n ?? 1, destino: g.destino, nombre: `${nombre} · destino nuevo` })
    } else if (g.logro === 'maravilla') {
      logros.push({ clave: g.clave, tipo: 'maravilla', logro: 'maravillas', escalon: g.n ?? 1, destino: g.destino, nombre: g.nombre ?? humanizar(g.escalon) })
    } else if (g.logro === 'patrimonio') {
      logros.push({ clave: g.clave, tipo: 'patrimonio', logro: 'patrimonios', escalon: g.n ?? 1, destino: g.destino, nombre: g.nombre ?? humanizar(g.escalon) })
    }
  }

  return {
    medalla,
    masMedallas,
    colecciones,
    emblemas,
    logros: [...logros, ...viajeros.values()],
    secretos: lineaFinalDelViaje(ciudad, estado.secretos.total, estado.secretos.encontrados),
  }
}
