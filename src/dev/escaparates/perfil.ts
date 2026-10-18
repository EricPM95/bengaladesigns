/**
 * Escaparate del Perfil con su marco y de la EXP a la vista (Tanda 8C2). Los nombres son los del diseño: P1 (y P1-rango1 … P1-rango10, el Perfil con el marco de CADA uno de los 10 rangos),
 * P1b (al tocar el título), TR (Mis viajes → un viaje) y E1, E2, E3, E4 (la EXP ganada, subir de nivel y cambiar de rango).
 * El Perfil lo pinta `Header`, que solo existe con una ruta abierta: aquí se monta `PerfilSheet` aparte, con unos viajes guardados de mentira (fechas relativas a hoy: así «En curso» siempre lo es).
 */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { PerfilSheet } from '../../components/layout/PerfilSheet'
import { useLogrosPantallas } from '../../components/logros/pantallas/useLogrosPantallas'
import type { PerfilLogros } from '../../components/logros/pantallas/perfil/api'
import { CambioDeRango } from '../../components/logros/pantallas/perfil/CambioDeRango'
import { ExpGanada } from '../../components/logros/pantallas/perfil/ExpGanada'
import { SubeDeNivel } from '../../components/logros/pantallas/perfil/SubeDeNivel'
import type { FotoViaje } from '../../lib/fotosViaje'
import { addDaysToIso, todayIso } from '../../lib/dateRange'
import { expDeEjemplo, expEnNivel, estrellaDeLeyenda, ponerPerfilDemo, reiniciarPerfilDemo, viajesConGanado } from '../../lib/logrosDemo_perfil'
import { usePerfilUi } from '../../store/usePerfilUi'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import type { Escaparate } from '../escaparate'

/* ---------------- Viajes de mentira ---------------- */
const parada = (id: string, name: string, lat: number, lng: number) => ({ id, name, coordinates: { lat, lng }, time: '10:00', durationMinutes: 60, category: 'monumento', tags: [] })
const dia = (id: string, n: number, city: string, titulo: string, paradas: ReturnType<typeof parada>[]) => ({ id, dayNumber: n, city, title: titulo, stops: paradas, meals: [] })
const ruta = (id: string, destino: string, dias: [string, string, number, number][], inicio: string) => ({
  id,
  destination: destino,
  country: 'X',
  origin: 'Madrid',
  days: dias.map(([ciudad, titulo, lat, lng], i) => dia(`${id}d${i + 1}`, i + 1, ciudad, titulo, [parada(`${id}s${i}`, `Sitio ${i}`, lat, lng)])),
  answers: { dateRange: { start: inicio, end: addDaysToIso(inicio, dias.length - 1) }, days: dias.length },
  transportContext: {},
  intensity: 3,
  createdAt: '2026-09-01T10:00:00Z',
})
const guardado = (r: ReturnType<typeof ruta>, n: number) => ({ id: `fila-${n}`, route: r, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null }, generationState: null }) as never

export const ID_VIAJE_ROMA = 'perfil-roma'
function viajes() {
  const hoy = todayIso()
  return [
    guardado(ruta(ID_VIAJE_ROMA, 'Roma', [['Roma', 'Coliseo y Foro', 41.89, 12.49], ['Roma', 'El Vaticano', 41.9, 12.45], ['Roma', 'Roma barroca', 41.9, 12.47], ['Roma', 'Trastevere', 41.88, 12.47], ['Roma', 'Último paseo', 41.9, 12.48]], addDaysToIso(hoy, -1)), 1),
    guardado(ruta('perfil-lisboa', 'Lisboa', [['Lisboa', 'Alfama', 38.71, -9.13], ['Lisboa', 'Belém', 38.69, -9.2], ['Lisboa', 'Sintra', 38.79, -9.39]], addDaysToIso(hoy, 60)), 2),
    guardado(ruta('perfil-pisa', 'Pisa', [['Pisa', 'La torre', 43.72, 10.4], ['Pisa', 'El centro', 43.71, 10.41]], addDaysToIso(hoy, -120)), 3),
    guardado(ruta('perfil-paris', 'París', [['París', 'El Louvre', 48.86, 2.34], ['París', 'Montmartre', 48.88, 2.34], ['París', 'El Sena', 48.85, 2.35]], addDaysToIso(hoy, -170)), 4),
  ]
}

/* ---------------- Montaje aparte ---------------- */
let raiz: Root | null = null
let contenedor: HTMLElement | null = null
function montar(hijo: ReturnType<typeof createElement>) {
  desmontar()
  contenedor = document.createElement('div')
  contenedor.setAttribute('data-escaparate-perfil', '1')
  document.body.appendChild(contenedor)
  raiz = createRoot(contenedor)
  raiz.render(hijo)
}
function desmontar() {
  raiz?.unmount()
  contenedor?.remove()
  raiz = null
  contenedor = null
}
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function hasta(cond: () => boolean, ms = 6000) {
  const t0 = Date.now()
  while (!cond() && Date.now() - t0 < ms) await espera(60)
}

function prepararViajes() {
  reiniciarPerfilDemo()
  useSyncStore.setState({ savedTrips: viajes(), activeTripId: null })
  useRouteStore.setState({ route: null })
}
async function abrirPerfil(p?: Partial<PerfilLogros>) {
  prepararViajes()
  if (p) ponerPerfilDemo(p)
  usePerfilUi.setState({ abierto: true, albumDe: null })
  montar(createElement(PerfilSheet, { open: true, onClose: () => desmontar() }))
  // Espera a que lleguen los datos del demo y se pinte el cuerpo con logros.
  await hasta(() => Boolean(document.querySelector('[data-cabecera-con-marco]')))
  // Los dibujos de la vitrina y la chapa del título se bajan al pintarse: se espera a que estén.
  await hasta(() => document.querySelectorAll('[data-vitrina-del-perfil] svg, [data-vitrina-del-perfil] img').length >= 3, 4000)
  await espera(900)
}
function cerrarPerfil() {
  usePerfilUi.setState({ abierto: false, albumDe: null })
  useLogrosPantallas.getState().cerrarTodo()
  desmontar()
}

/** El Perfil con el marco de cada rango (0 a 9): a mitad del rango (nivel r*5+3); el último, con 3 estrellas de Leyenda. */
const rangos: Escaparate[] = Array.from({ length: 10 }, (_, r) => ({
  id: `P1-rango${r + 1}`,
  que: `El Perfil con el marco del rango ${r + 1}`,
  abrir: () => abrirPerfil({ exp: expDeEjemplo(r === 9 ? expEnNivel(50, 3 * estrellaDeLeyenda + 120) : expEnNivel(r * 5 + 3, 180)) }),
  cerrar: cerrarPerfil,
}))

/* ---------------- La EXP a la vista ---------------- */
const exp = (nivel: number, dentro: number) => expDeEjemplo(expEnNivel(nivel, dentro))
const faltan = (nivel: number, quedan: number) => expDeEjemplo(expEnNivel(nivel + 1) - quedan)
/** Una EXP con `ganada` más que otra. */
const mas = (antes: ReturnType<typeof expDeEjemplo>, ganada: number) => expDeEjemplo(antes.exp + ganada)

const E1 = { antes: exp(8, 520), ganada: 140 }
const E2 = { antes: exp(8, 300), ganada: 405 }
const E3 = { antes: faltan(8, 200), ganada: 405 }
const E4 = { antes: faltan(5, 200), ganada: 405 }

const fotosDeMentira = (tripId: string): FotoViaje[] =>
  ['#E7B98A,#9C5E3A', '#B8D4D8,#4E8A94', '#D9C9A4,#8E7450', '#C9C4DE,#5E5A88', '#E6C9B0,#B9764A', '#BBD3C0,#4F7D5A'].map((c, i) => {
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.split(',')[0]}"/><stop offset="1" stop-color="${c.split(',')[1]}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/></svg>`)}`
    return { id: `f${i}`, tripId, dayId: `d${i}`, dayNumber: 1 + (i % 3), stopName: null, storagePath: '', width: 200, height: 200, bytes: 1, createdAt: `2026-10-1${i}T10:00:00Z`, url, urlMin: url }
  })

const lista: Escaparate[] = [
  { id: 'P1', que: 'El Perfil: marco de rango, nivel 8, título, EXP, vitrina, pasaporte y Mis viajes', abrir: () => abrirPerfil(), cerrar: cerrarPerfil },
  {
    id: 'P1-viajes',
    que: 'El Perfil desplazado a Mis viajes (en curso, próximo, ya hechos, antes de la app)',
    abrir: async () => {
      await abrirPerfil()
      const cuerpo = document.querySelector('[data-numero-de-viajes]')?.closest('div.flex-col')?.parentElement
      document.querySelector('[data-numero-de-viajes]')?.scrollIntoView({ block: 'start' })
      void cuerpo
      await espera(500)
    },
    cerrar: cerrarPerfil,
  },
  ...rangos,
  {
    id: 'P1b',
    que: 'Al tocar el título: «Elige tu título»',
    abrir: async () => {
      await abrirPerfil()
      ;(document.querySelector('[data-titulo-del-perfil]') as HTMLElement | null)?.click()
      await hasta(() => Boolean(document.querySelector('[data-elegir-titulo]')))
      await espera(600)
    },
    cerrar: cerrarPerfil,
  },
  {
    id: 'TR',
    que: 'Mis viajes → Roma: sus días, sus fotos y lo que ganó',
    abrir: async () => {
      prepararViajes()
      viajesConGanado.add(ID_VIAJE_ROMA)
      ;(window as unknown as { __fotosDePrueba?: Record<string, FotoViaje[]> }).__fotosDePrueba = { [ID_VIAJE_ROMA]: fotosDeMentira(ID_VIAJE_ROMA) }
      useLogrosPantallas.getState().abrir({ t: 'viaje', tripId: ID_VIAJE_ROMA })
      await hasta(() => Boolean(document.querySelector('[data-lo-ganado-del-viaje]')))
      await espera(600)
    },
    cerrar: () => {
      useLogrosPantallas.getState().cerrarTodo()
      delete (window as unknown as { __fotosDePrueba?: unknown }).__fotosDePrueba
    },
  },
  {
    id: 'E1',
    que: 'Un Visto normal: «+140 EXP» flotando abajo, con nivel, rango y barra',
    capturas: [150, 800, 1800],
    abrir: () => montar(createElement(ExpGanada, { ganada: E1.ganada, antes: E1.antes, despues: mas(E1.antes, E1.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E2',
    que: 'El Coliseo: «+405 EXP» sumados de la película y las sorpresas',
    capturas: [150, 800, 1800],
    abrir: () => montar(createElement(ExpGanada, { ganada: E2.ganada, antes: E2.antes, despues: mas(E2.antes, E2.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E1-quieto',
    que: 'La EXP ganada con «reducir movimiento»',
    reducirMovimiento: true,
    abrir: () => montar(createElement(ExpGanada, { ganada: E2.ganada, antes: E2.antes, despues: mas(E2.antes, E2.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E3',
    que: 'Subir de nivel: una estrella más',
    capturas: [500, 2700, 5200],
    abrir: () => montar(createElement(SubeDeNivel, { antes: E3.antes, despues: mas(E3.antes, E3.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E3-quieto',
    que: 'Subir de nivel con «reducir movimiento»',
    reducirMovimiento: true,
    abrir: () => montar(createElement(SubeDeNivel, { antes: E3.antes, despues: mas(E3.antes, E3.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E4',
    que: 'Cambio de rango: Soñador a Explorador, con su marco nuevo',
    capturas: [600, 3000, 6800],
    abrir: () => montar(createElement(CambioDeRango, { antes: E4.antes, despues: mas(E4.antes, E4.ganada) })),
    cerrar: desmontar,
  },
  {
    id: 'E4-quieto',
    que: 'Cambio de rango con «reducir movimiento»',
    reducirMovimiento: true,
    abrir: () => montar(createElement(CambioDeRango, { antes: E4.antes, despues: mas(E4.antes, E4.ganada) })),
    cerrar: desmontar,
  },
]
export default lista
