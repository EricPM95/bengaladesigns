import type { DateNotice } from '../../lib/types'
import { DateNoticeIllustration, DateNoticeSmallIcon } from './DateNoticeIcons'

/**
 * La tarjeta de un aviso de fecha (Tanda 10M): del mismo tamaño y estilo que la tarjeta especial (SeasonCard.tsx: 390 px, la escena de arriba
 * a 300 px, «Hemos preparado tu viaje para estas fechas», el texto debajo), con el icono del aviso arriba EN LUGAR del dibujo de la época.
 * La usa la ventana de avisos (DateNoticesModal.tsx), con varias en un carrusel, y la campana al tocar un aviso (la misma tarjeta, sola).
 */

const ESCENA = 'linear-gradient(180deg,#F1DCAE 0%,#F7E9CB 46%,#FBF3E0 78%,#FFFDF8 100%)'
/** En una pantalla baja la escena se acorta para que quepa el texto y el botón. */
const ALTO_ESCENA = 'h-[300px] [@media(max-height:760px)]:h-[210px]'

function Escena({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relative ${ALTO_ESCENA}`} style={{ background: ESCENA }} aria-hidden="true">
      <div className="absolute left-1/2 top-[74px] h-[260px] w-[260px] -translate-x-1/2 rounded-full [@media(max-height:760px)]:top-[44px]" style={{ background: 'radial-gradient(circle,oklch(0.9 0.1 80 / .5),transparent 65%)' }} />
      <p className="absolute inset-x-0 top-16 whitespace-nowrap text-center font-mono text-[11px] font-medium uppercase tracking-[.2em] text-[rgba(120,78,30,.85)] max-[420px]:text-[10px] max-[420px]:tracking-[.1em] [@media(max-height:760px)]:top-9">
        Hemos preparado tu viaje para estas fechas
      </p>
      {children}
    </div>
  )
}

export function AvisoDeFechaTarjeta({ notice }: { notice: DateNotice }) {
  return (
    <div data-aviso-tarjeta={notice.id} data-aviso-icono={notice.icon} className="flex flex-col">
      <Escena>
        <div className="absolute left-1/2 top-[108px] -translate-x-1/2 [@media(max-height:760px)]:top-[74px]" data-aviso-dibujo>
          <div className="[@media(max-height:760px)]:hidden">
            <DateNoticeIllustration icon={notice.icon} size={132} />
          </div>
          <div className="hidden [@media(max-height:760px)]:block">
            <DateNoticeIllustration icon={notice.icon} size={104} />
          </div>
        </div>
      </Escena>
      <div className="relative z-[2] flex flex-col items-center px-7 pb-3 pt-1 text-center">
        <h2 data-aviso-titulo className="font-display text-[28px] leading-[1.1] text-text">{notice.title}</h2>
        <div className="mt-3 space-y-2.5">
          {notice.texts.map((text) => (
            <p key={text} data-aviso-texto className="m-0 text-[15px] leading-[1.6] text-[rgba(28,34,48,.72)] [text-wrap:pretty]">
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

/** La última tarjeta cuando hay más de 3: «y N más», con el icono, el título y el texto de cada uno. */
export function AvisosMasTarjeta({ notices }: { notices: DateNotice[] }) {
  return (
    <div data-aviso-tarjeta="mas" className="flex flex-col">
      <Escena>
        <h2 className="absolute inset-x-0 top-[96px] text-center font-display text-[48px] italic leading-none text-text [@media(max-height:760px)]:top-[64px]" data-aviso-titulo>
          y {notices.length} más
        </h2>
        <div className="absolute inset-x-0 top-[168px] flex items-center justify-center gap-2.5 [@media(max-height:760px)]:top-[126px]">
          {notices.slice(0, 4).map((notice) => (
            <DateNoticeIllustration key={notice.id} icon={notice.icon} size={56} />
          ))}
        </div>
      </Escena>
      <div className="relative z-[2] flex flex-col gap-4 px-7 pb-3 pt-1">
        {notices.map((notice) => (
          <div key={notice.id} className="flex gap-3" data-aviso-mas={notice.id}>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <DateNoticeSmallIcon icon={notice.icon} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[19px] leading-tight text-text">{notice.title}</p>
              {notice.texts.map((text) => (
                <p key={text} className="mt-1 text-[13.5px] leading-relaxed text-[rgba(28,34,48,.72)]">
                  {text}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
