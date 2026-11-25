/**
 * (V65 §2 y §3) CADA UNO CON SU ENTRADA. Funciones PURAS (sin React ni red) sobre el documento (QR) de una entrada o de una excursión.
 * Van EXACTAMENTE igual: `tipo` 'entrada' | 'excursion' solo cambia la tabla de donde sale el billete privado de siempre.
 *
 * El modelo: una entrada de más de una persona (`paraQuien`) tiene
 *   · un documento POR PERSONA (con su nombre): `clave` = el id de esa persona; o
 *   · UN solo documento para todos: `clave` = 'comun' (el mismo QR en todos los móviles).
 * Lo ven TODAS las personas para las que es (`para`) y nadie más del grupo (lo hace cumplir la base de datos: tabla `documentos_de_entrada`, migración 0095).
 * El almacenamiento y la red están en `src/store/useDocumentosDeEntrada.ts`; aquí, solo reglas.
 */
import type { Reservation } from './bookings'
import type { CodigoDelBillete } from '../store/useBilleteStore'
import type { Permiso, Persona } from '../store/useViajeCompartido'

export type TipoDeDocumento = 'entrada' | 'excursion'
/** 'unico' (una sola persona: lo de siempre) · 'porPersona' (un QR con el nombre de cada uno) · 'comun' (un solo QR para todos). */
export type ModoDeQr = 'unico' | 'porPersona' | 'comun'

/** La clave del documento de TODOS (un solo QR). */
export const CLAVE_COMUN = 'comun'

/** Un documento guardado (una fila de `documentos_de_entrada`). */
export interface DocumentoGuardado {
  tipo: TipoDeDocumento
  /** `refId` de la reserva (el nombre de la entrada, «Free Tour» o el id de la excursión). */
  refId: string
  /** El id de la persona a quien pertenece, o 'comun'. */
  clave: string
  /** Quién lo subió. */
  subidoPor: string
  /** Quiénes lo ven (los ids de `paraQuien` de la reserva cuando se subió). */
  para: string[]
  /** El nombre que lleva el documento (el de la entrada, «Eric Peña»), si se leyó o se escribió. */
  nombre: string | null
  localizador: string | null
  personas: number | null
  codigo: CodigoDelBillete | null
  actualizado: string
}

/** Lo que se enseña de cada persona de la entrada. */
export interface DocumentoDePersona {
  personaId: string
  /** El nombre de pila de la persona del viaje («Alicia»); sin nombre puesto, ''. */
  nombre: string
  esMio: boolean
  /** El documento (null: «Falta»). Con `modoDeQr === 'comun'`, el mismo en todas las personas. */
  doc: DocumentoGuardado | null
}

const sinTilde = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')
/** «Eric Peña» → «eric pena»: minúsculas, sin tildes, sin signos. */
export const normalizarNombre = (t: string | null | undefined): string =>
  sinTilde(String(t ?? ''))
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Los ids de las personas de la entrada (sin lista: solo `fallbackId`, quien la compró). */
export function personasDeLaEntrada(reserva: Pick<Reservation, 'paraQuien'>, fallbackId?: string | null): string[] {
  const lista = reserva.paraQuien && reserva.paraQuien.length > 0 ? reserva.paraQuien : fallbackId ? [fallbackId] : []
  return [...new Set(lista)]
}

/** ¿Es una entrada de más de una persona? (Solo entonces hay «Las entradas de cada uno».) */
export const esParaVarios = (reserva: Pick<Reservation, 'paraQuien'>): boolean => (reserva.paraQuien?.length ?? 0) > 1

/** El modo. Con una persona: 'unico'. Con un documento 'comun': 'comun'. Si no: 'porPersona' (también mientras no hay ninguno). */
export function modoDeQr(reserva: Pick<Reservation, 'paraQuien'>, docs: readonly Pick<DocumentoGuardado, 'clave'>[]): ModoDeQr {
  if (!esParaVarios(reserva)) return 'unico'
  return docs.some((d) => d.clave === CLAVE_COMUN) ? 'comun' : 'porPersona'
}

/**
 * LA LISTA PARA LA TARJETA Y PARA LA HOJA: una entrada por persona, la mía PRIMERO, y el orden de `paraQuien` para el resto.
 * `docs` son los documentos de ESTA entrada (los de `documentosDeLaEntrada` del hook). En 'comun', todas llevan el mismo documento.
 */
export function documentosDeLaEntrada(reserva: Pick<Reservation, 'paraQuien'>, miPersonaId: string | null | undefined, personas: readonly Pick<Persona, 'id' | 'nombre'>[], docs: readonly DocumentoGuardado[], fallbackId?: string | null): DocumentoDePersona[] {
  const ids = personasDeLaEntrada(reserva, fallbackId)
  const comun = docs.find((d) => d.clave === CLAVE_COMUN) ?? null
  const orden = miPersonaId && ids.includes(miPersonaId) ? [miPersonaId, ...ids.filter((i) => i !== miPersonaId)] : ids
  return orden.map((id) => ({
    personaId: id,
    nombre: (personas.find((p) => p.id === id)?.nombre ?? '').trim().split(/\s+/)[0] ?? '',
    esMio: id === miPersonaId,
    doc: comun ?? docs.find((d) => d.clave === id) ?? null,
  }))
}

/** ¿Hay un código que enseñar? */
export const conCodigo = (d: Pick<DocumentoGuardado, 'codigo'> | null | undefined): boolean => Boolean(d?.codigo && (d.codigo.dibujo || d.codigo.imagen))

/** «2 de 3 subidas», para la hoja. */
export const cuantasSubidas = (lista: readonly DocumentoDePersona[]): { subidas: number; total: number } => ({ subidas: lista.filter((x) => conCodigo(x.doc)).length, total: lista.length })

/**
 * LO SUYO y LO COMÚN (V65 §3).
 * `puedeSubir`: poner o cambiar el DOCUMENTO de `personaId` (su archivo, su nombre o su código). Siempre el suyo, sin pedir permiso (también la entrada que alguien compró aparte);
 * el de otra persona de la misma entrada, quien también es de ella (así «Subir todas a la vez» reparte); y quien puede editar el viaje.
 */
export function puedeSubir(reserva: Pick<Reservation, 'paraQuien'>, miPersonaId: string | null | undefined, personaId: string, permiso?: Permiso | null): boolean {
  if (!miPersonaId) return false
  if (personaId === miPersonaId) return true
  if (personasDeLaEntrada(reserva).includes(miPersonaId)) return true
  return permiso === 'admin' || permiso === 'editar'
}

/** Lo común de la entrada (día, hora, precio, para quién es): 'cambiar' (Administrador y «Puede editar») o 'proponer' («Solo recomendar»). */
export const queHagoConLoComun = (permiso?: Permiso | null): 'cambiar' | 'proponer' => (permiso === 'admin' || permiso === 'editar' ? 'cambiar' : 'proponer')

// ── Repartir por nombre ("Subir todas a la vez") ──────────────────────────────────────────────────────────────────────────────────────────

/** Un código leído de un archivo (o de una página) con el nombre que traía, si se vio. */
export interface CodigoLeido {
  nombre: string | null
  codigo: CodigoDelBillete
  localizador?: string | null
  /** De dónde salió (para el aviso), p. ej. «entrada.pdf · página 2». */
  origen?: string
}

export interface Reparto {
  /** `personaId` → su código. */
  porPersona: Record<string, CodigoLeido>
  /** Un solo código que vale para todos (con un solo código, o con `personas` > 1 y ningún nombre que case). */
  comun: CodigoLeido | null
  /** Lo que no se supo colocar (quedan en «Falta»): sin nombre que case con nadie, o nombre repetido. */
  sinColocar: CodigoLeido[]
}

/** ¿El nombre del documento es el de esta persona? «Eric Peña» ↔ «Eric» (basta el nombre de pila entero); «Alicia García» ↔ «Alicia García». Sin tildes ni mayúsculas. */
export function nombreCasa(nombreDelDocumento: string | null | undefined, nombreDeLaPersona: string | null | undefined): boolean {
  const doc = normalizarNombre(nombreDelDocumento)
  const per = normalizarNombre(nombreDeLaPersona)
  if (!doc || !per) return false
  if (doc === per) return true
  const pDoc = doc.split(' ')
  const pPer = per.split(' ')
  // Todas las palabras de la persona están en el documento (la persona del viaje suele llevar solo el nombre de pila).
  return pPer.every((w) => pDoc.includes(w)) || pDoc.every((w) => pPer.includes(w))
}

/**
 * Reparte los códigos leídos entre las personas de la entrada POR SU NOMBRE. Función pura:
 *   · un código cuyo nombre casa con UNA sola persona libre → esa persona;
 *   · un código sin nombre que casa (o con nombre que no es de nadie) NO se adivina: queda sin colocar… salvo que sea el ÚNICO código y la entrada sea para varios
 *     (un solo QR para todos: `comun`);
 *   · si dos códigos son de la misma persona, el primero se queda y el otro queda sin colocar;
 *   · una persona sin código se queda en «Falta» (no sale en `porPersona`).
 * `personas`: las de la entrada con su nombre COMPLETO si se sabe (`Persona.nombre`).
 */
export function repartirPorNombre(leidos: readonly CodigoLeido[], personas: readonly { id: string; nombre: string | null }[]): Reparto {
  const salida: Reparto = { porPersona: {}, comun: null, sinColocar: [] }
  // Un solo código y más de una persona: el mismo QR para todos, salvo que su nombre sea el de alguien concreto (entonces es el suyo y los demás faltan).
  if (leidos.length === 1 && personas.length > 1) {
    const uno = leidos[0]
    const dueno = uno.nombre ? personas.filter((p) => nombreCasa(uno.nombre, p.nombre)) : []
    if (dueno.length === 1) salida.porPersona[dueno[0].id] = uno
    else salida.comun = uno
    return salida
  }
  for (const c of leidos) {
    const casan = c.nombre ? personas.filter((p) => nombreCasa(c.nombre, p.nombre)) : []
    // Si varias casan, se prefiere la que casa con más palabras (la de «Eric» no se come «Eric Peña» si hay otra «Eric Peña»).
    const elegida = casan.length === 1 ? casan[0] : casan.length > 1 ? (casan.filter((p) => normalizarNombre(p.nombre) === normalizarNombre(c.nombre))[0] ?? null) : null
    if (elegida && !salida.porPersona[elegida.id]) salida.porPersona[elegida.id] = c
    else salida.sinColocar.push(c)
  }
  return salida
}

/**
 * El documento que ve la app de siempre (HOY, «Tu entrada» de la ficha): el MÍO. Para las pantallas que ya leen un `BilleteDeEntrada`.
 */
export function documentoParaMi(docs: readonly DocumentoGuardado[], miPersonaId: string | null | undefined): DocumentoGuardado | null {
  if (!miPersonaId) return null
  return docs.find((d) => d.clave === miPersonaId) ?? docs.find((d) => d.clave === CLAVE_COMUN) ?? null
}
