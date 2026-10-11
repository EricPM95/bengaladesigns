import type { CifrasDelPerfil } from '../../lib/viajesPerfil'

const DORADO = 'oklch(0.8 0.14 70)'

function Cifra({ valor, etiqueta, oscura = false }: { valor: number; etiqueta: string; oscura?: boolean }) {
  return (
    <span className={`flex h-[30px] items-center gap-1.5 rounded-full pl-2.5 pr-[11px] text-[11.5px] font-medium ${oscura ? 'bg-[#1C2230] text-[#FFFDF8]' : 'bg-[#FFFDF8]/90 text-[#1C2230]'}`}>
      <span className="font-display text-[19px] leading-none" style={oscura ? { color: DORADO } : undefined}>
        {valor}
      </span>
      {etiqueta}
    </span>
  )
}

/** Las tres cifras de abajo a la izquierda del mapa («1 país · 4 lugares · 14 días»); qué cuenta cada una lo dice `cifrasDelPerfil` (viajesPerfil.ts). */
export function CifrasDelMapa({ cifras }: { cifras: CifrasDelPerfil }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex gap-[5px]" data-cifras-del-mapa>
      <Cifra oscura valor={cifras.paises} etiqueta={cifras.paises === 1 ? 'país' : 'países'} />
      <Cifra valor={cifras.lugares} etiqueta={cifras.lugares === 1 ? 'lugar' : 'lugares'} />
      <Cifra valor={cifras.dias} etiqueta={cifras.dias === 1 ? 'día' : 'días'} />
    </div>
  )
}
