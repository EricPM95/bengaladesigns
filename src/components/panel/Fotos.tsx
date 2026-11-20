import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { mandar, pedir } from './api'
import { SERIE } from './estilo'

/**
 * (V35A, Design P3/M6) FOTOS DE VIAJEROS: las que han mandado desde «Comparte tu foto» y están por aprobar. Cada una: la foto, «Foto: nombre» encima, el sitio en serif y [Usar en la app] / [Descartar]. [Usar en la app] copia la
 * foto al almacén público con su crédito. Si el viajero no puso el sitio, se escribe ahí mismo (hace falta para usarla). Es lo de «Fotos de viajeros» de siempre (server/avisosViajeros.js), con el diseño nuevo.
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
  const sitioDelViajero = String(f.datos.sitio ?? '').trim()
  const [sitio, setSitio] = useState(sitioDelViajero)
  const [haciendo, setHaciendo] = useState(false)
  const url = f.fotos_urls?.[0] ?? null
  const nombre = String(f.datos.nombre_en_foto ?? '').trim()
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
  const sinSitio = sitio.trim().length < 2
  return (
    <div data-foto-de-viajero={f.id} style={{ borderRadius: 22, background: '#FFFFFF', overflow: 'hidden', boxShadow: '0 18px 30px -22px rgba(28,34,48,.5)' }}>
      <div style={{ position: 'relative', height: 176, background: url ? `center / cover no-repeat url(${url})` : 'linear-gradient(135deg,#E8B070,#8A4A1C)' }}>
        {nombre && <span style={{ position: 'absolute', left: 10, bottom: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(20,24,40,.72)', color: '#fff', font: "600 12px 'Geist'" }}>Foto: {nombre}</span>}
      </div>
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sitioDelViajero ? (
          <span style={{ font: `400 20px/1.1 ${SERIE}` }}>{sitioDelViajero}</span>
        ) : (
          <input value={sitio} onChange={(e) => setSitio(e.target.value)} aria-label="Sitio de la foto" placeholder="¿De qué sitio es?" style={{ minHeight: 40, borderRadius: 10, border: '1px solid rgba(28,34,48,.2)', padding: '0 10px', font: "400 14px 'Geist'" }} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" data-usar-foto disabled={haciendo || sinSitio} onClick={() => void usar()} style={{ flex: 1, minHeight: 40, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 13.5px 'Geist'", opacity: haciendo || sinSitio ? 0.5 : 1, cursor: 'pointer' }}>Usar en la app</button>
          <button type="button" data-descartar-foto disabled={haciendo} onClick={() => void descartar()} style={{ minHeight: 40, padding: '0 16px', borderRadius: 12, border: 'none', background: '#F1E8DB', color: '#1C2230', font: "700 13.5px 'Geist'", cursor: 'pointer' }}>Descartar</button>
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
      {lista?.length === 0 && <p style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.55)' }}>No hay fotos por aprobar.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(3,minmax(0,1fr))', gap: movil ? 10 : 14 }}>
        {lista?.map((f) => <Tarjeta key={f.id} f={f} alCambiar={() => void cargar()} />)}
      </div>
    </div>
  )
}
