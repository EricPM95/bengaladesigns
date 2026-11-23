import type { Momento } from '../logros'
import { partituraDe, type OpcionesDePartitura } from './partituras'
import { ctaDeLosPedazos, FRACCIONES_APERTURA, paraFinalSiete, TIEMPOS_DE_EMBLEMA, TIEMPOS_DE_MARAVILLA_NUEVA, TIEMPOS_ESTAMPADO, TIEMPOS_FINAL_SIETE, tiemposDeEscena } from './tiempos'
import { finSonoroDe } from './motor'
import { MOMENTOS_DE_COLECCIONES } from './ejemploEstado'
import viajeroLogros from '../../../data/logros/viajero.json'

/**
 * (V34C) EL ESTUDIO DE SONIDOS (/admin/sonidos): la lista de TODAS las animaciones que llevan sonido, con lo que hace falta para verlas igual que en la app dentro de un marco de iPhone (el visor: un marco con la propia app, que
 * monta las MISMAS piezas: `Reproductor`, las escenas, `ResumenDia`, la apertura…) y para elegir su sonido. Datos puros: sin pantalla.
 *   · `visor`: qué se monta en el marco (`momentos` = la pantalla de logros con esos momentos, `fuegos`, `resumen_dia`, `resumen_viaje`, `apertura`, `boton` = el gesto donde suena, `solo` = solo el sonido).
 *   · `suena`: las partituras que arrancan al empezar (lo que hace la app al ganarlo); las escenas arrancan la suya por dentro.
 *   · `partituras`: de dónde salen los sonidos que se pueden elegir (cada archivo, con sus candidatos A a E).
 *   · `principal`: el sonido que «Probar con mi sonido» sustituye por defecto (el golpe de la animación).
 */
export type TipoDeVisor = 'momentos' | 'pasaporte' | 'fuegos' | 'resumen_dia' | 'resumen_viaje' | 'apertura' | 'primer_dia' | 'boton' | 'solo'
export interface Animacion {
  id: string
  nombre: string
  grupo: 'Medallas' | 'Logros' | 'Escenas' | 'Resúmenes' | 'Apertura' | 'Sonidos cortos'
  visor: TipoDeVisor
  suena: string[]
  partituras: string[]
  principal: { tipo: 'archivo' | 'sint'; id: string }
  momentos?: string
  /** Para `boton`: lo que dice el botón o el gesto donde suena. */
  gesto?: string
  /** Lo que hay que saber de esta animación (se enseña en la tarjeta y sale en el repaso). */
  nota?: string
  /** (V38B) Las tarjetas de emblema son una por DESTINO: lo que se guarda vale para todos sus emblemas (mismos momentos clave). Estas son las otras escenas del destino que se pueden ver dentro de la tarjeta, sin guardar aparte. */
  otrasEscenas?: { id: string; nombre: string }[]
  /** El destino de esas escenas (`roma` o `lanzarote`). */
  destinoDeEscenas?: string
}

/** (V38B) Los emblemas de cada destino con escena propia: los de Roma comparten momentos clave entre sí, los de Lanzarote también; el Coliseo tiene los suyos. */
export const ESCENAS_DE_ROMA = [
  { id: 'panteon', nombre: 'El Panteón' },
  { id: 'fontana_de_trevi', nombre: 'La Fontana de Trevi' },
  { id: 'foro_romano', nombre: 'El Foro Romano' },
  { id: 'museos_vaticanos', nombre: 'Los Museos Vaticanos' },
  { id: 'plaza_san_pedro', nombre: 'La Plaza de San Pedro' },
  { id: 'basilica_san_pedro', nombre: 'La Basílica de San Pedro' },
  { id: 'boca_de_la_verdad', nombre: 'La Boca de la Verdad' },
  { id: 'ojo_cerradura', nombre: 'El ojo de la cerradura' },
  { id: 'catacumbas', nombre: 'Las Catacumbas' },
  { id: 'plaza_de_espana', nombre: 'La Plaza de España' },
  { id: 'castillo_de_santangelo', nombre: 'El Castillo de Sant Angelo' },
  { id: 'madrugador', nombre: 'El madrugador' },
  { id: 'nocturno', nombre: 'El nocturno' },
]
export const ESCENAS_DE_LANZAROTE = [
  { id: 'timanfaya', nombre: 'Timanfaya' },
  { id: 'jameos', nombre: 'Los Jameos del Agua' },
  { id: 'cueva_de_los_verdes', nombre: 'La Cueva de los Verdes' },
  { id: 'mirador_del_rio', nombre: 'El Mirador del Río' },
  { id: 'fundacion_manrique', nombre: 'La Fundación Manrique' },
  { id: 'el_golfo', nombre: 'El Golfo' },
  { id: 'la_geria', nombre: 'La Geria' },
  { id: 'la_graciosa', nombre: 'La Graciosa' },
  { id: 'papagayo', nombre: 'Papagayo' },
  { id: 'lz_madrugador', nombre: 'El madrugador' },
  { id: 'atardecer_atlantico', nombre: 'El atardecer atlántico' },
]

const EN = '2026-11-20T10:00:00.000Z'
const m = (o: Record<string, unknown>): Momento => ({ nombre: '', primera_vez: true, en: EN, ...o }) as unknown as Momento
const sello = (grado: string, nombre: string, linea: string): Momento =>
  m({ tipo: 'sello', cat: 'sello', clave: `demo|sello|${grado}`, sello: 'roma', destino: 'roma', grado, nombre, linea })
const emblema = (id: string, destino: string, extra: Record<string, unknown> = {}): Momento =>
  m({ tipo: 'emblema', cat: 'emblema', clave: `demo|emblema|${id}`, id, destino, nombre: '', linea: '', momento: false, frase: 'Pero… ¿qué es esto?', ...extra })

/** (V39B) La maravilla nueva de ejemplo: `tiene` son las que lleva el viajero y la última es la recién ganada (como los momentos del servidor: `id`, `n`, `maravillas`, `nombre` y `linea` de los datos). */
const maravillaNueva = (tiene: string[]): Momento => {
  const id = tiene[tiene.length - 1]!
  const d = (viajeroLogros.maravillas as Record<string, { nombre: string; linea: string }>)[id]!
  return m({ tipo: 'maravilla', cat: 'maravilla', clave: `*|maravilla|${id}`, id, n: tiene.length, maravillas: tiene, nombre: d.nombre, linea: d.linea })
}

/** (V38B) El emblema de ejemplo de OTRA escena del destino (para «Ver otra escena» dentro de la tarjeta del destino). */
export const momentoDeEscena = (destino: string, id: string): Momento[] => [emblema(id, destino, destino === 'lanzarote' ? { frase: '¡Eh! Aquí hay algo…' } : {})]

/** Los momentos de ejemplo de cada animación (los mismos datos que usa la demo de logros). */
export const MOMENTOS_DEL_ESTUDIO: Record<string, () => Momento[]> = {
  medalla_bronce: () => [sello('bronce', 'Primeros pasos en Roma', 'Has visto tu primer imprescindible.')],
  medalla_plata: () => [sello('plata', 'Roma te atrapa', 'Cuatro imprescindibles vistos: ya eres de aquí.')],
  medalla_oro: () => [sello('oro', 'Roma es casi tuya', 'Seis imprescindibles de ocho.')],
  medalla_diamante: () => [sello('diamante', 'Todos los caminos', 'Todos los imprescindibles de Roma.')],
  sello: () => [sello('bronce', 'Primeros pasos en Roma', 'Has visto tu primer imprescindible.')],
  // (V37C) Colección completa y pedazo, con el estado de ejemplo de `ejemploEstado.ts` (sin él la insignia salía vacía).
  ...MOMENTOS_DE_COLECCIONES,
  emblema: () => [emblema('panteon', 'roma', { nombre: 'El Panteón', linea: 'Casi dos mil años con la puerta abierta.', frase: '¡Eh! Aquí hay algo…' })],
  emblema_maravilla: () => [emblema('coliseo', 'roma', { nombre: 'Una maravilla del mundo', linea: 'El mayor anfiteatro de la Antigüedad.', maravilla: 'coliseo', frase: '¡Eh! Aquí hay algo…' })],
  emblema_lanzarote: () => [emblema('timanfaya', 'lanzarote', { frase: '¡Eh! Aquí hay algo…' })],
  maravilla: () => [m({ tipo: 'maravilla', cat: 'maravilla', clave: 'demo|maravilla|taj_mahal', id: 'taj_mahal', n: 7, nombre: 'El Taj Mahal', linea: 'La séptima maravilla del mundo.' })],
  // (V39B) «Una maravilla nueva»: la 1.ª (el Coliseo, 1 de 7) y la 4.ª (el Cristo Redentor, 4 de 7), con el nombre y la línea de los datos de la app (`data/logros/viajero.json › maravillas`), no escritos aparte.
  maravilla_nueva: () => [maravillaNueva(['coliseo'])],
  maravilla_nueva_cuatro: () => [maravillaNueva(['coliseo', 'gran_muralla', 'petra', 'cristo_redentor'])],
  pais: () => [m({ tipo: 'pais', cat: 'pais', clave: 'demo|pais', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia' })],
  patrimonio: () => [m({ tipo: 'patrimonio', cat: 'patrimonio', clave: 'roma|patrimonio|centro_historico_de_roma', id: 'centro_historico_de_roma', n: 1, nombre: 'Centro histórico de Roma' })],
  viajero: () => [m({ tipo: 'viajero', cat: 'viajero', clave: '*|viajero:paises|3', logro: 'paises', escalon: '3', destino: '*', nombre: 'Trotamundos', linea: 'Países distintos que has visitado con la app.' })],
  resumen_dia: () => [sello('bronce', 'Primeros pasos en Roma', 'Has visto tu primer imprescindible.'), emblema('coliseo', 'roma', { maravilla: 'coliseo' }), m({ tipo: 'pais', cat: 'pais', clave: 'demo|pais', pais: 'Italia', n: 1, nombre: 'Tu país número 1: Italia' })],
}

export const ANIMACIONES: Animacion[] = [
  { id: 'medalla_bronce', nombre: 'Medalla de bronce', grupo: 'Medallas', visor: 'momentos', momentos: 'medalla_bronce', suena: ['medalla_bronce'], partituras: ['medalla_bronce'], principal: { tipo: 'archivo', id: 'medalla_bronce' } },
  { id: 'medalla_plata', nombre: 'Medalla de plata', grupo: 'Medallas', visor: 'momentos', momentos: 'medalla_plata', suena: ['medalla_plata'], partituras: ['medalla_plata'], principal: { tipo: 'archivo', id: 'medalla_plata' } },
  { id: 'medalla_oro', nombre: 'Medalla de oro', grupo: 'Medallas', visor: 'momentos', momentos: 'medalla_oro', suena: ['medalla_oro'], partituras: ['medalla_oro'], principal: { tipo: 'archivo', id: 'medalla_oro' } },
  { id: 'medalla_diamante', nombre: 'Medalla de diamante', grupo: 'Medallas', visor: 'momentos', momentos: 'medalla_diamante', suena: ['medalla_diamante'], partituras: ['medalla_diamante'], principal: { tipo: 'archivo', id: 'medalla_diamante' } },
  { id: 'coleccion', nombre: 'Colección completa', grupo: 'Logros', visor: 'momentos', momentos: 'coleccion', suena: ['coleccion'], partituras: ['coleccion'], principal: { tipo: 'archivo', id: 'coleccion' } },
  { id: 'coleccion_imprescindibles', nombre: 'Colección completa (Los imprescindibles)', grupo: 'Logros', visor: 'momentos', momentos: 'coleccion_imprescindibles', suena: ['coleccion'], partituras: ['coleccion'], principal: { tipo: 'archivo', id: 'coleccion' }, nota: 'Los imprescindibles de Roma: 7 de 8 → 8 de 8. El sonido es el mismo que el de «Colección completa»: cae cuando se cierra el círculo.' },
  { id: 'emblema', nombre: 'Emblema de Roma', grupo: 'Logros', visor: 'momentos', momentos: 'emblema', suena: ['emblema'], partituras: ['emblema', 'escena'], principal: { tipo: 'archivo', id: 'emblema' }, destinoDeEscenas: 'roma', otrasEscenas: ESCENAS_DE_ROMA, nota: 'Una sola tarjeta para TODOS los emblemas de Roma (menos el Coliseo): todos tienen los mismos momentos clave (la luz estalla a los 8 s, todo se apaga a los 7,6 s y el emblema entra a los 9,2 s), así que lo que guardes aquí vale para todos. Se ve el Panteón; con «Ver otra escena» miras otro emblema, sin guardar aparte.' },
  { id: 'emblema_lanzarote', nombre: 'Emblema de Lanzarote', grupo: 'Logros', visor: 'momentos', momentos: 'emblema_lanzarote', suena: ['emblema'], partituras: ['emblema', 'escena'], principal: { tipo: 'archivo', id: 'emblema' }, destinoDeEscenas: 'lanzarote', otrasEscenas: ESCENAS_DE_LANZAROTE, nota: 'Una sola tarjeta para TODOS los emblemas de Lanzarote: todos comparten sus momentos clave (la luz estalla a los 9,9 s). Se ve Timanfaya; con «Ver otra escena» miras otro emblema, sin guardar aparte.' },
  { id: 'emblema_maravilla', nombre: 'Coliseo', grupo: 'Logros', visor: 'momentos', momentos: 'emblema_maravilla', suena: ['emblema'], partituras: ['emblema', 'escena'], principal: { tipo: 'archivo', id: 'emblema' }, nota: 'Empieza, la primera vez, con la espera de siempre (la frase, los latidos y el estallido: 3,6 s) y después su película, que tiene sus propios momentos clave y es más larga: es la única que no sigue la regla de su destino. Lo que guardaste antes se movió +3,6 s para seguir cayendo en el mismo fotograma de la película (hay una copia de lo de antes).' },
  { id: 'maravilla', nombre: 'Final de las 7 maravillas', grupo: 'Logros', visor: 'momentos', momentos: 'maravilla', suena: ['maravilla'], partituras: ['maravilla'], principal: { tipo: 'archivo', id: 'maravilla' } },
  { id: 'maravilla_nueva', nombre: 'Maravilla nueva (1 de 7)', grupo: 'Logros', visor: 'momentos', momentos: 'maravilla_nueva', suena: ['maravilla_nueva'], partituras: ['maravilla_nueva'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'La 1.ª a la 6.ª maravilla (la 7.ª tiene su final): la medalla de las 7 con las monedas ya conseguidas en oro; la nueva baja girando, encaja con un clic y se enciende con un brillo, y el número del centro cuenta una más. Aquí, el Coliseo (1 de 7). Usa los mismos sonidos que el pedazo (clic y brillo, el vuuush al bajar).' },
  { id: 'maravilla_nueva_cuatro', nombre: 'Maravilla nueva (4 de 7)', grupo: 'Logros', visor: 'momentos', momentos: 'maravilla_nueva_cuatro', suena: ['maravilla_nueva'], partituras: ['maravilla_nueva'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'La misma pantalla con tres monedas ya en oro y la cuarta (el Cristo Redentor) que encaja. Suena igual que «Maravilla nueva (1 de 7)».' },
  { id: 'pais', nombre: 'País nuevo', grupo: 'Logros', visor: 'momentos', momentos: 'pais', suena: ['pais'], partituras: ['pais'], principal: { tipo: 'archivo', id: 'pais' }, nota: 'Destino nuevo y continente suenan igual.' },
  { id: 'sello', nombre: 'Sello del pasaporte', grupo: 'Logros', visor: 'pasaporte', suena: ['sello_pasaporte'], partituras: ['sello_pasaporte'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'El sello que se estampa en la hoja del pasaporte (la hoja del Perfil, con sus piezas de verdad y un viaje de ejemplo). En la app suena igual (la misma partitura) al tocar el golpe la hoja. No es la medalla (esa es «Medalla de bronce»…).' },
  { id: 'pedazo', nombre: 'Pedazo que entra en su círculo', grupo: 'Logros', visor: 'momentos', momentos: 'pedazo', suena: ['pedazo'], partituras: ['pedazo'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'Una sola colección: un pedazo, un sonido.' },
  { id: 'pedazo_dos', nombre: 'Pedazos nuevos (dos colecciones a la vez)', grupo: 'Logros', visor: 'momentos', momentos: 'pedazo_dos', suena: ['pedazo'], partituras: ['pedazo'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'El Coliseo suma a la vez en «Los imprescindibles» y en «La Roma antigua». Uno detrás de otro: la segunda insignia empieza cuando la primera ha acabado del todo (su animación y su sonido) más una pausa corta, y suena su propio pedazo un semitono más agudo.' },
  { id: 'pedazo_tres', nombre: 'Pedazos nuevos (tres colecciones a la vez)', grupo: 'Logros', visor: 'momentos', momentos: 'pedazo_tres', suena: ['pedazo'], partituras: ['pedazo'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'El Coliseo suma a la vez en «Los imprescindibles», «La Roma antigua» y «Las 4 joyas de Roma». Cada insignia empieza cuando la anterior ha acabado del todo, y su pedazo suena +1 y +2 semitonos más agudo (para que no suene a copia). [Seguir] sale al acabar la última.' },
  { id: 'patrimonio', nombre: 'Patrimonio de la UNESCO', grupo: 'Logros', visor: 'momentos', momentos: 'patrimonio', suena: ['patrimonio'], partituras: ['patrimonio'], principal: { tipo: 'archivo', id: 'brillo' } },
  { id: 'viajero', nombre: 'Logro de viajero', grupo: 'Logros', visor: 'momentos', momentos: 'viajero', suena: ['viajero'], partituras: ['viajero'], principal: { tipo: 'archivo', id: 'brillo' } },
  { id: 'fuegos', nombre: 'Los fuegos', grupo: 'Resúmenes', visor: 'fuegos', suena: ['fuegos'], partituras: ['fuegos'], principal: { tipo: 'archivo', id: 'emblema' } },
  { id: 'resumen_dia', nombre: 'Resumen del día', grupo: 'Resúmenes', visor: 'resumen_dia', momentos: 'resumen_dia', suena: ['dia_completo'], partituras: ['dia_completo'], principal: { tipo: 'archivo', id: 'brillo' }, nota: 'Suena al abrirse el resumen del día, en la app y aquí (el candidato A de cada sonido hasta que elijas).' },
  { id: 'resumen_viaje', nombre: 'Resumen del viaje', grupo: 'Resúmenes', visor: 'resumen_viaje', suena: ['dia_completo'], partituras: ['dia_completo'], principal: { tipo: 'archivo', id: 'brillo' }, nota: 'Aquí se ve con un viaje de EJEMPLO (Roma, con sus días, paradas, logros y fotos); en la app lleva los datos de cada viajero. Suena al abrirse el resumen.' },
  { id: 'primer_dia', nombre: 'Tu primer día', grupo: 'Logros', visor: 'primer_dia', suena: ['primer_dia'], partituras: ['primer_dia'], principal: { tipo: 'archivo', id: 'brillo' }, nota: '«Hoy empiezas a ganar logros»: sale una sola vez, el primer día del viaje. Un brillo al entrar el título, un clic por cada fila y un brillo al acabar (el candidato A de cada sonido hasta que elijas).' },
  { id: 'apertura', nombre: 'Apertura de JUTRIP', grupo: 'Apertura', visor: 'apertura', suena: ['apertura'], partituras: ['apertura'], principal: { tipo: 'archivo', id: 'apertura' }, nota: 'En la web la apertura no suena (el navegador no deja sonar antes del primer toque): queda lista para la app de las tiendas.' },
  { id: 'visto', nombre: 'Visto (el toque y el brillo)', grupo: 'Sonidos cortos', visor: 'boton', gesto: 'Visto', suena: ['visto'], partituras: ['visto'], principal: { tipo: 'sint', id: 'toque' }, nota: 'Toca el botón [Visto] del marco, como en cada sitio de DÍAS.' },
  { id: 'aviso', nombre: 'Campanita del aviso', grupo: 'Sonidos cortos', visor: 'boton', gesto: 'Llega un aviso', suena: ['aviso'], partituras: ['aviso'], principal: { tipo: 'sint', id: 'campanita' }, nota: 'Suena cuando llega un aviso nuevo a la campana.' },
  { id: 'tic', nombre: 'Tic de los números que suben', grupo: 'Sonidos cortos', visor: 'solo', suena: ['dia_completo'], partituras: [], principal: { tipo: 'sint', id: 'tic' }, nota: 'Suena en el resumen del día y en patrimonio/viajero. Aquí se oye dentro de la partitura del resumen.' },
  { id: 'toque', nombre: 'Toque (el latido de los aros)', grupo: 'Sonidos cortos', visor: 'solo', suena: ['emblema'], partituras: [], principal: { tipo: 'sint', id: 'toque' }, nota: 'Suena en [Visto] y en los latidos del emblema. Aquí se oye dentro de la partitura del emblema.' },
  { id: 'vuelo', nombre: 'Lo ganado que vuela', grupo: 'Sonidos cortos', visor: 'solo', suena: ['vuelo'], partituras: ['vuelo'], principal: { tipo: 'archivo', id: 'vuelo' }, nota: 'Solo el sonido: el vuelo de verdad se ve (y suena) al pasar de pantalla en cualquiera de los logros, cuando lo ganado vuela al botón o al Perfil.' },
]

export const animacionDe = (id: string): Animacion | undefined => ANIMACIONES.find((a) => a.id === id)

/** Los archivos grabados que usa una animación (sin repetir, el principal primero): cada uno con sus candidatos A a E. */
export function archivosDeLaAnimacion(a: Animacion): string[] {
  const todos: string[] = []
  for (const id of a.partituras) for (const n of partituraDe(id)?.notas ?? []) if (n.tipo === 'archivo' && !todos.includes(n.archivo)) todos.push(n.archivo)
  if (a.principal.tipo === 'archivo' && todos.includes(a.principal.id)) todos.splice(todos.indexOf(a.principal.id), 1)
  return a.principal.tipo === 'archivo' ? [a.principal.id, ...todos] : todos
}

/** Los sonidos hechos por código (sin candidatos) que usa una animación. */
export function sintesDeLaAnimacion(a: Animacion): string[] {
  const s: string[] = []
  for (const id of a.partituras.length ? a.partituras : a.suena) for (const n of partituraDe(id)?.notas ?? []) if (n.tipo === 'sint' && !s.includes(n.sonido)) s.push(n.sonido)
  return s
}

/** (V35A2) Lo que dura la animación entera (la partitura más larga de las que arrancan al empezar), en segundos. */
/**
 * (V38E) LA LÍNEA DE TIEMPO DE UNA TARJETA: la animación ENTERA que se ve en el marco, de principio a [Seguir], no la de una partitura.
 *   · `dura`: hasta que sale [Seguir] (o hasta que acaba, si no hay [Seguir]); sale de los mismos números que la animación (tiempos.ts y los de cada escena).
 *   · `tramos`: qué partituras suenan y cuándo EMPIEZA cada una dentro de la animación entera (la escena de un emblema de Roma empieza cuando acaba su suspense: a los 3,6 s). Los sonidos de cada tramo se colocan en el segundo que les toca.
 *   · `marcas`: los momentos clave, con su rótulo (los latidos, la luz que estalla, aparece el emblema, el nombre, [Seguir]…).
 */
export interface Marca {
  t: number
  rotulo: string
}
export interface Tramo {
  partitura: string
  /** Segundos desde el principio de la animación entera en que empieza esa partitura. */
  empieza: number
  opciones?: OpcionesDePartitura
}
export interface LineaDeTiempo {
  dura: number
  /** Segundos en que sale [Seguir] (null si la animación no tiene). */
  seguir: number | null
  marcas: Marca[]
  tramos: Tramo[]
}
const ESCENA_LANZAROTE = { fl: 9.9, dim: 9.5, x: [10.7, 11.6, 12.5, 13.4] }
const ESCENA_COLISEO = { fl: 23.6, dim: 23.2, x: [24, 24.3, 24.6, 25.6] }
const MARCAS_DE_LATIDOS: Marca = { t: TIEMPOS_DE_EMBLEMA.aros[0], rotulo: 'latidos' }
/** Cuánto dura de verdad la parte de «Seguir» de cada tarjeta: el `ctaEn` de su pantalla (pantallas.tsx) y, en los emblemas, el [Seguir] de la escena. */
const SEGUIR_DE: Record<string, number> = { medalla_bronce: 2.4, medalla_plata: 4.4, medalla_oro: 4.4, medalla_diamante: 4.4, coleccion: 4.2, coleccion_imprescindibles: 4.2, pais: 3, patrimonio: 2.6, viajero: 2.6 }
export function lineaDeTiempo(a: Animacion): LineaDeTiempo {
  const porDefecto: Tramo[] = a.suena.map((s) => ({ partitura: s, empieza: 0 }))
  const dePartitura = Math.max(...a.suena.map((s) => partituraDe(s)?.dura ?? 0), 0)
  const marcaSeguir = (t: number): Marca => ({ t, rotulo: '[Seguir]' })
  switch (a.id) {
    case 'emblema': {
      // Roma: la espera de antes del emblema (los latidos y el estallido, 3,6 s) y después su escena.
      const e = tiemposDeEscena()
      const s0 = TIEMPOS_DE_EMBLEMA.estalla
      const seguir = s0 + e.x[3]
      return {
        dura: seguir,
        seguir,
        tramos: [{ partitura: 'emblema', empieza: 0 }, { partitura: 'escena', empieza: s0 }],
        marcas: [MARCAS_DE_LATIDOS, { t: s0, rotulo: 'estalla la luz · empieza la escena' }, { t: s0 + e.dim, rotulo: 'todo se apaga' }, { t: s0 + e.fl, rotulo: 'estalla la luz del emblema' }, { t: s0 + e.x[0], rotulo: 'aparece el emblema' }, { t: s0 + e.x[2], rotulo: 'el nombre' }, marcaSeguir(seguir)],
      }
    }
    case 'emblema_lanzarote': {
      const e = ESCENA_LANZAROTE
      return {
        dura: e.x[3],
        seguir: e.x[3],
        tramos: [{ partitura: 'emblema', empieza: 0 }, { partitura: 'escena', empieza: 0, opciones: { escena: e } }],
        marcas: [MARCAS_DE_LATIDOS, { t: TIEMPOS_DE_EMBLEMA.estalla, rotulo: 'estalla la luz del suspense' }, { t: e.dim, rotulo: 'todo se apaga' }, { t: e.fl, rotulo: 'estalla la luz del emblema' }, { t: e.x[0], rotulo: 'aparece el emblema' }, { t: e.x[2], rotulo: 'el nombre' }, marcaSeguir(e.x[3])],
      }
    }
    case 'emblema_maravilla': {
      // El Coliseo (V39B): la espera de siempre (los latidos y el estallido, 3,6 s) y DESPUÉS su película entera (coliseo.tsx): la película empieza a los 3,6 s.
      const e = ESCENA_COLISEO
      const s0 = TIEMPOS_DE_EMBLEMA.estalla
      const seguir = s0 + e.x[3]
      return {
        dura: seguir,
        seguir,
        tramos: [{ partitura: 'emblema', empieza: 0 }, { partitura: 'escena', empieza: s0, opciones: { escena: e } }],
        marcas: [
          MARCAS_DE_LATIDOS,
          { t: s0, rotulo: 'estalla la luz · empieza la película' },
          { t: s0 + 0.3, rotulo: '«Casi 2.000 años esperándote…»' },
          { t: s0 + 5.4, rotulo: 'segunda frase' },
          { t: s0 + 11.3, rotulo: 'vuelan las partículas de oro' },
          { t: s0 + 15.8, rotulo: 'se dibuja el Coliseo' },
          { t: s0 + 16.8, rotulo: 'se enciende' },
          { t: s0 + 22.35, rotulo: 'el oro se junta' },
          { t: s0 + e.fl, rotulo: 'estalla el destello' },
          { t: s0 + e.x[0], rotulo: 'los textos' },
          marcaSeguir(seguir),
        ],
      }
    }
    case 'maravilla': {
      const t = TIEMPOS_FINAL_SIETE
      return {
        dura: 10.4,
        seguir: 9,
        tramos: porDefecto,
        marcas: [{ t: t.quietas, rotulo: 'las 7 monedas quietas' }, { t: t.latidos[0], rotulo: 'latidos' }, { t: t.choque[0], rotulo: 'el choque' }, { t: t.giraEmpieza, rotulo: 'gira la medalla' }, { t: paraFinalSiete(), rotulo: 'la medalla para' }, { t: t.barrido, rotulo: 'barrido de brillo' }, marcaSeguir(9), { t: 9.6, rotulo: 'el título' }],
      }
    }
    case 'maravilla_nueva':
    case 'maravilla_nueva_cuatro': {
      // (V39B) La animación entera de «Una maravilla nueva»: la moneda baja girando a los 0,8 s, encaja a los 1,88 s, su emblema llega al brillo más fuerte a los 2,24 s, el nombre y la línea suben a los 2,7 y 3 s y [Seguir] sale a los 3,4 s.
      const t = TIEMPOS_DE_MARAVILLA_NUEVA
      return {
        dura: t.cta,
        seguir: t.cta,
        tramos: porDefecto,
        marcas: [{ t: t.llega, rotulo: 'baja la moneda' }, { t: t.encaja, rotulo: 'encaja la moneda' }, { t: t.brilla, rotulo: 'se enciende' }, { t: t.nombre, rotulo: 'el nombre' }, { t: t.linea, rotulo: 'la línea' }, marcaSeguir(t.cta)],
      }
    }
    case 'pedazo':
    case 'pedazo_dos':
    case 'pedazo_tres': {
      const n = a.id === 'pedazo' ? 1 : a.id === 'pedazo_dos' ? 2 : 3
      const fin = finSonoroDe('pedazo')
      const seguir = ctaDeLosPedazos(n, fin)
      return { dura: seguir, seguir, tramos: porDefecto, marcas: [marcaSeguir(seguir)] }
    }
    case 'sello': {
      return { dura: TIEMPOS_ESTAMPADO.fin, seguir: null, tramos: porDefecto, marcas: [{ t: TIEMPOS_ESTAMPADO.golpe, rotulo: 'el sello toca la hoja' }] }
    }
    case 'apertura':
      return { dura: Math.max(dePartitura, 0), seguir: null, tramos: porDefecto, marcas: [{ t: FRACCIONES_APERTURA.estrella * dePartitura, rotulo: 'la estrella salta sobre la I' }] }
    default: {
      const seguir = SEGUIR_DE[a.id] ?? null
      // (La duración nunca es menor que la de su sonido: el golpe y la cola de un sonido no se salen de la línea de tiempo. Ojo: la medalla de bronce da [Seguir] a los 2,4 s pero su golpe cae a los 4,4 s: ya era así.)
      return { dura: seguir === null ? dePartitura : Math.max(seguir, golpeDe(a), dePartitura), seguir, tramos: porDefecto, marcas: seguir === null ? [] : [marcaSeguir(seguir)] }
    }
  }
}
/** Lo que dura la animación entera (la línea de tiempo del estudio), en segundos. */
export const duracionDe = (a: Animacion): number => lineaDeTiempo(a).dura
/** (V35A2) El instante, en segundos desde el primer fotograma, en que cae el golpe (el del sonido principal; si no hay, el final de la animación): la referencia de «En el golpe» y la raya roja. */
export function golpeDe(a: Animacion): number {
  for (const id of a.suena) for (const n of partituraDe(id)?.notas ?? []) if (n.tipo === 'archivo' && a.principal.tipo === 'archivo' && n.archivo === a.principal.id) return n.golpe
  const golpes = a.suena.flatMap((id) => (partituraDe(id)?.notas ?? []).flatMap((n) => (n.tipo === 'archivo' ? [n.golpe] : [])))
  return golpes.length ? Math.max(...golpes) : duracionDe(a)
}

/** Un sonido de Code en «Lo elegido»: silenciado, con su candidato (si es grabado) y su volumen. */
export interface CodigoElegido {
  nombre: string
  silenciado: boolean
  letra?: string
  volumen: number
  /** (V35B2) Movido respecto a su sitio: «sitio» = 0 ms donde suena de siempre; «principio» / «golpe» = 0 ms en ese instante. */
  movido?: { ms: number; empieza: 'sitio' | 'principio' | 'golpe' }
  /** (V36B) Lo retocado, en palabras (`descripcionDe`); vacío si nada. */
  retocado?: string
}
export interface PropioElegido {
  nombre: string
  empieza: 'principio' | 'golpe'
  ms: number
  volumen: number
  /** (V36B) Lo retocado, en palabras; vacío si nada. */
  retocado?: string
}
/** La línea de «Lo elegido» de una animación: todo lo que suena (pura: la prueba la comprueba). Ejemplo: «Medalla de bronce → golpe: candidato B · 80 % · redoble: SILENCIADO · MÍO: x.mp3 · desde el principio +120 ms · 70 %». */
export function lineaElegida(a: Animacion, e: { codigo: CodigoElegido[]; propios: PropioElegido[]; anadidos?: PropioElegido[] }): string {
  const pct = (x: number) => `${Math.round(x * 100)} %`
  const ms = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x)} ms`
  const partes: string[] = []
  const movido = (c: CodigoElegido): string => (c.movido && (c.movido.ms !== 0 || c.movido.empieza !== 'sitio') ? ` · movido ${c.movido.empieza === 'sitio' ? '' : `${c.movido.empieza === 'principio' ? 'desde el principio' : 'desde el golpe'} `}${ms(c.movido.ms)}` : '')
  for (const c of e.codigo) partes.push(c.silenciado ? `${c.nombre}: SILENCIADO` : c.letra ? `${c.nombre}: candidato ${c.letra}${movido(c)}${c.retocado ? ` · retocado: ${c.retocado}` : ''} · ${pct(c.volumen)}` : `${c.nombre}: se queda como está${movido(c)} · ${pct(c.volumen)}`)
  for (const p of e.anadidos ?? []) partes.push(`añadido: ${p.nombre} · ${p.empieza === 'principio' ? 'desde el principio' : 'desde el golpe'} ${ms(p.ms)}${p.retocado ? ` · retocado: ${p.retocado}` : ''} · ${pct(p.volumen)}`)
  for (const p of e.propios) partes.push(`MÍO: ${p.nombre} · ${p.empieza === 'principio' ? 'desde el principio' : 'desde el golpe'} ${ms(p.ms)}${p.retocado ? ` · retocado: ${p.retocado}` : ''} · ${pct(p.volumen)}`)
  return `${a.nombre} → ${partes.length ? partes.join(' · ') : 'sin sonido'}`
}

export const AVISO_DE_LOS_SONIDOS_PROPIOS = 'Los sonidos tuyos: guárdalos en Descargas › sonidos_jutrip con el nombre de la animación (por ejemplo, medalla_oro.mp3) y pasa esta lista a Claude. En la siguiente tanda se recortan, se igualan de volumen y se ponen en la app'
