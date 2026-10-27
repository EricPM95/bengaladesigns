import { sonidoActivado } from './sonidos'

/**
 * LA MÚSICA DE FONDO DE LA PELÍCULA DEL PASE (Tanda 10N6 §1i). El archivo lo pone Eric: `public/sonidos/pelicula_pase.mp3` (pista con licencia; nunca se descarga ni se inventa aquí).
 *  - SIN el archivo, todo sigue funcionando: se comprueba antes de montar el audio (la web de desarrollo devuelve la página de inicio para lo que no existe, por eso se mira el tipo), no hay error ni petición rota
 *    (una sola comprobación HEAD, y el botón de silencio ni sale).
 *  - Volumen bajo, con fundido de entrada y de salida; si la pista es más corta que la película se repite y baja al final de cada vuelta, sin corte seco.
 *  - No se corta al cambiar de escena ni con [Saltar]; al cerrar la película baja y se para; si la app pasa a segundo plano o se bloquea el móvil, se para (y sigue al volver, si sigue abierta).
 *  - El botón de silencio recuerda lo elegido (`trazo:pelicula_musica`). Con el ajuste «Sonido de los momentos» apagado, no suena nada.
 *  - Para comprimirla (ffmpeg, a ~96 kbps, menos de 1 MB): `scripts/destino/comprimirMusicaPelicula.sh`.
 */
export const URL_MUSICA_PELICULA = '/sonidos/pelicula_pase.mp3'
const CLAVE_SILENCIO = 'trazo:pelicula_musica'
const VOLUMEN = 0.22
const FUNDIDO_S = 1.6

let existe: Promise<boolean> | null = null
/** ¿Está el archivo? Una sola comprobación por sesión; lo que no sea audio (la página de inicio que devuelve el servidor de desarrollo) cuenta como «no está». */
export function hayMusicaDeLaPelicula(): Promise<boolean> {
  if (!existe) {
    existe = fetch(URL_MUSICA_PELICULA, { method: 'HEAD', cache: 'no-cache' })
      .then((r) => r.ok && /audio|mpeg|octet-stream/i.test(r.headers.get('content-type') ?? ''))
      .catch(() => false)
  }
  return existe
}

export function musicaSilenciada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_SILENCIO) === 'no'
  } catch {
    return false
  }
}
export function guardarMusicaSilenciada(silenciada: boolean): void {
  try {
    window.localStorage.setItem(CLAVE_SILENCIO, silenciada ? 'no' : 'si')
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}

/** El volumen que toca en este momento de la pista: sube al principio y baja al final de cada vuelta (pura, para las pruebas). */
export function volumenEnLaPista(t: number, duracion: number, base = VOLUMEN): number {
  if (!isFinite(duracion) || duracion <= 0) return base * Math.min(1, t / FUNDIDO_S)
  const f = Math.min(FUNDIDO_S, duracion / 3)
  return base * Math.max(0, Math.min(1, t / f, (duracion - t) / f))
}

export interface MusicaPelicula {
  /** Empieza (o sigue) a sonar con fundido de entrada. Solo funciona tras un toque del viajero; si no puede sonar, no pasa nada. */
  empezar: () => void
  /** Baja y para (al cerrar la película). */
  parar: () => void
  /** Silencia o no, con fundido. */
  silenciar: (silenciada: boolean) => void
  /** Suelta todo (sin fundido si hace falta). */
  soltar: () => void
}

export function crearMusicaDeLaPelicula(): MusicaPelicula {
  let audio: HTMLAudioElement | null = null
  let quiere = false // la película está abierta y la música debe sonar
  let silenciada = musicaSilenciada()
  let temporizador: number | null = null
  let salida: { desde: number; t0: number; alFinal: () => void } | null = null
  let escalaMute = silenciada ? 0 : 1 // 0..1, para el fundido del silencio
  let objetivoMute = escalaMute

  const hayQueSonar = () => quiere && !silenciada && sonidoActivado() && !document.hidden

  const crear = (): HTMLAudioElement => {
    if (audio) return audio
    const a = new Audio(URL_MUSICA_PELICULA)
    a.loop = true
    a.preload = 'auto'
    a.volume = 0
    audio = a
    return a
  }

  const paso = () => {
    const a = audio
    if (!a) return
    let v = volumenEnLaPista(a.currentTime, a.duration)
    escalaMute += (objetivoMute - escalaMute) * 0.18
    if (Math.abs(objetivoMute - escalaMute) < 0.01) escalaMute = objetivoMute
    v *= escalaMute
    if (salida) {
      const k = Math.max(0, 1 - (Date.now() - salida.t0) / 700)
      v *= k
      if (k <= 0) {
        const f = salida.alFinal
        salida = null
        f()
        return
      }
    }
    try {
      a.volume = Math.max(0, Math.min(1, v))
    } catch {
      /* algunos navegadores no dejan cambiar el volumen */
    }
  }
  const arrancarReloj = () => {
    if (temporizador == null) temporizador = window.setInterval(paso, 60)
  }
  const pararReloj = () => {
    if (temporizador != null) window.clearInterval(temporizador)
    temporizador = null
  }
  const pausa = () => {
    pararReloj()
    try {
      audio?.pause()
    } catch {
      /* nada */
    }
  }
  const sonar = () => {
    if (!hayQueSonar()) return
    void hayMusicaDeLaPelicula().then((hay) => {
      if (!hay || !hayQueSonar()) return
      const a = crear()
      salida = null
      try {
        const sesion = (navigator as unknown as { audioSession?: { type: string } }).audioSession
        if (sesion) sesion.type = 'ambient'
      } catch {
        /* nada */
      }
      arrancarReloj()
      // Si no puede sonar (el móvil aún no ha dejado), no pasa nada: la película sigue en silencio.
      void a.play().catch(() => undefined)
    })
  }
  // Fuera de la app o con el móvil bloqueado: se para. Al volver, sigue.
  const alVisibilidad = () => {
    if (document.hidden) pausa()
    else if (quiere) sonar()
  }
  document.addEventListener('visibilitychange', alVisibilidad)
  window.addEventListener('pagehide', pausa)

  return {
    empezar: () => {
      quiere = true
      sonar()
    },
    parar: () => {
      quiere = false
      if (!audio || audio.paused) {
        pausa()
        return
      }
      salida = { desde: audio.volume, t0: Date.now(), alFinal: pausa }
    },
    silenciar: (s) => {
      silenciada = s
      guardarMusicaSilenciada(s)
      objetivoMute = s ? 0 : 1
      if (!s && quiere) sonar()
    },
    soltar: () => {
      quiere = false
      document.removeEventListener('visibilitychange', alVisibilidad)
      window.removeEventListener('pagehide', pausa)
      pausa()
      audio = null
    },
  }
}
