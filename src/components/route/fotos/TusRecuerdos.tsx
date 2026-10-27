import { useRef, useState } from 'react'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { fotosDelSitio, limiteDeFotos, subirFoto, urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { displayStopName } from '../../../lib/format'
import { usePagoActivo } from '../../../lib/pago'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../../ui/HojaOpciones'
import { FotoEnGrande } from './FotoEnGrande'

/**
 * «TUS RECUERDOS» EN LA FICHA DE UN SITIO (Tanda 10N6 §1f; `Piezas/Recuerdos Ficha`, propuesta A, con los textos de Eric del 27-oct).
 * Un bloque entre la cabecera de la ficha y las pestañas: sin fotos, «Tus recuerdos» + «Guarda tus fotos. Las verás también en tu álbum.» y el botón dorado [+ Añadir];
 * con fotos, sus miniaturas, «Tus recuerdos» + «3 fotos · También en tu álbum» y [Ver]. Al tocarlo se abre la hoja «Tus recuerdos»: las tarjetas «Hacer una foto» y «Elegir de la galería» y,
 * debajo, «Tus fotos · N». Las fotos van a la misma parada de ese día y al álbum del viaje (`subirFoto`, de `fotosViaje.ts`: nada cambia por dentro).
 * Sin pase, una foto por sitio: con una, «Cambiar la foto» sustituye a «Hacer una foto»; intentar guardar una segunda abre el aviso del pase (`abrirAvisoPase('segunda_foto')`).
 * Sale siempre (también antes del viaje). Sustituye a la cámara que iba encima de la foto (`BotonFotoParada` ya no se monta en la ficha).
 */

const ORO = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'
const ICONO_FOTOS = 'M8 8h12v12H8zM4 16V4h12M11 17l3-3.5 2.5 2.5 1.5-2 2 2.5'

/** «1 foto» / «3 fotos». */
export const cuantasFotos = (n: number): string => `${n} ${n === 1 ? 'foto' : 'fotos'}`
/** La línea pequeña del bloque. */
export const lineaDeRecuerdos = (n: number): string => (n === 0 ? 'Guarda tus fotos. Las verás también en tu álbum.' : `${cuantasFotos(n)} · También en tu álbum`)

export function TusRecuerdos({ stopName, dayNumber }: { stopName: string; dayNumber: number | null }) {
  const route = useRouteStore((state) => state.route)
  const conPase = usePagoActivo()
  const { fotos } = useFotosViaje()
  const [abierta, setAbierta] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [grande, setGrande] = useState<FotoViaje | null>(null)
  const camara = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)
  const cambiar = useRef<HTMLInputElement>(null)

  if (!route) return null
  // El día de las fotos: el de la ficha; si la ficha se abre fuera de un día (EXPLORAR), el día de la ruta donde ya está este sitio, o el primero.
  const dia =
    (dayNumber !== null ? route.days.find((d) => d.dayNumber === dayNumber) : undefined) ??
    route.days.find((d) => d.stops.some((s) => s.name === stopName)) ??
    route.days[0]
  if (!dia) return null
  void conPase
  const sinPase = limiteDeFotos().porParada !== null
  const delSitio = fotosDelSitio(fotos, dia.dayNumber, stopName)
  const n = delSitio.length
  const yaTieneLaSuya = sinPase && n >= 1
  const destino = route.destination

  async function alElegir(event: React.ChangeEvent<HTMLInputElement>) {
    const elegidas = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (elegidas.length === 0 || !route || !dia) return
    // Sin pase, una sola por sitio: de varias se guarda la primera y las demás piden el pase.
    const archivos = sinPase ? elegidas.slice(0, 1) : elegidas
    if (sinPase && elegidas.length > 1) abrirAvisoPase('segunda_foto', { destino })
    setSubiendo(true)
    setError(null)
    let fallo: string | null = null
    for (const file of archivos) {
      const { error: motivo } = await subirFoto({ tripId: route.id, dayId: dia.id, dayNumber: dia.dayNumber, stopName, file })
      if (motivo) fallo = motivo
    }
    setSubiendo(false)
    setError(fallo)
  }

  const miniaturas = delSitio.slice(0, 3)

  return (
    <>
      <div
        data-tus-recuerdos={n > 0 ? 'con-fotos' : 'sin-fotos'}
        className="flex items-center gap-3 rounded-[20px] bg-[#FFFDF8] py-2 pl-3 pr-2.5"
        style={{ minHeight: 62, border: '1px solid rgba(181,138,46,.45)', boxShadow: '0 8px 16px -12px rgba(60,40,10,.45)' }}
      >
        {n === 0 ? (
          <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px]" style={{ background: '#FBF3E2' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d={ICONO_FOTOS} />
            </svg>
          </span>
        ) : (
          <span aria-hidden="true" className="flex flex-none items-center pl-2">
            {miniaturas.map((foto, i) => (
              <span key={foto.id} data-miniatura-recuerdo className="block h-8 w-8 flex-none overflow-hidden bg-bg-hover" style={{ borderRadius: 11, border: '2px solid #FFFDF8', marginLeft: i === 0 ? 0 : -9 }}>
                {urlParaMostrar(foto) ? <img src={urlParaMostrar(foto)} alt="" className="h-full w-full object-cover" /> : null}
              </span>
            ))}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span style={{ font: "600 14.5px 'Geist'", color: '#1C2230' }}>Tus recuerdos</span>
          <span data-recuerdos-linea style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            {lineaDeRecuerdos(n)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setAbierta(true)}
          data-recuerdos-abrir
          className="flex h-[38px] flex-none items-center gap-[5px] rounded-full px-3.5 active:scale-[.98]"
          style={{ background: ORO, color: '#4A3510', font: "700 13.5px 'Geist'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)' }}
        >
          {n === 0 ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Añadir
            </>
          ) : (
            'Ver'
          )}
        </button>
      </div>

      {abierta && (
        <HojaOpciones etiqueta={displayStopName(stopName)} titulo="Tus recuerdos" onCerrar={() => setAbierta(false)} datos="tus-recuerdos">
          {yaTieneLaSuya ? (
            <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.camara} titulo="Cambiar la foto" linea="Sustituye la que tienes de este sitio" datos="cambiar-foto" flecha onClick={() => cambiar.current?.click()} deshabilitada={subiendo} />
          ) : (
            <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.camara} titulo="Hacer una foto" linea="Con la cámara de la app" datos="hacer-foto" flecha onClick={() => camara.current?.click()} deshabilitada={subiendo} />
          )}
          <OpcionTarjeta
            tono="arena"
            icono={ICONOS_OPCION.galeria}
            titulo="Elegir de la galería"
            linea="Solo fotos de tu viaje"
            datos="elegir-galeria"
            flecha
            deshabilitada={subiendo}
            onClick={() => {
              // Sin pase y con su foto, otra sería la segunda: el aviso del pase (para cambiarla por la nueva está «Cambiar la foto»).
              if (yaTieneLaSuya) abrirAvisoPase('segunda_foto', { destino })
              else galeria.current?.click()
            }}
          />
          {subiendo && (
            <p data-recuerdos-subiendo className="px-1 text-[13px] text-text-soft">
              Subiendo…
            </p>
          )}
          {error && (
            <p role="alert" data-recuerdos-error className="px-1 text-[13px] leading-snug text-text-soft">
              {error}
            </p>
          )}
          {n > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' }}>Tus fotos · {n}</span>
              <div className="grid grid-cols-3 gap-2">
                {delSitio.map((foto) => (
                  <button key={foto.id} type="button" data-foto-recuerdo onClick={() => setGrande(foto)} aria-label="Ver la foto en grande" className="block aspect-square w-full overflow-hidden bg-bg-hover" style={{ borderRadius: 16 }}>
                    {urlParaMostrar(foto) ? <img src={urlParaMostrar(foto)} alt={foto.stopName ?? 'Foto del viaje'} className="h-full w-full object-cover" loading="lazy" /> : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </HojaOpciones>
      )}
      <input ref={camara} type="file" accept="image/*" capture="environment" onChange={alElegir} className="hidden" data-recuerdos-entrada="camara" />
      <input ref={galeria} type="file" accept="image/*" multiple={!sinPase} onChange={alElegir} className="hidden" data-recuerdos-entrada="galeria" />
      <input ref={cambiar} type="file" accept="image/*" onChange={alElegir} className="hidden" data-recuerdos-entrada="cambiar" />
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </>
  )
}
