/**
 * El servidor de mentira de «LOGROS Y SONIDOS» del panel (V35A; SOLO desarrollo, `?logrosDemo=1`). Contesta lo mismo que server/panel/logrosPanel.js y las rutas de server/logros/rutas.js que usa el panel,
 * con LA FORMA REAL y los MISMOS archivos de datos (data/logros/*.json, data/primera_vez/destinos.json, data/dias/<destino>/…) y las MISMAS funciones de cálculo (server/panel/logrosPanelDatos.js):
 * así lo que se ve aquí es lo que sale de verdad. Lo único inventado son las 60 personas de mentira y lo que han ganado (la tabla `achievements`), que en el servidor viene de la base de datos.
 * (El nombre empieza por «a_» para que este archivo conteste ANTES que logrosDemo_empezarDeCero.ts en las rutas que comparten.)
 * Con `sessionStorage['trazo:demo-no-admin'] = '1'` contesta como una cuenta que NO es de administrador (sin respuesta, como el 403 del servidor).
 */
import destinosJson from '../../data/primera_vez/destinos.json' with { type: 'json' }
import romaJson from '../../data/logros/roma.json' with { type: 'json' }
import lanzaroteJson from '../../data/logros/lanzarote.json' with { type: 'json' }
import viajeroJson from '../../data/logros/viajero.json' with { type: 'json' }
import expJson from '../../data/logros/exp.json' with { type: 'json' }
import ajustesJson from '../../data/logros/ajustes.json' with { type: 'json' }
import { soloActivos } from '../../server/logros/viajeroActivo.js'
import { filasDeDestinos, paginaDeDestino, resumenDeLogros } from '../../server/panel/logrosPanelDatos.js'

const noEsAdmin = (): boolean => {
  try {
    return window.sessionStorage.getItem('trazo:demo-no-admin') === '1'
  } catch {
    return false
  }
}

const datosDeLogros = { destinos: { roma: romaJson, lanzarote: lanzaroteJson }, viajero: soloActivos(viajeroJson), exp: expJson, ajustes: ajustesJson }
const AHORA = Date.UTC(2026, 10, 20, 12)

/** Lo que cuesta cargar (el catálogo de sitios, los días escritos y las fotos) se pide una sola vez, la primera que hace falta. */
type Fuentes = Record<string, unknown>
let fuentes: Promise<Fuentes> | null = null
function cargarFuentes(): Promise<Fuentes> {
  fuentes ??= (async () => {
    const lee = async (k: string) => {
      const [catalogo, listas, fotos, mapa] = await Promise.all([
        import(`../../data/pipeline_v2/${k}.json`),
        import(`../../data/dias/${k}/listas.json`),
        import(`../../data/dias/${k}/_fotos.json`),
        import(`../../data/dias/${k}/_mapa.json`),
      ])
      return { nombres: Object.fromEntries((catalogo.default.places as { id: string; name: string }[]).map((p) => [p.id, p.name])), dias: Object.keys(listas.default.dias ?? {}), sin: (fotos.default.sin_foto ?? []) as string[], portada: (mapa.default.portada ?? null) as string | null }
    }
    const [roma, lanzarote] = await Promise.all([lee('roma'), lee('lanzarote')])
    return {
      lanzamiento: destinosJson,
      logros: datosDeLogros.destinos,
      nombres: { roma: roma.nombres, lanzarote: lanzarote.nombres },
      dias: { roma: roma.dias, lanzarote: lanzarote.dias },
      fotos: { roma: { sin: roma.sin }, lanzarote: { sin: lanzarote.sin } },
      portadas: { roma: roma.portada, lanzarote: lanzarote.portada },
      publicos: ['roma', 'lanzarote'],
      ocultos: [],
      avisos: [],
      ajustes: ajustesJson,
    }
  })()
  return fuentes
}

interface FilaLogro { user_id: string; destino: string; logro: string; escalon: string; ganado_en: string }
/** 60 personas de mentira y lo que han ganado (reparto fijo, sin azar). Los emblemas «has dicho la verdad» y «la Roma de debajo» no los tiene nadie (para ver el aviso de «demasiado escondido»). */
function filasDeMentira(): FilaLogro[] {
  const filas: FilaLogro[] = []
  const dia = (i: number, k: number) => new Date(AHORA - ((i * 13 + k * 7) % 50) * 864e5).toISOString()
  const dar = (i: number, destino: string, logro: string, escalon: string, k: number) => filas.push({ user_id: `u${String(i).padStart(3, '0')}-demo`, destino, logro, escalon, ganado_en: dia(i, k) })
  for (let i = 0; i < 60; i++) {
    for (const [destino, d] of Object.entries(datosDeLogros.destinos)) {
      const mod = destino === 'roma' ? 1 : 3
      if (i % mod !== 0) continue
      d.sellos.forEach((s, si) => s.grados.forEach((g, gi) => { if (i % (gi + 2 + si) === 0) dar(i, destino, 'sello', `${s.id}:${g.grado}`, gi) }))
      d.colecciones.forEach((c, ci) => {
        if (i % (ci + 3) === 0) dar(i, destino, 'coleccion', c.id, ci)
        else if (i % (ci + 2) === 1) dar(i, destino, 'pedazo', `${c.id}:${c.sitios[0]}`, ci)
      })
      d.emblemas.forEach((e, ei) => { if (!['boca_de_la_verdad', 'catacumbas', 'lz_madrugador'].includes(e.id) && i % (ei + 2) === 0) dar(i, destino, 'emblema', e.id, ei) })
    }
    datosDeLogros.viajero.logros.forEach((l: { id: string; escalones?: { n: number }[] }, li: number) => { if (i % (li + 2) === 0) dar(i, '*', `viajero:${l.id}`, l.escalones?.length ? String(l.escalones[0].n) : '', li) })
  }
  return filas
}

export function responder(ruta: string, url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  const propia = ruta.startsWith('/api/admin/logros-panel/') || ['/api/admin/logros/sorteo', '/api/admin/logros/probador', '/api/admin/logros/reiniciar-mis-pruebas', '/api/admin/logros/sin-pase', '/api/admin/logros/datos', '/api/admin/logros/simular'].includes(ruta)
  if (!propia) return undefined
  if (noEsAdmin()) return null
  const metodo = opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET')
  if (ruta === '/api/admin/logros-panel/destinos') return cargarFuentes().then((f) => ({ ok: true, destinos: filasDeDestinos(f) }))
  const pagina = /^\/api\/admin\/logros-panel\/destino\/([^/]+)$/.exec(ruta)
  if (pagina) return cargarFuentes().then((f) => paginaDeDestino(f, decodeURIComponent(pagina[1]).toLowerCase()) ?? null)
  if (ruta === '/api/admin/logros-panel/resumen') {
    return resumenDeLogros({ filas: filasDeMentira(), datos: datosDeLogros, destino: url.searchParams.get('destino') ?? '', desde: url.searchParams.get('desde'), hasta: url.searchParams.get('hasta'), cuentas: 1462 })
  }
  if (ruta === '/api/admin/logros/sorteo') {
    const lista = Array.from({ length: 7 }, (_, i) => ({ user_id: `3f2a${i}c1e-demo-0000-0000-00000000000${i}`, exp: 900 + i * 40, nivel: 3 + (i % 3), viajes_con_hoy: 1 }))
    return { ok: true, anio: 2027, edicion: { anio: 2027, destino: 'Roma', premio: expJson.sorteo.edicion.premio, cierre: expJson.sorteo.edicion.cierre }, cuentas: 60, entran: lista.length, lista, regla: { nivel_minimo: 3, viajes_con_hoy_minimos: 1 } }
  }
  if (ruta === '/api/admin/logros/probador' && metodo === 'POST') return String(c.email ?? '').includes('@') ? { ok: true } : null
  if (ruta === '/api/admin/logros/reiniciar-mis-pruebas' && metodo === 'POST') return c.confirmar === true ? { ok: true, borrados: {} } : null
  if (ruta === '/api/admin/logros/sin-pase' && metodo === 'POST') return typeof c.activo === 'boolean' ? { ok: true, activo: c.activo } : null
  if (ruta === '/api/admin/logros/simular') return { ok: true, pasos: [] }
  if (ruta === '/api/admin/logros/datos') {
    return {
      ok: true,
      destinos: datosDeLogros.destinos,
      avisos: [],
      viajero: datosDeLogros.viajero.logros.map((l: { id: string; grupo: string; nombre?: string }) => ({ id: l.id, grupo: l.grupo, nombre: l.nombre ?? l.id, visible: true, escalones: [] })),
      viajero_apagados: [],
      personas: [],
      interruptores: { logros: true, push: false, cobro: false },
    }
  }
  return undefined
}
