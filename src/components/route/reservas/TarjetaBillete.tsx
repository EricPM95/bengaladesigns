import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LegState } from '../../../lib/reservasLegs'
import { legWord } from '../../../lib/reservasLegs'
import { diaEntero } from '../../../lib/billete'
import type { BilleteGuardado, CodigoDelBillete } from '../../../store/useBilleteStore'
import { Icono } from '../../ui/Icono'
import { iconoDeMedio, EliminarTexto, INK } from './BloqueReservas'

/**
 * LA MITAD DEL VUELO (O DEL TREN…) EN RESERVAS, con su billete (Tanda 10S5 §4; `Piezas/Billete Reservas` B1, B2 y B3). Todo lo del billete es de esta persona (se guarda en su móvil y se ve sin internet).
 *   · Sin código (B1): la hora grande de siempre, el trayecto con paréntesis, los datos que haya y [Añadir tarjeta de embarque] (o [Añadir tu billete]) con «Desde el PDF, una foto o una captura.»; «Eliminar» al final, a la derecha.
 *   · Con código (B2, B3): las dos horas grandes (si se conocen), el trayecto, los datos en su fila con su nombre —solo los que haya—, el código en pequeño con «Toca para ampliar» y «Eliminar» al final.
 */
const FILA: CSSProperties = { width: '50%', display: 'flex', alignItems: 'center', gap: 8, font: "600 13.5px 'Geist'", minWidth: 0 }

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
}

export interface FilaDeDato {
  clave: string
  texto: string
  dibujo: keyof typeof DIBUJO
}

/** Los datos en su fila con su nombre: «Vuelo VY 6102», «1 h 55 min», «Terminal 1», «Asiento 14C» (tren: «Tren 03180», «3 h 2 min», «Coche 003», «Asiento 01D»). Solo los que haya. El localizador va aparte. */
export function filasDelBillete(leg: Pick<LegState, 'mode' | 'codigo'>, billete: BilleteGuardado | null, duracion: string | null): FilaDeDato[] {
  const palabra = leg.mode === 'avion' ? 'Vuelo' : leg.mode === 'tren' ? 'Tren' : leg.mode === 'bus' ? 'Autobús' : 'Barco'
  const filas: FilaDeDato[] = []
  if (leg.codigo) filas.push({ clave: 'numero', texto: `${palabra} ${leg.codigo.toUpperCase()}`, dibujo: leg.mode === 'avion' ? 'avion' : 'tren' })
  if (duracion) filas.push({ clave: 'duracion', texto: duracion, dibujo: 'reloj' })
  if (billete?.terminal) filas.push({ clave: 'terminal', texto: /^terminal/i.test(billete.terminal) ? billete.terminal : `Terminal ${billete.terminal}`, dibujo: 'terminal' })
  if (billete?.coche) filas.push({ clave: 'coche', texto: /^coche/i.test(billete.coche) ? billete.coche : `Coche ${billete.coche}`, dibujo: 'coche' })
  if (billete?.asiento) filas.push({ clave: 'asiento', texto: /^asiento/i.test(billete.asiento) ? billete.asiento : `Asiento ${billete.asiento}`, dibujo: 'asiento' })
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
}: {
  leg: LegState
  trayecto: string
  fecha: string
  billete: BilleteGuardado | null
  duracion: string | null
  /** La hora del lado de fuera (salida de la ida / llegada de la vuelta), si el viajero la puso o el billete la trae. */
  horaFuera: string | null
  onCambiar: () => void
  onQuitar: () => void
  onAnadirTarjeta: () => void
  onAmpliar: () => void
}) {
  const esIda = leg.kind === 'arrival'
  const word = legWord(leg.mode)
  const conCodigo = Boolean(billete?.codigo && (billete.codigo.dibujo || billete.codigo.imagen))
  const filas = filasDelBillete(leg, billete, duracion)
  const botonTexto = leg.mode === 'avion' ? 'Añadir tarjeta de embarque' : 'Añadir tu billete'
  const iconoMedio = iconoDeMedio(leg.mode)
  const horas = horaFuera ? (esIda ? [horaFuera, leg.time] : [leg.time, horaFuera]) : null
  return (
    <div data-mitad={leg.kind} data-mitad-hecha="1" data-billete-privado={conCodigo ? 'con-codigo' : 'sin-codigo'} className="mx-3.5 mb-3 flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }}>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full px-[11px]" style={{ background: '#1C2230', color: '#F3D88F', font: "700 11px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
          <Icono nombre={iconoMedio} size={12} />
          {esIda ? 'IDA' : 'VUELTA'}
        </span>
        <span className="min-w-0 flex-1" style={{ font: "600 14px 'Geist'", color: INK }} data-mitad-fecha>
          {fecha}
        </span>
        <button type="button" onClick={onCambiar} data-cambiar-mitad className="zona-toque" style={{ font: "italic 400 16px 'Instrument Serif',serif", textDecoration: 'underline', color: INK }}>
          Cambiar
        </button>
      </div>

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
        <div className="flex flex-wrap" data-billete-filas style={{ borderTop: '1px dotted rgba(28,34,48,.28)', borderBottom: '1px dotted rgba(28,34,48,.28)', padding: '12px 0', rowGap: 12 }}>
          {filas.map((f) => (
            <span key={f.clave} style={FILA} data-billete-fila={f.clave}>
              <IconoDeFila>{DIBUJO[f.dibujo]}</IconoDeFila>
              <span className="min-w-0 truncate">{f.texto}</span>
            </span>
          ))}
        </div>
      )}
      {billete?.localizador && (
        <span style={{ font: "600 13.5px 'Geist'" }} data-billete-fila="localizador">
          Localizador {billete.localizador.toUpperCase()}
        </span>
      )}

      {conCodigo && billete?.codigo ? (
        <button type="button" onClick={onAmpliar} data-billete-codigo-pequeno className="flex w-full items-center gap-3.5 text-left">
          <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
            <CodigoDibujado codigo={billete.codigo} tam={72} />
          </span>
          <span className="flex items-center gap-1.5" style={{ font: "600 13px 'Geist'", color: '#6E5018' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
            </svg>
            Toca para ampliar
          </span>
        </button>
      ) : (
        <>
          <button type="button" onClick={onAnadirTarjeta} data-billete-anadir className="flex h-[50px] items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />
            </svg>
            {botonTexto}
          </button>
          <span className="-mt-1.5 text-center text-[12.5px] text-text/55" data-billete-ayuda>
            Desde el PDF, una foto o una captura.
          </span>
        </>
      )}

      <EliminarTexto alinear="derecha" onClick={onQuitar} texto={`Eliminar ${word.noun}`} />
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
