import { Icono } from '../../ui/Icono'
import { pagoActivo } from '../../../lib/pago'
import { useEscuchar } from '../../../lib/useEscuchar'

/**
 * «Escuchar» (Tanda 6z6, solo de pago): lee en voz alta el texto del «Resumen» de una parada con la voz del navegador. Con [Pausa] y [Seguir]; se para al cambiar de parada o de pantalla.
 * Si el aparato no tiene voz en español, o no hay texto que leer, el botón no sale. `clave`: el id de lo que se lee (la parada). `oscuro`: para la tarjeta oscura de HOY.
 * `barra` (Tanda 6y4, diseño «Ficha Lugar»): la barra oscura fija de abajo de la ficha, «Escuchar la historia», con el botón redondo ámbar de play/pausa, lo que se lleva leído y [Parar]; `abajo`
 * sube la barra cuando la ficha lleva un botón fijo debajo («Añadir a Día 2»).
 */
export function Escuchar({ texto, clave, oscuro = false, barra = false, abajo = false }: { texto: string; clave: string; oscuro?: boolean; barra?: boolean; abajo?: boolean }) {
  const { hayVoz, estado, progreso, escuchar, pausar, seguir, parar } = useEscuchar(texto, clave)
  if (!pagoActivo() || !hayVoz || texto.trim().length === 0) return null
  if (barra) {
    const alPulsar = estado === 'parado' ? escuchar : estado === 'hablando' ? pausar : seguir
    const etiqueta = estado === 'parado' ? 'Escuchar la historia' : estado === 'hablando' ? 'Pausar' : 'Seguir escuchando'
    const estadoTexto = estado === 'hablando' ? 'Leyendo…' : estado === 'pausa' ? 'En pausa' : 'Voz del móvil'
    return (
      <div
        data-escuchar={estado}
        data-escuchar-barra
        className={`pointer-events-auto absolute inset-x-3 z-[6] flex h-[62px] items-center gap-3 rounded-[22px] bg-[#1C2230] pl-2 pr-3 text-[#FFFDF8] shadow-[0_16px_30px_-14px_rgba(28,34,48,.7)] ${abajo ? 'bottom-[76px]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}
      >
        <button type="button" onClick={alPulsar} aria-label={etiqueta} className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
          <Icono nombre={estado === 'hablando' ? 'pausa' : 'seguir'} size={estado === 'hablando' ? 18 : 17} grosor={estado === 'hablando' ? 2.4 : 2} relleno={estado !== 'hablando'} />
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[17px] leading-none">Escuchar la historia</span>
            <span className="font-mono text-[11px] font-medium text-[#FFFDF8]/60">{estadoTexto}</span>
          </span>
          <span className="h-[3px] overflow-hidden rounded-[3px]" style={{ background: 'rgba(255,253,248,.18)' }}>
            <span className="block h-full transition-[width] duration-[900ms] ease-linear" style={{ width: `${Math.round(progreso * 100)}%`, background: 'oklch(0.8 0.14 70)' }} />
          </span>
        </span>
        {estado !== 'parado' && (
          <button type="button" onClick={parar} aria-label="Parar" className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[#FFFDF8]/80 hover:bg-[#FFFDF8]/10">
            <Icono nombre="cerrar" size={15} />
          </button>
        )}
      </div>
    )
  }
  const claseBoton = oscuro
    ? 'flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/20'
    : 'flex h-9 flex-none items-center gap-1.5 rounded-full border border-text/15 bg-white px-3 text-[12.5px] font-semibold text-text hover:bg-bg-hover'
  const fondo = oscuro ? { background: 'rgba(255,253,248,.12)' } : undefined
  return (
    <div className="flex flex-none items-center gap-2" data-escuchar={estado}>
      {estado === 'parado' ? (
        <button type="button" onClick={escuchar} className={claseBoton} style={fondo}>
          <Icono nombre="altavoz" size={15} />
          Escuchar
        </button>
      ) : (
        <>
          {estado === 'hablando' ? (
            <button type="button" onClick={pausar} className={claseBoton} style={fondo}>
              <Icono nombre="pausa" size={15} />
              Pausa
            </button>
          ) : (
            <button type="button" onClick={seguir} className={claseBoton} style={fondo}>
              <Icono nombre="seguir" size={15} />
              Seguir
            </button>
          )}
          <button type="button" onClick={parar} aria-label="Parar" className={claseBoton} style={fondo}>
            <Icono nombre="cerrar" size={14} />
            Parar
          </button>
        </>
      )}
    </div>
  )
}
