import type { GastoCompartido } from '../lib/gastosCompartidos'
import type { Backend, NuevoGasto } from '../lib/gastosCompartidosRed'
import type { PagoMarcado } from '../lib/cuentasGrupo'
import { aCentimos } from '../lib/cuentasGrupo'
import { vistaDeGasto } from '../lib/gastosCompartidos'
import type { AvisoDeCuenta } from '../lib/avisos'
import { textoDelAviso, detalleDelAviso, quienDelAviso } from '../../shared/avisos/textos.js'
import { useAvisosStore } from '../store/useAvisosStore'
import { useGastosCompartidos, usarBackendDeGastos } from '../store/useGastosCompartidos'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido, type Permiso, type Persona } from '../store/useViajeCompartido'

/**
 * UN SERVIDOR DE MENTIRA PARA EL PRESUPUESTO COMPARTIDO (Tanda 10N, apartado 9). SOLO DESARROLLO. Hace lo mismo que la migración 0037 (quién ve qué, quién decide, avisos), en memoria, y deja cambiar de persona sin
 * recargar: `window.__gastosFalsos.usar('ana')` te pone como Ana (invitada, «Solo recomendar»), `usar('eric')` como el administrador, `usar('luis')` como quien puede editar. Sirve para las capturas y la prueba de las pantallas;
 * la verdad de las reglas la comprueba la prueba contra la base de datos real (PGlite con la 0037).
 */
type Uid = 'eric' | 'ana' | 'luis' | 'marta'
const GENTE: { id: Uid; nombre: string; permiso: Permiso }[] = [
  { id: 'eric', nombre: 'Eric', permiso: 'admin' },
  { id: 'ana', nombre: 'Ana', permiso: 'recomendar' },
  { id: 'luis', nombre: 'Luis', permiso: 'editar' },
  { id: 'marta', nombre: 'Marta', permiso: 'recomendar' },
]
const TRIP = 'demo-viaje'

interface Fila extends GastoCompartido {
  decididoEn: string | null
}
interface AvisoFalso {
  id: string
  uid: Uid
  tipo: 'gasto_pendiente' | 'gasto_resuelto' | 'pago_marcado'
  payload: Record<string, unknown>
  creado: string
  leido: boolean
}

const bd: { gastos: Fila[]; avisos: AvisoFalso[]; pagos: (PagoMarcado & { importe: { amount: number; currency: string } })[]; ex: { id: string; nombre: string | null }[]; yo: Uid; n: number; miembros: Uid[] } = { gastos: [], avisos: [], pagos: [], ex: [], yo: 'eric', n: 0, miembros: ['eric', 'ana'] }
const permisoDe = (uid: Uid): Permiso => GENTE.find((g) => g.id === uid)!.permiso
const decide = (uid: Uid) => permisoDe(uid) === 'admin' || permisoDe(uid) === 'editar'
const nombre = (uid: string) => GENTE.find((g) => g.id === uid)?.nombre ?? null
const ahora = () => new Date().toISOString()

const visible = (g: Fila, uid: Uid): boolean => g.autorId === uid || (g.ambito === 'grupo' && g.estado === 'aceptado') || (g.ambito === 'grupo' && g.estado === 'pendiente' && decide(uid))

function avisosDe(uid: Uid): AvisoDeCuenta[] {
  return bd.avisos
    .filter((a) => a.uid === uid)
    .map((a) => {
      const gasto = bd.gastos.find((g) => g.id === a.payload.gasto_id)
      const estado = a.tipo === 'gasto_pendiente' ? (gasto?.estado ?? 'retirado') : null
      const aviso = { tipo: a.tipo, payload: a.payload }
      return {
        id: a.id,
        tipo: a.tipo,
        texto: textoDelAviso(aviso),
        quien: quienDelAviso(aviso),
        creado_en: a.creado,
        leido: a.leido,
        payload: a.tipo === 'gasto_pendiente' ? { ...a.payload, gasto_estado: estado } : a.payload,
        detalle: detalleDelAviso(aviso),
        etiqueta: estado && estado !== 'pendiente' ? (estado === 'aceptado' ? 'Aceptado' : estado === 'rechazado' ? 'Rechazado' : 'Retirado') : null,
      } as AvisoDeCuenta
    })
    .reverse()
}
const refrescarAvisos = () => useAvisosStore.getState().poner(avisosDe(bd.yo))

const backend: Backend = {
  yo: async () => bd.yo,
  cargar: async () => ({ gastos: bd.gastos.filter((g) => visible(g, bd.yo)).map((g) => ({ ...g })), pagos: bd.pagos.map((p) => ({ ...p })), exMiembros: bd.ex.map((e) => ({ ...e })), disponible: true, cuentas: true }),
  anadir: async (g: NuevoGasto) => {
    const uid = bd.yo
    const permitido = (g.ambito === 'mio' && g.estado === 'aceptado' && g.pagadoPor.length === 0) || (g.ambito === 'grupo' && g.estado === 'aceptado' && decide(uid)) || (g.ambito === 'grupo' && g.estado === 'pendiente')
    if (!permitido) return 'No se ha podido guardar el gasto (la regla de seguridad lo impide).'
    const fila: Fila = { id: `g${++bd.n}`, tripId: TRIP, autorId: uid, nombre: g.nombre, precio: g.precio, ambito: g.ambito, estado: g.estado, pagadoPor: g.ambito === 'mio' ? [] : g.pagadoPor, entre: g.ambito === 'mio' ? [] : (g.entre ?? []), decididoPor: null, decididoEn: null, creadoEn: ahora() }
    bd.gastos.push(fila)
    if (fila.ambito === 'grupo' && fila.estado === 'pendiente') {
      for (const u of bd.miembros) {
        if (u !== uid && decide(u)) bd.avisos.push({ id: `a${++bd.n}`, uid: u, tipo: 'gasto_pendiente', creado: ahora(), leido: false, payload: { trip_id: TRIP, gasto_id: fila.id, autor_id: uid, autor: nombre(uid), nombre: fila.nombre, precio: fila.precio, pago: fila.pagadoPor.map((p) => nombre(p)).join(', ') } })
      }
    }
    refrescarAvisos()
    return null
  },
  editar: async (id, c) => {
    const fila = bd.gastos.find((g) => g.id === id)
    if (!fila || !(fila.autorId === bd.yo || decide(bd.yo))) return 'No se han podido guardar los cambios (la regla de seguridad lo impide).'
    fila.nombre = c.nombre
    fila.precio = c.precio
    fila.pagadoPor = c.pagadoPor
    fila.entre = c.entre
    return null
  },
  marcarPago: async (p) => {
    if (!(p.deudorId === bd.yo || p.acreedorId === bd.yo || decide(bd.yo))) return 'No se ha podido marcar el pago (la regla de seguridad lo impide).'
    const id = `p${++bd.n}`
    bd.pagos.push({ id, deudorId: p.deudorId, acreedorId: p.acreedorId, centimos: aCentimos(p.importe), marcadoPor: bd.yo, importe: p.importe })
    for (const para of [p.deudorId, p.acreedorId] as Uid[]) {
      if (para === bd.yo || !bd.miembros.includes(para)) continue
      bd.avisos.push({ id: `a${++bd.n}`, uid: para, tipo: 'pago_marcado', creado: ahora(), leido: false, payload: { trip_id: TRIP, pago_id: id, actor_id: bd.yo, actor: nombre(bd.yo), deudor_id: p.deudorId, deudor: nombre(p.deudorId), acreedor_id: p.acreedorId, acreedor: nombre(p.acreedorId), importe: p.importe, para: para === p.deudorId ? 'deudor' : 'acreedor' } })
    }
    refrescarAvisos()
    return null
  },
  deshacerPago: async (id) => {
    const i = bd.pagos.findIndex((x) => x.id === id)
    if (i >= 0) bd.pagos.splice(i, 1)
    return null
  },
  decidir: async (id, estado) => {
    const fila = bd.gastos.find((g) => g.id === id)
    if (!fila || !decide(bd.yo)) return 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.'
    if (fila.estado !== 'pendiente') return 'YA_DECIDIDO'
    fila.estado = estado
    fila.decididoPor = bd.yo
    fila.decididoEn = ahora()
    bd.avisos.push({ id: `a${++bd.n}`, uid: fila.autorId as Uid, tipo: 'gasto_resuelto', creado: ahora(), leido: false, payload: { trip_id: TRIP, gasto_id: id, admin_id: bd.yo, admin: nombre(bd.yo), resultado: estado, nombre: fila.nombre, precio: fila.precio } })
    for (const a of bd.avisos) if (a.tipo === 'gasto_pendiente' && a.payload.gasto_id === id) a.leido = true
    refrescarAvisos()
    return null
  },
  quitar: async (id) => {
    const i = bd.gastos.findIndex((g) => g.id === id)
    if (i >= 0 && (bd.gastos[i].autorId === bd.yo || (bd.gastos[i].ambito === 'grupo' && decide(bd.yo)))) bd.gastos.splice(i, 1)
    return null
  },
  escuchar: () => () => undefined,
}

function ponerGente(yo: Uid) {
  const gente: Persona[] = bd.miembros.map((id) => ({ id, nombre: nombre(id), foto: null, esAdmin: id === 'eric', permiso: permisoDe(id), esYo: id === yo }))
  useViajeCompartido.getState().poner({ tripId: TRIP, gente })
}

/** `usar('ana')`: te pones como esa persona (cambia el invitado fingido, el permiso, la gente, los gastos que ves y su campanita). */
async function usar(yo: Uid, miembros?: Uid[]) {
  if (miembros) bd.miembros = miembros
  bd.yo = yo
  try {
    if (yo === 'eric') {
      window.sessionStorage.removeItem('trazo:invitado')
      window.sessionStorage.removeItem('trazo:permiso')
    } else {
      window.sessionStorage.setItem('trazo:invitado', '1')
      window.sessionStorage.setItem('trazo:permiso', permisoDe(yo))
    }
  } catch {
    /* sin almacenamiento */
  }
  usarBackendDeGastos(backend)
  useSyncStore.setState({ activeTripId: TRIP })
  ponerGente(yo)
  useGastosCompartidos.getState().poner({ yoId: yo })
  await useGastosCompartidos.getState().cargar(TRIP)
  refrescarAvisos()
}

/** Alguien sale del viaje (o lo quitan): deja su nombre para las cuentas, como hace la base de datos. */
async function salir(uid: Uid) {
  bd.ex.push({ id: uid, nombre: nombre(uid) })
  bd.miembros = bd.miembros.filter((m) => m !== uid)
  ponerGente(bd.yo)
  await useGastosCompartidos.getState().recargar()
}

/** Alguien entra al viaje. */
async function entrar(uid: Uid) {
  if (!bd.miembros.includes(uid)) bd.miembros.push(uid)
  ponerGente(bd.yo)
  await useGastosCompartidos.getState().recargar()
}

function reiniciar() {
  bd.gastos = []
  bd.pagos = []
  bd.ex = []
  bd.avisos = []
  bd.n = 0
  bd.miembros = ['eric', 'ana']
}

/** Gastos de partida del diseño (`Presupuesto Compartido` 01): Taxi (pagó Eric), Supermercado (pagó Ana), Souvenirs (solo Ana) y Regalo para casa (solo Eric). */
function sembrarComoElDiseno() {
  const eur = (amount: number) => ({ amount, currency: 'EUR' })
  const base = (id: string, autorId: Uid, nombreG: string, amount: number, ambito: 'grupo' | 'mio', pagadoPor: string[]): Fila => ({ id, tripId: TRIP, autorId, nombre: nombreG, precio: eur(amount), ambito, estado: 'aceptado', pagadoPor, entre: [], decididoPor: null, decididoEn: null, creadoEn: ahora() })
  bd.gastos.push(base('s1', 'eric', 'Taxi al aeropuerto', 50, 'grupo', ['eric']), base('s2', 'ana', 'Supermercado', 30, 'grupo', ['ana']), base('s3', 'ana', 'Souvenirs', 25, 'mio', []), base('s4', 'eric', 'Regalo para casa', 40, 'mio', []))
}

/** Otra persona decide un gasto MIENTRAS tú sigues mirando la app (sin cambiar de persona): para ver la franja de arriba y el cambio en directo. */
async function decidirComo(uid: Uid, id: string, estado: 'aceptado' | 'rechazado') {
  const antes = bd.yo
  bd.yo = uid
  const r = await backend.decidir(id, estado)
  bd.yo = antes
  refrescarAvisos()
  return r
}

if (typeof window !== 'undefined') (window as unknown as { __gastosFalsos: unknown }).__gastosFalsos = { usar, reiniciar, sembrarComoElDiseno, decidirComo, salir, entrar, backend, bd, vistaDeGasto }
