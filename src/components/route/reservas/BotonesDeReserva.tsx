import type { ReactNode } from 'react'
import { ICONOS } from '../../../lib/iconos'
import { usePaseParaDocumentos } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Icono } from '../../ui/Icono'
import { CandadoRedondo } from '../../pase/Candado'
import { useRouteStore } from '../../../store/useRouteStore'
import { BOTON_ORO, DORADO } from '../../ui/botonesOro'

/**
 * LAS PIEZAS COMPARTIDAS DE LOS BLOQUES DE RESERVAS (Tanda 10S8, agente C; `Piezas/Billete Reservas` y `Piezas/Entradas Billete`): las usan Llegada y vuelta, Entradas y Free Tour y Alojamiento.
 *   · `BotonAnadirDocumento`: el botón dorado [Añadir tarjeta de embarque] / [Añadir tu billete] / [Añadir tu entrada] / [Añadir tu reserva]. SIN pase lleva el candado dorado en su círculo azul noche
 *     (arriba a la izquierda) y, al tocarlo, abre el aviso pequeño del pase con el texto que toque (`clave`, en `avisoPaseTextos.ts`) en vez de abrir el selector de archivos. CON pase, nunca candado.
 *     Mientras no se sabe si hay pase, ni candado ni aviso (se comporta como con pase; el servidor es quien manda).
 *   · `PapeleraRoja`: la papelera roja de 44 × 44 abajo a la derecha que sustituye a «Eliminar vuelo», «Eliminar alojamiento» y «Quitar entrada».
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
  /** (10S9b §1) Con pase: el enlace pequeño «o escribe los datos a mano» debajo del botón, que abre la hoja de datos de siempre vacía (con sus ejemplos en gris). Sin pase no sale (los datos son del pase). */
  aMano?: () => void
  /** (V45 §1) `borde`: el botón de borde «+ Añade/Sube…» (el de las tarjetas guardadas de vuelo, alojamiento, entradas y excursiones) en vez del dorado grande. Hace lo mismo. */
  estilo?: 'dorado' | 'borde'
}) {
  const estado = usePaseParaDocumentos()
  const destino = useRouteStore((s) => s.route?.destination) ?? ''
  const cerrado = estado === 'sin'
  return (
    <div className="relative flex flex-col" data-anadir-doc-envoltorio>
      <button
        type="button"
        onClick={() => (cerrado ? abrirAvisoPase(clave, { destino: destino || undefined }) : onAnadir())}
        data-billete-anadir={datos}
        data-anadir-doc={datos}
        data-con-candado={cerrado ? '1' : '0'}
        className={estilo === 'borde' ? 'flex h-[48px] w-full items-center justify-center gap-2 rounded-[15px] border-[1.5px] border-text/25 bg-transparent text-[14.5px] font-bold text-text' : 'flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold'}
        style={estilo === 'borde' ? undefined : BOTON_ORO}
      >
        {estilo === 'borde' ? (
          <span aria-hidden="true" className="text-[19px] font-medium leading-none">+</span>
        ) : icono ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONOS.pase} />
          </svg>
        )}
        {texto}
      </button>
      {cerrado && <CandadoRedondo diametro={24} datos="documento" className="pointer-events-none absolute -left-1.5 -top-2" />}
      {aMano && estado === 'con' && (
        <button type="button" onClick={aMano} data-datos-a-mano={datos} className="zona-toque mx-auto mt-2 border-none bg-transparent p-0 text-[13px] font-medium text-text/65 underline underline-offset-2">
          o escribe los datos a mano
        </button>
      )}
    </div>
  )
}

/** La papelera roja de 44 × 44, abajo a la derecha de su tarjeta (rosa suave, la papelera en rojo). `etiqueta` es lo que lee el lector de pantalla («Quitar la ida»). */
export function PapeleraRoja({ onClick, etiqueta, datos = 'papelera', atributos }: { onClick: () => void; etiqueta: string; datos?: string; /** Atributos `data-*` de más (las pruebas viejas buscan `data-eliminar`). */ atributos?: Record<string, string> }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      aria-label={etiqueta}
      data-papelera={datos}
      {...atributos}
      className="flex h-11 w-11 flex-none items-center justify-center self-end rounded-full border-none"
      style={{ background: 'oklch(0.52 0.19 25 / .14)', color: 'oklch(0.52 0.19 25)' }}
    >
      <Icono nombre="papelera" size={18} />
    </button>
  )
}

const D_QR = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2v2'
const D_RESERVA = 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7'

/**
 * (V45 §1) EL ICONO DEL DOCUMENTO de una tarjeta guardada (vuelo, alojamiento, entrada, excursión), arriba a la derecha junto al lápiz: el QR (o la hoja de la reserva) en GRIS con un «+» mientras falta, y DORADO cuando está.
 * Dorado: al tocarlo se abre en grande (`onAbrir`: `CodigoPantallaCompleta`). Gris: hace lo mismo que el botón de borde «+ Añade/Sube…» de la misma tarjeta (con su aviso del pase si no hay pase): busca ese botón en la tarjeta y lo toca.
 * Regla de la V45: solo se AÑADE; el documento se sube DESPUÉS de guardar, nunca en la hoja.
 */
export function IconoDeDocumento({ hay, tipo = 'qr', onAbrir, onAnadir, etiqueta, datos = 'documento' }: { hay: boolean; tipo?: 'qr' | 'reserva'; onAbrir?: () => void; onAnadir?: () => void; etiqueta?: string; datos?: string }) {
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
      className="relative flex h-11 w-11 flex-none items-center justify-center border-none bg-transparent p-0"
    >
      <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={hay ? { background: DORADO, border: '1.5px solid #B58A2E', color: '#4A3510' } : { background: '#ECE8DE', border: '1.5px solid rgba(107,102,90,.4)', color: '#6B665A' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d={tipo === 'qr' ? D_QR : D_RESERVA} />
        </svg>
      </span>
      {!hay && (
        <span aria-hidden="true" className="absolute bottom-[5px] right-[5px] flex h-[15px] w-[15px] items-center justify-center rounded-full text-[12px] font-bold leading-none" style={{ background: '#1C2230', color: '#F3D88F' }}>
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
