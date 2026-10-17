import { urlMiniatura } from '../../../../lib/miniatura'
import type { Stop } from '../../../../lib/types'
import { useFotoDeParada } from './useFotoDeParada'

/** Color suave según el nombre, para los sitios sin foto propia (como la pieza «Parada con foto» del diseño). */
function tono(nombre: string): string {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 997
  return ['30', '60', '150', '200', '250', '320'][h % 6]
}

/** La pieza «Parada con foto» (Piezas/Parada Foto): la miniatura del sitio; a color con ✓ si está vista, más apagada si está por ver. */
export function ParadaFoto({ nombre, photoUrl, vista, size = 40, marca = vista }: { nombre: string; photoUrl?: string | null; vista: boolean; size?: number; marca?: boolean }) {
  const mini = urlMiniatura(photoUrl) ?? (photoUrl || null)
  const hu = tono(nombre)
  const fondo = `linear-gradient(150deg,oklch(0.86 0.06 ${hu}),oklch(0.6 0.08 ${hu}) 60%,oklch(0.38 0.06 ${hu}))`
  const ck = Math.round(size * 0.42)
  return (
    <span className="relative flex-none" style={{ width: size, height: size }} aria-hidden="true">
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: Math.round(size * 0.28), background: mini ? '#E9DFCB' : fondo, filter: vista ? 'none' : 'grayscale(.75)', opacity: vista ? 1 : 0.5, boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.08)' }}
      >
        {mini && <img src={mini} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />}
      </span>
      {marca && (
        <span className="absolute flex items-center justify-center rounded-full" style={{ right: -4, bottom: -4, width: ck, height: ck, background: 'oklch(0.55 0.11 150)', boxShadow: '0 0 0 2px #FFFDF8' }}>
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
    </span>
  )
}

/** La misma pieza para una parada de la ruta: pide su foto al servidor si viene sin ella. */
export function ParadaFotoDeParada({ parada, ciudad, dateIso, vista, size = 40 }: { parada: Stop; ciudad: string; dateIso: string | null; vista: boolean; size?: number }) {
  const url = useFotoDeParada(parada, ciudad, dateIso)
  return <ParadaFoto nombre={parada.name} photoUrl={url} vista={vista} size={size} />
}
