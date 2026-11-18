import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ResumenDeExp } from './api'
import { miles, movimientoReducido } from './util'
import './perfil.css'

/**
 * LA EXP Y LA SUBIDA DE NIVEL, JUNTAS EN UNA PANTALLA (Tanda V6, regla de Eric; sustituye al cartel «+EXP» y a la pantalla suelta de subir de nivel cuando hay sorpresas delante).
 * Es lo último de lo que se gana: sale la barra de nivel y se llena con lo ganado («+120 EXP»); si llega al siguiente nivel, en la misma pantalla se completa y salta «¡Subes a nivel 3 · Explorador!»;
 * si no llega, «Te faltan 80 EXP para el nivel 3». Si además cambia el rango, el cambio de rango (con su marco) sale después, en su pantalla.
 * Todos los números salen de lo que manda el servidor (`antes` y `despues`); aquí no hay ninguno escrito a mano. Con «reducir movimiento» sale ya puesta.
 */
const pct = (e: ResumenDeExp, n: number) => (e.exp_para_siguiente > 0 ? Math.max(0, Math.min(100, (n / e.exp_para_siguiente) * 100)) : 0)

export function ExpYNivel({ ganada, antes, despues, onSeguir, onSaltarTodo }: { ganada: number; antes: ResumenDeExp; despues: ResumenDeExp; onSeguir: () => void; onSaltarTodo?: (() => void) | null }): ReactNode {
  const quieto = movimientoReducido()
  const sube = despues.nivel > antes.nivel
  // 0: la barra donde estaba · 1: se llena con lo ganado · 2 (solo si sube): la barra se completa y salta el nivel nuevo · 3: el botón.
  const [fase, setFase] = useState(quieto ? 3 : 0)
  useEffect(() => {
    if (quieto) return undefined
    const t = [window.setTimeout(() => setFase(1), 500), window.setTimeout(() => setFase(sube ? 2 : 3), 2100), window.setTimeout(() => setFase(3), sube ? 3400 : 2300)]
    return () => t.forEach((x) => window.clearTimeout(x))
  }, [quieto, sube])
  // La barra: antes → (si sube) llena → (ya subido) la del nivel nuevo, sin viajar hacia atrás.
  const ancho = fase === 0 ? pct(antes, antes.exp_en_nivel) : sube ? (fase === 1 ? 100 : pct(despues, despues.exp_en_nivel)) : pct(despues, despues.exp_en_nivel)
  const transicion = fase === 2 && sube ? 'width 1s ease .1s' : 'width 1.4s cubic-bezier(.3,.7,.2,1)'
  const faltan = Math.max(0, despues.falta)
  return createPortal(
    <div data-exp-y-nivel role="dialog" aria-label={`+${miles(ganada)} EXP`} className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: 9100, background: 'radial-gradient(circle at 50% 36%,#3A3550 0%,#141826 72%)', color: '#FFFDF8', animation: 'moFade .4s ease both' }}>
      {onSaltarTodo && (
        <button type="button" data-saltar-todo onClick={onSaltarTodo} className="absolute right-4 top-4 flex h-11 items-center px-3" style={{ font: "600 12.5px 'Geist'", color: 'rgba(255,253,248,.7)', background: 'none', border: 'none' }}>
          Saltar todo
        </button>
      )}
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#F3D59A' }}>EXPERIENCIA</span>
      <span data-exp-ganada-grande style={{ font: "400 56px/1.05 'Instrument Serif',serif", marginTop: 8 }}>+{miles(ganada)} EXP</span>
      <div className="mt-6 flex w-full max-w-[340px] flex-col gap-2">
        <span className="flex items-baseline justify-between">
          <span style={{ font: "400 22px/1 'Instrument Serif',serif" }}>Nivel {fase >= 2 && sube ? despues.nivel : antes.nivel}</span>
          <span style={{ font: "500 11.5px 'Geist Mono',monospace", color: '#F3D59A' }}>{fase >= 1 && !sube ? `${miles(despues.exp_en_nivel)} / ${miles(despues.exp_para_siguiente)}` : fase >= 2 && sube ? `${miles(despues.exp_en_nivel)} / ${miles(despues.exp_para_siguiente)}` : `${miles(antes.exp_en_nivel)} / ${miles(antes.exp_para_siguiente)}`}</span>
        </span>
        <span role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ancho)} style={{ height: 10, borderRadius: 8, background: 'rgba(255,253,248,.15)', overflow: 'hidden' }}>
          <span data-exp-barra style={{ display: 'block', height: '100%', width: `${ancho}%`, borderRadius: 8, background: 'linear-gradient(90deg,#E3B13F,#FFF1B8)', transition: quieto ? 'none' : transicion }} />
        </span>
      </div>
      <div style={{ minHeight: 70, marginTop: 22, textAlign: 'center' }}>
        {sube && fase >= 2 ? (
          <span data-exp-sube style={{ font: "400 28px/1.15 'Instrument Serif',serif", color: '#F3D59A', animation: quieto ? 'none' : 'moIn .8s ease both' }}>
            ¡Subes a nivel {despues.nivel} · {despues.rango}!
          </span>
        ) : (
          !sube &&
          fase >= 1 && (
            <span data-exp-faltan style={{ font: "500 15px/1.4 'Geist'", color: 'rgba(255,253,248,.82)', animation: quieto ? 'none' : 'moIn .8s .6s ease both' }}>
              Te faltan {miles(faltan)} EXP para el nivel {despues.nivel + 1}
            </span>
          )
        )}
      </div>
      <button type="button" data-exp-seguir onClick={onSeguir} className="mt-6 flex h-[52px] w-full max-w-[340px] items-center justify-center rounded-full border-0" style={{ background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#2A1D10', font: "700 15px 'Geist'", opacity: fase >= 3 ? 1 : 0, pointerEvents: fase >= 3 ? 'auto' : 'none', transition: 'opacity .4s ease' }}>
        Seguir
      </button>
    </div>,
    document.body,
  )
}
