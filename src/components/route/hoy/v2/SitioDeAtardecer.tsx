import type { Stop } from '../../../../lib/types'
import { displayStopName } from '../../../../lib/format'
import { ParadaFoto } from './ParadaFoto'
import { useFotoDeParada } from './useFotoDeParada'

/**
 * (HOY2b 6, 20b) Una fila de «Hoy el sol se pone a las 18:04»: SU FOTO (la del sitio, la propia del destino o ninguna: nunca la de otro), su tiempo y [Cómo llegar].
 * La foto se pide igual que la de cualquier parada (`useFotoDeParada`).
 */
export function SitioDeAtardecer({ nombre, tiempo, ciudad, dateIso, enlace }: { nombre: string; tiempo: string; ciudad: string; dateIso: string | null; enlace: string }) {
  const falsa = { id: `atardecer:${nombre}`, name: nombre } as unknown as Stop
  const foto = useFotoDeParada(falsa, ciudad, dateIso)
  return (
    <div data-hoy-atardecer-sitio className="flex items-center gap-3 rounded-2xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,.16)' }}>
      <span data-hoy-atardecer-foto={foto ? '1' : '0'} className="flex flex-none">
        <ParadaFoto nombre={nombre} photoUrl={foto} vista size={52} marca={false} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="truncate text-[14.5px]">{displayStopName(nombre)}</b>
        <span className="text-[12.5px] opacity-90">{tiempo}</span>
      </span>
      <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-atardecer-como-llegar className="flex h-11 flex-none items-center rounded-xl px-3.5 text-[12.5px] font-bold no-underline" style={{ background: 'rgba(255,255,255,.92)', color: '#7A3E78' }}>
        Cómo llegar
      </a>
    </div>
  )
}
