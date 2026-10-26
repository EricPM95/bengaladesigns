import { useState, type ReactNode } from 'react'
import { buildGoogleMapsUrlFromHere } from '../../lib/mapsLinks'
import { Icono } from '../ui/Icono'
import { HojaDelMenu } from '../ui/MenuHoja'
import type { NombreIcono } from '../../lib/iconos'

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

function Opcion({ icono, texto, destacada = false, onClick, href }: { icono: NombreIcono; texto: string; destacada?: boolean; onClick?: () => void; href?: string }) {
  const estilo = { minHeight: 52, padding: '0 4px', borderRadius: 0, borderBottom: '1px solid rgba(28,34,48,.08)', background: destacada ? 'oklch(0.8 0.14 70 / .18)' : 'transparent', font: destacada ? "600 14px 'Geist'" : "500 14px 'Geist'", display: 'flex', alignItems: 'center', gap: 10, color: '#1C2230', textDecoration: 'none', border: 'none', textAlign: 'left' as const, cursor: 'pointer', width: '100%' }
  const contenido = (
    <>
      <Icono nombre={icono} size={16} grosor={1.8} />
      {texto}
    </>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={estilo}>
      {contenido}
    </a>
  ) : (
    <button type="button" onClick={onClick} style={estilo}>
      {contenido}
    </button>
  )
}

/** RW1: el menú de una parada. */
export function MenuInvitadoParada({ nombre, ciudad, onVerFicha }: { nombre: string; ciudad: string; onVerFicha: () => void }) {
  return (
    <Menu etiqueta="Opciones de la parada" titulo={nombre} tipo="Parada">
      {(cerrar) => (
        <>
          <Opcion
            icono="ficha"
            texto="Ver la ficha"
            onClick={() => {
              cerrar()
              onVerFicha()
            }}
          />
          <Opcion icono="mapa" texto="Cómo llegar" href={buildGoogleMapsUrlFromHere(`${nombre}, ${ciudad}`)} onClick={cerrar} />
        </>
      )}
    </Menu>
  )
}
