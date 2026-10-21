import type { Route } from '../../../../lib/types'
import { addDaysToIso, formatHeaderDateRangeShortEs, formatWeekdayAbbrEs, isoToLocalDate, todayIso } from '../../../../lib/dateRange'
import { logrosActivos } from '../../../../lib/logros'
import { pedirPago } from '../../../../lib/pago'
import { Icono } from '../../../ui/Icono'
import type { NombreIcono } from '../../../../lib/iconos'
import type { EstadoPase } from '../../../../lib/paseEstado'

const VISTA_PREVIA: { icono: NombreIcono; t: string; s: string }[] = [
  { icono: 'mapa', t: 'Siguiente parada', s: 'Y cómo llegar, paso a paso' },
  { icono: 'altavoz', t: 'Escuchar su historia', s: 'Escucha la historia de lo que ves' },
  { icono: 'hecho', t: 'Tu día, paso a paso', s: 'Visto, No me da tiempo y Más visitas' },
  { icono: 'banos', t: 'Cerca de ti', s: 'Baños, fuentes y dónde comer' },
  { icono: 'avisos', t: 'Avisos del día', s: 'Cierres, lluvia y tus entradas' },
  { icono: 'camara', t: 'Fotos del viaje', s: 'Tus recuerdos, día a día' },
]

const MEDALLAS = [
  { n: 'Bronce', c: '#C08A5A' },
  { n: 'Plata', c: '#C9CED4' },
  { n: 'Oro', c: 'oklch(0.82 0.12 80)' },
]

const FECHA_CORTA = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' })

/** Los días que faltan desde hoy (o la fecha simulada) hasta el primer día, contados por fechas de calendario. */
function diasHasta(startIso: string, hoyIso: string): number {
  return Math.round((isoToLocalDate(startIso).getTime() - isoToLocalDate(hoyIso).getTime()) / 86400000)
}

/**
 * HOY antes del viaje (pantallas 1a con fechas y 1b sin fechas, «HOY v2»; desde la 10D también la HOY de producción, con y sin pase, con los colores de Marca JUTRIP: paneles en tinta y el azul claro del diseño, en oro pálido): la tarjeta oscura con la cuenta atrás (o «Pon tus fechas»), lo que dará HOY y, si hay cobro y no hay pase,
 * la tarjeta del Pase de Roma con [Ver el pase]. Con el cobro apagado, lo mismo sin la insignia del pase ni el botón.
 */
export function HoyAntesV2({ startIso, simulada, pase, onPonFechas }: { startIso: string | null; simulada: string | null; pase: EstadoPase; onPonFechas: () => void }) {
  const verPase = pase.cobro && !pase.conPase
  const faltan = startIso ? Math.max(0, diasHasta(startIso, simulada ?? todayIso())) : 0
  return (
    <>
      <div className="relative flex flex-none flex-col gap-1.5 overflow-hidden rounded-[28px] bg-[#1C2230] p-5 text-[#FFFDF8]" style={{ boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
        <span aria-hidden="true" className="absolute h-[180px] w-[180px] rounded-full" style={{ right: -50, top: -50, background: 'rgba(233,199,122,.26)', filter: 'blur(30px)' }} />
        {startIso ? (
          <>
            <span className="relative" style={{ font: "400 21px/1.15 'Instrument Serif',serif", color: 'rgba(255,253,248,.88)' }}>
              Tu modo Hoy se activa el <em style={{ color: '#E9C77A' }}>{FECHA_CORTA.format(isoToLocalDate(startIso)).replace(/\./g, '').replace(',', '')}</em>
            </span>
            <span className="relative flex items-baseline gap-2.5">
              <span style={{ font: "400 88px/.9 'Instrument Serif',serif" }}>{faltan}</span>
              <em style={{ font: "italic 400 34px/1 'Instrument Serif',serif", color: '#E9C77A' }}>{faltan === 1 ? 'día' : 'días'}</em>
            </span>
          </>
        ) : (
          <>
            <span className="relative" style={{ font: "400 30px/1.05 'Instrument Serif',serif" }}>
              Tu modo Hoy se activa <em style={{ color: '#E9C77A' }}>el primer día de tu viaje</em>
            </span>
            <span className="relative text-[13px] leading-[1.45] text-[#FFFDF8]/70">Pon tus fechas y lo dejamos listo.</span>
            <button type="button" onClick={onPonFechas} className="relative mt-2 flex h-[46px] items-center gap-2 self-start rounded-full bg-[#FFFDF8] pl-3.5 pr-[18px] text-[14px] font-semibold text-[#1C2230]">
              <Icono nombre="dias" size={16} grosor={1.8} />
              Pon tus fechas
            </button>
          </>
        )}
      </div>

      <div className="relative flex flex-none flex-col gap-3.5 overflow-hidden rounded-[28px] px-3.5 pb-3.5 pt-5 text-[#FFFDF8]" style={{ background: 'linear-gradient(165deg,#232A3B 0%,#1C2230 60%)', boxShadow: '0 0 0 1px oklch(0.82 0.12 80 / .28),0 24px 44px -24px rgba(28,34,48,.85)' }}>
        <span aria-hidden="true" className="absolute h-[220px] w-[220px] rounded-full" style={{ right: -60, top: -70, background: 'radial-gradient(circle,oklch(0.82 0.12 80 / .32),transparent 65%)' }} />
        <div className="relative flex flex-col gap-1.5 px-1">
          {verPase && (
            <span className="flex h-[26px] items-center gap-1.5 self-start rounded-full pl-[7px] pr-2.5" style={{ background: 'oklch(0.82 0.12 80 / .14)', border: '1px solid oklch(0.82 0.12 80 / .4)', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(0.86 0.12 85)' }}>
              <Icono nombre="candado" size={12} grosor={2.2} />
              Pase de Roma
            </span>
          )}
          <span style={{ font: "400 30px/1.02 'Instrument Serif',serif", textWrap: 'balance' as never }}>
            Durante el viaje, <em style={{ color: 'oklch(0.86 0.12 85)' }}>Hoy te dará</em>
          </span>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          {VISTA_PREVIA.map((v) => (
            <div key={v.t} className="flex min-h-[108px] flex-col gap-2 rounded-[18px] p-3" style={{ background: 'rgba(255,253,248,.06)', border: '1px solid rgba(255,253,248,.08)' }}>
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px]" style={{ background: 'rgba(255,253,248,.1)' }}>
                <Icono nombre={v.icono} size={17} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold leading-tight">{v.t}</span>
                <span className="text-[11.5px] leading-[1.35] text-[#FFFDF8]/60">{v.s}</span>
              </span>
            </div>
          ))}
        </div>
        {logrosActivos() && (
          <div className="relative rounded-[20px] p-[1.5px]" style={{ background: 'linear-gradient(120deg,oklch(0.72 0.13 65),oklch(0.92 0.1 90) 45%,oklch(0.72 0.13 65))' }}>
            <div className="flex flex-col gap-1.5 rounded-[19px] p-3.5" style={{ background: 'linear-gradient(160deg,#252B3B,#1C2230)' }}>
              <span style={{ font: "400 21px/1.05 'Instrument Serif',serif" }}>Logros y sellos</span>
              <span className="text-[12px] leading-[1.45] text-[#FFFDF8]/70">Haz fotos en cada sitio, desbloquea logros secretos y llena tu pasaporte de sellos.</span>
              <span className="mt-0.5 flex gap-[5px]">
                {MEDALLAS.map((m) => (
                  <span key={m.n} className="flex h-[22px] items-center gap-[5px] rounded-full pl-[5px] pr-2 text-[10.5px] font-semibold" style={{ background: 'rgba(255,253,248,.08)' }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.c }} />
                    {m.n}
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}
        {verPase && (
          <button type="button" onClick={pedirPago} className="relative flex h-[52px] items-center justify-center gap-2 rounded-full text-[14.5px] font-bold text-[#1C2230]" style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', boxShadow: '0 12px 24px -12px oklch(0.75 0.13 70)' }}>
            Ver el Pase de Roma
            <Icono nombre="flecha" size={15} grosor={2.2} />
          </button>
        )}
      </div>
    </>
  )
}

/** Eyebrow + título de la cabecera de HOY: «Roma · 20 – 24 oct» / «Tu viaje a Roma» (antes) o «jue 23» / el título del día. */
export function CabeceraHoy({ ojo, titulo, sub }: { ojo: string; titulo: string; sub?: string | null }) {
  return (
    <div className="flex flex-none flex-col gap-1 px-1 pb-1" data-hoy-cabecera>
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgb(var(--accent-hover))' }}>{ojo}</span>
      <span style={{ font: "400 28px/1.02 'Instrument Serif',serif", textWrap: 'balance' as never }} data-titulo-del-dia="1">{titulo}</span>
      {sub && <span style={{ font: "500 12px 'Geist Mono',monospace", letterSpacing: '.04em', color: 'rgba(28,34,48,.6)' }}>{sub}</span>}
    </div>
  )
}

export function ojoDeViaje(route: Route, startIso: string | null): string {
  if (!startIso) return route.destination
  // Las MISMAS fechas que la cabecera de la app (answers.dateRange); sin ellas, el primer día más los días de la ruta.
  const fin = route.answers.dateRange?.end ?? addDaysToIso(startIso, Math.max(1, route.days.length) - 1)
  return `${route.destination} · ${formatHeaderDateRangeShortEs(startIso, fin).replace(/\./g, '')}`
}

export { formatWeekdayAbbrEs }
