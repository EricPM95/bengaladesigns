import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { pagoActivo, usePagoActivo } from '../../lib/pago'
import { diasPuestosEnDuda } from '../../lib/diasEnDuda'
import { diasQueCambian, esDiaRecienReorganizado, reorganizarDias } from '../../lib/reorganizarDia'
import { useRouteStore } from '../../store/useRouteStore'
import { useReorganizarStore } from '../../store/useReorganizarStore'
import { useResumenVueloStore } from '../../store/useResumenVueloStore'
import { adaptarLosDias } from '../../lib/adaptarVuelos'
import { useFlotantes, useColumnaIzquierda, bottomDeLaFila, DERECHA_DE_LA_COLUMNA_IZQUIERDA } from '../flotantes/flotantes'
import { useBotonReorganizarVisible } from './useBotonReorganizarVisible'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { AvisoNoCabe } from './AvisoNoCabe'
import { IconoReorganizar } from './IconoReorganizar'
import { HojaDeReorganizar } from './HojaDeReorganizar'
import { cambiosDeReorganizar, cualDeTusDias, diasDespuesDeCambios, textoDeReorganizar } from '../../lib/tarjetasDePropuesta'
import type { Route } from '../../lib/types'
import type { PlanLlegada } from '../../lib/planLlegadaVuelta'

/**
 * EL BOTÓN «REORGANIZAR» DEL PASE (Tanda 10S7, apartado 2; `Piezas/Reorganizar` R1 a R3). Se monta una vez por pantalla del viaje, junto al botón de los logros:
 *
 *     <ReorganizarHost />
 *
 *  - VIGILA los cambios de la ruta (añadir o pasar una parada, la hora de una entrada o del Free Tour, los vuelos, la zona del alojamiento: `diasPuestosEnDuda`) y, con pase, CALCULA si reorganizar
 *    cambiaría algo en esos días. Solo si cambia, sale el botón flotante redondo, encima del de los logros (R1). Nada se reorganiza solo.
 *  - Al tocarlo, la alerta «¿Reorganizamos tu día?» (R2): [Reorganizar] hace el cambio en los días afectados (una franja «Hemos reorganizado tu día» con [Deshacer], R3, y lo movido se ilumina);
 *    [Ahora no] (o la ✕) cierra la alerta y el botón SE QUEDA (LZ3, Eric 4-nov) hasta que reorganices o el día deje de necesitarlo (p. ej. si quitas la parada que lo hizo salir).
 *  - Solo con pase y solo para quien puede editar la ruta. Si hay dos montados (DÍAS y HOY) solo trabaja el primero.
 */
const montados: string[] = []
const oyentes = new Set<() => void>()
function useSoyElPrimero(): boolean {
  const id = useId()
  const [, repintar] = useState(0)
  useEffect(() => {
    montados.push(id)
    const avisar = () => repintar((x) => x + 1)
    oyentes.add(avisar)
    oyentes.forEach((f) => f())
    return () => {
      montados.splice(montados.indexOf(id), 1)
      oyentes.delete(avisar)
      oyentes.forEach((f) => f())
    }
  }, [id])
  return montados[0] === id
}

/** La espera (ms) para juntar cambios seguidos (p. ej. guardar el vuelo toca la ida y la vuelta) antes de calcular. */
const JUNTAR_MS = 700

export function ReorganizarHost(): ReactNode {
  const primero = useSoyElPrimero()
  const visible = useBotonReorganizarVisible()
  const alerta = useReorganizarStore((s) => s.alerta)
  const trabajando = useReorganizarStore((s) => s.trabajando)
  const iluminadas = useReorganizarStore((s) => s.iluminadas)
  const vuelos = useReorganizarStore((s) => s.vuelos)
  const conPase = usePagoActivo()
  const hojaAbierta = useResumenVueloStore((s) => s.hoja !== null)
  const { debajo, alto } = useFlotantes()
  const modo = useRouteStore((s) => s.mode)
  const { puedeEditar } = usePermisosDelViaje()
  const mostrar = visible && primero
  const fila = useColumnaIzquierda('reorganizar', mostrar)

  // La vigilancia de los cambios (solo el primero montado, solo con pase y solo si se puede editar).
  useEffect(() => {
    if (!primero || !puedeEditar) return undefined
    let pendientes = new Set<string>()
    let reloj = 0
    const calcular = async () => {
      reloj = 0
      const ids = [...pendientes]
      pendientes = new Set()
      if (ids.length === 0 || !pagoActivo()) return
      // (V49) Un día que se acaba de reorganizar y no ha cambiado desde entonces no se vuelve a calcular: el botón no vuelve solo.
      const dias = useRouteStore.getState().route?.days ?? []
      const aCalcular = ids.filter((id) => !esDiaRecienReorganizado(dias.find((d) => d.id === id)))
      const cambian = await diasQueCambian(aCalcular)
      useReorganizarStore.getState().poner(cambian.map((c) => c.dayId), ids, cambian)
    }
    const anular = useRouteStore.subscribe((estado, previo) => {
      if (estado.route?.id !== previo.route?.id) {
        pendientes = new Set()
        useReorganizarStore.getState().reiniciar()
        return
      }
      if (estado.route === previo.route && estado.reservations === previo.reservations) return
      if (!pagoActivo()) return
      const dudosos = diasPuestosEnDuda({ route: previo.route, reservations: previo.reservations }, { route: estado.route, reservations: estado.reservations })
      // (LZ3) Un día que ya tiene el botón y al que se le QUITA una parada se vuelve a calcular: si ya no cambiaría nada, el botón se va.
      if (estado.route && previo.route) {
        const conBoton = useReorganizarStore.getState().dias
        for (const dayId of conBoton) {
          const antes = previo.route.days.find((day) => day.id === dayId)
          const ahora = estado.route.days.find((day) => day.id === dayId)
          if (!antes || !ahora) continue
          const siguen = new Set(ahora.stops.map((stop) => stop.id))
          if (antes.stops.some((stop) => !siguen.has(stop.id))) dudosos.push(dayId)
        }
      }
      if (dudosos.length === 0) return
      for (const id of dudosos) pendientes.add(id)
      window.clearTimeout(reloj)
      reloj = window.setTimeout(() => void calcular(), JUNTAR_MS)
    })
    return () => {
      anular()
      window.clearTimeout(reloj)
    }
  }, [primero, puedeEditar])

  // Lo movido se ilumina un momento (la marca de siempre de la parada que llega: `data-parada-marcada`).
  useEffect(() => {
    if (iluminadas.length === 0) return undefined
    const marcadas = new Set<Element>()
    let intentos = 0
    const poner = () => {
      for (const id of iluminadas) {
        for (const el of Array.from(document.querySelectorAll(`[data-stop-id="${id}"]`))) {
          if (marcadas.has(el)) continue
          marcadas.add(el)
          el.setAttribute('data-parada-marcada', '1')
        }
      }
      intentos++
    }
    poner()
    const repetir = window.setInterval(() => (intentos < 6 ? poner() : window.clearInterval(repetir)), 250)
    const quitar = window.setTimeout(() => {
      marcadas.forEach((el) => el.removeAttribute('data-parada-marcada'))
      useReorganizarStore.getState().limpiarIluminadas()
    }, 2600)
    return () => {
      window.clearInterval(repetir)
      window.clearTimeout(quitar)
      marcadas.forEach((el) => el.removeAttribute('data-parada-marcada'))
    }
  }, [iluminadas])

  const reorganizar = async () => {
    const store = useReorganizarStore.getState()
    if (store.trabajando) return
    store.fijarTrabajando(true)
    try {
      await reorganizarDias(store.dias)
    } finally {
      useReorganizarStore.getState().terminar()
    }
  }

  if (!primero) return null
  return (
    <>
      {mostrar && (
        <button
          type="button"
          data-boton-reorganizar="1"
          aria-label="Reorganizar tu día"
          onClick={() => useReorganizarStore.getState().abrirAlerta()}
          className="hoja-pop"
          data-flotante="1"
      data-flotante-izq="1"
          style={{
            position: 'fixed',
            right: DERECHA_DE_LA_COLUMNA_IZQUIERDA,
            bottom: bottomDeLaFila(fila, alto, modo),
            width: 44,
            height: 44,
            padding: 0,
            borderRadius: '50%',
            background: '#1C2230',
            border: '1.5px solid #B58A2E',
            boxShadow: '0 10px 20px -8px rgba(0,0,0,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: debajo ? 31 : 100,
          }}
        >
          <IconoReorganizar />
        </button>
      )}
      {primero && puedeEditar && conPase && vuelos && !hojaAbierta && <AlertaAdaptarVuelos />}
      {primero && puedeEditar && conPase && <AvisoNoCabe />}
      {mostrar && alerta && <AlertaReorganizar trabajando={trabajando} onReorganizar={() => void reorganizar()} />}
    </>
  )
}

/** Lo que dice el texto de arriba de la hoja: la llegada y la vuelta del viaje (si hay vuelo y el día que cambia es el primero o el último). */
function datosDeVuelo(route: Route, dayIds: string[], planLlegada?: PlanLlegada | null): { llegada: string | null; libreMin: number | null; salida: string | null; vuelo: boolean } {
  const ciudad = route.days.filter((d) => !d.isReturnLeg)
  const primero = ciudad[0]?.id
  const ultimos = new Set([ciudad[ciudad.length - 1]?.id, route.days.find((d) => d.isReturnLeg)?.id])
  const conLlegada = Boolean(route.arrivalFlightTime) && dayIds.includes(primero ?? '')
  const conSalida = Boolean(route.departureFlightTime) && dayIds.some((id) => ultimos.has(id))
  const plan = planLlegada ?? route.planLlegada ?? null
  const libre = (plan?.interno as { horaUtilMin?: number } | undefined)?.horaUtilMin
  return { llegada: conLlegada ? (route.arrivalFlightTime ?? null) : null, libreMin: conLlegada && typeof libre === 'number' ? libre : null, salida: conSalida ? (route.departureFlightTime ?? null) : null, vuelo: conLlegada || conSalida }
}

/**
 * La alerta «¿Reorganizamos tu día?» (RO1) / «¿Reorganizamos tus días?» (RO2): `HojaDeReorganizar` (V61), con una tarjeta por cada sitio que cambia de verdad y la franja verde concreta. [Dejarlo como está] deja el botón redondo.
 */
function AlertaReorganizar({ trabajando, onReorganizar }: { trabajando: boolean; onReorganizar: () => void }): ReactNode {
  const ahoraNo = () => useReorganizarStore.getState().ahoraNo()
  const route = useRouteStore((s) => s.route)
  const dias = useReorganizarStore((s) => s.dias)
  const cambios = useReorganizarStore((s) => s.cambios)
  // Lo que cambiaría en cada día ya viene calculado de vigilar la ruta; si falta alguno (llegó por otro camino), se calcula al abrir.
  const faltan = dias.filter((id) => !cambios.some((c) => c.dayId === id))
  useEffect(() => {
    if (faltan.length === 0) return
    let vivo = true
    void diasQueCambian(faltan).then((nuevos) => vivo && useReorganizarStore.getState().sumarCambios(nuevos))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltan.join('|')])
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useReorganizarStore.getState().trabajando) useReorganizarStore.getState().ahoraNo()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])
  const mias = cambios.filter((c) => dias.includes(c.dayId))
  const resumen = useMemo(() => (route ? cambiosDeReorganizar(diasDespuesDeCambios(mias, route), route) : null), [route, mias]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!route || !resumen) return null
  const v = datosDeVuelo(route, dias)
  const texto = textoDeReorganizar({ ...v, dias: dias.length, cual: cualDeTusDias(route, dias[0]), conTarjetas: resumen.total > 0 })
  return <HojaDeReorganizar id="reorganizar" titulo={dias.length > 1 ? '¿Reorganizamos tus días?' : '¿Reorganizamos tu día?'} texto={texto} cambios={resumen} botonSi={dias.length > 1 ? 'Reorganizar mis días' : 'Reorganizar mi día'} trabajando={trabajando} onSi={onReorganizar} onNo={ahoraNo} />
}

/**
 * (V61, RO3) «¿Adaptamos tus días a tu vuelo?»: sale DIRECTAMENTE al guardar o cambiar el vuelo, con pase, solo a quien lo cambió y solo si adaptar esos días cambiaría algo. [Reorganizar mi día] pone esos días
 * adaptados (franja «Hemos adaptado tus días a tus vuelos» con [Deshacer]) y no deja botón flotante; [Dejarlo como está] no cambia nada y deja el botón «Reorganizar» en esos días.
 */
function AlertaAdaptarVuelos(): ReactNode {
  const propuesta = useReorganizarStore((s) => s.vuelos)
  const route = useRouteStore((s) => s.route)
  const ahoraNo = () => {
    const p = useReorganizarStore.getState().vuelos
    useReorganizarStore.getState().cerrarVuelos()
    if (p) {
      const ids = p.dias.map((dia) => dia.dayId)
      useReorganizarStore.getState().poner(ids, ids)
    }
  }
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ahoraNo()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])
  const resumen = useMemo(() => (route && propuesta ? cambiosDeReorganizar(propuesta.dias.map((d) => ({ dayId: d.dayId, despues: d.next })), route) : null), [route, propuesta])
  if (!route || !propuesta || !resumen) return null
  const ids = propuesta.dias.map((d) => d.dayId)
  const texto = textoDeReorganizar({ ...datosDeVuelo(route, ids, propuesta.planes.llegada), dias: ids.length, cual: cualDeTusDias(route, ids[0]), conTarjetas: resumen.total > 0 })
  return <HojaDeReorganizar id="adaptar-vuelos" titulo="¿Adaptamos tus días a tu vuelo?" texto={texto} cambios={resumen} botonSi={ids.length > 1 ? 'Reorganizar mis días' : 'Reorganizar mi día'} onSi={() => void adaptarLosDias()} onNo={ahoraNo} />
}
