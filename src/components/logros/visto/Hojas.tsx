import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { displayStopName } from '../../../lib/format'
import { Trazo, TRAZO } from './trazos'
import type { DestinoDeFoto, Hoja } from './vistoStore'

/**
 * LAS PANTALLAS DEL VISTO Y LAS FOTOS (Tanda 8b), dibujadas como en «Visto Fotos» y «Ayudas» (docs/diseno/proyecto/Piezas/). Solo pintan: lo que hacen lo decide `VistoFlujo.tsx`.
 * Todas las tarjetas son HOJA desde abajo con su cruz; abajo de las del Visto, «¿No estás aquí? Desmarcar visto».
 */
const TINTA = '#1C2230'
const FRAMBUESA = 'oklch(0.55 0.17 5)'
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"

export function EstilosDelVisto() {
  return (
    <style>{`
@keyframes vistoSheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes vistoFade{from{opacity:0}to{opacity:1}}
@keyframes vistoToast{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes vistoBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes vistoPop{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:none}}
@keyframes vistoRays{to{transform:rotate(360deg)}}
@keyframes vistoBlink{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion: reduce){[data-visto] *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`}</style>
  )
}

/** El fondo oscuro y la hoja que sube de abajo. `onCerrar` cierra con la cruz y tocando fuera. */
function Capa({ children, onCerrar, etiqueta, z = 80 }: { children: ReactNode; onCerrar: () => void; etiqueta: string; z?: number }) {
  return createPortal(
    <div data-visto="capa" role="dialog" aria-label={etiqueta} className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: z }}>
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: 'rgba(28,34,48,.42)', animation: 'vistoFade .3s ease both' }} />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col gap-2.5" style={{ animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both' }}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Cruz({ onCerrar, oscura = false }: { onCerrar: () => void; oscura?: boolean }) {
  return (
    <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute right-2.5 top-2.5 z-[2] flex h-11 w-11 items-center justify-center rounded-full border-0" style={{ background: oscura ? 'rgba(255,253,248,.12)' : '#F1EADC', color: oscura ? '#FFFDF8' : TINTA }}>
      <Trazo d={TRAZO.cerrar} tam={13} grosor={2.2} />
    </button>
  )
}

function Boton({ icono, texto, onClick, estilo, disabled }: { icono: string; texto: string; onClick: () => void; estilo: CSSProperties; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex h-12 items-center justify-center gap-[7px] rounded-full disabled:opacity-60" style={{ font: "600 13.5px 'Geist'", ...estilo }}>
      <Trazo d={icono} tam={16} />
      {texto}
    </button>
  )
}

const BTN_CAM: CSSProperties = { background: TINTA, color: '#FFFDF8', border: 'none' }
const BTN_GAL: CSSProperties = { background: '#FFFFFF', color: TINTA, border: '1px solid rgba(28,34,48,.16)' }
const BTN_CAM_ORO: CSSProperties = { background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#2A1D10', border: 'none' }
const BTN_GAL_OSCURO: CSSProperties = { background: 'transparent', color: '#FFFDF8', border: '1px solid rgba(255,253,248,.3)' }

/** El pedazo ganado (V2): la tarjeta oscura de arriba con el hexágono dorado. */
function PedazoGanado({ nombre, coleccion, linea }: { nombre: string; coleccion: string; linea: string | null }) {
  return (
    <div className="relative mx-3 flex items-center gap-3.5 overflow-hidden rounded-[26px] p-[18px] text-[#FFFDF8]" style={{ background: 'radial-gradient(120% 90% at 50% 0%,#3A3550 0%,#1C2230 65%)' }}>
      <span className="absolute -left-[30px] -top-10 h-40 w-40 rounded-full" style={{ background: 'repeating-conic-gradient(oklch(0.82 0.12 80 / .16) 0 8deg,transparent 8deg 22deg)', animation: 'vistoRays 20s linear infinite' }} />
      <span className="relative h-[70px] w-[70px] flex-none" style={{ animation: 'vistoPop .7s .3s cubic-bezier(.3,1.5,.5,1) both' }}>
        <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true">
          <defs>
            <linearGradient id="vistoPz" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFE7A8" />
              <stop offset="1" stopColor="#B8903E" />
            </linearGradient>
          </defs>
          <path d="M35 4L64 20V50L35 66L6 50V20Z" fill="url(#vistoPz)" stroke="#FFF3D0" strokeWidth="1.5" />
          <g transform="translate(23 23)" fill="none" stroke="#4A3612" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={TRAZO.check} transform="translate(0 0) scale(1)" />
          </g>
        </svg>
      </span>
      <span className="relative flex flex-1 flex-col gap-1">
        <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'oklch(0.86 0.12 85)' }}>Nuevo pedazo</span>
        <span style={{ font: `400 22px/1.05 ${SERIF}` }}>{nombre}</span>
        <span style={{ font: "500 12px 'Geist'", color: 'rgba(255,253,248,.72)' }}>{linea ? `${coleccion} · ${linea}` : coleccion}</span>
      </span>
    </div>
  )
}

export interface AccionesDeHoja {
  onCamara: () => void
  onGaleria: () => void
  onActivarUbicacion: () => void
  onDesmarcar: () => void
  onCerrar: () => void
  /** Un fallo al pedir la ubicación («No hemos podido saber dónde estás…»). */
  errorUbicacion: string | null
  pidiendoUbicacion: boolean
}

/** V2, V3, V4, V5 y «Guarda un recuerdo»: la hoja que sale tras el aviso de 5 segundos. */
export function HojaDelVisto({ hoja, acciones }: { hoja: Hoja; acciones: AccionesDeHoja }) {
  const { tipo } = hoja
  const nombre = hoja.nombreSitio || displayStopName(hoja.parada.nombre)
  const oscura = tipo === 'oculto'
  const caja: CSSProperties = oscura
    ? { background: 'radial-gradient(120% 90% at 85% 0%,#3A3550 0%,#1C2230 60%)', color: '#FFFDF8' }
    : { background: '#FFFDF8', color: TINTA }
  const sub = oscura ? 'rgba(255,253,248,.82)' : 'rgba(28,34,48,.68)'
  let titulo = ''
  let subtitulo: string | null = null
  let icono = TRAZO.cam
  let iconoFondo = '#F1EADC'
  let iconoColor = TINTA
  let botones: ReactNode = null
  if (tipo === 'ganado') {
    titulo = `Guarda un recuerdo de ${nombre}`
    subtitulo = 'La foto es para tu álbum: el pedazo ya es tuyo.'
    botones = (
      <>
        <Boton icono={TRAZO.cam} texto="Hacer foto" onClick={acciones.onCamara} estilo={BTN_CAM} />
        <Boton icono={TRAZO.gal} texto="De la galería" onClick={acciones.onGaleria} estilo={BTN_GAL} />
      </>
    )
  } else if (tipo === 'sin_ubicacion') {
    titulo = 'Activa tu ubicación o haz una foto para ganar tu pedazo'
    subtitulo = acciones.errorUbicacion ?? `Con la foto de hoy en ${nombre}, el pedazo es tuyo.`
    icono = TRAZO.loc
    iconoFondo = 'oklch(0.8 0.14 70 / .2)'
    botones = (
      <>
        <Boton icono={TRAZO.loc} texto={acciones.pidiendoUbicacion ? 'Buscando…' : 'Activar ubicación'} onClick={acciones.onActivarUbicacion} estilo={BTN_CAM} disabled={acciones.pidiendoUbicacion} />
        <Boton icono={TRAZO.cam} texto="Hacer foto" onClick={acciones.onCamara} estilo={BTN_GAL} />
      </>
    )
  } else if (tipo === 'lejos') {
    titulo = hoja.mensaje ?? `Parece que no estás en ${nombre}. Tu pedazo te espera allí.`
    subtitulo = 'La parada queda como vista.'
    icono = TRAZO.lejos
    iconoFondo = 'oklch(0.55 0.17 5 / .1)'
    iconoColor = FRAMBUESA
  } else if (tipo === 'oculto') {
    titulo = '¡Aquí se esconde un Emblema Oculto!'
    subtitulo = `Sube una foto en ${nombre} y descúbrelo.`
    botones = (
      <>
        <Boton icono={TRAZO.cam} texto="Hacer la foto" onClick={acciones.onCamara} estilo={BTN_CAM_ORO} />
        <Boton icono={TRAZO.gal} texto="Elegir de la galería" onClick={acciones.onGaleria} estilo={BTN_GAL_OSCURO} />
      </>
    )
  } else {
    titulo = `Guarda un recuerdo de ${nombre}`
    subtitulo = 'Una foto para tu álbum.'
    botones = (
      <>
        <Boton icono={TRAZO.cam} texto="Hacer foto" onClick={acciones.onCamara} estilo={BTN_CAM} />
        <Boton icono={TRAZO.gal} texto="De la galería" onClick={acciones.onGaleria} estilo={BTN_GAL} />
      </>
    )
  }
  return (
    <Capa onCerrar={acciones.onCerrar} etiqueta={titulo}>
      {tipo === 'ganado' && hoja.pedazo && <PedazoGanado nombre={nombre} coleccion={hoja.pedazo.nombre} linea={hoja.pedazo.linea ?? null} />}
      <div data-visto={`hoja-${tipo}`} className="relative flex flex-col gap-3 overflow-hidden rounded-t-[26px] px-[18px] pb-8 pt-3" style={{ ...caja, boxShadow: '0 -12px 34px -18px rgba(0,0,0,.5)' }}>
        {oscura && <span className="pointer-events-none absolute -right-[70px] -top-20 h-60 w-60 rounded-full" style={{ background: 'repeating-conic-gradient(rgba(243,213,154,.18) 0 7deg,transparent 7deg 20deg)', WebkitMaskImage: 'radial-gradient(circle,#000 20%,transparent 68%)', maskImage: 'radial-gradient(circle,#000 20%,transparent 68%)', animation: 'vistoRays 24s linear infinite' }} />}
        <span className="self-center" style={{ width: 42, height: 4, borderRadius: 4, background: oscura ? 'rgba(255,253,248,.25)' : 'rgba(28,34,48,.18)' }} />
        <Cruz onCerrar={acciones.onCerrar} oscura={oscura} />
        <div className="relative flex items-start gap-3.5 pr-11">
          {oscura ? (
            <span className="flex h-16 w-16 flex-none items-center justify-center">
              <span className="flex h-[46px] w-[46px] rotate-45 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(140deg,#F7E6BE,#D9B86A 55%,#B8903E)', boxShadow: '0 0 22px rgba(243,213,154,.55),inset 0 1px 0 rgba(255,255,255,.6)' }}>
                <span className="-rotate-45" style={{ font: `400 26px/1 ${SERIF}`, color: '#3A2A10' }}>?</span>
              </span>
            </span>
          ) : (
            <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px]" style={{ background: iconoFondo, color: iconoColor }}>
              <Trazo d={icono} tam={22} grosor={1.7} />
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            {oscura && <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'oklch(0.86 0.12 85)' }}>Emblema Oculto</span>}
            <span style={{ font: `400 22px/1.1 ${SERIF}`, textWrap: 'balance' as never }}>{titulo}</span>
            {subtitulo && <span style={{ font: "400 13px/1.45 'Geist'", color: acciones.errorUbicacion && tipo === 'sin_ubicacion' ? FRAMBUESA : sub, textWrap: 'pretty' as never }}>{subtitulo}</span>}
          </span>
        </div>
        {botones && <div className="grid grid-cols-2 gap-2">{botones}</div>}
        <button type="button" onClick={acciones.onDesmarcar} className="min-h-11 self-center px-3 underline underline-offset-[3px]" style={{ font: "400 12px 'Geist'", color: oscura ? 'rgba(255,253,248,.55)' : 'rgba(28,34,48,.5)', background: 'none', border: 'none' }}>
          ¿No estás aquí? Desmarcar visto
        </button>
      </div>
    </Capa>
  )
}

/** V1: «Fontana de Trevi marcada como visto · Deshacer», 5 segundos con su barra. */
export function AvisoDeVisto({ nombre, ms, onDeshacer }: { nombre: string; ms: number; onDeshacer: () => void }) {
  return createPortal(
    <div data-visto="aviso" role="status" className="fixed inset-x-3.5 bottom-[100px] z-[85] mx-auto max-w-[480px] overflow-hidden rounded-2xl text-[#FFFDF8]" style={{ background: TINTA, boxShadow: '0 14px 30px -12px rgba(0,0,0,.6)', animation: 'vistoToast .35s ease both' }}>
      <div className="flex items-center gap-2.5 py-1 pl-4 pr-1.5">
        <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full" style={{ background: 'oklch(0.55 0.11 150)' }}>
          <Trazo d={TRAZO.check} tam={12} grosor={3} />
        </span>
        <span className="flex-1 py-3" style={{ font: "500 13.5px 'Geist'" }}>{displayStopName(nombre)} marcada como visto</span>
        <button type="button" onClick={onDeshacer} className="flex h-11 items-center rounded-full px-3.5" style={{ font: "700 13px 'Geist'", color: 'oklch(0.8 0.14 70)', background: 'none', border: 'none' }}>
          Deshacer
        </button>
      </div>
      <span className="block h-[3px]" style={{ background: 'oklch(0.8 0.14 70)', transformOrigin: '0 50%', animation: `vistoBar ${ms}ms linear both` }} />
    </div>,
    document.body,
  )
}

/** Un mensaje corto («Foto guardada»), que se va solo. */
export function NotaCorta({ texto, onFin }: { texto: string; onFin: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onFin, 2600)
    return () => window.clearTimeout(t)
  }, [onFin, texto])
  return createPortal(
    <div data-visto="nota" role="status" className="fixed inset-x-3.5 bottom-[100px] z-[85] mx-auto flex max-w-[480px] items-center gap-2.5 rounded-2xl px-4 py-3.5 text-[#FFFDF8]" style={{ background: TINTA, font: "500 13.5px 'Geist'", animation: 'vistoToast .35s ease both' }}>
      <Trazo d={TRAZO.check} tam={14} grosor={2.4} />
      {texto}
    </div>,
    document.body,
  )
}

/** A1: nuestra pantalla antes de las ventanas del móvil. */
export function HojaDePermisos({ onContinuar }: { onContinuar: () => void }) {
  return createPortal(
    <div data-visto="permisos" role="dialog" aria-label="Permisos" className="fixed inset-0 z-[88] flex flex-col justify-end px-3.5 pb-7" style={{ background: 'rgba(28,34,48,.45)', animation: 'vistoFade .3s ease both' }}>
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-3.5 rounded-[26px] bg-[#FFFDF8] px-5 pb-[18px] pt-[22px]" style={{ animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="flex gap-2.5">
          {[TRAZO.cam, TRAZO.loc].map((d) => (
            <span key={d} className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#F1EADC]">
              <Trazo d={d} tam={24} grosor={1.7} />
            </span>
          ))}
        </div>
        <span style={{ font: `400 24px/1.15 ${SERIF}`, textWrap: 'pretty' as never }}>Para darte tus logros, necesitamos la cámara y saber dónde estás. Solo mientras usas la app.</span>
        <button type="button" onClick={onContinuar} className="h-[52px] rounded-full border-0 bg-[#1C2230] text-[#FFFDF8]" style={{ font: "600 15px 'Geist'" }}>
          Continuar
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** A2: la franja de «Sin conexión». */
export function FranjaSinConexion() {
  return createPortal(
    <div data-visto="sin-conexion" role="status" className="pointer-events-none fixed inset-x-3.5 top-[64px] z-[70] mx-auto flex max-w-[480px] items-center gap-2 rounded-xl px-3 py-[7px] text-[#FFFDF8]" style={{ background: TINTA, font: "500 12px/1.35 'Geist'" }}>
      <span style={{ animation: 'vistoBlink 2s ease-in-out infinite', display: 'flex' }}>
        <Trazo d={TRAZO.sinSenal} tam={15} />
      </span>
      Sin conexión. Tus sorpresas te esperan: saldrán al volver la señal.
    </div>,
    document.body,
  )
}

/** Antes de abrir la cámara, la línea de «dentro no se pueden hacer fotos…». */
export function HojaFotoDentro({ destino, onSeguir, onCerrar }: { destino: DestinoDeFoto; onSeguir: () => void; onCerrar: () => void }) {
  return (
    <Capa onCerrar={onCerrar} etiqueta="Antes de la foto">
      <div data-visto="foto-dentro" className="relative flex flex-col gap-3 rounded-t-[26px] bg-[#FFFDF8] px-[18px] pb-8 pt-3" style={{ color: TINTA }}>
        <span className="self-center" style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <Cruz onCerrar={onCerrar} />
        <div className="flex items-start gap-3.5 pr-11">
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] bg-[#F1EADC]">
            <Trazo d={TRAZO.cam} tam={22} grosor={1.7} />
          </span>
          <span className="flex flex-col gap-1">
            <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Antes de la foto · {destino.nombreSitio}</span>
            <span style={{ font: `400 20px/1.2 ${SERIF}`, textWrap: 'pretty' as never }}>{destino.fotoDentro}</span>
          </span>
        </div>
        <button type="button" onClick={onSeguir} className="flex h-12 items-center justify-center gap-[7px] rounded-full border-0 bg-[#1C2230] text-[#FFFDF8]" style={{ font: "600 13.5px 'Geist'" }}>
          <Trazo d={TRAZO.cam} tam={16} />
          Abrir la cámara
        </button>
      </div>
    </Capa>
  )
}

/** 9c + V7: antes de abrir la galería, las fechas del viaje; si la foto no vale, el motivo que da el servidor y [Elegir otra foto]. */
export function HojaGaleria({ nombreSitio, linea, error, subiendo, onElegir, onCerrar }: { nombreSitio: string; linea: string | null; error: string | null; subiendo: boolean; onElegir: () => void; onCerrar: () => void }) {
  return (
    <Capa onCerrar={onCerrar} etiqueta="Tu galería">
      <div data-visto="galeria" className="relative flex flex-col gap-2.5 rounded-t-[28px] bg-[#FFFDF8] px-[18px] pb-[30px] pt-3" style={{ color: TINTA }}>
        <span className="self-center" style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <Cruz onCerrar={onCerrar} />
        <span className="mt-1 pr-11" style={{ font: `600 10px ${MONO}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Tu galería</span>
        <span className="pr-11" style={{ font: `400 24px/1 ${SERIF}` }}>{nombreSitio}</span>
        {linea && (
          <div className="flex items-center gap-2.5 rounded-[14px] bg-[#F5EFE4] px-3 py-2.5">
            <Trazo d={TRAZO.gal} tam={16} />
            <span style={{ font: "500 13px 'Geist'" }}>{linea}</span>
          </div>
        )}
        {error && (
          <div role="alert" data-visto="foto-no-vale" className="flex flex-col gap-2.5 rounded-2xl p-3" style={{ background: 'oklch(0.55 0.17 5 / .07)', border: '1px solid oklch(0.55 0.17 5 / .3)' }}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-white" style={{ background: FRAMBUESA, font: "700 13px 'Geist'" }}>!</span>
              <span className="flex-1" style={{ font: "500 13.5px/1.4 'Geist'", textWrap: 'pretty' as never }}>{error}</span>
            </div>
          </div>
        )}
        <button type="button" onClick={onElegir} disabled={subiendo} className="flex h-12 items-center justify-center gap-[7px] rounded-full disabled:opacity-60" style={error ? { background: '#fff', color: TINTA, border: '1px solid rgba(28,34,48,.16)', font: "600 13.5px 'Geist'" } : { ...BTN_CAM, font: "600 13.5px 'Geist'" }}>
          <Trazo d={TRAZO.gal} tam={16} />
          {subiendo ? 'Comprobando la foto…' : error ? 'Elegir otra foto' : 'Abrir la galería'}
        </button>
      </div>
    </Capa>
  )
}

export interface ParadaDeAyer {
  stopId: string
  nombre: string
  fotoDentro?: string | null
}

/** V8: «Lo de ayer también cuenta». Con [Subir mis fotos] pasa a la lista de paradas, cada una con su botón para elegir foto. */
export function HojaLoDeAyer({ paradas, plazo, miniaturas, onElegir, onCerrar }: { paradas: ParadaDeAyer[]; plazo: string | null; miniaturas: Record<string, string>; onElegir: (p: ParadaDeAyer) => void; onCerrar: () => void }) {
  const [lista, setLista] = useState(false)
  const nombres = paradas.slice(0, 3).map((p) => displayStopName(p.nombre))
  const quedan = paradas.length - nombres.length
  const PH = ['linear-gradient(140deg,#E7B98A,#9C5E3A)', 'linear-gradient(140deg,#B8D4D8,#4E8A94)', 'linear-gradient(140deg,#D9C9A4,#8E7450)', 'linear-gradient(140deg,#E2C6A8,#A8734A)']
  const arriba = useRef<HTMLDivElement>(null)
  return (
    <Capa onCerrar={onCerrar} etiqueta="Lo de ayer también cuenta" z={82}>
      <div data-visto="lo-de-ayer" ref={arriba} className="relative mx-3 mb-6 flex max-h-[80vh] flex-col gap-3 overflow-y-auto rounded-[28px] px-5 pb-[18px] pt-[22px] text-[#FFFDF8]" style={{ background: 'radial-gradient(120% 80% at 50% 0%,#3A3550 0%,#1C2230 65%)' }}>
        <Cruz onCerrar={onCerrar} oscura />
        <span className="pr-10" style={{ font: `400 30px/1.05 ${SERIF}` }}>Lo de ayer también cuenta.</span>
        {!lista ? (
          <>
            <span style={{ font: "400 14px/1.5 'Geist'", color: 'rgba(255,253,248,.8)' }}>
              Ayer tenías en tu ruta: {nombres.join(', ')}
              {quedan > 0 ? ` y ${quedan} más` : ''}…
            </span>
            <div className="flex gap-1.5">
              {paradas.slice(0, 4).map((p, i) => (
                <span key={p.stopId} className="h-16 flex-1 overflow-hidden rounded-xl opacity-90" style={{ background: miniaturas[p.stopId] ? `center/cover url(${miniaturas[p.stopId]})` : PH[i % 4] }} />
              ))}
            </div>
            <span style={{ font: "400 14px/1.5 'Geist'", color: 'rgba(255,253,248,.8)' }}>Sube tus fotos y descubre lo que ganaste.</span>
            {plazo && <span style={{ font: `600 11px ${MONO}`, color: 'oklch(0.86 0.12 85)' }}>{plazo}</span>}
            <button type="button" onClick={() => setLista(true)} className="flex h-[52px] items-center justify-center gap-2 rounded-full border-0" style={{ ...BTN_CAM_ORO, font: "700 15px 'Geist'" }}>
              <Trazo d={TRAZO.gal} tam={17} grosor={1.9} />
              Subir mis fotos
            </button>
          </>
        ) : (
          <>
            <span style={{ font: "400 14px/1.5 'Geist'", color: 'rgba(255,253,248,.8)' }}>Elige la foto de cada sitio:</span>
            <div className="flex flex-col gap-2">
              {paradas.map((p) => (
                <div key={p.stopId} className="flex items-center gap-2.5 rounded-2xl py-2 pl-3.5 pr-2" style={{ background: 'rgba(255,253,248,.08)' }}>
                  <span className="min-w-0 flex-1" style={{ font: "500 14px/1.3 'Geist'" }}>{displayStopName(p.nombre)}</span>
                  <button type="button" onClick={() => onElegir(p)} aria-label={`Elegir foto de ${displayStopName(p.nombre)}`} className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-0" style={BTN_CAM_ORO}>
                    <Trazo d={TRAZO.gal} tam={17} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Capa>
  )
}
