import { useState } from 'react'
import { borrarFoto, limiteDeFotos, urlParaMostrar, type FotoViaje } from '../../lib/fotosViaje'
import { useFotosViaje } from '../../lib/useFotosViaje'
import { getTodayTripContext } from '../../lib/todayMode'
import type { Route, DayPlan } from '../../lib/types'
import type { ResumenViaje } from '../../lib/viajesPerfil'
import { BotonFoto } from '../route/fotos/BotonFoto'
import { FotoEnGrande } from '../route/fotos/FotoEnGrande'
import { Icono } from '../ui/Icono'

/** Las fotos del álbum, todas juntas y en orden: por día y, dentro del día, por hora de subida. (Por dentro cada foto sigue guardando su día y su parada; aquí no se enseñan así.) */
export function ordenDelAlbum(fotos: FotoViaje[]): FotoViaje[] {
  return [...fotos].sort((a, b) => a.dayNumber - b.dayNumber || a.createdAt.localeCompare(b.createdAt))
}

/**
 * A qué día se apuntan las fotos que se añaden desde el álbum (solo la de pago las añade desde aquí): al de hoy si el viaje está en marcha; si no, al primero del viaje. Sin parada.
 * (Las del álbum son del viaje, no de una parada; el día solo existe porque cada foto se guarda con uno.)
 */
export function diaParaFotosDelAlbum(route: Route): DayPlan | null {
  const dias = route.days.filter((d) => !d.isReturnLeg)
  return getTodayTripContext(route)?.day ?? dias[0] ?? null
}

/**
 * El álbum de un viaje (Tanda 6z6 y 6y4): TODAS las fotos del viaje juntas en una cuadrícula, sin filtros ni títulos por día ni por lugar —es el álbum del viaje, no el de cada parada—, con «Eliminar» en cada
 * foto (de verdad, con confirmación de una línea). Gratis: no lleva [Añadir fotos] (se añaden desde la ficha de cada parada, una por parada); de pago: sí lo lleva y no hay límite. La regla vive en
 * `fotosViaje.ts` (`limiteDeFotos`). Todas las fotos van al mismo viaje.
 */
export function AlbumDeViaje({ viaje }: { viaje: ResumenViaje }) {
  const { fotos, cargando } = useFotosViaje(viaje.id)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grande, setGrande] = useState<FotoViaje | null>(null)

  const dePago = limiteDeFotos().porParada === null
  const diaDestino = diaParaFotosDelAlbum(viaje.route)
  const ordenadas = ordenDelAlbum(fotos)

  async function eliminar(foto: FotoViaje) {
    setBorrando(foto.id)
    setError(null)
    const motivo = await borrarFoto(foto)
    setBorrando(null)
    setConfirmando(null)
    setError(motivo)
  }

  return (
    <section aria-label="Álbum del viaje" data-album-del-viaje>
      {dePago && diaDestino && (
        <BotonFoto
          tripId={viaje.id}
          dayId={diaDestino.id}
          dayNumber={diaDestino.dayNumber}
          stopName={null}
          etiqueta="Añadir fotos"
          multiple
          className="inline-flex h-11 items-center gap-2 rounded-full bg-text px-5 text-[14.5px] font-medium text-bg disabled:opacity-60"
        >
          <Icono nombre="camara" size={18} />
          Añadir fotos
        </BotonFoto>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-text-soft">
          {error}
        </p>
      )}
      {!cargando && fotos.length === 0 && (
        <p className="mt-1 text-[14.5px] leading-snug text-text-soft">{dePago ? 'Aquí irán las fotos de tu viaje.' : 'Aquí irán las fotos de tu viaje. Se añaden desde la ficha de cada parada.'}</p>
      )}
      {ordenadas.length > 0 && (
        <ul className={`grid grid-cols-3 gap-1.5 ${dePago ? 'mt-4' : ''}`} data-cuadricula-album>
          {ordenadas.map((foto) => (
            <li key={foto.id} className="relative overflow-hidden rounded-xl bg-bg-hover">
              {urlParaMostrar(foto) ? <img onClick={() => setGrande(foto)} src={urlParaMostrar(foto)} alt={foto.stopName ?? 'Foto del viaje'} loading="lazy" className="aspect-square w-full cursor-zoom-in object-cover" /> : <div className="aspect-square w-full" />}
              {confirmando === foto.id ? (
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-bg-card/95 px-2 py-1.5 text-[11.5px] leading-tight text-text">
                  <span>¿Eliminar esta foto?</span>
                  <span className="flex gap-3">
                    <button type="button" onClick={() => void eliminar(foto)} disabled={borrando === foto.id} className="font-medium text-text underline underline-offset-2">
                      {borrando === foto.id ? 'Eliminando…' : 'Sí'}
                    </button>
                    <button type="button" onClick={() => setConfirmando(null)} className="text-text-soft">
                      No
                    </button>
                  </span>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmando(foto.id)} className="absolute bottom-1 right-1 rounded-full bg-bg-card/90 px-2.5 py-1 text-[11px] text-text-soft">
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </section>
  )
}
