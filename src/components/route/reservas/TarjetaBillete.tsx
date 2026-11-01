import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LegState } from '../../../lib/reservasLegs'
import { diaEntero } from '../../../lib/billete'
import type { BilleteGuardado, CodigoDelBillete } from '../../../store/useBilleteStore'
import { Icono } from '../../ui/Icono'
import { iconoDeMedio, INK } from './BloqueReservas'
import { BotonAnadirDocumento, LapizDeReserva, PapeleraRoja, claveDocumentoDeMedio } from './BotonesDeReserva'

/**
 * LA MITAD DEL VUELO (O DEL TREN…) EN RESERVAS, con su billete (Tanda 10S5 §4; 10S8 §3, `Piezas/Billete Reservas` B1b a B3). Todo lo del billete es de esta persona (se guarda en su móvil y se ve sin internet). Por bloques:
 *   1. El día y las horas: «IDA · Jueves 26 noviembre» con su lápiz (abre la hoja del vuelo), la hora grande (sin tarjeta, «Llegas a las 11:25»; con ella, las dos horas) y el trayecto.
 *   2. Los datos (solo con tarjeta o con datos puestos): vuelo, duración, terminal, asiento, localizador, con su lápiz («Datos del vuelo»).
 *   3. El código en pequeño con «Toca para ampliar»; o, sin él, [Añadir tarjeta de embarque] (con el candado sin pase). Sin duración calculada, sin «Desde el PDF…» y sin «Cambiar los datos».
 *   4. Abajo a la derecha, la papelera roja que quita ese lado.
 */
const FILA: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, font: "600 13.5px 'Geist'", minWidth: 0 }
const PUNTEADA = '1px dotted rgba(28,34,48,.28)'

function IconoDeFila({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: '#F3E3B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

/** Los dibujos de las filas, los del diseño (avión, reloj, terminal, asiento, tren, billete). */
const DIBUJO = {
  avion: <path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z" />,
  tren: <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1M9 15l-1-1M15 15l1-1M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5zM8 19l-2 3M16 19l2 3" />,
  reloj: <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
  terminal: <path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6" />,
  asiento: <path d="M8 4v8h7l2 5M8 12v6M13 12v6" />,
  coche: <path d="M4 7h16v10H4zM4 12h16M9 7v10" />,
  billete: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />,
}

export interface FilaDeDato {
  clave: string
  texto: string
  dibujo: keyof typeof DIBUJO
}

/**
 * Los datos en su fila con su nombre: «Vuelo VY 6102», «1 h 55 min», «Terminal 1», «Asiento 14C», «Localizador ABC123» (tren: «Tren 03180», «3 h 2 min», «Coche 003», «Asiento 01D»). Solo los que haya.
 * (10S8) La duración calculada solo se pasa con la tarjeta puesta: sin tarjeta no sale.
 */
export function filasDelBillete(leg: Pick<LegState, 'mode' | 'codigo'>, billete: BilleteGuardado | null, duracion: string | null): FilaDeDato[] {
  const palabra = leg.mode === 'avion' ? 'Vuelo' : leg.mode === 'tren' ? 'Tren' : leg.mode === 'bus' ? 'Autobús' : 'Barco'
  const filas: FilaDeDato[] = []
  if (leg.codigo) filas.push({ clave: 'numero', texto: `${palabra} ${leg.codigo.toUpperCase()}`, dibujo: leg.mode === 'avion' ? 'avion' : 'tren' })
  if (duracion) filas.push({ clave: 'duracion', texto: duracion, dibujo: 'reloj' })
  if (billete?.terminal) filas.push({ clave: 'terminal', texto: /^terminal/i.test(billete.terminal) ? billete.terminal : `Terminal ${billete.terminal}`, dibujo: 'terminal' })
  if (billete?.coche) filas.push({ clave: 'coche', texto: /^coche/i.test(billete.coche) ? billete.coche : `Coche ${billete.coche}`, dibujo: 'coche' })
  if (billete?.asiento) filas.push({ clave: 'asiento', texto: /^asiento/i.test(billete.asiento) ? billete.asiento : `Asiento ${billete.asiento}`, dibujo: 'asiento' })
  if (billete?.localizador) filas.push({ clave: 'localizador', texto: `Localizador ${billete.localizador.toUpperCase()}`, dibujo: 'billete' })
  return filas
}

/** El código en una imagen (el recorte guardado). Sin imagen, nada. */
export function ImagenDelCodigo({ codigo, tam, datos }: { codigo: CodigoDelBillete; tam: number; datos?: string }) {
  const fuente = codigo.dibujo ?? codigo.imagen
  if (!fuente) return null
  return <img src={fuente} alt="Código de tu billete" width={tam} height={tam} data-codigo-imagen={datos} style={{ width: tam, height: tam, objectFit: 'contain', display: 'block', background: '#fff', imageRendering: codigo.dibujo ? 'auto' : 'pixelated' }} />
}

/** Dibuja el código: la imagen guardada (el recorte, o el que la app redibujó al leerlo). */
function CodigoDibujado({ codigo, tam }: { codigo: CodigoDelBillete; tam: number }) {
  return <ImagenDelCodigo codigo={codigo} tam={tam} />
}

/** La cabecera de una mitad: «IDA» / «VUELTA», el día y el lápiz de arriba (la hoja del vuelo). `onToggle`: la Ida plegada (B2c) se abre y se cierra tocando su línea. */
export function CabeceraDeMitad({ leg, fecha, resto, onCambiar, onToggle, pasada }: { leg: Pick<LegState, 'kind' | 'mode'>; fecha: string; /** (B2c) Lo que va tras el día en la línea plegada: «11:25 · Fiumicino». */ resto?: string; onCambiar: () => void; onToggle?: () => void; pasada?: boolean }) {
  const esIda = leg.kind === 'arrival'
  const contenido = (
    <>
      <span className="inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-[11px]" style={{ background: '#1C2230', color: '#F3D88F', font: "700 11px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
        <Icono nombre={iconoDeMedio(leg.mode)} size={12} />
        {esIda ? 'IDA' : 'VUELTA'}
      </span>
      <span className="min-w-0 flex-1" style={{ font: "600 14px 'Geist'", color: INK, textAlign: 'left' }} data-mitad-fecha>
        {fecha}
        {resto ? <span data-mitad-resumen> · {resto}</span> : null}
      </span>
    </>
  )
  return (
    <div className="flex items-center gap-2.5" data-mitad-cabecera={leg.kind}>
      {onToggle ? (
        <button type="button" onClick={onToggle} aria-expanded={!pasada} data-mitad-plegable={leg.kind} className="flex min-w-0 flex-1 items-center gap-2.5 border-none bg-transparent p-0">
          {contenido}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2.5">{contenido}</span>
      )}
      <span className="-my-2 -mr-2.5 flex-none">
        <LapizDeReserva onClick={onCambiar} etiqueta={`Cambiar ${esIda ? 'la ida' : 'la vuelta'}`} datos={`mitad-${leg.kind}`} atributos={{ 'data-cambiar-mitad': '' }} />
      </span>
    </div>
  )
}

export function TarjetaBillete({
  leg,
  trayecto,
  fecha,
  billete,
  duracion,
  horaFuera,
  onCambiar,
  onQuitar,
  onAnadirTarjeta,
  onAmpliar,
  onDatos,
  onToggle,
}: {
  leg: LegState
  trayecto: string
  fecha: string
  billete: BilleteGuardado | null
  duracion: string | null
  /** La hora del lado de fuera (salida de la ida / llegada de la vuelta), si el viajero la puso o el billete la trae. */
  horaFuera: string | null
  /** El lápiz de arriba: la hoja del vuelo (horas, aeropuertos). */
  onCambiar: () => void
  onQuitar: () => void
  onAnadirTarjeta: () => void
  onAmpliar: () => void
  /** El lápiz del bloque de datos: «Datos del vuelo». */
  onDatos?: () => void
  /** (B2c) Con la Ida ya pasada, tocar la cabecera la pliega. */
  onToggle?: () => void
}) {
  const esIda = leg.kind === 'arrival'
  const conCodigo = Boolean(billete?.codigo && (billete.codigo.dibujo || billete.codigo.imagen))
  // (10S8, B1b) Sin tarjeta ni datos guardados: solo la hora grande y el trayecto (ni fila de datos ni su lápiz). Con datos (o con la tarjeta): sus filas y el lápiz de «Datos del vuelo».
  // (10S9b §1) Lo escrito a mano en «Datos del vuelo» (localizador, terminal, asiento, coche) ya cuenta igual que lo leído del documento: guarda la misma fila privada y abre el bloque con su lápiz. El número del vuelo solo NO lo abre (viene también de la hoja del vuelo, «Ref. vuelo»).
  const conDatos = conCodigo || Boolean(leg.codigo) || Boolean(billete && (billete.localizador || billete.terminal || billete.asiento || billete.coche))
  const filas = conDatos ? filasDelBillete(leg, billete, conCodigo ? duracion : null) : []
  const botonTexto = leg.mode === 'avion' ? 'Añadir tarjeta de embarque' : 'Añadir tu billete'
  const iconoMedio = iconoDeMedio(leg.mode)
  const horas = horaFuera ? (esIda ? [horaFuera, leg.time] : [leg.time, horaFuera]) : null
  return (
    <div data-mitad={leg.kind} data-mitad-hecha="1" data-billete-privado={conCodigo ? 'con-codigo' : 'sin-codigo'} className="mx-3.5 mb-3 flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }}>
      <CabeceraDeMitad leg={leg} fecha={fecha} onCambiar={onCambiar} onToggle={onToggle} />

      {horas ? (
        <div className="flex items-center gap-2" data-billete-horas>
          <span className="min-w-0 flex-1" style={{ font: "400 38px/1 'Instrument Serif',serif" }} data-billete-hora-izq>
            {horas[0]}
          </span>
          <span aria-hidden="true" className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', color: '#8E6820' }}>
            <Icono nombre={iconoMedio} size={15} style={{ transform: leg.mode === 'avion' ? 'rotate(45deg)' : undefined }} />
          </span>
          <span className="min-w-0 flex-1 text-right" style={{ font: "400 38px/1 'Instrument Serif',serif" }} data-billete-hora-der>
            {horas[1]}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2.5" data-billete-horas>
          <span style={{ font: "400 15px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{esIda ? 'Llegas a las' : 'Sales a las'}</span>
          <span style={{ font: "400 44px/1 'Instrument Serif',serif" }} data-billete-hora-sola>
            {leg.time}
          </span>
        </div>
      )}

      <span data-billete-trayecto style={{ font: "500 14px 'Geist'", color: 'rgba(28,34,48,.7)', marginTop: horas ? -4 : 0 }}>
        {trayecto}
      </span>

      {filas.length > 0 && (
        <div className="flex items-start gap-1" data-billete-datos style={{ borderTop: PUNTEADA, paddingTop: 12 }}>
          <div className="min-w-0 flex-1" data-billete-filas style={{ display: 'grid', gridTemplateColumns: 'minmax(0,max-content) minmax(0,1fr)', columnGap: 8, rowGap: 12 }}>
            {filas.map((f) => (
              <span key={f.clave} style={f.clave === 'localizador' ? { ...FILA, gridColumn: '1 / -1' } : FILA} data-billete-fila={f.clave}>
                <IconoDeFila>{DIBUJO[f.dibujo]}</IconoDeFila>
                <span className="min-w-0" style={{ whiteSpace: f.clave === 'numero' ? 'nowrap' : undefined, overflowWrap: 'anywhere' }}>{f.texto}</span>
              </span>
            ))}
          </div>
          {onDatos && (
            <span className="-mr-2.5 -mt-1.5 flex-none">
              <LapizDeReserva onClick={onDatos} etiqueta={`Cambiar los datos del ${leg.mode === 'avion' ? 'vuelo' : 'billete'}`} datos="datos-billete" atributos={{ 'data-billete-cambiar-datos': '' }} />
            </span>
          )}
        </div>
      )}

      {conCodigo && billete?.codigo ? (
        <button type="button" onClick={onAmpliar} data-billete-codigo-pequeno className="flex w-full items-center gap-3.5 text-left" style={{ borderTop: PUNTEADA, paddingTop: 12 }}>
          <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
            <CodigoDibujado codigo={billete.codigo} tam={72} />
          </span>
          <span className="flex flex-col items-start gap-1.5" style={{ font: "600 13px 'Geist'", color: INK }}>
            Toca para ampliar
            <span aria-hidden="true" className="flex h-[34px] w-[34px] items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
              </svg>
            </span>
          </span>
        </button>
      ) : (
        <div style={{ borderTop: filas.length === 0 ? PUNTEADA : undefined, paddingTop: filas.length === 0 ? 12 : 0 }}>
          <BotonAnadirDocumento texto={botonTexto} clave={claveDocumentoDeMedio(leg.mode)} onAnadir={onAnadirTarjeta} datos={`vuelo-${leg.kind}`} aMano={onDatos} />
        </div>
      )}

      <div className="flex flex-col" style={{ borderTop: conCodigo ? PUNTEADA : undefined, paddingTop: conCodigo ? 12 : 0 }}>
        <PapeleraRoja onClick={onQuitar} etiqueta={`Quitar ${esIda ? 'la ida' : 'la vuelta'}`} datos={`mitad-${leg.kind}`} atributos={{ 'data-eliminar': 'derecha' }} />
      </div>
    </div>
  )
}

/**
 * EL CÓDIGO A PANTALLA COMPLETA (B4): fondo blanco, el código lo más grande posible, el trayecto y la hora arriba, «Asiento 14C · Vuelo VY 6102» abajo y la ✕. Desde la web no se puede subir el brillo del móvil.
 */
export function CodigoPantallaCompleta({ codigo, titulo, cuando, pie, onClose }: { codigo: CodigoDelBillete; titulo: string; cuando: string; pie: string; onClose: () => void }) {
  const [lado, setLado] = useState(() => (typeof window === 'undefined' ? 320 : Math.min(window.innerWidth - 48, window.innerHeight - 260, 560)))
  useEffect(() => {
    const medir = () => setLado(Math.max(180, Math.min(window.innerWidth - 48, window.innerHeight - 260, 560)))
    medir()
    window.addEventListener('resize', medir)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Tu código" data-billete-pantalla-completa className="fixed inset-0 flex flex-col items-center px-6" style={{ zIndex: 300, background: '#fff', color: INK, paddingTop: 'max(18px, env(safe-area-inset-top))', paddingBottom: 'max(22px, env(safe-area-inset-bottom))' }}>
      <button type="button" onClick={onClose} aria-label="Cerrar" data-billete-cerrar className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ top: 'max(14px, env(safe-area-inset-top))', background: '#FFFDF8', border: '1.5px solid #B58A2E' }}>
        <Icono nombre="cerrar" size={18} style={{ color: '#8E6820' }} />
      </button>
      <div className="mt-[62px] flex flex-col gap-1.5 text-center">
        <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }} data-billete-grande-titulo>
          {titulo}
        </span>
        <span style={{ font: "500 15px 'Geist'", color: 'rgba(28,34,48,.65)' }} data-billete-grande-cuando>
          {cuando}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <ImagenDelCodigo codigo={codigo} tam={lado} datos="grande" />
      </div>
      <span style={{ font: "600 15px 'Geist'" }} data-billete-grande-pie>
        {pie}
      </span>
    </div>,
    document.body,
  )
}

export { diaEntero }
