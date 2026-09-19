/**
 * Ronda 5, Diseño 2 — paleta de color tenue por categoría de `tags` (ver Stop.tags en types.ts,
 * viene de `place.tags` en data/pipeline_v2/*.json). Varios alias de un mismo tono comparten fila
 * porque el JSON usa el nombre que mejor lee en cada contexto ("parque"/"jardín", "ruinas"/
 * "monumento"...) — un tag sin entrada aquí cae al gris neutro por defecto en vez de romper el render.
 */
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  parque: { bg: '#E8F5E9', text: '#2E7D32' },
  jardin: { bg: '#E8F5E9', text: '#2E7D32' },
  ruinas: { bg: '#EFEBE9', text: '#5D4037' },
  // Ronda 7, Issue D: antes compartía color con "ruinas" (#EFEBE9/#5D4037) — mismo marrón,
  // imposible distinguirlos de un vistazo. Ocre/arena propio, sigue leyendo como "piedra/histórico"
  // pero ya no se confunde con las ruinas.
  monumento: { bg: '#FFF3E0', text: '#E65100' },
  iglesia: { bg: '#F3E5F5', text: '#7B1FA2' },
  museo: { bg: '#E3F2FD', text: '#1565C0' },
  arte: { bg: '#E3F2FD', text: '#1565C0' },
  // Ronda 7, Issue C: el gris #F5F5F5/#616161 original apenas se distinguía del fondo de la
  // tarjeta — azul grisáceo, sigue leyendo "neutro" pero ya es visible.
  plaza: { bg: '#ECEFF1', text: '#546E7A' },
  calle: { bg: '#ECEFF1', text: '#546E7A' },
  barrio: { bg: '#ECEFF1', text: '#546E7A' },
  fuente: { bg: '#E0F7FA', text: '#00838F' },
  mirador: { bg: '#FFF8E1', text: '#F57F17' },
  gastronomia: { bg: '#FBE9E7', text: '#D84315' },
  mercado: { bg: '#FBE9E7', text: '#D84315' },
  curiosidad: { bg: '#FFFDE7', text: '#F9A825' },
  playa: { bg: '#FFF9C4', text: '#F57F17' },
  isla: { bg: '#FFF9C4', text: '#F57F17' },
}

const DEFAULT_TAG_COLOR = { bg: '#ECEFF1', text: '#546E7A' }

export function tagColor(tag: string): { bg: string; text: string } {
  return TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR
}

const TAG_LABELS: Record<string, string> = {
  jardin: 'Jardín',
  gastronomia: 'Gastronomía',
  curiosidad: 'Curiosidad',
}

/** "arte" → "Arte", salvo los pocos casos con tilde/forma propia (ver TAG_LABELS). */
export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? (tag.charAt(0).toUpperCase() + tag.slice(1))
}
