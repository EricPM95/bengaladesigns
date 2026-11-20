import { useEffect, useState, type ReactNode } from 'react'
import { Insignia, Sello } from '../logros/dibujos'
import { pedirDestino, type PaginaDeDestinoDatos } from '../logros/pantallas/destino/api'

/**
 * (V31, Design «Primera Vez» P2 y D1/D2) «LO QUE TE PUEDES LLEVAR» de un destino, SIEMPRE con los datos de ESE destino (los de la app, de `GET /api/logros/destino`): sus sellos de ciudad (la medalla: Roma, con el
 * Coliseo, y el Vaticano; Lanzarote, la suya), sus colecciones con su insignia de verdad y su número de sitios, y cuántos emblemas secretos tiene de verdad. Nada del prototipo de Design (sus datos eran de ejemplo).
 * `resumen`: los tres números de la tarjeta del mapa. `pagina`: la sección completa de [Ver destino], como un adelanto: cada colección con algunos pedazos en color y el resto sin rellenar (ni completas ni todas en gris).
 */
export function useLoQueTePuedesLlevar(clave: string): PaginaDeDestinoDatos | null | undefined {
  const [datos, setDatos] = useState<PaginaDeDestinoDatos | null | undefined>(undefined)
  useEffect(() => {
    let vivo = true
    setDatos(undefined)
    void pedirDestino(clave, null).then((d) => vivo && setDatos(d && d.ok ? d : null))
    return () => {
      vivo = false
    }
  }, [clave])
  return datos
}

/** Cuántos pedazos «de adelanto» lleva en color la colección número `i` (como Design: 5, 3, 2, 3, 1, 0…), sin pasarse de su total ni completarla. */
export const PEDAZOS_DE_ADELANTO = [5, 3, 2, 3, 1, 0]
export const pedazosDeAdelanto = (i: number, total: number): number => Math.max(0, Math.min(PEDAZOS_DE_ADELANTO[i % PEDAZOS_DE_ADELANTO.length] ?? 0, total - 1))

export function NumerosDelDestino({ datos }: { datos: PaginaDeDestinoDatos | null | undefined }): ReactNode {
  const numeros = datos ? [{ n: datos.sellos.length, l: datos.sellos.length === 1 ? 'medalla' : 'medallas' }, { n: datos.colecciones.length, l: datos.colecciones.length === 1 ? 'colección' : 'colecciones' }, { n: datos.emblemas.total, l: datos.emblemas.total === 1 ? 'emblema secreto' : 'emblemas secretos' }] : [{ n: '·', l: 'medallas' }, { n: '·', l: 'colecciones' }, { n: '·', l: 'emblemas secretos' }]
  return (
    <div data-llevar-numeros style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {numeros.map((k) => (
        <div key={k.l} style={{ borderRadius: 18, background: '#F7F1E4', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
          <span style={{ font: "400 28px/1 'Instrument Serif',serif", color: '#8A6A2C' }}>{k.n}</span>
          <span style={{ font: "500 12px/1.25 'Geist'", color: 'rgba(28,34,48,.7)' }}>{k.l}</span>
        </div>
      ))}
    </div>
  )
}

export function LoQueTePuedesLlevar({ datos }: { datos: PaginaDeDestinoDatos | null | undefined }): ReactNode {
  if (!datos) return null
  const colecciones = datos.colecciones.slice(0, 6)
  return (
    <section data-lo-que-te-puedes-llevar className="flex flex-col gap-4 px-6">
      <div className="flex flex-col gap-[3px]">
        <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#8E6820]">CONSÍGUELO VIAJANDO</span>
        <span className="text-[28px] leading-[1.05]" style={{ fontFamily: "'Instrument Serif',serif" }}>
          Lo que te puedes <em className="text-[#8E6820]">llevar</em>
        </span>
      </div>
      <div data-llevar-medallas style={{ borderRadius: 24, background: 'radial-gradient(120% 140% at 0% 0%,#3A3F5C 0%,#232840 45%,#1C2230 100%)', border: '1px solid rgba(243,213,154,.35)', padding: '14px 10px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
        {datos.sellos.map((s, i) => (
          <div key={s.id} data-medalla={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Sello id={s.id} grado={i === 0 ? 'diamante' : 'oro'} tam={92} animado={false} etiqueta={false} />
            <span style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.1em', color: '#F3D59A', textTransform: 'uppercase' }}>{s.nombre}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <span data-llevar-colecciones-titulo className="font-mono text-[10px] font-semibold tracking-[.14em] text-text/50">
          {datos.colecciones.length > colecciones.length ? `${datos.colecciones.length} COLECCIONES · ESTAS SON ALGUNAS` : `${datos.colecciones.length} ${datos.colecciones.length === 1 ? 'COLECCIÓN' : 'COLECCIONES'}`}
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {colecciones.map((c, i) => (
            <div key={c.id} data-coleccion-adelanto={c.id} className="flex flex-col items-center gap-1.5 rounded-[20px] border border-text/[.08] bg-white px-1.5 py-2.5 text-center">
              <Insignia coleccion={c.id} ganados={c.sitios.slice(0, pedazosDeAdelanto(i, c.total)).map((x) => x.sitio)} tam={84} />
              <span className="min-h-[30px] text-[13.5px] leading-[1.1]" style={{ fontFamily: "'Instrument Serif',serif" }}>{c.nombre}</span>
              <span data-sitios className="font-mono text-[10px] text-text/50">{c.total} {c.total === 1 ? 'sitio' : 'sitios'}</span>
            </div>
          ))}
        </div>
      </div>
      <div data-llevar-emblemas style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0 14px 14px', borderRadius: 20, background: 'radial-gradient(120% 100% at 50% 0%,#2A3050 0%,#1C2230 70%)' }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#F3D59A' }}>{datos.emblemas.total} {datos.emblemas.total === 1 ? 'EMBLEMA SECRETO TE ESPERA' : 'EMBLEMAS SECRETOS TE ESPERAN'}</span>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 14px 4px 0', scrollbarWidth: 'none' }}>
          {Array.from({ length: datos.emblemas.total }, (_, i) => (
            <span key={i} data-emblema-silueta style={{ flex: 'none', width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'linear-gradient(145deg,#394168,#12172A)' }}>
              <span style={{ font: "400 26px/1 'Instrument Serif',serif", color: 'rgba(243,213,154,.75)' }}>?</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
