import destinosDelArchivo from '../../data/primera_vez/destinos.json'
import { proximamenteDelServidor } from './proximamente'
import { llamar } from './logros'
import type { DestinoCurado } from './destinosCurados'
import { create } from 'zustand'
import type { Sueno } from './suenos'
import { FRANJAS_EDAD, NOMBRE_FRANJA } from '../../server/franjaEdad.js'

/**
 * LA PRIMERA VEZ (V31). Quién la ve, qué se guarda y los destinos del mapa. Puro salvo las llamadas al servidor (`/api/primera-vez`).
 *   · Solo la ve el viajero NUEVO: una cuenta (no anónima) sin ningún viaje, ni propio ni compartido. Quien ya tiene viajes no ve nada nuevo.
 *   · Las preguntas salen UNA vez por cuenta (se contesten o se salten). Se guardan SOLO tres cosas: cada cuánto viaja, con quién y la franja de edad (opcional). El ritmo y lo que le gusta ver (pregunta 3) NO se guardan.
 *   · Las respuestas no se usan para los viajes: el cuestionario de crear viaje sale como siempre.
 */
export type Frecuencia = 'una_vez_al_anio' | 'dos_o_tres' | 'cuatro_o_mas'
export type Compania = 'a_mi_aire' | 'pareja' | 'familia' | 'amigos'
export type FranjaEdad = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'
export interface RespuestasPrimeraVez {
  frecuencia: Frecuencia | null
  compania: Compania | null
  /** (V41) La edad por franjas (antes el año de nacimiento): una de las seis, o null si no contestó. */
  franja_edad: FranjaEdad | null
  /** (V35B) El país donde vive (2 letras, mayúsculas), opcional. */
  pais_vive?: string | null
  /** (V39) El viaje de sus sueños: un país o un destino, opcional. Solo viaja si el servidor puede guardarlo (migración 0093). */
  sueno?: Sueno | null
}
export interface EstadoPrimeraVez extends RespuestasPrimeraVez {
  hecho: boolean
  /** (V39) ¿Puede el servidor guardar el viaje de sus sueños (0093 aplicada)? Si no, esa pregunta se salta sola y quedan cuatro. */
  suenos_disponibles: boolean
}

/** (V41) Las seis franjas de la pregunta «¿Cuántos años tienes?», con cómo se escriben en la pantalla (mismos valores que guarda el servidor: `server/franjaEdad.js`). */
export const franjasDeEdad: { id: FranjaEdad; n: string }[] = (FRANJAS_EDAD as FranjaEdad[]).map((id) => ({ id, n: NOMBRE_FRANJA[id] }))

/** ¿Hay que enseñar las preguntas? Solo a un viajero nuevo (sin ningún viaje) que aún no las ha contestado ni saltado. */
export const debeEnseñarPreguntas = (d: { nuevo: boolean; hecho: boolean | null }): boolean => d.nuevo && d.hecho === false

/** Lo que dice el servidor, o null si no contesta (sin la tabla, sin red…): entonces las preguntas NO salen y la app sigue como siempre. */
export async function pedirEstadoPrimeraVez(): Promise<EstadoPrimeraVez | null> {
  const r = await llamar<{ ok?: boolean } & EstadoPrimeraVez>('/api/primera-vez')
  return r && r.ok ? { hecho: Boolean(r.hecho), frecuencia: r.frecuencia ?? null, compania: r.compania ?? null, franja_edad: r.franja_edad ?? null, pais_vive: r.pais_vive ?? null, suenos_disponibles: r.suenos_disponibles === true } : null
}

/** Guarda lo contestado (o nada, si se saltó: queda «hecho» igual y no vuelven). Solo viajan los tres datos. */
export async function guardarPrimeraVez(r: Partial<RespuestasPrimeraVez>): Promise<boolean> {
  const cuerpo: RespuestasPrimeraVez = { frecuencia: r.frecuencia ?? null, compania: r.compania ?? null, franja_edad: r.franja_edad ?? null, pais_vive: r.pais_vive ?? null, sueno: r.sueno ?? null }
  const res = await llamar<{ ok?: boolean }>('/api/primera-vez', { metodo: 'PUT', cuerpo })
  return Boolean(res?.ok)
}

/** Qué está abierto de la primera vez (las preguntas, la tarjeta de un destino, su página): el «+» flotante se esconde con la tarjeta o la página abiertas. */
interface UiPrimeraVez {
  preguntas: boolean
  /** (V39) ¿Sale la pregunta «El viaje de tus sueños»? Solo si el servidor puede guardarla (0093 aplicada). */
  suenos: boolean
  tarjeta: string | null
  pagina: string | null
  /** (V41) ¿Está abierto «¿A dónde te apetece ir?» a pantalla completa (el globo de Mapbox)? */
  globo: boolean
  abrirGlobo: (abierto: boolean) => void
  abrirPreguntas: (conSuenos?: boolean) => void
  cerrarPreguntas: () => void
  abrirTarjeta: (clave: string | null) => void
  abrirPagina: (clave: string | null) => void
}
export const usePrimeraVezUi = create<UiPrimeraVez>((set) => ({
  preguntas: false,
  suenos: true,
  tarjeta: null,
  pagina: null,
  globo: false,
  abrirGlobo: (globo) => set({ globo }),
  abrirPreguntas: (conSuenos = true) => set({ preguntas: true, suenos: conSuenos }),
  cerrarPreguntas: () => set({ preguntas: false }),
  abrirTarjeta: (tarjeta) => set({ tarjeta }),
  abrirPagina: (pagina) => set({ pagina }),
}))

/* ───────── Los destinos del mapa ───────── */

export interface DestinoDelMapa {
  clave: string
  nombre: string
  pais: string
  iso: string
  continente: string
  lat: number
  lng: number
  /** Listo = ya tiene sus datos en la app (y, si está oculto, el servidor solo se lo manda al administrador). */
  listo: boolean
  linea: string | null
  portada: string | null
}
interface FilaDeArchivo {
  clave: string
  nombre: string
  pais: string
  iso: string
  continente: string
  lat: number
  lng: number
}
const archivo = destinosDelArchivo as unknown as { continentes: string[]; salida: FilaDeArchivo[]; proximamente: FilaDeArchivo[] }
export const CONTINENTES: string[] = archivo.continentes

/**
 * Pura. Los destinos que salen en el mapa: de los de salida, SOLO los que ya tiene la app (`curados`, lo que manda el servidor: los ocultos, solo para el administrador); y siempre los «Próximamente», en gris.
 * Los listos usan la posición y el país de sus propios datos. Sin lista del servidor (aún no contesta), solo los «Próximamente».
 */
export function destinosDelMapa(curados: DestinoCurado[] | null): DestinoDelMapa[] {
  const listos: DestinoDelMapa[] = []
  for (const s of archivo.salida) {
    const c = (curados ?? []).find((x) => x.clave === s.clave)
    if (!c) continue
    listos.push({ clave: s.clave, nombre: c.nombre || s.nombre, pais: c.pais || s.pais, iso: c.iso ?? s.iso, continente: s.continente, lat: c.lat, lng: c.lng, listo: true, linea: c.linea ?? null, portada: c.portada_pequena ?? c.portada ?? null })
  }
  // (V35B) Los Próximamente salen de la base de datos si la hay (los que cambia Eric desde el panel); si no, del JSON de siempre. Uno que ya está listo en la app nunca sale en gris además.
  const clavesListas = new Set(listos.map((l) => l.clave))
  const pronto: DestinoDelMapa[] = (proximamenteDelServidor() ?? archivo.proximamente).filter((s) => !clavesListas.has(s.clave)).map((s) => ({ ...s, listo: false, linea: null, portada: null }))
  return [...listos, ...pronto]
}

/** Agrupa por continente en el orden del archivo (los continentes sin destinos no salen). */
export const porContinente = (lista: DestinoDelMapa[]): { continente: string; destinos: DestinoDelMapa[] }[] =>
  CONTINENTES.map((continente) => ({ continente, destinos: lista.filter((d) => d.continente === continente) })).filter((g) => g.destinos.length > 0)

/** [Avísame] de un destino que aún no está: se guarda en la cuenta (el email de la cuenta, tabla `avisos_destino`). true = guardado. */
export async function avisarDeDestino(nombre: string): Promise<boolean> {
  let email = ''
  try {
    const sesion = (await (await import('./supabaseClient')).supabase?.auth.getSession())?.data.session
    email = sesion?.user.email ?? ''
  } catch {
    email = ''
  }
  if (!email && import.meta.env.DEV) email = 'viajero@demo.test'
  if (!email) return false
  const idioma = (typeof navigator !== 'undefined' ? navigator.language : 'es').slice(0, 2).toLowerCase()
  const r = await llamar<{ ok?: boolean }>('/api/avisos-destino', { cuerpo: { destino: nombre, email, idioma } })
  return Boolean(r?.ok)
}
