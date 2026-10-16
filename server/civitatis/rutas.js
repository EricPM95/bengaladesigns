/**
 * LAS RUTAS DE NUESTRO SERVIDOR PARA LA API DE CONSULTA (parte 1). El móvil habla con estas rutas, nunca con la API: el usuario, la contraseña y el token se quedan aquí.
 *
 *   GET  /api/civitatis/estado                      → { activa, entorno, hayClaves }  (nada secreto)
 *   GET  /api/civitatis/horas?lugar=Coliseo&fecha=AAAA-MM-DD[&fresco=1]
 *                                                   → { ok, datos: { fecha, sinPlazas, horas: [{ hora, plazas, aviso }] } }
 *   GET  /api/civitatis/free-tour?desde=…&hasta=…[&fresco=1]
 *                                                   → { ok, datos: { dias: { 'AAAA-MM-DD': [{ hora, plazas, aviso }] } } }
 *   POST /api/civitatis/cerca  { lat, lng }         → { ok, datos: [actividades cerca] }   (la pestaña «Entradas» de un sitio sin entradas escritas a mano)
 *   GET  /api/civitatis/traslados?destino=Roma      → { ok, datos: { url } }
 *
 * Siempre responden 200 con `{ ok: false, motivo }` cuando la API no está (apagada, caída, fuera de horario, sin datos): quien llama hace lo de hoy. La app avisa, no prohíbe.
 */

import { datosDelDestino } from './servicio.js'

const esFecha = (f) => /^\d{4}-\d{2}-\d{2}$/.test(String(f ?? ''))

export function registrarRutasCivitatis(app, servicio) {
  const { activa } = servicio
  const fresco = (req) => String(req.query?.fresco ?? '') === '1'

  app.get('/api/civitatis/estado', (_req, res) => {
    res.json({ activa, entorno: servicio.cliente.entorno, hayClaves: servicio.cliente.tieneClaves })
  })

  app.get('/api/civitatis/horas', async (req, res) => {
    try {
      const lugar = String(req.query?.lugar ?? '')
      const fecha = String(req.query?.fecha ?? '')
      const destino = String(req.query?.destino ?? 'Roma')
      const id = datosDelDestino(destino)?.horas?.[lugar]
      if (!activa) return res.json({ ok: false, motivo: 'apagada' })
      if (!id) return res.json({ ok: false, motivo: 'sin_actividad' })
      if (!esFecha(fecha)) return res.json({ ok: false, motivo: 'fechas_malas' })
      res.json(await servicio.horasLibres(id, fecha, { fresco: fresco(req) }))
    } catch {
      res.json({ ok: false, motivo: 'no_disponible' })
    }
  })

  app.get('/api/civitatis/free-tour', async (req, res) => {
    try {
      const desde = String(req.query?.desde ?? '')
      const hasta = String(req.query?.hasta ?? '')
      const destino = String(req.query?.destino ?? 'Roma')
      const id = datosDelDestino(destino)?.free_tour
      if (!activa) return res.json({ ok: false, motivo: 'apagada' })
      if (!id) return res.json({ ok: false, motivo: 'sin_actividad' })
      if (!esFecha(desde) || !esFecha(hasta) || desde > hasta) return res.json({ ok: false, motivo: 'fechas_malas' })
      res.json(await servicio.freeTourHoras(id, desde, hasta, { fresco: fresco(req) }))
    } catch {
      res.json({ ok: false, motivo: 'no_disponible' })
    }
  })

  app.post('/api/civitatis/cerca', async (req, res) => {
    try {
      if (!activa) return res.json({ ok: false, motivo: 'apagada' })
      res.json(await servicio.cercaDe(req.body?.lat, req.body?.lng, Number(req.body?.distancia) > 0 ? Number(req.body.distancia) : 0.3))
    } catch {
      res.json({ ok: false, motivo: 'no_disponible' })
    }
  })

  app.get('/api/civitatis/traslados', async (req, res) => {
    try {
      const datos = datosDelDestino(String(req.query?.destino ?? 'Roma'))
      if (!activa) return res.json({ ok: false, motivo: 'apagada' })
      if (!datos) return res.json({ ok: false, motivo: 'sin_actividad' })
      res.json(await servicio.traslados(datos.destino.id))
    } catch {
      res.json({ ok: false, motivo: 'no_disponible' })
    }
  })
}
