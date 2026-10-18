/**
 * EL DEMO DE LAS PANTALLAS DE UN DESTINO (Tanda 8C2). SOLO EN DESARROLLO (lo carga `logrosDemo.ts`). Responde a
 *   GET /api/logros/destino · GET /api/logros/coleccion · GET /api/logros/mi-coleccion
 * con LA FORMA REAL del servidor: usa las MISMAS funciones (server/logros/pantallas/destino.js y vistas.js) y los mismos datos (data/logros/*.json), sobre un viajero de ejemplo
 * que ha hecho parte de Roma. Los datos de ejemplo son de prueba (qué sitios ha visto y cuándo); todos los números de las pantallas salen de ahí, calculados.
 *
 *   window.__demoDestino.modo('completo' | 'parcial' | 'vacio')
 *       completo (por defecto)  EL MISMO viajero de «Todos mis logros» (logrosDemo_ganados): el viaje a Roma acabado, sello de diamante y 11 de 11 colecciones
 *       parcial                 ese mismo viaje a mitad (el 12 de oct.): lo que se ve DURANTE el viaje, con sitios aún por ver
 *       vacio                   sin nada ganado
 *   window.__demoDestino.estado()                    lo que hay puesto
 */
import roma from '../../data/logros/roma.json' with { type: 'json' }
import viajeroJson from '../../data/logros/viajero.json' with { type: 'json' }
import ajustes from '../../data/logros/ajustes.json' with { type: 'json' }
import { soloActivos } from '../../server/logros/viajeroActivo.js'
import { logrosVisibles } from '../../server/logros/vistas.js'
import { coleccionPorDentro, miColeccion, paginaDeDestino } from '../../server/logros/pantallas/destino.js'

type Modo = 'completo' | 'parcial' | 'vacio'
const estado = { modo: 'completo' as Modo }

/** Los nombres de los sitios que salen en las colecciones (del catálogo de Roma; aquí copiados para no cargar el catálogo entero en el demo). */
const NOMBRES: Record<string, string> = {
  coliseo: 'Coliseo',
  foro_romano_y_palatino: 'Foro Romano y Palatino',
  fontana_de_trevi: 'Fontana de Trevi',
  panteon: 'Panteón',
  piazza_navona: 'Piazza Navona',
  plaza_de_espana: 'Plaza de España',
  castillo_de_santangelo: 'Castillo de Sant’Angelo',
  trastevere: 'Trastevere',
  museos_vaticanos_y_capilla_sixtina: 'Museos Vaticanos y Capilla Sixtina',
  basilica_de_san_pedro: 'Basílica de San Pedro',
  plaza_de_san_pedro: 'Plaza de San Pedro',
  isla_tiberina: 'Isla Tiberina',
  iglesia_de_santa_maria_in_trastevere: 'Iglesia de Santa Maria in Trastevere',
  san_pietro_in_montorio_y_tempietto_de_bramante: 'San Pietro in Montorio y Tempietto de Bramante',
  plaza_del_campidoglio: 'Plaza del Campidoglio',
  iglesia_de_santa_maria_sopra_minerva: 'Iglesia de Santa Maria sopra Minerva',
  elefantino_de_bernini: 'Elefantino de Bernini',
  puente_santangelo: 'Puente Sant’Angelo',
  iglesia_de_san_luigi_dei_francesi: 'Iglesia de San Luigi dei Francesi',
  santa_maria_del_popolo: 'Santa Maria del Popolo',
  galeria_borghese: 'Galería Borghese',
  largo_di_torre_argentina: 'Largo di Torre Argentina',
  circo_maximo: 'Circo Máximo',
  termas_de_caracalla: 'Termas de Caracalla',
  mirador_del_janiculo: 'Mirador del Janículo',
  terraza_del_pincio: 'Terraza del Pincio',
  jardin_de_los_naranjos: 'Jardín de los Naranjos',
  piazza_del_popolo: 'Piazza del Popolo',
  plaza_venecia: 'Plaza Venecia',
  fontana_dellacqua_paola: 'Fontana dell’Acqua Paola',
  fuente_del_triton: 'Fuente del Tritón',
  ojo_de_la_cerradura_del_aventino: 'Ojo de la Cerradura del Aventino',
  piramide_cestia: 'Pirámide Cestia',
  basilica_de_san_clemente: 'Basílica de San Clemente',
  fuente_de_las_tortugas: 'Fuente de las Tortugas',
}

/** Los sitios que el viajero de ejemplo ya ha visto, y el día. */
const VISTOS: [string, string][] = [
  ['coliseo', '2026-10-10'],
  ['foro_romano_y_palatino', '2026-10-10'],
  ['fontana_de_trevi', '2026-10-11'],
  ['panteon', '2026-10-11'],
  ['museos_vaticanos_y_capilla_sixtina', '2026-10-11'],
  ['basilica_de_san_pedro', '2026-10-11'],
  ['plaza_de_san_pedro', '2026-10-11'],
  ['plaza_de_espana', '2026-10-12'],
  ['plaza_del_campidoglio', '2026-10-12'],
  ['iglesia_de_santa_maria_sopra_minerva', '2026-10-12'],
  ['mirador_del_janiculo', '2026-10-12'],
  ['terraza_del_pincio', '2026-10-12'],
  ['jardin_de_los_naranjos', '2026-10-12'],
  ['largo_di_torre_argentina', '2026-10-12'],
  ['circo_maximo', '2026-10-12'],
]
const EMBLEMAS: [string, string][] = [
  ['coliseo', '2026-10-10'],
  ['foro_romano', '2026-10-10'],
  ['panteon', '2026-10-11'],
  ['fontana_de_trevi', '2026-10-11'],
  ['plaza_san_pedro', '2026-10-11'],
]
const GLOBALES: [string, string | number, string][] = [
  ['viajero:paises', 1, '2026-10-10'],
  ['viajero:destinos', 1, '2026-10-10'],
  ['viajero:viajes', 1, '2026-10-10'],
  ['viajero:con_quien_pareja', 1, '2026-10-10'],
  ['viajero:cazador_emblemas', 5, '2026-10-11'],
  ['viajero:patrimonios', 1, '2026-10-10'],
]

/** El viaje acabado (modo «completo»): todos los sitios de todas las colecciones, repartidos entre el 10 y el 14 de octubre, y lo mismo que gana el viajero de «Todos mis logros». */
const SITIOS_DEL_VIAJE: [string, string][] = [...new Set(roma.colecciones.flatMap((c) => c.sitios))].map((s, i) => [s, `2026-10-${String(10 + (i % 5))}`])
const EMBLEMAS_DEL_VIAJE: [string, string][] = [['coliseo', '2026-10-10'], ['foro_romano', '2026-10-11'], ['museos_vaticanos', '2026-10-12'], ['plaza_san_pedro', '2026-10-13'], ['basilica_san_pedro', '2026-10-14']]
const GLOBALES_DEL_VIAJE: [string, string, string | number, string][] = [
  ['*', 'viajero:paises', 1, '2026-10-10'],
  ['*', 'viajero:destinos', 1, '2026-10-10'],
  ['*', 'viajero:viajes', 1, '2026-10-10'],
  ['*', 'viajero:con_quien_pareja', 1, '2026-10-10'],
  ['*', 'viajero:patrimonios', 1, '2026-10-10'],
  ['*', 'viajero:dos_paises_en_un_dia', '', '2026-10-10'],
  ['*', 'viajero:cazador_emblemas', 5, '2026-10-14'],
  ['*', 'viajero:coleccionista', 5, '2026-10-14'],
  ['*', 'viajero:coleccionista', 10, '2026-10-14'],
  ['roma', 'viajero:conocedor', 25, '2026-10-13'],
  ['roma', 'viajero:ciudad_completa', '', '2026-10-14'],
  ['roma', 'viajero:diamante_primera', '', '2026-10-14'],
]

type Item = { clave: string; logro: string; escalon: string; destino: string; en: string }
const datos = { destinos: { roma }, viajero: soloActivos(viajeroJson), ajustes }

function itemsDeEjemplo(): Map<string, Item> {
  const m = new Map<string, Item>()
  const poner = (destino: string, logro: string, escalon: string | number, dia: string) => {
    const clave = `${destino}|${logro}|${escalon}`
    m.set(clave, { clave, logro, escalon: String(escalon), destino, en: `${dia}T10:00:00Z` })
  }
  if (estado.modo === 'vacio') return m
  const completo = estado.modo === 'completo'
  const dia = new Map(completo ? SITIOS_DEL_VIAJE : VISTOS)
  for (const c of roma.colecciones) {
    const hechos = c.sitios.filter((s) => dia.has(s))
    for (const s of hechos) poner('roma', 'pedazo', `${c.id}:${s}`, dia.get(s) as string)
    if (hechos.length === c.sitios.length) poner('roma', 'coleccion', c.id, hechos.map((s) => dia.get(s) as string).sort().pop() as string)
  }
  for (const s of roma.sellos) {
    const col = roma.colecciones.find((c) => c.id === s.coleccion)
    const n = (col?.sitios ?? []).filter((x) => dia.has(x)).length
    const fechas = (col?.sitios ?? []).filter((x) => dia.has(x)).map((x) => dia.get(x) as string).sort()
    for (const g of s.grados) if (g.desde <= n) poner('roma', 'sello', `${s.id}:${g.grado}`, fechas[Math.min(g.desde, fechas.length) - 1] ?? fechas[0])
  }
  for (const [e, d] of completo ? EMBLEMAS_DEL_VIAJE : EMBLEMAS) poner('roma', 'emblema', e, d)
  if (completo) for (const [dest, l, esc, d] of GLOBALES_DEL_VIAJE) poner(dest, l, esc, d)
  else for (const [l, esc, d] of GLOBALES) poner('*', l, esc, d)
  return m
}

/** El viaje de ejemplo (el que está abierto en la app): 5 días de Roma con algunos sitios aún por ver. */
const VIAJE = {
  id: 'demo-viaje',
  destino: 'roma',
  inicio: '2026-10-10',
  fin: '2026-10-14',
  dias: [
    { numero: 1, fecha: '2026-10-10', paradas: [{ sitio: 'coliseo' }, { sitio: 'foro_romano_y_palatino' }] },
    { numero: 2, fecha: '2026-10-11', paradas: [{ sitio: 'trastevere' }, { sitio: 'fontana_de_trevi' }, { sitio: 'panteon' }] },
    { numero: 3, fecha: '2026-10-12', paradas: [{ sitio: 'piazza_navona' }, { sitio: 'plaza_de_espana' }] },
    { numero: 4, fecha: '2026-10-13', paradas: [{ sitio: 'castillo_de_santangelo' }, { sitio: 'museos_vaticanos_y_capilla_sixtina' }] },
    { numero: 5, fecha: '2026-10-14', paradas: [] },
  ],
}

/** Lo mismo que `servicio.logrosDeViajero`, sobre los logros encendidos de la versión 1 y lo ganado del ejemplo. */
function viajeroDeEjemplo(items: Map<string, Item>) {
  const visibles = logrosVisibles(datos, new Date('2026-10-12T12:00:00Z'))
  const ganados = [...items.values()].filter((it) => it.logro.startsWith('viajero:'))
  const parcial = estado.modo === 'vacio' ? {} : { cuatro_estaciones: { n: 1, total: 4, hechas: ['otono'] }, doce_meses: { n: 1, total: 12, meses: [10] } }
  return {
    ok: true,
    logros: visibles.map((def: { id: string; grupo: string; nombre?: string; linea?: string; como?: string; nuevo?: boolean; escalones?: { n: number; nombre: string; nuevo?: boolean }[] }) => ({
      id: def.id,
      avance: (parcial as Record<string, unknown>)[def.id] ?? undefined,
      como: def.como ?? null,
      grupo: def.grupo,
      nombre: def.nombre ?? null,
      linea: def.linea ?? null,
      escalones: (def.escalones ?? []).map((e) => ({ n: e.n, nombre: e.nombre, nuevo: e.nuevo, ganado: ganados.some((g) => g.logro === `viajero:${def.id}` && g.escalon === String(e.n)) })),
      nuevo: def.nuevo ?? false,
      ganado: def.escalones ? undefined : ganados.some((g) => g.logro === `viajero:${def.id}`),
    })),
  }
}

export function responder(ruta: string, url: URL): unknown {
  const viaje = url.searchParams.get('trip_id') ? VIAJE : null
  if (ruta === '/api/logros/destino') {
    const destino = url.searchParams.get('destino') ?? ''
    return destino === 'roma' ? paginaDeDestino({ datos, destino, items: itemsDeEjemplo(), viaje, hoy: estado.modo === 'completo' ? '2026-10-14' : '2026-10-12' }) : { ok: false, motivo: 'destino_sin_logros' }
  }
  if (ruta === '/api/logros/coleccion') {
    const destino = url.searchParams.get('destino') ?? ''
    if (destino !== 'roma') return { ok: false, motivo: 'destino_sin_logros' }
    return coleccionPorDentro({ datos, destino, coleccion: url.searchParams.get('coleccion') ?? '', items: itemsDeEjemplo(), viaje, nombreDe: (s: string) => NOMBRES[s] ?? s }) ?? { ok: false, motivo: 'coleccion_sin_logros' }
  }
  if (ruta === '/api/logros/mi-coleccion') {
    const items = itemsDeEjemplo()
    return miColeccion({ datos, viajero: viajeroDeEjemplo(items), items })
  }
  return undefined
}

declare global {
  interface Window {
    __demoDestino?: { modo: (m: Modo) => void; estado: () => { modo: Modo } }
  }
}
if (typeof window !== 'undefined') window.__demoDestino = { modo: (m) => void (estado.modo = m), estado: () => ({ ...estado }) }
