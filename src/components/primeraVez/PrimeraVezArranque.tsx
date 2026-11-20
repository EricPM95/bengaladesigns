import { useEffect, useRef, type ReactNode } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { debeEnseñarPreguntas, pedirEstadoPrimeraVez, usePrimeraVezUi } from '../../lib/primeraVez'
import { useRouteStore } from '../../store/useRouteStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { useSyncStore } from '../../store/useSyncStore'
import { useCuenta } from '../cuenta/useCuenta'
import { PerfilSheet } from '../layout/PerfilSheet'
import { PreguntasPrimeraVez } from './PreguntasPrimeraVez'

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
  const sinViajes = (viajes ?? []).length === 0 && !idActivo && !ruta

  useEffect(() => {
    if (comprobado.current || !cargaHecha || cuenta.tipo !== 'cuenta' || !cuentasActivas()) return
    // Con viajes (o con uno abierto) no se mira nada más: no se vuelve a comprobar en esta sesión.
    if (!sinViajes) {
      comprobado.current = true
      return
    }
    comprobado.current = true
    void pedirEstadoPrimeraVez().then((e) => {
      if (!e) return
      if (debeEnseñarPreguntas({ nuevo: true, hecho: e.hecho })) usePrimeraVezUi.getState().abrirPreguntas()
      // Ya contestó (o saltó) y sigue sin viajes: el Perfil con el mapa es su casa (desde la pantalla de crear viaje no hay otra puerta).
      else usePerfilUi.getState().abrir()
    })
  }, [cargaHecha, cuenta.tipo, sinViajes])

  const perfilAbierto = usePerfilUi((s) => s.abierto)
  return (
    <>
      {/* Sin ningún viaje no hay cabecera (que es donde vive el Perfil): aquí se monta el Perfil del viajero nuevo. Con un viaje abierto lo monta la cabecera de siempre. */}
      {!ruta && <PerfilSheet open={perfilAbierto} onClose={() => usePerfilUi.getState().cerrar()} />}
      {preguntas && (
        <PreguntasPrimeraVez
          onTerminar={() => {
            usePrimeraVezUi.getState().cerrarPreguntas()
            usePerfilUi.getState().abrir()
          }}
        />
      )}
    </>
  )
}
