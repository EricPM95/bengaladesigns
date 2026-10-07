// Lo que DIAS_ROMA_PARADAS.md cuenta en prosa (cierres de un día de la semana, pool, experiencias, Free Tour, reservas a otra hora, plan de lluvia) escrito como datos.
// Cada variante, extra del pool o experiencia CITA (`doc`) la frase del documento de la que sale: el convertidor comprueba que sigue en el documento.
// Lo que el documento no dice con claridad NO se inventa aquí: está en PREGUNTAS_TANDA6.md.
//
// Lenguaje: `cuando` (listasDia.js › cumple) y `ops` por franja: { manana | tarde: { paradas, quitar, cambiar, mover, insertar, ajustar }, comida, cena, noche, empieza }.
import fs from 'node:fs'

const nombres = JSON.parse(fs.readFileSync('scripts/destino/listasNombres.json', 'utf8'))
const D = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))

/** Una parada: P('Nombre del documento', minutos, modo, { extras }). El nombre se resuelve como en el convertidor (alias de listasNombres.json o nombre de roma.json). */
const P = (nombre, min, modo = null, extra = {}) => {
  const alias = nombres[nombre]
  const lugar = alias?.lugar ?? nombre
  if (!D.places.some((place) => place.name === lugar) && !['Free Tour Centro Histórico', 'Desayuno romano'].includes(lugar)) throw new Error(`listasVariantes: «${nombre}» no está en roma.json`)
  return { tipo: lugar === 'Free Tour Centro Histórico' ? 'tour' : 'parada', lugar, ...(alias?.titulo ? { titulo: alias.titulo } : {}), ...(alias?.foto ? { foto: alias.foto } : {}), ...(alias?.ignora_temporada ? { ignora_temporada: true } : {}), min, modo, ...extra }
}
// Paradas con nombre (Tanda 6f, 4j): en Roma, estos sitios dejan de ser «de camino»: son paradas de ~10 min (salvo lo que diga el documento).
const PARADAS_CON_NOMBRE = new Set(JSON.parse(fs.readFileSync('data/dias/roma/_destino.json', 'utf8')).paradas_con_nombre ?? [])
const camino = (...lista) => lista.map((nombre) => (PARADAS_CON_NOMBRE.has((nombres[nombre]?.lugar ?? nombre)) ? P(nombre, 10) : P(nombre, 5, 'camino')))
const taxi = (texto = 'Taxi') => ({ tipo: 'traslado', como: 'taxi', texto })
const mesa = (restaurante, alternativa, zona, tercera = null) => ({ restaurante, alternativa, ...(tercera ? { tercera } : {}), zona })
/** La capa de una experiencia de temporada (su título y su texto, del propio lugar): «Piazza Navona y su mercadillo navideño». */
const capa = (nombreCapa) => {
  const place = D.places.find((p) => p.name === nombreCapa)
  return { titulo: place.titulo_parada ?? place.name, texto: place.texto_parada ?? undefined }
}
// El Foro Romano tiene dos lados: el del Arco de Constantino (junto al Coliseo) y el de Via dei Fori Imperiali. El documento dice por cuál se entra y por cuál se sale.
const FORO_LADO_ARCO = [41.8895, 12.489]
const FORO_LADO_FORI = [41.8938, 12.4857]
const NAVIDAD = '12-08..01-06'
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const lluvia = (...entradas) => entradas

// ── Piezas que se repiten en varios días ─────────────────────────────────────────────────────────────────────────────
const museosMananaBorgo = [P(MUSEOS, 180, null, { hora_tipo: 'turno' }), P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 75, 'dentro')]
const museosTardeBorgo = camino('Via della Conciliazione', "Castillo de Sant'Angelo", "Puente Sant'Angelo")
const luces = P('Luces de Navidad del Tridente', 30, 'fuera', { protegido: false })
const aracoeliCamino = P('Santo Bambino de Aracoeli', 5, 'camino')

// Lo que el usuario pidió en una tanda aparte (docs/dias/PARA_CODE_TANDA6C.md) y que el documento no trae: cada cambio CITA la frase de la tanda de la que sale.
const TANDA_6C = 'docs/dias/PARA_CODE_TANDA6C.md'
const TANDA_6E = 'docs/dias/PARA_CODE_TANDA6E.md'

/** Los tramos del Coliseo reservado a otra hora en el D1 (cada uno cita su frase del documento). El D1-corto y el D1-FT los reusan: la mañana es la del D1 con la lista de su hora y la tarde es la suya. */
const D1_TRAMOS = [
        // El Coliseo reservado a otra hora (escrito en el documento; el motor no se lo inventa). Los cortes entre tramos (Tanda 6e): hasta las 10:15 el día normal; de 10:16 a 11:15 la lista de 10:30–11:00;
        // de 11:16 a 12:15 la de 11:30–12:00; de 12:16 a 15:15 la de mediodía; desde las 15:16 la de tarde.
        {
          id: 'coliseo_10_30_11_00', doc: 'A media mañana, de 10:30 a 11:00:', horas: ['10:30', '11:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '10:16', hasta: '11:15' } },
          ops: { manana: { paradas: [P('Iglesia de San Pietro in Vincoli', 20, 'dentro'), P('Arco de Constantino', 10), P('Coliseo', 75, 'dentro'), P('Foro Romano y Palatino', 90, 'dentro'), P('Plaza del Campidoglio', 30), P('Altar de la Patria', 30, 'fuera', { acortable: true })] } },
        },
        {
          id: 'coliseo_11_30_12_00', doc: 'De 11:30 a 12:00:', horas: ['11:30', '12:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '11:16', hasta: '12:15' } },
          ops: { manana: { paradas: [P('Iglesia de San Pietro in Vincoli', 20, 'dentro'), P('Arco de Constantino', 10), P('Foro Romano y Palatino', 90, 'dentro', { salida_en: FORO_LADO_ARCO }), P('Coliseo', 75, 'dentro'), ...camino('Via dei Fori Imperiali'), P('Plaza del Campidoglio', 30), P('Altar de la Patria', 30, 'fuera', { acortable: true })] } },
        },
        {
          id: 'coliseo_mediodia', doc: 'A mediodía (de 12:30 a 15:00):', horas: ['12:30', '14:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '12:16', hasta: '15:15' } },
          ops: {
            manana: { paradas: [P('Plaza del Campidoglio', 30), P('Altar de la Patria', 45, 'dentro', { acortable: true }), P('Foro Romano y Palatino', 90, 'dentro', { entrada_en: FORO_LADO_FORI, salida_en: FORO_LADO_ARCO })] },
            comida: mesa('La Taverna dei Fori Imperiali', 'Trattoria Valentino', 'en Monti'),
            tarde: { paradas: [P('Coliseo', 75, 'dentro'), P('Arco de Constantino', 10), ...camino('Via dei Fori Imperiali', 'Largo di Torre Argentina'), P('Iglesia del Gesù', 20, 'dentro'), P('Iglesia de San Luigi dei Francesi', 20, null, { titulo: 'San Luigi dei Francesi (los Caravaggio)' }), P('Panteón', 45, 'dentro'), P('Piazza Navona', 45)] },
            sobra: [P('Barrio Judío', 30)],
          },
        },
        // De 15:16 en adelante: el Foro va DESPUÉS del Coliseo (la misma entrada) si aún se puede entrar; si no, el Foro desde la terraza del Campidoglio, antes.
        {
          id: 'coliseo_tarde', doc: 'Por la tarde (a las 15:30 o más tarde):', horas: ['16:00', '17:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '15:16' }, abierto_tras_reserva: { lugar: 'Foro Romano y Palatino', reserva: 'Coliseo', despues_min: 90, min: 60 } },
          ops: {
            manana: { paradas: [P('Panteón', 45, 'dentro'), P('Piazza Navona', 45), P('Iglesia de San Luigi dei Francesi', 20, null, { titulo: 'San Luigi dei Francesi (los Caravaggio)' }), P('Largo di Torre Argentina', 15), P('Iglesia del Gesù', 20, 'dentro'), P('Barrio Judío', 30)] },
            tarde: { paradas: [P('Plaza del Campidoglio', 30), P('Altar de la Patria', 45, 'dentro', { acortable: true }), ...camino('Via dei Fori Imperiali'), P('Arco de Constantino', 10), P('Coliseo', 75, 'dentro'), P('Foro Romano y Palatino', 90, 'dentro', { entrada_en: FORO_LADO_ARCO })] },
            cena: mesa('La Taverna dei Fori Imperiali', 'Trattoria Valentino', 'en Monti'),
          },
        },
        {
          id: 'coliseo_tarde_foro_antes', doc: 'Si no, el Foro desde la terraza del Campidoglio ~30, antes', horas: [],
          cuando: { reserva: { lugar: 'Coliseo', desde: '15:16' }, abierto_tras_reserva: { lugar: 'Foro Romano y Palatino', reserva: 'Coliseo', despues_min: 90, min: 60, negado: true } },
          ops: {
            manana: { paradas: [P('Panteón', 45, 'dentro'), P('Piazza Navona', 45), P('Iglesia de San Luigi dei Francesi', 20, null, { titulo: 'San Luigi dei Francesi (los Caravaggio)' }), P('Largo di Torre Argentina', 15), P('Iglesia del Gesù', 20, 'dentro'), P('Barrio Judío', 30)] },
            tarde: { paradas: [P('Plaza del Campidoglio', 30), P('El Foro Romano, desde la terraza del Campidoglio', 30, 'fuera'), P('Altar de la Patria', 45, 'dentro', { acortable: true }), ...camino('Via dei Fori Imperiali'), P('Arco de Constantino', 10), P('Coliseo', 75, 'dentro')] },
            cena: mesa('La Taverna dei Fori Imperiali', 'Trattoria Valentino', 'en Monti'),
          },
        },
]

/** El D1-corto y el D1-FT con el Coliseo reservado (Tanda 6f): «la mañana es la del D1 con la lista de su hora (por dentro), y la tarde es la suya». */
const tramosDelD1Reducido = D1_TRAMOS.filter((t) => t.id !== 'coliseo_tarde_foro_antes').map((t) => {
  const ops = t.ops
  const corto = t.id === 'coliseo_10_30_11_00' || t.id === 'coliseo_11_30_12_00'
  const mediodia = t.id === 'coliseo_mediodia'
  return {
    id: t.id, doc: 'D1-corto y D1-FT con el Coliseo reservado:', horas: t.horas, cuando: t.cuando,
    ops: corto ? { manana: ops.manana, ...(ops.comida ? { comida: ops.comida } : {}) } : mediodia ? { manana: ops.manana, comida: ops.comida, tarde: { insertar: [{ al_principio: true, parada: [P('Coliseo', 75, 'dentro'), P('Arco de Constantino', 10)] }] } } : ops,
  }
})

export default {
  ajustes_base: [
    { fuente: TANDA_6C, doc: 'como tercera opción de la comida del Gueto', tercera_comida: { restaurante: 'Piperno', zona: 'Barrio Judío' } },
  ],
  dias: {
    // ── Roma en un día ────────────────────────────────────────────────────────────────────────────────────────────
    D0: {
      variantes: [
        {
          id: 'con_museos', doc: 'Con los Museos marcados: la mañana con Museos del D0-medio y la tarde desde Piazza Navona.',
          cuando: { pool: MUSEOS },
          ops: {
            manana: { paradas: museosMananaBorgo },
            comida: mesa('Borghiciana Pastificio Artigianale', 'Dal Toscano', 'en el Borgo'),
            tarde: { insertar: [{ al_principio: true, parada: [...museosTardeBorgo, P('Piazza Navona', 45), P('Panteón', 45, 'dentro')] }] },
          },
        },
        {
          id: 'coliseo_por_la_manana', doc: 'Con el Coliseo reservado por la mañana',
          horas: ['9:00', '11:00'],
          cuando: { reserva: { lugar: 'Coliseo', hasta: '12:15' } },
          ops: {
            manana: { paradas: [P('Coliseo', 75, 'dentro', { hora_tipo: 'reserva' }), P('Arco de Constantino', 10, 'fuera'), ...camino('Via dei Fori Imperiali'), P('Foro Romano y Palatino', 30, 'fuera'), P('Plaza del Campidoglio', 30), ...camino('Plaza Venecia'), P('Altar de la Patria', 30, 'fuera')] },
            tarde: { paradas: [P('Panteón', 45, 'dentro'), P('Piazza Navona', 45), ...camino("Puente Sant'Angelo"), P("Castillo de Sant'Angelo", 30, 'fuera'), ...camino('Via della Conciliazione'), P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 60, 'dentro'), taxi('Taxi a la Plaza de España'), P('Plaza de España', 45), P('Trinità dei Monti', 15, null), ...camino('bajar la escalinata', 'Via Condotti')] },
          },
        },
        {
          id: 'coliseo_12_30_14_00_manana', doc: 'Con el Coliseo reservado de 12:30 a 14:00:', horas: ['12:30', '13:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '12:16', hasta: '13:29' } },
          ops: {
            empieza: '08:00',
            manana: { paradas: [P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 60, 'dentro'), ...camino('Via della Conciliazione'), P("Castillo de Sant'Angelo", 30, 'fuera'), ...camino("Puente Sant'Angelo"), P('Piazza Navona', 45), P('Panteón', 45, 'dentro'), ...camino('Plaza Venecia', 'Via dei Fori Imperiali'), P('Coliseo', 75, 'dentro')] },
            comida: mesa('La Taverna dei Fori Imperiali', 'Trattoria Valentino', 'en Monti'),
            tarde: { paradas: [...camino('Via dei Fori Imperiali'), P('Plaza del Campidoglio', 30), P('El Foro Romano, desde la terraza del Campidoglio', 30, 'fuera'), P('Altar de la Patria', 30, 'fuera'), taxi('Taxi a la Plaza de España'), P('Plaza de España', 45), P('Trinità dei Monti', 15), P('bajar la escalinata', 5, 'camino'), ...camino('Via Condotti')] },
          },
        },
        {
          id: 'coliseo_13_30_14_00', doc: 'Con el Coliseo reservado de 12:30 a 14:00:', horas: ['14:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '13:30', hasta: '14:15' } },
          ops: {
            empieza: '08:00',
            manana: { paradas: [P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 60, 'dentro'), ...camino('Via della Conciliazione'), P("Castillo de Sant'Angelo", 30, 'fuera'), ...camino("Puente Sant'Angelo"), P('Piazza Navona', 45), P('Panteón', 45, 'dentro')] },
            tarde: { paradas: [...camino('Plaza Venecia', 'Via dei Fori Imperiali'), P('Coliseo', 75, 'dentro'), ...camino('Via dei Fori Imperiali'), P('Plaza del Campidoglio', 30), P('El Foro Romano, desde la terraza del Campidoglio', 30, 'fuera'), P('Altar de la Patria', 30, 'fuera'), taxi('Taxi a la Plaza de España'), P('Plaza de España', 45), P('Trinità dei Monti', 15), P('bajar la escalinata', 5, 'camino'), ...camino('Via Condotti')] },
          },
        },
        {
          id: 'coliseo_14_30_15_30', doc: 'Con el Coliseo reservado de 14:30 en adelante:', horas: ['14:30', '15:30', '17:00'],
          cuando: { reserva: { lugar: 'Coliseo', desde: '14:16' } },
          ops: {
            tarde: { paradas: [...camino('Plaza Venecia'), P('Altar de la Patria', 30, 'fuera'), P('Plaza del Campidoglio', 30), P('El Foro Romano, desde la terraza del Campidoglio', 30, 'fuera'), ...camino('Via dei Fori Imperiali'), P('Coliseo', 75, 'dentro'), taxi('Taxi a la Plaza de España'), P('Plaza de España', 45), P('Trinità dei Monti', 15), P('bajar la escalinata', 5, 'camino'), ...camino('Via Condotti')] },
          },
        },
      ],
      reservas: { Coliseo: { mejores: ['12:30', '14:00', '14:30', '16:00'] } },
      experiencias: {
        mercadillos_navidenos: { clave: 'navona', doc: 'Mercadillos (8 dic – 6 ene): «Piazza Navona y su mercadillo navideño».', cuando: { fechas: NAVIDAD }, ops: { manana: { ajustar: { 'Piazza Navona': capa('Mercadillo de Navidad de Piazza Navona') } }, tarde: { ajustar: { 'Piazza Navona': capa('Mercadillo de Navidad de Piazza Navona') } } } },
      },
      lluvia_doc: 'la Basílica y el Panteón ya van por dentro; el Foro desde la terraza, el Coliseo y Navona, más cortos.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Piazza Navona': { min: 30 } } }, tarde: { ajustar: { 'Foro Romano y Palatino': { min: 15 }, Coliseo: { min: 20 } } } } }),
    },

    // ── Medio día del Vaticano (1,5 días) ─────────────────────────────────────────────────────────────────────────────
    'D0-medio': {
      variantes: [
        {
          id: 'museos_manana', doc: 'Con los Museos marcados o reservados:',
          cuando: [{ parte: 'manana', pool: MUSEOS }, { parte: 'manana', reserva: { lugar: MUSEOS } }],
          ops: { manana: { paradas: museosMananaBorgo }, comida: mesa('Borghiciana Pastificio Artigianale', 'Dal Toscano', 'en el Borgo'), tarde: { paradas: museosTardeBorgo } },
        },
        {
          id: 'museos_tarde', doc: 'Con los Museos marcados o reservados:',
          cuando: [{ parte: 'tarde', pool: MUSEOS }, { parte: 'tarde', reserva: { lugar: MUSEOS } }],
          ops: { tarde: { paradas: [P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 75, 'dentro'), P(MUSEOS, 150, null, { hora_tipo: 'turno' })] }, noche: { lista: ["El Puente y el Castillo de Sant'Angelo (noche)"] } },
        },
        {
          id: 'miercoles_audiencia', doc: 'Miércoles por la mañana (audiencia del Papa),',
          cuando: { parte: 'manana', dia_semana: ['miércoles'] },
          ops: { manana: { paradas: [P('Fontana de Trevi', 45, null, { titulo: 'Fontana de Trevi, sin gente' }), P('Plaza de España', 45), ...camino('Via dei Coronari', "Puente Sant'Angelo"), P("Castillo de Sant'Angelo", 30, 'fuera'), P('Plaza de San Pedro', 30, null, { no_antes: '12:00' }), ...camino('Basílica')] }, comida: mesa('Borghiciana Pastificio Artigianale', 'Dal Toscano', 'en el Borgo'), tarde: { paradas: [] } },
        },
      ],
      experiencias: {
        mercadillos_navidenos: { clave: 'presepi', doc: 'Mercadillos (8 dic – 6 ene): «Plaza de San Pedro y los 100 Presepi» y «Piazza Navona y su mercadillo navideño».', cuando: { fechas: NAVIDAD }, ops: { manana: { ajustar: { 'Plaza de San Pedro': capa('100 Presepi in Vaticano') } }, tarde: { ajustar: { 'Plaza de San Pedro': capa('100 Presepi in Vaticano') } } } },
      },
      lluvia_doc: 'por la mañana, la Basílica por dentro (gratis, ~45) en vez de la fachada; por la tarde ya va por dentro. El Castillo, de camino.',
      lluvia_ops: lluvia({ ops: { manana: { cambiar: { 'Basílica de San Pedro::camino': P('Basílica de San Pedro', 45, 'dentro') }, ajustar: { "Castillo de Sant'Angelo": { modo: 'camino', min: 5 } } }, tarde: { ajustar: { "Castillo de Sant'Angelo": { modo: 'camino', min: 5 } } } } }),
    },

    // ── Un día entero (1,5 días) ──────────────────────────────────────────────────────────────────────────────────────
    'D1-corto': {
      variantes: tramosDelD1Reducido,
      reservas: { Coliseo: { normal: { hasta: '10:15' }, mejores: ['9:00', '10:30', '11:30', '12:30', '14:00', '16:00'] } },
      lluvia_doc: 'el Panteón y Santa Maria in Trastevere ya van por dentro; la Isla Tiberina y el Ponte Sisto, de camino, y el Janículo sale.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Isla Tiberina': { modo: 'camino', min: 5 } } }, tarde: { ajustar: { 'Ponte Sisto': { modo: 'camino', min: 5 } }, quitar: ['Mirador del Janículo', 'Via Garibaldi: se sube andando'] } } }),
    },

    // ── La Roma antigua ─────────────────────────────────────────────────────────────────────────────────────────────────
    D1: {
      // «Si te sobra tiempo» de HOY (antes de comer): lo que el documento sugiere, salvo que el viaje lleve el día propio de ese sitio.
      reservas: { Coliseo: { normal: { hasta: '10:15' }, mejores: ['9:00', '10:30', '11:30', '12:30', '14:00', '16:00'] } },
      sugerencias: [{ doc: 'la Columna y los Mercados de Trajano (~1 h), al lado del Altar, si el viaje no los lleva en el D6.', lugar: 'Mercados de Trajano', titulo: 'Columna de Trajano y Mercados de Trajano', min: 60, salvo_dia: 'D6' }],
      variantes: [
        ...D1_TRAMOS,
        { id: 'sabado_panteon', doc: 'el sábado el Panteón cierra a las 17:00 por la misa: aviso «entra antes».', cuando: { dia_semana: ['sábado'] }, ops: { tarde: { ajustar: { Panteón: { cierra: '17:00' } } } } },
        { id: 'free_tour_tarde', doc: 'Free Tour de tarde (17:00) o de noche (18:30):** es una reserva en la tarde.', cuando: { free_tour_despues: 'tarde' }, ops: { tarde: { insertar: [{ al_final: true, parada: P('Free Tour Centro Histórico', 150, null, { hora: '$free_tour', hora_tipo: 'turno' }) }] }, quitar_cubierto_por_tour: true } },
        { id: 'free_tour_noche', doc: 'Free Tour de tarde (17:00) o de noche (18:30):** es una reserva en la tarde.', cuando: { free_tour_despues: 'noche' }, ops: { tarde: { insertar: [{ al_final: true, parada: P('Free Tour Centro Histórico', 150, null, { hora: '$free_tour', hora_tipo: 'turno' }) }] }, quitar_cubierto_por_tour: true } },
      ],
      pool: {
        'Museos Capitolinos': { doc: 'Museos Capitolinos:** por la mañana, después del Campidoglio ~60.', cuando: { viaje_sin: ['D6'] }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Museos Capitolinos', 60, 'dentro', { protegido: true }) }] } } },
        'Basílica de San Juan de Letrán': { doc: 'San Juan de Letrán:** a primera hora, antes del Coliseo (metro B de San Giovanni a Colosseo).', cuando: { viaje_sin: ['D5'] }, ops: { manana: { insertar: [{ al_principio: true, parada: [P('San Juan de Letrán y la Escalera Santa', 40, 'dentro', { protegido: true }), { tipo: 'traslado', como: 'metro B', texto: 'Metro B de San Giovanni a Colosseo' }] }] } } },
        'Boca de la Verdad': { doc: 'Boca de la Verdad, Jardín de los Naranjos y Ojo de la Cerradura:** por la tarde, después del Barrio Judío (taxi de vuelta a Largo Argentina).', ops: { tarde: { insertar: [{ despues_de: 'Barrio Judío', parada: P('Boca de la Verdad', 20, null, { protegido: true }) }, { antes_de: 'Largo di Torre Argentina', parada: taxi('Taxi de vuelta a Largo Argentina') }] } } },
        'Jardín de los Naranjos': { doc: 'Boca de la Verdad, Jardín de los Naranjos y Ojo de la Cerradura:** por la tarde, después del Barrio Judío (taxi de vuelta a Largo Argentina).', ops: { tarde: { insertar: [{ despues_de: ['Boca de la Verdad', 'Barrio Judío'], parada: P('Jardín de los Naranjos', 30, null, { protegido: true }) }, { antes_de: 'Largo di Torre Argentina', parada: taxi('Taxi de vuelta a Largo Argentina') }] } } },
        'Ojo de la Cerradura del Aventino': { doc: 'Boca de la Verdad, Jardín de los Naranjos y Ojo de la Cerradura:** por la tarde, después del Barrio Judío (taxi de vuelta a Largo Argentina).', ops: { tarde: { insertar: [{ despues_de: ['Jardín de los Naranjos', 'Boca de la Verdad', 'Barrio Judío'], parada: P('Ojo de la Cerradura del Aventino', 15, null, { protegido: true }) }, { antes_de: 'Largo di Torre Argentina', parada: taxi('Taxi de vuelta a Largo Argentina') }] } } },
        'Galería Borghese': { doc: 'Galería Borghese:** 🎟 por la tarde, después del Panteón (taxi). Lo que no quepa, a «Si te sobra tiempo». Cena en el Tridente.', ops: { tarde: { insertar: [{ despues_de: 'Panteón', parada: [taxi('Taxi a la Galería Borghese'), P('Galería Borghese', 120, 'dentro', { hora_tipo: 'reserva', protegido: true })] }] }, cena: mesa('Il Gabriello', 'Poldo e Gianna Osteria', 'en el Tridente') } },
        'Parque de Villa Borghese': { doc: 'Parque de Villa Borghese:** al final de la tarde (taxi), con el Pincio. Cena en el Tridente.', ops: { tarde: { insertar: [{ al_final: true, parada: [taxi('Taxi a Villa Borghese'), P('Parque de Villa Borghese', 40, null, { protegido: true }), P('Terraza del Pincio', 20, null, { protegido: true })] }] }, cena: mesa('Il Gabriello', 'Poldo e Gianna Osteria', 'en el Tridente') } },
      },
      experiencias: {
        arte_museos: { doc: 'Arte y Museos:** los Capitolinos.', añade: 'Museos Capitolinos', cuando: { viaje_sin: ['D6'] }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Museos Capitolinos', 60, 'dentro', { protegido: true }) }] } } },
        barrios_sabores: { doc: 'Barrios y Sabores:** el Barrio Judío ~45.', ops: { tarde: { ajustar: { 'Barrio Judío': { min: 45 } } } } },
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el ascensor panorámico del Altar.', ops: { manana: { cambiar: { 'Altar de la Patria': P('Terraza del Altar de la Patria (ascensor panorámico)', 45, 'dentro', { protegido: true }) } } } },
        mercadillos_navidenos: [
          { clave: 'aracoeli', doc: 'Mercadillos:** «Piazza Navona y su mercadillo navideño» y el Santo Bambino de Aracoeli de camino.', cuando: { fechas: NAVIDAD }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Santo Bambino de Aracoeli', 5, 'camino') }] } } },
          { clave: 'navona', doc: 'Mercadillos:** «Piazza Navona y su mercadillo navideño» y el Santo Bambino de Aracoeli de camino.', cuando: { fechas: NAVIDAD }, ops: { tarde: { ajustar: { 'Piazza Navona': capa('Mercadillo de Navidad de Piazza Navona') } } } },
        ],
      },
      lluvia_doc: 'el Foro y el Palatino son al aire libre: más cortos (~1 h). Si el viaje no lleva otro día con los Museos Capitolinos, van después del Campidoglio (~1 h). El Barrio Judío y Navona, más cortos.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Foro Romano y Palatino': { min: 60 } } }, tarde: { ajustar: { 'Barrio Judío': { min: 20 }, 'Piazza Navona': { min: 25 } } } } }, { cuando: { viaje_sin: ['D6'] }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Museos Capitolinos', 60, 'dentro') }] } } }),
    },

    // ── El Vaticano y Trastevere ───────────────────────────────────────────────────────────────────────────────────────
    D2: {
      reservas: { [MUSEOS]: { normal: { hasta: '09:44' }, mejores: ['9:00', '10:00', '11:00', '12:30', '14:00', '16:00'] } },
      // El miércoles sin Museos deja 1 h 40 libre antes de las 12:30: HOY lo dice («Tienes … antes de la Plaza de San Pedro») con sugerencias cercanas.
      sugerencias: [{ fuente: TANDA_6E, doc: 'con sugerencias cercanas (Borgo Pio, los Coronari)', antes_de: 'Plaza de San Pedro', lugares: ['Borgo Pio', 'Via dei Coronari'] }],
      variantes: [
        {
          id: 'sin_museos', doc: 'si no se puede, sin Museos: la mañana empieza en San Pedro con la Basílica y las Grutas',
          cuando: { cerrado: MUSEOS },
          ops: { manana: { paradas: [P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 90, 'dentro', { titulo: 'Basílica de San Pedro y las Grutas Vaticanas' })] } },
        },
        // Los Museos reservados a media mañana (de 9:45 a 12:00): la Basílica y la Plaza van ANTES de los Museos (nunca de camino para que quepa la comida).
        {
          id: 'museos_media_manana', doc: 'Museos reservados a media mañana (de 10:00 a 12:00):', horas: ['10:00', '11:00'],
          cuando: { reserva: { lugar: MUSEOS, desde: '09:45', hasta: '12:15' } },
          ops: { empieza: '08:00', manana: { paradas: [P('Basílica de San Pedro', 60, 'dentro'), P('Plaza de San Pedro', 30), P(MUSEOS, 180)] } },
        },
        // Los Museos reservados a mediodía (de 12:30 a 14:30): la comida en el Borgo antes (entre las 12:00 y las 12:30) y, después de los Museos, el bus 23 a Trastevere.
        {
          id: 'museos_mediodia', doc: 'Museos reservados a mediodía (de 12:30 a 14:30):', horas: ['12:30', '14:00'],
          cuando: { reserva: { lugar: MUSEOS, desde: '12:16', hasta: '14:59' } },
          ops: {
            manana: { paradas: [P('Plaza de San Pedro', 30), P('Basílica de San Pedro', 75, 'dentro'), ...camino('Via della Conciliazione'), P("Castillo de Sant'Angelo", 30, 'fuera'), P("Puente Sant'Angelo", 15)] },
            comida: mesa('Borghiciana Pastificio Artigianale', 'Dal Toscano', 'en el Borgo'),
            tarde: { paradas: [P(MUSEOS, 180), { tipo: 'traslado', como: 'bus 23', texto: 'Bus 23 por el Lungotevere hasta la Isla Tiberina' }, P('Isla Tiberina', 20), P('Iglesia de Santa Maria in Trastevere', 25, 'dentro'), P('San Pietro in Montorio y Tempietto de Bramante', 10, null, { titulo: 'San Pietro in Montorio y el Tempietto' }), P("Fontana dell'Acqua Paola", 10), P('Mirador del Janículo', 30)] },
          },
        },
        // Los Museos reservados por la tarde (15:00 o más tarde): el día cambia entero (la Basílica cierra a las 18:30 o a las 19:00 y al salir de los Museos estaría cerrada).
        {
          id: 'museos_tarde', doc: 'Museos reservados por la tarde (a las 15:00 o más tarde):', horas: ['15:00', '16:00'],
          cuando: { reserva: { lugar: MUSEOS, desde: '15:00' } },
          ops: {
            manana: { paradas: [P('Basílica de San Pedro', 60, 'dentro'), P('Plaza de San Pedro', 30), ...camino('Via della Conciliazione'), P("Castillo de Sant'Angelo", 90, 'dentro', { titulo: "Castillo de Sant'Angelo, hasta la terraza del ángel" }), P("Puente Sant'Angelo", 15), ...camino('Lungotevere')] },
            comida: mesa('Il Sorpasso', 'Dal Toscano', 'en Prati'),
            tarde: { paradas: [P(MUSEOS, 180), P('Plaza de San Pedro', 15), taxi('Taxi a Trastevere')] },
            cena: mesa('Tonnarello', 'Trattoria Da Enzo al 29', 'en Trastevere'),
            noche: { lista: ['Trastevere de noche'] },
            sobra: [P('Isla Tiberina', 20), P('Iglesia de Santa Maria in Trastevere', 25, 'dentro'), P('Mirador del Janículo', 30)],
          },
        },
        {
          id: 'museos_tarde_cupula', doc: 'si el viaje lleva el D6, aquí no va y la mañana empieza en la Basílica',
          cuando: { reserva: { lugar: MUSEOS, desde: '15:00' }, viaje_sin: ['D6'] },
          ops: { manana: { insertar: [{ al_principio: true, parada: P('Cúpula de San Pedro', 75, 'dentro') }] } },
        },
        // El miércoles sin Museos: el día empieza a su hora (el Castillo abre a las 9:00) y la Plaza y la Basílica van cuando acaba la audiencia.
        {
          id: 'miercoles_audiencia', doc: 'el miércoles sin Museos',
          cuando: { dia_semana: ['miércoles'] },
          ops: {
            manana: { paradas: [P("Castillo de Sant'Angelo", 90, 'dentro', { titulo: "Castillo de Sant'Angelo, hasta la terraza del ángel" }), P("Puente Sant'Angelo", 15), ...camino('Lungotevere'), P('Plaza de San Pedro', 30, null, { no_antes: '12:30' }), P('Basílica de San Pedro', 75, 'dentro')] },
            tarde: { quitar: ['Via della Conciliazione', "Castillo de Sant'Angelo", "Puente Sant'Angelo"] },
          },
        },
      ],
      pool: {
        'Cúpula de San Pedro': { doc: 'Cúpula:** después de la Basílica ~45.', ops: { manana: { insertar: [{ despues_de: 'Basílica de San Pedro', parada: P('Cúpula de San Pedro', 45, 'dentro', { protegido: true }) }] } } },
        "Castillo de Sant'Angelo": { doc: 'Castillo por dentro:** ~60, en lugar de por fuera.', ops: { tarde: { cambiar: { "Castillo de Sant'Angelo": P("Castillo de Sant'Angelo", 60, 'dentro', { protegido: true }) } } } },
      },
      experiencias: {
        arte_museos: { doc: 'Arte y Museos:** los Museos con la Pinacoteca ~4 h.', ops: { manana: { ajustar: { [MUSEOS]: { min: 240, titulo: 'Museos Vaticanos y Capilla Sixtina, con la Pinacoteca' } } } } },
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** la Cúpula.', añade: 'Cúpula de San Pedro', ops: { manana: { insertar: [{ despues_de: 'Basílica de San Pedro', parada: P('Cúpula de San Pedro', 45, 'dentro', { protegido: true }) }] } } },
        mercadillos_navidenos: { clave: 'presepi', doc: 'Mercadillos:** «Plaza de San Pedro y los 100 Presepi».', cuando: { fechas: NAVIDAD }, ops: { manana: { ajustar: { 'Plaza de San Pedro': capa('100 Presepi in Vaticano') } } } },
      },
      lluvia_doc: "el Castillo de Sant'Angelo por dentro (~1 h 30) en vez de por fuera, si el viaje no lo lleva por dentro otro día. El Janículo y la Isla Tiberina salen; Santa Maria in Trastevere por dentro se queda.",
      lluvia_ops: lluvia({ ops: { tarde: { quitar: ['Mirador del Janículo', 'San Pietro in Montorio y Tempietto de Bramante', "Fontana dell'Acqua Paola", 'Isla Tiberina'] } } }, { cuando: { viaje_sin: ['D6'] }, ops: { tarde: { ajustar: { "Castillo de Sant'Angelo": { modo: 'dentro', min: 90 } } } } }),
    },

    // ── El Free Tour y el Vaticano por la tarde ──────────────────────────────────────────────────────────────────────────
    D3: {
      reservas: { [MUSEOS]: { normal: { desde: '14:31' }, no_cabe_antes: '13:30', mejores: ['13:30', '14:00', '14:30'] } },
      variantes: [
        {
          id: 'museos_13_30_14_30', doc: 'Con los Museos reservados de 13:30 a 14:30:', horas: ['13:30', '14:00', '14:30'],
          cuando: { reserva: { lugar: MUSEOS, desde: '13:30', hasta: '14:30' } },
          ops: {
            manana: { insertar: [{ al_final: true, parada: taxi('Taxi de Navona al Borgo') }] },
            comida: { ...mesa('Borghiciana Pastificio Artigianale', 'Dal Toscano', 'en el Borgo'), min: 45 },
            tarde: { paradas: [P(MUSEOS, 150), P('Basílica de San Pedro', 60, 'dentro'), P('Plaza de San Pedro', 20)] },
          },
        },
        { id: 'domingo_sin_museos', doc: 'Domingo (Museos cerrados):** se cambia de día; si no se puede, la tarde sin Museos.', cuando: { cerrado: MUSEOS }, ops: { tarde: { quitar: [MUSEOS] } } },
      ],
      experiencias: {
        mercadillos_navidenos: { clave: 'presepi', doc: 'Mercadillos:** «Plaza de San Pedro y los 100 Presepi».', cuando: { fechas: NAVIDAD }, ops: { tarde: { ajustar: { 'Plaza de San Pedro': capa('100 Presepi in Vaticano') } } } },
      },
    },

    // ── La Roma antigua, el Gueto y Trastevere (con Free Tour de mañana) ───────────────────────────────────────────────────
    'D1-FT': {
      variantes: tramosDelD1Reducido,
      reservas: { Coliseo: { normal: { hasta: '10:15' }, mejores: ['9:00', '10:30', '11:30', '12:30', '14:00', '16:00'] } },
      pool: {
        'Museos Capitolinos': { doc: 'Pool:** como el D1, con el Ojo y la Galería por la tarde, en lugar de la Isla Tiberina y Trastevere.', cuando: { viaje_sin: ['D6'] }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Museos Capitolinos', 60, 'dentro', { protegido: true }) }] } } },
        'Basílica de San Juan de Letrán': { doc: 'Pool:** como el D1, con el Ojo y la Galería por la tarde, en lugar de la Isla Tiberina y Trastevere.', cuando: { viaje_sin: ['D5'] }, ops: { manana: { insertar: [{ al_principio: true, parada: [P('San Juan de Letrán y la Escalera Santa', 40, 'dentro', { protegido: true }), { tipo: 'traslado', como: 'metro B', texto: 'Metro B de San Giovanni a Colosseo' }] }] } } },
        'Ojo de la Cerradura del Aventino': { doc: 'Pool:** como el D1, con el Ojo y la Galería por la tarde, en lugar de la Isla Tiberina y Trastevere.', ops: { tarde: { cambiar: { 'Isla Tiberina': P('Ojo de la Cerradura del Aventino', 15, null, { protegido: true }) } } } },
        'Galería Borghese': { doc: 'Pool:** como el D1, con el Ojo y la Galería por la tarde, en lugar de la Isla Tiberina y Trastevere.', ops: { tarde: { quitar: ['Iglesia de Santa Maria in Trastevere'], insertar: [{ al_final: true, parada: [taxi('Taxi a la Galería Borghese'), P('Galería Borghese', 120, 'dentro', { hora_tipo: 'reserva', protegido: true })] }] }, cena: mesa('Il Gabriello', 'Poldo e Gianna Osteria', 'en el Tridente') } },
      },
      experiencias: {
        arte_museos: { doc: 'Arte y Museos:** los Capitolinos.', añade: 'Museos Capitolinos', cuando: { viaje_sin: ['D6'] }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Museos Capitolinos', 60, 'dentro', { protegido: true }) }] } } },
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el ascensor del Altar.', ops: { manana: { cambiar: { 'Altar de la Patria': P('Terraza del Altar de la Patria (ascensor panorámico)', 45, 'dentro', { protegido: true }) } } } },
        barrios_sabores: { doc: 'Barrios y Sabores:** el Barrio Judío ~45.', ops: { tarde: { ajustar: { 'Barrio Judío': { min: 45 } } } } },
        mercadillos_navidenos: { clave: 'aracoeli', doc: 'Mercadillos:** el Santo Bambino de Aracoeli de camino.', cuando: { fechas: NAVIDAD }, ops: { manana: { insertar: [{ despues_de: 'Plaza del Campidoglio', parada: P('Santo Bambino de Aracoeli', 5, 'camino') }] } } },
      },
      lluvia_doc: 'el Foro, más corto; por la tarde, Santa Maria in Trastevere y Santa Cecilia por dentro, en lugar del Janículo y la Isla Tiberina.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Foro Romano y Palatino': { min: 60 } } }, tarde: { quitar: ['Mirador del Janículo', 'San Pietro in Montorio y Tempietto de Bramante', "Fontana dell'Acqua Paola", 'Isla Tiberina'], cambiar: { 'Iglesia de Santa Maria in Trastevere': P('Santa Maria in Trastevere', 20, 'dentro') }, insertar: [{ despues_de: 'Iglesia de Santa Maria in Trastevere', parada: P('Santa Cecilia in Trastevere', 40, 'dentro') }] } } }),
    },

    // ── El Tridente y el Pincio (medio día) ──────────────────────────────────────────────────────────────────────────────
    'DT-medio': {
      pool: {
        'Galería Borghese': { doc: 'Pool:** la Galería Borghese, 🎟 por la mañana (turno de las 9:00) o por la tarde, va antes del Pincio. Santa Maria del Popolo, por la tarde.', ops: { manana: { insertar: [{ antes_de: 'Terraza del Pincio', parada: P('Galería Borghese', 120, 'dentro', { hora: '09:00', hora_tipo: 'turno', protegido: true }) }] }, tarde: { insertar: [{ antes_de: 'Terraza del Pincio', parada: P('Galería Borghese', 120, 'dentro', { hora_tipo: 'reserva', protegido: true }) }] } } },
      },
      experiencias: {
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el Parque de Villa Borghese antes del Pincio.', ops: { manana: { insertar: [{ antes_de: 'Terraza del Pincio', parada: P('Parque de Villa Borghese', 40, null, { protegido: true }) }] }, tarde: { insertar: [{ antes_de: 'Terraza del Pincio', parada: P('Parque de Villa Borghese', 40, null, { protegido: true }) }] } } },
        mercadillos_navidenos: { clave: 'luces', doc: 'Mercadillos:** antes de cenar, «Luces de Navidad del Tridente» ~30 (Via Condotti y Via del Corso iluminadas).', cuando: { fechas: NAVIDAD, parte: 'tarde' }, ops: { tarde: { insertar: [{ al_final: true, parada: luces }] } } },
      },
      lluvia_doc: 'el Pincio y sus jardines salen; Santa Maria del Popolo y Trinità por dentro, y el Ara Pacis (~45) entre el Popolo y la Plaza de España.',
      lluvia_ops: lluvia({ ops: { manana: { quitar: ['Terraza del Pincio', 'Jardines del Pincio'], ajustar: { 'Santa Maria del Popolo': { modo: 'dentro' }, 'Trinità dei Monti': { modo: 'dentro' } }, insertar: [{ despues_de: 'Santa Maria del Popolo', parada: P('Ara Pacis', 45, 'dentro') }] }, tarde: { quitar: ['Terraza del Pincio', 'Jardines del Pincio'], ajustar: { 'Santa Maria del Popolo': { modo: 'dentro' }, 'Trinità dei Monti': { modo: 'dentro' } }, insertar: [{ despues_de: 'Santa Maria del Popolo', parada: P('Ara Pacis', 45, 'dentro') }] } } }),
    },

    // ── Monti (medio día, con Free Tour de mañana) ──────────────────────────────────────────────────────────────────────────
    'DM-medio': {
      pool: {
        'Basílica de San Juan de Letrán': { doc: 'Pool:** San Juan de Letrán y la Escalera Santa, al final; comida en San Giovanni (SantoPalato o Il Bocconcino).', ops: { manana: { insertar: [{ al_final: true, parada: P('San Juan de Letrán y la Escalera Santa', 40, 'dentro', { protegido: true }) }] }, comida: mesa('SantoPalato', 'Il Bocconcino', 'en San Giovanni') } },
      },
      lluvia_doc: 'igual (casi todo es por dentro), con más rato en Santa Maria Maggiore.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Basílica de Santa María la Mayor': { min: 60 } } } } }),
    },

    // ── Villa Borghese, el Popolo y la Plaza de España ────────────────────────────────────────────────────────────────────────
    D4: {
      reservas: { 'Galería Borghese': { normal: { desde: '10:01', hasta: '11:30' }, mejores: ['9:00', '11:00', '15:00', '17:00'] } },
      variantes: [
        // La Galería a las 9:00: desayuno cerca de Via Veneto, de camino el Tritón, Via Veneto y Porta Pinciana, «Llegada a…» y la Galería; después, el parque, el reloj de agua y el Pincio. Trevi no cabe a primera hora.
        {
          id: 'galeria_9', doc: 'A las 9:00:', horas: ['9:00'],
          cuando: { reserva: { lugar: 'Galería Borghese', hasta: '10:00' } },
          ops: { empieza: '08:00', manana: { paradas: [P('Desayuno romano', 30, null, { tipo: 'desayuno', titulo: 'Desayuno' }), ...camino('Fuente del Tritón', 'Via Veneto', 'Porta Pinciana'), P('Galería Borghese', 120), P('Parque de Villa Borghese', 45), P('Parque de Villa Borghese', 10, null, { titulo: 'Reloj de agua del Pincio' }), P('Terraza del Pincio', 20)] } },
        },
        // …y Trevi, si el viaje no la lleva otro día, va al final de la tarde, de camino desde la Plaza de España a la cena (~7 min).
        {
          id: 'galeria_9_trevi', doc: 'Si el viaje no la lleva otro día, va al final de la tarde', horas: [],
          cuando: { reserva: { lugar: 'Galería Borghese', hasta: '10:00' }, viaje_sin: ['D3'] },
          ops: { tarde: { insertar: [{ al_final: true, parada: P('Fontana de Trevi', 20) }] } },
        },
        // A las 15:00 o a las 17:00 el día va al revés: la mañana en el Tridente y el Popolo, y la tarde en Villa Borghese acabando en la Galería.
        {
          id: 'galeria_tarde', doc: 'A las 15:00 o a las 17:00:', horas: ['15:00', '17:00'],
          cuando: { reserva: { lugar: 'Galería Borghese', desde: '14:01' } },
          ops: {
            empieza: '07:30',
            manana: { paradas: [P('Fontana de Trevi', 30, null, { titulo: 'Fontana de Trevi, sin gente' }), P('Desayuno romano', 30, null, { tipo: 'desayuno', titulo: 'Desayuno' }), P('Plaza de España', 45), P('Escalinata y Trinità dei Monti', 20), ...camino('Via Condotti'), P('Ara Pacis', 45, 'dentro'), ...camino('Via di Ripetta'), P('Piazza del Popolo', 30, null, { titulo: 'Piazza del Popolo, con el obelisco y las iglesias gemelas' }), P('Santa Maria del Popolo', 20)] },
            comida: mesa('Sgarro Bistrot', 'Buccone Vini e Olii', 'junto a la Piazza del Popolo'),
            tarde: { paradas: [P('Terraza del Pincio', 20), P('Parque de Villa Borghese', 10, null, { titulo: 'Reloj de agua del Pincio' }), P('Parque de Villa Borghese', 45), P('Galería Borghese', 120), ...camino('Porta Pinciana', 'Via Veneto', 'Fuente del Tritón')] },
            cena: mesa('Il Gabriello', 'Poldo e Gianna Osteria', 'en el Tridente'),
          },
        },
        { id: 'lunes_sin_galeria', doc: 'si no se puede, en lugar de la Galería, la Cripta de los Capuchinos (Via Veneto, ~45; abre a las 9:00), después de la Fuente del Tritón.', cuando: { cerrado: 'Galería Borghese' }, ops: { manana: { quitar: ['Galería Borghese'], insertar: [{ despues_de: 'Fuente del Tritón', parada: P('Cripta de los Capuchinos', 45, 'dentro') }] } } },
        { id: 'con_free_tour_de_manana', doc: 'Con Free Tour de mañana:** sin Trevi ni desayuno, y sin el «de camino» del principio: **el día empieza directamente en el Parque de Villa Borghese**', cuando: { free_tour: true }, ops: { manana: { quitar: ['Fontana de Trevi', 'Desayuno romano', 'Fuente del Tritón', 'Via Veneto', 'Porta Pinciana'] }, tarde: { ajustar: { 'Plaza de España': { modo: 'camino', min: 5 } } }, empieza: '09:00' } },
      ],
      experiencias: {
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el lago de Villa Borghese ~60.', ops: { manana: { ajustar: { 'Parque de Villa Borghese': { min: 60 } } } } },
        mercadillos_navidenos: { clave: 'luces', doc: 'Mercadillos:** antes de cenar, «Luces de Navidad del Tridente» ~30 (Via Condotti y Via del Corso iluminadas).', cuando: { fechas: NAVIDAD }, ops: { tarde: { insertar: [{ al_final: true, parada: luces }] } } },
      },
      lluvia_doc: 'el lago y el reloj de agua salen y el Pincio va de camino; la Galería se queda, y hay más rato en Santa Maria del Popolo y el Ara Pacis.',
      lluvia_ops: lluvia({ ops: { manana: { quitar: ['Parque de Villa Borghese', 'Reloj de agua del Pincio'], ajustar: { 'Terraza del Pincio': { modo: 'camino', min: 5 } } }, tarde: { ajustar: { 'Santa Maria del Popolo': { min: 30 }, 'Ara Pacis': { min: 60 } } } } }),
    },

    // ── El Aventino y Testaccio (medio día de vuelta) ──────────────────────────────────────────────────────────────────────────
    'DA-medio': {
      variantes: [
        { id: 'lunes_sin_caracalla', doc: 'Lunes (Caracalla cierra):** empieza en el Circo Máximo y al final, el Cementerio Protestante ~30.', cuando: { cerrado: 'Termas de Caracalla' }, ops: { manana: { quitar: ['Termas de Caracalla'] }, tarde: { insertar: [{ al_final: true, parada: P('Cementerio Protestante', 30) }] } } },
      ],
      experiencias: {
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el Jardín de los Naranjos ~45.', ops: { manana: { ajustar: { 'Jardín de los Naranjos': { min: 45 } } } } },
      },
      lluvia_doc: 'Caracalla, el Jardín de los Naranjos y el Ojo, más cortos (son al aire libre); Santa Maria in Cosmedin (la iglesia de la Boca de la Verdad) por dentro; la comida en el Mercado de Testaccio, que está cubierto.',
      lluvia_ops: lluvia({ ops: { manana: { ajustar: { 'Boca de la Verdad': { modo: 'dentro', min: 20, titulo: 'Santa Maria in Cosmedin, la iglesia de la Boca de la Verdad' }, 'Jardín de los Naranjos': { min: 20 }, 'Ojo de la Cerradura del Aventino': { min: 10 } } } } }),
    },

    // ── Las basílicas y el Aventino ──────────────────────────────────────────────────────────────────────────────────────────────
    D5: {
      variantes: [
        { id: 'domingo_san_clemente', doc: 'Domingo:** San Clemente solo abre por la tarde: va después de comer y el taxi sale de allí.', cuando: { dia_semana: ['domingo'] }, ops: { manana: { quitar: ['Basílica de San Clemente'] }, tarde: { insertar: [{ al_principio: true, parada: P('Basílica de San Clemente, con las excavaciones', 40, 'dentro') }] } } },
      ],
      pool: {
        'Domus Aurea': { doc: 'Pool:** la Domus Aurea, 🎟 solo con reserva y de viernes a domingo, por la mañana entre San Pietro in Vincoli y San Clemente.', cuando: { dia_semana: ['viernes', 'sábado', 'domingo'] }, ops: { manana: { insertar: [{ despues_de: 'Iglesia de San Pietro in Vincoli', parada: P('Domus Aurea', 75, 'dentro', { hora_tipo: 'reserva', protegido: true }) }] } } },
      },
      experiencias: {
        naturaleza_vistas: { doc: 'Naturaleza y Vistas:** el Jardín de los Naranjos ~45.', ops: { tarde: { ajustar: { 'Jardín de los Naranjos': { min: 45 } } } } },
      },
      lluvia_doc: 'la mañana igual (todo por dentro); por la tarde, Caracalla, el Jardín de los Naranjos y el Ojo, más cortos, y Santa Maria in Cosmedin por dentro.',
      lluvia_ops: lluvia({ ops: { tarde: { ajustar: { 'Boca de la Verdad': { modo: 'dentro', min: 20, titulo: 'Santa Maria in Cosmedin, la iglesia de la Boca de la Verdad' }, 'Jardín de los Naranjos': { min: 20 }, 'Ojo de la Cerradura del Aventino': { min: 10 }, 'Termas de Caracalla': { min: 45 } } } } }),
    },

    // ── Roma desde arriba ────────────────────────────────────────────────────────────────────────────────────────────────────────
    D6: {
      variantes: [
        {
          id: 'miercoles_audiencia', doc: 'Miércoles (audiencia):** la mañana va al revés y la Cúpula al final, cuando acaba la audiencia (desde las 12:30)',
          cuando: { dia_semana: ['miércoles'], mes: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12] },
          ops: {
            manana: { paradas: [P('Piazza Navona', 20), ...camino('Panteón', 'Via dei Coronari', "Puente Sant'Angelo"), P("Castillo de Sant'Angelo", 90, 'dentro', { titulo: "Castillo de Sant'Angelo, hasta la terraza del ángel" }), ...camino('Via della Conciliazione'), P('Plaza de San Pedro', 5, 'camino', { no_antes: '12:30' }), P('Cúpula de San Pedro', 75, 'dentro')] },
            comida: mesa('Ristorante Arlù', '200 Gradi', 'en el Borgo'),
          },
        },
      ],
      experiencias: {
        arte_museos: { doc: 'Arte y Museos:** los Capitolinos ~2 h 30.', ops: { tarde: { ajustar: { 'Museos Capitolinos': { min: 150 } } } } },
        mercadillos_navidenos: { clave: 'aracoeli', doc: 'Mercadillos:** el Santo Bambino en Santa Maria in Aracoeli.', cuando: { fechas: NAVIDAD }, ops: { tarde: { ajustar: { 'Santo Bambino de Aracoeli': { titulo: 'Santa Maria in Aracoeli y el Santo Bambino', min: 30 } } } } },
      },
      lluvia_doc: 'la Cúpula sale (con lluvia no hay vista y la subida final es por fuera) y el Castillo empieza la mañana; más rato en los Capitolinos; la terraza del Altar, solo si escampa.',
      lluvia_ops: lluvia({ ops: { manana: { quitar: ['Cúpula de San Pedro'] }, tarde: { quitar: ['Terraza del Altar de la Patria'], ajustar: { 'Museos Capitolinos': { min: 150 } } } } }),
    },

    // ── La Vía Appia y Trastevere tranquilo ───────────────────────────────────────────────────────────────────────────────────────
    D7: {
      variantes: [
        { id: 'domingo_farnesina', doc: 'Domingo:** la Farnesina cierra: la mañana empieza en Santa Maria in Trastevere; Da Enzo cierra: Tonnarello.', cuando: { dia_semana: ['domingo'] }, ops: { manana: { ajustar: { "Campo de' Fiori": { modo: 'camino', min: 5 } }, cambiar: { 'Iglesia de Santa Maria in Trastevere': P('Santa Maria in Trastevere', 25, 'dentro') } } } },
      ],
      lluvia_doc: 'sin bici: la Vía Appia se ve en taxi hasta la tumba de Cecilia Metela (~30), y más rato en las Catacumbas, que son bajo tierra.',
      lluvia_ops: lluvia({ ops: { tarde: { cambiar: { 'Via Appia Antica': P('Vía Appia Antica en bici: los pinos, las tumbas y la de Cecilia Metela', 30, 'fuera', { titulo: 'La Vía Appia en taxi hasta la tumba de Cecilia Metela' }) }, ajustar: { 'Catacumbas de San Calixto': { min: 90 } } } } }),
    },
  },
}
