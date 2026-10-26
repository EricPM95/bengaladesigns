/**
 * EL PERFIL CON SU MARCO (Tanda 8C2). Una ruta de solo lectura que reúne lo que el Perfil pinta, para no pedir cuatro cosas al abrirlo:
 *
 *   GET /api/logros/perfil   la EXP (nivel, rango, estrellas, barra), el título elegido y los que puede elegir, el resumen de la vitrina y los números del pasaporte
 *
 * Para ELEGIR el título se reutiliza `PUT /api/logros/vitrina { titulo }` (rutas.js). Lo ganado en un viaje sale de `GET /api/logros/resumen?trip_id=` (ya existe).
 *
 * Nada está escrito a mano: la EXP sale de `servicio.expDe` (data/logros/exp.json, nunca baja), los títulos de los logros de viajero que hay ganados (data/logros/viajero.json) y los números de
 * `pasaporte()` y de lo ganado. Los emblemas ocultos solo salen si ya se encontraron, y Madrugador y Nocturno no salen en el resumen de la vitrina (su dibujo lleva una hora).
 * Las funciones puras de abajo se prueban en `scripts/destino/pruebas8c/perfil.mjs`.
 */
import { GLOBAL, clave } from '../motor.js'
import { nivelDeExp } from '../exp.js'
import { logrosVisibles, pasaporte } from '../vistas.js'
import { viajesAcabados } from '../exp.js'
import { catalogoDePaises, paginasDelPasaporte, paisesConocidos, recuerdosDe, resumenDePasaporte } from './previos.js'

/** Los emblemas cuyo dibujo lleva una hora: no salen en ningún resumen. */
const EMBLEMAS_CON_HORA = new Set(['madrugador', 'nocturno'])
/** Lo que se dibuja en el resumen de la vitrina del Perfil (los tres últimos logros de estas clases). */
const CLASES_DE_VITRINA = (it) => it.logro === 'sello' || it.logro === 'coleccion' || (it.logro === 'emblema' && !EMBLEMAS_CON_HORA.has(it.escalon)) || it.logro.startsWith('viajero:')
/** Lo que cuenta como «un logro» de la vitrina (las mismas clases que `vitrinaDeGanados`, más las maravillas). */
const CUENTA_COMO_LOGRO = (it) => it.logro === 'sello' || it.logro === 'coleccion' || it.logro === 'emblema' || it.logro === 'maravilla' || it.logro.startsWith('viajero:')

/**
 * Los títulos que se pueden elegir: de cada logro de viajero visible, el escalón MÁS ALTO que está ganado (o el logro, si no tiene escalones).
 * `items`: mapa de claves de lo ganado. Devuelve [{ clave, id, grupo, nombre, escalon, linea }] en el orden de los grupos de `datos.viajero`.
 */
export function titulosGanados({ datos, items, ahora = new Date() }) {
  const salida = []
  for (const def of logrosVisibles(datos, ahora)) {
    if (def.escalones) {
      const ganados = def.escalones.filter((e) => items.has(clave(GLOBAL, `viajero:${def.id}`, String(e.n))))
      const mejor = ganados[ganados.length - 1]
      if (mejor) salida.push({ clave: clave(GLOBAL, `viajero:${def.id}`, String(mejor.n)), id: def.id, grupo: def.grupo, nombre: mejor.nombre, escalon: mejor.n, linea: def.linea ?? null })
    } else if (items.has(clave(GLOBAL, `viajero:${def.id}`, ''))) {
      salida.push({ clave: clave(GLOBAL, `viajero:${def.id}`, ''), id: def.id, grupo: def.grupo, nombre: def.nombre ?? def.id, escalon: null, linea: def.linea ?? null })
    }
  }
  return salida
}

/** Un sello que sube de grado (bronce, plata, oro…) o un logro con varios escalones se cuenta UNA vez: el último que se ganó (la lista llega ordenada del más nuevo al más viejo). */
function sinRepetidos(lista) {
  const vistos = new Set()
  return lista.filter((it) => {
    const id = it.logro === 'sello' ? `sello|${it.destino}|${String(it.escalon).split(':')[0]}` : it.logro.startsWith('viajero:') ? it.logro : it.clave
    if (vistos.has(id)) return false
    vistos.add(id)
    return true
  })
}

/** El resumen de la vitrina para el Perfil: cuántos logros hay ganados (cada sello y cada logro con escalones, una vez: los mismos que cuenta «Todos mis logros») y los tres últimos (clave, clase, escalón y destino, para dibujarlos). */
export function resumenDeVitrina({ items }) {
  const lista = [...items.values()].sort((a, b) => new Date(b.en) - new Date(a.en))
  return {
    logros: sinRepetidos(lista.filter(CUENTA_COMO_LOGRO)).length,
    recientes: sinRepetidos(lista.filter(CLASES_DE_VITRINA)).slice(0, 3).map((it) => ({ clave: it.clave, logro: it.logro, escalon: it.escalon, destino: it.destino })),
  }
}

/**
 * Los números de «Mi pasaporte»: los países (los de la app y los marcados de antes) y los sellos (uno por ciudad con sello ganado, más el «recuerdo» de cada país de antes de la app que aún no se ha visitado).
 */
export function numerosDePasaporte({ datos, items, previos, ahora, catalogo }) {
  const base = pasaporte({ datos, items, previos, ahora })
  const visitados = new Set(base.tus_paises.map((p) => p.pais))
  const ciudadesConSello = new Set([...items.values()].filter((it) => it.logro === 'sello').map((it) => `${it.destino}|${String(it.escalon).split(':')[0]}`))
  const recuerdos = recuerdosDe(previos, catalogo, visitados)
  // `ciudades` es la MISMA cuenta que la cabecera del pasaporte (ciudades distintas con destino nuevo): volver a Roma suma sello, no ciudad.
  return { paises: base.numeros.paises, ciudades: base.numeros.ciudades, sellos: ciudadesConSello.size + recuerdos.length }
}

/** Lo que el Perfil recibe, a partir de lo ya calculado. `exp`: lo que devuelve `servicio.expDe`. `guardada`: `perfil.vitrina` de la cuenta. */
export function construirPerfil({ datos, items, exp, guardada = { baldas: {}, titulo: null }, previos, ahora, catalogo }) {
  const titulos = titulosGanados({ datos, items, ahora })
  const elegido = guardada?.titulo ? titulos.find((t) => t.clave === guardada.titulo) ?? null : null
  return {
    ok: true,
    exp: {
      exp: exp.exp,
      nivel: exp.nivel,
      rango: exp.rango,
      rango_ix: exp.rango_ix,
      estrellas: exp.estrellas,
      leyenda_estrellas: exp.leyenda_estrellas,
      exp_en_nivel: exp.exp_en_nivel,
      exp_para_siguiente: exp.exp_para_siguiente,
      falta: exp.falta,
      // Si ya está en el último nivel: desde ahí solo se ganan estrellas de Leyenda (lo dice la tabla, no el móvil).
      maximo: Boolean(nivelDeExp(exp.exp, datos.exp).maximo),
    },
    titulo: elegido,
    titulos,
    vitrina: resumenDeVitrina({ items }),
    pasaporte: numerosDePasaporte({ datos, items, previos, ahora, catalogo }),
    // Los países que marcó en «¿Dónde has estado ya?» (los viajes de antes de la app): solo cuántos.
    previos: { paises: paisesConocidos(previos, catalogo).length },
  }
}

export function registrar(app, ctx) {
  const { conUsuario, servicio, repo, datos } = ctx
  const ahora = () => (typeof ctx.ahora === 'function' ? ctx.ahora() : (ctx.ahora ?? new Date()))
  const catalogo = catalogoDePaises()

  app.get(
    '/api/logros/perfil',
    conUsuario(async (_req, res, u) => {
      const [exp, c, perfil] = await Promise.all([servicio.expDe(u.id), servicio.cargar(u.id), repo.perfilDe(u.id)])
      const previos = perfil.previos ?? { paises: [], dias: 0 }
      const json = construirPerfil({ datos, items: servicio.aItems(c.logros), exp, guardada: perfil.vitrina, previos, ahora: ahora(), catalogo })
      // (10P, 1.8) El pasaporte sale de UN solo sitio —el mismo que `/api/logros/pasaporte2`—: países, ciudades, días viajando, sellos y el mapa de lo visitado, nunca el viaje planeado.
      const base = await servicio.pasaporteDe(u.id)
      const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: ahora() })
      const paginas = paginasDelPasaporte({ datos, base, previos, catalogo, hechos: c.hechos, viajes: c.viajes, acabados })
      json.pasaporte = resumenDePasaporte({ base, paginas })
      // (10P, 1.6) El billete del sorteo.
      json.sorteo = await servicio.sorteoDeCuenta(u.id, c)
      return res.json(json)
    }),
  )
}
