import { useState, type ReactNode } from 'react'
import { euros, type HuecoDeCalendario, type OpcionDeRespuesta, type UsuariosResumen } from '../api'
import { Bandera } from '../banderas'
import { SERIE } from '../estilo'
import { Cuadro, MONO, ORO_BARRA, Pronto, Titulo, numero } from './piezas'

/**
 * (V35A, Design P6 / M3) LA PARTE DE ARRIBA DE «USUARIOS», todos los bloques de Design en su orden: tres tarjetas, el embudo, actividad y viajando ahora, el calendario de viajes (6 meses, por mes y por semana),
 * quiénes son (lo que contestaron), dónde viven (Pronto) y desde dónde viajan, niveles y cómo entran (aparato y dónde la usan: Pronto). Todo son datos reales; lo que aún no se puede saber lo dice con «Pronto» o «—».
 */
const tarjeta = (dato: string, etiqueta: string, valor: ReactNode, pie: string): ReactNode => (
  <div data-cifra={dato} style={{ padding: 16, borderRadius: 20, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
    <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>{etiqueta}</span>
    <span style={{ font: `400 36px/1 ${SERIE}` }}>{valor}</span>
    <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{pie}</span>
  </div>
)

function Embudo({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  return (
    <Cuadro dato="embudo">
      <Titulo>El embudo · dónde se pierde la gente</Titulo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {r.embudo.map((f, i) => (
          <div key={f.id} data-embudo={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {f.pasa_pct !== null && <span data-pasa style={{ paddingLeft: movil ? 104 : 162, font: "600 11.5px 'Geist'", color: '#8A6A2C' }}>↓ {f.pasa_pct} % pasa al siguiente</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: movil ? 92 : 150, flex: 'none', font: "500 13px 'Geist'" }}>{f.etiqueta}</span>
              <span style={{ flex: 1, height: 30, borderRadius: 10, background: '#F1EADC', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${f.ancho}%`, minWidth: f.n > 0 ? 6 : 0, borderRadius: 10, background: i === 0 ? '#C9BFA8' : ORO_BARRA }} />
              </span>
              <b data-valor style={{ width: 52, textAlign: 'right', font: "700 14px 'Geist'" }}>{numero(f.n)}</b>
            </div>
          </div>
        ))}
      </div>
    </Cuadro>
  )
}

function ActividadYViajando({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  const tile = (v: string, l: string) => (
    <div style={{ padding: 12, borderRadius: 16, background: '#F7F1E4', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ font: `400 28px/1 ${SERIE}` }}>{v}</span>
      <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{l}</span>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14 }}>
      <Cuadro dato="actividad">
        <Titulo>Actividad</Titulo>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <span data-actividad="dia">{tile(numero(r.actividad.dia), 'Al día')}</span>
          <span data-actividad="semana">{tile(numero(r.actividad.semana), 'A la semana')}</span>
          <span data-actividad="mes">{tile(numero(r.actividad.mes), 'Al mes')}</span>
        </div>
        <div data-retencion style={{ padding: 14, borderRadius: 16, background: '#1C2230', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span data-retencion-valor style={{ font: `400 40px/1 ${SERIE}`, color: '#F3D88F' }}>{r.actividad.retencion_pct === null ? '—' : `${r.actividad.retencion_pct} %`}</span>
          <span style={{ flex: 1, font: "400 12.5px/1.4 'Geist'", color: 'rgba(255,253,248,.75)' }}>
            De los que entraron una semana, volvieron la siguiente.
            {!r.actividad.de_uso && <> <b data-pronto style={{ color: '#F3D88F' }}>Pronto</b>: todavía no se guarda cada día de uso.</>}
            {r.actividad.de_uso && r.actividad.retencion_pct !== null && ` (${r.actividad.retencion_vuelven} de ${r.actividad.retencion_base})`}
            {r.actividad.de_uso && r.actividad.retencion_pct === null && ' Aún no hay una semana anterior con gente.'}
          </span>
        </div>
      </Cuadro>
      <Cuadro dato="viajando">
        <Titulo>Viajando ahora</Titulo>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div data-viajando="hoy" style={{ padding: 12, borderRadius: 16, background: '#F7F1E4' }}>
            <span style={{ font: `400 28px/1 ${SERIE}` }}>{numero(r.viajando.hoy)}</span>
            <span style={{ display: 'block', font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>De viaje hoy, con HOY abierto</span>
          </div>
          <div data-viajando="30" style={{ padding: 12, borderRadius: 16, background: '#F7F1E4' }}>
            <span style={{ font: `400 28px/1 ${SERIE}` }}>{numero(r.viajando.proximos30)}</span>
            <span style={{ display: 'block', font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Viajan en los próximos 30 días</span>
          </div>
        </div>
        {r.viajando.destinos.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Nadie viaja en los próximos 30 días.</span>}
        {r.viajando.destinos.map((d) => (
          <div key={d.clave} data-viajando-destino={d.destino} style={{ display: 'flex', alignItems: 'center', gap: 10, font: "500 13px 'Geist'" }}>
            <Bandera iso={d.iso ?? d.destino} tam={16} />
            <span style={{ flex: 1 }}>{d.destino}</span>
            <span style={{ color: 'rgba(28,34,48,.55)' }}>hoy <b style={{ color: '#1C2230' }}>{d.hoy}</b></span>
            <span style={{ color: 'rgba(28,34,48,.55)' }}>30 días <b style={{ color: '#1C2230' }}>{d.en30}</b></span>
          </div>
        ))}
      </Cuadro>
    </div>
  )
}

function Calendario({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  const [modo, setModo] = useState<'mes' | 'semana'>('mes')
  const huecos: HuecoDeCalendario[] = modo === 'mes' ? r.calendario.meses : r.calendario.semanas
  const max = Math.max(1, ...huecos.map((h) => h.total))
  const hayDatos = huecos.some((h) => h.total > 0)
  const gap = modo === 'mes' ? (movil ? 8 : 14) : 3
  const alto = movil ? 120 : 150
  const maxTotal = Math.max(...huecos.map((h) => h.total))
  const interruptor = (id: 'mes' | 'semana', texto: string) => (
    <button type="button" data-calendario-modo={id} aria-pressed={modo === id} onClick={() => setModo(id)} style={{ minHeight: 28, padding: '0 12px', borderRadius: 999, border: 'none', background: modo === id ? '#1C2230' : 'transparent', color: modo === id ? '#F3D88F' : 'rgba(28,34,48,.65)', font: "600 12px 'Geist'", cursor: 'pointer' }}>{texto}</button>
  )
  return (
    <Cuadro dato="calendario">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <Titulo>Calendario de viajes · próximos 6 meses</Titulo>
        <span style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 999, background: '#EDE3CD' }}>{interruptor('mes', 'Por mes')}{interruptor('semana', 'Por semana')}</span>
      </div>
      <div data-calendario-leyenda style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {r.calendario.leyenda.map((l) => (
          <span key={l.clave} data-leyenda={l.destino} style={{ display: 'flex', alignItems: 'center', gap: 6, font: "500 12px 'Geist'" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: l.color }} />
            {l.destino}
          </span>
        ))}
      </div>
      <div style={{ height: alto + 20, display: 'flex', alignItems: 'flex-end', gap: gap }}>
        {huecos.map((h) => {
          const fuerte = modo === 'mes' ? h.clave === r.calendario.mes_fuerte : h.total === maxTotal && h.total > 0
          return (
            <span key={h.clave} data-hueco={h.clave} data-total={h.total} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
              {(modo === 'mes' || fuerte) && <b style={{ font: `700 ${modo === 'mes' ? 12 : 10}px 'Geist'`, color: fuerte ? '#8A6A2C' : '#1C2230' }}>{h.total}</b>}
              <span style={{ width: '100%', height: Math.round((h.total / max) * alto), minHeight: h.total > 0 ? 3 : 0, display: 'flex', flexDirection: 'column-reverse', borderRadius: modo === 'mes' ? 8 : 3, overflow: 'hidden', boxShadow: fuerte && modo === 'mes' ? '0 0 0 2px #F3D88F' : 'none' }}>
                {h.segmentos.map((s) => <span key={s.clave} data-segmento={s.destino} title={`${s.destino}: ${s.n}`} style={{ display: 'block', width: '100%', height: `${(s.n / h.total) * 100}%`, background: s.color }} />)}
              </span>
            </span>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: gap, font: `500 ${modo === 'mes' ? 11.5 : 9.5}px ${MONO}`, color: 'rgba(28,34,48,.55)' }}>
        {huecos.map((h, i) => <span key={h.clave} style={{ flex: 1, minWidth: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'visible' }}>{modo === 'mes' || i % 4 === 0 ? h.nombre : ''}</span>)}
      </div>
      <span data-calendario-frase style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>{hayDatos ? r.calendario.frase : 'Todavía no hay viajes en los próximos 6 meses.'}</span>
    </Cuadro>
  )
}

const TITULOS_RESPUESTAS = [['frecuencia', '¿Cada cuánto viajas?'], ['compania', '¿Con quién viajas?'], ['edad', 'Edad por tramos']] as const
function Quienes({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  return (
    <Cuadro dato="quienes">
      <Titulo>Quiénes son · lo que contestaron en la primera vez</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 16 }}>
        {TITULOS_RESPUESTAS.map(([id, titulo]) => {
          const filas: OpcionDeRespuesta[] = r.quienes[id]
          return (
            <div key={id} data-pregunta={id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ font: "600 13px 'Geist'", color: '#8A6A2C' }}>{titulo}</span>
              {filas.length === 0 && <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía nadie lo ha contestado.</span>}
              {filas.map((q) => (
                <div key={q.valor} data-opcion={q.nombre} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', font: "500 12.5px 'Geist'" }}><span>{q.nombre}</span><b>{q.pct} %</b></span>
                  <span style={{ height: 8, borderRadius: 8, background: '#F1EADC', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${q.pct}%`, background: ORO_BARRA }} /></span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Cuadro>
  )
}

function DesdeDonde({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  const fila = (iso: string | null, nombre: string, n: number) => (
    <span key={`${iso}${nombre}`} style={{ display: 'flex', alignItems: 'center', gap: 9, font: "500 13px 'Geist'" }}>
      <Bandera iso={iso ?? nombre} tam={16} />
      <span style={{ flex: 1, minWidth: 0 }}>{nombre}</span>
      <b>{n}</b>
    </span>
  )
  const etiqueta = (t: string) => <span style={{ font: `600 10px ${MONO}`, letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>{t}</span>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14 }}>
      <Cuadro dato="donde-viven">
        <Titulo>Dónde viven</Titulo>
        {r.donde_viven === null ? (
          <Pronto>Todavía no se guarda en qué país vive cada persona.</Pronto>
        ) : r.donde_viven.paises.length === 0 ? (
          <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía nadie ha dicho en qué país vive.</span>
        ) : (
          <div data-lista="paises-viven" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {etiqueta('PAÍSES')}
            {r.donde_viven.paises.slice(0, 8).map((p) => <span key={p.iso} data-vive={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 9, font: "500 13px 'Geist'" }}><Bandera iso={p.iso} tam={16} /><span style={{ flex: 1, minWidth: 0 }}>{p.nombre}</span><b>{p.n}</b><span style={{ color: 'rgba(28,34,48,.5)', width: 40, textAlign: 'right' }}>{p.pct} %</span></span>)}
          </div>
        )}
      </Cuadro>
      <Cuadro dato="desde-donde">
        <Titulo>Desde dónde viajan</Titulo>
        {r.desde_donde.paises.length + r.desde_donde.ciudades.length === 0 ? (
          <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía no hay viajes con origen.</span>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <div data-lista="paises" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>{etiqueta('PAÍSES')}{r.desde_donde.paises.slice(0, 6).map((p) => fila(p.iso, p.nombre, p.n))}</div>
            <div data-lista="ciudades" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>{etiqueta('CIUDADES')}{r.desde_donde.ciudades.slice(0, 6).map((c) => fila(c.iso, c.nombre, c.n))}</div>
          </div>
        )}
      </Cuadro>
    </div>
  )
}

function Niveles({ r }: { r: UsuariosResumen }): ReactNode {
  const max = Math.max(1, ...r.niveles.map((x) => x.n))
  return (
    <Cuadro dato="niveles">
      <Titulo>Niveles · cuántos usuarios hay en cada uno</Titulo>
      <div style={{ height: 110, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {r.niveles.map((x) => (
          <span key={x.nivel} data-nivel={x.nivel} data-n={x.n} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
            <b style={{ font: "700 11px 'Geist'" }}>{x.n}</b>
            <span style={{ width: '100%', height: `${(x.n / max) * 80}%`, minHeight: 3, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(180deg,#5A6AA8,#2A3566)' }} />
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, font: `500 11px ${MONO}`, color: 'rgba(28,34,48,.5)' }}>{r.niveles.map((x) => <span key={x.nivel} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>Niv. {x.nivel}</span>)}</div>
    </Cuadro>
  )
}

/** Un reparto en barras (aparato; dónde la usan). `null` = sin la tabla de uso: «Pronto». */
function repartoDeUso(filas: OpcionDeRespuesta[] | null, pronto: string): ReactNode {
  if (filas === null) return <Pronto>{pronto}</Pronto>
  if (filas.length === 0) return <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía no hay días de uso en este periodo.</span>
  return (
    <>
      {filas.map((q) => (
        <div key={q.valor} data-uso-opcion={q.nombre} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', font: "500 12.5px 'Geist'" }}><span>{q.nombre}</span><b>{q.pct} %</b></span>
          <span style={{ height: 8, borderRadius: 8, background: '#F1EADC', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${q.pct}%`, background: ORO_BARRA }} /></span>
        </div>
      ))}
    </>
  )
}

function ComoEntran({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  const e = r.entran
  const partes = [
    { n: 'Con correo', p: e.correo_pct, c: '#C99A44' },
    { n: 'Con Google', p: e.google_pct, c: '#2A4A94' },
    ...(e.otros > 0 ? [{ n: 'Otro', p: e.otros_pct, c: '#C9BFA8' }] : []),
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 14 }}>
      <Cuadro dato="como-entran">
        <Titulo>Cómo entran</Titulo>
        <span style={{ display: 'flex', height: 14, borderRadius: 14, overflow: 'hidden', background: '#F1EADC' }}>
          {partes.map((q) => <span key={q.n} style={{ display: 'block', height: '100%', width: `${q.p}%`, background: q.c }} />)}
        </span>
        {partes.map((q) => (
          <span key={q.n} data-entran={q.n} style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 12.5px 'Geist'" }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: q.c }} />
            <span style={{ flex: 1 }}>{q.n}</span>
            <b>{q.p} %</b>
          </span>
        ))}
      </Cuadro>
      <Cuadro dato="aparato"><Titulo>Aparato</Titulo>{repartoDeUso(r.uso?.aparato ?? null, 'iPhone, Android u ordenador: todavía no se guarda.')}</Cuadro>
      <Cuadro dato="donde-la-usan"><Titulo>Dónde la usan</Titulo>{repartoDeUso(r.uso?.donde ?? null, 'App instalada o navegador: todavía no se guarda.')}</Cuadro>
    </div>
  )
}

export function Resumen({ r, movil }: { r: UsuariosResumen; movil: boolean }): ReactNode {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        {tarjeta('total', 'USUARIOS EN TOTAL', numero(r.total), 'Registrados')}
        {tarjeta('nuevos', 'NUEVOS EN EL PERIODO', numero(r.nuevos), r.periodo.etiqueta)}
        {tarjeta('activos', 'ACTIVOS EN EL PERIODO', numero(r.activos), 'Han abierto la app')}
      </div>
      <Embudo r={r} movil={movil} />
      <ActividadYViajando r={r} movil={movil} />
      <Calendario r={r} movil={movil} />
      <Quienes r={r} movil={movil} />
      <DesdeDonde r={r} movil={movil} />
      <Niveles r={r} />
      <ComoEntran r={r} movil={movil} />
      {r.cobros_sin_pase.n > 0 && (
        <p data-cobros-sin-pase style={{ margin: 0, font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
          Hay {r.cobros_sin_pase.n} {r.cobros_sin_pase.n === 1 ? 'cobro' : 'cobros'} ({euros(r.cobros_sin_pase.importe_cent, r.cobros_sin_pase.moneda)}) sin pase asociado: cuentan en Ventas, pero no salen en la ficha de nadie porque su pase ya no existe.
        </p>
      )}
    </>
  )
}
