import { BOTON_ORO } from '../../../ui/botonesOro'
import { HojaV2 } from './HojasV2'
import { Titulo } from './CambiarPlan'

/**
 * V43 §8: «Activa tu ubicación». Sale cuando el viajero dijo que NO a la ubicación y toca [Usar mi ubicación]: con los pasos de Safari (iPhone) o de Chrome (Android) según el móvil.
 * Los pasos se comprobaron buscándolos (24-nov, V43): Safari = «aA» › Ajustes del sitio web › Ubicación (guía del iPhone de Apple; la opción «Permitir» la describen medios, no Apple); Chrome Android = candado › Permisos › Ubicación (guía de Android Central y anuncio de Google; no hay página oficial de Android con esa ruta). Eric: probarlo en su iPhone. Si cambian en una versión nueva, se cambian AQUÍ, en un solo sitio.
 */
export type NavegadorDelMovil = 'safari' | 'chrome'

export function navegadorDelMovil(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): NavegadorDelMovil {
  return /iPhone|iPad|iPod/i.test(ua) ? 'safari' : 'chrome'
}

export const PASOS_UBICACION: Record<NavegadorDelMovil, { titulo: string; pasos: string[] }> = {
  safari: {
    titulo: 'En Safari (iPhone)',
    pasos: ['Toca «aA» a la izquierda de la dirección de la página.', 'Toca «Ajustes del sitio web».', 'En «Ubicación», elige «Permitir».', 'Vuelve a la app y toca [Usar mi ubicación].'],
  },
  chrome: {
    titulo: 'En Chrome (Android)',
    pasos: ['Toca el candado a la izquierda de la dirección de la página.', 'Toca «Permisos».', 'Activa «Ubicación».', 'Vuelve a la app y toca [Usar mi ubicación].'],
  },
}

export function HojaActivaUbicacion({ onCerrar, onReintentar, navegador = navegadorDelMovil() }: { onCerrar: () => void; onReintentar: () => void; navegador?: NavegadorDelMovil }) {
  const { titulo, pasos } = PASOS_UBICACION[navegador]
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Activa tu ubicación" fondo="#FBF3E2">
      <div data-hoy-activa-ubicacion={navegador} className="flex flex-col gap-3">
        <Titulo texto="Activa tu ubicación" onCerrar={onCerrar} />
        <span className="text-[14.5px] font-medium leading-[1.4]">Dijiste que no a la ubicación. Con ella sabemos cuánto tardas en llegar. Para activarla:</span>
        <div className="flex flex-col gap-2 rounded-[18px] p-3.5" style={{ background: 'rgba(181,138,46,.1)' }}>
          <b className="text-[13px]">{titulo}</b>
          {pasos.map((paso, i) => (
            <span key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.35]">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] font-bold" style={{ background: '#1C2230', color: '#F3D88F' }}>{i + 1}</span>
              {paso}
            </span>
          ))}
        </div>
        <button type="button" onClick={onReintentar} data-activa-ubicacion-probar className="flex h-[50px] items-center justify-center rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
          Usar mi ubicación
        </button>
        <button type="button" onClick={onCerrar} className="flex h-9 items-center justify-center text-[13px] font-semibold text-[#1C2230]/60">
          Ahora no
        </button>
      </div>
    </HojaV2>
  )
}
