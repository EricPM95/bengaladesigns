import { useRef, useState, type ReactNode } from 'react'
import { leerEntrada, type DatosEntradaLeida } from '../../../lib/billeteLeer'
import type { BilleteDeEntrada } from '../../../store/useBilleteStore'
import { entradaConCodigo } from '../../../store/useBilleteStore'
import { CodigoPantallaCompleta } from './TarjetaBillete'
import { queEliminarEntrada } from '../../../lib/queEliminar'
import type { Persona } from '../../../store/useViajeCompartido'
import { AvisoDeDocumentoDeReserva, BotonAnadirDocumento, IconoDeDocumento, LapizDeReserva, PapeleraRoja } from './BotonesDeReserva'
import { CajaDia, CajaHora, TarjetaCrema, Trazo } from './PiezasDesignReservas'
import { useDocumentosDeLaEntrada } from '../../../hooks/useDocumentosDeLaEntrada'
import { conCodigo as docConCodigo } from '../../../lib/entradasPorPersona'
import type { Reservation } from '../../../lib/bookings'
import { BloqueDelCodigo, DatosDeLaEntrada, accesoDeLaEntrada, nombresDeLasPersonas, type DocumentoDelBloque } from './DatosDeLaEntrada'
import { Etiqueta } from '../../ui/Etiqueta'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { estadoDelPaseParaDocumentos } from '../../../lib/pago'

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
export function BotonAnadirEntrada({ onLeida, año, datos = 'entrada-anadir', onAMano, borde = false, alPulsar }: { onLeida: (datos: DatosEntradaLeida) => void; /** (V65) Una entrada de más de una persona: en vez de la hoja pequeña y el selector, abre «Las entradas de cada uno». */ alPulsar?: () => void; año?: number; datos?: string; /** (V45 §1) El botón de borde «+ Sube tu entrada» de la tarjeta guardada. */ borde?: boolean; /** (10S9b §1) «o escribe los datos a mano» (solo con pase): abre «Datos de la entrada» vacía. */ onAMano?: () => void }) {
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
      <BotonAnadirDocumento estilo={borde ? 'borde' : 'dorado'} texto={leyendo ? 'Leyendo tu entrada…' : borde ? 'Sube tu entrada' : 'Añadir tu entrada'} clave="documento_entrada" datos={datos} icono={<Trazo d="entrada" size={18} color="#4A3510" grosor={1.9} />} onAnadir={() => !leyendo && (alPulsar ? alPulsar() : ref.current?.click())} aMano={alPulsar ? undefined : onAMano} />
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
  claveDeAviso,
  onSubirVarias,
  compro,
  documentos,
  paraTodos,
  reserva,
  compradorId,
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
  /** (V52 §5b) El id de la reserva: la línea naranja «Esta entrada es del… Revisa que sea la buena» + [Es correcta] sale dentro de la tarjeta. */
  claveDeAviso?: string
  /** (V65) Entrada de más de una persona: [+ Sube tu entrada] abre «Las entradas de cada uno» (`HojaEntradasDeCadaUno`) en vez de subir un solo archivo. */
  onSubirVarias?: () => void
  /** (V65 §1) En el móvil de quien NO la compró: el nombre de quien la compró («Tú y Eric · La compró Eric»). */
  compro?: string | null
  /** (V65 §2) Los códigos del bloque oscuro (uno por persona, el tuyo primero). Sin esto, el del billete guardado. */
  documentos?: DocumentoDelBloque[]
  /** (V65 §2) Un solo código para todos: «ENTRADA PARA 4». */
  paraTodos?: number | null
  /** (V65 §2) La reserva: de ella salen los documentos de cada persona (el hook de la V65). Sin ella, solo el billete guardado. */
  reserva?: Pick<Reservation, 'refId' | 'paraQuien'>
  compradorId?: string | null
}) {
  const uso = useDocumentosDeLaEntrada(reserva ?? null, 'entrada', compradorId)
  const conDoc = uso.lista.filter((x) => docConCodigo(x.doc))
  // «Un QR por persona»: el mío primero y los demás deslizando; «un solo QR para todos»: uno, «ENTRADA PARA N».
  const deLaLista: DocumentoDelBloque[] | undefined = uso.modo === 'unico' || conDoc.length === 0 ? undefined : uso.modo === 'comun' ? [{ clave: 'comun', codigo: conDoc[0].doc!.codigo!, tuya: true }] : conDoc.map((x) => ({ clave: x.personaId, codigo: x.doc!.codigo!, nombre: x.nombre, tuya: x.esMio }))
  const paraTodosEf = paraTodos ?? (uso.modo === 'comun' ? uso.lista.length : null)
  const [ampliado, setAmpliado] = useState<DocumentoDelBloque | null>(null)
  // (V64 §2) [Cambiar] de la línea naranja: subir otra vez (el mismo selector de archivos de siempre) o escribir los datos.
  const otroArchivo = useRef<HTMLInputElement>(null)
  const subirOtra = async (archivo: File | undefined) => {
    if (!archivo) return
    try {
      const leida = await leerEntrada(archivo, { anioPorDefecto: año })
      if (!leida.aviso && (leida.fuentes.length > 0 || leida.codigo)) onLeida(leida)
    } catch {
      // Sin lectura no cambia nada: la entrada se queda como estaba.
    } finally {
      if (otroArchivo.current) otroArchivo.current.value = ''
    }
  }
  const pedirOtra = () => {
    if (estadoDelPaseParaDocumentos() === 'sin') abrirAvisoPase('documento_entrada', {})
    else otroArchivo.current?.click()
  }
  const docs: DocumentoDelBloque[] = documentos ?? deLaLista ?? (entradaConCodigo(billete) ? [{ clave: 'mio', codigo: billete.codigo, tuya: true }] : [])
  const conCodigo = docs.length > 0
  const localizador = billete?.localizador ? billete.localizador.toUpperCase() : null
  // (V65 §1) «PERSONAS»: cuántas y quiénes (solo en un viaje en grupo); sin grupo, las que dice el documento.
  const personas = gente.length >= 2 ? gente.length : (billete?.personas ?? null)
  const hayFilas = personas !== null || Boolean(precio) || Boolean(localizador) || accesoDeLaEntrada(nombre, hora) !== null
  return (
    <TarjetaCrema datos={datos}>
      <div className="flex items-start gap-2.5">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Etiqueta datos={{ 'data-entrada-chip': '1' }}>{chip}</Etiqueta>
          <span data-entrada-nombre className="[overflow-wrap:anywhere]" style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
            {nombre}
          </span>
          {nota && (
            <span data-nota-reserva className="text-[12.5px] leading-snug text-text/60">
              {nota}
            </span>
          )}
        </span>
        {/* (V45 §1) El icono del documento junto al lápiz: el QR gris con «+» si falta, dorado si está (al tocarlo, en grande). */}
        {!soloVer && onLapizArriba && (
          <span className="flex flex-none items-center">
            <IconoDeDocumento hay={conCodigo} onAbrir={() => setAmpliado(docs[0] ?? null)} datos="entrada" />
            <LapizDeReserva onClick={onLapizArriba} etiqueta="Cambiar el sitio, el día y la hora" datos="entrada-arriba" />
            {onQuitar && <PapeleraRoja onClick={onQuitar} etiqueta="Quitar la entrada" que={queEliminarEntrada(nombre)} datos="entrada" />}
          </span>
        )}
      </div>
      <div className="flex items-stretch gap-2.5">
        <CajaDia rotulo={diaRotulo} grande={diaGrande} />
        <CajaHora hora={hora} />
      </div>
      <div className="relative" data-seccion-datos="entrada">
        <DatosDeLaEntrada datos="entrada" precio={precio} localizador={localizador} personas={personas} quienes={gente.length >= 2 ? nombresDeLasPersonas(gente, !soloVer) : null} compro={compro ?? null} acceso={accesoDeLaEntrada(nombre, hora)} />
        {!soloVer && (conCodigo || localizador) && onLapizDatos && (
          <span className="absolute -right-[7px] -top-[17px]">
            <LapizDeReserva onClick={onLapizDatos} etiqueta="Cambiar los datos de la entrada" datos="entrada-datos" />
          </span>
        )}
        {!hayFilas && <span className="text-[13px] text-text/55">Para quién es y cuánto ha costado.</span>}
      </div>
      <div data-entrada-billete={billete && (billete.localizador || conCodigo) ? 'con-billete' : 'sin-billete'} className="flex flex-col gap-3">
        <input ref={otroArchivo} type="file" accept="application/pdf,image/*" className="hidden" data-entrada-archivo="cambiar" onChange={(e) => void subirOtra(e.target.files?.[0])} />
        <AvisoDeDocumentoDeReserva clave={claveDeAviso} documento="documento_entrada" onSubir={pedirOtra} onEscribir={onLapizDatos} />
        {conCodigo && <BloqueDelCodigo datos="entrada" documentos={docs} paraTodos={paraTodosEf} onAmpliar={(d) => setAmpliado(d)} faltan={uso.modo === 'porPersona' ? uso.lista.filter((x) => !docConCodigo(x.doc)).map((x) => ({ clave: x.personaId, nombre: x.nombre })) : []} onSubir={onSubirVarias} />}
        {!conCodigo && ((!soloVer && onLeida) || onSubirVarias) && <BotonAnadirEntrada borde onLeida={onLeida} año={año} datos="entrada-sin-codigo" onAMano={onLapizDatos} alPulsar={onSubirVarias} />}
        {extra}
      </div>
      {ampliado && <CodigoPantallaCompleta codigo={ampliado.codigo} titulo={nombre} cuando={cuando} pie={ampliado.tuya === false && ampliado.nombre ? `Entrada de ${ampliado.nombre}` : billete?.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={() => setAmpliado(null)} />}
    </TarjetaCrema>
  )
}

/** E3: el código de la entrada a pantalla completa: el nombre y «Viernes 27 · 09:00» arriba, el código lo más grande posible y «Localizador ABC123» abajo. */
export function CodigoDeEntradaPantallaCompleta({ billete, titulo, cuando, onClose }: { billete: BilleteDeEntrada & { codigo: NonNullable<BilleteDeEntrada['codigo']> }; titulo: string; cuando: string; onClose: () => void }) {
  return <CodigoPantallaCompleta codigo={billete.codigo} titulo={titulo} cuando={cuando} pie={billete.localizador ? `Localizador ${billete.localizador.toUpperCase()}` : ''} onClose={onClose} />
}
