// LZ2a (agente B): LA APP. Sin navegador ni servidor.
//   node scripts/destino/pruebaTandaLZ2a_B.mjs
// Comprueba: las zonas de Lanzarote (con «Aún no lo sé»), el texto del pase de Lanzarote (y que Roma no cambia), las 4 experiencias en lugar de las de Roma y sin Free Tour,
// la pregunta «¿Vas a moverte en coche?» (3 respuestas, «Muy recomendado», obligatoria), lo que se pinta del contrato del motor de coche (trayecto «En coche · 25 min · 18 km» con
// [Abrir en Maps], salir de casa, vuelta, cena cerca, «¿Sin coche?», opcionales quitados; nunca «taxi»), la llegada y la vuelta por ACE (sin Roma) y la hora de Canarias.
import fs from 'node:fs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const crudo = (ruta) => fs.readFileSync(ruta, 'utf8')
const leer = (ruta) => JSON.parse(crudo(ruta))

// ── 3. Las zonas y el pase ───────────────────────────────────────
const D = leer('data/pipeline_v2/lanzarote.json')
const zonas = D.destination_config?.zonas_alojamiento ?? []
debe(zonas.map((z) => z.id).join() === 'puerto_del_carmen,playa_blanca,costa_teguise,arrecife,el_norte,el_interior,nose', '3a', 'las 6 zonas de Lanzarote y «Aún no lo sé»')
debe(zonas.filter((z) => z.id !== 'nose').every((z) => typeof z.coordinates?.lat === 'number' && typeof z.coordinates?.lng === 'number'), '3b', 'cada zona con su coordenada')
debe(!zonas.some((z) => /termini|prati|trastevere|monti/i.test(z.nombre)), '3c', 'ninguna zona de Roma')
const textos = crudo('src/lib/avisoPaseTextos.ts')
debe(textos.includes('adaptamos cada día a donde duermes: a qué hora salir, por dónde empezar y dónde cenar cerca'), '3d', 'el texto del pase de Lanzarote')
debe(/AVISO_PASE_TEXTOS_POR_DESTINO[^=]*= \{\s*\/\/[^\n]*\n\s*Lanzarote: \{\s*alojamiento/.test(textos), '3e', 'el texto va solo en «Lanzarote» (Roma y los demás, el de siempre)')
debe(textos.includes('adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque'), '3f', 'el texto de Roma sigue igual')
debe(/AVISO_PASE_TEXTOS_POR_DESTINO\[destino \?\? deLaRuta\]/.test(crudo('src/components/pase/Candado.tsx')), '3g', 'la línea del pase lee el texto propio del destino')

// ── 4. El formulario ─────────────────────────────────────────────
const banco = crudo('src/lib/experienceCategoryBank.ts')
const bancoLz = banco.slice(banco.indexOf('EXPERIENCE_CATEGORY_BANK_LANZAROTE'), banco.indexOf('export const MAX_POSITIVE_CATEGORIES'))
const ids = [...bancoLz.matchAll(/id: '([a-z_]+)'/g)].map((m) => m[1])
debe(ids.join() === 'imprescindibles,arte,volcanes,playa_y_calma,vino', '4a', 'las 4 experiencias de Lanzarote (más Imprescindibles)')
debe(!ids.includes('free_tour') && !/Free Tour|mercadill/i.test(bancoLz.replace(/\/\*[\s\S]*?\*\//g, '')), '4b', 'sin Free Tour ni mercadillos en Lanzarote')
for (const t of ['Manrique y arte', 'Volcanes y senderismo', 'Playa y calma', 'Vino y cocina canaria']) debe(bancoLz.includes(`title: '${t}'`), '4c', `la experiencia «${t}»`)
const listas = crudo('data/dias/lanzarote/listas.json')
for (const id of ['arte', 'volcanes', 'playa_y_calma', 'vino']) debe(listas.includes(`"experiencia": "${id}"`), '4d', `el id «${id}» es el que lee listas.json`)
const tipos = crudo('src/lib/types.ts')
for (const id of ['arte', 'volcanes', 'playa_y_calma', 'vino']) debe(tipos.includes(`| '${id}'`), '4e', `el tipo ExperienceCategoryId lleva «${id}»`)
debe(/coche\?: 'alquiler' \| 'propio'/.test(tipos), '4f', 'la respuesta se guarda en answers.coche (la que lee el motor)')
const exps = crudo('src/components/trazo/StepExperiences.tsx')
debe(exps.includes('esDestinoDeCoche(destinationName)') && exps.includes('EXPERIENCE_CATEGORY_BANK_LANZAROTE'), '4g', 'StepExperiences usa las de Lanzarote en su destino')
const comp = crudo('src/components/trazo/StepCompanion.tsx')
// (LZ2b1) antes: la pregunta «¿Vas a moverte en coche?» (3 respuestas, obligatoria) y el aviso «sin coche» -> ahora: sin pregunta; «Coche de alquiler | Mi coche» es un interruptor de RESERVAS -> decisión de Eric (LZ2b1, 4-nov). Lo cubre pruebaTandaLZ2b1_B.
debe(!comp.includes('¿Vas a moverte en coche?') && !comp.includes('data-pregunta-coche'), '4h', 'el formulario ya no pregunta por el coche (LZ2b1)')
debe(/answers\.coche/.test(comp) && /setVehicleOwnership\('rental'\)/.test(comp), '4j', 'por defecto, coche de alquiler (enciende el bloque del coche de alquiler: RESERVAS y día 1)')
debe(/export const esDestinoDeCoche = \(destino[^)]*\): boolean => \/\^lanzarote\$\/i/.test(banco), '4l', 'Roma no pregunta lo del coche (solo Lanzarote)')

// ── 5. Lo que se pinta del motor de coche ────────────────────────
const coche = crudo('src/components/route/dayDetail/CocheDelDia.tsx')
const conector = crudo('src/components/route/dayDetail/StopConnector.tsx')
for (const t of ['data-trayecto-coche', 'Abrir en Maps', 'nombre="coche"', 'salir_texto', 'aviso_tope', 'opcionalesQuitados', 'data-cena-cerca', 'Vuelta a casa']) debe(coche.includes(t) || coche.includes(t.replace('sin_coche', 'sinCoche')), '5a', `CocheDelDia pinta «${t}»`)
debe(!/taxi/i.test(coche), '5b', 'nunca «taxi» en lo del coche')
debe(/if \(trayectoCoche\) \{/.test(conector) && conector.includes('<FilaCoche'), '5c', 'el hueco entre paradas pinta el trayecto en coche en lugar del paseo')
const panel = crudo('src/components/route/dayDetail/DayDetailPanel.tsx')
debe(panel.includes('<CabeceraDelDiaCoche day={day} />') && panel.includes('<CenaCercaBloque cena={day.cenaCerca} />') && panel.includes('trayectoDeVuelta(day)'), '5d', 'el día pinta la salida, la cena cerca y la vuelta')
debe((panel.match(/\.trayectoCoche \?\? null/g) ?? []).length >= 3, '5e', 'los tres sitios que pintan huecos pasan el trayecto en coche')
const mapa = crudo('src/lib/mapGeneratedRoute.ts')
for (const t of ['trayecto_previo', 'llegada_texto', 'cena_cerca', 'opcionales_quitados', 'sin_coche', 'generated.coche', 'dia_id', 'timezone']) debe(mapa.includes(t), '5f', `la ruta del servidor conserva «${t}»`)

// ── 5. Llegada y vuelta por ACE ──────────────────────────────────
const LL = leer('data/dias/lanzarote/_llegada.json')
const llTxt = crudo('data/dias/lanzarote/_llegada.json')
const punto = LL.medios?.avion?.puntos?.[0]
debe(LL.ciudad === 'Lanzarote' && punto?.id === 'ace' && punto?.codigo === 'ACE', '5g', 'llegada por el aeropuerto ACE')
debe(!/Roma|Termini|Fiumicino|Ciampino|Leonardo/.test(llTxt), '5h', 'la llegada de Lanzarote no nombra nada de Roma')
debe(punto?.al_centro?.[0]?.mas_comodo === true && /coche de alquiler/i.test(punto.al_centro[0].nombre), '5i', '«Tu mejor opción» es el coche de alquiler')
debe(Array.isArray(punto?.a_la_salida) && /Devuelve el coche/.test(punto.a_la_salida[0]?.nombre), '5j', 'la vuelta: devolver el coche en la T1')
debe(LL.medios.avion.salir_antes_min === 165, '5k', 'salir 165 min antes del vuelo (propuesta)')
debe(/Canarias/.test(llTxt) && /una hora menos/.test(llTxt), '5l', 'avisa de la hora de Canarias')
debe(!/taxi/i.test(LL.medios.avion.textos?.llegada_por_que ?? ''), '5m', 'el resumen no promete taxi')
const hora = crudo('src/lib/zonaHoraria.ts')
debe(/lanzarote: 'Atlantic\/Canary'/.test(hora) && D.timezone === 'Atlantic/Canary', '5n', 'la hora de Canarias (Atlantic/Canary)')

// ── Ronda 2: zona y pase al motor, y la vuelta en coche ──
const av = crudo('src/lib/adaptarVuelos.ts')
debe(/export async function adaptarDiasDeCoche/.test(av) && /coche: cocheRespuesta/.test(av) /* LZ2b1: antes «zona, pase: true, coche: cocheRespuesta»; ahora zona y pase salen de opciones.cambioDeCoche */ && av.includes("'/api/rebuild-day'"), 'R1a', 'elegir la zona rehace cada día con zona+pase+coche por /api/rebuild-day')
debe(av.includes("otro.que === 'zona')) void adaptarDiasDeCoche()"), 'R1b', 'el enganche de la zona llama a adaptarDiasDeCoche solo en Lanzarote')
debe(/!pagoActivo()/.test(av.slice(av.indexOf('export async function adaptarDiasDeCoche'))), 'R1c', 'sin pase no rehace nada')
const ad = crudo('src/components/route/AdaptarDiasDeCoche.tsx')
debe(ad.includes('usePagoActivo') && crudo('src/components/route/RouteScreen.tsx').includes('<AdaptarDiasDeCoche />'), 'R1d', 'al abrir el viaje con pase se adaptan los días')
debe(coche.includes('VueltaEnCoche') && panel.includes('<VueltaEnCoche') && coche.includes('Todas las horas son de Canarias'), 'R2a', '«Hoy vuelves a casa» con el trayecto en coche al aeropuerto y la hora de Canarias')
debe(mapa.includes('generated.aeropuerto'), 'R2b', 'la ruta conserva day.aeropuerto')

// ── 6. Oculto para quien no es administrador ─────────────────────
const servidor = crudo('server/index.js')
debe(/crearGuardianDestinosOcultos/.test(servidor) && /DESTINOS_OCULTOS/.test(servidor), '6a', 'el guardián de destinos ocultos sigue puesto en el servidor')
try {
  const r = await fetch('http://localhost:8787/api/destinos-curados', { signal: AbortSignal.timeout(4000) })
  const j = await r.json()
  debe(!(j.destinos ?? []).some((d) => d.clave === 'lanzarote'), '6b', 'sin sesión, /api/destinos-curados no enseña Lanzarote')
  const a = await fetch('http://localhost:8787/api/arrival-info', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Lanzarote' }), signal: AbortSignal.timeout(4000) })
  debe(a.status === 404, '6c', 'sin sesión, pedir cosas de Lanzarote da 404')
} catch {
  console.log('(la API no responde: se salta 6b y 6c)')
}

console.log(`pruebaTandaLZ2a_B: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO ${f.regla}: ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
