import { useEffect, useState, type ReactNode } from 'react'
import { Emblema } from '../../logros/dibujos'
import { pedir } from '../api'
import { Cifra } from '../estilo'
import { BanderaDeDestino } from '../banderas'
import { Cargando, DORADO_OSCURO, NOMBRE_PERIODO, SelectorDePeriodo, SERIE, TINTA, ORO, fechasDe, mono10, num, tarjetaBlanca, titulo14, type Periodo, type ResumenDeLogros } from './comun'

/**
 * (V35A, Design P7 / M7) LA PESTAÑA «LOGROS»: cuánta gente tiene cada cosa. Solo números de la base de datos real (la tabla `achievements`): nunca quién, ni las fotos de nadie.
 * Medallas por grado, colecciones (completadas y en curso), los emblemas escondidos con SU dibujo (como en la app), los logros de viajero y el sorteo del año (todo del archivo data/logros/exp.json).
 */
const COLOR_GRADO: Record<string, string> = { bronce: '#C98A5A', plata: '#B8C0CC', oro: '#E4B83A', diamante: '#BFE6FF' }
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaLarga = (iso: string | null): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : ''
}
interface Sorteo { ok: boolean; entran: number; cuentas: number; lista: { user_id: string; exp: number; nivel: number; viajes_con_hoy: number }[] }

export function Logros({ movil }: { movil: boolean }): ReactNode {
  const [periodo, setPeriodo] = useState<Periodo>({ id: 'mes', desde: '', hasta: '' })
  const [destino, setDestino] = useState('')
  const [r, setR] = useState<ResumenDeLogros | null | undefined>(undefined)
  const [sorteo, setSorteo] = useState<Sorteo | null | undefined>(undefined)
  const [lista, setLista] = useState(false)
  const [todosViajero, setTodosViajero] = useState(false)
  const clavePeriodo = `${periodo.id}|${periodo.desde}|${periodo.hasta}`
  useEffect(() => {
    let vivo = true
    const { desde, hasta } = fechasDe(periodo)
    const q = new URLSearchParams()
    if (destino) q.set('destino', destino)
    if (desde) q.set('desde', desde)
    if (hasta) q.set('hasta', hasta)
    void pedir<ResumenDeLogros>(`/api/admin/logros-panel/resumen?${q.toString()}`).then((x) => vivo && setR(x && x.ok ? x : null))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clavePeriodo, destino])
  useEffect(() => {
    let vivo = true
    void pedir<Sorteo>('/api/admin/logros/sorteo').then((x) => vivo && setSorteo(x && x.ok ? x : null))
    return () => {
      vivo = false
    }
  }, [])
  const maxMedallas = Math.max(1, ...(r?.medallas ?? []).map((m) => m.personas))
  const maxViajero = Math.max(1, ...(r?.viajero ?? []).map((m) => m.personas))
  const nombreDestino = r?.destinos.find((d) => d.clave === r.destino)?.nombre ?? ''
  const viajero = (r?.viajero ?? []).filter((v) => todosViajero || v.personas > 0).slice(0, todosViajero ? 500 : 12)
  const cols = movil ? '1fr 62px 50px' : '1fr 110px 90px'
  const s = r?.sorteo
  const entran = sorteo?.entran
  return (
    <>
      <SelectorDePeriodo periodo={periodo} alCambiar={setPeriodo} movil={movil} />
      <Cargando datos={r}>
        {r && (
          <>
            <div data-logros-cifras style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 12 }}>
              <Cifra etiqueta="Logros ganados" valor={num(r.logros_ganados)} pie={NOMBRE_PERIODO[periodo.id]} chica={movil} />
              <Cifra etiqueta="Personas con algún logro" valor={num(r.personas)} pie={r.cuentas === null ? '—' : `De ${num(r.cuentas)} cuentas`} chica={movil} />
              <Cifra etiqueta="El más ganado" valor={r.mas_ganado ? r.mas_ganado.nombre : '—'} pie={r.mas_ganado ? `${num(r.mas_ganado.personas)} ${r.mas_ganado.personas === 1 ? 'persona' : 'personas'}` : 'Nadie ha ganado nada en este periodo'} oscura chica={movil} />
            </div>
            {r.truncado && <p style={{ margin: 0, font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Hay muchísimos logros: se han contado solo los 100.000 primeros.</p>}

            <div data-selector-destino style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={mono10()}>DESTINO</span>
              {r.destinos.map((d) => {
                const on = d.clave === r.destino
                return (
                  <button key={d.clave} type="button" data-destino-logros={d.clave} aria-pressed={on} onClick={() => setDestino(d.clave)} style={{ minHeight: 38, padding: '0 14px', borderRadius: 12, cursor: 'pointer', background: on ? TINTA : '#FFFFFF', color: on ? ORO : TINTA, border: `1.5px solid ${on ? TINTA : 'rgba(28,34,48,.14)'}`, display: 'flex', alignItems: 'center', gap: 8, font: "600 13px 'Geist'" }}>
                    <BanderaDeDestino destino={d.nombre} tam={15} />
                    {d.nombre}
                  </button>
                )
              })}
            </div>

            <section data-bloque="medallas" style={tarjetaBlanca}>
              <span style={titulo14}>Medallas · cuántas personas tiene cada una</span>
              {r.medallas.map((m) => (
                <div key={m.grado} data-medalla-grado={m.grado} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 'none', width: movil ? 72 : 90, font: "600 13px 'Geist'" }}>{m.nombre}</span>
                  <span style={{ flex: 1, height: 14, borderRadius: 14, background: '#F1EADC', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.round((m.personas / maxMedallas) * 100)}%`, borderRadius: 14, background: COLOR_GRADO[m.grado] }} />
                  </span>
                  <b style={{ width: 36, textAlign: 'right', font: "700 13.5px 'Geist'" }}>{num(m.personas)}</b>
                </div>
              ))}
            </section>

            <section data-bloque="colecciones" style={tarjetaBlanca}>
              <span style={titulo14}>Colecciones de {nombreDestino}</span>
              <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px 12px', font: "500 10px 'Geist Mono',monospace", letterSpacing: '.1em', color: 'rgba(28,34,48,.5)' }}>
                <span>COLECCIÓN</span>
                <span style={{ textAlign: 'right' }}>COMPLETADAS</span>
                <span style={{ textAlign: 'right' }}>EN CURSO</span>
              </div>
              {r.colecciones.map((c) => (
                <div key={c.id} data-coleccion-fila={c.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px 12px', alignItems: 'center', padding: '9px 0', borderTop: '1px solid rgba(28,34,48,.06)', font: "500 13px/1.25 'Geist'" }}>
                  <span>{c.nombre} <span style={{ color: 'rgba(28,34,48,.45)' }}>· {c.sitios} sitios</span></span>
                  <b style={{ textAlign: 'right', color: '#2F6B43' }}>{num(c.completadas)}</b>
                  <b style={{ textAlign: 'right', color: DORADO_OSCURO }}>{num(c.en_curso)}</b>
                </div>
              ))}
            </section>

            <section data-bloque="emblemas" style={{ borderRadius: 22, background: 'radial-gradient(120% 100% at 50% 0%,#2A3050 0%,#1C2230 70%)', border: '1px solid rgba(243,213,154,.3)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ ...mono10('#F3D59A', '.16em'), textTransform: 'uppercase' }}>Emblemas ocultos de {nombreDestino} · cuántas personas los han encontrado (desde siempre)</span>
              <div style={{ display: 'grid', gridTemplateColumns: movil ? 'repeat(3,minmax(0,1fr))' : 'repeat(6,minmax(0,1fr))', gap: 10 }}>
                {r.emblemas.map((e) => {
                  const cero = e.personas === 0
                  return (
                    <div key={e.id} data-emblema-logros={e.id} data-personas={e.personas} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 16, background: cero ? 'rgba(243,213,154,.08)' : 'rgba(255,253,248,.06)', border: `1px solid ${cero ? 'rgba(243,213,154,.45)' : 'rgba(255,253,248,.1)'}`, textAlign: 'center' }}>
                      <DibujoDeEmblema id={e.id} />
                      <span style={{ font: "600 11.5px/1.2 'Geist'", color: '#FFFDF8', minHeight: 28 }}>{e.nombre}</span>
                      <b style={{ font: "700 15px 'Geist'", color: cero ? ORO : '#FFFDF8' }}>{num(e.personas)}</b>
                      {cero && <span style={{ font: "400 10.5px/1.25 'Geist'", color: 'rgba(243,213,154,.8)' }}>Nadie todavía · ¿demasiado escondido?</span>}
                    </div>
                  )
                })}
              </div>
            </section>

            <section data-bloque="viajero" style={tarjetaBlanca}>
              <span style={titulo14}>Logros de viajero · de todos los destinos</span>
              {viajero.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Nadie ha ganado ninguno en este periodo.</span>}
              {viajero.map((v) => (
                <div key={v.id} data-viajero-fila style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 'none', width: movil ? 104 : 180, font: "500 13px 'Geist'" }}>{v.nombre}</span>
                  <span style={{ flex: 1, height: 10, borderRadius: 10, background: '#F1EADC', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.round((v.personas / maxViajero) * 100)}%`, background: 'linear-gradient(90deg,#E4C36E,#C99A44)' }} />
                  </span>
                  <b style={{ width: 36, textAlign: 'right', font: "700 13px 'Geist'" }}>{num(v.personas)}</b>
                </div>
              ))}
              <button type="button" data-viajero-todos onClick={() => setTodosViajero((x) => !x)} style={{ alignSelf: 'flex-start', minHeight: 40, padding: '0 14px', borderRadius: 12, border: '1.5px solid rgba(28,34,48,.16)', background: '#FFFFFF', font: "600 13px 'Geist'", cursor: 'pointer' }}>{todosViajero ? 'Ver solo los que alguien ha ganado' : 'Ver todos, también los que nadie tiene'}</button>
            </section>

            <section data-bloque="sorteo" style={{ borderRadius: 22, background: '#FBF3E2', border: '1.5px solid #D8BE84', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={mono10(DORADO_OSCURO, '.16em')}>EL SORTEO DEL AÑO</span>
              <span data-sorteo-titulo style={{ font: `400 26px/1.1 ${SERIE}`, textWrap: 'balance' }}>
                {entran === undefined ? 'Cargando…' : entran === null || entran === undefined ? '—' : `${num(entran)} ${entran === 1 ? 'persona entra' : 'personas entran'}`}
                {s?.cierre ? ` · cierra el ${fechaLarga(s.cierre)}` : ''}
              </span>
              <span data-sorteo-premio style={{ font: "500 13.5px 'Geist'" }}>{s?.premio ? `Premio: ${s.premio}` : 'Premio: sin decidir'}</span>
              <span data-sorteo-regla style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.65)' }}>
                {s?.nivel_minimo ? `Nivel ${s.nivel_minimo} o más` : 'Sin nivel mínimo puesto'} y {s?.viajes_con_hoy_minimos ? (s.viajes_con_hoy_minimos === 1 ? 'un viaje acabado' : `${s.viajes_con_hoy_minimos} viajes acabados`) : 'un viaje acabado'} usando HOY la mitad de los días.
              </span>
              <button type="button" data-sorteo-ver aria-expanded={lista} onClick={() => setLista((x) => !x)} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: TINTA, color: ORO, font: "700 13.5px 'Geist'", cursor: 'pointer' }}>{lista ? 'Ocultar la lista' : 'Ver quién entra'}</button>
              {lista && (
                <ul data-sorteo-lista style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(sorteo?.lista ?? []).length === 0 && <li style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Todavía no entra nadie.</li>}
                  {(sorteo?.lista ?? []).map((x) => (
                    <li key={x.user_id} style={{ font: "500 13px 'Geist'" }}>
                      <a href={`/admin/usuarios?ficha=${encodeURIComponent(x.user_id)}`} data-sorteo-ficha={x.user_id} style={{ color: TINTA, fontWeight: 700 }}>Persona {x.user_id.slice(0, 8)}</a>
                      <span style={{ color: 'rgba(28,34,48,.6)' }}> · nivel {x.nivel} · {num(x.exp)} EXP · {x.viajes_con_hoy} {x.viajes_con_hoy === 1 ? 'viaje' : 'viajes'} con HOY</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </Cargando>
    </>
  )
}

/** El dibujo del emblema, el mismo que ve la gente en la app (solo para administradores: los escondidos se enseñan aquí tal cual). Cabe en un cuadro de 56 px. */
function DibujoDeEmblema({ id }: { id: string }): ReactNode {
  return (
    <span data-emblema-dibujo={id} style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <span style={{ flex: 'none', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(.43)', transformOrigin: 'center' }}>
        <Emblema id={id} tam={150} />
      </span>
    </span>
  )
}
