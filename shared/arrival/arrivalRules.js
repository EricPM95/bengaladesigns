/**
 * Las reglas de la llegada y la vuelta (PROMPT_UI, Parte 3), sin nada de React ni de Node: las usan la app
 * (src/lib/arrivalReturn.ts) y la página de revisión (scripts/destino/llegadas.mjs → docs/LLEGADAS_ROMA.html), para que
 * lo que se revisa sea exactamente lo que ve el viajero. Valen para todos los destinos.
 */

const toMinutes = (hhmm) => {
  const match = String(hhmm ?? '').match(/^(\d{1,2}):(\d{2})/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export const minutesToHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const hhmmToMinutes = toMinutes

/** El medio del formulario ('flight', 'train'…) en el de la llegada. (No hay crucero: el ferry es un ferry, también en un viaje de un día.) */
export function arrivalModeOf(optionId, contentDays) {
  switch (optionId) {
    case 'train':
      return 'tren'
    case 'bus':
      return 'bus'
    case 'ferry':
      return 'ferry'
    case 'own_vehicle':
    case 'car':
      return 'coche'
    default:
      return 'avion'
  }
}

/** La hora en el centro: la llegada más el traslado del punto, de 5 en 5. */
export function centerMinutesOf(arrivalTime, point) {
  const arrival = toMinutes(arrivalTime)
  if (arrival == null || !point) return null
  return Math.round((arrival + point.al_centro_min) / 5) * 5
}

/**
 * La hora de salir de la ciudad, de 5 en 5 hacia abajo: avión, la salida − 3 h; tren y autobús, − 45 min; ferry, − el
 * embarque de la naviera (2 h si no se sabe) − el trayecto al puerto.
 * Cada punto de salida puede traer el suyo (`salir_antes_min`): Ciampino no es Fiumicino. En coche no hay hora clave.
 */
export function leaveMinutesOf(departureTime, mode, medio, point) {
  const departure = toMinutes(departureTime)
  if (departure == null || mode === 'coche') return null
  const before =
    mode === 'ferry'
      ? (medio?.salir_antes_min ?? 120) + (medio?.trayecto_min ?? 110)
      : (point?.salir_antes_min ?? medio?.salir_antes_min ?? (mode === 'avion' ? 180 : 45))
  return Math.floor((departure - before) / 5) * 5
}

const MODE_LABEL = {
  avion: { palabra: 'vuelo', boton: '+ Vuelo', medio: 'AVIÓN', volver: 'Cómo volver al aeropuerto' },
  tren: { palabra: 'tren', boton: '+ Tren', medio: 'TREN', volver: 'Cómo volver a la estación' },
  bus: { palabra: 'autobús', boton: '+ Autobús', medio: 'AUTOBÚS', volver: 'Cómo volver a la estación' },
  ferry: { palabra: 'barco', boton: '+ Barco', medio: 'BARCO', volver: 'Cómo volver al puerto' },
  coche: { palabra: 'coche', boton: '', medio: 'EN COCHE', volver: 'La ZTL y dónde aparcar' },
}

/**
 * Los textos de la barra de la llegada y de la vuelta (Tanda 6t, diseño «1b · Línea y pase azul»): `eyebrow` arriba, en pequeño; `main` debajo; `add` el botón azul «+ Vuelo» (de pago, sin hora);
 * `pill` la pastilla verde «✓ 11:20» (de pago, con la hora que puso el viajero). Ninguna hora que calcule la app: «En el centro», «libre hacia» o «Sal a las» no existen (Tanda 6t, 5).
 * `pago`: la versión de pago (con el botón y la pastilla); sin él, la gratis (solo la flecha). `point` es el punto elegido en RESERVAS (o null), `destino` sale de los datos.
 */
export function barTextOf({ kind, mode, point, origin, destino, time, pago }) {
  const label = MODE_LABEL[mode]
  const llegada = kind === 'llegada'
  const head = llegada ? 'LLEGADA' : 'VUELTA'
  const originUpper = String(origin ?? '').toUpperCase()
  const desdeA = `${head} · ${llegada ? 'DESDE' : 'A'} ${originUpper}`
  if (mode === 'coche') return { eyebrow: `${head} · EN COCHE`, main: 'La ZTL y dónde aparcar', add: null, pill: null }
  if (!pago) return { eyebrow: desdeA, main: llegada ? `Cómo llegar a ${destino}` : label.volver, add: null, pill: null }
  if (time) {
    const place = point ? point.corto ?? point.nombre : null
    return {
      eyebrow: `${head} · ${place ? place.toUpperCase() : label.medio}`,
      main: llegada ? (place ? `Cómo llegar desde ${place}` : `Cómo llegar a ${destino}`) : place ? `Cómo llegar a ${place}` : label.volver,
      add: null,
      pill: `✓ ${time}`,
    }
  }
  return { eyebrow: desdeA, main: llegada ? `Añade tu ${label.palabra} y ajustamos tu día` : `Añade tu ${label.palabra} de vuelta y ajustamos tu día`, add: label.boton, pill: null }
}
