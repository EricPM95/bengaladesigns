import { limiteDeFotos, urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { pagoActivo } from '../../../lib/pago'
import { getTodayTripStatus } from '../../../lib/todayMode'
import type { Route } from '../../../lib/types'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { usePerfilUi } from '../../../store/usePerfilUi'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { CabeceraCaja, CajaBlanca } from '../hoy/piezas'

/** Las tres últimas fotos del viaje: por día (el más reciente primero) y, dentro del día, por fecha de subida. */
export function ultimasTresFotos(fotos: FotoViaje[]): FotoViaje[] {
  return [...fotos].sort((a, b) => b.dayNumber - a.dayNumber || b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
}

/** «Roma» o «Roma y Florencia» (o «Roma, Florencia y Pisa») a partir del destino del viaje («Roma → Florencia», «Roma, Italia»): cada tramo, hasta la primera coma. */
export function nombresDeDestinos(destino: string): { texto: string; varios: boolean } {
  const nombres = destino.split('→').map((tramo) => tramo.split(',')[0].trim()).filter(Boolean)
  if (nombres.length === 0) return { texto: destino, varios: false }
  if (nombres.length === 1) return { texto: nombres[0], varios: false }
  return { texto: `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`, varios: true }
}

const RAYAS = 'repeating-linear-gradient(135deg,#EFE7D6 0 10px,#EAE1CE 10px 20px)'

/**
 * La tarjeta «Guarda tus recuerdos» (Tanda 6z6c, como el prototipo): tres cuadros con las tres últimas fotos del viaje (en miniatura); los vacíos son cuadros de rayas con la cámara y
 * abren lo de subir. Debajo, la línea del mapa de viajes, [Subir mis fotos] y, si ya hay fotos, [Ver mis recuerdos] (el álbum del Perfil). `onSubir` cambia a dónde llevan subir y los
 * cuadros vacíos. La usa RUTA en la versión gratis (`TarjetaRecuerdosEnRuta`) y la puede usar HOY después del viaje.
 */
export function TarjetaRecuerdos({ route, onSubir }: { route: Route; onSubir?: () => void }) {
  const abrirAlbum = usePerfilUi((state) => state.abrirAlbum)
  const { fotos } = useFotosViaje(route.id)
  const unaPorParada = limiteDeFotos().porParada !== null
  const ultimas = ultimasTresFotos(fotos)
  const subir = onSubir ?? (() => abrirAlbum(route.id))
  const destinos = nombresDeDestinos(route.destination)
  const cuadros = [0, 1, 2].map((i) => ultimas[i] ?? null)
  return (
    <CajaBlanca>
      <CabeceraCaja icono="camara" titulo="Guarda tus recuerdos" />
      <div className="grid gap-1.5" style={{ gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: '64px 64px' }}>
        {cuadros.map((foto, i) => {
          const grande = i === 0
          const forma = `${grande ? 'row-span-2 rounded-2xl' : 'rounded-[14px]'} overflow-hidden`
          if (foto) {
            return (
              <button key={foto.id} type="button" onClick={() => abrirAlbum(route.id)} aria-label="Ver mis recuerdos" className={forma}>
                <img src={urlParaMostrar(foto)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            )
          }
          return (
            <button
              key={`vacio-${i}`}
              type="button"
              onClick={subir}
              aria-label="Subir mis fotos"
              className={`${forma} flex items-center justify-center text-text/40`}
              style={{ background: RAYAS, border: '1.5px dashed rgba(28,34,48,.18)' }}
            >
              <Icono nombre="camara" size={grande ? 24 : 20} />
            </button>
          )
        })}
      </div>
      <span className="flex items-start gap-2 text-[13px] leading-[1.45] text-text-soft">
        <span className="mt-px flex-none" style={{ color: 'oklch(0.5 0.17 5)' }}>
          <Icono nombre="mapa" size={16} />
        </span>
        Sube tus fotos y {destinos.texto} {destinos.varios ? 'quedan' : 'queda'} en tu mapa de viajes, en tu perfil.
      </span>
      <button
        type="button"
        onClick={subir}
        className="flex h-[50px] items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold text-white transition-transform active:scale-[.98]"
        style={{ background: 'oklch(0.55 0.17 5)', boxShadow: '0 12px 22px -12px oklch(0.55 0.17 5)' }}
      >
        <Icono nombre="camara" size={18} />
        Subir mis fotos
      </button>
      {fotos.length > 0 && (
        <button
          type="button"
          onClick={() => abrirAlbum(route.id)}
          className="flex h-11 items-center justify-center rounded-full border border-text/15 text-[14px] font-medium text-text transition-transform active:scale-[.98]"
        >
          Ver mis recuerdos
        </button>
      )}
      {unaPorParada && <p className="text-[12.5px] text-text-soft">Una foto por parada</p>}
    </CajaBlanca>
  )
}

/** ¿Se enseña la tarjeta en RUTA? Solo en la versión gratis y solo cuando el viaje ya ha pasado (en la de pago, esto está en HOY, después del viaje). */
export function verTarjetaRecuerdosEnRuta(route: Route, hoyIso?: string): boolean {
  return !pagoActivo() && getTodayTripStatus(route, hoyIso)?.phase === 'after'
}

/** La tarjeta en la pestaña RUTA: se monta con UNA línea y se decide sola si sale. */
export function TarjetaRecuerdosEnRuta({ route }: { route: Route }) {
  const simulada = useRouteStore((state) => state.dev_simulated_today_iso)
  if (!verTarjetaRecuerdosEnRuta(route, simulada ?? undefined)) return null
  return <TarjetaRecuerdos route={route} />
}
