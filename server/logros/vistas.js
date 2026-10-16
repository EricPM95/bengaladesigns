/**
 * LO QUE EL SERVIDOR DEVUELVE PARA LAS PANTALLAS (Tanda 8A; las pantallas llegan en la 8b y la 8c). Funciones puras sobre lo que calcula motor.js.
 * Nada de aquí escribe en la base de datos.
 */

import { GLOBAL, categoriaDe, clave, diasEntre, parteLocal, sumarDias } from './motor.js'

const rellenar = (texto, valores) => String(texto).replace(/\{(\w+)\}/g, (_, k) => (valores[k] ?? `{${k}}`))
const porEn = (a, b) => new Date(a.en) - new Date(b.en)

/* ------------------------------------------------------------------ */
/* Qué se ve hoy (solo lo que se puede conseguir con los destinos curados) */
/* ------------------------------------------------------------------ */

/** Lo que se puede conseguir con un grupo de destinos. */
export function capacidad(datos, claves) {
  const ds = claves.map((c) => datos.destinos[c])
  const sitios = ds.flatMap((d) => Object.values(d.sitios))
  const paises = new Set(sitios.map((s) => s.pais).filter(Boolean))
  const porPais = new Map()
  for (const d of ds) {
    const p = Object.values(d.sitios)[0]?.pais
    if (p) porPais.set(p, (porPais.get(p) ?? 0) + 1)
  }
  return {
    paises: paises.size,
    destinos: ds.length,
    capitales: new Set(ds.flatMap((d) => Object.values(d.sitios).filter((s) => s.capital).map((s) => `${s.pais}|${d.ciudad}`))).size,
    maravillas: new Set(sitios.map((s) => s.maravilla).filter(Boolean)).size,
    patrimonios: new Set(sitios.map((s) => s.patrimonio).filter(Boolean)).size,
    emblemas: ds.reduce((n, d) => n + d.emblemas.length, 0),
    colecciones: ds.reduce((n, d) => n + d.colecciones.length, 0),
    sitiosPorCiudad: Math.max(0, ...ds.map((d) => (d.sitios_catalogo ?? Object.keys(d.sitios)).length)),
    microestados: [...paises].filter((p) => datos.viajero.microestados.includes(p)).length,
    hemisferioSur: sitios.some((s) => s.hemisferio === 'sur'),
    mismoPais: Math.max(0, ...porPais.values()),
    dosPaisesEnUnaCiudad: ds.some((d) => new Set(Object.values(d.sitios).map((s) => s.pais)).size >= 2),
    continentes: [...new Set([...paises].map((p) => datos.viajero.paises[p]?.continente).filter(Boolean))],
    ciudadesConSello: ds.filter((d) => d.sellos.length > 0).length,
    pionero: ds.some((d) => d.pionero?.activo),
    algunDestino: ds.length > 0,
    momentos: new Set(ds.flatMap((d) => d.emblemas.filter((e) => e.tipo === 'momento').map((e) => e.momento))),
  }
}

/** ¿Se puede conseguir este logro (o este escalón) con esa capacidad? */
function posible(def, cap, esc = null) {
  switch (def.tipo) {
    case 'contar':
      return esc ? cap[def.que] >= esc.n : true
    case 'con_quien':
      return true
    case 'conocedor':
      return esc ? cap.sitiosPorCiudad >= esc.n : true
    case 'continentes':
      return cap.continentes.length > 0
    case 'dos_paises_en_un_dia':
      return cap.dosPaisesEnUnaCiudad
    case 'microestados':
      return cap.microestados >= 6
    case 'hemisferio_sur':
      return cap.hemisferioSur
    case 'viajero_nacional':
      return cap.mismoPais >= def.n
    case 'ciudades_sello':
      return cap.ciudadesConSello >= def.n
    case 'pionero':
      return cap.pionero
    case 'veces_momento':
      return cap.momentos.has(def.momento)
    case 'sol_a_sol':
      return cap.momentos.has('madrugador') && cap.momentos.has('nocturno')
    case 'manual':
      return false
    default:
      return cap.algunDestino
  }
}
/**
 * Los logros de viajero que se ven hoy, con sus escalones visibles. Se calcula solo desde los datos: se añaden los destinos en el orden en que se
 * añadieron (`anadido`) y cada escalón sale desde el primer destino con el que ya se puede conseguir. `nuevo`: lo desbloquea un destino que no es el primero
 * y se añadió hace poco («Nuevo escalón»).
 */
export function logrosVisibles(datos, ahora = new Date()) {
  const orden = Object.values(datos.destinos).sort((a, b) => String(a.anadido).localeCompare(String(b.anadido)))
  const capPorK = orden.map((_, i) => ({ cap: capacidad(datos, orden.slice(0, i + 1).map((d) => d.clave)), d: orden[i], k: i + 1 }))
  // Los de «viajes» no dependen de los destinos.
  for (const x of capPorK) x.cap.viajes = Infinity
  const hoy = (ahora instanceof Date ? ahora : new Date(ahora)).toISOString().slice(0, 10)
  const nuevoSi = (k, d) => k > 1 && diasEntre(d.anadido, hoy) <= datos.ajustes.dias_escalon_nuevo && diasEntre(d.anadido, hoy) >= 0
  const salida = []
  for (const def of datos.viajero.logros) {
    if (def.escalones) {
      const escalones = []
      for (const esc of def.escalones) {
        const primero = capPorK.find((x) => posible(def, x.cap, esc))
        if (primero) escalones.push({ ...esc, visible_desde: primero.d.anadido, nuevo: nuevoSi(primero.k, primero.d) })
      }
      if (escalones.length > 0) salida.push({ ...def, escalones })
    } else {
      const primero = capPorK.find((x) => posible(def, x.cap))
      if (primero) salida.push({ ...def, visible_desde: primero.d.anadido, nuevo: nuevoSi(primero.k, primero.d) })
    }
  }
  return salida
}

/** Todos los logros con sus escalones, vistos o no (para /admin/logros). */
export function logrosYVisibilidad(datos, ahora = new Date()) {
  const vis = new Map(logrosVisibles(datos, ahora).map((d) => [d.id, d]))
  return datos.viajero.logros.map((def) => ({
    id: def.id,
    grupo: def.grupo,
    nombre: def.nombre ?? def.id,
    escalones: (def.escalones ?? []).map((e) => ({ n: e.n, nombre: e.nombre, visible: Boolean(vis.get(def.id)?.escalones?.some((x) => x.n === e.n)) })),
    visible: vis.has(def.id),
  }))
}

/* ------------------------------------------------------------------ */
/* Sellos, colecciones y emblemas de un destino                        */
/* ------------------------------------------------------------------ */

/** Los sitios que tiene el viaje en sus días (sin «Si te sobra tiempo» ni «Cerrado este día»: ya vienen sin ellos en `viaje.dias[].paradas`). */
export function sitiosDeLaRuta(viaje) {
  return new Set((viaje?.dias ?? []).flatMap((d) => (d.paradas ?? []).map((p) => p.sitio).filter(Boolean)))
}

export function estadoDestino({ datos, destino, items, viaje = null, hoy = null }) {
  const d = datos.destinos[destino]
  const tz = d.timezone
  const tiene = (logro, escalon) => items.get(clave(destino, logro, escalon))
  const enRuta = viaje ? sitiosDeLaRuta(viaje) : new Set()
  const delHoy = (it) => it && hoy && parteLocal(it.en, tz)?.fecha === hoy

  const sellos = d.sellos.map((s) => {
    const col = d.colecciones.find((c) => c.id === s.coleccion)
    const n = col.sitios.filter((x) => tiene('pedazo', `${col.id}:${x}`)).length
    const alcanzados = s.grados.filter((g) => tiene('sello', `${s.id}:${g.grado}`))
    const actual = alcanzados[alcanzados.length - 1] ?? null
    const siguiente = s.grados.find((g) => g.desde > n) ?? null
    return {
      id: s.id,
      nombre: s.nombre,
      grado: actual?.grado ?? null,
      nombre_grado: actual?.nombre ?? null,
      linea: actual ? rellenar(actual.linea, { n, total: col.sitios.length, ciudad: d.ciudad }) : null,
      n,
      total: col.sitios.length,
      siguiente: siguiente ? { grado: siguiente.grado, faltan: siguiente.desde - n, nombre: siguiente.nombre } : null,
      alcanzados: alcanzados.map((g) => g.grado),
    }
  })

  const colecciones = d.colecciones.map((c) => {
    const vistos = c.sitios.filter((s) => tiene('pedazo', `${c.id}:${s}`))
    const completa = Boolean(tiene('coleccion', c.id))
    const completableConLaRuta = c.sitios.every((s) => enRuta.has(s) || vistos.includes(s))
    return {
      id: c.id,
      grupo: c.grupo,
      orden: c.orden,
      nombre: c.nombre,
      al_completar: completa ? c.al_completar : null,
      sitios: c.sitios.map((s) => ({ sitio: s, visto: vistos.includes(s) })),
      n: vistos.length,
      total: c.sitios.length,
      completa,
      en_tu_ruta: Boolean(viaje) && completableConLaRuta && !completa,
      nuevo_hoy: c.sitios.some((s) => delHoy(tiene('pedazo', `${c.id}:${s}`))) || delHoy(tiene('coleccion', c.id)),
    }
  })
  const rango = (c) => (c.nuevo_hoy ? 0 : c.completa ? 1 : c.en_tu_ruta ? 2 : 3)
  const ordenadas = [...colecciones].sort((a, b) => rango(a) - rango(b) || a.orden - b.orden)

  const encontrados = d.emblemas.filter((e) => tiene('emblema', e.id)).length
  return {
    destino,
    ciudad: d.ciudad,
    sellos,
    colecciones: ordenadas,
    // Los emblemas ocultos solo se cuentan: nunca se dice cuáles ni dónde (los encontrados sí se enseñan, con su nombre).
    secretos: {
      total: d.emblemas.length,
      encontrados,
      texto: encontrados === 0 ? rellenar(d.textos.secretos.total, { total: d.emblemas.length }) : rellenar(d.textos.secretos.encontrados, { n: encontrados, total: d.emblemas.length }),
      encontrados_lista: d.emblemas.filter((e) => tiene('emblema', e.id)).map((e) => ({ id: e.id, nombre: e.nombre, linea: e.linea, en: tiene('emblema', e.id).en })),
    },
    con_tu_ruta_puedes_completar: viaje ? colecciones.filter((c) => c.completa || c.en_tu_ruta).length : null,
  }
}

/** Las colecciones de un sitio, con sus sitios (vistos, este sitio y los demás). Nunca emblemas ni logros de viajero. */
export function coleccionesDeSitio({ datos, destino, sitio, items, nombreDe }) {
  const d = datos.destinos[destino]
  const salida = []
  for (const c of d.colecciones) {
    if (!c.sitios.includes(sitio)) continue
    const vistos = c.sitios.filter((s) => items.get(clave(destino, 'pedazo', `${c.id}:${s}`)))
    const sumaAqui = vistos.length + (vistos.includes(sitio) ? 0 : 1)
    salida.push({
      id: c.id,
      nombre: c.nombre,
      n: vistos.length,
      total: c.sitios.length,
      con_este: sumaAqui,
      linea: `Con ${nombreDe ? nombreDe(sitio) : sitio}, ${sumaAqui} de ${c.sitios.length}`,
      sitios: c.sitios.map((s) => ({ sitio: s, nombre: nombreDe ? nombreDe(s) : s, estado: s === sitio ? 'este' : vistos.includes(s) ? 'visto' : 'pendiente' })),
    })
  }
  return salida
}

/* ------------------------------------------------------------------ */
/* Lo pendiente: «Lo de ayer también cuenta» y el plazo de reclamar    */
/* ------------------------------------------------------------------ */

/**
 * Las paradas de los días anteriores del viaje que todavía no tienen su pedazo o su emblema. `hoy`: la fecha de hoy en el destino.
 * Después del último día, quedan `dias_para_reclamar` (null si el plazo ya pasó o el viaje no ha acabado).
 */
export function pendientes({ datos, destino, viaje, items, hoy }) {
  const d = datos.destinos[destino]
  const plazo = datos.ajustes.plazo_reclamar_dias
  const acabado = hoy > viaje.fin
  const quedan = acabado ? diasEntre(hoy, sumarDias(viaje.fin, plazo)) : null
  const enPlazo = !acabado || (quedan != null && quedan >= 0)
  const lista = []
  if (enPlazo) {
    for (const dia of viaje.dias ?? []) {
      if (dia.fecha >= hoy && !acabado) continue // el día de hoy y los que vienen no son «de ayer»
      for (const p of dia.paradas ?? []) {
        if (!p.sitio || !d.sitios[p.sitio]) continue
        const faltaPedazo = d.colecciones.some((c) => c.sitios.includes(p.sitio) && !items.get(clave(destino, 'pedazo', `${c.id}:${p.sitio}`)))
        const faltaEmblema = d.emblemas.some((e) => e.sitio === p.sitio && !items.get(clave(destino, 'emblema', e.id)))
        if (faltaPedazo || faltaEmblema) lista.push({ fecha: dia.fecha, dia: dia.numero ?? null, sitio: p.sitio, falta: [faltaPedazo && 'pedazo', faltaEmblema && 'emblema'].filter(Boolean) })
      }
    }
  }
  const sorpresas = lista.filter((x) => x.falta.includes('emblema')).length
  return {
    pendientes: lista,
    sorpresas,
    pedazos: lista.filter((x) => x.falta.includes('pedazo')).length,
    // Durante el viaje no hay cuenta atrás: solo «Te espera una sorpresa». La cuenta atrás, solo después del último día.
    dias_para_reclamar: quedan != null && quedan >= 0 ? quedan : null,
    plazo_pasado: acabado && !enPlazo,
    texto:
      acabado && enPlazo && lista.length > 0
        ? `Te quedan ${quedan} días para reclamar tus ${sorpresas || lista.length} ${sorpresas ? 'sorpresas' : 'pedazos'} de ${d.ciudad}`
        : !acabado && sorpresas > 0
          ? 'Te espera una sorpresa: sube tu foto'
          : null,
  }
}

/* ------------------------------------------------------------------ */
/* Resumen del día y del viaje                                         */
/* ------------------------------------------------------------------ */

export function resumen({ datos, destino, items, viaje, desde = null, hasta = null, hoy }) {
  const d = datos.destinos[destino]
  const dentro = (it) => {
    if (!desde) return true
    const f = parteLocal(it.en, d.timezone).fecha
    return f >= desde && f <= (hasta ?? desde)
  }
  const ganado = [...items.values()].filter((it) => (it.destino === destino || it.destino === GLOBAL) && dentro(it)).sort(porEn)
  const porCategoria = {}
  for (const it of ganado) (porCategoria[categoriaDe(it.logro)] ??= []).push(it)
  const estado = estadoDestino({ datos, destino, items, viaje, hoy })
  const completas = estado.colecciones.filter((c) => c.completa).length
  const secretos = estado.secretos.encontrados
  const t = d.textos.resumen_viaje
  const queda = estado.secretos.total - secretos
  return {
    ganado: ganado.map((it) => ({ clave: it.clave, logro: it.logro, escalon: it.escalon, destino: it.destino, en: it.en })),
    por_categoria: Object.fromEntries(Object.entries(porCategoria).map(([k, v]) => [k, v.length])),
    pendiente: pendientes({ datos, destino, viaje, items, hoy }),
    // Cuál de los dos textos del resumen del viaje toca.
    texto_viaje: completas >= t.minimo_colecciones && secretos >= t.minimo_secretos ? t.wow : rellenar(t.con_ganas, { n: queda }),
    texto_viaje_tipo: completas >= t.minimo_colecciones && secretos >= t.minimo_secretos ? 'wow' : 'con_ganas',
  }
}

/* ------------------------------------------------------------------ */
/* Pasaporte y vitrina                                                 */
/* ------------------------------------------------------------------ */

/**
 * Los países con algo que ganar en la app («Por descubrir», con sus sellos en gris) y los que ha visitado («Tus países», con la fecha de entrada: su primer
 * Visto válido). Los números cuentan solo lo visitado, también lo de antes de la app (`previos`).
 */
export function pasaporte({ datos, items, previos = { paises: [], dias: 0 }, ahora, salida = null, diasConLaApp = 0 }) {
  const hoy = (ahora instanceof Date ? ahora : new Date(ahora ?? Date.now())).toISOString().slice(0, 10)
  const porPais = new Map()
  for (const d of Object.values(datos.destinos)) {
    const paises = new Set(Object.values(d.sitios).map((s) => s.pais).filter(Boolean))
    for (const pais of paises) {
      if (!porPais.has(pais)) porPais.set(pais, { pais, continente: datos.viajero.paises[pais]?.continente ?? null, destinos: [] })
      const sellos = d.sellos.filter((s) => {
        const col = d.colecciones.find((c) => c.id === s.coleccion)
        return col.sitios.some((x) => d.sitios[x]?.pais === pais)
      })
      porPais.get(pais).destinos.push({
        destino: d.clave,
        ciudad: d.ciudad,
        nuevo: Boolean(salida) && d.anadido > salida && diasEntre(d.anadido, hoy) <= datos.ajustes.dias_destino_nuevo && diasEntre(d.anadido, hoy) >= 0,
        sellos: sellos.map((s) => {
          const grados = s.grados.filter((g) => items.get(clave(d.clave, 'sello', `${s.id}:${g.grado}`)))
          return { id: s.id, nombre: s.nombre, grado: grados[grados.length - 1]?.grado ?? null }
        }),
      })
    }
  }
  const visitados = []
  const porDescubrir = []
  for (const p of porPais.values()) {
    const entrada = items.get(clave(GLOBAL, 'pais', p.pais))
    if (entrada) visitados.push({ ...p, entrada: entrada.en })
    else porDescubrir.push(p)
  }
  visitados.sort((a, b) => new Date(a.entrada) - new Date(b.entrada))
  const paisesVisitados = new Set([...visitados.map((v) => v.pais), ...(previos.paises ?? [])])
  const ciudades = new Set([...items.values()].filter((it) => it.logro === 'destino_nuevo').map((it) => it.escalon))
  return {
    tus_paises: visitados,
    por_descubrir: porDescubrir,
    numeros: { paises: paisesVisitados.size, ciudades: ciudades.size, dias_viajando: (previos.dias ?? 0) + diasConLaApp },
  }
}

/**
 * La vitrina: el pedestal de las maravillas, la balda de los exclusivos y las baldas temáticas de 4 huecos. Los huecos se llenan solos con lo último ganado
 * hasta que el viajero elige (`guardada.baldas[nombre]` = lista de claves); si una balda elegida está llena, hay que quitar una antes.
 */
export function construirVitrina({ items, guardada = { baldas: {}, titulo: null } }) {
  const lista = [...items.values()].sort((a, b) => new Date(b.en) - new Date(a.en))
  const de = (f) => lista.filter(f)
  const exclusivos = new Set(['viajero:fundador', 'viajero:pionero', 'viajero:edicion_anio', 'viajero:probador'])
  const baldas = {
    viajero: de((it) => it.logro.startsWith('viajero:') && !exclusivos.has(it.logro) && it.logro !== 'viajero:maravillas'),
    sellos: de((it) => it.logro === 'sello'),
    colecciones: de((it) => it.logro === 'coleccion'),
    emblemas: de((it) => it.logro === 'emblema'),
  }
  const salida = {}
  for (const [nombre, todos] of Object.entries(baldas)) {
    const elegidos = (guardada.baldas?.[nombre] ?? []).map((k) => items.get(k)).filter(Boolean)
    const huecos = elegidos.length > 0 ? elegidos.slice(0, 4) : todos.slice(0, 4)
    salida[nombre] = { huecos: huecos.map((it) => it.clave), elegida: elegidos.length > 0, hay_mas: todos.length > huecos.length }
  }
  return {
    pedestal: de((it) => it.logro === 'maravilla').map((it) => it.clave),
    exclusivos: de((it) => exclusivos.has(it.logro)).map((it) => it.clave),
    baldas: salida,
    titulo: guardada.titulo && items.get(guardada.titulo) ? guardada.titulo : null,
  }
}

/** Para [Llevar a mi vitrina]: pone una clave en una balda; si está llena (4), hay que decir cuál quitar. */
export function llevarAVitrina(guardada, balda, claveNueva, quitar = null) {
  const actual = [...(guardada.baldas?.[balda] ?? [])]
  if (actual.includes(claveNueva)) return { ok: true, guardada }
  if (actual.length >= 4) {
    if (!quitar || !actual.includes(quitar)) return { ok: false, motivo: 'balda_llena', elegir_entre: actual }
    actual.splice(actual.indexOf(quitar), 1)
  }
  actual.push(claveNueva)
  return { ok: true, guardada: { ...guardada, baldas: { ...(guardada.baldas ?? {}), [balda]: actual } } }
}
