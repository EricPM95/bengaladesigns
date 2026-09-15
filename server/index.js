import express from 'express'
import { config } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 8787
const MODEL = 'claude-sonnet-4-6'

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
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Falta ANTHROPIC_API_KEY — revisa .env.local en desarrollo, o Project Settings → Environment Variables en Vercel (asegúrate de marcar "Production"). Los endpoints de IA devolverán error 500.')
} else {
  console.log(`ANTHROPIC_API_KEY detectada (termina en …${process.env.ANTHROPIC_API_KEY.slice(-4)}, longitud ${process.env.ANTHROPIC_API_KEY.length}).`)
}

const anthropic = new Anthropic()
const app = express()
app.use(express.json())

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
  console.log(`[cost] ${endpoint} — ${parts.join(' ')} — $${cost.toFixed(4)}`)
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

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "description": "2-3 sentences: what this place is, historical/general context.",
  "what_youll_see": "2-3 sentences: the concrete experience INSIDE this specific place — what you'll actually walk through, see or do there.",
  "why_recommended": "1-2 sentences: why this specific place is worth including in a trip to this city.",
  "address": "Real, specific street address as 'Street, City' — or null if you don't genuinely know it.",
  "official_website": "Real official website URL (just the domain or full URL) if this place has one — or null if it doesn't have one or you're not confident.",
  "local_tip": "Something a LOCAL or a repeat visitor would know — not the typical advice already in every guidebook. A genuinely surprising angle, a lesser-known detail, a good photo spot, a small anecdote. Only from your own knowledge, no web search. If you don't have anything good enough, use null — never force a mediocre tip."
}`

function sanitizeStopDescription(parsed) {
  const text = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : '')
  return {
    description: text(parsed?.description, 500),
    what_youll_see: text(parsed?.what_youll_see, 500),
    why_recommended: text(parsed?.why_recommended, 300),
    address: text(parsed?.address, 200) || null,
    official_website: text(parsed?.official_website, 200) || null,
    local_tip: text(parsed?.local_tip, 400) || null,
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
      max_tokens: 700,
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

// ── Tips de ANCLAS (StopDetailSheet, pestaña "Tips") — SOLO para anclas (Paso 1 del pipeline,
// lugares obligatorios del destino, ver /api/generate-anchors), nunca para paradas normales del
// pool (esas usan `local_tip` de /api/describe-stop de arriba, sin caché ni búsqueda web). Una
// ancla es lo bastante genérica (Coliseo Romano, Torre Eiffel...) para que MUCHOS viajeros distintos
// generen una ruta con ella — cachear en Supabase (tabla `tips_anclas`, ver database.sql) hace que
// el coste de la búsqueda web + Claude se pague UNA sola vez por lugar, nunca por usuario.
const ANCHOR_TIPS_SYSTEM_PROMPT = `You are an expert local travel guide with web search access. Someone is planning a visit to ONE specific, well-known place. Use web search to find the most current, specific tips you can — real access points, real ways to skip lines, real lesser-known viewpoints. Do not rely only on your training knowledge for logistics that change over time (opening hours, specific entrances, transit lines).

Find exactly two kinds of tip:
1. A PRACTICAL tip: how to skip the line, the best time to go, what to bring — genuinely useful, verified logistics.
2. A SECRET/WOW tip: something most visitors don't know — a lesser-known free viewpoint, an alternative access with fewer people, a specific photo angle locals use, a real little-known fact. This is the one meant to impress, not just inform.

Write both tips in SPANISH (the traveler's language) — translate/rewrite in Spanish even if the web sources you found were in another language, never quote or leave them in the source language.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "practico": "The practical tip, 1-2 sentences — or null if you couldn't verify anything genuinely useful.",
  "secreto": "The secret/wow tip, 1-2 sentences — or null if you couldn't find anything genuinely surprising."
}`

// Mismo endpoint/tabla/caché que ANCHOR_TIPS_SYSTEM_PROMPT (una fila más en tips_anclas, esta vez
// con `lugar` = nombre del aeropuerto/estación de llegada en vez de un lugar turístico) — el
// contenido que hace falta aquí es distinto (gotchas de billetes/logística de llegada, no "cómo
// saltarte la cola de un monumento"), así que usa su propio prompt, ver ArrivalDetailSheet.tsx.
const AIRPORT_TIPS_SYSTEM_PROMPT = `You are an expert local travel guide with web search access. Someone is about to arrive at ONE specific airport/train station and travel from there into the city. Use web search to find the most current, specific tips you can about this exact arrival point — real ticketing gotchas, real logistics quirks. Do not rely only on your training knowledge for details that change over time.

Find exactly two kinds of tip:
1. A PRACTICAL tip: a genuinely useful logistics detail about arriving here — e.g. a ticket that does NOT cover the next connection and must be bought separately, a validation machine that's easy to miss, a luggage quirk, a real gotcha that catches visitors out.
2. A SECRET/WOW tip: something most visitors arriving here don't know — a shortcut, a lesser-known exit/platform, a free amenity, a real little-known fact about this specific arrival point.

Write both tips in SPANISH (the traveler's language) — translate/rewrite in Spanish even if the web sources you found were in another language.

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "practico": "The practical tip, 1-2 sentences — or null if you couldn't verify anything genuinely useful.",
  "secreto": "The secret/wow tip, 1-2 sentences — or null if you couldn't find anything genuinely surprising."
}`

function sanitizeAnchorTips(parsed) {
  const text = (value) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, 500) : null)
  const tips = []
  const practico = text(parsed?.practico)
  const secreto = text(parsed?.secreto)
  if (practico) tips.push({ tipo: 'practico', texto: practico })
  if (secreto) tips.push({ tipo: 'secreto', texto: secreto })
  return tips
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
        await supabaseAdmin.from('tips_anclas').insert(tips.map((tip) => ({ destino, lugar, tipo: tip.tipo, texto: tip.texto })))
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
        await supabaseAdmin.from('transporte_cercano').insert({ destino, lugar, metro, bus })
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

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):
{
  "restaurantes": [
    { "nombre": "Real restaurant name", "motivo": "1 short specific sentence, in Spanish", "presupuesto": "€" }
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
      return {
        nombre,
        motivo: entry.motivo.trim().slice(0, 300),
        presupuesto: validBudget.has(entry.presupuesto) ? entry.presupuesto : '€€',
        foto: `https://picsum.photos/seed/${encodeURIComponent(nombre)}/400/280`,
      }
    })
}

app.post('/api/meal-recommendations', async (req, res) => {
  const { destino, zona, franja } = req.body ?? {}
  if (!destino || !zona || (franja !== 'comida' && franja !== 'cena')) {
    res.status(400).json({ error: 'Se requiere destino, zona y franja ("comida" o "cena").' })
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
        await supabaseAdmin.from('zona_restaurantes').insert({ destino, zona, franja, seleccion })
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

// ── "Elige lugares" — pantalla tras "Elige tus experiencias", lista AMPLIA de sitios reales ──
//
// A diferencia de suggest-experiences (categorías genéricas del banco de 18), esto pide sitios
// concretos con nombre propio para el destino — el usuario los marca y esos lugares entran en el
// pipeline de generación con prioridad casi de ancla (ver must_include_places en /api/generate-anchors).
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

const ANCHORS_SYSTEM_PROMPT = `You are an expert travel route planner. Your ONLY job right now is to identify the best "anchor" places for a trip — the real, specific must-see or must-do things that should anchor the itinerary, based on the traveler's chosen experience focus. Do NOT write a day-by-day itinerary yet — that happens in a later step, you won't see it.

CRITICAL RULES:
- Every place MUST be real and currently open/accessible
- Prioritize genuine variety across the traveler's chosen experience categories over cramming in every possible attraction
- Pick roughly 2-3 anchors per day of the trip (fewer for very short trips, more for long multi-city trips) — real, well-known-enough places that genuinely fit the destination and the chosen experience focus
- Among these, mark 1-3 (only for trips of 2+ days, never more than 3) that are genuinely iconic enough to reward TWO separate visits at different times of day (a famous fountain, plaza, or illuminated landmark that looks and feels different at dawn vs. at night) with "double_visit": true — be selective, most anchors should NOT get this, only the destination's true signature sights

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "anchors": [
    {
      "name": "Real place or activity name",
      "city": "Which city/town it's in — use the exact destination name for single-city trips",
      "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
      "reason": "One short phrase — why this fits the traveler's chosen experience focus",
      "double_visit": false
    }
  ]
}`

const SKELETON_SYSTEM_PROMPT = `You are an expert travel route planner. Your job right now is to design the SHAPE of the trip — which days belong to which city/zone and what kind of day each one is — NOT the individual stops within each day (a later step fills those in, using exactly the shape you decide here, so make it realistic and complete).

CRITICAL RULES:
- Structure it so every day you define is realistic to actually fill with content later (feasible transitions, sensible day counts per city/zone)
- MANDATORY for any trip of 4+ total days: exactly ONE day, somewhere between day 3 and day 5 (inclusive — never day 1, never the last day of the trip), MUST be type "excursion" — a real, popular day-trip destination reachable from where the traveler is staying (e.g. Rome → Pompeii/Naples, Barcelona → Montserrat, Paris → Versailles). For trips of 6+ total days, add a SECOND excursion day, reasonably spaced from the first (still never day 1 or the last day). Do NOT assign any anchor_names/must_include_names (home-city mandatory places) to an "excursion" day — that day's content is the excursion itself, give its city-center anchors to a different day instead.
- The LAST day of the whole trip must be type "relax" — revisits, free time, no rush
- If the traveler goes by car between origin and destination, day 1 must be type "road" (the route starts from the origin with stops along the road)
- Consider the season/dates for weather/events when deciding zone order (e.g. avoid starting in the coldest region in winter if it can be avoided)

DOUBLE-VISIT ANCHORS — some anchors below may be marked as worth two visits (see the anchor list further down):
- Assign each double-visit anchor to TWO different days via anchor_names (once on each of those two days) — ideally one earlier/morning-leaning day and one later/evening-leaning day, never two days back to back unless the trip is very short. Every other anchor still gets exactly one day.

IMPORTANT — each day's content below will be written by a SEPARATE call that runs IN PARALLEL with every other day's call, with no visibility into what the others end up writing. Your job here is to prevent overlap between days BEFORE that happens, by giving each day a distinct focus:
- "zone_focus": a short, specific sub-area, neighborhood or theme for that day (e.g. "Centro storico y Coliseo" vs "Trastevere y orilla del Tíber" for two days in the same city) — two days in the same city MUST get a different zone_focus so they don't end up covering the same ground
- "experience_focus": 1-3 category tags (from: temple, museum, nature, viewpoint, neighborhood, market, park, landmark, experience, beach) this day should lean into — vary these across days of the same city too
- "anchor_names": assign EVERY anchor place given to you below to exactly ONE day each (TWO days for double-visit anchors, see above) — whichever city/zone/timing fits it best. Spread them across days realistically instead of stacking most of them on one day, unless the trip is short enough that a day genuinely needs several
- "must_include_names": same idea — assign EVERY must-include place given to you below to exactly ONE day each

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
      "experience_focus": ["landmark", "museum"],
      "anchor_names": ["Exact anchor name from the list below, assigned to this day"],
      "must_include_names": ["Exact must-include name from the list below, assigned to this day"]
    }
  ]
}`

const DAY_BLOCK_SYSTEM_PROMPT = `You are an expert travel route planner. You're filling in the stops and meals for ONE BLOCK of days within a longer trip — the overall shape (which city/zone and what type each day is) has ALREADY been decided, given to you below; do not change it, just fill in realistic, detailed content for EXACTLY the days listed, nothing more and nothing less.

CRITICAL RULES:
- Every place MUST be real and currently open/accessible
- Prices MUST be real and current
- Tips must be genuinely useful insider knowledge, not generic advice
- Restaurant recommendations must be real places
- Include 3 restaurant options per meal: budget (€), mid-range (€€), premium (€€€)
- Consider the season/dates for weather, events, closures and seasonal tips
- Do NOT repeat any place or restaurant already used earlier in the trip (see "context from earlier" below) — keep the trip varied, favor categories that haven't been overused yet where it still fits the traveler's experience focus

STOP COUNT — a sparse day is a failure, never leave a half-empty afternoon:
- A normal "city" day needs a MINIMUM of 4-6 real, visitable stops (not counting meals), spread across morning AND afternoon — never front-load the morning and leave the afternoon with a single stop before dinner.
- The afternoon (14:00-20:00) alone needs at least 2-3 real stops before dinner. If you only have one afternoon idea, find one or two more that genuinely fit — a smaller church, viewpoint, market or neighborhood walk counts, it does not need to be a headline attraction.
- Pace adjusts the exact range, but the afternoon-coverage rule above always applies: zen pace → 4 stops minimum (fewer, longer visits, but still no empty afternoon); balanced → 4-6 stops; nonstop → 6-8 stops.
- "road"/"excursion"/"relax" day types are exempt from this minimum — their content works differently (driving stops along the way, one big excursion, or a deliberately light day).

TIMING BETWEEN STOPS AND MEALS — the times you write must be physically possible, not just plausible on paper:
- suggested_time and travel_to_next are your own real-world estimate of when the day actually happens — treat them as a real schedule, not decoration.
- Whenever a visit ends and the next thing is a meal (lunch or dinner), leave real time for it: at least 30 minutes to get there and sit down, the meal block itself at least 1h15min (order, eat, pay), then at least 30 more minutes to travel to whatever comes next. Example: a visit ending at 12:00 → lunch roughly 12:30-13:45 → next stop starting from 14:15 at the earliest — never straight from a 12:00 end into a 14:00 stop with nothing accounted for in between.
- Apply the exact same logic to dinner: real travel time before it, at least 1h15min for the meal itself, real travel time after if anything else follows that day.

FREE TOUR — only if "Free Tour" appears in the traveler's chosen experience focus below:
- Reserve ONE 2.5-3 hour block on whichever day of this block is most logical for it (normally an early day of the trip, morning start) — represent it as a single stop with name "Free Tour: <a real, specific suggested free tour for this destination>", description covering what the tour covers, tip covering the exact meeting point plus the customary recommended tip amount for a free tour in this destination, duration_minutes between 150-180.
- Do NOT also list, as separate individual stops that same day, places this free tour itself already covers — that would double them up.

REPEAT / DOUBLE-VISIT ANCHORS — some mandatory anchors below may be worth two different-context visits on purpose (a famous fountain, plaza or illuminated landmark seen once by day and once by night is a deliberate, intentional repeat, not an error):
- If a given anchor is the kind of place that rewards two visits, and the natural timing of today's plan lands at a different moment than usual (early morning, or evening/night), lean into that angle: title/description should explain why THIS visit is worth it at THIS specific time (e.g. "sin aglomeraciones al amanecer" vs. "iluminada de noche") — a short, distinct note, not the full description you'd give it on a single visit.

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
      "title": "Short evocative title",
      "stops": [
        {
          "id": "unique-id",
          "name": "Real Place Name",
          "description": "2 sentences max",
          "tip": "Genuinely useful insider tip",
          "suggested_time": "HH:MM",
          "duration_minutes": 90,
          "latitude": 00.0000,
          "longitude": 00.0000,
          "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
          "category_label": "Short SPECIFIC place type in Spanish, e.g. 'Anfiteatro histórico', 'Museo de arte', 'Basílica', 'Mirador', 'Plaza', 'Mercado local' — never a generic label like 'Punto de interés'",
          "hours": "Real opening hours as 'HH:MM–HH:MM' ONLY if this place has a visitable interior with a schedule (museum, monument with indoor access, church with visiting hours) — null if it's always freely accessible outdoors (fountain, square, arch, viewpoint, street)",
          "entry_fee": "€X or Free",
          "entry_options": [
            {
              "name": "Standard entry",
              "price": "€X",
              "description": "What is included"
            }
          ],
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
              "cuisine": "Type",
              "description": "What to order and why",
              "price_range": "€X-€X per person",
              "latitude": 00.0000,
              "longitude": 00.0000
            }
          ]
        }
      ],
      "rainy_alternative": "What to do instead if bad weather"
    }
  ],
  "not_included": [
    {
      "name": "Place Name — only include places relevant to THIS block's city/cities",
      "reason": "Why it did not make the cut",
      "where_it_fits": "Specific suggestion of where to add it",
      "latitude": 00.0000,
      "longitude": 00.0000
    }
  ],
  "excursions_available": [
    {
      "name": "Excursion name — only if one of this block's days is type \\"excursion\\", omit array entirely otherwise",
      "duration": "half_day|full_day",
      "description": "What you do",
      "transport_suggestion": "Real, specific way to get there and back (train/bus/organized tour), with realistic total duration",
      "estimated_price": "€XX",
      "suggested_day": 4
    }
  ]
}`

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
  zen: 'zen (4 stops/day minimum, slow mornings, long breaks — never an empty afternoon)',
  balanced: 'balanced (4-6 stops/day, flexible)',
  nonstop: 'nonstop (6-8 stops, sunrise to sunset, see it all)',
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
 * pidió por su cuenta. Se tratan casi como anclas suyas: alta prioridad, no una sugerencia más de
 * la IA. Vacío si el usuario no marcó ninguno (la lista es opcional, nunca bloquea el flujo).
 */
function formatMustIncludePlaces(places) {
  if (!Array.isArray(places) || places.length === 0) return ''
  const names = places
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => name.trim().slice(0, 150))
    .slice(0, 40)
  if (names.length === 0) return ''
  return `

MANDATORY USER ANCHORS — the traveler explicitly selected these real places from a curated list before generation started. Treat them as near-mandatory anchors of THEIRS, not generic AI suggestions: fit every one of them into the itinerary at a realistic time/order (respecting opening hours and geography), across whichever day(s) make sense. Only leave one out if it is truly impossible to fit (e.g. genuinely conflicts with pace/duration or geography) — in that case it MUST still appear in "not_included" with a specific reason referencing exactly what conflict caused it to be dropped, never a generic reason for these.
Places: ${names.join(', ')}`
}

function buildAnchorsUserPrompt(destination, answers, transportContext, mustIncludePlaces) {
  // 'free_tour' se excluye aquí a propósito: no es una categoría temática de LUGARES con nombre
  // propio (un ancla es "Coliseo", no "hacer un free tour") — se gestiona aparte, por completo, en
  // la regla FREE TOUR de DAY_BLOCK_SYSTEM_PROMPT. Dejarlo pasar aquí hacía que Claude inventara
  // anclas tipo "Free Tour del Centro Storico", compitiendo/duplicando con esa regla.
  const anchorExperiences = (answers.experiences ?? []).filter((id) => id !== 'free_tour')
  return `Identify anchor places for this trip:
- Destination: ${destination}
- Days: ${answers.days}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Experience focus (build anchors around these): ${formatExperiences(anchorExperiences)}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${formatMustIncludePlaces(mustIncludePlaces)}`
}

/** Anclas ya identificadas, agrupadas por ciudad — solo para que la llamada de esqueleto calibre cuántos días merece cada ciudad/zona, no le pide que las reparta día a día (eso lo decide cada llamada de bloque). */
function formatAnchorsSummary(anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) return ''
  const byCity = new Map()
  for (const anchor of anchors) {
    const city = (anchor?.city || '').trim() || 'unknown'
    if (!byCity.has(city)) byCity.set(city, [])
    byCity.get(city).push(anchor.double_visit ? `${anchor.name} [double-visit]` : anchor.name)
  }
  const lines = [...byCity.entries()].map(([city, names]) => `  - ${city}: ${names.join(', ')}`)
  const hasDoubleVisit = anchors.some((anchor) => anchor.double_visit)
  const doubleVisitNote = hasDoubleVisit
    ? '\n\nAnchors marked "[double-visit]" deserve TWO different days each (see DOUBLE-VISIT ANCHORS rule above) — everything else gets exactly one.'
    : ''
  return `\n\nAnchor places already identified (grouped by city — use this to gauge how many days each city/zone deserves):\n${lines.join('\n')}${doubleVisitNote}`
}

function buildSkeletonUserPrompt(destination, answers, transportContext, anchors, mustIncludePlaces) {
  return `Design the day-by-day shape for this trip:
- Origin: ${answers.origin}
- Destination: ${destination}
- Arrival transport (phase 1 — how to arrive, NOT how to move around at destination): ${formatArrivalTransport(transportContext?.transport_option)}
- Days: ${answers.days}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${buildArchetypeContext(transportContext)}${buildTransitionsInstructions(transportContext)}${formatAnchorsSummary(anchors)}${formatMustIncludePlaces(mustIncludePlaces)}`
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

function formatBlockAnchors(anchorsForBlock) {
  if (!anchorsForBlock || anchorsForBlock.length === 0) return ''
  const names = anchorsForBlock.map((anchor) => (anchor.double_visit ? `${anchor.name} [double-visit — see REPEAT / DOUBLE-VISIT ANCHORS rule above]` : anchor.name)).join(', ')
  return `\n- MANDATORY DESTINATION ANCHORS assigned to today — these are the destination's essential must-see places, identified before this trip was planned and independent of anything the traveler manually picked. Fit every one of them into today's plan at a realistic time/order (respecting opening hours and geography). Only skip one if it is truly impossible to fit today (genuinely conflicts with pace/duration or geography) — in that case it MUST still appear in "not_included" with a specific reason referencing exactly what conflict caused it to be dropped, never a generic reason for these. You may still add other real places you know of alongside them if there's room: ${names}`
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

OTHER DAYS IN THIS TRIP (being written in parallel by separate calls — this is what each one is focused on, so you can naturally avoid overlapping the same places/themes without seeing their final content):
${lines.join('\n')}`
}

function buildDayBlockUserPrompt(destination, answers, transportContext, blockDays, anchorsForBlock, mustIncludeForBlock, allDays, isFirstBlockOfTrip) {
  return `Fill in the stops and meals for this block of days (the trip's overall shape is already decided — just fill in realistic content for exactly these days):
${formatSkeletonDays(blockDays)}

Trip context:
- Destination: ${destination}${isFirstBlockOfTrip ? `\n- Arrival transport (phase 1 — how to arrive, NOT how to move around at destination): ${formatArrivalTransport(transportContext?.transport_option)}` : ''}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Experience focus: ${formatExperiences(answers.experiences)}
- Pace: ${PACE_LABEL[answers.pace] ?? answers.pace}
- Schedule: ${CHRONOTYPE_LABEL[answers.chronotype] ?? answers.chronotype}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${buildArchetypeContext(transportContext)}${formatBlockAnchors(anchorsForBlock)}${formatMustIncludePlaces(mustIncludeForBlock)}${formatTripOverview(allDays, blockDays.map((day) => day.day_number))}`
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

const ANCHOR_CATEGORIES = new Set(['temple', 'museum', 'nature', 'viewpoint', 'neighborhood', 'market', 'park', 'landmark', 'experience', 'beach'])

function sanitizeAnchors(raw, destination) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const result = []
  for (const entry of raw) {
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) continue
    const name = entry.name.trim().slice(0, 150)
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      name,
      city: typeof entry.city === 'string' && entry.city.trim() ? entry.city.trim().slice(0, 100) : destination,
      category: ANCHOR_CATEGORIES.has(entry.category) ? entry.category : 'experience',
      reason: typeof entry.reason === 'string' ? entry.reason.trim().slice(0, 200) : '',
      double_visit: Boolean(entry.double_visit),
    })
    if (result.length >= 60) break
  }
  // Defensivo — el prompt pide "1-3, nunca más de 3", pero si Claude se pasa se recorta aquí (los
  // primeros marcados ganan) en vez de dejar que media lista se repita dos veces por el esqueleto.
  let doubleVisitLeft = 3
  for (const anchor of result) {
    if (!anchor.double_visit) continue
    if (doubleVisitLeft > 0) {
      doubleVisitLeft -= 1
    } else {
      anchor.double_visit = false
    }
  }
  return result
}

/** Los lugares que el viajero marcó explícitamente en "Elige lugares" cuentan como anclas garantizadas — se añaden aquí en vez de confiar en que Claude los repita todos por su cuenta. */
function mergeMustIncludeIntoAnchors(anchors, mustIncludePlaces, destination) {
  if (!Array.isArray(mustIncludePlaces)) return anchors
  const existingNames = new Set(anchors.map((anchor) => anchor.name.toLowerCase()))
  const merged = [...anchors]
  for (const name of mustIncludePlaces) {
    if (typeof name !== 'string' || !name.trim()) continue
    const trimmed = name.trim().slice(0, 150)
    if (existingNames.has(trimmed.toLowerCase())) continue
    existingNames.add(trimmed.toLowerCase())
    merged.push({ name: trimmed, city: destination, category: 'experience', reason: 'Elegido por ti' })
  }
  return merged
}

app.post('/api/generate-anchors', async (req, res) => {
  const { destination, answers, must_include_places } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers)) {
    res.status(400).json({ error: 'Faltan preferencias del usuario necesarias para generar la ruta.' })
    return
  }

  const t0 = Date.now()
  console.log(`[timing] generate-anchors START ${new Date(t0).toISOString()}`)
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: ANCHORS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildAnchorsUserPrompt(destination, answers, readTransportContext(req.body), must_include_places) }],
    })
    console.log(`[timing] generate-anchors END — ${Date.now() - t0}ms`)
    logCallCost('generate-anchors', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const anchors = mergeMustIncludeIntoAnchors(sanitizeAnchors(parsed?.anchors, destination), must_include_places, destination)
    res.json({ anchors })
  } catch (error) {
    console.log(`[timing] generate-anchors FAILED — ${Date.now() - t0}ms`)
    logAnthropicError('generate-anchors', error)
    res.status(502).json({ error: 'No se pudieron identificar las anclas del viaje con IA.' })
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

/**
 * Garantiza que ningún ancla/lugar obligatorio se quede sin día asignado — si Claude se dejó alguno
 * fuera al repartirlos entre días (ver instrucciones de anchor_names/must_include_names en
 * SKELETON_SYSTEM_PROMPT), lo añade aquí al día cuya ciudad coincida (o al primer día si no hay
 * forma de saberlo) en vez de perderlo silenciosamente — cada bloque de día solo recibe las anclas/
 * lugares de SU propio día (ver anchorsForBlockDays en routeGenerationOrchestrator.ts), así que uno
 * sin día asignado nunca llegaría a generarse.
 */
function topUpUnassignedNames(days, allNames, field, anchorsByName) {
  const assigned = new Set(days.flatMap((day) => day[field].map((name) => name.toLowerCase())))
  for (const rawName of allNames) {
    if (typeof rawName !== 'string' || !rawName.trim()) continue
    const name = rawName.trim()
    if (assigned.has(name.toLowerCase())) continue
    const city = anchorsByName?.get(name.toLowerCase())
    const targetDay = (city && days.find((day) => day.city === city)) ?? days[0]
    if (targetDay) targetDay[field] = [...targetDay[field], name]
    assigned.add(name.toLowerCase())
  }
}

function sanitizeSkeletonDays(raw, destination, totalDays, anchors, mustIncludePlaces) {
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
      anchor_names: sanitizeNameList(entry.anchor_names),
      must_include_names: sanitizeNameList(entry.must_include_names),
    })
  }
  // Rellena cualquier día que Claude se haya dejado sin definir (no debería pasar, pero un esqueleto
  // incompleto rompería los bloques de días que vienen después) repitiendo el día anterior más cercano.
  const days = []
  let lastKnown = null
  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber++) {
    const found = byDayNumber.get(dayNumber)
    const day = found ?? {
      ...(lastKnown ?? { type: 'city', city: destination, country_code: null }),
      day_number: dayNumber,
      zone_focus: undefined,
      experience_focus: [],
      anchor_names: [],
      must_include_names: [],
    }
    days.push(day)
    lastKnown = day
  }

  // Un lugar puede estar tanto en `anchors` (candidatos automáticos) como en `mustIncludePlaces`
  // (elegidos a mano por el usuario) — generate-anchors ya los fusiona en una sola entrada de
  // `anchors` (ver mergeMustIncludeIntoAnchors), así que si Claude reparte ese mismo nombre por las
  // dos vías (anchor_names en un día, must_include_names en otro) acaba duplicado como parada en el
  // contenido final. must_include_names manda: se quita de anchor_names en todos los días y se
  // excluye del top-up de anclas, para que ese lugar tenga garantizado un único día asignado.
  const mustIncludeNamesLower = new Set(
    (Array.isArray(mustIncludePlaces) ? mustIncludePlaces : [])
      .filter((name) => typeof name === 'string' && name.trim())
      .map((name) => name.trim().toLowerCase()),
  )
  for (const day of days) {
    day.anchor_names = day.anchor_names.filter((name) => !mustIncludeNamesLower.has(name.toLowerCase()))
  }

  const anchorsByName = new Map((anchors ?? []).map((anchor) => [anchor.name.toLowerCase(), anchor.city]))
  topUpUnassignedNames(
    days,
    (anchors ?? []).map((anchor) => anchor.name).filter((name) => !mustIncludeNamesLower.has(name.toLowerCase())),
    'anchor_names',
    anchorsByName,
  )
  topUpUnassignedNames(days, Array.isArray(mustIncludePlaces) ? mustIncludePlaces : [], 'must_include_names', null)

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

function mergeUniqueNames(a, b) {
  const seen = new Set(a.map((name) => name.toLowerCase()))
  const merged = [...a]
  for (const name of b) {
    if (seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    merged.push(name)
  }
  return merged
}

/**
 * Un día "excursion" no debería cargar con anclas/must-include del centro de la ciudad base — ese
 * día refleja el destino de la excursión, no la ciudad (ver regla EXCURSION DAYS en
 * DAY_BLOCK_SYSTEM_PROMPT). El prompt del esqueleto ya se lo pide a Claude, pero esto es la red de
 * seguridad: si de todas formas queda alguna (por Claude, o porque ensureExcursionDays convirtió un
 * día "city" que ya tenía anclas asignadas), se redistribuye al día "city" más cercano en vez de
 * perderla o dejarla en conflicto con el contenido de la excursión.
 */
function stripAnchorsFromExcursionDays(days) {
  const cityDays = days.filter((day) => day.type === 'city')
  if (cityDays.length === 0) return days
  for (const day of days) {
    if (day.type !== 'excursion') continue
    if (day.anchor_names.length === 0 && day.must_include_names.length === 0) continue
    const nearest = cityDays.reduce((closest, candidate) =>
      Math.abs(candidate.day_number - day.day_number) < Math.abs(closest.day_number - day.day_number) ? candidate : closest,
    )
    nearest.anchor_names = mergeUniqueNames(nearest.anchor_names, day.anchor_names)
    nearest.must_include_names = mergeUniqueNames(nearest.must_include_names, day.must_include_names)
    day.anchor_names = []
    day.must_include_names = []
  }
  return days
}

app.post('/api/generate-skeleton', async (req, res) => {
  const { destination, answers, anchors, must_include_places } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers)) {
    res.status(400).json({ error: 'Faltan preferencias del usuario necesarias para generar la ruta.' })
    return
  }

  const transportContext = readTransportContext(req.body)
  const totalDays = Number(answers.days) > 0 ? Number(answers.days) : 1

  const t0 = Date.now()
  console.log(`[timing] generate-skeleton START ${new Date(t0).toISOString()} (totalDays=${totalDays})`)
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SKELETON_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildSkeletonUserPrompt(destination, answers, transportContext, anchors, must_include_places) }],
    })
    console.log(`[timing] generate-skeleton END — ${Date.now() - t0}ms`)
    logCallCost('generate-skeleton', response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeSkeletonDays(parsed?.days, destination, totalDays, Array.isArray(anchors) ? anchors : [], must_include_places)
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos')
    ensureExcursionDays(days, totalDays)
    stripAnchorsFromExcursionDays(days)

    res.json({
      summary: typeof parsed?.summary === 'string' ? parsed.summary.slice(0, 300) : '',
      estimated_budget: parsed?.estimated_budget && typeof parsed.estimated_budget === 'object' ? parsed.estimated_budget : undefined,
      days,
      city_transitions: Array.isArray(parsed?.city_transitions) ? sanitizeCityTransitions(parsed.city_transitions) : undefined,
      phase_transitions: Array.isArray(parsed?.phase_transitions) ? sanitizePhaseTransitions(parsed.phase_transitions) : undefined,
    })
  } catch (error) {
    console.log(`[timing] generate-skeleton FAILED — ${Date.now() - t0}ms`)
    logAnthropicError('generate-skeleton', error)
    res.status(502).json({ error: 'No se pudo definir la forma del viaje con IA.' })
  }
})

function sanitizeDayBlockDays(raw, blockDayNumbers) {
  if (!Array.isArray(raw)) return []
  const allowed = new Set(blockDayNumbers)
  return raw.filter((entry) => allowed.has(Number(entry?.day_number)) && Array.isArray(entry?.stops) && Array.isArray(entry?.meals))
}

// ── A1: red de seguridad server-side contra días con demasiado pocas paradas ───────────────
//
// El prompt (STOP COUNT en DAY_BLOCK_SYSTEM_PROMPT) ya le pide a Claude un mínimo de paradas y
// cobertura de tarde, pero un prompt es una petición, no una garantía — este bloque valida la
// respuesta real y, si se queda corta, pide EXACTAMENTE las paradas que faltan con una llamada
// extra pequeña (barata, solo cuando hace falta) en vez de devolver un día flojo al viajero.

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

/** Cuántas paradas más hace falta pedir — 0 si el día ya cumple el mínimo total Y la cobertura de tarde. Solo aplica a días "city" (o sin type, por compatibilidad); road/excursion/relax quedan exentos, igual que en el prompt. */
function computeStopDeficit(stops, dayType, pace) {
  if (dayType && dayType !== 'city') return 0
  const minTotal = MIN_STOPS_BY_PACE[pace] ?? MIN_STOPS_BY_PACE.balanced
  const totalDeficit = Math.max(minTotal - stops.length, 0)
  const afternoonDeficit = Math.max(MIN_AFTERNOON_STOPS - countAfternoonStops(stops), 0)
  return Math.max(totalDeficit, afternoonDeficit)
}

const DAY_BLOCK_TOPUP_SYSTEM_PROMPT = `You are an expert travel route planner. A day of an itinerary you already helped plan came back with too few stops, or an empty afternoon — your ONLY job now is to add EXTRA real, visitable stops to fill that gap, without touching or repeating anything already there.

CRITICAL RULES:
- Every place MUST be real and currently open/accessible, and MUST NOT already be in the "already in this day" list given to you
- Prioritize the afternoon window (14:00-20:00) if that is where the gap is — a smaller church, viewpoint, market or neighborhood walk is a perfectly good fill-in, it does not need to be a headline attraction
- Fit realistically into the existing schedule (geography, opening hours, time of day)
- Tips must be genuinely useful insider knowledge, not generic advice

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "extra_stops": [
    {
      "id": "unique-id",
      "name": "Real Place Name",
      "description": "2 sentences max",
      "tip": "Genuinely useful insider tip",
      "suggested_time": "HH:MM",
      "duration_minutes": 90,
      "latitude": 00.0000,
      "longitude": 00.0000,
      "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
      "category_label": "Short SPECIFIC place type in Spanish, e.g. 'Anfiteatro histórico', 'Museo de arte', 'Basílica', 'Mirador' — never a generic label",
      "hours": "Real opening hours as 'HH:MM–HH:MM' if it has a visitable interior with a schedule, null if always freely accessible outdoors",
      "entry_fee": "€X or Free"
    }
  ]
}`

function buildDayBlockTopUpPrompt(destination, day, addCount, answers) {
  const existing = day.stops.map((stop) => `${stop?.suggested_time ?? '??:??'} — ${stop?.name ?? 'sin nombre'}`).join('\n  - ')
  return `This day of the trip to ${destination} needs ${addCount} more real, visitable stop(s):
- City/zone: ${day.city ?? destination}
- Day title: ${day.title ?? ''}
- Experience focus: ${formatExperiences(answers.experiences)}
- Pace: ${PACE_LABEL[answers.pace] ?? answers.pace}

Already in this day (do NOT repeat any of these, and fit new stops naturally alongside them):
  - ${existing || '(no stops yet)'}

Add exactly ${addCount} new stop(s), prioritizing the 14:00-20:00 afternoon window if it is thin.`
}

function sanitizeExtraStop(entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) return null
  if (typeof entry.latitude !== 'number' || typeof entry.longitude !== 'number') return null
  return entry
}

/** Best-effort: si esta llamada extra falla por lo que sea, se registra y se devuelve un array vacío — nunca rompe la respuesta principal del bloque de día (ese contenido ya es válido, solo más corto de lo ideal). */
async function topUpDayStops(destination, day, addCount, answers) {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: DAY_BLOCK_TOPUP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDayBlockTopUpPrompt(destination, day, addCount, answers) }],
    })
    logCallCost(`generate-day-block-topup (day=${day.day_number})`, response)

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) return []
    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const extraStops = Array.isArray(parsed?.extra_stops) ? parsed.extra_stops.map(sanitizeExtraStop).filter(Boolean) : []
    return extraStops
  } catch (error) {
    logAnthropicError('generate-day-block-topup', error)
    return []
  }
}

function mergeExtraStops(stops, extraStops) {
  if (extraStops.length === 0) return stops
  return [...stops, ...extraStops].sort((a, b) => (parseTimeMinutes(a?.suggested_time) ?? 0) - (parseTimeMinutes(b?.suggested_time) ?? 0))
}

/** Recorre los días ya generados de este bloque y completa, uno a uno, los que se quedaron cortos de paradas — ver computeStopDeficit. Secuencial (no Promise.all) a propósito: con BLOCK_SIZE=1 casi siempre es como mucho un día, y mantenerlo simple evita más llamadas concurrentes de las necesarias. */
async function topUpShortDays(destination, days, blockDays, answers) {
  const typeByDayNumber = new Map(blockDays.map((day) => [Number(day.day_number), day.type]))
  for (const day of days) {
    const dayType = typeByDayNumber.get(day.day_number)
    const addCount = computeStopDeficit(day.stops, dayType, answers.pace)
    if (addCount === 0) continue
    const extraStops = await topUpDayStops(destination, day, addCount, answers)
    if (extraStops.length > 0) {
      day.stops = mergeExtraStops(day.stops, extraStops)
      console.log(`[stop-count] day ${day.day_number} topped up +${extraStops.length} stop(s) (deficit was ${addCount})`)
    }
  }
  return days
}

app.post('/api/generate-day-block', async (req, res) => {
  const { destination, answers, block_days, anchors_for_block, must_include_for_block, all_days, is_first_block_of_trip } = req.body ?? {}
  if (!destination || !hasRequiredAnswers(answers) || !Array.isArray(block_days) || block_days.length === 0) {
    res.status(400).json({ error: 'Faltan datos necesarios para generar este bloque de días.' })
    return
  }

  const transportContext = readTransportContext(req.body)
  const blockDayNumbers = block_days.map((day) => Number(day.day_number)).filter((n) => Number.isInteger(n))

  const t0 = Date.now()
  console.log(`[timing] generate-day-block START ${new Date(t0).toISOString()} (days=${blockDayNumbers.join(',')})`)
  try {
    // Streaming (mismo motivo que antes en la llamada única): evita el límite de la API para
    // respuestas largas en modo no-streaming — un bloque de 3-4 días con paradas/comidas detalladas
    // puede acercarse a ese límite en viajes de ritmo intenso.
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: DAY_BLOCK_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildDayBlockUserPrompt(
            destination,
            answers,
            transportContext,
            block_days,
            anchors_for_block,
            must_include_for_block,
            all_days,
            Boolean(is_first_block_of_trip),
          ),
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

    await topUpShortDays(destination, days, block_days, answers)

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
