import { BOTON_ORO } from '../../ui/botonesOro'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'
import { lugarCon } from '../../../lib/articulos'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { sonar } from '../../../lib/sonidos'
import { useCamaraViajeStore } from '../../../lib/camaraViaje'
import { EstilosDelVisto } from '../../logros/visto/Hojas'
import { ParadaFoto } from './v2/ParadaFoto'
import { CruzDeAviso } from './v2/AvisosHoy'
import type { RetoDelDia, SitioCerca } from './useCercaDeAqui'
import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'

/**
 * EL JUEGO DE LOS EMBLEMAS OCULTOS (Tanda HOY1; Design «Companero», C16, C17 y C18).
 *   - C16 «Algo brilla cerca de aquí…» (a unos 500 m del borde del sitio) y C17 «Más cerca…» (a unos 150 m): una tarjeta oscura con su brillo, SIN decir qué emblema es ni dónde.
 *   - Al llegar: la pantalla de siempre, «¡Aquí se esconde un Emblema Oculto!», con [Hacer la foto].
 *   - C18 «Reto del día»: por la mañana, si una colección se puede completar hoy con las paradas del día, «Hoy puedes completar … te faltan 2».
 * Una vez por sitio y por día, sin agobiar: lo decide `AvisosDeCerca` (que guarda en el móvil lo que ya se enseñó). Se apaga con «Sugerencias del compañero».
 */
/** (V71 §1) El rombo dorado con «?» de la hoja del Emblema Oculto y de las tarjetas «Algo brilla…» / «Más cerca…»: UNA sola pieza (`id` distinto por cada copia en pantalla, para los degradados). */
export function RomboOculto({ tam, id, brillo = 0.4, opacidad = 1, halo = 14 }: { tam: number; id: string; brillo?: number; opacidad?: number; halo?: number }) {
  return (
    <div className="relative flex flex-none items-center justify-center" style={{ width: tam, height: tam }}>
      <span aria-hidden="true" className="absolute rounded-full" style={{ inset: -halo, background: `radial-gradient(circle,rgba(243,216,143,${brillo}),rgba(243,216,143,0) 66%)`, animation: 'eoPulse 3s ease-in-out infinite' }} />
      <svg width={tam} height={tam} viewBox="0 0 132 132" fill="none" className="relative" style={{ opacity: opacidad }} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}G`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1B8" /><stop offset=".45" stopColor="#E0B14A" /><stop offset="1" stopColor="#A8721C" /></linearGradient>
          <linearGradient id={`${id}D`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A2D58" /><stop offset="1" stopColor="#14162C" /></linearGradient>
        </defs>
        <path d="M66 6l56 60-56 60L10 66z" fill={`url(#${id}D)`} stroke={`url(#${id}G)`} strokeWidth="4" strokeLinejoin="round" />
        <path d="M66 18l44 48-44 48L22 66z" stroke="#F3D88F" strokeOpacity=".4" strokeWidth="1.2" strokeLinejoin="round" />
        <text x="66" y="84" textAnchor="middle" fontFamily="Instrument Serif" fontSize="58" fill={`url(#${id}G)`}>?</text>
      </svg>
    </div>
  )
}

const ESTILOS_DEL_JUEGO = `@keyframes eoSpin{to{transform:rotate(360deg)}}@keyframes eoTw{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}@keyframes eoPulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}@media (prefers-reduced-motion: reduce){[data-juego] *{animation:none!important}}`
/** Las estrellitas de una tarjeta (Design «Emblema Oculto · Al acercarte»): x, y en % del ancho y alto; mismo reparto que el dibujo. */
const estrellasDeTarjeta = (n: number, w: number, h: number) => Array.from({ length: n }, (_, i) => ({ x: ((10 + ((i * 83) % (w - 20))) / w) * 100, y: ((8 + ((i * 47) % (h - 16))) / h) * 100, r: i % 3 ? 2 : 3, d: (2 + (i % 5) * 0.6).toFixed(1), b: (i * 0.31).toFixed(2) }))
const ESTRELLAS_BRILLA = estrellasDeTarjeta(8, 343, 136)
const ESTRELLAS_MAS_CERCA = estrellasDeTarjeta(12, 343, 156)

/**
 * (V71 §1; Design «Emblema Oculto · Al acercarte», A1-A4) C16 «Algo brilla cerca de aquí…» y C17 «Más cerca…»: el MISMO juego que la hoja de llegada (azul noche, rayos que giran, estrellitas, el rombo dorado con «?» y la etiqueta
 * «EMBLEMA OCULTO»), en una tarjeta de HOY (no es una hoja) que va arriba, encima de la parada, y mide menos de 160 px: 136 en «Algo brilla…» (rombo pequeño y apagado) y 156 en «Más cerca…» (rombo mayor, más brillo y rayos más fuertes).
 * Solo la X; no dice qué emblema es ni dónde.
 */
export function TarjetaBrilla({ nivel, onAhoraNo }: { nivel: 'brilla' | 'mas_cerca'; onAhoraNo: () => void }) {
  const cerca = nivel === 'mas_cerca'
  const estrellas = cerca ? ESTRELLAS_MAS_CERCA : ESTRELLAS_BRILLA
  return (
    <div
      data-juego={nivel}
      role="status"
      className="relative flex flex-none items-center gap-4 overflow-hidden"
      style={{ height: cerca ? 156 : 136, borderRadius: 26, background: 'radial-gradient(120% 90% at 50% 0%,#2E2A5A 0%,#1E2040 45%,#14162C 100%)', color: '#FFFDF8', padding: '0 54px 0 18px', boxShadow: '0 18px 30px -18px rgba(14,12,40,.8)' }}
    >
      <style>{ESTILOS_DEL_JUEGO}</style>
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2" style={{ left: cerca ? -120 : -130, marginTop: -190, width: 380, height: 380, opacity: cerca ? 0.5 : 0.28, animation: 'eoSpin 70s linear infinite', background: 'repeating-conic-gradient(from 0deg,rgba(243,216,143,.38) 0 4deg,transparent 4deg 15deg)', WebkitMaskImage: 'radial-gradient(circle,#000 8%,transparent 62%)', maskImage: 'radial-gradient(circle,#000 8%,transparent 62%)' }} />
      {estrellas.map((e, i) => (
        <span key={i} aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.r, height: e.r, background: '#F3D88F', animation: `eoTw ${e.d}s ease-in-out ${e.b}s infinite` }} />
      ))}
      <button type="button" onClick={onAhoraNo} aria-label="Ahora no" data-juego-boton="ahora-no" className="zona-toque absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,.12)', color: '#FFFFFF' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <RomboOculto tam={cerca ? 104 : 76} id={cerca ? 'tbC' : 'tbB'} brillo={cerca ? 0.42 : 0.18} opacidad={cerca ? 1 : 0.55} halo={cerca ? 14 : 6} />
      <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.2em', color: '#F3D88F' }}>EMBLEMA OCULTO</span>
        <span style={{ font: `400 ${cerca ? 26 : 23}px/1.1 'Instrument Serif',serif`, textWrap: 'balance' as never }}>{cerca ? 'Más cerca…' : 'Algo brilla cerca de aquí…'}</span>
        <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(255,253,248,.75)' }}>{cerca ? 'Sigue por aquí.' : 'Hay un emblema secreto por esta zona.'}</span>
      </div>
    </div>
  )
}

/**
 * (V66 §1; Design «Emblema Oculto Hoja», E1 y E2) Al llegar: la hoja del Emblema Oculto. Azul noche, casi a pantalla completa, con rayos que giran muy despacio y estrellitas que titilan; el rombo dorado con «?»,
 * «EMBLEMA OCULTO», el título, «Haz una foto en {sitio} y descúbrelo.», [Hacer la foto] (dorado), [Elegir de la galería] (oscuro con borde dorado: abre la fototeca y la foto cuenta igual) y «¿No estás aquí? Desmarcar visto».
 * Es `role=dialog aria-modal`: con un aviso de [Deshacer] abajo, la hoja empieza justo encima de él (regla V63 §1 de `index.css`) y no se le tapan los botones.
 */
const ESTRELLAS_OCULTO = Array.from({ length: 16 }, (_, i) => ({ x: 6 + ((i * 83) % 88), y: 3 + ((i * 47) % 40), r: i % 3 ? 2 : 3, d: (2 + (i % 5) * 0.6).toFixed(1), b: (i * 0.31).toFixed(2) }))
export function HojaLlegadaOculta({ sitio, stopId, onCerrar, onDesmarcar, alFoto, alElegir }: { sitio: Pick<SitioCerca, 'sitio' | 'nombre'>; /** (V71 §1) La parada de la ruta: con ella la foto cuenta como «la foto de esa parada» y no se vuelve a pedir. */ stopId?: string; onCerrar: () => void; onDesmarcar?: () => void; /** (V71 §1) Quien abre la hoja desde [He terminado] lleva la foto por su propia cámara (con la parada); sin esto, la cámara de viaje de HOY. */ alFoto?: () => void; alElegir?: (f: File) => void }) {
  // (V52 §5) La hoja del emblema oculto suena al salir (antes no sonaba).
  useEffect(() => {
    void sonar('oculto')
  }, [])
  const pedido = { sitio: sitio.sitio, nombre: sitio.nombre, oculto: true, stopId }
  return createPortal(
    <div data-juego="llegada" role="dialog" aria-modal="true" aria-label="Aquí se esconde un Emblema Oculto" className="fixed inset-0 z-[80] flex flex-col justify-end">
      <EstilosDelVisto />
      <style>{ESTILOS_DEL_JUEGO}</style>
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: FONDO_DE_HOJA, animation: 'vistoFade .3s ease both' }} />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center gap-3.5 overflow-y-auto overflow-x-hidden px-5 pb-7 pt-2.5" style={{ maxHeight: '100%', minHeight: 'min(78%, 640px)', borderRadius: '34px 34px 0 0', background: 'radial-gradient(120% 70% at 50% 0%,#2E2A5A 0%,#1E2040 45%,#14162C 100%)', color: '#FFFDF8', boxShadow: '0 -24px 50px rgba(0,0,0,.4)', animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both' }}>
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[70px]" style={{ marginLeft: -190, width: 380, height: 380, opacity: 0.5, animation: 'eoSpin 70s linear infinite', background: 'repeating-conic-gradient(from 0deg,rgba(243,216,143,.38) 0 4deg,transparent 4deg 15deg)', WebkitMaskImage: 'radial-gradient(circle,#000 8%,transparent 62%)', maskImage: 'radial-gradient(circle,#000 8%,transparent 62%)' }} />
        {ESTRELLAS_OCULTO.map((e, i) => (
          <span key={i} aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.r, height: e.r, background: '#F3D88F', animation: `eoTw ${e.d}s ease-in-out ${e.b}s infinite` }} />
        ))}
        <TiradorDeHoja oscura />
        <CruzDeHoja onCerrar={onCerrar} oscura datos={{ 'data-juego-boton': 'cerrar' }} />
        <div className="relative mt-1 flex-none">
          <RomboOculto tam={132} id="eoH" />
        </div>
        <span className="relative" style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.2em', color: '#F3D88F' }}>EMBLEMA OCULTO</span>
        <span className="relative -mt-1.5 text-center" style={{ font: "400 31px/1.08 'Instrument Serif',serif", textWrap: 'balance' as never }}>¡Aquí se esconde un Emblema Oculto!</span>
        <span className="relative text-center" style={{ font: "400 14.5px/1.45 'Geist'", color: 'rgba(255,253,248,.75)', textWrap: 'balance' as never }}>Haz una foto {lugarCon('en', sitio.nombre)} y descúbrelo.</span>
        <button
          type="button"
          data-juego-boton="foto"
          onClick={() => {
            onCerrar()
            if (alFoto) alFoto()
            else useCamaraViajeStore.getState().abrir(pedido)
          }}
          className="relative mt-1 flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl"
          style={{ ...BOTON_ORO, font: "700 16px 'Geist'", border: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
          </svg>
          Hacer la foto
        </button>
        {/* [Elegir de la galería]: abre la fototeca del móvil (sin `capture`); la foto se manda igual que una hecha con la cámara (la cámara de viaje la recibe en `archivo`). */}
        <label data-juego-boton="galeria" className="relative flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(243,216,143,.55)', color: '#F3D88F', font: "700 14.5px 'Geist'" }}>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              onCerrar()
              if (alElegir) alElegir(f)
              else useCamaraViajeStore.getState().abrir({ ...pedido, archivo: f })
            }}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
          </svg>
          Elegir de la galería
        </label>
        <span className="relative" style={{ font: "500 13px 'Geist'", color: 'rgba(255,253,248,.6)' }}>
          ¿No estás aquí?{' '}
          <button type="button" data-juego-boton="desmarcar" onClick={() => { onDesmarcar?.(); onCerrar() }} className="min-h-9 underline underline-offset-[3px]" style={{ color: '#F3D88F', background: 'none', border: 'none', font: "500 13px 'Geist'" }}>
            Desmarcar visto
          </button>
        </span>
      </div>
    </div>,
    document.body,
  )
}

/** C18: «Reto del día». Tarjeta clara con las fotos de las paradas de la colección (las ganadas a color, las de hoy apagadas) y la barra de lo que ya tienes. */
export function RetoDelDiaTarjeta({ reto, onCerrar }: { reto: RetoDelDia; onCerrar?: () => void }) {
  const ganados = reto.total - reto.faltan
  const mostrados = reto.sitios.filter((s) => s.ganado || s.hoy).slice(0, 6)
  return (
    <div data-reto-del-dia={reto.coleccion} className="flex flex-none flex-col gap-3" style={{ borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', padding: 14 }}>
      <span className="flex items-center justify-between">
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#6F4E37' }}>Reto del día</span>
        {onCerrar && <CruzDeAviso onClick={onCerrar} />}
      </span>
      <span style={{ font: "400 24px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        Hoy puedes completar «{reto.nombre}»: {reto.faltan === 1 ? 'te falta 1' : `te faltan ${reto.faltan}`}.
      </span>
      <div className="flex gap-2">
        {mostrados.map((s) => (
          <span key={s.sitio} title={s.nombre}>
            <ParadaFoto nombre={s.nombre} vista={s.ganado} marca={false} size={48} />
          </span>
        ))}
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(28,34,48,.1)', overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${Math.round((ganados / reto.total) * 100)}%`, height: '100%', background: 'oklch(0.55 0.11 150)' }} />
      </div>
    </div>
  )
}
