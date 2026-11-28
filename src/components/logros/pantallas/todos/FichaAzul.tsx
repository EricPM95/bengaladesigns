import { useState, type ReactNode } from 'react'
import { Chapa } from '../../dibujos'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { CruzDeHoja } from '../../../ui/CruzDeHoja'
import { TiradorDeHoja } from '../../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../../ui/fondoDeHoja'
import { guardarTitulo, useGanados, type Ganados, type ItemGanado } from './api'
import { DibujoDeItem } from './dibujo'
import { cuandoDe, etiquetaDe, hastaDe } from './formato'
import { PastillaDeVitrina, PieDeFicha, useVitrinaDe } from './FichaGrande'
import './todos.css'

/**
 * (V82 §2, N2) LA FICHA AZUL: la ficha de los EXCLUSIVOS, las MARAVILLAS y los EMBLEMAS OCULTOS (la sala azul de noche, con un foco de luz sobre la pieza). Las de colección y medalla de destino son `FichaGrande`
 * (F1-F4) y las de los logros de viajero, `FichaHoja` (N2b/N2c, la hoja clara): una sola pieza por tipo. Los mismos botones con los mismos nombres: [Compartir] y [Volver a ver] abajo, «Usar como mi título» /
 * «Es tu título ✓» (solo donde se puede) y la vitrina SIEMPRE arriba a la derecha, como pastilla, y solo en lo CONSEGUIDO. Las maravillas y los exclusivos viven siempre en el pedestal y la balda de exclusivos de la
 * vitrina: la pastilla sale ya en «✓ En tu vitrina» (sin botón, no hay nada que elegir). Con `abierto:…` (un exclusivo que aún se puede ganar) sale en silueta, con cómo y hasta cuándo, y [Entendido].
 */
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"
const VERDE_CLARO = '#8FD7A8'

export const esFichaAzul = (g: Ganados, clave: string): boolean => {
  if (clave.startsWith('abierto:')) return true
  const it = g.items.find((i) => i.clave === clave)
  return Boolean(it && (it.tipo === 'exclusivo' || it.tipo === 'maravilla' || it.tipo === 'emblema'))
}

export function FichaAzul({ g, clave, cerrar }: { g: Ganados; clave: string; cerrar: () => void }): ReactNode {
  const cargar = useGanados((s) => s.cargar)
  const [ocupado, setOcupado] = useState(false)
  const abierto = clave.startsWith('abierto:') ? ((g.exclusivos_abiertos ?? []).find((x) => x.clave === clave) ?? null) : null
  const item: ItemGanado | null = abierto ? null : (g.items.find((i) => i.clave === clave) ?? null)
  const vitrina = useVitrinaDe(g, item)
  if (!item && !abierto) return null
  const esTitulo = Boolean(item && g.titulo?.clave === item.clave)
  const ponerTitulo = async () => {
    if (!item || ocupado) return
    setOcupado(true)
    const ok = await guardarTitulo(esTitulo ? null : item.clave)
    if (ok) await cargar(true)
    setOcupado(false)
  }
  const nombre = item?.nombre ?? abierto?.nombre ?? ''
  const ojo = item ? etiquetaDe(item) : 'Exclusivo'
  // La pastilla de la vitrina: solo en lo conseguido. Maravillas y exclusivos: fija en «En tu vitrina»; emblemas: la de elegir hueco.
  const pastilla = !item ? null : item.balda ? <PastillaDeVitrina vitrina={vitrina} /> : <PastillaDeVitrina fija />
  return (
    <>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 40, border: 'none', padding: 0, background: FONDO_DE_HOJA, animation: 'vtFade .3s ease both', cursor: 'default' }} />
      <div role="dialog" aria-modal="true" aria-label={nombre} data-ficha={clave} data-ficha-azul style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, height: 'calc(100% - 44px)', borderRadius: '32px 32px 0 0', background: 'radial-gradient(ellipse 120% 70% at 50% 0%,#232B52 0%,#10142A 55%,#0A0D1C 100%)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', animation: 'vtSheet .45s cubic-bezier(.2,.8,.2,1) both', overflow: 'hidden' }}>
        <div style={{ flex: 'none', position: 'relative', paddingTop: 12 }}>
          <TiradorDeHoja />
          <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 0 10px' }}>
            <CruzDeHoja onCerrar={cerrar} enLinea oscura estilo={{ marginRight: 0, marginTop: 0 }} />
            {pastilla}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <span aria-hidden style={{ position: 'absolute', left: '50%', top: -20, width: 320, height: 330, marginLeft: -160, background: 'radial-gradient(ellipse 50% 80% at 50% 0%,rgba(255,226,170,.38),rgba(255,226,170,.06) 60%,transparent 75%)', clipPath: 'polygon(38% 0,62% 0,100% 100%,0 100%)', animation: 'vtSpot 5s ease-in-out infinite', pointerEvents: 'none' }} />
          <span data-dibujo-de-ficha-azul style={{ position: 'relative', marginTop: 10, display: 'flex', filter: abierto ? 'brightness(0) opacity(.38)' : 'drop-shadow(0 10px 22px rgba(0,0,0,.5))' }}>
            {item ? <DibujoDeItem item={item} tam={200} /> : abierto ? <Chapa logro={abierto.def} escalon={abierto.anio} ciudad={abierto.ciudad} tam={200} igual /> : null}
          </span>
          <span style={{ position: 'relative', font: `600 10.5px ${MONO}`, letterSpacing: '.18em', textTransform: 'uppercase', color: '#F3D59A' }}>{ojo}</span>
          <span style={{ position: 'relative', font: `400 38px/1.02 ${SERIF}`, textWrap: 'balance' as never }}>{nombre}</span>
          {item?.linea && <span style={{ position: 'relative', font: `italic 400 20px/1.2 ${SERIF}`, color: 'rgba(255,253,248,.72)', textWrap: 'balance' as never }}>{item.linea}</span>}
          <span style={{ position: 'relative', alignSelf: 'stretch', textAlign: 'left', margin: '14px 0 0', font: `600 10px ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color: item ? VERDE_CLARO : 'rgba(255,253,248,.55)' }}>{item ? 'Conseguido' : 'Por conseguir'}</span>
          <span data-conseguido-de-ficha={item ? '1' : '0'} style={{ position: 'relative', alignSelf: 'stretch', textAlign: 'left', padding: '12px 16px', borderRadius: 18, background: 'rgba(255,253,248,.07)', border: `1px solid ${item ? 'rgba(143,215,168,.35)' : 'rgba(243,213,154,.28)'}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: `400 21px/1.1 ${SERIF}` }}>{item ? item.lugar : abierto?.como}</span>
            <span style={{ font: "600 12.5px 'Geist'", color: 'rgba(255,253,248,.62)' }}>{item ? cuandoDe(item) : hastaDe(abierto?.hasta)}</span>
          </span>
        </div>
        <div style={{ flex: 'none', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 20px)', background: 'rgba(10,13,28,.9)', boxShadow: '0 -10px 18px -12px rgba(0,0,0,.6)' }}>
          {item ? (
            <PieDeFicha oscuro momento={item.momento} titulo={item.titulable ? { es: esTitulo, ocupado, alternar: () => void ponerTitulo() } : null} />
          ) : (
            <button type="button" data-entendido onClick={cerrar} style={{ ...BOTON_ORO, width: '100%', height: 52, border: 'none', borderRadius: 999, font: "700 15px 'Geist'", cursor: 'pointer' }}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </>
  )
}
