import { ESTILO_PREGUNTA, PersonasCuadradas } from '../../ui/PersonasCuadradas'
import { preguntaParaQuien } from './BloqueDinero'
import { nombreVisible } from '../../../lib/nombrePersona'
import { nombresEnFrase } from '../../../lib/gastosCompartidos'

/**
 * «¿PARA QUIÉN…?» SEGÚN CÓMO SE LLEVEN LAS CUENTAS (Tanda 10N7; `Piezas/Cuentas Modo` 04, 04b, 05, 05b, 05c y 08). Un solo sitio para todo lo que se añade (entrada, vuelo, alojamiento, excursión, coche, gasto):
 *   · cuenta conjunta: dos opciones, SIN nombres: «Para los dos» («Para todos» con más de dos), marcada, y «Solo para mí» (con «Solo lo ves tú.» debajo);
 *   · cada uno lo suyo: la pregunta cambia según lo que se añade y las pastillas con los nombres (marcado solo quien lo añade), con la línea pequeña de debajo («Solo para ti: …», «Para 2 personas: …», «Para Ana: …»).
 */

export type QueSeAnade = 'entrada' | 'vuelo' | 'alojamiento' | 'excursion' | 'coche'

/** (Tanda 10N10 §6) «¿Para quién son las entradas?» / «¿Para quién es este vuelo?» / «¿Para quién es el alojamiento?» / «¿Para quién es la excursión?» / «¿Para quién es el coche?». Un solo sitio: `preguntaParaQuien` de BloqueDinero. */
export function preguntaDeReserva(que: QueSeAnade): string {
  return preguntaParaQuien(que === 'entrada' ? 'entradas' : que) ?? '¿Para quién es?'
}

/** La línea pequeña debajo de los nombres: «Solo para ti: es un gasto tuyo y nadie más lo ve.» · «Para 2 personas: entra en las cuentas del grupo.» · «Para Ana: entra en las cuentas del grupo.» */
export function lineaParaQuien(marcados: readonly string[], yoId: string | null, nombreDe: (id: string) => string): { fuerte: string; resto: string } {
  const incluyeme = Boolean(yoId) && marcados.includes(yoId as string)
  if (incluyeme && marcados.length === 1) return { fuerte: 'Solo para ti:', resto: ' es un gasto tuyo y nadie más lo ve.' }
  if (incluyeme) return { fuerte: `Para ${marcados.length} personas:`, resto: ' entra en las cuentas del grupo.' }
  return { fuerte: `Para ${nombresEnFrase(marcados.map((id) => nombreVisible(nombreDe(id)) || 'Alguien'))}:`, resto: ' entra en las cuentas del grupo.' }
}

const MENUDO = { font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' } as const

/** Las pastillas con los nombres de «Cada uno lo suyo»: marcado solo quien lo añade, y la línea pequeña. */
export function ParaQuienConNombres({ pregunta, personas, marcados, onAlternar, yoId, nombreDe, datos = 'para-quien', cuenta = true, pie }: { pregunta: string; personas: { id: string; nombre: string; esAdmin: boolean }[]; marcados: string[]; onAlternar: (id: string) => void; yoId: string | null; nombreDe: (id: string) => string; datos?: string; cuenta?: boolean; pie?: boolean }) {
  const linea = lineaParaQuien(marcados, yoId, nombreDe)
  return (
    <div className="flex flex-col gap-2.5" data-para-quien-modo="cada_uno" data-para-quien>
      <span className="flex items-baseline justify-between gap-2">
        <span style={ESTILO_PREGUNTA}>{pregunta}</span>
        {cuenta && (
          <span data-para-quien-cuenta className="flex-none text-text/50" style={{ font: "500 11px 'Geist Mono',monospace", letterSpacing: '.04em' }}>
            {marcados.length} de {personas.length}
          </span>
        )}
      </span>
      {/* (Tanda 10N10 §4) Para ELEGIR a alguien, cuadrados (azul oscuro con ✓ dorado si está marcado, blanco si no). */}
      <PersonasCuadradas personas={personas.map((p) => ({ id: p.id, nombre: p.nombre }))} marcados={marcados} onAlternar={onAlternar} datos={datos} etiqueta={pregunta} />
      {pie !== false && (
        <span data-linea-para-quien style={MENUDO}>
          <b style={{ fontWeight: 600, color: 'rgba(28,34,48,.78)' }}>{linea.fuerte}</b>
          {linea.resto}
        </span>
      )}
    </div>
  )
}
