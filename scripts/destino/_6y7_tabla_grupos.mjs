// Escribe la tabla «parada → grupo» (para el informe de la 6y7) a partir de roma.json. node scripts/destino/_6y7_tabla_grupos.mjs > tabla.md
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const LISTA = D.grupos_dia.lista
const filas = (nombre) => {
  const sitios = [
    ...D.places.map((p) => ({ nombre: p.name, grupo: p.grupo_dia, zona: p.zone, tipo: 'sitio' })),
    ...D.night_experiences.map((n) => ({ nombre: n.name, grupo: n.grupo_dia, zona: n.zone, tipo: 'nocturna' })),
    ...D.zone_walks.map((w) => ({ nombre: w.name, grupo: w.grupo_dia, zona: w.zone, tipo: 'paseo por barrio' })),
    ...Object.entries(D.destination_config.paseo_libre.zonas).map(([clave, z]) => ({ nombre: `Pasea y piérdete por ${z.nombre}`, grupo: z.grupo_dia, zona: clave, tipo: 'paseo libre' })),
  ]
  return sitios.filter((s) => s.grupo === nombre)
}
const salida = []
for (const grupo of LISTA) {
  const f = filas(grupo)
  salida.push(`### ${grupo} (${f.length})`, '', '| Parada | Qué es | Zona de nuestros datos |', '|---|---|---|', ...f.map((s) => `| ${s.nombre} | ${s.tipo} | ${s.zona} |`), '')
}
console.log(salida.join('\n'))
