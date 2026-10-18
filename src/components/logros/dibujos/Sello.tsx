/** El sello coleccionable de una ciudad: «Sello Logro» del diseño (Logros · Modelos, sección 1). Roma = redondo con el Coliseo; Vaticano = ovalado con la cúpula. */
import SelloLogro from './piezas/SelloLogro'
import './dibujos.css'

export type GradoDeSello = 'bronce' | 'plata' | 'oro' | 'diamante'

/** `etiqueta` (por defecto sí): el nombre de la ciudad escrito en el sello; en los sellos pequeños (el botón, la fila de al lado) va sin ella, como en el diseño. */
export function Sello({ id, grado, tam = 96, apagado = false, animado = true, etiqueta = true }: { id: string; grado: GradoDeSello; tam?: number; apagado?: boolean; animado?: boolean; etiqueta?: boolean }) {
  const vaticano = id === 'vaticano'
  return (
    <span className={animado ? 'dib-mov' : 'dib-quieto'} style={{ display: 'inline-flex' }}>
      <SelloLogro grade={apagado ? 'none' : grado} icon={vaticano ? 'cupula' : 'coliseo'} shape={vaticano ? 'oval' : 'round'} size={tam} label={etiqueta ? (vaticano ? 'VATICANO' : id.toUpperCase()) : ''} />
    </span>
  )
}
