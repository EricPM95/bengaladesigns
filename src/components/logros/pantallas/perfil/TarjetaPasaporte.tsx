import { useMemo, type ReactNode } from 'react'
import { Globo } from '../mundo/Globo'
import { mapaDeVisitados } from '../mundo/mapaDeVisitados'
import { usePaisesYTierra } from '../mundo/paises'
import { SelloPasaporte } from '../mundo/SelloPasaporte'
import { TINTAS, aspectoDeSello, fechaDeSello, type FormaDeSello } from '../mundo/selloDatos'
import { plural } from '../../../../lib/viajesPerfil'
import type { PerfilLogros } from './api'

/**
 * LA TARJETA «MI PASAPORTE» DEL PERFIL (`Piezas/Perfil`, P1 de Design): el círculo con el mapa a la izquierda, «Mi pasaporte» y SOLO «6 países · 9 ciudades» (los días viajando van dentro), y los sellos
 * asomando a la derecha. Todo es lo VISITADO y sale del mismo sitio que el pasaporte por dentro (`perfil.pasaporte`): el viaje planeado no cuenta. Al tocarla se abre el pasaporte.
 */
/** Los dos sellos de MUESTRA de la tarjeta (los del diseño P1: el redondo azul y el cuadrado verde de Roma): solo decoración, para que la hoja asome estampada desde el primer día. */
const SELLOS_DE_MUESTRA: { ciudad: string; fecha: string; forma: FormaDeSello; tinta: string }[] = [
  { ciudad: 'Roma', fecha: '2025-03-14', forma: 'round', tinta: TINTAS[0] },
  { ciudad: 'Roma', fecha: '2026-10-13', forma: 'rect', tinta: TINTAS[1] },
]
const COLOCACION = [
  { left: 4, top: 4, giro: -9 },
  { left: 52, top: 26, giro: 7 },
]

/**
 * (Tanda 10N3, §3b.3) Los dos sellos de la esquina: los DOS ÚLTIMOS que ha ganado el viajero y, si tiene menos de dos, los de muestra (sin ninguno, los dos de muestra; con uno, el suyo y uno de muestra).
 * Pura: la prueba la usa.
 */
export function sellosDeLaEsquina(recientes: { ciudad: string; fecha: string }[] | undefined): { ciudad: string; fecha: string; forma: FormaDeSello; tinta: string; muestra: boolean }[] {
  const suyos = (recientes ?? []).slice(0, 2).map((s) => ({ ...s, ...aspectoDeSello(s.ciudad, s.fecha), muestra: false }))
  const relleno = SELLOS_DE_MUESTRA.slice(suyos.length).map((s) => ({ ...s, muestra: true }))
  return [...suyos, ...relleno].slice(0, 2)
}

export function TarjetaPasaporte({ pasaporte, onAbrir }: { pasaporte: PerfilLogros['pasaporte']; onAbrir?: () => void }): ReactNode {
  const { paises, tierra } = usePaisesYTierra()
  const vista = useMemo(() => mapaDeVisitados(paises, pasaporte.paises_iso ?? []), [paises, pasaporte.paises_iso])
  const sellos = sellosDeLaEsquina(pasaporte.sellos_recientes)
  return (
    <button
      type="button"
      onClick={onAbrir}
      disabled={!onAbrir}
      data-abrir-pasaporte
      aria-label="Mi pasaporte"
      className="relative flex flex-none items-center gap-3.5 overflow-hidden rounded-[24px] border-0 text-left"
      style={{ background: 'linear-gradient(150deg,#7A2034,#3E0E18)', color: '#F3D59A', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.3),0 14px 26px -18px rgba(62,14,24,.8)', padding: '14px 16px 14px 14px' }}
    >
      <span data-mapa-pasaporte className="relative block h-[104px] w-[104px] flex-none overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 2px rgba(243,213,154,.55),0 8px 16px -8px rgba(0,0,0,.6)', background: '#F1E9D6' }}>
        {tierra && <Globo key={`${vista.inicial.lat}-${vista.inicial.lng}-${vista.inicial.z}`} tierra={tierra} rellenos={vista.rellenos} inicial={vista.inicial} estilo="papel" lado={104} interactivo={false} etiqueta="El mapa de los países que has visitado" />}
      </span>
      <span aria-hidden="true" className="absolute" style={{ right: -18, bottom: -22, width: 118, height: 92, borderRadius: 8, background: '#F3EBDB', transform: 'rotate(-8deg)', boxShadow: '-6px 6px 16px -6px rgba(0,0,0,.5)' }}>
        {sellos.map((s, i) => (
          <span key={`${s.ciudad}-${s.fecha}-${i}`} data-sello-asomando={s.muestra ? 'muestra' : 'suyo'} className="absolute" style={{ left: COLOCACION[i].left, top: COLOCACION[i].top, transform: `rotate(${COLOCACION[i].giro}deg)` }}>
            <SelloPasaporte forma={s.forma} sitio={s.ciudad} fecha={fechaDeSello(s.fecha)} tinta={s.tinta} tam={58} />
          </span>
        ))}
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
