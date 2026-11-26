/**
 * LO QUE DECIDE EL TEXTO DEL VISTO (Tanda 8B3). Funciones PURAS, sin importar nada de la app (para poder probarlas en Node): `scripts/destino/pruebaVisto8b3.mjs` las vigila.
 *
 * Regla de Eric y de Claude: nunca un texto que luego cambia. Por eso:
 *   - mientras el servidor no ha contestado, NO se enseña ninguna hoja ni ninguna tira (ni «Guarda un recuerdo» ni nada): `hojaSegunRespuesta(null)` es `null`;
 *   - el móvil NO sabe qué sitios esconden un emblema (nunca se ve antes de ganarlo): solo lo dice la respuesta del servidor (`hay_emblema`); aquí no hay ningún catálogo;
 *   - lo que se decide con la respuesta es lo que se queda: la tira de la parada coge su texto de esa misma respuesta (`faltaDe`), y si el servidor repite lo mismo más tarde (`tiraDeParada`)
 *     manda el servidor, que es la misma fuente.
 */

import { conArticulo } from '../../../../shared/logros/articulos.js'
import tablas from '../../../../data/logros/articulos.json' with { type: 'json' }

const enSitio = (nombre: string): string => conArticulo((tablas as unknown as Record<string, Record<string, string>>).roma, nombre, 'en')

export type TipoDeHoja = 'ganado' | 'sin_ubicacion' | 'lejos' | 'oculto' | 'recuerdo'
export type QueFalta = 'sorpresa' | 'pedazo' | 'recuerdo'

/** Lo que de la respuesta del servidor (`RespuestaDeHecho`) hace falta para elegir la tarjeta. */
export interface RespuestaParaDecidir {
  cuenta?: boolean
  motivo?: string | null
  ubic?: 'cerca' | 'lejos' | 'sin'
  hay_pedazo?: boolean
  hay_emblema?: boolean
  /** (V66, 2) El sitio es de «Los imprescindibles» del destino o una maravilla del mundo: solo ahí sale «Guarda un recuerdo». */
  es_importante?: boolean
  repetido?: boolean
  foto_dentro?: string | null
  nuevos?: { tipo: string; [otro: string]: unknown }[]
}

export interface HojaDecidida {
  tipo: TipoDeHoja
  nombreSitio: string
  fotoDentro: string | null
  /** El primer momento «suma» (el pedazo ganado), para V2. */
  pedazo: { tipo: string; [otro: string]: unknown } | null
  mensaje: string | null
  /** (V70, V66-6) El sitio es imprescindible o maravilla: solo entonces la tira «Guarda un recuerdo» (también tras ganar un pedazo). */
  esImportante?: boolean
}

/** El nombre de la parada tal como se enseña (sin el «(noche)» del final). */
export const nombreDeParada = (nombre: string): string => nombre.replace(/\s*\(noche\)\s*$/i, '')

/** Qué tarjeta toca según lo que contesta el servidor (la tabla de «Cómo se gana cada cosa al tocar Visto»). `null` = ninguna (y, sin respuesta, tampoco nada). */
export function hojaSegunRespuesta(r: RespuestaParaDecidir | null, nombreParada: string): HojaDecidida | null {
  // Sin respuesta (el servidor tarda o no hay cobertura) no se enseña nada: no se sabe todavía qué hay en el sitio.
  if (!r) return null
  const nombreSitio = nombreDeParada(nombreParada)
  const base = { nombreSitio, fotoDentro: r.foto_dentro ?? null, pedazo: null, mensaje: null, esImportante: r.es_importante === true }
  if (r.motivo === 'pregunta_medio_dia' || r.repetido) return null
  if (r.motivo === 'lejos' && (r.hay_pedazo || r.hay_emblema)) return { ...base, tipo: 'lejos', mensaje: `¿Ya has estado hoy ${enSitio(nombreSitio)}? Sube una foto que hiciste allí y gana tu pedazo.` }
  // (V66, 2) «Guarda un recuerdo» solo en los sitios importantes (imprescindibles y maravillas); en el resto de paradas, nunca (Eric: «es muy pesado foto en todos los lugares»).
  const recuerdo: HojaDecidida | null = r.es_importante ? { ...base, tipo: 'recuerdo' } : null
  if (r.motivo === 'lejos') return recuerdo
  if (r.cuenta === false) return recuerdo
  if (r.hay_emblema) return { ...base, tipo: 'oculto' }
  if (r.ubic === 'sin' && r.hay_pedazo) return { ...base, tipo: 'sin_ubicacion' }
  const pedazo = r.nuevos?.find((m) => m.tipo === 'suma') ?? null
  if (pedazo) return { ...base, tipo: 'ganado', pedazo }
  return recuerdo
}

/** Lo que le falta a la parada según la tarjeta (la tira V6): sale de la MISMA decisión, así el texto de la tira nunca contradice al de la hoja. */
export function faltaDe(tipo: TipoDeHoja, esImportante = true): QueFalta | null {
  // (V70, V66-6) Tras ganar un pedazo, la tira «Guarda un recuerdo» solo en imprescindibles y maravillas (como la hoja).
  return { oculto: 'sorpresa', sin_ubicacion: 'pedazo', ganado: esImportante ? 'recuerdo' : null, recuerdo: 'recuerdo', lejos: null }[tipo] as QueFalta | null
}

export const TEXTO_DE_FALTA: Record<QueFalta, string> = {
  sorpresa: 'Te espera una sorpresa: sube tu foto',
  pedazo: 'Haz una foto y gana tu pedazo',
  recuerdo: 'Guarda un recuerdo',
}

/** La tira de una parada: manda lo que dice el servidor si lo dice; si no, lo decidido con la respuesta del Visto. Sin ninguno de los dos, no hay tira (nunca un texto de relleno). */
export function tiraDeParada<T>(local: T | undefined, servidor: T | undefined): T | undefined {
  return servidor ?? local
}
