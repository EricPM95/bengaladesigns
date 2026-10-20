import { createPortal } from 'react-dom'
import { Icono } from '../ui/Icono'
import { APARTADOS_DE_PRIVACIDAD, SERVICIOS_DE_FUERA, TEXTO_PENDIENTE } from '../../lib/privacidad'
import { marca } from '../../lib/marca'

/**
 * LA PÁGINA DE PRIVACIDAD (cuentas, parte 1): la estructura, sin los textos legales. Cada apartado dice «Texto pendiente» para que lo escriba Eric. Esta página es
 * la única que nombra a las empresas que tratan datos (el resto de la app no nombra empresas). Los servicios salen de `src/lib/privacidad.ts`.
 */
export function PrivacidadScreen({ onVolver }: { onVolver: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Privacidad y condiciones de ${marca.nombre}`} data-privacidad className="fixed inset-0 z-[100] flex flex-col bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center justify-between pl-5 pr-3 pt-[env(safe-area-inset-top)]">
        <h1 className="m-0 uppercase text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' }}>
          Privacidad y condiciones · {marca.nombre}
        </h1>
        <button type="button" onClick={onVolver} aria-label="Cerrar" title="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full">
          <Icono nombre="cerrar" size={18} />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-10 pt-1">
        {APARTADOS_DE_PRIVACIDAD.map((apartado) => (
          <section key={apartado.id} data-apartado-privacidad={apartado.id} className="flex flex-col gap-1.5">
            <h2 className="m-0 font-display text-[22px] leading-tight">{apartado.titulo}</h2>
            <p className="m-0 text-[13px] text-text/55">{apartado.pregunta}</p>
            {apartado.escrito?.map((linea) => (
              <p key={linea} data-linea-escrita className="m-0 text-[14px] text-text/80">
                {linea}
              </p>
            ))}
            <p className="m-0 rounded-lg bg-text/5 px-3 py-2 text-[14px] text-text/70">{TEXTO_PENDIENTE}</p>
            {apartado.id === 'con-quien' && (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {SERVICIOS_DE_FUERA.map((servicio) => (
                  <li key={servicio.nombre} className="text-[13px] text-text/75">
                    <strong>{servicio.nombre}</strong>: {servicio.para}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>,
    document.body,
  )
}
