/**
 * «¿DÓNDE HAS ESTADO YA?» Y EL PASAPORTE (Tanda 8C2). Rutas nuevas, de solo lectura:
 *   GET /api/logros/previos      los países que marcó el viajero (y los días de antes), los sellos «recuerdo» y los números, calculados
 *   GET /api/logros/pasaporte2   el pasaporte de siempre (`/api/logros/pasaporte`) más las páginas por país: sellos de cada viaje acabado, sellos recuerdo y «Por conseguir»
 * Para GUARDAR lo que marca se reutiliza `PUT /api/logros/previos` (rutas.js).
 *
 * LA REGLA (decidida por Eric): los países de antes de la app solo dan su sello «recuerdo» en el pasaporte y sus números. NO dan EXP, NO cuentan para el sorteo y NO cuentan
 * para los logros que piden viajar con la app. Esto se cumple porque `previos` solo lo leen `pasaporte()` (vistas.js) y estas rutas: ni el motor, ni la EXP, ni el sorteo lo miran.
 * Las funciones puras de aquí abajo se prueban en `scripts/destino/pruebas8c/mundo.mjs`.
 */
import fs from 'node:fs'
import { GLOBAL, clave, hechosQueCuentan } from '../motor.js'
import { viajesAcabados } from '../exp.js'
import { datosDeSitio } from '../sitios.js'

/** El catálogo de países del mundo (nombre en español, continente, centro); también lo baja el móvil al abrir estas pantallas. */
export function catalogoDePaises() {
  return JSON.parse(fs.readFileSync(new URL('../../../data/logros/paises_mundo.json', import.meta.url), 'utf8'))
}

const sinTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Los nombres de `previos.paises` que el catálogo conoce, sin repetir. */
export function paisesConocidos(previos, catalogo) {
  const porNombre = new Map(catalogo.map((p) => [sinTildes(p.n), p]))
  const vistos = new Set()
  const salida = []
  for (const n of previos?.paises ?? []) {
    const p = porNombre.get(sinTildes(n))
    if (p && !vistos.has(p.i)) {
      vistos.add(p.i)
      salida.push(p)
    }
  }
  return salida
}

/**
 * Los sellos «recuerdo»: un país de antes de la app que todavía no se ha visitado con la app (si ya se visitó, su sello es el de verdad).
 * @param {Set<string>} visitadosConLaApp nombres de país
 */
export function recuerdosDe(previos, catalogo, visitadosConLaApp = new Set()) {
  return paisesConocidos(previos, catalogo)
    .filter((p) => !visitadosConLaApp.has(p.n))
    .map((p) => ({ pais: p.n, iso: p.i, continente: p.c }))
}

/** Los números de «Lo que has ganado»: salen solo de lo marcado (países, continentes, sellos recuerdo y microestados). */
export function numerosDePrevios(previos, catalogo, visitadosConLaApp = new Set(), microestados = []) {
  const conocidos = paisesConocidos(previos, catalogo)
  const recuerdos = recuerdosDe(previos, catalogo, visitadosConLaApp)
  return {
    paises: conocidos.length,
    continentes: new Set(conocidos.map((p) => p.c)).size,
    sellos_recuerdo: recuerdos.length,
    microestados: conocidos.filter((p) => microestados.includes(p.n)).length,
  }
}

const nombresVisitados = (items) => new Set([...items.values()].filter((it) => it.logro === 'pais').map((it) => it.escalon))

/**
 * Las páginas del pasaporte, una por país, en este orden: los visitados con la app (por fecha de entrada), los de antes de la app, y los «Por conseguir».
 * Cada sello de viaje es de un viaje ACABADO (el sello se estampa al acabar). Un destino del país que aún no se ha hecho sale como sello vacío («Por conseguir»).
 */
export function paginasDelPasaporte({ datos, base, previos, catalogo, hechos, viajes, acabados }) {
  const iso = new Map(catalogo.map((p) => [p.n, p]))
  const cuentan = hechosQueCuentan(hechos ?? [], viajes ?? {}, datos)
  const entradas = new Set()
  for (const h of cuentan) {
    const pais = datosDeSitio(datos.destinos[h.destino], h.sitio)?.pais
    if (pais && h.trip_id) entradas.add(`${h.trip_id}|${pais}`)
  }
  const acabadosPorId = new Map(acabados.map((a) => [a.trip_id, a]))
  const visitadosConLaApp = new Set(base.tus_paises.map((p) => p.pais))
  const ficha = (nombre) => ({ iso: iso.get(nombre)?.i ?? null, continente: iso.get(nombre)?.c ?? null })

  const paginas = []
  for (const v of base.tus_paises) {
    const sellos = []
    for (const [tripId, a] of [...acabadosPorId].sort((x, y) => String(x[1].fin).localeCompare(String(y[1].fin)))) {
      if (!entradas.has(`${tripId}|${v.pais}`)) continue
      const viaje = viajes[tripId]
      const destino = datos.destinos[viaje.destino]
      sellos.push({ trip_id: tripId, destino: viaje.destino, ciudad: v.pais === destino.pais_defecto ? destino.ciudad : v.pais, fecha: a.fin, vacio: false })
    }
    const hechos_ = new Set(sellos.map((s) => s.destino))
    const vacios = v.destinos.filter((d) => !hechos_.has(d.destino) && datos.destinos[d.destino]?.pais_defecto === v.pais).map((d) => ({ trip_id: null, destino: d.destino, ciudad: d.ciudad, fecha: null, vacio: true, nuevo: Boolean(d.nuevo) }))
    paginas.push({ pais: v.pais, ...ficha(v.pais), continente: v.continente ?? ficha(v.pais).continente, estado: 'visitado', entrada: v.entrada, sellos: [...sellos, ...vacios] })
  }
  for (const r of recuerdosDe(previos, catalogo, visitadosConLaApp)) paginas.push({ pais: r.pais, iso: r.iso, continente: r.continente, estado: 'recuerdo', entrada: null, sellos: [] })
  for (const d of base.por_descubrir) {
    paginas.push({
      pais: d.pais,
      ...ficha(d.pais),
      continente: d.continente ?? ficha(d.pais).continente,
      estado: 'por_conseguir',
      entrada: null,
      sellos: d.destinos.map((x) => ({ trip_id: null, destino: x.destino, ciudad: x.ciudad, fecha: null, vacio: true, nuevo: Boolean(x.nuevo) })),
    })
  }
  return paginas
}

/**
 * UN SOLO SITIO para lo que cuenta el pasaporte (Tanda 10P, 1.8): los países, las ciudades, los días viajando y los sellos. Lo usan el pasaporte (`/api/logros/pasaporte2`) y la tarjeta «Mi pasaporte» del Perfil
 * (`/api/logros/perfil`), así que dentro y fuera salen siempre los mismos números. Cuenta lo VISITADO (con la app y los de «¿Dónde has estado ya?»), nunca el viaje planeado.
 * `paises_iso`: los países visitados (para centrar y pintar el mapa); `sellos_recientes`: los dos últimos sellos de viaje, para que asomen en la tarjeta.
 */
export function resumenDePasaporte({ base, paginas }) {
  const sellos = paginas.reduce((n, p) => n + p.sellos.filter((s) => !s.vacio).length + (p.estado === 'recuerdo' ? 1 : 0), 0)
  const reales = paginas.flatMap((p) => p.sellos.filter((s) => !s.vacio && s.fecha).map((s) => ({ ciudad: s.ciudad, fecha: s.fecha, destino: s.destino })))
  reales.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  return {
    ...base.numeros,
    sellos,
    paises_iso: paginas.filter((p) => p.estado !== 'por_conseguir' && p.iso).map((p) => p.iso),
    sellos_recientes: reales.slice(0, 2),
  }
}

export function registrar(app, ctx) {
  const { conUsuario, servicio, repo, datos } = ctx
  const ahora = () => (typeof ctx.ahora === 'function' ? ctx.ahora() : (ctx.ahora ?? new Date()))
  const catalogo = catalogoDePaises()

  app.get(
    '/api/logros/previos',
    conUsuario(async (_req, res, u) => {
      const [c, perfil] = await Promise.all([servicio.cargar(u.id), repo.perfilDe(u.id)])
      const visitados = nombresVisitados(servicio.aItems(c.logros))
      const previos = perfil.previos ?? { paises: [], dias: 0 }
      return res.json({
        ok: true,
        paises: paisesConocidos(previos, catalogo).map((p) => p.n),
        dias: previos.dias ?? 0,
        recuerdos: recuerdosDe(previos, catalogo, visitados),
        numeros: numerosDePrevios(previos, catalogo, visitados, datos.viajero.microestados),
      })
    }),
  )

  app.get(
    '/api/logros/pasaporte2',
    conUsuario(async (_req, res, u) => {
      const [c, base] = await Promise.all([servicio.cargar(u.id), servicio.pasaporteDe(u.id)])
      const previos = c.perfil?.previos ?? { paises: [], dias: 0 }
      const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() })
      const paginas = paginasDelPasaporte({ datos, base, previos, catalogo, hechos: c.hechos, viajes: c.viajes, acabados })
      const { paises_iso: _i, sellos_recientes: _s, ...numeros } = resumenDePasaporte({ base, paginas })
      return res.json({ ok: true, ...base, numeros, paginas })
    }),
  )
}

/** Para las pruebas: la clave de un país visitado. */
export const clavePais = (nombre) => clave(GLOBAL, 'pais', nombre)
