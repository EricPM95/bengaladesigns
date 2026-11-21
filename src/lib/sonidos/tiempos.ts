/**
 * (V29) LOS TIEMPOS DE LAS ANIMACIONES, en UN solo sitio y en segundos. Tanto la animación como su sonido (la «partitura», `partituras.ts`) leen de aquí: si mañana una animación dura más, se cambia aquí
 * y el sonido la sigue solo (nunca números copiados a mano en otro sitio). Puro: sin React ni pantalla.
 */

/** (V13) El pedazo de la insignia que encaja: 0 la insignia con lo que ya tenías; 1 el trozo llega volando; 2 encaja; 3 se llena de color con un destello; 4 queda. `fin` = hasta que sale [Seguir]. */
export const TIEMPOS_DE_PEDAZO = { llega: 0.3, encaja: 1.2, color: 1.35, fin: 2.0 } as const
/** Con «Reducir movimiento» no hay vuelo: el color a la vez y el final un segundo y pico después. */
export const TIEMPOS_DE_PEDAZO_REDUCIDO = { color: 0, fin: TIEMPOS_DE_PEDAZO.fin - 1.2 } as const
/** Lo que espera la insignia antes de empezar (la pantalla de «Un pedazo nuevo»). */
export const RETRASO_DEL_PEDAZO = 0.9

/** (8B) La espera de antes del emblema secreto: la luz late cada vez más rápido (un latido por aro) y estalla a los 3,6 s. */
export const TIEMPOS_DE_EMBLEMA = { aros: [0.75, 1.47, 2.05, 2.5, 2.82], estalla: 3.6 } as const

/** (V7/8B) El final de las siete maravillas: las siete monedas quietas, un latido cada vez más rápido, el choque, la medalla que gira y se detiene, y el barrido de brillo. */
export const TIEMPOS_FINAL_SIETE = {
  quietas: 1.8,
  nucleo: 1.9,
  latidos: [2.1, 2.6, 3, 3.3, 3.55, 3.72],
  choque: [3.8, 3.9, 4.05],
  /** La medalla empieza a girar y tarda `giraDura` s en pararse. */
  giraEmpieza: 3.85,
  giraDura: 2.2,
  barrido: 5.9,
} as const
/** Cuándo para la medalla del final de las siete (el golpe final cae aquí). Función: se lee en el momento, así si cambia `giraDura` el sonido lo sigue. */
export const paraFinalSiete = (): number => TIEMPOS_FINAL_SIETE.giraEmpieza + TIEMPOS_FINAL_SIETE.giraDura

/** (10E) La apertura: dura `duracion` s; la estrella salta sobre la I entre el 50 y el 68 % (a su 60 % llega al tope); las letras entran del 6 al 50 %; el destello cruza del 24 al 40 %; el lema entra del 80 al 94 %. */
export const FRACCIONES_APERTURA = { letras: [0.06, 0.5], destello: [0.24, 0.4], estrella: 0.6, lema: [0.8, 0.94] } as const
export const tiemposDeLaApertura = (duracion: number) => ({
  duracion,
  letras: [FRACCIONES_APERTURA.letras[0] * duracion, FRACCIONES_APERTURA.letras[1] * duracion] as const,
  destello: FRACCIONES_APERTURA.destello[0] * duracion,
  estrella: FRACCIONES_APERTURA.estrella * duracion,
  lema: FRACCIONES_APERTURA.lema[0] * duracion,
})

/**
 * (V30) Los tiempos DE VERDAD de las pantallas de lo ganado (los mismos números que usan sus animaciones en `pantallas.tsx`):
 *   · sello nuevo: cae con «moDrop» de `cae` a `cae + caeDura` (la estampa asienta ahí);
 *   · sello que sube de grado (la medalla): el viejo se apaga y se llena de luz (`evolucion.frase`…`evolucion.nuevo`) y el nuevo entra con «evoNew» a los `evolucion.nuevo` s (ahí cae el golpe);
 *   · colección completa: la insignia empieza a `coleccion.retraso` s (el último pedazo encaja y se cierra el círculo a `retraso + TIEMPOS_DE_PEDAZO.fin`), el título entra a `coleccion.titulo`;
 *   · país, destino y continente («sellado»): la estampa de PASAPORTE cae con «moStamp» de `sellado.empieza` y dura `sellado.dura`.
 */
export const TIEMPOS_SELLO = { cae: 0.2, caeDura: 0.9, evolucion: { frase: 0.3, vieja: 0.2, nuevo: 3.3, nuevoDura: 1.1 } } as const
export const TIEMPOS_DE_COLECCION_PANTALLA = { retraso: RETRASO_DEL_PEDAZO + 0.1, titulo: 2.4, cta: 4.2 } as const
export const TIEMPOS_SELLADO = { empieza: 1.0, dura: 0.9, tinta: 1.0 } as const
/**
 * (V36C) EL SELLO QUE SE ESTAMPA EN EL PASAPORTE (`PasaporteScreen` con `sello:<viaje>`, el golpe `muSlam` de `mundo.css`): cae 2,3 s y toca la hoja al 88 % (2,02 s), rebota al 94 % (2,16 s) y suelta tinta y anillos; el último anillo acaba a los 3,7 s.
 * No es la medalla de los logros (`TIEMPOS_SELLO`: el sello de ciudad que cae en la pantalla de logros).
 */
export const TIEMPOS_ESTAMPADO = { golpe: 2.05, dura: 2.3, fin: 3.7 } as const
/** (V30) El cine de las escenas de cada sitio: la luz estalla («flash») a los `fl` s (por defecto 8) y todo se apaga a los `dim` s; el emblema y su nombre entran en `x`. Lo lee la escena Y su sonido. */
export interface ConfigDeTiemposDeEscena {
  fl?: number
  dim?: number
  x?: number[]
}
export const tiemposDeEscena = (c: ConfigDeTiemposDeEscena = {}) => {
  const fl = c.fl ?? 8
  return { fl, dim: c.dim ?? 7.6, x: c.x ?? [fl + 1.2, fl + 1.45, fl + 1.7, fl + 2.1] }
}
/** (V9/8B) La medalla del grado (bronce → plata → oro → diamante): el redoble empieza a la vez que empieza a girar, sube mientras gira y el golpe cae cuando para. */
export const TIEMPOS_DE_MEDALLA = { gira: 1.4, para: 1.4, brilla: 1.55 } as const
/** El sello estampándose, la colección completa, el país y el destino nuevo: entrada, golpe y remate. */
export const TIEMPOS_DE_SELLO = { baja: 0.35, golpe: 0.55, remate: 0.9 } as const
export const TIEMPOS_DE_COLECCION = { gira: 1.1, golpe: 1.25, remate: 1.7 } as const
export const TIEMPOS_DE_PAIS = { aparece: 0.3, golpe: 0.9, remate: 1.4 } as const
/** Lo ganado que vuela al botón o al Perfil (`vuelo.ts`) y el aviso de la campana. */
export const TIEMPOS_DE_VUELO = { dura: 0.9 } as const
export const TIEMPOS_DEL_AVISO = { campanita: 0, remate: 0.35 } as const
/** El resumen: los números que suben (un tic cada `tic` s durante `dura`) y el remate. */
export const TIEMPOS_DE_RESUMEN = { sube: 1.2, tic: 0.08, golpe: 1.3 } as const
