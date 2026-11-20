import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Globo } from '../mundo/Globo'
import { mapaDeVisitados } from '../mundo/mapaDeVisitados'
import { usePaisesYTierra } from '../mundo/paises'
import { SelloPasaporte } from '../mundo/SelloPasaporte'
import { TINTAS, aspectoDeSello, fechaDeSello, type FormaDeSello } from '../mundo/selloDatos'
import { cargarGloboDeLaCuenta, guardarGlobo, leerGloboLocal, type PosicionDelGlobo } from '../../../../lib/globoDelPasaporte'
import { useMiPerfil } from '../../../../store/useMiPerfil'
import { plural } from '../../../../lib/viajesPerfil'
import type { PerfilLogros } from './api'

/**
 * LA TARJETA «MI PASAPORTE» DEL PERFIL (`Piezas/Perfil`, P1 de Design): el círculo con el mapa a la izquierda, «Mi pasaporte» y SOLO «6 países · 9 ciudades» (los días viajando van dentro), y los sellos
 * asomando a la derecha. Todo es lo VISITADO y sale del mismo sitio que el pasaporte por dentro (`perfil.pasaporte`): el viaje planeado no cuenta. Al tocarla se abre el pasaporte.
 */
/** (V34) Colocación de los dos sellos dentro de la parte de la hoja que SE VE (la hoja asoma por la esquina: lo que cae fuera de la tarjeta se corta, así que los sellos caben enteros en lo visible). */
const COLOCACION = [
  { left: 2, top: 0, giro: -9 },
  { left: 40, top: 20, giro: 7 },
]
const TAM_SELLO = 46
/** (V34) Los dos sellos de EJEMPLO (los del diseño P1: el redondo azul y el cuadrado verde de Roma): los de ejemplo salen SOLO cuando no hay ningún sello propio (apagados y con la palabra «Ejemplo»). */
const SELLOS_DE_EJEMPLO: { ciudad: string; fecha: string; forma: FormaDeSello; tinta: string }[] = [
  { ciudad: 'Roma', fecha: '2025-03-14', forma: 'round', tinta: TINTAS[0] },
  { ciudad: 'Roma', fecha: '2026-10-13', forma: 'rect', tinta: TINTAS[1] },
]

/**
 * (V34) Los sellos de la esquina: SIEMPRE dos. Los DOS ÚLTIMOS estampados del viajero (cada uno con su aspecto de Design: el de Lanzarote, ovalado en tinta de lava con el volcán) y, si tiene menos de dos, los de ejemplo
 * (sin ninguno, los dos de ejemplo; con uno, el suyo y uno de ejemplo). Los quitó la V14 («ya no hay sellos de muestra») y dejó la hoja en blanco y cortada en el Perfil de un viajero nuevo. Pura: la prueba la usa.
 */
export function sellosDeLaEsquina(recientes: { ciudad: string; fecha: string }[] | undefined): { ciudad: string; fecha: string; forma: FormaDeSello; tinta: string; ejemplo: boolean }[] {
  const suyos = (recientes ?? []).slice(0, 2).map((s) => ({ ...s, ...aspectoDeSello(s.ciudad, s.fecha), ejemplo: false }))
  // (V34B) Los de ejemplo, SOLO si no tiene ningún sello; en cuanto tiene uno propio, solo los suyos.
  if (suyos.length > 0) return suyos
  return SELLOS_DE_EJEMPLO.map((s) => ({ ...s, ejemplo: true }))
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
  // (V34) En móviles estrechos (320) todo se encoge un poco para que el texto no quede bajo la hoja.
  const estrecho = typeof window !== 'undefined' && window.innerWidth < 350
  const lado = estrecho ? 76 : 104
  const tamSello = estrecho ? 40 : TAM_SELLO
  const colocacion = estrecho ? [{ left: 2, top: 0, giro: -9 }, { left: 34, top: 16, giro: 7 }] : COLOCACION
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
      style={{ background: 'linear-gradient(150deg,#7A2034,#3E0E18)', color: '#F3D59A', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.3),0 14px 26px -18px rgba(62,14,24,.8)', padding: estrecho ? '12px 14px 12px 12px' : '14px 16px 14px 14px' }}
    >
      <span data-mapa-pasaporte className="relative block flex-none overflow-hidden rounded-full" style={{ width: lado, height: lado, boxShadow: '0 0 0 2px rgba(243,213,154,.55),0 8px 16px -8px rgba(0,0,0,.6)', background: '#F1E9D6' }}>
        {tierra && <Globo key={`${inicial.lat}-${inicial.lng}-${inicial.z}`} tierra={tierra} rellenos={vista.rellenos} inicial={inicial} estilo="papel" lado={lado} interactivo onArrastrado={() => { arrastrado.current = true }} onGiro={(c) => { void guardarGlobo(uid, c) }} etiqueta="El mapa de los países que has visitado" />}
      </span>
      <span aria-hidden="true" className="absolute" style={{ right: estrecho ? -12 : -14, bottom: estrecho ? -14 : -16, width: estrecho ? 92 : 108, height: estrecho ? 72 : 84, borderRadius: 8, background: '#F3EBDB', transform: 'rotate(-8deg)', boxShadow: '-6px 6px 16px -6px rgba(0,0,0,.5)' }}>
        {sellos.map((s, i) => (
          <span key={`${s.ciudad}-${s.fecha}-${i}`} data-sello-asomando={s.ejemplo ? 'ejemplo' : 'suyo'} className="absolute" style={{ left: colocacion[i].left, top: colocacion[i].top, transform: `rotate(${colocacion[i].giro}deg)`, ...(s.ejemplo ? { opacity: 0.5, filter: 'grayscale(.5)' } : {}) }}>
            <SelloPasaporte forma={s.forma} sitio={s.ciudad} fecha={fechaDeSello(s.fecha)} tinta={s.tinta} tam={tamSello} />
            {s.ejemplo && <span data-palabra-ejemplo style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-12deg)', padding: '1px 5px', borderRadius: 4, background: 'rgba(243,235,219,.92)', color: '#5A4A32', font: "700 8.5px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>Ejemplo</span>}
          </span>
        ))}
      </span>
      <span className="relative flex flex-1 flex-col items-start gap-1.5" style={{ paddingRight: estrecho ? 40 : 52 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: 'rgba(243,213,154,.7)' }}>PASAPORTE</span>
        <span style={{ font: `400 ${estrecho ? 21 : 24}px/1 'Instrument Serif',serif` }}>Mi pasaporte</span>
        <span data-numeros-pasaporte style={{ font: "500 12px/1.4 'Geist'", color: 'rgba(255,241,214,.85)' }}>
          {plural(pasaporte.paises, 'país', 'países')}{estrecho ? <br /> : ' · '}{plural(pasaporte.ciudades, 'ciudad', 'ciudades')}
        </span>
      </span>
    </button>
  )
}
