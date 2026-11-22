/**
 * (V40) DE QUÉ ANIMACIÓN DEL ESTUDIO ES UN SONIDO DE LA APP. El estudio de sonidos guarda lo de Eric por ANIMACIÓN (`data/sonidos/estudio.json`); la app pide sonidos por partitura (`sonar('emblema')`).
 * Esta función pura los une: la partitura por defecto, y para las que sirven a varias tarjetas (el emblema de Roma, el del Coliseo y el de Lanzarote; una, dos o tres colecciones a la vez; la maravilla nueva 1 y 4)
 * mira los momentos que se están enseñando, igual que las tarjetas del estudio.
 */
interface MomentoMinimo {
  tipo?: string
  id?: unknown
  destino?: unknown
  n?: unknown
  coleccion?: unknown
}
const POR_DEFECTO: Record<string, string> = {
  medalla_bronce: 'medalla_bronce',
  medalla_plata: 'medalla_plata',
  medalla_oro: 'medalla_oro',
  medalla_diamante: 'medalla_diamante',
  coleccion: 'coleccion',
  emblema: 'emblema',
  maravilla: 'maravilla',
  maravilla_nueva: 'maravilla_nueva',
  pais: 'pais',
  patrimonio: 'patrimonio',
  viajero: 'viajero',
  pedazo: 'pedazo',
  sello_pasaporte: 'sello',
  dia_completo: 'resumen_dia',
  primer_dia: 'primer_dia',
  vuelo: 'vuelo',
  visto: 'visto',
  aviso: 'aviso',
  fuegos: 'fuegos',
}
/** La escena (la película de un emblema) sigue con la animación que ya suena: no tiene tarjeta propia. */
export function animacionDe(sonido: string, momentos: MomentoMinimo[] = []): string | null {
  if (sonido === 'escena') return null
  if (sonido === 'emblema') {
    const e = momentos.find((m) => m.tipo === 'emblema')
    if (e?.id === 'coliseo') return 'emblema_maravilla'
    if (e?.destino === 'lanzarote') return 'emblema_lanzarote'
    return 'emblema'
  }
  if (sonido === 'coleccion') return momentos.some((m) => m.tipo === 'coleccion' && m.id === 'imprescindibles') ? 'coleccion_imprescindibles' : 'coleccion'
  if (sonido === 'pedazo') {
    const n = new Set(momentos.filter((m) => m.tipo === 'suma').map((m) => String(m.coleccion ?? ''))).size
    return n >= 3 ? 'pedazo_tres' : n === 2 ? 'pedazo_dos' : 'pedazo'
  }
  if (sonido === 'maravilla_nueva') return momentos.some((m) => m.tipo === 'maravilla' && Number(m.n ?? 0) === 4) ? 'maravilla_nueva_cuatro' : 'maravilla_nueva'
  return POR_DEFECTO[sonido] ?? null
}
/** Los que suenan sueltos, sin quedarse con la animación (el estudio vuelve a lo de antes): no cambian lo que se está enseñando. */
export const SONIDOS_EFIMEROS = ['vuelo', 'visto', 'aviso']
