import { useRef, useState } from 'react'
import type { LegState } from '../../../lib/reservasLegs'
import type { Route } from '../../../lib/types'
import { useBilleteStore, excursionConCodigo, type BilleteGuardado } from '../../../store/useBilleteStore'
import { useBilletesDeExcursiones } from '../../../hooks/useBilleteExcursion'
import { leerExcursion } from '../../../lib/billeteLeer'
import { claveDeEscala, etiquetaDeTramo, type TramoDeEscala } from '../../../lib/escalasYUnion'
import { fechaLarga } from '../../../lib/fechaLarga'
import { diaEntero } from '../../../lib/billete'
import { CodigoPantallaCompleta, TarjetaBillete } from './TarjetaBillete'

/**
 * (V76, Design «Añadir una reserva» R8b) LA TARJETA DE UN TRAMO DE ESCALA en «Llegada y vuelta»: «IDA · 1 DE 2», «VUELTA · 2 DE 2»… Es la tarjeta de billete de siempre (`TarjetaBillete`) con SU PROPIA tarjeta de embarque y su QR
 * y sus tres iconos (QR, lápiz, papelera). Los datos del tramo (compañía, número, de dónde a dónde, horas) salen de la ruta (`arrivalEscalas` / `departureEscalas`); el código va a `useBilleteStore.datos.excursiones`
 * con la clave `escala:<mitad>:<n>` (privado de cada persona, a `billetes_personales` sin migración). El lápiz abre la hoja del vuelo, donde se cambian las escalas; la papelera quita este tramo (con su billete).
 */
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

export function TarjetaDeEscala({ route, leg, indice, total, n, tramo, onCambiar, onQuitar }: { route: Route; leg: LegState; indice: number; total: number; n: number; tramo: TramoDeEscala; onCambiar: () => void; onQuitar: () => void }) {
  const billetes = useBilletesDeExcursiones()
  const clave = claveDeEscala(leg.kind, indice)
  const guardado = billetes.de(clave)
  const archivo = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ampliado, setAmpliado] = useState(false)
  const esIda = leg.kind === 'arrival'
  const año = route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined
  const billete: BilleteGuardado | null = guardado ? { horaRoma: null, localizador: guardado.localizador, terminal: null, asiento: null, coche: null, codigo: guardado.codigo, dueno: guardado.dueno, actualizado: guardado.actualizado } : null
  // El tramo como una «mitad» de las de siempre: en la ida, sale a `otraHora` y llega a `time`; en la vuelta, sale a `time` y llega a `otraHora`.
  const tramoComoMitad: LegState = {
    ...leg,
    mode: leg.mode === 'coche' ? 'avion' : leg.mode,
    time: esIda ? tramo.llegada : tramo.salida,
    codigo: tramo.codigo || null,
    compania: tramo.compania || null,
    otroPunto: tramo.de || null,
    otraHora: esIda ? tramo.salida : tramo.llegada,
    point: null,
    done: true,
  }
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const trayecto = [tramo.de, tramo.a].filter(Boolean).join(' → ')
  const horaFuera = esIda ? tramo.salida : tramo.llegada
  const alElegir = async (fichero: File | undefined) => {
    if (!fichero) return
    setLeyendo(true)
    setError(null)
    try {
      const leida = await leerExcursion(fichero, { anioPorDefecto: año })
      if (leida.aviso) setError(leida.aviso)
      else if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer tu billete.')
      else useBilleteStore.getState().ponerExcursion(billetes.tripId, clave, { personas: leida.personas, localizador: leida.localizador, codigo: leida.codigo, dueno: guardado?.dueno ?? billetes.yoId })
    } catch {
      setError('No hemos podido leer tu billete.')
    } finally {
      setLeyendo(false)
      if (archivo.current) archivo.current.value = ''
    }
  }
  const conCodigo = excursionConCodigo(guardado)
  return (
    <>
      <input ref={archivo} type="file" accept="application/pdf,image/*" className="hidden" data-escala-archivo={clave} onChange={(e) => void alElegir(e.target.files?.[0])} />
      <TarjetaBillete
        leg={tramoComoMitad}
        trayecto={trayecto}
        fecha={fecha}
        billete={billete}
        duracion={null}
        horaFuera={horaFuera}
        onCambiar={onCambiar}
        onQuitar={() => {
          onQuitar()
          if (guardado) useBilleteStore.getState().quitarExcursion(billetes.tripId, clave)
        }}
        onAnadirTarjeta={() => !leyendo && archivo.current?.click()}
        onAmpliar={() => setAmpliado(true)}
        rotulo={etiquetaDeTramo(leg.kind, n, total)}
        clave={`escala-${leg.kind}-${indice}`}
      />
      {error && (
        <span role="status" data-escala-error className="mx-3.5 mb-2 block text-center text-[12.5px] leading-snug text-accent-red">
          {error}
        </span>
      )}
      {ampliado && conCodigo && guardado?.codigo && <CodigoPantallaCompleta codigo={guardado.codigo} titulo={trayecto || 'Tu tramo'} cuando={[diaEntero(leg.dateIso), esIda ? tramo.salida : tramo.salida].filter(Boolean).join(' · ')} pie={[tramo.compania, tramo.codigo].filter(Boolean).join(' · ')} onClose={() => setAmpliado(false)} />}
    </>
  )
}
