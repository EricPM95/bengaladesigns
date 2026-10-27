import type { ReactNode } from 'react'
import type { ExpDelPerfil } from './api'
import { miles } from './util'

/**
 * LA BARRA DE NIVEL Y EXP del Perfil («Experiencia · modo perfil» de Design): la EXP total en grande, lo que lleva dentro del nivel («720 / 900») y la barra. Debajo, lo que falta.
 * Todos los números salen de `exp` (lo que manda el servidor: data/logros/exp.json, nunca baja); aquí no hay ninguno escrito a mano.
 */
export function NivelYBarra({ exp }: { exp: ExpDelPerfil }): ReactNode {
  const pct = exp.exp_para_siguiente > 0 ? Math.max(0, Math.min(100, (exp.exp_en_nivel / exp.exp_para_siguiente) * 100)) : 0
  return (
    <div data-nivel-y-barra style={{ borderRadius: 22, background: '#1C2230', color: '#FFFDF8', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span data-exp-total style={{ font: "400 26px/1 'Instrument Serif',serif" }}>
          {miles(exp.exp)} EXP
        </span>
        <span style={{ font: "500 11.5px 'Geist Mono',monospace", color: '#F3D59A' }}>
          {miles(exp.exp_en_nivel)} / {miles(exp.exp_para_siguiente)}
        </span>
      </span>
      <span role="progressbar" aria-valuemin={0} aria-valuemax={exp.exp_para_siguiente} aria-valuenow={exp.exp_en_nivel} style={{ height: 8, borderRadius: 8, background: 'rgba(255,253,248,.15)', overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#E3B13F,#FFF1B8)' }} />
      </span>
      <span style={{ font: "400 12px 'Geist'", color: 'rgba(255,253,248,.65)' }}>{exp.maximo ? `Te faltan ${miles(exp.falta)} EXP para la siguiente estrella` : `Te faltan ${miles(exp.falta)} EXP para el nivel ${exp.nivel + 1}`}</span>
    </div>
  )
}

/**
 * LA EXP EN PEQUEÑO, DEBAJO DE LA CABECERA (Tanda 10N5, apartado 4, `Piezas/Perfil Orden`, exactamente igual): una barra fina de 6 px y debajo «0 / 500 · Te faltan 500 para el nivel 2».
 * Sustituye a la tarjeta oscura grande de antes (la EXP total, el sorteo y la vitrina siguen donde estaban). Los números salen del servidor, como siempre.
 */
export function ExpEnPequeno({ exp }: { exp: ExpDelPerfil }): ReactNode {
  const pct = exp.exp_para_siguiente > 0 ? Math.max(0, Math.min(100, (exp.exp_en_nivel / exp.exp_para_siguiente) * 100)) : 0
  return (
    <div data-exp-pequena style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span role="progressbar" aria-valuemin={0} aria-valuemax={exp.exp_para_siguiente} aria-valuenow={exp.exp_en_nivel} style={{ display: 'block', height: 6, borderRadius: 3, background: 'rgba(28,34,48,.12)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 3, background: 'linear-gradient(90deg,#C99A44,#F3D88F)' }} />
      </span>
      <span data-exp-linea style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.65)' }}>
        {miles(exp.exp_en_nivel)} / {miles(exp.exp_para_siguiente)} · {exp.maximo ? `Te faltan ${miles(exp.falta)} para la siguiente estrella` : `Te faltan ${miles(exp.falta)} para el nivel ${exp.nivel + 1}`}
      </span>
    </div>
  )
}
