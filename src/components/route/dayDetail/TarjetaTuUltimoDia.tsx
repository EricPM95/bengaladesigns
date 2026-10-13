import { Icono } from '../../ui/Icono'

/** El texto de la tarjeta grande, tal cual lo dice el documento de la Tanda 7 (punto 3). */
export const ULTIMO_DIA_TITULO = 'Tu último día también cuenta'
export const ULTIMO_DIA_TEXTO =
  'Aún no sabemos a qué hora te vas, por eso este día está en blanco. Dinos cuándo sale tu vuelo o tu tren y te lo dejamos listo: lo que te falta por ver, dónde comer y la tarde libre si te da tiempo. Sin repetir nada y sin prisas para irte.'
export const ULTIMO_DIA_LINEA = 'Con tu vuelo, el primer y el último día se ajustan a tu hora.'
export const ULTIMO_DIA_PEQUENA = '¿Te vas por la tarde? Añade tu vuelta y te preparamos la mañana.'

/**
 * LA TARJETA DEL DÍA DE VUELTA (Tanda 7, solo en la versión GRATIS; punto 3 del documento): dentro del acordeón del día de vuelta de DÍAS. Es el motivo principal para pagar, así que es la única cosa de pago
 * de la tanda que sale con candado en la gratis.
 * - Grande (el día sigue en blanco): «Tu último día también cuenta», el texto, la línea «Con tu vuelo, el primer y el último día se ajustan a tu hora.», [Añadir mi vuelta] con candado (hace lo mismo que el
 *   candado de «Escuchar historia»: `pedirPago()`) y, pequeño debajo, [Prefiero montarlo yo] (lo mismo que [+ Añadir lugares] de cualquier día).
 * - Pequeña (el viajero ya añadió lugares a ese día): debajo de sus lugares, «¿Te vas por la tarde? Añade tu vuelta y te preparamos la mañana.» y [Añadir mi vuelta].
 * Quien la pone decide cuándo sale (gratis, día de vuelta, no en coche); aquí solo se dibuja.
 */
export function TarjetaTuUltimoDia({ pequena, onAnadirVuelta, onMontarlo }: { pequena: boolean; onAnadirVuelta: () => void; onMontarlo: () => void }) {
  const boton = (
    <button
      type="button"
      onClick={onAnadirVuelta}
      data-ultimo-dia="anadir-vuelta"
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-text text-[14.5px] font-semibold text-bg transition-transform active:scale-[.98]"
    >
      <Icono nombre="candado" size={16} grosor={1.8} />
      Añadir mi vuelta
    </button>
  )
  if (pequena) {
    return (
      <div data-tarjeta-ultimo-dia="pequena" className="mt-2 flex flex-col gap-2.5 rounded-2xl border border-text/10 bg-bg-card p-3.5">
        <p className="text-[13.5px] leading-snug text-text/75">{ULTIMO_DIA_PEQUENA}</p>
        {boton}
      </div>
    )
  }
  return (
    <div data-tarjeta-ultimo-dia="grande" className="mt-2 flex flex-col gap-3 rounded-2xl border border-text/10 bg-bg-card p-4">
      <h3 className="font-display text-[22px] leading-[1.1] text-text">{ULTIMO_DIA_TITULO}</h3>
      <p className="text-[13.5px] leading-[1.45] text-text/75">{ULTIMO_DIA_TEXTO}</p>
      <p className="text-[12.5px] leading-snug text-text/60">{ULTIMO_DIA_LINEA}</p>
      {boton}
      <button type="button" onClick={onMontarlo} data-ultimo-dia="montarlo" className="self-center py-0.5 text-[12.5px] font-medium text-text/60 underline underline-offset-2">
        Prefiero montarlo yo
      </button>
    </div>
  )
}
