import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePortadaDeViaje } from '../../../hooks/usePortadaDeViaje'
import { contarFotos } from '../../../lib/fotosViaje'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { fraseDelPlazo } from '../../../lib/reclamar'
import { subirMiFoto } from '../../../lib/companero'
import { useLogrosPantallas } from '../pantallas/useLogrosPantallas'
import { Chapa, Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { ORDEN_EMBLEMAS_LANZAROTE, idDeDibujoLanzarote } from '../dibujos/emblemasLanzarote'
import { abrirGaleriaDeReclamo } from '../reclamar/Reclamar'
import { BTN_CAM_ORO } from '../visto/Hojas'
import { lineaDeSecretos } from './textosResumen'
import { pedirEstado, pedirResumen, pedirViajero, type EstadoLogros, type LogrosViajero, type ResumenLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'
import { CruzDeHoja } from '../../ui/CruzDeHoja'

/**
 * EL RESUMEN DEL VIAJE, REHECHO (Tanda V9, apartado 6; «Resumen del viaje» de Design, la versión con la foto arriba). Es el RECUERDO de lo ganado en ESTE viaje (no la hoja de logros, que dice cómo vas):
 *   · arriba una foto grande del viaje (una de las suyas; si no, la del destino), «Lo que te llevas de {ciudad}» y las cifras: días, paradas, km y fotos;
 *   · la medalla grande y sin barra: «Has conseguido el bronce de Lanzarote»;
 *   · colecciones: solo las que han sumado en este viaje, con lo sumado («+2») y sin barras;
 *   · emblemas: solo los descubiertos en este viaje, con su dibujo y su nombre, y «+9 secretos por descubrir» (sin cuadrícula de «?»);
 *   · logros de viajero nuevos, de 3 en 3, todos del mismo tamaño y cada uno con SU dibujo y SU marco;
 *   · «Te quedan N sorpresas por reclamar»: una tarjeta que se toca y abre la hoja con CUÁLES son (los sitios de la ruta que dan algún pedazo y aún no se tiene; los emblemas ocultos nunca se nombran).
 * [Estampar mi sello] (8C3): cierra este aviso y abre el pasaporte en la página del viaje con el sello estampándose (P2e).
 */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function rangoDeFechas(inicio: string, fin: string): string {
  const a = new Date(`${inicio}T12:00:00`)
  const b = new Date(`${fin}T12:00:00`)
  return `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]}`
}

const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' } as const
const GRADO_CON_ARTICULO: Record<string, string> = { bronce: 'el bronce', plata: 'la plata', oro: 'el oro', diamante: 'el diamante' }

/** «{ciudad} {anio}» → «Lanzarote 2026»: los nombres de los logros llevan huecos que se rellenan con el destino y el año del escalón. Nunca sale una llave suelta. */
export function rellenarNombre(nombre: string | null | undefined, ciudad: string, anio: string | number | null | undefined): string | null {
  if (!nombre) return null
  return nombre.replace(/\{ciudad\}/g, ciudad || 'tu destino').replace(/\{anio\}/g, anio != null && anio !== '' ? String(anio) : String(new Date().getFullYear())).replace(/\{[a-z_]+\}/gi, '').replace(/\s{2,}/g, ' ').trim()
}

/** Los kilómetros del viaje: lo que suman las rectas entre paradas seguidas de cada día (una cifra para el recuerdo, no para navegar). */
export function kmDelViaje(days: { stops?: { coordinates?: { lat?: number; lng?: number }; isZoneWalk?: boolean }[] }[] | undefined): number {
  const rad = (g: number) => (g * Math.PI) / 180
  let total = 0
  for (const d of days ?? []) {
    const ps = (d.stops ?? []).filter((s) => !s.isZoneWalk && typeof s.coordinates?.lat === 'number' && typeof s.coordinates?.lng === 'number')
    for (let i = 1; i < ps.length; i++) {
      const a = ps[i - 1]!.coordinates as { lat: number; lng: number }
      const b = ps[i]!.coordinates as { lat: number; lng: number }
      const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
      total += 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
    }
  }
  return Math.round(total)
}

interface SitioPorReclamar {
  sitio: string
  nombre: string | null
  fecha: string
  dia: number | null
  colecciones: string[]
  falta: string[]
}

export default function ResumenViaje(): ReactNode {
  const route = useRouteStore((s) => s.route)
  const tripId = useSyncStore((s) => s.activeTripId) ?? route?.id ?? null
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  const [resumen, setResumen] = useState<ResumenLogros | null>(null)
  const [viajero, setViajero] = useState<LogrosViajero | null>(null)
  const [cargado, setCargado] = useState(false)
  const [fotos, setFotos] = useState(0)
  const [hojaSorpresas, setHojaSorpresas] = useState(false)
  useEffect(() => {
    let vivo = true
    void Promise.all([pedirEstado(tripId), pedirResumen(tripId, null), pedirViajero()]).then(([e, r, v]) => {
      if (!vivo) return
      setEstado(e)
      setResumen(r)
      setViajero(v)
      setCargado(true)
    })
    return () => {
      vivo = false
    }
  }, [tripId])
  useEffect(() => {
    if (!tripId) return
    let vivo = true
    void contarFotos([tripId]).then((m) => vivo && setFotos(m.get(tripId) ?? 0)).catch(() => undefined)
    return () => {
      vivo = false
    }
  }, [tripId])
  const ciudad = estado?.ciudad ?? ''
  const portada = usePortadaDeViaje(tripId ?? '', route?.destination ?? ciudad, true)
  const cerrar = () => useMomentosUI.getState().cerrarResumenViaje()
  const estampar = () => {
    cerrar()
    useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: `sello:${tripId}` })
  }

  // Lo ganado EN ESTE VIAJE (`resumen.ganado`).
  const ganadoDelViaje = resumen?.ganado ?? []
  const nuevos = ganadoDelViaje
    .filter((g) => g.logro.startsWith('viajero:'))
    .map((g) => {
      const id = g.logro.slice('viajero:'.length)
      const def = viajero?.logros?.find((l) => l.id === id)
      const esc = def?.escalones?.find((e) => String(e.n) === String(g.escalon))
      return { id, escalon: g.escalon || null, destino: g.destino, nombre: rellenarNombre(esc?.nombre ?? def?.nombre ?? null, ciudad, g.escalon) }
    })
    .filter((x) => x.nombre)
  const sumadas = useMemo(() => {
    const por = new Map<string, number>()
    for (const g of ganadoDelViaje) if (g.logro === 'pedazo') por.set(g.escalon.split(':')[0]!, (por.get(g.escalon.split(':')[0]!) ?? 0) + 1)
    return [...por.entries()].map(([id, mas]) => ({ id, mas, c: estado?.colecciones.find((c) => c.id === id) })).filter((x) => x.c)
  }, [ganadoDelViaje, estado])
  const emblemas = useMemo(() => {
    const ids = new Set(ganadoDelViaje.filter((g) => g.logro === 'emblema').map((g) => g.escalon))
    return (estado?.secretos.encontrados_lista ?? []).filter((e) => ids.has(e.id))
  }, [ganadoDelViaje, estado])
  const sello = estado?.sellos[0]
  const secretos = estado?.secretos
  const porDescubrir = secretos ? Math.max(0, secretos.total - secretos.encontrados) : 0
  const lanza = estado?.destino === 'lanzarote'
  const dias = estado?.viaje ? Math.round((Date.parse(`${estado.viaje.fin}T12:00:00Z`) - Date.parse(`${estado.viaje.inicio}T12:00:00Z`)) / 86400000) + 1 : null
  const paradas = (route?.days ?? []).reduce((n, d) => n + (d.stops ?? []).filter((s) => !s.isZoneWalk).length, 0)
  const km = kmDelViaje(route?.days as never)
  const cifras = [
    ...(dias ? [{ n: String(dias), l: dias === 1 ? 'DÍA' : 'DÍAS' }] : []),
    { n: String(paradas), l: paradas === 1 ? 'PARADA' : 'PARADAS' },
    ...(km > 0 ? [{ n: String(km), l: 'KM' }] : []),
    { n: String(fotos), l: fotos === 1 ? 'FOTO' : 'FOTOS' },
  ]
  // «Te quedan N sorpresas por reclamar»: N es EXACTAMENTE la lista de la hoja (sitios de la ruta que dan algún pedazo y aún no se tiene; un emblema oculto nunca cuenta ni se nombra).
  const pend = (resumen?.pendiente ?? estado?.pendiente) as ((ResumenLogros['pendiente']) & { pendientes?: SitioPorReclamar[] }) | undefined
  const lista = (pend?.pendientes ?? []).filter((x) => x.falta.includes('pedazo'))
  const hayPlazo = Boolean(pend && !pend.plazo_pasado)
  const hastaCuando = fraseDelPlazo(route)?.replace('Puedes reclamar hasta', 'Hasta')
  const fondoPortada = portada.url ? `center/cover url(${portada.url})` : 'linear-gradient(160deg,#E9A978 0%,#B2593A 38%,#4A2A24 72%,#1C2230 100%)'
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Resumen del viaje" data-resumen-del-viaje style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {!estado ? (
        <>
          <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 8px)', width: 48, height: 48, border: 'none', background: 'transparent', color: '#1C2230', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div style={{ margin: 'auto', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center', padding: 24 }}>{cargado ? 'Todavía no hay nada que enseñar de este viaje.' : 'Preparando tu resumen…'}</div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, padding: '0 20px calc(env(safe-area-inset-bottom,0px) + 34px)' }}>
          <div data-resumen-portada style={{ position: 'relative', margin: '0 -20px', minHeight: 330, background: fondoPortada, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 18px', gap: 12 }}>
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 130, background: 'linear-gradient(to bottom,rgba(28,34,48,.45),transparent)' }} />
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, background: 'linear-gradient(to top,rgba(20,24,36,.92),transparent)' }} />
            <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 14, top: 'calc(env(safe-area-inset-top,0px) + 10px)', width: 44, height: 44, border: 'none', borderRadius: '50%', background: 'rgba(255,253,248,.9)', color: '#1C2230', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <span style={{ position: 'relative', font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D59A' }}>
              Tu viaje{estado.viaje?.inicio && estado.viaje?.fin ? ` · ${rangoDeFechas(estado.viaje.inicio, estado.viaje.fin)}` : ''}
            </span>
            <span style={{ position: 'relative', font: "400 38px/1 'Instrument Serif',serif", color: '#FFFDF8', letterSpacing: '-.01em', textWrap: 'balance' as never }}>
              Lo que te llevas de <em style={{ fontStyle: 'italic', color: '#F3D59A' }}>{ciudad || 'tu viaje'}</em>
            </span>
            <span data-cifras-del-viaje style={{ position: 'relative', display: 'flex', gap: 6 }}>
              {cifras.map((c) => (
                <span key={c.l} style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 14, background: 'rgba(255,253,248,.14)', border: '1px solid rgba(255,253,248,.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ font: "600 16px/1 'Geist'", color: '#FFFDF8' }}>{c.n}</span>
                  <span style={{ font: "500 9px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(255,253,248,.75)', marginTop: 3 }}>{c.l}</span>
                </span>
              ))}
            </span>
          </div>

          {sello?.grado && (
            <div data-resumen-medalla style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, background: 'radial-gradient(120% 140% at 50% 0%,#3A3F5C 0%,#232840 50%,#1C2230 100%)', border: '1px solid rgba(243,213,154,.35)', boxShadow: '0 16px 28px -18px rgba(28,34,48,.8)', padding: '22px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -60, marginLeft: -120, width: 240, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(243,213,154,.25),transparent 68%)' }} />
              <div style={{ position: 'relative', animation: 'moIn .8s .2s both' }}>
                <Sello id={sello.id} grado={sello.grado as GradoDeSello} tam={132} />
              </div>
              <span style={{ position: 'relative', font: "400 25px/1.1 'Instrument Serif',serif", color: '#FFFDF8', textAlign: 'center', textWrap: 'balance' as never }}>
                Has conseguido {GRADO_CON_ARTICULO[sello.grado] ?? sello.grado} de <em style={{ fontStyle: 'italic', color: '#F3D59A' }}>{ciudad}</em>
              </span>
            </div>
          )}

          {sumadas.length > 0 && (
            <div data-resumen-colecciones style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={ETIQUETA}>Colecciones</span>
              {sumadas.map(({ id, mas, c }) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px 10px 10px', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 8px 20px -16px rgba(28,34,48,.35)' }}>
                  <Insignia coleccion={id} ganados={c!.sitios.filter((s) => s.visto).map((s) => s.sitio)} completa={c!.completa} tam={64} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ flex: 'none', minWidth: 36, height: 26, padding: '0 9px', borderRadius: 999, background: 'oklch(0.55 0.17 5 / .12)', color: 'oklch(0.48 0.17 5)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 13px 'Geist Mono',monospace" }}>+{mas}</span>
                    <span style={{ flex: 1, font: "400 19px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{c!.nombre}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {emblemas.length > 0 && (
            <div data-resumen-emblemas style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(120% 100% at 50% 0%,#2A3050 0%,#1C2230 60%,#161B28 100%)', border: '1px solid rgba(243,213,154,.3)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ paddingLeft: 4, font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D59A' }}>EMBLEMAS OCULTOS</span>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, emblemas.length)},minmax(0,1fr))`, gap: 12 }}>
                {emblemas.map((e) => (
                  <div key={e.id} data-emblema-del-resumen={e.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Emblema id={lanza && ORDEN_EMBLEMAS_LANZAROTE.includes(e.id) ? idDeDibujoLanzarote(e.id) : e.id} tam={78} animado={false} />
                    </span>
                    <span style={{ font: "400 15px/1.15 'Instrument Serif',serif", color: '#FFFDF8', textAlign: 'center', textWrap: 'balance' as never }}>{e.nombre}</span>
                  </div>
                ))}
              </div>
              {porDescubrir > 0 && <span style={{ textAlign: 'center', font: "italic 400 16px 'Instrument Serif',serif", color: 'rgba(255,253,248,.7)' }}>{`+${porDescubrir} ${porDescubrir === 1 ? 'secreto' : 'secretos'} por descubrir`}</span>}
            </div>
          )}
          {emblemas.length === 0 && secretos && porDescubrir > 0 && <span data-resumen-secretos style={{ textAlign: 'center', font: "italic 400 17px 'Instrument Serif',serif", color: 'rgba(28,34,48,.6)' }}>{lineaDeSecretos(ciudad, secretos.total, secretos.encontrados)}</span>}

          {nuevos.length > 0 && (
            <div data-resumen-viajero style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={ETIQUETA}>Logros de viajero nuevos</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px 8px' }}>
                {nuevos.map((n, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 92, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Chapa logro={n.id} escalon={n.escalon} destino={n.destino} ciudad={n.id === "edicion_anio" ? ciudad : undefined} tam={92} igual />
                    </span>
                    <span style={{ font: "400 15px/1.12 'Instrument Serif',serif", textAlign: 'center', textWrap: 'balance' as never, maxWidth: 104 }}>{n.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hayPlazo && lista.length > 0 && (
            <button type="button" data-sorpresas-por-reclamar onClick={() => setHojaSorpresas(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 20, background: '#FFFDF8', border: '1.5px solid oklch(0.55 0.17 5 / .45)', boxShadow: '0 10px 20px -14px oklch(0.5 0.17 5 / .5)', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
              <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: 'oklch(0.55 0.17 5 / .12)', color: 'oklch(0.48 0.17 5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" /></svg>
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: "600 14.5px/1.2 'Geist'" }}>{`Te quedan ${lista.length} ${lista.length === 1 ? 'sorpresa' : 'sorpresas'} por reclamar`}</span>
                {hastaCuando && <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{hastaCuando}</span>}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.48 0.17 5)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            {tripId && (
              <button type="button" onClick={estampar} data-estampar-sello style={{ height: 56, border: 'none', borderRadius: 999, background: 'linear-gradient(105deg,#D9B26A,#F8E7BC 45%,#E2BD7A 70%,#C99A4C)', boxShadow: '0 12px 22px -12px rgba(150,105,30,.75), inset 0 1px 0 rgba(255,255,255,.7)', color: '#2A1D10', font: "700 15.5px 'Geist'", cursor: 'pointer' }}>
                Estampar mi sello
              </button>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => useMomentosUI.getState().abrirCompartir({ tipo: 'viaje' })} style={{ flex: 1, height: 48, border: '1px solid rgba(28,34,48,.18)', borderRadius: 999, background: '#FFFDF8', color: '#1C2230', font: "600 14px 'Geist'", cursor: 'pointer' }}>
                Compartir mi viaje
              </button>
              <button type="button" onClick={cerrar} style={{ flex: 1, height: 48, border: '1px solid rgba(28,34,48,.18)', borderRadius: 999, background: '#FFFDF8', color: '#1C2230', font: "600 14px 'Geist'", cursor: 'pointer' }}>
                Ver mi viaje
              </button>
            </div>
          </div>
        </div>
      )}
      {hojaSorpresas && tripId && <HojaDeSorpresas lista={lista} ciudad={ciudad} tripId={tripId} quedanSecretos={porDescubrir > 0 && (pend?.pendientes ?? []).some((x) => x.falta.includes('emblema'))} onCerrar={() => setHojaSorpresas(false)} onCerrarResumen={cerrar} />}
    </div>
  )
}

/**
 * La hoja «Te quedan N sorpresas por reclamar» (V9, Design): la lista de los sitios de la ruta que se quedaron sin su pedazo, cada uno con su foto, su nombre, su día («Día 3 · mié 11») y lo que da
 * («Tierra de fuego · Los imprescindibles»), con [Subir foto] en cada uno; abajo, [Reclamar con tus fotos] para subir varias a la vez. Los emblemas ocultos nunca se nombran: como mucho, una línea al final.
 */
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
function diaEnPalabras(dia: number | null, fecha: string): string {
  const f = new Date(`${fecha}T12:00:00Z`)
  return `${dia != null ? `Día ${dia} · ` : ''}${DIAS_CORTOS[f.getUTCDay()]} ${f.getUTCDate()}`
}
function FotoDe({ nombre, ciudad }: { nombre: string; ciudad: string }): ReactNode {
  const [u, setU] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void fetchPlacePhoto(nombre, ciudad, null, 'thumb').then((x) => vivo && setU(x))
    return () => {
      vivo = false
    }
  }, [nombre, ciudad])
  return <span style={{ flex: 'none', width: 48, height: 48, borderRadius: 14, background: u ? `center/cover url(${u})` : 'linear-gradient(160deg,#E7B98A,#9A6A48)' }} />
}
function HojaDeSorpresas({ lista, ciudad, tripId, quedanSecretos, onCerrar, onCerrarResumen }: { lista: SitioPorReclamar[]; ciudad: string; tripId: string; quedanSecretos: boolean; onCerrar: () => void; onCerrarResumen: () => void }): ReactNode {
  const [elegido, setElegido] = useState<string | null>(null)
  const plazo = fraseDelPlazo(useRouteStore.getState().route)?.replace('Puedes reclamar hasta', 'Hasta')
  return (
    <div role="dialog" aria-modal="true" aria-label="Sorpresas por reclamar" data-hoja-sorpresas style={{ position: 'fixed', inset: 0, zIndex: 9100 }}>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.5)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88vh', borderRadius: '30px 30px 0 0', background: '#FFFDF8', padding: '12px 0 calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#1C2230' }}>
        <CruzDeHoja onCerrar={onCerrar} />
        <span style={{ flex: 'none', width: 40, height: 5, borderRadius: 3, background: 'rgba(28,34,48,.2)' }} />
        <span style={{ font: "400 26px/1.1 'Instrument Serif',serif", textAlign: 'center', padding: '0 20px' }}>{`Te quedan ${lista.length} ${lista.length === 1 ? 'sorpresa' : 'sorpresas'} por reclamar`}</span>
        <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center', padding: '0 24px' }}>{`Sitios de tu ruta${ciudad ? ` en ${ciudad}` : ''} que se quedaron sin su pedazo.${plazo ? ` ${plazo}.` : ''}`}</span>
        <input type="file" accept="image/*" className="hidden" data-sorpresa-entrada onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const sitio = elegido; setElegido(null); if (f && sitio) { onCerrar(); onCerrarResumen(); void subirMiFoto(tripId, sitio, f) } }} />
        <div style={{ alignSelf: 'stretch', flex: '0 1 auto', overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((s) => (
            <div key={s.sitio} data-sorpresa={s.sitio} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px 8px 8px', borderRadius: 18, background: '#F5EFE4', border: '1px solid rgba(28,34,48,.06)' }}>
              <FotoDe nombre={s.nombre ?? s.sitio} ciudad={ciudad} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: "600 14.5px/1.2 'Geist'" }}>{s.nombre ?? s.sitio}</span>
                <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.6)' }}>{[diaEnPalabras(s.dia, s.fecha), ...(s.colecciones.length > 0 ? [s.colecciones.join(' · ')] : [])].join(' — ')}</span>
              </span>
              <button type="button" data-subir-foto-de-sorpresa onClick={() => { setElegido(s.sitio); setTimeout(() => document.querySelector<HTMLInputElement>('[data-sorpresa-entrada]')?.click(), 0) }} style={{ flex: 'none', minHeight: 44, height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', display: 'flex', alignItems: 'center', font: "600 12.5px 'Geist'" }}>Subir foto</span>
              </button>
            </div>
          ))}
          {quedanSecretos && <span style={{ flex: 'none', textAlign: 'center', padding: '6px 0 2px', font: "italic 400 16px 'Instrument Serif',serif", color: 'rgba(28,34,48,.55)' }}>Y quizá algún secreto…</span>}
        </div>
        <button type="button" data-reclamar-desde-sorpresas onClick={() => { onCerrar(); abrirGaleriaDeReclamo() }} style={{ ...BTN_CAM_ORO, alignSelf: 'stretch', margin: '0 20px', height: 54, border: 'none', borderRadius: 999, font: "700 15px 'Geist'", cursor: 'pointer' }}>Reclamar con tus fotos</button>
      </div>
    </div>
  )
}
