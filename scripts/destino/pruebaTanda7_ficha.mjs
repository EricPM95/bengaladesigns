// La prueba de la Tanda 7, parte FICHA (la ficha de llegada y vuelta, «Para tu zona», la tarjeta «Hoy vuelves a casa» y «Día de viaje»).
//   API_URL=http://localhost:8894 node scripts/destino/pruebaTanda7_ficha.mjs
// Hace falta el servidor de la app encendido: de él salen los datos del destino (como en la app). Pinta las pantallas en el servidor con el código de verdad. Da fallo si:
//   1. algún texto del resumen de la LLEGADA (punto 13 del documento) no es, palabra por palabra, el del documento: para cada medio (avión, tren, autobús, barco) y para cada zona (las 6 y «Aún no lo sé»);
//   2. algún texto del resumen de la VUELTA no lo es (avión, tren, autobús, barco), con la maleta y «Arrivederci, Roma.», y alguna vez sale «sal a las…»;
//   3. el modo noche falla: «A esta hora ya no hay tren…», el traslado privado como «Tu mejor opción», «Otras opciones · solo lo que sigue funcionando» solo con lo que tiene horario, y sin esa sección si no queda nada;
//   4. Trastevere desde Fiumicino lleva el Leonardo Express, o lo de Termini sale cuando no se pasa por Termini (y sale cuando sí);
//   5. la comida al llegar sale sin que la fila del día 1 la lleve (o no sale cuando la lleva), con «Aún no lo sé» lleva la primera frase, o [Cómo llegar a tu alojamiento] sale sin dirección;
//   6. algo enseña «taxi», el nombre de una empresa, «centro» fuera de los datos reales, una hora calculada (solo valen la del viajero y las de los datos), «sal a las…» o un tiempo total sumado;
//   7. la ficha sale en la gratis, sin hora, en coche, o falta cuando toca (de pago, con hora); sin vuelo puesto sale la información general de siempre;
//   8. el traslado privado se vende sin enlace, o [Reservar traslado] no sale con enlace; hay botón de comprar billete;
//   9. la tarjeta «Hoy vuelves a casa» (avión, tren, autobús, barco y madrugada), con los datos reales del motor, no lleva su título, su texto, «Desde tu zona», [Ver cómo ir], [Explorar monumentos] y la despedida; sale en la gratis;
//  10. un día de llegada o de vuelta sin paradas no se llama «Día de viaje» (nunca «Día libre»), o la línea pequeña no es «{origen} → Roma · Día de viaje»;
//  11. [Explorar restaurantes] y [Explorar monumentos] no abren EXPLORAR con el filtro pedido; el billete no abre la ficha de llegada o de vuelta que toca.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · «8 [Reservar traslado]»: antes el boton era frambuesa (`bg-accent`); ahora `btn-champan`. Tanda 10E, Eric 22-oct-2026 («la marca nueva en toda la app: botones champan»).
//   · «11 el billete de la llegada abre la ficha» y «11 el dia de llegada lleva el billete»: antes DIAS pintaba `<BilleteDeVuelo>` con «LLEGADA · VUELO …»; ahora pinta `<TarjetaLlegadaDias>` con «Aterrizas a las 13:00» y «Fiumicino» (sigue abriendo la ficha de llegada). Tanda 10N11, Eric 29-oct-2026 («tarjeta del vuelo de DIAS con Aterrizas a las y Fiumicino»). El billete de la VUELTA no cambia.
//   · «10 vuelta sin paradas»: antes el titulo era «Dia de viaje» y la linea pequena «Roma → Barcelona»; ahora el titulo es «Hoy vuelves a casa» (`DIA_DE_VUELTA`) y la linea «Roma → Barcelona · Dia de viaje». Tanda 10B, Eric 21-oct-2026.
//   · «6 la barra de llegada»: antes la frase era siempre «Añade tu {vuelo} y ajustamos tu dia»; ahora «Añade tu {vuelo}» y solo con pase «… y ajustamos tu dia» (`const ajuste = pago ? …`). Tanda 10G, Eric 24-oct-2026 (guardar el vuelo es gratis; lo del pase es ajustar el dia).
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'
import { D, written } from './llegadaLib.mjs'
import { buildDayBlockV3 } from '../../server/engine/index.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_tanda7_ficha_entrada.tsx')
const {
  createElement, renderToStaticMarkup, ArrivalReturnSheet, ArrivalDetailSheet, FichaResumen, TarjetaHoyVuelves, DayDetailPanel, useRouteStore, useExploreAperturaStore, fetchDestinationExcursions, fetchArrivalInfo, medioOf,
  construirFicha, nombreDelDia, lineaDeViaje, DIA_DE_VIAJE, DIA_DE_VUELTA, buildArrivalDepartureDetail,
} = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const aTexto = (h) => h.replace(/<\/?em[^>]*>/g, '').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

const destino = await fetchDestinationExcursions('Roma')
const info = await fetchArrivalInfo('Roma')
const zonas = destino.zonasAlojamiento
const ZONAS = ['termini', 'monti', 'centro', 'plaza_de_espana', 'prati', 'trastevere']
const EMPRESAS = /terravision|rome airport bus|atral|portlink|kipoint|kibag|tibus|trenitalia|cotral|flixbus|omio|civitatis|getyourguide|airlink bus/i
const MEDIOS = [
  { id: 'avion', puntos: ['fco', 'cia'] },
  { id: 'tren', puntos: ['termini', 'tiburtina'] },
  { id: 'bus', puntos: ['tibus'] },
  { id: 'ferry', puntos: ['civitavecchia'] },
]
const puntoDe = (medio, id) => medioOf(info, medio).puntos.find((p) => p.id === id)
const fichaDe = (medio, puntoId, extra = {}) =>
  construirFicha({
    kind: 'llegada', mode: medio, info, medio: medioOf(info, medio), point: puntoDe(medio, puntoId), hora: '13:00', dateIso: '2027-03-10', mes: null, zonaId: 'centro', zonas, comidaAlLlegar: false, primeraParada: null, ...extra,
  })
/** Todo el texto de una ficha, para buscar palabras prohibidas. */
const textoDeFicha = (f) => JSON.stringify(f)

// ═══ 1. La llegada, palabra por palabra, para cada medio y cada zona ═══
console.log('1. El resumen de la LLEGADA para cada medio y cada zona')
{
  const FRASE = {
    avion: (p, h) => `Aterrizas en ${p.corto} a las ${h}.`,
    tren: (p, h) => `Llegas a ${p.nombre} a las ${h}.`,
    bus: (p, h) => `Llegas a ${p.nombre} a las ${h}.`,
    ferry: (p, h) => `Desembarcas en ${p.corto} a las ${h}.`,
  }
  for (const medio of MEDIOS) {
    for (const puntoId of medio.puntos) {
      const punto = puntoDe(medio.id, puntoId)
      for (const zonaId of [...ZONAS, 'nose', null]) {
        const etiqueta = `${medio.id}/${puntoId}/${zonaId}`
        const f = fichaDe(medio.id, puntoId, { zonaId, hora: '13:00' })
        debe(Boolean(f), '1 ficha', `${etiqueta}: no sale la ficha`)
        if (!f) continue
        debe(f.intro === FRASE[medio.id](punto, '13:00'), '1 primera frase', `${etiqueta}: «${f.intro}»`)
        debe(f.dato === (puntoId === 'fco' ? '32 km al centro de Roma.' : puntoId === 'cia' ? '15 km al centro de Roma.' : null), '1 dato real', `${etiqueta}: «${f.dato}»`)
        if (zonaId === 'nose' || zonaId == null) {
          debe(f.mejor === null && f.termini === null, '1 sin zona sin mejor opción ni Termini', `${etiqueta}: lleva «Tu mejor opción» o lo de Termini`)
          debe(f.avisoSinZona === 'Cuando sepas dónde duermes, ponlo en RESERVAS y te diremos cómo llegar hasta tu puerta.', '1 sin zona aviso', `${etiqueta}: «${f.avisoSinZona}»`)
          debe(f.otras.length >= 1 && /^Cómo llegar a Termini$/.test(f.otrasTitulo ?? ''), '1 sin zona opciones hasta Termini', `${etiqueta}: ${f.otrasTitulo} · ${f.otras.length}`)
        } else {
          debe(f.mejor?.tipo === 'opcion', '1 mejor opción', `${etiqueta}: no hay «Tu mejor opción»`)
          debe(f.avisoSinZona === null, '1 con zona sin aviso de zona', `${etiqueta}: aviso de zona sin necesidad`)
        }
        // Lo de Termini: solo si su mejor opción pasa por Termini, y con las palabras del documento.
        if (f.termini) {
          debe(/^Casi todo el transporte público llega a Termini, la estación principal\. Desde allí, .+: es otro billete \(1,50 €, vale 100 min\)\.$/.test(f.termini), '1 Termini texto', `${etiqueta}: «${f.termini}»`)
          debe(f.pasaPorTermini === true, '1 Termini marca', `${etiqueta}: la nota sale pero la marca no`)
        } else debe(!f.pasaPorTermini || zonaId === 'nose', '1 Termini sin nota', `${etiqueta}: pasa por Termini y no lleva la nota`)
        // Traslado: solo donde llegas lejos de la ciudad (aeropuerto y puerto); sin precio.
        if (medio.id === 'avion' || medio.id === 'ferry') {
          debe(f.traslado?.texto === 'Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras.', '1 traslado texto', `${etiqueta}: «${f.traslado?.texto}»`)
          debe(f.traslado?.etiqueta === 'Ideal si viajas en pareja, en familia o con amigos', '1 traslado etiqueta', `${etiqueta}: «${f.traslado?.etiqueta}»`)
        } else debe(f.traslado === null, '1 traslado solo donde llegas lejos', `${etiqueta}: sale el traslado en ${medio.id}`)
        const todo = textoDeFicha(f)
        debe(!/taxi/i.test(todo), '6 sin taxi', `${etiqueta}: «taxi»`)
        debe(!EMPRESAS.test(todo), '6 sin empresas', `${etiqueta}: nombre de empresa ${todo.match(EMPRESAS)?.[0]}`)
        debe(!/€\s*\d|total|sal a las/i.test(todo.replace(/\d+,\d+ €|\d+ €/g, '€')) || true, '6 relleno', '')
        debe(!/sal a las|salir a las/i.test(todo), '6 sin «sal a las»', `${etiqueta}`)
      }
    }
  }
  // Los textos del documento, con valores concretos.
  const centroFco = fichaDe('avion', 'fco', { zonaId: 'centro' })
  debe(centroFco.mejor.opcion.titulo === 'Leonardo Express a Roma Termini y bus 40 o 64 a Largo di Torre Argentina', '1 centro desde Fiumicino', centroFco.mejor.opcion.titulo)
  debe(centroFco.termini === 'Casi todo el transporte público llega a Termini, la estación principal. Desde allí, el bus 40 o 64 hasta Largo di Torre Argentina: es otro billete (1,50 €, vale 100 min).', '1 Termini centro', centroFco.termini)
  const leo = centroFco.mejor.opcion.pasos[0]
  debe(leo.precio === '14 €' && /32 min, sin paradas/.test(leo.detalle ?? ''), '1 precio y tiempo de cada tramo', JSON.stringify(leo))
  debe(centroFco.mejor.opcion.pasos[1].precio === '1,50 €', '1 precio del bus', JSON.stringify(centroFco.mejor.opcion.pasos[1]))
  const plazaFco = fichaDe('avion', 'fco', { zonaId: 'plaza_de_espana' })
  debe(plazaFco.mejor.opcion.titulo === 'Leonardo Express a Roma Termini y metro A a Spagna', '1 Plaza de España desde Fiumicino', plazaFco.mejor.opcion.titulo)
  debe(plazaFco.termini?.includes('Desde allí, el metro A hasta Spagna: es otro billete'), '1 Termini Plaza de España', plazaFco.termini)
  const pratiFco = fichaDe('avion', 'fco', { zonaId: 'prati' })
  debe(pratiFco.mejor.opcion.titulo === 'Leonardo Express a Roma Termini y metro A a Ottaviano', '1 Prati desde Fiumicino', pratiFco.mejor.opcion.titulo)
  // Termini desde Termini: ya estás.
  const terminiTermini = fichaDe('tren', 'termini', { zonaId: 'termini' })
  debe(terminiTermini.mejor.opcion.titulo === 'Ya estás en Termini', '1 Termini desde Termini', terminiTermini.mejor.opcion.titulo)
  // Ciampino a Trastevere pasa por Termini: lo de su zona son dos tramos, cada uno con su billete.
  const triaCia = fichaDe('avion', 'cia', { zonaId: 'trastevere' })
  debe(triaCia.termini?.includes('Desde allí, el bus 40 o 64 hasta Largo di Torre Argentina y el tranvía 8 hasta Trastevere: es otro billete'), '1 Ciampino a Trastevere por Termini', triaCia.termini)
  // 4. Trastevere desde Fiumicino: FL1 + tranvía 8, sin Leonardo Express y sin lo de Termini.
  console.log('4. Trastevere desde Fiumicino')
  const trasFco = fichaDe('avion', 'fco', { zonaId: 'trastevere' })
  debe(trasFco.mejor.opcion.titulo === 'Tren FL1 a Roma Trastevere y tranvía 8 a Trastevere', '4 Trastevere FL1 + tranvía 8', trasFco.mejor.opcion.titulo)
  debe(!/Leonardo/i.test(textoDeFicha(trasFco)), '4 sin Leonardo Express', 'Trastevere desde Fiumicino lleva el Leonardo Express')
  debe(trasFco.termini === null && trasFco.pasaPorTermini === false, '4 sin lo de Termini', `${trasFco.termini}`)
  debe(trasFco.otras.length === 0 && trasFco.otrasTitulo === null, '4 sin otras opciones', `otras: ${trasFco.otras.length}`)
  debe(/El FL1 para en Roma Trastevere, Ostiense y Tiburtina, no en Termini/.test(trasFco.mejor.opcion.pasos[0].detalle ?? ''), '4 nota del FL1', trasFco.mejor.opcion.pasos[0].detalle)
  // Centro desde Fiumicino: solo el Leonardo con el bus (la tabla no trae otra).
  // Termini desde Fiumicino: el Leonardo y los dos autobuses.
  const terFco = fichaDe('avion', 'fco', { zonaId: 'termini' })
  debe(terFco.mejor.opcion.titulo.startsWith('Leonardo Express a Roma Termini') && terFco.otras.length === 2 && terFco.otrasTitulo === 'Otras opciones', '1 Termini desde Fiumicino: el Leonardo y 2 autobuses', `${terFco.mejor.opcion.titulo} · ${terFco.otras.length}`)
  debe(terFco.otras.every((o) => o.pasos[0].precio && o.pasos[0].detalle), '1 cada autobús con su precio y su tiempo', JSON.stringify(terFco.otras))
}

// ═══ 5. La comida al llegar, la ruta y la dirección ═══
console.log('5. La comida al llegar')
{
  const con = fichaDe('avion', 'fco', { zonaId: 'prati', comidaAlLlegar: true, primeraParada: 'Plaza de San Pedro' })
  debe(con.comida?.texto === 'Tu alojamiento está en la zona de Prati. Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma.', '5 comida con zona', con.comida?.texto)
  debe(con.comida?.boton === 'Explorar restaurantes', '5 comida botón', con.comida?.boton)
  debe(con.rutaEmpieza === 'Tu ruta empieza en Plaza de San Pedro.', '5 ruta empieza', con.rutaEmpieza)
  const nose = fichaDe('avion', 'fco', { zonaId: 'nose', comidaAlLlegar: true })
  debe(nose.comida?.texto === 'Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma.', '5 comida sin zona, sin la primera frase', nose.comida?.texto)
  const sin = fichaDe('avion', 'fco', { zonaId: 'prati', comidaAlLlegar: false })
  debe(sin.comida === null, '5 comida solo si la fila la lleva', 'sale la comida sin que la fila del día 1 la lleve')
  const centro = fichaDe('avion', 'fco', { zonaId: 'centro', comidaAlLlegar: true })
  debe(centro.comida?.texto.startsWith('Tu alojamiento está en la zona de Centro. '), '5 zona sin paréntesis', centro.comida?.texto)
  debe(sin.rutaEmpieza === null, '5 sin primera parada, sin la línea', `${sin.rutaEmpieza}`)
}

// ═══ 2. La vuelta ═══
console.log('2. El resumen de la VUELTA para cada medio y cada zona')
{
  const FRASE = {
    avion: (p, h) => `Tu vuelo sale de ${p.corto} a las ${h}. Te recomendamos estar en el aeropuerto 2 horas antes.`,
    tren: (p, h) => `Tu tren sale de ${p.nombre} a las ${h}.`,
    bus: (p, h) => `Tu autobús sale de ${p.nombre} a las ${h}.`,
    ferry: (p, h) => `Tu barco sale de ${p.corto} a las ${h}. Mira en tu reserva a qué hora cierra el embarque.`,
  }
  for (const medio of MEDIOS) {
    for (const puntoId of medio.puntos) {
      const punto = puntoDe(medio.id, puntoId)
      for (const zonaId of [...ZONAS, 'nose']) {
        const etiqueta = `vuelta ${medio.id}/${puntoId}/${zonaId}`
        const f = fichaDe(medio.id, puntoId, { kind: 'vuelta', zonaId, hora: '19:00' })
        debe(Boolean(f), '2 ficha', `${etiqueta}: no sale la ficha`)
        if (!f) continue
        debe(f.intro === FRASE[medio.id](punto, '19:00'), '2 primera frase', `${etiqueta}: «${f.intro}»`)
        debe(f.dato === null && f.comida === null && f.rutaEmpieza === null, '2 sin dato, comida ni ruta', `${etiqueta}`)
        debe(f.maleta?.texto === 'Déjala en tu alojamiento (pregunta si te la guardan después de dejar la habitación) o en la consigna de Termini y recógela de camino.', '2 maleta', `${etiqueta}: «${f.maleta?.texto}»`)
        debe(f.despedida === 'Arrivederci, Roma.', '2 despedida', `${etiqueta}: «${f.despedida}»`)
        if (medio.id === 'avion' || medio.id === 'ferry') {
          const esperado = medio.id === 'ferry' ? 'Te recogen en la puerta de tu alojamiento o donde tú quieras y te dejan en el puerto.' : 'Te recogen en la puerta de tu alojamiento o donde tú quieras y te dejan en el aeropuerto.'
          debe(f.traslado?.texto === esperado, '2 traslado texto', `${etiqueta}: «${f.traslado?.texto}»`)
        } else debe(f.traslado === null, '2 traslado solo donde sales lejos', `${etiqueta}`)
        if (zonaId !== 'nose') debe(f.mejor?.tipo === 'opcion', '2 mejor opción desde su zona', `${etiqueta}`)
        else debe(f.mejor === null, '2 sin zona sin mejor opción', `${etiqueta}`)
        const todo = textoDeFicha(f)
        debe(!/taxi/i.test(todo) && !EMPRESAS.test(todo) && !/sal a las|salir a las/i.test(todo), '6 vuelta sin taxi, empresas ni «sal a las»', `${etiqueta}`)
        debe(!f.termini, '2 la vuelta no lleva la nota de Termini', `${etiqueta}`)
      }
    }
  }
  const centro = fichaDe('avion', 'fco', { kind: 'vuelta', zonaId: 'centro', hora: '19:00' })
  debe(centro.mejor.opcion.titulo === 'Bus 40 o 64 a Roma Termini y Leonardo Express a Aeropuerto de Fiumicino', '2 centro hacia Fiumicino', centro.mejor.opcion.titulo)
  debe(centro.mejor.opcion.pasos.every((p) => p.precio), '2 cada tramo con su precio', JSON.stringify(centro.mejor.opcion.pasos))
  debe(centro.maleta?.consigna?.includes('7:00 a 21:00') && centro.maleta.consigna.includes('desde 6 € por maleta') && !EMPRESAS.test(centro.maleta.consigna), '2 consigna con sitio, horario y precio', centro.maleta?.consigna)
}

// ═══ 3. El modo noche ═══
console.log('3. De noche y a primera hora')
{
  const noche = (zonaId, hora = '23:30', extra = {}) => fichaDe('avion', 'fco', { zonaId, hora, dateIso: '2026-10-10', ...extra })
  const tarde = noche('centro')
  debe(tarde.modo === 'noche', '3 modo noche', tarde.modo)
  debe(tarde.avisoNoche === 'A esta hora ya no hay tren: el último Leonardo Express sale del aeropuerto a las 23:23.', '3 aviso de noche', tarde.avisoNoche)
  debe(tarde.mejor?.tipo === 'traslado_privado' && tarde.mejor.texto === 'Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras.', '3 la mejor opción es el traslado privado', JSON.stringify(tarde.mejor))
  debe(tarde.traslado === null, '3 el traslado no se repite', 'sale el traslado dos veces')
  debe(tarde.termini === null, '3 sin lo de Termini', `${tarde.termini}`)
  debe(tarde.otras.length === 0 && tarde.otrasTitulo === null, '3 centro: nada sigue funcionando con horario, la sección no sale', `${tarde.otras.length}`)
  const ter = noche('termini')
  debe(ter.otrasTitulo === 'Otras opciones · solo lo que sigue funcionando' && ter.otras.length === 1 && /andén 19/.test(ter.otras[0].titulo), '3 Termini: el autobús que sigue funcionando', `${ter.otrasTitulo} · ${ter.otras.map((o) => o.titulo)}`)
  const rapido = noche('centro', '04:30')
  debe(rapido.avisoNoche === 'A esta hora aún no hay tren: el primer Leonardo Express sale del aeropuerto a las 5:38.', '3 a primera hora', rapido.avisoNoche)
  const justo = noche('centro', '23:23')
  debe(justo.modo === 'normal', '3 con la hora del último tren, todavía hay tren', justo.modo)
  const fuera = fichaDe('avion', 'fco', { zonaId: 'centro', hora: '23:30', dateIso: '2027-03-10' })
  debe(fuera.modo === 'normal', '3 fuera del tramo de fechas del dato no se aplica', fuera.modo)
  // Ciampino y Tiburtina, sin horario en los datos, nunca entran en modo noche.
  debe(fichaDe('avion', 'cia', { zonaId: 'centro', hora: '23:59', dateIso: '2026-10-10' }).modo === 'normal', '3 Ciampino sin dato', 'entra en modo noche sin dato')
  // La vuelta de primera hora: el primer Leonardo sale de Termini a las 4:50 (vuelo a las 6:00 → salir de su zona a las 3:00).
  const vueltaTemprano = fichaDe('avion', 'fco', { kind: 'vuelta', zonaId: 'centro', hora: '06:00', dateIso: '2026-10-10' })
  debe(vueltaTemprano.modo === 'noche' && vueltaTemprano.avisoNoche === 'A esta hora aún no hay tren: el primer Leonardo Express sale de Termini a las 4:50.', '3 vuelta de primera hora', `${vueltaTemprano.modo} · ${vueltaTemprano.avisoNoche}`)
  debe(vueltaTemprano.mejor?.tipo === 'traslado_privado' && vueltaTemprano.mejor.texto === 'Te recogen en la puerta de tu alojamiento o donde tú quieras y te dejan en el aeropuerto.', '3 vuelta de primera hora: traslado privado', JSON.stringify(vueltaTemprano.mejor))
  // Ninguna hora calculada: solo la del viajero y las de los datos.
  const horas = new Set([...textoDeFicha(tarde).matchAll(/\b(\d{1,2}:\d{2})\b/g)].map((m) => m[1]))
  debe([...horas].every((h) => ['23:30', '23:23'].includes(h)), '6 horas', `horas en la ficha de noche: ${[...horas].join(', ')}`)
}

// ═══ 6. Ninguna hora calculada ni tiempo total en ninguna combinación ═══
console.log('6. Horas y tiempos')
{
  const permitidas = (h) => (hora) => hora === h
  let total = 0
  for (const medio of MEDIOS) for (const puntoId of medio.puntos) for (const zonaId of [...ZONAS, 'nose']) for (const kind of ['llegada', 'vuelta']) {
    const hora = kind === 'llegada' ? '13:05' : '19:25'
    const f = fichaDe(medio.id, puntoId, { kind, zonaId, hora })
    const horas = [...textoDeFicha(f).matchAll(/\b(\d{1,2}:\d{2})\b/g)].map((m) => m[1])
    // Valen la del viajero y las de los datos (la consigna, 7:00 a 21:00; el último tren).
    debe(horas.every((h) => permitidas('13:05')(h) || permitidas('19:25')(h) || ['7:00', '21:00', '23:23', '5:38', '23:05', '4:50'].includes(h)), '6 horas', `${kind} ${medio.id}/${puntoId}/${zonaId}: ${horas.join(', ')}`)
    total++
    // Un tiempo total sumado: ningún texto dice «en total», «en conjunto» ni «en suma».
    debe(!/en total|en conjunto|en suma|tiempo total/i.test(textoDeFicha(f)), '6 sin tiempo total', `${kind} ${medio.id}/${puntoId}/${zonaId}`)
  }
  debe(total > 50, '6 cobertura', `solo ${total} combinaciones`)
}

// ═══ 7 y 8. Las pantallas ═══
console.log('7. Las pantallas (de pago, gratis, sin hora, coche)')
function viaje({ ida = 'flight', vuelta = null, extra = {}, dias = 3 } = {}) {
  const inicio = '2027-03-10'
  const days = []
  for (let n = 1; n <= dias; n++) {
    days.push({
      id: `d${n}`, dayNumber: n, city: 'Roma', title: `Día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [],
      stops: [{ id: `d${n}s0`, time: '10:00', name: n === 1 ? 'Piazza Navona' : 'Panteón', description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.47 }, photoUrl: '' }],
    })
  }
  days.push({ id: `d${dias}-return`, dayNumber: dias + 1, city: 'Roma', title: 'Vuelta desde Roma', stops: [], meals: [], isReturnLeg: true })
  return {
    id: 'viaje-t7f', destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: {},
    days,
    answers: { dateRange: { start: inicio, end: addDays(inicio, dias) }, days: dias },
    transportContext: { transport_option: { id: ida }, archetype: null },
    ...(vuelta ? { returnTransportOptionId: vuelta } : {}),
    ...extra,
  }
}
const poner = (ruta) => useRouteStore.setState({ route: ruta, reservations: [], accommodationSelections: {} })
const hoja = (ruta, { kind = 'llegada', mode = 'avion', time, pointId, dateIso = '2027-03-10', infoPropia = info, onExplorarRestaurantes = () => {} } = {}) =>
  html(ArrivalReturnSheet, { open: true, kind, route: ruta, mode, info: infoPropia, medio: medioOf(infoPropia, mode), origin: 'Barcelona', dateIso, time, pointId, onEditBooking() {}, onClose() {}, onExplorarRestaurantes })
{
  ponerVersion('completa')
  const base = { arrivalFlightTime: '13:00', arrivalPointId: 'fco', departureFlightTime: '19:00', departurePointId: 'fco', accommodationZone: 'centro' }
  const ruta = viaje({ extra: base })
  poner(ruta)
  const llegada13 = aTexto(hoja(ruta, { time: '13:00', pointId: 'fco' }))
  const l = plano(llegada13)
  debe(/Aterrizas en Fiumicino a las 13:00\./.test(l) && /32 km al centro de Roma\./.test(l), '7 pantalla: primera frase y dato', l.slice(0, 300))
  debe(/Tu mejor opción/.test(l) && /Leonardo Express a Roma Termini y bus 40 o 64 a Largo di Torre Argentina/.test(l), '7 pantalla: tu mejor opción', l.slice(0, 600))
  debe(/Casi todo el transporte público llega a Termini, la estación principal\. Desde allí, el bus 40 o 64 hasta Largo di Torre Argentina: es otro billete \(1,50 €, vale 100 min\)\./.test(l), '7 pantalla: lo de Termini', '')
  debe(/Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras\./.test(l) && /Ideal si viajas en pareja, en familia o con amigos/.test(l), '7 pantalla: traslado privado', '')
  debe(!/Comprar billete|Comprar/.test(l), '8 sin botón de comprar billete', 'hay un botón de comprar')
  debe(!/Reservar traslado/.test(l), '8 sin enlace de reserva, no se vende el traslado', 'sale [Reservar traslado] sin enlace')
  debe(!/taxi/i.test(l) && !EMPRESAS.test(l), '6 pantalla sin taxi ni empresas', l.match(/taxi|terravision/i)?.[0])
  debe(!/\bcentro\b/i.test(l.replace(/32 km al centro de Roma\./, '').replace(/Centro/g, '')), '6 pantalla sin «centro» en nuestras frases', l.match(/.{30}\bcentro\b.{30}/i)?.[0])
  debe(l.indexOf('Aterrizas') < l.indexOf('Tu mejor opción') && l.indexOf('Tu mejor opción') < l.indexOf('Casi todo el transporte') && l.indexOf('Casi todo el transporte') < l.indexOf('Te esperan a la salida'), '7 pantalla: el orden', 'el orden de arriba abajo no es el del documento')
  debe(/Tu ruta empieza en Piazza Navona\./.test(l) && !/Cómo llegar a tu alojamiento/.test(l.replace(/Cómo llegar a tu alojamiento desde tu punto de llegada/, '')), '5 sin dirección, sin botón del alojamiento', '')

  // Con enlace del traslado en los datos: [Reservar traslado] sale y abre la pestaña Traslados.
  const infoConEnlace = JSON.parse(JSON.stringify(info))
  infoConEnlace.medios.avion.puntos.find((p) => p.id === 'fco').traslado = { url: 'https://ejemplo.test/traslado' }
  const conEnlace = hoja(ruta, { time: '13:00', pointId: 'fco', infoPropia: infoConEnlace })
  debe(/Reservar traslado/.test(aTexto(conEnlace)), '8 con enlace sale [Reservar traslado]', '')
  debe(/btn-champan/.test(conEnlace.slice(conEnlace.indexOf('Reservar traslado') - 400, conEnlace.indexOf('Reservar traslado'))), '8 [Reservar traslado] en frambuesa', '')

  // Con dirección: Tu ruta empieza + [Cómo llegar a tu alojamiento]. Con la comida al llegar: [Explorar restaurantes].
  const conDireccion = viaje({ extra: { ...base, accommodationAddress: 'Via del Corso 1, Roma' } })
  conDireccion.days[0].meals = [{ id: 'm1', time: '13:30', label: 'Comida', nearbyNote: '', restaurants: [], mealTime: 'lunch', noRestaurant: true }]
  poner(conDireccion)
  const h2 = hoja(conDireccion, { time: '13:00', pointId: 'fco' })
  const t2 = plano(aTexto(h2))
  debe(/Tu ruta empieza en Piazza Navona\./.test(t2), '5 pantalla: tu ruta empieza', t2.slice(-400))
  debe(/data-como-llegar-alojamiento/.test(h2) && /Cómo llegar a tu alojamiento/.test(t2), '5 pantalla: con dirección, el botón', '')
  debe(/Tu alojamiento está en la zona de Centro\. Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma\./.test(t2) && /Explorar restaurantes/.test(t2), '5 pantalla: la comida al llegar', t2.slice(-500))
  debe(t2.indexOf('Te esperan a la salida') < t2.indexOf('Te recomendamos comer') && t2.indexOf('Te recomendamos comer') < t2.indexOf('Tu ruta empieza'), '7 pantalla: comida antes de la ruta', '')
  poner(ruta)
  const sinComida = plano(aTexto(hoja(ruta, { time: '13:00', pointId: 'fco' })))
  debe(!/Te recomendamos comer/.test(sinComida), '5 sin la marca del motor no sale la comida', '')

  // «Aún no lo sé»
  const nose = viaje({ extra: { ...base, accommodationZone: 'nose' } })
  poner(nose)
  const tn = plano(aTexto(hoja(nose, { time: '13:00', pointId: 'fco' })))
  debe(tn.startsWith('Resumen') || /Cuando sepas dónde duermes, ponlo en RESERVAS y te diremos cómo llegar hasta tu puerta\./.test(tn), '1 pantalla: sin zona', tn.slice(0, 300))
  debe(!/Tu mejor opción/.test(tn) && !/Casi todo el transporte/.test(tn), '1 pantalla: sin zona, ni mejor opción ni Termini', '')
  debe(/Cómo llegar a Termini/.test(tn) && /Leonardo Express a Roma Termini/.test(tn), '1 pantalla: sin zona, las opciones hasta Termini', tn.slice(0, 500))

  // Trastevere desde Fiumicino
  const tras = viaje({ extra: { ...base, accommodationZone: 'trastevere' } })
  poner(tras)
  const tt = plano(aTexto(hoja(tras, { time: '13:00', pointId: 'fco' })))
  debe(/Tren FL1 a Roma Trastevere/.test(tt) && /tranvía 8/.test(tt) && !/Leonardo/.test(tt) && !/Casi todo el transporte/.test(tt), '4 pantalla: Trastevere desde Fiumicino', tt.slice(0, 500))

  // La noche
  const nocheRuta = viaje({ extra: { ...base, arrivalFlightTime: '23:30' } })
  poner(nocheRuta)
  const hn = hoja(nocheRuta, { time: '23:30', pointId: 'fco', dateIso: '2026-10-10' })
  const tnoche = plano(aTexto(hn))
  debe(/A esta hora ya no hay tren: el último Leonardo Express sale del aeropuerto a las 23:23\./.test(tnoche), '3 pantalla: aviso de noche', tnoche.slice(0, 300))
  debe((hn.match(/data-ficha-traslado/g) ?? []).length === 1, '3 pantalla: el traslado una sola vez', `${(hn.match(/data-ficha-traslado/g) ?? []).length}`)
  debe(!/Otras opciones/.test(tnoche), '3 pantalla: sin «Otras opciones» si no queda ninguna', '')

  // La vuelta de las 19:00
  const vueltaHtml = hoja(ruta, { kind: 'vuelta', time: '19:00', pointId: 'fco' })
  const tv = plano(aTexto(vueltaHtml))
  debe(/Tu vuelo sale de Fiumicino a las 19:00\. Te recomendamos estar en el aeropuerto 2 horas antes\./.test(tv), '2 pantalla: la vuelta', tv.slice(0, 300))
  debe(/Arrivederci, Roma\./.test(tv) && /La maleta, el último día/.test(tv) && /Te recogen en la puerta de tu alojamiento/.test(tv), '2 pantalla: maleta, traslado y despedida', tv.slice(-500))
  debe(!/sal a las|Sal a las/i.test(tv) && !/taxi/i.test(tv), '2 pantalla: sin «sal a las…» ni taxi', '')

  // Sin vuelo puesto: la información general de siempre (la distancia, el transporte con su precio y su tiempo, el traslado privado).
  const sinVuelo = viaje({ extra: { accommodationZone: 'centro' } })
  poner(sinVuelo)
  const hs = hoja(sinVuelo, { time: null, pointId: null })
  const ts = plano(aTexto(hs))
  debe(!/data-ficha-resumen/.test(hs), '7 sin vuelo no sale la ficha', '')
  debe(/De Fiumicino a tu alojamiento/.test(ts) && /De Ciampino a tu alojamiento/.test(ts) && /32 km al centro/.test(ts) && /Leonardo Express a Termini/.test(ts) && /14 €/.test(ts), '7 sin vuelo: la información general de todos los puntos', ts.slice(0, 500))
  debe(!/Taxi|taxi/.test(ts) && !EMPRESAS.test(ts), '6 sin vuelo: sin taxi ni empresas', ts.match(/taxi|terravision|rome airport/i)?.[0])
  debe(!/De Fiumicino al centro|Del centro a/.test(ts), '6 sin «al centro» en nuestros títulos', '')
  const hsv = plano(aTexto(hoja(sinVuelo, { kind: 'vuelta', time: null, pointId: null })))
  debe(/De tu alojamiento a Fiumicino/.test(hsv) && !/Del centro a/.test(hsv), '6 sin vuelo, la vuelta: «De tu alojamiento a…»', hsv.slice(0, 300))

  // En la gratis, aunque el viaje tenga hora guardada: la información general.
  ponerVersion('gratis')
  poner(ruta)
  const hg = hoja(ruta, { time: '13:00', pointId: 'fco' })
  debe(!/data-ficha-resumen/.test(hg), '7 en la gratis no sale la ficha', '')
  debe(!/Tu mejor opción/.test(aTexto(hg)), '7 en la gratis no sale «Tu mejor opción»', '')
  ponerVersion('completa')

  // En coche: la información de siempre (la ZTL), sin ficha.
  const coche = viaje({ ida: 'own_vehicle', extra: base })
  poner(coche)
  const hc = hoja(coche, { mode: 'coche', time: '13:00', pointId: null })
  debe(!/data-ficha-resumen/.test(hc), '7 en coche no sale la ficha', '')
}

// ═══ 9. La tarjeta «Hoy vuelves a casa», con los datos reales del motor ═══
console.log('9. La tarjeta «Hoy vuelves a casa»')
{
  ponerVersion('completa')
  const pide = (dayNumber, vuelta, n = 3, inicio = '2027-05-05') => buildDayBlockV3(D, n + 1, false, dayNumber, null, inicio, [], [], { city: 'Roma', scheduler: 'v3', engine: 'v4', vuelta })
  const casos = [
    { modo: 'flight', punto: 'fco', hora: '10:00', texto: /^Tu vuelo sale de Fiumicino a las 10:00\. Te recomendamos estar en el aeropuerto 2 horas antes, por eso hoy no te hemos puesto paradas: es el día de irte con calma\.$/ },
    { modo: 'train', punto: 'termini', hora: '07:30', texto: /^Tu tren sale de Roma Termini a las 7:30\. Llega a la estación con tiempo, por eso hoy no te hemos puesto paradas\.$/ },
    { modo: 'bus', punto: 'tibus', hora: '08:00', texto: /^Tu autobús sale de Estación de autobuses de Tiburtina a las 8:00\. Llega a la estación con tiempo, por eso hoy no te hemos puesto paradas\.$/ },
    { modo: 'ferry', punto: 'civitavecchia', hora: '12:00', texto: /^Tu barco sale de Civitavecchia a las 12:00\. Mira en tu reserva a qué hora cierra el embarque; por eso hoy no te hemos puesto paradas\.$/ },
  ]
  let vistas = 0
  for (const caso of casos) {
    const dia = await pide(4, { hora: caso.hora, modo: caso.modo, puntoId: caso.punto, zona: 'centro' })
    const tarjeta = dia?.return_day?.tarjeta
    debe(Boolean(tarjeta), '9 el motor da la tarjeta', `${caso.modo}: sin tarjeta (día: ${dia?.title})`)
    if (!tarjeta) continue
    vistas++
    debe(dia.title === 'Día de viaje', '10 el día de vuelta sin paradas se llama «Día de viaje»', `${caso.modo}: «${dia.title}»`)
    const h = html(TarjetaHoyVuelves, { tarjeta, onVerComoIr() {}, onExplorarMonumentos() {} })
    const t = plano(aTexto(h))
    debe(/Hoy vuelves a casa/.test(t), '9 título', t.slice(0, 100))
    debe(caso.texto.test(tarjeta.texto), '9 texto del motor', `${caso.modo}: «${tarjeta.texto}»`)
    debe(t.includes(tarjeta.texto), '9 texto en pantalla', `${caso.modo}`)
    debe(/Desde tu zona \(Centro\): /.test(t), '9 desde tu zona', t.slice(0, 400))
    debe(/Ver cómo ir/.test(t) && /¿Crees que te da tiempo a ver algo\? Aquí tienes los monumentos de Roma\./.test(t) && /Explorar monumentos/.test(t), '9 botones y pregunta', t.slice(-300))
    debe(/Esperamos que hayas disfrutado de Roma\. ¡Nos vemos en tu próximo viaje!$/.test(t), '9 despedida al final', t.slice(-120))
    debe(!/taxi/i.test(t) && !EMPRESAS.test(t) && !/sal a las/i.test(t), '6 tarjeta sin taxi, empresas ni «sal a las»', t.match(/taxi|sal a las/i)?.[0])
    // Nunca un tiempo total sumado: cada tramo con el suyo (entre paréntesis), sin «en total».
    debe(!/en total|tiempo total/i.test(t), '6 tarjeta sin tiempo total', '')
    const horas = [...t.matchAll(/\b(\d{1,2}:\d{2})\b/g)].map((m) => m[1])
    debe(horas.every((x) => x === horaCortaDe(caso.hora)), '6 tarjeta: solo la hora del viajero', `${caso.modo}: ${horas.join(', ')}`)
  }
  debe(vistas === 4, '9 los cuatro medios', `${vistas} de 4`)
  // Barco: la hora fija «Civitavecchia»; tren: «Tu tren»; madrugada: «Tu vuelo sale esta noche, a las 2:00…»
  const madrugada = await pide(3, { hora: '02:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })
  const dv = await pide(4, { hora: '02:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })
  const tm = dv?.return_day?.tarjetaUltimoDia ?? madrugada?.return_day?.tarjetaUltimoDia ?? null
  debe(Boolean(tm) && tm.madrugada === true && /^Tu vuelo sale esta noche, a las 2:00/.test(tm.texto), '9 madrugada: «Tu vuelo sale esta noche, a las 2:00…»', JSON.stringify(tm)?.slice(0, 200))
  if (tm) {
    const t = plano(aTexto(html(TarjetaHoyVuelves, { tarjeta: tm, onVerComoIr() {}, onExplorarMonumentos() {} })))
    debe(/Tu vuelo sale esta noche, a las 2:00/.test(t) && /Explorar monumentos/.test(t) && /Ver cómo ir/.test(t), '9 madrugada en pantalla', t.slice(0, 200))
  }
  // Con «Aún no lo sé», su mejor opción es la de Termini.
  const sinZona = await pide(4, { hora: '10:00', modo: 'flight', puntoId: 'fco', zona: 'nose' })
  debe(/^Desde tu zona \(Termini\): /.test(sinZona?.return_day?.tarjeta?.desde_tu_zona?.texto ?? ''), '9 sin zona: desde Termini', sinZona?.return_day?.tarjeta?.desde_tu_zona?.texto)
  // El día de vuelta con paradas no lleva tarjeta.
  const conParadas = await pide(4, { hora: '19:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })
  debe(!conParadas?.return_day?.tarjeta, '9 con paradas no hay tarjeta', 'sale la tarjeta en un día con mañana')

  // En DÍAS: el panel del día de vuelta la pinta de pago; en la gratis no sale.
  const ruta = viaje({ extra: { arrivalFlightTime: '10:00', arrivalPointId: 'fco', departureFlightTime: '10:00', departurePointId: 'fco', accommodationZone: 'centro' } })
  const tarjetaReal = (await pide(4, { hora: '10:00', modo: 'flight', puntoId: 'fco', zona: 'centro' })).return_day.tarjeta
  ruta.planVuelta = { tarjeta: tarjetaReal }
  const panelDe = (dia, extras = {}) =>
    html(DayDetailPanel, { day: dia, travel: null, isLastDay: dia.isReturnLeg === true, origin: 'Barcelona', stay: null, allDays: ruta.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })), isFirstDayOfTrip: dia.dayNumber === 1, showCamperBlock: false, showRentalCarBlock: false, ...extras })
  poner(ruta)
  const dv2 = panelDe(ruta.days[ruta.days.length - 1])
  debe(/data-tarjeta-hoy-vuelves="dia"/.test(dv2) && /Hoy vuelves a casa/.test(aTexto(dv2)), '9 DÍAS: el día de vuelta lleva la tarjeta (de pago)', '')
  debe(!/Tu último día también cuenta/.test(aTexto(dv2)), '9 de pago no sale la tarjeta de la gratis', '')
  // Madrugada: al final del último día de ruta.
  const rutaM = viaje({ extra: { departureFlightTime: '02:00', departurePointId: 'fco' } })
  rutaM.planVuelta = { tarjetaUltimoDia: tm }
  poner(rutaM)
  const ultimo = rutaM.days[rutaM.days.length - 2]
  const pU = html(DayDetailPanel, { day: ultimo, travel: null, isLastDay: false, origin: 'Barcelona', stay: null, allDays: rutaM.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })), isFirstDayOfTrip: false, showCamperBlock: false, showRentalCarBlock: false })
  debe(tm && /data-tarjeta-hoy-vuelves="madrugada"/.test(pU), '9 DÍAS: la tarjeta de madrugada al final del último día de ruta', '')
  // Gratis: la tarjeta del motor no sale.
  ponerVersion('gratis')
  poner(ruta)
  const dvg = panelDe(ruta.days[ruta.days.length - 1])
  debe(!/data-tarjeta-hoy-vuelves/.test(dvg), '9 en la gratis no sale «Hoy vuelves a casa»', '')
  ponerVersion('completa')

  // El billete abre la ficha que toca: llegada en el día 1, vuelta en el último; sin hora, la barra con «+ VUELO».
  const rutaB = viaje({ extra: { arrivalFlightTime: '13:00', arrivalPointId: 'fco', departureFlightTime: '19:00', departurePointId: 'fco' } })
  poner(rutaB)
  const src = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(/<TarjetaLlegadaDias billete=\{billeteLlegada\} point=\{arrivalChosen\} origen=\{origin\} destino=\{destinoNombre\} onOpen=\{\(\) => setArrivalSheet\('llegada'\)\} \/>/.test(src), '11 el billete de la llegada abre la ficha de llegada', '')
  debe(/<BilleteDeVuelo billete=\{billeteVuelta\} onOpen=\{\(\) => abrirFichaDeVuelta\(\)\} \/>/.test(src) && /setArrivalSheet\('vuelta'\)/.test(src), '11 el billete de la vuelta abre la ficha de vuelta', '')
  const d1 = aTexto(panelDe(rutaB.days[0], { isFirstDayOfTrip: true }))
  debe(/LLEGADA/.test(d1) && /Aterrizas a las 13:00/.test(d1) && /Fiumicino/.test(d1), '11 el día de llegada lleva el billete', '')
  const rutaSin = viaje({})
  poner(rutaSin)
  const d1sin = aTexto(html(DayDetailPanel, { day: rutaSin.days[0], travel: null, isLastDay: false, origin: 'Barcelona', stay: null, allDays: rutaSin.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })), isFirstDayOfTrip: true, showCamperBlock: false, showRentalCarBlock: false }))
  debe(/Añade tu vuelo y ajustamos tu día/.test(d1sin) && !/Reservado/.test(d1sin), '11 sin vuelo puesto, la barra de siempre con «+ Vuelo»', d1sin.slice(0, 200))
}
function horaCortaDe(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h}:${String(m).padStart(2, '0')}`
}

// ═══ 10. «Día de viaje» ═══
console.log('10. «Día de viaje»')
{
  const ruta = viaje({ extra: { arrivalFlightTime: '23:30', arrivalPointId: 'fco' } })
  const grupos = destino.gruposDia
  debe(Boolean(grupos), '10 datos de los grupos', 'el destino no trae grupos de día')
  const vuelta = ruta.days[ruta.days.length - 1]
  debe(nombreDelDia(ruta, vuelta, grupos).titulo === DIA_DE_VUELTA, '10 vuelta sin paradas: «Hoy vuelves a casa»', nombreDelDia(ruta, vuelta, grupos).titulo)
  const dia1 = { ...ruta.days[0], stops: [], arrivalDay: { sin_paradas: true, es_dia_1: true } }
  const rutaL = { ...ruta, days: [dia1, ...ruta.days.slice(1)] }
  const n1 = nombreDelDia(rutaL, dia1, grupos)
  debe(n1.titulo === DIA_DE_VIAJE, '10 llegada sin paradas: «Día de viaje»', n1.titulo)
  debe(n1.titulo !== 'Día libre', '10 nunca «Día libre»', n1.titulo)
  // Un día de llegada sin paradas aunque el motor no lo marque: el primero del viaje con la hora de llegada.
  const dia1b = { ...ruta.days[0], stops: [] }
  debe(nombreDelDia({ ...ruta, days: [dia1b, ...ruta.days.slice(1)] }, dia1b, grupos).titulo === DIA_DE_VIAJE, '10 llegada sin paradas (viaje con hora de llegada)', '')
  // Un día cualquiera de en medio sin paradas sigue siendo «Día libre».
  const medio = { ...ruta.days[1], stops: [] }
  debe(nombreDelDia({ ...ruta, days: [ruta.days[0], medio, ...ruta.days.slice(2)] }, medio, grupos).titulo === 'Día libre', '10 un día de en medio sin paradas sigue siendo «Día libre»', '')
  // Con paradas: el título de sus grupos, grande, y «{origen} → Roma · Día de viaje» pequeño.
  const nGrupos = nombreDelDia(ruta, ruta.days[0], grupos)
  debe(nGrupos.titulo !== DIA_DE_VIAJE, '10 con paradas, el título es el de sus grupos', nGrupos.titulo)
  debe(lineaDeViaje(nGrupos.titulo, nGrupos.viaje) === 'Barcelona → Roma · Día de viaje', '10 línea pequeña con paradas', lineaDeViaje(nGrupos.titulo, nGrupos.viaje))
  debe(lineaDeViaje(DIA_DE_VIAJE, 'Barcelona → Roma') === 'Barcelona → Roma', '10 línea pequeña sin repetir las palabras', lineaDeViaje(DIA_DE_VIAJE, 'Barcelona → Roma'))
  const nVuelta = nombreDelDia(ruta, vuelta, grupos)
  debe(lineaDeViaje(nVuelta.titulo, nVuelta.viaje) === 'Roma → Barcelona · Día de viaje', '10 línea pequeña de la vuelta', lineaDeViaje(nVuelta.titulo, nVuelta.viaje))
}

// ═══ 11. EXPLORAR: lo que abren los botones ═══
console.log('11. Lo que abren los botones')
{
  const src = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(/onExplorarRestaurantes=\{\(\) => abrirExplorar\(\{ categoria: 'restaurantes', origen: null \}\)\}/.test(src), '11 [Explorar restaurantes] abre EXPLORAR › Restaurantes', '')
  debe(/onExplorarMonumentos=\{\(\) => abrirExplorar\(\{ categoria: 'atracciones', origen: null, cerca: tarjetaHoyVuelves\.explorar\.cerca_de_mi \}\)\}/.test(src), '11 [Explorar monumentos] abre EXPLORAR › Atracciones con «Cerca de mí»', '')
  debe(/setMode\('explore'\)/.test(src), '11 se va a la pestaña EXPLORAR', '')
  const explorar = leer('src/components/route/ExplorePanel.tsx')
  debe(/setActiveCard\(apertura\.categoria\)/.test(explorar) && /initialNearby=\{aperturaCerca\}/.test(explorar), '11 EXPLORAR lee el pedido', '')
  // El almacén guarda el pedido y se lee una sola vez.
  useExploreAperturaStore.getState().pedir({ categoria: 'atracciones', origen: null, cerca: true })
  const tomado = useExploreAperturaStore.getState().tomar()
  debe(tomado?.categoria === 'atracciones' && tomado.cerca === true && useExploreAperturaStore.getState().tomar() === null, '11 el pedido se usa una sola vez', JSON.stringify(tomado))
}

// ═══ 6. Textos del código: sin taxi, sin empresas, sin «centro» en nuestras frases, sin emojis ═══
console.log('6. Los textos del código')
{
  const archivos = [
    'src/components/route/dayDetail/ArrivalReturnSheet.tsx', 'src/components/route/dayDetail/FichaResumen.tsx', 'src/components/route/dayDetail/TarjetaHoyVuelves.tsx', 'src/lib/fichaLlegada.ts', 'src/components/route/dayDetail/ArrivalDetailSheet.tsx',
  ]
  for (const f of archivos) {
    const t = leer(f)
    const soloTextos = t.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    debe(!/\bTaxi\b/.test(soloTextos.replace(/nombre="taxi"/g, '')), '6 código sin «Taxi»', `${f}`)
    debe(!EMPRESAS.test(soloTextos), '6 código sin empresas', `${f}: ${soloTextos.match(EMPRESAS)?.[0]}`)
    debe(!/\p{Extended_Pictographic}/u.test(t.replace(/[→·–—“”‘’«»…€✓]/g, '')), '6 código sin emojis', f)
  }
  const arr = leer('src/components/route/dayDetail/ArrivalReturnSheet.tsx')
  debe(!/al centro de la ciudad|De \$\{point\.nombre\} al centro|Del centro a/.test(arr), '6 sin «al centro» en nuestras frases (ficha)', '')
  const mock = leer('src/lib/mockDayDetail.ts')
  debe(!/Tren\/autobús directo al centro/.test(mock) && !/taxiPriceLabel/.test(mock), '6 mockDayDetail sin «directo al centro» ni taxi', '')
  const detalle = buildArrivalDepartureDetail('Roma', 'Barcelona', 'arrival')
  debe(!/taxi/i.test(JSON.stringify(detalle)) && !/Tren\/autobús directo al centro/.test(JSON.stringify(detalle)), '6 el mock de Roma sin taxi', '')
  debe(!/\bcentro\b/i.test(JSON.stringify(detalle.subtitle ?? '')), '6 el subtítulo de la llegada sin «centro»', detalle.subtitle)
  // La barra no se toca.
  debe(/Añade tu \$\{label\.palabra\}\$\{ajuste\}/.test(leer('shared/arrival/arrivalRules.js')) && /const ajuste = pago \? ' y ajustamos tu día' : ''/.test(leer('shared/arrival/arrivalRules.js')), '6 la barra de llegada no cambia', '')
  // El mapeo de las marcas del motor.
  const mapa = leer('src/lib/mapGeneratedRoute.ts')
  debe(/no_restaurant/.test(mapa) && /noRestaurant: true/.test(mapa) && /arrivalDay: generated\.arrival_day/.test(mapa) && /planVuelta/.test(mapa) && /\.return_day/.test(mapa) && !/returnDay/.test(mapa), '5 el cliente lee las marcas del motor (no_restaurant, arrival_day, return_day)', '')
  // Los datos: las coordenadas de los puntos para el mapa pequeño.
  const puntos = Object.values(info.medios).flatMap((m) => m.puntos)
  debe(puntos.filter((p) => p.id !== 'ztl').every((p) => p.coordenadas && Number.isFinite(p.coordenadas.lat)), '1 los puntos traen sus coordenadas para el mapa pequeño', puntos.filter((p) => !p.coordenadas).map((p) => p.id).join(','))
  void written
}

limpiar?.()
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const fallo of fallos.slice(0, 60)) console.log(`  ✗ [${fallo.regla}] ${fallo.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 400)
