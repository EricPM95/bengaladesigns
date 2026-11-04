import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Coordinates } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExploreAperturaStore, type AperturaExplorar } from '../../../store/useExploreAperturaStore'
import { esDestinoDeCoche } from '../../../lib/experienceCategoryBank'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'
import { CajaBlanca, ojoMono } from './piezas'

/** Los tres botones de «Cerca de ti» de HOY, durante el viaje (de pago): cada uno abre EXPLORAR con ese filtro y ordenado por cercanía a `origen`. */
const BOTONES: { categoria: AperturaExplorar['categoria']; etiqueta: string; icono: NombreIcono }[] = [
  { categoria: 'banos', etiqueta: 'Baños', icono: 'banos' },
  { categoria: 'fuentes', etiqueta: 'Fuentes', icono: 'fuente' },
  { categoria: 'restaurantes', etiqueta: 'Comer', icono: 'comida' },
]

/** (LZ2b1) En un destino de coche (Lanzarote), en lugar de baños y fuentes: gasolineras y aparcamientos. «Comer» sigue como en Roma. */
export const AVISO_GASOLINERAS_NORTE = 'Pocas gasolineras en el norte (Haría y Arrieta): llena el depósito antes de subir.'

interface PuntoCoche {
  id: string
  nombre: string
  lat: number
  lng: number
  zona: string | null
  horario: string | null
  de_pago: boolean | null
  de_noche_24h: boolean | null
  km: number | null
}

const distancia = (km: number | null) => (km == null ? '' : km < 1 ? `${Math.round(km * 10) * 100} m` : `${km.toFixed(1).replace('.', ',')} km`)

/** La lista de gasolineras o de aparcamientos más cercanos (de los datos de OpenStreetMap de la LZ1), con [Abrir en Maps] en cada una. */
function ListaCercaCoche({ tipo, origen, destino, onClose }: { tipo: 'gasolineras' | 'aparcamientos'; origen: Coordinates | null; destino: string; onClose: () => void }) {
  const [puntos, setPuntos] = useState<PuntoCoche[] | null>(null)
  useEffect(() => {
    let cancelado = false
    fetch('/api/cerca-de-ti-coche', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: destino, lat: origen?.lat, lng: origen?.lng }) })
      .then((r) => (r.ok ? r.json() : { gasolineras: [], aparcamientos: [] }))
      .then((datos: { gasolineras: PuntoCoche[]; aparcamientos: PuntoCoche[] }) => {
        if (!cancelado) setPuntos(datos[tipo] ?? [])
      })
      .catch(() => {
        if (!cancelado) setPuntos([])
      })
    return () => {
      cancelado = true
    }
  }, [tipo, destino, origen?.lat, origen?.lng])
  const titulo = tipo === 'gasolineras' ? 'Gasolineras cerca de ti' : 'Aparcamientos cerca de ti'
  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/40" data-cerca-coche={tipo} onClick={onClose}>
      <div className="flex max-h-[80%] flex-col gap-2 rounded-t-[24px] bg-bg px-4 pb-6 pt-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="flex-1 font-display text-[24px] leading-none">{titulo}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="zona-toque flex h-9 w-9 items-center justify-center rounded-full bg-bg-card text-accent">
            <Icono nombre="cerrar" size={16} />
          </button>
        </div>
        {tipo === 'gasolineras' && <p className="text-[13px] leading-[1.4] text-text/70" data-aviso-gasolineras>{AVISO_GASOLINERAS_NORTE}</p>}
        <div className="flex flex-col divide-y divide-text/[.07] overflow-y-auto">
          {puntos === null && <p className="py-3 text-[13px] text-text/60">Buscando…</p>}
          {puntos?.length === 0 && <p className="py-3 text-[13px] text-text/60">No tenemos datos de {tipo === 'gasolineras' ? 'gasolineras' : 'aparcamientos'} aquí.</p>}
          {puntos?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-medium">{p.nombre}</span>
                <span className="text-[12.5px] text-text/60">
                  {[p.zona, distancia(p.km), tipo === 'gasolineras' ? (p.de_noche_24h ? 'abierta 24 h' : p.horario) : p.de_pago === true ? 'de pago' : p.de_pago === false ? 'gratis' : null].filter(Boolean).join(' · ')}
                </span>
              </span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="zona-toque text-[12.5px] font-medium text-accent underline underline-offset-[3px]"
              >
                Abrir en Maps
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * @param origen  donde está el viajero (si compartió su ubicación) o, si no, la siguiente parada; null si no hay ninguno de los dos (EXPLORAR pide entonces la ubicación como siempre)
 */
export function CercaDeTi({ origen }: { origen: Coordinates | null }) {
  const setMode = useRouteStore((state) => state.setMode)
  const pedir = useExploreAperturaStore((state) => state.pedir)
  const destino = useRouteStore((state) => state.route?.destination ?? null)
  const [abierta, setAbierta] = useState<'gasolineras' | 'aparcamientos' | null>(null)
  const deCoche = esDestinoDeCoche(destino)
  const botones: { clave: string; etiqueta: string; icono: NombreIcono; accion: () => void }[] = deCoche
    ? [
        { clave: 'gasolineras', etiqueta: 'Gasolineras', icono: 'coche', accion: () => setAbierta('gasolineras') },
        { clave: 'aparcamientos', etiqueta: 'Aparcar', icono: 'mapa', accion: () => setAbierta('aparcamientos') },
        { clave: 'restaurantes', etiqueta: 'Comer', icono: 'comida', accion: () => { pedir({ categoria: 'restaurantes', origen }); setMode('explore') } },
      ]
    : BOTONES.map((boton) => ({
        clave: boton.categoria,
        etiqueta: boton.etiqueta,
        icono: boton.icono,
        accion: () => {
          pedir({ categoria: boton.categoria, origen })
          setMode('explore')
        },
      }))
  return (
    <CajaBlanca className="!gap-2 !px-3.5 !py-3">
      <span className="text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
        Cerca de ti
      </span>
      <div className="grid grid-cols-3 gap-2">
        {botones.map((boton) => (
          <button
            key={boton.clave}
            type="button"
            onClick={boton.accion}
            className="zona-toque flex h-10 items-center justify-center gap-1.5 rounded-full border border-text/15 bg-white text-[13px] font-semibold text-text hover:bg-bg-hover"
          >
            <Icono nombre={boton.icono} size={16} />
            {boton.etiqueta}
          </button>
        ))}
      </div>
      {deCoche && <p className="text-[12.5px] leading-[1.4] text-text/65">{AVISO_GASOLINERAS_NORTE}</p>}
      {abierta && destino && <ListaCercaCoche tipo={abierta} origen={origen} destino={destino} onClose={() => setAbierta(null)} />}
    </CajaBlanca>
  )
}
