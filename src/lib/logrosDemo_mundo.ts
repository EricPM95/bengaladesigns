/**
 * DEMO DE «¿DÓNDE HAS ESTADO YA?» Y DEL PASAPORTE (Tanda 8C2). Solo en desarrollo. Contesta, con LA FORMA REAL del servidor (server/logros/pantallas/previos.js), a:
 *   GET /api/logros/previos      PUT /api/logros/previos      GET /api/logros/pasaporte2
 * Los datos son de prueba (los del diseño): un viaje a Roma acabado dos veces, Pisa, Venecia y Nápoles, París, el Vaticano, y México por conseguir. Lo que marques en el demo se
 * guarda mientras no recargues, y el pasaporte lo recoge como sellos «recuerdo» (los países que ya has visitado con la app no se repiten). Los números se calculan de aquí.
 */
import catalogo from '../../data/logros/paises_mundo.json'

interface PaisCat {
  i: string
  n: string
  c: string
  p: number
}
const CAT = catalogo as PaisCat[]
const porNombre = new Map(CAT.map((p) => [p.n, p]))

const estado = { paises: ['España', 'Portugal', 'Grecia', 'Países Bajos'] as string[], dias: 0 }

interface Sello {
  trip_id: string | null
  destino: string
  ciudad: string
  fecha: string | null
  vacio: boolean
  nuevo?: boolean
}
const real = (trip: string, destino: string, ciudad: string, fecha: string): Sello => ({ trip_id: trip, destino, ciudad, fecha, vacio: false })
const vacio = (destino: string, ciudad: string, nuevo = false): Sello => ({ trip_id: null, destino, ciudad, fecha: null, vacio: true, nuevo })

/** Los países que ya has visitado CON la app (en el demo). */
const VISITADOS = [
  { pais: 'Italia', entrada: '2025-03-14', sellos: [real('demo-roma-2025', 'roma', 'Roma', '2025-03-17'), real('demo-roma-2026', 'roma', 'Roma', '2026-10-13'), real('demo-pisa', 'pisa', 'Pisa', '2026-06-20'), real('demo-venecia', 'venecia', 'Venecia', '2026-04-05'), real('demo-napoles', 'napoles', 'Nápoles', '2026-08-24'), vacio('florencia', 'Florencia', true)] },
  { pais: 'Ciudad del Vaticano', entrada: '2025-03-15', sellos: [real('demo-roma-2026', 'roma', 'Ciudad del Vaticano', '2026-10-13')] },
  { pais: 'Francia', entrada: '2026-05-02', sellos: [real('demo-paris', 'paris', 'París', '2026-05-06')] },
]
const POR_CONSEGUIR = [{ pais: 'México', sellos: [vacio('cancun', 'Cancún')] }]

const visitadosConLaApp = () => new Set(VISITADOS.map((v) => v.pais))
const conocidos = () => estado.paises.map((n) => porNombre.get(n)).filter(Boolean) as PaisCat[]
const recuerdos = () => conocidos().filter((p) => !visitadosConLaApp().has(p.n)).map((p) => ({ pais: p.n, iso: p.i, continente: p.c }))

/** Los números del pasaporte del viajero de ejemplo: los usan el pasaporte y el Perfil (un solo viajero, una sola cuenta). */
export function numerosDelPasaporte(): { paises: number; ciudades: number; dias_viajando: number; sellos: number; previos: number } {
  const todos = new Set([...VISITADOS.map((v) => v.pais), ...estado.paises])
  const reales = VISITADOS.flatMap((v) => v.sellos.filter((s) => !s.vacio))
  return { paises: todos.size, ciudades: new Set(reales.map((s) => s.destino)).size, dias_viajando: estado.dias + 41, sellos: reales.length + recuerdos().length, previos: conocidos().length }
}

/** (10P) Lo visitado del viajero de ejemplo, para el mapa de la tarjeta «Mi pasaporte» (los códigos de los países) y los dos últimos sellos: lo mismo que el servidor manda en `perfil.pasaporte`. */
export function mapaDelPasaporte(): { paises_iso: string[]; sellos_recientes: { ciudad: string; fecha: string; destino: string }[] } {
  const iso = [...VISITADOS.map((v) => porNombre.get(v.pais)?.i), ...conocidos().map((p) => p.i)].filter((x): x is string => Boolean(x))
  const reales = VISITADOS.flatMap((v) => v.sellos.filter((s) => !s.vacio && s.fecha)).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  return { paises_iso: [...new Set(iso)], sellos_recientes: reales.slice(0, 2).map((s) => ({ ciudad: s.ciudad, fecha: s.fecha as string, destino: s.destino })) }
}

function paginas() {
  const ficha = (n: string) => ({ iso: porNombre.get(n)?.i ?? null, continente: porNombre.get(n)?.c ?? null })
  return [
    ...VISITADOS.map((v) => ({ pais: v.pais, ...ficha(v.pais), estado: 'visitado', entrada: v.entrada, sellos: v.sellos })),
    ...recuerdos().map((r) => ({ pais: r.pais, iso: r.iso, continente: r.continente, estado: 'recuerdo', entrada: null, sellos: [] as Sello[] })),
    ...POR_CONSEGUIR.map((v) => ({ pais: v.pais, ...ficha(v.pais), estado: 'por_conseguir', entrada: null, sellos: v.sellos })),
  ]
}

export function responder(ruta: string, _url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (ruta === '/api/logros/previos') {
    if ((opciones.metodo ?? '').toUpperCase() === 'PUT') {
      estado.paises = Array.isArray(c.paises) ? c.paises.map(String) : []
      estado.dias = Number(c.dias) || 0
      return { ok: true }
    }
    const k = conocidos()
    const micro = ['Ciudad del Vaticano', 'San Marino', 'Mónaco', 'Liechtenstein', 'Andorra', 'Malta']
    return {
      ok: true,
      paises: k.map((p) => p.n),
      dias: estado.dias,
      recuerdos: recuerdos(),
      numeros: { paises: k.length, continentes: new Set(k.map((p) => p.c)).size, sellos_recuerdo: recuerdos().length, microestados: k.filter((p) => micro.includes(p.n)).length },
    }
  }
  if (ruta === '/api/logros/pasaporte2') {
    const pgs = paginas()
    const { previos: _previos, ...numeros } = numerosDelPasaporte()
    return {
      ok: true,
      tus_paises: [],
      por_descubrir: [],
      numeros,
      paginas: pgs,
    }
  }
  return undefined
}
