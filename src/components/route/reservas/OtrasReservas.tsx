import { useRef, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useMisReservas } from '../../../store/useMisReservas'
import { useBilleteStore, excursionConCodigo } from '../../../store/useBilleteStore'
import { useAnadirReservaStore } from '../../../store/useAnadirReservaStore'
import { removeReservationWithUndo } from '../../../store/useAddFlowStore'
import { useBilletesDeExcursiones } from '../../../hooks/useBilleteExcursion'
import { useEntradasDelGrupo, useReservasParaMi } from '../../../hooks/useEntradasDelGrupo'
import { leerExcursion, type DatosExcursionLeida } from '../../../lib/billeteLeer'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { excursionesDeLaRuta } from '../../../lib/bookings'
import { bloquesExtra, diaDeLaTarjetaExtra, fraseDelDocumentoExtra, nombreDelBloqueExtra, queEliminarReservaExtra, rotuloDeLaTarjetaExtra, textoGuardados, trayectoDeLaReservaExtra, type ReservaExtra, type TipoExtra } from '../../../lib/reservasExtra'
import type { Route } from '../../../lib/types'
import { Icono } from '../../ui/Icono'
import { DORADO } from '../../ui/botonesOro'
import { BloqueShell, EstadoBloque, FlechaBloque, IconoBloque, iconoDeMedio, ICONOS, INK, tituloBloqueStyle } from './BloqueReservas'
import { BotonAnadirDocumento, IconoDeDocumento, LapizDeReserva, PapeleraRoja, type ClaveDocumento } from './BotonesDeReserva'
import { CajaDeDato } from './PiezasDesignReservas'
import { CodigoPantallaCompleta, D_CAJAS, ImagenDelCodigo } from './TarjetaBillete'

/**
 * (V75, apartado 4; Design «Añadir una reserva» R6 y R12) LOS BLOQUES DE LAS RESERVAS NUEVAS DE RESERVAS: un bloque por cada tipo con alguna guardada, igual que los demás: el icono sobre el mismo fondo, el nombre («Ferry», «Tren», «Autobús», «Otras reservas»)
 * y «1 guardado» / «2 guardados». Van al final de la lista, ANTES de «Útil para el viaje»; sin ninguna guardada, el bloque no sale. NO cuentan en «X de N reservas listas».
 * Dentro, la tarjeta de billete de siempre (la de `TarjetaBillete`): NAVIERA / COMPAÑÍA, PUERTO / ESTACIÓN, las horas, el trayecto y «+ Sube tu billete». Arriba a la derecha: el QR (gris con «+» si falta), el lápiz y la papelera, de izquierda a derecha.
 * El billete se guarda donde se guardan los de las excursiones (`useBilleteStore`, mapa `excursiones`, clave = el id de la reserva → `billetes_personales`). Primero se guarda, después se sube (V45).
 */
const ICONO_DEL_TIPO: Record<TipoExtra, 'tren' | 'bus' | 'ferry' | null> = { ferry: 'ferry', tren: 'tren', bus: 'bus', otra: null }
const iconoDelTipo = (tipo: TipoExtra) => (tipo === 'otra' ? ICONOS.ticket : iconoDeMedio(ICONO_DEL_TIPO[tipo] as 'tren' | 'bus' | 'ferry'))
const claveDelDocumento = (tipo: TipoExtra): ClaveDocumento => (tipo === 'ferry' ? 'documento_barco' : tipo === 'otra' ? 'documento_excursion' : 'documento_tren')
const PUNTEADA = '1px dotted rgba(28,34,48,.28)'

export function TarjetaDeReservaExtra({ route, reserva, rotulo }: { route: Route; reserva: ReservaExtra; /** (V76) «TREN AL CENTRO»: el rótulo de un tren o autobús unido a la llegada o a la vuelta (dentro de «Llegada y vuelta»). */ rotulo?: string }) {
  const billetes = useBilletesDeExcursiones()
  const grupo = useEntradasDelGrupo()
  const billete = billetes.de(reserva.id)
  const conCodigo = excursionConCodigo(billete)
  const archivo = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ampliado, setAmpliado] = useState(false)
  const abrirFormulario = useAnadirReservaStore((state) => state.abrirFormulario)
  const tipo = reserva.kind
  const esOtra = tipo === 'otra'
  const dia = diaDeLaTarjetaExtra(route, reserva)
  const trayecto = trayectoDeLaReservaExtra(reserva)
  const localizador = (reserva.locator ?? billete?.localizador ?? '').trim()
  const asiento = [reserva.coche ? `Coche ${reserva.coche.replace(/^coche\s*/i, '')}` : '', reserva.asiento ? `Asiento ${reserva.asiento.replace(/^asiento\s*/i, '')}` : ''].filter(Boolean).join(' · ')
  const doc = fraseDelDocumentoExtra(tipo)
  const año = route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined

  const alElegir = async (fichero: File | undefined) => {
    if (!fichero) return
    setLeyendo(true)
    setError(null)
    try {
      const leida: DatosExcursionLeida = await leerExcursion(fichero, { anioPorDefecto: año })
      if (leida.aviso) setError(leida.aviso)
      else if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer tu billete. Puedes escribir los datos a mano con el lápiz.')
      else useBilleteStore.getState().ponerExcursion(billetes.tripId, reserva.id, { personas: leida.personas, localizador: leida.localizador, codigo: leida.codigo, dueno: billete?.dueno ?? billetes.yoId })
    } catch {
      setError('No hemos podido leer tu billete. Puedes escribir los datos a mano con el lápiz.')
    } finally {
      setLeyendo(false)
      if (archivo.current) archivo.current.value = ''
    }
  }
  /** Lo mismo que hacía la papelera de las demás: se va la reserva (y con ella su línea del presupuesto, el gasto) y su billete. */
  const eliminar = () => {
    if (grupo.esInvitado) useMisReservas.getState().quitar(reserva.id)
    else removeReservationWithUndo(reserva.id)
    if (billete) useBilleteStore.getState().quitarExcursion(billetes.tripId, reserva.id)
  }
  const horaGrande = { font: "400 38px/1 'Instrument Serif',serif" } as const
  return (
    <div data-extra-tarjeta={tipo} data-extra-id={reserva.id} className="flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }}>
      <div className="flex items-center gap-2.5" data-extra-cabecera>
        <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-[11px]" style={{ background: '#1C2230', color: '#F3D88F', font: "700 11px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
          <Icono nombre={iconoDelTipo(tipo)} size={12} />
          {rotulo ?? rotuloDeLaTarjetaExtra(tipo).replace(/^OTRA RESERVA$/, 'OTRA')}
        </span>
        <span className="min-w-0 flex-1" />
        {/* QR (gris con «+» si falta; dorado si está), lápiz y papelera, de izquierda a derecha. */}
        <span className="-my-2 -mr-2.5 flex flex-none items-center">
          <IconoDeDocumento hay={Boolean(conCodigo)} tipo={esOtra ? 'reserva' : 'qr'} onAbrir={() => setAmpliado(true)} datos={`extra-${tipo}`} />
          <LapizDeReserva onClick={() => abrirFormulario(tipo, reserva.id)} etiqueta={`Cambiar ${esOtra ? 'la reserva' : `el ${tipo === 'bus' ? 'autobús' : tipo}`}`} datos={`extra-${tipo}`} />
          <PapeleraRoja onClick={eliminar} etiqueta={`Quitar ${esOtra ? 'la reserva' : `el ${tipo === 'bus' ? 'autobús' : tipo}`}`} que={queEliminarReservaExtra(reserva)} datos={`extra-${tipo}`} />
        </span>
      </div>

      <span style={{ font: "600 14px 'Geist'", color: INK }} data-extra-dia>
        {dia}
      </span>
      {esOtra && (
        <span className="[overflow-wrap:anywhere]" data-extra-nombre style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
          {reserva.name}
        </span>
      )}

      {reserva.returnTime ? (
        <div className="flex items-center gap-2" data-extra-horas>
          <span style={horaGrande} data-extra-hora-salida>
            {reserva.time}
          </span>
          <span aria-hidden="true" className="h-0 min-w-2 flex-1" style={{ borderTop: '1.5px dashed rgba(181,138,46,.6)' }} />
          <span aria-hidden="true" className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', color: '#8E6820' }}>
            <Icono nombre={iconoDelTipo(tipo)} size={15} />
          </span>
          <span aria-hidden="true" className="h-0 min-w-2 flex-1" style={{ borderTop: '1.5px dashed rgba(181,138,46,.6)' }} />
          <span style={horaGrande} data-extra-hora-llegada>
            {reserva.returnTime}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3" data-extra-horas>
          <span style={horaGrande} data-extra-hora-salida>
            {reserva.time}
          </span>
        </div>
      )}
      {trayecto && (
        <span data-extra-trayecto className="[overflow-wrap:anywhere]" style={{ font: "500 14px 'Geist'", color: 'rgba(28,34,48,.7)', marginTop: -4 }}>
          {trayecto}
        </span>
      )}

      {(reserva.compania || (!esOtra && reserva.origen) || asiento || localizador || reserva.precio) && (
        <div className="grid grid-cols-2 gap-2" data-extra-datos style={{ borderTop: PUNTEADA, paddingTop: 12 }}>
          {reserva.compania && (
            <CajaDeDato rotulo={tipo === 'ferry' ? 'NAVIERA' : 'COMPAÑÍA'} icono={{ d: D_CAJAS.compania }} datos="compania">
              {reserva.compania}
            </CajaDeDato>
          )}
          {!esOtra && reserva.origen && (
            <CajaDeDato rotulo={tipo === 'ferry' ? 'PUERTO' : 'ESTACIÓN'} icono={{ d: D_CAJAS.estacion }} datos="estacion">
              {reserva.origen}
            </CajaDeDato>
          )}
          {asiento && (
            <CajaDeDato rotulo="ASIENTO" icono={{ d: D_CAJAS.asiento }} datos="asiento">
              {asiento}
            </CajaDeDato>
          )}
          {localizador && (
            <CajaDeDato rotulo="LOCALIZADOR" icono={{ d: D_CAJAS.localizador }} datos="localizador">
              {localizador.toUpperCase()}
            </CajaDeDato>
          )}
          {reserva.precio && (
            <CajaDeDato rotulo="PRECIO" icono={{ eur: true }} datos="precio">
              {precioEnVista(reserva.precio)}
            </CajaDeDato>
          )}
        </div>
      )}

      {conCodigo && billete?.codigo ? (
        <>
          <div aria-hidden="true" className="relative -mx-4 h-0" style={{ borderTop: '1.5px dashed rgba(181,138,46,.6)' }}>
            <span className="absolute -left-[9px] -top-[10px] h-[18px] w-[18px] rounded-full" style={{ background: '#FFFDF8' }} />
            <span className="absolute -right-[9px] -top-[10px] h-[18px] w-[18px] rounded-full" style={{ background: '#FFFDF8' }} />
          </div>
          <div data-extra-codigo className="flex items-center gap-3.5 rounded-[20px] p-3.5" style={{ background: 'linear-gradient(160deg,#232A3C,#1C2230)', boxShadow: '0 16px 24px -18px rgba(28,34,48,.9)' }}>
            <button type="button" onClick={() => setAmpliado(true)} aria-label="Ampliar el código" className="flex-none rounded-[14px] border-none bg-white p-2">
              <ImagenDelCodigo codigo={billete.codigo} tam={84} />
            </button>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>{doc.rotulo}</span>
              <span style={{ font: "400 21px/1.15 'Instrument Serif',serif", color: '#FFFDF8' }}>{doc.frase}</span>
              <button type="button" onClick={() => setAmpliado(true)} className="flex h-[34px] items-center gap-[7px] self-start rounded-xl border-none px-[13px] text-[12.5px] font-bold" style={{ background: DORADO, color: '#4A3510' }}>
                Ampliar
              </button>
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2" style={{ borderTop: PUNTEADA, paddingTop: 12 }}>
          <input ref={archivo} type="file" accept="application/pdf,image/*" className="hidden" data-extra-archivo={reserva.id} onChange={(e) => void alElegir(e.target.files?.[0])} />
          <BotonAnadirDocumento estilo="borde" texto={leyendo ? 'Leyendo tu billete…' : esOtra ? 'Sube tu reserva' : 'Sube tu billete'} clave={claveDelDocumento(tipo)} datos={`extra-${tipo}`} onAnadir={() => !leyendo && archivo.current?.click()} aMano={() => abrirFormulario(tipo, reserva.id)} />
          {error && (
            <span role="status" data-extra-error className="text-center text-[12.5px] leading-snug text-accent-red">
              {error}
            </span>
          )}
        </div>
      )}
      {ampliado && conCodigo && billete?.codigo && <CodigoPantallaCompleta codigo={billete.codigo} titulo={reserva.name} cuando={`${dia} · ${reserva.time}`} pie={trayecto || doc.frase} onClose={() => setAmpliado(false)} />}
    </div>
  )
}

function BloqueDeUnTipo({ route, tipo, reservas }: { route: Route; tipo: TipoExtra; reservas: ReservaExtra[] }) {
  // Se abre con lo recién guardado (como en el dibujo); el viajero lo pliega y lo abre con su flecha.
  const [abierto, setAbierto] = useState(true)
  return (
    <BloqueShell bloque={`extra-${tipo}`} className="p-3.5">
      <div onClick={() => setAbierto(!abierto)} data-cabecera-bloque data-cabecera-extra={tipo} className="flex cursor-pointer items-center gap-3.5 px-0.5">
        <IconoBloque nombre={iconoDelTipo(tipo)} />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span data-titulo-bloque style={tituloBloqueStyle}>
            {nombreDelBloqueExtra(tipo)}
          </span>
          <EstadoBloque texto={textoGuardados(reservas.length)} hecho />
        </span>
        <FlechaBloque abierto={abierto} />
      </div>
      {abierto && (
        <div className="mt-3 flex flex-col gap-3" data-extra-lista={tipo}>
          {reservas.map((reserva) => (
            <TarjetaDeReservaExtra key={reserva.id} route={route} reserva={reserva} />
          ))}
        </div>
      )}
    </BloqueShell>
  )
}

/** Los bloques de ferry, tren, autobús y otras reservas (solo los que tienen alguna guardada), al final de la lista y antes de «Útil para el viaje». */
export function OtrasReservasDelViaje({ route }: { route: Route }) {
  useMonedaViajero()
  const reservas = useReservasParaMi()
  // Vacío al abrir el viaje de otra persona sin nada: nada que pintar. (El almacén de la ruta se lee aquí solo para repintar al guardar.)
  useRouteStore((state) => state.reservations)
  // (V76) Las unidas a una excursión se ven DENTRO de su ficha de «Excursiones y actividades», no en un bloque aparte.
  // Si su excursión ya no está en la ruta, la reserva no se pierde de vista: vuelve a su bloque.
  const excursionesDeHoy = new Set(excursionesDeLaRuta(route, reservas).map((f) => f.excursion.id))
  const bloques = bloquesExtra(reservas.filter((r) => !(r.unidaA && excursionesDeHoy.has(r.unidaA))))
  if (bloques.length === 0) return null
  return (
    <div className="flex flex-col gap-3.5" data-otras-reservas>
      {bloques.map((bloque) => (
        <BloqueDeUnTipo key={bloque.tipo} route={route} tipo={bloque.tipo} reservas={bloque.reservas} />
      ))}
    </div>
  )
}
