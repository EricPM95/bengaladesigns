import { useEffect, useState } from 'react'
import type { Escucha, EstadoEscucha } from './useEscuchar'

/**
 * El audio guardado de una historia (Tanda 6y9). «Escuchar historia» reproduce este audio si existe; si no, la voz del aparato (lo decide `useEscuchar`, un solo sitio).
 * Aquí: preguntar al servidor si ese sitio tiene audio y el control de reproducción, con la misma forma que el de la voz del aparato (hablar, pausar, seguir, parar).
 */

/** Lo mínimo que se usa de un `HTMLAudioElement` (así se puede simular en las pruebas). */
export interface AudioLike {
  play: () => Promise<void> | void
  pause: () => void
  currentTime: number
  duration: number
  onended: ((e?: unknown) => void) | null
  onerror: ((e?: unknown) => void) | null
  ontimeupdate: ((e?: unknown) => void) | null
}

/** La ruta del audio de ese sitio, o null si no tiene (o si el servidor no contesta: entonces suena la voz del aparato). Se recuerda mientras la app esté abierta. */
const respuestas = new Map<string, Promise<string | null>>()
const conocidas = new Map<string, string | null>()

const claveDeSitio = (destino: string, nombre: string) => `${destino.trim().toLowerCase()}:${nombre.trim().toLowerCase()}`

export function audioEnMemoria(destino: string, nombre: string): string | null {
  return conocidas.get(claveDeSitio(destino, nombre)) ?? null
}

export function pedirAudioDeHistoria(destino: string, nombre: string): Promise<string | null> {
  const clave = claveDeSitio(destino, nombre)
  const ya = respuestas.get(clave)
  if (ya) return ya
  const peticion = (async () => {
    try {
      const respuesta = await fetch('/api/historia-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: destino, name: nombre }) })
      if (!respuesta.ok) throw new Error(String(respuesta.status))
      const datos = await respuesta.json()
      const audio = typeof datos?.audio === 'string' && datos.audio.startsWith('/audios/') ? (datos.audio as string) : null
      conocidas.set(clave, audio)
      return audio
    } catch {
      // Sin red o sin servidor: no se recuerda el fallo, se reintenta la próxima vez. Mientras, suena la voz del aparato.
      respuestas.delete(clave)
      return null
    }
  })()
  respuestas.set(clave, peticion)
  return peticion
}

/** La ruta del audio guardado de la historia de un sitio (null mientras llega la respuesta o si no hay). `sitio` vacío: no pregunta nada. */
export function useAudioDeHistoria(sitio?: { destino: string; nombre: string } | null): string | null {
  const destino = sitio?.destino
  const nombre = sitio?.nombre
  const [audio, setAudio] = useState<string | null>(() => (destino && nombre ? audioEnMemoria(destino, nombre) : null))
  useEffect(() => {
    if (!destino || !nombre) {
      setAudio(null)
      return
    }
    let cancelado = false
    setAudio(audioEnMemoria(destino, nombre))
    pedirAudioDeHistoria(destino, nombre).then((ruta) => {
      if (!cancelado) setAudio(ruta)
    })
    return () => {
      cancelado = true
    }
  }, [destino, nombre])
  return audio
}

/**
 * El control de la reproducción de un audio guardado, con la misma forma que `crearEscucha` (la de la voz del aparato).
 * Si el audio no se puede reproducir (fichero que falta, red caída, el navegador no deja), llama a `alFallar` y no cambia el estado: quien lo usa sigue con la voz del aparato.
 */
export function crearEscuchaAudio(audio: AudioLike, alCambiar: (estado: EstadoEscucha) => void, alAvanzar: ((hechos: number, total: number) => void) | undefined, alFallar: () => void): Escucha {
  let estado: EstadoEscucha = 'parado'
  let numero = 0
  const poner = (nuevo: EstadoEscucha) => {
    if (estado === nuevo) return
    estado = nuevo
    alCambiar(nuevo)
  }
  const fallar = (mio: number) => {
    if (mio !== numero) return
    numero++
    audio.pause()
    poner('parado')
    alFallar()
  }
  return {
    hablar() {
      const mio = ++numero
      audio.currentTime = 0
      audio.onended = () => {
        if (mio !== numero) return
        alAvanzar?.(1, 1)
        poner('parado')
      }
      audio.onerror = () => fallar(mio)
      audio.ontimeupdate = () => {
        if (mio === numero && audio.duration > 0) alAvanzar?.(audio.currentTime, audio.duration)
      }
      poner('hablando')
      alAvanzar?.(0, 1)
      try {
        Promise.resolve(audio.play()).catch(() => fallar(mio))
      } catch {
        fallar(mio)
      }
    },
    pausar() {
      if (estado !== 'hablando') return
      audio.pause()
      poner('pausa')
    },
    seguir() {
      if (estado !== 'pausa') return
      poner('hablando')
      try {
        Promise.resolve(audio.play()).catch(() => fallar(numero))
      } catch {
        fallar(numero)
      }
    },
    parar() {
      if (estado === 'parado') return
      numero++
      audio.pause()
      audio.currentTime = 0
      poner('parado')
    },
    estado: () => estado,
  }
}
