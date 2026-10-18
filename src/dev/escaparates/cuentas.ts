import { createElement as h } from 'react'
import { EntrarCuenta } from '../../components/cuenta/EntrarCuenta'
import { InvitacionRecibida } from '../../components/cuenta/InvitacionRecibida'
import { LogoDeLaApp } from '../../components/ui/LogoDeLaApp'
import { marca } from '../../lib/marca'
import { demoCuentas } from '../../lib/logrosDemo_cuentas'
import { usePagoStore } from '../../store/usePagoStore'
import { useRouteStore } from '../../store/useRouteStore'
import { conRuta } from './hoja'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'

/**
 * Los escaparates de las cuentas, parte 3 (solo desarrollo). Cada uno lleva el nombre de su pantalla en el diseño (A1, P6, R2a…) precedido de `c3-` para no chocar con los de los logros.
 *   node scripts/destino/capturasCuentas3.mjs A1 P6
 */
export const abrirEnBody = montarEnBody
export const quitarDeBody = desmontar
export { espera }

const VISTA_ROMA = { valida: true, destino: 'Roma', invitador: 'Laura', inicio: '2026-10-16', fin: '2026-10-19', con_pase: true }

/** I1: la pantalla de inicio del móvil con el icono de la app (el hueco del logo, vacío y preparado). */
function InicioDelMovil() {
  const huecos = Array.from({ length: 12 }, (_, i) => i)
  return h(
    'div',
    { style: { position: 'fixed', inset: 0, background: 'linear-gradient(180deg,#5E7FA8,#2E3E5E)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', alignContent: 'start', gap: '26px 0', padding: '90px 18px 0', justifyItems: 'center', color: '#fff', font: "500 11px 'Geist'" } },
    ...huecos.map((i) =>
      h(
        'span',
        { key: i, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } },
        i === 6
          ? h('span', { style: { width: 62, height: 62, borderRadius: 16, background: '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px rgba(243,213,154,.55)' } }, h(LogoDeLaApp, { size: 52, radius: 12 }))
          : h('span', { style: { width: 62, height: 62, borderRadius: 16, background: 'rgba(255,255,255,.22)' } }),
        i === 6 ? marca.nombre_corto : '',
      ),
    ),
  )
}

const lista: Escaparate[] = [
  { id: 'c3-A1', que: 'La pantalla de entrar', abrir: () => montarEnBody('c3-A1', h(EntrarCuenta)), cerrar: () => desmontar('c3-A1') },
  { id: 'c3-A2', que: 'Con el email', abrir: () => montarEnBody('c3-A2', h(EntrarCuenta, { pasoInicial: 'email' })), cerrar: () => desmontar('c3-A2') },
  { id: 'c3-A3', que: 'El enlace enviado', abrir: () => montarEnBody('c3-A3', h(EntrarCuenta, { pasoInicial: 'enviado', emailInicial: 'elena@correo.es' })), cerrar: () => desmontar('c3-A3') },
  {
    id: 'c3-A4',
    que: 'Ya dentro: el formulario de crear el viaje',
    abrir: () => {
      const s = useRouteStore.getState()
      s.setScreen('destination')
    },
  },
  { id: 'c3-I1', que: 'El icono en la pantalla de inicio', abrir: () => montarEnBody('c3-I1', h(InicioDelMovil)), cerrar: () => desmontar('c3-I1') },
  {
    id: 'c3-I2',
    que: 'La pantalla al abrirla',
    abrir: () => {
      const html = (window as unknown as { __aperturaHtml?: string }).__aperturaHtml
      const caja = document.createElement('div')
      caja.dataset.escaparate = 'c3-I2'
      caja.innerHTML = html ?? ''
      document.body.appendChild(caja)
    },
    cerrar: () => document.querySelector('[data-escaparate="c3-I2"]')?.remove(),
  },
  { id: 'c3-P7b', que: 'Lo que ve quien recibe el enlace', abrir: () => montarEnBody('c3-P7b', h(InvitacionRecibida, { vista: VISTA_ROMA, onUnirme: () => undefined, onSeguir: () => undefined })), cerrar: () => desmontar('c3-P7b') },
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
  viaje: { id: 'v1', destino: 'Roma', inicio: '2026-10-16', fin: '2026-10-19' },
  miembros: [{ nombre: 'Elena', es_yo: true, es_comprador: true }],
  invitacion: null,
}
const viajeA = { id: 'a', destino: 'Roma', inicio: '2026-10-16', fin: '2026-10-19' }
const viajeB = { id: 'b', destino: 'Roma', inicio: '2026-10-16', fin: '2026-10-20' }
const abrirPago = (hoja: Record<string, unknown>) => usePagoStore.getState().abrir(hoja as never)

lista.push(
  {
    id: 'c3-P1',
    que: 'En RESERVAS, al guardar el vuelo sin pase, debajo del vuelo',
    abrir: async () => {
      try {
        window.sessionStorage.setItem('trazo:pase', 'sin')
      } catch {
        /* sin almacenamiento */
      }
      await conRuta('bookings' as never)
      const s = useRouteStore.getState()
      s.setArrivalPointId('arrival', s.route?.arrivalPointId ?? 'fiumicino')
      s.setArrivalFlightTime('14:20')
      await espera(900)
      document.querySelector('[data-reservas-p1]')?.scrollIntoView({ block: 'center' })
    },
  },
  {
    id: 'c3-P6',
    que: 'La hoja de compra',
    abrir: async () => {
      demoCuentas.cobro = true
      await conRuta('days')
      abrirPago({ tipo: 'compra', destino: 'Roma', tripId: null })
      await espera(900)
    },
    cerrar: () => usePagoStore.getState().cerrar(),
  },
  {
    id: 'c3-P7',
    que: 'Compartir el pase (Dúo, con su código y «1 de 2 usados»)',
    abrir: async () => {
      await conRuta('days')
      abrirPago({ tipo: 'invitar', modo: 'pase', destino: 'Roma', tripId: null, pase: paseDuo, codigoInicial: 'K7MQ4XWH' })
      await espera(900)
    },
    cerrar: () => usePagoStore.getState().cerrar(),
  },
  {
    id: 'c3-P8b',
    que: 'El aviso de los 10 días, en la app (dos viajes a Roma que se pisan)',
    abrir: async () => {
      await conRuta('days')
      abrirPago({ tipo: 'dosViajes', modo: 'p8b', destino: 'Roma', actual: viajeA, otro: viajeB })
      await espera(900)
    },
    cerrar: () => usePagoStore.getState().cerrar(),
  },
  {
    id: 'c3-P9',
    que: 'El primer día, si no contestó: ¿cuál haces?',
    abrir: async () => {
      await conRuta('today')
      abrirPago({ tipo: 'dosViajes', modo: 'p9', destino: 'Roma', actual: viajeA, otro: viajeB, etiquetaDia: 'Hoy · mié 16' })
      await espera(900)
    },
    cerrar: () => usePagoStore.getState().cerrar(),
  },
)

export default lista
