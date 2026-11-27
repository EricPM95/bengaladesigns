// V79 (apartados 1-2): datos de ejemplo del resumen del viaje (Roma y Lanzarote) para las capturas y la prueba con navegador. Con la misma forma que lo que manda el servidor (GET /api/logros/estado y /resumen).
export const EN = '2026-10-18T10:00:00Z'
const col = (id, nombre, total, vistos) => ({ id, nombre, n: vistos.length, total, completa: vistos.length === total, en_tu_ruta: true, nuevo_hoy: false, sitios: Array.from({ length: total }, (_, i) => ({ sitio: `s${i}`, visto: vistos.includes(`s${i}`), nombre: `Sitio ${i}` })) })
const SIN_PENDIENTE = { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, plazo_pasado: true, texto: null }
const g = (clave, logro, escalon, destino, extra = {}) => ({ clave, logro, escalon, destino, en: EN, ...extra })

export const ROMA = {
  estado: {
    ok: true, destino: 'roma', ciudad: 'Roma', puntito: false,
    sellos: [
      { id: 'roma', nombre: 'Roma', grado: 'oro', nombre_grado: 'Roma en el corazón', linea: null, n: 6, total: 8, siguiente: { grado: 'diamante', faltan: 2, nombre: 'Todos los caminos' }, alcanzados: ['bronce', 'plata', 'oro'] },
      { id: 'vaticano', nombre: 'El Vaticano', grado: 'plata', nombre_grado: 'Has cruzado la frontera', linea: null, n: 1, total: 3, siguiente: { grado: 'oro', faltan: 1, nombre: 'El Vaticano en el corazón' }, alcanzados: ['plata'] },
    ],
    colecciones: [col('imprescindibles', 'Los imprescindibles de Roma', 8, ['s0', 's1', 's2', 's3']), col('pais_mas_pequeno', 'El país más pequeño del mundo', 3, ['s0', 's1', 's2']), col('roma_antigua', 'La Roma antigua', 6, ['s0', 's1', 's2'])],
    secretos: { total: 14, encontrados: 5, texto: '', encontrados_lista: [{ id: 'foro_romano', nombre: 'Donde empezó todo', linea: '', en: EN }, { id: 'panteon', nombre: 'Bajo una cúpula de casi 2.000 años', linea: '', en: EN }, { id: 'fontana_de_trevi', nombre: 'Volverás a Roma', linea: '', en: EN }] },
    pendiente: SIN_PENDIENTE,
    viaje: { id: 'demo', inicio: '2026-10-13', fin: '2026-10-18', hoy: '2026-10-25' },
  },
  resumen: {
    ok: true,
    ganado: [
      g('roma|sello|roma:oro', 'sello', 'roma:oro', 'roma'), g('roma|sello|vaticano:plata', 'sello', 'vaticano:plata', 'roma'),
      ...['s0', 's1', 's2', 's3'].map((s) => g(`roma|pedazo|imprescindibles:${s}`, 'pedazo', `imprescindibles:${s}`, 'roma')),
      ...['s0', 's1', 's2'].map((s) => g(`roma|pedazo|pais_mas_pequeno:${s}`, 'pedazo', `pais_mas_pequeno:${s}`, 'roma')),
      ...['s0', 's1', 's2'].map((s) => g(`roma|pedazo|roma_antigua:${s}`, 'pedazo', `roma_antigua:${s}`, 'roma')),
      ...['foro_romano', 'panteon', 'fontana_de_trevi'].map((e) => g(`roma|emblema|${e}`, 'emblema', e, 'roma')),
      g('*|pais|Italia', 'pais', 'Italia', '*', { n: 4 }), g('roma|destino_nuevo|roma', 'destino_nuevo', 'roma', 'roma', { n: 1 }),
      g('*|viajero:paises|3', 'viajero:paises', '3', '*'), g('*|viajero:patrimonios|1', 'viajero:patrimonios', '1', '*'),
    ],
    por_categoria: {}, pendiente: SIN_PENDIENTE, texto_viaje: '', texto_viaje_tipo: 'wow',
  },
}

export const LANZAROTE = {
  estado: {
    ok: true, destino: 'lanzarote', ciudad: 'Lanzarote', puntito: false,
    sellos: [{ id: 'lanzarote', nombre: 'Lanzarote', grado: 'bronce', nombre_grado: 'Primeros pasos en Lanzarote', linea: null, n: 1, total: 7, siguiente: { grado: 'plata', faltan: 2, nombre: 'Lanzarote te atrapa' }, alcanzados: ['bronce'] }],
    colecciones: [col('lz_imprescindibles', 'Los imprescindibles de Lanzarote', 7, ['s0'])],
    secretos: { total: 11, encontrados: 1, texto: '', encontrados_lista: [{ id: 'timanfaya', nombre: 'El calor de la tierra', linea: '', en: EN }] },
    pendiente: SIN_PENDIENTE,
    viaje: { id: 'demo', inicio: '2026-11-23', fin: '2026-11-27', hoy: '2026-11-30' },
  },
  resumen: {
    ok: true,
    ganado: [
      g('lanzarote|sello|lanzarote:bronce', 'sello', 'lanzarote:bronce', 'lanzarote'), g('lanzarote|pedazo|lz_imprescindibles:s0', 'pedazo', 'lz_imprescindibles:s0', 'lanzarote'),
      g('lanzarote|emblema|timanfaya', 'emblema', 'timanfaya', 'lanzarote'),
      g('*|viajero:paises|1', 'viajero:paises', '1', '*'), g('*|viajero:destinos|1', 'viajero:destinos', '1', '*'),
    ],
    por_categoria: {}, pendiente: SIN_PENDIENTE, texto_viaje: '', texto_viaje_tipo: 'con_ganas',
  },
}

export const VIAJERO = {
  ok: true,
  logros: [
    { id: 'paises', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Primera medalla', ganado: true }, { n: 3, nombre: 'Trotamundos', ganado: true }] },
    { id: 'patrimonios', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Testigo de la historia', ganado: true }] },
    { id: 'destinos', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Primer destino', ganado: true }] },
  ],
}

/** Pocos logros (VL7b): solo la medalla y un pedazo; nada de emblemas, países ni logros de viajero. */
export function pocosLogros(d) {
  const c = JSON.parse(JSON.stringify(d))
  c.resumen.ganado = c.resumen.ganado.filter((x) => x.logro === 'sello' || x.logro === 'pedazo')
  c.estado.secretos.encontrados_lista = []
  c.estado.secretos.encontrados = 0
  return c
}
