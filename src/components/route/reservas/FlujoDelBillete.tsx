import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Route } from '../../../lib/types'
import type { EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { useArrivalInfo, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legOf, type LegKind } from '../../../lib/reservasLegs'
import { leerBillete, billeteVacio, type DatosBilleteLeido } from '../../../lib/billeteLeer'
import { useBillete } from '../../../hooks/useBillete'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { estadoDelPaseParaDocumentos } from '../../../lib/pago'
import { claveDocumentoDeMedio } from './BotonesDeReserva'
import { HojaAnadirDocumento } from './HojaAnadirDocumento'
import { HojaDatosDelBillete } from './HojaDatosDelBillete'

/**
 * (V64 §1) EL FLUJO DE AÑADIR EL DOCUMENTO DE UN VUELO, TREN, BARCO O AUTOBÚS, una sola vez para RESERVAS (la tarjeta de la ida y de la vuelta) y HOY (el QR gris del billete):
 *   [+ Añade tu tarjeta de embarque] → la hoja pequeña (subir o escribir) → el selector de archivos → «Revisa los datos» (los campos ya rellenos; NADA se guarda hasta pulsar [Guardar]) o, con [Escribir los datos], «Datos del vuelo» vacía.
 * Si el documento no se puede leer (sin pase, límite del día, archivo grande, error), «Revisa los datos» sale con los campos vacíos y lo dice: no hay nada comprobado. La lectura (`leerBillete`) es la de siempre: el código primero y gratis; el servidor, con pase y con límite.
 * Devuelve `pedirArchivo(kind)` (abre el selector de archivos; sin pase, el aviso del pase), `abrirHoja(kind)` (la hoja pequeña, para quien no tiene su propio botón, como HOY), `escribir(kind)` y los `nodos` que hay que pintar una vez.
 */
export function useFlujoDelBillete({ route, info, onCambioDeVuelo }: { route: Route; info: ArrivalInfo; onCambioDeVuelo?: EnCambioDeVuelo }): { pedirArchivo: (kind: LegKind) => void; abrirHoja: (kind: LegKind) => void; escribir: (kind: LegKind) => void; nodos: ReactNode } {
  const archivoRef = useRef<HTMLInputElement>(null)
  const archivoDe = useRef<LegKind>('arrival')
  const [leyendo, setLeyendo] = useState<LegKind | null>(null)
  const [revisando, setRevisando] = useState<{ kind: LegKind; datos: DatosBilleteLeido } | null>(null)
  const [escribiendo, setEscribiendo] = useState<LegKind | null>(null)
  const [hoja, setHoja] = useState<LegKind | null>(null)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const legDe = (kind: LegKind) => (kind === 'arrival' ? ida : vuelta)

  const pedirArchivo = (kind: LegKind) => {
    // (10S8 §2) Añadir un documento nuevo es del pase: sin él, el aviso pequeño (el botón de la tarjeta ya lo hace; esto cubre HOY y «Cambiar» de la línea naranja).
    if (estadoDelPaseParaDocumentos() === 'sin') {
      abrirAvisoPase(claveDocumentoDeMedio(legDe(kind).mode), { destino: route.destination })
      return
    }
    archivoDe.current = kind
    if (archivoRef.current) {
      archivoRef.current.value = ''
      archivoRef.current.click()
    }
  }
  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return
    const kind = archivoDe.current
    setLeyendo(kind)
    try {
      const medio = legDe(kind).mode
      const datos = await leerBillete(archivo, { modo: medio === 'coche' ? undefined : medio })
      setRevisando({ kind, datos })
    } catch {
      setRevisando({ kind, datos: { ...billeteVacio(), aviso: `No hemos podido leer tu ${legDe(kind).mode === 'avion' ? 'tarjeta de embarque' : 'billete'}. Ponlo a mano o prueba con una captura.` } })
    } finally {
      setLeyendo(null)
    }
  }
  const palabra = (kind: LegKind) => (legDe(kind).mode === 'avion' ? 'tarjeta de embarque' : 'billete')
  const nodos = (
    <>
      <input ref={archivoRef} type="file" accept="application/pdf,image/*" hidden data-billete-archivo onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
      {leyendo && (
        <div role="status" data-billete-leyendo className="fixed inset-x-0 bottom-24 z-[120] mx-auto w-fit max-w-[88vw] rounded-full px-5 py-3 text-[14px] font-semibold" style={{ background: '#1C2230', color: '#F3D88F' }}>
          Leyendo tu {palabra(leyendo)}…
        </div>
      )}
      {hoja && <HojaAnadirDocumento clave={claveDocumentoDeMedio(legDe(hoja).mode)} onSubir={() => pedirArchivo(hoja)} onEscribir={() => setEscribiendo(hoja)} onClose={() => setHoja(null)} />}
      {revisando && <HojaDeLosDatos leg={legDe(revisando.kind)} leido={revisando.datos} onClose={() => setRevisando(null)} onCambioDeVuelo={onCambioDeVuelo} />}
      {escribiendo && <HojaDeLosDatos leg={legDe(escribiendo)} leido={null} onClose={() => setEscribiendo(null)} onCambioDeVuelo={onCambioDeVuelo} />}
    </>
  )
  return { pedirArchivo, abrirHoja: setHoja, escribir: setEscribiendo, nodos }
}

/**
 * (V64 §1) Añadir el documento DESDE HOY: el QR gris y «+ Añade tu tarjeta de embarque» abren la MISMA hoja pequeña de RESERVAS («Subir foto o archivo» / «Escribir los datos») y, tras subir, «Revisa los datos» (los mismos de RESERVAS: se guarda
 * en la misma reserva). Solo se monta al tocar (`key` cambia en cada toque): sin tocar, no hace nada ni pide nada. Sin pase, el aviso del pase.
 */
export function AnadirDocumentoDeHoy({ route, kind, mode }: { route: Route; kind: 'arrival' | 'departure'; mode: string }) {
  const info = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const flujo = useFlujoDelBillete({ route, info })
  useEffect(() => {
    if (estadoDelPaseParaDocumentos() === 'sin') abrirAvisoPase(claveDocumentoDeMedio(mode === 'avion' ? 'avion' : mode === 'ferry' ? 'ferry' : 'tren'), { destino: route.destination })
    else flujo.abrirHoja(kind)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <>{flujo.nodos}</>
}

/** La hoja «Revisa los datos» (con `leido`) o «Datos del vuelo» (vacía): lee el billete guardado de esa mitad (el móvil, 0 KB de red) y se lo pasa a la hoja. */
function HojaDeLosDatos({ leg, leido, onClose, onCambioDeVuelo }: { leg: ReturnType<typeof legOf>; leido: DatosBilleteLeido | null; onClose: () => void; onCambioDeVuelo?: EnCambioDeVuelo }) {
  const { billete } = useBillete(leg.kind, leg.time)
  return <HojaDatosDelBillete leg={leg} billete={billete} leido={leido} onClose={onClose} onCambioDeVuelo={onCambioDeVuelo} />
}

