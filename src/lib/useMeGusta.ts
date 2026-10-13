import { useEffect } from 'react'
import { totalDe, claveDeDestino, useMeGustaStore } from '../store/useMeGustaStore'
import { numeroDeRecomendaciones } from './recomendaciones'

/** El nombre con el que un sitio lleva su cuenta: el de las paradas de noche («Coliseo (noche)») cuenta en el sitio de día. */
export const nombreDeCuenta = (nombre: string) => nombre.replace(/\s*\(noche\)\s*$/i, '').trim()

/**
 * El «me gusta» de UN sitio, leído de la cuenta única (`useMeGustaStore`): lo usan el corazón de la ficha y el de EXPLORAR, así que no pueden enseñar cosas distintas.
 * `enCatalogo` = el sitio es del catálogo del destino (los de Mapbox, el Free Tour o un destino sin datos no llevan corazón).
 */
export function useMeGusta(destino: string | null | undefined, nombre: string | null | undefined) {
  const cuenta = useMeGustaStore((state) => (destino ? state.cuentas[claveDeDestino(destino)] : undefined))
  useEffect(() => {
    if (destino) void useMeGustaStore.getState().cargar(destino)
  }, [destino])
  const clave = nombre ? nombreDeCuenta(nombre) : ''
  const enCatalogo = Boolean(cuenta?.cargada && clave in cuenta.inicial)
  const total = enCatalogo ? totalDe(cuenta, clave) : 0
  return {
    enCatalogo,
    cargada: Boolean(cuenta?.cargada),
    /** La cuenta del sitio: partida + viajeros. */
    total,
    /** El número que se enseña (null mientras no llegue a 20: entonces solo el corazón). */
    mostrado: enCatalogo ? numeroDeRecomendaciones(total) : null,
    /** ¿Este viajero le ha dado «me gusta»? */
    marcado: Boolean(cuenta?.mios.includes(clave)),
    alternar: () => {
      if (destino && clave) void useMeGustaStore.getState().alternar(destino, clave)
    },
  }
}
