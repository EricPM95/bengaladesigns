import { DURACION as DURACION_APERTURA } from '../../../shared/marca/aperturaJutrip.js'
import type { SonidoSintetico } from './sintesis'
import {
  paraFinalSiete,
  RETRASO_DEL_PEDAZO,
  TIEMPOS_DE_COLECCION,
  TIEMPOS_DE_EMBLEMA,
  TIEMPOS_DE_MEDALLA,
  TIEMPOS_DE_PAIS,
  TIEMPOS_DE_PEDAZO,
  TIEMPOS_DE_PEDAZO_REDUCIDO,
  TIEMPOS_DE_RESUMEN,
  TIEMPOS_DE_SELLO,
  TIEMPOS_DE_VUELO,
  TIEMPOS_DEL_AVISO,
  TIEMPOS_FINAL_SIETE,
  tiemposDeLaApertura,
} from './tiempos'

/**
 * (V29) LAS PARTITURAS: para cada animación, la lista de sonidos con el instante EXACTO (segundos desde que empieza la animación) en que suena cada uno. Los instantes salen de `tiempos.ts`, las mismas constantes que
 * usa el movimiento: si una animación dura más, su sonido la sigue solo. Un sonido puede ser sintético (se genera en el móvil: `sintesis.ts`) o un archivo de premio (`public/sonidos/premio/`): del archivo se dice
 * cuándo tiene que CAER SU GOLPE (`golpe`), y el motor lo arranca justo antes para que el golpe caiga en ese milisegundo (el instante del golpe dentro del archivo está en `manifiesto.json`). Pura: sin pantalla.
 */
export type Nota =
  | { tipo: 'sint'; sonido: SonidoSintetico; en: number; dura?: number; vol?: number }
  | { tipo: 'archivo'; archivo: string; golpe: number; vol?: number }

export interface Partitura {
  id: string
  /** Lo que dura la animación (el sonido nunca pasa de aquí, salvo la cola del último). */
  dura: number
  /** Los premios no se solapan nunca: uno corta (con fundido) al anterior. */
  premio: boolean
  notas: Nota[]
}

export interface OpcionesDePartitura {
  /** «Reducir movimiento» del móvil: las animaciones son más cortas y el sonido las sigue. */
  reducido?: boolean
}

export const GRADOS_DE_MEDALLA = ['bronce', 'plata', 'oro', 'diamante'] as const
/** Los archivos de premio (hechos por código en el PC, `scripts/destino/generarSonidosPremio.mjs`), cada uno en tres versiones A, B y C. */
export const ARCHIVOS_DE_PREMIO = ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'maravilla', 'pais', 'apertura'] as const

const sint = (sonido: SonidoSintetico, en: number, extra: { dura?: number; vol?: number } = {}): Nota => ({ tipo: 'sint', sonido, en, ...extra })
const archivo = (a: string, golpe: number, vol?: number): Nota => ({ tipo: 'archivo', archivo: a, golpe, ...(vol ? { vol } : {}) })

/** Los números que suben: un tic cada `tic` segundos durante `sube`, empezando en `desde`. */
const tics = (desde: number, sube: number, cada: number): Nota[] => {
  const salida: Nota[] = []
  for (let t = 0; t < sube - 1e-9; t += cada) salida.push(sint('tic', desde + t, { vol: 0.6 + 0.4 * (t / sube) }))
  return salida
}

export function partituraDe(id: string, o: OpcionesDePartitura = {}): Partitura | null {
  const reducido = Boolean(o.reducido)
  // Con «reducir movimiento» las animaciones se acortan a la mitad y el sonido las sigue (los instantes se escalan, los golpes caen al final igual).
  const k = reducido ? 0.5 : 1
  const e = (s: number) => s * k
  switch (id) {
    case 'visto':
      return { id, dura: 0.5, premio: false, notas: [sint('toque', 0), sint('brillo', 0.06, { vol: 0.5 })] }
    case 'aviso':
      return { id, dura: TIEMPOS_DEL_AVISO.remate + 0.9, premio: false, notas: [sint('campanita', TIEMPOS_DEL_AVISO.campanita)] }
    case 'pedazo': {
      const t = TIEMPOS_DE_PEDAZO
      const r = TIEMPOS_DE_PEDAZO_REDUCIDO
      if (reducido) return { id, dura: RETRASO_DEL_PEDAZO + r.fin, premio: false, notas: [sint('clic', RETRASO_DEL_PEDAZO + r.color), sint('brillo', RETRASO_DEL_PEDAZO + r.color + 0.02, { vol: 0.8 }), sint('tic', RETRASO_DEL_PEDAZO + r.fin)] }
      return {
        id,
        dura: RETRASO_DEL_PEDAZO + t.fin,
        premio: false,
        notas: [
          // el trozo llega volando (de `llega` a `encaja`), encaja con un clic, se llena de color con un brillo y el número sube
          sint('vuelo', RETRASO_DEL_PEDAZO + t.llega, { dura: t.encaja - t.llega }),
          sint('clic', RETRASO_DEL_PEDAZO + t.encaja),
          sint('brillo', RETRASO_DEL_PEDAZO + t.color, { vol: 0.9 }),
          sint('tic', RETRASO_DEL_PEDAZO + t.fin),
        ],
      }
    }
    case 'emblema': {
      const t = TIEMPOS_DE_EMBLEMA
      return {
        id,
        dura: e(t.estalla) + 0.6,
        premio: true,
        // un latido por aro, cada vez más rápido, y el golpe del premio cae cuando la luz estalla
        notas: [...t.aros.map((a, i) => sint('toque', e(a), { vol: 0.35 + 0.1 * i })), archivo('emblema', e(t.estalla))],
      }
    }
    case 'maravilla': {
      const t = TIEMPOS_FINAL_SIETE
      return {
        id,
        dura: paraFinalSiete() + 0.7,
        premio: true,
        notas: [
          ...t.latidos.map((l, i) => sint('toque', l, { vol: 0.3 + 0.08 * i })),
          // el redoble dura lo que dura el giro de la medalla y el golpe final cae cuando para
          sint('redoble', t.giraEmpieza, { dura: t.giraDura }),
          archivo('maravilla', paraFinalSiete()),
        ],
      }
    }
    case 'coleccion': {
      const t = TIEMPOS_DE_COLECCION
      return { id, dura: e(t.remate), premio: true, notas: [sint('redoble', 0, { dura: e(t.golpe) }), archivo('coleccion', e(t.golpe))] }
    }
    case 'sello': {
      const t = TIEMPOS_DE_SELLO
      return { id, dura: t.remate + 0.4, premio: false, notas: [sint('vuelo', 0, { dura: t.baja }), sint('clic', t.golpe, { vol: 1 }), sint('brillo', t.golpe + 0.05, { vol: 0.7 })] }
    }
    case 'pais':
    case 'destino_nuevo':
    case 'continente': {
      const t = TIEMPOS_DE_PAIS
      return { id, dura: e(t.remate), premio: true, notas: [sint('vuelo', e(t.aparece), { dura: e(t.golpe - t.aparece) }), archivo('pais', e(t.golpe))] }
    }
    case 'patrimonio':
    case 'viajero':
    case 'dia_completo': {
      const t = TIEMPOS_DE_RESUMEN
      return { id, dura: t.golpe + 0.6, premio: false, notas: [...tics(0, t.sube, t.tic), sint('brillo', t.golpe, { vol: 0.9 })] }
    }
    case 'vuelo':
      return { id, dura: TIEMPOS_DE_VUELO.dura + 0.1, premio: false, notas: [sint('vuelo', 0, { dura: TIEMPOS_DE_VUELO.dura })] }
    case 'apertura': {
      // La firma de la app: cae justo cuando la estrella salta sobre la I. En la web NO suena (el navegador no deja sonar antes del primer toque); queda lista para la app de las tiendas.
      const t = tiemposDeLaApertura(DURACION_APERTURA)
      return { id, dura: t.duracion, premio: true, notas: [sint('vuelo', t.letras[0], { dura: t.letras[1] - t.letras[0], vol: 0.5 }), archivo('apertura', t.estrella)] }
    }
    default: {
      const m = /^medalla_(bronce|plata|oro|diamante)$/.exec(id)
      if (!m) return null
      const t = TIEMPOS_DE_MEDALLA
      return {
        id,
        dura: e(t.brilla) + 0.7,
        premio: true,
        // el redoble empieza cuando empieza a girar, sube mientras gira, y el golpe final cae justo cuando para
        notas: [sint('redoble', 0, { dura: e(t.gira) }), archivo(id, e(t.para))],
      }
    }
  }
}

/** Todas las animaciones que tienen partitura (para la prueba, la página de sonidos y el repaso). */
export const IDS_DE_PARTITURA: string[] = ['visto', 'aviso', 'pedazo', 'sello', 'coleccion', 'emblema', 'pais', 'destino_nuevo', 'continente', 'maravilla', 'patrimonio', 'viajero', 'dia_completo', 'vuelo', 'apertura', ...GRADOS_DE_MEDALLA.map((g) => `medalla_${g}`)]

/** Cada partitura, en palabras (para el repaso y la página de sonidos). */
export const EN_PALABRAS: Record<string, string> = {
  visto: 'El toque de [Visto]: un toque suave y un brillo pequeño.',
  aviso: 'El aviso de la campana: una campanita de dos notas.',
  pedazo: 'El pedazo que encaja: el «vuuush» del vuelo hasta que encaja, un clic al encajar, un brillo cuando se llena de color y un tic cuando sube el número.',
  sello: 'El sello: baja con un vuuush y estampa con un clic y un brillo.',
  coleccion: 'La colección completa: un redoble que sube hasta el golpe del premio, que cae al acabar el giro.',
  emblema: 'El emblema secreto: un latido por cada aro de luz (cada vez más seguidos) y el golpe del premio cuando la luz estalla.',
  pais: 'País nuevo: un vuuush hasta que aparece y el golpe del premio al asentarse.',
  destino_nuevo: 'Destino nuevo: igual que país nuevo.',
  continente: 'Continente: igual que país nuevo.',
  maravilla: 'Final de las siete maravillas: latidos cada vez más rápidos, un redoble durante todo el giro de la medalla y el golpe final cuando para.',
  patrimonio: 'Patrimonio: los números que suben con un tic cada vez y un brillo al acabar.',
  viajero: 'Logro de viajero: igual que patrimonio.',
  dia_completo: 'El resumen del día y del viaje: los números que suben con tics y un brillo al acabar.',
  vuelo: 'Lo ganado que vuela al botón o al Perfil: un vuuush de lo que dura el vuelo.',
  apertura: 'La apertura: la firma de la app, que cae cuando la estrella salta sobre la I (en la web no suena: el navegador no deja antes del primer toque).',
  medalla_bronce: 'La medalla de bronce: redoble mientras gira y golpe al parar (el más suave).',
  medalla_plata: 'La medalla de plata: redoble mientras gira y golpe al parar (suena a más que el bronce).',
  medalla_oro: 'La medalla de oro: redoble mientras gira y golpe al parar (suena a más que la plata).',
  medalla_diamante: 'La medalla de diamante: redoble mientras gira y golpe al parar (el más rico).',
}

/** Las animaciones de la lista de la V29 que NO tienen partitura todavía (se dice en el repaso): sus tiempos viven en CSS dentro de cada escena y habría que sacarlos a `tiempos.ts` uno a uno. */
export const SIN_PARTITURA = ['las escenas de cada sitio (momentos/escenas, también Lanzarote)', 'los fuegos', 'el resumen del día y del viaje (solo los tics y el brillo del final)']
