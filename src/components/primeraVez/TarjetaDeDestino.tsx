import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { avisarDeDestino, destinosDelMapa, usePrimeraVezUi } from '../../lib/primeraVez'
import { useDestinosCurados, type DestinoCurado } from '../../lib/destinosCurados'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { usePerfilUi } from '../../store/usePerfilUi'
import { NumerosDelDestino, useLoQueTePuedesLlevar } from './LoQueTePuedesLlevar'
import { nDeTotal, useBola } from '../../lib/bolaDelMundo'
import { useLogrosPantallas } from '../logros/pantallas/useLogrosPantallas'

/**
 * (V31, Design «Primera Vez» P2 y P3) LA TARJETA DE UN DESTINO del mapa, desde abajo. Listo: foto, nombre, «Lo que te puedes llevar» con sus números REALES, [Ver destino] y [Crear viaje]. «Próximamente» (en gris):
 * «Lo estamos preparando. Te lo contamos en cuanto esté» y [Avísame], que guarda el aviso en la cuenta (tabla `avisos_destino`) y pasa a «Te avisaremos ✓». [Crear viaje] abre la pantalla de crear viaje de siempre
 * (ORIGEN y DESTINO) con ese destino ya elegido y el origen vacío.
 */
const SERIE = "'Instrument Serif',serif"
const ORO = 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)'
const AVISADOS = 'trazo:primera_vez:avisados'

const leerAvisados = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(AVISADOS) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function TarjetaDeDestino(): ReactNode {
  const clave = usePrimeraVezUi((s) => s.tarjeta)
  const abrirTarjeta = usePrimeraVezUi((s) => s.abrirTarjeta)
  const abrirPagina = usePrimeraVezUi((s) => s.abrirPagina)
  const curados = useDestinosCurados()
  const destino = useMemo(() => destinosDelMapa(curados).find((d) => d.clave === clave) ?? null, [curados, clave])
  const curado: DestinoCurado | null = (curados ?? []).find((c) => c.clave === clave) ?? null
  const estadoBola = useBola((s) => (clave ? s.porDestino[clave] : undefined))
  const viajesBola = useBola((s) => s.viajes)
  const abrirViajeBola = useBola((s) => s.abrirViaje)
  // (V39) Donde ya ha estado, «Lo que llevas» sale del Perfil (ya cargado): no se pide nada más. Si no, «Lo que te puedes llevar» de siempre.
  const llevas = estadoBola?.estuvo ? estadoBola.llevas : null
  const datos = useLoQueTePuedesLlevar(destino?.listo && !llevas ? destino.clave : '')
  const [avisados, setAvisados] = useState<string[]>(leerAvisados)
  const [error, setError] = useState(false)
  useEffect(() => setError(false), [clave])
  if (!destino) return null
  const avisado = avisados.includes(destino.clave)
  const avisame = async () => {
    setError(false)
    if (!(await avisarDeDestino(destino.nombre))) return setError(true)
    const nuevos = [...avisados, destino.clave]
    setAvisados(nuevos)
    try {
      window.localStorage.setItem(AVISADOS, JSON.stringify(nuevos))
    } catch {
      /* sin almacenamiento */
    }
  }
  const crear = () => {
    abrirTarjeta(null)
    usePerfilUi.getState().cerrar()
    empezarViajeNuevo(curado)
  }
  // (V39) Con un viaje próximo o en marcha a este destino: [Abrir mi viaje] en vez de [Crear viaje].
  const miViaje = estadoBola?.viaje ? (viajesBola.find((v) => v.id === estadoBola.viaje!.id) ?? null) : null
  const abrirMiViaje = () => {
    if (!miViaje || !abrirViajeBola) return
    abrirTarjeta(null)
    abrirViajeBola(miViaje)
  }
  const verMisLogros = () => {
    abrirTarjeta(null)
    useLogrosPantallas.getState().abrir({ t: 'destino', destino: destino.clave })
  }
  return createPortal(
    <div data-tarjeta-destino={destino.clave} data-listo={destino.listo ? '1' : '0'} className="fixed inset-0 z-[96]" role="dialog" aria-modal="true" aria-label={destino.nombre}>
      <div onClick={() => abrirTarjeta(null)} className="absolute inset-0" style={{ background: 'rgba(28,34,48,.4)' }} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-lg flex-col gap-3.5" style={{ borderRadius: '30px 30px 0 0', background: '#FFFDF8', padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 26px)', boxShadow: '0 -20px 40px -20px rgba(28,34,48,.5)' }}>
        <span style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, background: 'rgba(28,34,48,.18)' }} />
        <div style={{ position: 'relative', height: 150, borderRadius: 22, overflow: 'hidden', background: destino.portada ? `center / cover no-repeat url(${destino.portada}), #D9C7A8` : 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)', filter: destino.listo ? 'none' : 'grayscale(1) brightness(1.1)', opacity: destino.listo ? 1 : 0.75 }}>
          <span style={{ position: 'absolute', left: 14, bottom: 12, font: `400 32px/1 ${SERIE}`, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.4)' }}>{destino.nombre}</span>
          {!destino.listo && <span style={{ position: 'absolute', right: 12, top: 12, height: 26, padding: '0 12px', borderRadius: 999, background: 'rgba(255,253,248,.92)', display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'", color: '#1C2230' }}>Próximamente</span>}
        </div>
        {destino.listo ? (
          <>
            <span data-titulo-llevas style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'rgba(28,34,48,.5)' }}>{llevas ? 'LO QUE LLEVAS' : 'LO QUE TE PUEDES LLEVAR'}</span>
            {llevas ? (
              <div data-llevar-numeros data-lo-que-llevas style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { x: llevas.medallas, l: 'medallas' },
                  { x: llevas.colecciones, l: 'colecciones' },
                  { x: llevas.secretos, l: 'secretos' },
                ].map((k) => (
                  <div key={k.l} style={{ borderRadius: 18, background: '#F7F1E4', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
                    <span data-llevas-numero={k.l} style={{ font: "400 26px/1 'Instrument Serif',serif", color: '#8A6A2C' }}>{nDeTotal(k.x)}</span>
                    <span style={{ font: "500 12px/1.25 'Geist'", color: 'rgba(28,34,48,.7)' }}>{k.l}</span>
                  </div>
                ))}
              </div>
            ) : (
              <NumerosDelDestino datos={datos} />
            )}
            {estadoBola?.viaje && <span data-tu-viaje style={{ font: "600 12.5px 'Geist'", color: '#8A6A2C' }}>Tu viaje · {estadoBola.viaje.cuando}</span>}
            <div style={{ display: 'flex', gap: 10 }}>
              {llevas ? (
                <button type="button" data-ver-mis-logros onClick={verMisLogros} className="zona-toque" style={{ flex: 1, height: 54, borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.2)', font: "600 15px 'Geist'" }}>
                  Ver mis logros de {destino.nombre}
                </button>
              ) : (
                <button type="button" data-ver-destino onClick={() => { abrirTarjeta(null); abrirPagina(destino.clave) }} className="zona-toque" style={{ flex: 1, height: 54, borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.2)', font: "600 15px 'Geist'" }}>
                  Ver destino
                </button>
              )}
              {miViaje ? (
                <button type="button" data-abrir-mi-viaje onClick={abrirMiViaje} className="zona-toque" style={{ flex: 1, height: 54, borderRadius: 16, border: 'none', background: ORO, boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', font: "700 15px 'Geist'" }}>
                  Abrir mi viaje
                </button>
              ) : (
                <button type="button" data-crear-viaje-destino onClick={crear} className="zona-toque" style={{ flex: 1, height: 54, borderRadius: 16, border: 'none', background: ORO, boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', font: "700 15px 'Geist'" }}>
                  {llevas ? 'Crear otro viaje' : 'Crear viaje'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <span style={{ font: "400 15px/1.4 'Geist'", color: 'rgba(28,34,48,.65)' }}>Lo estamos preparando. Te lo contamos en cuanto esté.</span>
            <button type="button" data-avisame={destino.clave} onClick={() => void avisame()} disabled={avisado} className="zona-toque" style={{ height: 54, borderRadius: 16, border: 'none', background: '#1C2230', color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: "700 15px 'Geist'" }}>
              {avisado ? (
                'Te avisaremos ✓'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 0 0 4 0" />
                  </svg>
                  Avísame
                </>
              )}
            </button>
            {error && <span role="alert" style={{ font: "400 13px 'Geist'", color: '#A33A2A' }}>No hemos podido guardarlo. Inténtalo más tarde.</span>}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
