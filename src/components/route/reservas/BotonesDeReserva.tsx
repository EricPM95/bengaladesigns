import type { ReactNode } from 'react'
import { usePaseParaDocumentos } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Icono } from '../../ui/Icono'
import { CandadoRedondo } from '../../pase/Candado'
import { useRouteStore } from '../../../store/useRouteStore'

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
}: {
  texto: string
  clave: ClaveDocumento
  /** Lo que pasa con el pase (abrir el selector de archivos, la hoja…). */
  onAnadir: () => void
  datos?: string
  icono?: ReactNode
  /** (10S9b §1) Con pase: el enlace pequeño «o escribe los datos a mano» debajo del botón, que abre la hoja de datos de siempre vacía (con sus ejemplos en gris). Sin pase no sale (los datos son del pase). */
  aMano?: () => void
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
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] text-[15.5px] font-bold"
        style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}
      >
        {icono ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12" />
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
