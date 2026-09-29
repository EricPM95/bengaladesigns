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

/** El medio del formulario ('flight', 'train'…) en el de la llegada; un ferry de un solo día es un crucero. */
export function arrivalModeOf(optionId, contentDays) {
  switch (optionId) {
    case 'train':
      return 'tren'
    case 'bus':
      return 'bus'
    case 'ferry':
      return contentDays <= 1 ? 'crucero' : 'ferry'
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
 * embarque de la naviera (2 h si no se sabe) − el trayecto al puerto; crucero, la hora de a bordo − el trayecto − 30 min.
 * En coche no hay hora clave.
 */
export function leaveMinutesOf(departureTime, mode, medio) {
  const departure = toMinutes(departureTime)
  if (departure == null || mode === 'coche') return null
  const before =
    mode === 'crucero'
      ? (medio?.trayecto_min ?? 110) + (medio?.margen_min ?? 30)
      : mode === 'ferry'
        ? (medio?.salir_antes_min ?? 120) + (medio?.trayecto_min ?? 110)
        : (medio?.salir_antes_min ?? (mode === 'avion' ? 180 : 45))
  return Math.floor((departure - before) / 5) * 5
}

const MODE_LABEL = {
  avion: { reservado: 'VUELO', medio: 'AVIÓN', anadir: '+ AÑADIR VUELO' },
  tren: { reservado: 'TREN', medio: 'TREN', anadir: '+ AÑADIR TREN' },
  bus: { reservado: 'AUTOBÚS', medio: 'AUTOBÚS', anadir: '+ AÑADIR AUTOBÚS' },
  ferry: { reservado: 'FERRY', medio: 'FERRY', anadir: '+ AÑADIR FERRY' },
  crucero: { reservado: 'CRUCERO', medio: 'CRUCERO', anadir: '+ AÑADIR CRUCERO' },
  coche: { reservado: 'COCHE', medio: 'EN COCHE', anadir: '' },
}

/**
 * Los textos de la barra: `data` a la izquierda (se corta con "…"), `key` la hora clave en terracota (nunca se corta),
 * `add` el "+ AÑADIR VUELO" azul sin reserva. En coche, sin hora clave: el aviso de la ZTL.
 */
export function barTextOf({ kind, mode, point, origin, time, keyMinutes }) {
  const label = MODE_LABEL[mode]
  const head = kind === 'llegada' ? 'LLEGADA' : 'VUELTA'
  const place = point?.barra ?? ''
  const originUpper = String(origin ?? '').toUpperCase()
  if (mode === 'coche') {
    return { data: `${head} · EN COCHE ${kind === 'llegada' ? 'DESDE' : 'A'} ${originUpper}`, key: 'OJO CON LA ZTL', add: null }
  }
  if (mode === 'crucero' && !time) return { data: `${head} · CRUCERO · ${place}`, key: null, add: label.anadir }
  if (time) {
    const data = `${head} · ${label.reservado} ${time}${place ? ` · ${place}` : ''}`
    if (keyMinutes == null) return { data, key: null, add: null }
    const key = kind === 'llegada' ? `EN EL CENTRO ${minutesToHHMM(keyMinutes)}` : mode === 'crucero' ? `A BORDO A LAS ${time}` : `SAL A LAS ${minutesToHHMM(keyMinutes)}`
    return { data, key, add: null }
  }
  return { data: `${head} · ${label.medio} ${kind === 'llegada' ? 'DESDE' : 'A'} ${originUpper}`, key: null, add: label.anadir }
}
