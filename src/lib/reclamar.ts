import { create } from 'zustand'
import { datosDeFotoDeLaGaleria, enviarFotoDeGaleria, llamar, type Momento, type RespuestaDeHecho } from './logros'
import { subirFoto } from './fotosViaje'
import { useLogrosStore } from '../store/useLogrosStore'
import { useRouteStore } from '../store/useRouteStore'
import { useMomentosUI } from '../components/logros/momentos/useMomentosUI'
import type { Route } from './types'

/**
 * RECLAMAR CON TUS FOTOS (Tanda V5). Un sitio fijo para ganar lo que viste: eliges muchas fotos de la galería a la vez; cada una pasa por el servidor con las reglas de siempre (cámara del móvil, días del
 * viaje, plazo de 30 días) y, con ubicación, cuenta para CUALQUIER sitio con logro en cuyo radio cae (esté o no en la ruta). Sin ubicación, la app pregunta de qué sitio es. Todo lo que decide qué vale
 * es del servidor (`POST /api/logros/foto` con `libre: true`); aquí solo se manda, se cuenta y se enseña el resumen. Lo ganado va a la fila de momentos (V3) de una en una; si son muchas, no se
 * ponen en la fila: el resumen lleva [Ver todo en Logros].
 */

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const PLAZO_DIAS = 30

const aDias = (iso: string) => Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86400000)
const deDias = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10)
export const fechaLarga = (f: string) => `${Number(f.slice(8, 10))} de ${MESES[Number(f.slice(5, 7)) - 1]}`
const hoyIso = () => {
  const f = import.meta.env.DEV ? (useRouteStore.getState().dev_simulated_today_iso ?? (window as unknown as { __demoHoy?: string }).__demoHoy ?? null) : null
  if (f) return f
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type FaseDeReclamo = 'antes' | 'durante' | 'despues' | 'cerrado' | 'sin_fechas'

export function fechasDe(route: Route | null | undefined): { inicio: string; fin: string } | null {
  const r = route?.answers?.dateRange
  return r?.start && r?.end ? { inicio: r.start, fin: r.end } : null
}

/** El último día para reclamar: 30 días después del último día del viaje. */
export function ultimoDiaDeReclamo(route: Route | null | undefined): string | null {
  const f = fechasDe(route)
  return f ? deDias(aDias(f.fin) + PLAZO_DIAS) : null
}

/** «Puedes reclamar hasta el 13 de diciembre». */
export function fraseDelPlazo(route: Route | null | undefined): string | null {
  const u = ultimoDiaDeReclamo(route)
  return u ? `Puedes reclamar hasta el ${fechaLarga(u)}` : null
}

/** Antes del viaje no hay nada que reclamar; durante y hasta que acaba el plazo, sí. */
export function faseDeReclamo(route: Route | null | undefined, hoy = hoyIso()): FaseDeReclamo {
  const f = fechasDe(route)
  if (!f) return 'sin_fechas'
  if (hoy < f.inicio) return 'antes'
  if (hoy <= f.fin) return 'durante'
  return hoy <= (ultimoDiaDeReclamo(route) as string) ? 'despues' : 'cerrado'
}

/** El botón se ve durante el viaje y hasta que acaba el plazo. */
export const hayBotonDeReclamar = (route: Route | null | undefined, hoy = hoyIso()) => ['durante', 'despues'].includes(faseDeReclamo(route, hoy))

/** El texto de «Lo de ayer también cuenta» según el momento: «Ayer tenías en tu ruta: …» durante el viaje; «En tu viaje tenías: …» después. */
export function textoDeLoDeAyer(fase: FaseDeReclamo, nombres: string[], total: number): string {
  const lista = nombres.slice(0, 3)
  const quedan = total - lista.length
  const cuerpo = `${lista.join(', ')}${quedan > 0 ? ` y ${quedan} más` : ''}…`
  return fase === 'despues' || fase === 'cerrado' ? `En tu viaje tenías: ${cuerpo}` : `Ayer tenías en tu ruta: ${cuerpo}`
}

/** El día y su número de la ruta para la fecha de una foto (para guardarla en los recuerdos de ese día). */
export function diaDeLaFecha(route: Route | null | undefined, fecha: string | null): { dayId: string; dayNumber: number } | null {
  const f = fechasDe(route)
  if (!f || !fecha || !route) return null
  const n = aDias(fecha) - aDias(f.inicio) + 1
  const dia = route.days.find((d) => d.dayNumber === n)
  return dia ? { dayId: dia.id, dayNumber: dia.dayNumber } : null
}

/* ------------------------------------------------------------------ */
/* El flujo                                                            */
/* ------------------------------------------------------------------ */

export interface SitioParaElegir {
  sitio: string
  nombre: string
  dias: string[]
  pendiente: boolean
}
export interface FotoDelReclamo {
  id: number
  nombre: string
  url: string
  archivo: File
  fecha: string | null
}
export interface NoVale {
  id: number
  nombre: string
  url: string
  motivo: string
  mensaje: string
}
export interface SitioGanado {
  sitio: string
  nombre: string
  url: string
}

export type FaseDelFlujo = 'cerrado' | 'subiendo' | 'preguntando' | 'resumen' | 'bloqueado'

interface Estado {
  fase: FaseDelFlujo
  total: number
  hechas: number
  pedazos: number
  emblemas: number
  sitios: SitioGanado[]
  noValen: NoVale[]
  /** Fotos sin ubicación que esperan que se diga de qué sitio son. */
  preguntas: FotoDelReclamo[]
  lista: SitioParaElegir[]
  /** Las que no se han podido comprobar por falta de red: quedan en la cola del móvil y se comprueban solas al volver la señal. */
  enEspera: number
  /** Demasiadas sorpresas para enseñarlas de una en una: se mandan a Logros. */
  muchos: boolean
  /** Sin pase: el servidor no cuenta nada. */
  sinPase: boolean
  /** Sin sitio donde cayó la foto (recuerdos). */
  recuerdos: number
  ocupado: boolean
  cerrar: () => void
}

export const useReclamarStore = create<Estado>((set) => ({
  fase: 'cerrado',
  total: 0,
  hechas: 0,
  pedazos: 0,
  emblemas: 0,
  sitios: [],
  noValen: [],
  preguntas: [],
  lista: [],
  enEspera: 0,
  muchos: false,
  sinPase: false,
  recuerdos: 0,
  ocupado: false,
  cerrar: () => {
    useLogrosStore.getState().ponerHojaAbierta(false)
    set({ fase: 'cerrado', preguntas: [], noValen: [], sitios: [], hechas: 0, total: 0 })
  },
}))

const poner = (p: Partial<Estado>) => useReclamarStore.setState(p)
const sumar = (r: RespuestaDeHecho | null) => ({
  pedazos: (r?.nuevos ?? []).filter((m: Momento) => m.tipo === 'suma').length,
  emblemas: (r?.nuevos ?? []).filter((m: Momento) => m.tipo === 'emblema').length,
})

let siguienteId = 1
let respuestasGuardadas: RespuestaDeHecho[] = []

/** La foto pasa a los recuerdos del día en que se hizo (si hay álbum; sin red o sin cuenta, no pasa nada). */
async function alAlbum(archivo: File, fecha: string | null) {
  const route = useRouteStore.getState().route
  const dia = diaDeLaFecha(route, fecha)
  if (!route || !dia) return
  try {
    await subirFoto({ tripId: route.id, dayId: dia.dayId, dayNumber: dia.dayNumber, stopName: null, file: archivo })
  } catch {
    /* el álbum va aparte */
  }
}

async function cargarLista(tripId: string) {
  const r = await llamar<{ ok: boolean; sitios?: SitioParaElegir[] }>(`/api/logros/sitios?trip_id=${encodeURIComponent(tripId)}`)
  poner({ lista: r?.ok ? (r.sitios ?? []) : [] })
}

/** Manda las fotos elegidas, una a una (con «Comprobando 12 de 30…»), y enseña el resumen al acabar. */
export async function reclamarConFotos(tripId: string, archivos: File[]): Promise<void> {
  if (archivos.length === 0 || useReclamarStore.getState().ocupado) return
  respuestasGuardadas = []
  poner({ fase: 'subiendo', total: archivos.length, hechas: 0, pedazos: 0, emblemas: 0, sitios: [], noValen: [], preguntas: [], enEspera: 0, muchos: false, sinPase: false, recuerdos: 0, ocupado: true })
  useLogrosStore.getState().ponerHojaAbierta(true)
  void cargarLista(tripId)
  // La hoja de logros se cierra: las pantallas del reclamo van encima de la app, no debajo de ella.
  useMomentosUI.getState().cerrarHojaLogros()
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i]
    const datos = await datosDeFotoDeLaGaleria(archivo)
    const url = URL.createObjectURL(archivo)
    const foto: FotoDelReclamo = { id: siguienteId++, nombre: archivo.name, url, archivo, fecha: datos.tomadaEn ? datos.tomadaEn.slice(0, 10) : null }
    const r = await enviarFotoDeGaleria({ tripId, nombre: '', archivo, libre: true })
    poner({ hechas: i + 1 })
    if (!r) {
      // Sin red: el servidor no la ha visto; queda en la cola del móvil y se comprueba sola al volver la señal.
      useReclamarStore.setState((s) => ({ enEspera: s.enEspera + 1 }))
      continue
    }
    recibirRespuesta(foto, r)
  }
  terminar()
}

function recibirRespuesta(foto: FotoDelReclamo, r: RespuestaDeHecho & { sitios?: { sitio: string; nombre: string }[] }) {
  if (r.valida === false) {
    useReclamarStore.setState((s) => ({ noValen: [...s.noValen, { id: foto.id, nombre: foto.nombre, url: foto.url, motivo: r.motivo ?? 'no_vale', mensaje: r.mensaje ?? 'Esta foto no vale.' }] }))
    return
  }
  // Una foto válida va a los recuerdos de su día, gane algo o no.
  void alAlbum(foto.archivo, foto.fecha)
  if (r.motivo === 'sin_ubicacion') {
    useReclamarStore.setState((s) => ({ preguntas: [...s.preguntas, foto] }))
    return
  }
  if (r.motivo === 'sin_logro_aqui') {
    useReclamarStore.setState((s) => ({ noValen: [...s.noValen, { id: foto.id, nombre: foto.nombre, url: foto.url, motivo: 'sin_logro_aqui', mensaje: 'La foto es válida y va a tus recuerdos, pero no está en ningún sitio con logro.' }], recuerdos: s.recuerdos + 1 }))
    return
  }
  if (r.cuenta === false) {
    // Sin pase (o sin acceso): no cuenta nada.
    useReclamarStore.setState((s) => ({ sinPase: true, recuerdos: s.recuerdos + 1 }))
    return
  }
  respuestasGuardadas.push(r)
  const { pedazos, emblemas } = sumar(r)
  const nuevosSitios: SitioGanado[] = (r.sitios ?? (r.sitio ? [{ sitio: r.sitio, nombre: r.sitio_nombre ?? r.sitio }] : [])).map((s) => ({ sitio: s.sitio, nombre: s.nombre, url: foto.url }))
  useReclamarStore.setState((s) => ({
    pedazos: s.pedazos + pedazos,
    emblemas: s.emblemas + emblemas,
    sitios: [...s.sitios, ...nuevosSitios.filter((n) => !s.sitios.some((x) => x.sitio === n.sitio))],
  }))
}

/** Las preguntas «¿De qué sitio es esta foto?» (sin ubicación), una detrás de otra, o el resumen si no queda ninguna. */
function terminar() {
  const s = useReclamarStore.getState()
  if (s.preguntas.length > 0) poner({ fase: 'preguntando', ocupado: false })
  else mostrarResumen()
}

/** La respuesta a una pregunta: de qué sitio es la foto (o `null` para saltarla). */
export async function responderPregunta(tripId: string, foto: FotoDelReclamo, sitio: string | null): Promise<void> {
  poner({ preguntas: useReclamarStore.getState().preguntas.filter((p) => p.id !== foto.id), ocupado: true })
  if (sitio) {
    const r = await enviarFotoDeGaleria({ tripId, nombre: '', archivo: foto.archivo, sitio })
    if (r) recibirRespuesta(foto, { ...r, sitios: r.sitios ?? [{ sitio, nombre: useReclamarStore.getState().lista.find((x) => x.sitio === sitio)?.nombre ?? sitio }] })
    else useReclamarStore.setState((st) => ({ enEspera: st.enEspera + 1 }))
  } else useReclamarStore.setState((st) => ({ recuerdos: st.recuerdos + 1 }))
  poner({ ocupado: false })
  terminar()
}

function mostrarResumen() {
  const total = respuestasGuardadas.reduce((n, r) => n + (r.nuevos?.length ?? 0), 0)
  void total
  // (V6) Ya no hay tope de «más de 6 → Ver todo en Logros»: la fila agrupa (una pantalla con todas las colecciones que avanzan) y no salen tantas.
  poner({ fase: 'resumen', ocupado: false, muchos: false })
}

/** Al cerrar el resumen: si son pocas, sus sorpresas pasan a la fila de momentos (de una en una); si son muchas, se quedan en Logros (con su puntito). */
export function cerrarResumen(): void {
  const s = useReclamarStore.getState()
  const logros = useLogrosStore.getState()
  // (V6) [Ver lo que has ganado]: lo ganado pasa a la fila de momentos (colecciones que avanzan juntas → colecciones completas → emblemas → sello → EXP y nivel) y, al acabar la última
  // animación (o con [Saltar todo]), se abre la hoja «Tus logros en …» con todo ya puesto.
  for (const r of respuestasGuardadas) logros.recibir(r)
  logros.ponerPuntito(respuestasGuardadas.some((r) => (r.nuevos?.length ?? 0) > 0))
  respuestasGuardadas = []
  s.cerrar()
  useMomentosUI.getState().pedirHojaAlFinal()
}

/** Para las pruebas: «N pedazos y M emblemas» como lo dice el resumen. */
export function fraseDelResumen(pedazos: number, emblemas: number): string {
  const p = `${pedazos} ${pedazos === 1 ? 'pedazo' : 'pedazos'}`
  const e = `${emblemas} ${emblemas === 1 ? 'emblema' : 'emblemas'}`
  if (pedazos > 0 && emblemas > 0) return `Has ganado ${p} y ${e}`
  if (pedazos > 0) return `Has ganado ${p}`
  if (emblemas > 0) return `Has ganado ${e}`
  return 'Esta vez no has ganado nada nuevo'
}
