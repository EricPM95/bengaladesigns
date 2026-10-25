// Busca en el catálogo de la API (sandbox) las cinco excursiones de Roma que no se resolvieron con el enlace: Pompeya y Sorrento, Nápoles y Pompeya en tren,
// Costa Amalfitana, Florencia en tren y Tívoli.  Tanda 10O.
//   node scripts/destino/civitatisBuscarCinco.mjs
// Lee CIVITATIS_API_USER / CIVITATIS_API_PASSWORD de .env.local EN MEMORIA (nunca los imprime). El sandbox solo responde de 7:00 a 2:00, hora de España.
// Dos vías: (1) el buscador por texto `POST /search` (varias formas de cuerpo, porque la documentación no lo deja claro); (2) las actividades de los destinos cercanos
// (Nápoles, Sorrento, Florencia, Pompeya, Amalfi, Tívoli…) filtradas por el título. Solo cuenta lo que ve; no cambia ningún fichero.
import { config } from 'dotenv'
import { crearClienteCivitatis } from '../../server/civitatis/cliente.js'

config({ path: '.env.local' })
const cliente = crearClienteCivitatis()
console.log(`Entorno: ${cliente.entorno} · claves puestas: ${cliente.tieneClaves ? 'sí' : 'NO'}`)
if (!cliente.tieneClaves) {
  console.log('Faltan CIVITATIS_API_USER y CIVITATIS_API_PASSWORD en .env.local.')
  process.exit(2)
}

const CINCO = [
  { id: 'pompeya_sorrento', texto: 'Pompeya Sorrento desde Roma', palabras: [/pompe/i, /sorrent/i] },
  { id: 'napoles_pompeya_tren', texto: 'Nápoles Pompeya tren desde Roma', palabras: [/n[aá]poles/i, /pompe/i, /tren/i] },
  { id: 'costa_amalfitana', texto: 'Costa Amalfitana desde Roma', palabras: [/amalf/i] },
  { id: 'florencia_tren', texto: 'Florencia tren alta velocidad desde Roma', palabras: [/florencia/i, /tren/i] },
  { id: 'tivoli_villas', texto: 'Tívoli Villa d\'Este Villa Adriana desde Roma', palabras: [/t[ií]voli/i, /villa/i] },
]
const resumen = (a) => `${a.id} · ${a.title ?? a.name ?? '?'}${a.destinationName ? ` · ${a.destinationName}` : ''}`
const lista = (d) => (Array.isArray(d) ? d : Array.isArray(d?.activities) ? d.activities : Array.isArray(d?.results) ? d.results : Array.isArray(d?.data) ? d.data : [])

// Comprobación de horario/respuesta.
const destinos = await cliente.pedir('/destinations', { consulta: { lang: 'es' } })
if (!destinos.ok) {
  console.log(`La API no responde (${destinos.motivo}${destinos.estado ? ` ${destinos.estado}` : ''}). ¿Fuera del horario del sandbox (7:00–2:00 de España)? No se puede buscar ahora.`)
  process.exit(3)
}
const todos = Array.isArray(destinos.datos) ? destinos.datos : []
console.log(`Destinos en el sandbox: ${todos.length}`)

// Vía 1: POST /search con varias formas de cuerpo.
const formas = (t) => [{ text: t }, { query: t }, { search: t }, { q: t }, { keyword: t }]
for (const c of CINCO) {
  let hallado = null
  let intentos = []
  for (const cuerpo of formas(c.texto)) {
    const r = await cliente.pedir('/search', { metodo: 'POST', consulta: { lang: 'es', currency: 'EUR' }, cuerpo })
    intentos.push(`${Object.keys(cuerpo)[0]}:${r.ok ? 'ok' : r.motivo}${r.estado ? `(${r.estado})` : ''}`)
    if (r.ok) {
      const items = lista(r.datos)
      hallado = items.filter((a) => c.palabras.every((p) => p.test(String(a.title ?? a.name ?? ''))))
      if (items.length > 0) break
    }
  }
  console.log(`\n[${c.id}] /search → ${intentos.join(' ')}`)
  if (hallado?.length) for (const a of hallado.slice(0, 5)) console.log(`   · ${resumen(a)}`)
  else console.log('   (sin coincidencias en /search)')
}

// Vía 2: actividades de destinos cercanos filtradas por título.
const nombres = /(n[aá]poles|naples|sorrent|florencia|florence|pompe|amalf|t[ií]voli|salerno|positano|capri|pisa)/i
const cercanos = todos.filter((d) => d.hasActivities && nombres.test(String(d.name)))
console.log(`\nDestinos cercanos con actividades: ${cercanos.map((d) => `${d.name} (${d.id})`).join(', ') || 'ninguno'}`)
const vistas = new Map()
for (const d of cercanos) {
  for (let pagina = 1; pagina <= 5; pagina++) {
    const r = await cliente.pedir(`/destinations/${d.id}/activities`, { consulta: { lang: 'es', page: pagina, limit: 100, currency: 'EUR' } })
    if (!r.ok || !Array.isArray(r.datos) || r.datos.length === 0) break
    for (const a of r.datos) vistas.set(a.id, { ...a, destinationName: d.name })
    if (r.datos.length < 100) break
  }
}
console.log(`Actividades vistas en esos destinos: ${vistas.size}`)
for (const c of CINCO) {
  const coinciden = [...vistas.values()].filter((a) => c.palabras.every((p) => p.test(String(a.title ?? ''))) && /roma|rome/i.test(`${a.title} ${a.departure ?? ''} ${a.summary ?? ''}`))
  const sueltas = [...vistas.values()].filter((a) => c.palabras.every((p) => p.test(String(a.title ?? ''))))
  console.log(`\n[${c.id}] por título (desde Roma): ${coinciden.length} · por título (cualquiera): ${sueltas.length}`)
  for (const a of (coinciden.length ? coinciden : sueltas).slice(0, 5)) console.log(`   · ${resumen(a)}`)
}
