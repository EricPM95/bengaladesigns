import { useEffect, useRef, useState, type ReactNode } from 'react'
import { urlParaMostrar, type FotoViaje } from '../../lib/fotosViaje'
import { fotosParaPortada, subirPortadaDeGaleria } from '../../lib/portadaViaje'
import { usePortadas } from '../../store/usePortadas'
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../ui/HojaOpciones'

/**
 * CAMBIAR LA PORTADA DE UN VIAJE (Tanda 10N3, §3b.6; con el formato de tarjetas de las opciones desde la 10N4 §3): una hoja con tres cosas: una foto de SUS FOTOS DEL VIAJE (las de sus paradas), una de su GALERÍA, o volver a la foto del destino.
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
    <HojaOpciones onCerrar={onCerrar} titulo="Cambiar portada" etiqueta={destino} datos="cambiar-portada" z={94}>
      <OpcionTarjeta tono="azul" icono={ICONOS_OPCION.camara} titulo="Una foto de tu viaje" linea="De las fotos de tus paradas" flecha={!viendoFotos} deshabilitada={ocupado} onClick={() => setViendoFotos((v) => !v)} atributos={{ 'data-portada-viaje-fotos': '' }} />
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
      <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.galeria} titulo={ocupado ? 'Subiendo la foto…' : 'Una foto de mi galería'} linea="Elige una del móvil" deshabilitada={ocupado} onClick={() => galeria.current?.click()} atributos={{ 'data-portada-galeria': '' }} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={(e) => void alElegirArchivo(e.target.files?.[0])} />
      <OpcionTarjeta tono="gris" icono={ICONOS_OPCION.volver} titulo="Volver a la del destino" linea={actual?.f === 'destino' ? 'Ya tienes la del destino' : 'La foto de siempre del sitio'} deshabilitada={ocupado || actual?.f === 'destino'} onClick={() => void poner({ f: 'destino' })} atributos={{ 'data-portada-destino': '' }} />
      {error && (
        <p role="alert" className="m-0 text-[13px]" style={{ color: 'rgb(var(--accent-red))' }}>
          {error}
        </p>
      )}
    </HojaOpciones>
  )
}
