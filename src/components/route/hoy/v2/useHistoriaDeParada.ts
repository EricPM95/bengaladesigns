import { useAudioDeHistoria } from '../../../../lib/escucharAudio'
import { accesoHistoria, textoHistoria, useFichaDeSitio } from '../../../../lib/historia'
import { useHistoriaDePrueba } from '../../../../lib/historiaDePrueba'
import { useEscuchar } from '../../../../lib/useEscuchar'
import { useGastarHistoriaAl3s } from '../../../../lib/useGastarHistoria'
import { pagoActivo } from '../../../../lib/pago'
import type { Stop } from '../../../../lib/types'

/**
 * LA HISTORIA DE UNA PARADA, para la tarjeta nueva de HOY (V2): lo mismo que `EscucharHistoria` (HoyDuranteV2.tsx: misma ficha, mismo audio, mismas reglas de pase y de historia de prueba)
 * pero como datos, para que la tarjeta pinte el icono de [Escuchar], la barrita con [Pausa] y la línea «Escucha su historia por el camino · 3 min» con UN solo estado de escucha.
 */
export interface HistoriaDeParada {
  /** ¿Se enseña algo? (sin historia, o sin voz y sin audio, no sale nada). */
  hay: boolean
  /** Sin el pase: el icono lleva un candado y al tocarlo se explica el pase. */
  candado: boolean
  estado: string
  /** Lo que dura leída, en minutos (150 palabras por minuto, mínimo 1). */
  minutos: number
  progreso: number
  escuchar: () => void
  pausar: () => void
  seguir: () => void
  parar: () => void
}

export function useHistoriaDeParada(destino: string, parada: Stop): HistoriaDeParada {
  const ficha = useFichaDeSitio(destino, parada.name)
  const audio = useAudioDeHistoria({ destino, nombre: parada.name })
  const texto = textoHistoria(ficha)
  const e = useEscuchar(texto, `${parada.id}:historia`, audio)
  useHistoriaDePrueba((s) => s.mapa)
  const acceso = accesoHistoria(ficha, pagoActivo(), { destino, nombre: parada.name })
  useGastarHistoriaAl3s(destino, parada.name, e.estado, acceso === 'prueba')
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length
  const hay = acceso !== 'ninguno' && texto.trim().length > 0 && (acceso === 'candado' || e.hayVoz)
  return { hay, candado: acceso === 'candado', estado: e.estado, minutos: Math.max(1, Math.round(palabras / 150)), progreso: (e as { progreso?: number }).progreso ?? 0, escuchar: e.escuchar, pausar: e.pausar, seguir: e.seguir, parar: e.parar }
}
