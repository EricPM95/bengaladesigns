// Busca en el catálogo de la API (sandbox) las cinco excursiones de Roma y tres palabras sueltas, con el formato que dice Civitatis (V60):
//   POST /v2/search, `searchText` (3 letras mínimo), `lang`, `currency` y `destinationId` en el CUERPO JSON, palabras cortas, Authorization: Bearer.
//   Un 400 «Not Found» = sin resultados (lista vacía).
//   node scripts/destino/civitatisBuscarCinco.mjs
// Lee CIVITATIS_API_USER / CIVITATIS_API_PASSWORD de .env.local EN MEMORIA (nunca los imprime). El sandbox solo responde de 7:00 a 2:00, hora de España.
// Solo cuenta lo que ve; no cambia ningún fichero. 1 búsqueda por palabra (unas 12 peticiones en total, una vez al ejecutarlo).
import { config } from 'dotenv'
import { crearClienteCivitatis } from '../../server/civitatis/cliente.js'
import { crearServicioCivitatis } from '../../server/civitatis/servicio.js'

config({ path: '.env.local' })
const cliente = crearClienteCivitatis()
console.log(`Entorno: ${cliente.entorno} · claves puestas: ${cliente.tieneClaves ? 'sí' : 'NO'}`)
if (!cliente.tieneClaves) {
  console.log('Faltan CIVITATIS_API_USER y CIVITATIS_API_PASSWORD (no se pueden buscar).')
  process.exit(2)
}
const servicio = crearServicioCivitatis({ activa: true, cliente })

const ROMA = 19 // destinationId de Roma (excursiones desde Roma)
const CINCO = [
  { id: 'pompeya_sorrento', palabras: ['Pompeya', 'Sorrento'] },
  { id: 'napoles_pompeya_tren', palabras: ['Nápoles', 'Pompeya'] },
  { id: 'costa_amalfitana', palabras: ['Amalfitana', 'Amalfi'] },
  { id: 'florencia_tren', palabras: ['Florencia'] },
  { id: 'tivoli_villas', palabras: ['Tívoli'] },
]
const SUELTAS = ['Pompeya', 'Amalfi', 'Tívoli']

const comprobar = await cliente.pedir('/destinations', { consulta: { lang: 'es' } })
if (!comprobar.ok) {
  console.log(`La API no responde (${comprobar.motivo}${comprobar.estado ? ` ${comprobar.estado}` : ''}). ¿Fuera del horario del sandbox (7:00–2:00 de España)? No se puede buscar ahora.`)
  process.exit(3)
}

async function una(palabra, destinoId) {
  // (V70, V60-1d) La nota y las opiniones salen de la FICHA de cada actividad (GET /activities/{id}), no del listado.
  const r = await servicio.buscarConNota(palabra, destinoId, 3)
  const etiqueta = `«${palabra}»${destinoId != null ? ` (destinationId ${destinoId})` : ' (sin destino)'}`
  if (!r.ok) return console.log(`   ${etiqueta}: fallo ${r.motivo}${r.estado ? ` ${r.estado}` : ''}`)
  console.log(`   ${etiqueta}: ${r.datos.length} resultado(s)`)
  for (const a of r.datos.slice(0, 8)) console.log(`      · ${a.id} · ${a.titulo}${a.destino ? ` · ${a.destino}` : ''} · nota ${a.valoracion ?? '—'} · ${a.opiniones ?? '—'} opiniones`)
}

for (const c of CINCO) {
  console.log(`\n[${c.id}]`)
  for (const p of c.palabras) await una(p, ROMA)
}
console.log('\n[palabras sueltas]')
for (const p of SUELTAS) {
  await una(p, ROMA)
  await una(p, null)
}
