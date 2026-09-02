export interface CuratedRoute {
  id: string
  nombre: string
  nombres_alternativos: string[]
  pais_region: string
  punto_inicio: { ciudad: string; geocodable: boolean }
  punto_fin: { ciudad: string; geocodable: boolean }
  duracion_tipica_dias: [number, number]
  apto_camper_autocaravana: boolean
  notas: string
}

/**
 * Rutas panorámicas/carreteras conocidas que Mapbox no puede geocodificar directamente (son
 * corredores, no puntos) — usadas por el buscador "¿No encuentras tu destino?" antes de recurrir
 * a Claude como fallback. `apto_camper_autocaravana` alimenta directamente el filtro de vehículo
 * de roadtrip_exclusivo, sin necesidad de volver a preguntárselo a Claude.
 */
export const rutasCuradas: CuratedRoute[] = [
  {
    id: 'ruta_66',
    nombre: 'Ruta 66',
    nombres_alternativos: ['Route 66', 'Historic Route 66', 'Main Street of America'],
    pais_region: 'Estados Unidos',
    punto_inicio: { ciudad: 'Chicago, Illinois', geocodable: true },
    punto_fin: { ciudad: 'Los Ángeles, California', geocodable: true },
    duracion_tipica_dias: [10, 14],
    apto_camper_autocaravana: true,
    notas: 'Carreteras amplias, sin restricciones de tamaño de vehículo. Se puede hacer completa o por tramos.',
  },
  {
    id: 'ruta_40',
    nombre: 'Ruta 40 (RN40)',
    nombres_alternativos: ['Ruta Nacional 40', 'Ruta 40 Argentina'],
    pais_region: 'Argentina (Patagonia)',
    punto_inicio: { ciudad: 'Bariloche', geocodable: true },
    punto_fin: { ciudad: 'El Calafate', geocodable: true },
    duracion_tipica_dias: [7, 12],
    apto_camper_autocaravana: true,
    notas: 'Tramos largos sin asistencia — recomendable repostar siempre que se pueda. Apto camper con precaución en pistas de ripio.',
  },
  {
    id: 'garden_route',
    nombre: 'Garden Route',
    nombres_alternativos: ['Ruta Jardín', 'N2 Garden Route'],
    pais_region: 'Sudáfrica',
    punto_inicio: { ciudad: 'Ciudad del Cabo', geocodable: true },
    punto_fin: { ciudad: 'Port Elizabeth (Gqeberha)', geocodable: true },
    duracion_tipica_dias: [5, 8],
    apto_camper_autocaravana: true,
    notas: 'Buena infraestructura de carretera. Camping y autocaravana muy habituales en la zona.',
  },
  {
    id: 'great_ocean_road',
    nombre: 'Great Ocean Road',
    nombres_alternativos: ['Gran Carretera Oceánica'],
    pais_region: 'Australia (Victoria)',
    punto_inicio: { ciudad: 'Melbourne', geocodable: true },
    punto_fin: { ciudad: 'Allansford / Warrnambool', geocodable: true },
    duracion_tipica_dias: [3, 5],
    apto_camper_autocaravana: true,
    notas: 'Carretera costera sinuosa pero amplia, muy transitada por campervans.',
  },
  {
    id: 'wild_atlantic_way',
    nombre: 'Wild Atlantic Way',
    nombres_alternativos: ['Ruta Atlántica Salvaje'],
    pais_region: 'Irlanda',
    punto_inicio: { ciudad: 'Kinsale', geocodable: true },
    punto_fin: { ciudad: 'Derry', geocodable: true },
    duracion_tipica_dias: [7, 12],
    apto_camper_autocaravana: false,
    notas:
      'Muchos tramos con carreteras estrechas de un solo carril (single-track roads), especialmente en penínsulas como Dingle o Ring of Kerry. Autocaravanas grandes tienen problemas reales de cruce. Recomendable coche o camper pequeña.',
  },
  {
    id: 'ring_of_kerry',
    nombre: 'Ring of Kerry',
    nombres_alternativos: [],
    pais_region: 'Irlanda',
    punto_inicio: { ciudad: 'Killarney', geocodable: true },
    punto_fin: { ciudad: 'Killarney', geocodable: true },
    duracion_tipica_dias: [1, 2],
    apto_camper_autocaravana: false,
    notas: 'Circuito circular, tramos estrechos, tráfico de autobuses turísticos en un único sentido en temporada alta. No apto vehículos grandes.',
  },
  {
    id: 'costa_amalfitana',
    nombre: 'Costa Amalfitana (SS163)',
    nombres_alternativos: ['Amalfi Coast Drive'],
    pais_region: 'Italia (Campania)',
    punto_inicio: { ciudad: 'Sorrento', geocodable: true },
    punto_fin: { ciudad: 'Salerno', geocodable: true },
    duracion_tipica_dias: [2, 4],
    apto_camper_autocaravana: false,
    notas: 'Curvas muy cerradas, carretera estrecha en acantilado. Restricciones reales de acceso para vehículos grandes en ciertos tramos y horarios.',
  },
  {
    id: 'islandia_ring_road',
    nombre: 'Ring Road (Ruta 1)',
    nombres_alternativos: ['Route 1 Iceland', 'Hringvegur'],
    pais_region: 'Islandia',
    punto_inicio: { ciudad: 'Reikiavik', geocodable: true },
    punto_fin: { ciudad: 'Reikiavik', geocodable: true },
    duracion_tipica_dias: [7, 10],
    apto_camper_autocaravana: true,
    notas: 'Circuito circular. Muy popular en camper/autocaravana; red de campings homologados extensa. Cuidado en invierno con pistas F (solo 4x4).',
  },
  {
    id: 'dolomitas_grande_strada',
    nombre: 'Grande Strada delle Dolomiti',
    nombres_alternativos: ['Ruta de los Passos Dolomitici'],
    pais_region: 'Italia (Trentino-Alto Adigio / Véneto)',
    punto_inicio: { ciudad: 'Bolzano', geocodable: true },
    punto_fin: { ciudad: "Cortina d'Ampezzo", geocodable: true },
    duracion_tipica_dias: [3, 6],
    apto_camper_autocaravana: true,
    notas: 'Puertos de montaña con muchas curvas pero carretera ancha y bien mantenida. Apto camper, con precaución en pasos de alta montaña (Passo Stelvio, etc.).',
  },
  {
    id: 'route_des_grandes_alpes',
    nombre: 'Route des Grandes Alpes',
    nombres_alternativos: ['Gran Ruta de los Alpes'],
    pais_region: 'Francia',
    punto_inicio: { ciudad: 'Thonon-les-Bains', geocodable: true },
    punto_fin: { ciudad: 'Niza', geocodable: true },
    duracion_tipica_dias: [4, 7],
    apto_camper_autocaravana: true,
    notas: 'Cruza varios de los puertos alpinos más altos de Europa. Apto camper salvo en algún puerto puntual cerrado a vehículos grandes (verificar temporada).',
  },
  {
    id: 'north_coast_500',
    nombre: 'North Coast 500 (NC500)',
    nombres_alternativos: ['Ruta NC500', 'Highlands Coastal Route'],
    pais_region: 'Escocia (Highlands)',
    punto_inicio: { ciudad: 'Inverness', geocodable: true },
    punto_fin: { ciudad: 'Inverness', geocodable: true },
    duracion_tipica_dias: [5, 8],
    apto_camper_autocaravana: false,
    notas:
      'Circuito circular con muchos tramos de single-track road (un solo carril con apartaderos). Autocaravanas grandes generan problemas de tráfico reales y quejas locales documentadas. Recomendable coche o camper pequeña.',
  },
  {
    id: 'transfagarasan',
    nombre: 'Transfăgărășan',
    nombres_alternativos: ['DN7C'],
    pais_region: 'Rumanía (Cárpatos)',
    punto_inicio: { ciudad: 'Sibiu', geocodable: true },
    punto_fin: { ciudad: 'Pitești', geocodable: true },
    duracion_tipica_dias: [1, 2],
    apto_camper_autocaravana: true,
    notas: 'Carretera de montaña espectacular, ancha en la mayoría de tramos. Cerrada por nieve gran parte del año (normalmente solo abierta finales de junio a octubre — comprobar temporada).',
  },
]

const DIACRITICS_PATTERN = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), 'g')

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Busca una coincidencia (exacta o de contención razonable) contra nombre/nombres_alternativos de la lista curada. */
export function findCuratedRoute(query: string): CuratedRoute | null {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return null

  for (const route of rutasCuradas) {
    const candidates = [route.nombre, ...route.nombres_alternativos]
    if (candidates.some((candidate) => normalize(candidate) === normalizedQuery)) return route
  }

  if (normalizedQuery.length < 4) return null

  for (const route of rutasCuradas) {
    const candidates = [route.nombre, ...route.nombres_alternativos]
    const match = candidates.some((candidate) => {
      const normalizedCandidate = normalize(candidate)
      return normalizedCandidate.length >= 4 && (normalizedQuery.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedQuery))
    })
    if (match) return route
  }

  return null
}
