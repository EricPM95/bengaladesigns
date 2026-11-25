import { useEffect, useMemo } from 'react'
import type { Reservation } from '../lib/bookings'
import { CLAVE_COMUN, documentosDeLaEntrada, esParaVarios, modoDeQr, puedeSubir as puedeSubirLa, queHagoConLoComun, type DocumentoDePersona, type DocumentoGuardado, type ModoDeQr, type TipoDeDocumento } from '../lib/entradasPorPersona'
import { sincronizarDocumentosDeEntrada, useDocumentosDeEntrada } from '../store/useDocumentosDeEntrada'
import { useBilleteStore, type CodigoDelBillete } from '../store/useBilleteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { usePermisosDelViaje } from './usePermisosDelViaje'

export interface UsoDeDocumentos {
  tipo: TipoDeDocumento
  modo: ModoDeQr
  /** La lista para la tarjeta y la hoja: la mía primero. En 'unico', una sola (la mía). */
  lista: DocumentoDePersona[]
  yoId: string | null
  /** ¿Puedo poner o cambiar el documento de esta persona? (lo suyo, siempre.) */
  puedeSubir: (personaId: string) => boolean
  /** Lo común (día, hora, precio, para quién es): 'cambiar' o 'proponer'. */
  loComun: 'cambiar' | 'proponer'
  /** Guarda el documento de una persona (`personaId` = 'comun' para el de todos). Si es el mío, también el billete privado de siempre (HOY y la ficha lo leen de ahí). */
  guardar: (personaId: string, datos: { codigo: CodigoDelBillete | null; localizador: string | null; personas: number | null; nombre: string | null }) => void
  quitar: (personaId: string) => void
  esParaVarios: boolean
}

/**
 * (V65) LOS DOCUMENTOS DE UNA ENTRADA O EXCURSIÓN, para quien los pinta (la tarjeta, el bloque del QR, la hoja «Las entradas de cada uno»).
 * Pregunta a la nube solo al abrir y cada 5 minutos con la pantalla a la vista (ver `useDocumentosDeEntrada`); lo demás sale del móvil, también sin internet.
 */
export function useDocumentosDeLaEntrada(reserva: Pick<Reservation, 'refId' | 'paraQuien'> | null, tipo: TipoDeDocumento = 'entrada', compradorId?: string | null): UsoDeDocumentos {
  const tripId = useSyncStore((s) => s.activeTripId)
  const gente = useViajeCompartido((s) => s.gente)
  const yoId = gente.find((p) => p.esYo)?.id ?? null
  const { rol } = usePermisosDelViaje()
  const docsTodos = useDocumentosDeEntrada((s) => s.docs)
  const cargado = useDocumentosDeEntrada((s) => s.tripId)
  useEffect(() => {
    if (cargado !== tripId) useDocumentosDeEntrada.getState().cargar(tripId)
  }, [tripId, cargado])
  useEffect(() => {
    sincronizarDocumentosDeEntrada(tripId)
  }, [tripId])
  const refId = reserva?.refId ?? ''
  const docs = useMemo(() => (cargado === tripId ? docsTodos.filter((d) => d.tipo === tipo && d.refId === refId) : []), [docsTodos, cargado, tripId, tipo, refId])
  const varios = reserva ? esParaVarios(reserva) : false
  const modo: ModoDeQr = reserva ? modoDeQr(reserva, docs) : 'unico'
  const lista = reserva ? documentosDeLaEntrada(reserva, yoId, gente, docs, compradorId ?? yoId) : []
  const guardar: UsoDeDocumentos['guardar'] = (personaId, d) => {
    if (!reserva || !yoId) return
    const para = reserva.paraQuien && reserva.paraQuien.length > 0 ? reserva.paraQuien : [yoId]
    const doc: Omit<DocumentoGuardado, 'actualizado'> = { tipo, refId: reserva.refId, clave: personaId, subidoPor: yoId, para, nombre: d.nombre, localizador: d.localizador, personas: d.personas, codigo: d.codigo }
    useDocumentosDeEntrada.getState().poner(tripId, doc)
    // El mío (o el de todos) también va al billete privado de siempre: HOY, la ficha y el modo sin conexión lo leen de ahí.
    if (personaId === yoId || personaId === CLAVE_COMUN) {
      const b = { personas: d.personas, localizador: d.localizador, codigo: d.codigo, dueno: yoId }
      if (tipo === 'entrada') useBilleteStore.getState().ponerEntrada(tripId, reserva.refId, b)
      else useBilleteStore.getState().ponerExcursion(tripId, reserva.refId, b)
    }
  }
  const quitar: UsoDeDocumentos['quitar'] = (personaId) => {
    if (!reserva) return
    useDocumentosDeEntrada.getState().quitar(tripId, { tipo, refId: reserva.refId, clave: personaId })
    if (personaId === yoId || personaId === CLAVE_COMUN) {
      if (tipo === 'entrada') useBilleteStore.getState().quitarEntrada(tripId, reserva.refId)
      else useBilleteStore.getState().quitarExcursion(tripId, reserva.refId)
    }
  }
  return {
    tipo,
    modo,
    lista,
    yoId,
    puedeSubir: (personaId) => (reserva ? puedeSubirLa(reserva, yoId, personaId, rol) : false),
    loComun: queHagoConLoComun(rol),
    guardar,
    quitar,
    esParaVarios: varios,
  }
}
