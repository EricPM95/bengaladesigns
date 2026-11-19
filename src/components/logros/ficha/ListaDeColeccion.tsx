import { useEffect, useState, type ReactNode } from 'react'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { useSyncStore } from '../../../store/useSyncStore'
import { pedirColeccion, type ColeccionDentroDatos } from '../pantallas/destino/api'
import { useLogrosPantallas } from '../pantallas/useLogrosPantallas'
import { guardarEnCache, leerEnCache, mismaRespuesta } from '../../../lib/logrosEnCache'

/**
 * (V14) LA LISTA DE UNA COLECCIÓN, la misma en la hoja de logros, el resumen del viaje, «Todos mis logros» y la pestaña «Logros» de la ficha: cada sitio con su FOTO (la tuya si lo ganaste con una foto;
 * si no, la de nuestros datos, en gris suave si está por ver), su nombre, «Visto» o «Por ver» y la marca (✓ o ○). Al final, [Ver la colección ›], que abre la pantalla de la colección (V9).
 * Los nombres y lo visto vienen de quien la pinta (ya los tiene); las fotos se piden a `/api/logros/coleccion` (una vez por colección y viaje) y, mientras llegan, la foto de los datos.
 */
export interface SitioDeLista {
  sitio: string
  nombre: string
  visto: boolean
  /** «Estás aquí · te falta este» (la ficha del propio sitio). */
  este?: boolean
}

const VERDE = 'oklch(0.55 0.11 150)'
const NARANJA = 'oklch(0.8 0.14 70)'

/** Las fotos de los sitios de una colección, con la que se ganó cada uno (si la hay). Se guardan en memoria: abrir otra vez no vuelve a pedirlas. */
const fotosEnMemoria = new Map<string, Record<string, string | null>>()
export function useFotosDeColeccion(destino: string, coleccion: string, tripId: string | null): Record<string, string | null> {
  const clave = `${destino}|${coleccion}|${tripId ?? ''}`
  const [fotos, setFotos] = useState<Record<string, string | null>>(() => fotosEnMemoria.get(clave) ?? {})
  useEffect(() => {
    setFotos(fotosEnMemoria.get(clave) ?? {})
    if (!destino || !coleccion) return undefined
    let vivo = true
    void pedirColeccion(destino, coleccion, tripId).then((d: ColeccionDentroDatos | null) => {
      if (!vivo || !d) return
      const m: Record<string, string | null> = {}
      for (const s of d.sitios) m[s.sitio] = s.foto_url ?? null
      fotosEnMemoria.set(clave, m)
      setFotos(m)
    })
    return () => {
      vivo = false
    }
  }, [clave, destino, coleccion, tripId])
  return fotos
}

/** El cuadrado de la foto: la tuya, o la de los datos (misma regla que la pantalla de la colección de la V9); gris suave si está por ver; un degradado cálido mientras llega. */
export function FotoDeSitioDeLista({ url, nombre, ciudad, visto, tam = 52 }: { url?: string | null; nombre: string; ciudad: string; visto: boolean; tam?: number }): ReactNode {
  const [foto, setFoto] = useState<string | null>(url ?? null)
  useEffect(() => {
    if (url) {
      setFoto(url)
      return undefined
    }
    let vivo = true
    void fetchPlacePhoto(nombre, ciudad, null, 'small').then((u) => vivo && setFoto(u))
    return () => {
      vivo = false
    }
  }, [url, nombre, ciudad])
  return (
    <span data-foto-de-sitio-lista={foto ? '1' : '0'} aria-hidden="true" style={{ position: 'relative', flex: 'none', width: tam, height: tam, borderRadius: Math.round(tam * 0.28), background: foto ? `center/cover url(${foto})` : 'linear-gradient(160deg,#E7B98A,#9A6A48)', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.08)', ...(visto ? {} : { filter: 'grayscale(1)', opacity: 0.55 }) }} />
  )
}

export function FilaDeSitioDeLista({ s, ciudad, url, accion, alTocar }: { s: SitioDeLista; ciudad: string; url?: string | null; accion?: ReactNode; alTocar?: () => void }): ReactNode {
  const estado = s.visto ? 'visto' : s.este ? 'este' : 'pendiente'
  const color = estado === 'visto' ? 'oklch(0.36 0.09 150)' : '#1C2230'
  const texto = estado === 'visto' ? 'Visto' : estado === 'este' ? 'Estás aquí · te falta este' : 'Por ver'
  const colorTexto = estado === 'visto' ? 'oklch(0.45 0.11 150)' : estado === 'este' ? '#8E6820' : 'rgba(28,34,48,.5)'
  const cuerpo = (
    <>
      <FotoDeSitioDeLista url={url} nombre={s.nombre} ciudad={ciudad} visto={s.visto} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
        <span style={{ font: "400 18px/1.1 'Instrument Serif',serif", color }}>{s.nombre}</span>
        <span style={{ font: "600 12px 'Geist'", color: colorTexto }}>{texto}</span>
      </span>
    </>
  )
  const marca = (
    <span data-marca-de-sitio={estado} style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', background: s.visto ? VERDE : 'transparent', border: s.visto ? 'none' : `1.5px dashed ${s.este ? NARANJA : 'rgba(28,34,48,.3)'}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 13px 'Geist'" }}>
      {s.visto ? '✓' : ''}
    </span>
  )
  return (
    <div data-sitio-de-lista={s.sitio} data-estado={estado} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px 8px 8px', borderRadius: 16, background: estado === 'visto' ? 'oklch(0.96 0.035 150)' : estado === 'este' ? 'oklch(0.8 0.14 70 / .16)' : '#FFFFFF', border: estado === 'este' ? `1.5px solid ${NARANJA}` : '1px solid rgba(28,34,48,.08)', minHeight: 60 }}>
      {alTocar ? (
        <button type="button" onClick={alTocar} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
          {cuerpo}
        </button>
      ) : (
        <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>{cuerpo}</span>
      )}
      {accion}
      {marca}
    </div>
  )
}

/** [Ver la colección ›]: abre la pantalla de la colección (cada sitio con su foto y su trozo de la insignia). */
export function EnlaceVerColeccion({ destino, coleccion, antes }: { destino: string; coleccion: string; antes?: () => void }): ReactNode {
  return (
    <button
      type="button"
      data-ver-la-coleccion={coleccion}
      onClick={() => {
        antes?.()
        useLogrosPantallas.getState().abrir({ t: 'coleccion', destino, coleccion })
      }}
      style={{ alignSelf: 'flex-end', minHeight: 44, padding: '0 4px 0 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, font: "600 13.5px 'Geist'", color: '#1C2230' }}
    >
      Ver la colección
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}

/**
 * La lista entera de una colección: las filas con foto y el enlace del final. `accion(s)`: lo que lleva cada fila a la derecha (en la hoja de logros, [Cómo llegar] o [Añadir a mi ruta]);
 * `alTocar(s)`: abrir la ficha del sitio (o nada).
 */
export function ListaDeColeccion({
  destino,
  coleccion,
  ciudad,
  sitios,
  tripId,
  accion,
  alTocar,
  antesDeVer,
}: {
  destino: string
  coleccion: string
  ciudad: string
  sitios: SitioDeLista[]
  tripId?: string | null
  accion?: (s: SitioDeLista) => ReactNode
  alTocar?: (s: SitioDeLista) => (() => void) | undefined
  antesDeVer?: () => void
}): ReactNode {
  const activo = useSyncStore((x) => x.activeTripId) ?? null
  const fotos = useFotosDeColeccion(destino, coleccion, tripId === undefined ? activo : tripId)
  return (
    <div data-lista-de-coleccion={coleccion} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sitios.map((s) => (
        <FilaDeSitioDeLista key={s.sitio} s={s} ciudad={ciudad} url={fotos[s.sitio]} accion={accion?.(s)} alTocar={alTocar?.(s)} />
      ))}
      <EnlaceVerColeccion destino={destino} coleccion={coleccion} antes={antesDeVer} />
    </div>
  )
}

/** La misma lista cuando quien la pinta aún no tiene los sitios (la página de un destino): los pide a `/api/logros/coleccion`. */
export function ListaDeColeccionPedida({ destino, coleccion, ciudad, tripId }: { destino: string; coleccion: string; ciudad: string; tripId?: string | null }): ReactNode {
  const activo = useSyncStore((x) => x.activeTripId) ?? null
  const id = tripId === undefined ? activo : tripId
  // (V18) Lo último que se vio sale al instante (la misma clave que «la colección por dentro»); lo nuevo llega por detrás y solo cambia si cambia.
  const clave = `pantalla:coleccion:${destino}:${coleccion}:${id ?? ''}`
  const [datos, setDatos] = useState<ColeccionDentroDatos | null>(() => leerEnCache<ColeccionDentroDatos>(clave))
  useEffect(() => {
    setDatos(leerEnCache<ColeccionDentroDatos>(clave))
    let vivo = true
    void pedirColeccion(destino, coleccion, id).then((d) => {
      if (!vivo || !d) return
      guardarEnCache(clave, d)
      setDatos((antes) => (antes && mismaRespuesta(antes, d) ? antes : d))
    })
    return () => {
      vivo = false
    }
  }, [destino, coleccion, id])
  if (!datos) return <span style={{ display: 'block', padding: '14px 4px', font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Un momento…</span>
  return <ListaDeColeccion destino={destino} coleccion={coleccion} ciudad={ciudad || datos.ciudad} tripId={id} sitios={datos.sitios.map((x) => ({ sitio: x.sitio, nombre: x.nombre, visto: x.visto }))} />
}
