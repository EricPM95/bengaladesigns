import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route } from '../../../lib/types'
import { enviarFotoDeLaCamara, type RespuestaDeHecho } from '../../../lib/logros'
import { abrirPase } from '../../../lib/pago'
import { nombreDelPase } from '../../../lib/nombrePase'
import { reproducirMomentos } from '../../../lib/sonidos'
import { camaraExplicada, guardarFotoSinSubir, marcarCamaraExplicada, modoDeCamara, rangoDelViaje, subirFotosPendientes, useCamaraViajeStore, type FaseDelViaje, type ModoDeCamara, type PedidoDeFoto } from '../../../lib/camaraViaje'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { CamaraApp } from '../../logros/visto/CamaraApp'
import { EstilosDelVisto } from '../../logros/visto/Hojas'
import { AvisoSobreLaBarra } from '../../ui/AvisoSobreLaBarra'
import { BotonGuardarEnGaleria } from '../fotos/BotonGuardarEnGaleria'

/**
 * LA CÁMARA DE VIAJE EN HOY (Tanda HOY1, K1 a K4; Design «Hoy Estados», apartado 04). El botón redondo de la cabecera de HOY se ve SIEMPRE (antes, durante y después del viaje, con y sin pase);
 * lo que hace al tocarlo depende del momento (`modoDeCamara`). Haces la foto y el servidor mira dónde estás: en un sitio con logro (esté o no en tu ruta, también La Graciosa) sale «¡Eh! Aquí hay algo…» y
 * el logro de siempre; si no, «Guardada en los recuerdos de hoy»; sin conexión, la foto se guarda en el móvil y se comprueba al volver la señal. Nada se mueve solo: la foto nunca cambia el día.
 */
const TINTA = '#1C2230'
const ORO = '#B58A2E'
const ORO_CLARO = '#F3D88F'
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"
const DEGRADADO_ORO = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'
const CAMARA = 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'
const CANDADO = 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z'
const CALENDARIO = 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'
const SIN_SENAL = 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M9 16a5 5 0 0 1 6 0M12 19.5h.01M3 3l18 18'
const CHECK = 'M5 12.5l4.5 4.5L19 7'

function Trazo({ d, tam, color = 'currentColor', grosor = 1.9 }: { d: string; tam: number; color?: string; grosor?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}

type Resultado = { tipo: 'logro'; respuesta: RespuestaDeHecho } | { tipo: 'recuerdo'; url: string; sub: string | null } | { tipo: 'sin_conexion'; url: string }

/** La hoja de abajo: «Tu cámara de viaje» (K1), con el candado (K1b) o con las fechas (K1c). */
function HojaCamara({ modo, destino, rango, onCerrar, onAbrir, onVerPase }: { modo: ModoDeCamara; destino: string; rango: string | null; onCerrar: () => void; onAbrir: () => void; onVerPase: () => void }) {
  return createPortal(
    <div data-camara-viaje="hoja" data-modo={modo} role="dialog" aria-label="Tu cámara de viaje" className="fixed inset-0 z-[80] flex flex-col justify-end">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 cursor-default border-0 p-0" style={{ background: 'rgba(20,16,10,.5)', animation: 'vistoFade .3s ease both' }} />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col gap-3.5 px-[18px] pb-[26px] pt-2.5" style={{ borderRadius: '32px 32px 0 0', background: '#FBF3E2', boxShadow: '0 -20px 40px rgba(0,0,0,.25)', animation: 'vistoSheet .5s cubic-bezier(.2,.8,.2,1) both', color: TINTA }}>
        <span className="self-center" style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        <div className="flex items-center justify-between">
          <span style={{ font: `400 30px/1 ${SERIF}` }}>Tu cámara de viaje</span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="zona-toque flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(28,34,48,.08)' }}>
            <Trazo d="M6 6l12 12M18 6L6 18" tam={17} color={TINTA} grosor={2} />
          </button>
        </div>
        <div className="flex items-start gap-3.5">
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center" style={{ borderRadius: 16, background: '#F3E3B2', color: '#6E5018' }}>
            <Trazo d={CAMARA} tam={26} grosor={1.7} />
          </span>
          <span style={{ font: "400 15px/1.45 'Geist'", color: 'rgba(28,34,48,.78)' }}>Guarda tus recuerdos del viaje. Y si estás en un lugar especial, aunque no esté en tu ruta, haz tu foto: puede que te espere una recompensa.</span>
        </div>
        {modo === 'sin_pase' && (
          <div data-camara-viaje="candado" className="flex items-center gap-2.5" style={{ padding: '11px 14px', borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.45)', font: "500 14px/1.35 'Geist'" }}>
            <span className="flex flex-none items-center justify-center" style={{ width: 26, height: 26, borderRadius: '50%', background: TINTA, border: `1.5px solid ${ORO}`, boxSizing: 'border-box' }}>
              <Trazo d={CANDADO} tam={12} color={ORO_CLARO} grosor={2.4} />
            </span>
            <span>
              Solo disponible con el <b style={{ color: '#8E6820' }}>{nombreDelPase(destino)}</b>
            </span>
          </div>
        )}
        {(modo === 'antes' || modo === 'despues') && (
          <div data-camara-viaje="fechas" className="flex items-center gap-2.5" style={{ padding: '11px 14px', borderRadius: 16, background: '#F3E3B2', font: "500 14px/1.35 'Geist'" }}>
            <Trazo d={CALENDARIO} tam={18} color="#6E5018" grosor={1.8} />
            <span>{modo === 'antes' ? (rango ? `Podrás usarla durante tu viaje, ${rango}` : 'Podrás usarla durante tu viaje') : rango ? `Se usa durante el viaje, ${rango}` : 'Se usa durante el viaje'}</span>
          </div>
        )}
        {modo === 'primera_vez' && (
          <button type="button" onClick={onAbrir} data-camara-viaje="abrir" className="flex items-center justify-center gap-2" style={{ height: 54, borderRadius: 16, font: "700 16px 'Geist'", background: DEGRADADO_ORO, color: '#4A3510', border: 'none', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
            <Trazo d={CAMARA} tam={19} color="#4A3510" grosor={2} />
            Abrir cámara
          </button>
        )}
        {modo === 'sin_pase' && (
          <button type="button" onClick={onVerPase} data-camara-viaje="ver-pase" className="flex items-center justify-center" style={{ height: 54, borderRadius: 16, font: "700 16px 'Geist'", background: DEGRADADO_ORO, color: '#4A3510', border: 'none', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
            Ver el pase
          </button>
        )}
        {(modo === 'antes' || modo === 'despues') && (
          <button type="button" onClick={onCerrar} data-camara-viaje="entendido" className="flex items-center justify-center" style={{ height: 54, borderRadius: 16, font: "700 16px 'Geist'", background: '#FBF3E2', border: '1px solid rgba(181,138,46,.55)', color: '#4A3510' }}>
            Entendido
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** K2: «¡Eh! Aquí hay algo…» (la foto ha desbloqueado un logro de este sitio). */
function PantallaAlgo({ onDescubrir }: { onDescubrir: () => void }) {
  return createPortal(
    <div data-camara-viaje="algo" role="dialog" aria-label="Aquí hay algo" className="fixed inset-0 z-[85] flex items-center justify-center px-[22px]" style={{ background: 'rgba(20,16,10,.62)', animation: 'vistoFade .3s ease both' }}>
      <div className="flex w-full max-w-[420px] flex-col items-center gap-3.5 text-center" style={{ borderRadius: 30, background: TINTA, color: '#FBF3E2', padding: '26px 20px 20px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(243,216,143,.4)' }}>
        <span className="flex items-center justify-center" style={{ width: 84, height: 84, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#2A3250,#10162E)', border: `2px solid ${ORO}`, boxShadow: '0 0 30px rgba(243,216,143,.45)', font: `400 52px/1 ${SERIF}`, color: ORO_CLARO }}>?</span>
        <span style={{ font: `400 32px/1.1 ${SERIF}` }}>
          ¡Eh! Aquí hay <em style={{ color: ORO_CLARO }}>algo…</em>
        </span>
        <span style={{ font: "400 14.5px/1.4 'Geist'", color: 'rgba(251,243,226,.78)' }}>Tu foto ha desbloqueado un logro de este sitio.</span>
        <button type="button" onClick={onDescubrir} data-camara-viaje="descubrirlo" className="self-stretch" style={{ height: 52, borderRadius: 16, font: "700 15.5px 'Geist'", background: DEGRADADO_ORO, color: '#4A3510', border: 'none', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
          Descubrirlo
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** K3 y K4: el aviso de abajo (sobre el menú, como todos los avisos de abajo de la app). */
function AvisoDeFoto({ resultado, archivo, onFin }: { resultado: Extract<Resultado, { tipo: 'recuerdo' | 'sin_conexion' }>; archivo: Blob | null; onFin: () => void }) {
  // (HOY2b 7) Con [Guardar en mi galería] a la vista, el aviso dura más (8 s): da tiempo a tocarlo.
  useEffect(() => {
    const t = window.setTimeout(onFin, archivo ? 8000 : 5000)
    return () => window.clearTimeout(t)
  }, [onFin, archivo])
  const sinRed = resultado.tipo === 'sin_conexion'
  return createPortal(
    <AvisoSobreLaBarra z={86} datos={{ 'data-camara-viaje': sinRed ? 'sin-conexion' : 'recuerdo' }} className="!gap-3" estilo={{ animation: 'vistoToast .35s ease both', boxShadow: '0 0 0 1px rgba(243,216,143,.35)' }}>
      <span className="flex-none overflow-hidden" style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(150deg,oklch(0.72 0.07 30),oklch(0.46 0.06 55))' }}>
        {resultado.url && <img src={resultado.url} alt="" className="h-full w-full object-cover" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <b style={{ font: "700 14.5px 'Geist'" }}>{sinRed ? 'Guardada' : 'Guardada en los recuerdos de hoy'}</b>
        {(sinRed || resultado.sub) && <span style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(251,243,226,.7)' }}>{sinRed ? 'La comprobamos cuando vuelvas a tener conexión' : resultado.sub}</span>}
        {!sinRed && !resultado.sub && archivo && <BotonGuardarEnGaleria foto={archivo} className="-ml-3 !min-h-[30px] !border-0 !pl-3 !pr-0 underline underline-offset-[3px]" />}
      </span>
      <span className="flex flex-none items-center justify-center" style={{ width: 34, height: 34, borderRadius: '50%', background: TINTA, border: `1.5px solid ${ORO}`, color: ORO_CLARO }}>
        <Trazo d={sinRed ? SIN_SENAL : CHECK} tam={16} grosor={2} />
      </span>
    </AvisoSobreLaBarra>,
    document.body,
  )
}

export interface PropsBotonCamara {
  route: Route
  fase: FaseDelViaje
  /** ¿Se puede usar? Con pase o en el día de prueba. */
  conAcceso: boolean
  /** El día de hoy del viaje (para el álbum), si lo hay. */
  day: DayPlan | null
  /** El botón de la cama ocupa el sitio de la derecha: la cámara se pone a su izquierda. */
  conCama: boolean
}

/** El botón de la cámara de HOY y todo lo que abre (hoja, cámara, aviso). Un solo componente montado una vez por HoyView. */
export function BotonCamaraViaje({ route, fase, conAcceso, day, conCama }: PropsBotonCamara) {
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [hoja, setHoja] = useState<ModoDeCamara | null>(null)
  const [camara, setCamara] = useState<PedidoDeFoto | null>(null)
  const [pensando, setPensando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [archivoDeLaFoto, setArchivoDeLaFoto] = useState<Blob | null>(null)
  const urls = useRef<string[]>([])
  const pedido = useCamaraViajeStore((s) => s.pedido)
  const modo = modoDeCamara({ conAcceso, fase, explicada: camaraExplicada() })
  const rango = rangoDelViaje(route.answers?.dateRange?.start, route.answers?.dateRange?.end)

  // Las sorpresas esperan mientras la cámara o «¡Eh! Aquí hay algo…» están abiertas.
  const bloquea = Boolean(camara) || resultado?.tipo === 'logro'
  useEffect(() => {
    if (!bloquea) return undefined
    useLogrosStore.getState().ponerHojaAbierta(true)
    return () => useLogrosStore.getState().ponerHojaAbierta(false)
  }, [bloquea])

  // Las fotos que esperaban conexión se suben al volver la señal (y al abrir HOY).
  useEffect(() => {
    void subirFotosPendientes()
    const alVolver = () => void subirFotosPendientes()
    window.addEventListener('online', alVolver)
    return () => window.removeEventListener('online', alVolver)
  }, [])

  // Quien pide la cámara desde otra tarjeta (fuera de ruta, el juego): solo con acceso y durante el viaje.
  useEffect(() => {
    if (!pedido) return
    useCamaraViajeStore.getState().limpiar()
    if (conAcceso && fase === 'during') setCamara(pedido)
  }, [pedido, conAcceso, fase])

  useEffect(
    () => () => {
      urls.current.forEach((u) => URL.revokeObjectURL(u))
      urls.current = []
    },
    [],
  )

  const tocar = () => {
    if (modo === 'abrir') setCamara({ sitio: null, nombre: null, oculto: false })
    else setHoja(modo)
  }

  const abrirDesdeLaHoja = () => {
    marcarCamaraExplicada()
    setHoja(null)
    setCamara({ sitio: null, nombre: null, oculto: false })
  }

  const hacerFoto = async (archivo: File) => {
    const ped = camara
    setCamara(null)
    if (!ped || !tripId) return
    setPensando(true)
    const url = URL.createObjectURL(archivo)
    urls.current.push(url)
    setArchivoDeLaFoto(archivo)
    const r = await enviarFotoDeLaCamara({ tripId, stopId: null, nombre: ped.nombre, sitio: ped.sitio, libre: !ped.sitio })
    setPensando(false)
    // El álbum: la foto va a «los recuerdos de hoy». Se guarda PRIMERO en el móvil (así sin conexión no se pierde) y de ahí se sube al álbum; se quita del móvil cuando ya está arriba.
    const datosAlbum = { tripId, dayId: day?.id ?? '', dayNumber: day?.dayNumber ?? 1, stopName: ped.nombre ?? null }
    void guardarFotoSinSubir({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...datosAlbum, blob: archivo }).then(() => subirFotosPendientes())
    if (!r) return setResultado({ tipo: 'sin_conexion', url })
    if (r.valida !== false && r.nuevos?.length) return setResultado({ tipo: 'logro', respuesta: r })
    setResultado({ tipo: 'recuerdo', url, sub: r.valida === false ? (r.mensaje ?? null) : null })
  }

  const descubrir = () => {
    if (resultado?.tipo !== 'logro') return
    const r = resultado.respuesta
    setResultado(null)
    useLogrosStore.getState().recibir(r)
    if (r.nuevos?.length) reproducirMomentos(r.nuevos.map((m) => m.tipo))
  }

  return (
    <>
      <EstilosDelVisto />
      <button
        type="button"
        onClick={tocar}
        data-camara-viaje="boton"
        data-modo={modo}
        aria-label={modo === 'sin_pase' ? 'Tu cámara de viaje (con el pase)' : 'Tu cámara de viaje'}
        className={`zona-toque absolute top-1 z-10 flex items-center justify-center transition-transform active:scale-95 ${conCama ? 'right-[64px]' : 'right-4'}`}
        style={{ width: 42, height: 42, borderRadius: '50%', background: TINTA, border: `1.5px solid ${ORO}`, boxSizing: 'border-box', color: ORO_CLARO }}
      >
        <Trazo d={CAMARA} tam={19} />
        {modo === 'sin_pase' && (
          <span data-camara-viaje="candado-boton" className="absolute flex items-center justify-center" style={{ right: -6, top: -6, width: 20, height: 20, borderRadius: '50%', background: TINTA, border: `1.5px solid ${ORO}`, boxSizing: 'border-box' }}>
            <Trazo d={CANDADO} tam={12} color={ORO_CLARO} grosor={2.4} />
          </span>
        )}
      </button>
      {hoja && <HojaCamara modo={hoja} destino={route.destination} rango={rango} onCerrar={() => setHoja(null)} onAbrir={abrirDesdeLaHoja} onVerPase={() => { setHoja(null); abrirPase() }} />}
      {camara && <CamaraApp nombre={camara.nombre ?? 'Tu recuerdo de hoy'} oculto={camara.oculto} alFoto={(f) => void hacerFoto(f)} alCerrar={() => setCamara(null)} />}
      {pensando && (
        <span data-camara-viaje="mirando" className="pointer-events-none fixed inset-x-0 bottom-24 z-[86] mx-auto w-fit rounded-full px-4 py-2" style={{ background: TINTA, color: '#FBF3E2', font: `600 10.5px ${MONO}`, letterSpacing: '.14em' }}>
          MIRANDO DÓNDE ESTÁS…
        </span>
      )}
      {resultado?.tipo === 'logro' && <PantallaAlgo onDescubrir={descubrir} />}
      {resultado && resultado.tipo !== 'logro' && <AvisoDeFoto resultado={resultado} archivo={archivoDeLaFoto} onFin={() => setResultado(null)} />}
    </>
  )
}
