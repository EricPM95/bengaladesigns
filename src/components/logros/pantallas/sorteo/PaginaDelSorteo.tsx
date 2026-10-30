import { useEffect, useState, type ReactNode } from 'react'
import { Capa } from '../Capa'
import { useLogrosPantallas, type PantallaDe } from '../useLogrosPantallas'
import { miles } from '../perfil/util'
import { pedirSorteo, type EstadoDelSorteo } from './api'
import './sorteo.css'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** «2027-08-31» → «31 de agosto de 2027». */
export const fechaEnPalabras = (f: string): string => `${Number(f.slice(8, 10))} de ${MESES[Number(f.slice(5, 7)) - 1]} de ${f.slice(0, 4)}`

const Brillo = ({ x, y, tam, retraso }: { x: number; y: number; tam: number; retraso: number }): ReactNode => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute', left: x, top: y, animation: `soTw 2.6s ${retraso}s ease-in-out infinite` }}>
    <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5Z" fill="#FFF8E0" />
  </svg>
)
const Visto = ({ tam = 14, color = '#fff', grosor = 3.4 }: { tam?: number; color?: string; grosor?: number }): ReactNode => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

/** Lo que dice cada condición, con la EXP real que falta. */
function textoDeCondicion(id: string, s: EstadoDelSorteo): string {
  if (id === 'nivel') {
    const c = s.condiciones.find((x) => x.id === 'nivel')
    return c?.ok ? `Llega al nivel ${s.nivel_minimo}` : `Llega al nivel ${s.nivel_minimo} (te faltan ${miles(c?.falta_exp ?? s.falta_exp)} EXP)`
  }
  return 'Haz mínimo un viaje con HOY activado'
}

/**
 * LA PÁGINA DEL SORTEO (`Piezas/Sorteo Perfil`, «Página del sorteo»): pantalla entera con la foto de Roma arriba y la flecha para volver; el premio, cuándo se sortea, quién puede entrar,
 * «Cómo se entra» con las dos condiciones (con ✓ las que ya cumple), [Bases legales] —solo si hay enlace: las bases todavía no están— y el botón de abajo con su estado.
 * Todo sale de lo que manda el servidor (`GET /api/logros/sorteo`, que lee `data/logros/exp.json › sorteo`): aquí no hay ni una fecha, ni un premio, ni una cifra escritos.
 */
export default function PaginaDelSorteo({ pantalla: _pantalla }: { pantalla: PantallaDe<'sorteo'> }): ReactNode {
  const [s, setS] = useState<EstadoDelSorteo | null | 'error'>(null)
  useEffect(() => {
    let vivo = true
    void pedirSorteo().then((r) => vivo && setS(r ?? 'error'))
    return () => {
      vivo = false
    }
  }, [])
  const volver = () => useLogrosPantallas.getState().volver()
  const datos = s && s !== 'error' ? s : null

  return (
    <Capa etiqueta="Sorteo" fondo="#F2ECDC">
      <div data-sorteo="" data-sorteo-estado={datos?.estado ?? 'cargando'} className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', paddingBottom: 130 }}>
          <div className="relative overflow-hidden" style={{ height: 318, marginTop: 'calc(-1 * env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', background: 'linear-gradient(165deg,#2A1F12 0%,#7A4E22 50%,#D6A04A 100%)' }}>
            <img src="/fotos/roma/dia_coliseo.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" data-foto-sorteo />
            <span aria-hidden="true" className="absolute left-[-90px] top-[-70px] rounded-full" style={{ width: 570, height: 570, background: 'repeating-conic-gradient(from 0deg,rgba(255,236,170,.2) 0 6deg,transparent 6deg 16deg)', WebkitMask: 'radial-gradient(circle,#000 10%,transparent 62%)', mask: 'radial-gradient(circle,#000 10%,transparent 62%)', animation: 'soSpin 60s linear infinite' }} />
            <Brillo x={56} y={92} tam={14} retraso={0} />
            <Brillo x={300} y={70} tam={12} retraso={0.8} />
            <Brillo x={330} y={150} tam={9} retraso={1.6} />
            <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(20,14,6,.35),rgba(20,14,6,0) 35%,rgba(20,14,6,.78))' }} />
            <button type="button" onClick={volver} aria-label="Volver" data-sorteo-volver className="absolute flex h-11 w-11 items-center justify-center rounded-full border-0" style={{ left: 12, top: 'calc(env(safe-area-inset-top) + 10px)', background: 'rgba(255,253,248,.92)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            {datos && (
              <span className="absolute flex h-[30px] items-center gap-1.5 rounded-full px-3" style={{ right: 16, top: 'calc(env(safe-area-inset-top) + 16px)', background: 'linear-gradient(135deg,#F8E7B0,#D2A845)', color: '#2A1D06', font: "700 10px 'Geist Mono',monospace", letterSpacing: '.16em' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A1D06" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                </svg>
                SORTEO {datos.edicion.anio}
              </span>
            )}
            {datos && (
              <div className="absolute flex flex-col gap-1.5" style={{ left: 22, right: 22, bottom: 22, color: '#FFFDF8' }}>
                <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', color: '#F3D88F' }}>{datos.edicion.destino ? `EL DESTINO DEL AÑO ${datos.edicion.anio}` : `SORTEO ${datos.edicion.anio}`}</span>
                <span data-sorteo-titulo style={{ font: "400 46px/1 'Instrument Serif',serif" }}>
                  {datos.edicion.destino ? (
                    <>
                      Un viaje a <em style={{ color: '#F3D88F' }}>{datos.edicion.destino}</em>
                    </>
                  ) : (
                    <>
                      Un viaje al <em style={{ color: '#F3D88F' }}>destino del año</em>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {s === 'error' && <p className="px-6 pt-10 text-center text-[15px] text-text/65">No se ha podido abrir el sorteo. Vuelve a probar.</p>}
          {s === null && <p className="px-6 pt-10 text-center text-[15px] text-text/55">Un momento…</p>}
          {datos && (
            <div className="flex flex-col gap-3 px-4 pt-3.5">
              <div className="flex items-center gap-3.5 rounded-[22px] bg-[#FFFDF8] px-4 py-3.5" style={{ border: '1.5px solid #D2A845', boxShadow: '0 12px 22px -16px rgba(139,101,24,.7)' }}>
                <span className="flex h-[50px] w-[50px] flex-none items-center justify-center rounded-[15px]" style={{ background: 'linear-gradient(145deg,#FFF6DC,#E9C77A 45%,#9A7228)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8),inset 0 -3px 6px rgba(110,80,24,.4)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2zM12 8.5l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" />
                  </svg>
                </span>
                <span className="flex flex-col gap-[3px]">
                  <span style={{ font: "700 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37' }}>EL PREMIO</span>
                  <span data-sorteo-premio style={{ font: "400 23px/1.1 'Instrument Serif',serif" }}>
                    {datos.edicion.premio}
                  </span>
                </span>
              </div>
              <div className="flex gap-2.5">
                <div className="flex flex-1 flex-col gap-[3px] rounded-[18px] bg-[#FFFDF8] px-3.5 py-3">
                  <span style={{ font: "700 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#6F4E37' }}>SE SORTEA</span>
                  <span data-sorteo-fechas style={{ font: "500 14.5px/1.3 'Geist'" }}>
                    {datos.edicion.fechas ?? 'Fechas por anunciar'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-[3px] rounded-[18px] bg-[#FFFDF8] px-3.5 py-3">
                  <span style={{ font: "700 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#6F4E37' }}>PUEDEN ENTRAR</span>
                  <span style={{ font: "500 14.5px/1.3 'Geist'" }}>Viajeros de nivel {datos.nivel_minimo} o más</span>
                </div>
              </div>
              <span style={{ font: "700 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', margin: '4px 0 -4px 4px' }}>CÓMO SE ENTRA</span>
              {datos.condiciones.map((c) => (
                <div key={c.id} data-condicion={c.id} data-condicion-ok={c.ok ? '1' : '0'} className="flex items-center gap-3 rounded-[18px] bg-[#FFFDF8] px-3.5 py-[13px]" style={{ border: c.ok ? '1px solid #2B7F45' : '1px solid rgba(28,34,48,.12)' }}>
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full" style={{ background: c.ok ? '#2B7F45' : 'transparent', border: c.ok ? 'none' : '2px solid rgba(28,34,48,.25)' }}>
                    {c.ok && <Visto />}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span style={{ font: "500 14.5px/1.3 'Geist'" }}>{textoDeCondicion(c.id, datos)}</span>
                    {c.id === 'viaje_con_hoy' && <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.58)' }}>Usa HOY al menos la mitad de los días del viaje.</span>}
                  </span>
                </div>
              ))}
              <span data-sorteo-cierre style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)', padding: '0 4px' }}>
                Cuentan tu nivel y los viajes que acabes hasta el {fechaEnPalabras(datos.edicion.cierre)}.
              </span>
              {datos.edicion.bases_url && (
                <a
                  href={datos.edicion.bases_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-bases-legales
                  className="zona-toque mt-0.5 flex h-[34px] items-center gap-1 self-center rounded-full bg-[#FFFDF8] px-3 no-underline"
                  style={{ border: '1px solid rgba(111,78,55,.35)', color: '#6F4E37', font: "600 13.5px 'Geist'" }}
                >
                  Bases legales
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {datos && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: 104, background: 'linear-gradient(0deg,#F2ECDC 62%,rgba(242,236,220,0))' }} />
            <div className="absolute flex" style={{ left: 16, right: 16, bottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
              {datos.estado === 'sin_nivel' && (
                <span data-sorteo-boton="sin_nivel" className="flex h-14 flex-1 items-center justify-center gap-3 rounded-[18px] bg-[#1C2230] px-[18px]" style={{ color: '#FFFDF8', font: "600 14.5px 'Geist'" }}>
                  <span className="flex-1">Te faltan {miles(datos.falta_exp)} EXP para el nivel {datos.nivel_minimo}</span>
                  <span aria-hidden="true" className="block h-[6px] w-16 flex-none overflow-hidden rounded-[3px]" style={{ background: 'rgba(255,255,255,.18)' }}>
                    <span className="block h-full" style={{ width: `${Math.round(datos.barra * 100)}%`, background: 'linear-gradient(90deg,#C99A44,#FFF6DC)' }} />
                  </span>
                </span>
              )}
              {datos.estado === 'falta_viaje' && (
                <span data-sorteo-boton="falta_viaje" className="flex h-14 flex-1 items-center justify-center rounded-[18px] bg-[#1C2230] px-[18px] text-center" style={{ color: '#FFFDF8', font: "600 14.5px/1.25 'Geist'" }}>
                  Haz un viaje con HOY activado y entras
                </span>
              )}
              {datos.estado === 'dentro' && (
                <span data-sorteo-boton="dentro" className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-[18px]" style={{ background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#3A2A0A', font: "700 16px 'Geist'", boxShadow: '0 12px 22px -12px rgba(110,80,24,.8),inset 0 1px 0 rgba(255,255,255,.55)' }}>
                  <Visto tam={18} color="#3A2A0A" grosor={3.2} />
                  Estás dentro del sorteo
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Capa>
  )
}
