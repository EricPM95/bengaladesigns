// Pool y experiencias de los días escritos: lo que dice docs/dias/DIAS_ESCRITOS_ROMA.md y nada más. Lo que el documento no dice va como
// `pendiente` (el motor lo deja en «No incluido» y se pregunta).
// Acciones: cambiar / quitar / insertar (despues|antes: lugar, id, 'tipo:comida' o 'tipo:tour') / reemplazar_tarde / reemplazar_manana / tabla;
// `despues`: acciones que se hacen cuando ya están las horas (fuera_si_tarde).
// `tabla`: el documento trae la tabla entera de ese extra: { tablas: { A, AB, C, D, manana, CD… }, desde: 'comida' | 'dia' }; el motor elige la de la
// versión de la tarde de ese día (o 'manana' en un medio día de mañana). Sin tabla para esa versión, el extra no entra (`solo_en`).

const CAPITOLINOS = {
  franja: 'manana',
  cuando: { sin_dias: ['D5'] },
  acciones: [
    { op: 'insertar', despues: 'Plaza del Campidoglio', fila: { tipo: 'parada', lugar: 'Museos Capitolinos', min: 75, modo: 'dentro', guia: true } },
    { op: 'cambiar', fila: 'Altar de la Patria', modo: 'camino', min: 5 },
    { op: 'cambiar', fila: 'Barrio Judío', min: 20 },
  ],
  despues: [{ op: 'fuera_si_tarde', fila: 'Iglesia de San Luigi dei Francesi', desde: '18:00' }],
}
const BOCA = (despues) => ({ franja: 'tarde', acciones: [{ op: 'insertar', despues, fila: { tipo: 'parada', lugar: 'Boca de la Verdad', min: 15, modo: null } }] })
const TERMAS = (quitar) => ({
  franja: 'tarde',
  cuando: { sin_dias: ['D5', 'D5C'] },
  acciones: [
    { op: 'quitar', fila: quitar },
    { op: 'insertar', despues: 'tipo:comida', fila: [{ tipo: 'traslado', traslado: { como: 'un taxi', min: 'auto' } }, { tipo: 'parada', lugar: 'Termas de Caracalla', min: 60, modo: 'dentro' }, { tipo: 'traslado', traslado: { como: 'un taxi', min: 'auto' } }] },
  ],
})
const CUPULA = { franja: 'manana', acciones: [{ op: 'insertar', despues: 'Basílica de San Pedro', fila: { tipo: 'parada', lugar: 'Cúpula de San Pedro', min: 45, modo: 'dentro' } }] }
const CASTILLO_DENTRO = { franja: 'tarde', acciones: [{ op: 'cambiar', fila: "Castillo de Sant'Angelo", modo: 'dentro', min: 60 }] }
const MERCADILLOS = { fechas: { desde: '12-08', hasta: '01-06' } }
const BAMBINO = { op: 'insertar', despues: 'Plaza del Campidoglio', fila: { tipo: 'parada', lugar: 'Santo Bambino de Aracoeli', min: 5, modo: 'camino' } }

const copia = (rows) => rows.map((row) => ({ ...row }))
const hastaIncluido = (rows, lugar) => rows.slice(0, rows.findIndex((row) => row.lugar === lugar) + 1)
const desdeLugar = (rows, lugar) => rows.slice(rows.findIndex((row) => row.lugar === lugar))
const cabezaAntesDeCena = (rows) => rows.slice(0, rows.findIndex((row) => row.tipo === 'cena'))
const desdeCena = (rows) => rows.slice(rows.findIndex((row) => row.tipo === 'cena'))
const conModo = (rows, lugar, modo) => rows.map((row) => (row.lugar === lugar && row.tipo === 'parada' ? { ...row, modo } : row))

export function anadirExtras(out, { T }) {
  const d1 = out['D1'].versiones.normal
  const d1ft = out['D1-FT'].versiones.normal
  // La mañana del Día de la Roma antigua (hasta la comida, sin ella): la que lleva el viaje de 1,5 días con el Coliseo en el pool.
  const mananaD1 = copia(d1.AB.slice(0, d1.AB.findIndex((row) => row.tipo === 'comida')))

  // ── Lo que le va mal a cada día en una fecha (orden de los días: si se puede cambiar con otro día del viaje, se cambian) ──────────────
  const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
  out['D2'].fechas_malas = { dias_semana: ['domingo', 'miercoles'], cerrado: [MUSEOS] }
  out['D3'].fechas_malas = { dias_semana: ['domingo'], cerrado: [MUSEOS] }
  out['D1'].fechas_malas = { fechas: ['06-02', '12-25'] }
  out['D1-FT'].fechas_malas = { fechas: ['06-02', '12-25'] }
  // Si no cabe todo, se quita por este orden (Roma en un día; sin pool nunca se quitan San Pedro, el Panteón, Trevi ni el Coliseo).
  out['D0'].orden_quitar = ['Via dei Fori Imperiali', 'Via della Conciliazione', 'Foro Romano y Palatino', 'Plaza del Campidoglio', 'Altar de la Patria']

  // ── D1: el Día de la Roma antigua (2 días) ──────────────────────────────────────────────────
  // (Los extras con tabla escrita para las tardes A y B: en C, igual; en D, hasta San Luigi y luego la tarde D desde Piazza Navona.)
  const tablasD1 = (rows) => ({ AB: rows, C: copia(rows), D: [...hastaIncluido(rows, 'Iglesia de San Luigi dei Francesi'), ...copia(desdeLugar(d1.D, 'Piazza Navona'))] })
  const galeriaD1 = T(15)
  const galeriaC = conModo(galeriaD1, 'Terraza del Pincio', 'atardecer')
  // (Tarde D: igual, con la cena a las 20:30 y solo Trevi de noche: la Plaza de España pasaría de las 23:00.)
  const galeriaD = galeriaC.filter((row) => row.noche !== 'Plaza de España (noche)').map((row) => (row.tipo === 'cena' ? { ...row, hora: '20:30' } : row))
  const parque = T(18)
  out['D1'].pool = {
    'Museos Capitolinos': CAPITOLINOS,
    'Termas de Caracalla': TERMAS(['Barrio Judío', 'Fuente de las Tortugas', 'Largo di Torre Argentina']),
    'Galería Borghese': { franja: 'tarde', cuando: { sin_dias: ['D4'] }, acciones: [{ op: 'tabla', desde: 'comida', tablas: { AB: galeriaD1, C: galeriaC, D: galeriaD } }] },
    'Boca de la Verdad': BOCA('Barrio Judío'),
    'Ojo de la Cerradura del Aventino': { franja: 'tarde', acciones: [{ op: 'tabla', desde: 'comida', tablas: tablasD1(T(16)) }] },
    'Basílica de San Juan de Letrán': { franja: 'dia', cuando: { sin_dias: ['D4M', 'D5C'] }, acciones: [{ op: 'tabla', desde: 'dia', tablas: tablasD1(T(17)) }] },
    'Parque de Villa Borghese': { franja: 'tarde', solo_en: ['C', 'D'], acciones: [{ op: 'tabla', desde: 'comida', tablas: { C: parque, D: copia(parque) } }] },
  }
  out['D1'].experiencias = {
    arte_museos: CAPITOLINOS,
    barrios_sabores: { acciones: [{ op: 'cambiar', fila: 'Barrio Judío', min: 45 }] },
    naturaleza_vistas: { acciones: [{ op: 'cambiar', fila: 'Altar de la Patria', min: 60 }] },
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 40, titulo: 'Piazza Navona y su mercadillo navideño' }, BAMBINO] },
  }

  // ── D1-corto: el día entero del viaje de 1,5 días (todo por fuera) ──────────────────────────────
  // «Con el Coliseo en el pool o con reserva: la mañana es la del Día de la Roma antigua y la comida en el Barrio Judío; la Boca de la Verdad y la
  // Isla Tiberina se quitan, y la tarde sigue igual con las horas corridas por los márgenes.»
  const mananaConColiseo = { franja: 'manana', ya_si_dentro: 'Coliseo', acciones: [{ op: 'reemplazar_manana', filas: mananaD1 }] }
  out['D1-corto'].pool = {
    'Coliseo': mananaConColiseo,
    'Foro Romano y Palatino': { ...mananaConColiseo, ya_si_dentro: 'Foro Romano y Palatino' },
  }
  out['D1-corto'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 40, titulo: 'Piazza Navona y su mercadillo navideño' }, { op: 'insertar', despues: 'Plaza del Campidoglio', fila: { tipo: 'parada', lugar: 'Santo Bambino de Aracoeli', min: 5, modo: 'camino' } }] },
  }

  // ── D2: el Día del Vaticano y Trastevere ───────────────────────────────────────────────────
  out['D2'].pool = { 'Cúpula de San Pedro': CUPULA, "Castillo de Sant'Angelo": CASTILLO_DENTRO }
  out['D2'].experiencias = {
    arte_museos: { acciones: [{ op: 'cambiar', fila: 'Museos Vaticanos y Capilla Sixtina', min: 240 }] },
    barrios_sabores: { acciones: [{ op: 'insertar', antes: 'tipo:comida', fila: { tipo: 'paseo', lugar: 'Borgo Pio', titulo: 'Pasea y piérdete por Borgo Pio', min: 30 } }] },
    naturaleza_vistas: CUPULA,
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Plaza de San Pedro', min: 40, titulo: 'Plaza de San Pedro y los 100 Presepi' }] },
  }

  // ── D0 ──────────────────────────────────────────────────────────────────────────────────────
  out['D0'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 35, titulo: 'Piazza Navona y su mercadillo navideño' }] },
  }

  // ── D0-medio ────────────────────────────────────────────────────────────────────────────────
  out['D0-medio'].pool = { 'Cúpula de San Pedro': CUPULA, "Castillo de Sant'Angelo": CASTILLO_DENTRO }
  out['D0-medio'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 40, titulo: 'Piazza Navona y su mercadillo navideño' }, { op: 'cambiar', fila: 'Plaza de San Pedro', min: 35, titulo: 'Plaza de San Pedro y los 100 Presepi' }] },
  }

  // ── D3 ──────────────────────────────────────────────────────────────────────────────────────
  out['D3'].pool = { 'Cúpula de San Pedro': { no_cabe: true }, "Castillo de Sant'Angelo": { no_cabe: true } }
  out['D3'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Plaza de San Pedro', min: 25, titulo: 'Plaza de San Pedro y los 100 Presepi' }, { op: 'insertar', despues: 'tipo:tour', fila: { tipo: 'parada', lugar: 'Piazza Navona', min: 15, titulo: 'Piazza Navona y su mercadillo navideño' } }] },
    barrios_sabores: { acciones: [{ op: 'cambiar', fila: 'Pasea y piérdete por Prati', titulo: 'Pasea y piérdete por Prati, con Via Cola di Rienzo' }] },
  }

  // ── D1-FT ───────────────────────────────────────────────────────────────────────────────────
  // (Con tabla en la tarde A; en B, C y D, la cabeza de esa tabla y la cena y la noche de su versión.)
  const tablasFT = (rows) => ({ A: rows, B: [...cabezaAntesDeCena(rows), ...copia(desdeCena(d1ft.B))], C: [...cabezaAntesDeCena(rows), ...copia(desdeCena(d1ft.C))], D: [...cabezaAntesDeCena(rows), ...copia(desdeCena(d1ft.D))] })
  out['D1-FT'].pool = {
    'Boca de la Verdad': BOCA('Isla Tiberina'),
    'Museos Capitolinos': CAPITOLINOS,
    'Termas de Caracalla': TERMAS(['Barrio Judío']),
    'Galería Borghese': { franja: 'tarde', acciones: [{ op: 'tabla', desde: 'comida', tablas: { A: T(31), B: T(31), C: T(31), D: T(31) } }] },
    'Ojo de la Cerradura del Aventino': { franja: 'tarde', acciones: [{ op: 'tabla', desde: 'comida', tablas: tablasFT(T(29)) }] },
    'Basílica de San Juan de Letrán': { franja: 'dia', acciones: [{ op: 'tabla', desde: 'dia', tablas: tablasFT(T(30)) }] },
  }
  out['D1-FT'].experiencias = {
    arte_museos: CAPITOLINOS,
    naturaleza_vistas: { acciones: [{ op: 'cambiar', fila: 'Altar de la Patria', min: 60 }] },
    // «El Barrio Judío pasa de 25 a 45 min y el colchón de Trastevere se acorta 20 min (si no queda colchón, se quita la Isla Tiberina).»
    barrios_sabores: { orden: ['Isla Tiberina'], acciones: [{ op: 'cambiar', fila: 'Barrio Judío', min: 45 }] },
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [BAMBINO] },
  }

  // ── DT-medio: medio día del Tridente y el Pincio (2,5 días) ─────────────────────────────────────
  const galeriaTM = T(38)
  const galeriaTAB = T(39)
  const galeriaTCD = T(40)
  const parqueTB = T(41)
  out['DT-medio'].pool = {
    // (Va en el medio día aunque el Día de la Roma antigua también la lleve: lo dice el documento, «Pool» de este día. `prioridad`: gana al otro sitio.)
    'Galería Borghese': { prioridad: 1, acciones: [{ op: 'tabla', desde: 'dia', tablas: { manana: galeriaTM, A: galeriaTAB, B: copia(galeriaTAB), C: galeriaTCD, D: copia(galeriaTCD) } }] },
    // (En C y D el parque ya va como colchón: «ya incluido»; en A no hay luz: no entra.)
    'Parque de Villa Borghese': { prioridad: 1, solo_en: ['B'], incluido_en: ['C', 'D'], acciones: [{ op: 'tabla', desde: 'dia', tablas: { B: parqueTB } }] },
  }
  out['DT-medio'].experiencias = {
    naturaleza_vistas: { solo_en: ['B'], acciones: [{ op: 'tabla', desde: 'dia', tablas: { B: copia(parqueTB) } }] },
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Pasea y piérdete por Via Condotti y el Tridente iluminados', lugar: 'Luces de Navidad del Tridente', titulo: 'Luces de Navidad del Tridente', texto: null }] },
  }

  // ── DM-medio: medio día de Monti ────────────────────────────────────────────────────────────
  out['DM-medio'].pool = { 'Basílica de San Juan de Letrán': { prioridad: 1, acciones: [{ op: 'tabla', desde: 'dia', tablas: { manana: T(43) } }] } }
  out['DM-medio'].experiencias = {
    barrios_sabores: { acciones: [{ op: 'cambiar', fila: 'Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti)', min: 75 }] },
  }
}

/**
 * Alternativas de comida que el documento no escribe y el usuario pidió elegir (5-oct-2026): Borghiciana cierra los domingos, así que en el
 * D2 su alternativa es un restaurante de la misma zona (Vaticano / Borgo) que abre los domingos. (Desde la tanda 2 todas las comidas llevan
 * su alternativa escrita; esto solo queda por si el documento deja alguna sin ella.)
 */
export function completarAlternativas(out) {
  for (const day of Object.values(out)) {
    for (const grupo of Object.values(day.versiones ?? {})) {
      for (const filas of Object.values(grupo)) {
        for (const fila of filas) {
          if (fila.tipo === 'comida' && fila.restaurante === 'Borghiciana Pastificio Artigianale' && !fila.alternativa) fila.alternativa = '200 Gradi'
        }
      }
    }
  }
}
