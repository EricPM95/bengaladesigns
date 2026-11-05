import { createPortal } from 'react-dom'
import { useCamaraViajeStore } from '../../../lib/camaraViaje'
import { EstilosDelVisto } from '../../logros/visto/Hojas'
import { ParadaFoto } from './v2/ParadaFoto'
import { CruzDeAviso } from './v2/AvisosHoy'
import type { RetoDelDia, SitioCerca } from './useCercaDeAqui'

/**
 * EL JUEGO DE LOS EMBLEMAS OCULTOS (Tanda HOY1; Design «Companero», C16, C17 y C18).
 *   - C16 «Algo brilla cerca de aquí…» (a unos 500 m del borde del sitio) y C17 «Más cerca…» (a unos 150 m): una tarjeta oscura con su brillo, SIN decir qué emblema es ni dónde.
 *   - Al llegar: la pantalla de siempre, «¡Aquí se esconde un Emblema Oculto!», con [Hacer la foto].
 *   - C18 «Reto del día»: por la mañana, si una colección se puede completar hoy con las paradas del día, «Hoy puedes completar … te faltan 2».
 * Una vez por sitio y por día, sin agobiar: lo decide `AvisosDeCerca` (que guarda en el móvil lo que ya se enseñó). Se apaga con «Sugerencias del compañero».
 */
const BRILLOS = [
  { left: '30%', top: '20%', retraso: 0 },
  { left: '68%', top: '14%', retraso: 0.6 },
  { left: '18%', top: '60%', retraso: 1.2 },
  { left: '78%', top: '66%', retraso: 0.3 },
  { left: '50%', top: '34%', retraso: 1.8 },
  { left: '40%', top: '78%', retraso: 0.9 },
  { left: '88%', top: '38%', retraso: 1.5 },
  { left: '24%', top: '40%', retraso: 2.1 },
]
const ESTRELLA = 'M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z'

/** C16 («brilla») y C17 («mas_cerca»): la tarjeta que brilla. En C17 el brillo es más grande. */
export function TarjetaBrilla({ nivel, onAhoraNo }: { nivel: 'brilla' | 'mas_cerca'; onAhoraNo: () => void }) {
  const cerca = nivel === 'mas_cerca'
  return (
    <div
      data-juego={nivel}
      role="status"
      className="relative flex flex-none flex-col items-center justify-end gap-1.5 overflow-hidden text-center"
      style={{ height: 300, borderRadius: 28, background: 'radial-gradient(ellipse at 50% 40%,#2C3350,#10162E 80%)', color: '#FFFDF8', padding: 22, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}
    >
      <style>{`@keyframes cmGlow{0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}@keyframes cmSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion: reduce){[data-juego] *{animation:none!important}}`}</style>
      <span aria-hidden="true" className="absolute rounded-full" style={{ left: '50%', top: '44%', width: cerca ? 260 : 150, height: cerca ? 260 : 150, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(255,226,150,.55),rgba(255,226,150,0) 68%)', animation: 'cmGlow 3.2s ease-in-out infinite' }} />
      {BRILLOS.map((b, i) => (
        <span key={i} aria-hidden="true" className="absolute" style={{ left: b.left, top: b.top, width: 10, height: 10, animation: `cmSpark 2.6s ease-in-out ${b.retraso}s infinite` }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#F7E6BE" aria-hidden="true">
            <path d={ESTRELLA} />
          </svg>
        </span>
      ))}
      <button type="button" onClick={onAhoraNo} aria-label="Ahora no" data-juego-boton="ahora-no" className="zona-toque absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(255,253,248,.12)', color: '#FFFDF8' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <span className="relative" style={{ font: "400 30px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        {cerca ? 'Más cerca…' : 'Algo brilla cerca de aquí…'}
      </span>
      <span className="relative" style={{ font: "500 13px 'Geist'", color: 'rgba(255,253,248,.7)' }}>
        {cerca ? 'Sigue por aquí.' : 'Hay un emblema secreto por esta zona.'}
      </span>
    </div>
  )
}

/** Al llegar: «¡Aquí se esconde un Emblema Oculto!» (la hoja oscura de siempre del Visto), con [Hacer la foto]. */
export function HojaLlegadaOculta({ sitio, onCerrar }: { sitio: SitioCerca; onCerrar: () => void }) {
  return createPortal(
    <div data-juego="llegada" role="dialog" aria-label="Aquí se esconde un Emblema Oculto" className="fixed inset-0 z-[80] flex flex-col justify-end">
      <EstilosDelVisto />
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: 'rgba(28,34,48,.42)', animation: 'vistoFade .3s ease both' }} />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col gap-3 overflow-hidden px-[18px] pb-8 pt-3" style={{ borderRadius: '26px 26px 0 0', background: 'radial-gradient(120% 90% at 85% 0%,#3A3550 0%,#1C2230 60%)', color: '#FFFDF8', boxShadow: '0 -12px 34px -18px rgba(0,0,0,.5)', animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both' }}>
        <span className="pointer-events-none absolute -right-[70px] -top-20 h-60 w-60 rounded-full" style={{ background: 'repeating-conic-gradient(rgba(243,213,154,.18) 0 7deg,transparent 7deg 20deg)', WebkitMaskImage: 'radial-gradient(circle,#000 20%,transparent 68%)', maskImage: 'radial-gradient(circle,#000 20%,transparent 68%)', animation: 'vistoRays 24s linear infinite' }} />
        <span className="self-center" style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(255,253,248,.25)' }} />
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute right-2.5 top-2.5 z-[2] flex h-11 w-11 items-center justify-center rounded-full border-0" style={{ background: 'rgba(255,253,248,.12)', color: '#FFFDF8' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="relative flex items-start gap-3.5 pr-11">
          <span className="flex h-16 w-16 flex-none items-center justify-center">
            <span className="flex h-[46px] w-[46px] rotate-45 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(140deg,#F7E6BE,#D9B86A 55%,#B8903E)', boxShadow: '0 0 22px rgba(243,213,154,.55),inset 0 1px 0 rgba(255,255,255,.6)' }}>
              <span className="-rotate-45" style={{ font: "400 26px/1 'Instrument Serif',serif", color: '#3A2A10' }}>?</span>
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'oklch(0.86 0.12 85)' }}>Emblema Oculto</span>
            <span style={{ font: "400 22px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>¡Aquí se esconde un Emblema Oculto!</span>
            <span style={{ font: "400 13px/1.45 'Geist'", color: 'rgba(255,253,248,.82)' }}>Haz una foto {sitio.en_sitio} y descúbrelo.</span>
          </span>
        </div>
        <button
          type="button"
          data-juego-boton="foto"
          onClick={() => {
            onCerrar()
            useCamaraViajeStore.getState().abrir({ sitio: sitio.sitio, nombre: sitio.nombre, oculto: true })
          }}
          className="relative flex min-h-12 items-center justify-center gap-2 rounded-2xl"
          style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#2A1D10', font: "700 14px 'Geist'", border: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
          </svg>
          Hacer la foto
        </button>
        <button type="button" data-juego-boton="ahora-no" onClick={onCerrar} className="relative min-h-11 self-center px-3 underline underline-offset-[3px]" style={{ font: "400 13px 'Geist'", color: 'rgba(255,253,248,.65)', background: 'none', border: 'none' }}>
          Ahora no
        </button>
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
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(0.5 0.12 65)' }}>Reto del día</span>
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
