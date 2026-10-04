// Pool y experiencias de los días escritos: lo que dice docs/dias/DIAS_ESCRITOS_ROMA.md y nada más. Lo que el documento no dice va como
// `pendiente` (el motor lo deja en «No incluido» y se pregunta).
// Acciones: cambiar / quitar / insertar (despues|antes: lugar, id, 'tipo:comida' o 'tipo:tour') / reemplazar_tarde; `despues`: acciones que
// se hacen cuando ya están las horas (fuera_si_tarde).

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

export function anadirExtras(out) {
  out['D1'].pool = {
    'Museos Capitolinos': CAPITOLINOS,
    'Termas de Caracalla': TERMAS(['Barrio Judío', 'Fuente de las Tortugas', 'Largo di Torre Argentina']),
    'Galería Borghese': {
      franja: 'tarde',
      cuando: { sin_dias: ['D4'] },
      acciones: [
        {
          op: 'reemplazar_tarde',
          filas: [
            { tipo: 'parada', lugar: 'Panteón', min: 30, modo: 'dentro' },
            { tipo: 'parada', lugar: 'Elefantino de Bernini', min: 5, modo: 'camino' },
            { tipo: 'parada', lugar: 'Iglesia de Santa Maria sopra Minerva', min: 5, modo: 'camino' },
            { tipo: 'parada', lugar: 'Iglesia de San Luigi dei Francesi', min: 20, modo: 'dentro' },
            { tipo: 'parada', lugar: 'Piazza Navona', min: 30, modo: null },
            { tipo: 'traslado', traslado: { como: 'un taxi', min: 'auto' } },
            { tipo: 'parada', lugar: 'Galería Borghese', min: 120, modo: 'dentro', hora: '17:00', hora_tipo: 'turno', turno: true, guia: true },
            { tipo: 'parada', lugar: 'Terraza del Pincio', min: 20, modo: null, minutos_de_la_ficha: true },
            { tipo: 'cena', restaurante: 'Il Gabriello', min: 90, flujo: true },
            { tipo: 'noche', noche: 'Plaza de España (noche)', min: 20 },
            { tipo: 'noche', noche: 'Fontana de Trevi (noche)', min: 20 },
          ],
        },
      ],
    },
    'Boca de la Verdad': BOCA('Barrio Judío'),
    'Ojo de la Cerradura del Aventino': { pendiente: 'El documento no dice qué pasa con la Fuente de las Tortugas y Largo di Torre Argentina, ni los minutos del taxi.' },
    'Basílica de San Juan de Letrán': { pendiente: 'El documento no dice los minutos del metro ni a qué hora acaba el día.' },
  }
  out['D1'].experiencias = {
    arte_museos: CAPITOLINOS,
    barrios_sabores: { acciones: [{ op: 'cambiar', fila: 'Barrio Judío', min: 45 }] },
    naturaleza_vistas: { acciones: [{ op: 'cambiar', fila: 'Altar de la Patria', min: 60 }] },
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 40, titulo: 'Piazza Navona y su mercadillo navideño' }, BAMBINO] },
  }
  out['D2'].pool = { 'Cúpula de San Pedro': CUPULA, "Castillo de Sant'Angelo": CASTILLO_DENTRO }
  out['D2'].experiencias = {
    arte_museos: { acciones: [{ op: 'cambiar', fila: 'Museos Vaticanos y Capilla Sixtina', min: 240 }] },
    barrios_sabores: { acciones: [{ op: 'insertar', antes: 'tipo:comida', fila: { tipo: 'paseo', lugar: 'Borgo Pio', titulo: 'Pasea y piérdete por Borgo Pio', min: 30 } }] },
    naturaleza_vistas: CUPULA,
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Plaza de San Pedro', min: 40, titulo: 'Plaza de San Pedro y los 100 Presepi' }] },
  }
  out['D0'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Piazza Navona', min: 35, titulo: 'Piazza Navona y su mercadillo navideño' }] },
  }
  out['D0-medio'].pool = { 'Cúpula de San Pedro': CUPULA, "Castillo de Sant'Angelo": CASTILLO_DENTRO }
  out['D3'].pool = { 'Cúpula de San Pedro': { no_cabe: true }, "Castillo de Sant'Angelo": { no_cabe: true } }
  out['D3'].experiencias = {
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [{ op: 'cambiar', fila: 'Plaza de San Pedro', min: 25, titulo: 'Plaza de San Pedro y los 100 Presepi' }, { op: 'insertar', despues: 'tipo:tour', fila: { tipo: 'parada', lugar: 'Piazza Navona', min: 15, titulo: 'Piazza Navona y su mercadillo navideño' } }] },
    barrios_sabores: { acciones: [{ op: 'cambiar', fila: 'Pasea y piérdete por Prati', titulo: 'Pasea y piérdete por Prati, con Via Cola di Rienzo' }] },
  }
  out['D1-FT'].pool = {
    'Boca de la Verdad': BOCA('Isla Tiberina'),
    'Museos Capitolinos': CAPITOLINOS,
    'Termas de Caracalla': TERMAS(['Barrio Judío']),
    'Galería Borghese': { pendiente: 'El documento no dice los minutos del parque ni del Pincio, ni la hora de la cena en el Tridente.' },
    'Ojo de la Cerradura del Aventino': { pendiente: 'El documento no dice los minutos del taxi al Tempietto.' },
    'Basílica de San Juan de Letrán': { pendiente: 'Como en el D1: falta el metro y la hora de acabar.' },
  }
  out['D1-FT'].experiencias = {
    arte_museos: CAPITOLINOS,
    naturaleza_vistas: { acciones: [{ op: 'cambiar', fila: 'Altar de la Patria', min: 60 }] },
    barrios_sabores: { pendiente: 'El documento dice «el Barrio Judío 45 y el colchón de Trastevere más largo», sin decir cuánto.' },
    mercadillos_navidenos: { ...MERCADILLOS, acciones: [BAMBINO] },
  }
}
