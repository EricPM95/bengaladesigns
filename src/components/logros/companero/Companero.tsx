import { useEffect, useRef, type ReactNode } from 'react'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { enSitio } from '../../../lib/articulos'
import { cargarCompanero, lineaDeLaTarjeta, quienEs, subirMiFoto, useCompaneroStore, yoTambienEstaba, type PendienteDeCompanero } from '../../../lib/companero'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { CandadoRedondo } from '../../pase/Candado'
import { abrirGaleriaDeReclamo } from '../reclamar/Reclamar'
import { BTN_CAM_ORO, Capa, Cruz, EstilosDelVisto, MONO, SERIF, TINTA } from '../visto/Hojas'
import { TRAZO, Trazo } from '../visto/trazos'

/**
 * «YO TAMBIÉN ESTABA» (Tanda V7, pantallas Y0 a Y5 de Design «Visto Fotos» · mode yo): la tarjeta de la hoja de logros (Y0), la hoja de un sitio (Y1), la de varios (Y2) y el aviso de la campana y el
 * punto del botón de logros (Y5). Los momentos (Y3a, Y3b) salen por la fila de la V6. Con el pase, como todos los logros; sin pase, con el candado pequeño (lleva al pase).
 */

const fotoDe = (url: string | null) => (url ? `center/cover url(${url})` : 'linear-gradient(140deg,#E2C6A8,#A8734A)')

/** Y0: la tarjeta pequeña, solo si hay algo pendiente. Va en la hoja «Tus logros en …», debajo del plazo de «Reclamar con tus fotos». */
export function TarjetaDeCompanero(): ReactNode {
  const pendientes = useCompaneroStore((s) => s.pendientes)
  const sinPase = useCompaneroStore((s) => s.sinPase)
  if (pendientes.length === 0) return null
  const abrir = () => {
    if (sinPase) return abrirAvisoPase('reclamar')
    if (pendientes.length === 1) useCompaneroStore.getState().abrirSitio(pendientes[0].sitio)
    else useCompaneroStore.getState().abrirLista()
  }
  return (
    <button type="button" data-companero="tarjeta" onClick={abrir} className="mx-4 mb-2 flex flex-none items-center gap-3 rounded-2xl border px-3 py-2.5 text-left" style={{ background: '#FFFDF8', borderColor: 'rgba(181,138,46,.45)', color: TINTA, cursor: 'pointer' }}>
      <span className="flex flex-none">
        {pendientes.slice(0, 3).map((p, i) => (
          <span key={p.sitio} className="flex-none" style={{ width: 34, height: 34, borderRadius: 10, marginLeft: i === 0 ? 0 : -10, border: '2px solid #FFFDF8', background: fotoDe(p.foto_url) }} />
        ))}
      </span>
      <span className="flex-1" style={{ font: "500 13.5px/1.35 'Geist'" }}>{lineaDeLaTarjeta(pendientes)}</span>
      {sinPase ? <CandadoRedondo tamano="pequeno" diametro={20} datos="companero-candado" /> : <span aria-hidden style={{ font: "400 20px/1 'Geist'", color: 'rgba(28,34,48,.5)' }}>›</span>}
    </button>
  )
}

/** Y1: un solo sitio. La foto grande con «Foto de Eric», lo que dice, [Yo también estaba] y, debajo, [Subir mi foto]. */
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
        <div data-companero="foto" className="relative w-full" style={{ height: 230, background: fotoDe(p.foto_url) }}>
          <span className="absolute bottom-3 left-4 rounded-full px-3 py-1" style={{ background: 'rgba(28,34,48,.7)', color: '#FFFDF8', font: `600 11px ${MONO}`, letterSpacing: '.08em' }}>Foto de {quien}</span>
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
                <span className="flex-none" style={{ width: 44, height: 44, borderRadius: 12, background: fotoDe(p.foto_url) }} />
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
    if (!tripId) return
    void cargarCompanero(tripId).then((lista) => {
      // Y5: el punto del botón de logros, mientras haya algo pendiente.
      if (lista.length > 0) useLogrosStore.getState().ponerPuntito(true)
    })
  }, [tripId])
  const uno = abierta?.tipo === 'sitio' ? pendientes.find((p) => p.sitio === abierta.sitio) : null
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
          if (f && tripId && abierta?.tipo === 'sitio') void subirMiFoto(tripId, abierta.sitio, f)
        }}
      />
      {tripId && uno && <HojaDeUnSitio p={uno} tripId={tripId} />}
      {tripId && abierta?.tipo === 'lista' && pendientes.length > 0 && <HojaDeVarios pendientes={pendientes} tripId={tripId} />}
    </>
  )
}
