import { useState, type ReactNode } from 'react'
import { HojaAnadirDocumento } from './HojaAnadirDocumento'
import { ICONOS } from '../../../lib/iconos'
import { usePaseParaDocumentos } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Icono } from '../../ui/Icono'
import { CandadoRedondo } from '../../pase/Candado'
import { useRouteStore } from '../../../store/useRouteStore'
import { BOTON_CLARO, BOTON_ORO, DORADO } from '../../ui/botonesOro'
import { BotonHoja, DosBotonesHoja, Hoja } from '../../ui/Hoja'
import { quitarAvisoDeDocumento, useAvisoDeDocumento } from '../../../lib/avisoDeDocumento'
import { useSyncStore } from '../../../store/useSyncStore'

/**
 * LAS PIEZAS COMPARTIDAS DE LOS BLOQUES DE RESERVAS (Tanda 10S8, agente C; `Piezas/Billete Reservas` y `Piezas/Entradas Billete`): las usan Llegada y vuelta, Entradas y Free Tour y Alojamiento.
 *   · `BotonAnadirDocumento`: el botón dorado [Añadir tarjeta de embarque] / [Añadir tu billete] / [Añadir tu entrada] / [Añadir tu reserva]. SIN pase lleva el candado dorado en su círculo azul noche
 *     (arriba a la izquierda) y, al tocarlo, abre el aviso pequeño del pase con el texto que toque (`clave`, en `avisoPaseTextos.ts`) en vez de abrir el selector de archivos. CON pase, nunca candado.
 *     Mientras no se sabe si hay pase, ni candado ni aviso (se comporta como con pase; el servidor es quien manda).
 *   · `PapeleraRoja`: la papelera roja ARRIBA a la derecha (después del QR y el lápiz; V75), con su hoja de confirmar (`HojaEliminarReserva`).
 *   · `LapizDeReserva`: el lápiz (botón de 44 × 44 con el círculo azul noche de 30 y el lápiz dorado).
 */
export type ClaveDocumento = 'documento_vuelo' | 'documento_tren' | 'documento_barco' | 'documento_entrada' | 'documento_excursion' | 'documento_alojamiento' | 'documento_coche'

/** La clave del aviso del pase para el documento de un medio de transporte. */
export const claveDocumentoDeMedio = (mode: string): ClaveDocumento => (mode === 'avion' ? 'documento_vuelo' : mode === 'ferry' ? 'documento_barco' : 'documento_tren')

export function BotonAnadirDocumento({
  texto,
  clave,
  onAnadir,
  datos = 'anadir-documento',
  icono,
  aMano,
  estilo = 'dorado',
}: {
  texto: string
  clave: ClaveDocumento
  /** Lo que pasa con el pase (abrir el selector de archivos, la hoja…). */
  onAnadir: () => void
  datos?: string
  icono?: ReactNode
  /** (V64 §1) [Escribir los datos] de la hoja pequeña que sale al pulsar el botón (con pase): abre la hoja de datos de siempre vacía. Sin él (el billete del invitado), el botón abre el selector de archivos directamente. Ya no hay enlace «o escribe los datos a mano». */
  aMano?: () => void
  /** (V45 §1) `borde`: el botón de borde «+ Añade/Sube…» (el de las tarjetas guardadas de vuelo, alojamiento, entradas y excursiones) en vez del dorado grande. Hace lo mismo. */
  estilo?: 'dorado' | 'borde'
}) {
  const estado = usePaseParaDocumentos()
  const destino = useRouteStore((s) => s.route?.destination) ?? ''
  const cerrado = estado === 'sin'
  const [hoja, setHoja] = useState(false)
  return (
    <div className="relative flex flex-col" data-anadir-doc-envoltorio>
      <button
        type="button"
        onClick={() => (cerrado ? abrirAvisoPase(clave, { destino: destino || undefined }) : aMano ? setHoja(true) : onAnadir())}
        data-billete-anadir={datos}
        data-anadir-doc={datos}
        data-con-candado={cerrado ? '1' : '0'}
        className={estilo === 'borde' ? 'flex h-[46px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[15px] px-2 text-[13.5px] font-bold' : 'flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold'}
        style={estilo === 'borde' ? BOTON_CLARO /* (V70, V64-27) el botón claro de siempre, el mismo en alojamiento, vuelo, entradas y excursiones */ : BOTON_ORO}
      >
        {estilo === 'borde' ? (
          <svg className="flex-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        ) : icono ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONOS.pase} />
          </svg>
        )}
        {texto}
      </button>
      {cerrado && <CandadoRedondo diametro={24} datos="documento" className="pointer-events-none absolute -left-1.5 -top-2" />}
      {hoja && aMano && <HojaAnadirDocumento clave={clave} onSubir={onAnadir} onEscribir={aMano} onClose={() => setHoja(false)} />}
    </div>
  )
}

/**
 * (V75 §5, R12 y D1-D2) LA PAPELERA ROJA, ARRIBA A LA DERECHA de toda tarjeta guardada, la TERCERA tras el QR y el lápiz (ya no va abajo): botón de 44 × 44 con el círculo rosa suave de 30 y la papelera en rojo.
 * Al tocarla sale la hoja de abajo de D1: «¿Seguro que quieres eliminar {que}?», «Se borrará de tus reservas y no se puede deshacer.» y [Cancelar] / [Sí, eliminar] lado a lado; solo [Sí, eliminar] llama a `onClick` (lo que hacía la papelera de antes).
 * `etiqueta` es lo que lee el lector de pantalla («Quitar la ida»); `que` es la frase del título, ya con su artículo («tu vuelo de ida», «tu entrada del Coliseo», «tu ferry a La Graciosa»).
 */
export function PapeleraRoja({ onClick, etiqueta, que = 'esta reserva', datos = 'papelera', atributos }: { onClick: () => void; etiqueta: string; que?: string; datos?: string; /** Atributos `data-*` de más (las pruebas viejas buscan `data-eliminar`). */ atributos?: Record<string, string>; /** (V75) Ya no hay variante de abajo: se admite y se ignora. */ enLinea?: boolean }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setAbierta(true)
        }}
        aria-label={etiqueta}
        data-papelera={datos}
        {...atributos}
        className="flex h-11 w-11 flex-none items-center justify-center border-none bg-transparent p-0"
      >
        <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: 'oklch(0.52 0.19 25 / .14)', color: 'oklch(0.52 0.19 25)' }}>
          <Icono nombre="papelera" size={16} />
        </span>
      </button>
      {abierta && (
        <HojaEliminarReserva
          que={que}
          datos={datos}
          onCancelar={() => setAbierta(false)}
          onEliminar={() => {
            setAbierta(false)
            onClick()
          }}
        />
      )}
    </>
  )
}

/** (V75 D1-D2) La hoja de confirmar el borrado de una reserva: una sola para todas las tarjetas (vuelo, alojamiento, entrada, excursión, coche, ferry, tren, autobús y otra). */
export function HojaEliminarReserva({ que, datos = 'papelera', onCancelar, onEliminar }: { que: string; datos?: string; onCancelar: () => void; onEliminar: () => void }) {
  return (
    <Hoja onCerrar={onCancelar} titulo={`¿Seguro que quieres eliminar ${que}?`} datos={`eliminar-${datos}`}>
      <span data-eliminar-aviso className="text-[14.5px] font-medium leading-[1.45]" style={{ color: 'rgba(28,34,48,.7)' }}>
        Se borrará de tus reservas y no se puede deshacer.
      </span>
      <DosBotonesHoja>
        <BotonHoja tipo="secundario" onClick={onCancelar} datos="eliminar-cancelar">
          Cancelar
        </BotonHoja>
        <button
          type="button"
          onClick={onEliminar}
          data-boton-hoja="eliminar-confirmar"
          data-eliminar-confirmar=""
          style={{ minHeight: 52, padding: '0 12px', borderRadius: 16, width: '100%', border: 'none', background: '#B83A3A', color: '#fff', font: "700 15px 'Geist'", boxShadow: '0 10px 16px -12px rgba(120,20,20,.8)', cursor: 'pointer' }}
        >
          Sí, eliminar
        </button>
      </DosBotonesHoja>
    </Hoja>
  )
}

const D_QR = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2v2'
const D_RESERVA = 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7'

/**
 * (V45 §1) EL ICONO DEL DOCUMENTO de una tarjeta guardada (vuelo, alojamiento, entrada, excursión), arriba a la derecha junto al lápiz: el QR (o la hoja de la reserva) en GRIS con un «+» mientras falta, y DORADO cuando está.
 * Dorado: al tocarlo se abre en grande (`onAbrir`: `CodigoPantallaCompleta`). Gris: hace lo mismo que el botón de borde «+ Añade/Sube…» de la misma tarjeta (con su aviso del pase si no hay pase): busca ese botón en la tarjeta y lo toca.
 * Regla de la V45: solo se AÑADE; el documento se sube DESPUÉS de guardar, nunca en la hoja.
 */
export function IconoDeDocumento({ hay, tipo = 'qr', onAbrir, onAnadir, etiqueta, datos = 'documento', grande = false }: { hay: boolean; tipo?: 'qr' | 'reserva'; onAbrir?: () => void; onAnadir?: () => void; etiqueta?: string; datos?: string; /** (V70) El QR de HOY como el dibujo de Design: el círculo de 52 px (icono de 26) sobre la foto de la tarjeta de llegada y de vuelta. */ grande?: boolean }) {
  const nombre = etiqueta ?? (hay ? (tipo === 'qr' ? 'Ver el código en grande' : 'Ver tu reserva') : tipo === 'qr' ? 'Añadir el código' : 'Añadir tu reserva')
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        if (hay) return onAbrir?.()
        let p = (event.currentTarget as HTMLElement).parentElement
        while (p) {
          const boton = p.querySelector<HTMLElement>('[data-anadir-doc]')
          if (boton) return boton.click()
          p = p.parentElement
        }
        onAnadir?.()
      }}
      aria-label={nombre}
      data-icono-documento={hay ? 'si' : 'falta'}
      data-icono-documento-tipo={datos}
      className={`relative flex flex-none items-center justify-center border-none bg-transparent p-0 ${grande ? 'h-[52px] w-[52px]' : 'h-11 w-11'}`}
    >
      <span aria-hidden="true" className={`flex items-center justify-center rounded-full ${grande ? 'h-[52px] w-[52px]' : 'h-[30px] w-[30px]'}`} style={hay ? { background: DORADO, border: grande ? '1.5px solid rgba(181,138,46,.8)' : '1.5px solid #B58A2E', color: grande ? '#5A3E0C' : '#4A3510' } : grande ? { background: '#ECEAE4', border: '1.5px solid rgba(28,34,48,.14)', color: 'rgba(28,34,48,.42)' } : { background: '#ECE8DE', border: '1.5px solid rgba(107,102,90,.4)', color: '#6B665A' }}>
        <svg width={grande ? 26 : 15} height={grande ? 26 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d={tipo === 'qr' ? D_QR : D_RESERVA} />
        </svg>
      </span>
      {!hay && (
        <span aria-hidden="true" className={`absolute flex items-center justify-center rounded-full font-bold leading-none ${grande ? '-bottom-1 -right-1 h-5 w-5 text-[14px]' : 'bottom-[5px] right-[5px] h-[15px] w-[15px] text-[12px]'}`} style={grande ? { background: '#8E6820', color: '#fff', border: '2px solid #fff' } : { background: '#1C2230', color: '#F3D88F' }}>
          +
        </span>
      )}
    </button>
  )
}

/** El lápiz de 44 × 44 (zona de toque) con el círculo azul noche de 30 y el lápiz dorado, como en Design. */
export function LapizDeReserva({ onClick, etiqueta, datos = 'lapiz', atributos }: { onClick: () => void; etiqueta: string; datos?: string; atributos?: Record<string, string> }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      aria-label={etiqueta}
      data-lapiz={datos}
      {...atributos}
      className="flex h-11 w-11 flex-none items-center justify-center border-none bg-transparent p-0"
    >
      <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: '#1C2230', border: '1.5px solid #B58A2E', color: '#F3D88F' }}>
        <Icono nombre="lapiz" size={14} />
      </span>
    </button>
  )
}

/**
 * (V45 §6, V52 §5b y V64 §2) LA LÍNEA NARANJA DE UN DOCUMENTO QUE NO CUADRA, UNA SOLA PIEZA: «⚠ Esta tarjeta de embarque es del viernes 13 y tu vuelo es el martes 24. Si no es la buena, súbela otra vez o cambia los datos a mano.»
 * y, debajo, dos botones pequeños: [Es correcta] y [Cambiar] (abre la hoja de «añadir un documento»: subir otra vez o escribir los datos), DENTRO de la tarjeta.
 * La usan el vuelo/tren/barco, la entrada, la excursión y el alojamiento. Se queda hasta cambiar el documento o pulsar [Es correcta]. Sin `onSubir` ni `onEscribir` (una tarjeta que aún no los trae) no sale [Cambiar].
 */
export function LineaNaranjaDeDocumento({ texto, onCorrecta, clave, onSubir, onEscribir }: { texto: string; onCorrecta: () => void; /** Qué documento es, para los textos de la hoja de [Cambiar]. */ clave?: ClaveDocumento; onSubir?: () => void; onEscribir?: () => void }) {
  const [hoja, setHoja] = useState(false)
  const puedeCambiar = Boolean(clave && (onSubir || onEscribir))
  const botonPequeno = { background: '#fff', border: '1px solid rgba(194,88,28,.4)', color: '#9A4A12' }
  return (
    <div data-aviso-documento="fecha" role="status" className="flex flex-col gap-2 rounded-[14px] px-3 py-2.5" style={{ background: '#FDECD9', border: '1px solid rgba(194,88,28,.4)' }}>
      <span className="text-[13px] font-semibold leading-[1.3]" style={{ color: '#9A4A12' }}>⚠ {texto}</span>
      <span className="flex gap-2">
        <button type="button" onClick={onCorrecta} data-aviso-documento-correcta className="zona-toque rounded-full px-3 py-1.5 text-[12.5px] font-bold" style={botonPequeno}>
          Es correcta
        </button>
        {puedeCambiar && (
          <button type="button" onClick={() => setHoja(true)} data-aviso-documento-cambiar className="zona-toque rounded-full px-3 py-1.5 text-[12.5px] font-bold" style={botonPequeno}>
            Cambiar
          </button>
        )}
      </span>
      {hoja && clave && <HojaAnadirDocumento clave={clave} onSubir={() => onSubir?.()} onEscribir={() => onEscribir?.()} onClose={() => setHoja(false)} />}
    </div>
  )
}

/** (V52 §5b) La línea naranja de la entrada, la excursión o el alojamiento: lee el aviso guardado de ese documento (clave = el id de la reserva o aloj:tramo) y no pinta nada si no hay. */
export function AvisoDeDocumentoDeReserva({ clave, documento, onSubir, onEscribir }: { clave: string | null | undefined; /** (V64 §2) Qué documento es y cómo se cambia: [Cambiar] abre la hoja de añadir un documento. */ documento?: ClaveDocumento; onSubir?: () => void; onEscribir?: () => void }) {
  const tripId = useSyncStore((s) => s.activeTripId)
  const texto = useAvisoDeDocumento(tripId, clave ?? '')
  if (!clave || !texto) return null
  return <LineaNaranjaDeDocumento texto={texto} onCorrecta={() => quitarAvisoDeDocumento(tripId, clave)} clave={documento} onSubir={onSubir} onEscribir={onEscribir} />
}
