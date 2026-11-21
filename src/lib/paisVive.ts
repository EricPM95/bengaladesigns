import { llamar } from './logros'

/**
 * (V35B) «¿EN QUÉ PAÍS VIVES?». La cuarta pregunta de la primera vez y un ajuste en Ajustes. Es opcional y se guarda en `viajero_primera_vez.pais_vive` (código de 2 letras en mayúsculas).
 * El país que sale ya marcado se saca del IDIOMA del móvil (`navigator.languages`: «es-ES» → ES). NUNCA de la ubicación ni de la dirección IP. Sin región en el idioma («es»), no sale nada marcado.
 */

/** Pura: el país (2 letras, mayúsculas) del primer idioma que lleve región («es-ES» → «ES», «es-419» no tiene país → se mira el siguiente), o null. */
export function paisDeLosIdiomas(idiomas: readonly string[] | null | undefined): string | null {
  for (const crudo of idiomas ?? []) {
    const etiqueta = String(crudo ?? '').trim()
    if (!etiqueta) continue
    let region: string | undefined
    try {
      region = new Intl.Locale(etiqueta).region
    } catch {
      region = /^[a-z]{2,3}[-_]([a-z]{2})(?:$|[-_])/i.exec(etiqueta)?.[1]
    }
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase()
  }
  return null
}

/** El país que dice el idioma de este móvil (o null). Sin ubicación y sin IP. */
export function paisDelAparato(): string | null {
  if (typeof navigator === 'undefined') return null
  const lista = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language]
  const pais = paisDeLosIdiomas(lista)
  return pais && PAISES.includes(pais) ? pais : null
}

/** Los países que se pueden elegir (códigos de 2 letras). */
export const PAISES: string[] = (
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'
).split(' ')

/** El nombre del país en español («ES» → «España»). Si no se conoce, el código. */
export function nombreDelPais(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(iso.toUpperCase()) ?? iso.toUpperCase()
  } catch {
    return iso.toUpperCase()
  }
}

/** Pura: los países por nombre en español, con el que dice el móvil (`primero`) arriba del todo. */
export function paisesOrdenados(primero: string | null = null): string[] {
  const resto = [...PAISES].filter((p) => p !== primero).sort((a, b) => nombreDelPais(a).localeCompare(nombreDelPais(b), 'es'))
  return primero && PAISES.includes(primero) ? [primero, ...resto] : resto
}

/** Pura: ¿es un código de país válido de la lista? */
export const esPaisValido = (iso: unknown): iso is string => typeof iso === 'string' && PAISES.includes(iso.toUpperCase())

/** El país que tiene guardado esta cuenta (2 letras, mayúsculas), o null si no hay o el servidor no contesta. */
export async function leerPaisVive(): Promise<string | null> {
  const r = await llamar<{ ok?: boolean; pais_vive?: string | null }>('/api/primera-vez/pais')
  return r?.ok && esPaisValido(r.pais_vive) ? r.pais_vive.toUpperCase() : null
}

/** Guarda (o quita, con null) el país donde vive. true = guardado. Solo viaja el código. */
export async function guardarPaisVive(iso: string | null): Promise<boolean> {
  const r = await llamar<{ ok?: boolean }>('/api/primera-vez/pais', { metodo: 'PUT', cuerpo: { pais_vive: iso && esPaisValido(iso) ? iso.toUpperCase() : null } })
  return Boolean(r?.ok)
}
