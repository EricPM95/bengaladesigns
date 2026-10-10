import { Icono } from './Icono'

/** Iconos de línea de la app (la familia única de `src/lib/iconos.ts`): los botones flotantes del mapa y del presupuesto. */
export function MapLineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <Icono nombre="mapa" className={className} />
}

export function WalletLineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <Icono nombre="presupuesto" className={className} />
}

/** La mochila de las excursiones (el autobús es solo de la llegada y la vuelta). */
export function BusLineIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return <Icono nombre="excursion" className={className} />
}
