import type { HoraDeInicio } from '../../../lib/horasDeInicio'
import { sePuedeElegir } from '../../../lib/horasDeInicio'

/**
 * (V69, apartado 4; Design «Free Tour Hora» H1-H3) «HORA DE INICIO»: las horas en botones, 3 por fila. La recomendada, con el borde verde y «Te la recomendamos»; «Quedan 3» en ámbar; las agotadas y las de «No llegas», tachadas en gris y sin poder pulsarse;
 * la elegida, en azul oscuro con la hora dorada. Los colores y medidas son los del dibujo (botón de 64 px, esquinas de 16).
 */
export function HorasDeInicio({ horas, elegida, onElegir }: { horas: HoraDeInicio[]; elegida: string | null; onElegir: (hora: string) => void }) {
  return (
    <div data-horas-de-inicio className="grid grid-cols-3 gap-2" role="group" aria-label="Hora de inicio">
      {horas.map((h) => {
        const puede = sePuedeElegir(h)
        const sel = puede && elegida === h.hora
        const apagada = !puede
        const estilo = sel
          ? { background: '#1C2230', border: '1px solid #1C2230', color: '#F3D88F', sub: '#F3D88F' }
          : apagada
            ? { background: '#EFEAE0', border: '1px solid rgba(28,34,48,.08)', color: 'rgba(28,34,48,.35)', sub: 'rgba(28,34,48,.45)' }
            : h.estado === 'recomendada'
              ? { background: '#EAF5EC', border: '2px solid #2B7F45', color: '#1C2230', sub: '#1F6236' }
              : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)', color: '#1C2230', sub: h.estado === 'pocas' ? '#C8641E' : 'rgba(28,34,48,.55)' }
        return (
          <button
            key={h.hora}
            type="button"
            disabled={apagada}
            aria-pressed={sel}
            onClick={() => onElegir(h.hora)}
            data-hora-boton={h.hora}
            data-hora-estado={h.estado}
            data-hora-elegida={sel ? '1' : '0'}
            className="zona-toque flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1.5 active:scale-[.98]"
            style={{ background: estilo.background, border: estilo.border, cursor: apagada ? 'not-allowed' : 'pointer' }}
          >
            <span className="text-[17px] font-bold" style={{ color: estilo.color, textDecoration: apagada ? 'line-through' : 'none' }}>
              {h.hora}
            </span>
            {h.texto && (
              <span className="text-center text-[10.5px] font-semibold leading-[1.2]" style={{ color: estilo.sub }}>
                {h.texto}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
