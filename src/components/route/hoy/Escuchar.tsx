import { Icono } from '../../ui/Icono'
import { pagoActivo } from '../../../lib/pago'
import { useEscuchar } from '../../../lib/useEscuchar'

/**
 * «Escuchar» (Tanda 6z6, solo de pago): lee en voz alta el texto del «Resumen» de una parada con la voz del navegador. Con [Pausa] y [Seguir]; se para al cambiar de parada o de pantalla.
 * Si el aparato no tiene voz en español, o no hay texto que leer, el botón no sale. `clave`: el id de lo que se lee (la parada). `oscuro`: para la tarjeta oscura de HOY.
 */
export function Escuchar({ texto, clave, oscuro = false }: { texto: string; clave: string; oscuro?: boolean }) {
  const { hayVoz, estado, escuchar, pausar, seguir, parar } = useEscuchar(texto, clave)
  if (!pagoActivo() || !hayVoz || texto.trim().length === 0) return null
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
