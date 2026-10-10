import { useState } from 'react'
import { borrarFoto, urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { addDaysToIso, isoToLocalDate } from '../../../lib/dateRange'
import { useRouteStore } from '../../../store/useRouteStore'
import { BotonFoto } from './BotonFoto'
import { FotoEnGrande } from './FotoEnGrande'

const DIA_SEMANA = new Intl.DateTimeFormat('es', { weekday: 'short' })

/** «Lun 13» con fechas; «Día 1» sin ellas. */
export function rotuloDia(dayNumber: number, inicioIso: string | null | undefined): string {
  if (!inicioIso) return `Día ${dayNumber}`
  const fecha = isoToLocalDate(addDaysToIso(inicioIso, dayNumber - 1))
  const semana = DIA_SEMANA.format(fecha).replace('.', '')
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)} ${fecha.getDate()}`
}

/**
 * Los recuerdos del viaje («Después del viaje»): las fotos ordenadas por días y, dentro de cada día,
 * por parada si la tienen. Cada foto se puede eliminar de verdad (con confirmación de una línea) y
 * `[Subir mis fotos]` añade más, varias a la vez, al día que se elija.
 */
export function GaleriaRecuerdos() {
  const route = useRouteStore((state) => state.route)
  const { fotos, cargando } = useFotosViaje()
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [diaId, setDiaId] = useState<string | null>(null)
  const [grande, setGrande] = useState<FotoViaje | null>(null)

  if (!route) return null
  const inicio = route.answers.dateRange?.start
  const dias = route.days
  const dia = dias.find((d) => d.id === diaId) ?? dias[dias.length - 1]

  const porDia = new Map<number, FotoViaje[]>()
  for (const foto of fotos) porDia.set(foto.dayNumber, [...(porDia.get(foto.dayNumber) ?? []), foto])
  const numerosConFotos = [...porDia.keys()].sort((a, b) => a - b)

  async function eliminar(foto: FotoViaje) {
    setBorrando(foto.id)
    setError(null)
    const motivo = await borrarFoto(foto)
    setBorrando(null)
    setConfirmando(null)
    setError(motivo)
  }

  return (
    <section aria-label="Recuerdos del viaje">
      <div className="flex flex-wrap items-center gap-2">
        {dias.length > 1 && (
          <select value={dia?.id ?? ''} onChange={(e) => setDiaId(e.target.value)} aria-label="Día al que añadir las fotos" className="h-11 rounded-full border border-text/15 bg-bg-card px-3 text-[14px] text-text">
            {dias.map((d) => (
              <option key={d.id} value={d.id}>
                {rotuloDia(d.dayNumber, inicio)}
              </option>
            ))}
          </select>
        )}
        {dia && (
          <BotonFoto dayId={dia.id} dayNumber={dia.dayNumber} etiqueta="Subir mis fotos" multiple className="inline-flex h-11 items-center rounded-full bg-text px-5 text-[14.5px] font-medium text-bg disabled:opacity-60">
            Subir mis fotos
          </BotonFoto>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-text-soft">
          {error}
        </p>
      )}
      {!cargando && fotos.length === 0 && <p className="mt-4 text-[14.5px] leading-snug text-text-soft">Aquí irán tus fotos del viaje, ordenadas por días.</p>}
      {numerosConFotos.map((numero) => {
        const delDia = porDia.get(numero) ?? []
        const paradas = [...new Set(delDia.map((f) => f.stopName).filter((n): n is string => !!n))]
        const grupos: { titulo: string | null; fotos: FotoViaje[] }[] = [
          ...paradas.map((nombre) => ({ titulo: nombre as string | null, fotos: delDia.filter((f) => f.stopName === nombre) })),
          { titulo: null, fotos: delDia.filter((f) => !f.stopName) },
        ].filter((g) => g.fotos.length > 0)
        return (
          <div key={numero} className="mt-5">
            <h3 className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{rotuloDia(numero, inicio)}</h3>
            {grupos.map((grupo) => (
              <div key={grupo.titulo ?? 'dia'} className="mt-2">
                {grupo.titulo && <p className="mb-1.5 text-[13.5px] text-text-soft">{grupo.titulo}</p>}
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
        )
      })}
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </section>
  )
}
