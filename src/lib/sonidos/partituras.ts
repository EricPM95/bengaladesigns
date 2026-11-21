import { DURACION as DURACION_APERTURA } from '../../../shared/marca/aperturaJutrip.js'
import type { SonidoSintetico } from './sintesis'
import {
  paraFinalSiete,
  RETRASO_DEL_PEDAZO,
  TIEMPOS_DE_COLECCION_PANTALLA,
  TIEMPOS_DE_EMBLEMA,
  TIEMPOS_DE_PEDAZO,
  TIEMPOS_DE_PEDAZO_REDUCIDO,
  TIEMPOS_DE_RESUMEN,
  TIEMPOS_DE_VUELO,
  TIEMPOS_SELLADO,
  TIEMPOS_ESTAMPADO,
  TIEMPOS_SELLO,
  tiemposDeEscena,
  TIEMPOS_DEL_AVISO,
  TIEMPOS_FINAL_SIETE,
  tiemposDeLaApertura,
  type ConfigDeTiemposDeEscena,
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
  /** (V30) Los tiempos de la escena (, , ) cuando es una escena de sitio con tiempos propios. */
  escena?: ConfigDeTiemposDeEscena
}

export const GRADOS_DE_MEDALLA = ['bronce', 'plata', 'oro', 'diamante'] as const
/** (V30) Los sonidos grabados de verdad (`public/sonidos/v30/`, con candidatos A a E; `scripts/destino/sonidos/prepararCandidatos.mjs`). Los de [Visto], la campanita del aviso y el tic se quedan hechos por código. */
export const ARCHIVOS_DE_PREMIO = ['clic', 'vuelo', 'brillo', 'redoble', 'medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'maravilla', 'pais', 'apertura'] as const

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
      // FIJO (Eric, V30): el toque y el brillo pequeño de [Visto] se quedan como están (hechos por código).
      return { id, dura: 0.5, premio: false, notas: [sint('toque', 0), sint('brillo', 0.06, { vol: 0.5 })] }
    case 'aviso':
      // FIJO (Eric, V30): la campanita del aviso se queda como está.
      return { id, dura: TIEMPOS_DEL_AVISO.remate + 0.9, premio: false, notas: [sint('campanita', TIEMPOS_DEL_AVISO.campanita)] }
    case 'pedazo': {
      const t = TIEMPOS_DE_PEDAZO
      const r = TIEMPOS_DE_PEDAZO_REDUCIDO
      if (reducido) return { id, dura: RETRASO_DEL_PEDAZO + r.fin, premio: false, notas: [archivo('clic', RETRASO_DEL_PEDAZO + r.color), archivo('brillo', RETRASO_DEL_PEDAZO + r.color + 0.05, 0.8), sint('tic', RETRASO_DEL_PEDAZO + r.fin)] }
      return {
        id,
        dura: RETRASO_DEL_PEDAZO + t.fin,
        premio: false,
        notas: [
          // el trozo llega volando (de `llega` a `encaja`): la cresta del vuuush cae justo antes de encajar; encaja con un clic; se llena de color con un brillo; el número sube con un tic (el tic se queda fijo)
          archivo('vuelo', RETRASO_DEL_PEDAZO + t.encaja - 0.06, 0.9),
          archivo('clic', RETRASO_DEL_PEDAZO + t.encaja),
          archivo('brillo', RETRASO_DEL_PEDAZO + t.color + 0.05, 0.8),
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
        // un latido por aro, cada vez más rápido (el latido es el toque de siempre), y el golpe del premio cae cuando la luz estalla
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
          // el redoble dura lo que dura el giro de la medalla (el grabado se alinea por el final: nunca estirado) y el golpe final cae cuando para
          archivo('redoble', paraFinalSiete(), 0.55),
          archivo('maravilla', paraFinalSiete()),
        ],
      }
    }
    case 'coleccion': {
      // La insignia empieza a `retraso`; el último pedazo encaja y se cierra el círculo cuando acaba el giro de la pieza final.
      const t = TIEMPOS_DE_COLECCION_PANTALLA
      const cierra = t.retraso + TIEMPOS_DE_PEDAZO.fin
      return { id, dura: e(t.cta) + 0.6, premio: true, notas: [archivo('redoble', e(cierra), 0.55), archivo('coleccion', e(cierra))] }
    }
    case 'sello': {
      // Un sello nuevo (sin subir de grado): cae con «moDrop» y la estampa asienta al acabar; clic y brillo ahí.
      const t = TIEMPOS_SELLO
      const asienta = t.cae + t.caeDura
      return { id, dura: e(asienta) + 0.9, premio: false, notas: [archivo('vuelo', e(asienta) - 0.06, 0.9), archivo('clic', e(asienta)), archivo('brillo', e(asienta) + 0.05, 0.7)] }
    }
    case 'pais':
    case 'destino_nuevo':
    case 'continente': {
      // El sellado de pasaporte: la estampa cae con «moStamp» y asienta al acabar; ahí cae el golpe del premio.
      const t = TIEMPOS_SELLADO
      const asienta = t.empieza + t.dura
      return { id, dura: e(asienta) + 0.9, premio: true, notas: [archivo('vuelo', e(asienta) - 0.2, 0.5), archivo('pais', e(asienta))] }
    }
    case 'patrimonio':
    case 'viajero':
    case 'dia_completo': {
      const t = TIEMPOS_DE_RESUMEN
      return { id, dura: t.golpe + 0.6, premio: false, notas: [...tics(0, t.sube, t.tic), archivo('brillo', t.golpe, 0.9)] }
    }
    case 'primer_dia': {
      // (V35B) «Tu primer día» («Hoy empiezas a ganar logros»): el título entra a los 0,1 s y cada fila de lo que hay que hacer sube a los 0,3, 0,45 y 0,6 s (`moUp` de PrimerDia.tsx): un clic suave por fila y un brillo al acabar. Con los archivos de premio de siempre.
      return { id, dura: e(1.4) + 0.6, premio: false, notas: [archivo('brillo', e(0.3), 0.6), archivo('clic', e(0.5), 0.55), archivo('clic', e(0.65), 0.55), archivo('clic', e(0.8), 0.55), archivo('brillo', e(1.4), 0.9)] }
    }
    case 'vuelo':
      return { id, dura: TIEMPOS_DE_VUELO.dura + 0.1, premio: false, notas: [archivo('vuelo', TIEMPOS_DE_VUELO.dura * 0.7)] }
    case 'apertura': {
      // La firma de la app: cae justo cuando la estrella salta sobre la I. En la web NO suena (el navegador no deja sonar antes del primer toque); queda lista para la app de las tiendas.
      const t = tiemposDeLaApertura(DURACION_APERTURA)
      return { id, dura: t.duracion, premio: true, notas: [archivo('vuelo', t.letras[1] - 0.05, 0.6), archivo('apertura', t.estrella)] }
    }
    case 'escena': {
      // (V30) Las escenas de cada sitio (Roma y Lanzarote): la luz estalla a los `fl` s (el golpe del emblema), después entran el emblema y su nombre (un clic y un brillo) y todo se apaga a los `dim`.
      const t = tiemposDeEscena(o.escena)
      return {
        id,
        dura: t.fl + 4,
        premio: true,
        notas: [archivo('redoble', t.fl, 0.55), archivo('emblema', t.fl), archivo('clic', t.x[0], 0.8), archivo('brillo', t.x[2], 0.8)],
      }
    }
    case 'sello_pasaporte': {
      // (V36C) El sello que se estampa en la hoja del pasaporte: baja con un vuuush mientras cae y estampa con un clic y un brillo cuando toca la hoja. (La app todavía NO hace sonar este golpe: aquí suena como estaba pensado.)
      const t = TIEMPOS_ESTAMPADO
      return { id, dura: e(t.fin), premio: false, notas: [archivo('vuelo', e(t.golpe) - 0.5, 0.7), archivo('clic', e(t.golpe)), archivo('brillo', e(t.golpe) + 0.05, 0.7)] }
    }
    case 'fuegos': {
      // (V30) Los fuegos: un golpe de premio al estallar y brillos que caen detrás.
      return { id, dura: 3.2, premio: false, notas: [archivo('emblema', 0.2, 0.8), archivo('brillo', 1.0, 0.7), archivo('brillo', 1.8, 0.6)] }
    }
    default: {
      const m = /^medalla_(bronce|plata|oro|diamante)$/.exec(id)
      if (!m) return null
      // El sello que sube de grado: el viejo se apaga y se llena de luz y el nuevo entra con «evoNew» a los 3,3 s (redoble hasta que entra); la medalla asienta al acabar la entrada.
      const t = TIEMPOS_SELLO.evolucion
      const asienta = t.nuevo + t.nuevoDura
      return { id, dura: e(asienta) + 0.9, premio: true, notas: [archivo('redoble', e(t.nuevo + 0.4), 0.55), archivo(id, e(asienta))] }
    }
  }
}

/** Todas las animaciones que tienen partitura (para la prueba, la página de sonidos y el repaso). */
export const IDS_DE_PARTITURA: string[] = ['visto', 'aviso', 'pedazo', 'sello', 'coleccion', 'emblema', 'pais', 'destino_nuevo', 'continente', 'maravilla', 'patrimonio', 'viajero', 'dia_completo', 'primer_dia', 'vuelo', 'apertura', 'escena', 'fuegos', ...GRADOS_DE_MEDALLA.map((g) => `medalla_${g}`)]

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
  primer_dia: 'Tu primer día («Hoy empiezas a ganar logros»): un brillo al entrar el título, un clic suave por cada fila que aparece y un brillo al acabar.',
  vuelo: 'Lo ganado que vuela al botón o al Perfil: un vuuush de lo que dura el vuelo.',
  escena: 'Las escenas de cada sitio (Roma y Lanzarote): un redoble que sube y el golpe del premio cuando estalla la luz, y un clic y un brillo cuando entran el emblema y su nombre.',
  fuegos: 'Los fuegos: el golpe del premio al estallar y dos brillos que caen detrás.',
  apertura: 'La apertura: la firma de la app, que cae cuando la estrella salta sobre la I (en la web no suena: el navegador no deja antes del primer toque).',
  medalla_bronce: 'La medalla de bronce: redoble hasta que entra el sello nuevo y golpe al asentarse (el más suave).',
  medalla_plata: 'La medalla de plata: redoble mientras gira y golpe al parar (suena a más que el bronce).',
  medalla_oro: 'La medalla de oro: redoble mientras gira y golpe al parar (suena a más que la plata).',
  medalla_diamante: 'La medalla de diamante: redoble mientras gira y golpe al parar (el más rico).',
}

/** Las animaciones de la lista de la V29 que NO tienen partitura todavía (se dice en el repaso): sus tiempos viven en CSS dentro de cada escena y habría que sacarlos a `tiempos.ts` uno a uno. */
export const SIN_PARTITURA: string[] = []
