import { CruzDeHoja } from '../../../ui/CruzDeHoja'
import { BOTON_AZUL } from '../piezas'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Route, Stop } from '../../../../lib/types'
import { displayStopName } from '../../../../lib/format'
import { unir } from '../../../../lib/hoyCambiarPlan'
import { useCompaneroStore } from '../../../../lib/hoyCompanero'
import { useAddFlowStore } from '../../../../store/useAddFlowStore'
import { Insignia } from '../../../logros/dibujos'
import { fechaCorta } from '../../../logros/pantallas/destino/formato'
import type { RetoDeHoy, SitioDeReto } from '../useCercaDeAqui'
import { useFotoDeParada } from './useFotoDeParada'
import { FONDO_DE_HOJA } from '../../../ui/fondoDeHoja'

/**
 * (HOY2b, E, apartado 4; Eric, 5-nov) EL RETO DEL DÍA (5), MEJORADO, y el ÁLBUM DE CROMOS de cada colección (Mi Vitrina › ColeccionPorDentro, pantalla A), con la FOTO de cada sitio en lugar del icono.
 *  · Qué colecciones salen: TODAS las que puedes completar hoy con las paradas del día y las que tienen un pedazo fuera de tu ruta pero cerca de la zona de hoy (20 min en coche o 15 a pie): «Te falta Los Hervideros y no está en tu ruta».
 *    Lo calcula el servidor (`retosDelDia` en server/logros/cerca.js) y llega por `useCompaneroStore`.
 *  · Cómo se ven: debajo de la tarjeta principal; si hay más de una, en fila con scroll horizontal (como los viajes del Perfil); cada tarjeta: el nombre, «3 de 5 · te faltan 2» y su barra.
 *  · Al tocar una, el álbum: cada cromo con su estado: «Visto» y la fecha · «Hoy en tu ruta» · «En tu ruta el jueves» · «No está en tu ruta» con [Añadir] (la hoja de días de siempre).
 *  · Se ve todo el día mientras quede algo; se apaga con «Sugerencias del compañero» (entonces el servidor no se consulta y esto no recibe nada).
 */
const ORO_TEXTO = '#8E6820'
const VERDE = 'oklch(0.42 0.09 150)'

/** «el jueves»: el día de la semana de una fecha AAAA-MM-DD. */
export const diaDeLaSemana = (fecha: string | null): string => (fecha && /^\d{4}-\d{2}-\d{2}/.test(fecha) ? new Date(`${fecha.slice(0, 10)}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' }) : '')

/** «Te falta Los Hervideros y no está en tu ruta» / «Te faltan A y B y no están en tu ruta». */
export const textoFueraDeRuta = (nombres: string[]): string => `Te ${nombres.length > 1 ? 'faltan' : 'falta'} ${unir(nombres.map(displayStopName))} y no ${nombres.length > 1 ? 'están' : 'está'} en tu ruta`

/** La foto de un sitio (la propia del destino, la de Unsplash que lo mencione o ninguna: nunca la de otro); sin ella, un fondo de color. */
export function FotoDeSitio({ nombre, ciudad, alto, ancho = '100%', radio = 14 }: { nombre: string; ciudad: string; alto: number; ancho?: number | string; radio?: number }) {
  const falsa = { id: `reto:${nombre}`, name: nombre } as unknown as Stop
  const foto = useFotoDeParada(falsa, ciudad, null)
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 997
  const hu = ['30', '60', '150', '200', '250', '320'][h % 6]
  return (
    <span data-album-foto={foto ? '1' : '0'} className="relative block flex-none overflow-hidden" style={{ width: ancho, height: alto, borderRadius: radio, background: `linear-gradient(150deg,oklch(0.86 0.06 ${hu}),oklch(0.6 0.08 ${hu}) 60%,oklch(0.38 0.06 ${hu}))` }}>
      {foto && <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />}
    </span>
  )
}

function TarjetaDeReto({ reto, ancho, onAbrir }: { reto: RetoDeHoy; ancho: 'completa' | 'fila'; onAbrir: () => void }) {
  const tengo = reto.total - reto.faltan
  const ganados = reto.sitios.filter((s) => s.ganado).map((s) => s.sitio)
  return (
    <button
      type="button"
      onClick={onAbrir}
      data-reto-del-dia={reto.coleccion}
      data-reto-completable={reto.completable_hoy ? '1' : '0'}
      className="flex flex-none snap-start flex-col gap-2.5 rounded-[22px] p-3.5 text-left"
      style={{ width: ancho === 'completa' ? '100%' : 'min(84%,310px)', background: 'linear-gradient(135deg,#FBF1D2,#F0DCA0)', border: '1px solid #C9A24E' }}
    >
      <span className="flex items-center gap-3.5">
        <span className="flex flex-none items-center justify-center" style={{ width: 76, height: 76 }}>
          <Insignia coleccion={reto.coleccion} ganados={ganados} completa={false} tam={76} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: ORO_TEXTO }}>RETO DEL DÍA</span>
          <b data-reto-nombre style={{ font: "400 22px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>
            {reto.completable_hoy ? `Hoy puedes completar «${reto.nombre}»` : `«${reto.nombre}»`}
          </b>
          <span data-reto-cuenta className="text-[13px] font-bold" style={{ color: '#5A3E0C' }}>
            {tengo} de {reto.total}
          </span>
        </span>
      </span>
      <span style={{ display: 'block', height: 6, borderRadius: 3, background: 'rgba(110,80,24,.18)', overflow: 'hidden' }}>
        <span data-reto-barra style={{ display: 'block', width: `${Math.round((tengo / reto.total) * 100)}%`, height: '100%', background: 'oklch(0.55 0.11 150)' }} />
      </span>
      {reto.faltan_fuera.length > 0 && (
        <span data-reto-fuera className="text-[12.5px] font-medium leading-[1.3]" style={{ color: '#6E5018' }}>
          {textoFueraDeRuta(reto.faltan_fuera)}
        </span>
      )}
    </button>
  )
}

/** «Y 3 colecciones más avanzan hoy» (el número real; «Y 1 colección más avanza hoy»). */
export const textoColeccionesMas = (n: number): string => `Y ${n} ${n === 1 ? 'colección más avanza' : 'colecciones más avanzan'} hoy`

/**
 * (Tanda V2, H3) UN SOLO reto a la vista: el primero de la lista (el servidor ya la manda ordenada y sin colecciones de menos de 3 sitios:
 * `elegirRetos` en server/logros/cerca.js). Debajo, «Y N colecciones más avanzan hoy ›» abre la lista de las demás; tocar una abre su álbum.
 */
export function RetoDelDia({ route }: { route: Route }) {
  const retos = useCompaneroStore((s) => s.cerca?.retos) ?? []
  const [abierto, setAbierto] = useState<string | null>(null)
  const [lista, setLista] = useState(false)
  if (retos.length === 0) return null
  const [principal, ...demas] = retos
  const reto = retos.find((r) => r.coleccion === abierto) ?? null
  return (
    <>
      <div data-hoy-retos={retos.length} className="flex flex-none flex-col gap-3">
        <TarjetaDeReto reto={principal} ancho="completa" onAbrir={() => setAbierto(principal.coleccion)} />
        {demas.length > 0 && (
          <button type="button" data-reto-mas={demas.length} onClick={() => setLista(true)} aria-label={`${textoColeccionesMas(demas.length)}: ver la lista`} className="flex min-h-11 items-center justify-center gap-1.5 text-[13px] font-semibold" style={{ color: ORO_TEXTO }}>
            {textoColeccionesMas(demas.length)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>
      {lista && <ListaDeColecciones retos={demas} onElegir={(c) => { setLista(false); setAbierto(c) }} onCerrar={() => setLista(false)} />}
      {reto && <AlbumDeColeccion reto={reto} ciudad={route.destination} onCerrar={() => setAbierto(null)} />}
    </>
  )
}

/** La hoja con las demás colecciones que avanzan hoy: insignia, nombre y «2 de 5». */
function ListaDeColecciones({ retos, onElegir, onCerrar }: { retos: RetoDeHoy[]; onElegir: (coleccion: string) => void; onCerrar: () => void }) {
  return createPortal(
    <div data-reto-lista role="dialog" aria-modal="true" aria-label="Más colecciones de hoy" className="fixed inset-0 z-[90] flex items-end justify-center">
      <div className="absolute inset-0" style={{ background: FONDO_DE_HOJA }} onClick={onCerrar} />
      <div className="relative flex max-h-[80dvh] w-full max-w-[520px] flex-col gap-2.5 overflow-y-auto rounded-t-[32px] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#FBF3E2', boxShadow: '0 -20px 40px rgba(0,0,0,.25)', scrollbarWidth: 'none' }}>
        <span className="h-1 w-[44px] flex-none self-center rounded-sm bg-[rgba(28,34,48,.25)]" aria-hidden="true" />
        <CruzDeHoja onCerrar={onCerrar} />
        <span style={{ font: "400 26px/1.1 'Instrument Serif',serif" }} className="pr-12 pt-1">{textoColeccionesMas(retos.length)}</span>
        {retos.map((r) => (
          <button key={r.coleccion} type="button" data-reto-lista-item={r.coleccion} onClick={() => onElegir(r.coleccion)} className="flex min-h-14 items-center gap-3 rounded-[20px] p-2.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
            <span className="flex flex-none items-center justify-center" style={{ width: 48, height: 48 }}>
              <Insignia coleccion={r.coleccion} ganados={r.sitios.filter((s) => s.ganado).map((s) => s.sitio)} completa={false} tam={48} />
            </span>
            <b className="min-w-0 flex-1 text-[15px] font-semibold leading-[1.2]">{r.nombre}</b>
            <span data-reto-lista-cuenta className="flex-none text-[13px] font-bold" style={{ color: '#5A3E0C' }}>
              {r.total - r.faltan} de {r.total}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}

/** El álbum de cromos de una colección, con la foto de cada sitio. */
export function AlbumDeColeccion({ reto, ciudad, onCerrar }: { reto: RetoDeHoy; ciudad: string; onCerrar: () => void }) {
  const tengo = reto.total - reto.faltan
  return createPortal(
    <div data-album-de-coleccion={reto.coleccion} role="dialog" aria-modal="true" aria-label={reto.nombre} className="fixed inset-0 z-[90] flex items-end justify-center">
      <div className="absolute inset-0" style={{ background: FONDO_DE_HOJA }} onClick={onCerrar} />
      <div className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col gap-3.5 overflow-y-auto rounded-t-[32px] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3" style={{ background: '#F5EFE4', boxShadow: '0 -20px 40px rgba(0,0,0,.25)', scrollbarWidth: 'none' }}>
        <span className="h-1 w-[44px] flex-none self-center rounded-sm bg-[rgba(28,34,48,.25)]" aria-hidden="true" />
        <CruzDeHoja onCerrar={onCerrar} />
        <div className="flex flex-col items-center gap-1.5 pb-1 pt-2 text-center">
          <Insignia coleccion={reto.coleccion} ganados={reto.sitios.filter((s) => s.ganado).map((s) => s.sitio)} completa={false} tam={130} />
          <span data-album-nombre style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>{reto.nombre}</span>
          <span style={{ font: "600 11px 'Geist Mono',monospace", color: 'oklch(0.48 0.17 5)' }}>
            {tengo} DE {reto.total}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {reto.sitios.map((s) => (
            <Cromo key={s.sitio} s={s} ciudad={ciudad} onAnadir={() => {
              onCerrar()
              useAddFlowStore.getState().openAddFlow(null, s.nombre)
            }} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** El estado de un cromo, con las palabras de siempre. */
export function estadoDeCromo(s: SitioDeReto): { clave: SitioDeReto['estado']; texto: string } {
  if (s.estado === 'visto') return { clave: 'visto', texto: `Visto${s.fecha ? ` · ${fechaCorta(s.fecha)}` : ''}` }
  if (s.estado === 'hoy') return { clave: 'hoy', texto: 'Hoy en tu ruta' }
  if (s.estado === 'otro_dia') return { clave: 'otro_dia', texto: `En tu ruta el ${diaDeLaSemana(s.dia_fecha) || 'otro día'}` }
  return { clave: 'fuera', texto: 'No está en tu ruta' }
}

function Cromo({ s, ciudad, onAnadir }: { s: SitioDeReto; ciudad: string; onAnadir: () => void }) {
  const e = estadoDeCromo(s)
  const visto = e.clave === 'visto'
  return (
    <div data-album-cromo={s.sitio} data-album-estado={e.clave} className="flex flex-col gap-2 rounded-[18px] p-2" style={{ background: visto ? '#FFFDF8' : 'rgba(255,253,248,.6)', border: `1px solid ${visto ? 'rgba(28,34,48,.07)' : 'rgba(28,34,48,.14)'}` }}>
      <span style={{ filter: visto || e.clave === 'hoy' ? 'none' : 'grayscale(.55)', opacity: visto ? 1 : 0.92 }}>
        <FotoDeSitio nombre={s.nombre} ciudad={ciudad} alto={92} />
      </span>
      <span className="px-1 text-[13px] font-medium leading-[1.2]" style={{ color: visto ? '#1C2230' : 'rgba(28,34,48,.7)' }}>{displayStopName(s.nombre)}</span>
      <span data-album-estado-texto className="px-1 text-[11.5px] font-semibold leading-[1.25]" style={{ color: visto ? VERDE : e.clave === 'hoy' ? ORO_TEXTO : e.clave === 'otro_dia' ? '#6F4E37' : 'oklch(0.48 0.17 5)' }}>
        {e.texto}
      </span>
      {e.clave === 'fuera' && (
        <button type="button" onClick={onAnadir} data-album-anadir className="mb-0.5 flex h-11 items-center justify-center rounded-2xl text-[12.5px] font-bold" style={BOTON_AZUL}>
          Añadir
        </button>
      )}
    </div>
  )
}
