import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { pedir, type Inicio as DatosInicio } from './api'
import { Destinos } from './Destinos'
import { Fotos } from './Fotos'
import { Inicio } from './Inicio'
import { Reportes } from './Reportes'
import { Usuarios } from './Usuarios'
import { Ventas } from './Ventas'
import { SERIE } from './estilo'

/**
 * (V33, Design «Panel Jutrip») EL PANEL DE JUTRIP: una sola entrada, /admin, solo para administradores (la comprobación, SIEMPRE en el servidor: cada /api/admin/* responde 403 a quien no lo es; aquí, sin respuesta del servidor,
 * se ve «Esta página es solo para administradores.»). Con el menú de Design: Inicio · Reportes · Fotos · Destinos y «Avísame» · Ventas · Usuarios · Logros · Sonidos. Para ordenador (menú a la izquierda) y en el móvil
 * (menú de pastillas arriba). /admin/logros y /admin/sonidos llevan a su apartado. Logros y Sonidos son lo de siempre, dentro del panel. Se baja a demanda.
 */
const AdminLogros = lazy(() => import('../logros/AdminLogros').then((m) => ({ default: m.AdminLogros })))
const AdminSonidos = lazy(() => import('../logros/AdminSonidos').then((m) => ({ default: m.AdminSonidos })))

export const SECCIONES = [
  { id: 'inicio', nombre: 'Inicio', icono: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z' },
  { id: 'reportes', nombre: 'Reportes', icono: 'M5 21V4M5 4h11l-2 4 2 4H5' },
  { id: 'fotos', nombre: 'Fotos', icono: 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z' },
  { id: 'destinos', nombre: 'Destinos y «Avísame»', icono: 'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { id: 'ventas', nombre: 'Ventas', icono: 'M17 6a6 6 0 1 0 0 12M5 10h9M5 14h9' },
  { id: 'usuarios', nombre: 'Usuarios', icono: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 19c0-2.4-1.6-4.4-4-5' },
  { id: 'logros', nombre: 'Logros', icono: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z' },
  { id: 'sonidos', nombre: 'Sonidos', icono: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6' },
] as const
type Id = (typeof SECCIONES)[number]['id']

/** Pura: de la dirección (/admin, /admin/usuarios, ?admin=panel&s=usuarios) a su apartado; sin nada, Inicio. */
export function seccionDe(ruta: string, consulta = ''): Id {
  const p = ruta.replace(/\/+$/, '').split('/')
  const trozo = p[1] === 'admin' ? p[2] : new URLSearchParams(consulta).get('s')
  return (SECCIONES.find((s) => s.id === trozo)?.id ?? 'inicio') as Id
}

function useAncho(): number {
  const [a, setA] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const f = () => setA(window.innerWidth)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return a
}

export function PanelJutrip(): ReactNode {
  const [inicio, setInicio] = useState<DatosInicio | null | undefined>(undefined)
  const [seccion, setSeccion] = useState<Id>(() => seccionDe(window.location.pathname, window.location.search))
  const movil = useAncho() < 900
  useEffect(() => {
    void pedir<DatosInicio>('/api/admin/inicio').then((r) => setInicio(r && r.ok ? r : null))
  }, [])
  useEffect(() => {
    const f = () => setSeccion(seccionDe(window.location.pathname, window.location.search))
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])
  const ir = (s: string) => {
    const id = (SECCIONES.find((x) => x.id === s)?.id ?? 'inicio') as Id
    setSeccion(id)
    try {
      window.history.pushState(null, '', id === 'inicio' ? '/admin' : `/admin/${id}`)
    } catch {
      /* sin historial */
    }
  }
  if (inicio === undefined) return <div style={{ padding: 24, font: "400 15px 'Geist'" }}>Comprobando…</div>
  if (inicio === null) return <div data-solo-administradores style={{ padding: 24, font: "400 17px/1.4 'Geist'" }}>Esta página es solo para administradores.</div>
  const insignia = (id: Id): number => (id === 'reportes' ? inicio.reportes_nuevos : id === 'fotos' ? inicio.fotos_por_aprobar : 0)
  const actual = SECCIONES.find((s) => s.id === seccion) ?? SECCIONES[0]
  const parametros = new URLSearchParams(window.location.search)
  const contenido = (
    <Suspense fallback={<p>Cargando…</p>}>
      {seccion === 'inicio' && <Inicio ir={ir} movil={movil} />}
      {seccion === 'reportes' && <Reportes movil={movil} abrirId={parametros.get('reporte')} />}
      {seccion === 'fotos' && <Fotos movil={movil} />}
      {seccion === 'destinos' && <Destinos movil={movil} />}
      {seccion === 'ventas' && <Ventas movil={movil} />}
      {seccion === 'usuarios' && <Usuarios movil={movil} />}
      {seccion === 'logros' && <AdminLogros />}
      {seccion === 'sonidos' && <AdminSonidos embebido />}
    </Suspense>
  )
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div data-panel-jutrip data-movil={movil ? '1' : '0'} data-seccion-actual={seccion} style={{ minHeight: '100vh', display: 'flex', flexDirection: movil ? 'column' : 'row', background: '#F6EFE0', color: '#1C2230', fontFamily: "'Geist',sans-serif" }}>
      {!movil ? (
        <nav aria-label="Panel" style={{ flex: 'none', width: 228, background: '#1C2230', padding: '26px 14px', display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
          <div style={{ padding: '0 10px 22px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: `400 27px/1 ${SERIE}`, color: '#F3D88F', letterSpacing: '.06em' }}>JUTRIP</span>
            <span style={{ font: "600 9px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(255,253,248,.45)' }}>ADMINISTRACIÓN</span>
          </div>
          {SECCIONES.map((s) => {
            const on = s.id === seccion
            const n = insignia(s.id)
            return (
              <button key={s.id} type="button" data-nav={s.id} aria-current={on ? 'page' : undefined} onClick={() => ir(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, height: 42, padding: '0 12px', borderRadius: 12, border: 'none', background: on ? 'rgba(243,216,143,.16)' : 'transparent', color: on ? '#F3D88F' : 'rgba(255,253,248,.72)', cursor: 'pointer', textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={s.icono} /></svg>
                <span style={{ flex: 1, font: `${on ? 700 : 500} 14px 'Geist'` }}>{s.nombre}</span>
                {n > 0 && <span data-insignia={s.id} style={{ minWidth: 22, height: 20, padding: '0 6px', borderRadius: 999, background: 'oklch(0.58 0.19 5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 11px 'Geist'" }}>{n}</span>}
              </button>
            )
          })}
        </nav>
      ) : (
        <nav aria-label="Panel" style={{ flex: 'none', background: '#1C2230', padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: `400 25px/1 ${SERIE}`, color: '#F3D88F', letterSpacing: '.06em' }}>JUTRIP</span>
            <span style={{ font: "600 9px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(255,253,248,.5)' }}>ADMINISTRACIÓN</span>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden', margin: '0 -18px', padding: '0 18px', scrollbarWidth: 'none' }}>
            {SECCIONES.map((s) => {
              const on = s.id === seccion
              const n = insignia(s.id)
              return (
                <button key={s.id} type="button" data-nav={s.id} aria-current={on ? 'page' : undefined} onClick={() => ir(s.id)} style={{ flex: 'none', minHeight: 44, padding: '0 14px', borderRadius: 999, border: 'none', background: on ? 'rgba(243,216,143,.16)' : 'transparent', color: on ? '#F3D88F' : 'rgba(255,253,248,.72)', display: 'flex', alignItems: 'center', gap: 6, font: `${on ? 700 : 500} 13px 'Geist'`, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  {s.nombre}
                  {n > 0 && <span data-insignia={s.id} style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: 'oklch(0.58 0.19 5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 10px 'Geist'" }}>{n}</span>}
                </button>
              )
            })}
          </div>
        </nav>
      )}
      <main style={{ flex: 1, minWidth: 0, padding: movil ? '18px 18px 60px' : '28px 32px 60px', display: 'flex', flexDirection: 'column', gap: movil ? 14 : 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ margin: 0, font: `400 ${movil ? 28 : 34}px/1 ${SERIE}` }}>{actual.nombre}</h1>
          {!movil && <span style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</span>}
        </div>
        {contenido}
      </main>
    </div>
  )
}
