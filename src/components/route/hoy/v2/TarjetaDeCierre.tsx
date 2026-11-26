import { useState, type ReactNode } from 'react'
import type { Route } from '../../../../lib/types'
import { useCompaneroStore } from '../../../../lib/hoyCompanero'
import { Icono } from '../../../ui/Icono'
import { AlbumDeColeccion, ListaDeColecciones } from './RetoDelDia'

/**
 * (V73 §2; Design «Hoy Al Acabar», AC1-AC3) LA TARJETA DE CIERRE del día acabado. NUNCA vacía:
 *  · con el atardecer visto: fondo del atardecer, el sol, «Hoy has visto el atardecer · Un cierre perfecto en El Golfo.»;
 *  · sin atardecer: fondo oscuro, la bandera, «Has hecho 6 paradas hoy · Lo mejor: Timanfaya, los Jameos del Agua y la Cueva de los Verdes.» (`fraseDeCierre`, en BloquesHoy.tsx);
 *  · debajo de la frase, las etiquetas («6 paradas», «Atardecer en El Golfo», «2 colecciones avanzan»; esta última, tocable: abre la lista de colecciones que avanzan hoy);
 *  · abajo, la franja dorada «Ver el resumen del día ›», que abre el MISMO `ResumenDia` de siempre (solo con logros y cuenta: sin ellos no hay resumen y no sale).
 * Se mantienen [Deshacer] (la última parada) y [Más visitas] (los días recortados), que ya estaban en la tarjeta de antes.
 */
const SOL = 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5'
const BANDERA = 'M6 21V4M6 4h11l-2 4 2 4H6'
const FONDO_ATARDECER = 'linear-gradient(160deg,#F9C98A,#E58A5E 55%,#7A3E78)'
const FONDO_OSCURO = 'linear-gradient(170deg,#2A3250,#10162E)'

export interface DatosDeCierre {
  titulo: string
  sub: string | null
  atardecer: boolean
  /** «6 paradas», «Atardecer en El Golfo», «Todo visto»… (ya con los números reales). */
  etiquetas: string[]
}

export function TarjetaDeCierre({ route, datos, onResumen, onDeshacer, onMasVisitas, hayMasVisitas }: { route: Route; datos: DatosDeCierre; onResumen: (() => void) | null; onDeshacer: (() => void) | null; onMasVisitas: () => void; hayMasVisitas: boolean }): ReactNode {
  // «2 colecciones avanzan» (una sola vez en todo HOY: aquí): las colecciones que avanzan hoy, con el número real; al tocarla, la lista y, al elegir una, su álbum (lo mismo que abría «Y 2 colecciones más avanzan hoy ›»).
  const retos = useCompaneroStore((s) => s.cerca?.retos) ?? []
  const [lista, setLista] = useState(false)
  const [abierto, setAbierto] = useState<string | null>(null)
  const reto = retos.find((r) => r.coleccion === abierto) ?? null
  const etiquetaColecciones = retos.length > 0 ? `${retos.length} ${retos.length === 1 ? 'colección avanza' : 'colecciones avanzan'}` : null
  const etiqueta = { height: 28, padding: '0 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', font: "600 12px 'Geist'" } as const
  return (
    <>
    <div data-hoy-todo-visto data-hoy-cierre={datos.atardecer ? 'atardecer' : 'dia'} className="relative flex-none overflow-hidden rounded-[28px] text-white" style={{ background: datos.atardecer ? FONDO_ATARDECER : FONDO_OSCURO, boxShadow: '0 22px 32px -22px rgba(28,34,48,.8)' }}>
      <span aria-hidden="true" className="pointer-events-none absolute" style={{ right: -40, top: -50, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.28),transparent 68%)' }} />
      <div className="relative flex flex-col gap-3.5 px-5 pb-4 pt-[22px]">
        <span className="flex items-start justify-between gap-3">
          <span className="flex h-[58px] w-[58px] flex-none items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,.2)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.55)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={datos.atardecer ? SOL : BANDERA} />
            </svg>
          </span>
          {onDeshacer && (
            <button type="button" onClick={onDeshacer} className="flex h-11 flex-none items-center gap-1.5 rounded-full border-[1.5px] border-white/40 px-3.5 text-[13px] font-semibold">
              <Icono nombre="recuperar" size={15} grosor={1.8} />
              Deshacer
            </button>
          )}
        </span>
        <span className="flex flex-col gap-[5px]">
          <b data-hoy-cierre-titulo style={{ font: "400 30px/1.08 'Instrument Serif',serif", textWrap: 'balance' as never }}>{datos.titulo}</b>
          {datos.sub && <span data-hoy-cierre-sub style={{ font: "500 14px/1.4 'Geist'", opacity: 0.95, textWrap: 'pretty' as never }}>{datos.sub}</span>}
        </span>
        <div className="flex flex-wrap gap-2">
          {datos.etiquetas.map((e) => (
            <span key={e} data-hoy-cierre-etiqueta className="flex items-center" style={etiqueta}>{e}</span>
          ))}
          {(datos.atardecer ? false : !etiquetaColecciones) && <span data-hoy-cierre-etiqueta className="flex items-center" style={etiqueta}>Todo visto</span>}
          {etiquetaColecciones && (
            <button type="button" onClick={() => setLista(true)} data-hoy-cierre-colecciones className="flex items-center gap-1" style={etiqueta}>
              {etiquetaColecciones}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
        {hayMasVisitas && (
          <button type="button" onClick={onMasVisitas} data-mas-visitas className="flex h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-white/30 text-[14px] font-semibold">
            <Icono nombre="anadir" size={15} grosor={1.8} />
            Más visitas
          </button>
        )}
      </div>
      {onResumen && (
        <button type="button" onClick={onResumen} data-hoy-cierre-resumen className="relative flex h-14 w-full items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#F9EFCB,#EAD6A0 55%,#D8BD7C)', color: '#4A3510', font: "700 15px 'Geist'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)' }}>
          Ver el resumen del día
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
    {lista && <ListaDeColecciones retos={retos} onElegir={(c) => { setLista(false); setAbierto(c) }} onCerrar={() => setLista(false)} />}
    {reto && <AlbumDeColeccion reto={reto} ciudad={route.destination} onCerrar={() => setAbierto(null)} />}
    </>
  )
}
