import { useRef, useState, type ReactNode } from 'react'
import { leerEntrada, type DatosEntradaLeida } from '../../../lib/billeteLeer'
import type { BilleteDeEntrada } from '../../../store/useBilleteStore'
import { entradaConCodigo } from '../../../store/useBilleteStore'
import { CodigoPantallaCompleta, ImagenDelCodigo } from './TarjetaBillete'
import { EliminarTexto, INK } from './BloqueReservas'

/**
 * (10S7 §3 y §4) LA ENTRADA CON SU BILLETE (`Piezas/Entradas Billete` E1 a E3 y el botón del código de `Entradas Lista` L2). Lo mismo que el billete del vuelo (10S5), para las entradas y el Free Tour:
 *   · E1 [Añadir tu entrada] «Desde el PDF, una foto o una captura.» → la app lee el día, la hora, cuántas personas y el localizador y guarda el código.
 *   · E2 con su billete: «2 personas», «Localizador ABC123» y el código en pequeño con «Toca para ampliar».
 *   · E3 el código a pantalla completa (el mismo de la tarjeta de embarque).
 * Todo lo del billete es de esta persona: se guarda en su móvil (y en su fila privada, 0070) y se ve sin internet.
 */

const QR = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2v2'

function IconoRedondo({ children, lado = 32 }: { children: ReactNode; lado?: number }) {
  return (
    <span aria-hidden="true" style={{ width: lado, height: lado, flex: 'none', borderRadius: '50%', background: '#F3E3B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={Math.round(lado / 2)} height={Math.round(lado / 2)} viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}

/** El botón del código de L2: el cuadradito (redondo, dorado claro) de la derecha de una entrada reservada que tiene su billete. */
export function BotonCodigoDeEntrada({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Ver el código de tu entrada" data-entrada-codigo-boton className="zona-toque flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={QR} />
      </svg>
    </button>
  )
}

/**
 * E1: [Añadir tu entrada] con «Desde el PDF, una foto o una captura.». Abre el selector de archivos, lee la entrada y devuelve los datos (`onLeida`). Si no se puede leer nada, lo dice y deja añadirla a mano.
 */
export function BotonAnadirEntrada({ onLeida, año, datos = 'entrada-anadir' }: { onLeida: (datos: DatosEntradaLeida) => void; año?: number; datos?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    setError(null)
    try {
      const leida = await leerEntrada(archivo, { anioPorDefecto: año })
      if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer la entrada. Puedes añadir los datos a mano.')
      else onLeida(leida)
    } catch {
      setError('No hemos podido leer la entrada. Puedes añadir los datos a mano.')
    } finally {
      setLeyendo(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-2.5">
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" data-entrada-archivo={datos} onChange={(e) => void alElegir(e.target.files?.[0])} />
      <button type="button" disabled={leyendo} onClick={() => ref.current?.click()} data-entrada-anadir={datos} className="flex h-[50px] items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />
        </svg>
        {leyendo ? 'Leyendo tu entrada…' : 'Añadir tu entrada'}
      </button>
      <span className="text-center text-[12.5px] text-text/50" data-entrada-ayuda>
        Desde el PDF, una foto o una captura.
      </span>
      {error && (
        <span role="status" data-entrada-error className="text-center text-[12.5px] leading-snug text-accent-red">
          {error}
        </span>
      )}
    </div>
  )
}

/** Cuántas personas, en palabras: «1 persona», «2 personas». */
export const textoPersonas = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

/**
 * E1/E2 dentro de una entrada reservada. Sin billete: [Añadir tu entrada]. Con billete: «2 personas», «Localizador ABC123» y el código pequeño con «Toca para ampliar» (si hay código); «Quitar tu billete» al final, a la derecha.
 */
export function TarjetaEntradaBillete({ billete, nombre, cuando, onLeida, onQuitar, año }: { billete: BilleteDeEntrada | null; nombre: string; cuando: string; onLeida: (datos: DatosEntradaLeida) => void; onQuitar: () => void; año?: number }) {
  const [ampliado, setAmpliado] = useState(false)
  const conAlgo = Boolean(billete && (billete.personas || billete.localizador || entradaConCodigo(billete)))
  return (
    <div data-entrada-billete={conAlgo ? 'con-billete' : 'sin-billete'} className="mx-1 flex flex-col gap-3 rounded-[20px] px-4 py-3.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)' }}>
      {conAlgo && billete ? (
        <>
          <span className="flex flex-col gap-[9px]">
            {billete.personas ? (
              <span data-entrada-fila="personas" className="flex items-center gap-2.5" style={{ font: "600 14px 'Geist'" }}>
                <IconoRedondo>
                  <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.2a3.5 3.5 0 0 1 0 6.6" />
                </IconoRedondo>
                {textoPersonas(billete.personas)}
              </span>
            ) : null}
            {billete.localizador ? (
              <span data-entrada-fila="localizador" className="flex items-center gap-2.5" style={{ font: "600 14px 'Geist'" }}>
                <IconoRedondo>
                  <path d="M4 7h16v10H4zM4 12h16M9 7v10" />
                </IconoRedondo>
                Localizador {billete.localizador.toUpperCase()}
              </span>
            ) : null}
          </span>
          {entradaConCodigo(billete) && (
            <button type="button" onClick={() => setAmpliado(true)} data-entrada-codigo-pequeno className="flex w-full items-center gap-3.5 text-left">
              <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
                <ImagenDelCodigo codigo={billete.codigo} tam={72} />
              </span>
              <span className="flex flex-col gap-1.5">
                <span style={{ font: "600 14px 'Geist'", color: INK }}>Toca para ampliar</span>
                <IconoRedondo lado={34}>
                  <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                </IconoRedondo>
              </span>
            </button>
          )}
          {!entradaConCodigo(billete) && <BotonAnadirEntrada onLeida={onLeida} año={año} datos="entrada-sin-codigo" />}
          <EliminarTexto alinear="derecha" onClick={onQuitar} texto="Quitar tu billete" />
          {ampliado && entradaConCodigo(billete) && <CodigoDeEntradaPantallaCompleta billete={billete} titulo={nombre} cuando={cuando} onClose={() => setAmpliado(false)} />}
        </>
      ) : (
        <BotonAnadirEntrada onLeida={onLeida} año={año} />
      )}
    </div>
  )
}

/** E3: el código de la entrada a pantalla completa: el nombre y «Viernes 27 · 09:00» arriba, el código lo más grande posible y «Localizador ABC123» abajo. */
export function CodigoDeEntradaPantallaCompleta({ billete, titulo, cuando, onClose }: { billete: BilleteDeEntrada & { codigo: NonNullable<BilleteDeEntrada['codigo']> }; titulo: string; cuando: string; onClose: () => void }) {
  return <CodigoPantallaCompleta codigo={billete.codigo} titulo={titulo} cuando={cuando} pie={billete.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={onClose} />
}
