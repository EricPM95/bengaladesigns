import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * HOY2 (apartado 1): LOS AVISOS DE ARRIBA, por urgencia y con su X.
 *  - `ZonaDeAvisos` es la caja de debajo de la cabecera: la línea fina «Sin conexión» va siempre encima (`linea`), después los avisos, como mucho 2 a la vista y el resto plegado en «1 aviso más».
 *  - `AvisoDeHoy` envuelve cada aviso con su prioridad (0 = la franja del día de prueba, que va arriba del todo; 1 = lo que corre peligro ya, de la HOY2c; 2 = el tiempo; 3 = lo que te sugiere el compañero donde estás (algo brilla, «estás en…»); 4 = el reto del día; 5 = los cierres de horario; 6 = lo informativo, «Tu entrada… ✓»). Los avisos se pintan donde se ponen
 *    (el orden del DOM es el de urgencia); el que no cabe entre los 2 primeros por prioridad no se pinta hasta abrir «N avisos más».
 *  - `CruzDeAviso` es la X de TODOS los avisos: el que se cierra no vuelve ese día salvo que pase algo nuevo (cada aviso guarda su cierre con la clave de lo que lo provocó).
 * Fuera de una `ZonaDeAvisos`, `AvisoDeHoy` pinta tal cual (sin límite).
 */
export const MAX_AVISOS_A_LA_VISTA = 2

interface Contexto {
  visibles: Set<string>
  registrar: (id: string, prio: number) => () => void
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
  const visibles = new Set((desplegado ? ordenados : ordenados.slice(0, MAX_AVISOS_A_LA_VISTA)).map((x) => x[0]))
  const plegados = ordenados.length - visibles.size
  return (
    <Ctx.Provider value={{ visibles, registrar }}>
      {linea}
      <div data-hoy-avisos={ordenados.length} className="flex flex-none flex-col gap-2.5 empty:hidden">
        {children}
        {plegados > 0 && (
          <button type="button" onClick={() => setDesplegado(true)} data-hoy-aviso-mas className="flex min-h-11 flex-none items-center justify-center self-center rounded-full px-4 text-[13px] font-semibold text-[#1C2230]/70 underline underline-offset-[3px]">
            {plegados === 1 ? '1 aviso más' : `${plegados} avisos más`}
          </button>
        )}
        {desplegado && ordenados.length > MAX_AVISOS_A_LA_VISTA && plegados === 0 && (
          <button type="button" onClick={() => setDesplegado(false)} data-hoy-aviso-menos className="flex min-h-11 flex-none items-center justify-center self-center rounded-full px-4 text-[13px] font-semibold text-[#1C2230]/55 underline underline-offset-[3px]">
            Ver menos
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
  // Hasta que se anota (un instante), no se pinta: así nunca salen 3 a la vez ni un parpadeo de más.
  if (!c.visibles.has(id)) return null
  return <>{children}</>
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
