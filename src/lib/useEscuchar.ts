import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * «Escuchar» (Tanda 6z6, de pago): la ficha de una parada en voz alta con la síntesis de voz del propio navegador (`speechSynthesis`). Sin coste y sin mandar nada fuera: solo se lee nuestro texto del «Resumen».
 * La lógica de «¿hay voz en español?» y de elegir la voz son funciones puras (se prueban con un `speechSynthesis` simulado); `crearEscucha` es el control sin React (hablar, pausar, seguir, parar), y `useEscuchar` lo lleva a un componente.
 */

/** Lo mínimo que se mira de una voz del navegador. */
export interface VozLike {
  lang: string
  name?: string
}

/** El idioma de una voz sin importar cómo lo escriba el sistema (`es-ES`, `es_ES`, `ES`): en minúsculas y con guion. */
const idioma = (voz: VozLike) => String(voz.lang ?? '').toLowerCase().replace('_', '-')

/** Las voces en español (cualquier `es`, `es-ES`, `es-MX`…). */
export function vocesEnEspañol<T extends VozLike>(voces: readonly T[]): T[] {
  return voces.filter((voz) => /^es(-|$)/.test(idioma(voz)))
}

/** ¿Hay alguna voz en español? Sin ella el botón «Escuchar» no sale. */
export const hayVozEnEspañol = (voces: readonly VozLike[]): boolean => vocesEnEspañol(voces).length > 0

/** La voz a usar: español de España (`es-ES`) si la hay; si no, cualquier voz en español; si no, ninguna. */
export function elegirVoz<T extends VozLike>(voces: readonly T[]): T | null {
  const españolas = vocesEnEspañol(voces)
  return españolas.find((voz) => idioma(voz) === 'es-es') ?? españolas[0] ?? null
}

/**
 * Parte el texto en trozos de frases (hasta ~220 letras): los navegadores cortan a mitad un texto largo de una sola vez (sobre todo Chrome), y así cada trozo es corto.
 */
export function trocearTexto(texto: string, maximo = 220): string[] {
  const frases = texto.replace(/\s+/g, ' ').trim().match(/[^.!?…;:]+[.!?…;:]*\s*/g) ?? []
  const trozos: string[] = []
  let actual = ''
  for (const frase of frases) {
    if (actual && (actual + frase).length > maximo) {
      trozos.push(actual.trim())
      actual = ''
    }
    actual += frase
    // Una frase sola más larga que el máximo se corta por comas o, en último caso, por palabras.
    while (actual.length > maximo) {
      const corte = actual.lastIndexOf(',', maximo) > 40 ? actual.lastIndexOf(',', maximo) + 1 : actual.lastIndexOf(' ', maximo) > 0 ? actual.lastIndexOf(' ', maximo) : maximo
      trozos.push(actual.slice(0, corte).trim())
      actual = actual.slice(corte)
    }
  }
  if (actual.trim()) trozos.push(actual.trim())
  return trozos
}

/** Junta las partes de texto del «Resumen» (las que existan) en un solo texto para leer, sin emojis, sin flechas y con un punto al final de cada parte. */
export function textoParaEscuchar(partes: readonly (string | null | undefined | false)[]): string {
  return partes
    .filter((parte): parte is string => typeof parte === 'string' && parte.trim().length > 0)
    .map((parte) => parte.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s*[→←↑↓·•]\s*/g, ', ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((parte) => (/[.!?…]$/.test(parte) ? parte : `${parte}.`))
    .join(' ')
}

/**
 * El texto del «Resumen» de una parada, el mismo orden que en la ficha: el «por qué aquí» (o el motivo de la segunda visita), la descripción, «Qué vas a ver» y «Por qué te lo recomendamos».
 * Sin `extra` (HOY, que no carga la ficha entera): el «por qué» y la descripción que la propia parada ya lleva.
 */
export function textoResumenDeParada(
  stop: { why?: string | null; isRevisit?: boolean; revisitReason?: string | null; description?: string | null },
  extra?: { descripcion?: string | null; queVerás?: readonly string[]; porQue?: string | null },
): string {
  const principal = stop.isRevisit && stop.revisitReason ? stop.revisitReason : stop.why
  const queVerás = extra?.queVerás && extra.queVerás.length > 0 ? `Qué vas a ver. ${extra.queVerás.join('. ')}` : null
  return textoParaEscuchar(extra ? [principal, extra.descripcion, queVerás, extra.porQue ? `Por qué te lo recomendamos. ${extra.porQue}` : null] : [principal, stop.description !== principal ? stop.description : null])
}

// ── El control sin React ──────────────────────────────────────────────────────────────

/** Lo que se usa de `window.speechSynthesis` (lo demás no hace falta; así se puede simular en las pruebas). */
export interface SintesisLike {
  speak: (enunciado: any) => void
  cancel: () => void
  pause: () => void
  resume: () => void
  getVoices: () => VozLike[]
  addEventListener?: (tipo: string, escucha: () => void) => void
  removeEventListener?: (tipo: string, escucha: () => void) => void
}

export type EstadoEscucha = 'parado' | 'hablando' | 'pausa'

export interface Escucha {
  hablar: (texto: string, voz: VozLike | null) => void
  pausar: () => void
  seguir: () => void
  /** Para la lectura (cancel). Si esta escucha no estaba hablando, no toca nada. */
  parar: () => void
  estado: () => EstadoEscucha
}

/** El control de una lectura. `crearEnunciado` fabrica el `SpeechSynthesisUtterance` (en el navegador, el de verdad). */
export function crearEscucha(sintesis: SintesisLike, crearEnunciado: (texto: string) => any, alCambiar: (estado: EstadoEscucha) => void): Escucha {
  let estado: EstadoEscucha = 'parado'
  // Cada lectura tiene su número: lo que avisen las lecturas anteriores (que se cancelan) ya no cuenta.
  let numero = 0
  const poner = (nuevo: EstadoEscucha) => {
    if (estado === nuevo) return
    estado = nuevo
    alCambiar(nuevo)
  }
  return {
    hablar(texto, voz) {
      const trozos = trocearTexto(texto)
      if (trozos.length === 0) return
      sintesis.cancel()
      const mio = ++numero
      poner('hablando')
      trozos.forEach((trozo, indice) => {
        const enunciado = crearEnunciado(trozo)
        if (voz) {
          enunciado.voice = voz
          enunciado.lang = voz.lang
        } else enunciado.lang = 'es-ES'
        const fin = () => {
          if (mio === numero && indice === trozos.length - 1) poner('parado')
        }
        enunciado.onend = fin
        enunciado.onerror = fin
        sintesis.speak(enunciado)
      })
    },
    pausar() {
      if (estado !== 'hablando') return
      sintesis.pause()
      poner('pausa')
    },
    seguir() {
      if (estado !== 'pausa') return
      sintesis.resume()
      poner('hablando')
    },
    parar() {
      if (estado === 'parado') return
      numero++
      sintesis.cancel()
      poner('parado')
    },
    estado: () => estado,
  }
}

// ── El hook ───────────────────────────────────────────────────────────────────────────

/** La síntesis del navegador, si la hay. */
export function sintesisDelNavegador(): SintesisLike | null {
  const ventana = typeof window === 'undefined' ? undefined : (window as unknown as { speechSynthesis?: SintesisLike })
  return ventana?.speechSynthesis ?? null
}

/** La voz en español que se usará, o null si el aparato no tiene ninguna. Las voces cargan tarde en muchos navegadores: se vuelve a mirar cuando avisan (`voiceschanged`). */
export function useVozEnEspañol(): VozLike | null {
  const [voz, setVoz] = useState<VozLike | null>(() => elegirVoz(sintesisDelNavegador()?.getVoices() ?? []))
  useEffect(() => {
    const sintesis = sintesisDelNavegador()
    if (!sintesis) return
    const mirar = () => setVoz(elegirVoz(sintesis.getVoices()))
    mirar()
    sintesis.addEventListener?.('voiceschanged', mirar)
    return () => sintesis.removeEventListener?.('voiceschanged', mirar)
  }, [])
  return voz
}

/**
 * Leer en voz alta `texto`. `clave` identifica lo que se lee (el id de la parada): si cambia, la lectura se para. También se para al desmontar (cambio de pantalla).
 */
export function useEscuchar(texto: string, clave: string) {
  const voz = useVozEnEspañol()
  const [estado, setEstado] = useState<EstadoEscucha>('parado')
  const escuchaRef = useRef<Escucha | null>(null)

  const escucha = useCallback((): Escucha | null => {
    if (escuchaRef.current) return escuchaRef.current
    const sintesis = sintesisDelNavegador()
    if (!sintesis) return null
    escuchaRef.current = crearEscucha(sintesis, (trozo) => new SpeechSynthesisUtterance(trozo), setEstado)
    return escuchaRef.current
  }, [])

  // Al cambiar de parada y al desmontar (cambiar de pantalla), la lectura se corta.
  useEffect(() => {
    return () => {
      escuchaRef.current?.parar()
      escuchaRef.current = null
    }
  }, [clave])

  return {
    hayVoz: voz !== null,
    estado,
    escuchar: () => escucha()?.hablar(texto, voz),
    pausar: () => escucha()?.pausar(),
    seguir: () => escucha()?.seguir(),
    parar: () => escucha()?.parar(),
  }
}
