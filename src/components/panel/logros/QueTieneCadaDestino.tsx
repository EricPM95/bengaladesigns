import { useEffect, useState, type ReactNode } from 'react'
import { Emblema, Insignia, Sello } from '../../logros/dibujos'
import { pedir } from '../api'
import { Bandera } from '../banderas'
import { Cargando, DORADO_OSCURO, PastillaDeEstado, ROSA, ROSA_BORDE, ROSA_FONDO, SERIE, mono10, num, tarjetaBlanca, titulo14, type FilaDeDestino, type PaginaDeDestino } from './comun'

/**
 * (V35A, Design P7d / P7e / M7b / M7c) «QUÉ TIENE CADA DESTINO»: la tabla de los 14 destinos (los 11 del lanzamiento y los 3 de «Próximamente») y, al tocar uno que ya tiene datos, su página («Roma por dentro»).
 * Todos los números salen de los mismos archivos que usan los logros (data/logros/<destino>.json) y de data/primera_vez/destinos.json; lo que no existe todavía sale «—».
 */
export function QueTieneCadaDestino({ movil, abrir }: { movil: boolean; abrir?: string | null }): ReactNode {
  const [filas, setFilas] = useState<FilaDeDestino[] | null | undefined>(undefined)
  const [clave, setClave] = useState<string | null>(abrir ?? null)
  useEffect(() => {
    let vivo = true
    void pedir<{ ok: boolean; destinos: FilaDeDestino[] }>('/api/admin/logros-panel/destinos').then((x) => vivo && setFilas(x && x.ok ? x.destinos : null))
    return () => {
      vivo = false
    }
  }, [])
  if (clave) return <PaginaDelDestino clave={clave} movil={movil} volver={() => setClave(null)} />
  const rejilla = movil ? 'minmax(0,1.6fr) repeat(6,minmax(0,.6fr)) minmax(0,1.35fr)' : '1.5fr .7fr .8fr .8fr .8fr 1fr .8fr 1.3fr'
  const cab = movil ? ['SITIOS', 'MEDAL.', 'COLEC.', 'EMBL.', 'MARAV.', 'DÍAS'] : ['SITIOS', 'MEDALLAS', 'COLECC.', 'EMBLEMAS', 'MARAVILLAS', 'DÍAS RUTA']
  return (
    <Cargando datos={filas}>
      {filas && (
        <>
          <div>
            <div data-tabla-destinos style={{ borderRadius: 22, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: rejilla, gap: movil ? 3 : 8, padding: movil ? '10px 8px' : '12px 18px', background: '#F7F1E4', font: `600 ${movil ? 7 : 10}px 'Geist Mono',monospace`, letterSpacing: movil ? 0 : '.08em', color: 'rgba(28,34,48,.55)' }}>
                <span>DESTINO</span>
                {cab.map((c) => <span key={c} style={{ textAlign: 'center' }}>{c}</span>)}
                <span>ESTADO</span>
              </div>
              {filas.map((x) => {
                const abierta = x.con_datos
                const celda = (v: number | null, k?: string) => <span key={k} style={{ textAlign: 'center', color: k && x.flojas.includes(k) ? ROSA : undefined, fontWeight: k && x.flojas.includes(k) ? 700 : 500 }}>{num(v)}</span>
                return (
                  <div key={x.clave} data-destino-fila={x.clave} data-estado={x.estado} role={abierta ? 'button' : undefined} tabIndex={abierta ? 0 : undefined} onClick={abierta ? () => setClave(x.clave) : undefined} onKeyDown={abierta ? (e) => { if (e.key === 'Enter') setClave(x.clave) } : undefined} style={{ display: 'grid', gridTemplateColumns: rejilla, gap: movil ? 3 : 8, alignItems: 'center', padding: movil ? '10px 8px' : '12px 18px', borderTop: '1px solid rgba(28,34,48,.06)', background: x.estado === 'publicado' || x.estado === 'oculto' ? '#FFFFFF' : '#FBF6EA', font: `500 ${movil ? 12 : 13.5}px 'Geist'`, cursor: abierta ? 'pointer' : 'default' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: movil ? 5 : 10, fontWeight: 700, minWidth: 0 }}>
                      <Bandera iso={x.iso ?? x.nombre} tam={movil ? 11 : 18} />
                      <span>{x.nombre}</span>
                    </span>
                    {celda(x.sitios)}
                    {celda(x.medallas, 'medallas')}
                    {celda(x.colecciones, 'colecciones')}
                    {celda(x.emblemas, 'emblemas')}
                    {celda(x.maravillas)}
                    {celda(x.dias_ruta)}
                    <span style={{ minWidth: 0 }}><PastillaDeEstado estado={x.estado} chica={movil} /></span>
                  </div>
                )
              })}
            </div>
          </div>
          <span style={{ font: "400 12.5px/1.45 'Geist'", color: 'rgba(28,34,48,.55)' }}>
            Toca una fila para abrir el destino (los que ya tienen datos). En rosa suave, lo que va más flojo. «—» es que todavía no hay datos. «Solo administradores» es un destino que ya está hecho pero oculto: solo lo ven los administradores en la app.
          </span>
        </>
      )}
    </Cargando>
  )
}

const GRADO_ES: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', diamante: 'Diamante' }

function PaginaDelDestino({ clave, movil, volver }: { clave: string; movil: boolean; volver: () => void }): ReactNode {
  const [p, setP] = useState<PaginaDeDestino | null | undefined>(undefined)
  useEffect(() => {
    let vivo = true
    void pedir<PaginaDeDestino>(`/api/admin/logros-panel/destino/${encodeURIComponent(clave)}`).then((x) => vivo && setP(x && x.ok ? x : null))
    return () => {
      vivo = false
    }
  }, [clave])
  const chips: [string, string][] = p ? [[num(p.numeros.sitios), 'sitios'], [num(p.numeros.medallas), 'medallas'], [num(p.numeros.colecciones), 'colecciones'], [num(p.numeros.emblemas), 'emblemas'], [num(p.numeros.maravillas), 'maravillas'], [num(p.numeros.dias_ruta), 'días de ruta']] : []
  return (
    <>
      <button type="button" data-volver-destinos onClick={volver} style={{ alignSelf: 'flex-start', minHeight: 40, padding: '0 14px', borderRadius: 12, border: '1.5px solid rgba(28,34,48,.16)', background: '#FFFFFF', font: "600 13px 'Geist'", cursor: 'pointer' }}>‹ Todos los destinos</button>
      <Cargando datos={p}>
        {p && (
          <div data-destino-pagina={p.clave} style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
            <div style={{ position: 'relative', height: movil ? 190 : 200, borderRadius: 24, overflow: 'hidden', flex: 'none' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#E8B070 0%,#B8602A 50%,#5A2A18 100%)' }} />
              {p.portada && <div data-portada style={{ position: 'absolute', inset: 0, backgroundImage: `url(${p.portada})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(20,24,40,.15),rgba(20,24,40,.65))' }} />
              <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, display: 'flex', flexDirection: 'column', gap: 10, color: '#FFFDF8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Bandera iso={p.iso ?? p.nombre} tam={22} />
                  <span style={{ font: `400 38px/1 ${SERIE}` }}>{p.nombre}</span>
                  <PastillaDeEstado estado={p.estado} />
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {chips.map(([v, l]) => (
                    <span key={l} data-chip={l} style={{ height: 26, padding: '0 11px', borderRadius: 999, background: 'rgba(255,253,248,.18)', display: 'flex', alignItems: 'center', gap: 6, font: "600 12px 'Geist'" }}><b>{v}</b> {l}</span>
                  ))}
                </span>
              </div>
            </div>
            {p.estado === 'oculto' && <p style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: DORADO_OSCURO }}>Este destino está oculto: en la app solo lo ven los administradores.</p>}
            {p.avisos.length > 0 && (
              <div data-avisos-de-datos style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', borderRadius: 16, background: ROSA_FONDO, border: `1px solid ${ROSA_BORDE}` }}>
                <span style={{ font: "700 13px 'Geist'", color: ROSA }}>{p.avisos.length} {p.avisos.length === 1 ? 'cosa' : 'cosas'} por revisar</span>
                {p.avisos.map((a, i) => <span key={i} style={{ font: "400 13px/1.4 'Geist'" }}>· {a}</span>)}
              </div>
            )}
            <section data-bloque="medallas-destino" style={tarjetaBlanca}>
              <span style={titulo14}>Medallas · una por grado</span>
              {p.sellos.map((s) => (
                <div key={s.id} data-sello={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={mono10()}>{s.nombre.toUpperCase()}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 12 }}>
                    {s.grados.map((g) => (
                      <div key={g.grado} data-medalla={`${s.id}:${g.grado}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, background: '#F7F1E4' }}>
                        <span style={{ flex: 'none', width: 78, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sello id={s.id} grado={g.grado} tam={78} animado={false} etiqueta={false} /></span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ font: `400 19px/1.1 ${SERIE}` }}>{g.nombre}</span>
                          <span style={{ font: "600 11.5px 'Geist'", color: DORADO_OSCURO }}>{GRADO_ES[g.grado]} · desde {g.desde} {g.desde === 1 ? 'sitio' : 'sitios'}</span>
                          <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.6)' }}>{g.linea}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
            <section data-bloque="colecciones-destino" style={tarjetaBlanca}>
              <span style={titulo14}>Colecciones · su frase y sus sitios</span>
              {p.colecciones.map((c) => (
                <div key={c.id} data-coleccion={c.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: '1px solid rgba(28,34,48,.06)' }}>
                  <span style={{ flex: 'none', width: 68, height: 68 }}><Insignia coleccion={c.id} completa tam={68} /></span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ font: `400 20px/1.1 ${SERIE}` }}>{c.nombre}</span>
                      <span style={{ font: `italic 400 14px ${SERIE}`, color: DORADO_OSCURO }}>{c.frase}</span>
                    </span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {c.sitios.map((s) => (
                        <span key={s.id} style={{ minHeight: 26, padding: '2px 10px 2px 4px', borderRadius: 999, background: '#F3EBD8', display: 'flex', alignItems: 'center', gap: 6, font: "500 11.5px 'Geist'" }}>
                          <span style={{ flex: 'none', width: 18, height: 18, borderRadius: '50%', background: s.color }} />
                          {s.nombre}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              ))}
            </section>
            <section data-bloque="emblemas-destino" style={{ borderRadius: 22, background: 'radial-gradient(120% 100% at 50% 0%,#2A3050 0%,#1C2230 70%)', border: '1px solid rgba(243,213,154,.3)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ ...mono10('#F3D59A', '.16em') }}>EMBLEMAS · AQUÍ NO VAN OCULTOS</span>
              <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 10 }}>
                {p.emblemas.map((e) => (
                  <div key={e.id} data-emblema={e.id} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 16, background: 'rgba(255,253,248,.06)', border: `1px solid ${e.etiqueta === 'MARAVILLA' ? '#F3D88F' : 'rgba(255,253,248,.1)'}` }}>
                    <span style={{ flex: 'none', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <span style={{ flex: 'none', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(.43)' }}><Emblema id={e.id} tam={150} /></span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                        <span style={{ font: "600 12.5px/1.2 'Geist'", color: '#FFFDF8' }}>{e.nombre}</span>
                        {e.etiqueta && <span style={{ height: 18, padding: '0 7px', borderRadius: 999, background: e.etiqueta === 'MARAVILLA' ? '#F3D88F' : 'rgba(255,253,248,.18)', color: e.etiqueta === 'MARAVILLA' ? '#4A3510' : '#FFFDF8', display: 'flex', alignItems: 'center', font: "700 9.5px 'Geist'" }}>{e.etiqueta}</span>}
                      </span>
                      <span style={{ font: "400 11.5px/1.3 'Geist'", color: 'rgba(255,253,248,.7)' }}>{e.linea}</span>
                      <span style={{ font: "600 11px 'Geist'", color: '#F3D59A' }}>Se gana en: {e.se_gana_en}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
            {p.patrimonios.length > 0 && (
              <section data-bloque="patrimonio" style={tarjetaBlanca}>
                <span style={titulo14}>Patrimonio UNESCO · los que tiene el destino</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {p.patrimonios.map((u) => (
                    <span key={u.nombre} style={{ minHeight: 34, padding: '0 14px', borderRadius: 12, background: '#F3EBD8', display: 'flex', alignItems: 'center', gap: 8, font: "600 12.5px 'Geist'" }}>
                      {u.nombre}
                      <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{u.sitios > 0 ? `${u.sitios} ${u.sitios === 1 ? 'sitio' : 'sitios'}` : 'por comprobar'}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Cargando>
    </>
  )
}
