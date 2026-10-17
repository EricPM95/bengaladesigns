import { lazy, Suspense, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { Chapa, Insignia, MedallaMaravillas, Sello, type GradoDeSello } from '../dibujos'
import type { EstadoLogros } from './api'
import { Centro, FONDO_CALIDO, FONDO_NOCHE, Ojo, ORO, PantallaOscura, Rayos, Estrellas, Sub, Titulo, Vuelo } from './base'
import { Fuegos } from './Fuegos'
import { gradoAnterior, type Pantalla } from './plan'

const EscenaDeEmblema = lazy(() => import('./EscenaDeEmblema'))

export interface PropsDePantalla {
  pantalla: Pantalla
  estado: EstadoLogros | null
  onSeguir: () => void
  onSaltarTodo: (() => void) | null
  paso: { actual: number; total: number } | null
}

const s = (m: Momento, k: string): string => String(m[k] ?? '')
const NOMBRES_SELLO: Record<string, { de: string; etiqueta: string }> = { roma: { de: 'de Roma', etiqueta: 'ROMA' }, vaticano: { de: 'del Vaticano', etiqueta: 'VATICANO' } }

/* ── El sello que nace o sube de grado ── */
const COLORES_GRADO: Record<string, { rayo: string; halo: string; ojo: string }> = {
  bronce: { rayo: 'rgba(226,180,140,.25)', halo: 'rgba(226,180,140,.5)', ojo: '#E2B48C' },
  plata: { rayo: 'rgba(220,225,232,.22)', halo: 'rgba(220,225,232,.5)', ojo: '#D6DBE1' },
  oro: { rayo: 'rgba(255,225,160,.25)', halo: 'rgba(255,225,160,.55)', ojo: '#F3D59A' },
  diamante: { rayo: 'rgba(200,215,245,.26)', halo: 'rgba(200,215,245,.6)', ojo: '#C9D6F2' },
}
const FRASE_EVO: Record<string, string> = { plata: 'Algo está cambiando…', oro: '¿Lo notas?', diamante: 'Esto brilla mucho…' }

function PantallaSello({ pantalla, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  const m = pantalla.momentos[0]
  const grado = s(m, 'grado') as GradoDeSello
  const antes = gradoAnterior(m) as GradoDeSello | null
  const c = COLORES_GRADO[grado] ?? COLORES_GRADO.oro
  const id = s(m, 'sello')
  const n = NOMBRES_SELLO[id] ?? { de: id, etiqueta: id.toUpperCase() }
  const t = antes ? 3.5 : 1.5
  return (
    <PantallaOscura etiqueta={`Tu sello ${n.de}, ${grado}`} fondo={grado === 'diamante' ? 'radial-gradient(circle at 50% 36%,#33416B 0%,#141826 70%)' : FONDO_CALIDO} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn={`${t + 0.9}s`}>
      {grado === 'diamante' && <Estrellas n={26} />}
      {!antes && <Rayos color={c.rayo} halo={c.halo} />}
      <Centro>
        <Vuelo estilo={{ width: 210, height: 210, marginBottom: 14 }}>
          {antes ? (
            <>
              <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', inset: -50, borderRadius: '50%', background: `radial-gradient(circle,${c.halo},transparent 68%)`, opacity: 0, animation: 'moGlow 2.2s .2s ease-in-out 2' }} />
              <div className="mo-con-mov" style={{ position: 'absolute', inset: 0, opacity: 0, animation: 'evoOld 3.3s .2s both' }}>
                <Sello id={id} grado={antes} tam={210} />
              </div>
              <span aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: 5, top: 5, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,#fff,rgba(255,240,200,.6) 35%,transparent 70%)', opacity: 0, animation: 'evoFlash 1s 3.3s ease-out both' }} />
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} aria-hidden className="mo-con-mov" style={{ position: 'absolute', left: 103, top: 103, width: i % 3 ? 7 : 11, height: i % 3 ? 7 : 11, borderRadius: '50%', background: i % 4 ? '#FFE9B0' : '#fff', ['--r' as string]: `${i * 22.5 + (i % 2) * 8}deg`, opacity: 0, animation: `evoBurst 1.1s ${3.3 + (i % 4) * 0.05}s ease-out both` } as React.CSSProperties} />
              ))}
              <div style={{ position: 'absolute', inset: 0, opacity: 0, animation: 'evoNew 1.1s 3.3s both' }}>
                <Sello id={id} grado={grado} tam={210} />
              </div>
              <span className="mo-con-mov" style={{ position: 'absolute', left: 0, right: 0, top: -44, font: "italic 400 24px/1.2 'Instrument Serif',serif", color: '#F3E3B8', opacity: 0, animation: 'moFrase 3s .3s ease both' }}>{FRASE_EVO[grado] ?? 'Algo está cambiando…'}</span>
            </>
          ) : (
            <div style={{ opacity: 0, animation: 'moDrop .9s .2s cubic-bezier(.2,.8,.2,1) both' }}>
              <Sello id={id} grado={grado} tam={210} />
            </div>
          )}
        </Vuelo>
        <Ojo color={c.ojo} en={`${t}s`}>{`Tu sello ${n.de} · ${grado}`}</Ojo>
        <Titulo en={`${t + 0.2}s`}>{m.nombre}</Titulo>
        {m.linea && <Sub en={`${t + 0.4}s`}>{m.linea}</Sub>}
      </Centro>
    </PantallaOscura>
  )
}

/** Si en una misma ronda llegan dos pedazos de la misma colección (dos fotos seguidas), sale una sola fila, con la cuenta más alta (o la completa). */
function unaPorColeccion<T extends { id: string; n: number; completa: boolean; vistos: string[] }>(filas: T[]): T[] {
  const por = new Map<string, T>()
  for (const f of filas) {
    const previa = por.get(f.id)
    if (!previa) por.set(f.id, f)
    else por.set(f.id, f.completa || f.n >= previa.n ? { ...f, vistos: [...new Set([...previa.vistos, ...f.vistos])] } : previa)
  }
  return [...por.values()]
}

/* ── Los pedazos y las colecciones completadas ── */
function PantallaColecciones({ pantalla, estado, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  const filas = unaPorColeccion(pantalla.momentos.map((m) => {
    const completa = m.tipo === 'coleccion'
    const id = completa ? s(m, 'id') : s(m, 'coleccion')
    const col = estado?.colecciones.find((x) => x.id === id)
    const vistos = col ? col.sitios.filter((x) => x.visto).map((x) => x.sitio) : ((m.sitios as string[] | undefined) ?? [])
    const total = completa ? (col?.total ?? 0) : Number(m.total ?? 0)
    const n = completa ? total : Number(m.n ?? 0)
    return { id, nombre: s(m, 'nombre'), completa, vistos, total, n, linea: completa ? s(m, 'linea') : '' }
  }))
  const solo = filas.length === 1
  const todasCompletas = filas.every((f) => f.completa)
  const ojo = todasCompletas ? '¡Colección completa!' : solo ? 'Un pedazo nuevo' : `Una foto, ${filas.length} colecciones`
  const cuenta = (f: (typeof filas)[number]) => (f.completa ? `${f.total || f.n} DE ${f.total || f.n} · COMPLETA` : `${f.n} DE ${f.total}`)
  const ultimo = 0.6 + (filas.length - 1) * 0.8
  return (
    <PantallaOscura etiqueta={ojo} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn={`${(solo ? 1.8 : ultimo + 2.2).toFixed(1)}s`}>
      <Rayos color={todasCompletas ? 'rgba(159,224,180,.16)' : 'rgba(255,225,170,.16)'} halo={todasCompletas ? 'rgba(159,224,180,.4)' : 'rgba(255,215,160,.32)'} />
      <Centro estilo={{ gap: solo ? 10 : 14 }}>
        <Ojo en=".3s" color={todasCompletas ? '#9FE0B4' : ORO}>{ojo}</Ojo>
        <Vuelo estilo={{ flexDirection: solo ? 'column' : 'row', flexWrap: 'wrap', gap: solo ? 8 : 18, justifyContent: 'center', maxWidth: 360, padding: '0 14px' }}>
          {filas.map((f, i) => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: solo ? 'auto' : 150, opacity: 0, animation: `moIn .9s ${(0.4 + i * 0.8).toFixed(1)}s cubic-bezier(.3,1.3,.5,1) both` }}>
              <Insignia coleccion={f.id} ganados={f.vistos} completa={f.completa} tam={solo ? 220 : 124} />
              <span style={{ font: `400 ${solo ? 30 : 17}px/1.05 'Instrument Serif',serif`, textWrap: 'balance' }}>{f.nombre}</span>
              <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: f.completa ? '#9FE0B4' : '#F3B7C4' }}>{cuenta(f)}</span>
            </div>
          ))}
        </Vuelo>
        {solo && filas[0].linea && <Sub en="2.2s">{filas[0].linea}</Sub>}
      </Centro>
    </PantallaOscura>
  )
}

/* ── El emblema secreto, en cine ── */
function PantallaEmblema({ pantalla, onSeguir, onSaltarTodo }: PropsDePantalla): ReactNode {
  const m = pantalla.momentos[0]
  return (
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#0C0A08' }} />}>
      <EscenaDeEmblema id={s(m, 'id')} nombre={s(m, 'nombre') || null} linea={s(m, 'linea') || null} primeraVez={Boolean(m.primera_vez)} frase={typeof m.frase === 'string' ? m.frase : null} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} />
    </Suspense>
  )
}

/* ── País, destino y continente nuevos: se estampa el pasaporte ── */
const OJO_SELLADO: Record<string, string> = { pais: 'País nuevo', destino_nuevo: 'Destino nuevo', continente: 'Nuevo continente' }
function fechaCorta(iso: string): string {
  const d = iso ? new Date(iso) : new Date()
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}
function PantallaSellado({ pantalla, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  const m = pantalla.momentos[0]
  const color = '#EE6A55'
  const nombreLugar = s(m, 'pais') || s(m, 'continente') || s(m, 'destino')
  return (
    <PantallaOscura etiqueta={m.nombre} fondo="radial-gradient(circle at 50% 36%,#46302A 0%,#1C1210 70%)" onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn="3s">
      <Rayos color="rgba(240,170,140,.2)" halo="rgba(240,170,140,.42)" />
      <Centro>
        <Vuelo estilo={{ width: 250, height: 170 }}>
          <svg aria-hidden width="250" height="170" viewBox="0 0 250 170" style={{ position: 'absolute', inset: 0 }} className="mo-con-mov">
            {Array.from({ length: 14 }, (_, k) => {
              const a = (k / 14) * Math.PI * 2 + (k % 3) * 0.2
              return <circle key={k} cx={125 + Math.cos(a) * (84 + (k % 4) * 9)} cy={85 + Math.sin(a) * (54 + (k % 3) * 8)} r={1.4 + (k % 4) * 0.9} fill={color} style={{ opacity: 0, animation: `moInk 1.2s ${1.0 + k * 0.02}s ease-out both` }} />
            })}
          </svg>
          <div style={{ position: 'relative', border: `3px solid ${color}`, color, borderRadius: 14, padding: '14px 18px', transform: 'rotate(-8deg)', opacity: 0, animation: 'moStamp .9s 1.0s cubic-bezier(.2,.8,.2,1) both', font: "700 20px/1.1 'Geist Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', background: 'rgba(255,246,234,.06)' }}>
            <div style={{ fontSize: 10, letterSpacing: '.3em', opacity: 0.8, marginBottom: 6 }}>PASAPORTE</div>
            <div>{nombreLugar}</div>
            <div style={{ fontSize: 11, marginTop: 6, letterSpacing: '.2em' }}>{fechaCorta(s(m, 'en'))}</div>
          </div>
        </Vuelo>
        <Ojo color="#F2C2A8" en="2.1s">{OJO_SELLADO[m.tipo] ?? 'Nuevo'}</Ojo>
        <Titulo en="2.3s">{m.nombre}</Titulo>
      </Centro>
    </PantallaOscura>
  )
}

/* ── Maravilla del mundo (cuando sale sola) ── */
function PantallaMaravilla({ pantalla, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  const m = pantalla.momentos[0]
  const n = Number(m.n ?? 1)
  return (
    <PantallaOscura etiqueta={m.nombre} fondo={FONDO_NOCHE} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn="3.4s">
      <Estrellas n={30} />
      <Rayos />
      <Fuegos desde={0.4} />
      <Centro>
        <Vuelo estilo={{ marginBottom: 6 }}>
          <div style={{ opacity: 0, animation: 'moIn 1s .5s both' }}>
            <MedallaMaravillas encendidas={[s(m, 'id')]} tam={230} />
          </div>
        </Vuelo>
        <Ojo en="2.2s">Maravilla del mundo</Ojo>
        <Titulo en="2.4s">{n === 1 ? 'Tu primera maravilla' : m.nombre}</Titulo>
        <Sub en="2.6s">{n === 1 ? `${m.nombre} · 1 de 7` : `${n} de 7`}</Sub>
      </Centro>
    </PantallaOscura>
  )
}

/* ── Patrimonio y logro de viajero: la chapa ── */
const TITULO_CHAPA: Record<string, string> = { patrimonio: 'Patrimonio de la Humanidad', viajero: 'Logro de viajero', maravilla: 'Maravilla del mundo', destino_nuevo: 'Destino nuevo', pais: 'País nuevo', continente: 'Nuevo continente' }
function chapaDe(m: Momento): { logro: string; escalon: string | number | null } {
  if (m.tipo === 'viajero') return { logro: s(m, 'logro'), escalon: s(m, 'escalon') || null }
  if (m.tipo === 'maravilla') return { logro: 'maravillas', escalon: Number(m.n ?? 1) }
  if (m.tipo === 'patrimonio') return { logro: 'patrimonios', escalon: 1 }
  if (m.tipo === 'destino_nuevo') return { logro: 'destinos', escalon: Number(m.n ?? 1) }
  if (m.tipo === 'pais') return { logro: 'paises', escalon: Number(m.n ?? 1) }
  return { logro: 'continentes', escalon: null }
}
function PantallaChapa({ pantalla, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  const m = pantalla.momentos[0]
  const ch = chapaDe(m)
  return (
    <PantallaOscura etiqueta={m.nombre} fondo={FONDO_CALIDO} onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn="2.6s">
      <Rayos />
      <Centro>
        <Vuelo estilo={{ marginBottom: 10 }}>
          <div style={{ opacity: 0, animation: 'moDrop .9s .3s cubic-bezier(.2,.8,.2,1) both' }}>
            <Chapa logro={ch.logro} escalon={ch.escalon} tam={220} />
          </div>
        </Vuelo>
        <Ojo en="1.5s">{TITULO_CHAPA[m.tipo] ?? 'Logro'}</Ojo>
        <Titulo en="1.7s">{m.nombre}</Titulo>
        {m.linea && <Sub en="1.9s">{m.linea}</Sub>}
      </Centro>
    </PantallaOscura>
  )
}

/* ── «Y además…»: varios logros de viajero juntos ── */
function PantallaAdemas({ pantalla, onSeguir, onSaltarTodo, paso }: PropsDePantalla): ReactNode {
  return (
    <PantallaOscura etiqueta="Y además" onSeguir={onSeguir} onSaltarTodo={onSaltarTodo} paso={paso} ctaEn={`${(0.9 + pantalla.momentos.length * 0.4).toFixed(1)}s`}>
      <Rayos />
      <Centro estilo={{ gap: 16 }}>
        <Ojo en=".2s">Y además…</Ojo>
        <Vuelo estilo={{ flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360, padding: '0 22px', alignItems: 'stretch' }}>
          {pantalla.momentos.slice(0, 5).map((m, i) => {
            const ch = chapaDe(m)
            return (
              <div key={`${m.tipo}${i}`} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', opacity: 0, animation: `moUp .7s ${(0.5 + i * 0.3).toFixed(1)}s ease both` }}>
                <Chapa logro={ch.logro} escalon={ch.escalon} tam={78} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: ORO }}>{TITULO_CHAPA[m.tipo] ?? 'Logro'}</span>
                  <span style={{ font: "400 22px/1.05 'Instrument Serif',serif" }}>{m.nombre}</span>
                  {m.linea && <span style={{ font: "400 12px 'Geist'", color: 'rgba(255,253,248,.65)' }}>{m.linea}</span>}
                </span>
              </div>
            )
          })}
        </Vuelo>
      </Centro>
    </PantallaOscura>
  )
}

export function PantallaDeMomento(p: PropsDePantalla): ReactNode {
  switch (p.pantalla.tipo) {
    case 'sello':
      return <PantallaSello {...p} />
    case 'colecciones':
      return <PantallaColecciones {...p} />
    case 'emblema':
      return <PantallaEmblema {...p} />
    case 'pais':
    case 'destino_nuevo':
    case 'continente':
      return <PantallaSellado {...p} />
    case 'maravilla':
      return <PantallaMaravilla {...p} />
    case 'ademas':
      return <PantallaAdemas {...p} />
    default:
      return <PantallaChapa {...p} />
  }
}
