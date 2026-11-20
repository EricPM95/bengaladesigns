/**
 * Solo desarrollo (modo demo de los logros, ?logrosDemo=1): lo que contesta el servidor al panel «Avisos de viajeros» (V20), con avisos de PRUEBA que se inventan aquí: ni toca nada ni sale de la app.
 */
const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const AVISOS = [
  { id: 'a1', creado: hace(12), tipo: 'dato_mal', estado: 'nuevo', datos: { sitio: 'Coliseo', falla: 'horario', mas: 'Ahora cierra a las 18:00' }, destino: 'Roma', pantalla: 'route', pestana: 'days', parada: 'p4', dia: null, version_app: 'a1b2c3d4', dispositivo: 'iPhone', navegador: 'Safari 18', hora_cliente: hace(12), punto: null, errores: null, avisame: true, con_cuenta: true, fotos_urls: [], captura_url: null },
  { id: 'a2', creado: hace(95), tipo: 'restaurante', estado: 'nuevo', datos: { nombre: 'Trattoria da Enzo', precio: '€€', bueno: 'La carbonara' }, destino: 'Roma', pantalla: 'route', pestana: 'explore', parada: null, dia: null, version_app: 'a1b2c3d4', dispositivo: 'Pixel 8', navegador: 'Chrome 130', hora_cliente: hace(95), punto: { lat: 41.8893, lng: 12.4697, direccion: 'Via dei Vascellari, 29, 00153 Roma' }, errores: null, avisame: true, con_cuenta: false, fotos_urls: [], captura_url: null },
  { id: 'a3', creado: hace(240), tipo: 'no_funciona', estado: 'visto', datos: { que: 'Toqué Días y se quedó en blanco' }, destino: 'Lanzarote', pantalla: 'route', pestana: 'days', parada: null, dia: 'd2', version_app: 'a1b2c3d4', dispositivo: 'iPhone', navegador: 'Safari 18', hora_cliente: hace(240), punto: null, errores: ['TypeError: x is undefined (App.tsx:120)'], avisame: false, con_cuenta: false, fotos_urls: [], captura_url: null },
  { id: 'a4', creado: hace(600), tipo: 'destino', estado: 'nuevo', datos: { destino: 'Lisboa', cuando: 'el_ano_que_viene' }, destino: '', pantalla: 'destination', pestana: '', parada: null, dia: null, version_app: 'a1b2c3d4', dispositivo: 'iPhone', navegador: 'Safari 18', hora_cliente: hace(600), punto: null, errores: null, avisame: true, con_cuenta: true, fotos_urls: [], captura_url: null },
  { id: 'a5', creado: hace(700), tipo: 'foto', estado: 'nuevo', datos: { sitio: 'Coliseo', nombre_en_foto: 'Foto: Laura G.', acepta: true }, destino: 'Roma', pantalla: 'route', pestana: 'route', parada: null, dia: null, version_app: 'a1b2c3d4', dispositivo: 'Pixel 8', navegador: 'Chrome 130', hora_cliente: hace(700), punto: null, errores: null, avisame: true, con_cuenta: true, fotos_urls: [], captura_url: null },
]

export function responder(ruta: string, url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (ruta === '/api/admin/avisos-viajeros') {
    const tipo = url.searchParams.get('tipo')
    const estado = url.searchParams.get('estado')
    const destino = (url.searchParams.get('destino') ?? '').toLowerCase()
    const items = AVISOS.filter((a) => (!tipo || a.tipo === tipo) && (!estado || a.estado === estado) && (!destino || a.destino.toLowerCase().includes(destino)))
    return { ok: true, items, nuevos: AVISOS.filter((a) => a.estado === 'nuevo').length }
  }
  if (ruta === '/api/admin/avisos-viajeros/destinos') return [{ destino: 'Lisboa', cuantos: 7, primero: hace(9000), ultimo: hace(600), avisables: 5, pendientes: 7 }, { destino: 'Oporto', cuantos: 3, primero: hace(5000), ultimo: hace(2000), avisables: 2, pendientes: 3 }]
  if (ruta === '/api/admin/avisos-viajeros/destinos/ya-esta') return { ok: true, avisados: 5 }
  if (/^\/api\/admin\/avisos-viajeros\/[^/]+(\/usar-foto)?$/.test(ruta) && opciones.metodo !== 'GET' && !(opciones.metodo === 'PATCH' && /\/a[1-6]$/.test(ruta))) return { ok: true, avisado: c.estado === 'hecho' } // (V35A: el cambio de estado de a1 a a6 lo contesta y apunta la demo del panel)
  return undefined
}
