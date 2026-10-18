import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ResumenDeExp } from './api'
import { InicialEnMarco, MarcoDeRango } from './MarcoDeRango'
import { entre, miles, movimientoReducido, suave, textoDeNivel } from './util'
import { useReloj } from './useReloj'

/**
 * LA EXP GANADA (E1 y E2 de «Experiencia» en Design): UNA sola animación con toda la EXP sumada («+405 EXP»), flotando abajo, con el nivel, el rango y la barra. Se pasa tocando.
 * Es solo presentación: quien la use (los momentos) decide CUÁNDO sale (al acabar las sorpresas y las películas, cuando vuelve a verse la app; nunca en el resumen del día).
 *
 * Props (lo que manda el servidor en `exp` de la respuesta de un Visto o una foto: `{ ganada, antes, despues, sube_de_nivel }`):
 *   ganada   la EXP que se ha sumado (el «+405 EXP»).
 *   antes    `ResumenDeExp` de antes de ganarla (nivel, rango, estrellas, `exp_en_nivel`, `exp_para_siguiente`).
 *   despues  `ResumenDeExp` de después. Si el nivel sube, la barra llega a llenarse y dice «¡Nivel completado!» (el que sigue es `SubeDeNivel`).
 *   onFin    se llama al acabar (a los ~4 s) o al tocarla; una sola vez.
 *   inicial  la letra que va dentro del marco (por defecto la de siempre del Perfil).
 *
 * No tapa nada de abajo: va por encima del botón flotante (que está a 88 px) y de la barra de pestañas, y no se acerca a [Seguir] de HOY.
 * Con «reducir movimiento»: aparece ya puesta, sin deslizarse ni contar, y se va sola a los 3 s.
 */
export const DURACION_EXP_GANADA = 4000
const DURACION_QUIETA = 3000

export function ExpGanada({ ganada, antes, despues, onFin, inicial = 'V' }: { ganada: number; antes: ResumenDeExp; despues: ResumenDeExp; onFin?: () => void; inicial?: string }): ReactNode {
  const quieto = movimientoReducido()
  // Con reducir movimiento el reloj se queda en el instante en que todo ya está puesto y la tarjeta aún se ve.
  const t = useReloj(quieto ? 1800 : DURACION_EXP_GANADA, quieto)
  const fin = useRef(onFin)
  fin.current = onFin
  const llamado = useRef(false)
  const acabar = () => {
    if (llamado.current) return
    llamado.current = true
    fin.current?.()
  }
  useEffect(() => {
    const id = window.setTimeout(acabar, quieto ? DURACION_QUIETA : DURACION_EXP_GANADA)
    return () => window.clearTimeout(id)
  }, [quieto])

  // Donde flota: por defecto, 170 px sobre el borde de abajo; si en HOY está el botón [✓ Visto], justo encima de él, para no taparlo (ni la barra de abajo).
  const [subida] = useState<number | null>(() => {
    const visto = typeof document === 'undefined' ? null : document.querySelector('[data-boton-visto]')
    if (!visto) return null
    const r = visto.getBoundingClientRect()
    const bottom = window.innerHeight - r.top + 12
    return r.top > 0 && window.innerHeight - bottom > 150 ? bottom : null
  })
  const sube = despues.nivel > antes.nivel || despues.rango_ix > antes.rango_ix
  const max = antes.exp_para_siguiente
  const hasta = sube ? max : despues.exp_en_nivel
  const k = suave(entre(t, 350, 1750))
  const n = antes.exp_en_nivel + (hasta - antes.exp_en_nivel) * k
  const lleno = Math.min(max, n)
  const entra = entre(t, 0, 350)
  const sale = quieto ? 1 : 1 - entre(t, 3700, 4000)
  const opacidad = Math.min(entra, sale)
  const chip = Math.min(entre(t, 200, 600), 1 - entre(t, 1500, 2000))
  const marco = sube ? antes : despues
  return createPortal(
    <div
      data-exp-ganada
      role="status"
      aria-label={`+${miles(ganada)} EXP`}
      onClick={acabar}
      style={{ position: 'fixed', left: 14, right: 14, bottom: subida !== null ? subida : 'calc(env(safe-area-inset-bottom,0px) + 170px)', zIndex: 9100, opacity: opacidad, transform: `translateY(${((1 - entra) * 60).toFixed(0)}px)`, cursor: 'pointer', fontFamily: "'Geist',system-ui,sans-serif", WebkitTapHighlightColor: 'transparent' }}
    >
      <span data-exp-chip style={{ position: 'absolute', right: 16, top: -30, height: 28, padding: '0 12px', borderRadius: 999, background: '#F3D59A', color: '#2A1D10', display: 'flex', alignItems: 'center', font: "800 13px 'Geist Mono',monospace", boxShadow: '0 8px 16px -8px rgba(0,0,0,.6)', opacity: quieto ? 1 : chip, transform: `translateY(${quieto ? 0 : (-suave(entre(t, 200, 2000)) * 22).toFixed(0)}px)` }}>
        +{miles(ganada)} EXP
      </span>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'linear-gradient(150deg,#232B45,#141826)', border: '1.5px solid rgba(243,213,154,.55)', boxShadow: '0 22px 40px -16px rgba(0,0,0,.7)', padding: '12px 18px 12px 12px', display: 'flex', alignItems: 'center', gap: 14, minHeight: 88 }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '36%', background: 'linear-gradient(100deg,transparent,rgba(255,244,210,.22),transparent)', transform: `translateX(${(-120 + 440 * entre(t, 600, 1600)).toFixed(0)}%)`, pointerEvents: 'none' }} />
        <MarcoDeRango rango={marco.rango_ix} estrellas={marco.estrellas} leyenda={marco.leyenda_estrellas} tam={64}>
          <InicialEnMarco letra={inicial} tam={64} />
        </MarcoDeRango>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, color: '#FFFDF8', minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ font: "600 13px 'Geist'" }}>{textoDeNivel(marco)}</span>
            <span data-exp-numero style={{ font: "700 16px 'Geist Mono',monospace", color: '#F3D59A', whiteSpace: 'nowrap' }}>
              {miles(lleno)}
              <span style={{ fontSize: 11, color: 'rgba(243,213,154,.6)' }}> / {miles(max)}</span>
            </span>
          </span>
          <span style={{ height: 9, borderRadius: 9, background: 'rgba(255,253,248,.14)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${max > 0 ? ((lleno / max) * 100).toFixed(1) : 0}%`, borderRadius: 9, background: 'linear-gradient(90deg,#E3B13F,#FFF1B8)' }} />
          </span>
          <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(255,253,248,.62)' }}>{lleno >= max ? '¡Nivel completado!' : `Te faltan ${miles(Math.max(0, Math.round(max - n)))} EXP para el siguiente nivel`}</span>
        </span>
      </div>
    </div>,
    document.body,
  )
}
