import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * LOS AVISOS DE ARRIBA DE HOY (HOY2 apartado 1, rehechos en la V54 con Design «Avisos Hoy Compactos» V1 a V6).
 *  · Arriba, SIEMPRE UNA sola fila (`FilaDeAviso`: icono pequeño en su cuadro, el título en negrita, debajo el sitio en gris y su botón a la derecha). Nunca dos uno encima de otro.
 *  · Los del MISMO tipo se juntan en una frase (lo hace quien los pone: «Hoy ya no llegas a 3 sitios · A, B y C» [Ver]; «2 entradas corren peligro · Coliseo 9:15 · Museos Vaticanos 11:00» [Ver solución]).
 *  · Si hay de tipos distintos se ve el más importante con la insignia «+x»; al tocarla se despliega la lista de todos (cada uno con su color y su botón) y abajo «Ocultar avisos ⌃». Orden: lo rojo (prio 1), la lluvia (1,5), lo demás.
 *  · Al resolverse el de arriba, sube el siguiente con su «+x».
 *  · Ninguno con botón se va solo: cada uno se va cuando ya no es verdad o cuando se desliza hacia arriba. Solo el verde «Tranquilo…» se va a los 5 s (`FilaDeAviso` con `autoIrse`).
 * `AvisoDeHoy` envuelve cada aviso con su prioridad (0 = la franja del día de prueba; 1 = lo que corre peligro ya; 1,5 = la lluvia; 2 = el tiempo y los horarios; 3 = lo que te sugiere el compañero; 4 = el reto; 5 = los cierres de la mañana; 6 = lo informativo).
 * Fuera de una `ZonaDeAvisos`, `AvisoDeHoy` pinta tal cual (sin límite).
 */
export const MAX_AVISOS_A_LA_VISTA = 1 // (V54) arriba, una sola fila

interface Contexto {
  visibles: Set<string>
  registrar: (id: string, prio: number) => () => void
  rango: Record<string, number>
  insignia: { id: string; n: number; abrir: () => void } | null
  desplegado: boolean
}
const Ctx = createContext<Contexto | null>(null)

export function ZonaDeAvisos({ linea, children }: { linea?: ReactNode; children: ReactNode }) {
  const [prios, setPrios] = useState<Record<string, number>>({})
  const [desplegado, setDesplegado] = useState(false)
  const registrar = useCallback((id: string, prio: number) => {
    setPrios((p) => (p[id] === prio ? p : { ...p, [id]: prio }))
    return () =>
      setPrios((p) => {
        if (!(id in p)) return p
        const n = { ...p }
        delete n[id]
        return n
      })
  }, [])
  const ordenados = Object.entries(prios).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
  const extra = ordenados.length - MAX_AVISOS_A_LA_VISTA
  // Al quedar uno solo, la lista vuelve a plegarse (la insignia desaparece).
  useEffect(() => {
    if (extra <= 0) setDesplegado(false)
  }, [extra])
  const abierto = desplegado && extra > 0
  const visibles = new Set((abierto ? ordenados : ordenados.slice(0, MAX_AVISOS_A_LA_VISTA)).map((x) => x[0]))
  const rango: Record<string, number> = {}
  ordenados.forEach((x, i) => (rango[x[0]] = i))
  const insignia = !abierto && extra > 0 ? { id: ordenados[0][0], n: extra, abrir: () => setDesplegado(true) } : null
  return (
    <Ctx.Provider value={{ visibles, registrar, rango, insignia, desplegado: abierto }}>
      {linea}
      <div data-hoy-avisos={ordenados.length} data-hoy-avisos-desplegados={abierto ? '1' : undefined} className="flex flex-none flex-col gap-2.5 empty:hidden">
        {children}
        {abierto && (
          <button type="button" onClick={() => setDesplegado(false)} data-hoy-aviso-menos style={{ order: 99 }} className="flex min-h-11 flex-none items-center justify-center gap-1.5 self-center rounded-full px-4 text-[12.5px] font-semibold text-[#6F4E37]">
            Ocultar avisos
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
        )}
      </div>
    </Ctx.Provider>
  )
}

export function AvisoDeHoy({ id, prio, children }: { id: string; prio: number; children: ReactNode }) {
  const c = useContext(Ctx)
  const registrar = c?.registrar
  useEffect(() => registrar?.(id, prio), [registrar, id, prio])
  if (!c) return <>{children}</>
  // Hasta que se anota (un instante), no se pinta: así nunca salen 2 a la vez ni un parpadeo de más.
  if (!c.visibles.has(id)) return null
  const insignia = c.insignia?.id === id ? c.insignia : null
  return (
    <div data-hoy-aviso-id={id} className={`flex flex-none flex-col gap-2.5 ${insignia ? 'relative pt-2' : ''}`} style={{ order: c.rango[id] ?? 0 }}>
      {children}
      {insignia && (
        <button type="button" onClick={insignia.abrir} data-hoy-aviso-mas aria-label={`${insignia.n} avisos más`} className="absolute -right-1.5 top-0 flex h-7 min-w-10 items-center justify-center rounded-full px-[11px] text-[13.5px] font-bold" style={{ background: '#1C2230', color: '#F3D88F', border: '2px solid #F5EFE4', boxShadow: '0 6px 12px -6px rgba(0,0,0,.5)' }}>
          +{insignia.n}
        </button>
      )}
    </div>
  )
}

/* ---- La fila compacta (Design «Avisos Hoy Compactos» V1, V3) ---- */
export type TonoDeAviso = 'rojo' | 'amarillo' | 'azul' | 'verde'
const TONOS: Record<TonoDeAviso, { bg: string; bd: string; tile: string; ic: string; tc: string; sc: string; bb: string; bf: string; bbd: string }> = {
  rojo: { bg: '#FBEAE4', bd: 'rgba(190,70,60,.5)', tile: '#C7352B', ic: '#fff', tc: '#7A1F16', sc: 'rgba(90,30,20,.7)', bb: '#7A1F16', bf: '#FFF3EE', bbd: '#7A1F16' },
  amarillo: { bg: '#FFFDF8', bd: 'rgba(181,138,46,.5)', tile: '#F3E3B2', ic: '#6E5018', tc: '#1C2230', sc: 'rgba(28,34,48,.58)', bb: '#FBF3E2', bf: '#4A3510', bbd: 'rgba(181,138,46,.55)' },
  azul: { bg: '#FFFDF8', bd: 'rgba(181,138,46,.5)', tile: '#DDE6F2', ic: '#3E5A7A', tc: '#1C2230', sc: 'rgba(28,34,48,.58)', bb: '#FBF3E2', bf: '#4A3510', bbd: 'rgba(181,138,46,.55)' },
  verde: { bg: '#E6F1E7', bd: 'rgba(43,127,69,.4)', tile: '#2B7F45', ic: '#fff', tc: '#1F5A33', sc: 'rgba(31,90,51,.75)', bb: '#FBF3E2', bf: '#1F5A33', bbd: 'rgba(43,127,69,.4)' },
}
export const D_AVISO = {
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  nube: 'M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 0 9.5zM8 21l1-2M12 21l1-2M16 21l1-2',
  pin: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  ok: 'M5 12.5l4.5 4.5L19 7',
}

/** Una fila de aviso: icono en su cuadro, título en negrita, el sitio en gris debajo y su botón a la derecha. Se va deslizándola hacia arriba (`onIrse`) o, el verde, solo a los 5 s (`autoIrse`). */
export function FilaDeAviso({ tono, icono, titulo, sub, boton, onIrse, autoIrse = false, datos }: { tono: TonoDeAviso; icono: string; titulo: string; sub?: string; boton?: { texto: string; onClick: () => void; datos?: Record<string, string> }; onIrse?: () => void; autoIrse?: boolean; datos?: Record<string, string> }) {
  const t = TONOS[tono]
  const inicio = useRef<{ x: number; y: number } | null>(null)
  const irse = useRef(onIrse)
  irse.current = onIrse
  useEffect(() => {
    if (!autoIrse) return undefined
    const id = window.setTimeout(() => irse.current?.(), 5000)
    return () => window.clearTimeout(id)
  }, [autoIrse])
  return (
    <div
      data-hoy-aviso-fila={tono}
      {...datos}
      onTouchStart={(e) => {
        inicio.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }}
      onTouchEnd={(e) => {
        const i = inicio.current
        inicio.current = null
        if (i && e.changedTouches[0].clientY - i.y < -30) onIrse?.()
      }}
      className="flex flex-none items-center gap-3 rounded-[20px] py-3 pl-3 pr-2.5"
      style={{ background: t.bg, border: `1.5px solid ${t.bd}`, boxShadow: '0 10px 18px -14px rgba(90,50,30,.5)' }}
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px]" style={{ background: t.tile }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={t.ic} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icono} />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span data-hoy-aviso-titulo className="text-[14px] font-bold leading-[1.2]" style={{ color: t.tc }}>{titulo}</span>
        {sub && <span data-hoy-aviso-sub className="text-[12.5px] font-medium leading-[1.3]" style={{ color: t.sc }}>{sub}</span>}
      </span>
      {boton && (
        <button type="button" onClick={boton.onClick} {...boton.datos} className="flex h-9 flex-none items-center whitespace-nowrap rounded-xl px-[13px] text-[12.5px] font-bold" style={{ background: t.bb, color: t.bf, border: `1px solid ${t.bbd}` }}>
          {boton.texto}
        </button>
      )}
    </div>
  )
}

/** La X de un aviso: pequeña, a la derecha, con la zona de toque de 44 px. */
export function CruzDeAviso({ onClick, oscuro = false }: { onClick: () => void; oscuro?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label="Cerrar este aviso" data-hoy-aviso-x className="-mr-2 flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ color: oscuro ? 'rgba(251,243,226,.7)' : 'rgba(28,34,48,.5)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

/* ---- Lo cerrado, por día, en el móvil (sin almacenamiento, vale hasta cerrar la pantalla) ---- */
const clave = (dia: string, id: string) => `trazo:hoy2:aviso-cerrado:${dia}:${id}`
export function avisoCerrado(dia: string, id: string): boolean {
  try {
    return window.localStorage.getItem(clave(dia, id)) === '1'
  } catch {
    return false
  }
}
export function cerrarAvisoDelDia(dia: string, id: string) {
  try {
    window.localStorage.setItem(clave(dia, id), '1')
  } catch {
    /* sin almacenamiento: vuelve a salir al reabrir */
  }
}
/** Un aviso con cierre guardado por día: devuelve si está cerrado y cómo cerrarlo (con repintado). */
export function useAvisoCerrado(dia: string, id: string): [boolean, () => void] {
  const [cerrado, setCerrado] = useState(() => avisoCerrado(dia, id))
  useEffect(() => setCerrado(avisoCerrado(dia, id)), [dia, id])
  return [cerrado, () => { cerrarAvisoDelDia(dia, id); setCerrado(true) }]
}
