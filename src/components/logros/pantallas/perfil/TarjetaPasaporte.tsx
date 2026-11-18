import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Globo } from '../mundo/Globo'
import { mapaDeVisitados } from '../mundo/mapaDeVisitados'
import { usePaisesYTierra } from '../mundo/paises'
import { SelloPasaporte } from '../mundo/SelloPasaporte'
import { aspectoDeSello, fechaDeSello, type FormaDeSello } from '../mundo/selloDatos'
import { cargarGloboDeLaCuenta, guardarGlobo, leerGloboLocal, type PosicionDelGlobo } from '../../../../lib/globoDelPasaporte'
import { useMiPerfil } from '../../../../store/useMiPerfil'
import { plural } from '../../../../lib/viajesPerfil'
import type { PerfilLogros } from './api'

/**
 * LA TARJETA «MI PASAPORTE» DEL PERFIL (`Piezas/Perfil`, P1 de Design): el círculo con el mapa a la izquierda, «Mi pasaporte» y SOLO «6 países · 9 ciudades» (los días viajando van dentro), y los sellos
 * asomando a la derecha. Todo es lo VISITADO y sale del mismo sitio que el pasaporte por dentro (`perfil.pasaporte`): el viaje planeado no cuenta. Al tocarla se abre el pasaporte.
 */
const COLOCACION = [
  { left: 4, top: 4, giro: -9 },
  { left: 52, top: 26, giro: 7 },
]

/**
 * (V14) Los sellos de la esquina: SOLO los de verdad del viajero, los DOS ÚLTIMOS estampados (sin ninguno, la página vacía; ya no hay sellos de muestra). Cada uno con su aspecto de Design
 * (el de Lanzarote, ovalado en tinta de lava con el volcán). Pura: la prueba la usa.
 */
export function sellosDeLaEsquina(recientes: { ciudad: string; fecha: string }[] | undefined): { ciudad: string; fecha: string; forma: FormaDeSello; tinta: string }[] {
  return (recientes ?? []).slice(0, 2).map((s) => ({ ...s, ...aspectoDeSello(s.ciudad, s.fecha) }))
}

export function TarjetaPasaporte({ pasaporte, onAbrir }: { pasaporte: PerfilLogros['pasaporte']; onAbrir?: () => void }): ReactNode {
  const { paises, tierra } = usePaisesYTierra()
  const vista = useMemo(() => mapaDeVisitados(paises, pasaporte.paises_iso ?? []), [paises, pasaporte.paises_iso])
  const sellos = sellosDeLaEsquina(pasaporte.sellos_recientes)
  // (V14) El globo se mueve con el dedo y se acuerda de dónde lo dejaste: en este móvil al instante y, con cuenta, en la cuenta (así sale igual en otro móvil). Arrastrar NO abre el pasaporte; tocar sí.
  const uid = useMiPerfil((x) => x.uid)
  const [guardada, setGuardada] = useState<PosicionDelGlobo | null>(() => leerGloboLocal())
  const arrastrado = useRef(false)
  useEffect(() => {
    if (!uid) return
    let vivo = true
    void cargarGloboDeLaCuenta(uid).then((p) => vivo && p && setGuardada((g) => (g && g.lat === p.lat && g.lng === p.lng ? g : p)))
    return () => {
      vivo = false
    }
  }, [uid])
  const inicial = guardada ? { lat: guardada.lat, lng: guardada.lng, z: vista.inicial.z } : vista.inicial
  return (
    <button
      type="button"
      onPointerDownCapture={() => { arrastrado.current = false }}
      onClick={() => { if (arrastrado.current) { arrastrado.current = false; return } onAbrir?.() }}
      disabled={!onAbrir}
      data-abrir-pasaporte
      aria-label="Mi pasaporte"
      className="relative flex flex-none items-center gap-3.5 overflow-hidden rounded-[24px] border-0 text-left"
      style={{ background: 'linear-gradient(150deg,#7A2034,#3E0E18)', color: '#F3D59A', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.3),0 14px 26px -18px rgba(62,14,24,.8)', padding: '14px 16px 14px 14px' }}
    >
      <span data-mapa-pasaporte className="relative block h-[104px] w-[104px] flex-none overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 2px rgba(243,213,154,.55),0 8px 16px -8px rgba(0,0,0,.6)', background: '#F1E9D6' }}>
        {tierra && <Globo key={`${inicial.lat}-${inicial.lng}-${inicial.z}`} tierra={tierra} rellenos={vista.rellenos} inicial={inicial} estilo="papel" lado={104} interactivo onArrastrado={() => { arrastrado.current = true }} onGiro={(c) => { void guardarGlobo(uid, c) }} etiqueta="El mapa de los países que has visitado" />}
      </span>
      <span aria-hidden="true" className="absolute" style={{ right: -18, bottom: -22, width: 118, height: 92, borderRadius: 8, background: '#F3EBDB', transform: 'rotate(-8deg)', boxShadow: '-6px 6px 16px -6px rgba(0,0,0,.5)' }}>
        {sellos.map((s, i) => (
          <span key={`${s.ciudad}-${s.fecha}-${i}`} data-sello-asomando="suyo" className="absolute" style={{ left: COLOCACION[i].left, top: COLOCACION[i].top, transform: `rotate(${COLOCACION[i].giro}deg)` }}>
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
