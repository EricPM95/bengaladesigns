/**
 * Comprobaciones de los textos que lee el viajero (PROMPT_AJUSTES_20_RUTAS), comunes a validar.mjs y a la revisión de
 * las 20 rutas.
 *
 * Un "Por qué aquí" que depende de la hora ("primera hora", "a la apertura", "sin gente", "a las 12:00") tiene que ir
 * como { texto, temprano } o llevar `hora_ok: true` en la parada:
 *   - la hora es un DATO DEL SITIO (abre a…, cierra a…, una hora fija como la bendición Urbi et Orbi), o
 *   - dice cuándo llega el viajero y coincide con la hora real de la ruta, con 30 min de margen como mucho.
 * "Casi siempre sin gente" no habla de horas: no cuenta.
 */

export const DEPENDE_DE_LA_HORA = /primera hora|a la apertura|(?<!siempre )(?<!casi )sin gente|\b\d{1,2}[:.]\d{2}\b|\ba las \d{1,2}\b|última luz/i

/** Las paradas de los días curados (y sus variantes) con su día y variante. */
export function curatedStops(D) {
  const out = []
  for (const cfg of D.curated_days ?? []) {
    for (const [nombre, section] of [['base', cfg], ...Object.entries(cfg.variantes ?? {})]) {
      const paradas = [...(section.manana ?? []), ...(section.tarde ?? []), ...(section.tarde_antes ?? []), ...(section.insertar ?? []).map((item) => item.parada), ...(section.si_espera?.tarde ?? []), ...(section.si_sobra?.anadir ?? [])]
      for (const parada of paradas) if (parada) out.push({ dia: cfg.id, variante: nombre, parada, donde: `${cfg.id}${nombre === 'base' ? '' : ` (${nombre})`}: ${parada.lugar}` })
    }
  }
  return out
}

/** Los `por_que` que hablan de una hora sin su "temprano" ni `hora_ok` (avisos amarillos). */
export function textosConHora(D) {
  const avisos = new Map()
  for (const { parada, donde } of curatedStops(D)) {
    if (parada.hora_ok) continue
    const texto = typeof parada.por_que === 'string' ? parada.por_que : parada.por_que?.temprano ? null : parada.por_que?.texto
    const match = texto ? texto.match(DEPENDE_DE_LA_HORA) : null
    if (match) avisos.set(donde, `${donde} — «${match[0]}»`)
  }
  return [...avisos.values()]
}

/** Lo que un título promete de hora: "sin gente" / "a primera hora" (antes de las 09:30) o "al atardecer". */
const PROMESA_TEMPRANO = /\b(sin gente|a primera hora)\b/i
const PROMESA_ATARDECER = /\bal atardecer\b/i
/** Antes de esta hora, "sin gente" y "a primera hora" se cumplen (la misma franja que el "temprano" de los por_que). */
export const TEMPRANO_ANTES_MIN = 9 * 60 + 30
const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

/**
 * ¿Promete el título del día algo de hora que ese día no se cumple? Un aviso por promesa rota (amarillo), o [].
 * La parada de la que habla es la que nombra el trozo del título ("Trevi sin gente" → la Fontana de Trevi): "sin gente"
 * y "a primera hora", si empieza a las 09:30 o después; "al atardecer", si ese día ninguna parada es la del atardecer.
 * @param {object} day  un día del motor (curated_day.name, stops)
 */
export function tituloQueNoSeCumple(day) {
  const titulo = day?.curated_day?.name ?? ''
  const paradas = (day?.stops ?? []).filter((stop) => !stop.is_night_experience)
  const avisos = []
  for (const trozo of titulo.split(/,| y /)) {
    if (PROMESA_TEMPRANO.test(trozo)) {
      const sujeto = trozo.replace(PROMESA_TEMPRANO, '').trim()
      const parada = sujeto ? paradas.find((stop) => String(stop.place_name ?? stop.name).includes(sujeto)) : null
      if (parada && toMin(parada.suggested_time) >= TEMPRANO_ANTES_MIN) avisos.push(`«${trozo.trim()}»: ${parada.place_name ?? parada.name} a las ${parada.suggested_time}`)
    }
    if (PROMESA_ATARDECER.test(trozo) && !paradas.some((stop) => stop.sunset_minutes != null)) avisos.push(`«${trozo.trim()}»: ese día ninguna parada es la del atardecer`)
  }
  return avisos
}
