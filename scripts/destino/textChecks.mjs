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
