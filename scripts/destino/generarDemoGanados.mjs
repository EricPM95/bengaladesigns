// El viajero de ejemplo de «Mi vitrina» y «Todos mis logros» (8C2). Lo calcula el MOTOR de verdad (server/logros/motor.js) con unos Vistos y fotos inventados, y lo pasa por
// `construirGanados` (server/logros/pantallas/ganados.js): así el demo del móvil tiene LA FORMA REAL del servidor.
//   node scripts/destino/generarDemoGanados.mjs      → escribe src/lib/logrosDemo_ganados_datos.json
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { calcular, hechosQueCuentan } from '../../server/logros/motor.js'
import { construirGanados } from '../../server/logros/pantallas/ganados.js'

export function escenario({ completo = true, sitios: soloEstos = null } = {}) {
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma') }
  const roma = datos.destinos.roma
  const viajes = { t1: { id: 't1', destino: 'roma', inicio: '2026-10-10', fin: '2026-10-14', con_quien: 'pareja', dias: [] } }
  const dia = (n, h) => `2026-10-${String(10 + n).padStart(2, '0')}T${h}:00Z`
  const sitios = soloEstos ?? (completo ? [...new Set([...roma.colecciones.flatMap((c) => c.sitios)])] : [])
  const hechos = []
  let i = 0
  for (const s of sitios) {
    const n = i++
    hechos.push({ id: `v${n}`, tipo: 'visto', trip_id: 't1', destino: 'roma', sitio: s, stop_id: `s${n}`, instante: dia(n % 5, `${String(9 + (n % 8)).padStart(2, '0')}:00`), ubic: 'cerca', valido: true, recibido_en: dia(n % 5, '20:00') })
  }
  if (completo && !soloEstos) {
    for (const e of roma.emblemas.filter((x) => x.sitio).slice(0, 5)) {
      const n = i++
      hechos.push({ id: `f${n}`, tipo: 'foto', trip_id: 't1', destino: 'roma', sitio: e.sitio, stop_id: `s${n}`, instante: dia(n % 5, '12:00'), ubic: 'cerca', valido: true, recibido_en: dia(n % 5, '20:00') })
    }
  }
  const items = calcular({ datos, hechos, viajes, cuenta: { alta_cuenta: '2026-01-01T00:00:00Z', salida: '2026-09-01' }, ahora: '2026-10-20T10:00:00Z', pionero: { roma: 3 }, probador: null })
  const cuentan = hechosQueCuentan(hechos, viajes, datos)
  return { datos, catalogos, items, cuentan, viajes, hechos }
}

export function respuestaDelEscenario(opciones = {}) {
  const e = escenario(opciones)
  return construirGanados({ datos: e.datos, catalogos: e.catalogos, items: e.items, cuentan: e.cuentan, viajes: e.viajes, perfil: { vitrina: { baldas: {}, titulo: null } }, ahora: new Date('2026-10-20T10:00:00Z') })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const salida = { lleno: respuestaDelEscenario({ completo: true }), poco: respuestaDelEscenario({ completo: true, sitios: ['trastevere'] }), vacio: respuestaDelEscenario({ completo: false }) }
  fs.writeFileSync('src/lib/logrosDemo_ganados_datos.json', JSON.stringify(salida))
  console.log(Object.entries(salida).map(([k, v]) => `${k}: ${v.total} logros, ${v.items.length} items`).join(' · '))
}
