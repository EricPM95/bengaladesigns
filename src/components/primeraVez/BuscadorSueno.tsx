import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { FlagIcon } from '../ui/FlagIcon'
import { buscarSuenos, cargarLista, lineaDelSueno, type ListaCargada, type OpcionSueno, type Sueno } from '../../lib/suenos'

/**
 * (V39, Design «Primera Vez» Q3a/Q3b/Q3c) EL BUSCADOR DE «EL VIAJE DE TUS SUEÑOS», una sola pieza para la pregunta 3 de la primera vez y la hoja de Ajustes.
 *   · Sin escribir: el cuadro de búsqueda y «ALGUNAS IDEAS» (8 chips con bandera).
 *   · Escribiendo: una tarjeta por resultado, con la bandera de su país y una etiqueta «País» o «Destino» («Japón», «Tokio · Japón»).
 *   · Con uno elegido: la tarjeta oscura con su bandera grande, su nombre, «Destino · Japón» y «Cambiar» (vuelve al buscador). Solo uno.
 * La lista es local (cero llamadas a servicios de fuera) y se carga al montarse esta pieza, no al abrir la app.
 */
const SERIE = "'Instrument Serif',serif"

function Bandera({ iso, ancho, alto, radio = 3, sombra = 'inset 0 0 0 1px rgba(28,34,48,.18)' }: { iso: string; ancho: number; alto: number; radio?: number; sombra?: string }): ReactNode {
  return (
    <span className="flex flex-none items-center justify-center overflow-hidden" style={{ width: ancho, height: alto, borderRadius: radio, boxShadow: sombra, fontSize: ancho }}>
      <FlagIcon countryCode={iso} className="!block !h-full !w-full !rounded-none" />
    </span>
  )
}

const etiqueta = (o: OpcionSueno): { fondo: string; color: string; texto: string } =>
  o.tipo === 'pais' ? { fondo: '#F3EBD8', color: '#6A5A3A', texto: 'País' } : { fondo: 'rgba(201,154,68,.2)', color: '#7A5A1E', texto: 'Destino' }
/** El nombre en el resultado: un país, solo («Japón»); un destino con su país («Tokio · Japón»). */
const nombreEnLista = (o: OpcionSueno): string => (o.tipo === 'pais' ? o.nombre : `${o.nombre} · ${o.pais}`)

export function BuscadorSueno({ valor, onElegir, estilo }: { valor: Sueno | null; onElegir: (s: Sueno | null) => void; estilo?: CSSProperties }): ReactNode {
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState<ListaCargada | null>(null)
  useEffect(() => {
    let vivo = true
    void cargarLista().then((l) => vivo && setLista(l))
    return () => {
      vivo = false
    }
  }, [])
  const resultados = useMemo(() => (lista ? buscarSuenos(lista.opciones, texto) : []), [lista, texto])
  const escribiendo = texto.trim().length > 0
  const elegir = (o: OpcionSueno) => {
    setTexto('')
    onElegir({ tipo: o.tipo, nombre: o.nombre, iso: o.iso })
  }

  if (valor) {
    return (
      <div data-sueno-elegido={valor.nombre} className="flex flex-col gap-3.5" style={estilo}>
        <div className="flex items-center gap-[18px]" style={{ padding: '22px 20px', borderRadius: 26, background: '#1C2230', boxShadow: '0 18px 30px -18px rgba(28,34,48,.8)', color: '#FFFDF8' }}>
          <Bandera iso={valor.iso} ancho={72} alto={50} radio={7} sombra="inset 0 0 0 1px rgba(255,255,255,.3),0 6px 12px -6px rgba(0,0,0,.6)" />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span style={{ font: `400 32px/1 ${SERIE}` }}>{valor.nombre}</span>
            <span style={{ font: "500 13.5px 'Geist'", color: '#F3D88F' }}>{lineaDelSueno(valor)}</span>
          </span>
        </div>
        <button type="button" data-sueno-cambiar onClick={() => onElegir(null)} className="zona-toque self-center" style={{ background: 'none', border: 'none', font: `italic 400 17px ${SERIE}`, color: '#8A6A2C', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" style={estilo}>
      <label className="flex items-center gap-3" style={{ height: 56, borderRadius: 18, background: '#FFFFFF', border: `1.5px solid ${escribiendo ? '#C99A44' : 'rgba(28,34,48,.14)'}`, boxShadow: '0 10px 20px -16px rgba(28,34,48,.4)', padding: '0 16px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.55)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          data-sueno-buscador
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Busca un país o una ciudad…"
          aria-label="Busca un país o una ciudad"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={60}
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{ border: 'none', font: `${escribiendo ? 600 : 400} 17px 'Geist'`, color: '#1C2230' }}
        />
      </label>

      {!escribiendo && (
        <div className="flex flex-col gap-2.5" data-sueno-ideas>
          <span style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(28,34,48,.5)' }}>ALGUNAS IDEAS</span>
          <div className="flex flex-wrap gap-2">
            {(lista?.sugerencias ?? []).map((o) => (
              <button key={`${o.tipo}-${o.iso}-${o.nombre}`} type="button" data-sueno-sugerencia={o.nombre} onClick={() => elegir(o)} className="flex items-center gap-[9px]" style={{ height: 42, padding: '0 14px 0 10px', borderRadius: 999, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.14)', font: "600 14px 'Geist'", color: '#1C2230' }}>
                <Bandera iso={o.iso} ancho={24} alto={17} />
                {o.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {escribiendo && (
        <div className="flex flex-col gap-2.5" data-sueno-resultados>
          {resultados.map((o) => {
            const t = etiqueta(o)
            return (
              <button key={`${o.tipo}-${o.iso}-${o.nombre}`} type="button" data-sueno-resultado={o.nombre} data-sueno-tipo={o.tipo} onClick={() => elegir(o)} className="flex items-center gap-3.5 text-left" style={{ padding: '14px 16px', borderRadius: 20, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.1)', boxShadow: '0 8px 18px -16px rgba(28,34,48,.35)' }}>
                <Bandera iso={o.iso} ancho={34} alto={24} radio={4} />
                <span className="flex-1" style={{ font: "600 16px 'Geist'", color: '#1C2230' }}>
                  {nombreEnLista(o)}
                </span>
                <span className="flex items-center" style={{ height: 24, padding: '0 10px', borderRadius: 999, background: t.fondo, color: t.color, font: "600 11.5px 'Geist'" }}>
                  {t.texto}
                </span>
              </button>
            )
          })}
          {lista && resultados.length === 0 && (
            <span data-sueno-sin-resultados style={{ font: "400 14px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>
              No encontramos ese sitio. Prueba con otro nombre o con el país.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
