import { useRef, useState, type ReactNode } from 'react'
import type { Reservation } from '../../../lib/bookings'
import type { Route } from '../../../lib/types'
import { leerEntrada, type DatosEntradaLeida } from '../../../lib/billeteLeer'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { estadoDelPaseParaDocumentos } from '../../../lib/pago'
import { entradaConCodigo } from '../../../store/useBilleteStore'
import { useBilletesDeEntradas } from '../../../hooks/useBilleteEntrada'
import { useDocumentosDeLaEntrada } from '../../../hooks/useDocumentosDeLaEntrada'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { conCodigo as docConCodigo, esParaVarios } from '../../../lib/entradasPorPersona'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'
import { CodigoPantallaCompleta } from './TarjetaBillete'
import { BloqueDelCodigo, type DocumentoDelBloque } from './DatosDeLaEntrada'
import { HojaAbajo } from './HojaAbajo'
import { HojaAnadirDocumento } from './HojaAnadirDocumento'
import { HojaEntradasDeCadaUno } from './HojaEntradasDeCadaUno'
import { usePreguntaDeDia } from './PreguntaDeDiaDelDocumento'

/**
 * (V69, apartado 6; Eric, 26-nov: «nunca un botón que no hace nada») EL BOTÓN [Ver entrada] DE LA FICHA DE LA PARADA (pestaña «Entradas», recuadro verde «TU ENTRADA»). Antes no hacía nada (`onVerEntrada={() => undefined}`).
 *   · CON documento (el QR guardado de esta entrada): lo abre. Un solo código, a pantalla completa (`CodigoPantallaCompleta`); varias personas, el bloque oscuro que se desliza de la V65 (`BloqueDelCodigo`, un código por persona, el tuyo primero), y de ahí cada uno a pantalla completa.
 *   · SIN documento: el botón dice «+ Subir tu entrada» y hace lo mismo que el botón de la tarjeta de RESERVAS: la hoja pequeña de la V64 («Subir foto o archivo» / «Escribir los datos»; sin pase, el aviso del pase) y, tras subir, «Revisa los datos».
 *     Una entrada de varias personas abre «Las entradas de cada uno».
 *   · Si la entrada es de otra persona y no hay documento para ti (te cubre la del dueño): no hay nada que ver ni que subir, así que el botón NO sale (`texto: null`).
 * Es la MISMA lectura de documentos que la tarjeta de RESERVAS (el hook de la V65 y el billete guardado en el móvil): 0 KB de red nuevos; solo al subir un archivo se pide la lectura de siempre.
 */
export function useVerEntrada({ route, reservation, target, cubiertaPorElDueno }: { route: Route | null; reservation: Reservation | null; target: ReservationTarget | null; cubiertaPorElDueno: boolean }): { texto: string | null; alPulsar: () => void; nodos: ReactNode } {
  const billetes = useBilletesDeEntradas()
  const grupo = useEntradasDelGrupo()
  const mia = reservation ? (grupo.esInvitado ? grupo.mias.some((m) => m.id === reservation.id) : grupo.reservasDelDueno.some((m) => m.id === reservation.id)) : true
  const compradorId = reservation && !mia ? (grupo.deOtros.find((x) => x.reserva.id === reservation.id)?.compradorId ?? null) : null
  const uso = useDocumentosDeLaEntrada(reservation, 'entrada', compradorId)
  const { preguntar: preguntarDia, hoja: hojaDeDia } = usePreguntaDeDia()
  const [ampliado, setAmpliado] = useState<DocumentoDelBloque | null>(null)
  const [codigos, setCodigos] = useState(false)
  const [subir, setSubir] = useState(false)
  const [cadaUno, setCadaUno] = useState(false)
  const [sheet, setSheet] = useState<ReservationTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const archivo = useRef<HTMLInputElement>(null)

  const billete = reservation ? billetes.de(reservation.refId) : null
  const conDoc = uso.lista.filter((x) => docConCodigo(x.doc))
  const deLaLista: DocumentoDelBloque[] | undefined = uso.modo === 'unico' || conDoc.length === 0 ? undefined : uso.modo === 'comun' ? [{ clave: 'comun', codigo: conDoc[0].doc!.codigo!, tuya: true }] : conDoc.map((x) => ({ clave: x.personaId, codigo: x.doc!.codigo!, nombre: x.nombre, tuya: x.esMio }))
  const docs: DocumentoDelBloque[] = deLaLista ?? (entradaConCodigo(billete) ? [{ clave: 'mio', codigo: billete.codigo, tuya: true }] : [])
  const paraTodos = uso.modo === 'comun' ? uso.lista.length : null

  const alPulsar = () => {
    if (!reservation || !route) return
    if (docs.length === 1) setAmpliado(docs[0])
    else if (docs.length > 1) setCodigos(true)
    else if (esParaVarios(reservation)) setCadaUno(true)
    else if (estadoDelPaseParaDocumentos() === 'sin') abrirAvisoPase('documento_entrada', { destino: route.destination })
    else setSubir(true)
  }

  const anio = route?.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined
  const alElegir = async (f: File | undefined) => {
    if (!f || !reservation || !target) return
    setError(null)
    try {
      const leida: DatosEntradaLeida = await leerEntrada(f, { anioPorDefecto: anio })
      if (leida.aviso) setError(leida.aviso)
      else if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer la entrada. Puedes añadir los datos a mano.')
      else preguntarDia(reservation, { fecha: leida.fecha, hora: leida.hora }, 'entrada', null, (existing, usar) => setSheet({ ...target, existing, lectura: usar ? leida : { ...leida, fecha: null, hora: null } }))
    } catch {
      setError('No hemos podido leer la entrada. Puedes añadir los datos a mano.')
    } finally {
      if (archivo.current) archivo.current.value = ''
    }
  }

  const nodos = (
    <>
      <input ref={archivo} type="file" accept="application/pdf,image/*" className="hidden" data-entrada-archivo="ficha" onChange={(e) => void alElegir(e.target.files?.[0])} />
      {error && (
        <span role="status" data-entrada-error className="text-center text-[12.5px] leading-snug text-accent-red">
          {error}
        </span>
      )}
      {codigos && reservation && (
        <HojaAbajo titleId="hoja-codigos-entrada" onClose={() => setCodigos(false)} capa={118}>
          <div data-hoja-codigos-entrada className="flex flex-col gap-3">
            <h2 id="hoja-codigos-entrada" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
              Tu entrada
            </h2>
            <BloqueDelCodigo
              datos="ficha"
              documentos={docs}
              paraTodos={paraTodos}
              onAmpliar={(d) => setAmpliado(d)}
              faltan={uso.modo === 'porPersona' ? uso.lista.filter((x) => !docConCodigo(x.doc)).map((x) => ({ clave: x.personaId, nombre: x.nombre })) : []}
              onSubir={
                esParaVarios(reservation)
                  ? () => {
                      setCodigos(false)
                      setCadaUno(true)
                    }
                  : undefined
              }
            />
          </div>
        </HojaAbajo>
      )}
      {ampliado && reservation && <CodigoPantallaCompleta codigo={ampliado.codigo} titulo={reservation.name} cuando="" pie={ampliado.tuya === false && ampliado.nombre ? `Entrada de ${ampliado.nombre}` : billete?.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={() => setAmpliado(null)} />}
      {subir && <HojaAnadirDocumento clave="documento_entrada" onSubir={() => archivo.current?.click()} onEscribir={() => reservation && target && setSheet({ ...target, existing: reservation, soloDatos: true })} onClose={() => setSubir(false)} />}
      {cadaUno && reservation && <HojaEntradasDeCadaUno reserva={reservation} tipo="entrada" año={anio} onClose={() => setCadaUno(false)} />}
      {hojaDeDia}
      {sheet && route && <AddReservationSheet route={route} target={sheet} onClose={() => setSheet(null)} />}
    </>
  )
  // Sin documento y la entrada no es mía (me cubre la del dueño): nada que ver ni que subir: el botón no sale.
  const sinNadaQueHacer = docs.length === 0 && (cubiertaPorElDueno || !mia)
  return { texto: sinNadaQueHacer ? null : docs.length > 0 ? 'Ver entrada' : '+ Subir tu entrada', alPulsar, nodos }
}
