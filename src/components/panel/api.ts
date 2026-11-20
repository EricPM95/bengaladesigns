import { llamar } from '../../lib/logros'

/**
 * (V33) LO QUE CUENTA EL SERVIDOR AL PANEL DE JUTRIP (`/api/admin/*`, carpeta `server/panel/`). Todo es solo para administradores: el servidor responde 401/403 al que no lo es y aquí eso llega como «sin respuesta».
 * Solo lectura (salvo [Responder], [Ya está disponible] y lo de Reportes). Nunca datos de tarjeta.
 */
export interface Inicio {
  ok: boolean
  reportes_nuevos: number
  fotos_por_aprobar: number
  pases: { hoy: number; mes: number }
  ingresos: { hoy_cent: number; mes_cent: number; moneda: string }
  usuarios: { hoy: number; semana: number; total: number; con_viaje: number }
  serie14: { dia: string; pases: number }[]
  atencion: { tipo: 'reporte' | 'foto' | 'venta' | 'fallo'; titulo: string; en: string }[]
  correo: { activo: boolean }
}
export interface PrimeraVezDeUsuario {
  frecuencia: string | null
  compania: string | null
  anio_nacimiento: number | null
}
export interface FilaDeUsuario {
  id: string
  nombre: string | null
  email: string | null
  alta: string
  ultimo_acceso: string | null
  nivel: number
  pase: { tiene: boolean; destinos: { destino: string; tipo: string }[] }
  viajes: { creados: number; hechos: number }
  gastado_cent: number
  moneda: string
  primera_vez: PrimeraVezDeUsuario | null
}
export interface ListaDeUsuarios {
  ok: boolean
  pagina: number
  por_pagina: number
  total: number
  usuarios: FilaDeUsuario[]
}
export interface Reparto {
  valor?: string
  tramo?: string
  n: number
  pct: number
}
export interface TotalesDeUsuarios {
  ok: boolean
  total: number
  con_viaje: number
  nuevos_semana: number
  contestaron: number
  respuestas: { frecuencia: Reparto[]; compania: Reparto[]; edad: Reparto[] }
}
export interface FichaDeUsuario {
  ok: boolean
  usuario: FilaDeUsuario
  viajes: { destino: string; inicio: string | null; fin: string | null; grupo: 'solo' | 'grupo'; miembros: number }[]
  pases: { fecha: string; destino: string; tipo: string; importe_cent: number | null; moneda: string }[]
  logros: { sellos: { destino: string; nombre: string; grado: string }[]; colecciones: { hechas: number; total: number }; paises: string[]; destinos: string[] }
  reportes: { id: string; tipo: string; titulo: string; estado: string; en: string }[]
}
export interface Ventas {
  ok: boolean
  importes_conocidos: boolean
  pases_hoy: number
  pases_mes: number
  ingresos_mes_cent: number
  moneda: string
  por_destino: { destino: string; n: number }[]
  por_dia: { dia: string; n: number }[]
  compras: { fecha: string; destino: string; tipo: string; importe_cent: number | null; moneda: string }[]
}
export interface DestinosDelPanel {
  ok: boolean
  pedidos: { destino: string; veces: number }[]
  proximamente: { destino: string; avisos: number; avisados: number }[]
  correo: { activo: boolean }
}

export const pedir = <T,>(ruta: string): Promise<T | null> => llamar<T>(ruta)
export const mandar = <T,>(ruta: string, cuerpo: unknown, metodo = 'POST'): Promise<T | null> => llamar<T>(ruta, { metodo, cuerpo })

/** Pura: dinero en céntimos → «28,97 €» (sin importe = «—»). */
export const euros = (cent: number | null | undefined, moneda = 'EUR'): string => {
  if (cent === null || cent === undefined) return '—'
  const simbolo = moneda === 'EUR' ? '€' : moneda
  const t = (cent / 100).toLocaleString('es-ES', { minimumFractionDigits: cent % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })
  return `${t} ${simbolo}`
}

export const ETIQUETA_FRECUENCIA: Record<string, string> = { una_vez_al_anio: 'Una vez al año', dos_o_tres: '2 o 3 veces al año', cuatro_o_mas: '4 o más' }
export const ETIQUETA_COMPANIA: Record<string, string> = { a_mi_aire: 'A mi aire', pareja: 'En pareja', familia: 'En familia', amigos: 'Con amigos' }
const CORTA_FRECUENCIA: Record<string, string> = { una_vez_al_anio: 'Una vez al año', dos_o_tres: '2–3 veces/año', cuatro_o_mas: '4 o más' }

/** Pura: lo que contestó, en una línea («2–3 veces/año · pareja · 1991») o «—». */
export const lineaDePrimeraVez = (p: PrimeraVezDeUsuario | null): string => {
  if (!p) return '—'
  const trozos = [p.frecuencia ? CORTA_FRECUENCIA[p.frecuencia] : null, p.compania ? (ETIQUETA_COMPANIA[p.compania] ?? '').toLowerCase() : null, p.anio_nacimiento ? String(p.anio_nacimiento) : null].filter(Boolean)
  return trozos.length ? trozos.join(' · ') : '—'
}

export const fechaCorta = (iso: string | null | undefined): string => (iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }) : '—')
export const hace = (iso: string | null | undefined, ahora = Date.now()): string => {
  if (!iso) return '—'
  const m = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000))
  if (m < 2) return 'ahora'
  if (m < 60) return `hace ${m} min`
  if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`
  const d = Math.round(m / 1440)
  return d === 1 ? 'ayer' : d < 7 ? `hace ${d} días` : fechaCorta(iso)
}
