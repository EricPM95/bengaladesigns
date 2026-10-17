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

const estadoBase = (acabado: boolean): EstadoLogros => ({
  ok: true,
  destino: 'roma',
  ciudad: 'Roma',
  sellos: [
    { id: 'roma', nombre: 'Roma', grado: 'plata', nombre_grado: 'Roma te atrapa', linea: '4 de 8 imprescindibles.', n: 4, total: 8, siguiente: { grado: 'oro', faltan: 2, nombre: 'Roma en el corazón' }, alcanzados: ['bronce', 'plata'] },
    { id: 'vaticano', nombre: 'El Vaticano', grado: null, nombre_grado: null, linea: null, n: 0, total: 3, siguiente: { grado: 'plata', faltan: 1, nombre: 'Has cruzado la frontera' }, alcanzados: [] },
  ],
  colecciones: [
    { id: 'imprescindibles', nombre: 'Los imprescindibles de Roma', n: 4, total: 8, completa: false, en_tu_ruta: true, nuevo_hoy: true, sitios: ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere'].map((s, i) => ({ sitio: s, visto: i < 4 })) },
    { id: 'cuatro_joyas', nombre: 'Las 4 joyas de Roma', n: 4, total: 4, completa: true, en_tu_ruta: false, nuevo_hoy: false, sitios: ['coliseo', 'fontana_de_trevi', 'panteon', 'museos_vaticanos'].map((s) => ({ sitio: s, visto: true })) },
    { id: 'roma_antigua', nombre: 'La Roma antigua', n: 2, total: 6, completa: false, en_tu_ruta: true, nuevo_hoy: false, sitios: ['coliseo', 'foro_romano_y_palatino', 'largo_di_torre_argentina', 'castillo_de_santangelo', 'circo_maximo', 'termas_de_caracalla'].map((s, i) => ({ sitio: s, visto: i < 2 })) },
    { id: 'miradores', nombre: 'Los miradores', n: 0, total: 3, completa: false, en_tu_ruta: false, nuevo_hoy: false, sitios: ['janiculo', 'pincio', 'naranjos'].map((s) => ({ sitio: s, visto: false })) },
  ],
  secretos: { total: 12, encontrados: 3, texto: '3 de 12 secretos encontrados', encontrados_lista: [{ id: 'coliseo', nombre: 'Una maravilla del mundo', linea: '', en }, { id: 'panteon', nombre: 'Bajo una cúpula de casi 2.000 años', linea: '', en }, { id: 'fontana_de_trevi', nombre: 'Volverás a Roma', linea: '', en }] },
  pendiente: { sorpresas: 2, pedazos: 1, dias_para_reclamar: acabado ? 27 : null, texto: acabado ? 'Te quedan 27 días para reclamar tus 2 sorpresas de Roma' : 'Te espera una sorpresa: sube tu foto' },
  puntito: false,
  viaje: { id: 'demo', inicio: '2026-10-13', fin: '2026-10-17', hoy: acabado ? '2026-10-20' : '2026-10-15' },
})

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
  coliseo: () => [m({ tipo: 'emblema', cat: 'emblema', clave: 'roma|emblema|coliseo', id: 'coliseo', destino: 'roma', nombre: 'Una maravilla del mundo', linea: 'El mayor anfiteatro de la Antigüedad.', momento: false, frase: '¡Eh! Aquí hay algo…', en }), m({ tipo: 'maravilla', cat: 'maravilla', clave: '*|maravilla|coliseo', id: 'coliseo', n: 1, nombre: 'El Coliseo', linea: 'El mayor anfiteatro de la Antigüedad.', en })],
  emblema: () => MOMENTOS['emblema:panteon'](),
  pais: () => [m({ tipo: 'pais', cat: 'pais', clave: '*|pais|Vaticano', pais: 'Vaticano', n: 2, nombre: 'Tu país número 2: Vaticano', en })],
  destino: () => [m({ tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: '*|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', en })],
  maravilla: () => [m({ tipo: 'maravilla', cat: 'maravilla', clave: '*|maravilla|gran_muralla', id: 'gran_muralla', n: 2, nombre: 'La Gran Muralla', linea: 'Más de 20.000 km de muralla, levantada durante siglos.', en })],
  patrimonio: () => [m({ tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|centro_historico_de_roma', id: 'centro_historico_de_roma', nombre: 'Centro histórico de Roma', en })],
  viajero: () => [m({ tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|3', logro: 'paises', escalon: '3', destino: '*', nombre: 'Trotamundos', linea: 'Países distintos que has visitado con la app.', en })],
  ademas: () => [
    m({ tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|centro_historico_de_roma', id: 'centro_historico_de_roma', nombre: 'Centro histórico de Roma', en }),
    m({ tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: '*|destino_nuevo|roma', destino: 'roma', n: 1, nombre: 'Tu destino número 1: Roma', en }),
    m({ tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|3', logro: 'paises', escalon: '3', destino: '*', nombre: 'Trotamundos', linea: 'Países distintos que has visitado con la app.', en }),
  ],
}
for (const id of ['foro_romano', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'panteon', 'fontana_de_trevi', 'boca_de_la_verdad', 'ojo_cerradura', 'catacumbas', 'madrugador', 'nocturno']) {
  MOMENTOS[`emblema:${id}`] = () => [m({ tipo: 'emblema', cat: 'emblema', clave: `roma|emblema|${id}`, id, destino: 'roma', nombre: '', linea: '', momento: id === 'madrugador' || id === 'nocturno', frase: 'Pero… ¿qué es esto?', en })]
}

function ponerDatos(acabado = false, tipo: 'wow' | 'con_ganas' = 'wow') {
  datosDePrueba.estado = estadoBase(acabado)
  datosDePrueba.resumen = resumenBase(tipo, acabado)
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
  serieCompleta: () => {
    ponerDatos()
    const todo = [...MOMENTOS.suma_varias(), ...MOMENTOS.sello(), ...MOMENTOS.coleccion(), ...MOMENTOS.coliseo(), ...MOMENTOS.ademas(), ...MOMENTOS.pais()]
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
  datos: ponerDatos,
  puntito: (v = true) => useLogrosStore.getState().ponerPuntito(v),
  tipos: Object.keys(MOMENTOS),
}
;(window as unknown as { __momentos: typeof api }).__momentos = api
export default api
