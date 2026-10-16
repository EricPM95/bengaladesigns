import { useEffect, useState } from 'react'
import { logrosActivos, llamar } from '../../lib/logros'

/**
 * /admin/logros (Tanda 8A, apartado 10): una página solo para Eric (la cuenta de administrador sale de una variable del servidor, LOGROS_ADMIN_EMAILS).
 * Enseña por destino todo lo de los datos (sellos, colecciones, emblemas con su radio y su texto de «foto dentro», Patrimonios), los avisos de los datos, los logros
 * de viajero (cuáles se ven hoy), un simulador, cuánta gente tiene cada logro (solo números) y da Probador a mano. NUNCA enseña las fotos de nadie. Provisional.
 * En Vercel, para abrirla como /admin/logros hace falta una regla de reescritura en vercel.json (no está puesta); mientras tanto vale «/?admin=logros».
 */

interface Aviso { nivel: 'error' | 'aviso'; donde: string; texto: string }
interface Sello { id: string; nombre: string; grados: { grado: string; desde: number; nombre: string; linea: string }[]; coleccion: string }
interface Coleccion { id: string; grupo: string; nombre: string; al_completar: string; sitios: string[] }
interface Emblema { id: string; tipo: string; sitio?: string; nombre: string; linea: string }
interface DatosDestino {
  clave: string
  ciudad: string
  sitios: Record<string, { pais: string; capital: boolean; radio_m: number; motivo_radio: string; foto_dentro: string | null; patrimonio?: string; patrimonio_por_comprobar?: string }>
  patrimonios: Record<string, { nombre: string; unesco: number; fuente: string }>
  sellos: Sello[]
  colecciones: Coleccion[]
  emblemas: Emblema[]
}
interface Panel {
  ok: boolean
  destinos: Record<string, DatosDestino>
  avisos: Aviso[]
  viajero: { id: string; grupo: string; nombre: string; visible: boolean; escalones: { n: number; nombre: string; visible: boolean }[] }[]
  personas: { destino: string; logro: string; escalon: string; personas: number }[]
  interruptores: { logros: boolean; push: boolean; cobro: boolean }
}

const PESTANAS = ['Resumen', 'Sellos y colecciones', 'Emblemas', 'Patrimonios', 'Logros de viajero', 'Simulador', 'Personas', 'Probador'] as const

export function AdminLogros() {
  const [panel, setPanel] = useState<Panel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pestana, setPestana] = useState<(typeof PESTANAS)[number]>('Resumen')
  useEffect(() => {
    if (!logrosActivos()) return
    void llamar<Panel>('/api/admin/logros/datos').then((r) => (r?.ok ? setPanel(r) : setError('No tienes permiso, o no has entrado con tu cuenta de administrador.')))
  }, [])
  if (!logrosActivos()) return <p className="p-6 text-[14px]">Los logros están apagados.</p>
  if (error) return <p className="p-6 text-[14px]">{error}</p>
  if (!panel) return <p className="p-6 text-[14px]">Cargando…</p>
  const destino = Object.values(panel.destinos)[0]
  return (
    <main className="mx-auto max-w-3xl p-5 text-text" data-admin-logros>
      <h1 className="font-display text-[26px]">Logros · panel</h1>
      <p className="mt-1 text-[13px] text-text/60">Solo para ti. Nunca se ven las fotos de nadie. Interruptores: logros {panel.interruptores.logros ? 'sí' : 'no'} · avisos al móvil {panel.interruptores.push ? 'sí' : 'no'} · cobro {panel.interruptores.cobro ? 'sí' : 'no'}.</p>
      <nav className="mt-4 flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button key={p} type="button" onClick={() => setPestana(p)} className={`rounded-full border px-3 py-1.5 text-[13px] ${p === pestana ? 'border-text bg-text text-bg' : 'border-text/20'}`}>
            {p}
          </button>
        ))}
      </nav>
      <div className="mt-5 text-[14px]">
        {pestana === 'Resumen' && (
          <section>
            <h2 className="font-semibold">Avisos de los datos</h2>
            {panel.avisos.length === 0 ? <p className="mt-1 text-text/65">Ninguno: todo cuadra con el catálogo.</p> : (
              <ul className="mt-2 space-y-1">
                {panel.avisos.map((a, i) => (
                  <li key={i} className={a.nivel === 'error' ? 'text-accent-red' : 'text-text/75'}>
                    <b>{a.nivel === 'error' ? 'Error' : 'Aviso'}</b> · {a.donde}: {a.texto}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {pestana === 'Sellos y colecciones' && destino && (
          <section className="space-y-4">
            {destino.sellos.map((s) => (
              <div key={s.id}>
                <h3 className="font-semibold">Sello · {s.nombre}</h3>
                <ul className="mt-1 list-disc pl-5">{s.grados.map((g) => <li key={g.grado}>{g.grado} · desde {g.desde} · «{g.nombre}» · {g.linea}</li>)}</ul>
              </div>
            ))}
            {destino.colecciones.map((c) => (
              <div key={c.id}>
                <h3 className="font-semibold">{c.nombre} <span className="font-normal text-text/55">({c.grupo}, {c.sitios.length} sitios) · al completarla: «{c.al_completar}»</span></h3>
                <p className="text-text/70">{c.sitios.join(' · ')}</p>
              </div>
            ))}
          </section>
        )}
        {pestana === 'Emblemas' && destino && (
          <section>
            <table className="w-full text-left text-[13px]"><thead><tr><th>Emblema</th><th>Sitio</th><th>Radio</th><th>Foto dentro</th></tr></thead><tbody>
              {destino.emblemas.map((e) => {
                const s = e.sitio ? destino.sitios[e.sitio] : null
                return <tr key={e.id} className="border-t border-text/10"><td className="py-1.5">{e.nombre}<br /><span className="text-text/55">{e.linea}</span></td><td>{e.sitio ?? 'según la hora'}</td><td>{s ? `${s.radio_m} m` : '—'}</td><td>{s?.foto_dentro ?? '—'}</td></tr>
              })}
            </tbody></table>
            <h3 className="mt-5 font-semibold">Radios de todos los sitios</h3>
            <ul className="mt-1 space-y-0.5 text-[13px]">{Object.entries(destino.sitios).map(([id, s]) => <li key={id}>{id}: {s.radio_m} m — {s.motivo_radio}</li>)}</ul>
          </section>
        )}
        {pestana === 'Patrimonios' && destino && (
          <section className="space-y-3">
            {Object.entries(destino.patrimonios).map(([id, p]) => (
              <div key={id}><h3 className="font-semibold">{p.nombre} (UNESCO {p.unesco})</h3><p className="text-text/70">{p.fuente}</p>
                <p className="text-[13px]">Cuentan: {Object.entries(destino.sitios).filter(([, s]) => s.patrimonio === id).map(([k]) => k).join(', ') || 'ninguno'}<br />Por comprobar (no cuentan): {Object.entries(destino.sitios).filter(([, s]) => s.patrimonio_por_comprobar === id).map(([k]) => k).join(', ') || 'ninguno'}</p></div>
            ))}
          </section>
        )}
        {pestana === 'Logros de viajero' && (
          <section>
            <ul className="space-y-1">{panel.viajero.map((l) => <li key={l.id} className={l.visible ? '' : 'text-text/45'}><b>{l.nombre}</b> ({l.grupo}) · {l.visible ? 'se ve hoy' : 'todavía no se ve'}{l.escalones.length > 0 && ` · escalones: ${l.escalones.map((e) => `${e.n}${e.visible ? '' : '✗'}`).join(', ')}`}</li>)}</ul>
          </section>
        )}
        {pestana === 'Simulador' && <Simulador clave={destino?.clave ?? 'roma'} />}
        {pestana === 'Personas' && (
          <section><p className="text-text/60">Cuánta gente tiene cada cosa (solo números).</p>
            <table className="mt-2 w-full text-left text-[13px]"><tbody>{panel.personas.map((p, i) => <tr key={i} className="border-t border-text/10"><td className="py-1">{p.destino}</td><td>{p.logro}</td><td>{p.escalon}</td><td className="text-right font-semibold">{p.personas}</td></tr>)}</tbody></table></section>
        )}
        {pestana === 'Probador' && <Probador />}
      </div>
    </main>
  )
}

function Simulador({ clave }: { clave: string }) {
  const [texto, setTexto] = useState('2026-10-10;visto;coliseo;09:00\n2026-10-10;foto;coliseo;09:05\n2026-10-11;foto;fontana_de_trevi;06:30')
  const [salida, setSalida] = useState<{ paso: number; sitio: string; tipo: string; nuevos: { tipo: string; nombre: string }[] }[] | null>(null)
  const [inicio, setInicio] = useState('2026-10-10')
  const [fin, setFin] = useState('2026-10-14')
  const correr = async () => {
    const pasos = texto.split('\n').map((l) => l.split(';').map((x) => x.trim())).filter((p) => p.length >= 3).map(([fecha, tipo, sitio, hora]) => ({ fecha, tipo, sitio, hora }))
    const r = await llamar<{ ok: boolean; pasos: typeof salida }>('/api/admin/logros/simular', { cuerpo: { destino: clave, inicio, fin, pasos } })
    setSalida(r?.pasos ?? [])
  }
  return (
    <section>
      <p className="text-text/60">Una línea por paso: fecha;visto o foto;id del sitio;hora (hora de Roma). No toca la base de datos.</p>
      <div className="mt-2 flex gap-2"><input value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-32 rounded border border-text/20 px-2 py-1" /><input value={fin} onChange={(e) => setFin(e.target.value)} className="w-32 rounded border border-text/20 px-2 py-1" /></div>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={7} className="mt-2 w-full rounded border border-text/20 p-2 font-mono text-[12.5px]" />
      <button type="button" onClick={() => void correr()} className="mt-2 rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-white">Simular</button>
      {salida && <ol className="mt-3 space-y-2">{salida.map((p) => <li key={p.paso}><b>{p.paso}. {p.tipo} · {p.sitio}</b>{p.nuevos.length === 0 ? <span className="text-text/55"> — nada nuevo</span> : <ul className="list-disc pl-5">{p.nuevos.map((m, i) => <li key={i}>{m.tipo}: {m.nombre}</li>)}</ul>}</li>)}</ol>}
    </section>
  )
}

function Probador() {
  const [email, setEmail] = useState('')
  const [resultado, setResultado] = useState<string | null>(null)
  const dar = async () => {
    const r = await llamar<{ ok: boolean; error?: string }>('/api/admin/logros/probador', { cuerpo: { email } })
    setResultado(r?.ok ? 'Probador dado.' : 'No se ha podido (¿existe esa cuenta?).')
  }
  return (
    <section>
      <p className="text-text/60">Dar «Probador» a mano a una cuenta (por su email). No se da solo.</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email de la cuenta" className="mt-2 w-full rounded border border-text/20 px-2 py-1.5" />
      <button type="button" onClick={() => void dar()} className="mt-2 rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-white">Dar Probador</button>
      {resultado && <p className="mt-2">{resultado}</p>}
    </section>
  )
}
