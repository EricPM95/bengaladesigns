import type { ReactNode } from 'react'
import { Icono } from '../../ui/Icono'
import type { SinEntrada } from '../../../lib/destinationExcursions'
import type { NearbyTransit } from '../../../lib/nearbyTransitApi'

/**
 * Las piezas del diseño nuevo de la ficha de cada lugar (Tanda 6y4, «Ficha Lugar.dc.html»): solo aspecto. `StopDetailSheet` las monta con los datos de NUESTROS datos; cada pieza que no recibe datos NO pinta nada
 * (una sección sin datos no sale). Los textos que ve el viajero vienen siempre de fuera; aquí no hay ni un texto de ejemplo del diseño.
 */

const TARJETA = 'rounded-[22px] border border-text/[.07] bg-bg-card'
const OJO = 'font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-text/55'

/** La pastilla de pestañas con la bolita oscura que se desliza (Resumen · Entradas · Tips). Pegada arriba al hacer scroll. */
export function FichaPestanas<T extends string>({ pestanas, activa, onPick }: { pestanas: { id: T; label: string }[]; activa: T; onPick: (id: T) => void }) {
  if (pestanas.length < 2) return null
  const indice = Math.max(0, pestanas.findIndex((pestana) => pestana.id === activa))
  return (
    <div data-ficha-pestanas className="sticky top-0 z-[4] -mx-4 bg-bg px-4 py-2">
      <div className="relative grid h-11 rounded-full bg-bg-hover p-1" style={{ gridTemplateColumns: `repeat(${pestanas.length}, 1fr)` }}>
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 rounded-full bg-text transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `calc((100% - 8px) / ${pestanas.length})`, transform: `translateX(${indice * 100}%)` }}
        />
        {pestanas.map((pestana) => (
          <button
            key={pestana.id}
            type="button"
            onClick={() => onPick(pestana.id)}
            aria-pressed={activa === pestana.id}
            className={`relative rounded-full text-[13.5px] font-semibold transition-colors duration-300 ${activa === pestana.id ? 'text-bg' : 'text-text/65'}`}
          >
            {pestana.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** «Qué vas a ver»: la lista numerada en una tarjeta (`numerar: false` para un párrafo suelto, sin número). Sin puntos, nada. */
export function FichaQueVeras({ puntos, titulo = 'Qué vas a ver', numerar = true }: { puntos: readonly string[]; titulo?: string; numerar?: boolean }) {
  if (puntos.length === 0) return null
  return (
    <div className="flex flex-col gap-2.5" data-ficha-seccion="que-veras">
      <span className={`px-1 ${OJO}`}>{titulo}</span>
      <div className={`${TARJETA} px-3.5 py-1`}>
        {puntos.map((punto, indice) => (
          <div key={indice} className={`flex gap-3 py-3 ${indice < puntos.length - 1 ? 'border-b border-text/[.07]' : ''}`}>
            {numerar && <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.5px] border-text/25 font-display text-[14px] leading-none">{indice + 1}</span>}
            <span className="flex-1 text-[14px] leading-[1.5] [text-wrap:pretty]">{punto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** «Por el camino»: la tarjeta ámbar con calles y recomendaciones de paso. Sin textos, nada. */
export function FichaPorElCamino({ textos }: { textos: readonly string[] }) {
  if (textos.length === 0) return null
  return (
    <div data-ficha-seccion="por-el-camino" className="flex items-start gap-3 rounded-[20px] p-3.5" style={{ background: 'oklch(0.95 0.03 80)', border: '1px solid oklch(0.8 0.1 75 / .35)' }}>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-bg-card">
        <Icono nombre="ruta" size={18} />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="font-display text-[19px] leading-[1.1]">Por el camino</span>
        {textos.map((texto, indice) => (
          <span key={indice} className="text-[13.5px] leading-[1.5] text-text/75 [text-wrap:pretty]">
            {texto}
          </span>
        ))}
      </span>
    </div>
  )
}

export interface FilaHorario {
  /** «Todo el año · lunes» (los días o la época). */
  d: string
  /** «11:30 – 22:00». */
  h: string
  /** «Última entrada 21:00». */
  l?: string | null
}

/**
 * «Horario»: el aviso de ese día arriba (verde si está abierto o se visita siempre, rojo si no), los avisos de cierre, las filas de días y horas (si el dato las trae por separado), los párrafos del horario
 * auditado y el pie fijo («Los horarios pueden cambiar…»). Todo opcional: sin nada que decir, la tarjeta no sale.
 */
export function FichaHorario({
  aviso,
  avisosRojos = [],
  avisoGris = null,
  filas = [],
  parrafos = [],
  pie,
}: {
  aviso?: { texto: string; tono: 'ok' | 'cierra' } | null
  avisosRojos?: string[]
  avisoGris?: string | null
  filas?: FilaHorario[]
  parrafos?: string[]
  pie: string | null
}) {
  if (!aviso && avisosRojos.length === 0 && !avisoGris && filas.length === 0 && parrafos.length === 0) return null
  return (
    <div data-ficha-seccion="horario" className={`${TARJETA} overflow-hidden`}>
      <div className="flex items-center gap-2.5 px-3.5 pb-2.5 pt-3.5">
        <Icono nombre="reloj" size={18} />
        <span className="flex-1 font-display text-[21px] leading-none">Horario</span>
      </div>
      {aviso && (
        <div
          className="mx-3.5 flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[13px] font-medium leading-[1.35]"
          style={aviso.tono === 'ok' ? { background: 'oklch(0.96 0.035 150)', color: 'oklch(0.34 0.09 150)' } : { background: 'rgb(var(--accent-red) / .12)', color: 'rgb(var(--accent-red))' }}
        >
          <Icono nombre={aviso.tono === 'ok' ? 'hecho' : 'reloj'} size={15} grosor={2.2} className="flex-none" />
          {aviso.texto}
        </div>
      )}
      {avisosRojos.map((texto) => (
        <p key={texto} className="px-3.5 pt-2.5 text-[13px] font-medium leading-[1.4] text-accent-red">
          {texto}
        </p>
      ))}
      {avisoGris && <p className="px-3.5 pt-2.5 text-[13px] leading-[1.4] text-text-muted">{avisoGris}</p>}
      {filas.length > 0 && (
        <div className="px-3.5 pt-1.5">
          {filas.map((fila, indice) => (
            <div key={`${fila.d}-${indice}`} className="grid gap-2.5 border-b border-text/[.07] py-2.5" style={{ gridTemplateColumns: '110px 1fr' }}>
              <span className="text-[12.5px] font-medium leading-[1.35] text-text/60">{fila.d}</span>
              <span className="flex flex-col gap-px">
                <span className="font-mono text-[15px] font-medium">{fila.h}</span>
                {fila.l && <span className="text-[11.5px] text-text/55">{fila.l}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      {parrafos.map((texto, indice) => (
        <p key={indice} className="px-3.5 pt-3 text-[13px] leading-[1.55] text-text/72 [text-wrap:pretty]">
          {texto}
        </p>
      ))}
      {pie && <p className="px-3.5 pb-3.5 pt-2.5 text-[11px] leading-[1.45] text-text/50">{pie}</p>}
      {!pie && <span className="block pb-3.5" />}
    </div>
  )
}

/** La letra o las siglas de una línea de metro («Línea A» → «A»), para su cuadradito de color. */
export function siglaDeLinea(linea: string): string {
  const limpia = linea.replace(/^l[ií]nea\s*/i, '').trim()
  return limpia.length <= 3 ? limpia : limpia.charAt(0).toUpperCase()
}

/** Las líneas de bus de una entrada («52, 53, 62») como lista. */
export function lineasDe(linea: string): string[] {
  return linea
    .split(/\s*[,;/]\s*/)
    .map((parte) => parte.trim())
    .filter(Boolean)
}

/**
 * «Cómo llegar»: la dirección, el metro (con la letra de la línea), los buses (con sus números en cuadraditos) y la web, y el botón negro [Cómo llegar →] (solo si hay dirección o un nombre al que ir).
 * Cada fila sale solo si hay dato; sin ninguna, la tarjeta no sale.
 */
export function FichaComoLlegar({ direccion, transporte, web, onComoLlegar }: { direccion: string | null; transporte: NearbyTransit; web: string | null; onComoLlegar: (() => void) | null }) {
  const hayTransporte = transporte.metro.length > 0 || transporte.bus.length > 0
  if (!direccion && !hayTransporte && !web) return null
  const caja = (icono: Parameters<typeof Icono>[0]['nombre']) => (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-bg">
      <Icono nombre={icono} size={16} />
    </span>
  )
  return (
    <div data-ficha-seccion="como-llegar" className={`${TARJETA} overflow-hidden`}>
      <div className="flex items-center gap-2.5 px-3.5 pb-1.5 pt-3.5">
        <Icono nombre="explorar" size={18} />
        <span className="flex-1 font-display text-[21px] leading-none">Cómo llegar</span>
      </div>
      {direccion && (
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          {caja('mapa')}
          <span className="flex-1 text-[14px]">{direccion}</span>
        </div>
      )}
      {transporte.metro.map((entrada, indice) => (
        <div key={`metro-${indice}`} className="flex items-start gap-3 border-t border-text/[.07] px-3.5 py-2.5">
          {caja('metro')}
          <span className="flex flex-1 flex-col gap-1">
            <span className="flex items-center gap-2">
              {entrada.linea && (
                <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-md btn-champan px-1 text-[12px] font-bold ">
                  {siglaDeLinea(entrada.linea)}
                </span>
              )}
              <span className="text-[14px] font-medium">{entrada.parada}</span>
            </span>
            {entrada.nota && <span className="text-[12.5px] text-text/60">{entrada.nota}</span>}
          </span>
        </div>
      ))}
      {transporte.bus.map((entrada, indice) => (
        <div key={`bus-${indice}`} className="flex items-start gap-3 border-t border-text/[.07] px-3.5 py-2.5">
          {caja(entrada.kind === 'tram' ? 'tranvia' : 'bus')}
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="flex flex-wrap gap-1">
              {lineasDe(entrada.linea).map((linea) => (
                <span key={linea} className="h-[22px] rounded-md border border-text/[.18] px-[7px] font-mono text-[11.5px] font-semibold leading-5">
                  {linea}
                </span>
              ))}
            </span>
            <span className="text-[12.5px] text-text/60">{entrada.parada}</span>
            {entrada.nota && <span className="text-[12.5px] text-text/60">{entrada.nota}</span>}
          </span>
        </div>
      ))}
      {web && (
        <a
          href={web.startsWith('http') ? web : `https://${web}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 border-t border-text/[.07] px-3.5 py-2.5 text-[13.5px] text-accent-hover hover:text-accent"
        >
          {caja('web')}
          <span className="min-w-0 flex-1 truncate">{web.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      {onComoLlegar ? (
        <button type="button" onClick={onComoLlegar} className="mx-3.5 mb-3.5 mt-1 flex h-[46px] w-[calc(100%-28px)] items-center justify-center gap-2 rounded-full btn-champan text-[14px] font-semibold ">
          Cómo llegar
          <Icono nombre="flecha" size={15} grosor={2} />
        </button>
      ) : (
        <span className="block pb-2" />
      )}
    </div>
  )
}

/**
 * «No necesitas entrada» (la pestaña Entradas de un sitio que no vende entrada pero cobra por acercarse, p. ej. la tasa de la Fontana de Trevi): la tarjeta verde con su frase y, debajo, la tasa con su concepto,
 * su importe y su detalle. TODO viene del dato (`entrada_de_pago` del lugar): sin importe, el bloque va sin números; sin detalle, la tarjeta de debajo no sale.
 */
export function FichaSinEntrada({ bloque }: { bloque: SinEntrada }) {
  const hayTasa = Boolean(bloque.titulo || bloque.concepto) && Boolean(bloque.precio || bloque.detalle)
  return (
    <div data-ficha-seccion="sin-entrada" className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 rounded-[20px] p-3.5" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' }}>
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white" style={{ background: 'oklch(0.55 0.11 150)' }}>
          <Icono nombre="hecho" size={16} grosor={2.4} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-[20px] leading-[1.1]" style={{ color: 'oklch(0.3 0.08 150)' }}>
            No necesitas entrada
          </span>
          {bloque.libre && (
            <span className="text-[13px] leading-[1.45]" style={{ color: 'oklch(0.36 0.07 150)' }}>
              {bloque.libre}
            </span>
          )}
        </span>
      </div>
      {hayTasa && (
        <div className={`${TARJETA} flex flex-col gap-2 rounded-[20px] p-3.5`}>
          <span className="flex items-baseline justify-between gap-2.5">
            <span className="font-display text-[19px] leading-[1.1]">{bloque.titulo ?? bloque.concepto}</span>
            {bloque.precio && <span className="font-display text-[26px] leading-none">{bloque.precio}</span>}
          </span>
          {bloque.detalle && <span className="text-[13px] leading-[1.5] text-text/72">{bloque.detalle}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * «✓ Tu entrada: 10:30» (Tanda 6y4, punto 6): la hora de la entrada sale UNA sola vez, aquí. Debajo, sin hora calculada, la línea de llegar antes («Llega unos 30 minutos antes: hay cola de control»,
 * 15 en el Free Tour) y lo que el viajero apuntó (punto de encuentro, n.º de reserva). `children`: [Cambiar] y las marcas.
 */
export function FichaTuEntrada({ hora, nota, children }: { hora: string; nota?: string | null; children?: ReactNode }) {
  return (
    <div data-ficha-seccion="tu-entrada" className="flex flex-col gap-2 rounded-[20px] p-3.5" style={{ background: 'oklch(0.96 0.035 150)', border: '1px solid oklch(0.55 0.11 150 / .3)' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white" style={{ background: 'oklch(0.55 0.11 150)' }}>
          <Icono nombre="hecho" size={16} grosor={2.4} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-[20px] leading-[1.1]" style={{ color: 'oklch(0.3 0.08 150)' }}>
            {`Tu entrada: ${hora}`}
          </span>
          {nota && (
            <span className="text-[13px] leading-[1.45]" style={{ color: 'oklch(0.36 0.07 150)' }}>
              {nota}
            </span>
          )}
        </span>
      </div>
      {children}
    </div>
  )
}

/** Un consejo de la pestaña Tips: tarjeta con el círculo oscuro de la bombilla; el «secreto local» lleva su ojo y su etiqueta. */
export function FichaTip({ tipo, texto }: { tipo: 'practico' | 'secreto'; texto: string }) {
  const secreto = tipo === 'secreto'
  return (
    <div className={`${TARJETA} flex gap-3 rounded-[20px] p-3.5`}>
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${secreto ? 'bg-accent-lilac text-text' : 'bg-text text-bg'}`}>
        <Icono nombre={secreto ? 'ojo' : 'tips'} size={16} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        {secreto && <span className={OJO}>Secreto local</span>}
        <span className="text-[13.5px] leading-[1.5] text-text/75 [text-wrap:pretty]">{texto}</span>
      </span>
    </div>
  )
}
