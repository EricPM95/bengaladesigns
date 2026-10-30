import { Icono } from '../../ui/Icono'
import { pagoActivo } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { nombreDelPase } from '../../../lib/nombrePase'
import { Marca, ORO_PALIDO, ORO_PEQUENO } from '../../pase/Marca'
import { CandadoRedondo } from '../../pase/Candado'
import { accesoDePrueba, useHistoriaDePrueba } from '../../../lib/historiaDePrueba'
import { useGastarHistoriaAl3s } from '../../../lib/useGastarHistoria'
import { useEscuchar } from '../../../lib/useEscuchar'
import { useAudioDeHistoria } from '../../../lib/escucharAudio'

/**
 * «Escuchar» (Tanda 6z6, solo de pago): lee en voz alta el texto del «Resumen» de una parada con la voz del navegador. Con [Pausa] y [Seguir]; se para al cambiar de parada o de pantalla.
 * Si el aparato no tiene voz en español, o no hay texto que leer, el botón no sale. `clave`: el id de lo que se lee (la parada). `oscuro`: para la tarjeta oscura de HOY.
 * `etiqueta`: lo que dice el botón pequeño («Escuchar» lee el Resumen; «Historia», en HOY, lee la historia del sitio).
 * `sitio` (Tanda 6y9, solo la historia): destino y nombre del sitio; si tiene audio guardado suena ese, si no la voz del aparato.
 * `libre` (Tanda 6y5): suena también en la gratis (la historia del Coliseo, la muestra); sin él, en la gratis la barra sale con el candado y el botón pequeño no sale.
 * `barra` (Tanda 6y4, diseño «Ficha Lugar»): la barra oscura fija de abajo de la ficha, «Escuchar historia» (Tanda 6y5: lee la historia, no el Resumen), con el botón redondo ámbar de play/pausa, lo que se lleva leído y [Parar]; `abajo`
 * sube la barra cuando la ficha lleva un botón fijo debajo («Añadir a Día 2»).
 */
export function Escuchar({ texto, clave, oscuro = false, barra = false, abajo = false, etiqueta: nombreBoton = 'Escuchar', libre = false, sitio, destino }: { texto: string; clave: string; oscuro?: boolean; barra?: boolean; abajo?: boolean; etiqueta?: string; libre?: boolean; sitio?: { destino: string; nombre: string }; destino?: string }) {
  // `sitio` (solo la historia): si ese sitio tiene su audio guardado, suena ese; si no, la voz del aparato. Lo decide useEscuchar.
  const audio = useAudioDeHistoria(sitio)
  const { hayVoz, estado, progreso, escuchar, pausar, seguir, parar } = useEscuchar(texto, clave, audio)
  const pidioPago = false // (Tanda 10N6 §1g) el aviso del pase ya lo explica; la línea cambiante «Incluido con…» ya no se usa.
  // Tanda 10P: la historia (con `sitio`) sin pase: la de prueba del destino es la que el viajero elija («Gratis · 0/1»); se gasta a los 3 s y esa se queda suya; las demás, con candado.
  const mapaDePrueba = useHistoriaDePrueba((s) => s.mapa)
  const conPase = pagoActivo()
  const pruebaDelSitio = sitio && !conPase ? accesoDePrueba(mapaDePrueba, sitio.destino, sitio.nombre) : null
  const enPrueba = pruebaDelSitio === 'abierta'
  useGastarHistoriaAl3s(sitio?.destino, sitio?.nombre, estado, enPrueba)
  // (sin voz en español no hay nada que escuchar: ni el botón ni su candado)
  if (texto.trim().length === 0 || !hayVoz) return null
  // `libre`: la historia que suena gratis para todos (la muestra). El resto es de pago (Tanda 10H): sin el pase, el MISMO botón de siempre, con su diseño, y el candado dorado en el extremo derecho, dentro del botón, sobre marfil
  // (como los demás cerrados). Al tocarlo dice «Incluido con el Pase Roma» y abre el pase (`abrirPase`, la única función). Sin voz en el aparato no hace falta: no suena nada, solo invita.
  const permitido = conPase || (sitio ? pruebaDelSitio !== 'cerrada' : libre)
  const nombreDelPaseDelSitio = nombreDelPase(sitio?.destino ?? destino ?? '')
  const candadoDentro = (
    <span data-candado-dentro className="flex flex-none">
      <CandadoRedondo diametro={30} datos="escuchar" />
    </span>
  )
  const alTocarCerrado = () => {
    // (Tanda 10N6 §1g) Sin pase y con la historia de prueba ya gastada: el aviso pequeño del pase (el [Ver] lleva a la película).
    abrirAvisoPase('escuchar_historia', { destino: sitio?.destino ?? destino ?? undefined })
  }
  if (!permitido && barra) {
    return (
      <div data-escuchar="candado" data-escuchar-barra className={`pointer-events-auto absolute inset-x-3 z-[6] ${abajo ? 'bottom-[76px]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}>
        <button
          type="button"
          onClick={alTocarCerrado}
          aria-label={`Escuchar historia, incluido con el ${nombreDelPaseDelSitio}`}
          className="flex h-[62px] w-full items-center gap-3 rounded-[22px] bg-[#1C2230] pl-2 pr-3 text-left text-[#FFFDF8] shadow-[0_16px_30px_-14px_rgba(28,34,48,.7)]"
        >
          <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
            <Icono nombre="seguir" size={17} grosor={2} relleno />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <span className="font-display text-[17px] leading-none">Escuchar historia</span>
            {pidioPago ? (
              <span data-escuchar-incluido className="font-mono text-[11px] font-medium leading-none">
                Incluido con el <Marca oscuro>{nombreDelPaseDelSitio}</Marca>
              </span>
            ) : (
              <span data-escuchar-todas className="font-mono text-[11px] font-medium leading-none text-[#FFFDF8]/70">
                Todas las historias, con el <Marca oscuro>{nombreDelPaseDelSitio}</Marca>
              </span>
            )}
          </span>
          {candadoDentro}
        </button>
      </div>
    )
  }
  if (!permitido) {
    return (
      <div className="flex flex-none items-center gap-2" data-escuchar="candado">
        <button
          type="button"
          onClick={alTocarCerrado}
          aria-label={`${nombreBoton}, incluido con el ${nombreDelPaseDelSitio}`}
          className={`${oscuro ? 'zona-toque flex h-9 flex-none items-center gap-1.5 rounded-full pl-3 pr-1.5 text-[12.5px] font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/20' : 'zona-toque flex h-9 flex-none items-center gap-1.5 rounded-full border border-text/15 bg-white pl-3 pr-1.5 text-[12.5px] font-semibold text-text hover:bg-bg-hover'}`}
          style={oscuro ? { background: 'rgba(255,253,248,.12)' } : undefined}
        >
          <Icono nombre="altavoz" size={15} />
          {pidioPago ? (
            <span data-escuchar-incluido>
              Incluido con el <Marca oscuro={oscuro}>{nombreDelPaseDelSitio}</Marca>
            </span>
          ) : (
            nombreBoton
          )}
          {candadoDentro}
        </button>
      </div>
    )
  }
  if (barra) {
    const alPulsar = estado === 'parado' ? escuchar : estado === 'hablando' ? pausar : seguir
    const etiqueta = estado === 'parado' ? 'Escuchar historia' : estado === 'hablando' ? 'Pausar' : 'Seguir escuchando'
    const estadoTexto = estado === 'hablando' ? 'Leyendo…' : estado === 'pausa' ? 'En pausa' : null
    return (
      <div
        data-escuchar={estado}
        data-escuchar-barra
        className={`pointer-events-auto absolute inset-x-3 z-[6] flex h-[62px] items-center gap-3 rounded-[22px] bg-[#1C2230] pl-2 pr-3 text-[#FFFDF8] shadow-[0_16px_30px_-14px_rgba(28,34,48,.7)] ${abajo ? 'bottom-[76px]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}
      >
        <button type="button" onClick={alPulsar} aria-label={etiqueta} className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
          <Icono nombre={estado === 'hablando' ? 'pausa' : 'seguir'} size={estado === 'hablando' ? 18 : 17} grosor={estado === 'hablando' ? 2.4 : 2} relleno={estado !== 'hablando'} />
        </button>
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[17px] leading-none">Escuchar historia</span>
            {estadoTexto && <span className="font-mono text-[11px] font-medium text-[#FFFDF8]/60">{estadoTexto}</span>}
          </span>
          {enPrueba && estado === 'parado' ? (
            <span data-escuchar-prueba className="font-mono text-[11px] font-medium leading-none text-[#FFFDF8]/70">
              <span style={{ color: ORO_PALIDO, fontWeight: 600 }}>Gratis</span>, tu historia de prueba · 0/1
            </span>
          ) : (
            <span className="h-[3px] overflow-hidden rounded-[3px]" style={{ background: 'rgba(255,253,248,.18)' }}>
              <span className="block h-full transition-[width] duration-[900ms] ease-linear" style={{ width: `${Math.round(progreso * 100)}%`, background: 'oklch(0.8 0.14 70)' }} />
            </span>
          )}
        </span>
        {estado !== 'parado' && (
          <button type="button" onClick={parar} aria-label="Parar" className="zona-toque flex h-9 w-9 flex-none items-center justify-center rounded-full text-[#FFFDF8]/80 hover:bg-[#FFFDF8]/10">
            <Icono nombre="cerrar" size={15} />
          </button>
        )}
      </div>
    )
  }
  const claseBoton = oscuro
    ? 'zona-toque flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/20'
    : 'zona-toque flex h-9 flex-none items-center gap-1.5 rounded-full border border-text/15 bg-white px-3 text-[12.5px] font-semibold text-text hover:bg-bg-hover'
  const fondo = oscuro ? { background: 'rgba(255,253,248,.12)' } : undefined
  return (
    <div className="flex flex-none items-center gap-2" data-escuchar={estado}>
      {estado === 'parado' ? (
        <button type="button" onClick={escuchar} className={claseBoton} style={fondo}>
          <Icono nombre="altavoz" size={15} />
          {nombreBoton}
          {enPrueba && (
            <span data-escuchar-prueba className="text-[11px] font-medium opacity-80">
              · <span style={{ color: oscuro ? ORO_PALIDO : ORO_PEQUENO, fontWeight: 600 }}>Gratis</span> · 0/1
            </span>
          )}
        </button>
      ) : (
        <>
          {estado === 'hablando' ? (
            <button type="button" onClick={pausar} className={claseBoton} style={fondo}>
              <Icono nombre="pausa" size={15} />
              Pausa
            </button>
          ) : (
            <button type="button" onClick={seguir} className={claseBoton} style={fondo}>
              <Icono nombre="seguir" size={15} />
              Seguir
            </button>
          )}
          <button type="button" onClick={parar} aria-label="Parar" className={claseBoton} style={fondo}>
            <Icono nombre="cerrar" size={14} />
            Parar
          </button>
        </>
      )}
    </div>
  )
}
