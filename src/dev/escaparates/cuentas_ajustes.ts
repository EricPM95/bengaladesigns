import { createElement as h } from 'react'
import { AjustesScreen } from '../../components/ajustes/AjustesScreen'
import { MisPases } from '../../components/ajustes/MisPases'
import { InvitacionRecibida } from '../../components/cuenta/InvitacionRecibida'
import type { PaseMio } from '../../lib/pagoPase'
import { useAjustesUi } from '../../store/useAjustesUi'
import { useMiPerfil } from '../../store/useMiPerfil'
import { desmontar, espera, montarEnBody } from '../escaparateUtil'
import type { Escaparate } from '../escaparate'

/**
 * Los escaparates de Ajustes, Mis pases, Borrar la cuenta y la invitación al pase («Logros · Pantallas · 04», cuentas parte 3): L-P3, L-P4, L-P5 y L-P6, y el Perfil con foto y nombre.
 * Las capturas llevan «L-» delante del nombre del diseño.
 */
const duo: PaseMio = {
  id: 'p-duo',
  destino: 'Roma',
  tipo: 'duo',
  estado: 'activo',
  creado_en: '2026-09-02T10:00:00Z',
  usos_max: 2,
  usos_usados: 2,
  es_mio: true,
  importe_cent: 1099,
  moneda: 'eur',
  tiene_recibo: true,
  viaje: { id: 'v1', destino: 'Roma', inicio: '2026-10-10', fin: '2026-10-14' },
  miembros: [
    { nombre: 'Elena', es_yo: true, es_comprador: true },
    { nombre: 'Laura', es_yo: false, es_comprador: false },
  ],
  invitacion: { id: 'i1', codigo: 'K7MQ4XWH', trip_id: 'v1' },
}
const uno: PaseMio = {
  id: 'p-uno',
  destino: 'Lisboa',
  tipo: 'uno',
  estado: 'activo',
  creado_en: '2026-09-30T10:00:00Z',
  usos_max: 1,
  usos_usados: 1,
  es_mio: true,
  importe_cent: 699,
  moneda: 'eur',
  tiene_recibo: true,
  viaje: { id: 'v2', destino: 'Lisboa', inicio: '2026-12-12', fin: '2026-12-15' },
  miembros: [{ nombre: 'Elena', es_yo: true, es_comprador: true }],
  invitacion: null,
}
const PASES = [duo, uno]

const foto =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E7B98A"/><stop offset="1" stop-color="#9C5E3A"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="100" cy="82" r="34" fill="#FFFDF8" opacity=".85"/><path d="M36 190c6-44 34-62 64-62s58 18 64 62z" fill="#FFFDF8" opacity=".85"/></svg>')

const cerrar = (id: string) => () => {
  desmontar(id)
  useAjustesUi.setState({ pantalla: null, editandoPerfil: false })
}

const lista: Escaparate[] = [
  { id: 'c3-L-P3', que: 'Ajustes', abrir: () => montarEnBody('c3-L-P3', h(AjustesScreen, { onVolver: () => undefined, emailInicial: 'elena@correo.com', proveedorInicial: 'email', pasesIniciales: PASES, avisosInicial: true })), cerrar: cerrar('c3-L-P3') },
  { id: 'c3-L-P4', que: 'Mis pases · un Pase Dúo', abrir: () => montarEnBody('c3-L-P4', h(MisPases, { onVolver: () => undefined, pasesIniciales: PASES, hoy: '2026-10-11' })), cerrar: cerrar('c3-L-P4') },
  { id: 'c3-L-P5', que: 'Borrar la cuenta', abrir: () => montarEnBody('c3-L-P5', h(AjustesScreen, { onVolver: () => undefined, emailInicial: 'elena@correo.com', proveedorInicial: 'email', pasesIniciales: PASES, avisosInicial: true, borrandoInicial: true })), cerrar: cerrar('c3-L-P5') },
  {
    id: 'c3-L-P6',
    que: 'La invitación al pase (la misma pantalla que P7b)',
    abrir: () => montarEnBody('c3-L-P6', h(InvitacionRecibida, { vista: { valida: true, destino: 'Roma', invitador: 'Laura', inicio: '2026-10-10', fin: '2026-10-14', con_pase: true }, onUnirme: () => undefined, onSeguir: () => undefined })),
    cerrar: cerrar('c3-L-P6'),
  },
  {
    id: 'c3-1a-hoy',
    que: 'HOY con el boton de logros: no tapa [No me da tiempo] (parte 8b)',
    abrir: async () => {
      const api = (window as unknown as { __escaparate?: { abrir: (id: string) => Promise<void> } }).__escaparate
      await api?.abrir('1a-hoy')
      await espera(600)
    },
    cerrar: () => (window as unknown as { __escaparate?: { limpiar: () => void } }).__escaparate?.limpiar(),
  },
  {
    id: 'c3-Perfil-foto-nombre',
    que: 'El Perfil con foto y nombre',
    abrir: async () => {
      const api = (window as unknown as { __escaparate?: { abrir: (id: string) => Promise<void> } }).__escaparate
      await api?.abrir('P1')
      useMiPerfil.getState().poner({ nombre: 'Elena', fotoGoogle: foto })
      await espera(900)
    },
    cerrar: () => {
      useMiPerfil.getState().poner({ nombre: null, fotoPath: null, fotoGoogle: null })
      ;(window as unknown as { __escaparate?: { limpiar: () => void } }).__escaparate?.limpiar()
    },
  },
]
export default lista
