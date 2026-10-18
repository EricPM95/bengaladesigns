import type { ReactNode } from 'react'
import { Chapa, Emblema, Insignia, MedallaDeSiete, Sello, type GradoDeSello } from '../../dibujos'
import type { FilaDeViajero, ItemGanado } from './api'

/** El dibujo de una cosa ganada, con los dibujos que ya hay (`dibujos/`): ninguno se redibuja aquí. */
export function DibujoDeItem({ item, tam, apagado = false }: { item: ItemGanado; tam: number; apagado?: boolean }): ReactNode {
  switch (item.tipo) {
    case 'sello':
      return <Sello id={item.sello ?? 'roma'} grado={(item.grado ?? 'bronce') as GradoDeSello} tam={tam} apagado={apagado} animado={false} />
    case 'coleccion':
      return <Insignia coleccion={item.coleccion ?? ''} completa tam={tam} />
    case 'emblema':
      // Solo se dibujan los emblemas ya encontrados (el servidor no manda los demás).
      return <Emblema id={item.emblema ?? ''} tam={tam} animado={false} fecha={item.fecha} />
    case 'maravilla':
      return <MedallaDeSiete encendidas={[item.maravilla ?? '']} tam={tam} />
    case 'viajero':
    case 'exclusivo':
      return <Chapa logro={item.def ?? ''} escalon={item.escalon === '' ? null : item.escalon} tam={tam} bloqueado={apagado} ciudad={item.lugar?.split(',')[0]} />
  }
}

/** La chapa de una fila de logro de viajero: la del escalón más alto que tiene (o la primera, en gris, si aún no tiene ninguno). */
export function ChapaDeFila({ fila, tam }: { fila: FilaDeViajero; tam: number }): ReactNode {
  const progreso = fila.id === 'cuatro_estaciones' || fila.id === 'doce_meses' ? (fila.progreso ?? (fila.id === 'doce_meses' ? '' : 0)) : undefined
  return <Chapa logro={fila.id} escalon={fila.escalon} tam={tam} bloqueado={!fila.ganado} progreso={progreso} />
}

/** La caja que da el alto verdadero de un dibujo (las medallas de las 7 maravillas son más altas que anchas). */
export const ALTO_MEDALLA = 1.18
