import type { EstadoLogros, ColeccionDeEstado } from '../../components/logros/momentos/api'
import type { Momento } from '../logros'
import romaLogros from '../../../data/logros/roma.json'

/**
 * (V37C) EL ESTADO DE EJEMPLO DEL ESTUDIO DE SONIDOS (/admin/sonidos). Las pantallas de «Colección completa» y «Pedazo nuevo» pintan la insignia con lo que el viajero YA había visto (el `estado` que pide la app al servidor);
 * sin él salían vacías («0 DE 0») y no volaba ningún pedazo. Aquí hay un estado creíble por tarjeta, con las colecciones REALES de Roma (`data/logros/roma.json`: nombre y sitios en su orden).
 * Vive SOLO en el estudio: no se pide a ninguna cuenta ni a la base de datos (el visor lo pone en `datosDePrueba.estado`, el mismo gancho que usa la demo de logros, y con eso `pedirEstado` ni siquiera sale a la red).
 * El estado es el de DESPUÉS de ganarlo (como en la app): la insignia quita sola el pedazo nuevo para enseñar el «antes».
 */
const EN = '2026-11-20T10:00:00.000Z'
const COLECCIONES = romaLogros.colecciones as unknown as { id: string; nombre: string; al_completar?: string; sitios: string[] }[]
const dato = (id: string) => {
  const c = COLECCIONES.find((x) => x.id === id)
  if (!c) throw new Error(`ejemploEstado: no hay colección ${id} en data/logros/roma.json`)
  return c
}

/** Una colección de Roma con los sitios que se han visto (en el orden de los datos, el que usa la insignia). */
const col = (id: string, vistos: string[]): ColeccionDeEstado => {
  const c = dato(id)
  return { id, nombre: c.nombre, n: vistos.length, total: c.sitios.length, completa: vistos.length === c.sitios.length, en_tu_ruta: true, nuevo_hoy: true, sitios: c.sitios.map((s) => ({ sitio: s, visto: vistos.includes(s) })) }
}

const TOTAL_SECRETOS = romaLogros.emblemas.length
const estado = (colecciones: ColeccionDeEstado[], extra: Partial<EstadoLogros> = {}): EstadoLogros => ({
  ok: true,
  destino: 'roma',
  ciudad: 'Roma',
  sellos: [{ id: 'roma', nombre: 'Roma', grado: 'bronce', nombre_grado: 'Primeros pasos en Roma', linea: 'Has visto tu primer imprescindible.', n: 1, total: 8, siguiente: null, alcanzados: ['bronce'] }],
  colecciones,
  secretos: { total: TOTAL_SECRETOS, encontrados: 1, texto: `1 de ${TOTAL_SECRETOS} secretos encontrados`, encontrados_lista: [{ id: 'coliseo', nombre: '', linea: '', en: EN }] },
  pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null },
  puntito: false,
  viaje: { id: 'estudio', inicio: '2026-11-18', fin: '2026-11-21', hoy: '2026-11-20' },
  ...extra,
})

const imprescindibles = dato('imprescindibles').sitios
const joyas = dato('cuatro_joyas').sitios

/** El estado que se pone mientras se ve cada tarjeta del estudio (la clave es el `momentos` de la animación, o su id). Las que no dependen del estado no están. */
export const ESTADO_DEL_ESTUDIO: Record<string, () => EstadoLogros> = {
  // Las 4 joyas: tenía 3 de 4 y se cierra con la última (el trozo que vuela es el último de los datos).
  coleccion: () => estado([col('cuatro_joyas', joyas)]),
  // Los imprescindibles: 7 de 8 → 8 de 8.
  coleccion_imprescindibles: () => estado([col('imprescindibles', imprescindibles)]),
  // Los miradores: 1 de 3 → 2 de 3 (encaja el Janículo).
  pedazo: () => estado([col('miradores', ['terraza_del_pincio', 'mirador_del_janiculo'])]),
  // El Coliseo suma a la vez en dos colecciones (después de ganarlo: 2 de 8 y 2 de 6).
  pedazo_dos: () => estado([col('imprescindibles', ['coliseo', 'piazza_navona']), col('roma_antigua', ['coliseo', 'circo_maximo'])]),
  // El resumen del día: la ciudad, la medalla de la ciudad y la línea de secretos salen de aquí.
  resumen_dia: () => estado([col('imprescindibles', ['coliseo']), col('cuatro_joyas', ['coliseo']), col('roma_antigua', ['coliseo'])], { pendiente: { sorpresas: 2, pedazos: 0, dias_para_reclamar: 27, texto: 'Te quedan 27 días para reclamar tus 2 sorpresas de Roma' } }),
}

/** Los momentos de ejemplo de estas tarjetas (los mismos que ganaría el viajero de ese estado). */
const m = (o: Record<string, unknown>): Momento => ({ nombre: '', primera_vez: true, en: EN, ...o }) as unknown as Momento
const suma = (coleccion: string, n: number, sitios: string[]): Momento => {
  const c = dato(coleccion)
  return m({ tipo: 'suma', cat: 'pedazo', coleccion, destino: 'roma', nombre: c.nombre, n, total: c.sitios.length, sitios, linea: `${n} de ${c.sitios.length}` })
}
const completa = (id: string, linea: string): Momento => m({ tipo: 'coleccion', cat: 'coleccion', clave: `demo|coleccion|${id}`, id, destino: 'roma', nombre: dato(id).nombre, linea })

export const MOMENTOS_DE_COLECCIONES: Record<string, () => Momento[]> = {
  coleccion: () => [completa('cuatro_joyas', 'Cuatro joyas, cuatro recuerdos para siempre.')],
  coleccion_imprescindibles: () => [completa('imprescindibles', 'Lo esencial de Roma, visto.')],
  pedazo: () => [suma('miradores', 2, ['mirador_del_janiculo'])],
  pedazo_dos: () => [suma('imprescindibles', 2, ['coliseo']), suma('roma_antigua', 2, ['coliseo'])],
}
