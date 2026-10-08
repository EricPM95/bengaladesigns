// Una sola vez (Tanda 6n): saca de los datos que YA tenemos de cada sitio de Roma (ticket_info, entrada_de_pago, entradas_reservas) la primera versión de data/dias/roma/_entradas.json.
// No inventa ninguna entrada: solo los sitios que los datos dicen que son de pago. Después, el archivo es de Eric: añade o cambia entradas ahí, como las excursiones.
//   node scripts/destino/entradasDeRoma.mjs
import fs from 'node:fs'

const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const grupos = roma.entradas_reservas ?? []
const lugares = {}
const sinEntradas = []
const sinPrecio = []

const precioDe = (texto) => {
  const m = /(\d+(?:[.,]\d+)?)\s*€/.exec(texto ?? '')
  return m ? Number(m[1].replace(',', '.')) : null
}
/** Una línea de «qué incluye»: lo que los datos dicen de la entrada, sin «De pago.», sin «Reserva …» y sin la línea del precio. */
const incluyeDe = (lineas) => lineas.filter((l) => !/^(de pago|reserva\b|entrada:)/i.test(l)).join(' ').trim() || null

for (const place of roma.places) {
  const info = place.ticket_info ?? []
  const pago = info.some((l) => /de pago|solo es de pago/i.test(l))
  const trevi = place.entrada_de_pago
  if (!pago && !trevi) {
    sinEntradas.push(place.name)
    continue
  }
  const grupo = grupos.find((g) => g.lugares.includes(place.name) && g.lugares.length > 1)
  const linePrecio = info.find((l) => /^entrada:/i.test(l)) ?? null
  let entrada
  if (trevi) entrada = { nombre: 'Zona junto a la fuente', incluye: `Entrada a ${trevi.que ?? 'la zona de pago'}.`, desde: precioDe(trevi.precio), url: null }
  else if (/terraza/i.test(linePrecio ?? '') && /solo es de pago/i.test(info.join(' '))) entrada = { nombre: 'Terraza panorámica con ascensor', incluye: 'Terraza panorámica con ascensor, de 09:30 a 19:30 (última subida 19:00).', desde: precioDe(linePrecio), url: null }
  else if (grupo) entrada = { nombre: grupo.nombre, incluye: `Entrada conjunta: ${grupo.lugares.join(', ').replace('Foro Romano y Palatino', 'Foro Romano y Palatino')}.`, desde: precioDe(info.find((l) => /^entrada:.*€/i.test(l) && !/incluida/i.test(l)) ?? (roma.places.find((p) => grupo.lugares.includes(p.name) && (p.ticket_info ?? []).some((l) => /^entrada:.*€/i.test(l) && !/incluida/i.test(l)))?.ticket_info ?? []).find((l) => /^entrada:.*€/i.test(l) && !/incluida/i.test(l))), url: null }
  else entrada = { nombre: place.name, incluye: incluyeDe(info), desde: precioDe(linePrecio), url: null }
  if (entrada.desde == null) sinPrecio.push(place.name)
  lugares[place.name] = [entrada]
}

const salida = {
  _que_es: 'Las entradas que se pueden comprar de cada sitio (Tanda 6n). La pestaña «Entradas» de la ficha de cada sitio enseña estas, una debajo de otra: nombre, qué incluye, precio «desde» y [Reservar]. Un sitio sin entradas aquí no lleva pestaña ni la pestañita de la tarjeta. Primera versión sacada de lo que ya decían los datos de cada sitio (ticket_info); Eric añade o cambia entradas a mano, como las excursiones. Cada entrada: nombre, incluye (una línea; null si no hay), desde (euros; null si no se sabe) y url (el enlace de compra; null = la búsqueda de ese sitio).',
  lugares,
}
fs.writeFileSync('data/dias/roma/_entradas.json', JSON.stringify(salida, null, 2) + '\n')
console.log(JSON.stringify({ conEntradas: Object.keys(lugares), sinPrecio, sinEntradas: sinEntradas.length }))
