import { useState, type ReactNode } from 'react'
import { buildGoogleMapsUrlFromHere } from '../../lib/mapsLinks'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { Icono } from '../ui/Icono'
import type { NombreIcono } from '../../lib/iconos'

/**
 * LOS MENÚS «···» DE QUIEN MIRA EL VIAJE DE OTRA PERSONA (RW1 y RW2, cuentas parte 3). Fuera del modo recomendación una persona invitada solo mira: el menú de una parada ofrece [Ver la
 * ficha], [Cómo llegar] y [Recomendar un cambio]; el de un día, [Ver el día en el mapa] y [Recomendar cambios en este día]. [Recomendar…] entra en el modo recomendación (RM), donde las
 * herramientas de siempre vuelven, sobre una copia: nada cambia de verdad hasta enviar.
 */
function Menu({ etiqueta, children, tam = 28 }: { etiqueta: string; children: (cerrar: () => void) => ReactNode; tam?: number }) {
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
        <>
          <div className="fixed inset-0 z-20" onClick={(e) => (e.stopPropagation(), setAbierto(false))} />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-[34px] z-30 flex w-[262px] flex-col rounded-[18px] bg-[#FFFDF8] p-1.5 text-text" style={{ boxShadow: '0 0 0 1px rgba(28,34,48,.08),0 18px 34px -14px rgba(28,34,48,.5)' }}>
            {children(() => setAbierto(false))}
          </div>
        </>
      )}
    </div>
  )
}

function Opcion({ icono, texto, destacada = false, onClick, href }: { icono: NombreIcono; texto: string; destacada?: boolean; onClick?: () => void; href?: string }) {
  const estilo = { minHeight: 44, padding: '0 12px', borderRadius: 12, background: destacada ? 'oklch(0.8 0.14 70 / .18)' : 'transparent', font: destacada ? "600 14px 'Geist'" : "500 14px 'Geist'", display: 'flex', alignItems: 'center', gap: 10, color: '#1C2230', textDecoration: 'none', border: 'none', textAlign: 'left' as const, cursor: 'pointer', width: '100%' }
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
  const empezar = usePropuestaStore((s) => s.empezar)
  return (
    <Menu etiqueta="Opciones de la parada">
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
          <Opcion
            icono="recomendar"
            texto="Recomendar un cambio"
            destacada
            onClick={() => {
              cerrar()
              empezar('parada')
            }}
          />
        </>
      )}
    </Menu>
  )
}

/** RW2: el menú de la cabecera de un día. */
export function MenuInvitadoDia({ onVerEnMapa }: { onVerEnMapa: () => void }) {
  const empezar = usePropuestaStore((s) => s.empezar)
  return (
    <Menu etiqueta="Más opciones del día" tam={38}>
      {(cerrar) => (
        <>
          <Opcion
            icono="mapa"
            texto="Ver el día en el mapa"
            onClick={() => {
              cerrar()
              onVerEnMapa()
            }}
          />
          <Opcion
            icono="recomendar"
            texto="Recomendar cambios en este día"
            destacada
            onClick={() => {
              cerrar()
              empezar('dia')
            }}
          />
        </>
      )}
    </Menu>
  )
}
