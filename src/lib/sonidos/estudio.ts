import type { Momento } from '../logros'
import { partituraDe } from './partituras'
import { MOMENTOS_DE_COLECCIONES } from './ejemploEstado'

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
}

const EN = '2026-11-20T10:00:00.000Z'
const m = (o: Record<string, unknown>): Momento => ({ nombre: '', primera_vez: true, en: EN, ...o }) as unknown as Momento
const sello = (grado: string, nombre: string, linea: string): Momento =>
  m({ tipo: 'sello', cat: 'sello', clave: `demo|sello|${grado}`, sello: 'roma', destino: 'roma', grado, nombre, linea })
const emblema = (id: string, destino: string, extra: Record<string, unknown> = {}): Momento =>
  m({ tipo: 'emblema', cat: 'emblema', clave: `demo|emblema|${id}`, id, destino, nombre: '', linea: '', momento: false, frase: 'Pero… ¿qué es esto?', ...extra })

/** Los momentos de ejemplo de cada animación (los mismos datos que usa la demo de logros). */
export const MOMENTOS_DEL_ESTUDIO: Record<string, () => Momento[]> = {
  medalla_bronce: () => [sello('bronce', 'Primeros pasos en Roma', 'Has visto tu primer imprescindible.')],
  medalla_plata: () => [sello('plata', 'Roma te atrapa', 'Cuatro imprescindibles vistos: ya eres de aquí.')],
  medalla_oro: () => [sello('oro', 'Roma es casi tuya', 'Seis imprescindibles de ocho.')],
  medalla_diamante: () => [sello('diamante', 'Roma es tuya', 'Todos los imprescindibles de Roma.')],
  sello: () => [sello('bronce', 'Primeros pasos en Roma', 'Has visto tu primer imprescindible.')],
  // (V37C) Colección completa y pedazo, con el estado de ejemplo de `ejemploEstado.ts` (sin él la insignia salía vacía).
  ...MOMENTOS_DE_COLECCIONES,
  emblema: () => [emblema('panteon', 'roma', { nombre: 'El Panteón', linea: 'Casi dos mil años con la puerta abierta.', frase: '¡Eh! Aquí hay algo…' })],
  emblema_maravilla: () => [emblema('coliseo', 'roma', { nombre: 'Una maravilla del mundo', linea: 'El mayor anfiteatro de la Antigüedad.', maravilla: 'coliseo', frase: '¡Eh! Aquí hay algo…' })],
  escena_roma: () => [emblema('fontana_de_trevi', 'roma')],
  escena_lanzarote: () => [emblema('timanfaya', 'lanzarote', { frase: '¡Eh! Aquí hay algo…' })],
  maravilla: () => [m({ tipo: 'maravilla', cat: 'maravilla', clave: 'demo|maravilla|taj_mahal', id: 'taj_mahal', n: 7, nombre: 'El Taj Mahal', linea: 'La séptima maravilla del mundo.' })],
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
  { id: 'emblema', nombre: 'Emblema secreto', grupo: 'Logros', visor: 'momentos', momentos: 'emblema', suena: ['emblema'], partituras: ['emblema', 'escena'], principal: { tipo: 'archivo', id: 'emblema' }, nota: 'Se ve el Panteón: la escena del sitio pone además su propia partitura («escena»), como en la app.' },
  { id: 'emblema_maravilla', nombre: 'Emblema maravilla (el Coliseo)', grupo: 'Logros', visor: 'momentos', momentos: 'emblema_maravilla', suena: ['emblema'], partituras: ['emblema', 'escena'], principal: { tipo: 'archivo', id: 'emblema' } },
  { id: 'maravilla', nombre: 'Final de las 7 maravillas', grupo: 'Logros', visor: 'momentos', momentos: 'maravilla', suena: ['maravilla'], partituras: ['maravilla'], principal: { tipo: 'archivo', id: 'maravilla' } },
  { id: 'pais', nombre: 'País nuevo', grupo: 'Logros', visor: 'momentos', momentos: 'pais', suena: ['pais'], partituras: ['pais'], principal: { tipo: 'archivo', id: 'pais' }, nota: 'Destino nuevo y continente suenan igual.' },
  { id: 'sello', nombre: 'Sello del pasaporte', grupo: 'Logros', visor: 'pasaporte', suena: ['sello_pasaporte'], partituras: ['sello_pasaporte'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'El sello que se estampa en la hoja del pasaporte (la hoja del Perfil, con sus piezas de verdad y un viaje de ejemplo). En la app suena igual (la misma partitura) al tocar el golpe la hoja. No es la medalla (esa es «Medalla de bronce»…).' },
  { id: 'pedazo', nombre: 'Pedazo que entra en su círculo', grupo: 'Logros', visor: 'momentos', momentos: 'pedazo', suena: ['pedazo'], partituras: ['pedazo'], principal: { tipo: 'archivo', id: 'clic' } },
  { id: 'pedazo_dos', nombre: 'Pedazos nuevos (dos colecciones a la vez)', grupo: 'Logros', visor: 'momentos', momentos: 'pedazo_dos', suena: ['pedazo'], partituras: ['pedazo'], principal: { tipo: 'archivo', id: 'clic' }, nota: 'El Coliseo suma a la vez en «Los imprescindibles» y en «La Roma antigua». En la app suena la misma partitura del pedazo al empezar; la segunda insignia encaja 1,6 s después.' },
  { id: 'patrimonio', nombre: 'Patrimonio de la UNESCO', grupo: 'Logros', visor: 'momentos', momentos: 'patrimonio', suena: ['patrimonio'], partituras: ['patrimonio'], principal: { tipo: 'archivo', id: 'brillo' } },
  { id: 'viajero', nombre: 'Logro de viajero', grupo: 'Logros', visor: 'momentos', momentos: 'viajero', suena: ['viajero'], partituras: ['viajero'], principal: { tipo: 'archivo', id: 'brillo' } },
  { id: 'escena_roma', nombre: 'Escena de Roma (Fontana de Trevi)', grupo: 'Escenas', visor: 'momentos', momentos: 'escena_roma', suena: ['emblema'], partituras: ['escena'], principal: { tipo: 'archivo', id: 'emblema' } },
  { id: 'escena_lanzarote', nombre: 'Escena de Lanzarote (Timanfaya)', grupo: 'Escenas', visor: 'momentos', momentos: 'escena_lanzarote', suena: ['emblema'], partituras: ['escena'], principal: { tipo: 'archivo', id: 'emblema' } },
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
export const duracionDe = (a: Animacion): number => Math.max(...a.suena.map((s) => partituraDe(s)?.dura ?? 0), 0)
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
