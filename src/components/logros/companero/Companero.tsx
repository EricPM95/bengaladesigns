import { todayIso } from '../../../lib/dateRange'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { enSitio } from '../../../lib/articulos'
import { cargarCompanero, lineaDeLaTarjeta, quienEs, subirMiFoto, useCompaneroStore, yoTambienEstaba, type PendienteDeCompanero } from '../../../lib/companero'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { CandadoRedondo } from '../../pase/Candado'
import { abrirGaleriaDeReclamo } from '../reclamar/Reclamar'
import { BTN_CAM_ORO, Capa, Cruz, EstilosDelVisto, SERIF, TINTA } from '../visto/Hojas'
import { TRAZO, Trazo } from '../visto/trazos'

/**
 * «YO TAMBIÉN ESTABA» (Tanda V7, pantallas Y0 a Y5 de Design «Visto Fotos» · mode yo): la tarjeta de la hoja de logros (Y0), la hoja de un sitio (Y1), la de varios (Y2) y el aviso de la campana y el
 * punto del botón de logros (Y5). Los momentos (Y3a, Y3b) salen por la fila de la V6. Con el pase, como todos los logros; sin pase, con el candado pequeño (lleva al pase).
 */

/** Los plazos de reclamar son de 30 días (data/logros/ajustes.json `plazo_reclamar_dias`; el servidor es quien decide de verdad, esto solo evita preguntar por viajes viejos). */
const PLAZO_DE_RECLAMAR_DIAS = 30
/** (V15b) Los ids de los viajes guardados de esta cuenta que YA terminaron y están dentro del plazo: por todos ellos se pregunta «Yo también estaba», no solo por el viaje abierto. */
export function viajesTerminadosEnPlazo(): string[] {
  const hoy = todayIso()
  const sumar = (iso: string, n: number): string => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
  return (useSyncStore.getState().savedTrips ?? [])
    .filter((t) => {
      const fin = t.route?.answers?.dateRange?.end
      return Boolean(t.id && fin && fin < hoy && hoy <= sumar(fin, PLAZO_DE_RECLAMAR_DIAS))
    })
    .map((t) => t.id)
}

/**
 * (V16, decisión de Eric) «Yo también estaba» enseña SIEMPRE la foto del sitio de nuestros datos (la de las fichas), nunca la foto del compañero: no se guarda en tu cuenta, así que de nada sirve verla.
 * Un degradado cálido solo mientras llega.
 */
function FotoDelSitio({ p, grande = false, style }: { p: PendienteDeCompanero; grande?: boolean; style?: CSSProperties }): ReactNode {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void fetchPlacePhoto(p.nombre, p.ciudad ?? '', null, grande ? 'regular' : 'small').then((u) => vivo && setUrl(u))
    return () => {
      vivo = false
    }
  }, [p.nombre, p.ciudad, grande])
  return <span data-foto-del-sitio={url ? '1' : '0'} className="block" style={{ background: url ? `center/cover url(${url})` : 'linear-gradient(140deg,#E2C6A8,#A8734A)', ...style }} />
}

/** Y0: la tarjeta pequeña, solo si hay algo pendiente. Va en la hoja «Tus logros en …», debajo del plazo de «Reclamar con tus fotos». */
export function TarjetaDeCompanero({ tripId }: { tripId?: string | null } = {}): ReactNode {
  // (V15b) Con `tripId` (la hoja «Tus logros en Lanzarote»), solo lo de ESE viaje; sin él, todo.
  const todos = useCompaneroStore((s) => s.pendientes)
  const pendientes = tripId ? todos.filter((p) => p.viaje === tripId) : todos
  const sinPase = useCompaneroStore((s) => s.sinPase)
  if (pendientes.length === 0) return null
  const abrir = () => {
    if (sinPase) return abrirAvisoPase('reclamar')
    if (pendientes.length === 1) useCompaneroStore.getState().abrirSitio(pendientes[0].sitio, pendientes[0].viaje)
    else useCompaneroStore.getState().abrirLista(tripId ?? pendientes[0]?.viaje)
  }
  return (
    <button type="button" data-companero="tarjeta" onClick={abrir} className="mx-4 mb-2 flex flex-none items-center gap-3 rounded-2xl border px-3 py-2.5 text-left" style={{ background: '#FFFDF8', borderColor: 'rgba(181,138,46,.45)', color: TINTA, cursor: 'pointer' }}>
      <span className="flex flex-none">
        {pendientes.slice(0, 3).map((p, i) => (
          <span key={p.sitio} className="flex-none" style={{ marginLeft: i === 0 ? 0 : -10 }}>
            <FotoDelSitio p={p} style={{ width: 34, height: 34, borderRadius: 10, border: '2px solid #FFFDF8' }} />
          </span>
        ))}
      </span>
      <span className="flex-1" style={{ font: "500 13.5px/1.35 'Geist'" }}>{lineaDeLaTarjeta(pendientes)}</span>
      {sinPase ? <CandadoRedondo tamano="pequeno" diametro={20} datos="companero-candado" /> : <span aria-hidden style={{ font: "400 20px/1 'Geist'", color: 'rgba(28,34,48,.5)' }}>›</span>}
    </button>
  )
}

/** Y1: un solo sitio. La foto grande (la del sitio de la app), lo que dice, [Yo también estaba] y, debajo, [Subir mi foto]. */
function HojaDeUnSitio({ p, tripId }: { p: PendienteDeCompanero; tripId: string }): ReactNode {
  const error = useCompaneroStore((s) => s.error)
  const ocupado = useCompaneroStore((s) => s.ocupado)
  const sinPase = useCompaneroStore((s) => s.sinPase)
  const quien = p.de_nombre ?? 'Tu compañero'
  const cerrar = () => useCompaneroStore.getState().cerrar()
  const gana = () => (sinPase ? abrirAvisoPase('reclamar') : void yoTambienEstaba(tripId, [p.sitio]))
  const subir = () => (sinPase ? abrirAvisoPase('reclamar') : document.querySelector<HTMLInputElement>('[data-companero="entrada"]')?.click())
  return (
    <Capa onCerrar={cerrar} etiqueta="Yo también estaba" z={90}>
      <div data-companero="sitio" className="relative flex flex-col gap-3 overflow-hidden rounded-t-[28px] bg-[#FFFDF8] pb-[28px]" style={{ color: TINTA }}>
        <Cruz onCerrar={cerrar} oscura />
        <div data-companero="foto" className="relative w-full" style={{ height: 230 }}>
          <FotoDelSitio p={p} grande style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="flex flex-col gap-3 px-[18px]">
          <span style={{ font: `400 26px/1.1 ${SERIF}`, textWrap: 'balance' as never }}>{quien} lo consiguió {enSitio(p.nombre)}. ¿Estabais juntos?</span>
          {error && <span role="alert" data-companero="error" style={{ font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>{error}</span>}
          <button type="button" data-companero="yo-tambien" disabled={ocupado} onClick={gana} className="flex h-[52px] items-center justify-center gap-2 rounded-full border-0 disabled:opacity-60" style={{ ...BTN_CAM_ORO, font: "700 15px 'Geist'" }}>
            Yo también estaba
            {sinPase && <CandadoRedondo tamano="pequeno" diametro={20} datos="companero-candado" />}
          </button>
          <button type="button" data-companero="subir-mi-foto" disabled={ocupado} onClick={subir} className="flex min-h-11 items-center justify-center gap-1.5 self-center px-3 underline underline-offset-[3px] disabled:opacity-60" style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.7)', background: 'none', border: 'none' }}>
            <Trazo d={TRAZO.gal} tam={15} />
            Subir mi foto
          </button>
        </div>
      </div>
    </Capa>
  )
}

/** Y2: varios sitios. «Lo que conseguisteis juntos», [Yo también estaba en todos], uno por uno y [Subir mis fotos]. */
function HojaDeVarios({ pendientes, tripId }: { pendientes: PendienteDeCompanero[]; tripId: string }): ReactNode {
  const sinPase = useCompaneroStore((s) => s.sinPase)
  const ocupado = useCompaneroStore((s) => s.ocupado)
  const error = useCompaneroStore((s) => s.error)
  const cerrar = () => useCompaneroStore.getState().cerrar()
  const gana = (sitios: string[] | 'todos') => (sinPase ? abrirAvisoPase('reclamar') : void yoTambienEstaba(tripId, sitios))
  return (
    <Capa onCerrar={cerrar} etiqueta="Lo que conseguisteis juntos" z={90}>
      <div data-companero="lista" className="relative flex max-h-[88vh] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] px-[18px] pb-[26px] pt-5" style={{ color: TINTA }}>
        <Cruz onCerrar={cerrar} />
        <span className="pr-10" style={{ font: `400 28px/1.05 ${SERIF}` }}>Lo que conseguisteis juntos</span>
        <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(28,34,48,.65)' }}>{quienEs(pendientes)} los consiguió y tú aún no. Si estabais juntos, gánalos tú también.</span>
        {error && <span role="alert" data-companero="error" style={{ font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>{error}</span>}
        <button type="button" data-companero="en-todos" disabled={ocupado} onClick={() => gana('todos')} className="flex h-[52px] items-center justify-center gap-2 rounded-full border-0 disabled:opacity-60" style={{ ...BTN_CAM_ORO, font: "700 15px 'Geist'" }}>
          Yo también estaba en todos
          {sinPase && <CandadoRedondo tamano="pequeno" diametro={20} datos="companero-candado" />}
        </button>
        <div className="flex flex-col gap-2">
          {pendientes.map((p) => (
            <div key={p.sitio} data-companero="fila" className="flex items-center gap-2.5 rounded-2xl py-2 pl-2 pr-2" style={{ background: '#F5EFE4' }}>
              <button type="button" onClick={() => useCompaneroStore.getState().abrirSitio(p.sitio)} className="flex min-w-0 flex-1 items-center gap-2.5 border-0 bg-transparent p-0 text-left">
                <FotoDelSitio p={p} style={{ width: 44, height: 44, borderRadius: 12, flex: 'none' }} />
                <span className="min-w-0 flex-1" style={{ font: "500 14px/1.3 'Geist'" }}>{p.nombre}</span>
              </button>
              <button type="button" data-companero="yo-tambien-uno" disabled={ocupado} onClick={() => gana([p.sitio])} className="h-10 flex-none rounded-full border-0 px-3.5 disabled:opacity-60" style={{ ...BTN_CAM_ORO, font: "700 12.5px 'Geist'" }}>
                Yo también estaba
              </button>
            </div>
          ))}
        </div>
        <button type="button" data-companero="subir-mis-fotos" onClick={() => (sinPase ? abrirAvisoPase('reclamar') : (cerrar(), abrirGaleriaDeReclamo()))} className="flex min-h-11 items-center justify-center gap-1.5 self-center px-3 underline underline-offset-[3px]" style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.7)', background: 'none', border: 'none' }}>
          <Trazo d={TRAZO.gal} tam={15} />
          Subir mis fotos
        </button>
      </div>
    </Capa>
  )
}

/**
 * Montado una vez (en `VistoFlujo`): pide lo pendiente del compañero al abrir el viaje (y al acabar de reclamar), pone el punto del botón de logros si hay algo, y dibuja las hojas Y1 e Y2 con el
 * `<input>` de [Subir mi foto].
 */
export function HostDeCompanero(): ReactNode {
  const tripActivo = useSyncStore((s) => s.activeTripId)
  const route = useRouteStore((s) => s.route)
  const tripId = tripActivo ?? route?.id ?? null
  const abierta = useCompaneroStore((s) => s.abierta)
  const pendientes = useCompaneroStore((s) => s.pendientes)
  const entrada = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!tripId) return undefined
    let vivo = true
    let temporizador: number | undefined
    // (V15b) Se pregunta al abrir el viaje y, si la respuesta no fue buena (sin sesión aún, sin red, «viaje sin fechas» porque el id de la nube llegó después…), se vuelve a preguntar a los 3, 10 y 25 s,
    // al volver a la app (de segundo plano) y al volver la red. Antes se preguntaba UNA sola vez por viaje abierto y, si fallaba, no se reintentaba hasta cerrar y abrir.
    const preguntar = (intento: number) => {
      // (V15b) El viaje abierto Y todos los demás viajes de esta cuenta ya terminados y dentro del plazo de reclamar: el punto del botón y la campana cuentan los de todos, no solo el activo.
      const otros = viajesTerminadosEnPlazo().filter((id) => id !== tripId)
      void Promise.all([cargarCompanero(tripId), ...otros.map((id) => cargarCompanero(id))]).then(() => {
        if (!vivo) return
        // Y5: el punto del botón de logros, mientras haya algo pendiente.
        if (useCompaneroStore.getState().pendientes.length > 0) useLogrosStore.getState().ponerPuntito(true)
        const reintentos = [3000, 10000, 25000]
        if (useCompaneroStore.getState().fallo && intento < reintentos.length) temporizador = window.setTimeout(() => preguntar(intento + 1), reintentos[intento])
      })
    }
    preguntar(0)
    const alVolver = () => {
      if (document.visibilityState === 'visible') preguntar(3)
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', alVolver)
    return () => {
      vivo = false
      window.clearTimeout(temporizador)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('online', alVolver)
    }
  }, [tripId])
  const viajeAbierto = abierta?.viaje ?? tripId
  const uno = abierta?.tipo === 'sitio' ? pendientes.find((p) => p.sitio === abierta.sitio && (!abierta.viaje || p.viaje === abierta.viaje)) : null
  const deEseViaje = abierta?.tipo === 'lista' ? pendientes.filter((p) => !abierta.viaje || p.viaje === abierta.viaje) : []
  return (
    <>
      <EstilosDelVisto />
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        data-companero="entrada"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f && viajeAbierto && abierta?.tipo === 'sitio') void subirMiFoto(viajeAbierto, abierta.sitio, f)
        }}
      />
      {viajeAbierto && uno && <HojaDeUnSitio p={uno} tripId={viajeAbierto} />}
      {viajeAbierto && abierta?.tipo === 'lista' && deEseViaje.length > 0 && <HojaDeVarios pendientes={deEseViaje} tripId={viajeAbierto} />}
    </>
  )
}
