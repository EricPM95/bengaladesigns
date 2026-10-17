/** Los iconos del Visto y las fotos (trazo fino, sin relleno), copiados de «Visto Fotos» y «Ayudas» del diseño. */
import { ICONOS } from '../../../lib/iconos'
export const TRAZO: Record<string, string> = {
  cam: ICONOS.camara,
  gal: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5h.01',
  loc: ICONOS.mapa,
  lejos: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM9.5 7.5l5 5M14.5 7.5l-5 5',
  gem: 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16M15 4l-3 16',
  cerrar: 'M6 6l12 12M18 6L6 18',
  giro: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  sinSenal: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01M3 3l18 18',
  estrella: 'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z',
}

export function Trazo({ d, tam = 16, grosor = 1.8, className }: { d: string; tam?: number; grosor?: number; className?: string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}
