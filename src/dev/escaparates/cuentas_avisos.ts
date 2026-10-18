import { createElement as h } from 'react'
import { LogoDeLaApp } from '../../components/ui/LogoDeLaApp'
import type { AvisoDeCuenta } from '../../lib/avisos'
import { marca } from '../../lib/marca'
import { textoDelAviso, textoDelPush, quienDelAviso } from '../../../shared/avisos/textos.js'
import { useAvisosStore } from '../../store/useAvisosStore'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'
import { conRuta } from './hoja'

/**
 * Los escaparates de la campanita de Avisos (cuentas parte 3, Ruta y días · 07: AV1 a AV6, y P8 de «Pase y cuenta»). AV7 y AV8 están en cuentas_viaje.ts.
 */
const MIN = 60_000
const hace = (min: number) => new Date(Date.now() - min * MIN).toISOString()
const aviso = (id: string, tipo: AvisoDeCuenta['tipo'], min: number, payload: Record<string, unknown>, extra: Partial<AvisoDeCuenta> = {}): AvisoDeCuenta => ({
  id,
  tipo,
  texto: textoDelAviso({ tipo, payload }),
  quien: quienDelAviso({ tipo, payload }),
  creado_en: hace(min),
  leido: false,
  payload,
  etiqueta: null,
  ...extra,
})

const delAdmin = (contestada = false): AvisoDeCuenta[] => [
  aviso('a1', 'recomendacion', 5, { autor: 'Laura', tipo_rec: 'cambio', dia: 2 }, contestada ? { leido: true, etiqueta: 'Aceptada' } : {}),
  aviso('a2', 'unido', 60, { nombre: 'Laura' }, contestada ? { leido: true } : {}),
  aviso('a3', 'd10', 60 * 24 * 4, { destino: 'Roma', dias: 10 }, { leido: true }),
  aviso('a4', 'resumen', 60 * 24 * 12, {}, { leido: true }),
  aviso('a5', 'sorpresas', 60 * 24 * 40, { texto: 'Te quedan 3 días para reclamar tus 2 sorpresas de Roma' }, { leido: true }),
]
const deLaura = (): AvisoDeCuenta[] => [
  aviso('l1', 'aceptada', 60 * 24, { admin: 'Elena', tipo_rec: 'cambio', dia: 3 }),
  aviso('l2', 'rechazada', 60 * 24, { admin: 'Elena', tipo_rec: 'cambio', dia: 1 }, { leido: true }),
  aviso('l3', 'd10', 60 * 24 * 4, { destino: 'Roma', dias: 10 }, { leido: true }),
  aviso('l4', 'resumen', 60 * 24 * 12, {}, { leido: true }),
]

const gente = [
  { id: 'elena', nombre: 'Elena', foto: null, esAdmin: true },
  { id: 'laura', nombre: 'Laura', foto: null, esAdmin: false },
]

async function preparar(modo: 'days' | 'route' | 'today', avisos: AvisoDeCuenta[], rol: 'admin' | 'invitado' = 'admin') {
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
  useAvisosStore.getState().poner(avisos)
  await espera(600)
}
const limpiar = () => {
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
  { id: 'c3-AV1', que: 'La campanita con su puntito (en DIAS: es la misma en RUTA, HOY y DIAS)', abrir: () => preparar('days', delAdmin()), cerrar: limpiar },
  {
    id: 'c3-AV2',
    que: 'Al tocarla: la lista, con lo no leído destacado',
    abrir: async () => {
      await preparar('route', delAdmin())
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  {
    id: 'c3-AV3',
    que: 'Ya contestada: «Aceptada»',
    abrir: async () => {
      await preparar('route', delAdmin(true))
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  { id: 'c3-AV4', que: 'La misma campanita en HOY', abrir: () => preparar('today', delAdmin()), cerrar: limpiar },
  {
    id: 'c3-AV5',
    que: 'La campanita de Laura, la invitada',
    abrir: async () => {
      await preparar('route', deLaura(), 'invitado')
      useAvisosStore.getState().abrir()
      await espera(800)
    },
    cerrar: limpiar,
  },
  {
    id: 'c3-AV6',
    que: 'El aviso en el móvil: al tocarlo, abre la campanita',
    abrir: () => montarEnBody('c3-AV6', h(PantallaDeBloqueo, { cuerpo: textoDelPush({ tipo: 'recomendacion', payload: { autor: 'Laura', tipo_rec: 'cambio', dia: 2 } }), fecha: 'jueves, 10 de octubre' })),
    cerrar: () => desmontar('c3-AV6'),
  },
  {
    id: 'c3-P8',
    que: 'El aviso de los 10 días, en el móvil',
    abrir: () => montarEnBody('c3-AV6', h(PantallaDeBloqueo, { cuerpo: textoDelPush({ tipo: 'd10', payload: { destino: 'Roma', dias: 10, con_pase: true, inicio: '2026-10-16', fin: '2026-10-19' } }), fecha: 'martes, 6 de octubre' })),
    cerrar: () => desmontar('c3-AV6'),
  },
]
export default lista
