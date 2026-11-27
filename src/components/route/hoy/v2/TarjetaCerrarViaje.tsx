import type { Route } from '../../../../lib/types'
import { cerrarMiViaje } from '../../../../lib/cierreDelViaje'
import { diasDelViaje } from '../../../../lib/duracionViaje'
import { useNumeroFotos } from '../../../../lib/useNumeroFotos'
import { BOTON_ORO } from '../../../ui/botonesOro'

/**
 * (V79, Design «La vuelta en HOY», VL6) LA TARJETA DE «CERRAR MI VIAJE»: debajo de la tarjeta del vuelo, cuando ya estás en el aeropuerto (VL3), la tarjeta oscura con estrellas «Tu viaje a Roma termina aquí»,
 * «6 días · 23 sitios · 47 fotos» y [Cerrar mi viaje] (el botón dorado de siempre, `BOTON_ORO`). Al pulsarlo se abre el resumen del viaje y HOY pasa a «después» (`cerrarMiViaje`); no se borra nada.
 * Los días y los sitios salen de la ruta; las fotos, de la cuenta de fotos del viaje (la misma del Perfil). Consultas a Supabase: la cuenta de fotos del viaje, UNA vez al enseñarse la tarjeta (≈0,1 KB); nada en bucle.
 */
const ESTRELLAS: { x: number; y: number; r: number }[] = [
  { x: 26, y: 20, r: 3 }, { x: 70, y: 52, r: 2 }, { x: 118, y: 14, r: 2 }, { x: 214, y: 30, r: 3 },
  { x: 258, y: 66, r: 2 }, { x: 306, y: 22, r: 2 }, { x: 330, y: 58, r: 3 }, { x: 44, y: 96, r: 2 },
]

export function TarjetaCerrarViaje({ route }: { route: Route }) {
  const dias = diasDelViaje(route)
  const sitios = route.days.reduce((n, d) => n + (d.stops ?? []).filter((s) => !s.isZoneWalk).length, 0)
  const fotos = useNumeroFotos([route.id])?.get(route.id) ?? 0
  const partes = [
    dias > 0 ? `${dias} ${dias === 1 ? 'día' : 'días'}` : '',
    sitios > 0 ? `${sitios} ${sitios === 1 ? 'sitio' : 'sitios'}` : '',
    fotos > 0 ? `${fotos} ${fotos === 1 ? 'foto' : 'fotos'}` : '',
  ].filter(Boolean)
  return (
    <div data-hoy-cerrar-viaje className="relative flex flex-none flex-col items-center gap-2.5 overflow-hidden rounded-[24px] px-[18px] pb-[18px] pt-5 text-center" style={{ background: 'radial-gradient(120% 90% at 50% 0%,#2E2A5A 0%,#1E2040 50%,#14162C 100%)', boxShadow: '0 18px 30px -20px rgba(20,22,44,.9)' }}>
      <span aria-hidden="true" className="absolute" style={{ left: '50%', top: -40, marginLeft: -130, width: 260, height: 260, opacity: 0.4, background: 'repeating-conic-gradient(from 0deg,rgba(243,216,143,.4) 0 4deg,transparent 4deg 15deg)', WebkitMaskImage: 'radial-gradient(circle,#000 8%,transparent 62%)', maskImage: 'radial-gradient(circle,#000 8%,transparent 62%)' }} />
      {ESTRELLAS.map((s, i) => (
        <span key={i} aria-hidden="true" className="absolute rounded-full" style={{ left: s.x, top: s.y, width: s.r, height: s.r, background: '#F3D88F', opacity: 0.8 }} />
      ))}
      <span data-hoy-cerrar-viaje-titulo className="relative text-[#FFFDF8]" style={{ font: "400 28px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        Tu viaje a {route.destination} termina aquí
      </span>
      {partes.length > 0 && (
        <span className="relative" style={{ font: "500 13px 'Geist'", color: 'rgba(255,253,248,.7)' }}>
          {partes.join(' · ')}
        </span>
      )}
      <button type="button" onClick={() => cerrarMiViaje(route.id)} data-hoy-cerrar-viaje-boton className="relative mt-1.5 flex h-[52px] items-center justify-center self-stretch rounded-2xl text-[15.5px] font-bold" style={BOTON_ORO}>
        Cerrar mi viaje
      </button>
    </div>
  )
}
