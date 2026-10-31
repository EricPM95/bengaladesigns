import { useRef, useState, type ReactNode } from 'react'
import { leerEntrada, type DatosEntradaLeida } from '../../../lib/billeteLeer'
import type { BilleteDeEntrada } from '../../../store/useBilleteStore'
import { entradaConCodigo } from '../../../store/useBilleteStore'
import { CodigoPantallaCompleta, ImagenDelCodigo } from './TarjetaBillete'
import { INK } from './BloqueReservas'
import type { Persona } from '../../../store/useViajeCompartido'
import { BotonAnadirDocumento, LapizDeReserva, PapeleraRoja } from './BotonesDeReserva'
import { CajaDia, CajaHora, FilaIcono, ParaQuienDesign, SeccionDatos, TarjetaCrema, Trazo } from './PiezasDesignReservas'

/**
 * (10S7 §3 y §4) LA ENTRADA CON SU BILLETE (`Piezas/Entradas Billete` E1 a E3 y el botón del código de `Entradas Lista` L2). Lo mismo que el billete del vuelo (10S5), para las entradas y el Free Tour:
 *   · E1 [Añadir tu entrada] «Desde el PDF, una foto o una captura.» → la app lee el día, la hora, cuántas personas y el localizador y guarda el código.
 *   · E2 con su billete: «2 personas», «Localizador ABC123» y el código en pequeño con «Toca para ampliar».
 *   · E3 el código a pantalla completa (el mismo de la tarjeta de embarque).
 * Todo lo del billete es de esta persona: se guarda en su móvil (y en su fila privada, 0070) y se ve sin internet.
 */

const QR = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2v2'

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
 * E1: [Añadir tu entrada]. Abre el selector de archivos, lee la entrada y devuelve los datos (`onLeida`). Si no se puede leer nada, lo dice y deja añadirla a mano.
 * (10S8 §2) SIN pase lleva el candado dorado y, al tocarlo, abre el aviso pequeño del pase en vez del selector; con pase, nunca candado. Sin la línea «Desde el PDF, una foto o una captura.» (Design no la lleva).
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
      // (10S8 §1) Si el servidor no pudo leer (límite del día, archivo grande, sin sesión), se enseña su texto exacto.
      if (leida.aviso) setError(leida.aviso)
      else if (leida.fuentes.length === 0 && !leida.codigo) setError('No hemos podido leer la entrada. Puedes añadir los datos a mano.')
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
      <BotonAnadirDocumento texto={leyendo ? 'Leyendo tu entrada…' : 'Añadir tu entrada'} clave="documento_entrada" datos={datos} icono={<Trazo d="entrada" size={18} color="#4A3510" grosor={1.9} />} onAnadir={() => !leyendo && ref.current?.click()} />
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
 * (10S8 §4) LA ENTRADA COMO DESIGN (`Piezas/Entradas Billete` E1 y E2; también el Free Tour): la tarjeta crema con «En tu ruta» pequeño, el sitio grande y su lápiz (sitio, día y hora), el día y la hora en sus cajas,
 * la sección de los datos con su lápiz (para quién, precio, localizador), el código con «Toca para ampliar», [Añadir tu entrada] (candado sin pase) y la papelera.
 * Todo lo del billete es de esta persona: se guarda en su móvil y se ve sin internet, con o sin pase. Sin lápices, papelera ni botón (`soloVer`): la entrada que el dueño reservó para ti.
 */
export function TarjetaEntradaDesign({
  chip,
  nombre,
  diaRotulo,
  diaGrande,
  hora,
  gente,
  precio,
  billete,
  cuando,
  nota,
  soloVer = false,
  onLapizArriba,
  onLapizDatos,
  onQuitar,
  onLeida,
  año,
  extra,
  datos,
}: {
  chip: string
  nombre: string
  diaRotulo: string
  diaGrande: string
  hora: string
  gente: Persona[]
  precio: string | null
  billete: BilleteDeEntrada | null
  cuando: string
  nota?: string
  soloVer?: boolean
  onLapizArriba?: () => void
  onLapizDatos?: () => void
  onQuitar?: () => void
  onLeida: (datos: DatosEntradaLeida) => void
  año?: number
  extra?: ReactNode
  datos?: string
}) {
  const [ampliado, setAmpliado] = useState(false)
  const conCodigo = entradaConCodigo(billete)
  const localizador = billete?.localizador ? billete.localizador.toUpperCase() : null
  const hayFilas = gente.length > 0 || Boolean(precio) || Boolean(localizador)
  return (
    <TarjetaCrema datos={datos}>
      <div className="flex items-start gap-2.5">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="inline-flex h-[22px] items-center self-start whitespace-nowrap rounded-full px-[9px]" data-entrada-chip style={{ background: '#F3E3B2', color: '#6E5018', font: "600 10.5px 'Geist'" }}>
            {chip}
          </span>
          <span data-entrada-nombre className="[overflow-wrap:anywhere]" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
            {nombre}
          </span>
          {nota && (
            <span data-nota-reserva className="text-[12.5px] leading-snug text-text/60">
              {nota}
            </span>
          )}
        </span>
        {!soloVer && onLapizArriba && <LapizDeReserva onClick={onLapizArriba} etiqueta="Cambiar el sitio, el día y la hora" datos="entrada-arriba" />}
      </div>
      <div className="flex items-stretch gap-2.5">
        <CajaDia rotulo={diaRotulo} grande={diaGrande} />
        <CajaHora hora={hora} />
      </div>
      <SeccionDatos datos="entrada" onLapiz={!soloVer ? onLapizDatos : undefined} etiquetaLapiz="Cambiar los datos de la entrada" sinLineaAbajo={!hayFilas && !conCodigo}>
        {gente.length > 0 && <ParaQuienDesign gente={gente} />}
        {precio && (
          <FilaIcono icono="euro" datos="precio">
            {precio}
          </FilaIcono>
        )}
        {localizador && (
          <span data-entrada-fila="localizador">
            <FilaIcono icono="entrada" datos="localizador">
              Localizador {localizador}
            </FilaIcono>
          </span>
        )}
        {!hayFilas && <span className="text-[13px] text-text/55">Para quién es y cuánto ha costado.</span>}
      </SeccionDatos>
      <div data-entrada-billete={billete && (billete.localizador || conCodigo) ? 'con-billete' : 'sin-billete'} className="flex flex-col gap-3">
        {conCodigo && billete && (
          <button type="button" onClick={() => setAmpliado(true)} data-entrada-codigo-pequeno className="flex w-full items-center gap-3.5 text-left">
            <span className="rounded-xl bg-white p-1.5" style={{ border: '1px solid rgba(28,34,48,.14)' }}>
              <ImagenDelCodigo codigo={billete.codigo} tam={72} />
            </span>
            <span className="flex flex-col gap-1.5">
              <span style={{ font: "600 14px 'Geist'", color: INK }}>Toca para ampliar</span>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
                <Trazo d="ampliar" size={16} grosor={1.9} />
              </span>
            </span>
          </button>
        )}
        {!conCodigo && !soloVer && onLeida && <BotonAnadirEntrada onLeida={onLeida} año={año} datos="entrada-sin-codigo" />}
        {extra}
        {!soloVer && onQuitar && (
          <>
            {conCodigo && <div style={{ borderTop: '1px dotted rgba(28,34,48,.28)' }} />}
            <PapeleraRoja onClick={onQuitar} etiqueta="Quitar la entrada" datos="entrada" />
          </>
        )}
      </div>
      {ampliado && conCodigo && billete && <CodigoDeEntradaPantallaCompleta billete={billete} titulo={nombre} cuando={cuando} onClose={() => setAmpliado(false)} />}
    </TarjetaCrema>
  )
}

/** E3: el código de la entrada a pantalla completa: el nombre y «Viernes 27 · 09:00» arriba, el código lo más grande posible y «Localizador ABC123» abajo. */
export function CodigoDeEntradaPantallaCompleta({ billete, titulo, cuando, onClose }: { billete: BilleteDeEntrada & { codigo: NonNullable<BilleteDeEntrada['codigo']> }; titulo: string; cuando: string; onClose: () => void }) {
  return <CodigoPantallaCompleta codigo={billete.codigo} titulo={titulo} cuando={cuando} pie={billete.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={onClose} />
}
