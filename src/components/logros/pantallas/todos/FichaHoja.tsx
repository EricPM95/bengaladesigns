import { useState, type ReactNode } from 'react'
import { guardarTitulo, useGanados, type FilaDeViajero, type Ganados, type ItemGanado } from './api'
import { ChapaDeFila, DibujoDeItem } from './dibujo'
import { cuandoDe, cuentaDeFila, etiquetaDe, GRUPO, MAYUS, NOMBRE_DE_GRUPO, textoSiguiente } from './formato'
import { HojaGrande, PieDeFicha, useVitrinaDe } from './FichaGrande'

/**
 * LA FICHA DE UN LOGRO DE VIAJERO (T4; V72 F5): la MISMA hoja que la de una colección o una medalla (`HojaGrande`: X a la izquierda, vitrina a la derecha, pie fijo), con su dibujo, su nombre, cuánto lleva y
 * cuándo se ganó, con [Compartir], [Volver a ver] y «Es tu título». Lo que aún no se tiene sale en gris y dice cómo conseguirlo (nunca un emblema oculto: esos no llegan aquí). `clave` es la de lo ganado,
 * o `pendiente:<id del logro>` para un logro de viajero que aún no se tiene. Las colecciones y las medallas de ciudad las dibuja `FichaGrande`.
 */
const COLOR_FICHA_VERDE = '#2F6B43'

export function FichaHoja({ g, clave, cerrar }: { g: Ganados; clave: string; cerrar: () => void }): ReactNode {
  const cargar = useGanados((s) => s.cargar)
  const [ocupado, setOcupado] = useState(false)
  const pendienteId = clave.startsWith('pendiente:') ? clave.slice('pendiente:'.length) : null
  const item: ItemGanado | null = pendienteId ? null : (g.items.find((i) => i.clave === clave) ?? null)
  const filas = g.viajero.flatMap((x) => x.filas)
  const fila: FilaDeViajero | null = pendienteId ? (filas.find((f) => f.id === pendienteId) ?? null) : item?.tipo === 'viajero' ? (filas.find((f) => f.id === item.def) ?? null) : null
  const vitrina = useVitrinaDe(g, item)
  if (!item && !fila) return null

  const ganado = Boolean(item)
  const grupo = item?.grupo ?? fila?.grupo
  const color = grupo ? GRUPO[grupo]?.color : '#B8964F'
  const eye = fila && grupo ? `${NOMBRE_DE_GRUPO[grupo] ?? ''} · ${fila.familia}` : item ? etiquetaDe(item) : ''
  const nombre = item?.nombre ?? fila?.nombre ?? ''
  const siguiente = fila && !fila.completo ? textoSiguiente(fila) : null
  const esTitulo = Boolean(item && g.titulo?.clave === item.clave)
  const momento = item?.momento ?? null

  const ponerTitulo = async () => {
    if (!item || ocupado) return
    setOcupado(true)
    const ok = await guardarTitulo(esTitulo ? null : item.clave)
    if (ok) await cargar(true)
    setOcupado(false)
  }

  return (
    <HojaGrande etiqueta={nombre} clave={clave} cerrar={cerrar} alta={false} vitrina={item?.balda ? vitrina : null} pie={ganado ? <PieDeFicha momento={momento} titulo={item?.titulable ? { es: esTitulo, ocupado, alternar: () => void ponerTitulo() } : null} /> : null}>
      <span style={{ marginTop: 4, filter: ganado ? 'none' : 'grayscale(1)', opacity: ganado ? 1 : 0.5 }}>{item ? <DibujoDeItem item={item} tam={140} /> : fila ? <ChapaDeFila fila={fila} tam={140} /> : null}</span>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color }}>{eye}</span>
      <span style={{ font: "400 28px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{nombre}</span>
      {ganado ? (
        <>
          <span style={{ font: "600 14px 'Geist'" }}>{fila?.cuenta ? cuentaDeFila(fila) : (item?.linea ?? '')}</span>
          {siguiente && <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{MAYUS(siguiente)}</span>}
          <span style={{ alignSelf: 'stretch', textAlign: 'left', margin: '10px 0 0', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: COLOR_FICHA_VERDE }}>Conseguido</span>
          <span data-conseguido-de-ficha style={{ alignSelf: 'stretch', textAlign: 'left', padding: '10px 14px', borderRadius: 16, background: '#FFFDF8', border: '1px solid oklch(0.55 0.11 150 / .35)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: "400 18px/1.1 'Instrument Serif',serif" }}>{item?.lugar ?? ''}</span>
            <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{item ? cuandoDe(item) : ''}</span>
          </span>
        </>
      ) : (
        <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{MAYUS(siguiente ?? fila?.como ?? '')}</span>
      )}
    </HojaGrande>
  )
}
