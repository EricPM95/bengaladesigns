import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ETIQUETA_COMPANIA, ETIQUETA_FRECUENCIA, euros, fechaCorta, hace, lineaDePrimeraVez, pedir, type FichaDeUsuario, type FilaDeUsuario, type ListaDeUsuarios, type TotalesDeUsuarios } from './api'
import { RespuestasDeLaPrimeraVez } from './Inicio'
import { Cifra, Filtro, Pastilla, SERIE, boton, tarjeta, Vacio } from './estilo'

/**
 * (V33, Design P6/P6b/P6c/M3) USUARIOS, lo que más le importa a Eric. LA LISTA, uno a uno: nombre y correo, alta y último acceso, nivel, pase (de qué destinos y de qué tipo), viajes creados y hechos (ya terminados), dinero gastado
 * en pases y lo que contestó en la primera vez. Arriba, el buscador (nombre o correo), los filtros (con o sin pase, destino, cada cuánto viaja, con quién) y el orden. Paginada de 50 en 50: nunca se bajan todos de golpe.
 * LA FICHA: sus viajes, pases, logros, destinos y pasaporte, y sus reportes. Solo administradores y SOLO LECTURA: sin botón de exportar; nunca datos de tarjeta ni contraseñas.
 */
const ORDENES = [
  ['reciente', 'Más reciente'],
  ['acceso', 'Último acceso'],
  ['viajes', 'Más viajes'],
  ['gastado', 'Más gastado'],
] as const

function Fila({ u, abrir, movil }: { u: FilaDeUsuario; abrir: () => void; movil: boolean }): ReactNode {
  const pase = u.pase.tiene ? u.pase.destinos.map((d) => `${d.destino} · ${d.tipo}`).join(', ') : 'No'
  return (
    <button type="button" data-usuario={u.id} onClick={abrir} style={{ display: 'grid', gridTemplateColumns: movil ? '1fr auto' : '1.5fr .8fr .5fr 1.3fr .7fr .7fr 1.5fr', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', textAlign: 'left', cursor: 'pointer', font: "400 13px 'Geist'" }}>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ font: "600 14px 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre || 'Sin nombre'}</span>
        <span style={{ color: 'rgba(28,34,48,.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email ?? 'sin correo'}</span>
        {movil && <span style={{ color: 'rgba(28,34,48,.55)' }}>{`Alta ${fechaCorta(u.alta)} · ${hace(u.ultimo_acceso)} · nivel ${u.nivel} · ${u.viajes.creados} · ${u.viajes.hechos} viajes · ${euros(u.gastado_cent, u.moneda)}`}</span>}
        {movil && <span style={{ color: 'rgba(28,34,48,.55)' }}>{`Pase: ${pase} · ${lineaDePrimeraVez(u.primera_vez)}`}</span>}
      </span>
      {movil ? (
        <Pastilla fondo={u.pase.tiene ? '#FBEFC8' : '#F1EADC'} color={u.pase.tiene ? '#8A6210' : 'rgba(28,34,48,.6)'}>{u.pase.tiene ? 'Con pase' : 'Sin pase'}</Pastilla>
      ) : (
        <>
          <span style={{ display: 'flex', flexDirection: 'column' }}><span>{fechaCorta(u.alta)}</span><span style={{ color: 'rgba(28,34,48,.5)' }}>{hace(u.ultimo_acceso)}</span></span>
          <span>{u.nivel}</span>
          <span>{pase}</span>
          <span data-viajes>{u.viajes.creados} · {u.viajes.hechos}</span>
          <span style={{ fontWeight: 600 }}>{euros(u.gastado_cent, u.moneda)}</span>
          <span data-primera-vez style={{ color: 'rgba(28,34,48,.7)' }}>{lineaDePrimeraVez(u.primera_vez)}</span>
        </>
      )}
    </button>
  )
}

function Ficha({ id, volver, movil }: { id: string; volver: () => void; movil: boolean }): ReactNode {
  const [f, setF] = useState<FichaDeUsuario | null | undefined>(undefined)
  useEffect(() => {
    void pedir<FichaDeUsuario>(`/api/admin/usuarios/${encodeURIComponent(id)}`).then((r) => setF(r && r.ok ? r : null))
  }, [id])
  const pill = (t: string, fondo = '#F1EADC', color = '#1C2230') => <Pastilla key={t} fondo={fondo} color={color}>{t}</Pastilla>
  return (
    <div data-ficha-de-usuario={id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><button type="button" data-volver-lista onClick={volver} style={boton()}>‹ Volver a la lista</button></div>
      {f === undefined && <p>Cargando…</p>}
      {f === null && <Vacio>No se ha podido abrir esta ficha.</Vacio>}
      {f && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ font: `400 34px/1 ${SERIE}` }}>{f.usuario.nombre || 'Sin nombre'}</span>
            <span style={{ font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{f.usuario.email ?? 'sin correo'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(6,minmax(0,1fr))', gap: 10 }}>
            <Cifra etiqueta="Alta" valor={fechaCorta(f.usuario.alta)} chica />
            <Cifra etiqueta="Último acceso" valor={hace(f.usuario.ultimo_acceso)} chica />
            <Cifra etiqueta="Viajes" valor={`${f.usuario.viajes.creados} · ${f.usuario.viajes.hechos}`} pie="creados · hechos" chica />
            <Cifra etiqueta="Gastado" valor={euros(f.usuario.gastado_cent, f.usuario.moneda)} chica />
            <Cifra etiqueta="Pase" valor={f.usuario.pase.tiene ? 'Sí' : 'No'} pie={f.usuario.pase.destinos.length ? `${f.usuario.pase.destinos.length} destinos` : undefined} chica />
            <Cifra etiqueta="Nivel" valor={f.usuario.nivel} chica />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
            <div style={tarjeta}>
              <span style={{ font: `400 22px ${SERIE}` }}>Sus viajes</span>
              {f.viajes.length === 0 && <Vacio>Ninguno todavía.</Vacio>}
              {f.viajes.map((v, i) => (
                <div key={i} data-ficha-viaje style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)' }}>
                  <span style={{ font: "600 14px 'Geist'", flex: 1 }}>{v.destino}</span>
                  <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{fechaCorta(v.inicio)} – {fechaCorta(v.fin)}</span>
                  {pill(v.grupo === 'grupo' ? `En grupo (${v.miembros})` : 'Solo', v.grupo === 'grupo' ? '#DDEBFA' : '#F1EADC', v.grupo === 'grupo' ? '#1F5CA8' : 'rgba(28,34,48,.6)')}
                </div>
              ))}
            </div>
            <div style={tarjeta}>
              <span style={{ font: `400 22px ${SERIE}` }}>Sus pases</span>
              {f.pases.length === 0 && <Vacio>Sin pases.</Vacio>}
              {f.pases.map((p, i) => (
                <div key={i} data-ficha-pase style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px 70px', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)', font: "400 13px 'Geist'" }}>
                  <span style={{ color: 'rgba(28,34,48,.55)' }}>{fechaCorta(p.fecha)}</span><span>{p.destino}</span><span>{p.tipo}</span><span style={{ textAlign: 'right', fontWeight: 600 }}>{euros(p.importe_cent, p.moneda)}</span>
                </div>
              ))}
            </div>
            <div style={tarjeta}>
              <span style={{ font: `400 22px ${SERIE}` }}>Logros, destinos y pasaporte</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {f.logros.sellos.map((s) => pill(`Sello de ${s.grado} · ${s.nombre}`, '#FBEFC8', '#8A6210'))}
                {pill(`${f.logros.colecciones.hechas} de ${f.logros.colecciones.total} colecciones`)}
                {f.logros.paises.map((p) => pill(p, '#DCEBDD', '#2F6B43'))}
                {f.logros.destinos.map((d) => pill(d, '#F7F1E4'))}
                {f.logros.sellos.length + f.logros.paises.length + f.logros.destinos.length === 0 && <Vacio>Aún sin logros.</Vacio>}
              </div>
            </div>
            <div style={tarjeta}>
              <span style={{ font: `400 22px ${SERIE}` }}>Reportes que ha mandado</span>
              {f.reportes.length === 0 && <Vacio>Ninguno.</Vacio>}
              {f.reportes.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}><span style={{ flex: 1, font: "400 13px 'Geist'" }}>{r.titulo}</span>{pill(r.estado)}</div>
              ))}
            </div>
          </div>
          <p style={{ margin: 0, font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.5)' }}>Primera vez: {lineaDePrimeraVez(f.usuario.primera_vez)}. Ficha de solo lectura: sin exportar, sin datos de tarjeta.</p>
        </>
      )}
    </div>
  )
}

export function Usuarios({ movil }: { movil: boolean }): ReactNode {
  const [q, setQ] = useState('')
  const [pase, setPase] = useState('')
  const [destino, setDestino] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [compania, setCompania] = useState('')
  const [orden, setOrden] = useState<string>('reciente')
  const [pagina, setPagina] = useState(1)
  const [lista, setLista] = useState<ListaDeUsuarios | null>(null)
  const [totales, setTotales] = useState<TotalesDeUsuarios | null>(null)
  const [ficha, setFicha] = useState<string | null>(null)
  const peticion = useRef(0)
  const cargar = useCallback(async () => {
    const n = ++peticion.current
    const p = new URLSearchParams({ orden, pagina: String(pagina) })
    if (q.trim()) p.set('q', q.trim())
    if (pase) p.set('pase', pase)
    if (destino.trim()) p.set('destino', destino.trim())
    if (frecuencia) p.set('frecuencia', frecuencia)
    if (compania) p.set('compania', compania)
    const r = await pedir<ListaDeUsuarios>(`/api/admin/usuarios?${p.toString()}`)
    if (n === peticion.current) setLista(r)
  }, [q, pase, destino, frecuencia, compania, orden, pagina])
  // El buscador espera un instante a que termines de escribir: no se pide a cada letra.
  useEffect(() => {
    const t = window.setTimeout(() => void cargar(), 250)
    return () => window.clearTimeout(t)
  }, [cargar])
  useEffect(() => {
    void pedir<TotalesDeUsuarios>('/api/admin/usuarios/totales').then(setTotales)
  }, [])
  const cambia = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPagina(1)
  }
  if (ficha) return <Ficha id={ficha} volver={() => setFicha(null)} movil={movil} />
  const paginas = lista ? Math.max(1, Math.ceil(lista.total / lista.por_pagina)) : 1
  const campo = { minHeight: 40, borderRadius: 12, border: '1px solid rgba(28,34,48,.14)', padding: '0 12px', font: "400 13px 'Geist'", background: '#fff' } as const
  return (
    <div data-seccion="usuarios" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {totales && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 12 }}>
            <Cifra etiqueta="Usuarios en total" valor={totales.total.toLocaleString('es-ES')} chica={movil} />
            <Cifra etiqueta="Nuevos esta semana" valor={totales.nuevos_semana.toLocaleString('es-ES')} chica={movil} />
            <Cifra etiqueta="Con viaje creado" valor={totales.con_viaje.toLocaleString('es-ES')} chica={movil} />
          </div>
          <RespuestasDeLaPrimeraVez t={totales} />
        </>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input data-buscador-usuarios value={q} onChange={(e) => cambia(setQ)(e.target.value)} placeholder="Buscar por nombre o correo" aria-label="Buscar por nombre o correo" style={{ ...campo, flex: '1 1 220px' }} />
        <Filtro dato="pase-todos" activo={pase === ''} onClick={() => cambia(setPase)('')}>Todos</Filtro>
        <Filtro dato="pase-si" activo={pase === 'si'} onClick={() => cambia(setPase)('si')}>Con pase</Filtro>
        <Filtro dato="pase-no" activo={pase === 'no'} onClick={() => cambia(setPase)('no')}>Sin pase</Filtro>
        <input value={destino} onChange={(e) => cambia(setDestino)(e.target.value)} placeholder="Destino" aria-label="Destino" style={{ ...campo, width: 120 }} />
        <select value={frecuencia} onChange={(e) => cambia(setFrecuencia)(e.target.value)} aria-label="Cada cuánto viaja" style={campo}>
          <option value="">Cada cuánto viaja</option>
          {Object.entries(ETIQUETA_FRECUENCIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={compania} onChange={(e) => cambia(setCompania)(e.target.value)} aria-label="Con quién viaja" style={campo}>
          <option value="">Con quién viaja</option>
          {Object.entries(ETIQUETA_COMPANIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={orden} onChange={(e) => cambia(setOrden)(e.target.value)} aria-label="Ordenar por" style={campo}>
          {ORDENES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {!movil && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr .5fr 1.3fr .7fr .7fr 1.5fr', gap: 10, padding: '0 14px', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', color: 'rgba(28,34,48,.5)' }}>
          <span>USUARIO</span><span>ALTA · ACCESO</span><span>NIVEL</span><span>PASE</span><span>VIAJES</span><span>GASTADO</span><span>PRIMERA VEZ</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!lista && <p>Cargando…</p>}
        {lista?.usuarios.length === 0 && <Vacio>No hay usuarios con esos filtros.</Vacio>}
        {lista?.usuarios.map((u) => <Fila key={u.id} u={u} abrir={() => setFicha(u.id)} movil={movil} />)}
      </div>
      {lista && (
        <div data-paginacion style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <button type="button" data-pagina-anterior disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} style={boton(false, pagina <= 1)}>‹ Anterior</button>
          <span data-pagina-actual style={{ font: "500 13px 'Geist'" }}>Página {lista.pagina} de {paginas} · {lista.total.toLocaleString('es-ES')} usuarios</span>
          <button type="button" data-pagina-siguiente disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)} style={boton(false, pagina >= paginas)}>Siguiente ›</button>
        </div>
      )}
    </div>
  )
}
