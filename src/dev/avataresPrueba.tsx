/** Solo desarrollo (Tanda 10N3): pinta la MISMA foto con los componentes de avatar de la app (el emblema, el avatar, la cara de «Personas del viaje»), para comprobar que se ve igual en todos. */
import { createElement } from 'react'
import { Avatar } from '../components/ajustes/Avatar'
import { CaraDePersona } from '../components/compartir/CarasDelViaje'
import { InicialEnMarco } from '../components/logros/pantallas/perfil/MarcoDeRango'
import type { Encuadre } from '../lib/encuadreFoto'
import { desmontar, montarEnBody } from './escaparateUtil'

export function montarAvatares(foto: string, encuadre: Encuadre | null): void {
  const caja = (tam: number, hijo: ReturnType<typeof createElement>, etiqueta: string) => createElement('div', { key: etiqueta, 'data-avatar-prueba': etiqueta, style: { position: 'relative', width: tam, height: tam, borderRadius: '50%', overflow: 'hidden', margin: 8 } }, hijo)
  montarEnBody(
    'avatares',
    createElement(
      'div',
      { style: { background: '#FFFDF8', minHeight: '100%', padding: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center' } },
      caja(104, createElement(InicialEnMarco, { letra: 'E', tam: 104, foto, encuadre }), 'emblema'),
      createElement('div', { key: 'av', 'data-avatar-prueba': 'avatar', style: { margin: 8 } }, createElement(Avatar, { foto, inicial: 'E', tam: 52, encuadre })),
      createElement('div', { key: 'cara', 'data-avatar-prueba': 'cara', style: { margin: 8 } }, createElement(CaraDePersona, { persona: { id: 'p1', nombre: 'Eric', foto: 'x', encuadre, esAdmin: true }, tam: 38, foto })),
      createElement('div', { key: 'cab', 'data-avatar-prueba': 'cabecera', style: { margin: 8 } }, createElement(CaraDePersona, { persona: { id: 'p2', nombre: 'Eric', foto: 'x', encuadre, esAdmin: true }, tam: 28, foto })),
    ),
  )
}
export const quitarAvatares = (): void => desmontar('avatares')
