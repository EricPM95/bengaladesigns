import type { ReactNode } from 'react'
import type { FichaModelo, FichaOpcion, FichaPaso } from '../../../lib/fichaLlegada'
import type { NombreIcono } from '../../../lib/iconos'
import { BotonComoLlegarAlojamiento } from '../alojamiento/BotonComoLlegarAlojamiento'
import { Icono } from '../../ui/Icono'

/**
 * El RESUMEN de la ficha de llegada y vuelta (Tanda 7, punto 13; diseño `docs/diseno/ficha_llegada/Ficha Llegada.dc.html`), de pago y con la hora puesta. Solo pinta el modelo de `construirFicha`
 * (`src/lib/fichaLlegada.ts`): el texto, el orden y los datos son suyos. SIN botones de comprar billete: en el transporte público, solo su precio oficial. Lo único que se vende es el traslado
 * privado, en frambuesa, y solo si hay enlace (`onReservarTraslado`).
 */

const ICONO_DEL_MEDIO: Record<string, NombreIcono> = {
  tren: 'tren',
  bus_tren: 'tren',
  autobus: 'bus',
  metro: 'metro',
  tranvia: 'tranvia',
  andando: 'andando',
}

const OJO = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' } as const

/** La frase con el punto y la hora resaltados (cursiva frambuesa, como el diseño). */
function ConResaltado({ texto, resaltar }: { texto: string; resaltar: string[] }): ReactNode {
  const partes: ReactNode[] = []
  let resto = texto
  let clave = 0
  for (;;) {
    const hallados = resaltar.map((palabra) => ({ palabra, en: palabra ? resto.indexOf(palabra) : -1 })).filter((hallado) => hallado.en >= 0)
    if (hallados.length === 0) break
    const primero = hallados.sort((a, b) => a.en - b.en)[0]
    if (primero.en > 0) partes.push(resto.slice(0, primero.en))
    partes.push(
      <em key={clave++} className="not-italic text-accent-hover" style={{ fontStyle: 'italic' }}>
        {primero.palabra}
      </em>,
    )
    resto = resto.slice(primero.en + primero.palabra.length)
  }
  partes.push(resto)
  return <>{partes}</>
}

function Paso({ paso, ultimo }: { paso: FichaPaso; ultimo: boolean }) {
  return (
    <div className="relative flex gap-3 py-2">
      {!ultimo && <span aria-hidden="true" className="absolute bottom-[-8px] left-[16px] top-[34px] border-l-[1.5px] border-dashed border-text/25" />}
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border-[1.5px] border-text/[.12] bg-bg text-text/70">
        <Icono nombre={ICONO_DEL_MEDIO[paso.medio] ?? 'bus'} size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px] pt-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span data-ficha-paso className="text-[14px] font-semibold text-text">{paso.nombre}</span>
          {paso.precio && <span className="flex-none font-display text-[22px] leading-none text-text">{paso.precio}</span>}
        </span>
        {paso.detalle && <span className="text-[12.5px] leading-[1.45] text-text/65">{paso.detalle}</span>}
      </span>
    </div>
  )
}

function MejorOpcion({ opcion }: { opcion: FichaOpcion }) {
  return (
    <div data-ficha-mejor className="flex flex-col overflow-hidden rounded-[22px] border-[1.5px] border-accent-gold bg-white" style={{ boxShadow: '0 14px 30px -20px rgba(28,34,48,.45)' }}>
      <div className="flex flex-col gap-2 px-4 pb-2.5 pt-3.5">
        <span className="flex h-6 items-center self-start rounded-full bg-accent-gold px-2.5 text-[#17120a]" style={{ ...OJO, fontWeight: 700, letterSpacing: '.1em', fontSize: 10.5 }}>
          Tu mejor opción
        </span>
        <span data-ficha-mejor-titulo className="font-display text-[20px] leading-[1.15] text-text" style={{ textWrap: 'balance' as never }}>
          {opcion.titulo}
        </span>
      </div>
      <div className="px-4 pb-2">
        {opcion.pasos.map((paso, indice) => (
          <Paso key={`${paso.nombre}-${indice}`} paso={paso} ultimo={indice === opcion.pasos.length - 1} />
        ))}
      </div>
    </div>
  )
}

function OtraOpcion({ opcion, ultimo }: { opcion: FichaOpcion; ultimo: boolean }) {
  return (
    <div data-ficha-otra className={`py-1 ${ultimo ? '' : 'border-b border-text/[.07]'}`}>
      {opcion.pasos.map((paso, indice) => (
        <Paso key={`${paso.nombre}-${indice}`} paso={paso} ultimo={indice === opcion.pasos.length - 1} />
      ))}
    </div>
  )
}

/** La tarjeta del traslado privado: frambuesa, sin precio y sin decir que es más barato. `onReservar` solo existe si el destino trae enlace de reserva. */
function Traslado({ texto, etiqueta, onReservar, mejor }: { texto: string; etiqueta: string; onReservar?: () => void; mejor?: boolean }) {
  return (
    <div data-ficha-traslado className="flex min-h-[96px] overflow-hidden rounded-[20px] border border-text/[.08] bg-white" style={{ boxShadow: '0 1px 2px rgba(28,34,48,.05),0 10px 22px -18px rgba(28,34,48,.4)' }}>
      <span className="flex w-[60px] flex-none items-center bg-accent pl-[13px] text-white" style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 18px) 100%,0 100%)' }}>
        <Icono nombre="coche" size={22} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 pl-1 pr-3.5">
        {mejor && (
          <span className="flex h-6 items-center self-start rounded-full bg-accent-gold px-2.5 text-[#17120a]" style={{ ...OJO, fontWeight: 700, letterSpacing: '.1em', fontSize: 10.5 }}>
            Tu mejor opción
          </span>
        )}
        <span className="font-display text-[19px] leading-[1.05] text-text">Traslado privado</span>
        <span className="text-[12px] leading-[1.45] text-text/65">{texto}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {onReservar && (
            <button type="button" onClick={onReservar} className="h-8 whitespace-nowrap rounded-full bg-accent px-3.5 text-[12.5px] font-semibold text-white" style={{ boxShadow: '0 8px 16px -8px rgb(var(--accent))' }}>
              Reservar traslado
            </button>
          )}
          <span className="text-[11px] text-text/55">{etiqueta}</span>
        </span>
      </span>
    </div>
  )
}

export interface FichaResumenProps {
  ficha: FichaModelo
  /** Solo con enlace de reserva del traslado en los datos: abre la pestaña Traslados. */
  onReservarTraslado?: () => void
  /** [Explorar restaurantes]: abre EXPLORAR › Restaurantes. */
  onExplorarRestaurantes: () => void
  /** La dirección del alojamiento (RESERVAS): sin ella, [Cómo llegar a tu alojamiento] no sale. */
  direccion: string | null
}

export function FichaResumen({ ficha, onReservarTraslado, onExplorarRestaurantes, direccion }: FichaResumenProps) {
  const llegada = ficha.kind === 'llegada'
  return (
    <div data-ficha-resumen={ficha.kind} className="flex flex-col gap-3.5">
      {ficha.avisoSinZona && (
        <p data-ficha-sin-zona className="rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-3 text-[13px] leading-[1.45] text-text/75">
          {ficha.avisoSinZona}
        </p>
      )}

      <div className="flex flex-col gap-1 px-1">
        <p data-ficha-intro className="font-display text-[23px] leading-[1.25] text-text" style={{ textWrap: 'pretty' as never }}>
          <ConResaltado texto={ficha.intro} resaltar={ficha.resaltar} />
        </p>
        {ficha.dato && <span data-ficha-dato className="text-[13.5px] leading-[1.45] text-text/70">{ficha.dato}</span>}
      </div>

      {ficha.avisoNoche && (
        <div data-ficha-noche className="flex items-start gap-2.5 rounded-2xl border px-3.5 py-3" style={{ background: 'rgb(var(--accent) / .08)', borderColor: 'rgb(var(--accent) / .25)' }}>
          <Icono nombre="reloj" size={18} className="mt-px flex-none text-accent-hover" />
          <span className="text-[13px] leading-[1.45] text-text">{ficha.avisoNoche}</span>
        </div>
      )}

      {ficha.mejor?.tipo === 'traslado_privado' && <Traslado mejor texto={ficha.mejor.texto} etiqueta={ficha.traslado?.etiqueta ?? 'Ideal si viajas en pareja, en familia o con amigos'} onReservar={onReservarTraslado} />}
      {ficha.mejor?.tipo === 'opcion' && <MejorOpcion opcion={ficha.mejor.opcion} />}

      {ficha.termini && (
        <div data-ficha-termini className="flex items-start gap-3 rounded-[20px] border p-3.5" style={{ background: 'oklch(0.95 0.025 230)', borderColor: 'oklch(0.56 0.1 230 / .2)' }}>
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: 'oklch(0.56 0.1 230)' }}>
            T
          </span>
          <span className="text-[13px] leading-[1.5]" style={{ color: 'oklch(0.34 0.05 240)' }}>
            {ficha.termini}
          </span>
        </div>
      )}

      {ficha.otrasTitulo && ficha.otras.length > 0 && (
        <div data-ficha-otras className="flex flex-col gap-2">
          <span className="px-1 text-text/55" style={OJO}>
            {ficha.otrasTitulo}
          </span>
          <div className="rounded-[20px] border border-text/[.07] bg-bg-card px-3.5 py-0.5">
            {ficha.otras.map((opcion, indice) => (
              <OtraOpcion key={opcion.titulo} opcion={opcion} ultimo={indice === ficha.otras.length - 1} />
            ))}
          </div>
        </div>
      )}

      {ficha.traslado && <Traslado texto={ficha.traslado.texto} etiqueta={ficha.traslado.etiqueta} onReservar={onReservarTraslado} />}

      {ficha.comida && (
        <div data-ficha-comida className="flex flex-col gap-2.5 rounded-[20px] border p-3.5" style={{ background: 'rgb(var(--accent-gold) / .10)', borderColor: 'rgb(var(--accent-gold) / .35)' }}>
          <span className="flex items-start gap-2.5">
            <Icono nombre="comida" size={20} className="mt-px flex-none text-text/65" />
            <span className="text-[13px] leading-[1.5] text-text">{ficha.comida.texto}</span>
          </span>
          <button type="button" onClick={onExplorarRestaurantes} className="h-10 self-start rounded-full bg-text px-4 text-[13px] font-semibold text-bg">
            {ficha.comida.boton}
          </button>
        </div>
      )}

      {llegada && (ficha.rutaEmpieza || direccion) && (
        <div data-ficha-ruta className="flex flex-col gap-2.5 rounded-[20px] border p-3.5" style={{ background: 'rgb(var(--accent-green-soft))', borderColor: 'rgb(var(--accent-green) / .3)' }}>
          {ficha.rutaEmpieza && <span className="font-display text-[19px] leading-[1.15] text-text">{ficha.rutaEmpieza}</span>}
          <BotonComoLlegarAlojamiento direccion={direccion} className="!h-10 !w-auto self-start !px-3.5 !text-[13px]" />
        </div>
      )}

      {ficha.maleta && (
        <div data-ficha-maleta className="flex items-start gap-3 rounded-[20px] border p-3.5" style={{ background: 'rgb(var(--accent-gold) / .08)', borderColor: 'rgb(var(--accent-gold) / .3)' }}>
          <Icono nombre="maleta" size={20} className="mt-px flex-none text-text/65" />
          <span className="flex flex-col gap-1">
            <span className="font-display text-[19px] leading-[1.1] text-text">{ficha.maleta.titulo}</span>
            <span className="text-[13px] leading-[1.5] text-text/75">{ficha.maleta.texto}</span>
            {ficha.maleta.consigna && <span className="text-[12px] leading-[1.45] text-text/55">{ficha.maleta.consigna}</span>}
          </span>
        </div>
      )}
      {ficha.despedida && (
        <p data-ficha-despedida className="pt-1 text-center font-display text-[30px] italic leading-none text-accent-hover">
          {ficha.despedida}
        </p>
      )}
    </div>
  )
}
