// LZ1 (agente B, apartado 2): monta los DATOS de Lanzarote como los de Roma.
//   node scripts/destino/lanzaroteDatos.mjs
// Escribe (y se puede volver a correr cuando cambian las paradas de C o los documentos):
//   data/pipeline_v2/lanzarote.json            los sitios (places), zonas, ajustes del destino (coche, Atlantic/Canary, atardeceres, cortes de luz)
//   data/dias/lanzarote/listas.json            los días de DIAS_CURADOS_LANZAROTE.md SOLO como datos (los días no se cambian ni se inventan)
//   data/dias/lanzarote/_destino.json          las llegadas a una entrada con hora (turno 15 min) y los cortes de luz
//   data/dias/lanzarote/_mapa.json             el pin (la portada la pone el agente D en _fotos.json)
//   data/dias/lanzarote/_entradas.json         las entradas oficiales de cada sitio
// Las coordenadas vienen de data/dias/lanzarote/_paradas.json (agente C, EN EL APARCAMIENTO); sin ellas: coordinates null + verificar.
// NO escribe historias, restaurantes, llegada, consejos de fichas, fechas especiales, categorías de EXPLORAR ni textos del pase (son de la LZ2).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'

const COMPROBADO = '2026-11-02' // los documentos de Eric se consultaron el 2-nov-2026
const ZONA_HORARIA = 'Atlantic/Canary'
const CACT = 'https://cactlanzarote.com/en/horarios-y-tarifas'
const URL = {
  timanfaya: 'https://cactlanzarote.com/en/visit/montanas-del-fuego',
  jameos: 'https://cactlanzarote.com/en/cact/jameos-del-agua',
  cueva: 'https://cactlanzarote.com/en/cueva-de-los-verdes',
  mirador: 'https://cactlanzarote.com/en/centre/mirador-del-rio',
  cactus: 'https://cactlanzarote.com/en/visit/jardin-de-cactus',
  castillo: 'https://www.cactlanzarote.com/en/visit/castillo-de-san-jose',
  campesino: 'https://cactlanzarote.com/en/visit/casa-museo-del-campesino',
  fcm: 'https://fcmanrique.org/en/casas-museo-visitas/',
  naturaleza: 'DATOS_NATURALEZA_PUEBLOS_COCHE.md',
}
const mm = (h, m = 0) => h * 60 + m

// ───────────────────────────── paradas de C (coordenadas en el aparcamiento) ─────────────────────────────
const rutaParadas = 'data/dias/lanzarote/_paradas.json'
const paradas = existsSync(rutaParadas) ? JSON.parse(readFileSync(rutaParadas, 'utf8')) : { paradas: [], zonas_alojamiento: [] }
const paradaDe = new Map(paradas.paradas.map((p) => [p.id, p]))
/** [lng,lat] o [lat,lng] → siempre [lat,lng] (Lanzarote: lat ~29, lng ~-13,5). */
const latLng = (c) => (Array.isArray(c) && c.length === 2 ? (Math.abs(c[0]) > Math.abs(c[1]) ? [c[0], c[1]] : [c[1], c[0]]) : null)

// ───────────────────────────── los sitios ─────────────────────────────
// Cada sitio: lo que dice LANZAROTE_SITIOS.md + su ficha de los tres DATOS_*.md. Nada inventado: lo que no se sabe va en `verificar`.
// level/tier: Imprescindibles → level 1 «imprescindible»; «Nivel 1» → level 2; «Nivel 2» → level 3 (la pirámide de Roma tiene 3 niveles).
const lugares = []
function sitio(datos) {
  const parada = paradaDe.get(datos.paradaId ?? datos.id)
  const coords = parada ? latLng(parada.coordinates) : null
  const verificar = [datos.verificar, parada?.verificar ? `Coordenada del aparcamiento aproximada (agente C: ${parada.coord_fuente})` : null, !coords ? 'Coordenadas del aparcamiento pendientes (agente C)' : null].filter(Boolean)
  const lugar = {
    id: datos.id,
    name: datos.name,
    level: datos.level,
    ...(datos.tier ? { tier: datos.tier } : {}),
    zone: datos.zone,
    coordinates: coords,
    ...(parada ? { coordinates_fuente: parada.coord_fuente, aparcar_min: parada.aparcar_min, ...(parada.aparcar_min_domingo != null ? { aparcar_min_domingo: parada.aparcar_min_domingo } : {}) } : {}),
    duration_minutes: datos.dura,
    min_max: datos.dura_max ?? datos.dura,
    type: datos.type,
    ver_por: datos.ver_por ?? null,
    tags: datos.tags ?? [],
    ...(datos.libre ? { is_free_access: true } : {}),
    ...(datos.horario ?? {}),
    ...(datos.reserva ? { reservation: datos.reserva } : {}),
    ...(datos.extra ?? {}),
    ...(datos.avisos?.length ? { avisos: datos.avisos } : {}),
    ...(datos.carrito ? { carrito: datos.carrito } : {}),
    comprobado: COMPROBADO,
    ...(verificar.length ? { verificar: verificar.join(' | ') } : {}),
  }
  lugares.push(lugar)
}
const aviso = (tipo, texto, fuente) => ({ tipo, texto, ...(fuente ? { fuente } : {}) })
const auditoria = (confianza, fuente, nota) => ({ confianza, fuente, nota, fecha: COMPROBADO })
const PISTA = aviso('pista_de_tierra', 'Revisa si tu seguro cubre las pistas de tierra', 'LANZAROTE_SITIOS.md (Para todos)')

// ── Imprescindibles ──
sitio({
  id: 'montanas_del_fuego', name: 'Montañas del Fuego (Timanfaya)', level: 1, tier: 'imprescindible', zone: 'centro_oeste', dura: 90, type: 'interior', ver_por: 'solo_dentro',
  tags: ['volcan', 'parque_nacional'],
  horario: {
    schedule: '09:00-15:45', windows: ['09:00-15:45'], last_entry: '15:45', closed_on: [], closed_dates: [],
    horario_nota: 'Son las horas de entrada (turnos): primer turno 09:00, último 15:45; cierre a las 16:00, todos los días.',
    turnos_reserva: null,
    hours_audit: auditoria('media', URL.timanfaya, 'Web oficial del CACT: 09:00–15:45 todos los días, 365 días. Eric lo confirma (4-nov-2026): abre a las 09:00 todos los días, horario 9:00-16:00 desde el 1-jul-2023; primer turno 09:00, último 15:45, cierre 16:00.'),
  },
  reserva: 'obligatoria',
  extra: {
    reserva_solo_online: true, reserva_con_dia_y_hora: true, reserva_paso: 15, carrito_en_reserva: false,
    reserva_nota: 'Entrada con día y hora, SOLO por internet (no se vende en taquilla desde el 15-jun-2026). Hay que llegar 15 minutos antes; si llegas tarde no te aseguran la entrada. Se agota en temporada alta.',
    precio: { adulto: 30, nino_7_12: 15, nino_0_6: 0, moneda: 'EUR', fuente: URL.timanfaya, comprobado: COMPROBADO },
    ticket_info: ['De pago.', 'Reserva obligatoria, solo online, con día y hora.', 'Entrada: 30 € (7-12 años: 15 €; 0-6: gratis).', 'Incluye las demostraciones de calor del Islote de Hilario y la Ruta de los Volcanes en el autobús del parque (35-40 min, sin bajarse).'],
    duracion_nota: 'La web oficial da 90 min en una página y 75 en otra.',
  },
  avisos: [aviso('cola', 'En julio de 2025 hubo colas de cientos de coches; las entradas con hora se crearon para evitarlo. Con todo, en temporada alta puede haber espera.', 'La Voz de Lanzarote, 1-jul-2025'), aviso('aparcamiento', 'Aparcamiento gratis en el Islote de Hilario, solo con entrada; está en cuesta y las puertas pueden dar a otros coches.', 'CACT')],
  carrito: 'dificil',
  verificar: 'Si se puede comer en El Diablo (12:00-16:00) sin tener entrada, sin confirmar.',
})
sitio({
  id: 'jameos_del_agua', name: 'Jameos del Agua', level: 1, tier: 'imprescindible', zone: 'norte', dura: 60, type: 'interior', ver_por: 'solo_dentro', tags: ['cesar_manrique', 'cueva'],
  horario: {
    schedule: '10:00-18:00', windows: ['10:00-18:00'], last_entry: '17:15', closed_on: [], closed_dates: [],
    noche_de_jameos: { dia: 'viernes', todos_los_viernes_del_ano: true, cena: '18:30-20:30', concierto: '22:30-23:15', abierto_hasta: '00:00', precio_menu: { adulto: 98, vegano: 88, nino_7_12: 49 }, reserva: 'con mesa reservada en la web (no hay entrada solo para la visita nocturna)', fuente: 'https://cactlanzarote.com/en/tickets/jameos-noche', nota: 'Hay 2 h entre el fin de la cena y el concierto (es lo que pone la web).' },
    hours_audit: auditoria('alta', URL.jameos, 'Web oficial del CACT: 10:00–18:00 todos los días, última entrada 17:15. Los viernes, Noches de Jameos (cena 18:30–20:30 y concierto 22:30–23:15).'),
  },
  reserva: 'no',
  extra: {
    precio: { adulto: 17, adulto_con_casa_de_los_volcanes: 22.4, nino_7_12: 8.5, nino_0_6: 0, moneda: 'EUR', fuente: URL.jameos, comprobado: COMPROBADO },
    ticket_info: ['De pago.', 'Entrada: 17 € (con la Casa de los Volcanes, 22,40 €; 7-12 años: 8,50 €).', 'Sin hora: taquilla u online (comprar antes ahorra cola).', 'Viernes por la noche: Noches de Jameos con cena y concierto (98 € el menú de adulto).'],
    no_en_carrito: true,
  },
  avisos: [aviso('carrito', 'No se permite entrar con carrito de bebé: mejor mochila portabebés (hay desniveles y suelo de piedra).', URL.jameos)],
  carrito: 'no',
  verificar: 'Noches de Jameos de los viernes 25-dic, 1-ene y Viernes Santo, sin confirmar.',
})
sitio({
  id: 'cueva_de_los_verdes', name: 'Cueva de los Verdes', level: 1, tier: 'imprescindible', zone: 'norte', dura: 50, type: 'interior', ver_por: 'solo_dentro', tags: ['cueva', 'tubo_volcanico'],
  horario: {
    schedule: '09:30-16:45', windows: ['09:30-16:45'], closed_on: [], closed_dates: [],
    turnos: { cada_minutos: 30, nota: 'Un grupo cada ~30 minutos (de 15 a 30 personas). Dato de un blog (La Maleta Inquieta, 2-sep-2026): la web oficial no da la frecuencia ni la última visita.', fuente_tipo: 'blog' },
    hours_audit: auditoria('media', URL.cueva, 'Web oficial del CACT: 09:30–16:45 todos los días. La hora de la última visita no la dice la web oficial (depende de las plazas del día).'),
  },
  reserva: 'obligatoria',
  extra: {
    reserva_solo_online: true, reserva_con_dia_y_hora: true, reserva_paso: 15, no_se_puede_cambiar: true,
    reserva_nota: 'Entrada con día y hora, SOLO por internet; no se puede cambiar. Llegar 15 minutos antes.',
    precio: { adulto: 17, nino_7_12: 8.5, nino_0_6: 0, moneda: 'EUR', fuente: URL.cueva, comprobado: COMPROBADO },
    ticket_info: ['De pago.', 'Reserva obligatoria, solo online, con día y hora.', 'Entrada: 17 € (7-12 años: 8,50 €).', 'Visita guiada de ~50 min (1 km a pie) con explicaciones en español e inglés.'],
  },
  avisos: [aviso('carrito', 'No se permiten carritos y no hay dónde dejarlos: mejor mochila portabebés.', URL.cueva), aviso('acceso', 'Escaleras, pasos estrechos y techos bajos (avisan a quien mida más de 1,80 m y a quien tenga claustrofobia). No está adaptada a movilidad reducida.', URL.cueva)],
  carrito: 'no',
  verificar: 'Los turnos reales y la última visita (la web oficial no los da; los ~30 min son de un blog).',
})
sitio({
  id: 'mirador_del_rio', name: 'Mirador del Río', level: 1, tier: 'imprescindible', zone: 'norte', dura: 45, type: 'interior', ver_por: 'solo_dentro', tags: ['mirador', 'cesar_manrique'],
  horario: { schedule: '10:00-17:00', windows: ['10:00-17:00'], last_entry: '16:40', closed_on: [], closed_dates: [], hours_audit: auditoria('alta', URL.mirador, 'Web oficial del CACT: 10:00–17:00 todos los días, última entrada 16:40.') },
  reserva: 'no',
  extra: { precio: { adulto: 9, nino_7_12: 4.5, nino_0_6: 0, moneda: 'EUR', fuente: URL.mirador, comprobado: COMPROBADO }, ticket_info: ['De pago.', 'Entrada: 9 € (7-12 años: 4,50 €).', 'Sin hora: taquilla u online.'] },
  avisos: [aviso('nubes', 'Si hay nubes, apenas se ve nada.', 'opiniones de visitantes'), aviso('carretera', 'Subida por la LZ-203 y la LZ-201, con pendiente fuerte y curvas.', 'hellocanaryislands.com')],
  carrito: 'dificil',
  verificar: 'Si hay un mirador gratis equivalente cerca: la web oficial no lo dice (el Mirador de Guinate es la alternativa gratuita de la lista).',
})
sitio({
  id: 'fundacion_cesar_manrique', name: 'Fundación César Manrique', level: 1, tier: 'imprescindible', zone: 'centro', dura: 90, type: 'interior', ver_por: 'solo_dentro', tags: ['cesar_manrique', 'museo'],
  horario: {
    schedule: '10:00-17:30', windows: ['10:00-17:30'], last_entry: '17:00', closed_on: [], closed_dates: ['01-01'],
    closed_dates_audit: { '01-01': { estado: 'cierra', fuente: 'fcmanrique.org: cierra el 1 de enero. El 25 de diciembre no se menciona.', comprobado: COMPROBADO } },
    hours_audit: auditoria('media', URL.fcm, 'Todos los días, festivos incluidos, 10:00–17:30; taquilla hasta las 17:00 y desalojan desde las 17:20. Otra página de la misma web pone 10:00–18:00 (taquilla hasta las 17:30): podría ser horario de verano sin quitar.'),
  },
  reserva: 'no',
  extra: {
    precio: { adulto: 10, nino_7_12: 3, combinada_con_casa_museo_de_haria: 17, combinada_nino: 4, moneda: 'EUR', fuente: URL.fcm, comprobado: COMPROBADO },
    ticket_info: ['De pago.', 'Entrada: 10 € (7-12 años: 3 €).', 'Entrada conjunta con la Casa-Museo de Haría: 17 € (niño 4 €); según un blog vale en días distintos, sin confirmar en la web oficial.'],
    dias_de_crucero: ['martes', 'miércoles'], dias_de_crucero_nota: 'Se llena desde las 11:00: ir antes de esa hora o comprar antes.',
  },
  avisos: [aviso('acceso', 'Túneles entre burbujas de menos de 1 m de ancho y 1,90 m de alto (fuente secundaria). Sobre carritos no hay información.', 'La Maleta Inquieta [blog]')],
  verificar: 'Horario de cierre: 17:30 (portada y Google) o 18:00 (otra página oficial). Frecuencia de cierre el 25-dic no mencionada.',
})
sitio({
  id: 'el_golfo_y_el_charco_de_los_clicos', name: 'El Golfo y el Charco de los Clicos', level: 1, tier: 'imprescindible', zone: 'suroeste', dura: 45, type: 'exterior', ver_por: null, libre: true, tags: ['naturaleza', 'atardecer', 'pueblo'],
  horario: { closed_on: [], hours_audit: auditoria('media', URL.naturaleza, 'No hay taquilla ni horario. Que sea gratis está sin confirmar de forma explícita (ninguna fuente lo dice).') },
  extra: { precio: { adulto: 0, verificar: true, nota: 'Sin taquilla; «gratis» sin confirmar de forma explícita.' }, a_pie_desde_aparcamiento_min: 5, mejor_momento: 'tarde y atardecer', atardece_al_mar: true },
  avisos: [aviso('zona_protegida', 'La laguna está dentro de una Reserva Natural. spain.info marca «viento y oleaje fuerte». Si se puede bajar al agua o bañarse, sin confirmar.', 'spain.info')],
  verificar: 'Tiempo total de visita sin confirmar (45 min con el pueblo, de LANZAROTE_SITIOS.md). La ficha «El Golfo Viewpoint» de hellocanaryislands trae las coordenadas mal (28.451, -15.931): no usarlas.',
})
sitio({
  id: 'la_geria_y_sus_bodegas', name: 'La Geria y sus bodegas', level: 1, tier: 'imprescindible', zone: 'centro', dura: 60, dura_max: 90, type: 'exterior', ver_por: 'dentro_y_fuera', tags: ['paisaje', 'vino', 'bodega'],
  horario: {
    schedule: '10:00-19:00', windows: ['10:00-19:00'], closed_on: [], closed_dates: [],
    horario_nota: 'La Geria es una carretera (LZ-30) y un paisaje; el horario es el de la bodega más amplia (Bodega La Geria, 10:00–19:00, días sin confirmar). Ver `bodegas` para cada una.',
    bodegas: [
      { id: 'bodega_el_grifo', nombre: 'El Grifo', ubicacion: 'LZ-30 km 11, San Bartolomé', dias: 'lunes a viernes', visitas: '10:00-17:15 (último acceso)', tienda: 'lunes a viernes 10:00-18:00', cerrada: ['sábado', 'domingo'], visita: { nombre: '«El Grifo a tu aire» (audioguía, museo del vino, bodega de 1775 y 2 vinos)', precio: 15, dura_min: 45, gratis_hasta_anos: 17 }, reserva: 'muy recomendada', fuente: 'https://elgrifo.com/en/pages/museo-del-vino-el-grifo', confianza: 'alta' },
      { id: 'stratvs', nombre: 'Stratvs', ubicacion: 'Ctra. La Geria–Uga', dias: 'todos los días', visitas: ['10:30', '12:00', '13:30', '16:00'], visita: { nombre: 'Visita guiada con 3 vinos y quesos', precio: 25, dura_min: 60 }, reserva: 'online; la web no dice si es obligatoria', fuente: 'https://stratvs.com/en/visitas-agenda/', confianza: 'alta', duda: 'Un blog dice de martes a sábado y catas de 8 y 25 €; un artículo de 2013, 12 €. Manda la web oficial.' },
      { id: 'bodega_la_geria', nombre: 'Bodega La Geria', ubicacion: 'Ctra. de La Geria km 19 (bar-cafetería y Taberna La Cepa dentro del mismo sitio)', dias: 'sin confirmar', visitas: '10:00-19:00', visita: { nombre: 'Visita guiada con reserva online', precio: null, precio_blog: 15, dura_min: 60 }, reserva: 'online', fuente: 'https://www.lageria.com/en/la-geria-winery/', confianza: 'media', duda: 'La web no dice qué días abre ni el precio de la visita (el blog dice 15 € con 3 vinos).' },
    ],
    hours_audit: auditoria('media', 'https://turismolanzarote.com/en/sightseeing/wineries/', 'El Grifo: lunes a viernes 10:00–17:15; Stratvs: todos los días, visitas 10:30, 12:00, 13:30 y 16:00; Bodega La Geria: 10:00–19:00 (días sin confirmar).'),
  },
  reserva: 'recomendada',
  extra: { precio: { visita_el_grifo: 15, visita_stratvs: 25, nota: 'La carretera es gratis; la visita a una bodega se paga.' }, nunca_solo_de_camino: true, nunca_solo_de_camino_nota: 'Lleva parada en una bodega o un mirador (regla del imprescindible).', fuera_domingo: ['bodega_el_grifo'] },
  avisos: [aviso('conducir', 'Quien conduce, sin alcohol.', 'DIAS_CURADOS_LANZAROTE.md')],
  verificar: 'Días que abre Bodega La Geria; si Stratvs pide reserva; bodegas: coordenadas sin confirmar.',
})

// ── Nivel 1 ──
sitio({
  id: 'playas_de_papagayo', name: 'Playas de Papagayo', level: 2, zone: 'sur', dura: 240, dura_max: 480, type: 'exterior', ver_por: null, tags: ['playa', 'pista_de_tierra', 'sin_socorrista'],
  horario: { schedule: '09:00-19:00', windows: ['09:00-19:00'], closed_on: [], closed_dates: [], hours_audit: auditoria('baja', 'La Voz de Lanzarote / Annua Hotels [blog]', 'Aparcamiento de 9:00 a 19:00 según un blog; no hay horario oficial de la barrera. En verano de 2025 el control cerró dos días por semana (La Voz).') },
  extra: {
    precio: { por_coche: 3, no_residentes: true, moneda: 'EUR', fuente: 'La Voz de Lanzarote, ago-2025', nota: 'Los residentes no pagan. Pago solo con tarjeta: lo dice un blog, sin confirmar oficialmente.' },
    ticket_info: ['De pago por coche: 3 € (no residentes).', 'Pista de tierra «despacio» por los baches.'],
    experiencia: 'playa_y_calma', calas: ['Mujeres', 'Papagayo', 'Pozo', 'La Cera', 'Caleta del Congrio (zona mixta nudista y textil)'],
    pista_de_tierra: { min_extra: '15-20', nota: 'Pista de tierra de ~5,5 km con barrera y pago' },
  },
  avisos: [PISTA, aviso('sin_socorrista', 'Las playas no tienen socorrista.', 'turismolanzarote.com'), aviso('tarjeta', 'Lleva tarjeta por si acaso (el pago solo con tarjeta es de un blog).', '[blog]'), aviso('duchas', 'Hay un chiringuito en la ladera y duchas donde no se puede usar jabón.', 'turismolanzarote.com')],
  verificar: 'Horario de la barrera y cómo se paga. Coordenadas de Pozo, La Cera y Caleta del Congrio sin confirmar.',
})
sitio({
  id: 'caleton_blanco', name: 'Caletón Blanco', level: 2, zone: 'extremo_norte', dura: 120, dura_max: 180, type: 'exterior', ver_por: null, libre: true, tags: ['playa', 'sin_socorrista'],
  horario: { closed_on: [], hours_audit: auditoria('baja', 'La Maleta Inquieta, 7-oct-2026 [blog]', 'Libre. Mejor con marea bajando, de 9:00 a 12:00; desde las 13:00 sube el viento (blog).') },
  extra: { precio: { adulto: 0 }, mejor_hora: '09:00-12:00 (marea bajando)', aparcamiento: 'arcén de la LZ-1 (km 30)', distancia_a_orzola_km: 1.2 },
  avisos: [aviso('sin_socorrista', 'Sin socorrista. Los charcos de dentro, resguardados con marea baja o media; fuera, mar abierto.', 'La Maleta Inquieta [blog]')],
  verificar: 'Todo viene de un blog (no hay fuente oficial).',
})
sitio({
  id: 'jardin_de_cactus', name: 'Jardín de Cactus', level: 2, zone: 'noreste', dura: 60, type: 'interior', ver_por: 'solo_dentro', tags: ['cesar_manrique', 'jardin'],
  horario: { schedule: '10:00-17:00', windows: ['10:00-17:00'], last_entry: '16:30', closed_on: [], closed_dates: [], hours_audit: auditoria('alta', URL.cactus, 'Web oficial del CACT: 10:00–17:00 todos los días, última entrada 16:30.') },
  reserva: 'no',
  extra: { precio: { adulto: 9, nino_7_12: 4.5, nino_0_6: 0, moneda: 'EUR', fuente: URL.cactus, comprobado: COMPROBADO, brunch: 22 }, ticket_info: ['De pago.', 'Entrada: 9 € (7-12 años: 4,50 €).', 'Sin hora; se recomienda comprar antes por internet.'] },
  avisos: [aviso('acceso', 'Caminos de piedra irregulares; el molino y la tienda no tienen rampa. Sobre carritos no dice nada.', URL.cactus)],
})
sitio({
  id: 'los_hervideros', name: 'Los Hervideros', level: 2, zone: 'suroeste', dura: 30, type: 'exterior', ver_por: null, libre: true, tags: ['costa', 'lava'],
  horario: { closed_on: [], hours_audit: auditoria('media', URL.naturaleza, 'Sin taquilla ni horario. Gratis: sin confirmar de forma explícita.') },
  extra: { precio: { adulto: 0, verificar: true }, mejor_momento: 'marea alta y atardecer' },
  avisos: [aviso('mar_brava', 'Con mar brava hay que extremar la precaución, sobre todo con niños; no salirse de los caminos marcados.', 'hellocanaryislands.com')],
  verificar: 'Tiempo de visita y aparcamiento sin confirmar en las fuentes (30 min de LANZAROTE_SITIOS.md).',
})
sitio({
  id: 'salinas_de_janubio', name: 'Salinas de Janubio', level: 2, zone: 'suroeste', dura: 20, type: 'exterior', ver_por: null, libre: true, tags: ['mirador', 'atardecer', 'salinas'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/museums-and-places-of-interest/lanzarote/janubio-salt-mines/', 'Mirador libre. Precio, horario y visitas guiadas de las salinas, sin confirmar (la web oficial no abrió).') },
  extra: { precio: { adulto: 0, nota: 'El mirador es gratis.' }, visita_guiada_civitatis: { duracion: '2 h', precio_aprox_eur: 22, verificar: true }, mejor_momento: 'atardecer desde el mirador' },
  verificar: 'Precio y horario de la visita a las salinas.',
})
sitio({
  id: 'teguise', name: 'Teguise (villa)', level: 2, zone: 'centro_norte', dura: 90, dura_max: 120, type: 'exterior', ver_por: null, libre: true, tags: ['pueblo', 'historia', 'mercadillo'],
  horario: {
    closed_on: [], by_day: { dom: ['09:00-14:00'] },
    mercadillo: { dia: 'domingo', horario: '09:00-14:00', lugar: 'casco histórico', fuente: 'https://turismolanzarote.com/en/market/villa-de-teguise-market/' },
    hours_audit: auditoria('alta', 'https://turismolanzarote.com/en/teguise/', 'Casco libre. Mercadillo todos los domingos 9:00–14:00 en el casco histórico.'),
  },
  extra: { precio: { adulto: 0 }, dura_domingo_min: 120, free_tour: { nota: 'Free Tour de Teguise: 9,3/10, 2 h; días y horas por confirmar (Agente D).', verificar: true }, aparcamiento_domingo: 'sin confirmar (un blog dice que los gratis de la entrada se llenan hacia las 10:30)' },
  verificar: 'Aparcamiento en domingo; días y horas del Free Tour.',
})
sitio({
  id: 'haria_y_la_casa_museo_cesar_manrique', name: 'Haría y la Casa-Museo César Manrique', level: 2, zone: 'norte', dura: 90, type: 'interior', ver_por: 'dentro_y_fuera', tags: ['pueblo', 'cesar_manrique', 'museo', 'mercado'],
  horario: {
    schedule: '10:00-17:30', windows: ['10:00-17:30'], last_entry: '17:00', closed_on: [], closed_dates: ['01-01'],
    closed_dates_audit: { '01-01': { estado: 'cierra', fuente: 'fcmanrique.org: la Casa-Museo cierra el 1 de enero.', comprobado: COMPROBADO } },
    horario_nota: 'Es el horario de la Casa-Museo; el pueblo es libre. Mercado artesanal los sábados 9:00–14:30 en la plaza León y Castillo.',
    mercado: { dia: 'sábado', horario: '09:00-14:30', lugar: 'plaza León y Castillo', fuente: 'https://turismolanzarote.com/en/market/haria-artisanal-market/', duda: 'Otras webs no oficiales dicen 10:00–14:30 o 9:00–14:00; manda turismolanzarote.' },
    hours_audit: auditoria('media', URL.fcm, 'Casa-Museo: según su web oficial, 10:00–17:30 (otra fuente: 10:30), taquilla hasta las 17:00; cierra el 1 de enero. Otra página oficial dice hasta las 18:00.'),
  },
  reserva: 'no',
  extra: { precio: { adulto: 10, nino_7_12: 3, combinada_con_fundacion: 17, moneda: 'EUR', fuente: URL.fcm, comprobado: COMPROBADO }, ticket_info: ['De pago (la casa; el pueblo es libre).', 'Entrada Casa-Museo: 10 € (7-12 años: 3 €).', 'Entrada conjunta con la Fundación: 17 € (niño 4 €).'], duracion_nota: 'Casa-Museo ~1 h (opiniones de visitantes) más el pueblo.' },
  verificar: 'Hora de apertura de la Casa-Museo: 10:00 (web oficial) o 10:30 (otra fuente). Accesibilidad, carrito y aparcamiento sin confirmar. Reserva sin confirmar en la web oficial.',
})
sitio({
  id: 'casa_museo_del_campesino', name: 'Casa-Museo del Campesino', level: 2, zone: 'centro', dura: 50, type: 'interior', ver_por: 'dentro_y_fuera', tags: ['cesar_manrique', 'museo', 'gratis'],
  horario: { schedule: '10:00-18:00', windows: ['10:00-18:00'], closed_on: [], closed_dates: [], hours_audit: auditoria('alta', URL.campesino, 'Web oficial del CACT: 10:00–18:00 todos los días. Última entrada sin confirmar. Reabierta en agosto de 2026 (La Voz).') },
  reserva: 'no',
  extra: { precio: { adulto: 0, gratis: true, fuente: URL.campesino, comprobado: COMPROBADO }, restaurante: { horario: '12:00-16:00', reserva: 'online hasta 2 h antes o 928 52 01 36' }, escultura_fuera: 'La escultura «Fecundidad» de Manrique se ve desde fuera.' },
  avisos: [aviso('acceso', 'Mayormente adaptado; el acceso a la escultura «Fecundidad» no tiene recorrido adaptado.', URL.campesino)],
  verificar: 'Última entrada.',
})
sitio({
  id: 'caleta_de_famara_y_playa_de_famara', name: 'Caleta de Famara y Playa de Famara', level: 2, zone: 'noroeste', dura: 90, dura_max: 120, type: 'exterior', ver_por: null, libre: true, tags: ['playa', 'pueblo', 'surf', 'atardecer'],
  horario: { closed_on: [], hours_audit: auditoria('alta', 'https://turismolanzarote.com/en/beach/playa-de-famara-famara-beach/', 'Libre. La playa tiene socorristas y señalización de peligro.') },
  extra: { precio: { adulto: 0 }, atardece_al_mar: true },
  avisos: [aviso('bandera_roja', 'La playa tiene bandera roja todo el año (corrientes de las más peligrosas de la isla): solo para remojarse.', 'turismolanzarote.com / hellocanaryislands.com')],
})
sitio({
  id: 'arrecife_charco_de_san_gines_y_el_paseo', name: 'Arrecife: Charco de San Ginés y el paseo', level: 2, zone: 'este', dura: 90, type: 'exterior', ver_por: null, libre: true, tags: ['ciudad', 'paseo', 'laguna'],
  horario: { closed_on: [], hours_audit: auditoria('alta', 'https://turismolanzarote.com/en/arrecife-a-4-kilometre-seaside-walk-past-islets-and-two-castles/', 'Paseo oficial de 4 km (2020) del Reducto al Castillo de San José; libre.') },
  extra: { precio: { adulto: 0 }, mercadillo: { dias: 'miércoles y jueves 9:00-14:00', fuente_tipo: 'no oficial (lanzaroteinformation.co.uk)' }, mira_al_este: 'Arrecife mira al este: el sol no se pone sobre el mar.', playa_del_reducto: 'Bandera Azul; mejor con marea alta o media' },
  verificar: 'Calle León y Castillo sin confirmar (la ruta oficial cita la calle Real).',
})
sitio({
  id: 'castillo_de_san_jose', name: 'Castillo de San José (MIAC)', level: 2, zone: 'este', dura: 60, type: 'interior', ver_por: 'dentro_y_fuera', tags: ['museo', 'castillo', 'cena_con_vistas'],
  horario: {
    schedule: '11:00-18:00', windows: ['11:00-18:00'], closed_on: [], closed_dates: [],
    restaurante: { 'domingo-martes': '11:00-18:00', 'miercoles-sabado': '11:00-23:00', reservas: '928 81 23 21' },
    hours_audit: auditoria('alta', URL.castillo, 'Web oficial del CACT: museo 11:00–18:00 todos los días; restaurante de domingo a martes 11:00–18:00 y de miércoles a sábado 11:00–23:00. Última entrada sin confirmar.'),
  },
  reserva: 'no',
  extra: { precio: { adulto: 5.4, nino_7_12: 2.7, nino_0_6: 0, moneda: 'EUR', fuente: URL.castillo, comprobado: COMPROBADO }, ticket_info: ['De pago.', 'Entrada: 5,40 € (7-12 años: 2,70 €).'], por_fuera_valoracion: 'Valoración del documento (no de la web oficial): el edificio y las vistas al puerto se disfrutan desde fuera.' },
  verificar: 'Última entrada. «Por fuera» es una valoración, no un dato oficial.',
})

// ── Nivel 2 ──
sitio({ id: 'lagomar', name: 'LagOmar', level: 3, zone: 'centro', dura: 60, type: 'interior', ver_por: 'solo_dentro', tags: ['cesar_manrique', 'museo'],
  horario: { schedule: '10:00-18:00', windows: ['10:00-18:00'], closed_on: [], closed_dates: [], restaurante: { dias: 'martes a domingo', horario: '18:00-00:00', cierra: 'lunes' }, hours_audit: auditoria('baja', 'https://gazettelife.com/places-to-visit/visiting-lagomar/', 'Sin web oficial. Gazette Life (10-jul-2026): 10:00–18:00 todos los días; restaurante de martes a domingo de 18:00 a 00:00.') },
  extra: { precio: { adulto: 10, nino_4_12: 4, residente_canario: 4, residente_lanzarote: 2, moneda: 'EUR' } },
  verificar: 'Horario oficial y si abre el 1 de enero (sin web oficial). Aparcamiento y carrito sin confirmar.' })
sitio({ id: 'ermita_de_las_nieves', name: 'Ermita de las Nieves', level: 3, zone: 'centro_norte', dura: 20, type: 'exterior', ver_por: null, libre: true, tags: ['mirador'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/viewpoints/lanzarote/ermita-de-las-nieves-viewpoint/', 'Mirador libre a 650 m de altura. Acceso, aparcamiento y si abre la ermita, sin confirmar.') },
  extra: { precio: { adulto: 0 }, mejor_momento: 'amanecer y atardecer' }, avisos: [aviso('niebla', 'Con niebla o viento fuerte no se ve nada.', 'barcelo.com')], verificar: 'Duración (20 min es estimación) y acceso.' })
sitio({ id: 'mirador_de_guinate', name: 'Mirador de Guinate', level: 3, zone: 'norte', dura: 20, type: 'exterior', ver_por: null, libre: true, tags: ['mirador', 'gratis'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/viewpoints/lanzarote/guinate-viewpoint/', 'Mirador libre, a 500 m de altura, poco concurrido; vistas al archipiélago Chinijo.') },
  extra: { precio: { adulto: 0, verificar: true, nota: 'No hay taquilla; precio sin confirmar.' }, alternativa_a: 'mirador_del_rio' }, verificar: 'Duración estimada; sube de prioridad (Eric, 3-nov).' })
sitio({ id: 'ciudad_estratificada_rofera_de_teseguite', name: 'Ciudad Estratificada (Rofera de Teseguite)', level: 3, zone: 'centro_norte', dura: 25, type: 'exterior', ver_por: null, libre: true, tags: ['geologia', 'fotogenico'],
  horario: { closed_on: [], hours_audit: auditoria('baja', 'Solo Sophie [blog]', 'Libre y gratis; aparcamiento de tierra y sin servicios.') },
  extra: { precio: { adulto: 0 } }, avisos: [aviso('fragil', 'No subirse: las formaciones son frágiles, y hay quejas de basura y pintadas: «llévate tu basura».', 'Solo Sophie [blog]'), PISTA], verificar: 'Todo de un blog.' })
sitio({ id: 'playa_de_montana_bermeja', name: 'Playa de Montaña Bermeja', level: 3, zone: 'suroeste', dura: 15, dura_max: 20, type: 'exterior', ver_por: null, libre: true, tags: ['playa', 'arena_negra'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'spain.info', 'Libre, poco visitada y sin servicios.') },
  extra: { precio: { adulto: 0 } }, avisos: [aviso('no_es_de_bano', 'No es de baño: viento y mar de fondo fuerte.', 'spain.info')] })
sitio({ id: 'las_grietas_montana_blanca', name: 'Las Grietas (Montaña Blanca)', level: 3, zone: 'centro', dura: 40, dura_max: 45, type: 'exterior', ver_por: null, libre: true, tags: ['geologia', 'fotogenico', 'pista_de_tierra'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'La Voz de Lanzarote / Annua Hotels', 'Libre y gratis, sin horario; sin aparcamiento oficial (apartadero de tierra); sin señales ni camino marcado.') },
  extra: { precio: { adulto: 0 }, mejor_hora: 'primera hora o última de la tarde (Annua Hotels)', solo_de_dia: true },
  avisos: [PISTA, aviso('desprendimientos', 'Acceso sin regular; en 2024 se pidió cerrarlo por riesgo de desprendimientos. No ir con lluvia ni viento fuerte (resbala); solo de día; con niños, mucho cuidado.', 'La Voz de Lanzarote'), aviso('aparcamiento', 'Sin aparcamiento oficial: aparcar fuera de la carretera.', 'LANZAROTE_SITIOS.md')],
  verificar: 'Duración (30-45 min) por comprobar.' })
sitio({ id: 'mirador_del_bosquecillo', name: 'Mirador del Bosquecillo (Risco de Famara)', level: 3, zone: 'norte', dura: 20, type: 'exterior', ver_por: null, libre: true, tags: ['mirador', 'pista_de_tierra'],
  horario: { closed_on: [], hours_audit: auditoria('baja', 'La Voz de Lanzarote / La Maleta Inquieta [blog]', 'Libre y gratis (blog). Pista de tierra mal señalizada desde la LZ-10; sin valla continua ni servicios.') },
  extra: { precio: { adulto: 0 } },
  avisos: [PISTA, aviso('viento', 'Solo con día claro y sin viento fuerte; cuidado con los desniveles.', 'La Voz de Lanzarote')], verificar: 'Coordenada del blog; duración estimada.' })
sitio({ id: 'mirador_de_haria', name: 'Mirador de Haría', level: 3, zone: 'norte', dura: 20, type: 'exterior', ver_por: null, libre: true, tags: ['mirador'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/viewpoints/lanzarote/mirador-de-haria/', 'Libre. Aparcamiento pequeño, prohibido dejar el coche en el arcén. Viernes, sábados y domingos de 11:00 a 15:00 hay microbús desde la Biblioteca de Haría.') },
  extra: { precio: { adulto: 0 }, no_es_de_atardecer: true }, avisos: [aviso('pista', 'Un tramo de pista de tierra con baches (La Voz).', 'La Voz de Lanzarote')], verificar: 'Duración estimada.' })
sitio({ id: 'mirador_de_los_helechos', name: 'Mirador de los Helechos', level: 3, zone: 'norte', dura: 15, type: 'exterior', ver_por: null, libre: true, tags: ['mirador'],
  horario: { closed_on: [], hours_audit: auditoria('baja', 'LANZAROTE_SITIOS.md (nota de Haría)', 'Sin ficha propia en los datos: es la mejor vista del Valle de las Mil Palmeras.') },
  extra: { precio: { adulto: 0, verificar: true } }, verificar: 'Sin ficha de datos: horario, duración y aparcamiento por comprobar.' })
sitio({ id: 'castillo_de_santa_barbara', name: 'Castillo de Santa Bárbara', level: 3, zone: 'centro_norte', dura: 30, dura_max: 45, type: 'exterior', ver_por: null, tags: ['castillo', 'mirador'],
  horario: { closed_on: [], solo_por_fuera: true, hours_audit: auditoria('baja', 'La Voz de Lanzarote, 23-jul-2026; La Maleta Inquieta', 'El Museo de la Piratería ya no existe: el castillo está vacío. Horario sin confirmar (blog: 10:00–15:00, 3 €; Google: 10:00–14:30, cerrado viernes y sábado, gratis).') },
  extra: { precio: { adulto: null, verificar: true, nota: '3 € o gratis, sin confirmar.' } }, avisos: [aviso('museo_cerrado', 'El Museo de la Piratería ya no funciona (castillo vacío desde 2026); las señales de la carretera aún lo anuncian. Solo por fuera, por las vistas.', 'La Voz de Lanzarote, 23-jul-2026')],
  verificar: 'Horario y precio (las fuentes no coinciden). A veces cierra sin avisar.' })
sitio({ id: 'punta_mujeres_y_arrieta', name: 'Punta Mujeres y Arrieta (La Garita)', level: 3, zone: 'noreste', dura: 90, type: 'exterior', ver_por: null, libre: true, tags: ['pueblo', 'bano', 'piscinas_naturales'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/natural-pools/lanzarote/punta-mujeres-natural-swimming-pools/', 'Piscinas naturales de Punta Mujeres (~2 km, dos resguardadas), mejor a media marea. Restaurantes de marisco en el espigón de Arrieta.') },
  extra: { precio: { adulto: 0 }, la_garita: { id: 'playa_de_la_garita', largo_m: '500-800 (las fuentes no coinciden)', socorrista: false } },
  avisos: [aviso('sin_socorrista', 'La Garita, familiar y de agua tranquila casi siempre, sin socorrista.', 'hellocanaryislands.com')], verificar: 'Duración estimada.' })
sitio({ id: 'playa_de_la_garita', name: 'Playa de La Garita', level: 3, zone: 'noreste', dura: 90, type: 'exterior', ver_por: null, libre: true, tags: ['playa', 'sin_socorrista', 'familiar'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/beaches/lanzarote/la-garita/', 'Libre; duchas, aparcamiento y un pequeño restaurante.') },
  extra: { precio: { adulto: 0 } }, avisos: [aviso('sin_socorrista', 'Sin socorrista.', 'hellocanaryislands.com')], verificar: 'Duración estimada.' })
sitio({ id: 'playa_blanca_y_el_faro_de_pechiguera', name: 'Playa Blanca y el Faro de Pechiguera', level: 3, zone: 'sur', dura: 90, type: 'exterior', ver_por: null, libre: true, tags: ['pueblo', 'paseo', 'atardecer', 'faro'],
  horario: { closed_on: [], mercado_marina_rubicon: { dias: 'miércoles y sábados', horario: '09:00-14:00', fuente_tipo: 'no oficial (lanzaroteinformation.co.uk)' }, hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/beaches/lanzarote/playa-blanca/', 'Paseo marítimo libre. La playa (130 m, agua tranquila) no tiene socorrista. El paseo al Faro de Pechiguera, casi todo pavimentado.') },
  extra: { precio: { adulto: 0 }, atardece_al_mar: true }, avisos: [aviso('sin_socorrista', 'La playa de Playa Blanca no tiene socorrista.', 'hellocanaryislands.com')], verificar: 'Distancia a pie al faro y si se puede visitar por dentro: sin confirmar.' })
sitio({ id: 'puerto_del_carmen_puerto_viejo', name: 'Puerto del Carmen (Puerto Viejo)', level: 3, zone: 'sur_centro', dura: 60, type: 'exterior', ver_por: null, libre: true, tags: ['pueblo', 'paseo', 'cena'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/ports-and-marinas/lanzarote/puerto-del-carmen/', 'Puerto viejo (La Tiñosa) con restaurantes junto al muelle. Playa Grande, más de 1 km, con socorristas y aparcamiento.') },
  extra: { precio: { adulto: 0 } }, verificar: 'Duración estimada.' })
sitio({ id: 'volcan_del_cuervo', name: 'Volcán del Cuervo', level: 3, zone: 'centro_oeste', dura: 75, dura_max: 90, type: 'exterior', ver_por: null, libre: true, tags: ['volcan', 'senderismo'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/nature-spaces/lanzarote/volcan-del-cuervo/', 'Sendero de dificultad baja, apto para familias; ~4 km circulares y 1–1,5 h (blog), sin reserva. No hay que llevarse piedras.') },
  extra: { precio: { adulto: 0 }, sin_coche_particular_desde: '2026-11', sin_coche_particular_nota: 'Desde noviembre de 2026, sin coche particular: se aparca en Mancha Blanca y se sube en la guagua del parque (línea P3, aviso del 19-oct).' },
  avisos: [aviso('sin_coche', 'Desde noviembre de 2026 está previsto aparcar en Mancha Blanca (parking de Los Dolores) y subir en guagua (línea P3).', 'Canarias7, 5-oct-2026 / aviso de la web de guaguas')],
  verificar: 'Comprobar si el servicio de guaguas (P3) ya funciona y sus horarios; duración (blog).' })
sitio({ id: 'caldera_blanca', paradaId: 'mancha_blanca', name: 'Caldera Blanca', level: 3, zone: 'centro_oeste', dura: 180, type: 'exterior', ver_por: null, libre: true, tags: ['volcan', 'senderismo'],
  horario: { closed_on: [], hours_audit: auditoria('media', 'https://www.hellocanaryislands.com/paths/lanzarote/caldera-blanca', '~10 km (9,97), ~3 h, dificultad baja (fuente oficial; el blog dice baja-media); sale de la iglesia de Los Dolores, en Mancha Blanca. Sin reserva (blog).') },
  extra: { precio: { adulto: 0 } }, avisos: [aviso('sin_sombra', 'Arriba no hay sombra ni barandilla y hay viento (blog).', '[blog]')], verificar: 'Coordenada: la salida en Mancha Blanca (no hay punto propio). Parking y guagua como el Volcán del Cuervo.' })

// Lo que va solo en la lista de EXPLORAR (no en la ruta)
const lugaresSoloLista = [
  { id: 'charco_del_palo', name: 'Charco del Palo', zone: 'noreste', coordinates: [29.08508, -13.44923], coordinates_fuente: 'DATOS_NATURALEZA_PUEBLOS_COCHE.md (hellocanaryislands)', nudista: true, aviso: 'Zona nudista (la primera comunidad naturista de la isla); tres calas de roca, sin socorrista y con viento. No va en la ruta: solo en EXPLORAR con este aviso.', fuente: 'https://www.hellocanaryislands.com/beaches/lanzarote/charco-del-palo/', comprobado: COMPROBADO },
  { id: 'museo_atlantico', name: 'Museo Atlántico', zone: 'sur', coordinates: null, nota: 'Solo se visita buceando con empresas privadas (no hay web ni taquilla oficial). No es una parada: va en EXPLORAR como actividad.', verificar: 'Coordenadas del punto exacto en el mar sin confirmar.', fuente: 'https://www.divecollegelanzarote.com/en/museo-atlantico/', comprobado: COMPROBADO },
]

// ───────────────────────────── zonas de la isla ─────────────────────────────
const mediaDe = (ids) => {
  const cs = lugares.filter((l) => ids.includes(l.zone) && l.coordinates).map((l) => l.coordinates)
  if (!cs.length) return null
  return [Math.round((cs.reduce((a, c) => a + c[0], 0) / cs.length) * 1e4) / 1e4, Math.round((cs.reduce((a, c) => a + c[1], 0) / cs.length) * 1e4) / 1e4]
}
const NOMBRES_ZONA = { centro: 'Centro', centro_oeste: 'Centro-oeste', centro_norte: 'Centro-norte', norte: 'Norte', extremo_norte: 'Extremo norte', noreste: 'Noreste', noroeste: 'Noroeste', este: 'Este (Arrecife)', sur: 'Sur', sur_centro: 'Sur-centro (Puerto del Carmen)', suroeste: 'Suroeste (Yaiza)' }
const zones = {}
let prioridad = 1
for (const [id, name] of Object.entries(NOMBRES_ZONA)) {
  const places = lugares.filter((l) => l.zone === id).map((l) => l.name)
  zones[id] = { name, center: mediaDe([id]), places, zone_priority: prioridad++ }
}

// ───────────────────────────── el sol de Canarias ─────────────────────────────
const centro = zones.centro.center ?? [29.0, -13.55]
const puestas = []
for (let mes = 1; mes <= 12; mes += 1) {
  const dias = new Date(2027, mes, 0).getDate()
  for (let d = 1; d <= dias; d += 1) puestas.push({ mes, min: sunsetMinutesOn(`2027-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`, centro, ZONA_HORARIA) })
}
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const redondea5 = (m) => Math.round(m / 5) * 5
const sMin = Math.min(...puestas.map((p) => p.min))
const sMax = Math.max(...puestas.map((p) => p.min))
// «El motor los reparte en 4 partes iguales del rango del año» (DIAS_ESCRITOS_FORMATO.md): tres cortes.
const cortes = [1, 2, 3].map((k) => hhmm(redondea5(sMin + ((sMax - sMin) * k) / 4)))
const media = (meses) => {
  const xs = puestas.filter((p) => meses.includes(p.mes)).map((p) => p.min)
  return hhmm(redondea5(xs.reduce((a, b) => a + b, 0) / xs.length))
}
const sunset_by_season = { invierno: media([12, 1, 2]), primavera: media([3, 4, 5]), verano: media([6, 7, 8]), otono: media([9, 10, 11]) }

// ───────────────────────────── lanzarote.json ─────────────────────────────
const zonasAlojamiento = (paradas.zonas_alojamiento?.length ? paradas.zonas_alojamiento : []).map((z) => ({ id: z.id, nombre: z.nombre, coordinates: (() => { const c = latLng(z.coordinates); return c ? { lat: c[0], lng: c[1] } : null })() }))
zonasAlojamiento.push({ id: 'nose', nombre: 'Aún no lo sé' })
const salida = {
  _nota: 'LZ1 (agente B, 3-nov-2026): los datos de Lanzarote, generados por scripts/destino/lanzaroteDatos.mjs desde docs/destinos/lanzarote/ (LANZAROTE_SITIOS.md y los tres DATOS_*.md, consultados el 2-nov-2026) y las paradas del agente C (data/dias/lanzarote/_paradas.json, coordenadas EN EL APARCAMIENTO). Todo lo que las fuentes no confirman va en `verificar`. NO lleva historias, restaurantes, llegada, consejos de fichas, fechas especiales, categorías de EXPLORAR ni textos del pase (son de la LZ2). Lanzarote está OCULTO: solo lo ve el administrador.',
  destination: 'Lanzarote',
  country: 'España',
  timezone: ZONA_HORARIA,
  moneda: 'EUR',
  default_transport: 'car',
  default_free_tour: { name: 'Free Tour por Teguise', duration_minutes: 120, rating: 9.3, rating_max: 10, meeting_point: null, coordinates: null, zone: 'centro_norte', turnos_reserva: null, verificar: 'Días y horas del Free Tour de Teguise por confirmar (agente D, Civitatis). Rating de LANZAROTE_SITIOS.md.' },
  joyas: ['Montañas del Fuego (Timanfaya)', 'Jameos del Agua', 'Fundación César Manrique'],
  _joyas_nota: 'Provisional: una joya por día curado (D1 Timanfaya, D2 Jameos, D3 Fundación). DIAS_CURADOS_LANZAROTE.md nombra como joyas del D1 a Timanfaya, La Geria y El Golfo; del D2 a Jameos, la Cueva y el Mirador del Río; del D3 a la Fundación. Eric decide cuáles son joya y cuáles imprescindible.',
  night_experiences: [],
  closed_on: {},
  meal_zones: {},
  evening_blocks: [],
  zones,
  lugares_solo_lista: lugaresSoloLista,
  places: lugares,
  restaurants: [],
  excursions: {
    civitatis_city: 'lanzarote',
    _nota: 'Solo lo que dice LANZAROTE_SITIOS.md. Los enlaces, precios, notas y cancelación de Civitatis en español los comprueba el agente D en data/dias/lanzarote/_civitatis.json.',
    options: [
      { id: 'la_graciosa', name: 'La Graciosa', tipo: 'ferry_o_excursion', con_coche: { ferry: { naviera: 'Líneas Romero', desde: 'Órzola', duracion_min: '25-30', precio_ida_y_vuelta_eur: 29, precio_nino_eur: 16, salidas_invierno: ['08:30', '10:00', '11:00', '12:00', '13:30', '16:00', '17:00', '18:00'], vueltas_invierno: ['08:00', '08:40', '10:00', '11:00', '12:30', '15:00', '16:00', '17:00'], extra_verano: { ida: ['19:00 (27/03-25/10)', '20:00 (01/07-24/10)'], vuelta: ['18:00 (27/03-25/10)', '19:00 (01/07-24/10)'] }, fuente: 'https://www.lineasromero.com/en/schedules/lanzarote-la-graciosa', comprobado: COMPROBADO, verificar: 'La página de la ruta dice «desde 28 €».' } }, sin_coche: { civitatis: 'Excursión a La Graciosa + paseo en velero', rating: 9.1, rating_max: 10, review_count: 2332, duration_hours: 6, verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' } },
      { id: 'fuerteventura', name: 'Fuerteventura (Corralejo y dunas)', tipo: 'ferry_o_excursion', con_coche: { ferry: { desde: 'Playa Blanca', hasta: 'Corralejo', duracion_min: '25-35', salidas: 'hasta 26 al día' }, aviso: 'El coche de alquiler normalmente no puede subir al ferry (lo prohíben o cobran aparte los contratos de Canarias).' }, sin_coche: { civitatis: 'Excursión a Fuerteventura (Corralejo, El Cotillo y las dunas)', verificar: 'Nota en Civitatis por comprobar (agente D).' } },
      { id: 'isla_de_lobos', name: 'Isla de Lobos', tipo: 'excursion', sin_coche: { civitatis: 'Excursión a Isla de Lobos desde Puerto del Carmen', verificar: 'Nota por comprobar (agente D).' } },
    ],
  },
  destination_config: {
    medio: 'coche',
    tope_coche_dia_min: 180,
    _tope_coche: 'Eric, 2-nov: el tope de coche es de 3 h al día en la prueba, desde el alojamiento más lejano.',
    sin_paseo_nocturno: true,
    cena_cerca_del_alojamiento: true,
    sin_free_tour_ni_eje_free_tour: true,
    size: 'isla',
    core_days: 3,
    max_auto_days: 8,
    llegada: { _nota: 'La llegada al aeropuerto (ACE) es de la LZ2.', aeropuerto: 'aeropuerto_ace' },
    zonas_alojamiento: zonasAlojamiento,
    meses_invierno: [11, 12, 1, 2, 3],
    _meses_invierno: 'En Lanzarote la temporada alta es el invierno.',
    sunset_by_season,
    cortes_luz: cortes,
    _cortes_luz: `Atardeceres de Lanzarote en 2027 (sunset.js, ${ZONA_HORARIA}): de ${hhmm(sMin)} a ${hhmm(sMax)}; tres cortes que reparten ese rango en 4 partes iguales, como DIAS_ESCRITOS_FORMATO.md.`,
    festivos: { _nota: 'Festivos de Canarias y de la isla (DATOS_NATURALEZA_PUEBLOS_COCHE.md, Gobierno de Canarias): para la LZ2 (fechas especiales). 15 de septiembre, Virgen de Los Dolores (festivo insular), y la romería de Mancha Blanca el sábado anterior.', fuente: 'https://www3.gobiernodecanarias.org/noticias/el-gobierno-aprueba-el-calendario-laboral-de-canarias-para-2026/' },
    pistas_de_tierra: { sitios: ['playas_de_papagayo', 'las_grietas_montana_blanca', 'mirador_del_bosquecillo'], aviso: 'Revisa si tu seguro cubre las pistas de tierra' },
    sin_carrito: { no: ['jameos_del_agua', 'cueva_de_los_verdes'], dificil: ['montanas_del_fuego', 'mirador_del_rio'], aviso: 'Mejor mochila portabebés' },
    centros_cact: { abren_365_dias: true, nino_0_6: 'gratis', nino_7_12: 'media entrada', bono_varios_centros: false, nota: 'Ya no hay bono de varios centros (los blogs que lo anuncian están desfasados). Las entradas sin hora valen 3 meses.', fuente: 'https://cactlanzarote.com/en/preguntas-frecuentes-cact-lanzarote' },
  },
  cerca_de_mi: {
    tipos: ['gasolineras', 'aparcamientos'],
    _nota: 'En todos los destinos «Cerca de mí» es del pase. En Lanzarote lleva gasolineras y aparcamientos EN LUGAR de baños y fuentes. Datos de OpenStreetMap (ODbL), descargados con scripts/destino/gasolinerasLanzarote.mjs.',
    gasolineras: 'data/pipeline_v2/gasolineras/lanzarote.json',
    aparcamientos: 'data/pipeline_v2/aparcamientos/lanzarote.json',
    pocas_en_el_norte: 'En el municipio de Haría figuran solo dos (Haría pueblo y Arrieta); en Órzola, sin confirmar: repostar antes de subir al norte.',
  },
  tiempos_en_coche: 'data/pipeline_v2/travel/lanzarote_coche.json',
}
// LZ2b-1: las fichas de Eric (por_que_recomendamos, description y el texto de «Dónde aparcar»); lo demás de la ficha va en detalle/lanzarote/ (pasarFichasLanzarote.mjs).
{
  const fichas = JSON.parse(readFileSync('docs/destinos/lanzarote/FICHAS_LANZAROTE.json', 'utf8'))
  for (const p of salida.places) {
    const f = fichas[p.id]
    if (!f) continue
    p.por_que_recomendamos = f.por_que_recomendamos
    p.description = f.description
    p.aparcar = f.aparcar
    p.aparcar_verificar = f.aparcar_verificar === true
  }
  // Las filas de un día con su propio nombre (Haría / Casa-Museo, Playa Blanca / Faro, Famara) encuentran la ficha de su sitio (alias ya normalizados: sin tildes ni mayúsculas).
  const normaliza = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const ALIAS = {
    haria_y_la_casa_museo_cesar_manrique: ['Haría y el Valle de las Mil Palmeras', 'Casa-Museo César Manrique (Haría)'],
    playa_blanca_y_el_faro_de_pechiguera: ['El paseo marítimo de Playa Blanca', 'Faro de Pechiguera'],
    caleta_de_famara_y_playa_de_famara: ['El atardecer en Famara'],
  }
  for (const p of salida.places) if (ALIAS[p.id]) p.search_aliases = ALIAS[p.id].map(normaliza)
}
mkdirSync('data/pipeline_v2', { recursive: true })
writeFileSync('data/pipeline_v2/lanzarote.json', `${JSON.stringify(salida, null, 1)}\n`)

// ───────────────────────────── data/dias/lanzarote/ ─────────────────────────────
mkdirSync('data/dias/lanzarote', { recursive: true })
const NOMBRE = new Map(lugares.map((l) => [l.id, l.name]))
const n = (id) => {
  if (!NOMBRE.has(id)) throw new Error(`día: sitio desconocido ${id}`)
  return NOMBRE.get(id)
}
const parada = (id, min, extra = {}) => ({ tipo: 'parada', lugar: n(id), modo: extra.modo ?? null, doc: extra.doc ?? `${n(id)}${min ? ` ~${min >= 60 && min % 60 === 0 ? `${min / 60} h` : min >= 60 ? `${Math.floor(min / 60)} h ${min % 60}` : min}` : ''}`, ...(min ? { min } : {}), ...extra.resto })
const turno = (id, min, hora, nota) => ({ tipo: 'parada', lugar: n(id), modo: 'dentro', doc: `🎟 ${n(id)} ~${min} min (turno de las ${hora})`, min, hora_tipo: 'turno', hora, hora_aprox: true, notas: [nota], llegada_antes_min: 15 })
const comida = (zona, hora, doc) => ({ restaurante: null, alternativa: null, zona, hora_aprox: hora, doc, restaurantes_pendientes: 'LZ2 (RESTAURANTES_LANZAROTE.md)' })
const cena = (zona, doc) => ({ restaurante: null, alternativa: null, zona, doc, restaurantes_pendientes: 'LZ2 (RESTAURANTES_LANZAROTE.md)' })
const v = (id, cuando, doc, extra = {}) => ({ id, cuando, doc, ops: null, pendiente_motor: true, ...extra })
const lista = (id, nombre, joyas, cuerpo) => ({ id, nombre, titulo_documento: `${nombre} · ${id}`, joyas, coche: true, ...cuerpo })

const dias = {
  D1: lista('D1', 'Fuego y mar: el sur volcánico', ['Montañas del Fuego (Timanfaya)', 'La Geria y sus bodegas', 'El Golfo y el Charco de los Clicos'], {
    partes: { unica: {
      manana: [
        turno('montanas_del_fuego', 90, '09:00', 'Reserva online con día y hora; abre a las 09:00 todos los días (9:00-16:00 desde el 1-jul-2023, último turno 15:45). Islote de Hilario y la Ruta de los Volcanes en el autobús del parque.'),
        { ...parada('la_geria_y_sus_bodegas', 60, { modo: 'fuera', doc: 'La Geria: la carretera de los viñedos (LZ-30), con parada en un mirador de los hoyos de viña y una parada corta en una bodega (Stratvs, todos los días; El Grifo, de lunes a viernes) ~1 h' }), bebida_aviso: 'Quien conduce, sin alcohol', min_fuente: 'LANZAROTE_SITIOS.md (45-60 min)' },
      ],
      comida: comida('en La Geria', '13:15', 'En La Geria, hacia las 13:15 (domingo: fuera de Bodega La Geria, que cierra a las 14:00 ⚠️)'),
      tarde: [
        parada('salinas_de_janubio', 20, { doc: 'Salinas de Janubio, desde el mirador ~20 min' }),
        { ...parada('playa_de_montana_bermeja', 15, { doc: '(opcional) Playa de Montaña Bermeja, la arena negra bajo la montaña roja ~15 min' }), opcional: true },
        parada('los_hervideros', 30, { doc: 'Los Hervideros, la costa de lava ~30 min' }),
        { ...parada('el_golfo_y_el_charco_de_los_clicos', null, { doc: 'El Golfo y el Charco de los Clicos: la laguna verde desde el mirador y el pueblo, hasta el atardecer' }), hasta_atardecer: true, tiempo_de_playa: true },
      ],
      cena: cena('en El Golfo, después del atardecer (en verano, antes del atardecer o cerca del alojamiento)', 'En El Golfo, después del atardecer. Solo en invierno: los restaurantes de El Golfo cierran entre las 20:00 y las 21:00; en verano (atardecer ~20:55) se cena antes del atardecer en El Golfo o cerca del alojamiento'),
    } },
    coche_doc: '~2 h desde Puerto del Carmen o Playa Blanca; ~2 h 35 desde Costa Teguise ⚠️ (Islote → Stratvs ~25 min ⚠️; Yaiza → Janubio → Los Hervideros → El Golfo, ~35 min seguidos, La Voz). Las cifras de Mapbox, en INFORME_DIAS_MAPBOX.md (agente C).',
    orden_del_sur: 'La Geria → Yaiza → Janubio → Los Hervideros → El Golfo, en una sola pasada (REVISION_BORRADOR_1.md).',
    variantes: [
      v('tranquilo', { ritmo: 'tranquilo' }, 'Timanfaya a las 11:00 y comida en el Restaurante El Diablo, en el mismo Islote (12:00-16:00, sin reserva ⚠️ si se puede sin entrada); La Geria por la tarde, con su mirador, camino de la costa.'),
      v('verano', { temporada: 'verano' }, 'Atardecer ~20:30-20:55: el tiempo libre se queda en El Golfo o en la playa de Janubio. (Playa, si el viaje no lleva el D4: después de comer, Papagayo ⚠️ 9:00-19:00 y luego Janubio → Los Hervideros → El Golfo con el atardecer.)'),
      v('vino', { experiencia: 'vino' }, 'La visita guiada de Stratvs a las 12:00 (60 min, 3 vinos y queso, 25 €); comida: Bodega de Uga, de martes a sábado.'),
      v('volcanes', { experiencia: 'volcanes' }, 'Timanfaya → Volcán del Cuervo (sendero fácil ~1-1,5 h ⚠️; desde noviembre de 2026, sin coche particular: se aparca en Mancha Blanca y se sube en la guagua del parque ⚠️ comprobar si ya funciona) → por la LZ-56, Masdache y La Geria, con su mirador → comida en La Geria. La Geria no se pierde.'),
      v('domingo', { dia_semana: 'domingo' }, 'Comida en Bodegas Rubicón (abre todos los días): Bodega La Geria cierra a las 14:00 ⚠️ y El Grifo no abre.'),
    ],
    sin_coche: { excursion: 'Excursión al Timanfaya, La Geria y el Charco de los Clicos (Civitatis, con recogida; 8,1, 281 opiniones)', deja_fuera: 'No pasa por Los Hervideros ni Janubio. Hace Timanfaya, una bodega y El Golfo.', verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' },
    inicio: { turno_obligatorio: 'montanas_del_fuego' },
  }),
  D2: lista('D2', 'El norte de Manrique', ['Jameos del Agua', 'Cueva de los Verdes', 'Mirador del Río'], {
    nota_dia: 'El día más rígido: la Cueva va con hora. Nunca el último día.',
    partes: { unica: {
      manana: [
        { ...parada('jameos_del_agua', 60, { modo: 'dentro', doc: 'Jameos del Agua, a la apertura (10:00), antes de los autobuses ~1 h' }), hora: '10:00', hora_tipo: 'apertura', notas: ['Sin carrito: mochila portabebés'] },
        turno('cueva_de_los_verdes', 50, '11:30', 'Turno de hacia las 11:30 ⚠️ (a 5 min de Jameos). Sin carrito.'),
        { ...parada('mirador_del_rio', 45, { modo: 'dentro', doc: 'Mirador del Río (~20 min con curvas) ~45 min' }), notas: ['Si hay nubes, apenas se ve; alternativa gratuita: Mirador de Guinate'], alternativa: n('mirador_de_guinate') },
      ],
      comida: comida('en Haría (~15 min del Mirador)', '13:45', 'En Haría (~15 min), hacia las 13:45 (sábado: también el Mercado Municipal, con reserva por WhatsApp)'),
      tarde: [
        { ...parada('haria_y_la_casa_museo_cesar_manrique', 60, { doc: 'Haría y el Valle de las Mil Palmeras: el pueblo y su plaza' }), titulo: 'Haría y el Valle de las Mil Palmeras' },
        { ...parada('haria_y_la_casa_museo_cesar_manrique', 60, { modo: 'dentro', doc: 'Casa-Museo César Manrique (Haría), taquilla hasta las 17:00 (para quien no tenga Arte, opcional) ~1 h' }), titulo: 'Casa-Museo César Manrique (Haría)', a_pie_min: 5, opcional_sin_experiencia: 'arte', taquilla_hasta: '17:00' },
        parada('mirador_de_los_helechos', 15, { doc: 'Mirador de los Helechos, la vista del valle, saliendo hacia Teguise ~15 min' }),
      ],
      cena: cena('cerca del alojamiento', 'Cerca de tu alojamiento (los restaurantes de cada zona, en RESTAURANTES_LANZAROTE.md)'),
    } },
    coche_doc: '~2 h-2 h 15 desde Puerto del Carmen o Costa Teguise; ~2 h 35 desde Playa Blanca (Playa Blanca → Jameos 55 min, rome2rio). Las cifras de Mapbox, en INFORME_DIAS_MAPBOX.md (agente C).',
    variantes: [
      v('al_reves', { opcion: 'cueva_primero' }, 'Al revés: Cueva a las 09:30 (su apertura) → Jameos a las 10:40.'),
      v('playa_o_verano_manana', { experiencia: 'playa_y_calma', o_temporada: 'verano' }, 'Caletón Blanco (junto a Órzola) con la marea bajando, de 9:00 a 12:00, antes de Jameos: entonces Jameos a las 12:00 y la Cueva por la tarde ⚠️ (comprobar que cabe).', { sitio_extra: 'caleton_blanco' }),
      v('verano', { temporada: 'verano' }, 'Después de la Casa-Museo, bajar a Arrieta: La Garita o las piscinas de Punta Mujeres (mejor a media marea; sin socorrista) y cena en Arrieta (marisquerías del espigón). Sin los Helechos.', { sitios_extra: ['playa_de_la_garita', 'punta_mujeres_y_arrieta'] }),
      v('sabado', { dia_semana: 'sábado' }, 'Mercado de artesanía de Haría (9:00-14:30): Jameos 10:00 → Cueva 11:30 → Haría hacia las 12:35, mercado y comida → Casa-Museo hasta las ~15:50 → Mirador del Río hacia las 16:10 (última entrada 16:40, justo). Sin los Helechos. Coche desde Playa Blanca: ~2 h 40.'),
      v('viernes_noches_de_jameos', { dia_semana: 'viernes', opcional: true }, 'Noches de Jameos: visita al atardecer, cena (18:30-20:30) y concierto junto al lago (22:30-23:15). Menú de adulto 98 € (vegano 88 €, niños 49 €), con reserva. Ese día: Cueva por la mañana → Mirador del Río → comida y Casa-Museo en Haría → Jameos a las 18:30. Hay 2 h entre la cena y el concierto y luego se conduce de noche (quien conduce, sin alcohol). Los viernes 25-dic, 1-ene y Viernes Santo, sin confirmar ⚠️.'),
      v('1_enero', { fecha: '01-01' }, 'La Casa-Museo de Haría cierra: el pueblo y el Mirador de los Helechos.'),
      v('dos_dias', { dias_del_viaje: 2 }, 'Como no hay D3, este día lleva la Fundación César Manrique (imprescindible): comida en Haría, sin la Casa-Museo, y por la LZ-1 a Tahíche (~25 min ⚠️) para entrar hacia las 16:00 (taquilla hasta las 17:00).', { sitio_extra: 'fundacion_cesar_manrique' }),
    ],
    sin_coche: { excursion: 'Tour por lo mejor de Lanzarote con entradas (Civitatis, 8,2, 2.971 opiniones)', deja_fuera: 'Hace la Cueva y Jameos (y Timanfaya); no lleva el Mirador del Río ni Haría.', verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' },
    no_ultimo_dia: true,
  }),
  D3: lista('D3', 'Manrique en casa: Tahíche, Teguise y Arrecife', ['Fundación César Manrique'], {
    partes: { unica: {
      manana: [
        { ...parada('fundacion_cesar_manrique', 90, { modo: 'dentro', doc: 'Fundación César Manrique, a la apertura (10:00): los días de crucero (martes y miércoles) se llena desde las 11:00 ~1 h 30' }), hora: '10:00', hora_tipo: 'apertura' },
        parada('jardin_de_cactus', 60, { modo: 'dentro', doc: 'Jardín de Cactus (Guatiza, ~15 min ⚠️) ~1 h' }),
      ],
      comida: comida('en Teguise', '13:00', 'En Teguise, hacia las 13:00 (reservar en domingo)'),
      tarde: [
        parada('teguise', 60, { doc: 'Teguise, la antigua capital: el casco, la iglesia de Guadalupe y el Palacio Spínola por fuera (⚠️ horario)' }),
        { ...parada('castillo_de_santa_barbara', 30, { modo: 'fuera', doc: '(opcional) Castillo de Santa Bárbara, por fuera: las vistas desde el volcán Guanapay (el museo ya no existe)' }), opcional: true, solo_por_fuera: true },
        { ...parada('ciudad_estratificada_rofera_de_teseguite', 25, { doc: '(opcional) Ciudad Estratificada (Rofera de Teseguite), las formaciones de toba junto a Teguise (20-30 min). Sin subirse: son frágiles' }), opcional: true },
        parada('casa_museo_del_campesino', 50, { modo: 'dentro', doc: 'Casa-Museo del Campesino (Mozaga, 7 min; gratis, hasta las 18:00) ~50 min' }),
        { ...parada('las_grietas_montana_blanca', 40, { doc: '(opcional) Las Grietas, en la LZ-35 a pocos minutos del Campesino: los cañones de lava (30-45 min ⚠️). Sin aparcamiento oficial, no con lluvia ni viento, solo de día' }), opcional: true },
        { ...parada('arrecife_charco_de_san_gines_y_el_paseo', 60, { doc: 'Arrecife, al caer la tarde: el Charco de San Ginés con sus luces y el paseo' }), al_caer_la_tarde: true, nota_sol: 'Arrecife mira al este: el sol no se pone sobre el mar.' },
      ],
      cena: cena('en Arrecife', 'En Arrecife: restaurante del Castillo de San José (de miércoles a sábado por la noche; no hace falta entrada al museo) o en el Charco; o cerca del alojamiento'),
    } },
    coche_doc: '~1 h 15 desde Costa Teguise o Arrecife; ~2 h 15 desde Playa Blanca. Las cifras de Mapbox, en INFORME_DIAS_MAPBOX.md (agente C).',
    cambia_en_domingo: true,
    variantes: [
      v('arte', { experiencia: 'arte' }, 'Sin el Castillo de Santa Bárbara. Teguise hasta las 15:30 → LagOmar (Nazaret, ⚠️ hasta las 18:00) 15:40-16:40 → Campesino → Arrecife.', { sitio_extra: 'lagomar' }),
      v('domingo', { dia_semana: 'domingo' }, 'Mercadillo de Teguise (9:00-14:00). Teguise a las 10:00 (antes del gentío de las 11:00; ⚠️ aparcamiento) y comida allí → Jardín de Cactus 14:30 (última entrada 16:30) → Fundación 15:45 (taquilla hasta las 17:00) → Arrecife. Sin el Campesino (queda en EXPLORAR).'),
      v('1_enero', { fecha: '01-01' }, 'La Fundación cierra: LagOmar en su lugar ⚠️ (comprobar que abre ese día).', { sitio_extra: 'lagomar' }),
      v('verano', { temporada: 'verano' }, 'Antes del Charco, tiempo de playa en el Reducto (mejor con marea alta).'),
      v('free_tour', { free_tour: true }, 'El Free Tour de Teguise (2 h, 9,3/10) puede sustituir a la visita por libre ⚠️ (días y horas por confirmar).'),
    ],
    sin_coche: { excursion: 'Tour de César Manrique por Lanzarote (Civitatis)', deja_fuera: 'Hace la Fundación, el Jardín de Cactus y el Campesino (y además el Mirador del Río y Jameos); no lleva Teguise ni Arrecife.', verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' },
  }),
  D4: lista('D4', 'Papagayo y Playa Blanca', [], {
    nota_dia: 'El día de playa. De los que se añaden.',
    partes: { unica: {
      manana: [{ ...parada('playas_de_papagayo', null, { doc: 'Playas de Papagayo: pista de tierra, despacio (~15-20 min ⚠️), 3 € por coche (lleva tarjeta por si acaso). Playa Mujeres o Papagayo. Sin socorrista. Toda la mañana' }), tiempo_de_playa: true, aviso_pista: true }],
      comida: comida('en Marina Rubicón o Playa Blanca', '14:00', 'En Marina Rubicón o Playa Blanca, hacia las 14:00'),
      tarde: [
        { ...parada('playa_blanca_y_el_faro_de_pechiguera', 45, { doc: 'El paseo marítimo de Playa Blanca' }), titulo: 'El paseo marítimo de Playa Blanca' },
        { ...parada('playa_blanca_y_el_faro_de_pechiguera', 45, { doc: 'Faro de Pechiguera, al atardecer' }), titulo: 'Faro de Pechiguera', parada: 'faro_de_pechiguera', hasta_atardecer: true },
      ],
      cena: cena('en Marina Rubicón', 'En Marina Rubicón (o cerca del alojamiento)'),
    } },
    coche_doc: '~1 h 40 desde Puerto del Carmen; ~2 h 20 desde Costa Teguise. Las cifras de Mapbox, en INFORME_DIAS_MAPBOX.md (agente C).',
    variantes: [
      v('verano', { temporada: 'verano' }, 'Después de comer, un segundo rato de playa (la de Playa Blanca, de agua tranquila, o volver a Papagayo hasta las 19:00) y luego el paseo y el faro.'),
      v('invierno', { temporada: 'invierno' }, 'La playa, más corta; el paseo y el faro, con más calma.'),
      v('kayak_snorkel', { opcion: 'kayak_y_snorkel' }, 'Kayak y snorkel en Papagayo (Civitatis, 9:45-14:00, 9,5/10; se queda en Playa Blanca, sin recogida) en lugar de la playa por libre.'),
    ],
    sin_coche: { excursion: 'El yate a las playas de Papagayo (Civitatis, con recogida salvo en Playa Blanca los lunes)', deja_fuera: null, verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' },
    entra_si: { experiencia: 'playa_y_calma', antes_que: 'DG' },
  }),
  D5: lista('D5', 'Volcanes y Famara', [], {
    nota_dia: 'Para viajes de 6 días o más (o antes, con Volcanes).',
    partes: { unica: {
      manana: [
        { ...parada('volcan_del_cuervo', 75, { doc: 'Volcán del Cuervo, temprano (no hay sombra): el sendero fácil por dentro de un cráter ~1-1,5 h ⚠️. Desde noviembre de 2026, se aparca en Mancha Blanca y se sube en la guagua del parque ⚠️ (comprobar horarios)' }), temprano: true },
        { ...parada('ermita_de_las_nieves', 20, { doc: '(opcional) Ermita de las Nieves, sobre el Risco de Famara (con niebla no se ve)' }), opcional: true, alternativa: n('mirador_del_bosquecillo') },
      ],
      comida: comida('en Caleta de Famara', '13:30', 'En Caleta de Famara, hacia las 13:30'),
      tarde: [
        parada('caleta_de_famara_y_playa_de_famara', 90, { doc: 'Caleta de Famara, las calles de arena y el surf; Playa de Famara: el paseo por la arena (no es de baño: bandera roja todo el año)' }),
        { ...parada('caleta_de_famara_y_playa_de_famara', null, { doc: 'El atardecer en Famara' }), titulo: 'El atardecer en Famara', a_pie_min: 12, hasta_atardecer: true },
      ],
      cena: cena('en Caleta de Famara', 'En Caleta de Famara (o cerca del alojamiento)'),
    } },
    coche_doc: '~1 h 45 desde Playa Blanca; ~2 h 10 con la Ermita. Las cifras de Mapbox, en INFORME_DIAS_MAPBOX.md (agente C).',
    variantes: [
      v('volcanes', { experiencia: 'volcanes' }, 'Caldera Blanca, ~10 km y 3 h, desde Mancha Blanca (en lugar del Volcán del Cuervo).', { sitio_extra: 'caldera_blanca' }),
      v('verano', { temporada: 'verano' }, 'Es un día corto (más de 4 h hasta el atardecer). Después de comer, quien quiera bañarse: La Garita (Arrieta), ~25 min ⚠️, y vuelta al atardecer de Famara (o quedarse allí y cenar en Arrieta).', { sitio_extra: 'playa_de_la_garita' }),
      v('tranquilo', { ritmo: 'tranquilo' }, 'Sin la Ermita.'),
    ],
    sin_coche: { excursion: null, deja_fuera: 'No hay excursión que lo haga: el día se queda para quien lleva coche.' },
  }),
  DG: lista('DG', 'La Graciosa (excursión)', [], {
    tipo_dia: 'excursion',
    partes: { unica: {
      manana: [
        { tipo: 'traslado', como: 'coche', texto: 'A Órzola (pocas gasolineras en el norte: repostar antes). Salida desde Playa Blanca hacia las 08:30 (1 h 01, rome2rio); desde Puerto del Carmen, 43 min.', doc: 'Coche hasta Órzola' },
        { tipo: 'traslado', como: 'ferry', texto: 'Ferry de las 10:00 (Líneas Romero, 25-30 min, 29 € ida y vuelta)', doc: 'Ferry a La Graciosa', hora: '10:00' },
      ],
      comida: comida('en Caleta de Sebo', null, 'En Caleta de Sebo'),
      tarde: [{ tipo: 'parada', lugar: 'La Laja o El Salado', modo: null, doc: 'Tiempo de playa: La Laja o El Salado, junto al pueblo', tiempo_de_playa: true }],
      cena: null,
    } },
    en_la_isla: 'No hay carreteras. Bici o taxi 4x4 hasta la Playa de La Francesa y la Montaña Amarilla.',
    vuelta: { ultima_todo_el_ano: '17:00', verano_27_mar_25_oct: '18:00', verano_1_jul_24_oct: '19:00', aviso: 'No te quedes sin barco: mira a qué hora sale la última ese día. El billete vale cualquier día y hora durante un año ⚠️.' },
    coche_doc: '~1 h 25 desde Puerto del Carmen; ~2 h desde Playa Blanca.',
    variantes: [v('caleton_blanco', { opcion: 'antes_del_ferry' }, 'Antes del ferry (si se coge uno más tarde) o otro día de mañana: Caletón Blanco, a 1,2 km del puerto de Órzola (mejor con marea bajando, por la mañana).', { sitio_extra: 'caleton_blanco' })],
    sin_coche: { excursion: 'Excursión a La Graciosa + paseo en velero (Civitatis, 9,1/10, 2.332 opiniones, con recogida)', deja_fuera: null, verificar: 'Datos de LANZAROTE_SITIOS.md; enlace en español sin abrir (agente D).' },
  }),
  DF: lista('DF', 'Fuerteventura (excursión, 7 días)', [], {
    tipo_dia: 'excursion',
    partes: { unica: { manana: [], comida: null, tarde: [], cena: null } },
    doc: 'Ferry de Playa Blanca a Corralejo (25-35 min) a pie, o la excursión de Civitatis (Corralejo, El Cotillo y las dunas). El coche de alquiler, normalmente no puede subir al ferry (lo prohíben o cobran aparte los contratos de Canarias ⚠️): el aviso lo dice.',
    variantes: [],
    sin_coche: { excursion: 'Excursión de Civitatis a Fuerteventura (Corralejo, El Cotillo y las dunas)', deja_fuera: null, verificar: 'Nota en Civitatis por comprobar (agente D).' },
    verificar: 'DIAS_CURADOS_LANZAROTE.md no detalla paradas de este día.',
  }),
}

const reparto = {
  _nota: 'Qué días van según la duración (DIAS_CURADOS_LANZAROTE.md, apartado 3). Solo datos: el motor aún no los lee.',
  por_dias: { 2: ['D1', 'D2'], 3: ['D1', 'D2', 'D3'], 4: ['D1', 'D2', 'D3', 'DG'], 5: ['D1', 'D2', 'D3', 'DG', 'D4'], 6: ['D1', 'D2', 'D3', 'DG', 'D4', 'D5'], 7: ['D1', 'D2', 'D3', 'DG', 'D4', 'D5', 'DF'] },
  desde_8: 'días en blanco con sugerencias de playa',
  experiencias: { playa_y_calma: { 4: ['D1', 'D2', 'D3', 'D4'] }, volcanes: { 6: ['D1', 'D2', 'D3', 'DG', 'D5', 'D4'] } },
  prioridades: ['los cierres (1 de enero) y la romería de Los Dolores (el sábado antes del 15 de septiembre: ese sábado no va el D1 ni el Volcán del Cuervo)', 'el día 1 es el D1 (Timanfaya), siempre', 'el domingo es del D3 si no es el día 1', 'el sábado, el D2 (si no es el día 1 ni el último; el D2 nunca el último día)', 'el viernes, si cae el D2, puede llevar las Noches de Jameos (opcional)', 'el día que se recorta es el último de la tabla'],
}
const listas = {
  formato: 'listas',
  fuente: 'docs/destinos/lanzarote/DIAS_CURADOS_LANZAROTE.md (borrador 2, 2-nov-2026)',
  generado: 'scripts/destino/lanzaroteDatos.mjs',
  destino: 'lanzarote',
  _nota: 'LZ1 (agente B): los días SOLO como datos, tal cual el documento (no se cambian ni se inventan). Los textos de restaurantes, historias y llegada son de la LZ2 y van vacíos; las variantes llevan `ops: null` (el motor las leerá en la LZ2). Las horas son orientativas (para comprobar que el día cabe).',
  dias,
  reparto,
  llegadas: null,
}
writeFileSync('data/dias/lanzarote/listas.json', `${JSON.stringify(listas, null, 1)}\n`)

const destinoDias = {
  _nota: 'LZ1 (agente B): lo que el motor necesita del destino además de listas.json. Entradas con hora SOLO online (Timanfaya, Cueva de los Verdes): «Llegada a…» 15 min antes (LANZAROTE_PARA_CODE.md, punto 8). Los cortes de luz salen de sunset.js para Lanzarote (ver destination_config.cortes_luz en lanzarote.json).',
  llegadas: {
    turno: { min: 15, texto: 'Llegas 15 minutos antes de tu hora: la web oficial lo pide (si llegas tarde, no te aseguran la entrada).' },
    por_lugar: {
      'Montañas del Fuego (Timanfaya)': 'Llegada al aparcamiento del Islote de Hilario: 15 minutos antes de tu hora. La entrada se compra solo por internet, con día y hora, y se agota en temporada alta.',
      'Cueva de los Verdes': 'Llegada a la cueva: 15 minutos antes de tu hora. La entrada se compra solo por internet, con día y hora, y no se puede cambiar.',
    },
  },
  timezone: ZONA_HORARIA,
}
writeFileSync('data/dias/lanzarote/_destino.json', `${JSON.stringify({ ...destinoDias, cortes_luz: cortes }, null, 1)}\n`)

const mapa = { _nota: 'Dónde pone la primera pantalla el pin de Lanzarote. La portada (foto) la pone el agente D desde _fotos.json (LZ1); hasta entonces, sin portada. Lanzarote está oculto: solo lo ve el administrador.', lat: 29.0469, lng: -13.59, iso: 'es', portada: null, portada_pequena: null }
if (existsSync('data/dias/lanzarote/_mapa.json')) {
  // No pisar la portada si D ya la ha puesto.
  const anterior = JSON.parse(readFileSync('data/dias/lanzarote/_mapa.json', 'utf8'))
  if (anterior.portada) { mapa.portada = anterior.portada; mapa.portada_pequena = anterior.portada_pequena ?? anterior.portada }
}
writeFileSync('data/dias/lanzarote/_mapa.json', `${JSON.stringify(mapa, null, 1)}\n`)

const entradas = { _que_es: 'Las entradas oficiales que se pueden comprar de cada sitio (como data/dias/roma/_entradas.json). Precios del 2-nov-2026 (CACT y fcmanrique.org). Las de Timanfaya y la Cueva SOLO se venden online con día y hora.', lugares: {} }
const ent = (nombre, incluye, desde, url) => ({ nombre, incluye, desde, url })
entradas.lugares['Montañas del Fuego (Timanfaya)'] = [ent('Entrada con día y hora', 'Islote de Hilario y Ruta de los Volcanes en el autobús del parque. Solo online.', 30, 'https://ventaonline.cactlanzarote.com/en/product/17')]
entradas.lugares['Jameos del Agua'] = [ent('Jameos del Agua', 'Entrada sin hora (vale 3 meses).', 17, 'https://ventaonline.cactlanzarote.com/en/tickets/jameos-del-agua-ticket'), ent('Jameos del Agua + Casa de los Volcanes', 'Entrada combinada.', 22.4, 'https://ventaonline.cactlanzarote.com/en/tickets/jameos-del-agua-ticket'), ent('Noches de Jameos (viernes)', 'Cena y concierto; menú adulto.', 98, 'https://cactlanzarote.com/en/tickets/jameos-noche')]
entradas.lugares['Cueva de los Verdes'] = [ent('Entrada con día y hora', 'Visita guiada de ~50 min. Solo online.', 17, 'https://ventaonline.cactlanzarote.com/en/tickets/cueva-de-los-verdes-ticket')]
entradas.lugares['Mirador del Río'] = [ent('Mirador del Río', 'Entrada sin hora (vale 3 meses).', 9, 'https://ventaonline.cactlanzarote.com/en/tickets/mirador-del-rio-ticket')]
entradas.lugares['Jardín de Cactus'] = [ent('Jardín de Cactus', 'Entrada sin hora (vale 3 meses).', 9, 'https://ventaonline.cactlanzarote.com/en/tickets/jardin-de-cactus-ticket')]
entradas.lugares['Castillo de San José (MIAC)'] = [ent('Castillo de San José (MIAC)', 'Entrada sin hora (vale 3 meses).', 5.4, 'https://ventaonline.cactlanzarote.com/en/tickets/international-museum-contemporary-art-castillo-de-san-jose-ticket')]
entradas.lugares['Fundación César Manrique'] = [ent('Fundación César Manrique', 'Entrada de taquilla u online.', 10, null), ent('Fundación + Casa-Museo de Haría', 'Entrada conjunta.', 17, null)]
entradas.lugares['Haría y la Casa-Museo César Manrique'] = [ent('Casa-Museo César Manrique (Haría)', 'Entrada de la casa; el pueblo es libre.', 10, null), ent('Fundación + Casa-Museo de Haría', 'Entrada conjunta.', 17, null)]
entradas.lugares['La Geria y sus bodegas'] = [ent('El Grifo «a tu aire»', 'Museo del vino, bodega de 1775 y 2 vinos (~45 min).', 15, 'https://elgrifo.com/tienda/gb/visits/118-guided-tour-of-el-grifo-winery.html'), ent('Stratvs, visita guiada', '3 vinos y quesos (~60 min).', 25, 'https://stratvs.com/en/visitas-agenda/')]
entradas.lugares['Playas de Papagayo'] = [ent('Acceso con coche (por coche)', 'Pista de tierra; 3 € por coche para no residentes.', 3, null)]
writeFileSync('data/dias/lanzarote/_entradas.json', `${JSON.stringify(entradas, null, 1)}\n`)

console.log(`lanzarote.json: ${lugares.length} sitios, ${Object.keys(zones).length} zonas; sin coordenadas: ${lugares.filter((l) => !l.coordinates).map((l) => l.id).join(', ') || 'ninguno'}`)
console.log(`días: ${Object.keys(dias).join(', ')}; cortes de luz ${cortes.join(' / ')}; sol ${hhmm(sMin)}-${hhmm(sMax)}; por estación ${JSON.stringify(sunset_by_season)}`)
