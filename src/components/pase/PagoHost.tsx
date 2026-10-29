import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { formatShortDateEs } from '../../lib/dateRange'
import { configDelPase, estadoDelPago, misPases, olvidarConfigDelPase, pagoDeLaDireccion } from '../../lib/pagoPase'
import { guardarViajeAparte } from '../../lib/tripPersistence'
import { parejasQueSePisan } from '../../lib/viajesQueSePisan'
import { llamarServidor } from '../../lib/servidor'
import { useSyncStore } from '../../store/useSyncStore'
import { usePagoStore } from '../../store/usePagoStore'
import { TextoConPase } from '../cuenta/TextoConPase'
import { BotonHoja, Hoja } from '../ui/Hoja'

// Las hojas de comprar, invitar y de los dos viajes se bajan cuando se abren (cuentas 3B, punto 2).
// (Tanda 10I: la hoja «¿Cuántos sois?» es la de la película del pase; `abrir({ tipo: 'compra' })` abre la película en el final con la hoja ya abierta.)
const ListaDelPase = lazy(() => import('./ListaDelPase').then((m) => ({ default: m.ListaDelPase })))
const HojaDosViajes = lazy(() => import('./HojaDosViajes').then((m) => ({ default: m.HojaDosViajes })))
const HojaInvitar = lazy(() => import('./HojaInvitar').then((m) => ({ default: m.HojaInvitar })))
const enCarga = (hoja: ReactNode) => <Suspense fallback={null}>{hoja}</Suspense>

/**
 * EL ANFITRIÓN DE LAS HOJAS DEL PASE (cuentas parte 3, punto 2). Siempre montado; con las cuentas apagadas no hace nada.
 *   · `abrirPase()` ya no pasa por aquí (Tanda 10I): lo escucha ListaDelPaseHost y abre la lista del pase, que lleva dentro la hoja «¿Cuántos sois?».
 *   · Al volver de la página de pago (`?pago=ok&sesion=…`) espera a que llegue el aviso del servicio de pago (el pase lo crea solo el servidor) y enseña P7 (compartir el pase) o «Ya tienes tu pase».
 *   · `?pago=mentira` es la página de pruebas del pago de mentira (solo existe fuera de producción).
 */
export function PagoHost() {
  if (!cuentasActivas()) return null
  return <PagoHostEncendido />
}

function PagoHostEncendido() {
  const hoja = usePagoStore((s) => s.hoja)
  const abrir = usePagoStore((s) => s.abrir)
  const cerrar = usePagoStore((s) => s.cerrar)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    const p = pagoDeLaDireccion(window.location.search)
    if (!p) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('pago')
      url.searchParams.delete('sesion')
      window.history.replaceState(null, '', url)
    } catch {
      /* sin historial: se queda como está */
    }
    if (p.resultado === 'ok' && p.sesion) abrir({ tipo: 'volviendo', sesion: p.sesion })
    else if (p.resultado === 'mentira' && p.sesion) abrir({ tipo: 'mentira', sesion: p.sesion })
    else if (p.resultado === 'cancelado') setAviso('No se ha hecho ningún cobro.')
  }, [abrir])

  usePreguntaDelPrimerDia()

  if (aviso && !hoja) {
    return (
      <Hoja onCerrar={() => setAviso(null)} titulo={aviso} datos="pago-cancelado" z={92}>
        <BotonHoja tipo="secundario" onClick={() => setAviso(null)}>
          Vale
        </BotonHoja>
      </Hoja>
    )
  }
  if (!hoja) return null
  if (hoja.tipo === 'compra') return enCarga(<ListaDelPase destino={hoja.destino} tripId={hoja.tripId} desde="compra" onCerrar={cerrar} />)
  if (hoja.tipo === 'invitar') return enCarga(<HojaInvitar modo={hoja.modo} destino={hoja.destino} tripId={hoja.tripId} pase={hoja.pase} codigoInicial={hoja.codigoInicial} onCerrar={cerrar} />)
  if (hoja.tipo === 'volviendo') return <VolviendoDelPago sesion={hoja.sesion} />
  if (hoja.tipo === 'mentira') return <PagoDeMentira sesion={hoja.sesion} />
  if (hoja.tipo === 'dosViajes') return enCarga(<HojaDosViajes modo={hoja.modo} destino={hoja.destino} actual={hoja.actual} otro={hoja.otro} etiquetaDia={hoja.etiquetaDia} elegir={dejarUnViaje} onCerrar={cerrar} />)
  return (
    <Hoja onCerrar={cerrar} etiqueta="Pase individual" titulo={<TextoConPase texto={`Ya tienes tu Pase de ${hoja.pase.destino}`} />} datos="pase-listo" z={92}>
      <BotonHoja tipo="oscuro" onClick={cerrar}>
        Seguir
      </BotonHoja>
    </Hoja>
  )
}

/** Deja un viaje y pasa el otro a «Viajes guardados» (sin borrarlo). Devuelve el error en palabras sencillas, o null. */
async function dejarUnViaje(_dejarId: string, guardarId: string): Promise<string | null> {
  const error = await guardarViajeAparte(guardarId)
  if (error) return error
  const { savedTrips, setSavedTrips } = useSyncStore.getState()
  if (savedTrips) setSavedTrips(savedTrips.map((v) => (v.id === guardarId ? { ...v, guardadoEn: new Date().toISOString() } : v)))
  return null
}

/**
 * P9: el primer día del viaje, si hay dos viajes al mismo destino que se pisan y no contestó al aviso de los 10 días, se le pregunta cuál hace. Una vez al día como mucho, solo con cobro
 * (sin cobro todo está abierto y no hay nada que decidir) y solo con el pase de ese destino.
 */
function usePreguntaDelPrimerDia() {
  const abrir = usePagoStore((s) => s.abrir)
  const savedTrips = useSyncStore((s) => s.savedTrips)
  useEffect(() => {
    if (!savedTrips || savedTrips.length < 2) return
    const parejas = parejasQueSePisan(savedTrips)
    if (parejas.length === 0) return
    let vivo = true
    void (async () => {
      const config = await configDelPase()
      if (!config.cobro || !vivo) return
      const pases = await misPases()
      const hoy = hoyEnLocal()
      for (const [a, b] of parejas) {
        const tienePase = pases.some((p) => p.estado === 'activo' && p.destino.toLowerCase() === a.destino.toLowerCase())
        if (!tienePase || hoy < a.inicio || hoy > (a.fin > b.fin ? a.fin : b.fin)) continue
        const clave = `trazo:p9:${a.id}:${b.id}:${hoy}`
        try {
          if (window.sessionStorage.getItem(clave)) continue
          window.sessionStorage.setItem(clave, '1')
        } catch {
          /* sin almacenamiento: se pregunta una vez por carga */
        }
        if (usePagoStore.getState().hoja == null) abrir({ tipo: 'dosViajes', modo: 'p9', destino: a.destino, actual: a, otro: b, etiquetaDia: `Hoy · ${etiquetaDelDia(hoy)}` })
        break
      }
    })()
    return () => {
      vivo = false
    }
  }, [savedTrips, abrir])
}

const hoyEnLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const etiquetaDelDia = (iso: string): string => formatShortDateEs(iso).replace(',', '').toLowerCase()

/** Al volver de la página de pago: se pregunta cada poco si el pase ya está (el aviso del servicio de pago puede tardar unos segundos). */
function VolviendoDelPago({ sesion }: { sesion: string }) {
  const abrir = usePagoStore((s) => s.abrir)
  const cerrar = usePagoStore((s) => s.cerrar)
  const [estado, setEstado] = useState<'esperando' | 'rechazado' | 'tarda'>('esperando')
  const intentos = useRef(0)

  useEffect(() => {
    let vivo = true
    const t = window.setInterval(async () => {
      intentos.current += 1
      const r = await estadoDelPago(sesion)
      if (!vivo) return
      if (r.listo && r.pase) {
        window.clearInterval(t)
        olvidarConfigDelPase()
        const destino = r.pase.destino
        if (r.pase.tipo === 'uno') abrir({ tipo: 'listo', pase: r.pase })
        else abrir({ tipo: 'invitar', modo: 'pase', destino, tripId: r.pase.viaje?.id ?? useSyncStore.getState().activeTripId, pase: r.pase })
      } else if (r.rechazado) {
        window.clearInterval(t)
        setEstado('rechazado')
      } else if (intentos.current >= 40) {
        window.clearInterval(t)
        setEstado('tarda')
      }
    }, 1500)
    return () => {
      vivo = false
      window.clearInterval(t)
    }
  }, [sesion, abrir])

  const titulo = estado === 'esperando' ? 'Estamos confirmando tu pago…' : estado === 'rechazado' ? 'El pago no se ha completado' : 'Tu pago está tardando más de lo normal'
  const texto = estado === 'esperando' ? 'Un momento, estamos confirmando el pago.' : estado === 'rechazado' ? 'No te hemos cobrado nada. Puedes volver a intentarlo.' : 'En cuanto llegue, tu pase aparecerá en Mis pases. Si te han cobrado, no hace falta que pagues otra vez.'
  return (
    <Hoja onCerrar={estado === 'esperando' ? undefined : cerrar} sinCerrar={estado === 'esperando'} titulo={titulo} datos="pago-volviendo" z={92}>
      <span data-pago-estado={estado} style={{ font: "400 13.5px/1.5 'Geist'", opacity: 0.75 }}>
        {texto}
      </span>
      {estado !== 'esperando' && (
        <BotonHoja tipo="oscuro" onClick={cerrar}>
          Entendido
        </BotonHoja>
      )}
    </Hoja>
  )
}

/** La página de pruebas del pago de mentira: [Pago bueno], [Pago rechazado] y [Pago devuelto], como lo haría el servicio de pago. Solo fuera de producción. */
function PagoDeMentira({ sesion }: { sesion: string }) {
  const abrir = usePagoStore((s) => s.abrir)
  const cerrar = usePagoStore((s) => s.cerrar)
  const [resultado, setResultado] = useState<string | null>(null)
  const resolver = async (r: 'bueno' | 'rechazado' | 'devuelto') => {
    const resp = await llamarServidor<{ accion?: string }>('/api/pago/mentira/resolver', { metodo: 'POST', cuerpo: { sesion, resultado: r }, sinCuenta: true })
    setResultado(`${r}: ${resp.datos?.accion ?? 'sin respuesta'}`)
    if (r === 'bueno' || r === 'rechazado') abrir({ tipo: 'volviendo', sesion })
  }
  return (
    <Hoja onCerrar={cerrar} etiqueta="Pago de mentira" titulo="Pruebas del cobro" datos="pago-mentira" z={93}>
      <span style={{ font: "400 13px/1.45 'Geist'", opacity: 0.7 }}>Solo para desarrollo: elige cómo termina este pago.</span>
      <BotonHoja tipo="principal" onClick={() => void resolver('bueno')} datos="mentira-bueno">
        Pago bueno
      </BotonHoja>
      <BotonHoja tipo="secundario" onClick={() => void resolver('rechazado')} datos="mentira-rechazado">
        Pago rechazado
      </BotonHoja>
      <BotonHoja tipo="secundario" onClick={() => void resolver('devuelto')} datos="mentira-devuelto">
        Pago devuelto
      </BotonHoja>
      {resultado && (
        <span data-mentira-resultado style={{ font: "500 12px 'Geist Mono',monospace", opacity: 0.7 }}>
          {resultado}
        </span>
      )}
    </Hoja>
  )
}
