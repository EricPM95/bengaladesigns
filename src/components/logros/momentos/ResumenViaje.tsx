import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'
import { useEffect, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePortadaDeViaje } from '../../../hooks/usePortadaDeViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { useNumeroFotos } from '../../../lib/useNumeroFotos'
import { urlParaMostrar } from '../../../lib/fotosViaje'
import { resumenDeViaje } from '../../../lib/viajesPerfil'
import { AlbumDeViaje } from '../../perfil/AlbumDeViaje'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { fraseDelPlazo } from '../../../lib/reclamar'
import { subirMiFoto } from '../../../lib/companero'
import { useLogrosPantallas } from '../pantallas/useLogrosPantallas'
import { Chapa, Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { ORDEN_EMBLEMAS_LANZAROTE, idDeDibujoLanzarote } from '../dibujos/emblemasLanzarote'
import { abrirGaleriaDeReclamo } from '../reclamar/Reclamar'
import { BOTON_CLARO, BOTON_GRANATE } from '../../ui/botonesOro'
import { BanderaRedonda } from '../../ui/BanderaRedonda'
import { BTN_CAM_ORO } from '../visto/Hojas'
import { COLOR_DE_GRADO, conDe } from '../pantallas/destino/formato'
import { datosDelResumenViaje } from './datosDelResumenViaje'
import { estadoGuardado, pedirEstado, pedirResumen, pedirViajero, resumenGuardado, viajeroGuardado, type EstadoLogros, type LogrosViajero, type ResumenLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { selloYaEstampado } from '../../../lib/selloEstampado'
import { cifraQueSube, claveResumenViaje, dentroDelEstudio, marcarVisto, movimientoReducido, sonarResumenUnaVez, useProgresoDeCifras, yaSeVio } from './cifrasQueSuben'
import { useGanados, useHojasDeLogros } from '../pantallas/todos/api'
import { HojasDeLogros } from '../pantallas/todos/HojasDeLogros'
import '../pantallas/todos/todos.css'

/**
 * «RESUMEN DE TU VIAJE A ROMA» (V79, apartado 2; Design «La vuelta en HOY», VL7a y VL7b; sustituye a «Lo que te llevas de…» de la V9). Pantalla completa con la MISMA forma que la página de logros del destino (P1, V72: `PaginaDeDestino`),
 * pero SOLO con lo ganado EN ESTE VIAJE (las cuentas, en `datosDelResumenViaje.ts`, puras):
 *   · arriba la foto real del destino, «TU VIAJE A ROMA · 6 DÍAS», «Resumen de tu viaje a Roma» y la tarjeta de la medalla con su grado y su frase;
 *   · «Más medallas» (solo si el destino tiene más de una y en este viaje se ganó la otra), «Colecciones que han avanzado» («4 de 8» y su barrita), «Emblemas ocultos descubiertos», «Logros de viajero» (sin círculo de vitrina:
 *     aquí no hay vitrina) y «Tus fotos del viaje» (+N; al tocar, el álbum). Lo que no tiene nada, no sale (VL7b);
 *   · «Roma aún esconde 9 secretos: vuelve cuando quieras» y [Ver mi pasaporte], en GRANATE (regla V79: el pasaporte va siempre en granate).
 * Al tocar una medalla o una colección sube su ficha en grande (V72, `FichaGrande`); un logro de viajero, su ficha (`FichaHoja`).
 * (Se mantienen, aunque el dibujo no los enseñe —regla V46—: las cifras del viaje, «Te quedan N sorpresas por reclamar», [Compartir mi viaje] y [Ver mi viaje]; ver DECISIONES_V79.)
 * [Ver mi pasaporte] (8C3): cierra este aviso y abre el pasaporte en la página del viaje, con el sello estampándose la primera vez (P2e) y sin estampar las siguientes (antes: [Estampar mi sello] / [Ver mi sello]).
 * Consultas a Supabase: la lista de fotos del viaje (`useFotosViaje`: unas 47 filas ≈ 15 KB), UNA vez al abrir; lo ganado sale del servidor (GET /api/logros/estado y /resumen, una vez al abrir). Nada en bucle.
 */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function rangoDeFechas(inicio: string, fin: string): string {
  const a = new Date(`${inicio}T12:00:00`)
  const b = new Date(`${fin}T12:00:00`)
  return `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]}`
}

/** La clave con que se pide una ficha en grande (): «coleccion:roma:imprescindibles» o la de una medalla de ciudad (su clave interna es «sello»: ver CLAUDE.md, V37). */
const claveDeFicha = (que: 'coleccion' | 'medalla', destino: string, id: string): string => [que === 'medalla' ? 'sel' + 'lo' : que, destino, id].join(':')
const TITULO_DE_SECCION = { font: "400 26px/1 'Instrument Serif',serif" } as const

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

/** (V35B) Un viaje de EJEMPLO para el estudio de sonidos (/admin/sonidos): el resumen sale lleno, no con lo que tenga la cuenta de quien mira. El viajero real nunca pasa este dato. */
export interface DatosDeEjemploDelResumen {
  estado: EstadoLogros
  resumen: ResumenLogros
  viajero: LogrosViajero
  dias: number
  paradas: number
  km: number
  fotos: number
}

/** Un título de sección del resumen («Más medallas», «Colecciones que han avanzado»…): el mismo serif de la página del destino. */
function Seccion({ titulo, datos, hijos }: { titulo: string; datos: string; hijos: ReactNode }): ReactNode {
  return (
    <div {...{ [datos]: '' }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={TITULO_DE_SECCION}>{titulo}</span>
      {hijos}
    </div>
  )
}

export default function ResumenViaje({ ejemplo }: { ejemplo?: DatosDeEjemploDelResumen } = {}): ReactNode {
  const route = useRouteStore((s) => s.route)
  const tripIdReal = useSyncStore((s) => s.activeTripId) ?? route?.id ?? null
  const tripId = ejemplo ? null : tripIdReal
  // (V15) Abre AL INSTANTE con lo último que se vio de este viaje (lo guardado en el móvil); solo la primera vez sale «Preparando tu resumen…». Lo nuevo llega por detrás.
  const [estado, setEstado] = useState<EstadoLogros | null>(() => ejemplo?.estado ?? estadoGuardado(tripId))
  const [resumen, setResumen] = useState<ResumenLogros | null>(() => ejemplo?.resumen ?? resumenGuardado(tripId))
  const [viajero, setViajero] = useState<LogrosViajero | null>(() => ejemplo?.viajero ?? viajeroGuardado())
  const [cargado, setCargado] = useState(Boolean(ejemplo))
  const [hojaSorpresas, setHojaSorpresas] = useState(false)
  const [album, setAlbum] = useState(false)
  // (V38, V79) Tocar un logro de viajero, una medalla o una colección abre SU ficha: la misma pieza de la pestaña Logros (`FichaHoja` / `FichaGrande`, dentro de HojasDeLogros), no una copia. Lo ganado (`useGanados`) es lo mismo que enseña esa pestaña.
  // Consulta: GET /api/logros/ganados, UNA vez al abrir una ficha (y solo si aún no se había pedido); baja unos 20-40 KB (lo ganado de la cuenta), nunca en bucle ni en segundo plano.
  const ganados = useGanados((x) => x.datos)
  const fichaAbierta = useHojasDeLogros((x) => x.ficha)
  const abrirFicha = (clave: string) => {
    void useGanados.getState().cargar()
    useHojasDeLogros.getState().abrirFicha(clave)
  }
  useEffect(() => () => useHojasDeLogros.getState().limpiar(), [])
  // (V38C) Suena SOLO la primera vez que se ve este resumen (el del viaje acabado) y SOLO cuando los números suben de verdad en pantalla; abierto otra vez (desde el viaje, LOGROS o el Perfil), en silencio y con los números ya puestos.
  // En el estudio de sonidos (con datos de ejemplo) suben siempre y suena al pulsar ▶ (lo hace sonar él).
  const [primera] = useState(() => (ejemplo ? true : tripId ? !yaSeVio(claveResumenViaje(tripId)) && !movimientoReducido() : false))
  useEffect(() => {
    if (ejemplo) return undefined
    let vivo = true
    void Promise.all([pedirEstado(tripId), pedirResumen(tripId, null), pedirViajero()]).then(([e, r, v]) => {
      if (!vivo) return
      setEstado((p) => e ?? p)
      setResumen((p) => r ?? p)
      setViajero((p) => v ?? p)
      setCargado(true)
    })
    return () => {
      vivo = false
    }
  }, [tripId])
  // (V14) Las fotos del viaje se cuentan y se buscan con el id de la RUTA (`route.id`), que es con el que se guardan (y con el que las cuenta el Perfil). (V79) Además se baja la lista (solo para las miniaturas de «Tus fotos del viaje»).
  const idDeFotos = ejemplo ? '' : (route?.id ?? tripId ?? '')
  const { fotos: listaDeFotos } = useFotosViaje(idDeFotos || null)
  const cuentaDeFotos = useNumeroFotos(idDeFotos ? [idDeFotos] : []) // la misma cuenta que el Perfil (≈0,1 KB, una vez al abrir)
  const fotos = ejemplo ? ejemplo.fotos : (cuentaDeFotos?.get(idDeFotos) ?? listaDeFotos.length)
  const ciudad = estado?.ciudad ?? ''
  // (V14) La portada: lo que eligió el viajero; si no eligió, una foto hecha EN el destino (mejor la de un sitio con logro); y si no hay ninguna, la del destino de nuestros datos.
  // (V15) La misma regla de portada que el Perfil y los recuerdos (una sola para toda la app): lo que eligió el viajero; si no, una foto hecha en el destino (mejor la de un sitio con logro); si no, la del destino.
  const sitiosConLogro = (estado?.colecciones ?? []).flatMap((c) => c.sitios.map((x) => ({ nombre: x.nombre ?? x.sitio, visto: x.visto })))
  const portada = usePortadaDeViaje(idDeFotos, route?.destination ?? ciudad, true, route, sitiosConLogro)
  const cerrar = () => useMomentosUI.getState().cerrarResumenViaje()
  // (V14) Estampar solo UNA vez: con el sello ya estampado, el pasaporte se abre en su página sin estampar.
  const yaEstampado = selloYaEstampado(tripId)
  const verPasaporte = () => {
    cerrar()
    useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: `${yaEstampado ? 'ver-sello' : 'sello'}:${tripId}` })
  }

  // Lo ganado EN ESTE VIAJE, ya ordenado en secciones (puro: `datosDelResumenViaje`).
  const d = estado ? datosDelResumenViaje(estado, resumen, viajero) : null
  const lanza = estado?.destino === 'lanzarote'
  const secretos = estado?.secretos
  const dias = ejemplo ? ejemplo.dias : estado?.viaje ? Math.round((Date.parse(`${estado.viaje.fin}T12:00:00Z`) - Date.parse(`${estado.viaje.inicio}T12:00:00Z`)) / 86400000) + 1 : null
  const paradas = ejemplo ? ejemplo.paradas : (route?.days ?? []).reduce((n, x) => n + (x.stops ?? []).filter((s) => !s.isZoneWalk).length, 0)
  const km = ejemplo ? ejemplo.km : kmDelViaje(route?.days as never)
  const cifras = [
    { n: String(paradas), l: paradas === 1 ? 'PARADA' : 'PARADAS' },
    ...(km > 0 ? [{ n: String(km), l: 'KM' }] : []),
    { n: String(fotos), l: fotos === 1 ? 'FOTO' : 'FOTOS' },
  ]
  const hayCifras = cifras.some((c) => Number(c.n) > 0)
  const sube = primera && estado !== null && hayCifras
  const progreso = useProgresoDeCifras(sube)
  useEffect(() => {
    if (!sube || ejemplo || dentroDelEstudio() || !tripId) return
    if (yaSeVio(claveResumenViaje(tripId))) return // (en desarrollo React lo monta dos veces: la 2.ª ya lo encuentra marcado)
    marcarVisto(claveResumenViaje(tripId))
    sonarResumenUnaVez(true, 'resumen_viaje')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sube])
  // «Te quedan N sorpresas por reclamar»: N es EXACTAMENTE la lista de la hoja (sitios de la ruta que dan algún pedazo y aún no se tiene; un emblema oculto nunca cuenta ni se nombra).
  const pend = (resumen?.pendiente ?? estado?.pendiente) as ((ResumenLogros['pendiente']) & { pendientes?: SitioPorReclamar[] }) | undefined
  const lista = (pend?.pendientes ?? []).filter((x) => x.falta.includes('pedazo'))
  const hayPlazo = Boolean(pend && !pend.plazo_pasado)
  const hastaCuando = fraseDelPlazo(route)?.replace('Puedes reclamar hasta', 'Hasta')
  const fondoPortada = portada.url ? `center/cover url(${portada.url})` : 'linear-gradient(160deg,#E9A978 0%,#B2593A 38%,#4A2A24 72%,#1C2230 100%)'
  const miniaturas = listaDeFotos.filter((f) => urlParaMostrar(f)).slice(0, 4)
  const masFotos = Math.max(0, fotos - miniaturas.length)
  const medalla = d?.medalla ?? null
  const colorMedalla = medalla?.grado ? COLOR_DE_GRADO[medalla.grado] : 'rgba(28,34,48,.45)'
  const abrirDeLogro = (clave: string) => !ejemplo && abrirFicha(clave)
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Resumen del viaje" data-resumen-del-viaje style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {!estado || !d ? (
        <>
          <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 8px)', width: 48, height: 48, border: 'none', background: 'transparent', color: '#1C2230', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div style={{ margin: 'auto', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center', padding: 24 }}>{cargado ? 'Todavía no hay nada que enseñar de este viaje.' : 'Preparando tu resumen…'}</div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 0 calc(env(safe-area-inset-bottom,0px) + 34px)' }}>
          <div data-resumen-portada style={{ position: 'relative', flex: 'none', height: 230, background: fondoPortada, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 18px 58px', gap: 6 }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,0) 32%,rgba(0,0,0,.66))' }} />
            <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 16, top: 'calc(env(safe-area-inset-top,0px) + 10px)', width: 44, height: 44, border: 'none', borderRadius: '50%', background: 'rgba(28,34,48,.5)', color: '#FFFDF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <span data-resumen-ojo style={{ position: 'relative', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D59A' }}>
              {`Tu viaje a ${ciudad || 'tu destino'}${dias ? ` · ${dias} ${dias === 1 ? 'día' : 'días'}` : ''}`}
            </span>
            <span data-resumen-titulo style={{ position: 'relative', font: "400 34px/1.02 'Instrument Serif',serif", color: '#FFFDF8', letterSpacing: '-.01em', textWrap: 'balance' as never }}>
              {`Resumen de tu viaje a ${ciudad || 'tu destino'}`}
            </span>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {medalla && (
              <button type="button" data-resumen-medalla onClick={() => abrirDeLogro(claveDeFicha('medalla', estado.destino, medalla.id))} style={{ position: 'relative', marginTop: -44, border: '1px solid rgba(28,34,48,.07)', borderRadius: 26, background: '#FFFDF8', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 18px 30px -18px rgba(28,34,48,.45)', textAlign: 'left', color: 'inherit', font: 'inherit', cursor: ejemplo ? 'default' : 'pointer' }}>
                <Sello id={medalla.id} grado={(medalla.grado ?? 'bronce') as GradoDeSello} tam={92} apagado={!medalla.grado} animado={false} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>{ciudad}</span>
                  <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: colorMedalla, textTransform: 'uppercase' }}>{medalla.grado ? `${medalla.grado}${medalla.nombreGrado ? ` · ${medalla.nombreGrado}` : ''}` : 'Por conseguir'}</span>
                  {medalla.frase && <span data-resumen-frase-medalla style={{ font: "500 12.5px/1.35 'Geist'", color: 'rgba(28,34,48,.62)' }}>{medalla.frase}</span>}
                  {medalla.frase2 && <span data-resumen-frase2-medalla style={{ font: "500 12.5px/1.35 'Geist'", color: 'rgba(28,34,48,.62)' }}>{medalla.frase2}</span>}
                </span>
              </button>
            )}

            {hayCifras && (
              <span data-cifras-del-viaje style={{ display: 'flex', gap: 6, marginTop: medalla ? -8 : -44, position: 'relative' }}>
                {cifras.map((c) => (
                  <span key={c.l} style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 14, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ font: "600 16px/1 'Geist'" }}>{cifraQueSube(Number(c.n), progreso)}</span>
                    <span style={{ font: "500 9px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.6)', marginTop: 3 }}>{c.l}</span>
                  </span>
                ))}
              </span>
            )}

            {d.masMedallas.length > 0 && (
              <Seccion titulo="Más medallas" datos="data-resumen-mas-medallas" hijos={
                <div style={{ display: 'flex', gap: 10 }}>
                  {d.masMedallas.map((m) => (
                    <button key={m.id} type="button" data-resumen-mas-medalla={m.id} onClick={() => abrirDeLogro(claveDeFicha('medalla', estado.destino, m.id))} style={{ flex: 1, minWidth: 0, borderRadius: 24, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.3)', boxShadow: '0 12px 20px -16px rgba(28,34,48,.4)', padding: '14px 8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'inherit', font: 'inherit', cursor: ejemplo ? 'default' : 'pointer' }}>
                      <Sello id={m.id} grado={m.grado as GradoDeSello} tam={96} animado={false} />
                      <span style={{ font: "400 18px/1.1 'Instrument Serif',serif", textAlign: 'center' }}>{`Medalla ${conDe(m.nombre)}`}</span>
                      <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', color: COLOR_DE_GRADO[m.grado] ?? '#8A6A2C', textTransform: 'uppercase' }}>{m.grado}</span>
                    </button>
                  ))}
                </div>
              } />
            )}

            {d.colecciones.length > 0 && (
              <Seccion titulo="Colecciones que han avanzado" datos="data-resumen-colecciones" hijos={
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {d.colecciones.map((c) => {
                    const est = estado.colecciones.find((x) => x.id === c.id)
                    return (
                      <button key={c.id} type="button" data-coleccion-del-resumen={c.id} onClick={() => abrirDeLogro(claveDeFicha('coleccion', estado.destino, c.id))} style={{ minHeight: 44, borderRadius: 20, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', padding: '10px 4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', cursor: ejemplo ? 'default' : 'pointer', color: 'inherit', font: 'inherit' }}>
                        <Insignia coleccion={c.id} ganados={(est?.sitios ?? []).filter((s) => s.visto).map((s) => s.sitio)} completa={c.completa} tam={72} />
                        <span style={{ font: "600 12px/1.2 'Geist'", textWrap: 'balance' as never, padding: '0 4px' }}>{c.nombre}</span>
                        <span style={{ font: "600 10.5px 'Geist Mono',monospace", color: c.completa ? 'oklch(0.42 0.09 150)' : 'oklch(0.48 0.17 5)' }}>{c.completa ? '✓ Completa' : `${c.n} de ${c.total}`}</span>
                        <span data-avance-de-coleccion aria-hidden="true" style={{ width: '64%', height: 3, borderRadius: 3, background: 'rgba(28,34,48,.1)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${c.total ? Math.round((c.n / c.total) * 100) : 0}%`, borderRadius: 3, background: c.completa ? 'oklch(0.5 0.1 150)' : 'oklch(0.48 0.17 5)' }} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              } />
            )}

            {d.emblemas.length > 0 && (
              <Seccion titulo="Emblemas ocultos descubiertos" datos="data-resumen-emblemas" hijos={
                <div style={{ borderRadius: 26, background: 'radial-gradient(120% 100% at 50% 0%,#252B45 0%,#1C2230 60%,#161B28 100%)', padding: '16px 8px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 6px', boxShadow: '0 16px 28px -18px rgba(28,34,48,.7)' }}>
                  {d.emblemas.map((e) => (
                    <div key={e.id} data-emblema-del-resumen={e.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 104 }}>
                      <span style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Emblema id={lanza && ORDEN_EMBLEMAS_LANZAROTE.includes(e.id) ? idDeDibujoLanzarote(e.id) : e.id} tam={84} animado={false} />
                      </span>
                      <span style={{ maxWidth: 104, textAlign: 'center', font: "600 8.5px/1.25 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(243,213,154,.85)', textTransform: 'uppercase' }}>{e.nombre}</span>
                    </div>
                  ))}
                </div>
              } />
            )}

            {d.logros.length > 0 && (
              <Seccion titulo="Logros de viajero" datos="data-resumen-viajero" hijos={
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {d.logros.map((n, i) => {
                    const dibujo = (
                      <span style={{ position: 'relative', display: 'block', width: 92, height: 92 }}>
                        <Chapa logro={n.logro} escalon={n.escalon} destino={n.destino} ciudad={n.logro === 'edicion_anio' ? ciudad : undefined} tam={92} igual />
                        {n.pais && <BanderaRedonda pais={n.pais} tam={30} esquina="abajo-derecha" />}
                      </span>
                    )
                    const pie = <span style={{ font: "600 12px/1.2 'Geist'", textAlign: 'center', padding: '0 4px', textWrap: 'balance' as never }}>{n.nombre}</span>
                    const caja = { borderRadius: 20, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.3)', padding: '12px 4px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'inherit', font: 'inherit' } as const
                    // Solo un logro de viajero tiene ficha que abrir; los demás son tarjetas para mirar (nunca un botón que no hace nada).
                    return n.tipo === 'viajero' ? (
                      <button key={i} type="button" data-logro-de-viajero={n.logro} onClick={() => abrirDeLogro(n.clave)} style={{ ...caja, cursor: ejemplo ? 'default' : 'pointer' }}>
                        {dibujo}
                        {pie}
                      </button>
                    ) : (
                      <div key={i} data-logro-del-viaje={n.tipo} style={caja}>
                        {dibujo}
                        {pie}
                      </div>
                    )
                  })}
                </div>
              } />
            )}

            {!ejemplo && miniaturas.length > 0 && (
              <Seccion titulo="Tus fotos del viaje" datos="data-resumen-fotos" hijos={
                <button type="button" data-abrir-album-del-viaje onClick={() => setAlbum(true)} aria-label="Abrir el álbum del viaje" style={{ display: 'flex', gap: 8, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                  {miniaturas.map((f) => (
                    <span key={f.id} style={{ flex: 1, aspectRatio: '1', borderRadius: 16, background: `center/cover url(${urlParaMostrar(f)})`, boxShadow: '0 8px 14px -10px rgba(28,34,48,.5)', border: '2px solid #FFFDF8' }} />
                  ))}
                  {masFotos > 0 && <span style={{ flex: 1, aspectRatio: '1', borderRadius: 16, background: '#1C2230', color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 17px 'Geist'" }}>{`+${masFotos}`}</span>}
                </button>
              } />
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 2 }}>
              {d.secretos && secretos && <span data-resumen-secretos style={{ textAlign: 'center', font: "italic 400 19px/1.3 'Instrument Serif',serif", color: '#6F4E37', textWrap: 'balance' as never }}>{d.secretos}</span>}
              {tripId && (
                <button type="button" onClick={verPasaporte} data-ver-pasaporte={yaEstampado ? 'ver' : 'estampar'} style={{ ...BOTON_GRANATE, height: 54, border: 'none', borderRadius: 17, font: "700 15.5px 'Geist'", cursor: 'pointer' }}>
                  Ver mi pasaporte
                </button>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => useMomentosUI.getState().abrirCompartir({ tipo: 'viaje' })} style={{ ...BOTON_CLARO, flex: 1, height: 48, borderRadius: 999, font: "600 14px 'Geist'", cursor: 'pointer' }}>
                  Compartir mi viaje
                </button>
                <button type="button" onClick={cerrar} style={{ ...BOTON_CLARO, flex: 1, height: 48, borderRadius: 999, font: "600 14px 'Geist'", cursor: 'pointer' }}>
                  Ver mi viaje
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {fichaAbierta && !ejemplo && ganados && (/^(coleccion|sello):/.test(fichaAbierta) || ganados.items.some((i) => i.clave === fichaAbierta)) && (
        <div className="vt" data-ficha-del-resumen style={{ position: 'fixed', inset: 0, zIndex: 9100 }}>
          <HojasDeLogros g={ganados} />
        </div>
      )}
      {album && route && (
        <div role="dialog" aria-modal="true" aria-label="Álbum del viaje" data-album-del-resumen className="fixed inset-0 flex flex-col bg-bg text-text" style={{ zIndex: 9100 }}>
          <header className="flex h-14 shrink-0 items-center px-2 pt-[env(safe-area-inset-top)]">
            <button type="button" onClick={() => setAlbum(false)} aria-label="Volver al resumen" className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-text">
              <span aria-hidden="true" className="text-[20px] leading-none">‹</span>
              Volver
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <h2 className="font-display text-[34px] leading-none text-text">{route.destination}</h2>
            <div className="mt-5">
              <AlbumDeViaje viaje={resumenDeViaje(route, null)} />
            </div>
          </div>
        </div>
      )}
      {hojaSorpresas && tripId && <HojaDeSorpresas lista={lista} ciudad={ciudad} tripId={tripId} inicio={estado?.viaje?.inicio ?? route?.answers?.dateRange?.start ?? null} quedanSecretos={Boolean(secretos && secretos.total - secretos.encontrados > 0 && (pend?.pendientes ?? []).some((x) => x.falta.includes('emblema')))} onCerrar={() => setHojaSorpresas(false)} onCerrarResumen={cerrar} />}
    </div>
  )
}

/**
 * La hoja «Te quedan N sorpresas por reclamar» (V9, Design): la lista de los sitios de la ruta que se quedaron sin su pedazo, cada uno con su foto, su nombre, su día («Día 3 · mié 11») y lo que da
 * («Tierra de fuego · Los imprescindibles»), con [Subir foto] en cada uno; abajo, [Reclamar con tus fotos] para subir varias a la vez. Los emblemas ocultos nunca se nombran: como mucho, una línea al final.
 */
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
/** (V38) El número del día sale de las FECHAS del viaje de ahora (la fecha del sitio menos el primer día), no del «número» que guardó el servidor: con un viaje cuyas fechas se cambiaron salía «Día 8» el cuarto día. Fuera del viaje, sin número. */
function numeroDelDia(fecha: string, inicio: string | null | undefined): number | null {
  if (!inicio) return null
  const n = Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86400000) + 1
  return n >= 1 ? n : null
}
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
function HojaDeSorpresas({ lista, ciudad, tripId, inicio, quedanSecretos, onCerrar, onCerrarResumen }: { lista: SitioPorReclamar[]; inicio?: string | null; ciudad: string; tripId: string; quedanSecretos: boolean; onCerrar: () => void; onCerrarResumen: () => void }): ReactNode {
  const [elegido, setElegido] = useState<string | null>(null)
  const plazo = fraseDelPlazo(useRouteStore.getState().route)?.replace('Puedes reclamar hasta', 'Hasta')
  return (
    <div role="dialog" aria-modal="true" aria-label="Sorpresas por reclamar" data-hoja-sorpresas style={{ position: 'fixed', inset: 0, zIndex: 9100 }}>
      <div onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: FONDO_DE_HOJA }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: 'min(88%, calc(100% - env(safe-area-inset-top,0px) - 28px))', borderRadius: '32px 32px 0 0', background: '#FFFDF8', padding: '12px 0 calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#1C2230' }}>
        <CruzDeHoja onCerrar={onCerrar} fuerte />
        <span style={{ flex: 'none', width: 40, height: 5, borderRadius: 3, background: 'rgba(28,34,48,.2)' }} />
        <span style={{ font: "400 26px/1.1 'Instrument Serif',serif", textAlign: 'center', padding: '0 56px', textWrap: 'balance' as never }}>{`Te quedan ${lista.length} ${lista.length === 1 ? 'sorpresa' : 'sorpresas'} por reclamar`}</span>
        <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center', padding: '0 24px' }}>{`Sitios de tu ruta${ciudad ? ` en ${ciudad}` : ''} que se quedaron sin su pedazo.${plazo ? ` ${plazo}.` : ''}`}</span>
        <input type="file" accept="image/*" className="hidden" data-sorpresa-entrada onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const sitio = elegido; setElegido(null); if (f && sitio) { onCerrar(); onCerrarResumen(); void subirMiFoto(tripId, sitio, f) } }} />
        <div style={{ alignSelf: 'stretch', flex: '0 1 auto', overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((s) => (
            <div key={s.sitio} data-sorpresa={s.sitio} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px 8px 8px', borderRadius: 18, background: '#F5EFE4', border: '1px solid rgba(28,34,48,.06)' }}>
              <FotoDe nombre={s.nombre ?? s.sitio} ciudad={ciudad} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: "600 14.5px/1.2 'Geist'" }}>{s.nombre ?? s.sitio}</span>
                <span style={{ font: "400 12px/1.3 'Geist'", color: 'rgba(28,34,48,.6)' }}>{[diaEnPalabras(inicio !== undefined ? numeroDelDia(s.fecha, inicio) : s.dia, s.fecha), ...(s.colecciones.length > 0 ? [s.colecciones.join(' · ')] : [])].join(' — ')}</span>
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
