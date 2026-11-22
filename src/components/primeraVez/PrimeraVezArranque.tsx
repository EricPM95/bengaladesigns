import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { LogoJutrip } from '../ui/LogoJutrip'
import { debeEnseñarPreguntas, pedirEstadoPrimeraVez, usePrimeraVezUi } from '../../lib/primeraVez'
import { avisarDeUsoUnaVezAlDia } from '../../lib/usoDiario'
import { useRouteStore } from '../../store/useRouteStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { useSyncStore } from '../../store/useSyncStore'
import { useCuenta } from '../cuenta/useCuenta'
// (Cada una en su archivo: no pesan al abrir la app; solo se bajan cuando hacen falta.)
const PerfilSheet = lazy(() => import('../layout/PerfilSheet').then((m) => ({ default: m.PerfilSheet })))
const PreguntasPrimeraVez = lazy(() => import('./PreguntasPrimeraVez').then((m) => ({ default: m.PreguntasPrimeraVez })))

/** (V34) La cortina neutra: el logo sobre el marfil de la marca, por encima de la app y por debajo del Perfil (z 70) y de las preguntas (z 90). */
function Cortina(): ReactNode {
  return (
    <div data-cortina-primera-vez role="status" aria-label="Cargando" className="fixed inset-0 z-[65] flex flex-col items-center justify-center bg-bg">
      <LogoJutrip tam={44} tono="claro" />
    </div>
  )
}

/**
 * (V31) LA PRIMERA VEZ al abrir la app: solo para el viajero NUEVO (una cuenta, no anónima, sin ningún viaje, ni propio ni compartido). Cuando ya se sabe que no tiene viajes, se pregunta al servidor si ya contestó (o saltó) las
 * preguntas; si no, salen UNA vez y, al acabar la última, directo al Perfil (con el mapa). Si el servidor no contesta (sin red, migración sin aplicar), no sale nada y la app sigue como siempre. Quien ya tiene viajes no ve nada nuevo.
 */
export function PrimeraVezArranque(): ReactNode {
  const cuenta = useCuenta()
  const cargaHecha = useSyncStore((s) => s.cargaInicialHecha)
  const viajes = useSyncStore((s) => s.savedTrips)
  const idActivo = useSyncStore((s) => s.activeTripId)
  const ruta = useRouteStore((s) => s.route)
  const preguntas = usePrimeraVezUi((s) => s.preguntas)
  const comprobado = useRef(false)
  // (V34) `decidido`: ya se sabe adónde llevar a la persona (preguntas, Perfil o la pantalla de crear viaje de siempre). Hasta entonces, una cortina neutra (nunca se ve la pantalla de ORIGEN/DESTINO un segundo).
  const [decidido, setDecidido] = useState(false)
  const sinViajes = (viajes ?? []).length === 0 && !idActivo && !ruta
  const decidiendo = !decidido && cargaHecha && cuenta.tipo === 'cuenta' && cuentasActivas() && sinViajes

  useEffect(() => {
    if (comprobado.current || !cargaHecha || cuenta.tipo !== 'cuenta' || !cuentasActivas()) return
    // Con viajes (o con uno abierto) no se mira nada más: no se vuelve a comprobar en esta sesión.
    if (!sinViajes) {
      comprobado.current = true
      return
    }
    comprobado.current = true
    // Tope de seguridad: si el servidor no contesta, la cortina se quita a los 6 s y la app sigue como siempre.
    const tope = window.setTimeout(() => setDecidido(true), 6000)
    void pedirEstadoPrimeraVez()
      .then((e) => {
        if (!e) return
        if (debeEnseñarPreguntas({ nuevo: true, hecho: e.hecho })) usePrimeraVezUi.getState().abrirPreguntas(e.suenos_disponibles)
        // Ya contestó (o saltó) y sigue sin viajes: el Perfil con el mapa es su casa (desde la pantalla de crear viaje no hay otra puerta).
        else usePerfilUi.getState().abrir()
      })
      .finally(() => {
        window.clearTimeout(tope)
        setDecidido(true)
      })
  }, [cargaHecha, cuenta.tipo, sinViajes])

  // (V35B) Una vez al día, la app avisa de que esta cuenta ha estado activa (aparato e instalada; sin IP ni ubicación). Solo cuentas de verdad.
  useEffect(() => {
    if (cuenta.tipo !== 'cuenta' || !cuentasActivas()) return
    void avisarDeUsoUnaVezAlDia()
  }, [cuenta.tipo])

  const perfilAbierto = usePerfilUi((s) => s.abierto)
  return (
    <>
      {decidiendo && <Cortina />}
      {/* Sin ningún viaje no hay cabecera (que es donde vive el Perfil): aquí se monta el Perfil del viajero nuevo. Con un viaje abierto lo monta la cabecera de siempre. */}
      {!ruta && perfilAbierto && (
        <Suspense fallback={<Cortina />}>
          <PerfilSheet open onClose={() => usePerfilUi.getState().cerrar()} />
        </Suspense>
      )}
      {preguntas && (
        <Suspense fallback={<Cortina />}>
          <PreguntasPrimeraVez
            onTerminar={() => {
              usePrimeraVezUi.getState().cerrarPreguntas()
              usePerfilUi.getState().abrir()
            }}
          />
        </Suspense>
      )}
    </>
  )
}
