import type { Momento } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { datosDePrueba, datosDePruebaViajero, type EstadoLogros, type ResumenLogros } from './api'
import { useMomentosUI } from './useMomentosUI'

/**
 * PRUEBAS DE LOS MOMENTOS (Tanda 8B, SOLO en desarrollo: se carga con `import()` desde `MomentosHost` y no entra en la versión de producción).
 * En la consola del navegador (con `?logros=on&cuentas=on`):
 *
 *   window.__momentos.lanzar('sello')            un momento suelto: sello · sello_evo · suma · coleccion · coliseo · emblema · pais · destino · maravilla · patrimonio · viajero · ademas
 *   window.__momentos.lanzar('emblema:panteon')  el emblema que quieras (sus ids: foro_romano, museos_vaticanos, plaza_san_pedro, basilica_san_pedro, panteon,
 *                                                fontana_de_trevi, boca_de_la_verdad, ojo_cerradura, catacumbas, madrugador, nocturno)
 *   window.__momentos.repetir('panteon')         la escena de un emblema ya guardado (sin frase ni suspense)
 *   window.__momentos.serieCompleta()            un Visto que lo da todo: sello, colecciones, el Coliseo, y «Y además…»
 *   window.__momentos.resumenDia() · resumenViaje('wow'|'con_ganas') · compartirLogro() · compartirViaje() · hoja() · primerDia()
 *
 * Los datos del servidor (estado y resumen) se sustituyen por unos de ejemplo; todo lo que sale es de Roma y sale de la forma real de `server/logros/momentos.js`.
 */
const en = '2026-10-14T09:12:00.000Z'

/**
 * Los números de verdad de un viaje, desde cero (8B3). Un escenario dice qué había ya VISTO ANTES de la serie; la serie suma encima y el estado que se enseña (insignias, sello,
 * secretos) es el de DESPUÉS. Así el sello, las insignias, los textos de debajo y el resumen dicen lo mismo.
 *   'coliseo': el Coliseo es el primer sitio del viaje. Tras la serie: imprescindibles 1/8 (sello en bronce), joyas 1/4, antigua 1/6, 1 secreto (el Coliseo).
 *   's2':      antes ya estaban Coliseo, Foro, Trevi y Museos; el Panteón es el 4.º imprescindible (sello a plata) y cierra las 4 joyas. Sin emblema (se ve con ubicación, sin foto).
 *   'viaje':   un viaje ya acabado, con varias cosas ganadas (para el resumen del viaje y compartir).
 */
type Escenario = 'coliseo' | 's2' | 'viaje'
const IMPRESCINDIBLES = ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere']
const JOYAS = ['coliseo', 'fontana_de_trevi', 'panteon', 'museos_vaticanos']
const ANTIGUA = ['coliseo', 'foro_romano_y_palatino', 'largo_di_torre_argentina', 'castillo_de_santangelo', 'circo_maximo', 'termas_de_caracalla']
const col = (id: string, nombre: string, sitios: string[], vistos: string[], extra: { en_tu_ruta?: boolean } = {}) => ({ id, nombre, n: vistos.length, total: sitios.length, completa: vistos.length === sitios.length, en_tu_ruta: extra.en_tu_ruta ?? true, nuevo_hoy: true, sitios: sitios.map((x) => ({ sitio: x, visto: vistos.includes(x) })) })
const secretos = (ids: string[]) => ({ total: 12, encontrados: ids.length, texto: ids.length ? `${ids.length} de 12 secretos encontrados` : 'Roma esconde 12 secretos', encontrados_lista: ids.map((id) => ({ id, nombre: '', linea: '', en })) })
const GRADOS_SELLO = [[1, 'bronce', 'Primeros pasos en Roma'], [4, 'plata', 'Roma te atrapa'], [6, 'oro', 'Roma en el corazón'], [8, 'diamante', 'Roma es tuya']] as const

const estadoBase = (acabado: boolean, escenario: Escenario = 'viaje'): EstadoLogros => {
  const imp = escenario === 'coliseo' ? ['coliseo'] : escenario === 's2' ? ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon'] : IMPRESCINDIBLES.slice(0, 6)
  const joyas = escenario === 'coliseo' ? ['coliseo'] : escenario === 's2' ? JOYAS : ['coliseo', 'fontana_de_trevi', 'panteon']
  const antigua = escenario === 'coliseo' ? ['coliseo'] : ['coliseo', 'foro_romano_y_palatino']
  const g = [...GRADOS_SELLO].filter(([desde]) => imp.length >= desde).pop()
  const hoy = acabado ? '2026-10-25' : '2026-10-17'
  const lista = escenario === 'coliseo' ? ['coliseo'] : escenario === 's2' ? ['coliseo'] : ['coliseo', 'panteon', 'fontana_de_trevi']
  return {
    ok: true,
    destino: 'roma',
    ciudad: 'Roma',
    sellos: [
      { id: 'roma', nombre: 'Roma', grado: g ? g[1] : null, nombre_grado: g ? g[2] : null, linea: g ? `${imp.length === 1 ? 'Has visto tu primer imprescindible.' : `${imp.length} de 8 imprescindibles.`}` : null, n: imp.length, total: 8, siguiente: null, alcanzados: GRADOS_SELLO.filter(([d]) => imp.length >= d).map(([, x]) => x) },
      { id: 'vaticano', nombre: 'El Vaticano', grado: null, nombre_grado: null, linea: null, n: 0, total: 3, siguiente: null, alcanzados: [] },
    ],
    colecciones: [
      col('imprescindibles', 'Los imprescindibles de Roma', IMPRESCINDIBLES, imp),
      col('cuatro_joyas', 'Las 4 joyas de Roma', JOYAS, joyas),
      col('roma_antigua', 'La Roma antigua', ANTIGUA, antigua),
      col('miradores', 'Los miradores', ['janiculo', 'pincio', 'naranjos'], [], { en_tu_ruta: false }),
    ],
    secretos: secretos(lista),
    pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: acabado ? 27 : null, texto: acabado ? 'Te quedan 27 días para reclamar tus 2 sorpresas de Roma' : null },
    puntito: false,
    viaje: { id: 'demo', inicio: '2026-10-17', fin: '2026-10-20', hoy },
  }
}

const resumenBase = (tipo: 'wow' | 'con_ganas', acabado: boolean): ResumenLogros => ({
  ok: true,
  ganado: [
    { clave: 'roma|sello|roma:plata', logro: 'sello', escalon: 'roma:plata', destino: 'roma', en },
    { clave: '*|viajero:paises|1', logro: 'viajero:paises', escalon: '1', destino: '*', en },
    { clave: '*|viajero:patrimonios|1', logro: 'viajero:patrimonios', escalon: '1', destino: '*', en },
  ],
  por_categoria: { sello: 1, pedazo: 4, coleccion: 1, emblema: 3, viajero: 2, patrimonio: 1 },
  pendiente: estadoBase(acabado).pendiente,
  texto_viaje: tipo === 'wow' ? '¡Wow! Tu viaje a Roma fue increíble…' : 'Roma se ha quedado con ganas de verte otra vez: aún esconde 9 secretos…',
  texto_viaje_tipo: tipo,
})

const m = (o: Partial<Momento> & { tipo: Momento['tipo'] }): Momento => ({ nombre: '', primera_vez: true, ...o }) as Momento

const MOMENTOS: Record<string, () => Momento[]> = {
  sello: () => [m({ tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:bronce', sello: 'roma', destino: 'roma', grado: 'bronce', nombre: 'Primeros pasos en Roma', linea: 'Has visto tu primer imprescindible.', en })],
  sello_s2: () => [m({ tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:plata', sello: 'roma', destino: 'roma', grado: 'plata', nombre: 'Roma te atrapa', linea: '4 de 8 imprescindibles.', en })],
  sello_evo: () => [m({ tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:plata', sello: 'roma', destino: 'roma', grado: 'plata', nombre: 'Roma te atrapa', linea: '4 de 8 imprescindibles.', en })],
  sello_diamante: () => [m({ tipo: 'sello', cat: 'sello', clave: 'roma|sello|roma:diamante', sello: 'roma', destino: 'roma', grado: 'diamante', nombre: 'Roma es tuya', linea: 'Todos los imprescindibles de Roma.', en })],
  sello_vaticano: () => [m({ tipo: 'sello', cat: 'sello', clave: 'vaticano|sello|vaticano:plata', sello: 'vaticano', destino: 'vaticano', grado: 'plata', nombre: 'Has cruzado la frontera', linea: 'Has visto tu primer sitio del Vaticano.', en })],
  suma: () => [m({ tipo: 'suma', cat: 'pedazo', coleccion: 'miradores', destino: 'roma', nombre: 'Los miradores', n: 1, total: 3, sitios: ['janiculo'], linea: '1 de 3' })],
  suma_varias: () => [
    m({ tipo: 'suma', cat: 'pedazo', coleccion: 'imprescindibles', destino: 'roma', nombre: 'Los imprescindibles de Roma', n: 1, total: 8, sitios: ['coliseo'], linea: '1 de 8' }),
    m({ tipo: 'suma', cat: 'pedazo', coleccion: 'cuatro_joyas', destino: 'roma', nombre: 'Las 4 joyas de Roma', n: 1, total: 4, sitios: ['coliseo'], linea: '1 de 4' }),
    m({ tipo: 'suma', cat: 'pedazo', coleccion: 'roma_antigua', destino: 'roma', nombre: 'La Roma antigua', n: 1, total: 6, sitios: ['coliseo'], linea: '1 de 6' }),
  ],
  coleccion: () => [m({ tipo: 'coleccion', cat: 'coleccion', clave: 'roma|coleccion|cuatro_joyas', id: 'cuatro_joyas', destino: 'roma', nombre: 'Las 4 joyas de Roma', linea: 'Cuatro joyas, cuatro recuerdos para siempre.', en })],
  coliseo: () => [m({ tipo: 'emblema', cat: 'emblema', clave: 'roma|emblema|coliseo', id: 'coliseo', destino: 'roma', nombre: 'Una maravilla del mundo', linea: 'El mayor anfiteatro de la Antigüedad.', momento: false, maravilla: 'coliseo', frase: '¡Eh! Aquí hay algo…', en }), m({ tipo: 'maravilla', cat: 'maravilla', clave: '*|maravilla|coliseo', id: 'coliseo', n: 1, nombre: 'El Coliseo', linea: 'El mayor anfiteatro de la Antigüedad.', en })],
  emblema: () => MOMENTOS['emblema:panteon'](),
  pais: () => [m({ tipo: 'pais', cat: 'pais', clave: '*|pais|Italia', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia', en })],
  destino: () => [m({ tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: '*|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', en })],
  medalla: () => [m({ tipo: 'maravilla', cat: 'maravilla', clave: '*|maravilla|coliseo', id: 'coliseo', n: 1, nombre: 'El Coliseo', linea: 'El mayor anfiteatro de la Antigüedad.', en })],
  maravilla: () => [m({ tipo: 'maravilla', cat: 'maravilla', clave: '*|maravilla|gran_muralla', id: 'gran_muralla', n: 2, nombre: 'La Gran Muralla', linea: 'Más de 20.000 km de muralla, levantada durante siglos.', en })],
  patrimonio: () => [m({ tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|centro_historico_de_roma', id: 'centro_historico_de_roma', nombre: 'Centro histórico de Roma', en })],
  viajero: () => [m({ tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|3', logro: 'paises', escalon: '3', destino: '*', nombre: 'Trotamundos', linea: 'Países distintos que has visitado con la app.', en })],
  ademas: () => [
    m({ tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|centro_historico_de_roma', id: 'centro_historico_de_roma', nombre: 'Centro histórico de Roma', en }),
    m({ tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: '*|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', en }),
    m({ tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|1', logro: 'paises', escalon: '1', destino: '*', nombre: 'Primer sello', linea: 'Países distintos que has visitado con la app.', en }),
  ],
}
for (const id of ['foro_romano', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'panteon', 'fontana_de_trevi', 'boca_de_la_verdad', 'ojo_cerradura', 'catacumbas', 'madrugador', 'nocturno']) {
  MOMENTOS[`emblema:${id}`] = () => [m({ tipo: 'emblema', cat: 'emblema', clave: `roma|emblema|${id}`, id, destino: 'roma', nombre: '', linea: '', momento: id === 'madrugador' || id === 'nocturno', frase: 'Pero… ¿qué es esto?', en })]
}

function ponerDatos(acabado = false, tipo: 'wow' | 'con_ganas' = 'wow', escenario: Escenario = 'viaje') {
  datosDePrueba.estado = estadoBase(acabado, escenario)
  // El resumen del día sale de lo que se enseña en cada serie; solo el del viaje lleva el suyo hecho.
  datosDePrueba.resumen = escenario === 'viaje' ? resumenBase(tipo, acabado) : null
  datosDePruebaViajero.v = {
    ok: true,
    logros: [
      { id: 'paises', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Primer sello', ganado: true }, { n: 3, nombre: 'Trotamundos', ganado: false }] },
      { id: 'patrimonios', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Testigo de la historia', ganado: true }] },
    ],
  }
}

function lanzar(tipo: string, opciones: { primeraVez?: boolean } = {}) {
  ponerDatos()
  const lista = (MOMENTOS[tipo] ?? (() => []))()
  if (opciones.primeraVez === false) lista.forEach((x) => ((x as Momento).primera_vez = false, delete (x as Record<string, unknown>).frase))
  useLogrosStore.getState().recibir({ ok: true, nuevos: lista })
  return lista.length
}

const api = {
  lanzar,
  repetir: (id: string) => lanzar(`emblema:${id}`.replace('emblema:coliseo', 'coliseo'), { primeraVez: false }),
  /** Un Visto que lo da todo, en el orden del servidor y con los números de verdad: el Coliseo como PRIMER sitio del viaje. */
  serieCompleta: () => api.serieColiseo(),
  /** C0: el Coliseo como primer sitio de Roma, igual que el servidor: 1 pedazo en sus 3 colecciones, el emblema con su maravilla, el sello que nace en bronce («1 de 8»), país 1 Italia y destino 1 Roma. */
  serieColiseo: () => {
    ponerDatos(false, 'wow', 'coliseo')
    datosDePrueba.resumen = null // el resumen del día cuenta solo lo que sale en la serie
    const sumas = MOMENTOS.suma_varias()
    const todo = [...sumas, ...MOMENTOS.coliseo().slice(0, 2), ...MOMENTOS.sello(), ...MOMENTOS.pais(), ...MOMENTOS.destino()]
    useLogrosStore.getState().recibir({ ok: true, nuevos: todo })
    return todo.length
  },
  /** S2: el Panteón como 4.º imprescindible (sello de bronce a plata) y última joya (cierra «Las 4 joyas»). Sin emblema ni maravilla: se ve con ubicación, sin foto. */
  serieS2: () => {
    ponerDatos(false, 'wow', 's2')
    datosDePrueba.resumen = null
    const sumas = [
      m({ tipo: 'suma', cat: 'pedazo', coleccion: 'imprescindibles', destino: 'roma', nombre: 'Los imprescindibles de Roma', n: 4, total: 8, sitios: ['panteon'], linea: '4 de 8' }),
      m({ tipo: 'suma', cat: 'pedazo', coleccion: 'cuatro_joyas', destino: 'roma', nombre: 'Las 4 joyas de Roma', n: 4, total: 4, sitios: ['panteon'], linea: '4 de 4' }),
    ]
    const todo = [...sumas, ...MOMENTOS.coleccion(), ...MOMENTOS.sello_s2()]
    useLogrosStore.getState().recibir({ ok: true, nuevos: todo })
    return todo.length
  },
  resumenDia: () => {
    ponerDatos()
    useMomentosUI.getState().abrirResumenDia()
  },
  resumenViaje: (tipo: 'wow' | 'con_ganas' = 'wow') => {
    ponerDatos(true, tipo)
    useMomentosUI.getState().abrirResumenViaje()
  },
  compartirLogro: () => {
    ponerDatos()
    useMomentosUI.getState().abrirCompartir({ tipo: 'logro', momento: MOMENTOS['emblema:fontana_de_trevi']().map((x) => ({ ...x, nombre: 'Volverás a Roma', linea: 'Dice la leyenda que quien lanza una moneda de espaldas, vuelve.' }))[0] })
  },
  compartirViaje: () => {
    ponerDatos(true)
    useMomentosUI.getState().abrirCompartir({ tipo: 'viaje' })
  },
  hoja: () => {
    ponerDatos()
    useMomentosUI.getState().abrirHojaLogros()
  },
  cerrar: () => {
    const u = useMomentosUI.getState()
    u.terminarRonda()
    u.cerrarResumenDia()
    u.cerrarResumenViaje()
    u.cerrarCompartir()
    u.cerrarHojaLogros()
    u.ponerPrimerDia(false)
  },
  primerDia: () => useMomentosUI.getState().ponerPrimerDia(true),
  /** `datos(false, 'wow', 'coliseo' | 's2' | 'viaje')`: el estado de ejemplo de un escenario (ver arriba). */
  datos: ponerDatos,
  puntito: (v = true) => useLogrosStore.getState().ponerPuntito(v),
  tipos: Object.keys(MOMENTOS),
}
;(window as unknown as { __momentos: typeof api }).__momentos = api
export default api
