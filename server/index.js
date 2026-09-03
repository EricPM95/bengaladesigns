import express from 'express'
import { config } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

config({ path: '.env.local' })

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 8787
const MODEL = 'claude-sonnet-4-6'

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
  return `Analiza el destino "${destino}" y devuelve SOLO un JSON, sin explicación ni markdown, con estos cinco campos:

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

Cuando ambiguous = true, aun así devuelve tu mejor estimación de archetype (la app la ignorará y preguntará al usuario, pero necesita un valor por si acaso).

Responde SOLO: {"archetype": "xxx", "is_region": true/false, "ambiguous": true/false, "requiere_coche": true/false, "pase_dominante": "nombre del pase" o null}`
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
        'El JSON debe tener exactamente cinco campos: archetype (string, uno de los 6 ids solicitados, en minúsculas con guiones bajos), is_region (booleano), ambiguous (booleano), requiere_coche (booleano) y pase_dominante (string o null).',
      messages: [{ role: 'user', content: buildClassifyPrompt(destination) }],
    })

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

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    res.json({ experience_ids: sanitizeExperienceIds(parsed?.experience_ids) })
  } catch (error) {
    logAnthropicError('suggest-experiences', error)
    res.status(502).json({ error: 'No se pudieron sugerir experiencias con IA.' })
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

RESPOND ONLY IN VALID JSON (no markdown, no backticks, no explanation):

{
  "anchors": [
    {
      "name": "Real place or activity name",
      "city": "Which city/town it's in — use the exact destination name for single-city trips",
      "category": "temple|museum|nature|viewpoint|neighborhood|market|park|landmark|experience|beach",
      "reason": "One short phrase — why this fits the traveler's chosen experience focus"
    }
  ]
}`

const SKELETON_SYSTEM_PROMPT = `You are an expert travel route planner. Your job right now is to design the SHAPE of the trip — which days belong to which city/zone and what kind of day each one is — NOT the individual stops within each day (a later step fills those in, using exactly the shape you decide here, so make it realistic and complete).

CRITICAL RULES:
- Structure it so every day you define is realistic to actually fill with content later (feasible transitions, sensible day counts per city/zone)
- For trips longer than 3 days in one city, reserve 1-2 days as type "excursion" (day trips outside the city)
- The LAST day of the whole trip must be type "relax" — revisits, free time, no rush
- If the traveler goes by car between origin and destination, day 1 must be type "road" (the route starts from the origin with stops along the road)
- Consider the season/dates for weather/events when deciding zone order (e.g. avoid starting in the coldest region in winter if it can be avoided)

IMPORTANT — each day's content below will be written by a SEPARATE call that runs IN PARALLEL with every other day's call, with no visibility into what the others end up writing. Your job here is to prevent overlap between days BEFORE that happens, by giving each day a distinct focus:
- "zone_focus": a short, specific sub-area, neighborhood or theme for that day (e.g. "Centro storico y Coliseo" vs "Trastevere y orilla del Tíber" for two days in the same city) — two days in the same city MUST get a different zone_focus so they don't end up covering the same ground
- "experience_focus": 1-3 category tags (from: temple, museum, nature, viewpoint, neighborhood, market, park, landmark, experience, beach) this day should lean into — vary these across days of the same city too
- "anchor_names": assign EVERY anchor place given to you below to exactly ONE day each — whichever city/zone/timing fits it best. Spread them across days realistically instead of stacking most of them on one day, unless the trip is short enough that a day genuinely needs several
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
- Time estimates between stops must be realistic
- Restaurant recommendations must be real places
- Adapt the number of stops per day strictly to the pace preference
- Include 3 restaurant options per meal: budget (€), mid-range (€€), premium (€€€)
- Consider the season/dates for weather, events, closures and seasonal tips
- Do NOT repeat any place or restaurant already used earlier in the trip (see "context from earlier" below) — keep the trip varied, favor categories that haven't been overused yet where it still fits the traveler's experience focus

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
      "estimated_price": "€XX",
      "suggested_day": 4
    }
  ]
}`

/** "Elige tus experiencias" (reemplaza el antiguo "¿Qué mueve tu viaje?" de 5 opciones) — traduce los ids elegidos a texto legible para el prompt de generación. */
function formatExperiences(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) return 'not specified'
  const titles = experiences.map((id) => EXPERIENCE_BANK.find((entry) => entry.id === id)?.title ?? id)
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
  zen: 'zen (2-3 stops/day, slow mornings, long breaks)',
  balanced: 'balanced (4-5 stops/day, flexible)',
  nonstop: 'nonstop (6+ stops, sunrise to sunset, see it all)',
}

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
  return `Identify anchor places for this trip:
- Destination: ${destination}
- Days: ${answers.days}
- Season/dates: ${formatSeasonOrDates(answers)}
- Traveling with: ${formatCompanion(answers)}
- Experience focus (build anchors around these): ${formatExperiences(answers.experiences)}
- Budget: ${BUDGET_LABEL[answers.budgetLevel] ?? answers.budgetLevel}${formatMustIncludePlaces(mustIncludePlaces)}`
}

/** Anclas ya identificadas, agrupadas por ciudad — solo para que la llamada de esqueleto calibre cuántos días merece cada ciudad/zona, no le pide que las reparta día a día (eso lo decide cada llamada de bloque). */
function formatAnchorsSummary(anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) return ''
  const byCity = new Map()
  for (const anchor of anchors) {
    const city = (anchor?.city || '').trim() || 'unknown'
    if (!byCity.has(city)) byCity.set(city, [])
    byCity.get(city).push(anchor.name)
  }
  const lines = [...byCity.entries()].map(([city, names]) => `  - ${city}: ${names.join(', ')}`)
  return `\n\nAnchor places already identified (grouped by city — use this to gauge how many days each city/zone deserves):\n${lines.join('\n')}`
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
  return `\n- Anchor places assigned to today — a helpful reference, NOT a mandatory checklist: skip any that don't genuinely fit today's pace/time/geography, and feel free to add other real places from your own knowledge of the destination if that makes for a better day: ${anchorsForBlock.map((anchor) => anchor.name).join(', ')}`
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
    })
    if (result.length >= 60) break
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

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeSkeletonDays(parsed?.days, destination, totalDays, Array.isArray(anchors) ? anchors : [], must_include_places)
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos')

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
    console.log(`[timing] generate-day-block END (days=${blockDayNumbers.join(',')}) — ${Date.now() - t0}ms — stop_reason=${response.stop_reason} output_tokens=${response.usage?.output_tokens}`)

    if (response.stop_reason === 'max_tokens') {
      throw new Error('La respuesta de Claude se cortó por exceder el límite de tokens (bloque de días demasiado largo).')
    }

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock) throw new Error('Respuesta de Claude sin bloque de texto')

    const parsed = JSON.parse(extractJsonText(textBlock.text))
    const days = sanitizeDayBlockDays(parsed?.days, blockDayNumbers)
    if (days.length === 0) throw new Error('Respuesta de Claude sin días válidos para este bloque')

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
