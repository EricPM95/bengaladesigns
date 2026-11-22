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
 *   POST /api/admin/destinos/sonados/avisar      { tipo, destino, iso }   (V39: avisar a quien soñaba ese destino)
 * (Los de Reportes y Fotos ya existían: server/avisosViajeros.js.) Todas pasan por el mismo guardián que las demás /api/admin/* (401 sin sesión, 403 si no es administrador).
 */
import fs from 'node:fs'
import { crearCorreo } from '../correo.js'
import { cargarDatos } from '../logros/datos.js'
import { crearGuardian } from './guardian.js'
import { olvidarBase } from './base.js' // (V36)
import { crearAvisoInterno } from './avisoInterno.js'
import { crearServicioInicio } from './inicio.js'
import { crearServicioUsuarios } from './usuarios.js'
import { crearServicioVentas } from './ventas.js'
import { crearServicioReportes } from './reportes.js'
import { crearServicioDestinos } from './destinos.js'
import { crearServicioProximamente } from './proximamente.js' // (V35B)
import { crearServicioCuentasDePrueba } from './cuentasDePrueba.js' // (V35B)
import { registrarRutasLogrosPanel } from './logrosPanel.js' // (V35A logros)

const leerProximamente = () => {
  try {
    return JSON.parse(fs.readFileSync(new URL('../../data/primera_vez/destinos.json', import.meta.url), 'utf8')).proximamente ?? []
  } catch {
    return []
  }
}

export function registrarRutasPanel(app, { admin, env = process.env, correo = crearCorreo({ apiKey: env.RESEND_API_KEY }), ahora = () => new Date(), consola = console, datos = null, proximamente = leerProximamente, geocodificar, lanzados } = {}) {
  const conAdmin = crearGuardian({ admin, env, consola })
  // (V36) La base del panel se guarda en memoria (base.js): cualquier escritura del panel (POST/PUT/DELETE) la olvida al acabar, para que lo guardado se vea al momento.
  app.use('/api/admin', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') res.on('finish', () => olvidarBase(admin))
    next()
  })
  // Los datos de los logros (tabla de niveles y nombres de sellos) se cargan una sola vez, la primera que hace falta.
  let cache = datos
  const datosLogros = () => (cache ??= cargarDatos())
  const avisoInterno = admin ? crearAvisoInterno({ admin, correo, env, ahora, consola }) : null
  const inicio = crearServicioInicio({ admin, correo, avisoInterno, ahora, env })
  const usuarios = crearServicioUsuarios({ admin, datos: datosLogros, ahora, env })
  const ventas = crearServicioVentas({ admin, ahora, env })
  const reportes = crearServicioReportes({ admin, correo })
  // (V35B) Los Próximamente en la base de datos (0091): sin la tabla, siguen saliendo del JSON y el panel dice «Pronto».
  const servicioProximamente = crearServicioProximamente({ admin, ...(geocodificar ? { geocodificar } : {}), ...(lanzados ? { lanzados } : {}), consola })
  const destinos = crearServicioDestinos({ admin, correo, proximamente, servicioProximamente, ...(lanzados ? { lanzados } : {}), env, consola })
  // La lista pública para el mapa de la app (nada personal).
  app.get('/api/destinos-proximamente', async (_req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=60').json(await servicioProximamente.publica())
    } catch {
      res.json({ ok: true, origen: 'archivo', destinos: [] })
    }
  })

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
  app.post('/api/admin/destinos/sonados/avisar', conAdmin(async (req, res) => {
    const r = await destinos.sonadosAvisar(req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  // (V35B) Los clics en «Reservar» (Civitatis y Stay22), contados por día, destino y tipo. SIN saber quién: no se lee la cuenta, la IP ni nada del aparato. Sin la 0091 (no existe la función) responde igual y no guarda nada.
  // (V35B) «Cuentas que no cuentan» (Herramientas): marcar o desmarcar una cuenta, por correo, como de prueba.
  const cuentasDePrueba = crearServicioCuentasDePrueba({ admin, env, consola })
  app.get('/api/admin/cuentas-de-prueba', conAdmin(async (_req, res) => res.json(await cuentasDePrueba.leer())))
  app.post('/api/admin/cuentas-de-prueba', conAdmin(async (req, res) => {
    const r = await cuentasDePrueba.marcar(req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  app.post('/api/afiliados/clic', async (req, res) => {
    const c = req.body ?? {}
    const destino = String(c.destino ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
    if (admin && destino && ['actividad', 'hotel'].includes(c.tipo) && ['civitatis', 'stay22'].includes(c.proveedor)) {
      try {
        await admin.rpc('afiliado_clic', { p_destino: destino, p_tipo: c.tipo, p_proveedor: c.proveedor })
        olvidarBase(admin) // (V36) el panel enseña el clic nuevo al momento
      } catch {
        /* sin la 0091: nada */
      }
    }
    res.status(204).end()
  })
  app.post('/api/admin/destinos/proximamente', conAdmin(async (req, res) => {
    const r = await servicioProximamente.anadir(req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  app.post('/api/admin/destinos/proximamente/quitar', conAdmin(async (req, res) => {
    const r = await servicioProximamente.quitar(req.body)
    return res.status(r.estado).json(r.cuerpo)
  }))
  registrarRutasLogrosPanel(app, { admin, conAdmin, ahora, env }) // (V35A logros)
  return { avisoInterno }
}
