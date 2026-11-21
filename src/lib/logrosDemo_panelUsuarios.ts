/**
 * (V35A) El servidor de mentira de «USUARIOS» del panel (SOLO desarrollo, `?logrosDemo=1`): usa las MISMAS funciones puras del servidor (`server/panel/calculosUsuarios.js`) sobre una base falsa (`scripts/destino/_baseFalsaUsuarios.mjs`:
 * Eric, Alice, Bruno, Carla, Diana y 55 de relleno; nada de nadie). Así lo que ve la pantalla en la demo tiene exactamente la forma del servidor de verdad. Contesta `/api/admin/usuarios*`; el resto del panel, `logrosDemo_panel.ts`.
 * Quién es administrador lo decide el mismo interruptor (`window.__demoPanel.admin`).
 */
import destinosDelLanzamiento from '../../data/primera_vez/destinos.json'
import expJson from '../../data/logros/exp.json'
import lanzarote from '../../data/logros/lanzarote.json'
import roma from '../../data/logros/roma.json'
import viajero from '../../data/logros/viajero.json'
import { AHORA, baseFalsa, baseFalsaConPersonas } from '../../scripts/destino/_baseFalsaUsuarios.mjs'
import { ficha, indiceDeDestinos, listar, prepararUsuarios, resumen } from '../../server/panel/calculosUsuarios.js'
import { leerPeriodo } from '../../server/panel/periodo.js'
import { demoPanel } from './logrosDemo_panel'

const datos = { exp: expJson, destinos: { roma, lanzarote }, viajero }
const conocidos = indiceDeDestinos([...(destinosDelLanzamiento.salida ?? []), ...(destinosDelLanzamiento.proximamente ?? [])])
// (V35B) Con la 0091 aplicada (los datos de país y de uso) o sin ella: con `sessionStorage['trazo:demo-sin-0091'] = '1'` la demo contesta como el servidor SIN la migración (todo lo nuevo, «Pronto»).
const sinLa0091 = (): boolean => { try { return window.sessionStorage.getItem('trazo:demo-sin-0091') === '1' } catch { return false } }
const conNuevos = baseFalsaConPersonas()
const sinNuevos = baseFalsa()
const hoy = '2026-11-20'

export function responder(ruta: string, url: URL, _c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (!ruta.startsWith('/api/admin/usuarios')) return undefined
  demoPanel.pedidos.push(`${opciones.metodo ?? 'GET'} ${ruta}${url.search}`)
  if (!demoPanel.admin) return null
  const base = sinLa0091() ? sinNuevos : conNuevos
  const query: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    query[k] = v
  })
  if (ruta === '/api/admin/usuarios/totales') return resumen(base, { periodo: leerPeriodo(query), ahora: AHORA, datos, conocidos })
  const { registros } = prepararUsuarios(base, { hoy, datos, conocidos })
  if (ruta === '/api/admin/usuarios') return listar(registros, query, { hoy, conocidos })
  const f = /^\/api\/admin\/usuarios\/([^/]+)$/.exec(ruta)
  if (f) return ficha(registros, decodeURIComponent(f[1]), { hoy, ahora: AHORA, datos, reportes: [{ id: 'r1', tipo: 'dato_mal', titulo: 'Un dato está mal: Coliseo', estado: 'hecho', en: '2026-11-19T10:00:00Z' }, { id: 'r2', tipo: 'restaurante', titulo: 'Restaurante nuevo: Trattoria da Enzo', estado: 'visto', en: '2026-11-18T10:00:00Z' }] })
  return null
}
