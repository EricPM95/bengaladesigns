import express from 'express'
import { config } from 'dotenv'
import { dinnerZones, servesDinner, servesLunch } from '../shared/routeEngine/dinnerZones.js'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import {
  findPipelineV2Data,
  findPipelineV2Key,
  hasFreeTourFromAnswers,
  buildSkeletonV2,
  buildDayPlacesV2,
  buildDayBlockV2,
  getDayConfig,
  excursionOptionsFor,
  topExcursions,
  curatedRoutePreview,
  buildExcursionDayV2,
  buildManualDayV2,
} from './routeAlgorithm.js'
import { halfDayExcursions } from './engine/excursions.js'
// Motor nuevo, detrás de bandera — ver server/engine/index.js y docs/PREPLAN_MOTOR.md.
import { buildDayBlockV3, engineFor } from './engine/index.js'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

// Fuente de verdad para la Fase 1 (generate-day-places) de los destinos ya curados a mano — ver
// DESTINATION_ALIASES/findDestinationData más abajo. fs.readFileSync (no un import JSON estático) a
// propósito: evita depender de la sintaxis de import attributes (soporte distinto según la versión
// exacta de Node del runtime serverless de Vercel) — vercel.json declara este archivo en
// "includeFiles" para garantizar que viaje en el bundle de la función.
let DESTINATIONS_DATA = {}
try {
  DESTINATIONS_DATA = JSON.parse(readFileSync(join(__dirname, '../data/destinations.json'), 'utf8'))
  console.log(`[curated-destinations] cargados ${Object.keys(DESTINATIONS_DATA).filter((k) => !['version', 'last_updated', 'notes'].includes(k)).length} destinos curados`)
} catch (error) {
  console.warn('[curated-destinations] no se pudo cargar data/destinations.json — la Fase 1 usará siempre IA para todos los destinos:', error.message)
}

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 8787
const MODEL = 'claude-sonnet-4-6'

// Token público de Mapbox (mismo que usa el cliente, ver .env.local) — seguro reutilizarlo aquí,
// solo para calcular tiempos reales a pie entre paradas del pipeline v2 (ver routeAlgorithm.js).
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN

// Mismas credenciales que el cliente (src/lib/supabaseClient.ts) — reutilizadas aquí SOLO para el
// caché global de tips_anclas (server/index.js:ANCHOR_TIPS_SYSTEM_PROMPT), una tabla sin datos de
// usuario que cualquier viajero puede leer/escribir vía este endpoint (ver database.sql para las
// políticas RLS) — no hace falta una service role key aparte para esto.
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — el caché de tips_anclas estará desactivado (cada tip de ancla se genera de nuevo, sin persistir).')
}
const supabaseAdmin = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// En local, la clave viene de .env.local (dotenv, arriba); en Vercel viene directamente de las
// Environment Variables del proyecto (sin archivo — dotenv.config() ahí simplemente no encuentra
// nada y no hace nada, no borra lo que Vercel ya haya puesto en process.env). Este log confirma en
// el arranque (frío o local) si la clave llegó, sin imprimir el valor real — compara los últimos 4
// caracteres con los de la clave que pegaste en el dashboard de Vercel si algo falla ahí.
// Todas las variables que necesita el servidor, no solo la de Anthropic: una que falte en Vercel
// degrada en SILENCIO (sin fotos de Unsplash, sin caché, sin tiempos a pie reales) y el síntoma
// aparece lejos de la causa. Este bloque lo deja escrito en los Runtime Logs del arranque en frío.
//
// Ojo con las VITE_*: en este proyecto las lee TAMBIÉN el servidor (Supabase y Mapbox), así que
// tienen que existir en Vercel aunque su prefijo sugiera que son solo del cliente.
const VARIABLES_SERVIDOR = [
  { nombre: 'ANTHROPIC_API_KEY', sinElla: 'los endpoints de IA devuelven error 500' },
  { nombre: 'UNSPLASH_ACCESS_KEY', sinElla: 'las fotos caen directamente a Wikipedia, sin pasar por Unsplash' },
  { nombre: 'VITE_SUPABASE_URL', sinElla: 'no hay caché compartida ni viajes guardados' },
  { nombre: 'VITE_SUPABASE_ANON_KEY', sinElla: 'no hay caché compartida ni viajes guardados' },
  { nombre: 'VITE_MAPBOX_TOKEN', sinElla: 'las rutas usan 15 min a pie por defecto en vez de tiempos reales' },
]

for (const { nombre, sinElla } of VARIABLES_SERVIDOR) {
  const valor = process.env[nombre]
  if (!valor) {
    console.warn(`Falta ${nombre} — ${sinElla}. Revisa .env.local en local, o Project Settings → Environment Variables en Vercel (marca "Production").`)
  } else {
    // Nunca el valor entero: los últimos 4 caracteres bastan para compararlo con el del dashboard.
    console.log(`${nombre} detectada (termina en …${valor.slice(-4)}, longitud ${valor.length}).`)
  }
}

const anthropic = new Anthropic()
const app = express()
app.use(express.json())

// ── FIX 7: log exhaustivo con timestamp de CADA llamada real a la API de Anthropic ──────────
//
// Objetivo: poder responder "¿cuántas llamadas reales dispara generar una ruta de Roma (pipeline
// v2) sin tocar ninguna parada individual, y desde qué endpoint Express exactamente?" sin tener que
// instrumentar cada uno de los ~15 puntos de llamada a mano (y sin arriesgarse a que alguno futuro
// se quede sin loguear). Envuelve el cliente UNA sola vez aquí — cualquier `anthropic.messages.*`
// que se llame desde cualquier endpoint queda cubierto automáticamente, con el nombre del endpoint
// Express (req.path) que lo disparó, gracias a AsyncLocalStorage (propaga correctamente a través de
// awaits/promesas, a diferencia de una variable global compartida).
const requestContext = new AsyncLocalStorage()
app.use((req, _res, next) => requestContext.run(req.path, next))

let apiCallCounter = 0
function currentEndpointLabel() {
  return requestContext.getStore() ?? '(fuera de una request — arranque/otro)'
}

const originalMessagesCreate = anthropic.messages.create.bind(anthropic.messages)
/**
 * OJO: esta función NO puede ser `async`, y el `return` tiene que ser la promesa TAL CUAL.
 *
 * `messages.create()` no devuelve una promesa normal, devuelve un `APIPromise` con métodos extra
 * (`.withResponse()`, `.asResponse()`). Envolverlo en una función `async` lo convierte en una
 * promesa corriente y esos métodos desaparecen — y `messages.stream()` llama por dentro a
 * `create(...).withResponse()`, así que TODAS las llamadas en streaming se caían con
 * "messages.create(...).withResponse is not a function". En pantalla: "No se pudo generar este
 * tramo del viaje con IA".
 *
 * El registro se engancha con un `.then` aparte, que observa sin ponerse en medio.
 */
anthropic.messages.create = (...args) => {
  const id = ++apiCallCounter
  const endpoint = currentEndpointLabel()
  const startedAt = new Date().toISOString()
  console.log(`[api-call #${id}] ${startedAt} INICIO create() — endpoint=${endpoint}`)
  const promise = originalMessagesCreate(...args)
  // Con los dos manejadores aquí, este ramal nunca queda como rechazo sin atender; el error sigue
  // viajando por la promesa que se devuelve, que es la que le importa a quien llamó.
  promise.then(
    () => console.log(`[api-call #${id}] ${new Date().toISOString()} FIN create() OK — endpoint=${endpoint}`),
    (error) => console.log(`[api-call #${id}] ${new Date().toISOString()} FIN create() ERROR — endpoint=${endpoint} — ${error?.message ?? error}`),
  )
  return promise
}

const originalMessagesStream = anthropic.messages.stream.bind(anthropic.messages)
anthropic.messages.stream = (...args) => {
  const id = ++apiCallCounter
  const endpoint = currentEndpointLabel()
  const startedAt = new Date().toISOString()
  console.log(`[api-call #${id}] ${startedAt} INICIO stream() — endpoint=${endpoint}`)
  const streamObj = originalMessagesStream(...args)
  streamObj.on('end', () => console.log(`[api-call #${id}] ${new Date().toISOString()} FIN stream() OK — endpoint=${endpoint}`))
  streamObj.on('error', (error) => console.log(`[api-call #${id}] ${new Date().toISOString()} FIN stream() ERROR — endpoint=${endpoint} — ${error?.message ?? error}`))
  return streamObj
}

function extractJsonText(text) {
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/i)
  return (fenced ? fenced[1] : text).trim()
}

/**
 * Log de errores de la API de Anthropic en una sola línea de texto PLANO (no un objeto anidado) —
 * el visor de logs de Vercel colapsa objetos anidados como `error: {…}` y no deja expandirlos desde
 * la vista rápida, así que pasarle el objeto Error entero a console.error (como se hacía antes) deja
 * el mensaje real inaccesible ahí. `error.message` en los errores de @anthropic-ai/sdk (clase
 * APIError, ver node_modules/@anthropic-ai/sdk/core/error.js → makeMessage) YA es un string plano
 * con el status y el cuerpo de error completo («400 {"type":"error","error":{"type":"invalid_request_error","message":"..."}}»),
 * así que basta con imprimir eso explícitamente para que sobreviva el colapso.
 */
function logAnthropicError(context, error) {
  const status = error?.status ?? 'sin status'
  const requestId = error?.requestID ?? 'sin request-id'
  console.error(`[Anthropic] ${context} — status=${status} requestId=${requestId} — ${error?.message ?? String(error)}`)
}

// Precios verificados para claude-sonnet-4-6 (MODEL, arriba) contra
// platform.claude.com/docs/en/about-claude/pricing el 2026-09-15 — si MODEL cambia de modelo,
// esta tabla hay que actualizarla a mano (no hay endpoint que la devuelva en runtime).
const SONNET_4_6_PRICING_PER_MTOK = {
  input: 3,
  output: 15,
  cacheWrite5m: 3.75,
  cacheWrite1h: 6,
  cacheRead: 0.3,
}
const WEB_SEARCH_PRICE_PER_1000 = 10

/**
 * Registra uso real y coste estimado de CADA llamada a Claude del pipeline — un endpoint no logueado
 * es dinero que se va sin que nadie lo vea. `endpoint` es solo una etiqueta para distinguir líneas en
 * los logs (Vercel → Runtime Logs en producción; terminal en local), no cambia nada del comportamiento
 * de la llamada. Nunca lanza ni bloquea la respuesta si `response.usage` faltara por lo que sea.
 */
function logCallCost(endpoint, response) {
  const usage = response?.usage
  if (!usage) return
  const inputTokens = usage.input_tokens ?? 0
  const outputTokens = usage.output_tokens ?? 0
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0
  const webSearches = usage.server_tool_use?.web_search_requests ?? 0

  const cost =
    (inputTokens / 1_000_000) * SONNET_4_6_PRICING_PER_MTOK.input +
    (outputTokens / 1_000_000) * SONNET_4_6_PRICING_PER_MTOK.output +
    (cacheWriteTokens / 1_000_000) * SONNET_4_6_PRICING_PER_MTOK.cacheWrite5m +
    (cacheReadTokens / 1_000_000) * SONNET_4_6_PRICING_PER_MTOK.cacheRead +
    (webSearches / 1000) * WEB_SEARCH_PRICE_PER_1000

  const parts = [`input=${inputTokens}tok`, `output=${outputTokens}tok`]
  if (cacheWriteTokens) parts.push(`cache_write=${cacheWriteTokens}tok`)
  if (cacheReadTokens) parts.push(`cache_read=${cacheReadTokens}tok`)
  if (webSearches) parts.push(`web_searches=${webSearches}`)
  console.log(`[cost] ${new Date().toISOString()} ${endpoint} — ${parts.join(' ')} — $${cost.toFixed(4)}`)
}

const DESTINATION_ARCHETYPES = new Set([
  'roadtrip_exclusivo',
  'base_y_excursiones',
  'urbano_clasico',
  'multidestino_tren_o_vuelo',
  'multidestino_mixto_o_circuito',
  'expedicion_o_crucero',
])

// ── PASO 1 — Clasificación automática del destino ──────────────────────────

function buildClassifyPrompt(destino) {
  return `Analiza el destino "${destino}" y devuelve SOLO un JSON, sin explicación ni markdown, con estos seis campos:

1. archetype — clasifícalo en exactamente uno de estos 6:

- roadtrip_exclusivo: el trayecto en carretera ES la experiencia — se conduce muchos km, el paisaje en movimiento es el atractivo, el alojamiento cambia cada noche. Ejemplos: Islandia (Ring Road), Dolomitas, Route 66, Ruta 40 Patagonia, Costa Amalfitana, Highlands escocesas (NC500), Garden Route Sudáfrica, Ruta de los Grandes Alpes.
- base_y_excursiones: el destino tiene varios puntos de interés cercanos entre sí, alcanzables con o sin vehículo (tour organizado, bus, coche de alquiler puntual); el vehículo mejora la experiencia pero NO es obligatorio. Ejemplos: Azores, Tenerife, Cerdeña, Creta, Madeira, Mallorca, Rioja, Valle del Loira.
- urbano_clasico: ciudades donde te mueves a pie y transporte público. Ejemplos: Roma, París, Tokyo, Barcelona, Nueva York, Londres, Berlín, Cancún, Cartagena de Indias.
- multidestino_tren_o_vuelo: varias ciudades conectadas por tren rápido o vuelos internos. Ejemplos: Japón con JR Pass, Interrail Europa, corredor NYC-DC-Boston.
- multidestino_mixto_o_circuito: combinación de transportes según la zona. Ejemplos: Tailandia, Vietnam, Perú, Colombia, Malasia.
- expedicion_o_crucero: logística gestionada por operador. Ejemplos: Antártida, safari Kenia, crucero fiordos, Galápagos.

2. is_region — true si el destino es una región, comarca, parque natural, isla o zona geográfica. false si es una ciudad o pueblo concreto.

3. ambiguous — true SOLO si el destino podría vivirse de forma igual de válida como roadtrip_exclusivo (recorrer en coche, cambiando de sitio cada noche) o como base_y_excursiones (quedarse en una zona visitando puntos cercanos desde una base), y no hay forma de decidirlo con seguridad sin preguntar al usuario. false en cualquier otro caso, incluido cuando estás razonablemente seguro de tu clasificación aunque el destino sea una región.

4. requiere_coche — SOLO relevante si archetype es urbano_clasico (en cualquier otro caso, false). true cuando un visitante no puede apoyarse en el transporte público para llegar por sí solo a los puntos de interés TURÍSTICOS típicos de la ciudad, aunque exista algo de transporte público en el centro — lo que importa es si conecta bien las zonas de interés dispersas por todo el área metropolitana que un visitante normal querría visitar, no solo si hay metro o bus en el núcleo urbano. Suele deberse a diseño urbano disperso de baja densidad (grandes distancias entre zonas de interés, sin cobertura ni frecuencia reales entre ellas) más que a ausencia total de transporte. Ejemplos de perfil (true): Los Ángeles, Phoenix, Miami, Orlando, Tampa y en general las ciudades del "Sun Belt" estadounidense de baja densidad, muchas ciudades australianas de tamaño medio — en todas ellas, ver más de un par de puntos de interés en el mismo viaje sin coche es poco realista. false en el resto — la inmensa mayoría de ciudades (Roma, París, Tokio, Nueva York, Barcelona...), incluidas ciudades con área metropolitana enorme pero cuyo transporte público sí conecta bien los puntos de interés entre sí.

5. pase_dominante — SOLO relevante si archetype es multidestino_tren_o_vuelo (en cualquier otro caso, null). Nombre del pase de transporte que la mayoría de turistas usa para moverse por este destino, SI existe uno claramente dominante (ej. "JR Pass" para Japón, "Swiss Travel Pass" para Suiza, "Eurail/Interrail Global Pass" cuando el itinerario cruza varios países europeos). null si no hay ninguno lo bastante dominante como para asumirlo por defecto (ej. Corea del Sur, Taiwán, EE.UU. — ahí la norma real es comprar billete a billete).

6. vehiculo_altamente_recomendado — SOLO relevante si archetype es base_y_excursiones (en cualquier otro caso, false). true si el transporte público/organizado entre los puntos de interés de este destino es limitado (poca frecuencia, cobertura parcial, o tours muy encorsetados) y un vehículo propio mejora sustancialmente la experiencia (ej. Tenerife, São Miguel/Azores, Cerdeña rural). false si el destino se cubre bien sin vehículo (tours organizados frecuentes, transporte público o transfers ya cubren de sobra los puntos de interés típicos, ej. Mallorca con base en Palma, Creta con excursiones organizadas desde un resort).

Cuando ambiguous = true, aun así devuelve tu mejor estimación de archetype (la app la ignorará y preguntará al usuario, pero necesita un valor por si acaso).

Responde SOLO: {"archetype": "xxx", "is_region": true/false, "ambiguous": true/false, "requiere_coche": true/false, "pase_dominante": "nombre del pase" o null, "vehiculo_altamente_recomendado": true/false}`
}

app.post('/api/classify-destination', async (req, res) => {
  const { destination } = req.body ?? {}

  if (!destination) {
    res.status(400).json({ error: 'Se requiere destination.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 120,
      system:
        'Responde EXCLUSIVAMENTE con JSON válido, sin explicación ni texto adicional ni markdown. ' +
        'El JSON debe tener exactamente seis campos: archetype (string, uno de los 6 ids solicitados, en minúsculas con guiones bajos), is_region (booleano), ambiguous (booleano), requiere_coche (booleano), pase_dominante (string o null) y vehiculo_altamente_recomendado (booleano).',
      messages: [{ role: 'user', content: buildClassifyPrompt(destination) }],
    })
    logCallCost('classify-destination', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const archetype = String(parsed?.archetype ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, '')
    if (!DESTINATION_ARCHETYPES.has(archetype)) throw new Error(`Arquetipo no reconocido: "${parsed?.archetype}"`)
    if (typeof parsed?.is_region !== 'boolean') throw new Error('Respuesta de Claude sin campo "is_region" booleano')

    const paseDominanteRaw = typeof parsed?.pase_dominante === 'string' ? parsed.pase_dominante.trim() : ''

    res.json({
      archetype,
      is_region: parsed.is_region,
      ambiguous: Boolean(parsed?.ambiguous),
      requiere_coche: archetype === 'urbano_clasico' && Boolean(parsed?.requiere_coche),
      pase_dominante: archetype === 'multidestino_tren_o_vuelo' && paseDominanteRaw ? paseDominanteRaw.slice(0, 100) : null,
      vehiculo_altamente_recomendado: archetype === 'base_y_excursiones' && Boolean(parsed?.vehiculo_altamente_recomendado),
    })
  } catch (error) {
    logAnthropicError('classify-destination', error)
    res.status(502).json({ error: 'No se pudo clasificar el destino con IA.' })
  }
})

// ── "Elige tus experiencias" — banco fijo de 18, Claude filtra 4-8 relevantes por destino ──
//
// Se dispara en segundo plano al elegir destino (suggestExperiencesInBackground), en paralelo a
// classify-destination — no depende del arquetipo, solo del nombre del destino. Mismo principio
// que el resto de la app: Claude solo elige DE una lista fija por id, nunca inventa texto ni
// decide qué se muestra — el icono/título de cada experiencia vive en el frontend
// (src/lib/experienceBank.ts), aquí solo se listan para que Claude sepa qué representa cada id.

const EXPERIENCE_BANK = [
  { id: 'atracciones', title: 'Atracciones', hint: 'monumentos, museos, edificios y lugares emblemáticos dentro de centros históricos/urbanos' },
  { id: 'arte_cultura', title: 'Arte y Cultura' },
  { id: 'paseos_encanto', title: 'Paseos con Encanto' },
  {
    id: 'trekking_outdoor',
    title: 'Trekking & Outdoor',
    hint: 'la actividad en sí: rutas de senderismo organizadas, trekkings por glaciares, rutas de montaña — implica recorrer un camino con esfuerzo físico',
  },
  { id: 'playas_calas', title: 'Arena y Sal' },
  { id: 'paseos_barco', title: 'Paseos en Barco' },
  { id: 'gastronomia', title: 'Gastronomía' },
  { id: 'bienestar', title: 'Bienestar' },
  { id: 'nieve', title: 'Nieve' },
  {
    id: 'paisajes_miradores',
    title: 'Paisajes y Miradores',
    hint: 'puntos concretos a los que se va específicamente por la vista: atardeceres, panorámicas, miradores',
  },
  { id: 'compras', title: 'Compras' },
  { id: 'ocio', title: 'Ocio' },
  { id: 'fenomenos_naturales', title: 'Fenómenos Naturales' },
  { id: 'parques', title: 'Parques' },
  { id: 'resorts', title: 'Resorts' },
  { id: 'turismo_rural', title: 'Turismo Rural' },
  {
    id: 'naturaleza',
    title: 'Naturaleza',
    hint: 'lugares naturales como destino en sí (un lago, un río, una zona de montaña), sin que implique necesariamente una ruta de senderismo',
  },
  { id: 'joyas_ocultas', title: 'Joyas Ocultas' },
]

const EXPERIENCE_IDS = new Set(EXPERIENCE_BANK.map((entry) => entry.id))

function buildSuggestExperiencesPrompt(destino) {
  const bankLines = EXPERIENCE_BANK.map((entry) => `- ${entry.id}: ${entry.title}${entry.hint ? ` — ${entry.hint}` : ''}`).join('\n')
  return `Analiza el destino "${destino}" y elige, de este banco FIJO de 18 experiencias, entre 4 y 8 que sean altamente contextualizadas y afines a ESE destino concreto — nunca genéricas ni intercambiables con cualquier otro destino (ej: termas naturales en Islandia, baños turcos en Estambul — no simplemente "bienestar" sin más contexto detrás de la elección).

Banco de experiencias (usa EXACTAMENTE estos ids, nunca inventes otros ni cambies el texto):
${bankLines}

Responde SOLO este JSON, sin texto ni markdown:
{"experience_ids": ["id1", "id2", "..."]}`
}

function sanitizeExperienceIds(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const result = []
  for (const id of raw) {
    if (typeof id !== 'string' || !EXPERIENCE_IDS.has(id) || seen.has(id)) continue
    seen.add(id)
    result.push(id)
    if (result.length >= 8) break
  }
  return result
}

app.post('/api/suggest-experiences', async (req, res) => {
  const { destination } = req.body ?? {}

  if (!destination) {
    res.status(400).json({ error: 'Se requiere destination.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        'Responde EXCLUSIVAMENTE con JSON válido, sin explicación ni texto adicional ni markdown. ' +
        'El JSON debe tener exactamente un campo: experience_ids (array de 4 a 8 strings, cada uno un id EXACTO del banco proporcionado, nunca inventado).',
      messages: [{ role: 'user', content: buildSuggestExperiencesPrompt(destination) }],
    })
    logCallCost('suggest-experiences', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    res.json({ experience_ids: sanitizeExperienceIds(parsed?.experience_ids) })
  } catch (error) {
    logAnthropicError('suggest-experiences', error)
    res.status(502).json({ error: 'No se pudieron sugerir experiencias con IA.' })
  }
})

// ── Ficha de una parada (StopDetailSheet, pestaña "Resumen") — descripción/qué vas a ver/por qué
// recomendado + dirección/web oficial de UN lugar concreto, generados por Claude bajo demanda al
// abrir la ficha (no en el pipeline de generación de la ruta). Los tickets/tours de esa misma
// pantalla siguen siendo mock (ver mockStopTickets.ts) — solo el contenido editorial es real aquí.

const DESCRIBE_STOP_SYSTEM_PROMPT = `You are an expert local travel guide. Someone is looking at the detail card for ONE specific place inside a trip you already helped plan. Write genuinely useful, specific content — never generic filler that could apply to any place. Write every text field in SPANISH (the traveler's language), regardless of what language your own knowledge of the place is in.

TIPS — up to 3 tips of genuinely high practical value, only from your own knowledge (no web search). For each one that genuinely applies, cover:
1. Combined tickets: does this place's entry also cover another nearby place (e.g. "La entrada incluye también el Foro Romano y el Palatino, puedes usarla 24h antes o después")?
2. Partial free access: is part of it free and part paid (e.g. "El acceso a la basílica es gratuito, pero subir a la cúpula tiene coste")?
3. Strategic timing or a practical logistics detail that saves time or money: best time to avoid crowds, typical wait without booking ahead, a reservation quirk, a genuinely surprising local detail.
Only include a tip you're genuinely confident about — an empty array is better than a generic or made-up one. Never write filler like "lleva calzado cómodo" or "haz fotos".

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "description": "2-3 sentences: what this place is, historical/general context.",
  "what_youll_see": "2-3 sentences: the concrete experience INSIDE this specific place — what you'll actually walk through, see or do there.",
  "why_recommended": "1-2 sentences: why this specific place is worth including in a trip to this city.",
  "address": "Real, specific street address as 'Street, City' — or null if you don't genuinely know it.",
  "official_website": "Real official website URL (just the domain or full URL) if this place has one — or null if it doesn't have one or you're not confident.",
  "hours_detail": "Only when opening hours genuinely have seasonal/weekday nuance worth knowing (e.g. 'Lunes a sábado: 8:00–20:00 (última entrada 18:00). Último domingo del mes: 9:00–14:00 (última entrada 12:30)') — null if you don't have specific nuance beyond a simple range, never invent precision you don't have.",
  "tips": [
    { "tipo": "practico", "texto": "One tip following the TIPS guidance above" }
  ]
}
"tipo" is "practico" for combined-tickets/free-access/logistics tips, "secreto" for a genuinely surprising lesser-known angle. Return between 0 and 3 tips.`

function sanitizeStopDescription(parsed) {
  const text = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : '')
  const tips = Array.isArray(parsed?.tips)
    ? parsed.tips
        .filter((tip) => tip && typeof tip.texto === 'string' && tip.texto.trim())
        .slice(0, 3)
        .map((tip) => ({ tipo: tip.tipo === 'secreto' ? 'secreto' : 'practico', texto: tip.texto.trim().slice(0, 400) }))
    : []
  return {
    description: text(parsed?.description, 500),
    what_youll_see: text(parsed?.what_youll_see, 500),
    why_recommended: text(parsed?.why_recommended, 300),
    address: text(parsed?.address, 200) || null,
    official_website: text(parsed?.official_website, 200) || null,
    hours_detail: text(parsed?.hours_detail, 400) || null,
    tips,
  }
}

app.post('/api/describe-stop', async (req, res) => {
  const { name, city, category } = req.body ?? {}
  if (!name || !city) {
    res.status(400).json({ error: 'Se requiere name y city.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: DESCRIBE_STOP_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Place: "${name}"\nCity: "${city}"${category ? `\nCategory: "${category}"` : ''}`,
        },
      ],
    })
    logCallCost('describe-stop', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const result = sanitizeStopDescription(parsed)
    if (!result.description) throw new Error('Respuesta de Claude sin descripción válida')
    res.json(result)
  } catch (error) {
    logAnthropicError('describe-stop', error)
    res.status(502).json({ error: 'No se pudo generar la descripción con IA.' })
  }
})

// ── Ficha completa de un POI de "Añadir parada" (AddStopScreen.tsx) — caché PERMANENTE por
// lugar+destino en Supabase (place_content_cache), a diferencia de describe-stop de arriba (que
// nunca persiste, solo cache en memoria del cliente para esa sesión). El primer viajero que toca
// "Ver detalle" de un lugar paga la llamada a Claude; todos los siguientes (de cualquier ruta,
// cualquier usuario) la reciben gratis — efecto progresivo pedido en el feedback de calidad.
const POI_CONTENT_SYSTEM_PROMPT = `Genera contenido turístico en español para un lugar concreto de un destino. Sé específico y genuinamente útil — nunca relleno genérico que podría aplicar a cualquier sitio.

TIPS — 1-3 tips de alto valor práctico, solo los que genuinamente apliquen: entradas combinadas con otro lugar cercano, acceso gratuito parcial, mejor hora para evitar masas, trucos reales que ahorren tiempo o dinero. Nunca "lleva calzado cómodo" ni relleno similar — si no tienes nada genuinamente bueno, deja el array vacío.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "summary": "2-3 frases: qué es, contexto real, por qué visitarlo",
  "tips": ["1-3 tips siguiendo la guía de arriba, o array vacío"],
  "hours_detail": "Horario detallado con matices de temporada/día si los hay, en español — null si es acceso libre 24h o no hay matices que añadir",
  "hours_short": "Formato 'HH:MM–HH:MM' para la cabecera — null si es de acceso libre",
  "category": "Categoría específica en español (ej. 'Anfiteatro histórico'), nunca genérica como 'Punto de interés'",
  "visit_duration_min": 60,
  "is_free_access": false,
  "official_url": "URL de la web oficial si existe y la conoces con confianza, o null"
}`

function sanitizePoiContent(parsed) {
  const text = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : '')
  const tips = Array.isArray(parsed?.tips)
    ? parsed.tips
        .filter((tip) => typeof tip === 'string' && tip.trim())
        .slice(0, 3)
        .map((tip) => tip.trim().slice(0, 400))
    : []
  const visitDurationMin = Number(parsed?.visit_duration_min)
  return {
    summary: text(parsed?.summary, 500),
    tips,
    hours_detail: text(parsed?.hours_detail, 400) || null,
    hours_short: text(parsed?.hours_short, 40) || null,
    category: text(parsed?.category, 80) || 'Punto de interés',
    visit_duration_min: Number.isFinite(visitDurationMin) && visitDurationMin > 0 ? Math.round(visitDurationMin) : 60,
    is_free_access: Boolean(parsed?.is_free_access),
    official_url: text(parsed?.official_url, 200) || null,
  }
}

app.post('/api/poi-content', async (req, res) => {
  const { place_name: placeName, destination, mapbox_id: mapboxId } = req.body ?? {}
  if (!placeName || !destination) {
    res.status(400).json({ error: 'Se requiere place_name y destination.' })
    return
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('place_content_cache')
        .select('id, place_data, hit_count')
        .eq('place_name', placeName)
        .eq('destination', destination)
        .maybeSingle()
      if (error) throw error
      if (data) {
        // Fire-and-forget — un fallo bumpeando el contador nunca debe retrasar la respuesta al viajero.
        supabaseAdmin
          .from('place_content_cache')
          .update({ hit_count: (data.hit_count ?? 1) + 1, last_used_at: new Date().toISOString() })
          .eq('id', data.id)
          .then(({ error: touchError }) => {
            if (touchError) logAnthropicError('poi-content (touch)', touchError)
          })
        res.json({ content: data.place_data, cached: true })
        return
      }
    } catch (error) {
      // Fallo leyendo el caché no debe bloquear — sigue como si no hubiera caché (cache miss).
      logAnthropicError('poi-content (read cache)', error)
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: POI_CONTENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Lugar: "${placeName}"\nDestino: "${destination}"` }],
    })
    logCallCost('poi-content', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const content = sanitizePoiContent(parsed)
    if (!content.summary) throw new Error('Respuesta de Claude sin resumen válido')

    if (supabaseAdmin) {
      try {
        // El cliente de Supabase NO lanza en un error de Postgrest — hay que comprobar `error`
        // explícitamente (mismo bug ya encontrado y arreglado en route-cache/save).
        const { error: insertError } = await supabaseAdmin
          .from('place_content_cache')
          .insert({ place_name: placeName, destination, mapbox_id: mapboxId ?? null, place_data: content })
        if (insertError) throw insertError
      } catch (error) {
        // El contenido ya se generó y se puede devolver igual — un fallo guardándolo en caché solo
        // significa que la próxima vez se vuelve a generar, no es motivo para dar error al viajero.
        logAnthropicError('poi-content (write cache)', error)
      }
    }

    res.json({ content, cached: false })
  } catch (error) {
    logAnthropicError('poi-content', error)
    res.status(502).json({ error: 'No se pudo generar el contenido del lugar con IA.' })
  }
})

// ── Tips de ANCLAS (StopDetailSheet, pestaña "Tips") — SOLO para anclas (Route.anchorNames, la
// lista completa de lugares elegida en /api/generate-day-places, Fase 1 del pipeline), nunca para paradas normales del
// pool (esas usan `local_tip` de /api/describe-stop de arriba, sin caché ni búsqueda web). Una
// ancla es lo bastante genérica (Coliseo Romano, Torre Eiffel...) para que MUCHOS viajeros distintos
// generen una ruta con ella — cachear en Supabase (tabla `tips_anclas`, ver database.sql) hace que
// el coste de la búsqueda web + Claude se pague UNA sola vez por lugar, nunca por usuario.
const ANCHOR_TIPS_SYSTEM_PROMPT = `You are an expert local travel guide with web search access. Someone is planning a visit to ONE specific, well-known place. Use web search to find the most current, specific tips you can — real access points, real ways to skip lines, real lesser-known viewpoints, real combined-ticket deals. Do not rely only on your training knowledge for logistics that change over time (opening hours, specific entrances, transit lines, ticket bundles).

Find up to 3 tips, prioritizing whichever of these genuinely apply and are verifiable via web search — skip any that don't apply rather than forcing one:
1. Combined ticket: does the entry to this place also cover another nearby site, and within what time window (e.g. "La entrada incluye también el Foro Romano y el Palatino, puedes usarla 24h antes o después")?
2. Partial free access: is part of the place free and part paid (e.g. "El acceso a la basílica es gratuito, pero subir a la cúpula tiene coste")?
3. Strategic timing: the best verified time to go to avoid crowds, specific to this place (not generic "go early").
4. A genuinely surprising SECRET/WOW angle: a lesser-known free viewpoint, an alternative access with fewer people, a specific photo angle locals use — meant to impress, not just inform.
5. A practical logistics detail: real wait times without booking, a reservation quirk, something that saves real time or money.

Write every tip in SPANISH (the traveler's language) — translate/rewrite in Spanish even if the web sources you found were in another language, never quote or leave them in the source language. Never write filler like "lleva calzado cómodo" — every tip must carry real, specific, verifiable value.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "tips": [
    { "tipo": "practico", "texto": "1-2 sentences, in Spanish" }
  ]
}
"tipo" is "practico" for combined-ticket/free-access/timing/logistics tips (1-5 above except the wow angle), "secreto" for the surprising wow angle. Return between 0 and 3 tips — only what you can genuinely verify, never pad to fill the quota.`

// Mismo endpoint/tabla/caché que ANCHOR_TIPS_SYSTEM_PROMPT (una fila más en tips_anclas, esta vez
// con `lugar` = nombre del aeropuerto/estación de llegada en vez de un lugar turístico) — el
// contenido que hace falta aquí es distinto (gotchas de billetes/logística de llegada, no "cómo
// saltarte la cola de un monumento"), así que usa su propio prompt, ver ArrivalDetailSheet.tsx.
const AIRPORT_TIPS_SYSTEM_PROMPT = `You are an expert local travel guide with web search access. Someone is about to arrive at ONE specific airport/train station and travel from there into the city. Use web search to find the most current, specific tips you can about this exact arrival point — real ticketing gotchas, real logistics quirks. Do not rely only on your training knowledge for details that change over time.

Find up to 3 tips:
1-2. PRACTICAL tips: genuinely useful logistics details about arriving here — e.g. a ticket that does NOT cover the next connection and must be bought separately, a validation machine that's easy to miss, a luggage quirk, a real gotcha that catches visitors out.
3. A SECRET/WOW tip: something most visitors arriving here don't know — a shortcut, a lesser-known exit/platform, a free amenity, a real little-known fact about this specific arrival point.

Write every tip in SPANISH (the traveler's language) — translate/rewrite in Spanish even if the web sources you found were in another language.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "tips": [
    { "tipo": "practico", "texto": "1-2 sentences, in Spanish" }
  ]
}
"tipo" is "practico" for logistics gotchas, "secreto" for the wow angle. Return between 0 and 3 tips — only what you can genuinely verify.`

function sanitizeAnchorTips(parsed) {
  if (!Array.isArray(parsed?.tips)) return []
  return parsed.tips
    .filter((tip) => tip && typeof tip.texto === 'string' && tip.texto.trim())
    .slice(0, 3)
    .map((tip) => ({ tipo: tip.tipo === 'secreto' ? 'secreto' : 'practico', texto: tip.texto.trim().slice(0, 500) }))
}

app.post('/api/anchor-tips', async (req, res) => {
  const { destino, lugar, kind } = req.body ?? {}
  if (!destino || !lugar) {
    res.status(400).json({ error: 'Se requiere destino y lugar.' })
    return
  }
  const systemPrompt = kind === 'airport' ? AIRPORT_TIPS_SYSTEM_PROMPT : ANCHOR_TIPS_SYSTEM_PROMPT

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('tips_anclas').select('tipo, texto').eq('destino', destino).eq('lugar', lugar)
      if (error) throw error
      if (data && data.length > 0) {
        res.json({ tips: data, cached: true })
        return
      }
    } catch (error) {
      // Fallo leyendo el caché no debe bloquear la generación — sigue como si no hubiera caché.
      logAnthropicError('anchor-tips (read cache)', error)
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      system: systemPrompt,
      messages: [{ role: 'user', content: `Place: "${lugar}"\nCity: "${destino}"` }],
    })
    logCallCost(`anchor-tips (${kind === 'airport' ? 'airport' : 'place'})`, response)

    // Con web_search, la respuesta puede traer texto intermedio (razonamiento) ANTES de que
    // vuelvan los resultados de la búsqueda — el JSON final siempre es el ÚLTIMO bloque de texto,
    // nunca el primero (a diferencia del resto de endpoints, que no usan herramientas).
    const textBlocks = response.content.filter((block) => block.type === 'text')
    const finalText = textBlocks[textBlocks.length - 1]?.text
    if (!finalText) throw new Error('Respuesta de Claude sin bloque de texto final')

    const parsed = JSON.parse(extractJsonText(finalText))
    const tips = sanitizeAnchorTips(parsed)

    if (tips.length > 0 && supabaseAdmin) {
      try {
        // El cliente de Supabase NO lanza en un error de Postgrest — hay que comprobar `error`
        // explícitamente (ver feedback_supabase_js_silent_insert.md).
        const { error: insertError } = await supabaseAdmin
          .from('tips_anclas')
          .insert(tips.map((tip) => ({ destino, lugar, tipo: tip.tipo, texto: tip.texto })))
        if (insertError) throw insertError
      } catch (error) {
        // El tip ya se generó y se puede devolver igual — un fallo guardándolo en caché solo
        // significa que la próxima vez se vuelve a generar, no es motivo para dar error al viajero.
        logAnthropicError('anchor-tips (write cache)', error)
      }
    }

    res.json({ tips, cached: false })
  } catch (error) {
    logAnthropicError('anchor-tips', error)
    res.status(502).json({ error: 'No se pudieron generar los tips con IA.' })
  }
})

// ── Transporte público cercano a UNA parada (StopDetailSheet, pestaña "Resumen") — a diferencia de
// tips_anclas (solo anclas), esto se cachea para CUALQUIER lugar de CUALQUIER ruta: es un hecho
// geográfico fijo (qué línea de metro/bus para cerca), no depende del viajero ni del arquetipo del
// viaje, así que compensa cachearlo siempre. Búsqueda web real a propósito — nunca inventar una
// línea/parada de memoria, ver NEARBY_TRANSIT_SYSTEM_PROMPT.
const NEARBY_TRANSIT_SYSTEM_PROMPT = `You are a meticulous local transit researcher with web search access. Someone wants to know the closest metro and bus stops to ONE specific place. Use web search to verify real, current, specific transit lines and stop names — NEVER invent or guess a line/stop name from general knowledge if you cannot verify it. If you cannot find reliable information for a category, return an empty array for it — an empty result is always better than a wrong or made-up one.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "metro": [{ "linea": "e.g. 'Línea B'", "parada": "e.g. 'Colosseo'" }],
  "bus": [{ "linea": "e.g. '75, 87, 118'", "parada": "e.g. 'Colosseo/Via Labicana'" }]
}
Both arrays may be empty. Only include entries you are confident are real and current. Write "linea" and "parada" in Spanish where they're not proper nouns (keep real line numbers/names as-is).`

function sanitizeTransitEntries(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry) => entry && typeof entry.parada === 'string' && entry.parada.trim())
    .slice(0, 6)
    .map((entry) => ({
      linea: typeof entry.linea === 'string' ? entry.linea.trim().slice(0, 100) : '',
      parada: entry.parada.trim().slice(0, 150),
    }))
}

app.post('/api/nearby-transit', async (req, res) => {
  const { destino, lugar } = req.body ?? {}
  if (!destino || !lugar) {
    res.status(400).json({ error: 'Se requiere destino y lugar.' })
    return
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('transporte_cercano').select('metro, bus').eq('destino', destino).eq('lugar', lugar).maybeSingle()
      if (error) throw error
      if (data) {
        res.json({ metro: data.metro ?? [], bus: data.bus ?? [], cached: true })
        return
      }
    } catch (error) {
      logAnthropicError('nearby-transit (read cache)', error)
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      system: NEARBY_TRANSIT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Place: "${lugar}"\nCity: "${destino}"` }],
    })
    logCallCost('nearby-transit', response)

    const textBlocks = response.content.filter((block) => block.type === 'text')
    const finalText = textBlocks[textBlocks.length - 1]?.text
    if (!finalText) throw new Error('Respuesta de Claude sin bloque de texto final')

    const parsed = JSON.parse(extractJsonText(finalText))
    const metro = sanitizeTransitEntries(parsed?.metro)
    const bus = sanitizeTransitEntries(parsed?.bus)

    if (supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin.from('transporte_cercano').insert({ destino, lugar, metro, bus })
        if (insertError) throw insertError
      } catch (error) {
        logAnthropicError('nearby-transit (write cache)', error)
      }
    }

    res.json({ metro, bus, cached: false })
  } catch (error) {
    logAnthropicError('nearby-transit', error)
    res.status(502).json({ error: 'No se pudo obtener el transporte cercano con IA.' })
  }
})

// ── "Nuestra selección" de restaurantes — acordeón dorado "Hora de comer"/"Hora de cenar" en DIAS,
// cuando el timeline de un día cruza la franja de comida o cena (ver DayDetailPanel.tsx) — mismo
// patrón que tips_anclas/transporte_cercano: hecho geográfico+temporal fijo (qué restaurantes
// recomendar en una zona a esa hora), independiente del viajero, cacheado UNA vez por zona+franja
// en Supabase (tabla zona_restaurantes) y reutilizado por cualquier ruta futura. Búsqueda web real a
// propósito — nunca fiarse solo de memoria entrenada para reputación/vigencia de un restaurante.
const ZONA_RESTAURANTES_SYSTEM_PROMPT = `You are an expert local food guide with web search access. Someone is in ONE specific neighborhood/zone of a destination, at lunch or dinner time, and wants 2-3 genuinely well-regarded restaurants within easy walking distance of that zone. Use web search to verify real, currently-operating restaurants with a real good reputation — do not rely only on training knowledge, and do not invent or guess a restaurant that might not exist or might have closed.

For each restaurant, write a SHORT, SPECIFIC reason it's recommended — something a local would actually say, never generic filler like "good Italian food" or "cozy atmosphere". Mention what makes it genuinely worth going to: a specific dish, a real reputation detail (e.g. "family-run trattoria known for the best carbonara in the area, not touristy"), a real local favorite status.

Assign a budget tier by your own judgment of the type of establishment (€ = casual/cheap, €€ = mid-range, €€€ = upscale) — never invent an exact live price, you cannot know that reliably.

Write everything in SPANISH (the traveler's language) — translate/rewrite in Spanish even if the web sources you found were in another language.

Also give the real approximate coordinates (latitude/longitude) of each restaurant, from your own knowledge or whatever address/location your web search turned up — used only to place a pin on a map, doesn't need survey-grade precision, but must be genuinely close to the real place (never a guess at the city center or a placeholder).

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "restaurantes": [
    { "nombre": "Real restaurant name", "motivo": "1 short specific sentence, in Spanish", "presupuesto": "€", "latitude": 00.0000, "longitude": 00.0000 }
  ]
}
Return between 2 and 3 restaurants. If you genuinely cannot verify any real, currently-operating restaurant in this zone, return an empty array — never invent one to fill the quota.`

function sanitizeCuratedRestaurants(parsed) {
  if (!Array.isArray(parsed?.restaurantes)) return []
  const validBudget = new Set(['€', '€€', '€€€'])
  return parsed.restaurantes
    .filter((entry) => entry && typeof entry.nombre === 'string' && entry.nombre.trim() && typeof entry.motivo === 'string' && entry.motivo.trim())
    .slice(0, 3)
    .map((entry) => {
      const nombre = entry.nombre.trim().slice(0, 120)
      const latitude = typeof entry.latitude === 'number' && Number.isFinite(entry.latitude) ? entry.latitude : null
      const longitude = typeof entry.longitude === 'number' && Number.isFinite(entry.longitude) ? entry.longitude : null
      return {
        nombre,
        motivo: entry.motivo.trim().slice(0, 300),
        presupuesto: validBudget.has(entry.presupuesto) ? entry.presupuesto : '€€',
        foto: `https://picsum.photos/seed/${encodeURIComponent(nombre)}/400/280`,
        // null si Claude no dio coordenadas válidas — el pin de ese restaurante simplemente se omite
        // del mapa (MealDetailSheet.tsx), nunca se inventa una posición aproximada.
        latitude,
        longitude,
      }
    })
}

/** Hasta dónde se va andando a comer o cenar desde donde acaba la parada (o el barrio de la cena). */
const CURATED_MEAL_MAX_WALK_MINUTES = 12
/** Lo que es sitio de comer o cenar; heladerías y cafés son un capricho, no la comida. */
const MEAL_SUB_CATEGORIES = { comida: ['trattoria', 'pizza', 'street_food', 'aperitivo'], cena: ['trattoria', 'pizza', 'aperitivo'] }
/** Una hora que tiene que caer dentro del horario del restaurante para servir esa comida. */
const MEAL_PROBE_MINUTES = { comida: 13 * 60 + 30, cena: 20 * 60 + 30 }

/**
 * Destinos curados: los restaurantes del JSON del destino (`restaurants`) que están a
 * CURATED_MEAL_MAX_WALK_MINUTES o menos andando, abiertos a esa hora, del más cercano al más lejano.
 * Para la cena se mide desde el barrio donde el motor ha puesto la cena (`meal_zones.<x>.cena`), no
 * desde la última parada. Vacío si el destino no tiene restaurantes curados cerca: entonces se
 * busca en la web como en cualquier destino.
 */
function curatedRestaurantsNear(destino, zona, franja, coordinates) {
  const data = findPipelineV2Data(destino)
  if (!Array.isArray(data?.restaurants) || data.restaurants.length === 0) return []
  const dinnerZone = franja === 'cena' ? dinnerZones(data).find((zone) => zone.label === zona) : null
  const center = dinnerZone ? { lat: dinnerZone.coordinates[0], lng: dinnerZone.coordinates[1] } : coordinates
  if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng) || (center.lat === 0 && center.lng === 0)) return []
  const usesMeal = data.restaurants.some((place) => place.meal)
  const walkMinutes = (place) => (haversineMeters(center, place.coordinates) * 1.32) / 83
  const opensAt = (hours, minutes) => {
    if (!hours) return true
    const ranges = [...String(hours).matchAll(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/g)].map((m) => [Number(m[1]) * 60 + Number(m[2]), (Number(m[3]) || 24) * 60 + Number(m[4])])
    return ranges.length === 0 || ranges.some(([open, close]) => open <= minutes && (close <= open ? close + 24 * 60 : close) >= minutes)
  }
  return data.restaurants
    // El campo `meal` del JSON manda (sin él, en un destino que lo usa, no es sitio de comer: cafés,
    // heladerías, aperitivo); en un destino que no lo usa, por tipo de sitio.
    .filter((place) => (usesMeal ? (franja === 'cena' ? servesDinner(place) : servesLunch(place)) : MEAL_SUB_CATEGORIES[franja].includes(place.sub_category)) && Number.isFinite(place.coordinates?.lat))
    .filter((place) => opensAt(place.hours, MEAL_PROBE_MINUTES[franja]))
    .map((place) => ({ place, minutes: walkMinutes(place) }))
    .filter((item) => item.minutes <= CURATED_MEAL_MAX_WALK_MINUTES)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 4)
    .map(({ place, minutes }) => ({
      nombre: place.name,
      motivo: [place.best_for, place.what_to_order ? `Pide: ${place.what_to_order}` : null, `A ${Math.max(1, Math.round(minutes))} min andando`].filter(Boolean).join(' · '),
      presupuesto: ['€', '€€', '€€€'].includes(place.price_range) ? place.price_range : '€€',
      foto: `https://picsum.photos/seed/${encodeURIComponent(place.name)}/400/280`,
      latitude: place.coordinates.lat,
      longitude: place.coordinates.lng,
    }))
}

function haversineMeters(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

app.post('/api/meal-recommendations', async (req, res) => {
  const { destino, zona, franja, coordinates } = req.body ?? {}
  if (!destino || !zona || (franja !== 'comida' && franja !== 'cena')) {
    res.status(400).json({ error: 'Se requiere destino, zona y franja ("comida" o "cena").' })
    return
  }

  // Destino curado con restaurantes cerca: los nuestros, sin búsqueda web (ni coste).
  let curated = []
  try {
    curated = curatedRestaurantsNear(destino, zona, franja, coordinates)
  } catch (error) {
    console.error('[meal-recommendations] restaurantes curados:', error)
  }
  if (curated.length > 0) {
    res.json({ seleccion: curated, curated: true })
    return
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('zona_restaurantes')
        .select('seleccion')
        .eq('destino', destino)
        .eq('zona', zona)
        .eq('franja', franja)
        .maybeSingle()
      if (error) throw error
      if (data) {
        res.json({ seleccion: data.seleccion ?? [], cached: true })
        return
      }
    } catch (error) {
      logAnthropicError('meal-recommendations (read cache)', error)
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      system: ZONA_RESTAURANTES_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Zone: "${zona}"\nDestination: "${destino}"\nMeal: ${franja === 'cena' ? 'dinner' : 'lunch'}` }],
    })
    logCallCost('meal-recommendations', response)

    const textBlocks = response.content.filter((block) => block.type === 'text')
    const finalText = textBlocks[textBlocks.length - 1]?.text
    if (!finalText) throw new Error('Respuesta de Claude sin bloque de texto final')

    const parsed = JSON.parse(extractJsonText(finalText))
    const seleccion = sanitizeCuratedRestaurants(parsed)

    if (supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin.from('zona_restaurantes').insert({ destino, zona, franja, seleccion })
        if (insertError) throw insertError
      } catch (error) {
        logAnthropicError('meal-recommendations (write cache)', error)
      }
    }

    res.json({ seleccion, cached: false })
  } catch (error) {
    logAnthropicError('meal-recommendations', error)
    res.status(502).json({ error: 'No se pudieron generar las recomendaciones con IA.' })
  }
})

// ── "Nombre de zona turístico" — BLOQUE C del feedback de calidad ──────────────────────────
//
// reverseGeocodeZone (mapboxReverseGeocode.ts) devuelve el barrio/rione ADMINISTRATIVO exacto de
// unas coordenadas (ej. en Roma: "Sant'Eustachio", "Ponte", "Pigna" — nombres que solo conocen los
// locales, nunca los turistas), y eso es justo lo que titulaba el acordeón dorado "Hora de comer en
// Sant'Eustachio". No hay forma mecánica de distinguir un rione turísticamente reconocible
// ("Trastevere", "Testaccio") de uno que no lo es ("Ponte", "Pigna") — ambos son el mismo tipo de
// feature de Mapbox al mismo nivel administrativo — así que hace falta juicio real sobre el
// destino, igual que el resto de "hechos fijos" de la app (tips_anclas, zona_restaurantes):
// cacheado UNA vez por destino+zona_bruta en Supabase y reutilizado por cualquier ruta futura.
const ZONA_TURISTICA_SYSTEM_PROMPT = `You help translate a raw administrative neighborhood name into whatever a TOURIST would actually recognize for that specific point, or decide that nothing recognizable applies.

You will be given a destination and one raw, specific neighborhood/locality name from geocoding data — often an official administrative subdivision that LOCALS use but tourists have never heard of (e.g. Rome's "rioni" like "Ponte", "Sant'Eustachio", "Regola", "Campo Marzio", "Pigna").

Your job: return the broader, well-known, tourist-recognizable area name that this specific point actually falls within — the kind of name that appears on tourist maps and in guidebooks (e.g. "Centro Histórico", "Trastevere", "Testaccio", "Barrio Judío", "El Born", "Montmartre"). This is very often DIFFERENT from the raw input — most raw administrative neighborhood names are NOT tourist-recognizable on their own, and most real destinations have only a handful of genuinely well-known tourist-area names.

- If the raw name itself IS already a well-known tourist area (e.g. "Trastevere", "Montmartre"), return it as-is.
- If it falls within a broader recognizable tourist area (e.g. Rome's "Ponte"/"Sant'Eustachio"/"Pigna"/"Parione" all fall within what tourists know as "Centro Histórico"), return that broader name.
- If genuinely NO recognizable tourist-area name applies to this point, return null — never force a stretch or invent one just to fill the field.

Respond ONLY in valid JSON (no markdown, no explanation):
{ "zona_turistica": "Recognizable name in Spanish, or null" }`

function buildZonaTuristicaPrompt(destino, zonaBruta) {
  return `Destino: "${destino}"\nNombre de zona en bruto (geocodificación administrativa): "${zonaBruta}"`
}

app.post('/api/zona-turistica', async (req, res) => {
  const { destino, zona_bruta: zonaBruta } = req.body ?? {}
  if (!destino || !zonaBruta) {
    res.status(400).json({ error: 'Se requiere destino y zona_bruta.' })
    return
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('zona_turistica')
        .select('zona_turistica')
        .eq('destino', destino)
        .eq('zona_bruta', zonaBruta)
        .maybeSingle()
      if (error) throw error
      if (data) {
        res.json({ zona_turistica: data.zona_turistica ?? null, cached: true })
        return
      }
    } catch (error) {
      logAnthropicError('zona-turistica (read cache)', error)
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: ZONA_TURISTICA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildZonaTuristicaPrompt(destino, zonaBruta) }],
    })
    logCallCost('zona-turistica', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const zonaTuristica = typeof parsed?.zona_turistica === 'string' && parsed.zona_turistica.trim() ? parsed.zona_turistica.trim().slice(0, 80) : null

    if (supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin.from('zona_turistica').insert({ destino, zona_bruta: zonaBruta, zona_turistica: zonaTuristica })
        if (insertError) throw insertError
      } catch (error) {
        logAnthropicError('zona-turistica (write cache)', error)
      }
    }

    res.json({ zona_turistica: zonaTuristica, cached: false })
  } catch (error) {
    logAnthropicError('zona-turistica', error)
    res.status(502).json({ error: 'No se pudo resolver el nombre de zona con IA.' })
  }
})

// ── "Elige lugares" — pantalla tras "Elige tus experiencias", lista AMPLIA de sitios reales ──
//
// A diferencia de suggest-experiences (categorías genéricas del banco de 18), esto pide sitios
// concretos con nombre propio para el destino — el usuario los marca y esos lugares entran en el
// pipeline de generación con prioridad casi obligatoria (ver must_include_places en /api/generate-day-places).
// Cada lugar se etiqueta con la categoría del banco de 18 a la que mejor encaja (para que el
// frontend pueda ordenar por afinidad a las experiencias ya elegidas) — Claude puede usar
// cualquiera de las 18, no solo las que el usuario ya seleccionó, para no perderse un sitio icónico
// que encaje en una categoría distinta.

function buildSuggestPlacesPrompt(destino, experienceIds) {
  const bankLines = EXPERIENCE_BANK.map((entry) => `- ${entry.id}: ${entry.title}${entry.hint ? ` — ${entry.hint}` : ''}`).join('\n')
  const focusTitles = experienceIds.map((id) => EXPERIENCE_BANK.find((entry) => entry.id === id)?.title ?? id).join(', ')
  return `Analiza el destino "${destino}" y devuelve una lista AMPLIA (entre 18 y 30) de lugares REALES y concretos que un viajero podría visitar — nombres propios de sitios (ej. "Coliseo", "Mercado de Testaccio", "Villa Borghese"), nunca categorías genéricas ni descripciones vagas.

El viajero ya eligió estas experiencias como las que más le interesan: ${focusTitles}. Prioriza cantidad y variedad de sitios afines a esas experiencias concretas, pero incluye también otros lugares icónicos o muy recomendables del destino aunque encajen en otra categoría — la lista debe sentirse completa, no limitada a esas categorías.

Para cada lugar, elige la categoría del banco fijo de 18 que mejor encaja (usa EXACTAMENTE un id de esta lista, nunca inventes otro):
${bankLines}

Marca "is_main_attraction": true SOLO para los imprescindibles objetivos de "${destino}" — los 3 a 6 sitios que casi cualquier viajero reconocería o que aparecen en cualquier guía como lo más importante del destino (ej. en Roma: Coliseo, Fontana di Trevi). false para el resto, aunque sean buenos lugares — esto no es una opinión de qué encaja con las experiencias elegidas, es un hecho objetivo sobre qué tan icónico/imprescindible es el sitio en sí.

Responde SOLO este JSON, sin texto ni markdown:
{
  "places": [
    {
      "name": "Nombre real del lugar",
      "description": "Una frase corta (máximo 20 palabras) que explique qué es o por qué merece la pena",
      "category": "id exacto del banco de 18",
      "is_main_attraction": false,
      "latitude": 00.0000,
      "longitude": 00.0000
    }
  ]
}`
}

/** Un solo lugar crudo del JSON de Claude → forma final, o null si no es válido/es un duplicado por nombre ya visto en `seenNames` (compartido entre llamadas para deduplicar across todo el streaming, no solo dentro de un batch). */
function sanitizePlaceEntry(entry, index, seenNames) {
  if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) return null
  const name = entry.name.trim().slice(0, 150)
  const key = name.toLowerCase()
  if (seenNames.has(key)) return null
  seenNames.add(key)
  const category = EXPERIENCE_IDS.has(entry.category) ? entry.category : 'joyas_ocultas'
  const latitude = typeof entry.latitude === 'number' ? entry.latitude : 0
  const longitude = typeof entry.longitude === 'number' ? entry.longitude : 0
  return {
    id: `place-${index}-${key.replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    name,
    description: typeof entry.description === 'string' ? entry.description.trim().slice(0, 200) : '',
    category,
    is_main_attraction: entry.is_main_attraction === true,
    latitude,
    longitude,
  }
}

/**
 * Extrae objetos COMPLETOS del array `places` a medida que el snapshot de texto de Claude va
 * creciendo (streaming) — sin esperar a que el JSON entero termine de generarse. Escanea carácter a
 * carácter llevando profundidad de `{}` (respetando strings/escapes, para no confundir una llave
 * dentro de una descripción con estructura real) SOLO dentro del array `"places": [...]`; cada vez
 * que la profundidad vuelve a 0 tras haber abierto un objeto, ese objeto ya está completo y se
 * puede parsear y emitir de inmediato. El estado de escaneo (posición, profundidad, si se está
 * dentro de un string) vive en el closure del propio parser para poder llamarlo repetidas veces
 * con el snapshot acumulado, retomando donde se quedó — nunca reprocesa desde el principio.
 */
function createIncrementalPlacesParser(onPlace) {
  let arrayStartIdx = -1
  let scanPos = 0
  let depth = 0
  let inString = false
  let escaped = false
  let objStart = -1
  let index = 0
  const seenNames = new Set()
  let stopped = false

  return function feed(snapshot) {
    if (stopped) return
    if (arrayStartIdx === -1) {
      const marker = snapshot.indexOf('"places"')
      if (marker === -1) return
      const bracket = snapshot.indexOf('[', marker)
      if (bracket === -1) return
      arrayStartIdx = bracket + 1
      scanPos = arrayStartIdx
    }

    for (; scanPos < snapshot.length; scanPos++) {
      const ch = snapshot[scanPos]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') {
        if (depth === 0) objStart = scanPos
        depth++
        continue
      }
      if (ch === '}') {
        depth--
        if (depth === 0 && objStart !== -1) {
          const raw = snapshot.slice(objStart, scanPos + 1)
          objStart = -1
          try {
            const entry = JSON.parse(raw)
            const sanitized = sanitizePlaceEntry(entry, index, seenNames)
            if (sanitized) {
              index++
              onPlace(sanitized)
              if (index >= 40) {
                stopped = true
                return
              }
            }
          } catch {
            // Objeto todavía incompleto o malformado en este punto del streaming — se ignora, no
            // debería pasar si el conteo de profundidad es correcto, pero es inofensivo si pasa.
          }
        }
        continue
      }
      if (ch === ']' && depth === 0) {
        stopped = true
        return
      }
    }
  }
}

app.post('/api/suggest-places', async (req, res) => {
  const { destination, experience_ids } = req.body ?? {}

  if (!destination) {
    res.status(400).json({ error: 'Se requiere destination.' })
    return
  }

  const experienceIds = Array.isArray(experience_ids) ? experience_ids.filter((id) => EXPERIENCE_IDS.has(id)) : []

  // Content-Type NDJSON se fija de forma perezosa, justo antes de la primera escritura — así, si
  // la llamada a Claude falla ANTES de que se complete ningún lugar (ej. clave inválida, timeout de
  // red), todavía se puede responder con el JSON de error clásico (res.status().json()) en vez de
  // un protocolo de streaming a medias que el cliente tendría que interpretar como fallo total de
  // todos modos. Una vez se ha escrito la primera línea, los fallos posteriores se comunican con una
  // línea final {"type":"error"} — la cabecera HTTP ya no se puede cambiar a esas alturas.
  let streamingStarted = false
  const t0 = Date.now()
  let emittedCount = 0

  const startStreamingIfNeeded = () => {
    if (streamingStarted) return
    streamingStarted = true
    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Cache-Control', 'no-cache')
  }

  const parser = createIncrementalPlacesParser((place) => {
    startStreamingIfNeeded()
    emittedCount++
    res.write(`${JSON.stringify({ type: 'place', place })}\n`)
  })

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system:
        'Responde EXCLUSIVAMENTE con JSON válido, sin explicación ni texto adicional ni markdown. ' +
        'El JSON debe tener exactamente un campo: places (array de 18 a 30 objetos con name, description, category y coordenadas reales).',
      messages: [{ role: 'user', content: buildSuggestPlacesPrompt(destination, experienceIds) }],
    })
    stream.on('text', (_delta, snapshot) => {
      try {
        parser(snapshot)
      } catch {
        // Un hipo puntual parseando un snapshot todavía a medias no debe tumbar el stream entero —
        // el siguiente `text` con más contenido normalmente ya resuelve solo.
      }
    })

    const response = await stream.finalMessage()
    logCallCost('suggest-places', response)
    // Pasada final por si el modelo cerró algún objeto justo en el último fragmento de texto y el
    // evento 'text' correspondiente no llegó a procesarse a tiempo (no debería faltar nada, pero es
    // gratis comprobarlo).
    const textBlock = response.content.find((block) => block.type === 'text')
    if (textBlock) parser(textBlock.text)

    console.log(`[timing] suggest-places (${destination}) — ${Date.now() - t0}ms — ${emittedCount} lugares emitidos`)

    if (emittedCount === 0) {
      if (streamingStarted) {
        res.write(`${JSON.stringify({ type: 'error' })}\n`)
        res.end()
      } else {
        res.status(502).json({ error: 'No se pudieron sugerir lugares con IA.' })
      }
      return
    }

    res.write(`${JSON.stringify({ type: 'done' })}\n`)
    res.end()
  } catch (error) {
    logAnthropicError('suggest-places', error)
    if (streamingStarted) {
      res.write(`${JSON.stringify({ type: 'error' })}\n`)
      res.end()
    } else {
      res.status(502).json({ error: 'No se pudieron sugerir lugares con IA.' })
    }
  }
})

// ── PASO 1B — Interpretar rutas/carreteras panorámicas sin geocodificación directa ──────────
//
// Solo se llama cuando el usuario usa "¿No encuentras tu destino?" Y el texto no coincide con
// la lista curada (ver src/lib/curatedRoutes.ts, que se comprueba primero en el frontend sin
// tocar este endpoint). Fallback para rutas conocidas pero no incluidas en la lista curada.

function buildInterpretRoutePrompt(query) {
  return `El usuario ha escrito esto en un buscador de destinos porque no lo encontró como ciudad o lugar normal: "${query}".

Evalúa si es una ruta, carretera panorámica o corredor de viaje conocido (ej: "Ruta 66", "Silk Road", "Overseas Highway"), no una ciudad o lugar puntual.

Responde SOLO este JSON, sin texto ni markdown:
{
  "reconocida": true/false,
  "nombre_oficial": "nombre oficial de la ruta, o vacío si no reconocida",
  "pais_region": "país o región donde está, o vacío si no reconocida",
  "punto_inicio": "ciudad de inicio típica, un nombre geocodable (ej. 'Chicago'), o vacío si no reconocida",
  "punto_fin": "ciudad de fin típica, un nombre geocodable (ej. 'Los Ángeles'), o vacío si no reconocida",
  "duracion_tipica_dias_min": number (0 si no reconocida),
  "duracion_tipica_dias_max": number (0 si no reconocida)
}

Sé estricto: si no reconoces la ruta con seguridad, o el texto describe otra cosa (una ciudad, un error tipográfico irreconocible, algo sin sentido), responde reconocida: false y deja el resto vacío — nunca inventes datos ni adivines por aproximación.`
}

app.post('/api/interpret-route', async (req, res) => {
  const { query } = req.body ?? {}

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Se requiere query.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        'Eres un experto en rutas de viaje por carretera reales de todo el mundo. Responde EXCLUSIVAMENTE con JSON válido, ' +
        'sin texto adicional ni markdown. Nunca inventes ni adivines una ruta que no reconozcas con total seguridad.',
      messages: [{ role: 'user', content: buildInterpretRoutePrompt(query) }],
    })
    logCallCost('interpret-route', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const nombreOficial = typeof parsed?.nombre_oficial === 'string' ? parsed.nombre_oficial.trim() : ''
    const puntoInicio = typeof parsed?.punto_inicio === 'string' ? parsed.punto_inicio.trim() : ''
    const puntoFin = typeof parsed?.punto_fin === 'string' ? parsed.punto_fin.trim() : ''
    const reconocida = Boolean(parsed?.reconocida) && Boolean(nombreOficial) && Boolean(puntoInicio) && Boolean(puntoFin)

    if (!reconocida) {
      res.json({ reconocida: false })
      return
    }

    res.json({
      reconocida: true,
      nombre_oficial: nombreOficial,
      pais_region: typeof parsed?.pais_region === 'string' ? parsed.pais_region.trim() : '',
      punto_inicio: puntoInicio,
      punto_fin: puntoFin,
      duracion_tipica_dias: [Number(parsed?.duracion_tipica_dias_min) || 0, Number(parsed?.duracion_tipica_dias_max) || 0],
    })
  } catch (error) {
    logAnthropicError('interpret-route', error)
    res.status(502).json({ error: 'No se pudo interpretar esta ruta con IA.' })
  }
})

// ── PASO 2 — Transporte de llegada: viabilidad geográfica universal ────────────────────────
//
// Una sola capa de "hechos" (Paso A), compartida por CUALQUIER arquetipo: si hay avión, ferry,
// tren, autobús o carretera factible entre origen y destino es una pregunta de geografía real,
// no de cómo se disfruta el destino una vez allí — así que se calcula siempre igual, sin saber
// nada de arquetipos. Claude solo evalúa cinco vías como candidatas INDEPENDIENTES y devuelve datos
// (duración/precio); el frontend decide qué subconjunto tiene sentido ofrecer para cada
// arquetipo (Paso B, ver src/lib/roadtripTransport.ts, baseExcursionesTransport.ts,
// urbanoTransport.ts) y construye las tarjetas. Antes esto vivía duplicado dentro de cada
// arquetipo (un prompt de geografía distinto por cada uno), lo que causaba que un arquetipo sin
// su propia lógica todavía escrita (ej. urbano_clasico) ni siquiera evaluara un ferry
// perfectamente real (ej. Tenerife → Las Palmas) — no porque no existiera, sino porque nadie
// había preguntado.

function sanitizeFeasibilityLeg(leg) {
  const asLabel = (value) => (typeof value === 'string' ? value.slice(0, 200) : '')
  const feasible = Boolean(leg?.feasible)
  return {
    feasible,
    // Nunca recomendada si no es viable, aunque Claude lo marque así por error.
    recommended: feasible && Boolean(leg?.recommended),
    duration_label: asLabel(leg?.duration_label),
    price_label: asLabel(leg?.price_label),
  }
}

function sanitizeTransportFeasibility(raw) {
  const flight = { ...sanitizeFeasibilityLeg(raw?.flight), via_label: typeof raw?.flight?.via_label === 'string' ? raw.flight.via_label.slice(0, 100) : '' }
  const ferry = {
    ...sanitizeFeasibilityLeg(raw?.ferry),
    route_label: typeof raw?.ferry?.route_label === 'string' ? raw.ferry.route_label.slice(0, 200) : '',
  }
  const train = {
    ...sanitizeFeasibilityLeg(raw?.train),
    station_label: typeof raw?.train?.station_label === 'string' ? raw.train.station_label.slice(0, 100) : '',
  }
  const bus = {
    ...sanitizeFeasibilityLeg(raw?.bus),
    station_label: typeof raw?.bus?.station_label === 'string' ? raw.bus.station_label.slice(0, 100) : '',
  }
  const roadtrip = {
    ...sanitizeFeasibilityLeg(raw?.roadtrip),
    highlight: typeof raw?.roadtrip?.highlight === 'string' ? raw.roadtrip.highlight.slice(0, 300) : '',
  }

  // Si Claude marca más de una vía como recomendada (viola el prompt), solo se conserva la
  // primera en orden fijo — el frontend asume que como mucho una tarjeta lleva la etiqueta.
  let recommendedAssigned = false
  for (const leg of [flight, ferry, train, bus, roadtrip]) {
    if (!leg.recommended) continue
    if (recommendedAssigned) leg.recommended = false
    else recommendedAssigned = true
  }

  return {
    flight,
    ferry,
    train,
    bus,
    roadtrip,
    // Por defecto true (permisivo) si Claude no devuelve el campo — solo se restringe cuando
    // dice explícitamente que no, nunca por un JSON incompleto o malformado.
    camper_access: {
      feasible: raw?.camper_access?.feasible !== false,
      reason: typeof raw?.camper_access?.reason === 'string' ? raw.camper_access.reason.slice(0, 300) : '',
    },
  }
}

function buildTransportFeasibilityPrompt(origin, destination) {
  return `Evalúa las formas REALES en que un viajero llegaría hoy desde ${origin.name} (lat ${origin.coordinates.lat}, lng ${origin.coordinates.lng}) hasta ${destination.name} (lat ${destination.coordinates.lat}, lng ${destination.coordinates.lng}).

Esto es un cálculo puro de geografía real — no sabe nada de qué tipo de viaje quiere hacer el viajero ni de cómo va a disfrutar el destino una vez allí, así que no asumas nada sobre eso. Evalúa estas cinco vías como CANDIDATAS INDEPENDIENTES, cada una con su propio "feasible" — puede haber varias viables a la vez, o ninguna:

1. AVIÓN: feasible = true si existe un aeropuerto razonablemente cercano al destino. No tiene por qué estar en el propio destino — puede ser una ciudad próxima (indícalo en via_label).
2. FERRY: feasible = true SOLO si tanto el origen como el destino tienen un puerto práctico para un viajero normal Y la travesía es corta y factible (no una ruta de mercancías, no 20h+).
3. TREN: feasible = true SOLO si es una opción que un viajero real usaría de verdad para este trayecto concreto — no solo porque exista técnicamente una conexión ferroviaria. Debe ser directo o con máximo 1 trasbordo, Y la duración total debe ser razonable frente a la alternativa de avión: hasta 6-7h cuando el avión ronda 1-2h; algo más de margen en trayectos donde el avión también implica bastante tiempo de trayecto al aeropuerto + facturación, como distancias medias dentro de un mismo país. Si el tren requiere varios trasbordos y/o supera claramente ese margen (ej. 11-13h con trasbordos para un trayecto donde el avión tarda ~2h, como Barcelona-Roma), feasible = false — nadie usa esa opción existiendo un vuelo directo mucho más rápido, aunque la conexión exista sobre el papel.
4. AUTOBÚS: feasible = true SOLO si es una opción que un viajero real usaría de verdad — directo o con máximo 1 trasbordo, y una duración total razonable frente a las alternativas. Más margen que el tren (hasta ~10-12h): quien elige bus suele priorizar precio sobre tiempo. Pero sigue habiendo límite — feasible = false si el trayecto en bus son 20-30h existiendo vuelo, por mucho que la ruta exista sobre el papel.
5. CARRETERA CON VEHÍCULO PROPIO: feasible = true SOLO si conducir desde el origen hasta el destino tarda menos de 12-16 horas en total Y la ruta por carretera es disfrutable (paisajes, costa, pueblos con encanto) Y no hay ninguna barrera marítima insalvable en el camino.

IMPORTANTE — esto es un hecho geográfico, no una preferencia de viaje: si existe una barrera marítima que obliga a tomar un ferry, por definición no puede existir a la vez un trayecto terrestre completo para el mismo tramo. Nunca marques ferry y carretera con vehículo propio como feasible=true al mismo tiempo para el mismo trayecto.

Además, evalúa por separado (es una característica del propio DESTINO, no depende del origen):

6. APTITUD DEL DESTINO PARA CAMPER/AUTOCARAVANA: camper_access.feasible = false si las carreteras del destino tienen curvas muy cerradas, pasos estrechos, restricciones locales de acceso conocidas para vehículos grandes, o en general no son aptas para circular con un vehículo grande con normalidad (ejemplo real: la SS163 de la Costa Amalfitana, con curvas cerradas y restricciones de acceso en varios tramos). camper_access.feasible = true en el caso general (ej. Islandia, Dolomitas, Highlands escocesas, Route 66), donde no hay ninguna restricción de este tipo.

Criterio para cada "feasible": ¿esto es lo que un viajero real haría para llegar a este destino concreto desde este origen concreto? No "¿es técnicamente posible?". Ante la duda entre marcar una vía como viable o no, marca que NO.

Por último, de entre las vías que marcaste feasible=true, marca "recommended": true en EXACTAMENTE UNA de ellas — la de mejor equilibrio entre duración, precio y comodidad para un viajero medio (no necesariamente la más barata ni la más rápida a cualquier coste). Todas las demás, incluidas las que tengan feasible=false, llevan "recommended": false. Si solo una vía es feasible=true, esa es la recomendada.

Responde SOLO este JSON, sin texto ni markdown:
{
  "flight": {
    "feasible": true/false,
    "recommended": true/false,
    "duration_label": "ej. '2h puerta a puerta'",
    "price_label": "ej. '40-150€'",
    "via_label": "ciudad o aeropuerto de referencia si no vuela directo al propio destino, ej. 'Verona'; vacío si vuela directo"
  },
  "ferry": {
    "feasible": true/false,
    "recommended": true/false,
    "duration_label": "ej. '6 horas de travesía'",
    "price_label": "ej. '80-150€ por persona'",
    "route_label": "ej. 'Barcelona - Palma'"
  },
  "train": {
    "feasible": true/false,
    "recommended": true/false,
    "duration_label": "ej. '3h hasta la estación más cercana'",
    "price_label": "ej. '30-80€'",
    "station_label": "estación o ciudad de llegada, ej. 'Ronda'"
  },
  "bus": {
    "feasible": true/false,
    "recommended": true/false,
    "duration_label": "ej. '7-8h de trayecto'",
    "price_label": "ej. '15-40€'",
    "station_label": "estación o ciudad de llegada, ej. 'Estación Sur'"
  },
  "roadtrip": {
    "feasible": true/false,
    "recommended": true/false,
    "duration_label": "ej. '9-10 horas de conducción'",
    "price_label": "ej. '60-100€ en gasolina y peajes'",
    "highlight": "si feasible=true, una frase corta sobre qué hace disfrutable la ruta (paisajes, costa, pueblos); si false, el motivo concreto (océano de por medio, 20h de conducción, etc.)"
  },
  "camper_access": {
    "feasible": true/false,
    "reason": "motivo corto SOLO si feasible=false (ej. 'carreteras estrechas con curvas cerradas y restricciones de acceso en varios tramos de la SS163'); vacío si feasible=true"
  }
}

Todas las duraciones son puerta a puerta y los precios son rangos realistas de mercado actual.`
}

app.post('/api/transport-feasibility', async (req, res) => {
  const { origin, destination } = req.body ?? {}

  if (!origin?.name || !destination?.name || !origin?.coordinates || !destination?.coordinates) {
    res.status(400).json({ error: 'Se requieren origin y destination con name y coordinates.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1100,
      system: 'Eres un asistente experto en logística de viajes reales. Responde EXCLUSIVAMENTE con JSON válido, sin texto adicional ni markdown.',
      messages: [{ role: 'user', content: buildTransportFeasibilityPrompt(origin, destination) }],
    })
    logCallCost('transport-feasibility', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    res.json(sanitizeTransportFeasibility(parsed))
  } catch (error) {
    logAnthropicError('transport-feasibility', error)
    res.status(502).json({ error: 'No se pudo calcular la viabilidad del trayecto con IA.' })
  }
})

// ── Generación de ruta ───────────────────────────────────────────────────────

// La generación de una ruta se hace ahora en varias llamadas encadenadas y pequeñas (anclas →
// esqueleto → bloques de 3-4 días) en vez de una única llamada gigante — ver
// [[project_route_planner_route_generation_pipeline]] en memoria. Cada llamada individual queda
// muy por debajo de cualquier límite de tiempo de función serverless, sin importar cuántos días
// tenga el viaje.

const SKELETON_SYSTEM_PROMPT = `You are an expert travel route planner. Your job right now is to design the SHAPE of the trip — which days belong to which city/zone and what kind of day each one is — NOT the individual places within each day (two LATER steps handle that, using exactly the shape you decide here: first a full place-selection pass, then a per-day content pass — so make this shape realistic and complete).

CRITICAL RULES:
- Structure it so every day you define is realistic to actually fill with content later (feasible transitions, sensible day counts per city/zone)
- MANDATORY for any trip of 4+ total days: exactly ONE day, somewhere between day 3 and day 5 (inclusive — never day 1, never the last day of the trip), MUST be type "excursion" — a real, popular day-trip destination reachable from where the traveler is staying (e.g. Rome → Pompeii/Naples, Barcelona → Montserrat, Paris → Versailles). For trips of 6+ total days, add a SECOND excursion day, reasonably spaced from the first (still never day 1 or the last day).
- The LAST day of the whole trip must be type "relax" — revisits, free time, no rush
- If the traveler goes by car between origin and destination, day 1 must be type "road" (the route starts from the origin with stops along the road)
- Consider the season/dates for weather/events when deciding zone order (e.g. avoid starting in the coldest region in winter if it can be avoided)

IMPORTANT — a separate call right after this one will choose the FULL list of places for every "city" day, seeing your entire shape at once (so it can guarantee no essential sight of the destination is missed and no two days cover the same ground). Your only job is to give it a shape it can work with:
- "zone_focus": a short, specific sub-area, neighborhood or theme for that day (e.g. "Centro storico y Coliseo" vs "Trastevere y orilla del Tíber" for two days in the same city) — two days in the same city MUST get a different zone_focus so their place lists don't end up overlapping
- "experience_focus": 1-3 category tags (from: temple, museum, nature, viewpoint, neighborhood, market, park, landmark, experience, beach) this day should lean into — vary these across days of the same city too

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "summary": "One emotional line about this route",
  "estimated_budget": {
    "accommodation_per_night": "€XX-€XX",
    "meals_per_day": "€XX-€XX",
    "total_estimate": "€XXX-€XXX"
  },
  "days": [
    {
      "day_number": 1,
      "type": "city|road|excursion|relax",
      "city": "City/zone the traveler is actually in this day — only differs from the overall destination for multi-city trips; for single-city destinations just repeat the destination name",
      "country_code": "ISO 3166-1 alpha-2 country code (lowercase, e.g. 'it', 'jp') of the country this day's city is in, always include it even for single-city destinations",
      "phase_type": "ONLY for multidestino_mixto_o_circuito archetype (omit entirely for any other archetype): 'urbana' | 'naturaleza' | 'isla' — which kind of phase this specific day belongs to, changing exactly on the days the itinerary moves to a new phase",
      "zone_focus": "Short sub-area/theme for this specific day, distinct from other days in the same city",
      "experience_focus": ["landmark", "museum"]
    }
  ]
}`

/**
 * FASE 1 (selección de lugares) — ver rediseño de generación de rutas. Antes, el propio bloque de
 * día (DAY_BLOCK_SYSTEM_PROMPT) decidía QUÉ lugares visitar Y escribía todo su contenido en la MISMA
 * llamada, generándose en paralelo un día a la vez sin ver el resto del viaje — eso hacía que "se
 * perdiera" y se dejara fuera hasta el 40% de los imprescindibles reales de un destino (feedback de
 * calidad real: faltaban el Arco de Constantino junto al Coliseo, la Escalinata de España, Castel
 * Sant'Angelo...). Esta llamada se hace UNA VEZ para TODO el viaje (no por bloque), así que ve el
 * viaje completo de una vez y puede aplicar la regla "ningún imprescindible del top 15-20 puede
 * faltar" con contexto real, además de ordenar cada día como un recorrido a pie orgánico. Como solo
 * pide nombre+tipo+duración (nada de horarios/descripciones/tips), la respuesta es pequeña y barata
 * incluso para un viaje largo — DAY_BLOCK_SYSTEM_PROMPT (más abajo) recibe esta lista exacta después
 * y su único trabajo pasa a ser enriquecerla, nunca inventar ni recortar lugares.
 */
const DAY_PLACES_SYSTEM_PROMPT = `You are an expert travel route planner with deep, real knowledge of specific destinations. Your ONLY job right now is to choose the COMPLETE list of real places to visit for every "city" day of this trip, in visiting order — no schedules, no descriptions, no tips, just the list. A later step enriches each place you list here with real content; it will NOT add, drop or replace anything from your list, so get the list itself right.

THE CORE TEST — imagine the traveler asked you directly in a normal chat: "what should I see in {destination} in {N} days?". You would naturally give a complete, well-known list. That is EXACTLY the knowledge to use here — never a thinner version of it.

CRITICAL RULES:
1. COMPLETENESS — nothing from the destination's real top 15-20 "must-see" list may be missing. If a traveler searched "what to see in {destination}" and the first 15-20 results are real, well-known sights, every single one of them MUST appear somewhere across this trip's days (spread across the days that fit its zone, not crammed into one day) — unless the trip is too short to physically fit all of them, in which case keep the most essential ones and it is fine to leave the most minor ones out. Before finalizing, double-check by name that the single most iconic, unmissable sight(s) of the destination are in your list somewhere (the one thing almost nobody skips — e.g. the Louvre in Paris, the Colosseum in Rome, the Sagrada Familia in Barcelona) — it is easy to lose one of these specifically because it doesn't fit neatly into any day's zone/theme; if that happens, adjust which day it lands on rather than dropping it.
2. ORGANIC ROUTE — within each day, order the places as a natural walking route: one place should lead into the next by real geographic proximity, not by importance or category. If two places are genuinely a few minutes apart (a famous arch right next to a major monument, a square that is physically part of a landmark's setting), they belong consecutively in the list.
3. GEOGRAPHIC GROUPING — you already received each day's zone/theme below (decided by an earlier step) — respect it: only place things that genuinely belong to that day's zone, never mix places from a far-away zone into a day whose zone doesn't include them.
4. QUANTITY PER DAY, by pace — these numbers are a rough feel, NOT a hard cap to stop at or a quota to force:
   - "zen"/"balanced" pace ("Tranquilo"): no rush, longer time at each place, roughly 4-5 full/visitable places as a typical feel. But if a cluster of quick exterior places sits within ~10 minutes' walk of each other in the same zone (e.g. Plaza de España → Fontana di Trevi → Panteón → Piazza Navona → Campo de' Fiori), include ALL of them — skipping an obvious nearby stop just to keep the count low makes no sense, the traveler is right there. What this pace does NOT do: stack two long visits (2h+) in the same day, one in the morning and another in the afternoon — pick one.
   - "nonstop" pace ("Completo"): make the most of the whole day, chain stops with no dead gaps, can comfortably reach 7-8 places when the zone supports it. This pace CAN stack two long visits (2h+) in the same day — one in the morning, one in the afternoon — if the geography/logistics genuinely make it work.
   Quick free exterior places (arches, fountains, squares, viewpoints — 10-30min) that sit on the natural path between two places you're including do NOT count toward the numbers above and are NEVER skipped for either pace — they cost little time/energy and leaving one out when it's literally on the route makes the trip look incomplete.
   Hard ceiling regardless of pace: a later step must write full real content (description, tip, real hours, coordinates, connector) for every single place in your list in one pass, so a day's list should very rarely need more than about 10-11 places total (long visits + short visits + quick exteriors combined) to cover everything genuinely worth including — if a zone is so dense that it would take more than that to include every real must-see, prioritize the most iconic/essential ones over minor extras rather than padding the list further.
5. LONG vs SHORT VISITS — a visit that takes 2-3h (a large museum, an extensive archaeological site) can legitimately be the day's only "long" item for that half of the day — that's correct pacing, not a thin day. Short visits (10-45min: a square, a small church, a viewpoint, a façade) should chain together or sit alongside a long visit, never fill an entire half-day alone.
6. THE TRAVELER'S CHOSEN EXPERIENCES ADD, THEY DON'T REPLACE — the traveler's chosen experience focus (given below) adds thematic places (markets, hidden gems, food spots, etc.) ON TOP OF the destination's essential must-sees from rule 1 — never use it as an excuse to swap out a classic imprescindible.
7. FREE TOUR — if "Free Tour" is in the traveler's chosen experiences, day 1's morning (roughly 10:00-12:30) is reserved for it — do not assign a long interior visit to day 1's morning slot; afternoon/evening of day 1 works normally.
8. CONNECTION PLACES — if a small, genuinely iconic place sits literally on the walking path between two places you're already including (under ~5 minutes out of the way), always include it too — never skip an obvious short stop that's right there on the route.
9. SECOND VISITS — a handful of the destination's true signature sights (a famous illuminated landmark, a plaza that feels completely different by night) can legitimately appear TWICE across different days if the second visit is a genuinely different experience (e.g. by night instead of by day) — use this sparingly (0-2 places per trip, never for an ordinary museum or interior visit), and only when it's a place travelers genuinely do visit twice.
10. STRATEGIC ORDER HINT — you know which major sights get crowded/have real opening-hour pressure (big museums, top monuments) — for those, put them earlier in their day's list (a later step will schedule them first thing in the morning); put natural sunset/viewpoint spots later in their day's list.
11. Every place must be REAL, specific, and use its clean, official Spanish name — no parentheses, no advice, no timing notes in "name" (that has no home here at all, this is just a list). Use exactly ONE consistent name per real place across the whole list — never list the same place twice under two different name variants (e.g. the local-language name once and its Spanish translation another time, like "Musée d'Orsay" and "Museo de Orsay" both appearing separately — that is the SAME museum counted twice, not two places).
12. SPANISH NAMES, EVERYWHERE, NOT JUST THE FAMOUS ONES — this applies to every single place, not only the destination's headline sights: if a place's name has a commonly-used Spanish translation, use it, even for lesser-known squares/streets/bridges/gardens. Concretely, translate the generic/descriptive part of a name even when you keep a proper noun untouched: "Place" → "Plaza" (e.g. "Place des Vosges" → "Plaza de los Vosgos", "Place du Parvis Notre-Dame" → "Plaza de Notre-Dame"), "Pont" → "Puente" (e.g. "Pont Neuf" → "Puente Nuevo"), "Champ"/"Champs" → "Campo" (e.g. "Champ de Mars" → "Campo de Marte"), "Jardin" → "Jardín", "Rue" → "Calle", "Église" → "Iglesia", "Cathédrale" → "Catedral", "Château" → "Castillo"/"Palacio", "Musée" → "Museo", "Tour" → "Torre", "Parc" → "Parque", "Sacré-Cœur" → "Sagrado Corazón" (e.g. "Basílica del Sacré-Cœur" → "Basílica del Sagrado Corazón" — ALWAYS this exact Spanish form, never the French one, so it matches consistently every time it's mentioned) — the same logic applies in any language, not just French (Italian "Piazza" → "Plaza", "Ponte" → "Puente", "Chiesa" → "Iglesia"; Portuguese "Praça" → "Plaza", "Igreja" → "Iglesia"; German "Platz" → "Plaza", "Brücke" → "Puente"; etc.). ONLY keep a name in its original language when it is genuinely a proper noun with no real Spanish equivalent — a neighborhood/district name ("Montmartre", "Le Marais", "Trastevere", "Chiado"), a person's name, or a place whose local name is what Spanish speakers actually use too ("Saint-Germain-des-Prés" stays as-is, that IS the name used in Spanish).

"relax" days (typically the trip's last day — revisits, free time, no rush) DO get a place list too, just naturally lighter/shorter than a packed "city" day. Only "road" and "excursion" days are handled by a different step — do not include those in your response at all.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "days": [
    {
      "day_number": 1,
      "places": [
        { "name": "Clean official place name, in Spanish", "type": "interior_largo|interior_corto|exterior", "duration_min": 120 }
      ]
    }
  ]
}

"type" meaning: "interior_largo" = long ticketed/interior visit (2h+, e.g. a major museum or monument interior); "interior_corto" = short ticketed/interior visit (under 1h, e.g. a small church interior); "exterior" = free, no-ticket outdoor place (square, viewpoint, arch, street, façade).`

const DAY_BLOCK_SYSTEM_PROMPT = `You are an expert travel route planner. You're filling in the schedule, descriptions and meals for ONE BLOCK of days within a longer trip — the overall shape (which city/zone and what type each day is) AND, for "city" days, the exact complete list of places to visit (in visiting order) have ALREADY been decided, given to you below; do not change either, just enrich EXACTLY the days listed with realistic, detailed content, nothing more and nothing less.

LANGUAGE — the app is in Spanish, EVERY text field you write (place names, titles, descriptions, tips, category labels, restaurant descriptions, everything) MUST be in Spanish, regardless of what language your own knowledge of the place is in.

CRITICAL RULES:
- Every place MUST be real and currently open/accessible
- Prices MUST be real and current
- Tips must be genuinely useful insider knowledge, not generic advice
- Restaurant recommendations must be real places
- Include 3 restaurant options per meal: budget (€), mid-range (€€), premium (€€€)
- Consider the season/dates for weather, events, closures and seasonal tips
- Do NOT repeat any restaurant already used earlier in the trip (see "context from earlier" below) — keep meal recommendations varied

PLACE NAMES — "name" is ONLY the clean, official name of the place, in Spanish:
- No parentheses, no added context, no advice, no timing notes inside the name. Wrong: "Colosseo (primera visita — madrugada sin masas)" or "Musei Vaticani e Cappella Sistina". Right: "Coliseo" / "Museos Vaticanos y Capilla Sixtina".
- Any advice, recommendation or context ("mejor sin masas", "ideal al amanecer", "primera visita") belongs ONLY in the "tip" or "description" fields — NEVER inside "name".
- Use the Spanish name travelers would recognize (official Spanish exonym/translation when one commonly exists), not the local-language name, unless the place has no real Spanish name (then use its actual proper name as-is). This applies to EVERY place, not just headline sights — translate the generic/descriptive part of a name even for lesser-known squares/streets/bridges: "Coliseo" not "Colosseo", "Torre Eiffel" not "Tour Eiffel", "Puente Nuevo" not "Pont Neuf", "Plaza de los Vosgos" not "Place des Vosges", "Campo de Marte" not "Champ de Mars" — same logic in any language ("Place/Piazza/Praça/Platz" → "Plaza", "Pont/Ponte/Brücke" → "Puente", "Jardin" → "Jardín", "Église/Chiesa/Igreja" → "Iglesia", "Musée" → "Museo"). ONLY keep the original-language name for a genuine proper noun with no real Spanish equivalent (a neighborhood like "Montmartre"/"Le Marais"/"Trastevere", or a name Spanish speakers already use as-is like "Saint-Germain-des-Prés").
- For "city"/"relax" days this rarely applies (their names are already fixed by the required list, see REQUIRED PLACES below) — it matters most for "road"/"excursion" day content, which you name yourself.

MEALS ARE NEVER A NUMBERED STOP — this is a hard rule that has been violated before, do not repeat that mistake:
- A restaurant, lunch break, dinner break, or any "pausa para comer/cenar" must NEVER appear inside a day's "stops" array. Meals exist ONLY inside that day's "meals" array.
- Each day has EXACTLY one lunch entry (if the day includes it) and exactly one dinner entry — never two meal blocks for the same time slot, and never a stop AND a meal covering the same break.
- Wrong: a stop named "Pausa para almuerzo" or "Almuerzo en Prati" appearing in "stops" right after (or instead of) the "lunch" entry in "meals". If the traveler is eating, it is a meals entry, period.

REQUIRED PLACES — for every "city" day in this block, the trip context below gives you the EXACT, complete list of places to visit that day, already in a sensible visiting order (decided by an earlier step that saw the whole trip at once):
- Every single place in that list MUST appear as its own numbered stop in your response for that day — you may NOT drop, skip, merge, rename or substitute any of them. Reproduce each place's "name" EXACTLY as given below, character for character — do NOT translate it, "improve" it, or apply the PLACE NAMES rule to it, even if it's not in Spanish or looks inconsistent with other stops. That exact string is what makes a stop recognized as fulfilling this requirement; a translated or reworded version of it will be treated as a DIFFERENT, unrequested place and may get removed.
- You may NOT add any additional visitable place beyond that exact list for a "city" day — the selection is already final; your job here is only to enrich it (realistic schedule, description, tip, category, hours, coordinates, connectors to the next stop).
- Keep the given order by default (it already reflects a sensible walking route) — only reorder within the day if strictly necessary to respect real opening hours or physically-impossible timing, and even then change as little as possible.
- "relax" days DO get a required list too (below) — enrich it exactly the same way as a "city" day, it's just naturally lighter/shorter. Only "road" days were NOT given a place list — use your own judgment for realistic content there. "excursion" days are covered separately below.
- Some places in the list come with extra hints already decided by a human curator: a "tip ya decidido" note means that place already has its final tip text — leave "tip": "" (empty string) for it in your response, it gets filled in automatically afterward from the curator's exact words; do NOT copy the given text into your response, that would just cost you output tokens for text that gets overwritten anyway. A "horario ideal ya decidido" note tells you the best_time to schedule that stop (primera_hora → start it 08:30-09:30; atardecer → 1-2h before sunset; noche → after 19:00) — follow it, even if it means the day runs later than your other stops would suggest; a "noche" stop is not optional just because the rest of the day already feels complete. An "acceso libre confirmado" note means set "hours": null for that stop, no exceptions.
- If the SAME place name appears in the required list of two different days of this trip, that is a deliberate second visit (see REPEAT VISITS below) — include it BOTH times, once per day, even though it feels redundant to schedule the "same" stop twice. Do not silently skip the second occurrence just because you already covered it on another day.

TIMING BETWEEN STOPS AND MEALS — the times you write must be physically possible, not just plausible on paper:
- suggested_time and travel_to_next are your own real-world estimate of when the day actually happens — treat them as a real schedule, not decoration.
- Whenever a visit ends and the next thing is a meal (lunch or dinner), leave real time for it: at least 30 minutes to get there and sit down, the meal block itself at least 1h15min (order, eat, pay), then at least 30 more minutes to travel to whatever comes next. Example: a visit ending at 12:00 → lunch roughly 12:30-13:45 → next stop starting from 14:15 at the earliest — never straight from a 12:00 end into a 14:00 stop with nothing accounted for in between.
- Apply the exact same logic to dinner: real travel time before it, at least 1h15min for the meal itself, real travel time after if anything else follows that day.

REAL OPENING HOURS — you already know the approximate real opening hours of major monuments, museums and attractions; use that knowledge, never guess or default to "always open":
- suggested_time for a stop with real opening hours must NEVER be earlier than that place's own opening time — even if that pushes the whole morning later, or means reordering the day so an earlier-opening or always-open place goes first. Do not assume every stop opens at whatever generic hour the day happens to start. Wrong example: scheduling the Colosseum at 07:30 when it actually opens around 08:30 — that stop must move to 08:30 or later, not stay where the day's rhythm would otherwise put it. EXCEPTION: on a day with a Free Tour, this never means moving another stop to START BEFORE the Free Tour just because that stop opens early — the Free Tour's first-slot rule (see FREE TOUR below) always wins for the day's very first slot; an early-opening museum simply moves to right after the Free Tour ends instead, same as any other stop that day.
- This overrides the traveler's chronotype/schedule preference for THIS specific stop's start time — "early riser" describes when the traveler is awake and ready to go, not when a ticketed site opens. If the day starts before the first real stop's opening time, either open the day with something genuinely always-open (a sunrise walk, a viewpoint, a market that's already trading) and place the ticketed stop once it actually opens, or simply start that first stop at its real opening time — never at the chronotype's generic start hour regardless of whether the place is open yet.
- Decide the "hours" field (below) by what the traveler is actually entering for THIS stop, not by what's visible for free from the street. A monument whose duration_minutes implies going inside — a ticket, a checkpoint, a visiting schedule (Colosseum, Vatican Museums, a cathedral's interior, any museum) — is NEVER "hours": null, even though its exterior is always visible/photographable for free. Only genuinely free-standing, no-ticket, no-schedule places (a fountain, a square, an arch, a viewpoint, a street) get "hours": null. Wrong example: marking the Colosseum "hours": null/"Acceso libre" — it has real, specific opening hours (~08:30-19:00 depending on season) and those must be used, not treated as an always-open landmark.

TIPS — for EVERY stop, if you genuinely know something of real practical value, put it in "tip" (1-3 sentences, only what applies — never pad with generic filler like "lleva calzado cómodo"). EXCEPTION: if REQUIRED PLACES below already gives you a "tip ya decidido" for a specific stop, leave "tip": "" for it instead — see REQUIRED PLACES above, it gets filled in automatically, don't write anything there.
- Combined tickets: does this place's entry also cover another place in this same trip (e.g. "La entrada del Coliseo incluye el Foro Romano y el Palatino, puedes usarla 24h antes o después")? Say so, and mention the other place by its exact name as used elsewhere in this trip.
- Partial free access: is part of it free and part paid (e.g. "La Basílica es gratuita, pero subir a la cúpula tiene coste")? Say exactly which part.
- Strategic timing to avoid crowds: a genuinely useful best-time-to-go detail, specific to this place, not generic advice.
- Practical logistics that save time or money: reservation requirements, typical wait times without booking ahead, anything a first-time visitor would not know to check.
- If you don't have anything genuinely specific and valuable for this place, leave "tip" empty rather than inventing generic advice.

FREE TOUR — only if "Free Tour" appears in the traveler's chosen experience focus below:
- Belongs EXCLUSIVELY to day 1 of the trip, and ONLY when day 1 is literally one of the days you are writing in THIS block. If day 1 is not in this block, do NOT add a Free Tour to any day here — day 1's own separate call already owns it, adding one in a different block would create a duplicate tour in the same trip, which is a real bug, not a safe fallback. This applies no matter which day you're writing (day 2, day 3, the last day...) — none of them ever get a Free Tour, only day 1 does.
- When day 1 IS in this block: mandatory and always FIRST, day 1's opening stop, 10:00 start by default, before every other stop that day — no exceptions for another place's opening hours, crowds, or "logical" morning slot. ONE explicit exception: if REQUIRED PLACES below marks a place with a "muy temprano, ANTES del Free Tour" hint, that specific place (only that one, never any other) goes at 08:00-09:30, strictly before the tour — it exists precisely to fill the dead time between an 08:00 day start and a 10:00 tour, not to compete with it. Single stop, duration_minutes 150-180.
- Everything else required for that day is scheduled after it ends. Anything the tour itself would pass (a central square/fountain/landmark, see free_tour_highlights) goes even later, as its own proper deeper visit, not a "preview".
- "name": "Free Tour: <destination or zone>" (e.g. "Free Tour: Centro Histórico de Roma"). "description" must summarize what the tour covers in general terms (it walks past several landmarks from the outside, with historical context) — do NOT claim it enters any paid/ticketed site, free tours are always exterior/walking tours.
- "free_tour_meeting_point": the specific real square/point where free tours in this destination customarily start (you know this — e.g. in Rome it's commonly Piazza Venezia or Piazza di Spagna).
- "free_tour_highlights": an array of 3-6 real place names this free tour walks past/covers from the outside — places within this same trip's destination that a typical free tour of that city would include.
- "free_tour_tips": an array of exactly 3 short tips in Spanish: (1) a persuasive one about why it's worth it especially for a first-time visitor, (2) a practical one about the customary tip amount for a free tour in this destination (typically 10-15€/person), (3) a practical one about arriving early since groups fill up.
- Do NOT also list, as separate individual stops THAT SAME DAY, any place already listed in "free_tour_highlights" — that would double them up. On OTHER days of the trip, those same places ARE allowed and encouraged as their own proper stops when they deserve a deeper visit (e.g. the Pantheon from the outside during the tour, then a proper 30-45min interior visit as its own stop on a different day; a fountain seen on the tour, then again at night on a different day as an evening stop) — a free tour only sees things from outside in passing, a dedicated stop on another day is a genuinely different experience, not a repeat.
- Places with paid/ticketed interior access (Colosseum, Vatican Museums, any museum or gallery) are NEVER covered by a free tour and always get their own individual stop, on any day, free tour or not.

REPEAT VISITS — the required list above may occasionally include a place that also appears on a different day elsewhere in the trip (a deliberate second visit to a signature sight, decided by the earlier step that saw the whole trip — e.g. a fountain seen once by day, once by night). That is intentional, not an error:
- If today's scheduled time for that stop lands at a notably different moment than a typical single visit (early morning, or evening/night), lean into that angle: title/description should explain why THIS visit is worth it at THIS specific time (e.g. "sin aglomeraciones al amanecer" vs. "iluminada de noche") — a short, distinct note, not the full description you'd give it on a single visit.

EXCURSION DAYS — only for a day in this block whose type is "excursion":
- Pick the single most popular, real, well-known day-trip excursion FROM this destination (e.g. Rome → Pompeii/Naples, Barcelona → Montserrat, Paris → Versailles) — never invent one.
- That day's stops/meals should reflect the excursion destination itself (the real stops of that town/site), not the home city.
- Fill "excursions_available" for it with a real transport suggestion (train, bus, or organized tour) and a realistic total duration, plus a realistic price.

COMPANION ADAPTATION:
- Solo: social spots, solo-friendly activities.
- Couple: romantic spots, scenic walks, nice dinners.
- Family: kid-friendly, parks, shorter walks, family restaurants — adapt activities and pacing to the youngest child's age (given below).
- Group: group activities, shared experiences, nightlife — optimize for group logistics (exact size given below).

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "days": [
    {
      "day_number": 1,
      "title": "Short evocative title, in Spanish",
      "stops": [
        {
          "id": "unique-id",
          "name": "Clean official place name, in Spanish, no parentheses, no advice, no timing notes — see PLACE NAMES above",
          "description": "2 sentences max, in Spanish",
          "tip": "1-3 sentences of genuinely high-value practical tip (combined tickets, partial free access, strategic timing, logistics) — see TIPS above, in Spanish, empty string if you have nothing genuinely good",
          "suggested_time": "HH:MM",
          "duration_minutes": 90,
          "latitude": 00.0000,
          "longitude": 00.0000,
          "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
          "category_label": "Short SPECIFIC place type in Spanish, e.g. 'Anfiteatro histórico', 'Museo de arte', 'Basílica', 'Mirador', 'Plaza', 'Mercado local' — never a generic label like 'Punto de interés'",
          "hours": "Real opening hours as 'HH:MM–HH:MM' if this stop involves entering somewhere with a ticket/checkpoint/schedule (museum, monument interior, church with visiting hours — e.g. Colosseum ~08:30-19:00) — null ONLY for genuinely free-standing, no-ticket, no-schedule places (fountain, square, arch, viewpoint, street). See REAL OPENING HOURS above — never null just because the place is also visible/photographable for free from outside.",
          "entry_fee": "€X or Free",
          "entry_options": [
            {
              "name": "Standard entry",
              "price": "€X",
              "description": "What is included"
            }
          ],
          "is_free_tour": false,
          "free_tour_meeting_point": "Only when is_free_tour is true — see FREE TOUR above, omit/null otherwise",
          "free_tour_highlights": ["Only when is_free_tour is true — see FREE TOUR above, omit/empty otherwise"],
          "free_tour_tips": ["Only when is_free_tour is true — exactly 3 tips, see FREE TOUR above, omit/empty otherwise"],
          "travel_to_next": {
            "method": "walk|metro|train|bus|taxi|car|ferry",
            "duration_minutes": 15,
            "distance": "X km",
            "description": "What you see on the way"
          }
        }
      ],
      "meals": [
        {
          "time": "breakfast|lunch|dinner",
          "options": [
            {
              "name": "Real Restaurant Name",
              "price_level": "€|€€|€€€",
              "cuisine": "Type, in Spanish",
              "description": "What to order and why, in Spanish",
              "price_range": "€X-€X per person",
              "latitude": 00.0000,
              "longitude": 00.0000
            }
          ]
        }
      ],
      "rainy_alternative": "What to do instead if bad weather, in Spanish"
    }
  ],
  "not_included": [
    {
      "name": "Place Name, in Spanish (see PLACE NAMES above) — only include places relevant to THIS block's city/cities",
      "reason": "Why it did not make the cut, in Spanish",
      "where_it_fits": "Specific suggestion of where to add it, in Spanish",
      "latitude": 00.0000,
      "longitude": 00.0000
    }
  ],
  "excursions_available": [
    {
      "name": "Excursion name, in Spanish — only if one of this block's days is type \\"excursion\\", omit array entirely otherwise",
      "duration": "half_day|full_day",
      "description": "What you do, in Spanish",
      "transport_suggestion": "Real, specific way to get there and back (train/bus/organized tour), with realistic total duration, in Spanish",
      "estimated_price": "€XX",
      "suggested_day": 4
    }
  ]
}

CRITICAL VALIDATION — NEVER VIOLATE THESE:
- NEVER set suggested_time earlier than the place's real opening hour — not even for the first stop of the day, not even if the traveler's chronotype/schedule preference asks for an earlier start.
- NEVER set "hours" to null for a place with indoor/ticketed access (museum, monument interior, church with a visiting schedule) — always give real hours for those, "hours": null is ONLY for genuinely free-standing outdoor places with no ticket and no schedule.
- If you don't know the exact real hours of a specific place, use a conservative default rather than guessing "always open": museums/monuments 09:00-18:00, churches 08:00-19:00.
- NEVER put a restaurant, meal, or food break inside "stops" — meals only ever go in "meals". NEVER write a "name" with parentheses, advice, or timing context in it — see PLACE NAMES above. Every text field must be in Spanish.
- For every "city" day, NEVER omit a place from the required list given to you (see REQUIRED PLACES above) and NEVER add a visitable place that isn't on it.`

/** "Elige tus experiencias" (reemplaza el antiguo "¿Qué mueve tu viaje?" de 5 opciones) — traduce los ids elegidos a texto legible para el prompt de generación. */
/** 'free_tour' es un pseudo-id fuera del banco de 18 (ver FREE_TOUR handling en DAY_BLOCK_SYSTEM_PROMPT) — no está en EXPERIENCE_BANK a propósito, para no colar "Free Tour" como categoría al etiquetar lugares sueltos en suggest-places/suggest-experiences (ver EXPERIENCE_IDS). Aquí solo se traduce a texto legible para el prompt de generación. */
function formatExperiences(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) return 'not specified'
  const titles = experiences.map((id) => (id === 'free_tour' ? 'Free Tour' : EXPERIENCE_BANK.find((entry) => entry.id === id)?.title ?? id))
  return titles.join(', ')
}

const ARCHETYPE_LABEL = {
  roadtrip_exclusivo: 'road trip exclusive — the road IS the experience',
  base_y_excursiones: 'base and excursions — nearby points of interest, vehicle improves the experience but is never mandatory',
  urbano_clasico: 'classic urban — walk + public transport',
  multidestino_tren_o_vuelo: 'multi-destination by train/flight — cities connected by high-speed rail or domestic flights',
  multidestino_mixto_o_circuito: 'multi-destination mixed circuit — combined transport per leg',
  expedicion_o_crucero: 'expedition/cruise — logistics fully managed by an operator',
}

const PACE_LABEL = {
  zen: 'zen/"Tranquilo" — starts around 10:00, no rush, slower mornings, longer time at each place, roughly 4-5 full visits as a typical feel — can stretch to 7-8 ONLY when the zone has many quick (<10min walk apart) exterior stops clustered together (never a hard cap in that case, see REQUIRED PLACES). NEVER stack two long (2h+) visits in the same day, morning and afternoon — pick one.',
  balanced: 'balanced/"Tranquilo" — same spirit as zen (see above), slightly more flexible.',
  nonstop: 'nonstop/"Completo" — ALWAYS starts at 08:00, make the most of the whole day, chain stops with no dead gaps, fit everything that reasonably fits once meals/travel time are respected. No rigid cap on the number of stops — real time and logistics decide, not a fixed count; comfortably 7-8 places is typical but more is fine when the day genuinely has room. CAN stack two long (2h+) visits in the same day, one morning and one afternoon, if the geography/logistics genuinely allow it.',
}

/** Mínimo de paradas visitables (sin contar comidas) para un día "city" normal, según ritmo — usado para validar y autocompletar la respuesta de generate-day-block, ver MIN_STOPS_BY_PACE más abajo. El propio prompt (PACE_LABEL/DAY_BLOCK_SYSTEM_PROMPT) ya pide este rango, esto es la red de seguridad server-side por si Claude no lo cumple. */
const MIN_STOPS_BY_PACE = { zen: 4, balanced: 4, nonstop: 6 }
const MIN_AFTERNOON_STOPS = 2
const AFTERNOON_WINDOW_MINUTES = [14 * 60, 20 * 60]

const CHRONOTYPE_LABEL = {
  sunrise: 'early riser (starts 6-7am)',
  normal: 'normal schedule (9am-10pm)',
  nightowl: 'night owl (starts late, enjoys nightlife)',
}

const BUDGET_LABEL = {
  backpacker: 'backpacker (hostels, street food)',
  comfortable: 'comfortable (hotels, good restaurants)',
  treatMyself: 'treat myself (boutique hotels, best experiences)',
}

const COMPANION_LABEL = {
  solo: 'solo',
  couple: 'couple',
  family: 'family with kids',
  group: 'group of friends',
}

/**
 * "Elige tus acompañantes" (Paso 5) — AVENTURA EN TRIBU/CON MI CREW llevan datos numéricos que
 * Claude necesita para adaptar habitaciones y actividades (ver COMPANION ADAPTATION en
 * DAY_BLOCK_SYSTEM_PROMPT), no solo la etiqueta genérica de COMPANION_LABEL.
 */
function formatCompanion(answers) {
  const base = COMPANION_LABEL[answers.companion] ?? 'not specified'
  if (answers.companion === 'family' && typeof answers.companionAdults === 'number') {
    const ages = Array.isArray(answers.companionChildrenAges) ? answers.companionChildrenAges : []
    const childrenPart = ages.length > 0 ? `, ${ages.length} child(ren) aged ${ages.join(', ')}` : ', no children'
    return `${base}: ${answers.companionAdults} adult(s)${childrenPart}`
  }
  if (answers.companion === 'group' && typeof answers.companionGroupSize === 'number') {
    return `${base} of ${answers.companionGroupSize} people`
  }
  return base
}

function formatArrivalTransport(transportOption) {
  if (!transportOption?.title) return 'not specified'
  return transportOption.description ? `${transportOption.title} — ${transportOption.description}` : transportOption.title
}

function describeAccommodationType(archetype, accommodationMode, travelMode) {
  if (accommodationMode === 'camping') {
    if (archetype === 'urbano_clasico') {
      return 'camper/RV parking or campsite on the OUTSKIRTS, chosen specifically for a good public transport connection into the city center — never a central hotel, but never disconnected either'
    }
    return 'camper/RV — camping and homologated motorhome areas ONLY, never hotels'
  }
  if (archetype === 'roadtrip_exclusivo') {
    return 'hotel per stage — a different hotel at the end of each daily driving stage, matched to budget'
  }
  if (archetype === 'base_y_excursiones') {
    return travelMode === 'itinerante'
      ? 'touring route — multiple accommodations by zone'
      : 'fixed base — a single accommodation with circular excursions'
  }
  if (archetype === 'urbano_clasico') return 'single well-connected central hotel for the whole stay'
  if (archetype === 'multidestino_tren_o_vuelo') return 'one accommodation per city stop'
  if (archetype === 'multidestino_mixto_o_circuito') return 'multiple accommodations matched to each leg (urban hotel, ecolodge, beach resort, etc.)'
  if (archetype === 'expedicion_o_crucero') return 'cabins/camps/lodges managed by the operator'
  return 'not specified'
}

function buildArchetypeContext(transportContext) {
  const { archetype, is_region, vehicle_type, vehicle_ownership, accommodation_mode, travel_mode, pase_dominante, travel_pass_confirmed } =
    transportContext ?? {}
  if (!archetype || !DESTINATION_ARCHETYPES.has(archetype)) return ''

  const lines = [
    '',
    '',
    'DESTINATION ARCHETYPE CONTEXT (follow these rules strictly — NEVER mix "how to arrive" with "how to move around at the destination"):',
    `- Archetype: ${archetype} — ${ARCHETYPE_LABEL[archetype] ?? ''}`,
    `- Is a region/area, not a single city: ${is_region ? 'yes' : 'no'}`,
  ]

  if (vehicle_type) {
    lines.push(`- Vehicle at destination: ${vehicle_type === 'camper' ? 'camper/RV' : 'car'} (${vehicle_ownership === 'own' ? 'own' : 'rental'})`)
  }
  if (travel_mode) {
    lines.push(
      `- Trip style: ${
        travel_mode === 'itinerante' ? 'touring route (changes accommodation by zone)' : 'fixed base (one accommodation, circular day trips)'
      }`,
    )
  }
  lines.push(`- Accommodation type: ${describeAccommodationType(archetype, accommodation_mode, travel_mode)}`)

  if (archetype === 'roadtrip_exclusivo') {
    lines.push(
      '- Mobility is ONLY the vehicle above (car or camper). Structure the route as consecutive daily driving stages, not a single-city base.',
    )
    if (accommodation_mode === 'camping') {
      lines.push('- NEVER suggest hotels. Every night must be at a campsite or a homologated motorhome area.')
    }
  } else if (archetype === 'base_y_excursiones') {
    lines.push(
      vehicle_type
        ? '- The traveler has a vehicle at destination — plan around driving between points of interest.'
        : '- The traveler has NO vehicle at destination (their choice) — plan around organized tours, public transport, or taxis between points of interest. Never assume a rental car.',
    )
    lines.push('- If the route crosses between islands or zones, include the inter-island ferry or domestic flight automatically.')
  } else if (archetype === 'urbano_clasico') {
    if (vehicle_type === 'camper') {
      lines.push(
        '- The traveler arrived with their own camper/RV, parked/camped on the outskirts (not driven into the city center — see the accommodation type above). Within the city itself: walking + public transport only, exactly like any other visitor. Never suggest driving the camper around inside the city.',
      )
    } else if (vehicle_type === 'car') {
      lines.push(
        '- The traveler has a car in this city (their own, driven there, or a rental) — its public transport is limited/impractical for a visitor (sprawling urban layout, long distances between points of interest), or they simply already had the car. Plan around driving between points of interest, same as any car-based destination.',
      )
    } else {
      lines.push('- Mobility is ONLY walking + public transport (metro/bus) + taxi/rideshare. NEVER suggest renting a car.')
    }
    lines.push(
      '- EXCEPTION: for full-day excursions outside the city (e.g. Pompeii from Rome, Montserrat from Barcelona), bundle the excursion transport into the excursion itself (bus tour, train, etc.) — do not treat it as a separate car-rental need.',
    )
  } else if (archetype === 'multidestino_tren_o_vuelo') {
    if (pase_dominante && travel_pass_confirmed) {
      lines.push(
        `- The traveler will use the ${pase_dominante} for inter-city transport. Favor train/flight legs that this pass actually covers, and mention the pass explicitly in transport descriptions between cities. If a specific leg is poorly covered by this pass (e.g. remote islands, routes the pass excludes), it's fine to note that leg is better done by a normal domestic flight instead.`,
      )
    } else if (pase_dominante && travel_pass_confirmed === false) {
      lines.push(
        `- The traveler chose NOT to use the ${pase_dominante} — buy point-to-point tickets for each inter-city leg instead, don't assume pass coverage.`,
      )
    } else {
      lines.push('- Decide the best high-speed train or domestic flight between each city yourself.')
    }
    lines.push('- Within each city: walking + public transport only.')
    lines.push('- Give each day a "city" field (see schema) reflecting which city the traveler is actually in that day, changing exactly on the days the itinerary moves between cities.')
  } else if (archetype === 'multidestino_mixto_o_circuito') {
    lines.push(
      '- Structure the route as a chain of phases of three possible types, in whatever order and combination fits the destination and trip length: "urbana" (a city, e.g. Kuala Lumpur, Hanoi, Cusco), "naturaleza" (a remote nature/jungle zone, typically without a real airport/train/public bus reaching it well, e.g. Cameron Highlands, Sapa, Valle Sagrado), or "isla" (an island, e.g. Langkawi, Perhentian, islas Ballestas).',
    )
    lines.push('- Within an urban phase: walking + public transport + taxi/rideshare only, never a rental car.')
    lines.push(
      '- Nature and island phases: mobility to/around points of interest is handled by the phase itself (lodge transfers, organized tours) — do not add a separate car-rental need there beyond the phase-to-phase transitions.',
    )
    lines.push('- Give each day a "city" field (the specific phase name — city, nature zone, or island) AND a "phase_type" field (see schema), both changing exactly on the days the itinerary moves to a new phase.')
  } else if (archetype === 'expedicion_o_crucero') {
    lines.push('- All mobility (boat, guided 4x4, tourist train) and accommodation are managed by the operator — do not suggest independent transport or hotel bookings.')
  }

  if (is_region && archetype !== 'roadtrip_exclusivo' && archetype !== 'base_y_excursiones') {
    lines.push('- This is a region, not a single city — the traveler will need ground transport to get around even if they arrived by train/flight.')
  }

  return lines.join('\n')
}

/**
 * Solo llamado desde buildSkeletonUserPrompt — las instrucciones de city_transitions/
 * phase_transitions vivían antes dentro de buildArchetypeContext, pero esa función ahora también la
 * usan las llamadas de bloque de días (que NO deben volver a decidir transiciones, el esqueleto ya
 * las fijó), así que se separaron en su propia función usada solo por la llamada de esqueleto.
 */
function buildTransitionsInstructions(transportContext) {
  const { archetype, pase_dominante } = transportContext ?? {}

  if (archetype === 'multidestino_tren_o_vuelo') {
    return `

ALSO include a top-level "city_transitions" array in your JSON response (sibling of "days"), one entry per city change, with this exact shape:
{
  "city_transitions": [
    {
      "day_number": <the day this transition lands on, i.e. the first day in the new city>,
      "from_city": "...",
      "to_city": "...",
      "train": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "flight": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "bus": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "recommended": "train" | "flight" | "bus" | null,
      "pass_covers_leg": true/false
    }
  ]
}
Same rigor as real geography, not "is it technically possible": train.feasible only if a traveler would realistically take it for this specific leg (reasonable duration, not multiple transfers for a short hop); flight.feasible only if there's a real domestic route; bus.feasible only if it's a real, commonly-used option. If neither train nor flight is realistic for this leg, still fill in bus with real facts — the frontend needs it as a fallback.${
      pase_dominante ? ` "recommended" and "pass_covers_leg" both matter here: pass_covers_leg = false only when the ${pase_dominante} genuinely does not cover this specific leg well (e.g. a remote route the pass excludes) — true by default.` : ' Set "pass_covers_leg" to true for every leg (no pass in play for this trip).'
    }`
  }

  if (archetype === 'multidestino_mixto_o_circuito') {
    return `

ALSO include a top-level "phase_transitions" array (sibling of "days"), one entry per phase change, with this exact shape:
{
  "phase_transitions": [
    {
      "day_number": <the day this transition lands on, i.e. the first day in the new phase>,
      "from_phase": "...",
      "to_phase": "...",
      "from_phase_type": "urbana" | "naturaleza" | "isla",
      "to_phase_type": "urbana" | "naturaleza" | "isla",
      "train": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "flight": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "bus": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "ferry": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "transfer_organizado": { "feasible": true/false, "duration_label": "...", "price_label": "..." },
      "roadtrip_alquiler": { "feasible": true/false, "duration_label": "...", "price_label": "...", "apto_camper_autocaravana": true/false },
      "recommended": "train" | "flight" | "bus" | "ferry" | "transfer" | "roadtrip" | null
    }
  ]
}
Fill in ONLY the fields that make real-world sense for that specific from_phase_type/to_phase_type pair, leave the rest feasible=false — same rigor as real geography, not "is it technically possible":
- urbana↔urbana: evaluate train/flight/bus like any other city-to-city leg (feasible only if a real traveler would realistically use it — direct or max 1 transfer, reasonable duration vs. the fastest alternative). Leave ferry/transfer_organizado/roadtrip_alquiler feasible=false.
- any phase↔isla (island on either side): evaluate ONLY ferry (a real, short, practical crossing) and flight (a real domestic route). Leave train/bus/transfer_organizado/roadtrip_alquiler feasible=false — cars and organized transfers never cross to an island.
- urbana↔naturaleza or naturaleza↔naturaleza: evaluate transfer_organizado (a private/shared tourist minivan transfer, bookable via 12Go Asia or a local operator — feasible=true in almost every real case, this is the default connective tissue for these legs), roadtrip_alquiler (feasible only under the same threshold as any road trip leg: under 12-16h total driving, a real rentable route — and set "apto_camper_autocaravana": true ONLY if this specific region has real camper/RV rental culture and camper-suitable roads; the large majority of destinations in this archetype do NOT — Thailand/Vietnam/Malaysia/Peru/Colombia mostly don't — but be honest about real exceptions like Costa Rica or New Zealand-style circuits when it genuinely applies), and bus (feasible=true ONLY if a real public bus line covers this specific leg — many remote nature zones have none, that is expected and fine). Leave train/flight/ferry feasible=false.
Of whichever fields came out feasible=true, set "recommended" to the single best one for a typical traveler (balance of price/duration/comfort) — use "roadtrip" to mean roadtrip_alquiler regardless of whether the camper variant applies, don't try to pick between car and camper. null only if nothing came out feasible=true (should be rare — transfer_organizado in particular should almost always be feasible for nature/urban legs).`
  }

  return ''
}

function formatSeasonOrDates(answers) {
  if (answers.dateRange?.start && answers.dateRange?.end) {
    return `exact dates: ${answers.dateRange.start} to ${answers.dateRange.end}`
  }
  if (answers.season) return `${answers.season} (no exact dates)`
  return 'not specified'
}

/**
 * Lugares concretos que el viajero marcó explícitamente en "Elige lugares" (ver /api/suggest-places)
 * — a diferencia de experience focus (categorías), esto son sitios con nombre propio que el usuario
 * pidió por su cuenta. Se tratan casi como obligatorios: alta prioridad, no una sugerencia más de la
 * IA. Vacío si el usuario no marcó ninguno (la lista es opcional, nunca bloquea el flujo). Ahora solo
 * lo usa /api/generate-day-places (Fase 1) — una vez esa lista de lugares está decidida, el resto del
 * pipeline (generate-day-block) ya no necesita saber cuáles eran "del usuario" frente a "de la IA",
 * todos son ya, sin más, la lista exacta que hay que enriquecer.
 */
function formatMustIncludePlaces(places) {
  if (!Array.isArray(places) || places.length === 0) return ''
  const names = places
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => name.trim().slice(0, 150))
    .slice(0, 40)
  if (names.length === 0) return ''
  return `

MANDATORY USER PLACES — the traveler explicitly selected these real places from a curated list before generation started. Every single one of them MUST appear in your place list, on whichever day(s) fit their zone/geography best — never leave one out.
Places: ${names.join(', ')}`
}

function buildSkeletonUserPrompt(destination, answers, transportContext) {
  return `Design the day-by-day shape for this trip:
- Origin: ${answers.origin}
- Destination: ${destination}
- Arrival transport (phase 1 — how to arrive, NOT how to move around at destination): ${formatArrivalTransport(transportContext?.transport_option)}
- Days: ${answers.days}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${buildArchetypeContext(transportContext)}${buildTransitionsInstructions(transportContext)}`
}

function formatSkeletonDays(blockDays) {
  return blockDays
    .map((day) => {
      const parts = [`type=${day.type}`, `city=${day.city}`]
      if (day.phase_type) parts.push(`phase=${day.phase_type}`)
      if (day.zone_focus) parts.push(`zone_focus=${day.zone_focus}`)
      if (day.experience_focus?.length) parts.push(`experience_focus=${day.experience_focus.join('/')}`)
      return `  - Day ${day.day_number}: ${parts.join(', ')}`
    })
    .join('\n')
}

/** Igual que buildDayBlockUserPrompt (ver más abajo) — le da a Claude el TRIP ENTERO de una vez (no un bloque), porque la Fase 1 (DAY_PLACES_SYSTEM_PROMPT) necesita ver todos los días a la vez para no repetir/olvidar imprescindibles entre ellos. Se listan los días "city" y "relax" — "road"/"excursion" no llevan lista de lugares (ver EXCURSION DAYS en DAY_BLOCK_SYSTEM_PROMPT, sigue siendo su propio paso). */
function buildDayPlacesUserPrompt(destination, answers, transportContext, skeletonDays, mustIncludePlaces) {
  const cityDays = (skeletonDays ?? []).filter((day) => day.type === 'city' || day.type === 'relax')
  return `Choose the complete place list for this trip:
- Destination: ${destination}
- Total trip length: ${answers.days} day(s)
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Experience focus (adds to the essential must-sees, see rule 6): ${formatExperiences(answers.experiences)}
- Pace: ${PACE_LABEL[answers.pace] ?? answers.pace}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}

"City" days needing a place list (already shaped by an earlier step — respect each day's zone_focus/experience_focus):
${formatSkeletonDays(cityDays)}${formatMustIncludePlaces(mustIncludePlaces)}`
}

/** La lista EXACTA de lugares decidida en Fase 1 (generate-day-places) para los días de este bloque — ver REQUIRED PLACES en DAY_BLOCK_SYSTEM_PROMPT. Vacío para un día "road" (no lleva lista) o "excursion" (su contenido lo decide DAY_BLOCK_SYSTEM_PROMPT por su cuenta, ver EXCURSION DAYS). */
/** Un lugar del JSON curado (ver buildCuratedDayPlaces) trae tips/best_time/is_free_access ya decididos por un humano — se formatean aparte por lugar (en vez de en una sola línea) porque, a diferencia del resto de campos, estos SUSTITUYEN el propio criterio de Claude para ese lugar concreto (ver TIPS y REAL OPENING HOURS en DAY_BLOCK_SYSTEM_PROMPT). Un lugar elegido por la Fase 1 de Claude no trae ninguno de estos tres campos — la línea queda igual que antes. */
function formatRequiredPlaceItem(place) {
  if (place.name === FREE_TOUR_REQUIRED_PLACE_MARKER) {
    return `THE FREE TOUR ITSELF [~${place.duration_min}min] — not a real place, expand this entry into the Free Tour stop per the FREE TOUR section above (is_free_tour:true, real name, meeting point, highlights, tips). Mandatory like every other entry in this list.`
  }
  const base = `${place.name} [${place.type}, ~${place.duration_min}min]`
  const extras = []
  if (place.best_time) extras.push(`horario ideal ya decidido: ${place.best_time}`)
  // Gratis y sin horario NO son lo mismo, y confundirlos le costaba el horario a lugares que sí lo
  // tienen: la Basílica de San Pedro se entra gratis pero cierra a las 20:00. Si el JSON del destino
  // le ha escrito un horario a mano, ese horario manda por encima del "acceso libre".
  if (place.is_free_access === true) {
    extras.push(
      place.has_schedule
        ? 'entrada gratuita (sin taquilla), PERO tiene horario de visita — "hours" no puede ser null'
        : 'acceso libre confirmado, sin horario de taquilla (hours: null)',
    )
  }
  // El texto del tip NO se le pide a Claude que lo reescriba en su respuesta — se lo damos aquí solo
  // como contexto de qué tipo de lugar es, y aplyCuratedTips lo inyecta después directamente en el
  // JSON final. Antes se le pedía "cópialo tal cual" en el campo "tip" de su respuesta, lo que
  // significaba pagar esas mismas palabras dos veces (una en el prompt, otra en cada respuesta) sin
  // ganar nada — encontrado en vivo como una causa real de cortes por max_tokens en días con muchos
  // lugares curados.
  if (Array.isArray(place.tips) && place.tips.length > 0) extras.push(`tip ya decidido por un curador humano (NO lo escribas en tu respuesta, deja "tip": "" para este lugar — se añade automáticamente después): ${place.tips.join(' | ')}`)
  return extras.length > 0 ? `${base} — ${extras.join(' — ')}` : base
}

function formatRequiredPlaces(placesForBlock) {
  if (!Array.isArray(placesForBlock) || placesForBlock.length === 0) return ''
  const sections = placesForBlock
    .filter((entry) => Array.isArray(entry?.places) && entry.places.length > 0)
    .map((entry) => {
      const items = entry.places.map(formatRequiredPlaceItem).join('; ')
      return `  - Day ${entry.day_number}: ${items}`
    })
  if (sections.length === 0) return ''
  return `

REQUIRED PLACES (exact, final list per day, in visiting order — see REQUIRED PLACES above, this is NOT optional):
${sections.join('\n')}`
}

/**
 * Resumen ligero de TODOS los días del viaje, calculado una sola vez en generate-skeleton (zone_focus
 * + experience_focus, ver SKELETON_SYSTEM_PROMPT) — sustituye al mecanismo anterior de "continuity"
 * (que dependía del contenido YA ESCRITO de bloques anteriores, obligando a generarlos en serie).
 * Como esto se calcula de antemano y es idéntico para todos los bloques, cada día puede lanzarse en
 * paralelo con el resto y aun así evitar solaparse en zona/temática con los demás, sin necesitar ver
 * su contenido final.
 */
function formatTripOverview(allDays, blockDayNumbers) {
  const others = (allDays ?? []).filter((day) => !blockDayNumbers.includes(day.day_number))
  if (others.length === 0) return ''
  const lines = others.map((day) => {
    const focus = [day.zone_focus, day.experience_focus?.length ? day.experience_focus.join('/') : null].filter(Boolean).join(' — ')
    return `  - Day ${day.day_number} (${day.city}): ${focus || 'general exploration'}`
  })
  return `

OTHER DAYS IN THIS TRIP (being written in parallel by separate calls — this is what each one is focused on, so you can naturally avoid overlapping the same restaurants/themes without seeing their final content):
${lines.join('\n')}`
}

function buildDayBlockUserPrompt(destination, answers, transportContext, blockDays, placesForBlock, allDays, isFirstBlockOfTrip) {
  return `Fill in the stops and meals for this block of days (the trip's overall shape, and each "city" day's exact place list, are already decided — just enrich exactly these days):
${formatSkeletonDays(blockDays)}

Trip context:
- Destination: ${destination}${isFirstBlockOfTrip ? `\n- Arrival transport (phase 1 — how to arrive, NOT how to move around at destination): ${formatArrivalTransport(transportContext?.transport_option)}` : ''}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Experience focus: ${formatExperiences(answers.experiences)}
- Pace: ${PACE_LABEL[answers.pace] ?? answers.pace}
- Schedule: ${CHRONOTYPE_LABEL[answers.chronotype] ?? answers.chronotype}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${buildArchetypeContext(transportContext)}${formatRequiredPlaces(placesForBlock)}${formatTripOverview(allDays, blockDays.map((day) => day.day_number))}`
}

function sanitizeCityTransitionLeg(leg) {
  const asLabel = (value) => (typeof value === 'string' ? value.slice(0, 200) : '')
  return {
    feasible: Boolean(leg?.feasible),
    duration_label: asLabel(leg?.duration_label),
    price_label: asLabel(leg?.price_label),
  }
}

/**
 * Solo presente cuando archetype es multidestino_tren_o_vuelo (ver buildArchetypeContext) — hechos
 * de cada tramo entre ciudades de la ruta ya generada, mismo espíritu que sanitizeFeasibilityLeg
 * (Paso A) pero con "recommended" como campo único a nivel de tramo, no por vía.
 */
function sanitizeCityTransitions(raw) {
  return raw
    .filter((entry) => entry && typeof entry.day_number === 'number' && typeof entry.from_city === 'string' && typeof entry.to_city === 'string')
    .slice(0, 30)
    .map((entry) => {
      const recommended = ['train', 'flight', 'bus'].includes(entry.recommended) ? entry.recommended : null
      return {
        day_number: entry.day_number,
        from_city: entry.from_city.slice(0, 100),
        to_city: entry.to_city.slice(0, 100),
        train: sanitizeCityTransitionLeg(entry.train),
        flight: sanitizeCityTransitionLeg(entry.flight),
        bus: sanitizeCityTransitionLeg(entry.bus),
        recommended,
        pass_covers_leg: entry.pass_covers_leg !== false,
      }
    })
}

const PHASE_TYPES = new Set(['urbana', 'naturaleza', 'isla'])
const PHASE_RECOMMENDED_VALUES = new Set(['train', 'flight', 'bus', 'ferry', 'transfer', 'roadtrip'])

/** Igual que sanitizeCityTransitionLeg, pero con feasible permisivo por defecto (true salvo que Claude diga explícitamente false) — para transfer_organizado, que el prompt describe como "casi siempre viable". */
function sanitizePermissiveLeg(leg) {
  const asLabel = (value) => (typeof value === 'string' ? value.slice(0, 200) : '')
  return {
    feasible: leg?.feasible !== false,
    duration_label: asLabel(leg?.duration_label),
    price_label: asLabel(leg?.price_label),
  }
}

/**
 * Solo presente cuando archetype es multidestino_mixto_o_circuito (ver buildArchetypeContext) —
 * hechos de cada tramo entre FASES de la ruta ya generada. Mismo espíritu que
 * sanitizeCityTransitions, pero el candidato relevante depende del tipo de cada fase (ver
 * `legKind` en src/lib/phaseTransitionTransport.ts) en vez de ser siempre tren/vuelo/autobús.
 */
function sanitizePhaseTransitions(raw) {
  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry.day_number === 'number' &&
        typeof entry.from_phase === 'string' &&
        typeof entry.to_phase === 'string' &&
        PHASE_TYPES.has(entry.from_phase_type) &&
        PHASE_TYPES.has(entry.to_phase_type),
    )
    .slice(0, 30)
    .map((entry) => ({
      day_number: entry.day_number,
      from_phase: entry.from_phase.slice(0, 100),
      to_phase: entry.to_phase.slice(0, 100),
      from_phase_type: entry.from_phase_type,
      to_phase_type: entry.to_phase_type,
      train: sanitizeCityTransitionLeg(entry.train),
      flight: sanitizeCityTransitionLeg(entry.flight),
      bus: sanitizeCityTransitionLeg(entry.bus),
      ferry: sanitizeCityTransitionLeg(entry.ferry),
      transfer_organizado: sanitizePermissiveLeg(entry.transfer_organizado),
      roadtrip_alquiler: {
        ...sanitizeCityTransitionLeg(entry.roadtrip_alquiler),
        // Permisivo en dirección contraria a los demás: la mayoría de destinos de este arquetipo
        // NO tienen cultura de camper/autocaravana, así que solo se activa si Claude lo dice explícitamente.
        apto_camper_autocaravana: Boolean(entry.roadtrip_alquiler?.apto_camper_autocaravana),
      },
      recommended: PHASE_RECOMMENDED_VALUES.has(entry.recommended) ? entry.recommended : null,
    }))
}

// ── Generación de ruta por fases encadenadas ────────────────────────────────
//
// Anclas → esqueleto → bloques de 3-4 días, en vez de una única llamada gigante — cada llamada
// queda muy por debajo de cualquier límite de tiempo de función serverless, sin importar cuántos
// días tenga el viaje. El frontend (routeGenerationOrchestrator.ts) encadena estas tres llamadas
// una tras otra y persiste el progreso en Supabase tras cada una — ver
// [[project_route_planner_route_generation_pipeline]] en memoria.

function readTransportContext(body) {
  const { archetype, is_region, transport_option, vehicle_type, vehicle_ownership, accommodation_mode, travel_mode, pase_dominante, travel_pass_confirmed } =
    body ?? {}
  return { archetype, is_region, transport_option, vehicle_type, vehicle_ownership, accommodation_mode, travel_mode, pase_dominante, travel_pass_confirmed }
}

function hasRequiredAnswers(answers) {
  return Boolean(
    answers?.origin && answers?.days && answers?.companion && Array.isArray(answers?.experiences) && answers?.pace && answers?.chronotype && answers?.budgetLevel,
  )
}

/** Categorías de lugar/experience_focus — ya no las usa un saneo de "anclas" (ver Fase 1, generate-day-places), solo sanitizeExperienceFocus (esqueleto) las sigue validando. */
const ANCHOR_CATEGORIES = new Set(['temple', 'museum', 'nature', 'viewpoint', 'neighborhood', 'market', 'park', 'landmark', 'experience', 'beach'])

// ── SISTEMA DE CACHÉ INTELIGENTE DE RUTAS ───────────────────────────────────────────────────
//
// Antes de lanzar el pipeline completo (anclas → esqueleto → bloques de días), se busca si ya
// existe una ruta generada antes para el MISMO destino con parámetros parecidos — si el parecido es
// alto, se reutiliza esa ruta como base y solo se le pide a Claude lo que cambia (mucho más barato y
// rápido que generar desde cero). Cada resultado (reutilizado con cambios, o nuevo de cero) se
// guarda SIEMPRE como una fila NUEVA de route_cache (nunca se sobreescribe una existente) — ver
// supabase/migrations/0008_route_cache.sql.
//
// Clave de coincidencia (punto 4 del prompt DEFINITIVO): destino (obligatorio) + días + ritmo_exacto
// + experiencias_positivas + experiencias_negativas. Los acompañantes NO forman parte de la clave —
// companion_id/edades/tamaño de grupo no cambian qué lugares visitar, solo el tono del contenido
// (ver formatCompanion), así que dos peticiones con las mismas experiencias/días/ritmo pero distinto
// acompañante SÍ deben coincidir al 100%.
function normalizeDestinationForMatch(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

// La columna `experiences text[]` de route_cache no cambió de esquema — el cliente codifica cada
// categoría positiva/negativa con un prefijo +/- (ver deriveExperienceCategoryIds/encodeExperienceCategories
// en el cliente) para no necesitar una migración de Supabase solo por esto. Una fila anterior al
// punto 4 (ids del banco de 18 sin prefijo) se decodifica como "sin opinión" en ambas listas —
// degrada con gracia en vez de romper, ver experienceCategoryScore.
function decodeExperienceCategories(encoded) {
  const positive = []
  const negative = []
  for (const entry of Array.isArray(encoded) ? encoded : []) {
    if (typeof entry !== 'string') continue
    if (entry.startsWith('+')) positive.push(entry.slice(1))
    else if (entry.startsWith('-')) negative.push(entry.slice(1))
  }
  return { positive, negative }
}

/**
 * Compara categoría a categoría (unión de todas las mencionadas en cualquiera de los dos lados):
 * misma polaridad en ambos (positiva-positiva o negativa-negativa) = coincide del todo en esa
 * dimensión; polaridad OPUESTA (positiva en un lado, negativa en el otro) = 0% en esa dimensión
 * concreta — petición explícita del usuario ("si una ruta cacheada tiene 'Museos' en positivo y la
 * nueva tiene 'Museos' en negativo, es 0% match en esa dimensión"); una parte tiene opinión formada
 * y la otra ninguna = coincidencia parcial (0.5), ni premia ni penaliza del todo.
 */
function experienceCategoryScore(rowPositive, rowNegative, queryPositive, queryNegative) {
  const allCategories = new Set([...rowPositive, ...rowNegative, ...queryPositive, ...queryNegative])
  if (allCategories.size === 0) return 1
  let total = 0
  for (const category of allCategories) {
    const rowState = rowPositive.includes(category) ? 1 : rowNegative.includes(category) ? -1 : 0
    const queryState = queryPositive.includes(category) ? 1 : queryNegative.includes(category) ? -1 : 0
    if (rowState === queryState) total += 1
    else if (rowState !== 0 && queryState !== 0) total += 0
    else total += 0.5
  }
  return total / allCategories.size
}

function daysMatchScore(a, b) {
  const diff = Math.abs(Number(a) - Number(b))
  if (diff === 0) return 1
  if (diff === 1) return 0.75
  if (diff === 2) return 0.5
  return 0
}

/**
 * Porcentaje de coincidencia (0-100) de una fila de route_cache contra la petición actual — pesos
 * exactos dados por el usuario: destino obligatorio (si no coincide, 0), experiencias 50%
 * (positivas+negativas por categoría, ver experienceCategoryScore), ritmo 25%, días 25% (igual=100%,
 * ±1=75%, ±2=50%, más=0%). El ritmo debe ser EXACTO para poder llegar a "alta" coincidencia (≥75%,
 * ver routeCacheLevel) — si no coincide, el resultado se limita a "medium" como mucho, aunque
 * experiencias/días coincidan perfectamente (misma petición explícita del punto 4).
 */
function computeRouteCacheMatch(row, query) {
  if (normalizeDestinationForMatch(row.destination) !== normalizeDestinationForMatch(query.destination)) return 0
  const rowCategories = decodeExperienceCategories(row.experiences)
  const queryCategories = decodeExperienceCategories(query.experiences)
  const expScore = experienceCategoryScore(rowCategories.positive, rowCategories.negative, queryCategories.positive, queryCategories.negative)
  const paceExact = row.pace === query.pace
  const daysScore = daysMatchScore(row.days, query.days)
  const score = Math.round((expScore * 0.5 + (paceExact ? 1 : 0) * 0.25 + daysScore * 0.25) * 100)
  return paceExact ? score : Math.min(score, 74)
}

/** 'high' → reutilizar 80-90% (solo ajustar lo que cambia); 'medium' → reutilizar 60-70% (redistribuir); 'none' → generación nueva completa. */
function routeCacheLevel(matchPct) {
  if (matchPct >= 75) return 'high'
  if (matchPct >= 50) return 'medium'
  return 'none'
}

// Umbral mínimo de cobertura de intocables para poder servir una fila de route_cache — encontrado en
// vivo (2026-09-17): una fila cacheada durante el desarrollo de esta misma sesión (con Arte y Museos
// en negativo) le faltaba Museos Vaticanos aunque es un intocable de Roma — el endpoint de reutilización
// (/api/regenerate-route-experiences) no conoce `intocables`/`theme`, así que Claude lo quitó por su
// cuenta sin esa protección (que SÍ existe, pero solo en el camino fresco — ver applyExperienceCategoryEffects/
// isIntocable). Esta validación es la red de seguridad genérica: cualquier fila que no cumpla el
// mínimo de cobertura se descarta ENTERA antes de poder ganar el matching, sin importar cuánto
// puntúe en destino/días/ritmo/experiencias — así una mejora futura del pipeline (un intocable nuevo,
// una regla nueva) invalida solas las filas viejas que ya no la cumplen, en vez de servirlas para
// siempre hasta el próximo borrado manual de caché.
const MIN_INTOCABLES_COVERAGE = 0.8

/** Sin `intocables` definidos para el destino (no está en el JSON curado, o el campo está vacío) no hay nada que validar — devuelve 1 (cobertura completa) para no bloquear esos casos, mismo criterio de "mejor pasarse de contenido que bloquear" que el resto del pipeline curado. */
function intocablesCoverageRatio(routeData, destData) {
  if (!Array.isArray(destData?.intocables) || destData.intocables.length === 0) return 1
  const stopNames = new Set((routeData?.days ?? []).flatMap((day) => (day.stops ?? []).map((stop) => stripAccentsLower(stop?.name ?? ''))))
  const covered = destData.intocables.filter((name) => stopNames.has(stripAccentsLower(name))).length
  return covered / destData.intocables.length
}

app.post('/api/route-cache/lookup', async (req, res) => {
  const { destination, days, experiences, pace } = req.body ?? {}
  if (!destination || !Number.isInteger(days) || !Array.isArray(experiences) || !pace) {
    res.status(400).json({ error: 'Se requiere destination, days, experiences y pace.' })
    return
  }
  // Pipeline v2 (algoritmo JS puro, gratis e instantáneo, ver routeAlgorithm.js) no necesita
  // caché — generar de cero cuesta lo mismo que reutilizar. Además, esta misma sesión encontró
  // dos veces bugs reales de contenido obsoleto servido desde route_cache; mejor no reabrir esa
  // superficie aquí. `days > 5` sigue consultando caché normal — cae al pipeline curado antiguo.
  if (days <= 5 && findPipelineV2Data(destination)) {
    res.json({ level: 'none', entry: null, match_pct: 0 })
    return
  }
  if (!supabaseAdmin) {
    res.json({ level: 'none', entry: null, match_pct: 0 })
    return
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('route_cache')
      .select('id, destination, days, experiences, pace, route_data, hit_count')
      .ilike('destination', destination)
      .limit(50)
    if (error) throw error

    const destData = findDestinationData(destination)
    let best = null
    let bestScore = -1
    for (const row of data ?? []) {
      const score = computeRouteCacheMatch(row, { destination, days, experiences, pace })
      if (score <= bestScore) continue
      // Fila descartada del todo si no cubre el mínimo de intocables — nunca gana el matching, sin
      // importar cuánto puntúe en el resto (ver MIN_INTOCABLES_COVERAGE más arriba).
      if (destData && intocablesCoverageRatio(row.route_data, destData) < MIN_INTOCABLES_COVERAGE) continue
      bestScore = score
      best = row
    }

    const level = best ? routeCacheLevel(bestScore) : 'none'
    if (level === 'none' || !best) {
      res.json({ level: 'none', entry: null, match_pct: Math.max(bestScore, 0) })
      return
    }

    res.json({
      level,
      match_pct: bestScore,
      entry: { id: best.id, days: best.days, experiences: best.experiences, pace: best.pace, route_data: best.route_data },
    })
  } catch (error) {
    logAnthropicError('route-cache/lookup', error)
    // Best-effort — si falla la búsqueda de caché, se sigue con generación completa normal, nunca
    // se bloquea al viajero por esto.
    res.json({ level: 'none', entry: null, match_pct: 0 })
  }
})

app.post('/api/route-cache/touch', async (req, res) => {
  const { id } = req.body ?? {}
  if (!id || !supabaseAdmin) {
    res.json({ ok: false })
    return
  }
  try {
    const { data, error } = await supabaseAdmin.from('route_cache').select('hit_count').eq('id', id).maybeSingle()
    if (error) throw error
    const { error: updateError } = await supabaseAdmin
      .from('route_cache')
      .update({ hit_count: (data?.hit_count ?? 1) + 1, last_used_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) throw updateError
    res.json({ ok: true })
  } catch (error) {
    logAnthropicError('route-cache/touch', error)
    res.json({ ok: false })
  }
})

app.post('/api/route-cache/save', async (req, res) => {
  const { destination, days, experiences, pace, route_data: routeData } = req.body ?? {}
  if (!destination || !Number.isInteger(days) || !Array.isArray(experiences) || !pace || !routeData || !supabaseAdmin) {
    res.json({ ok: false })
    return
  }
  try {
    // SIEMPRE inserta una fila nueva — nunca actualiza/sobreescribe una existente, ver el
    // comentario grande al principio de esta sección. El cliente Supabase NO lanza en un error de
    // Postgrest (a diferencia de un fetch normal) — hay que comprobar `error` explícitamente, o un
    // insert fallido (ej. la tabla no existe todavía) se reporta como éxito por error.
    const { error } = await supabaseAdmin.from('route_cache').insert({ destination, days, experiences, pace, route_data: routeData })
    if (error) throw error
    res.json({ ok: true })
  } catch (error) {
    logAnthropicError('route-cache/save', error)
    res.json({ ok: false })
  }
})

/** Vista compacta de una parada ya generada — lo mínimo que Claude necesita para decidir qué quitar/mantener, sin gastar tokens en tips/entry_options/travel_to_next que no hacen falta para esta decisión. */
function compactStopForCache(stop) {
  return {
    id: stop.id,
    name: stop.name,
    category: stop.category,
    category_label: stop.category_label,
    suggested_time: stop.suggested_time,
    duration_minutes: stop.duration_minutes,
  }
}

const ROUTE_CACHE_EXPERIENCES_SYSTEM_PROMPT = `You are an expert travel route planner adjusting an EXISTING, already-verified itinerary for a traveler whose chosen experience focus changed slightly — your job is ONLY to identify which existing stops no longer fit and which new stops should fill the resulting gaps. Do NOT rewrite the whole itinerary, do NOT touch days/stops that are not affected by the change.

LANGUAGE — every text field you write must be in Spanish.

CRITICAL RULES (same standards as generating from scratch):
- Every new place MUST be real and currently open/accessible, and MUST NOT already exist elsewhere in this itinerary
- "name" is ONLY the clean official Spanish name — no parentheses, no advice, no timing context (see PLACE NAMES below)
- NEVER add a restaurant/meal as a stop — this itinerary's meals are handled separately, not shown to you
- New stops must fit realistically into the existing schedule of the day you assign them to (geography, time of day, real opening hours) — never earlier than a place's own real opening time
- Tips (1-3 sentences) only when genuinely high-value: combined tickets, partial free access, strategic timing, real logistics — empty string if nothing genuinely good, never generic filler

PLACE NAMES: "name" is ONLY the clean official name of the place in Spanish, no parentheses/advice/timing notes — e.g. "Coliseo" not "Colosseo (sin colas por la mañana)".

WHAT TO REMOVE: the traveler no longer wants these experience categories: {{removed}}. Look at the existing stops (given below, grouped by day) and identify which ones were clearly chosen FOR one of those categories — remove ONLY those, keep everything else untouched, including stops that could arguably fit multiple categories but still make sense on their own merit.

WHAT TO ADD: the traveler now wants these experience categories: {{added}}. Add new real stops for these, fitting them into the gaps left by whatever you removed (or genuinely free time in the existing schedule) — do not just append them at the end of the day, place them at a realistic suggested_time.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "removed_stop_ids": ["exact id from the existing itinerary given to you"],
  "new_stops": [
    {
      "day_number": 2,
      "id": "unique-id",
      "name": "Clean official place name, in Spanish",
      "description": "2 sentences max, in Spanish",
      "tip": "1-3 sentences, in Spanish, empty string if nothing genuinely good",
      "suggested_time": "HH:MM",
      "duration_minutes": 90,
      "latitude": 00.0000,
      "longitude": 00.0000,
      "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
      "category_label": "Short SPECIFIC place type in Spanish, e.g. 'Anfiteatro histórico', 'Museo de arte'",
      "hours": "Real opening hours 'HH:MM–HH:MM', or null only for genuinely free-standing no-ticket places",
      "entry_fee": "€X or Free"
    }
  ]
}
If nothing genuinely needs removing, return an empty "removed_stop_ids". If nothing genuinely valuable can be added, return an empty "new_stops" — never force a mediocre addition just to fill the categories.`

function buildRouteCacheExperiencesPrompt(destination, days, removedLabel, addedLabel) {
  const dayLines = days
    .map((day) => {
      const stopLines = (day.stops ?? [])
        .map((stop) => `    - id="${stop.id}" ${stop.suggested_time ?? '??:??'} "${stop.name}" (${stop.category_label ?? stop.category ?? 'sin categoría'})`)
        .join('\n')
      return `Día ${day.day_number} (${day.city ?? destination}, tipo ${day.type ?? 'city'}):\n${stopLines || '    (sin paradas)'}`
    })
    .join('\n\n')

  return `Destino: "${destination}"

Itinerario existente:
${dayLines}

Categorías que el viajero YA NO quiere: ${removedLabel || '(ninguna)'}
Categorías NUEVAS que el viajero quiere: ${addedLabel || '(ninguna)'}`
}

function sanitizeRouteCacheNewStop(entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) return null
  if (!Number.isInteger(entry.day_number)) return null
  if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') return null
  return entry
}

/** Título legible de cada categoría (EXPERIENCE_CATEGORY_BANK) para el prompt de diff del punto 4 — ver formatExperiences para el equivalente del banco de 18. */
function formatExperienceCategoryLabels(categoryIds) {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) return '(ninguna)'
  return categoryIds.map((id) => EXPERIENCE_CATEGORY_BANK.find((entry) => entry.id === id)?.title ?? id).join(', ')
}

app.post('/api/regenerate-route-experiences', async (req, res) => {
  const { destination, days, old_experiences: oldExperiences, new_experiences: newExperiences } = req.body ?? {}
  if (!destination || !Array.isArray(days) || !Array.isArray(oldExperiences) || !Array.isArray(newExperiences)) {
    res.status(400).json({ error: 'Se requiere destination, days, old_experiences y new_experiences.' })
    return
  }

  // old_experiences/new_experiences llegan codificados +/- (mismo formato que route_cache, ver
  // decodeExperienceCategories) — "removido" es una categoría que perdió su Me interesa O ganó un
  // No recomiendes nuevo; "añadido" es una categoría que ganó Me interesa. Perder un No recomiendes
  // (pasar a neutra) no dispara ninguna acción por sí solo, ver el propio ROUTE_CACHE_EXPERIENCES_SYSTEM_PROMPT.
  const oldCategories = decodeExperienceCategories(oldExperiences)
  const newCategories = decodeExperienceCategories(newExperiences)
  const removed = [
    ...new Set([
      ...oldCategories.positive.filter((id) => !newCategories.positive.includes(id)),
      ...newCategories.negative.filter((id) => !oldCategories.negative.includes(id)),
    ]),
  ]
  const added = [...new Set(newCategories.positive.filter((id) => !oldCategories.positive.includes(id)))]

  // Nada cambió en las experiencias (el ±1 día o el ritmo fueron lo único distinto) — reutilización
  // gratis, sin gastar nada en Claude.
  if (removed.length === 0 && added.length === 0) {
    res.json({ removed_stop_ids: [], new_stops: [] })
    return
  }

  const compactDays = days.map((day) => ({ ...day, stops: (day.stops ?? []).map(compactStopForCache) }))

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: ROUTE_CACHE_EXPERIENCES_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildRouteCacheExperiencesPrompt(destination, compactDays, formatExperienceCategoryLabels(removed), formatExperienceCategoryLabels(added)) },
      ],
    })
    logCallCost('regenerate-route-experiences', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    let removedStopIds = Array.isArray(parsed?.removed_stop_ids) ? parsed.removed_stop_ids.filter((id) => typeof id === 'string') : []
    const newStops = Array.isArray(parsed?.new_stops) ? parsed.new_stops.map(sanitizeRouteCacheNewStop).filter(Boolean) : []

    // Este endpoint no conoce `intocables`/`theme` (solo ve name/category/hora, ver compactStopForCache)
    // — a diferencia del camino fresco (applyExperienceCategoryEffects/isIntocable), aquí Claude podía
    // quitar un intocable real por su cuenta (encontrado en vivo: Museos Vaticanos desaparecido tras
    // pedir Arte y Museos en negativo). Bloqueo a nivel de código, no de prompt — nunca se confía en
    // que el prompt baste para una regla "nunca".
    const destData = findDestinationData(destination)
    if (destData) {
      const idsToName = new Map(days.flatMap((day) => (day.stops ?? []).map((stop) => [stop.id, stop.name])))
      removedStopIds = removedStopIds.filter((id) => {
        const name = idsToName.get(id)
        if (name && isIntocable(name, destData)) {
          console.log(`[regenerate-route-experiences] "${name}" es intocable de "${destination}" — se ignora la eliminación pedida por Claude`)
          return false
        }
        return true
      })
    }

    res.json({ removed_stop_ids: removedStopIds, new_stops: newStops })
  } catch (error) {
    logAnthropicError('regenerate-route-experiences', error)
    res.status(502).json({ error: 'No se pudo ajustar la ruta cacheada con IA.' })
  }
})

const ROUTE_CACHE_REDISTRIBUTE_SYSTEM_PROMPT = `You are an expert travel route planner. You already have a POOL of real, previously-verified stops for this exact destination (from an earlier trip planned for a similar traveler) — your job is to build a fresh day-by-day itinerary for the traveler's NEW request, reusing as many pool stops as genuinely fit, and only inventing new ones to cover what the pool doesn't. Reusing verified stops instead of re-researching everything from scratch is the whole point — lean on the pool wherever it reasonably fits the new day count/pace/experience focus.

${DAY_BLOCK_SYSTEM_PROMPT.split('RESPOND ONLY IN VALID JSON')[0].split('\n').slice(2).join('\n')}

OVERRIDE — ignore the "REQUIRED PLACES" instruction above: it describes a different pipeline where the place list is pre-decided elsewhere. Here there is no such list — you decide which stops go on which day yourself, from the POOL and your own knowledge, exactly as instructed at the top of this prompt.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation) — same shape as a normal itinerary, covering EVERY day from 1 to the "Días de contenido a generar" number given to you (never more, never fewer — the trip's actual final travel-home day is added separately afterward, you never generate it):

{
  "days": [
    {
      "day_number": 1,
      "type": "city|road|excursion|relax",
      "title": "Short evocative title, in Spanish",
      "stops": [ /* same stop shape as usual — see the pool below for the fields available on reused stops */ ],
      "meals": [ { "time": "breakfast|lunch|dinner", "options": [ { "name": "Real Restaurant Name", "price_level": "€|€€|€€€", "cuisine": "Type, in Spanish", "description": "in Spanish", "price_range": "€X-€X per person", "latitude": 00.0000, "longitude": 00.0000 } ] } ],
      "rainy_alternative": "in Spanish"
    }
  ],
  "not_included": [],
  "excursions_available": []
}`

function buildRouteCacheRedistributePrompt(destination, answers, contentDays, pool) {
  const poolLines = pool
    .map(
      (stop) =>
        `- "${stop.name}" (${stop.category_label ?? stop.category ?? 'sin categoría'}, ${stop.duration_minutes ?? '?'}min${stop.hours ? `, horario ${stop.hours}` : ''}) — ${stop.description ?? ''}`,
    )
    .join('\n')

  return `Destino: "${destination}"
Días de contenido a generar: ${contentDays}
Ritmo: ${PACE_LABEL[answers.pace] ?? answers.pace}
Experiencias elegidas: ${formatExperiences(answers.experiences)}
Acompañantes: ${formatCompanion(answers)}

Pool de paradas ya verificadas de una ruta anterior a este destino:
${poolLines || '(pool vacío — genera todo de cero)'}`
}

app.post('/api/regenerate-route-redistribute', async (req, res) => {
  const { destination, answers, known_stops: knownStops } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers) || !Array.isArray(knownStops)) {
    res.status(400).json({ error: 'Se requiere destination, answers y known_stops.' })
    return
  }
  // Un solo call cubre TODOS los días de golpe (a diferencia del pipeline normal, que los reparte en
  // bloques en paralelo) — manejable para viajes cortos/medios, pero por encima de este tamaño el
  // riesgo de una respuesta cortada/lenta supera el ahorro; el llamador debe caer al pipeline normal.
  if (answers.days > 7) {
    res.status(400).json({ error: 'Redistribución de caché limitada a viajes de hasta 7 días.' })
    return
  }
  // "1 día generado = 1 noche" (ver appendReturnLegDay en tripDays.ts) — EXACTAMENTE la misma
  // convención que generate-skeleton/generate-day-block: el último día (regreso al origen) es
  // sintético, nunca lo genera Claude, y mapGeneratedRouteToRoute lo añade solo si hacen falta más
  // días para llegar a answers.days. Pedirle a Claude answers.days días completos aquí (en vez de
  // answers.days-1) fue un bug real: mapGeneratedRouteToRoute nunca añadía el día de vuelta al ver
  // que ya había "suficientes" días, y algo aguas abajo de esa forma resultante rompía en silencio
  // (tryRouteCacheReuse lo capturaba con un catch mudo, cayendo al pipeline completo sin avisar).
  const contentDays = Math.max(answers.days - 1, 1)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: ROUTE_CACHE_REDISTRIBUTE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildRouteCacheRedistributePrompt(destination, answers, contentDays, knownStops) }],
    })
    logCallCost('regenerate-route-redistribute', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeDayBlockDays(
      parsed?.days,
      Array.from({ length: contentDays }, (_, index) => index + 1),
    )
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos')

    for (const day of days) {
      filterFreeTourDuplicateStops(day)
      filterMealLikeStops(day)
      validateStopHours(day)
    }

    res.json({
      days,
      not_included: Array.isArray(parsed?.not_included) ? parsed.not_included : [],
      excursions_available: Array.isArray(parsed?.excursions_available) ? parsed.excursions_available : [],
    })
  } catch (error) {
    logAnthropicError('regenerate-route-redistribute', error)
    res.status(502).json({ error: 'No se pudo redistribuir la ruta cacheada con IA.' })
  }
})

const SKELETON_DAY_TYPES = new Set(['city', 'road', 'excursion', 'relax'])
const SKELETON_PHASE_TYPES = new Set(['urbana', 'naturaleza', 'isla'])

function sanitizeExperienceFocus(raw) {
  if (!Array.isArray(raw)) return []
  const values = raw.filter((value) => typeof value === 'string' && ANCHOR_CATEGORIES.has(value))
  return [...new Set(values)].slice(0, 4)
}

function sanitizeNameList(raw) {
  if (!Array.isArray(raw)) return []
  const names = raw.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim().slice(0, 150))
  return [...new Set(names)].slice(0, 20)
}

function sanitizeSkeletonDays(raw, destination, totalDays) {
  if (!Array.isArray(raw)) return []
  const byDayNumber = new Map()
  for (const entry of raw) {
    const dayNumber = Number(entry?.day_number)
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > totalDays) continue
    byDayNumber.set(dayNumber, {
      day_number: dayNumber,
      type: SKELETON_DAY_TYPES.has(entry.type) ? entry.type : 'city',
      city: typeof entry.city === 'string' && entry.city.trim() ? entry.city.trim().slice(0, 100) : destination,
      country_code: typeof entry.country_code === 'string' && entry.country_code.trim() ? entry.country_code.trim().slice(0, 2).toLowerCase() : null,
      phase_type: SKELETON_PHASE_TYPES.has(entry.phase_type) ? entry.phase_type : undefined,
      zone_focus: typeof entry.zone_focus === 'string' && entry.zone_focus.trim() ? entry.zone_focus.trim().slice(0, 150) : undefined,
      experience_focus: sanitizeExperienceFocus(entry.experience_focus),
    })
  }
  // Rellena cualquier día que Claude se haya dejado sin definir (no debería pasar, pero un esqueleto
  // incompleto rompería los pasos que vienen después) repitiendo el día anterior más cercano.
  const days = []
  let lastKnown = null
  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber++) {
    const found = byDayNumber.get(dayNumber)
    const day = found ?? {
      ...(lastKnown ?? { type: 'city', city: destination, country_code: null }),
      day_number: dayNumber,
      zone_focus: undefined,
      experience_focus: [],
    }
    days.push(day)
    lastKnown = day
  }
  return days
}

/**
 * A5: red de seguridad server-side — el prompt (ver regla MANDATORY en SKELETON_SYSTEM_PROMPT) ya le
 * pide a Claude un día "excursion" obligatorio (4+ días → 1, 6+ días → 2, entre el día 3 y el 5,
 * nunca el primero ni el último), pero si no lo cumple esto lo fuerza convirtiendo el "city" más
 * adecuado en ese rango — nunca deja que la excursión automática dependa solo de que el prompt se
 * haya seguido.
 */
function ensureExcursionDays(days, totalDays) {
  if (totalDays < 4) return days
  const neededExcursions = totalDays >= 6 ? 2 : 1
  const existing = days.filter((day) => day.type === 'excursion').length
  let stillNeeded = neededExcursions - existing
  if (stillNeeded <= 0) return days

  const lastDay = totalDays
  const rangeEnd = Math.min(5, lastDay - 1)
  const inRange = days.filter((day) => day.day_number >= 3 && day.day_number <= rangeEnd && day.type === 'city')
  // Si no hay suficientes candidatos "city" en el rango ideal (día 3-5), se amplía a cualquier día
  // "city" que no sea el primero ni el último — mejor una excursión fuera del rango ideal que ninguna.
  const anyCity = days.filter((day) => day.type === 'city' && day.day_number !== 1 && day.day_number !== lastDay)
  const pool = inRange.length > 0 ? inRange : anyCity

  for (const day of pool) {
    if (stillNeeded <= 0) break
    day.type = 'excursion'
    stillNeeded -= 1
  }
  return days
}

/**
 * Cómo se mueve de verdad el viajero entre dos paradas de ESTE destino cuando ir a pie deja de tener
 * sentido: `"public"` (metro/bus) o `"car"`. Sale del JSON del destino (`default_transport`, tanto en
 * data/pipeline_v2/*.json como en los 20 curados de data/destinations.json); cualquier destino sin
 * dato cae a `"public"`, que es lo razonable para una ciudad. Viaja con la ruta (ver `Route.defaultTransport`)
 * para que DIAS pueda elegir qué enseñar en cada hueco sin volver a preguntar al servidor.
 */
function resolveDefaultTransport(destination) {
  const fromPipelineV2 = findPipelineV2Data(destination)?.default_transport
  if (fromPipelineV2 === 'car' || fromPipelineV2 === 'public') return fromPipelineV2
  const fromCurated = findDestinationData(destination)?.default_transport
  if (fromCurated === 'car' || fromCurated === 'public') return fromCurated
  return 'public'
}

app.post('/api/generate-skeleton', async (req, res) => {
  const { destination, answers } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers)) {
    res.status(400).json({ error: 'Faltan preferencias del usuario necesarias para generar la ruta.' })
    return
  }

  const transportContext = readTransportContext(req.body)
  const totalDays = Number(answers.days) > 0 ? Number(answers.days) : 1
  const defaultTransport = resolveDefaultTransport(destination)

  // Pipeline v2 (algoritmo JS puro, ver routeAlgorithm.js) — solo Roma por ahora, y solo hasta 5
  // días (zone_distribution no cubre más). Fuera de ese rango, o para cualquier otro destino,
  // buildSkeletonV2 devuelve null y se sigue exactamente con el camino de Claude de siempre.
  const pipelineV2Data = findPipelineV2Data(destination)
  if (pipelineV2Data) {
    const skeletonV2 = buildSkeletonV2(pipelineV2Data, totalDays, hasFreeTourFromAnswers(answers))
    if (skeletonV2) {
      console.log(`[pipeline-v2] "${destination}" — esqueleto resuelto con el algoritmo JS, sin llamada a Claude`)
      res.json({ ...skeletonV2, default_transport: defaultTransport })
      return
    }
  }

  const t0 = Date.now()
  console.log(`[timing] generate-skeleton START ${new Date(t0).toISOString()} (totalDays=${totalDays})`)
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SKELETON_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildSkeletonUserPrompt(destination, answers, transportContext) }],
    })
    console.log(`[timing] generate-skeleton END — ${Date.now() - t0}ms`)
    logCallCost('generate-skeleton', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeSkeletonDays(parsed?.days, destination, totalDays)
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos')
    ensureExcursionDays(days, totalDays)

    res.json({
      summary: typeof parsed?.summary === 'string' ? parsed.summary.slice(0, 300) : '',
      estimated_budget: parsed?.estimated_budget && typeof parsed.estimated_budget === 'object' ? parsed.estimated_budget : undefined,
      days,
      city_transitions: Array.isArray(parsed?.city_transitions) ? sanitizeCityTransitions(parsed.city_transitions) : undefined,
      phase_transitions: Array.isArray(parsed?.phase_transitions) ? sanitizePhaseTransitions(parsed.phase_transitions) : undefined,
      default_transport: defaultTransport,
    })
  } catch (error) {
    console.log(`[timing] generate-skeleton FAILED — ${Date.now() - t0}ms`)
    logAnthropicError('generate-skeleton', error)
    res.status(502).json({ error: 'No se pudo definir la forma del viaje con IA.' })
  }
})

const PLACE_TYPES = new Set(['interior_largo', 'interior_corto', 'exterior'])
const DEFAULT_DURATION_BY_TYPE = { interior_largo: 120, interior_corto: 45, exterior: 20 }

function sanitizeDayPlaceEntry(raw) {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) return null
  const type = PLACE_TYPES.has(raw.type) ? raw.type : 'interior_corto'
  const rawDuration = Number(raw.duration_min)
  const duration_min = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.min(Math.round(rawDuration), 240) : DEFAULT_DURATION_BY_TYPE[type]
  return { name: raw.name.trim().slice(0, 150), type, duration_min }
}

/**
 * Para los destinos más populares, la Fase 1 (Claude) puede fallar por pura variabilidad
 * probabilística en incluir el hito más icónico del destino (visto en vivo: el Museo del Louvre
 * desapareció de las 3 listas de un viaje entero a París) — en vez de perseguir el 100% de
 * determinismo a base de más prompt, se verifica la respuesta de Claude contra esta lista
 * hardcodeada de imprescindibles absolutos DESPUÉS de recibirla (nunca la sustituye, solo la
 * completa si falta algo). `zoneHints` ayuda a elegir el día más lógico por palabras del zone_focus
 * del esqueleto (ver findNeverMissLandmarks/enforceNeverMissLandmarks más abajo); sin coincidencia,
 * va al primer día "city" elegible — mismo punto ciego que el resto de mecanismos de "dónde meterlo
 * si no hay señal geográfica mejor" de este archivo (topUpUnassignedNames en su día, etc.).
 */
const NEVER_MISS_LANDMARKS = [
  {
    aliases: ['roma', 'rome'],
    landmarks: [
      { name: 'Coliseo', type: 'interior_largo', duration_min: 120, zoneHints: ['coliseo', 'colosseo', 'foro', 'imperial', 'palatino'] },
      { name: 'Museos Vaticanos', type: 'interior_largo', duration_min: 180, zoneHints: ['vaticano'] },
      { name: 'Basílica de San Pedro', type: 'interior_largo', duration_min: 90, zoneHints: ['vaticano', 'pedro'] },
      { name: 'Panteón', type: 'interior_largo', duration_min: 45, zoneHints: ['centro', 'storico', 'navona', 'trevi'] },
      { name: 'Fontana di Trevi', type: 'exterior', duration_min: 30, zoneHints: ['centro', 'storico', 'navona', 'trevi'] },
      { name: 'Foro Romano', type: 'interior_largo', duration_min: 90, zoneHints: ['coliseo', 'colosseo', 'foro', 'imperial'] },
    ],
  },
  {
    aliases: ['paris', 'parís'],
    landmarks: [
      { name: 'Torre Eiffel', type: 'interior_largo', duration_min: 120, zoneHints: ['eiffel', 'trocadero', 'invalides'] },
      { name: 'Museo del Louvre', type: 'interior_largo', duration_min: 180, zoneHints: ['cite', 'louvre', 'tullerias', 'sena'] },
      { name: 'Catedral de Notre-Dame', type: 'exterior', duration_min: 30, zoneHints: ['cite', 'sena', 'marais'] },
      { name: 'Arco de Triunfo', type: 'interior_largo', duration_min: 60, zoneHints: ['eiffel', 'champs', 'eliseos', 'etoile'] },
      { name: 'Basílica del Sagrado Corazón', type: 'interior_corto', duration_min: 40, zoneHints: ['montmartre'] },
      { name: 'Museo de Orsay', type: 'interior_largo', duration_min: 150, zoneHints: ['sena', 'germain', 'eiffel'] },
    ],
  },
  {
    aliases: ['londres', 'london'],
    landmarks: [
      { name: 'Torre de Londres', type: 'interior_largo', duration_min: 120, zoneHints: ['torre', 'city', 'tamesis', 'thames'] },
      { name: 'Palacio de Buckingham', type: 'exterior', duration_min: 30, zoneHints: ['buckingham', 'westminster', 'james'] },
      { name: 'Abadía de Westminster', type: 'interior_largo', duration_min: 90, zoneHints: ['westminster'] },
      { name: 'Big Ben', type: 'exterior', duration_min: 15, zoneHints: ['westminster'] },
      { name: 'Museo Británico', type: 'interior_largo', duration_min: 150, zoneHints: ['bloomsbury', 'covent', 'soho'] },
      { name: 'London Eye', type: 'interior_corto', duration_min: 45, zoneHints: ['westminster', 'tamesis', 'thames', 'southbank'] },
    ],
  },
  {
    aliases: ['barcelona'],
    landmarks: [
      { name: 'Sagrada Familia', type: 'interior_largo', duration_min: 90, zoneHints: ['sagrada', 'eixample'] },
      { name: 'Parque Güell', type: 'interior_largo', duration_min: 90, zoneHints: ['guell', 'gracia'] },
      { name: 'Casa Batlló', type: 'interior_largo', duration_min: 75, zoneHints: ['eixample', 'gracia', 'batllo'] },
      { name: 'La Pedrera', type: 'interior_corto', duration_min: 60, zoneHints: ['eixample', 'gracia'] },
      { name: 'Barrio Gótico', type: 'exterior', duration_min: 60, zoneHints: ['gotico', 'born', 'rambla'] },
      { name: 'La Rambla', type: 'exterior', duration_min: 40, zoneHints: ['rambla', 'gotico', 'raval'] },
    ],
  },
  {
    aliases: ['lisboa', 'lisbon'],
    landmarks: [
      { name: 'Torre de Belém', type: 'interior_corto', duration_min: 45, zoneHints: ['belem'] },
      { name: 'Monasterio de los Jerónimos', type: 'interior_largo', duration_min: 90, zoneHints: ['belem'] },
      { name: 'Castillo de San Jorge', type: 'interior_largo', duration_min: 90, zoneHints: ['alfama', 'castelo'] },
      { name: 'Alfama', type: 'exterior', duration_min: 60, zoneHints: ['alfama', 'castelo'] },
      { name: 'Plaza del Comercio', type: 'exterior', duration_min: 25, zoneHints: ['baixa', 'chiado', 'comercio'] },
      { name: 'Elevador de Santa Justa', type: 'interior_corto', duration_min: 20, zoneHints: ['baixa', 'chiado'] },
    ],
  },
  {
    aliases: ['amsterdam', 'ámsterdam'],
    landmarks: [
      { name: 'Casa de Ana Frank', type: 'interior_largo', duration_min: 75, zoneHints: ['jordaan', 'canales', 'grachten'] },
      { name: 'Rijksmuseum', type: 'interior_largo', duration_min: 150, zoneHints: ['museumplein', 'museos'] },
      { name: 'Museo Van Gogh', type: 'interior_largo', duration_min: 120, zoneHints: ['museumplein', 'museos'] },
      { name: 'Plaza Dam', type: 'exterior', duration_min: 20, zoneHints: ['dam', 'centro'] },
      { name: 'Canales de Ámsterdam', type: 'exterior', duration_min: 40, zoneHints: ['canales', 'grachten', 'jordaan'] },
      { name: 'Mercado de Flores Bloemenmarkt', type: 'exterior', duration_min: 25, zoneHints: ['centro', 'dam'] },
    ],
  },
  {
    aliases: ['nueva york', 'new york', 'nyc'],
    landmarks: [
      { name: 'Estatua de la Libertad', type: 'interior_largo', duration_min: 150, zoneHints: ['libertad', 'liberty', 'battery', 'financiero'] },
      { name: 'Central Park', type: 'exterior', duration_min: 60, zoneHints: ['central park', 'upper'] },
      { name: 'Times Square', type: 'exterior', duration_min: 20, zoneHints: ['times square', 'midtown'] },
      { name: 'Empire State Building', type: 'interior_largo', duration_min: 75, zoneHints: ['midtown'] },
      { name: 'Museo Metropolitano de Arte', type: 'interior_largo', duration_min: 150, zoneHints: ['upper', 'central park', 'met'] },
      { name: 'Puente de Brooklyn', type: 'exterior', duration_min: 40, zoneHints: ['brooklyn', 'financiero', 'dumbo'] },
    ],
  },
  {
    aliases: ['tokio', 'tokyo'],
    landmarks: [
      { name: 'Templo Senso-ji', type: 'interior_corto', duration_min: 45, zoneHints: ['asakusa'] },
      { name: 'Cruce de Shibuya', type: 'exterior', duration_min: 20, zoneHints: ['shibuya'] },
      { name: 'Torre de Tokio', type: 'interior_corto', duration_min: 45, zoneHints: ['minato', 'roppongi', 'shiba'] },
      { name: 'Santuario Meiji', type: 'exterior', duration_min: 45, zoneHints: ['harajuku', 'shibuya', 'meiji'] },
      { name: 'Palacio Imperial', type: 'exterior', duration_min: 45, zoneHints: ['chiyoda', 'imperial'] },
      { name: 'Barrio de Akihabara', type: 'exterior', duration_min: 45, zoneHints: ['akihabara'] },
    ],
  },
]

function stripAccentsLower(value) {
  return typeof value === 'string' ? value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : ''
}

/** Coincidencia por palabra completa para alias de una palabra (evita falsos positivos tipo "Romania" conteniendo "roma"); los alias de dos o más palabras ("nueva york") se buscan como substring literal, sin ese riesgo. */
function findNeverMissLandmarks(destination) {
  const norm = stripAccentsLower(destination)
  if (!norm) return null
  const words = new Set(norm.split(/[^a-z]+/).filter(Boolean))
  for (const entry of NEVER_MISS_LANDMARKS) {
    for (const alias of entry.aliases) {
      const isMultiWord = alias.includes(' ')
      if (isMultiWord ? norm.includes(alias) : words.has(alias)) return entry.landmarks
    }
  }
  return null
}

/**
 * Después de que Fase 1 (Claude) devuelva su lista, se comprueba contra NEVER_MISS_LANDMARKS (si el
 * destino es uno de los cubiertos) — cualquier hito que falte se añade aquí mismo, en el día cuyo
 * zone_focus mejor encaje (zoneHints) o, sin coincidencia, en el primer día "city" elegible.
 */
function enforceNeverMissLandmarks(days, destination, skeletonDays) {
  const landmarks = findNeverMissLandmarks(destination)
  if (!landmarks || days.length === 0) return days

  const skeletonByDayNumber = new Map((skeletonDays ?? []).map((day) => [Number(day.day_number), day]))
  const eligibleDayNumbers = days.map((day) => day.day_number).sort((a, b) => a - b)
  const firstCityDay = eligibleDayNumbers.find((dayNumber) => skeletonByDayNumber.get(dayNumber)?.type === 'city') ?? eligibleDayNumbers[0]

  for (const landmark of landmarks) {
    const alreadyPresent = days.some((day) => day.places.some((place) => isFuzzyPlaceMatch(place.name, landmark.name)))
    if (alreadyPresent) continue

    const zoneFocusMatch = days.find((day) => {
      const zoneFocus = stripAccentsLower(skeletonByDayNumber.get(day.day_number)?.zone_focus ?? '')
      return zoneFocus && landmark.zoneHints.some((hint) => zoneFocus.includes(hint))
    })
    const targetDayNumber = zoneFocusMatch?.day_number ?? firstCityDay
    const targetDay = days.find((day) => day.day_number === targetDayNumber)
    if (!targetDay) continue

    targetDay.places.push({ name: landmark.name, type: landmark.type, duration_min: landmark.duration_min })
    console.log(`[never-miss] "${landmark.name}" no apareció en la Fase 1 para "${destination}" — añadido automáticamente al día ${targetDayNumber}`)
  }

  return days
}

// ── FASE 1 basada en JSON curado (data/destinations.json) ──────────────────────────────────
//
// Para los destinos que están en el JSON, la Fase 1 deja de pedirle a Claude que ELIJA los lugares
// (eso ya lo decidió un humano) — en su lugar los lee del JSON y los reparte por días de forma
// puramente programática (sin llamada a Claude, gratis e instantánea). Claude sigue interviniendo en
// la Fase 2 (generate-day-block) para horarios/descripciones/comidas/Free Tour, pero usa los tips ya
// dados en vez de inventarlos (ver formatRequiredPlaces). Destinos NO cubiertos por el JSON siguen el
// camino de siempre (DAY_PLACES_SYSTEM_PROMPT, Claude elige) — el JSON es un upgrade, no un reemplazo.

const DESTINATION_ALIASES = {
  roma: ['roma', 'rome'],
  paris: ['paris', 'parís'],
  londres: ['londres', 'london'],
  barcelona: ['barcelona'],
  lisboa: ['lisboa', 'lisbon'],
  madrid: ['madrid'],
  amsterdam: ['amsterdam', 'ámsterdam'],
  praga: ['praga', 'prague'],
  berlin: ['berlin', 'berlín'],
  viena: ['viena', 'vienna'],
  florencia: ['florencia', 'florence', 'firenze'],
  venecia: ['venecia', 'venice', 'venezia'],
  atenas: ['atenas', 'athens'],
  estambul: ['estambul', 'istanbul'],
  budapest: ['budapest'],
  sevilla: ['sevilla', 'seville'],
  dublin: ['dublin', 'dublín'],
  edimburgo: ['edimburgo', 'edinburgh'],
  napoles: ['napoles', 'nápoles', 'naples', 'napoli'],
  dubrovnik: ['dubrovnik'],
}

/** Mismo patrón de coincidencia por palabra completa (alias de una palabra) o substring (alias multi-palabra) que findNeverMissLandmarks, para evitar falsos positivos. */
function findDestinationData(destination) {
  const norm = stripAccentsLower(destination)
  if (!norm) return null
  const words = new Set(norm.split(/[^a-z]+/).filter(Boolean))
  for (const [key, aliases] of Object.entries(DESTINATION_ALIASES)) {
    for (const alias of aliases) {
      const isMultiWord = alias.includes(' ')
      if (isMultiWord ? norm.includes(alias) : words.has(alias)) {
        return DESTINATIONS_DATA[key] ?? null
      }
    }
  }
  return null
}

// ── "Elige tus experiencias" v2 — 6 categorías (7 en invierno) con clasificación Me interesa /
// No me lo recomiendes / neutra (punto 4 del prompt DEFINITIVO) ─────────────────────────────────
//
// Reemplaza la cara visible del banco de 18 (EXPERIENCE_BANK, más arriba) solo para el pipeline
// curado — "Elige lugares"/suggest-places siguen usando el banco de 18 tal cual (ver
// deriveLegacyExperienceIds en el cliente para el puente entre ambos sistemas). `theme` es el campo
// nuevo por lugar en destinations.json (museo/mirador/joya_oculta/gastronomico/mercado/
// imprescindible/exterior_rapido/actividad) — cada categoría temática de aquí abajo controla un
// subconjunto de esos themes.
const EXPERIENCE_CATEGORY_BANK = [
  { id: 'imprescindibles', icon: '🏛', title: 'Imprescindibles', description: 'Lo esencial del destino', lockedPositive: true },
  { id: 'barrios_sabores', icon: '🍝', title: 'Barrios y Sabores', description: 'Barrios con vida, mercados y comida local' },
  { id: 'arte_museos', icon: '🎨', title: 'Arte y Museos', description: 'Galerías, museos, iglesias y arte' },
  { id: 'naturaleza_vistas', icon: '📸', title: 'Naturaleza y Vistas', description: 'Parques, miradores y puntos fotogénicos' },
  { id: 'free_tour', icon: '🚶', title: 'Free Tour', description: 'Recorrido guiado a pie de 2-3 horas' },
  { id: 'mercadillos_navidenos', icon: '🎄', title: 'Mercadillos Navideños', description: 'Mercadillos de Navidad y ambiente invernal', winterOnly: true },
]

// Qué `theme` de lugar controla cada categoría temática (positivo = se añade relleno de ese theme
// desde Nivel 2/3; negativo = se quita del pool lo que no sea intocable). 'imprescindibles' y
// 'free_tour' no están aquí porque tienen su propio mecanismo dedicado (ver selectDestinationLevels
// y wantsFreeTour) en vez de operar sobre un theme concreto; 'mercadillos_navidenos' tampoco, tira
// directo de `destData.winter_markets` (ver buildWinterMarketPlaces).
const CATEGORY_THEME_MAP = {
  barrios_sabores: ['mercado', 'gastronomico'],
  arte_museos: ['museo'],
  naturaleza_vistas: ['mirador'],
}

function isIntocable(placeName, destData) {
  return Array.isArray(destData.intocables) && destData.intocables.some((name) => name.toLowerCase() === placeName.toLowerCase())
}

/** Busca un lugar por nombre (fuzzy) en cualquiera de los 3 niveles del destino — usado para el pool de "Elige lugares" reescrito (punto 6): un lugar marcado a mano ahí que el algoritmo automático no habría incluido por su cuenta hereda sus datos reales (zona/duración/tips/theme) en vez de rellenos genéricos al forzarlo, ver el bucle de mustIncludePlaces en buildCuratedDayPlaces. */
function findDestinationPlaceByName(destData, name) {
  for (const levelKey of ['1', '2', '3']) {
    for (const place of destData.levels?.[levelKey]?.places ?? []) {
      if (isFuzzyPlaceMatch(place.name, name)) return { ...place, _level: Number(levelKey) }
    }
  }
  return null
}

/** Todos los lugares de cualquier nivel (1-3) cuyo `theme` esté en la lista dada — usado para el "relleno" que una categoría positiva añade más allá de los niveles ya seleccionados por selectDestinationLevels. */
function collectAllDestinationPlacesByTheme(destData, themes) {
  const themeSet = new Set(themes)
  const places = []
  const seenNames = new Set()
  for (const levelKey of ['1', '2', '3']) {
    for (const place of destData.levels?.[levelKey]?.places ?? []) {
      if (!themeSet.has(place.theme)) continue
      const key = place.name.toLowerCase()
      if (seenNames.has(key)) continue
      seenNames.add(key)
      places.push({ ...place, _level: Number(levelKey) })
    }
  }
  return places
}

/** `winter_markets` del JSON curado (lugares aparte, sin nivel propio) mapeados a la misma forma que un lugar normal — solo se usan cuando la categoría "Mercadillos Navideños" está en positivo Y la época elegida es invierno (ver applyExperienceCategoryEffects). */
function buildWinterMarketPlaces(destData) {
  return (Array.isArray(destData.winter_markets) ? destData.winter_markets : []).map((market) => ({
    name: market.name,
    zone: market.zone ?? 'Centro',
    type: 'exterior',
    duration_min: Number.isFinite(market.duration_min) ? market.duration_min : 30,
    is_free_access: true,
    best_time: market.best_time ?? 'noche',
    tips: Array.isArray(market.tips) ? market.tips : [],
    theme: 'actividad',
    group: null,
    group_order: null,
    _level: 2,
  }))
}

/**
 * Punto 4 del prompt DEFINITIVO — efecto de cada categoría de experiencia POSITIVA/NEGATIVA sobre el
 * pool de lugares de un destino curado, aplicado tras el filtro de Nivel/intocables y ANTES de
 * clusterizar (ver buildCuratedDayPlaces). "Me interesa" en una categoría temática AÑADE lugares de
 * ese `theme` que los niveles ya elegidos no cubrían, tirando de Nivel 2/3 directamente si hace
 * falta; "No recomiendes" QUITA del pool los lugares no-intocables de ese `theme`. Los lugares
 * `theme: 'imprescindible'` Y cualquier lugar que esté en `destData.intocables` (aunque su theme sea
 * más específico, ej. un museo que también es intocable) NUNCA se tocan aquí — "los intocables nunca
 * se sustituyen" es una regla explícita del punto 4, más fuerte que cualquier preferencia de
 * categoría. `naturaleza_vistas` en negativo tiene una excepción parcial: un mirador que forma
 * parte de un `group` se queda (va "en el camino" con el resto de su grupo — los grupos son
 * absolutos, ver punto 1, no se puede romperlos quitando solo un miembro), solo se filtran los
 * miradores sueltos (sin grupo).
 */
function applyExperienceCategoryEffects(rawPlaces, destData, levels, positiveCategories, negativeCategories, season) {
  const positive = new Set(Array.isArray(positiveCategories) ? positiveCategories : [])
  const negative = new Set(Array.isArray(negativeCategories) ? negativeCategories : [])

  let places = rawPlaces
  for (const [category, themes] of Object.entries(CATEGORY_THEME_MAP)) {
    if (!negative.has(category)) continue
    places = places.filter((place) => {
      if (!themes.includes(place.theme)) return true
      if (place.theme === 'imprescindible' || isIntocable(place.name, destData)) return true
      if (category === 'naturaleza_vistas' && place.group) return true
      return false
    })
  }

  places = [...places]
  const existingNames = new Set(places.map((place) => place.name.toLowerCase()))
  for (const [category, themes] of Object.entries(CATEGORY_THEME_MAP)) {
    if (!positive.has(category)) continue
    for (const place of collectAllDestinationPlacesByTheme(destData, themes)) {
      const key = place.name.toLowerCase()
      if (existingNames.has(key)) continue
      existingNames.add(key)
      places.push(place)
    }
  }

  if (season === 'winter' && positive.has('mercadillos_navidenos')) {
    for (const market of buildWinterMarketPlaces(destData)) {
      const key = market.name.toLowerCase()
      if (existingNames.has(key)) continue
      existingNames.add(key)
      places.push(market)
    }
  }

  return places
}

/**
 * 2-3 días → solo Nivel 1. 4-5 días → Nivel 1+2. 6+ días → los tres niveles. "Fuera de lo típico"
 * (joyas_ocultas) sube un nivel más sobre esa base (sin pasar nunca del 3). `cityDayCount` es el
 * número de días "city"/"relax" de ESTE destino en el esqueleto, no el total del viaje — así un
 * destino que solo ocupa parte de un viaje multi-ciudad no coge más niveles de los que le tocan.
 */
// Umbrales dados explícitamente por el usuario: 1-2 días → solo los intocables del Nivel 1 (ver
// filterToIntocablesForShortTrips, se aplica aparte porque es un FILTRO dentro del propio Nivel 1,
// no un nivel distinto); 3-4 días → Nivel 1 completo; 5-6 días → Nivel 1+2; 7+ días → los tres
// niveles (el "Claude rellena extras" del prompt original para 7+ días NO está implementado todavía
// — requeriría relajar la regla "no añadas nada fuera de la lista" de REQUIRED PLACES solo para
// viajes largos, cambio más delicado que se deja para una pasada aparte).
//
// Punto 4: "Imprescindibles" (siempre positiva por defecto, el usuario puede arrastrarla a neutra
// pero nunca a negativa) decide si estos umbrales se aplican tal cual ("Me interesa" = Nivel 1
// completo + más relleno si cabe, que es exactamente lo que ya dan estos umbrales para viajes de
// 3+ días) o se recorta todo a Nivel 1 puro sin importar la duración ("Neutra" = Nivel 1 base, sin
// el relleno de Nivel 2/3 de los umbrales largos). Ronda 5: "Fuera de lo típico" se eliminó del banco
// (ya no sube +1 nivel) — sus lugares "secretos" siguen como Nivel 2-3 normales, alcanzables por los
// umbrales de duración de siempre o por el usuario vía "Añadir parada".
function selectDestinationLevels(cityDayCount, positiveCategories) {
  const positive = new Set(Array.isArray(positiveCategories) ? positiveCategories : [])
  const imprescindiblesNeutral = !positive.has('imprescindibles')
  const maxLevel = imprescindiblesNeutral ? 1 : cityDayCount <= 4 ? 1 : cityDayCount <= 6 ? 2 : 3
  const levels = []
  for (let i = 1; i <= maxLevel; i++) levels.push(String(i))
  return levels
}

/**
 * 1-2 días: ni siquiera el Nivel 1 completo cabe (21 lugares en 1-2 días sería una ruta imposible)
 * — se recorta a solo los "intocables" del destino (10-12 lugares, los más icónicos, curados a
 * mano). Filtrar la lista de lugares YA RECOLECTADA (no los niveles en sí) deja que buildDestinationClusters
 * siga funcionando igual: un grupo con solo 2 de sus 5 miembros en la lista de intocables se convierte
 * automáticamente en un cluster de esos 2, en su mismo orden relativo — no hace falta tocar nada más.
 * Sin `intocables` en el JSON (destino todavía no actualizado), no se filtra nada — mejor pasarse de
 * contenido que dejar un viaje de 1-2 días sin lugares.
 */
function filterToIntocablesForShortTrips(rawPlaces, destData, cityDayCount) {
  if (cityDayCount > 2) return rawPlaces
  if (!Array.isArray(destData.intocables) || destData.intocables.length === 0) return rawPlaces
  const intocableNames = new Set(destData.intocables.map((name) => name.toLowerCase()))
  return rawPlaces.filter((place) => intocableNames.has(place.name.toLowerCase()))
}

/** `_level` se propaga a cada lugar (no viene en el JSON en sí, lo añade esta función) para que evictNonEssentialForFreeTour más abajo sepa qué puede evacuar (Nivel 2/3) y qué es intocable (Nivel 1). */
function collectDestinationPlaces(destData, levels) {
  const places = []
  const seenNames = new Set()
  for (const levelKey of levels) {
    for (const place of destData.levels?.[levelKey]?.places ?? []) {
      if (typeof place?.name !== 'string' || !place.name.trim()) continue
      const key = place.name.toLowerCase()
      if (seenNames.has(key)) continue
      seenNames.add(key)
      places.push({ ...place, _level: Number(levelKey) })
    }
  }
  return places
}

/** Agrupa en "clusters": cada `group` del JSON se convierte en UN bloque indivisible (orden interno por group_order, nunca se separan ni reordenan entre sí); cada lugar suelto (group=null) es su propio cluster de un solo elemento. `minLevel` = el nivel más bajo (más imprescindible) de sus miembros — un grupo con AL MENOS un lugar de Nivel 1 nunca se evacúa del día del Free Tour, aunque también incluya algún Nivel 2/3 (ver evictNonEssentialForFreeTour). */
function buildDestinationClusters(places) {
  const byGroup = new Map()
  const clusters = []
  for (const place of places) {
    if (place.group) {
      if (!byGroup.has(place.group)) byGroup.set(place.group, [])
      byGroup.get(place.group).push(place)
    } else {
      clusters.push({ zone: place.zone ?? 'General', totalDuration: place.duration_min ?? 30, minLevel: place._level ?? 1, places: [place] })
    }
  }
  for (const members of byGroup.values()) {
    members.sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0))
    clusters.push({
      zone: members[0]?.zone ?? 'General',
      totalDuration: members.reduce((sum, m) => sum + (m.duration_min ?? 30), 0),
      minLevel: Math.min(...members.map((m) => m._level ?? 1)),
      places: members,
    })
  }
  return clusters
}

/**
 * Reparte los clusters entre los días disponibles: agrupados por zona (mismo campo `zone` que ya
 * traen los lugares del JSON) y procesados de mayor a menor duración total, cada cluster va entero
 * al día con MENOS carga acumulada hasta ese momento — manteniendo zonas juntas la mayoría de las
 * veces (los primeros clusters de una zona grande tienden a caer en el mismo día recién vaciado)
 * mientras se auto-equilibra sin poder desbordar un solo día. Un cluster/grupo NUNCA se divide.
 */
function distributeClustersToDays(clusters, dayNumbers) {
  // Un lugar puede llevar `near_zone` (ej. Trastevere → "Vaticano") cuando NO tiene sentido agruparlo
  // con otros lugares (no fuerza un cluster propio) pero sí tiene una zona con la que geográficamente
  // conecta mejor (cruzar el río después del Vaticano) — esos clusters se reparten DESPUÉS del resto,
  // directamente al día donde ya haya caído esa zona preferida (ver más abajo).
  const affinityClusters = clusters.filter((cluster) => cluster.places.some((place) => place.near_zone))
  const normalClusters = clusters.filter((cluster) => !cluster.places.some((place) => place.near_zone))

  const byZone = new Map()
  for (const cluster of normalClusters) {
    if (!byZone.has(cluster.zone)) byZone.set(cluster.zone, [])
    byZone.get(cluster.zone).push(cluster)
  }
  const zoneBuckets = [...byZone.values()]
    .map((zoneClusters) => ({ clusters: zoneClusters, totalDuration: zoneClusters.reduce((sum, c) => sum + c.totalDuration, 0) }))
    .sort((a, b) => b.totalDuration - a.totalDuration)

  const dayLoads = new Map(dayNumbers.map((n) => [n, 0]))
  const dayClusters = new Map(dayNumbers.map((n) => [n, []]))

  const leastLoadedDay = () => [...dayLoads.entries()].sort((a, b) => a[1] - b[1])[0][0]
  const totalDuration = clusters.reduce((sum, c) => sum + c.totalDuration, 0)
  const fairShareMinutes = totalDuration / dayNumbers.length

  for (const bucket of zoneBuckets) {
    // Toda la zona intenta caer en el MISMO día (el que menos carga tenga al empezar este bucket) —
    // solo se pasa a otro día si esta zona por sí sola ya desbordaría muy por encima de lo que le
    // tocaría a un día de media (1.4x), para no partir zonas normales solo porque otro día distinto
    // sigue vacío en ese momento del reparto.
    let targetDay = leastLoadedDay()
    for (const cluster of bucket.clusters) {
      if (dayLoads.get(targetDay) > 0 && dayLoads.get(targetDay) + cluster.totalDuration > fairShareMinutes * 1.4) {
        targetDay = leastLoadedDay()
      }
      dayClusters.get(targetDay).push(cluster)
      dayLoads.set(targetDay, dayLoads.get(targetDay) + cluster.totalDuration)
    }
  }

  for (const cluster of affinityClusters) {
    const preferredZone = cluster.places.find((place) => place.near_zone)?.near_zone
    const dayWithPreferredZone = dayNumbers.find((day) => dayClusters.get(day).some((c) => c.zone === preferredZone))
    const targetDay = dayWithPreferredZone ?? leastLoadedDay()
    dayClusters.get(targetDay).push(cluster)
    dayLoads.set(targetDay, dayLoads.get(targetDay) + cluster.totalDuration)
  }

  return dayClusters
}

// Mismo tope que sanitizeDayPlaces aplica al camino Claude-driven (ver su comentario junto al
// `if (places.length >= maxPlacesForPace(pace)) break`): más lugares/día = más tokens de salida en
// Fase 2 = más riesgo real de stop_reason=max_tokens. distributeClustersToDays reparte por DURACIÓN
// total, no por número de paradas, así que un día puede acabar con más lugares que otro con la misma
// carga si son cortos (ej. varios miradores/plazas de 15-20min) — encontrado en vivo: un Roma 5 días
// acabó con un día de 11 lugares (390min, dentro del 1.4x de la duración media) que sí disparó
// max_tokens real. El camino curado necesita su propio tope de CANTIDAD además del de duración.
// Ritmo "Completo" pide explícitamente "sin tope rígido de paradas" — no se puede tomar 100% literal
// (Vercel sigue teniendo maxDuration real y Fase 2 sigue teniendo un max_tokens real, ver
// applyCuratedTips/max_tokens=24000 más abajo), pero desde que ese ahorro de tokens se implementó el
// margen real creció mucho (16000→6234 tokens en el mismo día de prueba) — así que Completo recibe un
// tope bastante más alto que Tranquilo en vez de compartir el mismo número.
const MAX_PLACES_PER_CURATED_DAY_BY_PACE = { zen: 9, balanced: 9, nonstop: 12 }
function maxPlacesForPace(pace) {
  return MAX_PLACES_PER_CURATED_DAY_BY_PACE[pace] ?? MAX_PLACES_PER_CURATED_DAY_BY_PACE.balanced
}

/**
 * Red de seguridad de cantidad tras distributeClustersToDays: si un día quedó con más clusters/lugares
 * que el tope, se mueven clusters enteros (nunca se parte uno) al día con más hueco — empezando por
 * los menos imprescindibles (minLevel más alto) y, entre esos, por los más pequeños primero (para
 * sacar el mínimo de lugares posible en cada paso en vez de mover un cluster grande de golpe).
 */
function rebalanceClustersForPlaceCount(dayClustersMap, maxPlacesPerDay) {
  const placeCount = (day) => dayClustersMap.get(day).reduce((sum, c) => sum + c.places.length, 0)
  const days = [...dayClustersMap.keys()]
  if (days.length < 2) return

  for (const day of days) {
    let guard = 0
    while (placeCount(day) > maxPlacesPerDay && guard++ < 20) {
      const dayList = dayClustersMap.get(day)
      if (dayList.length <= 1) break
      const movable = [...dayList].sort((a, b) => (b.minLevel !== a.minLevel ? b.minLevel - a.minLevel : a.places.length - b.places.length))
      const cluster = movable[0]
      const targetDay = days.filter((d) => d !== day).sort((a, b) => placeCount(a) - placeCount(b))[0]
      dayClustersMap.set(day, dayList.filter((c) => c !== cluster))
      dayClustersMap.get(targetDay).push(cluster)
    }
  }
}

/**
 * El Free Tour tiene PRIORIDAD ABSOLUTA sobre cualquier otra parada del día 1 — es la toma de
 * contacto con la ciudad, siempre debe ir primero (ver FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT). Si el
 * contenido "real" del día 1 (todo menos el propio tour) es tan grande que empezar a las 10:00 y
 * meterlo TODO después del tour dejaría un día irrealmente largo, se evacúan clusters enteros
 * (nunca se parte un grupo) a los demás días hasta caber en un presupuesto razonable —
 * PRIMERO los de Nivel 2/3 (nunca imprescindibles), y si con eso no basta, también los de Nivel 1
 * más grandes (encontrado en vivo: dejar SIEMPRE intactos los de Nivel 1 hacía que un día 1 con
 * mucho contenido imprescindible — ej. el complejo completo del Vaticano — invitara a Claude a
 * anteponerlo al Free Tour "porque ya estaba primero en la lista"; mover ese contenido a otro día
 * es la única forma de que el Free Tour sea de verdad la primera parada, sin ninguna excepción).
 */
const FREE_TOUR_DAY_CONTENT_BUDGET_MINUTES = 420

function evictForFreeTour(dayClustersMap, freeTourDayNumber) {
  const otherDays = [...dayClustersMap.keys()].filter((day) => day !== freeTourDayNumber)
  const initial = dayClustersMap.get(freeTourDayNumber)
  if (!initial || initial.length === 0 || otherDays.length === 0) return

  const dayLoad = (day) => dayClustersMap.get(day).reduce((sum, c) => sum + c.totalDuration, 0)
  let remaining = [...initial]

  while (remaining.reduce((sum, c) => sum + c.totalDuration, 0) > FREE_TOUR_DAY_CONTENT_BUDGET_MINUTES && remaining.length > 1) {
    const nonEssential = remaining.filter((cluster) => cluster.minLevel > 1)
    const pool = nonEssential.length > 0 ? nonEssential : remaining
    const biggest = [...pool].sort((a, b) => b.totalDuration - a.totalDuration)[0]
    remaining = remaining.filter((cluster) => cluster !== biggest)
    const targetDay = otherDays.sort((a, b) => dayLoad(a) - dayLoad(b))[0]
    dayClustersMap.get(targetDay).push(biggest)
  }
  dayClustersMap.set(freeTourDayNumber, remaining)
}

function flattenDayClusters(dayClustersMap) {
  const dayPlaces = new Map()
  for (const [day, clusters] of dayClustersMap) {
    dayPlaces.set(day, clusters.flatMap((cluster) => cluster.places))
  }
  return dayPlaces
}

/**
 * `double_visit: true` en el JSON NO significa añadir una segunda parada numerada obligatoria — el
 * lugar ya aparece una vez como parada normal en el día que le tocó por reparto; esto solo recopila
 * la sugerencia de "vale la pena volver" para que la UI la muestre como una recomendación aparte
 * (tarjeta con botón "Añadir como parada", nunca una parada más en el itinerario) en el día que YA
 * tiene ese lugar como parada real.
 */
function collectDoubleVisitRecommendations(dayPlacesMap, allPlaces) {
  const recommendations = []
  for (const place of allPlaces) {
    if (!place.double_visit) continue
    const dayWithIt = [...dayPlacesMap.entries()].find(([, places]) => places.some((p) => p.name === place.name))
    if (!dayWithIt) continue
    recommendations.push({
      name: place.name,
      day_number: dayWithIt[0],
      reason: typeof place.double_visit_reason === 'string' && place.double_visit_reason
        ? place.double_visit_reason
        : `Vale la pena volver a "${place.name}" en otro momento del día — es una experiencia distinta.`,
    })
  }
  return recommendations
}

/** "primera_hora" primero, "atardecer"/"noche" al final, el resto mantiene su orden original (sort estable) — una ordenación aproximada por franja horaria; el horario fino real lo decide la Fase 2 con las horas de apertura reales. */
const BEST_TIME_SORT_WEIGHT = { primera_hora: 0, atardecer: 2, noche: 2 }
/** El marcador de Free Tour SIEMPRE va antes que cualquier otro lugar, incluidos los "primera_hora" —
 * si empatara con ellos (peso 0) un sort estable lo dejaría detrás de lo que ya estuviera antes en el
 * array (visto en vivo: Museos Vaticanos, también "primera_hora", quedaba delante del Free Tour y
 * Claude "mantenía el orden dado" tal cual, poniendo el museo antes del tour). Peso -1 le garantiza el
 * primer puesto pase lo que pase. */
function bestTimeSortWeight(place) {
  if (place.name === FREE_TOUR_REQUIRED_PLACE_MARKER) return -1
  if (place._prefillBeforeFreeTour) return -2
  return BEST_TIME_SORT_WEIGHT[place.best_time] ?? 1
}

function sortDayPlacesByBestTime(places) {
  return places
    .map((place, index) => ({ place, index }))
    .sort((a, b) => {
      const weightA = bestTimeSortWeight(a.place)
      const weightB = bestTimeSortWeight(b.place)
      return weightA !== weightB ? weightA - weightB : a.index - b.index
    })
    .map((entry) => entry.place)
}

/** "exterior_interior" (ej. Altar de la Patria: mirador exterior gratis + terraza de pago) y "actividad" (paseos en barco/tranvía/góndola) no existen en el esquema de Fase 2 — se aproximan al tipo más parecido de los tres que sí entiende (interior_corto / exterior). */
const CURATED_TYPE_MAP = { interior_largo: 'interior_largo', interior_corto: 'interior_corto', exterior: 'exterior', exterior_interior: 'interior_corto', actividad: 'exterior' }

/** Duración típica de un Free Tour (150-180min, ver FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT — aquí el punto medio) usada para el marcador inyectado en REQUIRED PLACES (ver buildCuratedDayPlaces). */
const FREE_TOUR_TYPICAL_MINUTES = 165

/** Nombre-marcador (nunca un lugar real) que representa "aquí va el Free Tour" dentro de la lista REQUIRED PLACES de un día — ver formatRequiredPlaceItem para cómo se traduce a instrucciones para Claude, y stripNonRequiredStops/logMissingRequiredPlaces para cómo se excluye de sus comprobaciones normales (el Free Tour real que Claude escribe tiene is_free_tour:true, no este nombre literal). */
const FREE_TOUR_REQUIRED_PLACE_MARKER = '[FREE TOUR — obligatorio, ver instrucciones]'

/** Zonas "centro histórico" — el JSON no tiene un campo dedicado para esto, se aproxima por nombre de
 * zona (sin acentos, en minúsculas) conteniendo "centro" (cubre "Centro Histórico"/"Centro" en todos
 * los destinos que lo tienen). Algunos destinos reparten su núcleo en varias zonas sin ese nombre (ej.
 * Londres: "City"/"Westminster") — ahí simplemente no hay candidatos, ver buildFreeTourPrefillStops. */
function isCentroHistoricoZone(zone) {
  return typeof zone === 'string' && stripAccentsLower(zone).includes('centro')
}

/**
 * Ritmo Completo + Free Tour (ver buildCuratedDayPlaces): cubre el hueco 08:00-10:00 con 1-2 lugares
 * realmente rápidos (≤30min), de acceso libre (sin taquilla que pueda abrir tarde) y del centro
 * histórico, sacados del propio pool ya filtrado del destino para este viaje (rawPlaces — respeta el
 * mismo recorte de Nivel/intocables que el resto del día). `usedNames` evita repetir un lugar que ya
 * vaya a visitarse de verdad en algún día. Si no hay ningún candidato que cumpla las tres condiciones
 * a la vez, devuelve un array vacío — mejor no rellenar nada que forzar un relleno de mala calidad.
 * `usedNames` solo descarta un candidato que YA esté asignado a otro día SALVO que el propio JSON lo
 * marque `double_visit: true` (un lugar que el curador humano ya decidió que merece verse dos veces,
 * ver Fontana di Trevi) — para esos, un vistazo rápido de camino por la mañana es precisamente el
 * tipo de segunda visita que ese campo existe para describir.
 */
// Marca el `best_time` de un lugar de relleno pre-Free-Tour (ver buildFreeTourPrefillStops) — el
// mismo string sirve de marcador reconocible más abajo en la Fase 2, en enforceFreeTourFirst: esa
// red de seguridad mueve a cualquier parada que Claude programó antes que el Free Tour, así que sin
// esta excepción explícita se comería el propio relleno que este punto pide dejar ahí.
const FREE_TOUR_PREFILL_BEST_TIME = 'muy temprano, ANTES del Free Tour (hueco 08:00-10:00)'

function buildFreeTourPrefillStops(rawPlaces, usedNames) {
  const candidates = rawPlaces.filter(
    (place) =>
      place.is_free_access === true &&
      Number.isFinite(place.duration_min) &&
      place.duration_min <= 30 &&
      isCentroHistoricoZone(place.zone) &&
      (place.double_visit === true || !usedNames.has(place.name.toLowerCase())),
  )
  return candidates.slice(0, 2).map((place) => ({ ...place, best_time: FREE_TOUR_PREFILL_BEST_TIME, _prefillBeforeFreeTour: true }))
}

function mapCuratedPlace(place) {
  return {
    name: place.name,
    type: CURATED_TYPE_MAP[place.type] ?? 'interior_corto',
    duration_min: Number.isFinite(place.duration_min) ? place.duration_min : 30,
    tips: Array.isArray(place.tips) ? place.tips.slice(0, 4) : [],
    is_free_access: typeof place.is_free_access === 'boolean' ? place.is_free_access : undefined,
    // Solo si lo tiene o no: el horario en sí no viaja al prompt (ya se le inyecta por otra vía),
    // aquí únicamente evita que "gratis" se lea como "abierto siempre" — ver formatRequiredPlaceItem.
    has_schedule: Boolean(place.schedule),
    best_time: typeof place.best_time === 'string' ? place.best_time : null,
  }
}

/** Construye la lista de lugares por día directamente desde el JSON curado — sin llamada a Claude. Devuelve el mismo formato que sanitizeDayPlaces (day_number + places[]) para que el resto del pipeline (generate-day-block) no note la diferencia. */
function buildCuratedDayPlaces(destData, listDayNumbers, answers, mustIncludePlaces) {
  const positiveCategories = Array.isArray(answers.experiencesPositive) ? answers.experiencesPositive : []
  const negativeCategories = Array.isArray(answers.experiencesNegative) ? answers.experiencesNegative : []
  const levels = selectDestinationLevels(listDayNumbers.length, positiveCategories)
  const collectedPlaces = collectDestinationPlaces(destData, levels)
  const shortTripFiltered = filterToIntocablesForShortTrips(collectedPlaces, destData, listDayNumbers.length)
  // 1-2 días: el recorte a solo intocables es un límite de CAPACIDAD (21 lugares no caben en 1-2
  // días), no una preferencia — ninguna categoría de experiencia debe poder añadir NI quitar nada
  // por encima de ese límite duro, así que applyExperienceCategoryEffects se salta entero ahí.
  const rawPlaces =
    listDayNumbers.length > 2
      ? applyExperienceCategoryEffects(shortTripFiltered, destData, levels, positiveCategories, negativeCategories, answers.season)
      : shortTripFiltered
  const clusters = buildDestinationClusters(rawPlaces)
  const dayClustersMap = distributeClustersToDays(clusters, listDayNumbers)
  rebalanceClustersForPlaceCount(dayClustersMap, maxPlacesForPace(answers.pace))

  // Free Tour SIEMPRE la primera parada del día 1 — se evacúa lo que no quepa después (Nivel 2/3
  // primero, Nivel 1 si aun así no basta) para que nunca haya un motivo real para anteponer otra
  // parada (ver evictForFreeTour).
  const wantsFreeTour = positiveCategories.includes('free_tour')
  if (wantsFreeTour && listDayNumbers.includes(1)) {
    evictForFreeTour(dayClustersMap, 1)
  }

  const dayPlacesMap = flattenDayClusters(dayClustersMap)
  const recommendedRevisits = collectDoubleVisitRecommendations(dayPlacesMap, rawPlaces)

  // Los lugares que el viajero marcó a mano en el pool de "Elige lugares" (punto 6 reescrito —
  // selección real, no solo consulta) entran SÍ O SÍ, además de lo que ya añada automáticamente el
  // ritmo/experiencias — ya suelen estar cubiertos por el JSON (Nivel/categoría normal), pero si el
  // viajero marcó algo que el algoritmo no habría incluido por su cuenta (ej. un Nivel 3 en un viaje
  // corto, recortado por filterToIntocablesForShortTrips), se añade suelto al primer día. Se busca el
  // lugar real en destData para heredar sus datos curados (zona/duración/tips/acceso libre) en vez de
  // rellenos genéricos — sigue siendo el mismo lugar del JSON, solo que el algoritmo automático no lo
  // había seleccionado. Limitación conocida (ya existía antes de este cambio, no es nueva): un lugar
  // forzado así se añade suelto, sin pasar por buildDestinationClusters — si formaba parte de un
  // `group`, entra sin sus compañeros de grupo ni su group_order. En la práctica es poco probable
  // (el algoritmo normal ya cubre casi siempre los grupos completos), pero si se quiere blindar del
  // todo habría que re-clusterizar después de esta inyección, cambio más grande que se deja aparte.
  const allNames = [...dayPlacesMap.values()].flat().map((place) => place.name)
  for (const rawName of Array.isArray(mustIncludePlaces) ? mustIncludePlaces : []) {
    if (typeof rawName !== 'string' || !rawName.trim()) continue
    const name = rawName.trim().slice(0, 150)
    if (allNames.some((existing) => isFuzzyPlaceMatch(existing, name))) continue
    const curatedMatch = findDestinationPlaceByName(destData, name)
    dayPlacesMap.get(listDayNumbers[0])?.push(
      curatedMatch
        ? { ...curatedMatch }
        : { name, type: 'interior_corto', duration_min: 45, tips: [], best_time: null },
    )
  }

  // El Free Tour, pedido como instrucción de prompt aparte, se saltaba en vivo incluso marcándolo
  // "innegociable" — Claude cumple de forma mucho más fiable con la lista REQUIRED PLACES en sí que
  // con una sección de prompt separada compitiendo por prioridad. Se inyecta aquí como un elemento
  // MÁS de esa lista (con un nombre-marcador que Fase 2 sabe reconocer y expandir a la parada de Free
  // Tour real, ver formatRequiredPlaceItem/FREE_TOUR_REQUIRED_PLACE_MARKER) para heredar la misma
  // fiabilidad de cumplimiento que ya tienen los lugares reales.
  if (wantsFreeTour && listDayNumbers.includes(1)) {
    dayPlacesMap.get(1)?.push({
      name: FREE_TOUR_REQUIRED_PLACE_MARKER,
      type: 'exterior',
      duration_min: FREE_TOUR_TYPICAL_MINUTES,
      tips: [],
      best_time: 'primera_hora',
    })
  }

  // Ritmo Completo + Free Tour: el día empieza a las 08:00 (ver PACE_START_MINUTES en
  // stopScheduling.ts) pero un Free Tour real no suele arrancar hasta ~10:00 — quedarían 2h muertas
  // si no se rellenan. Solo para este caso concreto se permite contenido real ANTES del Free Tour
  // (ver buildFreeTourPrefillStops) — el resto del día sigue con el Free Tour como primera parada
  // "de verdad", sin excepciones.
  if (wantsFreeTour && listDayNumbers.includes(1) && answers.pace === 'nonstop') {
    const usedNames = new Set([...dayPlacesMap.values()].flat().map((place) => place.name.toLowerCase()))
    const prefillStops = buildFreeTourPrefillStops(rawPlaces, usedNames)
    if (prefillStops.length > 0) dayPlacesMap.get(1)?.push(...prefillStops)
  }

  const days = listDayNumbers
    .map((dayNumber) => ({
      day_number: dayNumber,
      places: sortDayPlacesByBestTime(dayPlacesMap.get(dayNumber) ?? []).map(mapCuratedPlace),
    }))
    .sort((a, b) => a.day_number - b.day_number)

  return { days, recommended_revisits: recommendedRevisits }
}

/**
 * Fase 1 (generate-day-places) — saneo de la respuesta. Solo se aceptan días "city" del esqueleto
 * (road/excursion nunca llevan lista, ver DAY_PLACES_SYSTEM_PROMPT); cada día se deduplica
 * dentro de sí mismo (un mismo nombre repetido DOS VECES en el mismo día es un error del modelo, no
 * la "segunda visita" legítima que sí puede pasar ENTRE días distintos, ver regla 9 del prompt). Los
 * lugares que el usuario marcó en "Elige lugares" (mustIncludePlaces) se fuerzan aquí si Claude se
 * dejó alguno fuera — mismo espíritu que el topUpUnassignedNames que existía antes para las anclas.
 */
function sanitizeDayPlaces(raw, skeletonDays, mustIncludePlaces, pace) {
  const cityDayNumbers = new Set(
    (skeletonDays ?? []).filter((day) => day.type === 'city' || day.type === 'relax').map((day) => Number(day.day_number)),
  )
  const byDayNumber = new Map()
  for (const entry of Array.isArray(raw) ? raw : []) {
    const dayNumber = Number(entry?.day_number)
    if (!cityDayNumbers.has(dayNumber)) continue
    const seen = new Set()
    const places = []
    for (const rawPlace of Array.isArray(entry?.places) ? entry.places : []) {
      const place = sanitizeDayPlaceEntry(rawPlace)
      if (!place) continue
      const key = place.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      places.push(place)
      // Tope defensivo — ver [timing] real en logs: la Fase 2 tiene que escribir contenido completo
      // (descripción/tip/horario/coordenadas/conectores) para CADA lugar de la lista en una sola
      // llamada, así que más lugares = más tokens de salida = más tiempo. 14+/día medidos en vivo
      // tardaban 130-150s; con 11 se vio un stop_reason=max_tokens real en un día de 10 tras crecer
      // el prompt de Fase 2 con más reglas a lo largo de la sesión (REQUIRED PLACES, Free Tour,
      // nombres exactos...) — tope pace-aware (ver maxPlacesForPace) deja margen real sin recortar el
      // "visita todo lo que esté en el camino" que pide DAY_PLACES_SYSTEM_PROMPT.
      if (places.length >= maxPlacesForPace(pace)) break
    }
    byDayNumber.set(dayNumber, places)
  }
  for (const dayNumber of cityDayNumbers) {
    if (!byDayNumber.has(dayNumber)) byDayNumber.set(dayNumber, [])
  }

  // Ningún lugar de la Wishlist del usuario puede quedar fuera — si Claude lo omitió, se añade al
  // primer día "city" (sin señal fiable de a qué ciudad pertenece en un viaje multi-destino, mismo
  // punto ciego que ya tenía el mecanismo al que reemplaza).
  const allNamesLower = new Set([...byDayNumber.values()].flatMap((places) => places.map((place) => place.name.toLowerCase())))
  const firstCityDay = [...cityDayNumbers].sort((a, b) => a - b)[0]
  for (const rawName of Array.isArray(mustIncludePlaces) ? mustIncludePlaces : []) {
    if (typeof rawName !== 'string' || !rawName.trim()) continue
    const name = rawName.trim().slice(0, 150)
    if (allNamesLower.has(name.toLowerCase())) continue
    if (firstCityDay == null) continue
    byDayNumber.get(firstCityDay).push({ name, type: 'interior_corto', duration_min: DEFAULT_DURATION_BY_TYPE.interior_corto })
    allNamesLower.add(name.toLowerCase())
  }

  return [...byDayNumber.entries()].map(([day_number, places]) => ({ day_number, places })).sort((a, b) => a.day_number - b.day_number)
}

/**
 * Ronda 10: el pool ya no se pide por niveles sueltos con "Ver más lugares" — es UN SOLO bloque de
 * hasta CURATED_POOL_MAX_PLACES lugares ("¿Cuáles te hacen ilusión?", ver CuratedPlacesPool.tsx):
 * todos los Imprescindibles (Nivel 1) y, detrás, los mejores del Nivel 2 hasta completar. Lo marcado
 * ahí entra en la generación con prioridad ABSOLUTA (must_include_places → planMustIncludePlacement),
 * de ahí que la lista sea corta y curada en vez de los 60 lugares del destino: el catálogo completo
 * pertenece a "Añadir parada", que es edición manual DESPUÉS de generar la ruta.
 */
const CURATED_POOL_MAX_PLACES = 20

/**
 * Los hasta CURATED_POOL_MAX_PLACES lugares del bloque único del pool, para un destino con datos
 * pipeline v2: TODOS los Imprescindibles (Nivel 1) y luego Nivel 2 hasta completar. Nivel 3 nunca —
 * es "para quien quiere ver todavía más" y no pinta en una lista de 20 donde cada hueco cuenta.
 *
 * El relleno con Nivel 2 va por RONDAS DE ZONA (una de cada zona del destino, luego la segunda de
 * cada una...) y, dentro de cada zona, de más larga a más corta. Las dos cosas por el mismo motivo:
 * marcar algo en el pool solo sirve de verdad para lo que el algoritmo NO habría metido por su
 * cuenta. Una plaza o un puente de 20min entra solo como relleno de cualquier hueco (Reglas A/B/D);
 * una visita de interior de 1-2h (Galería Borghese, Domus Aurea, Castel Sant'Angelo) es justo lo que
 * se queda fuera si nadie la pide — y encima es lo que le hace ilusión a alguien. Y sin la ronda por
 * zonas, una zona entera del destino (villa_borghese en Roma, que no tiene ningún Nivel 1) podía
 * quedarse sin un solo representante en el pool.
 */
function buildCuratedPoolV2(destData) {
  const places = destData.places ?? []
  const pool = places.filter((place) => place.level === 1)
  const pending = Object.keys(destData.zones ?? {}).map((zone) =>
    places.filter((place) => place.level === 2 && place.zone === zone).sort((a, b) => (b.duration_minutes ?? 0) - (a.duration_minutes ?? 0)),
  )
  while (pool.length < CURATED_POOL_MAX_PLACES && pending.some((list) => list.length > 0)) {
    for (const list of pending) {
      if (pool.length >= CURATED_POOL_MAX_PLACES) break
      const next = list.shift()
      if (next) pool.push(next)
    }
  }
  return pool.slice(0, CURATED_POOL_MAX_PLACES)
}

/**
 * Punto 6 del prompt DEFINITIVO — "Pool de lugares" que se muestra al confirmar destino, ANTES de
 * generar la ruta. Devuelve el bloque único del pool (`level: 'pool'`, lo que usa la app) o un nivel
 * suelto del JSON curado tal cual (`level: 1|2|3`, que sigue existiendo para los destinos curados
 * "antiguos" y para depurar), siempre sin pasar por Claude — coste cero, respuesta instantánea. El
 * cliente cachea el resultado en localStorage para que la siguiente vez sea instantáneo también sin
 * llamar aquí (ver placePoolCache.ts). `category` usa la zona del JSON como aproximación legible de
 * "tipo de lugar" — cuando exista el campo temático (museo/mirador/mercado/joya_oculta/...) del punto
 * 4 se puede sustituir aquí sin tocar el resto del pipeline.
 */
/**
 * TODOS los lugares de un destino curado, con lo que necesita la pantalla de explorar/añadir parada:
 * coordenadas para el pin del mapa y `filter_category` para los chips de filtro.
 *
 * Distinto del pool del cuestionario (/api/curated-places-pool, 20 lugares como mucho) a propósito y
 * por la misma razón de siempre: ese pool influye en la GENERACIÓN y por eso es corto y curado;
 * este es edición manual sobre una ruta ya hecha, así que enseña el catálogo entero sin tope.
 */
app.post('/api/destination-places', (req, res) => {
  const { destination } = req.body ?? {}
  if (!destination) {
    res.status(400).json({ error: 'Falta el destino.' })
    return
  }
  const data = findPipelineV2Data(destination)
  if (!data) {
    res.json({ found: false, places: [] })
    return
  }
  const places = (data.places ?? [])
    .filter((place) => Array.isArray(place.coordinates) && place.coordinates.length === 2)
    .map((place) => ({
      kind: 'place',
      name: place.name,
      coordinates: { lat: place.coordinates[0], lng: place.coordinates[1] },
      filter_category: place.filter_category ?? null,
      zone: place.zone ?? null,
      zone_label: data.zones?.[place.zone]?.name ?? null,
      duration_min: Number.isFinite(place.duration_minutes) ? place.duration_minutes : null,
      type: place.type ?? null,
      tags: Array.isArray(place.tags) ? place.tags : [],
      level: place.level ?? null,
      schedule: place.schedule ?? null,
      // Prompt 3: el buscador de la pantalla de lugares busca en español sobre el pool local, y los
      // alias son lo que hace que "coli" encuentre el Coliseo o que el nombre en italiano siga
      // valiendo. Ya vienen normalizados (minúsculas sin acentos) desde el JSON del destino.
      search_aliases: Array.isArray(place.search_aliases) ? place.search_aliases : [],
      wikipedia_title: place.wikipedia_title ?? null,
      // Prompt 7, filtro "Entradas". MISMA regla que usa el generador de rutas (ver
      // buildCuratedDayPlaces en routeAlgorithm.js): lo que se visita por dentro cobra, salvo que el
      // JSON diga explícitamente lo contrario (una iglesia, un mercado). Es deducido y no un campo
      // del JSON porque solo 4 de los 67 lugares de Roma lo traen escrito: filtrar por el campo a
      // secas no devolvería nada.
      requires_ticket: !(place.is_free_access ?? place.type === 'exterior'),
      // Días limitados y reserva obligatoria (la Domus Aurea): la ficha y la parada lo dicen.
      booking_note: place.booking_note ?? null,
      hours_card: place.card_text ?? null,
      reservation: place.reservation ?? null,
    }))

  // Los restaurantes viven en su propio array (`restaurants`), FUERA de `places`, porque no son
  // paradas de ruta: routeAlgorithm.js nunca debe verlos como candidatos a llenar una franja. Aquí
  // se mezclan en una sola lista porque para la pantalla de lugares son puntos del mapa igual que
  // los demás — lo que cambia (ficha propia, "Cómo llegar" en vez de "Añadir") lo decide `kind`.
  // Su `coordinates` ya viene como objeto {lat,lng}, no como el par [lat,lng] de `places`.
  const restaurants = (data.restaurants ?? [])
    .filter((place) => Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lng))
    .map((place, index) => ({
      kind: 'restaurant',
      // Posición en el JSON = orden editorial (las trattorias primero, dentro de cada tipo los
      // mejores antes). Es el desempate de "Recomendados" mientras un sitio no tenga likes: los
      // restaurantes no tienen `level` con el que ordenarlos, y por orden alfabético la lista
      // abriría por "Ai Marmi" sin que eso signifique nada.
      order: index,
      name: place.name,
      coordinates: { lat: place.coordinates.lat, lng: place.coordinates.lng },
      filter_category: 'restaurantes',
      zone: null,
      zone_label: place.zone ?? null,
      duration_min: null,
      type: null,
      tags: [],
      level: null,
      schedule: place.hours ?? null,
      sub_category: place.sub_category ?? null,
      address: place.address ?? null,
      price_range: place.price_range ?? null,
      avg_price_person: place.avg_price_person ?? null,
      what_to_order: place.what_to_order ?? null,
      tip: place.tip ?? null,
      best_for: place.best_for ?? null,
      // En un restaurante se paga la cuenta, no la entrada: nunca sale bajo el filtro "Entradas".
      requires_ticket: false,
    }))

  // Las excursiones viajan con el catálogo porque son uno de los cinco filtros de la pantalla de
  // lugares, y ahí no hay ninguna ruta de la que sacarlas (EXPLORAR no mira ningún día concreto).
  // No son `places`: no se pueden añadir a un día, solo consultar y reservar fuera.
  // Aquí van TODAS (no las `max_display` de un día): el tope existe para no abrumar a quien está
  // decidiendo qué hacer un día concreto, pero esto es un catálogo que el viajero abre para ver qué
  // hay — recortarlo sería esconderle opciones que existen.
  res.json({ found: true, places: [...places, ...restaurants], excursions: excursionsAvailablePayload(data, null, data.excursions?.options ?? []) })
})

// ── Detalle ampliado de un lugar (las 3 pestañas de la ficha de parada) ──────────────────────
//
// Contenido largo y redactado a mano de cada lugar de un destino curado: descripción, qué ver,
// horarios detallados, transporte, tips y secretos. Vive APARTE del JSON del destino y se carga solo
// cuando hace falta, por dos motivos:
//
//  1. Son ~136 KB solo para Roma, y el algoritmo de rutas (routeAlgorithm.js) no necesita ni una
//     línea: le sirven zona, duración, horario y poco más. Meterlo en roma.json obligaría a leer y
//     parsear todo eso en cada generación de ruta.
//  2. El cliente pide UN lugar, el que el viajero acaba de abrir — nunca los 61.
//
// Solo contenido de PANTALLA: level/tier/zone/coordinates/duration_minutes/tags/group/closed_on...
// siguen viviendo únicamente en el JSON del destino. Dos copias de un dato de planificación acaban
// desincronizadas (los archivos de origen ya traían 3 discrepancias de level/duración con roma.json).
/** Alias declarados en el JSON del destino para un lugar (ya normalizados) — ver search_aliases. */
function aliasesFor(destinationKey, placeName) {
  const data = findPipelineV2Data(destinationKey)
  const place = (data?.places ?? []).find((p) => p.name === placeName)
  return place?.search_aliases ?? []
}

const placeDetailCache = new Map()

function loadPlaceDetail(destinationKey) {
  if (placeDetailCache.has(destinationKey)) return placeDetailCache.get(destinationKey)
  const byName = new Map()
  try {
    const dir = join(__dirname, '../data/pipeline_v2/detalle', destinationKey)
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue
      const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      for (const place of parsed.places ?? []) {
        if (typeof place?.name !== 'string') continue
        byName.set(stripAccentsLowerServer(place.name), place)
        // Prompt 2 (Tarea D): un viaje generado ANTES del renombrado tiene las paradas guardadas con
        // el nombre viejo. Los alias del lugar (que incluyen siempre su nombre anterior, ver
        // `search_aliases` en el JSON del destino) se registran como claves alternativas para que su
        // ficha ampliada se siga encontrando en vez de caer a una llamada de pago a Claude.
        for (const alias of aliasesFor(destinationKey, place.name)) byName.set(alias, place)
      }
    }
    console.log(`[detalle] "${destinationKey}" — ${byName.size} lugares con ficha ampliada`)
  } catch (error) {
    // Un destino curado sin carpeta de detalle es normal (todavía no se ha escrito) — la ficha cae
    // al camino de siempre con Claude bajo demanda, sin romper nada.
    console.warn(`[detalle] "${destinationKey}" sin ficha ampliada: ${error.message}`)
  }
  placeDetailCache.set(destinationKey, byName)
  return byName
}

function stripAccentsLowerServer(value) {
  return typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
    : ''
}

/**
 * Ficha ampliada de un lugar concreto. `found: false` significa "este destino/lugar no tiene ficha
 * escrita" — nunca es un error: el cliente sigue con describeStop/anchorTips como hasta ahora.
 */
app.post('/api/place-detail', (req, res) => {
  const { destination, name } = req.body ?? {}
  if (!destination || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Faltan datos necesarios (destination, name).' })
    return
  }
  const destinationKey = findPipelineV2Key(destination)
  if (!destinationKey) {
    res.json({ found: false })
    return
  }
  const detail = loadPlaceDetail(destinationKey).get(stripAccentsLowerServer(name))
  res.json(detail ? { found: true, detail } : { found: false })
})

app.post('/api/curated-places-pool', (req, res) => {
  const { destination, level } = req.body ?? {}
  const levelKey = String(level)
  if (!destination || !['pool', '1', '2', '3'].includes(levelKey)) {
    res.status(400).json({ error: "Faltan datos necesarios (destination, level 'pool' o 1-3)." })
    return
  }

  // Ronda 5 (BUG 14, parte 2 de 2): antes esta ruta SIEMPRE leía el JSON curado antiguo
  // (findDestinationData/destinations.json), incluso para Roma, que ya tiene su propio JSON v2
  // (data/pipeline_v2/roma.json) con nombres de lugar DISTINTOS ("Plaza España y Escalinata" en vez
  // de "Escalinata de Plaza de España", etc.) — el pool que veía el usuario nunca podía coincidir
  // con `findRawPlace` en routeAlgorithm.js, así que sus marcas jamás entraban en la ruta generada
  // (ver planMustIncludePlacement). Para un destino con datos v2, el pool sale de ahí directamente.
  const pipelineV2Data = findPipelineV2Data(destination)
  if (pipelineV2Data) {
    const toPoolPlace = (place) => ({
      name: place.name,
      category: pipelineV2Data.zones?.[place.zone]?.name ?? place.zone ?? null,
      type: place.type ?? null,
      duration_min: Number.isFinite(place.duration_minutes) ? place.duration_minutes : null,
      is_free_access: place.is_free_access ?? place.type === 'exterior',
    })
    const all = pipelineV2Data.places ?? []
    if (levelKey === 'pool') {
      res.json({ found: true, level: 'pool', places: buildCuratedPoolV2(pipelineV2Data).map(toPoolPlace) })
      return
    }
    const levelNumber = Number(levelKey)
    res.json({ found: true, level: levelNumber, places: all.filter((place) => place.level === levelNumber).map(toPoolPlace) })
    return
  }

  const destData = findDestinationData(destination)
  if (!destData) {
    res.json({ found: false, places: [] })
    return
  }

  const toLegacyPoolPlace = (place) => ({
    name: place.name,
    category: place.zone ?? null,
    type: place.type ?? null,
    duration_min: Number.isFinite(place.duration_min) ? place.duration_min : null,
    is_free_access: typeof place.is_free_access === 'boolean' ? place.is_free_access : null,
  })
  if (levelKey === 'pool') {
    const places = [...(destData.levels?.['1']?.places ?? []), ...(destData.levels?.['2']?.places ?? [])]
      .slice(0, CURATED_POOL_MAX_PLACES)
      .map(toLegacyPoolPlace)
    res.json({ found: true, level: 'pool', places })
    return
  }
  res.json({ found: true, level: Number(levelKey), places: (destData.levels?.[levelKey]?.places ?? []).map(toLegacyPoolPlace) })
})

app.post('/api/generate-day-places', async (req, res) => {
  const { destination, answers, must_include_places, skeleton_days } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers) || !Array.isArray(skeleton_days) || skeleton_days.length === 0) {
    res.status(400).json({ error: 'Faltan datos necesarios para elegir los lugares del viaje.' })
    return
  }

  const transportContext = readTransportContext(req.body)
  const listDayNumbers = skeleton_days
    .filter((day) => day.type === 'city' || day.type === 'relax')
    .map((day) => Number(day.day_number))
  if (listDayNumbers.length === 0) {
    res.json({ days: [] })
    return
  }

  // Pipeline v2 — mismo criterio de rango que generate-skeleton (solo Roma, hasta 5 días). Si
  // algún día de este bloque cae fuera de ese rango (buildDayPlacesV2 devuelve null para ESE día
  // en concreto), se salta solo ese día y se sigue con el resto — no debería pasar en la práctica
  // ya que el esqueleto que originó esta petición ya vino del mismo v2, pero por si acaso.
  const pipelineV2Data = findPipelineV2Data(destination)
  if (pipelineV2Data) {
    const hasFreeTour = hasFreeTourFromAnswers(answers)
    const v2Days = listDayNumbers
      .map((dayNumber) => ({ day_number: dayNumber, places: buildDayPlacesV2(pipelineV2Data, listDayNumbers.length, hasFreeTour, dayNumber, must_include_places, answers.experiencesPositive) }))
      .filter((entry) => Array.isArray(entry.places))
    if (v2Days.length === listDayNumbers.length) {
      console.log(`[pipeline-v2] "${destination}" — Fase 1 resuelta con el algoritmo JS, sin llamada a Claude`)
      res.json({ days: v2Days, recommended_revisits: [] })
      return
    }
  }

  const curatedDestination = findDestinationData(destination)
  if (curatedDestination) {
    try {
      const { days, recommended_revisits } = buildCuratedDayPlaces(curatedDestination, listDayNumbers, answers, must_include_places)
      console.log(`[curated-destinations] "${destination}" — Fase 1 resuelta desde el JSON curado, sin llamada a Claude`)
      res.json({ days, recommended_revisits })
    } catch (error) {
      console.error('[curated-destinations] fallo organizando el JSON curado:', error)
      res.status(502).json({ error: 'No se pudo organizar la lista curada de lugares del viaje.' })
    }
    return
  }

  const t0 = Date.now()
  console.log(`[timing] generate-day-places START ${new Date(t0).toISOString()}`)
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: DAY_PLACES_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDayPlacesUserPrompt(destination, answers, transportContext, skeleton_days, must_include_places) }],
    })
    console.log(`[timing] generate-day-places END — ${Date.now() - t0}ms`)
    logCallCost('generate-day-places', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeDayPlaces(parsed?.days, skeleton_days, must_include_places, answers.pace)
    enforceNeverMissLandmarks(days, destination, skeleton_days)
    // El camino con IA (destino no cubierto por el JSON curado) no tiene concepto estructurado de
    // double_visit — la "segunda visita" que decide Claude por su cuenta (ver regla 9 de
    // DAY_PLACES_SYSTEM_PROMPT) sigue siendo una parada normal repetida, no una recomendación aparte.
    res.json({ days, recommended_revisits: [] })
  } catch (error) {
    console.log(`[timing] generate-day-places FAILED — ${Date.now() - t0}ms`)
    logAnthropicError('generate-day-places', error)
    res.status(502).json({ error: 'No se pudo elegir la lista de lugares del viaje con IA.' })
  }
})

function sanitizeDayBlockDays(raw, blockDayNumbers) {
  if (!Array.isArray(raw)) return []
  const allowed = new Set(blockDayNumbers)
  return raw.filter((entry) => allowed.has(Number(entry?.day_number)) && Array.isArray(entry?.stops) && Array.isArray(entry?.meals))
}

// ── VALIDACIÓN POST-GENERACIÓN (red de seguridad, puramente JS — nunca una llamada extra a Claude) ──
//
// Antes esto reintentaba con una llamada extra a Claude si un día se quedaba corto de paradas
// (topUpShortDays/topUpDayStops) — con el rediseño de la generación en dos fases (Fase 1 ya decide
// la cantidad exacta de lugares por día, ver DAY_PLACES_SYSTEM_PROMPT), un día corto ya no es algo
// que se pueda arreglar pidiendo más — es una señal de que la Fase 1 se equivocó, así que solo se
// registra en logs para investigar, nunca se intenta "rellenar" automáticamente con otra llamada.

function parseTimeMinutes(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function countAfternoonStops(stops) {
  return stops.filter((stop) => {
    const minutes = parseTimeMinutes(stop?.suggested_time)
    return minutes != null && minutes >= AFTERNOON_WINDOW_MINUTES[0] && minutes < AFTERNOON_WINDOW_MINUTES[1]
  }).length
}

/** Un visita de 2.5h+ (museo grande, sitio arqueológico extenso...) puede ser legítimamente la
 * única parada de su franja — ver STOP COUNT en DAY_BLOCK_SYSTEM_PROMPT — así que su presencia
 * relaja el MÍNIMO TOTAL (no la cobertura de tarde, que sigue exigiéndose siempre: es justo la que
 * detecta el patrón real reportado — "Domus Aurea sola por la mañana + tarde con 1 parada + cena").
 */
const LONG_VISIT_MINUTES = 150

/** Cuántas paradas de más haría falta para cumplir el mínimo total (salvo que haya una visita larga, ver LONG_VISIT_MINUTES) y la cobertura de tarde. Solo aplica a días "city" (o sin type, por compatibilidad); road/excursion/relax quedan exentos, igual que en el prompt. Puramente informativo — ver logStopCountWarning. */
function computeStopDeficit(stops, dayType, pace) {
  if (dayType && dayType !== 'city') return 0
  const afternoonDeficit = Math.max(MIN_AFTERNOON_STOPS - countAfternoonStops(stops), 0)
  const hasLongVisit = stops.some((stop) => typeof stop?.duration_minutes === 'number' && stop.duration_minutes >= LONG_VISIT_MINUTES)
  if (hasLongVisit) return afternoonDeficit
  const minTotal = MIN_STOPS_BY_PACE[pace] ?? MIN_STOPS_BY_PACE.balanced
  const totalDeficit = Math.max(minTotal - stops.length, 0)
  return Math.max(totalDeficit, afternoonDeficit)
}

/** Si un día "city" se queda corto de paradas o de cobertura de tarde, es una señal de que la Fase 1 (generate-day-places) decidió muy pocos lugares para ese día — se registra para investigar, nunca se intenta arreglar aquí con una llamada extra (ver VALIDACIÓN POST-GENERACIÓN arriba). */
function logStopCountWarning(day, dayType, pace) {
  const deficit = computeStopDeficit(day.stops ?? [], dayType, pace)
  if (deficit > 0) {
    console.log(`[stop-count] day ${day.day_number} — se esperaban ${deficit} parada(s) más para el ritmo "${pace}" (revisar generate-day-places para este día)`)
  }
}

// ── Red de seguridad post-generación: horarios de apertura ─────────────────────────────────
//
// El prompt (REAL OPENING HOURS + CRITICAL VALIDATION en DAY_BLOCK_SYSTEM_PROMPT) ya le pide esto a
// Claude, pero un prompt es una petición, no una garantía (feedback de calidad: el Coliseo salió
// programado a las 07:30 con apertura a las 08:30). Doble red: (A) corrige en el momento lo que se
// puede corregir sin ambigüedad — un suggested_time anterior a la apertura real es simplemente
// incorrecto, se sube a la hora de apertura; (B) dos avisos en logs para lo que NO se puede corregir
// automáticamente sin arriesgar falsos positivos — nunca se inventa un horario ni se fuerza
// hours≠null solo por la categoría, eso lo decide mejor el propio prompt caso a caso.

function parseHHMM(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function parseOpeningMinutesServer(hours) {
  if (typeof hours !== 'string') return null
  const match = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(hours)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function formatMinutesAsHHMM(totalMinutes) {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

/** Categorías cuyo nombre normalmente implica interior visitable con taquilla — solo para el aviso (B), nunca para forzar un cambio: "landmark"/"neighborhood"/"viewpoint" cubren de sobra sitios de acceso libre que el prompt ya clasifica bien. */
const TYPICALLY_INDOOR_CATEGORIES = new Set(['museum', 'temple'])

function validateStopHours(day) {
  if (!Array.isArray(day?.stops)) return
  for (const stop of day.stops) {
    const openingMinutes = parseOpeningMinutesServer(stop?.hours)
    const suggestedMinutes = parseHHMM(stop?.suggested_time)
    if (openingMinutes != null && suggestedMinutes != null && suggestedMinutes < openingMinutes) {
      const fixed = formatMinutesAsHHMM(openingMinutes)
      console.log(
        `[hours-validation] day ${day.day_number} — "${stop.name}" suggested_time ${stop.suggested_time} es antes de que abra (${stop.hours}) — ajustado a ${fixed}`,
      )
      stop.suggested_time = fixed
    }
    if ((stop?.hours === null || stop?.hours === undefined) && TYPICALLY_INDOOR_CATEGORIES.has(stop?.category)) {
      console.log(`[hours-validation] day ${day.day_number} — "${stop?.name}" (${stop?.category}) sin horario real (hours=null) — revisar si debería tener taquilla/horario`)
    }
  }
}

// ── Red de seguridad post-generación: el Free Tour debe ser la parada MÁS TEMPRANA del día ──
//
// El prompt (FREE TOUR + la excepción añadida en REAL OPENING HOURS) ya pide esto, pero visto en
// vivo: Claude a veces igual programa otra parada (ej. un museo de apertura temprana) ANTES del Free
// Tour, aplicando la regla de horarios de apertura reales por encima de la del Free Tour. Regla simple:
// el Free Tour mantiene su hora tal cual la puso Claude (normalmente 10:00) y cualquier parada que
// quedó antes se mueve a justo después de que termine el tour — sin intercambios ni recálculos del
// resto del día. EXCEPCIÓN explícita: las paradas de relleno pre-Free-Tour del ritmo Completo (ver
// buildFreeTourPrefillStops/FREE_TOUR_PREFILL_BEST_TIME) tienen que quedarse ANTES a propósito — sin
// `requiredPlaces` aquí, esta misma función se comería el relleno que el punto 5 pide dejar ahí.
function enforceFreeTourFirst(day, requiredPlaces) {
  if (!Array.isArray(day?.stops) || day.stops.length < 2) return
  const freeTourStop = day.stops.find((stop) => stop?.is_free_tour)
  if (!freeTourStop) return
  const freeTourMinutes = parseHHMM(freeTourStop.suggested_time)
  if (freeTourMinutes == null) return

  const prefillNames = Array.isArray(requiredPlaces)
    ? requiredPlaces.filter((place) => place.best_time === FREE_TOUR_PREFILL_BEST_TIME).map((place) => place.name)
    : []
  const isPrefillStop = (stop) => prefillNames.some((name) => isFuzzyPlaceMatch(name, stop?.name))

  const freeTourDuration = typeof freeTourStop.duration_minutes === 'number' ? freeTourStop.duration_minutes : 165
  let nextAvailable = freeTourMinutes + freeTourDuration + 30

  const earlyStops = day.stops
    .filter(
      (stop) => stop !== freeTourStop && !isPrefillStop(stop) && parseHHMM(stop?.suggested_time) != null && parseHHMM(stop.suggested_time) < freeTourMinutes,
    )
    .sort((a, b) => parseHHMM(a.suggested_time) - parseHHMM(b.suggested_time))

  for (const stop of earlyStops) {
    console.log(
      `[free-tour-order] day ${day.day_number} — "${stop.name}" empezaba antes (${stop.suggested_time}) que el Free Tour (${freeTourStop.suggested_time}) — se mueve después`,
    )
    stop.suggested_time = formatMinutesAsHHMM(nextAvailable)
    const stopDuration = typeof stop.duration_minutes === 'number' ? stop.duration_minutes : 45
    nextAvailable += stopDuration + 20
  }
}

// ── Red de seguridad post-generación: comidas coladas como parada numerada ─────────────────
//
// El prompt (MEALS ARE NEVER A NUMBERED STOP en DAY_BLOCK_SYSTEM_PROMPT) ya lo prohíbe
// explícitamente, pero un prompt es una petición, no una garantía (feedback de calidad: "Pausa
// para almuerzo"/"Almuerzo en Prati" aparecieron como parada 3 justo después del bloque dorado de
// "Hora de comer", literalmente duplicando la comida). Coincidencia ANCLADA al string COMPLETO
// (^...$, no solo al principio) a propósito — una parada gastronómica real y con nombre propio como
// "Cena maridaje en bodega histórica" o "Mercado de la Comida de Madrid" NO debe caer aquí, solo el
// patrón desnudo "Almuerzo"/"Cena en Prati"/"Pausa para almuerzo" sin ningún contenido propio detrás.
const MEAL_LIKE_STOP_NAME = /^(pausa para|parada para)?\s*(almuerzo|comida|cena|desayuno|brunch)(\s+en\s+.+)?$/i

function filterMealLikeStops(day) {
  if (!Array.isArray(day?.stops)) return
  const kept = []
  for (const stop of day.stops) {
    if (typeof stop?.name === 'string' && MEAL_LIKE_STOP_NAME.test(stop.name.trim())) {
      console.log(`[meal-dedup] day ${day.day_number} — parada "${stop.name}" descartada por parecer una comida (las comidas van solo en "meals")`)
      continue
    }
    kept.push(stop)
  }
  day.stops = kept
}

// ── Red de seguridad post-generación: un highlight del Free Tour repetido como parada del MISMO día ──
//
// El prompt (FREE TOUR en DAY_BLOCK_SYSTEM_PROMPT) ya pide explícitamente no repetir ese mismo día
// ningún lugar de "free_tour_highlights" como parada individual (sí se permite en OTROS días) — pero
// en la práctica Claude a veces lo hace igual (visto en real: "Foro Romano (vista exterior)" en los
// highlights del Free Tour Y "Foro Romano" como parada 5 numerada del mismo día). Comparación
// tolerante a paréntesis ("Foro Romano" == "Foro Romano (vista exterior)") para pillar el caso real.
function normalizePlaceNameForMatch(name) {
  return typeof name === 'string' ? name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim() : ''
}

/**
 * `requiredPlaces` (lista exacta de la Fase 1 para este día, si la hay — ver REQUIRED PLACES en
 * DAY_BLOCK_SYSTEM_PROMPT) nunca se toca aquí: si una parada obligatoria coincide por casualidad con
 * un highlight del Free Tour (visto en vivo con Roma: "Piazza Venezia"/"Foro de Trajano"/etc. son a
 * la vez lugares imprescindibles Y sitios por los que pasa cualquier free tour real), eso es
 * información correcta sobre la ruta del tour, no una parada duplicada que haya que borrar — borrarla
 * violaría la garantía de REQUIRED PLACES. Sin lista (días "road", o el pipeline de redistribución de
 * caché que no la calcula) se mantiene el comportamiento antiguo tal cual.
 */
function filterFreeTourDuplicateStops(day, requiredPlaces) {
  if (!Array.isArray(day?.stops)) return
  const freeTourStop = day.stops.find((stop) => stop?.is_free_tour)
  const highlights = Array.isArray(freeTourStop?.free_tour_highlights) ? freeTourStop.free_tour_highlights.map(normalizePlaceNameForMatch) : []
  if (highlights.length === 0) return
  const requiredNames = new Set((Array.isArray(requiredPlaces) ? requiredPlaces : []).map((place) => normalizePlaceNameForMatch(place.name)))
  day.stops = day.stops.filter((stop) => {
    if (stop === freeTourStop) return true
    if (requiredNames.has(normalizePlaceNameForMatch(stop?.name))) return true
    if (!highlights.includes(normalizePlaceNameForMatch(stop?.name))) return true
    console.log(`[free-tour-dedup] day ${day.day_number} — parada "${stop.name}" descartada por repetir un highlight del Free Tour de ese mismo día`)
    return false
  })
}

/** Tolerante a pequeñas variaciones de redacción entre el nombre exacto de la Fase 1 y cómo Claude
 * lo repite en la Fase 2 (ej. "Museo del Louvre" vs "Louvre", "Coliseo" vs "Coliseo de Roma") —
 * contención de substring en ambos sentidos sobre el nombre ya normalizado, mismo espíritu que
 * isNameAlreadyInRoute en el cliente (routeStopsIndex.ts). */
/** Palabras "significativas" (>3 letras, sin acentos) de un nombre — ignora artículos/preposiciones cortos (de/la/von/di/...) que no aportan nada a la comparación. */
function significantNameWords(name) {
  return stripAccentsLower(name)
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3)
}

/** Dos palabras "casi iguales" si comparten los primeros ~5 caracteres — cubre variantes de idioma con la misma raíz (conciliaZIONE/conciliaCIÓN, TREVi/TREVi) sin necesitar diccionario de traducción. */
function wordsRoughlyMatch(wordA, wordB) {
  if (wordA === wordB) return true
  const prefixLength = Math.min(5, wordA.length, wordB.length)
  return prefixLength >= 4 && wordA.slice(0, prefixLength) === wordB.slice(0, prefixLength)
}

/**
 * Contención de substring (rápido, cubre la mayoría de casos: "Coliseo" ⊂ "Coliseo de Roma") con una
 * segunda pasada de solapamiento de palabras-raíz para variantes de idioma que ninguna cadena
 * contiene literalmente (visto en vivo: Claude tradujo "Via della Conciliazione" del JSON curado a
 * "Vía de la Conciliación" — mismo lugar, pero un substring puro nunca las habría emparejado). El
 * umbral 60% está calibrado para NO confundir lugares distintos que comparten una sola palabra
 * (ej. "Piazza Navona" vs "Piazza del Popolo", "Galería Borghese" vs "Jardines de Villa Borghese").
 */
function isFuzzyPlaceMatch(nameA, nameB) {
  const a = normalizePlaceNameForMatch(nameA)
  const b = normalizePlaceNameForMatch(nameB)
  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true

  const wordsA = significantNameWords(nameA)
  const wordsB = significantNameWords(nameB)
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const matched = wordsA.filter((wordA) => wordsB.some((wordB) => wordsRoughlyMatch(wordA, wordB)))
  return matched.length / Math.min(wordsA.length, wordsB.length) >= 0.6
}

/**
 * Filtro estricto: en un día con lista de Fase 1 (REQUIRED PLACES), CUALQUIER parada que no
 * corresponda a un lugar de esa lista se elimina — no solo se avisa (ver logMissingRequiredPlaces,
 * que detecta el caso contrario: un lugar requerido que NO apareció). Encontrado en vivo con París:
 * Claude coló "Pausa para almuerzo cerca del Louvre" como parada numerada — MEAL_LIKE_STOP_NAME no
 * la detectó por la redacción exacta ("cerca del" en vez de "en"). Con una lista exacta ya decidida
 * en Fase 1 no hay ninguna razón legítima para que aparezca una parada fuera de ella, así que se
 * corta de raíz aquí en vez de intentar cubrir cada variante de redacción con más regex.
 */
function stripNonRequiredStops(day, requiredPlaces) {
  if (!Array.isArray(requiredPlaces) || requiredPlaces.length === 0 || !Array.isArray(day?.stops)) return
  day.stops = day.stops.filter((stop) => {
    if (stop?.is_free_tour) return true
    if (requiredPlaces.some((place) => isFuzzyPlaceMatch(place.name, stop?.name))) return true
    console.log(`[required-places] day ${day.day_number} — parada "${stop?.name}" descartada por no estar en la lista de la Fase 1`)
    return false
  })
}

/**
 * A Claude ya no se le pide que reescriba en su respuesta el tip de un lugar que el JSON curado ya
 * trae decidido (ver formatRequiredPlaceItem/DAY_BLOCK_SYSTEM_PROMPT — se le dice explícitamente que
 * deje "tip": "" para esos lugares) — pagar ese mismo texto dos veces (una vez en el prompt, otra en
 * cada respuesta) no ganaba nada y era una causa real de cortes por max_tokens en días con muchos
 * lugares curados. Esta función es la otra mitad: inyecta el tip real directamente en el JSON final,
 * por el lugar requerido que haga match (misma lógica de emparejado que stripNonRequiredStops).
 */
function applyCuratedTips(day, requiredPlaces) {
  if (!Array.isArray(requiredPlaces) || requiredPlaces.length === 0 || !Array.isArray(day?.stops)) return
  for (const place of requiredPlaces) {
    if (!Array.isArray(place.tips) || place.tips.length === 0) continue
    const stop = day.stops.find((candidate) => isFuzzyPlaceMatch(place.name, candidate?.name))
    if (stop) stop.tip = place.tips.join(' ')
  }
}

// ── Red de seguridad post-generación: lugares requeridos que no aparecieron ────────────────
//
// La Fase 1 (generate-day-places) decide la lista EXACTA de lugares de un día "city" — el prompt de
// DAY_BLOCK_SYSTEM_PROMPT (REQUIRED PLACES) le prohíbe a Claude omitir ninguno, pero esto lo
// verifica de verdad: si algo de la lista no aparece en la respuesta final, se registra para
// investigar — nunca se inventa contenido aquí a ciegas, mejor un aviso en logs.
function logMissingRequiredPlaces(day, requiredPlaces) {
  if (!Array.isArray(requiredPlaces) || requiredPlaces.length === 0) return
  const stops = day.stops ?? []
  for (const place of requiredPlaces) {
    // El marcador de Free Tour nunca aparece con su nombre literal en la respuesta (Claude lo
    // expande a "Free Tour: <destino>" con is_free_tour:true, ver formatRequiredPlaceItem) — se
    // comprueba aparte, por la marca real, no por coincidencia de nombre.
    if (place.name === FREE_TOUR_REQUIRED_PLACE_MARKER) {
      if (!stops.some((stop) => stop?.is_free_tour)) {
        console.log(`[required-places] day ${day.day_number} — el Free Tour era obligatorio pero no aparece en la respuesta final (ninguna parada con is_free_tour:true)`)
      }
      continue
    }
    if (!stops.some((stop) => isFuzzyPlaceMatch(place.name, stop?.name))) {
      console.log(`[required-places] day ${day.day_number} — "${place.name}" estaba en la lista de la Fase 1 pero no aparece en la respuesta final`)
    }
  }
}

/**
 * A diferencia de logMissingRequiredPlaces (solo avisa), esto LANZA si falta un intocable del
 * destino — "los intocables nunca se sustituyen" es una regla dura (punto 4), así que perder uno se
 * trata como un fallo real del bloque, no una nota informativa. Sin `destData` (destino no curado, o
 * sin `intocables` en el JSON) no hay nada que verificar. El marcador de Free Tour nunca es intocable
 * en sí mismo, se ignora aquí (ya lo cubre logMissingRequiredPlaces).
 */
function assertNoMissingIntocables(day, requiredPlaces, destData) {
  if (!destData || !Array.isArray(requiredPlaces) || requiredPlaces.length === 0) return
  const stops = day.stops ?? []
  for (const place of requiredPlaces) {
    if (place.name === FREE_TOUR_REQUIRED_PLACE_MARKER) continue
    if (!isIntocable(place.name, destData)) continue
    if (!stops.some((stop) => isFuzzyPlaceMatch(place.name, stop?.name))) {
      throw new Error(`El intocable "${place.name}" (día ${day.day_number}) no aparece en la respuesta — se reintenta el bloque.`)
    }
  }
}

// ── Red de seguridad post-generación: coherencia geográfica del día ────────────────────────
//
// Más de 15km en línea recta entre paradas consecutivas de un mismo día probablemente significa que
// se mezclaron zonas que no deberían ir juntas (ver GEOGRAPHIC GROUPING en DAY_PLACES_SYSTEM_PROMPT)
// — solo se registra para investigar, nunca se reordena/corrige automáticamente aquí.
const MAX_REASONABLE_WALKING_KM_PER_DAY = 15

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const radius = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(a))
}

function logGeographicCoherence(day) {
  const stops = (day.stops ?? []).filter(
    (stop) => typeof stop?.latitude === 'number' && typeof stop?.longitude === 'number' && (stop.latitude !== 0 || stop.longitude !== 0),
  )
  if (stops.length < 2) return
  let totalKm = 0
  for (let i = 1; i < stops.length; i++) {
    totalKm += haversineKm(stops[i - 1].latitude, stops[i - 1].longitude, stops[i].latitude, stops[i].longitude)
  }
  if (totalKm > MAX_REASONABLE_WALKING_KM_PER_DAY) {
    console.log(`[geo-coherence] day ${day.day_number} — ${totalKm.toFixed(1)}km en línea recta entre paradas consecutivas (posible mezcla de zonas lejanas)`)
  }
}

/**
 * Las excursiones del JSON del destino en el formato `excursions_available` que el cliente ya sabe
 * leer (ver mapExcursionsByDay en mapGeneratedRoute.ts), etiquetadas con el día al que pertenecen.
 *
 * Precios y valoraciones: los que llevan `provisional_pricing` están puestos a mano hasta que se
 * integre la API de afiliados. Viaja el flag hasta el cliente para que, el día que se decida no
 * enseñar una nota inventada como si fuera real, no haya que volver a adivinar cuál lo es.
 */
function excursionsAvailablePayload(destData, dayNumber, options, totalDays, pace) {
  return (options ?? excursionOptionsFor(destData, totalDays, pace)).map((option) => ({
    id: option.id,
    name: option.name,
    duration: option.half_day ? 'half_day' : 'full_day',
    duration_hours: option.duration_hours ?? null,
    emoji: option.emoji ?? null,
    description: option.description ?? '',
    estimated_price: typeof option.price_from_eur === 'number' ? `${option.price_from_eur}€` : '',
    rating: option.rating ?? null,
    review_count: option.review_count ?? null,
    provisional_pricing: option.provisional_pricing !== false,
    /** Dónde arranca la excursión, tal cual lo publica el operador. */
    meeting_point: option.meeting_point ?? null,
    destination_coords: Array.isArray(option.destination_coords) ? { lat: option.destination_coords[0], lng: option.destination_coords[1] } : null,
    // Cómo buscar esta excursión en Civitatis, escrito a mano en el JSON del destino: "pompeya
    // desde roma" encuentra lo que el viajero quiere; el nombre de la tarjeta encuentra bastante
    // menos. El enlace sigue yendo a la búsqueda y no al `civitatis_slug`: un slug equivocado es un
    // 404 delante del viajero, y una búsqueda no puede romperse.
    civitatis_search: option.civitatis_search ?? null,
    suggested_day: dayNumber,
  }))
}


// ── Foto de un lugar: Unsplash validado -> Wikipedia -> nada ─────────────────────────────────
//
// Prompt 5. Vive en el servidor por dos razones: la clave de Unsplash no puede salir al bundle del
// cliente, y así la caché es COMPARTIDA (Supabase) en vez de por sesión — cada foto se busca una
// sola vez para todos los viajeros, que es lo que hace viable un rate limit de 50 peticiones/hora.
//
// Unsplash NO es una base de datos de lugares: para una consulta genérica devuelve fotos preciosas
// y de otro sitio. Comprobado contra la API antes de escribir esto: "Giardino degli Aranci Rome"
// devuelve 2068 resultados y el primero es un pasillo con plantas; "Sant'Ignazio Church Rome" da
// 1423 y el primero es gente paseando por un parque. Por eso se piden 5 y se acepta solo el que
// MENCIONA el lugar en su descripción o sus tags. Una foto equivocada es peor que ninguna foto.

const UNSPLASH_UTM = 'utm_source=viajes_bengala&utm_medium=referral'

/** Palabras que tienen que aparecer en la metadata de la foto. Las declara el JSON del destino
    (`search_en_keywords`); sin ellas se extraen del propio `search_en` quitando la ciudad y las
    palabras vacías, que es lo que queda de distintivo. */
function photoKeywords(searchEn, declared) {
  if (Array.isArray(declared) && declared.length > 0) return declared.map((k) => stripAccentsLowerServer(k))
  const vacias = new Set(['rome', 'roma', 'the', 'of', 'in', 'de', 'del', 'della', 'dei', 'di', 'and', 'y'])
  return stripAccentsLowerServer(searchEn)
    .split(/\s+/)
    .filter((word) => word.length > 3 && !vacias.has(word))
}

async function searchUnsplashPhoto(searchEn, keywords) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key || !searchEn) return null
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchEn)}&per_page=5&orientation=landscape&content_filter=high`
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })
  if (!response.ok) {
    console.warn(`[foto] Unsplash devolvió ${response.status} para "${searchEn}"`)
    return null
  }
  const data = await response.json()
  const results = Array.isArray(data?.results) ? data.results : []
  if (results.length === 0) return null

  for (const photo of results) {
    const texto = stripAccentsLowerServer(
      [photo.description ?? '', photo.alt_description ?? '', ...(photo.tags ?? []).map((tag) => tag?.title ?? '')].join(' '),
    )
    if (!keywords.some((keyword) => texto.includes(keyword))) continue
    return {
      photo_source: 'unsplash',
      photo_url: photo.urls?.small ?? null,
      unsplash_thumb: photo.urls?.thumb ?? null,
      unsplash_small: photo.urls?.small ?? null,
      unsplash_regular: photo.urls?.regular ?? null,
      unsplash_blur_hash: photo.blur_hash ?? null,
      unsplash_photographer: photo.user?.name ?? null,
      unsplash_photographer_url: photo.user?.links?.html ? `${photo.user.links.html}?${UNSPLASH_UTM}` : null,
      unsplash_url: `https://unsplash.com?${UNSPLASH_UTM}`,
    }
  }
  // Ninguna de las cinco habla del lugar — mejor dejar pasar a Wikipedia.
  console.log(`[foto] Unsplash tenía ${results.length} resultados para "${searchEn}" pero ninguno menciona el lugar`)
  return null
}

/** Wikipedia en español, igual que hacía el cliente hasta ahora: con `wikipedia_title` se va directo
    al artículo (admite prefijo de idioma, "en:Colosseum"), y si no, se busca por nombre. */
async function searchWikipediaPhoto(name, city, wikipediaTitle) {
  const MIN_WIDTH = 300
  const resumen = async (lang, title) => {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    if (!r.ok) return null
    const data = await r.json()
    const source = data?.thumbnail?.source
    return typeof source === 'string' && (data?.thumbnail?.width ?? 0) >= MIN_WIDTH ? source : null
  }
  try {
    if (wikipediaTitle) {
      const match = wikipediaTitle.match(/^([a-z]{2}):(.+)$/)
      const url = await resumen(match ? match[1] : 'es', match ? match[2] : wikipediaTitle)
      return url ? { photo_source: 'wikipedia', photo_url: url } : null
    }
    const buscar = await fetch(
      `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${name} ${city}`)}&format=json&srlimit=1`,
      { headers: { 'User-Agent': 'ViajesBengala/1.0 (route planner)' } },
    )
    if (!buscar.ok) return null
    const title = (await buscar.json())?.query?.search?.[0]?.title
    if (!title) return null
    const url = await resumen('es', title)
    return url ? { photo_source: 'wikipedia', photo_url: url } : null
  } catch {
    return null
  }
}

/**
 * Cascada completa de una foto. `force` salta la caché — solo lo usa el script de pre-población,
 * para poder repetir una búsqueda tras corregir un `search_en`.
 */
async function resolvePlacePhoto(name, city, { force = false, wikipediaTitleOverride = null } = {}) {
  const cityKey = stripAccentsLowerServer(city)
  if (supabaseAdmin && !force) {
    const { data, error } = await supabaseAdmin.from('place_photo_cache').select('*').eq('city', cityKey).eq('place_name', name).maybeSingle()
    if (error) console.warn('[foto] no se pudo leer la caché:', error.message)
    if (data) return { ...data, cached: true }
  }

  const destData = findPipelineV2Data(city)
  const place = (destData?.places ?? []).find((candidate) => candidate.name === name) ?? null

  let resultado = await searchUnsplashPhoto(place?.search_en ?? `${name} ${city}`, photoKeywords(place?.search_en ?? name, place?.search_en_keywords))
  // El destino curado manda; el override solo cubre destinos SIN JSON, donde el servidor no
  // tiene de dónde sacar el título y es la parada la que lo trae.
  if (!resultado) resultado = await searchWikipediaPhoto(name, city, place?.wikipedia_title ?? wikipediaTitleOverride)
  if (!resultado) resultado = { photo_source: 'none' }

  const fila = { place_name: name, city: cityKey, ...resultado }
  if (supabaseAdmin) {
    // upsert, no insert: el script de pre-población puede reescribir una fila ya existente.
    const { error } = await supabaseAdmin.from('place_photo_cache').upsert(fila, { onConflict: 'place_name,city' })
    if (error) console.warn('[foto] no se pudo guardar en caché:', error.message)
  }
  return { ...fila, cached: false }
}

app.post('/api/place-photo', async (req, res) => {
  const { name, city, force, wikipedia_title: wikipediaTitleOverride } = req.body ?? {}
  if (!name || !city) {
    res.status(400).json({ error: 'Se requiere name y city.' })
    return
  }
  try {
    const foto = await resolvePlacePhoto(name, city, { force: Boolean(force), wikipediaTitleOverride })
    res.json(foto)
  } catch (error) {
    // Nunca debe romper una pantalla: sin foto, el componente enseña su icono de categoría.
    console.error('[foto] fallo resolviendo la foto de', name, error)
    res.json({ photo_source: 'none' })
  }
})

app.post('/api/generate-day-block', async (req, res) => {
  const { destination, answers, block_days, places_for_block, all_days, is_first_block_of_trip, must_include_places, engine } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers) || !Array.isArray(block_days) || block_days.length === 0) {
    res.status(400).json({ error: 'Faltan datos necesarios para generar este bloque de días.' })
    return
  }

  const transportContext = readTransportContext(req.body)
  const blockDayNumbers = block_days.map((day) => Number(day.day_number)).filter((n) => Number.isInteger(n))
  const typeByDayNumber = new Map(block_days.map((day) => [Number(day.day_number), day.type]))
  const requiredPlacesByDayNumber = new Map(
    (Array.isArray(places_for_block) ? places_for_block : []).map((entry) => [Number(entry.day_number), entry.places]),
  )

  // Pipeline v2 — BLOCK_SIZE=1 en todo el pipeline (ver routeGenerationOrchestrator.ts), así que
  // `block_days` siempre trae un único día aquí; `all_days` (resumen ligero de TODO el viaje, ver
  // generate-skeleton) da el número total de días de Roma para indexar zone_distribution. Si el
  // algoritmo v2 no cubre este día (destino distinto, o 6+ días), buildDayBlockV2 devuelve null y
  // se sigue exactamente con la llamada a Claude de siempre, más abajo.
  const pipelineV2Data = findPipelineV2Data(destination)

  // Prompt 4 — tipo de día. Antes de construir nada: un día de excursión o un día libre no tienen
  // ruta que calcular, así que se resuelven aquí y se ahorran tanto el algoritmo como la llamada a
  // Claude. Y a diferencia de buildDayBlockV2 (que solo cubre 2-5 días, ver zone_distribution),
  // esto funciona en cualquier día del viaje: un Roma de 8 días saca días libres del 6 al 8 sin
  // pedirle nada a la IA, que es justo donde antes se le pedía más y peor.
  // Con el motor NUEVO este bloque no corre: el tipo de cada día (excursión, libre, revisitas)
  // lo decide el propio motor a partir de `core_days`/`max_auto_days` del destino, no del
  // `day_pattern` del JSON. Dejar los dos decidiendo daba resultados distintos según quién mirara.
  if (pipelineV2Data && blockDayNumbers.length === 1 && engineFor(engine) === 'viejo') {
    const dayNumber = blockDayNumbers[0]
    const totalDaysForConfig = Array.isArray(all_days) && all_days.length > 0 ? all_days.length : dayNumber
    const dayConfig = getDayConfig(dayNumber, pipelineV2Data)

    if (dayConfig.type === 'excursion') {
      const day = buildExcursionDayV2(pipelineV2Data, dayNumber, totalDaysForConfig, answers.pace)
      day.excursion_prominence = dayConfig.excursionProminence
      // Regla 3: la ruta curada NUNCA se pierde. Si este día tenía una escrita a mano, viaja como
      // alternativa ("tenemos una ruta preparada") con un adelanto de lo que contiene, para que
      // volver a ella sea un toque y no una pérdida silenciosa.
      day.curated_alternative = curatedRoutePreview(pipelineV2Data, totalDaysForConfig, hasFreeTourFromAnswers(answers), dayNumber)
      console.log(
        `[pipeline-v2] "${destination}" día ${dayNumber} — día de EXCURSIÓN (${day.excursion_options.length} opciones${day.curated_alternative ? ', con ruta curada de alternativa' : ''}), sin llamada a Claude`,
      )
      res.json({ days: [day], not_included: [], excursions_available: excursionsAvailablePayload(pipelineV2Data, dayNumber, undefined, totalDaysForConfig, answers.pace) })
      return
    }

    if (dayConfig.type === 'manual') {
      console.log(`[pipeline-v2] "${destination}" día ${dayNumber} — día LIBRE (lo monta el viajero), sin llamada a Claude`)
      // Las excursiones viajan igual: un día libre ofrece "buscar excursiones" como una de sus dos
      // salidas, y necesita el catálogo para enseñarlo sin pedir nada más.
      res.json({ days: [buildManualDayV2(dayNumber)], not_included: [], excursions_available: excursionsAvailablePayload(pipelineV2Data, dayNumber, undefined, totalDaysForConfig, answers.pace) })
      return
    }
  }

  if (pipelineV2Data && blockDayNumbers.length === 1) {
    // `all_days` son los días de CONTENIDO (el esqueleto no incluye la vuelta: la añade el cliente
    // con appendReturnLegDay), pero el motor cuenta el viaje entero y descuenta él la vuelta
    // (`contentDays = totalDays - 1`, invariante 21). Sin el +1 el motor se comía el último día de
    // cada viaje: se quedaba sin plan, `buildDayBlockV3` devolvía null y el día caía en una llamada
    // de pago a Claude — en un destino curado, que es justo lo que el pipeline evita.
    const totalDaysV2 = Array.isArray(all_days) && all_days.length > 0 ? all_days.length + 1 : blockDayNumbers[0] + 1
    // Motor nuevo detrás de bandera (ver server/engine/index.js): `ROUTE_ENGINE=nuevo` en el
    // entorno para todas las rutas, o `"engine": "nuevo"` en el cuerpo para comparar los dos
    // motores en la misma ruta sin reiniciar nada. Por defecto sigue mandando el viejo.
    const chosenEngine = engineFor(engine)
    try {
      const dayBlockV2 = chosenEngine !== 'viejo'
        ? await buildDayBlockV3(
            pipelineV2Data,
            totalDaysV2,
            hasFreeTourFromAnswers(answers),
            blockDayNumbers[0],
            answers.pace,
            MAPBOX_TOKEN,
            answers.dateRange?.start,
            must_include_places,
            answers.experiencesPositive,
            { city: destination, scheduler: chosenEngine === 'v3' ? 'v3' : undefined, season: answers.season ?? null },
          )
        : await buildDayBlockV2(
        pipelineV2Data,
        totalDaysV2,
        hasFreeTourFromAnswers(answers),
        blockDayNumbers[0],
        answers.pace,
        MAPBOX_TOKEN,
        answers.dateRange?.start,
        must_include_places,
        answers.experiencesPositive,
      )
      if (dayBlockV2) {
        // 'smart_route' es una ruta normal marcada: mismas paradas reales, pero el cliente sabe que
        // es el día "de propina" tras la excursión y ofrece convertirlo igual que los demás.
        const dayConfig = getDayConfig(blockDayNumbers[0], pipelineV2Data)
        if (dayConfig.type === 'smart_route') dayBlockV2.type = 'smart_route'
        dayBlockV2.excursion_prominence = dayConfig.excursionProminence
        // Solo los días prominentes llevan las destacadas: en los sutiles el banner no existe y
        // mandarlas sería peso muerto en la respuesta.
        if (dayConfig.excursionProminence === 'prominent') {
          dayBlockV2.excursion_highlights = excursionsAvailablePayload(pipelineV2Data, blockDayNumbers[0], topExcursions(pipelineV2Data, 3, totalDaysV2, answers.pace))
        }
        console.log(
          `[pipeline-v2] "${destination}" día ${blockDayNumbers[0]} — Fase 2 resuelta con el algoritmo JS + Mapbox (motor ${chosenEngine}), sin llamada a Claude`,
        )
        // El catálogo que viaja con el día son las de jornada completa (desde la ficha se puede
        // convertir un día normal en excursión). Si ADEMÁS este día lleva una de medio día por la
        // mañana, se añade la suya: no está en el catálogo porque no compite con ellas, pero el
        // cliente necesita sus datos para pintar la tarjeta.
        //
        // Un día EN BLANCO (por encima de `max_auto_days`) se lleva TODAS las de medio día: ahí el
        // viajero elige él lo que hace con el día, y media jornada fuera con la tarde libre es
        // justo lo que mejor le encaja a un día que el destino ya no sabe llenar.
        const excursionesDelDia = excursionsAvailablePayload(pipelineV2Data, blockDayNumbers[0], undefined, totalDaysV2, answers.pace)
        const mediasJornadas = dayBlockV2.beyond_auto_days
          ? halfDayExcursions(pipelineV2Data)
          : halfDayExcursions(pipelineV2Data).filter((option) => option.id === dayBlockV2.half_day_excursion?.id)
        if (mediasJornadas.length > 0) {
          excursionesDelDia.push(...excursionsAvailablePayload(pipelineV2Data, blockDayNumbers[0], mediasJornadas))
        }
        res.json({
          days: [dayBlockV2],
          not_included: dayBlockV2.not_included ?? [],
          excursions_available: excursionesDelDia,
        })
        return
      }
    } catch (error) {
      // Nunca debe poder bloquear la generación — si el algoritmo v2 falla por lo que sea
      // (Mapbox caído, dato inesperado), se cae al camino de Claude de toda la vida, igual que
      // cualquier otro fallo best-effort de este pipeline.
      console.error(`[pipeline-v2] fallo construyendo el día ${blockDayNumbers[0]} con el algoritmo JS, cae a Claude:`, error)
    }
  }

  const t0 = Date.now()
  console.log(`[timing] generate-day-block START ${new Date(t0).toISOString()} (days=${blockDayNumbers.join(',')})`)
  try {
    // Streaming (mismo motivo que antes en la llamada única): evita el límite de la API para
    // respuestas largas en modo no-streaming — un bloque de 3-4 días con paradas/comidas detalladas
    // puede acercarse a ese límite en viajes de ritmo intenso.
    const stream = anthropic.messages.stream({
      model: MODEL,
      // Sonnet 4.6 soporta hasta 128K de salida en streaming (ya usado aquí) — 16000 se quedaba
      // corto en días con muchos lugares curados y ritmo "Completo" real, provocando cortes por
      // max_tokens reales en producción (ver también applyCuratedTips: ya no se le pide a Claude
      // que reescriba tips que el JSON curado ya trae, así que esto es margen adicional, no el
      // único fix).
      max_tokens: 24000,
      system: DAY_BLOCK_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildDayBlockUserPrompt(destination, answers, transportContext, block_days, places_for_block, all_days, Boolean(is_first_block_of_trip)),
        },
      ],
    })
    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_start') console.log(`[timing] generate-day-block (days=${blockDayNumbers.join(',')}) first content byte — ${Date.now() - t0}ms`)
    })
    const response = await stream.finalMessage()
    console.log(`[timing] generate-day-block END (days=${blockDayNumbers.join(',')}) — ${Date.now() - t0}ms — stop_reason=${response.stop_reason}`)
    logCallCost(`generate-day-block (days=${blockDayNumbers.join(',')})`, response)

    if (response.stop_reason === 'max_tokens') {
      throw new Error('La respuesta de Claude se cortó por exceder el límite de tokens (bloque de días demasiado largo).')
    }

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeDayBlockDays(parsed?.days, blockDayNumbers)
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos para este bloque')

    const destData = findDestinationData(destination)
    for (const day of days) {
      const requiredPlaces = requiredPlacesByDayNumber.get(day.day_number)
      filterFreeTourDuplicateStops(day, requiredPlaces)
      stripNonRequiredStops(day, requiredPlaces)
      applyCuratedTips(day, requiredPlaces)
      filterMealLikeStops(day)
      validateStopHours(day)
      enforceFreeTourFirst(day, requiredPlaces)
      logMissingRequiredPlaces(day, requiredPlaces)
      logStopCountWarning(day, typeByDayNumber.get(day.day_number), answers.pace)
      logGeographicCoherence(day)
      // Encontrado en vivo: en un día denso (Free Tour + varios grupos + horarios reales que encajar),
      // Claude a veces omite un intocable pese a estar en REQUIRED PLACES — sin previo aviso de error,
      // solo pasaba desapercibido (logMissingRequiredPlaces solo deja un console.log). "Los intocables
      // nunca se sustituyen" es una regla dura del punto 4 — si falta uno, se trata como fallo real del
      // bloque y se lanza, para que requestDayBlockWithRetry (cliente) reintente la llamada entera con
      // una tirada nueva, en vez de servir en silencio una ruta incompleta.
      assertNoMissingIntocables(day, requiredPlaces, destData)
    }

    res.json({
      days,
      not_included: Array.isArray(parsed?.not_included) ? parsed.not_included : [],
      excursions_available: Array.isArray(parsed?.excursions_available) ? parsed.excursions_available : [],
    })
  } catch (error) {
    console.log(`[timing] generate-day-block FAILED (days=${blockDayNumbers.join(',')}) — ${Date.now() - t0}ms`)
    logAnthropicError('generate-day-block', error)
    res.status(502).json({ error: 'No se pudo generar este tramo del viaje con IA.' })
  }
})

// app.listen solo en desarrollo local (`npm run server`) — en Vercel este mismo archivo se importa
// como función serverless (ver api/index.js) sin llamar a listen(), Vercel gestiona el servidor.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API de transporte escuchando en http://localhost:${PORT}`)
  })
}

export default app
