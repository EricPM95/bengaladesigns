import { useState, type ReactNode } from 'react'
import { buildGoogleMapsUrlFromHere } from '../../lib/mapsLinks'
import { ICONOS_OPCION, OpcionTarjeta } from '../ui/HojaOpciones'
import { HojaDelMenu } from '../ui/MenuHoja'

/**
 * EL MENÚ «···» DE UNA PARADA PARA QUIEN SOLO RECOMIENDA, DURANTE EL VIAJE (Tanda 10N, apartado 6): desde el primer día del viaje ya no propone cambios, así que su menú solo deja [Ver la ficha] y [Cómo llegar].
 * (Antes del viaje cambia la ruta directamente, con el menú de siempre, y todo va a su propuesta. Ya no hay «Recomendar un cambio» ni «Recomendar cambios en este día».)
 */
/** (Tanda 10N §6c) Sale desde abajo, como hoja baja con el nombre arriba (`HojaDelMenu`), no como cuadro flotante. */
function Menu({ etiqueta, titulo, tipo, children, tam = 28 }: { etiqueta: string; titulo: string; tipo: string; children: (cerrar: () => void) => ReactNode; tam?: number }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto((v) => !v)
        }}
        title="Más opciones"
        aria-label={etiqueta}
        data-menu-invitado
        className="flex shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
        style={{ width: tam, height: tam }}
      >
        ···
      </button>
      {abierto && (
        <HojaDelMenu etiqueta={tipo} titulo={titulo} onCerrar={() => setAbierto(false)}>
          {children(() => setAbierto(false))}
        </HojaDelMenu>
      )}
    </div>
  )
}

/** RW1: el menú de una parada. */
export function MenuInvitadoParada({ nombre, ciudad, onVerFicha }: { nombre: string; ciudad: string; onVerFicha: () => void }) {
  return (
    <Menu etiqueta="Opciones de la parada" titulo={nombre} tipo="Parada">
      {(cerrar) => (
        <>
          <OpcionTarjeta
            tono="azul"
            icono={ICONOS_OPCION.ficha}
            titulo="Ver la ficha"
            linea="Mira el sitio con todo su detalle"
            flecha
            onClick={() => {
              cerrar()
              onVerFicha()
            }}
          />
          <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.mapa} titulo="Cómo llegar" linea="Abre el mapa desde donde estás" href={buildGoogleMapsUrlFromHere(`${nombre}, ${ciudad}`)} onClick={cerrar} />
        </>
      )}
    </Menu>
  )
}
