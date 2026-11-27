import { HojaV2 } from '../hoy/v2/HojasV2'
import { BOTON_CLARO, BOTON_ORO } from '../../ui/botonesOro'
import { DosBotonesHoja, EnlaceHoja } from '../../ui/Hoja'
import type { RevisionDeHoras } from '../../../lib/revisarLasHoras'

/**
 * (V69, apartado 3; Design «Entrada Mueve Dias» A1a/A1b) «REVISA LAS HORAS»: sale al GUARDAR una reserva imposible, antes de meterla en la ruta. Icono de aviso ámbar, el título «Revisa las horas» (no «Algo no cuadra», como pone el dibujo),
 * la frase de lo que choca, dos botones lado a lado ([Revisar el vuelo] / [Revisar el Free Tour] dorado: lleva a lo otro; [Revisar la entrada] blanco con borde: vuelve a cambiar esta) y, abajo y pequeño, «Guardarla igualmente».
 * Si se guarda así: línea naranja en su tarjeta de RESERVAS con la misma frase, y no entra en el día como si cupiera (`reservation.revisarHoras`). La app avisa, no prohíbe. Sin red: todo sale de la ruta y de las reservas del móvil.
 */
export function HojaRevisaLasHoras({ revision, onOtro, onEsta, onGuardarIgualmente, onCerrar, z }: { revision: RevisionDeHoras; onOtro: () => void; onEsta: () => void; onGuardarIgualmente: () => void; onCerrar: () => void; /** (V76) Encima de la hoja del formulario de una reserva extra (capa 110): 130. */ z?: number }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Revisa las horas" fondo="#FBF3E2" z={z}>
      <div data-hoja-revisa-las-horas={revision.caso} className="flex flex-col gap-3.5">
        <div className="flex flex-col items-center gap-2.5 pt-1.5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: '#FDF1DC', border: '1.5px solid rgba(200,100,30,.45)' }} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8641E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <span style={{ font: "400 32px/1.05 'Instrument Serif',serif" }}>Revisa las horas</span>
        </div>
        <span data-revisa-texto className="px-1 text-center text-[15px] font-medium leading-[1.45] [text-wrap:balance]">
          {revision.texto}
        </span>
        <DosBotonesHoja>
          <button type="button" onClick={onOtro} data-revisa-otro className="flex min-h-[54px] items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold leading-[1.15]" style={BOTON_ORO}>
            {revision.otro.etiqueta}
          </button>
          <button type="button" onClick={onEsta} data-revisa-esta className="flex min-h-[54px] items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold leading-[1.15]" style={BOTON_CLARO}>
            {revision.esta}
          </button>
        </DosBotonesHoja>
        <EnlaceHoja onClick={onGuardarIgualmente} datos="guardarla-igualmente">
          Guardarla igualmente
        </EnlaceHoja>
      </div>
    </HojaV2>
  )
}
