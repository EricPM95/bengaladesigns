import { useState } from 'react'
import { borrarFoto, limiteDeFotos, modoDeFoto, urlParaMostrar, type FotoViaje } from '../../lib/fotosViaje'
import { useFotosViaje } from '../../lib/useFotosViaje'
import { agruparFotos, paradasDelDia, type ResumenViaje } from '../../lib/viajesPerfil'
import { BotonFoto } from '../route/fotos/BotonFoto'
import { FotoEnGrande } from '../route/fotos/FotoEnGrande'
import { rotuloDia } from '../route/fotos/GaleriaRecuerdos'
import { Icono } from '../ui/Icono'

/** El texto del botón de subir: «Cambiar foto» si ese sitio ya tiene la suya (gratis), «Añadir foto» en la gratis y «Añadir fotos» en la de pago (varias a la vez). */
export function etiquetaAnadirFoto(modo: 'anadir' | 'cambiar'): string {
  if (modo === 'cambiar') return 'Cambiar foto'
  return limiteDeFotos().porParada === null ? 'Añadir fotos' : 'Añadir foto'
}

/**
 * El álbum de un viaje (Tanda 6z6): las fotos por días y, dentro de cada día, por parada; [Añadir fotos] al día (y parada) que se elija, y «Eliminar» en cada foto (de verdad, con
 * confirmación de una línea). Gratis: una foto por parada; de pago, sin límite. La regla vive en `fotosViaje.ts` (`limiteDeFotos`, `modoDeFoto`).
 */
export function AlbumDeViaje({ viaje }: { viaje: ResumenViaje }) {
  const { fotos, cargando } = useFotosViaje(viaje.id)
  const dias = viaje.route.days.filter((d) => !d.isReturnLeg)
  const inicio = viaje.route.answers.dateRange?.start
  const [diaId, setDiaId] = useState<string | null>(null)
  const [parada, setParada] = useState<string>('')
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grande, setGrande] = useState<FotoViaje | null>(null)

  const dia = dias.find((d) => d.id === diaId) ?? dias[0]
  const paradasDeEseDia = dia ? paradasDelDia(dia) : []
  const paradaElegida = paradasDeEseDia.includes(parada) ? parada : ''
  const modo = dia ? modoDeFoto(fotos, dia.dayNumber, paradaElegida || null) : 'anadir'
  const porDias = agruparFotos(fotos, viaje.route)

  async function eliminar(foto: FotoViaje) {
    setBorrando(foto.id)
    setError(null)
    const motivo = await borrarFoto(foto)
    setBorrando(null)
    setConfirmando(null)
    setError(motivo)
  }

  return (
    <section aria-label="Álbum del viaje">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-text/55">Álbum</h3>
      {limiteDeFotos().porParada !== null && <p className="mt-1 text-[12.5px] text-text-soft">Una foto por parada</p>}
      {dia && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {dias.length > 1 && (
            <select value={dia.id} onChange={(e) => setDiaId(e.target.value)} aria-label="Día al que añadir las fotos" className="h-11 rounded-full border border-text/15 bg-bg-card px-3 text-[14px] text-text">
              {dias.map((d) => (
                <option key={d.id} value={d.id}>
                  {rotuloDia(d.dayNumber, inicio)}
                </option>
              ))}
            </select>
          )}
          <select value={paradaElegida} onChange={(e) => setParada(e.target.value)} aria-label="Parada a la que añadir la foto" className="h-11 max-w-[200px] rounded-full border border-text/15 bg-bg-card px-3 text-[14px] text-text">
            <option value="">Todo el día</option>
            {paradasDeEseDia.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
          <BotonFoto
            tripId={viaje.id}
            dayId={dia.id}
            dayNumber={dia.dayNumber}
            stopName={paradaElegida || null}
            etiqueta={etiquetaAnadirFoto(modo)}
            multiple
            className="inline-flex h-11 items-center gap-2 rounded-full bg-text px-5 text-[14.5px] font-medium text-bg disabled:opacity-60"
          >
            <Icono nombre="camara" size={18} />
            {etiquetaAnadirFoto(modo)}
          </BotonFoto>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-text-soft">
          {error}
        </p>
      )}
      {!cargando && fotos.length === 0 && <p className="mt-4 text-[14.5px] leading-snug text-text-soft">Aquí irán tus fotos del viaje, ordenadas por días.</p>}
      {porDias.map(({ dayNumber, grupos }) => (
        <div key={dayNumber} className="mt-5">
          <h4 className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{rotuloDia(dayNumber, inicio)}</h4>
          {grupos.map((grupo) => (
            <div key={grupo.parada ?? 'dia'} className="mt-2">
              {grupo.parada && <p className="mb-1.5 text-[13.5px] text-text-soft">{grupo.parada}</p>}
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {grupo.fotos.map((foto) => (
                  <li key={foto.id} className="relative overflow-hidden rounded-2xl bg-bg-hover">
                    {urlParaMostrar(foto) ? <img onClick={() => setGrande(foto)} src={urlParaMostrar(foto)} alt={foto.stopName ?? `Foto del ${rotuloDia(foto.dayNumber, inicio)}`} loading="lazy" className="aspect-square w-full cursor-zoom-in object-cover" /> : <div className="aspect-square w-full" />}
                    {confirmando === foto.id ? (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-bg-card/95 px-2.5 py-2 text-[12.5px] text-text">
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
                      <button type="button" onClick={() => setConfirmando(foto.id)} className="absolute bottom-1.5 right-1.5 rounded-full bg-bg-card/90 px-3 py-1.5 text-[12px] text-text-soft">
                        Eliminar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </section>
  )
}
