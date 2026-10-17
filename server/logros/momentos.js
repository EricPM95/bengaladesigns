/**
 * LOS MOMENTOS (Tanda 8A): de lo nuevo que ha ganado alguien tras un Visto o una foto, la lista en el orden en que se enseña. Las pantallas llegan en la 8b.
 *
 * El orden sale de `data/logros/ajustes.json › orden_momentos` (lo que suma, colecciones completadas, emblema, sello, país y destino nuevos, maravilla y Patrimonio,
 * logros de viajero), el ÚNICO sitio donde se decide (Tanda 8B2). Si Design pone otro orden en «Logros · Momentos», se cambia ahí, sin tocar el código.
 * Cada momento lleva `primera_vez`. La frase de suspense de antes del emblema sale SOLO la primera vez, al azar y sin repetir la última que vio esa persona;
 * al volver a verlo guardado, sin frase.
 */

import { GLOBAL, categoriaDe, clave } from './motor.js'

const rellenar = (texto, v) => String(texto ?? '').replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`))
const MAYUS = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/** La frase de suspense: al azar entre las de los ajustes, sin repetir la última que vio esa persona. */
export function elegirFrase(frases, ultima, azar = Math.random) {
  const posibles = frases.filter((f) => f !== ultima)
  const lista = posibles.length > 0 ? posibles : frases
  return lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))]
}

/**
 * @param {object} e
 * @param {object} e.datos
 * @param {Array}  e.nuevos      lo que hay en «después» y no en «antes» (motor.diferencia)
 * @param {Map}    e.despues     todo lo ganado después
 * @param {Map}    e.antes       todo lo ganado antes
 * @param {string|null} e.ultimaFrase  la última frase de suspense que vio esta persona
 * @param {Function} [e.azar]
 * @returns {Array<object>} los momentos, en orden
 */
export function armarMomentos({ datos, nuevos, despues, antes, ultimaFrase = null, azar = Math.random }) {
  const ajustes = datos.ajustes
  const salida = []
  const orden = (tipo) => {
    const i = ajustes.orden_momentos.indexOf(tipo)
    return i < 0 ? 99 : i
  }
  const cuenta = (logro, hasta) => [...despues.values()].filter((it) => it.logro === logro && new Date(it.en) <= new Date(hasta.en)).length
  const pedazosPorColeccion = new Map()
  const sellosPorId = new Map()
  let frase = ultimaFrase

  for (const it of nuevos) {
    const d = datos.destinos[it.destino] ?? null
    const cat = categoriaDe(it.logro)
    if (cat === 'emblema') {
      const em = d.emblemas.find((x) => x.id === it.escalon)
      const f = elegirFrase(ajustes.frases_suspense, frase, azar)
      frase = f
      salida.push({ tipo: 'emblema', cat: 'emblema', clave: it.clave, id: em.id, destino: it.destino, nombre: em.nombre, linea: em.linea, momento: em.tipo === 'momento', maravilla: d.sitios?.[em.sitio]?.maravilla ?? null, primera_vez: true, frase: f, en: it.en })
    } else if (cat === 'pedazo') {
      const [col, sitio] = it.escalon.split(':')
      if (!pedazosPorColeccion.has(col)) pedazosPorColeccion.set(col, { destino: it.destino, sitios: [] })
      pedazosPorColeccion.get(col).sitios.push(sitio)
    } else if (cat === 'coleccion') {
      const c = d.colecciones.find((x) => x.id === it.escalon)
      salida.push({ tipo: 'coleccion', cat: 'coleccion', clave: it.clave, id: c.id, destino: it.destino, nombre: c.nombre, linea: c.al_completar, primera_vez: true, en: it.en })
    } else if (cat === 'sello') {
      const [sid, grado] = it.escalon.split(':')
      const anterior = sellosPorId.get(sid)
      const s = d.sellos.find((x) => x.id === sid)
      const g = s.grados.find((x) => x.grado === grado)
      // Solo sube un grado a la vez en pantalla: si se ganan varios de golpe, sale el más alto.
      if (!anterior || s.grados.indexOf(g) > s.grados.indexOf(anterior.g)) sellosPorId.set(sid, { s, g, it, d })
    } else if (cat === 'pais') {
      salida.push({ tipo: 'pais', cat: 'pais', clave: it.clave, pais: it.escalon, n: cuenta('pais', it), nombre: `Tu país número ${cuenta('pais', it)}: ${it.escalon}`, primera_vez: true, en: it.en })
    } else if (cat === 'destino_nuevo') {
      const dd = datos.destinos[it.escalon]
      salida.push({ tipo: 'destino_nuevo', cat: 'destino_nuevo', clave: it.clave, destino: it.escalon, n: cuenta('destino_nuevo', it), nombre: `Tu destino número ${cuenta('destino_nuevo', it)}: ${dd?.ciudad ?? it.escalon}`, primera_vez: true, en: it.en })
    } else if (cat === 'continente') {
      salida.push({ tipo: 'continente', cat: 'continente', clave: it.clave, continente: it.escalon, nombre: `Nuevo continente: ${it.escalon}`, primera_vez: true, en: it.en })
    } else if (cat === 'maravilla') {
      const m = datos.viajero.maravillas[it.escalon]
      salida.push({ tipo: 'maravilla', cat: 'maravilla', clave: it.clave, id: it.escalon, n: cuenta('maravilla', it), nombre: m?.nombre ?? it.escalon, linea: m?.linea ?? null, primera_vez: true, en: it.en })
    } else if (cat === 'patrimonio') {
      const p = Object.values(datos.destinos).map((x) => x.patrimonios?.[it.escalon]).find(Boolean)
      salida.push({ tipo: 'patrimonio', cat: 'patrimonio', clave: it.clave, id: it.escalon, nombre: p?.nombre ?? it.escalon, primera_vez: true, en: it.en })
    } else if (cat === 'viajero') {
      const id = it.logro.slice('viajero:'.length)
      const def = datos.viajero.logros.find((x) => x.id === id)
      const esc = def?.escalones?.find((x) => String(x.n) === String(it.escalon))
      const dd = datos.destinos[it.destino]
      const vals = { ciudad: dd?.ciudad ?? '', anio: it.escalon, total: dd?.emblemas?.length ?? '', limite: dd?.pionero?.limite ?? '', n: it.escalon }
      const nombre = rellenar(esc?.nombre ?? def?.nombre ?? id, vals)
      const linea = rellenar(esc?.linea ?? def?.linea ?? '', vals)
      salida.push({ tipo: 'viajero', cat: 'viajero', clave: it.clave, logro: id, escalon: it.escalon, destino: it.destino, nombre: MAYUS(nombre), linea, primera_vez: true, en: it.en })
    }
  }

  // Lo que suma: una línea por colección y por sello, con «1 de 8».
  for (const [col, info] of pedazosPorColeccion) {
    const d = datos.destinos[info.destino]
    const c = d.colecciones.find((x) => x.id === col)
    const n = c.sitios.filter((s) => despues.get(clave(info.destino, 'pedazo', `${col}:${s}`))).length
    salida.push({ tipo: 'suma', cat: 'pedazo', coleccion: col, destino: info.destino, nombre: c.nombre, n, total: c.sitios.length, sitios: info.sitios, linea: `${n} de ${c.sitios.length}`, primera_vez: true })
    for (const s of d.sellos.filter((x) => x.coleccion === col)) {
      salida.push({ tipo: 'suma_sello', cat: 'pedazo', sello: s.id, destino: info.destino, nombre: s.nombre, n, total: c.sitios.length, linea: `${n} de ${c.sitios.length}`, primera_vez: true })
    }
  }
  for (const { s, g, it, d } of sellosPorId.values()) {
    const col = d.colecciones.find((x) => x.id === s.coleccion)
    const n = col.sitios.filter((x) => despues.get(clave(it.destino, 'pedazo', `${col.id}:${x}`))).length
    salida.push({ tipo: 'sello', cat: 'sello', clave: it.clave, sello: s.id, destino: it.destino, grado: g.grado, nombre: g.nombre, linea: rellenar(g.linea, { n, total: col.sitios.length, ciudad: d.ciudad }), primera_vez: true, en: it.en })
  }
  void antes
  void GLOBAL
  // El orden de los momentos: primero por categoría (ajustes.orden_momentos; lo que suma va con los pedazos), después por la hora.
  const pos = (m) => orden(m.cat)
  const ordenados = salida
    .map((m, i) => ({ m, i }))
    .sort((a, b) => pos(a.m) - pos(b.m) || (a.m.en && b.m.en ? new Date(a.m.en) - new Date(b.m.en) : 0) || a.i - b.i)
    .map(({ m }) => m)
  // (8B4) Las maravillas ya no van pegadas a su emblema: el emblema sale con su película y la maravilla va en «Y además…», en su sitio de `orden_momentos`.
  return ordenados
}
