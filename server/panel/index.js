/**
 * EL SERVIDOR DEL «PANEL DE JUTRIP» (V33, /admin): un solo sitio para gestionar todo, solo para administradores. SOLO LECTURA (salvo [Responder] y [Ya está disponible]), sin exportar, nunca datos de tarjeta ni
 * contraseñas. Los datos se leen con la clave de servicio, solo en el servidor, con funciones SQL (migración 0090) y listas paginadas de 50 en 50.
 *
 *   GET  /api/admin/inicio                       → server/panel/inicio.js
 *   GET  /api/admin/usuarios?q=&pase=&destino=&frecuencia=&compania=&orden=&pagina=
 *   GET  /api/admin/usuarios/totales
 *   GET  /api/admin/usuarios/:id                 (404 si el id no vale o no existe)
 *   GET  /api/admin/ventas
 *   GET  /api/admin/reportes · GET /api/admin/reportes/:id   (V35A: la lista y el detalle de los reportes)
 *   POST /api/admin/reportes/:id/responder       { texto, hecho? }
 *   GET  /api/admin/destinos
 *   POST /api/admin/destinos/ya-disponible       { destino }
 * (Los de Reportes y Fotos ya existían: server/avisosViajeros.js.) Todas pasan por el mismo guardián que las demás /api/admin/* (401 sin sesión, 403 si no es administrador).
 */
import fs from 'node:fs'
import { crearCorreo } from '../correo.js'
import { cargarDatos } from '../logros/datos.js'
import { crearGuardian } from './guardian.js'
import { crearAvisoInterno } from './avisoInterno.js'
import { crearServicioInicio } from './inicio.js'
import { crearServicioUsuarios } from './usuarios.js'
import { crearServicioVentas } from './ventas.js'
import { crearServicioReportes } from './reportes.js'
import { crearServicioDestinos } from './destinos.js'
import { registrarRutasLogrosPanel } from './logrosPanel.js' // (V35A logros)

const leerProximamente = () => {
  try {
    return JSON.parse(fs.readFileSync(new URL('../../data/primera_vez/destinos.json', import.meta.url), 'utf8')).proximamente ?? []
  } catch {
    return []
  }
}

export function registrarRutasPanel(app, { admin, env = process.env, correo = crearCorreo({ apiKey: env.RESEND_API_KEY }), ahora = () => new Date(), consola = console, datos = null, proximamente = leerProximamente } = {}) {
  const conAdmin = crearGuardian({ admin, env, consola })
  // Los datos de los logros (tabla de niveles y nombres de sellos) se cargan una sola vez, la primera que hace falta.
  let cache = datos
  const datosLogros = () => (cache ??= cargarDatos())
  const avisoInterno = admin ? crearAvisoInterno({ admin, correo, env, ahora, consola }) : null
  const inicio = crearServicioInicio({ admin, correo, avisoInterno, ahora })
  const usuarios = crearServicioUsuarios({ admin, datos: datosLogros, ahora })
  const ventas = crearServicioVentas({ admin, ahora })
  const reportes = crearServicioReportes({ admin, correo })
  const destinos = crearServicioDestinos({ admin, correo, proximamente, env, consola })

  app.get('/api/admin/inicio', conAdmin(async (req, res) => res.json(await inicio.leer(req.query))))
  app.get('/api/admin/usuarios', conAdmin(async (req, res) => res.json(await usuarios.listar(req.query))))
  // (Esta va antes que la de :id.)
  app.get('/api/admin/usuarios/totales', conAdmin(async (req, res) => res.json(await usuarios.totales(req.query))))
  app.get('/api/admin/usuarios/:id', conAdmin(async (req, res) => {
    const ficha = await usuarios.ficha(req.params.id)
    if (!ficha) return res.status(404).json({ ok: false, error: 'Esa persona no existe.' })
    return res.json(ficha)
  }))
  app.get('/api/admin/ventas', conAdmin(async (req, res) => res.json(await ventas.leer(req.query))))
  // (V35A) La lista y el detalle de los reportes (con quién lo mandó, el contexto en palabras y el historial). La lista va antes que la de :id.
  app.get('/api/admin/reportes', conAdmin(async (req, res) => res.json(await reportes.lista(req.query))))
  app.get('/api/admin/reportes/:id', conAdmin(async (req, res) => {
    const d = await reportes.detalle(req.params.id)
    if (!d) return res.status(404).json({ ok: false, error: 'Ese reporte no existe.' })
    return res.json(d)
  }))
  app.post('/api/admin/reportes/:id/responder', conAdmin(async (req, res) => {
    const r = await reportes.responder(req.params.id, req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  app.get('/api/admin/destinos', conAdmin(async (req, res) => res.json(await destinos.leer(req.query))))
  app.post('/api/admin/destinos/ya-disponible', conAdmin(async (req, res) => {
    const r = await destinos.yaDisponible(req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  registrarRutasLogrosPanel(app, { admin, conAdmin, ahora }) // (V35A logros)
  return { avisoInterno }
}
