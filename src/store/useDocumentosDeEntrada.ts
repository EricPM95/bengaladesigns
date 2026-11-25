import { create } from 'zustand'
import { supabase, usuarioLocal } from '../lib/supabaseClient'
import { seVe, unaSolaVez } from '../lib/sondeo'
import type { CodigoDelBillete } from './useBilleteStore'
import type { DocumentoGuardado, TipoDeDocumento } from '../lib/entradasPorPersona'

/**
 * (V65 §2) LOS DOCUMENTOS DE LAS ENTRADAS Y EXCURSIONES DE VARIAS PERSONAS. Tabla `documentos_de_entrada` (migración 0095): una fila por persona (o una «comun» para todos) y por entrada,
 * que leen quienes están en `para` (las personas de la entrada) y quien la subió; nadie más. El móvil guarda una copia (`localStorage`, por viaje): el QR se enseña SIN INTERNET en la puerta.
 * Si la 0095 no está aplicada, el error de la nube se ignora y todo sigue solo en el móvil (como `billetes_personales`, 0070).
 *
 * CONSULTAS A SUPABASE (regla V36): al abrir las entradas y, como mucho, cada 5 minutos con la pantalla visible (`unaSolaVez` + `seVe`), nunca en bucle.
 *   1) los SELLOS: `select tipo, ref_id, clave, actualizado_en` del viaje (≈ 40 filas, ≈ 3 KB);
 *   2) los CUERPOS solo de las filas que han cambiado respecto al móvil (≈ 3-8 KB cada una: el QR redibujado va como SVG pequeño; el recorte en imagen solo si no hay dibujo).
 * Cada subida o cambio: 1 `upsert` de una fila (≈ 5 KB).
 */
const PREFIJO = 'trazo:docsentrada:v1'
const MAX_IMAGEN_COMPARTIDA = 200_000
const claveLocal = (tripId: string | null) => `${PREFIJO}:${tripId ?? 'local'}`
const clavePend = (tripId: string | null) => `${claveLocal(tripId)}:pend`
const MIN_ENTRE_PREGUNTAS_MS = 5 * 60_000

const leerLocal = (tripId: string | null): DocumentoGuardado[] => {
  try {
    const crudo = window.localStorage.getItem(claveLocal(tripId))
    const lista = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? (lista as DocumentoGuardado[]) : []
  } catch {
    return []
  }
}
const escribirLocal = (tripId: string | null, docs: DocumentoGuardado[]) => {
  try {
    window.localStorage.setItem(claveLocal(tripId), JSON.stringify(docs))
  } catch {
    // sin almacenamiento
  }
}
const leerPend = (tripId: string | null): DocumentoGuardado[] => {
  try {
    const crudo = window.localStorage.getItem(clavePend(tripId))
    const lista = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? (lista as DocumentoGuardado[]) : []
  } catch {
    return []
  }
}
const escribirPend = (tripId: string | null, docs: DocumentoGuardado[]) => {
  try {
    if (docs.length === 0) window.localStorage.removeItem(clavePend(tripId))
    else window.localStorage.setItem(clavePend(tripId), JSON.stringify(docs))
  } catch {
    // sin almacenamiento
  }
}

const mismo = (a: Pick<DocumentoGuardado, 'tipo' | 'refId' | 'clave'>, b: Pick<DocumentoGuardado, 'tipo' | 'refId' | 'clave'>) => a.tipo === b.tipo && a.refId === b.refId && a.clave === b.clave

/** El código que se comparte: sin recortes enormes (el dibujo SVG basta; el recorte solo si no hay dibujo y no es grande). */
const codigoCompartible = (c: CodigoDelBillete | null): CodigoDelBillete | null => {
  if (!c) return null
  const imagen = c.imagen && (!c.dibujo || c.imagen.length <= MAX_IMAGEN_COMPARTIDA) && c.imagen.length <= 900_000 ? c.imagen : null
  return { ...c, imagen: c.dibujo ? null : imagen }
}

interface Estado {
  tripId: string | null
  docs: DocumentoGuardado[]
  cargar: (tripId: string | null) => void
  /** Pone (o cambia) el documento de una persona de una entrada. Primero en el móvil, luego a la nube; sin conexión, queda pendiente. */
  poner: (tripId: string | null, doc: Omit<DocumentoGuardado, 'actualizado'>) => void
  /** Quita el documento de una persona. */
  quitar: (tripId: string | null, ref: Pick<DocumentoGuardado, 'tipo' | 'refId' | 'clave'>) => void
  /** Cambia quiénes lo ven (cuando «¿Para quién es?» cambia): solo en los documentos de esa entrada que ya existen. */
  cambiarPara: (tripId: string | null, tipo: TipoDeDocumento, refId: string, para: string[]) => void
  /** Trae los de la nube y sube los pendientes. Nunca lanza. */
  sincronizar: (tripId: string | null) => Promise<void>
}

export const useDocumentosDeEntrada = create<Estado>((set, get) => ({
  tripId: null,
  docs: [],
  cargar: (tripId) => {
    if (get().tripId === tripId) return
    set({ tripId, docs: leerLocal(tripId) })
  },
  poner: (tripId, doc) => {
    const previo = get().tripId === tripId ? get().docs : leerLocal(tripId)
    const nuevo: DocumentoGuardado = { ...doc, codigo: codigoCompartible(doc.codigo), actualizado: new Date().toISOString() }
    const docs = [...previo.filter((d) => !mismo(d, nuevo)), nuevo]
    set({ tripId, docs })
    escribirLocal(tripId, docs)
    void subirUno(tripId, nuevo)
  },
  quitar: (tripId, ref) => {
    const previo = get().tripId === tripId ? get().docs : leerLocal(tripId)
    if (!previo.some((d) => mismo(d, ref))) return
    const docs = previo.filter((d) => !mismo(d, ref))
    set({ tripId, docs })
    escribirLocal(tripId, docs)
    void borrarUno(tripId, ref)
  },
  cambiarPara: (tripId, tipo, refId, para) => {
    const previo = get().tripId === tripId ? get().docs : leerLocal(tripId)
    const afectados = previo.filter((d) => d.tipo === tipo && d.refId === refId && JSON.stringify(d.para) !== JSON.stringify(para))
    if (afectados.length === 0) return
    const ahora = new Date().toISOString()
    const nuevos = afectados.map((d) => ({ ...d, para, actualizado: ahora }))
    const docs = previo.map((d) => nuevos.find((n) => mismo(n, d)) ?? d)
    set({ tripId, docs })
    escribirLocal(tripId, docs)
    for (const n of nuevos) void subirUno(tripId, n)
  },
  sincronizar: async (tripId) => {
    try {
      if (!supabase || !tripId) return
      const { data: u } = await usuarioLocal()
      const uid = u.user?.id
      if (!uid) return
      // 1) Lo pendiente de subir.
      for (const p of leerPend(tripId)) await subirUno(tripId, p)
      // 2) Los sellos (barato) y, solo de lo que cambió, los cuerpos.
      const { data: sellos, error } = await supabase.from('documentos_de_entrada').select('tipo, ref_id, clave, actualizado_en').eq('trip_id', tripId)
      if (error || !Array.isArray(sellos)) return // sin la 0095 o sin conexión: se sigue con el móvil
      if (useDocumentosDeEntrada.getState().tripId !== tripId) useDocumentosDeEntrada.setState({ tripId, docs: leerLocal(tripId) })
      const locales = useDocumentosDeEntrada.getState().docs
      const pend = leerPend(tripId)
      const cambiados = (sellos as { tipo: TipoDeDocumento; ref_id: string; clave: string; actualizado_en: string }[]).filter((s) => {
        const l = locales.find((d) => mismo(d, { tipo: s.tipo, refId: s.ref_id, clave: s.clave }))
        return !pend.some((d) => mismo(d, { tipo: s.tipo, refId: s.ref_id, clave: s.clave })) && (!l || Date.parse(s.actualizado_en) > Date.parse(l.actualizado))
      })
      let docs = locales
      for (const s of cambiados) {
        const { data } = await supabase.from('documentos_de_entrada').select('subido_por, para, nombre, localizador, personas, codigo, actualizado_en').eq('trip_id', tripId).eq('tipo', s.tipo).eq('ref_id', s.ref_id).eq('clave', s.clave).maybeSingle()
        if (!data) continue
        const d = data as { subido_por: string; para: string[] | null; nombre: string | null; localizador: string | null; personas: number | null; codigo: CodigoDelBillete | null; actualizado_en: string }
        const fila: DocumentoGuardado = { tipo: s.tipo, refId: s.ref_id, clave: s.clave, subidoPor: d.subido_por, para: d.para ?? [], nombre: d.nombre, localizador: d.localizador, personas: d.personas, codigo: d.codigo, actualizado: d.actualizado_en }
        docs = [...docs.filter((x) => !mismo(x, fila)), fila]
      }
      // Lo que ya no está en la nube (se quitó en otro móvil o la persona ya no lo ve) sale del móvil, salvo lo pendiente.
      const enNube = sellos as { tipo: TipoDeDocumento; ref_id: string; clave: string }[]
      docs = docs.filter((d) => enNube.some((s) => s.tipo === d.tipo && s.ref_id === d.refId && s.clave === d.clave) || pend.some((p) => mismo(p, d)))
      if (JSON.stringify(docs) !== JSON.stringify(locales)) {
        useDocumentosDeEntrada.setState({ tripId, docs })
        escribirLocal(tripId, docs)
      }
    } catch {
      // La nube es un extra: nunca tumba nada.
    }
  },
}))

/** Sube una fila (1 `upsert`, ≈ 5 KB). Si falla (sin la 0095, sin conexión), queda pendiente y se reintenta al volver la conexión. */
async function subirUno(tripId: string | null, d: DocumentoGuardado) {
  const pendiente = () => escribirPend(tripId, [...leerPend(tripId).filter((p) => !mismo(p, d)), d])
  try {
    if (!supabase || !tripId) return
    const { data: u } = await usuarioLocal()
    if (!u.user?.id) return
    const { error } = await supabase.from('documentos_de_entrada').upsert({
      trip_id: tripId,
      tipo: d.tipo,
      ref_id: d.refId,
      clave: d.clave,
      persona_id: d.clave === 'comun' ? null : d.clave,
      subido_por: d.subidoPor,
      para: d.para,
      nombre: d.nombre,
      localizador: d.localizador,
      personas: d.personas,
      codigo: d.codigo,
      actualizado_en: d.actualizado,
    })
    if (error) return pendiente()
    escribirPend(tripId, leerPend(tripId).filter((p) => !mismo(p, d)))
  } catch {
    pendiente()
  }
}

async function borrarUno(tripId: string | null, r: Pick<DocumentoGuardado, 'tipo' | 'refId' | 'clave'>) {
  try {
    if (!supabase || !tripId) return
    await supabase.from('documentos_de_entrada').delete().eq('trip_id', tripId).eq('tipo', r.tipo).eq('ref_id', r.refId).eq('clave', r.clave)
  } catch {
    // sin conexión: el documento vuelve del servidor en la próxima sincronización (se puede volver a quitar).
  }
}

/** Pregunta a la nube SOLO con la pantalla a la vista y como mucho cada 5 minutos (una sola petición aunque lo pidan varias piezas). */
export function sincronizarDocumentosDeEntrada(tripId: string | null): void {
  if (!tripId || !seVe()) return
  void unaSolaVez(`docs-entrada:${tripId}`, () => useDocumentosDeEntrada.getState().sincronizar(tripId), MIN_ENTRE_PREGUNTAS_MS)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const t = useDocumentosDeEntrada.getState().tripId
    if (t) void useDocumentosDeEntrada.getState().sincronizar(t)
  })
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') (window as unknown as { __docsEntrada: typeof useDocumentosDeEntrada }).__docsEntrada = useDocumentosDeEntrada
}
