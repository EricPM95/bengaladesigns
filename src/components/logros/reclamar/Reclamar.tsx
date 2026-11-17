import { useMemo, useRef, useState, type ReactNode } from 'react'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { usePasePintable } from '../../../lib/pago'
import { cerrarResumen, fraseDelPlazo, fraseDelResumen, hayBotonDeReclamar, reclamarConFotos, responderPregunta, useReclamarStore, type FotoDelReclamo } from '../../../lib/reclamar'
import { useMomentosUI } from '../momentos/useMomentosUI'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { BTN_CAM_ORO, Capa, Cruz, EstilosDelVisto, MONO, SERIF, TINTA } from '../visto/Hojas'
import { TRAZO, Trazo } from '../visto/trazos'
import { CandadoRedondo } from '../../pase/Candado'

/**
 * RECLAMAR CON TUS FOTOS (Tanda V5): el botón fijo (en la hoja de logros del viaje), la galería con varias fotos a la vez y las pantallas de «Comprobando 12 de 30…», «¿De qué sitio es esta foto?»
 * y el resumen («Has ganado 6 pedazos y 2 emblemas», con la lista de sitios y las fotos que no valen). La lógica (qué vale, qué se gana) es del servidor; ver `src/lib/reclamar.ts`.
 */

/** Abre la galería del móvil con VARIAS fotos a la vez (el `<input multiple>` está siempre montado en `HostDeReclamar`). */
export function abrirGaleriaDeReclamo(): void {
  document.querySelector<HTMLInputElement>('[data-reclamar="entrada"]')?.click()
}

/** El botón fijo de «Logros del viaje»: [Reclamar con tus fotos] y debajo el plazo. Sin pase, con el candado pequeño (lleva al pase). */
export function BotonDeReclamar({ ciudad }: { ciudad?: string }): ReactNode {
  const route = useRouteStore((s) => s.route)
  const pase = usePasePintable()
  if (!route || !hayBotonDeReclamar(route)) return null
  const sinPase = pase === 'sin'
  const plazo = fraseDelPlazo(route)
  return (
    <div data-reclamar="boton-zona" className="flex flex-none flex-col items-center gap-1.5" style={{ padding: '0 16px 8px' }}>
      <button
        type="button"
        data-reclamar="boton"
        data-sin-pase={sinPase ? '1' : undefined}
        onClick={() => (sinPase ? abrirAvisoPase('reclamar', { destino: ciudad }) : abrirGaleriaDeReclamo())}
        className="flex w-full items-center justify-center gap-2 border-0"
        style={{ ...BTN_CAM_ORO, height: 50, borderRadius: 999, font: "700 15px 'Geist'", cursor: 'pointer' }}
      >
        <Trazo d={TRAZO.gal} tam={18} grosor={1.9} />
        Reclamar con tus fotos
        {sinPase && <CandadoRedondo tamano="pequeno" diametro={20} datos="reclamar-candado" />}
      </button>
      {plazo && (
        <span data-reclamar="plazo" style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.62)' }}>
          {plazo}
        </span>
      )}
    </div>
  )
}

const ETIQUETA = { font: `600 10px ${MONO}`, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: 'rgba(28,34,48,.55)' }

function Miniatura({ url, tam = 44 }: { url: string; tam?: number }) {
  return <span className="flex-none overflow-hidden" style={{ width: tam, height: tam, borderRadius: 12, background: `center/cover url(${url}), #E7DCC6` }} />
}

function Subiendo({ hechas, total }: { hechas: number; total: number }) {
  return (
    <Capa onCerrar={() => undefined} etiqueta="Comprobando tus fotos" z={90}>
      <div data-reclamar="subiendo" className="relative flex flex-col gap-3 rounded-t-[28px] bg-[#FFFDF8] px-[18px] pb-[34px] pt-5" style={{ color: TINTA }}>
        <span style={ETIQUETA}>Reclamar con tus fotos</span>
        <span data-reclamar="progreso" style={{ font: `400 28px/1.05 ${SERIF}` }}>
          Comprobando {Math.min(hechas + 1, total)} de {total}…
        </span>
        <span className="block h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(28,34,48,.1)' }}>
          <span className="block h-full rounded-full" style={{ width: `${total ? (hechas / total) * 100 : 0}%`, background: 'linear-gradient(90deg,#E4C58A,#B58A2E)', transition: 'width .3s ease' }} />
        </span>
        <span style={{ font: "400 13px/1.45 'Geist'", color: 'rgba(28,34,48,.62)' }}>Si se corta la red, lo que falte se comprueba solo cuando vuelva la señal.</span>
      </div>
    </Capa>
  )
}

/** «¿De qué sitio es esta foto?»: primero las paradas de ese día sin su pedazo; después el resto de sitios con logro, con buscador. Se puede saltar. */
function Pregunta({ foto, tripId }: { foto: FotoDelReclamo; tripId: string }) {
  const lista = useReclamarStore((s) => s.lista)
  const quedan = useReclamarStore((s) => s.preguntas.length)
  const [q, setQ] = useState('')
  const sin = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const { delDia, resto } = useMemo(() => {
    const filtro = sin(q.trim())
    const ok = lista.filter((s) => !filtro || sin(s.nombre).includes(filtro))
    const delDia = ok.filter((s) => s.pendiente && foto.fecha && s.dias.includes(foto.fecha))
    const ids = new Set(delDia.map((s) => s.sitio))
    return { delDia, resto: ok.filter((s) => !ids.has(s.sitio)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')) }
  }, [lista, q, foto.fecha])
  const fila = (s: (typeof lista)[number]) => (
    <button key={s.sitio} type="button" data-reclamar="sitio" onClick={() => void responderPregunta(tripId, foto, s.sitio)} className="flex min-h-11 items-center justify-between gap-2 rounded-2xl border-0 px-3.5 py-2.5 text-left" style={{ background: '#F5EFE4', font: "500 14px/1.3 'Geist'", color: TINTA }}>
      <span>{s.nombre}</span>
      {s.pendiente && <span style={{ font: `600 10px ${MONO}`, color: '#8E6820' }}>POR GANAR</span>}
    </button>
  )
  return (
    <Capa onCerrar={() => void responderPregunta(tripId, foto, null)} etiqueta="¿De qué sitio es esta foto?" z={90}>
      <div data-reclamar="pregunta" className="relative flex max-h-[85vh] flex-col gap-2.5 overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] px-[18px] pb-[26px] pt-5" style={{ color: TINTA }}>
        <Cruz onCerrar={() => void responderPregunta(tripId, foto, null)} />
        <span style={ETIQUETA}>{quedan > 1 ? `${quedan} fotos sin ubicación` : 'Una foto sin ubicación'}</span>
        <div className="flex items-center gap-3">
          <Miniatura url={foto.url} tam={64} />
          <span className="pr-10" style={{ font: `400 26px/1.05 ${SERIF}` }}>¿De qué sitio es esta foto?</span>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un sitio" data-reclamar="buscador" className="h-11 rounded-full border px-4" style={{ borderColor: 'rgba(28,34,48,.16)', font: "400 14px 'Geist'" }} />
        {delDia.length > 0 && (
          <>
            <span style={{ ...ETIQUETA, marginTop: 4 }}>De ese día, sin su pedazo</span>
            {delDia.map(fila)}
          </>
        )}
        <span style={{ ...ETIQUETA, marginTop: 4 }}>Otros sitios</span>
        {resto.length === 0 ? <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>No hay ninguno con ese nombre.</span> : resto.map(fila)}
        <button type="button" data-reclamar="saltar" onClick={() => void responderPregunta(tripId, foto, null)} className="mt-1 h-12 rounded-full border" style={{ borderColor: 'rgba(28,34,48,.16)', background: '#fff', font: "600 13.5px 'Geist'", color: TINTA }}>
          Saltar esta foto
        </button>
      </div>
    </Capa>
  )
}

function Resumen() {
  const s = useReclamarStore()
  const verTodo = () => {
    cerrarResumen()
    useMomentosUI.getState().abrirHojaLogros()
  }
  return (
    <Capa onCerrar={cerrarResumen} etiqueta="Resumen de tus fotos" z={90}>
      <div data-reclamar="resumen" className="relative flex max-h-[88vh] flex-col gap-3 overflow-y-auto rounded-t-[28px] px-[18px] pb-[26px] pt-5 text-[#FFFDF8]" style={{ background: 'radial-gradient(120% 80% at 50% 0%,#3A3550 0%,#1C2230 65%)' }}>
        <Cruz onCerrar={cerrarResumen} oscura />
        <span data-reclamar="titulo" className="pr-10" style={{ font: `400 30px/1.05 ${SERIF}` }}>{s.sinPase && s.sitios.length === 0 ? 'Tus fotos están guardadas' : fraseDelResumen(s.pedazos, s.emblemas)}</span>
        {s.sinPase && <span style={{ font: "400 13.5px/1.45 'Geist'", color: 'rgba(255,253,248,.8)' }}>Sin el pase no se gana nada con las fotos; van a tus recuerdos.</span>}
        {s.sitios.length > 0 && (
          <div data-reclamar="sitios" className="flex flex-col gap-2">
            {s.sitios.map((x) => (
              <div key={x.sitio} className="flex items-center gap-2.5 rounded-2xl py-2 pl-2 pr-3.5" style={{ background: 'rgba(255,253,248,.08)' }}>
                <Miniatura url={x.url} />
                <span style={{ font: "500 14px/1.3 'Geist'" }}>{x.nombre}</span>
              </div>
            ))}
          </div>
        )}
        {s.enEspera > 0 && (
          <span data-reclamar="en-espera" style={{ font: "500 13px/1.45 'Geist'", color: 'oklch(0.86 0.12 85)' }}>
            {s.enEspera === 1 ? '1 foto espera' : `${s.enEspera} fotos esperan`} a que vuelva la señal: se comprueban solas.
          </span>
        )}
        {s.noValen.length > 0 && (
          <div data-reclamar="no-valen" className="flex flex-col gap-1.5">
            <span style={{ ...ETIQUETA, color: 'rgba(255,253,248,.6)' }}>{s.noValen.length === 1 ? 'Una foto que no cuenta' : `${s.noValen.length} fotos que no cuentan`}</span>
            {s.noValen.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3" style={{ background: 'rgba(255,253,248,.06)' }}>
                <Miniatura url={n.url} tam={36} />
                <span style={{ font: "400 12.5px/1.35 'Geist'", color: 'rgba(255,253,248,.78)' }}>{n.mensaje}</span>
              </div>
            ))}
          </div>
        )}
        {s.muchos ? (
          <button type="button" data-reclamar="ver-todo" onClick={verTodo} className="flex h-[52px] items-center justify-center rounded-full border-0" style={{ ...BTN_CAM_ORO, font: "700 15px 'Geist'" }}>
            Ver todo en Logros
          </button>
        ) : (
          <button type="button" data-reclamar="seguir" onClick={cerrarResumen} className="flex h-[52px] items-center justify-center rounded-full border-0" style={{ ...BTN_CAM_ORO, font: "700 15px 'Geist'" }}>
            {s.sitios.length > 0 ? 'Ver mis sorpresas' : 'Listo'}
          </button>
        )}
      </div>
    </Capa>
  )
}

/** Montado una vez (en `VistoFlujo`): el `<input multiple>` de la galería y las pantallas del reclamo. */
export function HostDeReclamar(): ReactNode {
  const fase = useReclamarStore((s) => s.fase)
  const hechas = useReclamarStore((s) => s.hechas)
  const total = useReclamarStore((s) => s.total)
  const preguntas = useReclamarStore((s) => s.preguntas)
  const tripId = useSyncStore((s) => s.activeTripId) ?? useRouteStore.getState().route?.id ?? ''
  const entrada = useRef<HTMLInputElement>(null)
  return (
    <>
      <EstilosDelVisto />
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        data-reclamar="entrada"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (archivos.length > 0 && tripId) void reclamarConFotos(tripId, archivos)
        }}
      />
      {fase === 'subiendo' && <Subiendo hechas={hechas} total={total} />}
      {fase === 'preguntando' && preguntas[0] && <Pregunta key={preguntas[0].id} foto={preguntas[0]} tripId={tripId} />}
      {fase === 'resumen' && <Resumen />}
    </>
  )
}
