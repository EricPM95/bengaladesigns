/**
 * LOS REPORTES DEL PANEL (V33, rehechos en la V35A):
 *   GET  /api/admin/reportes?tipo=&estado=&destino=&limite=   → la lista, con quién lo mandó (nombre y correo, solo para el administrador) y el estado de verdad
 *   GET  /api/admin/reportes/:id                              → UN reporte: el contexto en palabras (desde dónde, aparato, si quiere respuesta), el sitio y lo que pone ahora la app, las fotos, el historial de respuestas
 *   POST /api/admin/reportes/:id/responder { texto, hecho? }  → {ok, campana, correo, estado}: un texto corto al viajero (campana; correo solo con cuenta y «avísame») y, si `hecho`, el reporte pasa a «Hecho»
 * Remitente: Jutrip Soporte <soporte@jutrip.app>. El correo del viajero solo sale de la base hacia Resend: nunca se devuelve a la pantalla de la gente, solo al panel del administrador (el guardián da 403 al resto).
 * Sin funciones SQL nuevas: la lista y el detalle leen `avisos_de_viajeros` y `avisos` (las respuestas dejadas en la campana) directamente con la clave de servicio.
 */
import fs from 'node:fs'
import { REMITENTE_SOPORTE } from '../correo.js'
import { plantillaRespuesta } from './plantillas.js'
import { rpc } from './guardian.js'

export const MIN_RESPUESTA = 2
export const MAX_RESPUESTA = 300
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIPOS = ['restaurante', 'lugar', 'destino', 'foto', 'dato_mal', 'consejo', 'no_funciona', 'idea']
const ESTADOS = ['nuevo', 'visto', 'hecho', 'descartado', 'usada']
const BUCKET_AVISOS = 'avisos-viajeros'

export const limpiarRespuesta = (v) => String(v ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const s = (d, k) => String(d?.[k] ?? '').trim()

/** Lo que pone el viajero, en una línea para la lista («Coliseo · Horario»). */
const FALLOS = { horario: 'Horario', precio: 'Precio', cerrado: 'Está cerrado', ubicacion: 'Ubicación', foto: 'La foto', otro: 'Otro' }
export function tituloDeReporte(tipo, d = {}) {
  switch (tipo) {
    case 'dato_mal': return [s(d, 'sitio'), FALLOS[s(d, 'falla')] ?? s(d, 'falla')].filter(Boolean).join(' · ') || 'Un dato está mal'
    case 'foto': return [s(d, 'sitio'), 'Foto'].filter(Boolean).join(' · ')
    case 'consejo': return s(d, 'sitio') || 'Un consejo'
    case 'restaurante':
    case 'lugar': return s(d, 'nombre') || (tipo === 'lugar' ? 'Un lugar' : 'Un restaurante')
    case 'destino': return s(d, 'destino') || 'Un destino'
    case 'no_funciona': return s(d, 'que').slice(0, 70) || 'Algo no funciona'
    case 'idea': return s(d, 'texto').slice(0, 70) || 'Una idea'
    default: return 'Reporte'
  }
}
/** Lo que dice el viajero, entero y en palabras. */
export function textoDeReporte(tipo, d = {}) {
  switch (tipo) {
    case 'dato_mal': return [s(d, 'mas'), s(d, 'falla') && !s(d, 'mas') ? (FALLOS[s(d, 'falla')] ?? s(d, 'falla')) : ''].filter(Boolean).join(' ')
    case 'consejo': return s(d, 'consejo')
    case 'restaurante': return [s(d, 'nombre'), s(d, 'precio'), s(d, 'bueno')].filter(Boolean).join(' · ')
    case 'lugar': return [s(d, 'nombre'), s(d, 'porque')].filter(Boolean).join(' · ')
    case 'destino': return [s(d, 'destino'), s(d, 'cuando'), s(d, 'mas')].filter(Boolean).join(' · ')
    case 'foto': return [s(d, 'sitio'), s(d, 'nombre_en_foto') ? `Foto: ${s(d, 'nombre_en_foto')}` : ''].filter(Boolean).join(' · ')
    case 'no_funciona': return s(d, 'que')
    case 'idea': return s(d, 'texto')
    default: return ''
  }
}

const PESTANAS = { dias: 'DÍAS', ruta: 'RUTA', reservas: 'RESERVAS', explorar: 'EXPLORAR', hoy: 'HOY', itinerario: 'DÍAS' }
const PANTALLAS = { route: 'la ruta', landing: 'la pantalla de inicio', questionnaire: 'el cuestionario de crear el viaje', perfil: 'el Perfil', ajustes: 'Ajustes', loading: 'la pantalla de cargar el viaje', desconocida: 'la app' }
/** «Desde DÍAS de su viaje «Roma 26–29 nov»», «Desde la ficha de un sitio»… en palabras. */
export function dondeEstaba({ pantalla, pestana, viaje }) {
  const donde = PESTANAS[String(pestana ?? '').toLowerCase()] ?? PANTALLAS[String(pantalla ?? '')] ?? (pantalla ? String(pantalla) : 'la app')
  return `Desde ${donde}${viaje ? ` de su viaje «${viaje}»` : ''}`
}
/** «iPhone · Safari 17», o «—». */
export const aparatoDe = (dispositivo, navegador) => [dispositivo, navegador].map((x) => String(x ?? '').trim()).filter(Boolean).join(' · ') || '—'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaViaje = (ini, fin) => {
  const f = (d) => (/^\d{4}-\d{2}-\d{2}/.test(String(d ?? '')) ? `${Number(String(d).slice(8, 10))} ${MESES[Number(String(d).slice(5, 7)) - 1]}` : '')
  return ini && fin ? `${f(ini)}–${f(fin)}` : f(ini)
}

/** Los sitios que enseña la app (para decir «lo que pone ahora la app»): nombre, horario y entrada de cada uno, de los archivos de datos. */
function cargarSitios() {
  const salida = []
  for (const archivo of ['roma', 'lanzarote']) {
    try {
      const j = JSON.parse(fs.readFileSync(new URL(`../../data/pipeline_v2/${archivo}.json`, import.meta.url), 'utf8'))
      for (const p of j.places ?? []) salida.push({ clave: archivo, destino: j.destination ?? archivo, id: p.id, nombre: p.name, nombres: [p.name, ...(p.search_aliases ?? [])].map(sinTildes), horario: p.schedule ?? null, entrada: Array.isArray(p.ticket_info) ? p.ticket_info.filter((x) => /€|gratis|de pago/i.test(x)).join(' ') : null })
    } catch {
      /* sin ese archivo */
    }
  }
  return salida
}
export function buscarSitio(sitios, nombre, destino) {
  const k = sinTildes(nombre)
  if (!k) return null
  const d = sinTildes(destino)
  const delDestino = sitios.filter((x) => !d || sinTildes(x.destino) === d || x.clave === d)
  return (delDestino.length ? delDestino : sitios).find((x) => x.nombres.includes(k)) ?? (delDestino.length ? delDestino : sitios).find((x) => x.nombres.some((n) => n && (n.includes(k) || k.includes(n)) && Math.min(n.length, k.length) >= 5)) ?? null
}
const horarioBonito = (h) => String(h ?? '').replace(/-/g, '–')

export function crearServicioReportes({ admin, correo, sitios = cargarSitios }) {
  let cacheSitios = null
  const lugares = () => (cacheSitios ??= sitios())
  const personas = async (ids) => {
    const mapa = new Map()
    const unicos = [...new Set(ids.filter(Boolean))].slice(0, 100)
    if (!unicos.length) return mapa
    const { data: viajeros } = await admin.from('travelers').select('id,nombre').in('id', unicos)
    const nombres = new Map((viajeros ?? []).map((t) => [t.id, String(t.nombre ?? '').trim()]))
    await Promise.all(
      unicos.map(async (id) => {
        let email = ''
        try {
          email = (await admin.auth.admin.getUserById(id))?.data?.user?.email ?? ''
        } catch {
          email = ''
        }
        mapa.set(id, { id, nombre: nombres.get(id) || (email ? email.split('@')[0] : 'Sin nombre'), email })
      }),
    )
    return mapa
  }
  const firmar = async (rutas) => {
    const mapa = new Map()
    const unicas = [...new Set(rutas.filter(Boolean))]
    if (!unicas.length) return mapa
    try {
      const { data } = await admin.storage.from(BUCKET_AVISOS).createSignedUrls(unicas, 3600)
      for (const x of data ?? []) if (x?.signedUrl) mapa.set(x.path, x.signedUrl)
    } catch {
      /* sin firmar: se ven sin fotos */
    }
    return mapa
  }
  const COLUMNAS = 'id,creado,tipo,estado,datos,destino,trip_id,pantalla,pestana,parada,dia,version_app,dispositivo,navegador,hora_cliente,punto,fotos,captura,avisame,user_id,aviso_texto,avisado_en,revisado_en,foto_aprobada'
  return {
    async lista(query = {}) {
      const tipo = TIPOS.includes(query.tipo) ? query.tipo : null
      const estado = ESTADOS.includes(query.estado) ? query.estado : null
      const destino = sinTildes(String(query.destino ?? '').slice(0, 80))
      const limite = Math.max(1, Math.min(Number.parseInt(String(query.limite ?? ''), 10) || 200, 500))
      let q = admin.from('avisos_de_viajeros').select(COLUMNAS).order('creado', { ascending: false }).limit(limite)
      if (tipo) q = q.eq('tipo', tipo)
      if (estado) q = q.eq('estado', estado)
      const { data, error } = await q
      if (error) throw new Error(`reportes: ${error.message}`)
      let items = data ?? []
      if (destino) items = items.filter((i) => sinTildes(i.destino) === destino || sinTildes(i.datos?.destino) === destino)
      const quienes = await personas(items.map((i) => i.user_id))
      const { count } = await admin.from('avisos_de_viajeros').select('id', { count: 'exact', head: true }).eq('estado', 'nuevo')
      return {
        ok: true,
        nuevos: Number(count) || 0,
        items: items.map((i) => ({
          id: i.id,
          creado: i.creado,
          tipo: i.tipo,
          estado: i.estado,
          titulo: tituloDeReporte(i.tipo, i.datos),
          destino: i.destino || s(i.datos, 'destino') || null,
          con_cuenta: Boolean(i.user_id),
          quien: i.user_id ? (quienes.get(i.user_id) ?? null) : null,
        })),
      }
    },

    async detalle(id) {
      if (!UUID.test(String(id))) return null
      const { data: fila } = await admin.from('avisos_de_viajeros').select(COLUMNAS).eq('id', id).maybeSingle()
      if (!fila) return null
      const quien = fila.user_id ? ((await personas([fila.user_id])).get(fila.user_id) ?? null) : null
      let viaje = null
      if (fila.trip_id) {
        const { data: t } = await admin.from('trips').select('destino:route->>destination,inicio:route->answers->dateRange->>start,fin:route->answers->dateRange->>end').eq('id', fila.trip_id).maybeSingle()
        if (t) viaje = [t.destino, fechaViaje(t.inicio, t.fin)].filter(Boolean).join(' ')
      }
      const urls = await firmar([...(fila.fotos ?? []), fila.captura])
      // Las respuestas: las que se dejaron en la campana del viajero (una por respuesta).
      let respuestas = []
      if (fila.user_id) {
        const { data } = await admin.from('avisos').select('creado_en,clave,payload').eq('user_id', fila.user_id).like('clave', `respuesta:${id}:%`).order('creado_en', { ascending: true })
        respuestas = (data ?? []).map((a) => ({ cuando: a.creado_en, texto: String(a.payload?.texto ?? '') })).filter((a) => a.texto)
      }
      const historial = [{ quien: 'viajero', cuando: fila.creado, texto: textoDeReporte(fila.tipo, fila.datos) }, ...respuestas.map((r) => ({ quien: 'tu', cuando: r.cuando, texto: r.texto }))].filter((h) => h.texto)
      // El sitio y lo que pone ahora la app (horario, entrada) si es un sitio que conocemos.
      const sitioNombre = s(fila.datos, 'sitio') || s(fila.datos, 'nombre')
      const sitio = sitioNombre ? buscarSitio(lugares(), sitioNombre, fila.destino || s(fila.datos, 'destino')) : null
      const falla = s(fila.datos, 'falla')
      const enLaApp = !sitio ? null : falla === 'precio' ? (sitio.entrada ? { etiqueta: 'Entrada en la app', valor: sitio.entrada } : null) : sitio.horario ? { etiqueta: 'Horario en la app', valor: horarioBonito(sitio.horario) } : null
      const quiere = fila.avisame ? (fila.user_id ? 'Sí' : 'Sí (sin cuenta: no se le puede contestar)') : 'No'
      return {
        ok: true,
        reporte: {
          id: fila.id, creado: fila.creado, tipo: fila.tipo, estado: fila.estado, titulo: tituloDeReporte(fila.tipo, fila.datos), destino: fila.destino || null,
          con_cuenta: Boolean(fila.user_id), avisame: Boolean(fila.avisame), texto: textoDeReporte(fila.tipo, fila.datos), datos: fila.datos ?? {},
          fotos_urls: (fila.fotos ?? []).map((f) => urls.get(f)).filter(Boolean), captura_url: fila.captura ? (urls.get(fila.captura) ?? null) : null,
        },
        quien,
        contexto: [
          { l: 'Desde dónde', v: dondeEstaba({ pantalla: fila.pantalla, pestana: fila.pestana, viaje }) },
          { l: 'Aparato', v: aparatoDe(fila.dispositivo, fila.navegador) },
          { l: '¿Quiere respuesta?', v: quiere },
        ],
        tecnico: { version_app: fila.version_app ?? null, pantalla: fila.pantalla ?? null, pestana: fila.pestana ?? null, parada: fila.parada ?? null, dia: fila.dia ?? null, hora_cliente: fila.hora_cliente ?? null },
        sitio: sitio ? { nombre: sitio.nombre, id: sitio.id, destino: sitio.clave } : null,
        en_la_app: enLaApp,
        dice_el_viajero: fila.tipo === 'dato_mal' || fila.tipo === 'consejo' ? textoDeReporte(fila.tipo, fila.datos) : null,
        historial,
        se_puede_responder: Boolean(fila.user_id),
      }
    },

    /** @returns {Promise<{estado:number, cuerpo:object}>} */
    async responder(id, cuerpo) {
      if (!UUID.test(String(id))) return { estado: 404, cuerpo: { ok: false, error: 'Ese reporte no existe.' } }
      const texto = limpiarRespuesta(cuerpo?.texto)
      if (texto.length < MIN_RESPUESTA || texto.length > MAX_RESPUESTA) return { estado: 400, cuerpo: { ok: false, error: `La respuesta tiene que tener entre ${MIN_RESPUESTA} y ${MAX_RESPUESTA} caracteres.` } }
      const r = await rpc(admin, 'panel_reporte_responder', { p_id: id, p_texto: texto })
      if (!r?.encontrado) return { estado: 404, cuerpo: { ok: false, error: 'Ese reporte no existe.' } }
      let resultado
      if (!r.con_cuenta || !r.email) resultado = 'sin_cuenta'
      else if (r.avisame !== true) resultado = 'no_avisame'
      else if (!correo?.activo) resultado = 'sin_clave'
      else {
        const { asunto, html, texto: plano } = plantillaRespuesta(texto)
        const e = await correo.enviar({ de: REMITENTE_SOPORTE, para: r.email, asunto, html, texto: plano })
        resultado = e.enviado ? 'enviado' : e.motivo === 'sin_clave' ? 'sin_clave' : 'fallo'
      }
      // «y marcar como hecho»: el estado pasa a «hecho» SIN mandar otro aviso a la campana (la respuesta ya es el aviso).
      if (cuerpo?.hecho === true) await admin.from('avisos_de_viajeros').update({ estado: 'hecho', revisado_en: new Date().toISOString() }).eq('id', id)
      const { data: ahora } = await admin.from('avisos_de_viajeros').select('estado').eq('id', id).maybeSingle()
      return { estado: 200, cuerpo: { ok: true, campana: r.campana === true, correo: resultado, estado: ahora?.estado ?? null } }
    },
  }
}
