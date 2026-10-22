import { useState } from 'react'
import { logrosActivos, datosDeFotoDeLaGaleria } from '../../lib/logros'
import type { DatosDeFoto } from '../../lib/exifFoto'

/**
 * LA PRUEBA DE LAS FOTOS (Tanda 8A, apartado 11). Eliges una foto de la galería y dice qué datos llegan: la fecha, si trae ubicación y si es de una cámara.
 * NO SUBE NADA: la foto se lee en el propio móvil. Así Eric la prueba con su iPhone y con un Android. Se abre con «?pruebaFotos=1» (con los logros encendidos).
 */
export function PruebaFotos() {
  const [datos, setDatos] = useState<DatosDeFoto | null>(null)
  const [nombre, setNombre] = useState<string | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  if (!logrosActivos()) return <p className="p-6 text-[14px] text-text/70">La prueba de las fotos está apagada.</p>

  const elegir = async (archivo: File | undefined) => {
    if (!archivo) return
    setLeyendo(true)
    setNombre(`${archivo.name} · ${Math.round(archivo.size / 1024)} KB`)
    setDatos(await datosDeFotoDeLaGaleria(archivo))
    setLeyendo(false)
  }
  const fila = (etiqueta: string, valor: string, bien: boolean) => (
    <div className="flex items-center justify-between gap-3 border-b border-text/10 py-2.5 text-[15px]">
      <span className="text-text/70">{etiqueta}</span>
      <span className={bien ? 'font-semibold text-accent-green' : 'font-semibold text-accent-red'}>{valor}</span>
    </div>
  )
  return (
    <main className="mx-auto max-w-md p-6 text-text" data-prueba-fotos>
      <h1 className="font-display text-[26px] leading-tight">Prueba de las fotos</h1>
      <p className="mt-2 text-[14px] leading-snug text-text/70">Elige una foto de tu galería y mira qué datos llegan. No se sube nada: se lee aquí, en tu móvil.</p>
      <label className="mt-4 flex h-12 cursor-pointer items-center justify-center rounded-full btn-champan text-[15px] font-semibold ">
        Elegir una foto
        <input type="file" accept="image/*" className="hidden" onChange={(e) => void elegir(e.target.files?.[0])} />
      </label>
      {leyendo && <p className="mt-4 text-[14px] text-text/60">Leyendo…</p>}
      {datos && nombre && (
        <section className="mt-5" data-resultado>
          <p className="text-[13px] text-text/60">{nombre}</p>
          {fila('Fecha de la cámara', datos.tomadaEn ? datos.tomadaEn.replace('T', ' ') : 'No llega', datos.tomadaEn != null)}
          {fila('Ubicación', datos.lat != null && datos.lng != null ? 'Llega' : 'No llega', datos.lat != null)}
          {fila('Hecha con una cámara', datos.conCamara ? 'Sí' : 'No', datos.conCamara)}
          <p className="mt-4 text-[13px] leading-snug text-text/65">
            {datos.tomadaEn && datos.conCamara ? 'Esta foto serviría para los logros: tiene fecha y es de una cámara.' : 'Esta foto no serviría para los logros: le falta la fecha o no es de una cámara (por ejemplo, una captura de pantalla).'}
          </p>
        </section>
      )}
      <details className="mt-6 text-[13px] leading-snug text-text/65">
        <summary className="cursor-pointer font-semibold">Si no llega la ubicación o la fecha</summary>
        <p className="mt-2">En iPhone, al elegir la foto toca «Opciones» (abajo a la izquierda) y activa «Ubicación» / «Todos los datos de la foto»; si no, Safari los quita. En Android, algunos móviles quitan la ubicación al elegir desde la web: prueba con la galería y con el selector de archivos.</p>
      </details>
    </main>
  )
}
