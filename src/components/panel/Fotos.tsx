import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { hace, mandar, pedir } from './api'
import { boton, tarjeta, Vacio } from './estilo'

/**
 * (V33, Design P3) FOTOS DE VIAJEROS: las que han mandado desde «Comparte tu foto» y están por aprobar (las de hoy primero). [Usar en la app] copia la foto al almacén público con «Foto: nombre» y [Descartar] la quita.
 * Es lo de «Fotos de viajeros» de siempre (server/avisosViajeros.js), con el diseño nuevo.
 */
interface Foto {
  id: string
  creado: string
  estado: string
  destino: string | null
  datos: Record<string, unknown>
  fotos_urls?: string[]
}

function Tarjeta({ f, alCambiar }: { f: Foto; alCambiar: () => void }): ReactNode {
  const [sitio, setSitio] = useState(String(f.datos.sitio ?? ''))
  const [haciendo, setHaciendo] = useState(false)
  const url = f.fotos_urls?.[0] ?? null
  const usar = async () => {
    setHaciendo(true)
    await mandar(`/api/admin/avisos-viajeros/${f.id}/usar-foto`, { sitio, destino: f.destino ?? '' })
    setHaciendo(false)
    alCambiar()
  }
  const descartar = async () => {
    setHaciendo(true)
    await mandar(`/api/admin/avisos-viajeros/${f.id}`, { estado: 'descartado' }, 'PATCH')
    setHaciendo(false)
    alCambiar()
  }
  return (
    <div data-foto-de-viajero={f.id} style={{ ...tarjeta, padding: 0, overflow: 'hidden', gap: 0 }}>
      <div style={{ height: 130, background: url ? `center / cover no-repeat url(${url})` : 'linear-gradient(135deg,#E8B070,#8A4A1C)' }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ font: "600 13px 'Geist'" }}>{String(f.datos.nombre_en_foto ?? 'Foto')} <span style={{ fontWeight: 400, color: 'rgba(28,34,48,.55)' }}>· {f.destino ?? 'sin destino'} · {hace(f.creado)}</span></span>
        <input value={sitio} onChange={(e) => setSitio(e.target.value)} aria-label="Sitio de la foto" placeholder="Sitio" style={{ minHeight: 40, borderRadius: 10, border: '1px solid rgba(28,34,48,.2)', padding: '0 10px', font: "400 13px 'Geist'" }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" data-usar-foto disabled={haciendo || sitio.trim().length < 2} onClick={() => void usar()} style={boton(true, haciendo || sitio.trim().length < 2)}>Usar en la app</button>
          <button type="button" data-descartar-foto disabled={haciendo} onClick={() => void descartar()} style={boton(false, haciendo)}>Descartar</button>
        </div>
      </div>
    </div>
  )
}

export function Fotos({ movil }: { movil: boolean }): ReactNode {
  const [lista, setLista] = useState<Foto[] | null>(null)
  const cargar = useCallback(async () => {
    const r = await pedir<{ ok: boolean; items: Foto[] }>('/api/admin/avisos-viajeros?tipo=foto&estado=nuevo&limite=60')
    setLista(r?.items ?? [])
  }, [])
  useEffect(() => {
    void cargar()
  }, [cargar])
  return (
    <div data-seccion="fotos" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!lista && <p>Cargando…</p>}
      {lista?.length === 0 && <Vacio>No hay fotos por aprobar.</Vacio>}
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {lista?.map((f) => <Tarjeta key={f.id} f={f} alCambiar={() => void cargar()} />)}
      </div>
    </div>
  )
}
