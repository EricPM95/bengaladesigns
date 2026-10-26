import { useEffect, useState } from 'react'
import { logrosActivos, llamar } from '../../lib/logros'
import { useSinPasePrueba } from '../../store/useSinPasePrueba'
import { empezarDeCero, puedeEmpezarDeCero } from '../../lib/empezarDeCero'

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
  sitios: Record<string, { pais: string; capital: boolean; radio_m: number; motivo_radio: string; foto_dentro: string | null }>
  patrimonios: Record<string, { nombre: string; unesco: number; fuente: string; sitios?: string[]; por_comprobar?: string[]; motivos?: Record<string, string> }>
  sellos: Sello[]
  colecciones: Coleccion[]
  emblemas: Emblema[]
}
interface Panel {
  ok: boolean
  destinos: Record<string, DatosDestino>
  avisos: Aviso[]
  viajero: { id: string; grupo: string; nombre: string; visible: boolean; escalones: { n: number; nombre: string; visible: boolean }[] }[]
  viajero_apagados?: string[]
  personas: { destino: string; logro: string; escalon: string; personas: number }[]
  interruptores: { logros: boolean; push: boolean; cobro: boolean }
}

const PESTANAS = ['Resumen', 'Sellos y colecciones', 'Emblemas', 'Patrimonios', 'Logros de viajero', 'Simulador', 'Personas', 'Sorteo', 'Probador', 'Mis pruebas', 'Destinos pedidos'] as const

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
                <p className="text-[13px]">Cuentan ({p.sitios?.length ?? 0}): {p.sitios?.join(', ') || 'ninguno'}<br />Por comprobar (no cuentan): {p.por_comprobar?.join(', ') || 'ninguno'}</p></div>
            ))}
          </section>
        )}
        {pestana === 'Logros de viajero' && (
          <section>
            <p className="mb-2 text-text/60">Versión 1: solo se ganan, se ven y dan EXP los de abajo. Apagados (en data/logros/viajero.json, `activo: false`): {(panel.viajero_apagados ?? []).join(', ') || 'ninguno'}.</p>
            <ul className="space-y-1">{panel.viajero.map((l) => <li key={l.id} className={l.visible ? '' : 'text-text/45'}><b>{l.nombre}</b> ({l.grupo}) · {l.visible ? 'se ve hoy' : 'todavía no se ve'}{l.escalones.length > 0 && ` · escalones: ${l.escalones.map((e) => `${e.n}${e.visible ? '' : '✗'}`).join(', ')}`}</li>)}</ul>
          </section>
        )}
        {pestana === 'Simulador' && <Simulador clave={destino?.clave ?? 'roma'} />}
        {pestana === 'Personas' && (
          <section><p className="text-text/60">Cuánta gente tiene cada cosa (solo números).</p>
            <table className="mt-2 w-full text-left text-[13px]"><tbody>{panel.personas.map((p, i) => <tr key={i} className="border-t border-text/10"><td className="py-1">{p.destino}</td><td>{p.logro}</td><td>{p.escalon}</td><td className="text-right font-semibold">{p.personas}</td></tr>)}</tbody></table></section>
        )}
        {pestana === 'Sorteo' && <Sorteo />}
        {pestana === 'Probador' && <Probador />}
        {pestana === 'Mis pruebas' && (
          <>
            <VermeSinPase />
            <EmpezarDeCero />
            <MisPruebas />
          </>
        )}
        {pestana === 'Destinos pedidos' && <DestinosPedidos />}
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
      <button type="button" onClick={() => void correr()} className="mt-2 rounded-full btn-champan px-4 py-2 text-[14px] font-semibold ">Simular</button>
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
      <button type="button" onClick={() => void dar()} className="mt-2 rounded-full btn-champan px-4 py-2 text-[14px] font-semibold ">Dar Probador</button>
      {resultado && <p className="mt-2">{resultado}</p>}
    </section>
  )
}

/**
 * El sorteo del año (Tanda 10P): cuántas cuentas entran y la lista (solo el id de cada cuenta: sin nombres ni correos). La regla: nivel mínimo y al menos un viaje acabado usando HOY la mitad de los días o más
 * (redondeando hacia arriba), con el cierre del 31 de agosto. Los datos del sorteo (año, destino, premio, fechas, cierre y enlace de las bases) se cambian en `data/logros/exp.json › sorteo`.
 */
function Sorteo() {
  const [anio, setAnio] = useState('')
  const [r, setR] = useState<{ ok: boolean; anio: number; edicion?: { anio: number; destino: string | null; premio: string; cierre: string }; cuentas: number; entran: number; lista: { user_id: string; exp: number; nivel: number; viajes_con_hoy: number }[]; regla: { nivel_minimo: number; viajes_con_hoy_minimos: number } } | null>(null)
  // Sin año, el servidor enseña la edición que está en marcha.
  const ver = async () => setR(await llamar('/api/admin/logros/sorteo' + (anio ? '?anio=' + encodeURIComponent(anio) : '')))
  return (
    <section data-admin-sorteo>
      <p className="text-text/60">Entra quien tenga el nivel mínimo o más y haya acabado al menos un viaje usando HOY la mitad de los días o más (a cualquier destino), hasta el cierre del 31 de agosto. Déjalo vacío para ver la edición en marcha.</p>
      <div className="mt-2 flex gap-2">
        <input value={anio} placeholder="Año" onChange={(e) => setAnio(e.target.value)} className="w-24 rounded border border-text/20 px-2 py-1" />
        <button type="button" onClick={() => void ver()} className="rounded-full btn-champan px-4 py-1.5 text-[14px] font-semibold ">Ver quién entra</button>
      </div>
      {r?.ok && (
        <div className="mt-3">
          <p>
            <b>{r.entran}</b> de {r.cuentas} cuentas entran en {r.anio} (nivel {r.regla.nivel_minimo}+ y {r.regla.viajes_con_hoy_minimos}+ viaje acabado con HOY la mitad de los días o más).
          </p>
          {r.edicion && (
            <p className="text-text/60">
              {r.edicion.premio} · cierra el {r.edicion.cierre}
            </p>
          )}
          <ul className="mt-2 space-y-0.5 font-mono text-[12.5px]">{r.lista.map((x) => <li key={x.user_id}>{x.user_id.slice(0, 8)} · nivel {x.nivel} · {x.exp} EXP · {x.viajes_con_hoy} viaje(s) con HOY</li>)}</ul>
        </div>
      )}
    </section>
  )
}

/** Reiniciar MIS pruebas (tanda 9): solo la cuenta con la que has entrado (el servidor la saca de tu sesión; no se puede indicar otra). Pide confirmar. No está en ninguna otra pantalla. */
/** (Tanda 10) Qué destinos pide la gente que aún no tenemos y cuántas veces (los avisos de «avísame cuando llegue»). Solo cuenta; no enseña ningún email. */
function DestinosPedidos() {
  const [datos, setDatos] = useState<{ destinos: { destino: string; veces: number }[]; error?: string } | null>(null)
  useEffect(() => {
    let vivo = true
    void llamar<{ ok: boolean; destinos: { destino: string; veces: number }[]; error?: string }>('/api/admin/destinos-pedidos').then((r) => vivo && setDatos(r ? { destinos: r.destinos ?? [], error: r.error } : { destinos: [], error: 'No se ha podido leer.' }))
    return () => {
      vivo = false
    }
  }, [])
  return (
    <section data-destinos-pedidos>
      <p className="text-text/60">Los destinos que la gente escribe en la primera pantalla y que aún no tenemos, con las veces que los han pedido (un aviso por email y destino).</p>
      {!datos && <p className="mt-2">Cargando…</p>}
      {datos?.error && <p className="mt-2 text-accent-red" role="alert">{datos.error}</p>}
      {datos && datos.destinos.length === 0 && !datos.error && <p className="mt-2">Nadie ha pedido ninguno todavía.</p>}
      <ul className="mt-2 flex list-none flex-col gap-1 p-0">
        {datos?.destinos.map((d) => (
          <li key={d.destino} className="flex items-center justify-between rounded-lg border border-text/15 px-3 py-2">
            <span className="font-semibold">{d.destino}</span>
            <span className="text-text/70">{d.veces} {d.veces === 1 ? 'vez' : 'veces'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** «Verme como viajero sin pase» (Tanda 10B): apagado por defecto. Encendido, el servidor trata TU cuenta como la de alguien que no ha comprado el pase. Solo tu cuenta; no toca el pase de verdad ni los cobros. */
function VermeSinPase() {
  const [activo, setActivo] = useState<boolean | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const poner = useSinPasePrueba((state) => state.poner)
  useEffect(() => {
    let vivo = true
    void llamar<{ ok: boolean; activo: boolean }>('/api/pase/sin-pase').then((r) => vivo && setActivo(Boolean(r?.ok && r.activo)))
    return () => {
      vivo = false
    }
  }, [])
  const cambiar = async () => {
    const nuevo = !activo
    const r = await llamar<{ ok: boolean; activo?: boolean }>('/api/admin/logros/sin-pase', { cuerpo: { activo: nuevo } })
    if (r?.ok) {
      setActivo(nuevo)
      poner(nuevo)
      setAviso(nuevo ? 'Encendido: la app te trata como a quien no ha comprado el pase. Vuelve a la app (verás la etiqueta «Sin pase (prueba)»).' : 'Apagado: vuelves a tener tu pase.')
    } else setAviso('No se ha podido guardar (¿está aplicada la migración 0030?). Todo queda como estaba.')
  }
  return (
    <section data-ver-sin-pase className="mb-5">
      <p className="text-text/60">Para tus pruebas: la app te trata como a alguien que no ha comprado el pase (lo de pago, cerrado, y los avisos que invitan a comprarlo). Solo afecta a tu cuenta; no toca el pase de verdad ni los cobros.</p>
      <label className="mt-2 flex items-center gap-3 font-semibold">
        <input type="checkbox" role="switch" checked={Boolean(activo)} disabled={activo === null} onChange={() => void cambiar()} className="h-5 w-5" />
        Verme como viajero sin pase
      </label>
      {aviso && <p className="mt-2" role="status">{aviso}</p>}
    </section>
  )
}

/** [Empezar de cero] (Tanda 10J): deja TU cuenta como recién creada (viajes, reservas, fotos, logros, EXP, día de prueba, pases) y vuelve a la pantalla de inicio. El botón solo existe si el servidor dice que eres administrador. */
function EmpezarDeCero() {
  const [puede, setPuede] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void puedeEmpezarDeCero().then((p) => vivo && setPuede(p))
    return () => {
      vivo = false
    }
  }, [])
  if (!puede) return null
  const borrar = async () => {
    setOcupado(true)
    setError(null)
    const fallo = await empezarDeCero()
    if (fallo) {
      setOcupado(false)
      setConfirmando(false)
      setError(fallo)
    }
  }
  return (
    <section data-empezar-de-cero className="mb-5">
      <p className="text-text/60">Deja TU cuenta como recién creada: borra tus viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases, y lo que guarda este móvil. La cuenta se queda. Cierra la sesión y vuelve al inicio.</p>
      {!confirmando ? (
        <button type="button" data-empezar-de-cero-boton onClick={() => setConfirmando(true)} className="mt-2 rounded-full btn-champan px-4 py-2 text-[14px] font-semibold ">Empezar de cero</button>
      ) : (
        <div data-empezar-de-cero-dialogo role="alertdialog" aria-label="Empezar de cero" className="mt-2 rounded-xl border border-text/20 p-3">
          <p className="font-semibold">Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases. La cuenta se queda. ¿Seguro?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" data-empezar-de-cero-si disabled={ocupado} onClick={() => void borrar()} className="rounded-full bg-accent-red text-white px-4 py-2 text-[14px] font-semibold ">Sí, empezar de cero</button>
            <button type="button" data-empezar-de-cero-no disabled={ocupado} onClick={() => setConfirmando(false)} className="rounded-full border border-text/25 px-4 py-2 text-[14px]">Cancelar</button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-accent-red" role="alert">{error}</p>}
    </section>
  )
}

function MisPruebas() {
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const reiniciar = async () => {
    setOcupado(true)
    const r = await llamar<{ ok: boolean; borrados?: Record<string, number>; error?: string }>('/api/admin/logros/reiniciar-mis-pruebas', { cuerpo: { confirmar: true } })
    setOcupado(false)
    setConfirmando(false)
    setResultado(r?.ok ? 'Hecho: tu día de prueba, tus logros, tu EXP, tus pases de prueba y tus avisos están a cero. Cierra la app y vuelve a abrirla.' : 'No se ha podido reiniciar. Vuelve a probar.')
  }
  return (
    <section data-reiniciar-pruebas>
      <p className="text-text/60">Deja a cero lo de pruebas de TU cuenta (la de ahora): el día de prueba de HOY, los logros, la EXP, los pases de prueba y los avisos. No toca tus viajes, tus fotos ni a nadie más.</p>
      {!confirmando ? (
        <button type="button" onClick={() => setConfirmando(true)} className="mt-2 rounded-full btn-champan px-4 py-2 text-[14px] font-semibold ">Reiniciar mis pruebas</button>
      ) : (
        <div className="mt-2 rounded-xl border border-text/20 p-3">
          <p className="font-semibold">¿Seguro? Se borra lo de pruebas de tu cuenta y no se puede deshacer.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={ocupado} onClick={() => void reiniciar()} className="rounded-full bg-accent-red text-white px-4 py-2 text-[14px] font-semibold ">Sí, reiniciar</button>
            <button type="button" disabled={ocupado} onClick={() => setConfirmando(false)} className="rounded-full border border-text/25 px-4 py-2 text-[14px]">Cancelar</button>
          </div>
        </div>
      )}
      {resultado && <p className="mt-2" role="status">{resultado}</p>}
    </section>
  )
}
