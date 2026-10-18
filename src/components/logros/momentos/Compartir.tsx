import { useEffect, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { pedirEstado } from './api'
import { datosDelPie, imagenDeLogro, imagenDeViaje } from './imagen'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * COMPARTIR (Tanda 8B, C1 «Compartir un logro» y C2 «Compartir el viaje»). La imagen se genera aquí, en el navegador (`imagen.ts`); [Guardar imagen] la descarga y
 * [Compartir] abre el menú de compartir del móvil con la imagen (si el navegador no deja compartir archivos, la descarga).
 */
export default function Compartir(): ReactNode {
  const qué = useMomentosUI((s) => s.compartir)
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [fallo, setFallo] = useState(false)
  const cerrar = () => useMomentosUI.getState().cerrarCompartir()

  useEffect(() => {
    let vivo = true
    void (async () => {
      let b: Blob | null = null
      try {
        const pie = await datosDelPie().catch(() => null)
        if (qué?.tipo === 'logro') b = await imagenDeLogro(qué.momento, new Date(), pie)
        else if (qué?.tipo === 'viaje') {
          const e = await pedirEstado(tripId)
          b = e ? await imagenDeViaje(e, pie) : null
        }
      } catch {
        b = null
      }
      if (!vivo) return
      if (!b) return setFallo(true)
      setBlob(b)
      setUrl(URL.createObjectURL(b))
    })()
    return () => {
      vivo = false
    }
  }, [qué, tripId])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  const nombre = qué?.tipo === 'viaje' ? 'mi-viaje.png' : 'mi-logro.png'
  const guardar = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  const compartir = async () => {
    if (!blob) return
    const archivo = new File([blob], nombre, { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo] })
      else guardar()
    } catch {
      /* la persona cerró el menú de compartir */
    }
  }
  const boton = { height: 52, borderRadius: 999, font: "700 15px 'Geist'", cursor: 'pointer', flex: 1 } as const
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label={qué?.tipo === 'viaje' ? 'Compartir el viaje' : 'Compartir un logro'} style={{ position: 'fixed', inset: 0, zIndex: 9100, background: '#0E1220', color: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 8px)', width: 48, height: 48, border: 'none', background: 'transparent', color: '#FFFDF8', cursor: 'pointer', zIndex: 2 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top,0px) + 56px) 28px 16px' }}>
        {url ? <img src={url} alt="La imagen para compartir" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: 22, boxShadow: '0 20px 40px -20px rgba(0,0,0,.8)', animation: 'moUp .5s ease both' }} /> : <span style={{ font: "400 14px 'Geist'", color: 'rgba(255,253,248,.6)' }}>{fallo ? 'No hemos podido preparar la imagen.' : 'Preparando la imagen…'}</span>}
      </div>
      <div style={{ width: '100%', display: 'flex', gap: 10, padding: '0 20px calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        <button type="button" disabled={!url} onClick={guardar} style={{ ...boton, border: '1px solid rgba(255,253,248,.3)', background: 'transparent', color: '#FFFDF8', opacity: url ? 1 : 0.5 }}>Guardar imagen</button>
        <button type="button" disabled={!url} onClick={() => void compartir()} style={{ ...boton, border: 'none', background: 'linear-gradient(110deg,#D9BE85,#F3E3B8 50%,#D9BE85)', color: '#2A1D10', opacity: url ? 1 : 0.5 }}>Compartir</button>
      </div>
    </div>
  )
}
