import { useMemo, type ReactNode } from 'react'
import { Globo } from '../mundo/Globo'
import { mapaDeVisitados } from '../mundo/mapaDeVisitados'
import { usePaisesYTierra } from '../mundo/paises'
import { SelloPasaporte } from '../mundo/SelloPasaporte'
import { aspectoDeSello, fechaDeSello } from '../mundo/selloDatos'
import { plural } from '../../../../lib/viajesPerfil'
import type { PerfilLogros } from './api'

/**
 * LA TARJETA «MI PASAPORTE» DEL PERFIL (`Piezas/Perfil`, P1 de Design): el círculo con el mapa a la izquierda, «Mi pasaporte» y SOLO «6 países · 9 ciudades» (los días viajando van dentro), y los sellos
 * asomando a la derecha. Todo es lo VISITADO y sale del mismo sitio que el pasaporte por dentro (`perfil.pasaporte`): el viaje planeado no cuenta. Al tocarla se abre el pasaporte.
 */
export function TarjetaPasaporte({ pasaporte, onAbrir }: { pasaporte: PerfilLogros['pasaporte']; onAbrir: () => void }): ReactNode {
  const { paises, tierra } = usePaisesYTierra()
  const vista = useMemo(() => mapaDeVisitados(paises, pasaporte.paises_iso ?? []), [paises, pasaporte.paises_iso])
  const sellos = (pasaporte.sellos_recientes ?? []).slice(0, 2)
  return (
    <button
      type="button"
      onClick={onAbrir}
      data-abrir-pasaporte
      aria-label="Mi pasaporte"
      className="relative flex flex-none items-center gap-3.5 overflow-hidden rounded-[24px] border-0 text-left"
      style={{ background: 'linear-gradient(150deg,#7A2034,#3E0E18)', color: '#F3D59A', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.3),0 14px 26px -18px rgba(62,14,24,.8)', padding: '14px 16px 14px 14px' }}
    >
      <span data-mapa-pasaporte className="relative block h-[104px] w-[104px] flex-none overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 2px rgba(243,213,154,.55),0 8px 16px -8px rgba(0,0,0,.6)', background: '#F1E9D6' }}>
        {tierra && <Globo key={`${vista.inicial.lat}-${vista.inicial.lng}-${vista.inicial.z}`} tierra={tierra} rellenos={vista.rellenos} inicial={vista.inicial} estilo="papel" lado={104} interactivo={false} etiqueta="El mapa de los países que has visitado" />}
      </span>
      <span aria-hidden="true" className="absolute" style={{ right: -18, bottom: -22, width: 118, height: 92, borderRadius: 8, background: '#F3EBDB', transform: 'rotate(-8deg)', boxShadow: '-6px 6px 16px -6px rgba(0,0,0,.5)' }}>
        {sellos.map((s, i) => {
          const a = aspectoDeSello(s.ciudad, s.fecha)
          return (
            <span key={`${s.ciudad}-${s.fecha}`} data-sello-asomando className="absolute" style={{ left: i === 0 ? 4 : 52, top: i === 0 ? 4 : 26, transform: `rotate(${i === 0 ? -9 : 7}deg)` }}>
              <SelloPasaporte forma={a.forma} sitio={s.ciudad} fecha={fechaDeSello(s.fecha)} tinta={a.tinta} tam={58} />
            </span>
          )
        })}
      </span>
      <span className="relative flex flex-1 flex-col items-start gap-1.5" style={{ paddingRight: 70 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: 'rgba(243,213,154,.7)' }}>PASAPORTE</span>
        <span style={{ font: "400 24px/1 'Instrument Serif',serif" }}>Mi pasaporte</span>
        <span data-numeros-pasaporte style={{ font: "500 12px/1.4 'Geist'", color: 'rgba(255,241,214,.85)' }}>
          {plural(pasaporte.paises, 'país', 'países')} · {plural(pasaporte.ciudades, 'ciudad', 'ciudades')}
        </span>
      </span>
    </button>
  )
}
