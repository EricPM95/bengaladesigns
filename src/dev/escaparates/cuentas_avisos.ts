import { createElement as h } from 'react'
import { LogoDeLaApp } from '../../components/ui/LogoDeLaApp'
import type { AvisoDeCuenta } from '../../lib/avisos'
import { marca } from '../../lib/marca'
import { textoDelAviso, textoDelPush, quienDelAviso } from '../../../shared/avisos/textos.js'
import { useAvisosStore } from '../../store/useAvisosStore'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'
import { conRuta } from './hoja'

/**
 * Los escaparates de la campanita de Avisos (cuentas parte 3, Ruta y días · 07: AV1 a AV6, y P8 de «Pase y cuenta»). AV7 y AV8 están en cuentas_viaje.ts.
 */
/**
 * Las fechas de los avisos cuadran con el viaje de prueba (el mismo de las demás capturas: del 17 al 20 de octubre). La campanita de las capturas se ve «el 21 de octubre por la mañana», el día
 * después de volver: antes del viaje están la recomendación, la unión y el aviso de los 10 días; a la mañana siguiente, el resumen y el aviso de las sorpresas (que solo existen cuando el viaje ha acabado).
 */
const MIN = 60_000
const DIA_MS = 24 * 60 * MIN
const HOY_VIAJE = { inicio: '2026-10-17', fin: '2026-10-20' }
const sumaDias = (iso: string, n: number): string => new Date(Date.parse(`${iso}T12:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10)
/** Las fechas del viaje abierto (las de la ruta de pruebas); si no las tiene, las de siempre. */
export const fechasDelViaje = () => {
  const r = useRouteStore.getState().route?.answers.dateRange
  return r?.start && r?.end ? { inicio: r.start, fin: r.end } : HOY_VIAJE
}
/** El instante «aaaa-mm-dd a las hh:mm» (hora de aquí). */
const a_las = (iso: string, hm: string): string => new Date(`${iso}T${hm}:00`).toISOString()
/** «Ahora» de la captura: el día siguiente a volver, a las 10:00. Solo mientras el escaparate está abierto. */
const ahoraReal = Date.now.bind(Date)
const simularAhora = () => {
  const { fin } = fechasDelViaje()
  const ms = Date.parse(a_las(sumaDias(fin, 1), '10:00'))
  Date.now = () => ms
}
const restaurarAhora = () => {
  Date.now = ahoraReal
}
const aviso = (id: string, tipo: AvisoDeCuenta['tipo'], creado_en: string, payload: Record<string, unknown>, extra: Partial<AvisoDeCuenta> = {}): AvisoDeCuenta => ({
  id,
  tipo,
  texto: textoDelAviso({ tipo, payload }),
  quien: quienDelAviso({ tipo, payload }),
  creado_en,
  leido: false,
  payload,
  etiqueta: null,
  ...extra,
})

/** La campanita del administrador, lo más nuevo arriba. */
export const delAdmin = (contestada = false): AvisoDeCuenta[] => {
  const { inicio, fin } = fechasDelViaje()
  return [
    aviso('a5', 'sorpresas', a_las(sumaDias(fin, 1), '08:30'), { texto: 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma' }),
    aviso('a4', 'resumen', a_las(sumaDias(fin, 1), '07:30'), {}, { leido: true }),
    aviso('a1', 'recomendacion', a_las(sumaDias(inicio, -5), '18:20'), { autor: 'Laura', tipo_rec: 'cambio', dia: 2 }, contestada ? { leido: true, etiqueta: 'Aceptada' } : {}),
    aviso('a2', 'unido', a_las(sumaDias(inicio, -7), '12:05'), { nombre: 'Laura' }, contestada ? { leido: true } : {}),
    aviso('a3', 'd10', a_las(sumaDias(inicio, -10), '09:00'), { destino: 'Roma', dias: 10 }, { leido: true }),
  ]
}
/** La campanita de Laura, la invitada. */
export const deLaura = (): AvisoDeCuenta[] => {
  const { inicio, fin } = fechasDelViaje()
  return [
    aviso('l4', 'resumen', a_las(sumaDias(fin, 1), '07:30'), {}),
    aviso('l1', 'aceptada', a_las(sumaDias(inicio, -4), '19:10'), { admin: 'Elena', tipo_rec: 'cambio', dia: 3 }, { leido: true }),
    aviso('l2', 'rechazada', a_las(sumaDias(inicio, -5), '20:40'), { admin: 'Elena', tipo_rec: 'cambio', dia: 1 }, { leido: true }),
    aviso('l3', 'd10', a_las(sumaDias(inicio, -10), '09:00'), { destino: 'Roma', dias: 10 }, { leido: true }),
  ]
}

const gente = [
  { id: 'elena', nombre: 'Elena', foto: null, esAdmin: true },
  { id: 'laura', nombre: 'Laura', foto: null, esAdmin: false },
]

async function preparar(modo: 'days' | 'route' | 'today', avisos: () => AvisoDeCuenta[], rol: 'admin' | 'invitado' = 'admin') {
  try {
    if (rol === 'invitado') window.sessionStorage.setItem('trazo:invitado', '1')
    else window.sessionStorage.removeItem('trazo:invitado')
  } catch {
    /* sin almacenamiento */
  }
  await conRuta(modo)
  useSyncStore.setState({ activeTripId: 'demo-viaje' })
  useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente, recomendaciones: [] })
  useAvisosStore.getState().cerrar()
  simularAhora()
  useAvisosStore.getState().poner(avisos())
  await espera(600)
}
const limpiar = () => {
  restaurarAhora()
  useAvisosStore.getState().cerrar()
  useAvisosStore.getState().poner([])
  usePropuestaStore.setState({ activa: false, base: null, enviada: false })
  desmontar('c3-AV6')
  try {
    window.sessionStorage.removeItem('trazo:invitado')
  } catch {
    /* sin almacenamiento */
  }
}

/** El aviso en el móvil: la pantalla de bloqueo con el aviso de la app (el hueco del logo, el nombre de data/marca.json y el texto que manda el servidor). */
function PantallaDeBloqueo({ cuerpo, fecha }: { cuerpo: string; fecha: string }) {
  return h(
    'div',
    { style: { position: 'fixed', inset: 0, background: 'linear-gradient(180deg,#2A3150,#141826)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 110, gap: 4 } },
    h('span', { style: { font: "300 72px/1 'Geist'" } }, '9:41'),
    h('span', { style: { font: "500 15px 'Geist'", color: 'rgba(255,253,248,.75)' } }, fecha),
    h(
      'div',
      { style: { marginTop: 40, width: 358, borderRadius: 22, background: 'rgba(255,253,248,.16)', padding: '12px 14px', display: 'flex', gap: 10 } },
      h('span', { style: { width: 38, height: 38, flex: 'none', display: 'flex' } }, h(LogoDeLaApp, { size: 38, radius: 10 })),
      h(
        'span',
        { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 } },
        h('span', { style: { display: 'flex', justifyContent: 'space-between', font: "600 13px 'Geist'" } }, h('span', null, marca.nombre), h('span', { style: { fontWeight: 400, opacity: 0.6 } }, 'ahora')),
        h('span', { style: { font: "400 13.5px/1.35 'Geist'" } }, cuerpo),
      ),
    ),
  )
}

const lista: Escaparate[] = [
  { id: 'c3-AV1', que: 'La campanita con su puntito (en DIAS: es la misma en RUTA, HOY y DIAS)', abrir: () => preparar('days', () => delAdmin()), cerrar: limpiar },
  {
    id: 'c3-AV2',
    que: 'Al tocarla: la lista, con lo no leído destacado',
    abrir: async () => {
      await preparar('route', () => delAdmin())
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  {
    id: 'c3-AV3',
    que: 'Ya contestada: «Aceptada»',
    abrir: async () => {
      await preparar('route', () => delAdmin(true))
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  { id: 'c3-AV4', que: 'La misma campanita en HOY', abrir: () => preparar('today', () => delAdmin()), cerrar: limpiar },
  {
    id: 'c3-AV5',
    que: 'La campanita de Laura, la invitada',
    abrir: async () => {
      await preparar('route', () => deLaura(), 'invitado')
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  {
    id: 'c3-AV6',
    que: 'El aviso en el móvil: al tocarlo, abre la campanita',
    abrir: () => montarEnBody('c3-AV6', h(PantallaDeBloqueo, { cuerpo: textoDelPush({ tipo: 'recomendacion', payload: { autor: 'Laura', tipo_rec: 'cambio', dia: 2 } }), fecha: 'lunes, 12 de octubre' })),
    cerrar: () => desmontar('c3-AV6'),
  },
  {
    id: 'c3-P8',
    que: 'El aviso de los 10 días, en el móvil',
    abrir: () => montarEnBody('c3-AV6', h(PantallaDeBloqueo, { cuerpo: textoDelPush({ tipo: 'd10', payload: { destino: 'Roma', dias: 10, con_pase: true, inicio: '2026-10-17', fin: '2026-10-20' } }), fecha: 'miércoles, 7 de octubre' })),
    cerrar: () => desmontar('c3-AV6'),
  },
]
export default lista
