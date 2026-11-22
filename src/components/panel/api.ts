import { llamar } from '../../lib/logros'
import { conFiltroDePruebas, useSinPruebas } from './pruebas'

/**
 * (V33) LO QUE CUENTA EL SERVIDOR AL PANEL DE JUTRIP (`/api/admin/*`, carpeta `server/panel/`). Todo es solo para administradores: el servidor responde 401/403 al que no lo es y aquí eso llega como «sin respuesta».
 * Solo lectura (salvo [Responder], [Ya está disponible] y lo de Reportes). Nunca datos de tarjeta.
 */
export interface InfoPeriodo {
  periodo: string
  desde: string | null
  hasta: string
  etiqueta: string
  titulo: string
}
export interface Cubeta {
  clave: string
  etiqueta: string
  pases: number
}
export interface OpcionDeRespuesta {
  valor: string
  nombre: string
  n: number
  pct: number
}
export interface DondeViven {
  total: number
  paises: { iso: string; nombre: string; n: number; pct: number; contestado?: number; origen?: number }[]
  /** (V39) Cuántas personas lo contestaron y cuántas se sacan del origen de su último viaje. */
  fuentes?: { contestado: number; origen: number }
}
export interface Inicio {
  ok: boolean
  periodo: InfoPeriodo
  hoy: string
  reportes_nuevos: number
  fotos_por_aprobar: number
  pases: { hoy: number; mes: number }
  ingresos: { hoy_cent: number; mes_cent: number; moneda: string }
  usuarios: { total: number; hoy: number; semana: number; con_viaje: number; pct_con_viaje: number }
  serie: { tipo: 'dia' | 'semana' | 'mes'; cubetas: Cubeta[]; total: number }
  atencion: { tipo: 'reporte' | 'foto' | 'venta' | 'fallo'; titulo: string; en: string; id?: string }[]
  primera_vez: { contestaron: number; bloques: { id: string; titulo: string; total: number; opciones: OpcionDeRespuesta[] }[] }
  desde_donde: { paises: { iso: string; n: number }[]; ciudades: { nombre: string; iso: string | null; n: number }[] }
  /** (V35B) Personas por país donde viven; `null` = aún no se guarda («Pronto»). */
  donde_viven: DondeViven | null
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
export interface CompraDelPanel {
  fecha: string
  destino: string
  tipo: string
  personas: number | null
  persona: { id: string; nombre: string } | null
  estado: 'comprado' | 'regalado' | 'reembolsado'
  importe_cent: number
  moneda: string
}
export interface Ventas {
  ok: boolean
  periodo: InfoPeriodo
  hoy: string
  moneda: string
  pases: { periodo: number; hoy: number }
  ingresos_cent: number
  devoluciones_cent?: number
  te_queda: { cent: number; comision_cent: number | null; devoluciones_cent?: number; sin_comision?: number; antes_de_impuestos: boolean }
  conversion: { pct: number; compraron: number; viajeros: number }
  por_dia: { tipo: 'dia' | 'semana' | 'mes'; cubetas: Cubeta[] }
  por_destino: { destino: string; n: number; importe_cent: number }[]
  compras: CompraDelPanel[]
  total_compras: number
  /** (V35B) clics null = falta la migración 0091 («Pronto»). */
  afiliados: { clics: number | null; por_destino?: { destino: string; actividad: number; hotel: number }[]; por_proveedor?: { civitatis: number; stay22: number } | null; enlaces: { civitatis: string; stay22: string } }
}
export interface DestinosDelPanel {
  ok: boolean
  periodo: InfoPeriodo
  pedidos: { destino: string; veces: number; quieren_aviso: number; avisados: number; ultimo_aviso: string | null; proximamente: boolean; lanzado?: boolean }[]
  /** (V35B) ¿Se pueden cambiar los Próximamente? false = falta la migración 0091 (los botones salen apagados con «Pronto»). */
  puede_editar?: boolean
  proximamente: { clave?: string | null; destino: string; iso: string | null; publicado?: boolean; avisos: number; avisados: number }[]
  correo: { activo: boolean }
  /** (V39) «Destinos soñados»: el viaje de sus sueños que eligió la gente en el periodo. `disponible: false` = falta la migración 0093 (el bloque enseña «Pronto»). `lanzado`: ya está publicado en la app (de un país, algún destino suyo). */
  sonados?: { disponible: boolean; lista: { tipo: 'pais' | 'destino'; destino: string; iso: string; veces: number; lanzado: boolean }[] }
}

export const pedir = <T,>(ruta: string): Promise<T | null> => llamar<T>(conFiltroDePruebas(ruta, useSinPruebas.getState().on))
export const mandar = <T,>(ruta: string, cuerpo: unknown, metodo = 'POST'): Promise<T | null> => llamar<T>(ruta, { metodo, cuerpo })

/** Pura: un número con el punto de los miles («3.482»), también de cuatro cifras. */
export const miles = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** Pura: dinero en céntimos → «6,99 €» (SIEMPRE con «€», con coma y dos decimales: «0,00 €»; sin importe = «—»). */
export const euros = (cent: number | null | undefined, moneda = 'EUR'): string => {
  if (cent === null || cent === undefined) return '—'
  const simbolo = String(moneda).toUpperCase() === 'EUR' ? '€' : String(moneda).toUpperCase()
  const entero = Math.floor(Math.abs(cent) / 100)
  const dec = String(Math.abs(cent) % 100).padStart(2, '0')
  return `${cent < 0 ? '−' : ''}${miles(entero)},${dec} ${simbolo}`
}

/** Pura: el tipo de pase como lo ve Eric: Individual · Dúo · Grupo (nunca «uno» ni «duo»). */
export const nombreDePase = (tipo: string | null | undefined): string => {
  const t = String(tipo ?? '').toLowerCase()
  return t === 'uno' || t === 'individual' ? 'Individual' : t === 'duo' || t === 'dúo' ? 'Dúo' : t === 'grupo' ? 'Grupo' : t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'
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
  const f = new Date(iso)
  return d === 1 ? 'ayer' : d < 7 ? `hace ${d} días` : f.getFullYear() === new Date(ahora).getFullYear() ? f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '') : fechaCorta(iso)
}

// ── (V35A) USUARIOS: lo que contesta `/api/admin/usuarios*` (server/panel/usuarios.js + calculosUsuarios.js) ──────────────────────────────────────────────────────────────────────────────────────────────────
export interface PaseDeUsuario {
  destino: string
  tipo: string
  origen: 'comprado' | 'regalado' | 'compartido'
  de: string | null
  etiqueta: string
}
export interface ViajeProximo {
  destino: string
  iso: string | null
  inicio: string
  fin: string
}
export interface UsuarioFila {
  id: string
  nombre: string
  email: string
  /** (V35B) Cuenta de prueba o de administrador: la lista la enseña con la etiqueta «Prueba». */
  prueba?: boolean
  alta: string | null
  ultimo_acceso: string | null
  nivel: number
  rango: string
  exp: number
  pase: { tiene: boolean; destinos: PaseDeUsuario[] }
  viajes: { creados: number; hechos: number }
  proximo_viaje: ViajeProximo | null
  gastado_cent: number
  moneda: string
  primera_vez: PrimeraVezDeUsuario | null
}
export interface UsuariosLista {
  ok: boolean
  pagina: number
  por_pagina: number
  total: number
  con_entre: boolean
  usuarios: UsuarioFila[]
  destinos: string[]
}
export interface SegmentoDeCalendario {
  clave: string
  destino: string
  n: number
  color: string
}
export interface HuecoDeCalendario {
  clave: string
  nombre: string
  desde: string
  hasta: string
  total: number
  segmentos: SegmentoDeCalendario[]
}
export interface OpcionDeRespuesta {
  valor: string
  nombre: string
  n: number
  pct: number
}
export interface UsuariosResumen {
  ok: boolean
  periodo: { periodo: string; desde: string | null; hasta: string; etiqueta: string; titulo: string }
  hoy: string
  total: number
  nuevos: number
  activos: number
  embudo: { id: string; etiqueta: string; n: number; ancho: number; pasa_pct: number | null }[]
  actividad: { dia: number; semana: number; mes: number; retencion_pct: number | null; retencion_base: number; retencion_vuelven: number; de_uso: boolean }
  /** (V35B) Aparato y dónde la usan (de `uso_diario`); `null` = «Pronto». */
  uso: { aparato: OpcionDeRespuesta[]; donde: OpcionDeRespuesta[]; con_dato: number } | null
  viajando: { hoy: number; proximos30: number; destinos: { clave: string; destino: string; iso: string | null; hoy: number; en30: number }[] }
  calendario: { leyenda: { clave: string; destino: string; color: string }[]; meses: HuecoDeCalendario[]; semanas: HuecoDeCalendario[]; mes_fuerte: string | null; frase: string }
  quienes: { contestaron: number; frecuencia: OpcionDeRespuesta[]; compania: OpcionDeRespuesta[]; edad: OpcionDeRespuesta[] }
  donde_viven: DondeViven | null
  desde_donde: { paises: { iso: string; nombre: string; n: number }[]; ciudades: { nombre: string; iso: string | null; n: number }[] }
  niveles: { nivel: number; n: number }[]
  entran: { total: number; correo: number; google: number; otros: number; correo_pct: number; google_pct: number; otros_pct: number }
  cobros_sin_pase: { n: number; importe_cent: number; moneda: string; detalle: { destino: string; importe_cent: number; fecha: string }[] }
}
export interface UsuarioFicha {
  ok: boolean
  usuario: UsuarioFila
  vive_en: { iso: string; nombre: string; fuente?: 'contestado' | 'origen' } | null
  hoy: string
  ahora: string
  pase_texto: string
  viajes: { id: string; destino: string; iso: string | null; inicio: string | null; fin: string | null; hecho: boolean; personas: number; con_quien: string; suyo: boolean; de: string | null; de_id: string | null }[]
  pases: { fecha: string | null; destino: string; tipo: string; plan: string; origen: 'comprado' | 'regalado' | 'compartido'; de: string | null; de_id: string | null; etiqueta: string; importe_cent: number; moneda: string; reembolsado: boolean }[]
  logros: { medallas: { grado: string; texto: string }[]; colecciones: { texto: string }[]; emblemas: { texto: string; tipo: string }[]; pasaporte: { paises: number; sellos: number; texto: string } }
  reportes: { id: string; tipo: string; titulo: string; estado: string; en: string }[]
}
/** Pura: el enlace a la ficha de una persona (para las demás pantallas del panel). */
export const enlaceAFicha = (id: string): string => `/admin/usuarios?ficha=${encodeURIComponent(id)}`
