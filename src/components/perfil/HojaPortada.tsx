import { useEffect, useRef, useState, type ReactNode } from 'react'
import { urlParaMostrar, type FotoViaje } from '../../lib/fotosViaje'
import { fotosParaPortada, subirPortadaDeGaleria } from '../../lib/portadaViaje'
import { usePortadas } from '../../store/usePortadas'
import { Hoja } from '../ui/Hoja'
import { Icono } from '../ui/Icono'

const FILA = 'flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border border-text/12 bg-white px-4 text-left text-[15px] font-semibold text-text disabled:opacity-45'

/**
 * CAMBIAR LA PORTADA DE UN VIAJE (Tanda 10N3, §3b.6): una hoja baja con tres cosas: una foto de SUS FOTOS DEL VIAJE (las de sus paradas), una de su GALERÍA, o volver a la foto del destino.
 * Lo elegido se guarda en `usePortadas` (la cuenta y este móvil) y la tarjeta lo muestra al momento.
 */
export function HojaPortada({ tripId, destino, onCerrar }: { tripId: string; destino: string; onCerrar: () => void }): ReactNode {
  const elegir = usePortadas((s) => s.elegir)
  const actual = usePortadas((s) => s.porViaje[tripId])
  const [fotos, setFotos] = useState<FotoViaje[] | null>(null)
  const [viendoFotos, setViendoFotos] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const galeria = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivo = true
    void fotosParaPortada(tripId).then((l) => vivo && setFotos(l))
    return () => {
      vivo = false
    }
  }, [tripId])

  const poner = async (portada: Parameters<typeof elegir>[1]) => {
    await elegir(tripId, portada)
    onCerrar()
  }
  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return
    setOcupado(true)
    setError(null)
    const r = await subirPortadaDeGaleria(tripId, archivo)
    setOcupado(false)
    if (r.portada) await poner(r.portada)
    else setError(r.error)
  }

  return (
    <Hoja onCerrar={onCerrar} titulo="Cambiar portada" etiqueta={destino.toUpperCase()} datos="cambiar-portada" z={94}>
      <button type="button" data-portada-viaje-fotos disabled={ocupado} onClick={() => setViendoFotos((v) => !v)} className={FILA}>
        <Icono nombre="camara" size={20} />
        <span className="flex-1">Una foto de tu viaje</span>
        <Icono nombre={viendoFotos ? 'arriba' : 'abajo'} size={14} className="text-text/55" />
      </button>
      {viendoFotos &&
        (fotos === null ? (
          <p className="m-0 px-1 text-[13px] text-text/60">Buscando tus fotos…</p>
        ) : fotos.length === 0 ? (
          <p className="m-0 px-1 text-[13px] text-text/60" data-portada-sin-fotos>
            Aún no tienes fotos de este viaje. Las que añadas a tus paradas saldrán aquí.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-3 gap-1.5 p-0" data-portada-cuadricula>
            {fotos.map((f) => (
              <li key={f.id}>
                <button type="button" data-portada-foto={f.id} aria-label={f.stopName ? `Usar la foto de ${f.stopName}` : 'Usar esta foto'} onClick={() => void poner({ f: 'viaje', id: f.id, ruta: f.storagePath })} className="block aspect-square w-full overflow-hidden rounded-xl bg-bg-hover">
                  {urlParaMostrar(f) && <img src={urlParaMostrar(f)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </button>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" data-portada-galeria disabled={ocupado} onClick={() => galeria.current?.click()} className={FILA}>
        <Icono nombre="anadir" size={20} />
        <span className="flex-1">{ocupado ? 'Subiendo la foto…' : 'Una foto de mi galería'}</span>
      </button>
      <input ref={galeria} type="file" accept="image/*" hidden onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
      <button type="button" data-portada-destino disabled={ocupado || actual?.f === 'destino'} onClick={() => void poner({ f: 'destino' })} className={FILA}>
        <Icono nombre="atras" size={20} />
        <span className="flex-1">Volver a la del destino</span>
      </button>
      {error && (
        <p role="alert" className="m-0 text-[13px]" style={{ color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
    </Hoja>
  )
}
