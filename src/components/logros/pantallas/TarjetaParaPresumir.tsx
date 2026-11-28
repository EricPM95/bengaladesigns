import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MedallaDeSiete } from '../dibujos'
import { useMiNombreYFoto } from '../../../store/useMiPerfil'
import { BOTON_ORO } from '../../ui/botonesOro'
import { Capa } from './Capa'
import { BotonVolver } from './destino/piezas'
import { Cifras } from './todos/Escaparates'
import { useGanados } from './todos/api'
import { DibujoDeItem } from './todos/dibujo'
import { elementoAImagen } from './todos/imagenDeColeccion'
import './todos/todos.css'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * (V82 §5, P3 y P3b) LA TARJETA PARA PRESUMIR: una imagen vertical para redes con el nombre y el título, el número de logros, la medalla de las maravillas (la primera, solo si tienes al menos una), TODOS tus
 * exclusivos en filas de 3 o 4 (la tarjeta crece hacia abajo) y las cuatro cifras, que son LAS MISMAS de «Todos mis logros» (`todos/numeros.ts`, una sola cuenta). Solo lo conseguido: nada en silueta.
 * [Compartir mi colección] abre el menú de compartir del móvil con la imagen (si no se puede, la descarga). Todo sale de lo ya ganado; no pide nada nuevo.
 */
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"

/** Filas de 3 o 4: hasta 4, todos en una fila; 5 o 6, de 3; 7 o más, de 4. */
export const columnasDeExclusivos = (n: number): number => (n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4)

export default function TarjetaParaPresumir(_: { pantalla: PantallaDe<'presumir'> }): ReactNode {
  const g = useGanados((s) => s.datos)
  const cargar = useGanados((s) => s.cargar)
  const { nombre, tieneNombre } = useMiNombreYFoto()
  const tarjeta = useRef<HTMLDivElement>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => void cargar(true), [cargar])
  const compartir = async () => {
    if (!tarjeta.current || ocupado) return
    setOcupado(true)
    const blob = await elementoAImagen(tarjeta.current)
    setOcupado(false)
    if (!blob) return setAviso('No hemos podido preparar la imagen. Vuelve a probar.')
    const archivo = new File([blob], 'mi-coleccion.png', { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo] })
      else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'mi-coleccion.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch {
      /* la persona cerró el menú de compartir */
    }
  }
  const ganadas = g ? g.maravillas.filter((m) => m.ganada) : []
  const cols = g ? columnasDeExclusivos(g.exclusivos.length) : 4
  const quien = [tieneNombre ? nombre.toUpperCase() : '', g?.titulo?.nombre.toUpperCase() ?? ''].filter(Boolean).join(' · ')
  return (
    <Capa etiqueta="Tarjeta para presumir" fondo="#F5EFE4">
      <div className="vt" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', padding: '4px 16px 8px' }}>
          <BotonVolver onClick={() => useLogrosPantallas.getState().volver()} />
        </div>
        {!g ? (
          <p style={{ textAlign: 'center', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)', margin: '40px 24px' }}>Un momento…</p>
        ) : (
          <main className="vt-oculto" style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 20px calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div ref={tarjeta} data-tarjeta-para-presumir style={{ flex: 'none', borderRadius: 32, background: 'radial-gradient(circle at 80% 8%,#2E3668 0%,#171C3D 42%,#0F1329 100%)', border: '1px solid rgba(243,213,154,.2)', color: '#FFFDF8', padding: '26px 18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: '0 26px 44px -26px rgba(10,13,28,.85)' }}>
              {quien && <span data-quien style={{ font: `600 11px ${MONO}`, letterSpacing: '.18em', color: '#F3D59A', textAlign: 'center' }}>{quien}</span>}
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span data-total-de-coleccion style={{ font: `400 84px/0.9 ${SERIF}`, color: '#F3D59A' }}>{g.total}</span>
                <span style={{ font: `italic 400 28px/1 ${SERIF}` }}>{g.total === 1 ? 'logro' : 'logros'}</span>
              </span>
              {ganadas.length > 0 && (
                <span data-medalla-maravillas-de-tarjeta style={{ display: 'flex', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.45))' }}>
                  <MedallaDeSiete encendidas={ganadas.map((m) => m.id)} tam={170} />
                </span>
              )}
              {g.exclusivos.length > 0 && (
                <div data-exclusivos-de-tarjeta={g.exclusivos.length} style={{ alignSelf: 'stretch', display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8, justifyItems: 'center' }}>
                  {g.exclusivos.map((x) => (
                    <span key={x.clave} data-exclusivo-de-tarjeta={x.clave} style={{ display: 'flex' }}>
                      <DibujoDeItem item={x} tam={cols === 4 ? 78 : cols === 3 ? 100 : 120} />
                    </span>
                  ))}
                </div>
              )}
              <div style={{ alignSelf: 'stretch' }}>
                <Cifras g={g} grande />
              </div>
              <span style={{ marginTop: 6, font: `600 12px ${MONO}`, letterSpacing: '.3em', color: '#F3D59A' }}>JUTRIP</span>
            </div>
            {aviso && <span role="status" style={{ font: "500 13px 'Geist'", color: '#8A2D2D', textAlign: 'center' }}>{aviso}</span>}
            <button type="button" data-compartir-coleccion disabled={ocupado} onClick={() => void compartir()} style={{ ...BOTON_ORO, flex: 'none', height: 56, border: 'none', borderRadius: 20, font: "700 16px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
              Compartir mi colección
            </button>
          </main>
        )}
      </div>
    </Capa>
  )
}
