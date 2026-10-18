import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useMomentosUI } from '../../momentos/useMomentosUI'
import { guardarBalda, guardarTitulo, useGanados, useHojasDeLogros, type FilaDeViajero, type Ganados, type ItemGanado } from './api'
import { ChapaDeFila, DibujoDeItem } from './dibujo'
import { cuandoDe, cuentaDeFila, etiquetaDe, GRUPO, MAYUS, NOMBRE_DE_GRUPO, textoSiguiente } from './formato'

const Repetir = lazy(() => import('./Repetir'))

/**
 * LA FICHA DE UN LOGRO (T4): una hoja que sube desde abajo con su dibujo, su nombre, cuánto lleva y cuándo se ganó, con [Compartir], [Volver a ver] y «Es tu título».
 * Lo que aún no se tiene sale en gris y dice cómo conseguirlo (nunca un emblema oculto: esos no llegan aquí). `clave` es la de lo ganado, o `pendiente:<id del logro>` para un logro de viajero
 * que aún no se tiene.
 */
const VERDE = 'oklch(0.55 0.11 150)'
const DORADO = 'oklch(0.8 0.14 70)'
const BOTON_CLARO = { height: 44, borderRadius: 999, border: '1px solid rgba(28,34,48,.16)', background: '#FFFFFF', font: "600 13px 'Geist'", cursor: 'pointer', color: '#1C2230' } as const

export function FichaHoja({ g, clave, cerrar }: { g: Ganados; clave: string; cerrar: () => void }): ReactNode {
  const avisar = useHojasDeLogros((s) => s.avisar)
  const abrirHueco = useHojasDeLogros((s) => s.abrirHueco)
  const poner = useGanados((s) => s.poner)
  const cargar = useGanados((s) => s.cargar)
  const [repetir, setRepetir] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const pendienteId = clave.startsWith('pendiente:') ? clave.slice('pendiente:'.length) : null
  const item: ItemGanado | null = pendienteId ? null : (g.items.find((i) => i.clave === clave) ?? null)
  const filas = g.viajero.flatMap((x) => x.filas)
  const fila: FilaDeViajero | null = pendienteId ? (filas.find((f) => f.id === pendienteId) ?? null) : item?.tipo === 'viajero' ? (filas.find((f) => f.id === item.def) ?? null) : null
  if (!item && !fila) return null

  const ganado = Boolean(item)
  const grupo = item?.grupo ?? fila?.grupo
  const color = grupo ? GRUPO[grupo]?.color : '#B8964F'
  const eye = fila && grupo ? `${NOMBRE_DE_GRUPO[grupo] ?? ''} · ${fila.familia}` : item ? etiquetaDe(item) : ''
  const nombre = item?.nombre ?? fila?.nombre ?? ''
  const siguiente = fila && !fila.completo ? textoSiguiente(fila) : null
  const enVitrina = Boolean(item?.balda && g.vitrina.baldas[item.balda].huecos.includes(item.clave))
  const esTitulo = Boolean(item && g.titulo?.clave === item.clave)
  const momento = item?.momento ?? null

  const llevarOQuitar = async () => {
    if (!item?.balda || ocupado) return
    if (!enVitrina) return abrirHueco(item.clave)
    setOcupado(true)
    const v = await guardarBalda(item.balda, g.vitrina.baldas[item.balda].huecos.filter((k) => k !== item.clave))
    setOcupado(false)
    if (!v) return avisar('No se ha podido quitar. Vuelve a probar.')
    poner({ ...g, vitrina: v })
    avisar(`«${item.nombre}» vuelve a Todos mis logros`)
  }
  const ponerTitulo = async () => {
    if (!item || ocupado) return
    setOcupado(true)
    const ok = await guardarTitulo(esTitulo ? null : item.clave)
    if (ok) await cargar(true)
    setOcupado(false)
  }

  return (
    <>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 40, border: 'none', padding: 0, background: 'rgba(28,34,48,.45)', animation: 'vtFade .3s ease both', cursor: 'default' }} />
      <div role="dialog" aria-modal="true" aria-label={nombre} data-ficha={clave} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 30px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', animation: 'vtSheet .45s cubic-bezier(.2,.8,.2,1) both' }}>
        <span aria-hidden style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <span style={{ marginTop: 8, filter: ganado ? 'none' : 'grayscale(1)', opacity: ganado ? 1 : 0.5 }}>{item ? <DibujoDeItem item={item} tam={140} /> : fila ? <ChapaDeFila fila={fila} tam={140} /> : null}</span>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color }}>{eye}</span>
        <span style={{ font: "400 28px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{nombre}</span>
        {ganado ? (
          <>
            <span style={{ font: "600 14px 'Geist'" }}>{fila?.cuenta ? cuentaDeFila(fila) : (item?.linea ?? '')}</span>
            <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{item ? `${cuandoDe(item)} · ${item.lugar}` : ''}</span>
            {siguiente && <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{MAYUS(siguiente)}</span>}
          </>
        ) : (
          <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{MAYUS(siguiente ?? fila?.como ?? '')}</span>
        )}
        {item?.balda && (
          <button type="button" aria-label={enVitrina ? 'Quitar de mi vitrina' : 'Llevar a mi vitrina'} disabled={ocupado} onClick={() => void llevarOQuitar()} style={{ position: 'absolute', top: 10, right: 12, width: 48, height: 48, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: enVitrina ? VERDE : DORADO, color: enVitrina ? '#FFFFFF' : '#17120a', boxShadow: '0 4px 12px -4px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={enVitrina ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
              </svg>
            </span>
          </button>
        )}
        {ganado && (
          <div style={{ marginTop: 8, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" disabled={!momento} onClick={() => momento && useMomentosUI.getState().abrirCompartir({ tipo: 'logro', momento })} style={{ height: 52, border: 'none', borderRadius: 999, background: DORADO, color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "700 15px 'Geist'", cursor: 'pointer', opacity: momento ? 1 : 0.5 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
              </svg>
              Compartir
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: item?.titulable ? '1fr 1fr' : '1fr', gap: 8 }}>
              <button type="button" disabled={!momento} onClick={() => setRepetir(true)} style={{ ...BOTON_CLARO, opacity: momento ? 1 : 0.5 }}>
                Volver a ver
              </button>
              {item?.titulable && (
                <button type="button" disabled={ocupado} onClick={() => void ponerTitulo()} style={BOTON_CLARO}>
                  {esTitulo ? '✓ Es tu título' : 'Usar como mi título'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {repetir && momento && (
        <Suspense fallback={null}>
          <Repetir momento={momento} alCerrar={() => setRepetir(false)} />
        </Suspense>
      )}
    </>
  )
}
