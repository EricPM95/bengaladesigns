/**
 * «LOGROS Y SONIDOS» DEL PANEL (V35A): el servidor de las pestañas Logros y «Qué tiene cada destino». Solo lectura, solo para administradores (el mismo guardián `conAdmin` que las demás /api/admin/*: 401 sin sesión, 403 si no es administrador).
 *
 *   GET /api/admin/logros-panel/destinos          la tabla «Qué tiene cada destino» (14 filas: los 11 del lanzamiento y los 3 de «Próximamente»)
 *   GET /api/admin/logros-panel/destino/:clave    la página de un destino («Roma por dentro»); 404 si ese destino no tiene datos de logros
 *   GET /api/admin/logros-panel/resumen?destino=&desde=&hasta=    la pestaña «Logros» (solo números de la tabla `achievements`; nunca quién ni sus fotos)
 *
 * Los números salen de los MISMOS archivos que usan los logros (data/logros/*.json, server/logros/datos.js) y de data/primera_vez/destinos.json; las funciones que los calculan están en logrosPanelDatos.js (puras).
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cargarDatos, cargarCatalogo, validarDatos } from '../logros/datos.js'
import { leerDestinosCurados } from '../destinosCurados.js'
import { rpc } from './guardian.js'
import { leerBaseDelPanel } from './pruebas.js' // (V35B) «Sin cuentas de prueba»
import { filasDeDestinos, paginaDeDestino, resumenDeLogros } from './logrosPanelDatos.js'

const RAIZ = new URL('../../data/', import.meta.url)
const RAIZ_RUTA = fileURLToPath(RAIZ)
const leerJson = (ruta) => JSON.parse(fs.readFileSync(new URL(ruta, RAIZ), 'utf8'))
const existe = (ruta) => fs.existsSync(new URL(ruta, RAIZ))
const POR_PAGINA = 1000
const MAX_PAGINAS = 100

/** Lee los archivos y arma `fuentes` (ver logrosPanelDatos.js). Se vuelve a leer en cada petición del panel (son pocas y así un cambio de datos se ve sin reiniciar). */
export function cargarFuentes(datos = cargarDatos()) {
  const lanzamiento = leerJson('primera_vez/destinos.json')
  const claves = Object.keys(datos.destinos)
  const nombres = {}
  const dias = {}
  const fotos = {}
  const portadas = {}
  const catalogos = {}
  for (const k of claves) {
    catalogos[k] = cargarCatalogo(k)
    nombres[k] = Object.fromEntries((catalogos[k].places ?? []).map((p) => [p.id, p.name]))
    dias[k] = existe(`dias/${k}/listas.json`) ? Object.keys(leerJson(`dias/${k}/listas.json`).dias ?? {}) : null
    if (existe(`dias/${k}/_fotos.json`)) {
      const f = leerJson(`dias/${k}/_fotos.json`)
      fotos[k] = { sin: f.sin_foto ?? [] }
    }
    if (existe(`dias/${k}/_mapa.json`)) portadas[k] = leerJson(`dias/${k}/_mapa.json`).portada ?? null
  }
  const publicos = leerDestinosCurados(RAIZ_RUTA, { esAdmin: false }).map((x) => x.clave)
  const todos = leerDestinosCurados(RAIZ_RUTA, { esAdmin: true }).map((x) => x.clave)
  return {
    lanzamiento,
    logros: datos.destinos,
    nombres,
    dias,
    fotos,
    portadas,
    publicos,
    ocultos: todos.filter((k) => !publicos.includes(k)),
    avisos: validarDatos(datos, catalogos),
    ajustes: datos.ajustes,
  }
}

/** Todas las filas de `achievements` (solo las 5 columnas que hacen falta para contar), de 1.000 en 1.000. Si hay más de 100.000 se corta y se avisa. */
async function leerLogros(admin) {
  const filas = []
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const { data, error } = await admin.from('achievements').select('user_id,destino,logro,escalon,ganado_en').order('ganado_en', { ascending: true }).range(p * POR_PAGINA, (p + 1) * POR_PAGINA - 1)
    if (error) throw new Error(`achievements: ${error.message}`)
    filas.push(...(data ?? []))
    if ((data ?? []).length < POR_PAGINA) return { filas, truncado: false }
  }
  return { filas, truncado: true }
}

const fechaValida = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null)

export function registrarRutasLogrosPanel(app, { admin, conAdmin, ahora = () => new Date(), env = process.env }) {
  app.get('/api/admin/logros-panel/destinos', conAdmin(async (_req, res) => {
    res.json({ ok: true, destinos: filasDeDestinos(cargarFuentes()) })
  }))
  app.get('/api/admin/logros-panel/destino/:clave', conAdmin(async (req, res) => {
    const pagina = paginaDeDestino(cargarFuentes(), String(req.params.clave ?? '').toLowerCase())
    if (!pagina) return res.status(404).json({ ok: false, error: 'Ese destino no tiene datos de logros todavía.' })
    return res.json(pagina)
  }))
  app.get('/api/admin/logros-panel/resumen', conAdmin(async (req, res) => {
    const datos = cargarDatos()
    const { filas: todasLasFilas, truncado } = await leerLogros(admin)
    // (V35B) Las cuentas de prueba (con el interruptor) y las de administrador no cuentan.
    let fuera = new Set()
    try {
      fuera = new Set((await leerBaseDelPanel(admin, req.query, env)).ids_fuera)
    } catch {
      fuera = new Set()
    }
    const filas = todasLasFilas.filter((x) => !fuera.has(x.user_id))
    let cuentas = null
    try {
      const t = await rpc(admin, 'panel_usuarios_totales', { p_ahora: ahora().toISOString() })
      cuentas = Math.max(0, (Number(t?.total) || 0) - fuera.size)
    } catch {
      cuentas = null
    }
    res.json({ ...resumenDeLogros({ filas, datos, destino: String(req.query.destino ?? '').toLowerCase(), desde: fechaValida(req.query.desde), hasta: fechaValida(req.query.hasta), cuentas }), truncado })
  }))
}
