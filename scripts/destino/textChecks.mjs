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

/**
 * Primero la plaza o el puente, luego el monumento (PROMPT_PENDIENTE C): dentro de un grupo, en el orden de
 * `group_order` (Puente Sant'Angelo 1 → Castillo 2; Plaza Venecia 1 → Altar 2). Excepciones: el monumento con hora fija
 * (el Coliseo a la apertura, antes que el Arco) y la plaza o el puente que es el sitio del atardecer o de la noche (D7:
 * el Castillo a las 17:30 y el Puente al atardecer).
 */
const ordenDe = (D) => new Map((D.places ?? []).filter((place) => place.group && place.group_order != null).map((place) => [place.name, place]))

/** En los días curados (cada lista de paradas, con sus variantes): lo que rompe el orden. */
export function gruposFueraDeOrden(D) {
  const orden = ordenDe(D)
  const avisos = []
  for (const cfg of D.curated_days ?? []) {
    // La hora fija vale para todo el día curado (el Coliseo de D1 lleva su hora en la base; en tranquilo, a las 10:00).
    const conHora = new Set([cfg, ...Object.values(cfg.variantes ?? {})].flatMap((section) => [...(section.manana ?? []), ...(section.tarde_antes ?? []), ...(section.tarde ?? [])]).filter((stop) => stop.hora).map((stop) => stop.lugar))
    for (const [nombre, section] of [['base', cfg], ...Object.entries(cfg.variantes ?? {})]) {
      for (const clave of ['manana', 'tarde_antes', 'tarde']) {
        const lista = (section[clave] ?? []).filter((stop) => orden.has(stop.lugar))
        lista.forEach((primero, i) => {
          for (const despues of lista.slice(i + 1)) {
            const a = orden.get(primero.lugar)
            const b = orden.get(despues.lugar)
            if (primero.lugar === despues.lugar || a.group !== b.group || a.group_order < b.group_order) continue
            // `primero` va antes y tiene un número mayor: rompe el orden, salvo por hora fija o atardecer/noche.
            if (primero.hora || conHora.has(primero.lugar) || despues.rol === 'atardecer') continue
            avisos.push(`${cfg.id}${nombre === 'base' ? '' : ` (${nombre})`}: ${primero.lugar} antes que ${despues.lugar}`)
          }
        })
      }
    }
  }
  return avisos
}

/** En un día del motor: la plaza o el puente que sale después de su monumento, fuera de las excepciones. */
export function grupoFueraDeOrdenEnDia(D, day) {
  const orden = ordenDe(D)
  const cfg = (D.curated_days ?? []).find((candidate) => candidate.id === day?.curated_day?.id)
  const conHora = new Set(cfg ? [cfg, ...Object.values(cfg.variantes ?? {})].flatMap((section) => [...(section.manana ?? []), ...(section.tarde_antes ?? []), ...(section.tarde ?? [])]).filter((stop) => stop.hora).map((stop) => stop.lugar) : [])
  const paradas = (day?.stops ?? []).filter((stop) => orden.has(stop.place_name ?? stop.name))
  const avisos = []
  // (El Viernes Santo la Basílica cierra a las 13:00: la Plaza y la Basílica van a primera hora, antes que los Museos,
  // a propósito. PROMPT_REPASO_LOCAL_ROMA, 5.)
  if ((day?.curated_day?.variants ?? []).includes('fecha:easter-2')) return avisos
  paradas.forEach((primero, i) => {
    for (const despues of paradas.slice(i + 1)) {
      const a = orden.get(primero.place_name ?? primero.name)
      const b = orden.get(despues.place_name ?? despues.name)
      // (Al revés: el puente antes que el castillo, viniendo de San Pedro, sería ir y volver.)
      if (a.group === b.group && a.group_order < b.group_order && a.approach_lado?.[b.name] && !conHora.has(b.name)) {
        const index = (day?.stops ?? []).indexOf(primero)
        const anterior = (day?.stops ?? []).slice(0, index).reverse().find((stop) => !stop.is_break)
        const zonaAnterior = (D.places ?? []).find((place) => place.name === (anterior?.place_name ?? anterior?.name))?.zone
        if (zonaAnterior && (a.approach_lado[b.name].monumento_antes_si_viene_de ?? []).includes(zonaAnterior) && !despues.sunset_minutes) avisos.push(`${a.name} (${primero.suggested_time}) antes que ${b.name} (${despues.suggested_time}), viniendo de ${anterior.place_name ?? anterior.name}: el monumento va primero`)
      }
      if (a.group !== b.group || a.group_order < b.group_order) continue
      // (Una hora fija de verdad en cualquiera de las dos —reserva o turno, `hora_tipo`— manda sobre el orden del grupo: los Museos reservados a las 15:00 van después de la Plaza.)
      const fixedHour = (stop) => stop.hora_tipo === 'reserva' || stop.hora_tipo === 'turno'
      if (conHora.has(a.name) || primero.hora_tipo != null || fixedHour(despues) || despues.sunset_minutes != null || despues.is_night_experience || despues.night_view) continue
      // Regla 18: el acceso va antes del monumento SI SE LLEGA POR SU LADO. Viniendo de San Pedro (la parada de antes es de la zona
      // `monumento_antes_si_viene_de`), el monumento va primero y el acceso después, hacia el centro (el Castillo y luego el Puente).
      const lado = b.approach_lado?.[a.name]
      if (lado) {
        const index = (day?.stops ?? []).indexOf(primero)
        const anterior = (day?.stops ?? []).slice(0, index).reverse().find((stop) => !stop.is_break && (stop.place_name ?? stop.name) !== a.name)
        const zonaAnterior = (D.places ?? []).find((place) => place.name === (anterior?.place_name ?? anterior?.name))?.zone
        if (zonaAnterior && (lado.monumento_antes_si_viene_de ?? []).includes(zonaAnterior)) continue
      }
      avisos.push(`${a.name} (${primero.suggested_time}) antes que ${b.name} (${despues.suggested_time})`)
    }
  })
  return avisos
}
