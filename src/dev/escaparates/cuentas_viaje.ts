import { createElement as h } from 'react'
import { HojaVerPropuesta } from '../../components/propuesta/HojaVerPropuesta'
import { etiquetaDeDia } from '../../lib/propuesta'
import type { Stop } from '../../lib/types'
import { usePagoStore } from '../../store/usePagoStore'
import { useAvisosStore } from '../../store/useAvisosStore'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useR2Store } from '../../store/useR2Store'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'
import { conRuta } from './hoja'

/**
 * Los escaparates de «compartir el viaje y recomendar cambios» (cuentas parte 3, Ruta y días · 07): RS1, RS2, R1, RW1 a RW3, RM, RV, RSent, R2a a R2d y AV7/AV8.
 * Se hacen con el viaje de pruebas de siempre, fingiendo que eres el administrador (Elena) o la persona invitada (Laura).
 */
const gente = [
  { id: 'elena', nombre: 'Elena', foto: null, esAdmin: true },
  { id: 'laura', nombre: 'Laura', foto: null, esAdmin: false },
]
const paseDuo = {
  id: 'p-duo',
  destino: 'Roma',
  tipo: 'duo' as const,
  estado: 'activo' as const,
  creado_en: '2026-10-10T10:00:00Z',
  usos_max: 2,
  usos_usados: 1,
  es_mio: true,
  importe_cent: 1099,
  moneda: 'eur',
  tiene_recibo: true,
  viaje: null,
  miembros: [{ nombre: 'Elena', es_yo: true, es_comprador: true }],
  invitacion: null,
}

type Modo = 'days' | 'route' | 'today'

/** El viaje de pruebas, como administrador o como invitada (según el rol), con la gente del viaje puesta. */
async function prepararViaje(rol: 'admin' | 'invitado', modo: Modo = 'days') {
  try {
    if (rol === 'invitado') window.sessionStorage.setItem('trazo:invitado', '1')
    else window.sessionStorage.removeItem('trazo:invitado')
  } catch {
    /* sin almacenamiento */
  }
  await conRuta(modo)
  useSyncStore.setState({ activeTripId: 'demo-viaje' })
  usePropuestaStore.setState({ activa: false, base: null, verAbierto: false, enviada: false, error: null })
  useR2Store.getState().cerrar()
  useAvisosStore.getState().poner([]) // sin campanita con puntito: es de las capturas de avisos (AV1), no de estas
  useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente, recomendaciones: [] })
  await espera(500)
}

const diaDe = (n: number) => useRouteStore.getState().route!.days.filter((d) => !d.isReturnLeg)[n - 1]
const abrirDia = async (n: number) => {
  useRouteStore.getState().setActiveDayId(diaDe(n).id)
  await espera(1200)
}
const paradaNueva = (de: Stop, nombre: string): Stop => ({ ...de, id: `nueva-${nombre}`, name: nombre, fullName: nombre, photoUrl: '' })

function cambiarEnLaCopia(n: number, i: number, nombre: string) {
  const route = useRouteStore.getState().route
  if (!route) return
  const d = diaDe(n)
  useRouteStore.setState({ route: { ...route, days: route.days.map((x) => (x.id === d.id ? { ...x, stops: x.stops.map((p, k) => (k === i ? paradaNueva(p, nombre) : p)) } : x)) } })
}
function quitarEnLaCopia(n: number, i: number) {
  const route = useRouteStore.getState().route
  if (!route) return
  const d = diaDe(n)
  useRouteStore.setState({ route: { ...route, days: route.days.map((x) => (x.id === d.id ? { ...x, stops: x.stops.filter((_, k) => k !== i) } : x)) } })
}

const recDe = (tipo: 'cambio' | 'dia' | 'ruta', payload: Record<string, unknown>) => ({ id: `rec-${tipo}`, tripId: 'demo-viaje', authorId: 'laura', tipo, payload, estado: 'pendiente' as const, creadaEn: '2026-10-10T10:00:00Z' })
const abrirR2 = async (rec: ReturnType<typeof recDe>) => {
  useViajeCompartido.getState().poner({ recomendaciones: [rec] })
  useR2Store.getState().abrir(rec)
  await espera(900)
}
const cerrarTodo = () => {
  usePagoStore.getState().cerrar()
  usePropuestaStore.setState({ activa: false, base: null, verAbierto: false, enviada: false })
  useR2Store.getState().cerrar()
  desmontar('c3-AV7')
  try {
    window.sessionStorage.removeItem('trazo:invitado')
  } catch {
    /* sin almacenamiento */
  }
}
const clic = async (selector: string, i = 0) => {
  const el = document.querySelectorAll(selector)[i] as HTMLElement | undefined
  el?.scrollIntoView({ block: 'center' })
  await espera(400)
  el?.click()
}
const verPareja = async () => {
  document.querySelector('[data-cambio-parada="grande"]')?.scrollIntoView({ block: 'center' })
  await espera(500)
}

const lista: Escaparate[] = [
  {
    id: 'c3-RS1',
    que: 'El botón [Compartir viaje] en RUTA',
    abrir: () => prepararViaje('admin', 'route'),
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RS2',
    que: 'La hoja para invitar (con un Pase Dúo es la de P7)',
    abrir: async () => {
      await prepararViaje('admin', 'route')
      usePagoStore.getState().abrir({ tipo: 'invitar', modo: 'viaje', destino: 'Roma', tripId: 'demo-viaje', pase: paseDuo, codigoInicial: 'K7MQ4XWH' } as never)
      await espera(900)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-R1',
    que: 'Lo que ve la persona invitada: la ruta del administrador',
    abrir: async () => {
      await prepararViaje('invitado')
      await abrirDia(2)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RW1',
    que: 'Recomendar una parada: el menú «···»',
    abrir: async () => {
      await prepararViaje('invitado')
      await abrirDia(2)
      await clic('[data-menu-invitado][aria-label="Opciones de la parada"]', 3)
      await espera(500)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RW2',
    que: 'Recomendar un día: la cabecera del día',
    abrir: async () => {
      await prepararViaje('invitado')
      await clic('[data-menu-invitado][aria-label="Más opciones del día"]', 1)
      await espera(500)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RW3',
    que: 'Recomendar la ruta entera: desde RUTA',
    abrir: () => prepararViaje('invitado', 'route'),
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RM',
    que: 'El modo recomendación: la barra «Tu propuesta · 2 cambios» y la pareja «Propuesta: cambiar»',
    abrir: async () => {
      await prepararViaje('invitado')
      await abrirDia(2)
      usePropuestaStore.getState().empezar('parada')
      cambiarEnLaCopia(2, 3, 'Trastevere')
      quitarEnLaCopia(3, 2)
      await espera(1000)
      await verPareja()
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RV',
    que: '[Ver]: la lista de sus cambios, cada uno con [Deshacer]',
    abrir: async () => {
      await prepararViaje('invitado')
      await abrirDia(2)
      usePropuestaStore.getState().empezar('parada')
      cambiarEnLaCopia(2, 3, 'Trastevere')
      quitarEnLaCopia(3, 2)
      await espera(500)
      usePropuestaStore.getState().verLista(true)
      await espera(800)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-RSent',
    que: '«Se lo hemos mandado a Elena»',
    abrir: async () => {
      await prepararViaje('invitado')
      usePropuestaStore.setState({ enviada: true })
      await espera(800)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-R2a',
    que: 'R2: una parada (cambiar una por otra)',
    abrir: async () => {
      await prepararViaje('admin', 'route')
      const d = diaDe(2)
      const i = d.stops.length - 1
      await abrirR2(recDe('cambio', { dayId: d.id, accion: 'cambiar', stopId: d.stops[i].id, stop: paradaNueva(d.stops[i], 'Trastevere') }))
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-R2b',
    que: 'R2: un día (cambios en el día 3)',
    abrir: async () => {
      await prepararViaje('admin', 'route')
      const d = diaDe(3)
      const nuevo = { ...d, stops: d.stops.map((p, k) => (k === 2 ? paradaNueva(p, 'Boca de la Verdad') : k === 3 ? paradaNueva(p, 'Jardín de los Naranjos') : p)) }
      await abrirR2(recDe('dia', { accion: 'sustituir', dayId: d.id, day: nuevo }))
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-R2c',
    que: 'R2: la ruta entera (solo los días que cambian)',
    abrir: async () => {
      await prepararViaje('admin', 'route')
      const r = useRouteStore.getState().route!
      const d1 = diaDe(1)
      const dN = r.days.filter((d) => !d.isReturnLeg).at(-1)!
      const days = r.days.map((d) => (d.id === d1.id ? { ...d, stops: d.stops.map((p, k) => (k === d.stops.length - 1 ? paradaNueva(p, 'Villa Borghese') : p)) } : d.id === dN.id ? { ...d, stops: [...d.stops, paradaNueva(d.stops[0], 'Castillo de Sant’Angelo')] } : d))
      await abrirR2(recDe('ruta', { days }))
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-R2d',
    que: 'R2: el día ya no existe, ¿en qué día lo pones?',
    abrir: async () => {
      await prepararViaje('admin', 'route')
      const d = diaDe(1)
      const dia4 = { ...d, id: 'dia-que-ya-no-esta', title: 'Trastevere', stops: [paradaNueva(d.stops[0], 'Trastevere'), paradaNueva(d.stops[0], 'Castillo de Sant’Angelo')] }
      await abrirR2(recDe('dia', { accion: 'sustituir', dayId: 'dia-que-ya-no-esta', day: dia4 }))
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-AV7',
    que: 'Lo que ve Laura en su [Ver]: «Enviada · esperando a Elena»',
    abrir: async () => {
      await prepararViaje('invitado')
      const route = useRouteStore.getState().route!
      const d2 = diaDe(2)
      const d3 = diaDe(3)
      const a = d2.stops[d2.stops.length - 1]
      montarEnBody(
        'c3-AV7',
        h(HojaVerPropuesta, {
          onCerrar: () => undefined,
          cambiosEnviados: [
            { etiqueta: etiquetaDeDia(route, d2.dayNumber), cambio: { tipo: 'cambiar', antes: a, despues: paradaNueva(a, 'Trastevere'), dayTitle: d2.title } },
            { etiqueta: etiquetaDeDia(route, d3.dayNumber), cambio: { tipo: 'quitar', antes: d3.stops[2], dayTitle: d3.title } },
          ],
        }),
      )
      await espera(800)
    },
    cerrar: cerrarTodo,
  },
  {
    id: 'c3-AV8',
    que: 'El día que cambia, con su etiqueta «1 recomendación»',
    abrir: async () => {
      await prepararViaje('admin', 'days')
      const d = diaDe(2)
      const i = d.stops.length - 1
      useViajeCompartido.getState().poner({ recomendaciones: [recDe('cambio', { dayId: d.id, accion: 'cambiar', stopId: d.stops[i].id, stop: paradaNueva(d.stops[i], 'Trastevere') })] })
      await abrirDia(2)
    },
    cerrar: cerrarTodo,
  },
]
export default lista
