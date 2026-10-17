/**
 * EL CEREBRO DE LOS LOGROS (Tanda 8A). Una función PURA: de los hechos de una persona (sus Vistos y sus fotos) saca TODO lo que ha ganado, con su fecha.
 * No lee la base de datos ni la hora del reloj: todo entra por parámetros. Por eso:
 *   - «volver a calcular todo» da siempre lo mismo (si cambian los datos, nada se descuadra);
 *   - «nunca da dos veces lo mismo»: cada cosa ganada tiene una clave única (`destino|logro|escalón`);
 *   - lo que se gana con un hecho nuevo es la DIFERENCIA entre calcular antes y después (server/logros/servicio.js).
 *
 * Qué gana cada cosa (docs/dias/PROMPT_TANDA8A.md, apartados 2 y 3):
 *   - Un pedazo de colección: un Visto válido CERCA del sitio (sin foto), o una foto válida de ese sitio.
 *   - Un emblema de sitio: siempre con una foto válida de ese sitio. Madrugador y Nocturno: foto válida en uno de los 8 imprescindibles, según la hora de la foto.
 *   - El sello: sale de los pedazos de su colección principal, sumados entre viajes.
 *   - Los logros de viajero: del primer Visto (o foto) válido en un sitio, de los viajes hechos con la app y de las fechas.
 * Un hecho solo cuenta si cae en las fechas de su viaje (hora del destino) y se recibió dentro del plazo de reclamar.
 * No tiene nada que ver con el motor de rutas.
 */

import { datosDeSitio } from './sitios.js'

/* ------------------------------------------------------------------ */
/* Fechas y horas (siempre en la hora del destino)                     */
/* ------------------------------------------------------------------ */

const formatos = new Map()
function formato(tz) {
  if (!formatos.has(tz)) {
    formatos.set(tz, new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }
  return formatos.get(tz)
}

/** La fecha y la hora de un instante en la zona del destino: { fecha: 'AAAA-MM-DD', hora, minuto, mes, dia, anio, minutos }. */
export function parteLocal(instante, tz) {
  const t = new Date(instante)
  if (Number.isNaN(t.getTime())) return null
  const p = Object.fromEntries(formato(tz).formatToParts(t).map((x) => [x.type, x.value]))
  const hora = Number(p.hour)
  const minuto = Number(p.minute)
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora, minuto, mes: Number(p.month), dia: Number(p.day), anio: Number(p.year), minutos: hora * 60 + minuto }
}

export function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export function diasEntre(desde, hasta) {
  return Math.round((new Date(`${hasta}T12:00:00Z`) - new Date(`${desde}T12:00:00Z`)) / 86400000)
}
const aMinutos = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** La estación de un mes (1-12) según los ajustes: primavera, verano, otono, invierno. */
export function estacionDeMes(mes, ajustes) {
  return Object.entries(ajustes.estaciones).find(([, meses]) => meses.includes(mes))?.[0] ?? null
}

/** ¿La foto es de Madrugador o de Nocturno? (Solo por su hora local.) null si no es ninguna de las dos. */
export function momentoDeLaHora(loc, ajustes) {
  const antes = aMinutos(ajustes.madrugador_antes_de)
  if (loc.minutos < antes) return 'madrugador'
  const invierno = ajustes.meses_invierno.includes(loc.mes)
  const desde = aMinutos(invierno ? ajustes.nocturno_desde_invierno : ajustes.nocturno_desde)
  if (loc.minutos >= desde) return 'nocturno'
  return null
}

/* ------------------------------------------------------------------ */
/* Claves                                                              */
/* ------------------------------------------------------------------ */

export const GLOBAL = '*'
export const clave = (destino, logro, escalon = '') => `${destino}|${logro}|${escalon}`

/** El tipo de momento de una cosa ganada, para ordenar lo que sale tras un Visto o una foto. */
export function categoriaDe(logro) {
  if (logro.startsWith('viajero:')) return 'viajero'
  return logro
}

/* ------------------------------------------------------------------ */
/* Los hechos que cuentan                                              */
/* ------------------------------------------------------------------ */

/**
 * Los hechos (Vistos y fotos) que SÍ cuentan, ya con su hora local. Un hecho cuenta si:
 *   - no está deshecho;
 *   - su viaje es conocido y la fecha local del hecho cae dentro de las fechas del viaje;
 *   - se recibió antes de que acabe el plazo de reclamar (30 días desde el último día del viaje);
 *   - no está «lejos» del sitio;
 *   - si es una foto, la dio por buena el servidor al recibirla (`valido`).
 * `evPieza`: sirve para ganar un pedazo (un Visto CERCA del sitio, o cualquier foto válida).
 */
export function hechosQueCuentan(hechos, viajes, datos) {
  const ajustes = datos.ajustes
  const fuera = []
  for (const h of hechos) {
    if (h.deshecho_en) continue
    const d = datos.destinos[h.destino]
    if (!d) continue
    const v = viajes[h.trip_id] ?? (h.inicio && h.fin ? { inicio: h.inicio, fin: h.fin } : null)
    if (!v) continue
    const loc = parteLocal(h.instante, d.timezone)
    if (!loc || loc.fecha < v.inicio || loc.fecha > v.fin) continue
    const recibido = parteLocal(h.recibido_en ?? h.instante, d.timezone)
    if (recibido && recibido.fecha > sumarDias(v.fin, ajustes.plazo_reclamar_dias)) continue
    if (h.ubic === 'lejos') continue
    if (h.tipo === 'foto' && !h.valido) continue
    fuera.push({ ...h, loc, evPieza: h.tipo === 'foto' || h.ubic === 'cerca' })
  }
  return fuera.sort((a, b) => new Date(a.instante) - new Date(b.instante) || String(a.id ?? '').localeCompare(String(b.id ?? '')))
}

/* ------------------------------------------------------------------ */
/* Calcular                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {object} e
 * @param {object} e.datos           { destinos, viajero, ajustes } (server/logros/datos.js)
 * @param {Array}  e.hechos          los hechos de la persona: { id, tipo:'visto'|'foto', trip_id, destino, sitio, stop_id?, instante, ubic, valido, recibido_en, deshecho_en, inicio?, fin? }
 * @param {object} e.viajes          { [trip_id]: { destino, inicio, fin, con_quien, dias:[{ fecha, paradas:[{ stop_id, sitio }] }], origen_pais? } }
 * @param {object} [e.cuenta]        { alta_cuenta: ISO, salida: 'AAAA-MM-DD' }
 * @param {Date|string} [e.ahora]    para lo que depende de que un viaje haya acabado (El fotógrafo)
 * @param {object} [e.pionero]       { [destino]: número de orden de esta persona entre los viajeros de ese destino }
 * @param {string|null} [e.probador] fecha ISO en que se le dio Probador a mano
 * @returns {Map<string, {clave, logro, escalon, destino, trip_id, en}>}
 */
export function calcular(e) {
  const { datos } = e
  const ajustes = datos.ajustes
  const viajes = e.viajes ?? {}
  const items = new Map()
  const dar = (destino, logro, escalon, trip_id, en) => {
    const k = clave(destino, logro, escalon)
    const previo = items.get(k)
    if (previo && new Date(previo.en) <= new Date(en)) return
    items.set(k, { clave: k, logro, escalon: String(escalon), destino, trip_id: trip_id ?? null, en })
  }
  const cuentan = hechosQueCuentan(e.hechos ?? [], viajes, datos)
  const ahora = e.ahora ? new Date(e.ahora) : null

  /* ── Por destino: pedazos, colecciones, sellos, emblemas ── */
  const porDestino = new Map()
  for (const h of cuentan) {
    if (!porDestino.has(h.destino)) porDestino.set(h.destino, [])
    porDestino.get(h.destino).push(h)
  }

  const infoDestino = {}
  for (const [clavDestino, hs] of porDestino) {
    const d = datos.destinos[clavDestino]
    const primerPorSitio = new Map() // sitio → hecho con el que se gana el pedazo
    const fotoPorSitio = new Map() // sitio → primera foto válida
    for (const h of hs) {
      if (!h.sitio) continue
      if (h.evPieza && !primerPorSitio.has(h.sitio)) primerPorSitio.set(h.sitio, h)
      if (h.tipo === 'foto' && !fotoPorSitio.has(h.sitio)) fotoPorSitio.set(h.sitio, h)
    }
    const completas = []
    for (const c of d.colecciones) {
      const tiempos = []
      for (const s of c.sitios) {
        const h = primerPorSitio.get(s)
        if (!h) continue
        dar(clavDestino, 'pedazo', `${c.id}:${s}`, h.trip_id, h.instante)
        tiempos.push({ en: h.instante, trip: h.trip_id })
      }
      tiempos.sort((a, b) => new Date(a.en) - new Date(b.en))
      if (tiempos.length === c.sitios.length) {
        dar(clavDestino, 'coleccion', c.id, tiempos[tiempos.length - 1].trip, tiempos[tiempos.length - 1].en)
        completas.push(c.id)
      }
      infoDestino[clavDestino] ??= { avance: {} }
      infoDestino[clavDestino].avance[c.id] = tiempos
    }
    // Sellos: salen de los pedazos de su colección principal (sumados entre viajes; un sello es uno solo y se transforma).
    const gradosSello = {}
    for (const s of d.sellos) {
      const tiempos = infoDestino[clavDestino]?.avance?.[s.coleccion] ?? []
      let mejor = null
      for (const g of s.grados) {
        if (tiempos.length >= g.desde) {
          const t = tiempos[g.desde - 1]
          dar(clavDestino, 'sello', `${s.id}:${g.grado}`, t.trip, t.en)
          mejor = g.grado
        }
      }
      gradosSello[s.id] = mejor
    }
    infoDestino[clavDestino] ??= { avance: {} }
    infoDestino[clavDestino].sellos = gradosSello
    infoDestino[clavDestino].completas = completas

    // Emblemas de sitio: siempre con una foto válida.
    for (const em of d.emblemas) {
      if (em.tipo !== 'sitio') continue
      const f = fotoPorSitio.get(em.sitio)
      if (f) dar(clavDestino, 'emblema', em.id, f.trip_id, f.instante)
    }
    // Madrugador y Nocturno: foto válida en uno de los imprescindibles, según la hora de la foto. Una vez por ciudad como emblema; los días distintos van aparte (Alondra y Búho).
    const imprescindibles = new Set(d.colecciones.find((c) => c.id === d.sellos.find((s) => s.id === d.sello_principal)?.coleccion)?.sitios ?? [])
    const diasMomento = { madrugador: new Set(), nocturno: new Set() }
    for (const h of hs) {
      if (h.tipo !== 'foto' || !imprescindibles.has(h.sitio)) continue
      const m = momentoDeLaHora(h.loc, ajustes)
      if (!m) continue
      dar(clavDestino, 'emblema', m, h.trip_id, h.instante)
      diasMomento[m].add(h.loc.fecha)
    }
    infoDestino[clavDestino].diasMomento = diasMomento
  }

  /* ── Lo de viajero ── */
  calcularViajero({ e, datos, ajustes, cuentan, viajes, items, dar, infoDestino, ahora })
  return items
}

/* ------------------------------------------------------------------ */
/* Logros de viajero                                                   */
/* ------------------------------------------------------------------ */

function calcularViajero({ e, datos, ajustes, cuentan, viajes, items, dar, infoDestino, ahora }) {
  const V = datos.viajero
  const sitioDe = (h) => datosDeSitio(datos.destinos[h.destino], h.sitio)
  const primeras = (agrupar) => {
    const mapa = new Map()
    for (const h of cuentan) {
      const claveGrupo = agrupar(h)
      if (claveGrupo == null || mapa.has(claveGrupo)) continue
      mapa.set(claveGrupo, h)
    }
    return mapa
  }

  /* Países, destinos, capitales, continentes, maravillas y Patrimonios: con el primer Visto (o foto) válido allí. */
  const porPais = primeras((h) => sitioDe(h)?.pais ?? null)
  for (const [pais, h] of porPais) dar(GLOBAL, 'pais', pais, h.trip_id, h.instante)
  const porDestinoNuevo = primeras((h) => h.destino)
  for (const [d, h] of porDestinoNuevo) dar(GLOBAL, 'destino_nuevo', d, h.trip_id, h.instante)
  const porCapital = primeras((h) => {
    const s = sitioDe(h)
    return s?.capital ? `${s.pais}|${datos.destinos[h.destino].ciudad}` : null
  })
  const porContinente = primeras((h) => V.paises[sitioDe(h)?.pais]?.continente ?? null)
  for (const [c, h] of porContinente) dar(GLOBAL, 'continente', c, h.trip_id, h.instante)
  const porMaravilla = primeras((h) => sitioDe(h)?.maravilla ?? null)
  for (const [m, h] of porMaravilla) dar(GLOBAL, 'maravilla', m, h.trip_id, h.instante)
  const porPatrimonio = primeras((h) => sitioDe(h)?.patrimonio ?? null)
  for (const [p, h] of porPatrimonio) dar(GLOBAL, 'patrimonio', p, h.trip_id, h.instante)

  /* Los viajes hechos con la app: los que tienen al menos un hecho válido en sus fechas. */
  const viajesHechos = new Map()
  for (const h of cuentan) {
    if (!viajesHechos.has(h.trip_id)) viajesHechos.set(h.trip_id, { trip_id: h.trip_id, destino: h.destino, primera: h.instante })
  }
  const listaViajes = [...viajesHechos.values()].sort((a, b) => new Date(a.primera) - new Date(b.primera))
  for (const v of listaViajes) {
    const info = viajes[v.trip_id] ?? cuentan.find((h) => h.trip_id === v.trip_id)
    v.inicio = info.inicio
    v.fin = info.fin
    v.con_quien = viajes[v.trip_id]?.con_quien ?? null
    v.noches = diasEntre(info.inicio, info.fin)
    v.origen_pais = viajes[v.trip_id]?.origen_pais ?? null
  }

  /* Cuenta de cosas ya dadas, para los escalones. */
  const conTiempos = (logro) => [...items.values()].filter((it) => it.logro === logro).sort((a, b) => new Date(a.en) - new Date(b.en))
  const escalonesDe = (def, lista) => {
    for (const esc of def.escalones ?? []) {
      if (lista.length >= esc.n) dar(GLOBAL, `viajero:${def.id}`, esc.n, lista[esc.n - 1].trip_id, lista[esc.n - 1].en)
    }
  }
  const capitalesLista = [...porCapital.values()].map((h) => ({ trip_id: h.trip_id, en: h.instante })).sort((a, b) => new Date(a.en) - new Date(b.en))
  const listas = {
    paises: conTiempos('pais'),
    destinos: conTiempos('destino_nuevo'),
    capitales: capitalesLista,
    maravillas: conTiempos('maravilla'),
    patrimonios: conTiempos('patrimonio'),
    viajes: listaViajes.map((v) => ({ trip_id: v.trip_id, en: v.primera })),
    emblemas: conTiempos('emblema'),
    colecciones: conTiempos('coleccion'),
  }

  /* Fechas de los hechos que cuentan (el día de cada Visto o foto válidos). */
  const fechasDe = (h) => h.loc.fecha
  const dias = new Map() // fecha → primer hecho
  for (const h of cuentan) if (!dias.has(fechasDe(h))) dias.set(fechasDe(h), h)

  /* Días perfectos: todas las paradas de un día, vistas. */
  const hechosPorViaje = new Map()
  for (const h of cuentan) {
    if (!hechosPorViaje.has(h.trip_id)) hechosPorViaje.set(h.trip_id, [])
    hechosPorViaje.get(h.trip_id).push(h)
  }
  const diasPerfectos = [] // { trip_id, fecha, en }
  const viajesPerfectos = []
  for (const v of listaViajes) {
    const info = viajes[v.trip_id]
    if (!info?.dias) continue
    const hs = hechosPorViaje.get(v.trip_id) ?? []
    const vistas = (p) => hs.filter((h) => (p.stop_id && h.stop_id === p.stop_id) || (p.sitio && h.sitio === p.sitio))
    const perfectosDelViaje = []
    for (const dia of info.dias) {
      if (!dia.paradas?.length) continue
      const tiempos = dia.paradas.map((p) => vistas(p).map((h) => h.instante).sort()[0] ?? null)
      if (tiempos.some((t) => t == null)) continue
      const en = tiempos.sort()[tiempos.length - 1]
      diasPerfectos.push({ trip_id: v.trip_id, fecha: dia.fecha, en })
      perfectosDelViaje.push({ fecha: dia.fecha, en })
    }
    const conParadas = info.dias.filter((dia) => dia.paradas?.length)
    if (conParadas.length > 0 && perfectosDelViaje.length === conParadas.length) {
      viajesPerfectos.push({ trip_id: v.trip_id, en: perfectosDelViaje.map((x) => x.en).sort().pop() })
    }
    v.perfectos = perfectosDelViaje
  }

  for (const def of V.logros) {
    switch (def.tipo) {
      case 'contar':
        escalonesDe(def, listas[def.que])
        break
      case 'continentes':
        // Un logro por cada continente nuevo: ya están como `continente`; aquí se dan con su nombre.
        break
      case 'dos_paises_en_un_dia': {
        const porDia = new Map()
        for (const h of cuentan) {
          const pais = sitioDe(h)?.pais
          if (!pais) continue
          if (!porDia.has(h.loc.fecha)) porDia.set(h.loc.fecha, new Map())
          if (!porDia.get(h.loc.fecha).has(pais)) porDia.get(h.loc.fecha).set(pais, h)
        }
        let mejor = null
        for (const paises of porDia.values()) {
          if (paises.size >= 2) {
            const segundo = [...paises.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante))[1]
            if (!mejor || new Date(segundo.instante) < new Date(mejor.instante)) mejor = segundo
          }
        }
        if (mejor) dar(GLOBAL, `viajero:${def.id}`, '', mejor.trip_id, mejor.instante)
        break
      }
      case 'microestados': {
        const vistos = [...porPais.entries()].filter(([pais]) => V.microestados.includes(pais)).map(([, h]) => h).sort((a, b) => new Date(a.instante) - new Date(b.instante))
        if (vistos.length >= V.microestados.length) dar(GLOBAL, `viajero:${def.id}`, '', vistos[vistos.length - 1].trip_id, vistos[vistos.length - 1].instante)
        break
      }
      case 'hemisferio_sur': {
        const h = cuentan.find((x) => sitioDe(x)?.hemisferio === 'sur')
        if (h) dar(GLOBAL, `viajero:${def.id}`, '', h.trip_id, h.instante)
        break
      }
      case 'viajero_nacional': {
        const porPaisOrigen = new Map()
        for (const v of listaViajes) {
          if (!v.origen_pais) continue
          const d = datos.destinos[v.destino]
          const sitioPais = d.pais_defecto ?? Object.values(d.sitios)[0]?.pais
          if (sitioPais !== v.origen_pais) continue
          if (!porPaisOrigen.has(v.destino)) porPaisOrigen.set(v.destino, v)
        }
        const lista = [...porPaisOrigen.values()].sort((a, b) => new Date(a.primera) - new Date(b.primera))
        if (lista.length >= def.n) dar(GLOBAL, `viajero:${def.id}`, '', lista[def.n - 1].trip_id, lista[def.n - 1].primera)
        break
      }
      case 'estaciones': {
        const vistas = new Map()
        for (const h of cuentan) {
          const est = estacionDeMes(h.loc.mes, ajustes)
          if (est && !vistas.has(est)) vistas.set(est, h)
        }
        if (vistas.size === Object.keys(ajustes.estaciones).length) {
          const ultima = [...vistas.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante)).pop()
          dar(GLOBAL, `viajero:${def.id}`, '', ultima.trip_id, ultima.instante)
        }
        break
      }
      case 'destino_estaciones': {
        const porCiudad = new Map()
        for (const h of cuentan) {
          const est = estacionDeMes(h.loc.mes, ajustes)
          if (!est) continue
          if (!porCiudad.has(h.destino)) porCiudad.set(h.destino, new Map())
          if (!porCiudad.get(h.destino).has(est)) porCiudad.get(h.destino).set(est, h)
        }
        for (const [d, vistas] of porCiudad) {
          if (vistas.size === Object.keys(ajustes.estaciones).length) {
            const ultima = [...vistas.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante)).pop()
            dar(d, `viajero:${def.id}`, '', ultima.trip_id, ultima.instante)
          }
        }
        break
      }
      case 'meses': {
        const vistos = new Map()
        for (const h of cuentan) if (!vistos.has(h.loc.mes)) vistos.set(h.loc.mes, h)
        if (vistos.size === 12) {
          const ultima = [...vistos.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante)).pop()
          dar(GLOBAL, `viajero:${def.id}`, '', ultima.trip_id, ultima.instante)
        }
        break
      }
      case 'fecha_concreta': {
        const h = cuentan.find((x) => def.dias.includes(`${String(x.loc.mes).padStart(2, '0')}-${String(x.loc.dia).padStart(2, '0')}`))
        if (h) dar(GLOBAL, `viajero:${def.id}`, '', h.trip_id, h.instante)
        break
      }
      case 'viajes_en_un_ano': {
        const porAnio = new Map()
        for (const v of listaViajes) {
          const anio = Number(v.inicio.slice(0, 4))
          if (!porAnio.has(anio)) porAnio.set(anio, [])
          porAnio.get(anio).push(v)
        }
        for (const lista of porAnio.values()) if (lista.length >= def.n) dar(GLOBAL, `viajero:${def.id}`, '', lista[def.n - 1].trip_id, lista[def.n - 1].primera)
        break
      }
      case 'sol_a_sol': {
        const porDia = new Map()
        for (const d of Object.values(infoDestino)) {
          for (const m of ['madrugador', 'nocturno']) for (const f of d.diasMomento[m]) {
            if (!porDia.has(f)) porDia.set(f, new Set())
            porDia.get(f).add(m)
          }
        }
        const dias2 = [...porDia.entries()].filter(([, s]) => s.size === 2).map(([f]) => f).sort()
        if (dias2.length > 0) {
          const h = cuentan.filter((x) => x.loc.fecha === dias2[0] && x.tipo === 'foto').sort((a, b) => new Date(b.instante) - new Date(a.instante))[0]
          if (h) dar(GLOBAL, `viajero:${def.id}`, '', h.trip_id, h.instante)
        }
        break
      }
      case 'veces_momento': {
        for (const [clavDestino, d] of Object.entries(infoDestino)) {
          const fechas = [...d.diasMomento[def.momento]].sort()
          if (fechas.length >= def.n) {
            const h = cuentan.filter((x) => x.destino === clavDestino && x.tipo === 'foto' && x.loc.fecha === fechas[def.n - 1])[0]
            if (h) dar(GLOBAL, `viajero:${def.id}`, '', h.trip_id, h.instante)
          }
        }
        break
      }
      case 'con_quien': {
        const lista = listaViajes.filter((v) => v.con_quien === def.valor).map((v) => ({ trip_id: v.trip_id, en: v.primera }))
        escalonesDe(def, lista)
        break
      }
      case 'dia_perfecto': {
        const p = diasPerfectos.sort((a, b) => new Date(a.en) - new Date(b.en))[0]
        if (p) dar(GLOBAL, `viajero:${def.id}`, '', p.trip_id, p.en)
        break
      }
      case 'viaje_perfecto': {
        const p = viajesPerfectos.sort((a, b) => new Date(a.en) - new Date(b.en))[0]
        if (p) dar(GLOBAL, `viajero:${def.id}`, '', p.trip_id, p.en)
        break
      }
      case 'imparable': {
        for (const v of listaViajes) {
          const fechas = (v.perfectos ?? []).map((x) => x.fecha).sort()
          for (let i = 0; i + def.n <= fechas.length; i++) {
            if (diasEntre(fechas[i], fechas[i + def.n - 1]) === def.n - 1) {
              const en = v.perfectos.find((x) => x.fecha === fechas[i + def.n - 1]).en
              dar(GLOBAL, `viajero:${def.id}`, '', v.trip_id, en)
              break
            }
          }
        }
        break
      }
      case 'noches': {
        const v = listaViajes.find((x) => x.noches >= def.min && x.noches <= def.max)
        if (v) dar(GLOBAL, `viajero:${def.id}`, '', v.trip_id, v.primera)
        break
      }
      case 'volver': {
        const porCiudad = new Map()
        for (const v of listaViajes) {
          if (!porCiudad.has(v.destino)) porCiudad.set(v.destino, [])
          porCiudad.get(v.destino).push(v)
        }
        for (const [d, lista] of porCiudad) if (lista.length >= 2) dar(d, `viajero:${def.id}`, '', lista[1].trip_id, lista[1].primera)
        break
      }
      case 'fotografo': {
        for (const v of listaViajes) {
          const info = viajes[v.trip_id]
          if (!ahora || !info || parteLocalFecha(ahora, datos.destinos[v.destino].timezone) <= v.fin) continue
          const hs = hechosPorViaje.get(v.trip_id) ?? []
          const sitiosVistos = new Set(hs.filter((h) => h.sitio).map((h) => h.sitio))
          if (sitiosVistos.size < def.minimo_paradas) continue
          const conFoto = new Set(hs.filter((h) => h.tipo === 'foto' && h.sitio).map((h) => h.sitio))
          if ([...sitiosVistos].every((s) => conFoto.has(s))) {
            const ultima = hs.filter((h) => h.tipo === 'foto').sort((a, b) => new Date(b.instante) - new Date(a.instante))[0]
            dar(GLOBAL, `viajero:${def.id}`, '', v.trip_id, ultima.instante)
          }
        }
        break
      }
      case 'conocedor': {
        const porCiudad = new Map()
        for (const h of cuentan) {
          if (!h.sitio || !(datos.destinos[h.destino].sitios_catalogo ?? Object.keys(datos.destinos[h.destino].sitios)).includes(h.sitio)) continue
          if (!porCiudad.has(h.destino)) porCiudad.set(h.destino, new Map())
          if (!porCiudad.get(h.destino).has(h.sitio)) porCiudad.get(h.destino).set(h.sitio, h)
        }
        for (const [d, sitios] of porCiudad) {
          const lista = [...sitios.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante))
          for (const esc of def.escalones) if (lista.length >= esc.n) dar(d, `viajero:${def.id}`, esc.n, lista[esc.n - 1].trip_id, lista[esc.n - 1].instante)
        }
        break
      }
      case 'ciudad_completa': {
        for (const [clavDestino, d] of Object.entries(datos.destinos)) {
          const completas = items
          const todas = d.colecciones.map((c) => completas.get(clave(clavDestino, 'coleccion', c.id)))
          if (todas.length && todas.every(Boolean)) {
            const ultima = todas.sort((a, b) => new Date(a.en) - new Date(b.en)).pop()
            dar(clavDestino, `viajero:${def.id}`, '', ultima.trip_id, ultima.en)
          }
        }
        break
      }
      case 'todos_secretos': {
        for (const [clavDestino, d] of Object.entries(datos.destinos)) {
          const todos = d.emblemas.map((em) => items.get(clave(clavDestino, 'emblema', em.id)))
          if (todos.length && todos.every(Boolean)) {
            const ultimo = todos.sort((a, b) => new Date(a.en) - new Date(b.en)).pop()
            dar(clavDestino, `viajero:${def.id}`, '', ultimo.trip_id, ultimo.en)
          }
        }
        break
      }
      case 'diamante_primera': {
        for (const [clavDestino, d] of Object.entries(datos.destinos)) {
          const primero = listaViajes.find((v) => v.destino === clavDestino)
          if (!primero) continue
          const sello = d.sellos.find((s) => s.id === d.sello_principal)
          const col = d.colecciones.find((c) => c.id === sello.coleccion)
          const delPrimero = cuentan.filter((h) => h.destino === clavDestino && h.trip_id === primero.trip_id && h.evPieza && col.sitios.includes(h.sitio))
          const sitios = new Map()
          for (const h of delPrimero) if (!sitios.has(h.sitio)) sitios.set(h.sitio, h)
          const ultimo = sello.grados[sello.grados.length - 1]
          if (sitios.size >= ultimo.desde) {
            const t = [...sitios.values()].sort((a, b) => new Date(a.instante) - new Date(b.instante))[ultimo.desde - 1]
            dar(clavDestino, `viajero:${def.id}`, '', primero.trip_id, t.instante)
          }
        }
        break
      }
      case 'ciudades_sello': {
        const ciudades = []
        for (const [clavDestino, d] of Object.entries(datos.destinos)) {
          const sello = d.sellos.find((s) => s.id === d.sello_principal) // (el sello del Vaticano no cuenta como otra ciudad)
          const g = sello.grados.find((x) => x.grado === def.grado)
          // oro cuenta también si se ha llegado a diamante: se mira por el umbral del grado pedido.
          const it = items.get(clave(clavDestino, 'sello', `${sello.id}:${g.grado}`))
          if (it) ciudades.push(it)
        }
        ciudades.sort((a, b) => new Date(a.en) - new Date(b.en))
        if (ciudades.length >= def.n) dar(GLOBAL, `viajero:${def.id}`, '', ciudades[def.n - 1].trip_id, ciudades[def.n - 1].en)
        break
      }
      case 'fundador': {
        const alta = e.cuenta?.alta_cuenta
        const salida = e.cuenta?.salida
        if (!alta || !salida) break
        const limite = sumarDias(salida, 365)
        if (new Date(alta).toISOString().slice(0, 10) >= limite) break
        const h = cuentan.find((x) => x.loc.fecha >= salida && x.loc.fecha < limite)
        if (h) dar(GLOBAL, `viajero:${def.id}`, '', h.trip_id, h.instante)
        break
      }
      case 'pionero': {
        for (const [clavDestino, d] of Object.entries(datos.destinos)) {
          if (!d.pionero?.activo) continue
          const orden = e.pionero?.[clavDestino]
          const primero = cuentan.find((h) => h.destino === clavDestino)
          if (primero && orden != null && orden <= d.pionero.limite) dar(clavDestino, `viajero:${def.id}`, '', primero.trip_id, primero.instante)
        }
        break
      }
      case 'edicion': {
        const vistos = new Map()
        for (const h of cuentan) {
          const k = `${h.destino}|${h.loc.anio}`
          if (!vistos.has(k)) vistos.set(k, h)
        }
        for (const [k, h] of vistos) {
          const [d, anio] = k.split('|')
          dar(d, `viajero:${def.id}`, anio, h.trip_id, h.instante)
        }
        break
      }
      case 'manual':
        if (e.probador) dar(GLOBAL, `viajero:${def.id}`, '', null, e.probador)
        break
      default:
        break
    }
  }
}

function parteLocalFecha(fecha, tz) {
  return parteLocal(fecha, tz).fecha
}

/* ------------------------------------------------------------------ */
/* Lo que sale tras un hecho                                           */
/* ------------------------------------------------------------------ */

/** Lo que hay en `despues` y no en `antes`, en el orden de los momentos (ajustes.orden_momentos; lo cambia Design si quiere otro). */
export function diferencia(antes, despues, ajustes) {
  const nuevos = [...despues.values()].filter((it) => !antes.has(it.clave))
  const orden = (it) => {
    const i = ajustes.orden_momentos.indexOf(categoriaDe(it.logro))
    return i < 0 ? 99 : i
  }
  return nuevos.sort((a, b) => orden(a) - orden(b) || new Date(a.en) - new Date(b.en) || a.clave.localeCompare(b.clave))
}
