// Datos que caducan: el listado por destino para la revisión automática de cada 1 de diciembre (decisión del usuario,
// 2026-09-28). Es el mismo que scripts/destino/comprobado.mjs.
//   node scripts/comprobado.mjs            → todos los destinos
//   node scripts/comprobado.mjs roma
import { listadoComprobado } from './destino/comprobado.mjs'

listadoComprobado(process.argv[2] ?? null)
