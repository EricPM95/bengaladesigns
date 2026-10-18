import { useLogrosPantallas } from '../../components/logros/pantallas/useLogrosPantallas'
import { useSyncStore } from '../../store/useSyncStore'
import type { Escaparate } from '../escaparate'

/**
 * Escaparates de las pantallas de un destino (8C2), con el nombre que tienen en «Mi vitrina» (Piezas/Mi Vitrina.dc.html):
 *   G1   Países → Italia → Roma, ya más abajo (colecciones y emblemas)      G2   desde el Vaticano: su sello marcado «Estás aquí»
 *   T3   Por destino → Roma · todos sus viajes (arriba, con un viaje abierto)   G0   un destino sin nada ganado (variante)
 *   A    Una colección por dentro, con el día de su ruta y [Cómo llegar]    A2   una colección ya completa (variante)
 *   M1   Mi colección · El mundo     M2   un hueco por conseguir (la hoja de «cómo conseguirlo»)     M3   otra página (Cómo viajas)
 * Los datos salen de `src/lib/logrosDemo_destino.ts` (las mismas funciones que el servidor).
 */
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
const tripDelDemo = 'demo-viaje'
let tripPrevio: string | null = null
const conViaje = () => {
  tripPrevio = useSyncStore.getState().activeTripId
  useSyncStore.getState().setActiveTripId(tripDelDemo)
}
const sinViaje = () => {
  if (useSyncStore.getState().activeTripId === tripDelDemo) useSyncStore.getState().setActiveTripId(tripPrevio)
}
const modo = (m: 'parcial' | 'vacio') => (window as unknown as { __demoDestino?: { modo: (m: string) => void } }).__demoDestino?.modo(m)
const cerrar = () => {
  useLogrosPantallas.getState().cerrarTodo()
  sinViaje()
  modo('parcial')
}
const abrirPantalla = (p: unknown) => useLogrosPantallas.getState().abrir(p as never)
const bajarHasta = (el: Element | null) => (el as HTMLElement | null)?.scrollIntoView({ block: 'end' })

const lista: Escaparate[] = [
  {
    id: 'T3',
    que: 'Por destino → Roma, arriba, con un viaje abierto',
    abrir: async () => {
      conViaje()
      abrirPantalla({ t: 'destino', destino: 'roma' })
      await espera(1500)
    },
    cerrar,
  },
  {
    id: 'G1',
    que: 'Países → Italia → Roma, más abajo: colecciones y emblemas secretos',
    abrir: async () => {
      abrirPantalla({ t: 'destino', destino: 'roma' })
      await espera(1500)
      bajarHasta(document.querySelector('[data-pantalla-logros="Página de un destino"] [role="list"]')?.parentElement ?? null)
      await espera(500)
    },
    cerrar,
  },
  {
    id: 'G2',
    que: 'Países → el Vaticano → Roma, con «Estás aquí» en el sello del Vaticano',
    abrir: async () => {
      abrirPantalla({ t: 'destino', destino: 'roma', resaltar: 'vaticano' })
      await espera(1500)
    },
    cerrar,
  },
  {
    id: 'G0',
    que: 'Variante: un destino sin nada ganado (sellos en gris, secretos en «?»)',
    abrir: async () => {
      modo('vacio')
      abrirPantalla({ t: 'destino', destino: 'roma' })
      await espera(1500)
    },
    cerrar,
  },
  {
    id: 'A',
    que: 'Una colección por dentro (Los imprescindibles de Roma): fechas de lo visto, y el día de su ruta con [Cómo llegar]',
    abrir: async () => {
      conViaje()
      abrirPantalla({ t: 'coleccion', destino: 'roma', coleccion: 'imprescindibles' })
      await espera(1500)
    },
    cerrar,
  },
  {
    id: 'A2',
    que: 'Variante: una colección completa (Los miradores)',
    abrir: async () => {
      abrirPantalla({ t: 'coleccion', destino: 'roma', coleccion: 'miradores' })
      await espera(1500)
    },
    cerrar,
  },
  {
    id: 'M1',
    que: 'Mi colección · El mundo',
    abrir: async () => {
      abrirPantalla({ t: 'mi_coleccion' })
      await espera(1800)
    },
    cerrar,
  },
  {
    id: 'M2',
    que: 'Mi colección · un hueco por conseguir (la hoja de «cómo conseguirlo»)',
    abrir: async () => {
      abrirPantalla({ t: 'mi_coleccion', grupo: 'tiempo' })
      await espera(1800)
      const cabecera = Array.from(document.querySelectorAll('[data-pantalla-logros="Mi colección"] span')).find((s) => /^EL TIEMPO/i.test(s.textContent ?? ''))
      const pagina = cabecera?.parentElement?.parentElement ?? null
      const hueco = Array.from(pagina?.querySelectorAll('button') ?? []).find((b) => /Por conseguir/.test(b.textContent ?? ''))
      ;(hueco as HTMLElement | undefined)?.click()
      await espera(900)
    },
    cerrar,
  },
  {
    id: 'M3',
    que: 'Variante: otra página de Mi colección (Cómo viajas)',
    abrir: async () => {
      abrirPantalla({ t: 'mi_coleccion', grupo: 'como_viajas' })
      await espera(2000)
    },
    cerrar,
  },
]
export default lista
