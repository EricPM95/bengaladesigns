import { useMemo } from 'react'
import { lugarCon } from '../../../../lib/articulos'
import { displayStopName } from '../../../../lib/format'
import { aHora, claseDe, delDia, minDe, proponerPasarSitios, retrasoDeAhora, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { aplicarPropuesta } from '../../../../lib/hoyCambiarPlanAplicar'
import { puntualidadDe } from '../../../../lib/puntualidadEntradas'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { tarjetasDePropuesta, type TarjetaDePropuesta } from '../../../../lib/tarjetasDePropuesta'
import type { DayPlan, Route, Stop } from '../../../../lib/types'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { EnlaceDejarlo } from '../piezas'
import { FranjaVerde, TarjetasDeCambios, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'

/**
 * (V59; Design «Cierre del día», H1 a H5) LA HOJA DE «VAS TARDE» Y DEL CIERRE DEL DÍA: UNA sola pieza (sustituye a «Hoy ya no da tiempo a todo» de la V43 y a la hoja de «Voy con retraso»); solo cambia el texto de arriba.
 *   · H1 «Hoy ya no da tiempo a todo» (durante el día: más de 1 h de retraso o la mañana pasada sin nada hecho; una vez al día; nunca desde las 20:00).
 *   · H2 «Por hoy ya está» (a las 22:00 o al hacer la última parada) · H3 «Ayer te quedaron N sitios sin ver» (a la mañana siguiente, si no se abrió por la noche).
 *   · H4 «Voy con retraso», cuando aún da tiempo a todo (sin tarjetas, la franja verde y un solo [Entendido]) · H5 «Voy con retraso», cuando ya no da tiempo (como H1).
 * Dentro, igual en todas (piezas que ya existen: `TarjetaDelSitio` vía `TarjetasDeCambios`, `FranjaVerde`, `BOTON_ORO`/`BOTON_CLARO`, `EnlaceDejarlo`): una tarjeta por sitio (foto real, nombre, a dónde iría en gris y su cuadrado: la fecha o el icono de pendientes),
 * la franja verde «La tarde sigue igual, desde {lugar}», [Pasarlos a otros días] (dorado), [Guardarlos en pendientes] (blanco con borde) y [Dejarlo como está] en texto; y, si el día tiene una entrada con margen (V54), la línea gris
 * «Tu entrada del Foro Romano vale todo el día: puedes entrar cuando llegues.» (nunca «ya ha pasado» en una entrada con margen). Sin [Ver otra opción] ni [Ver lo que queda hoy]. Vale igual en Roma que en Lanzarote (en coche).
 */
const MARFIL = '#FBF3E2'

export type VarianteDeCierre = 'h1' | 'h2' | 'h3'

const sitios = (n: number): string => `${n} ${n === 1 ? 'sitio' : 'sitios'}`

/** «40 minutos», «1 hora y 20 minutos» (redondeado a 5). */
export function duracionTexto(min: number): string {
  const m = Math.max(5, Math.round(min / 5) * 5)
  if (m < 60) return `${m} minutos`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h} ${h === 1 ? 'hora' : 'horas'}${r ? ` y ${r} minutos` : ''}`
}

/** Lo que dice la línea gris de arriba: una entrada de hoy con margen o libre (V54) y las entradas estrictas cuya hora ya pasó. Nunca «ya ha pasado» en una entrada con margen. */
function lineasDeEntradas(day: DayPlan, ahoraMin: number, ctx: ReturnType<typeof useContexto>): { margen: string | null; pasadas: string[] } {
  const fijas = ctx.fijasDe(day)
  const pend = delDia(day).filter((s) => !s.checkedInAt && claseDe(s, fijas, ctx.datos) === 'fija')
  let margen: string | null = null
  const pasadas: string[] = []
  for (const s of pend) {
    const nombre = displayStopName(s.name).split(' y ')[0].trim()
    const p = puntualidadDe(s.name)
    const hora = ctx.horaFijaMin?.(s) ?? minDe(s.time)
    if (p.tipo === 'libre') margen ??= `Tu entrada ${lugarCon('de', nombre)} vale todo el día: ${segunGrupo('podéis entrar cuando lleguéis', 'puedes entrar cuando llegues')}.`
    else if (p.tipo === 'margen') margen ??= `Tu entrada ${lugarCon('de', nombre)} admite hasta ${p.margenMin} minutos de retraso: ${segunGrupo('podéis entrar cuando lleguéis', 'puedes entrar cuando llegues')}.`
    else if (hora != null && hora < ahoraMin) pasadas.push(s.isFreeTour ? `Tu ${nombre} de las ${aHora(hora, false)} ya ha pasado.` : `Tu entrada de las ${aHora(hora, false)} ${lugarCon('en', nombre)} ya ha pasado.`)
  }
  return { margen, pasadas }
}

/** El último sitio que se hizo hoy (para «La tarde sigue igual, desde …»). */
function ultimoHecho(day: DayPlan): string | null {
  const hechas = numberedStopsOf(day).filter((s) => s.checkedInAt)
  if (hechas.length === 0) return null
  hechas.sort((a, b) => new Date(b.checkedInAt as string).getTime() - new Date(a.checkedInAt as string).getTime())
  return displayStopName(hechas[0].name)
}

/** La frase de la franja verde de H1/H5. */
const franjaDeLaTarde = (desde: string | null): string => (desde ? `La tarde sigue igual, desde ${desde}` : 'La tarde sigue igual')

/** Las tarjetas de «a dónde iría» sin el «, por la mañana» de las otras hojas: «Al jueves 26». */
const sinFranjaHoraria = (t: TarjetaDePropuesta): TarjetaDePropuesta => ({ ...t, cuando: t.cuando.replace(/, por la (mañana|tarde)$/, '') })

interface CuerpoProps {
  titulo: string
  /** Lo que se dice arriba (el motivo). */
  intro: string | null
  gris: string[]
  tarjetas: TarjetaDePropuesta[]
  franja: string | null
  /** Sin nada que mover: solo [Entendido]. */
  soloEntendido?: boolean
  pasar: Propuesta | null
  pendientes: Propuesta | null
  /** Cuántos sitios cambian (para el singular: «Pasarlo», «Guardarlo»). */
  n: number
  onElegir: (p: Propuesta) => void
  onEntendido: () => void
  onCerrar: () => void
  variante: string
}

/** El cuerpo común de las cinco: título, texto, línea gris, tarjetas, franja verde y los botones. */
function CuerpoDeLaHoja(p: CuerpoProps) {
  const uno = p.n === 1
  // Si ningún sitio cabe en otro día, solo queda guardarlos: un único botón dorado.
  const soloPendientes = p.pasar == null || p.tarjetas.every((t) => t.aPendientes)
  return (
    <HojaV2 onCerrar={p.onCerrar} etiqueta={p.titulo} fondo={MARFIL}>
      <div data-hoja-cierre={p.variante} className="flex flex-col gap-3">
        <Titulo texto={p.titulo} onCerrar={p.onCerrar} />
        {p.intro && <span data-cierre-intro className="text-[14.5px] font-medium leading-[1.4]">{p.intro}</span>}
        {p.gris.map((g, i) => (
          <span key={i} data-cierre-gris className="text-[13px] leading-[1.4] text-[#1C2230]/55">{g}</span>
        ))}
        {p.tarjetas.length > 0 && <TarjetasDeCambios tarjetas={p.tarjetas} franja={p.franja} />}
        {p.tarjetas.length === 0 && p.franja && <FranjaVerde texto={p.franja} />}
        {p.soloEntendido || (!p.pasar && !p.pendientes) ? (
          <button type="button" onClick={p.onEntendido} data-cierre-entendido className="mt-1 flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
            Entendido
          </button>
        ) : (
          <>
            {soloPendientes ? (
              <button type="button" onClick={() => p.onElegir((p.pendientes ?? p.pasar) as Propuesta)} data-cierre-pendientes className="mt-1 flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
                {uno ? 'Guardarlo en pendientes' : 'Guardarlos en pendientes'}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => p.onElegir(p.pasar as Propuesta)} data-cierre-pasar className="mt-1 flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
                  {uno ? 'Pasarlo a otro día' : 'Pasarlos a otros días'}
                </button>
                {p.pendientes && (
                  <button type="button" onClick={() => p.onElegir(p.pendientes as Propuesta)} data-cierre-pendientes className="flex min-h-12 items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold" style={BOTON_CLARO}>
                    {uno ? 'Guardarlo en pendientes' : 'Guardarlos en pendientes'}
                  </button>
                )}
              </>
            )}
            <EnlaceDejarlo onClick={p.onCerrar} datos={{ 'data-cierre-dejar': '1' }} />
          </>
        )}
      </div>
    </HojaV2>
  )
}

/**
 * H1, H2 y H3: los sitios que se quedaron sin ver, de `day` (el día que se cierra: hoy, o ayer en H3).
 * `onCerrar(aplicado)`: se cierra de cualquier forma (la X, [Dejarlo], tocar fuera, o tras elegir); quien la monta apunta que ya salió y, en H2 y H3, abre el resumen del día.
 */
export function HojaDeCierre({ variante, route, day, dateIso, enCoche, ahoraMin, onCerrar }: { variante: VarianteDeCierre; route: Route; day: DayPlan; dateIso: string; enCoche: boolean; ahoraMin: number; onCerrar: (aplicado: boolean) => void }) {
  const ctx = useContexto(route, enCoche)
  const fijas = ctx.fijasDe(day)
  // H1: lo que ya tocaba y no se hizo (la tarde sigue igual). H2 y H3: todo lo que se quedó sin ver (las nocturnas no cuentan).
  const sinVer = useMemo(() => delDia(day).filter((s) => !s.checkedInAt), [day])
  const faltan = useMemo(
    () => (variante === 'h1' ? sinVer.filter((s) => (minDe(s.time) ?? 24 * 60) < ahoraMin) : sinVer),
    [variante, sinVer, ahoraMin],
  )
  const movibles = useMemo(() => faltan.filter((s) => claseDe(s, fijas, ctx.datos) !== 'fija'), [faltan, fijas, ctx.datos])
  const n = faltan.length
  const { pasar, pendientes } = useMemo(() => {
    if (movibles.length === 0) return { pasar: null, pendientes: null }
    const base = { route, day, ctx, stops: movibles, intro: '', cuandoConDia: true }
    const aviso = (txt: string) => (pr: Propuesta | null): Propuesta | null => (pr ? { ...pr, avisoTexto: txt } : null)
    return {
      pasar: aviso(`${sitios(movibles.length)} pasado${movibles.length === 1 ? '' : 's'} a otros días`)(proponerPasarSitios(base)),
      pendientes: aviso(`${sitios(movibles.length)} en Lugares pendientes`)(proponerPasarSitios({ ...base, soloPendientes: true })),
    }
  }, [movibles, route, day, ctx])
  const tarjetas = useMemo(() => (pasar ? tarjetasDePropuesta(pasar, route).map(sinFranjaHoraria) : []), [pasar, route])
  const { margen, pasadas } = useMemo(() => lineasDeEntradas(day, ahoraMin, ctx), [day, ahoraMin, ctx])

  const titulo = variante === 'h1' ? 'Hoy ya no da tiempo a todo' : variante === 'h2' ? 'Por hoy ya está' : `${segunGrupo('Ayer os quedaron', 'Ayer te quedaron')} ${sitios(n)} sin ver`
  const intro =
    n === 0
      ? (pasadas[0] ?? 'Tu día sigue como estaba.')
      : variante === 'h1'
        ? `Lo de esta mañana ya ha pasado: ${segunGrupo('os', 'te')} ${n === 1 ? 'ha quedado' : 'han quedado'} ${sitios(n)} sin ver.`
        : variante === 'h2'
          ? `${segunGrupo('Os', 'Te')} ${n === 1 ? 'ha quedado' : 'han quedado'} ${sitios(n)} sin ver.`
          : null
  const gris = [...(n > 0 ? pasadas : []), ...(margen ? [margen] : [])]
  const franja = variante === 'h1' && movibles.length > 0 ? franjaDeLaTarde(ultimoHecho(day)) : null

  return (
    <CuerpoDeLaHoja
      variante={variante}
      titulo={titulo}
      intro={intro}
      gris={gris}
      tarjetas={tarjetas}
      franja={franja}
      soloEntendido={movibles.length === 0}
      pasar={pasar}
      pendientes={pendientes}
      n={movibles.length}
      onElegir={(p) => {
        aplicarPropuesta(route.id, dateIso, p)
        onCerrar(true)
      }}
      onEntendido={() => onCerrar(false)}
      onCerrar={() => onCerrar(false)}
    />
  )
}

/**
 * H4 y H5: «Voy con retraso». `propuestas` son las de `proponerRetraso` (la primera es la mínima).
 *   · H4: sin sitios que quitar → «Vas 40 minutos tarde, pero hoy te da tiempo a todo.», la franja verde y [Entendido] (lo de después se retrasa lo justo: se guarda, como antes con «Ajustar mi día»).
 *   · H5: con sitios que ya no caben → «Vas tarde: hoy no te da tiempo a ver 3 sitios.», sus tarjetas y los mismos botones que H1.
 */
export function HojaVoyConRetraso({ route, day, dateIso, enCoche, propuestas, ahoraMin, onCerrar }: { route: Route; day: DayPlan; dateIso: string; enCoche: boolean; propuestas: Propuesta[]; ahoraMin: number; onCerrar: () => void }) {
  const primera = propuestas[0] ?? null
  const sig = numberedStopsOf(day).find((s: Stop) => !s.saltada && !s.checkedInAt)
  const retraso = retrasoDeAhora(ahoraMin, sig?.time)
  const tarde = retraso <= 5 ? 'un poco tarde' : `${duracionTexto(retraso)} tarde`
  const clave = (p: Propuesta) => p.quitadas.map((q) => q.id).sort().join('|')
  const { pasar, pendientes } = useMemo(() => {
    if (!primera || primera.quitadas.length === 0) return { pasar: null as Propuesta | null, pendientes: null as Propuesta | null }
    const k = clave(primera)
    const mismas = propuestas.filter((p) => clave(p) === k)
    return {
      pasar: mismas.find((p) => p.quitadas.some((q) => q.destino === 'manana')) ?? null,
      pendientes: mismas.find((p) => p.quitadas.every((q) => q.destino === 'sobra')) ?? null,
    }
  }, [primera, propuestas])
  const base = pasar ?? pendientes
  const ids = new Set((primera?.quitadas ?? []).map((q) => q.id))
  const tarjetas = useMemo(() => (base ? tarjetasDePropuesta(base, route).filter((t) => t.parada && ids.has(t.parada.id)).map(sinFranjaHoraria) : []), [base, route]) // eslint-disable-line react-hooks/exhaustive-deps
  const ctx = useContexto(route, enCoche)
  const { margen } = useMemo(() => lineasDeEntradas(day, ahoraMin, ctx), [day, ahoraMin, ctx])

  // H4: todo cabe. Lo que sigue se corre lo justo (las horas se guardan, con [Deshacer]).
  if (!primera || primera.quitadas.length === 0) {
    return (
      <CuerpoDeLaHoja
        variante="h4"
        titulo="Voy con retraso"
        intro={`${segunGrupo('Vais', 'Vas')} ${tarde}, pero hoy ${segunGrupo('os', 'te')} da tiempo a todo.`}
        gris={margen ? [margen] : []}
        tarjetas={[]}
        franja="Tu día sigue igual, solo un poco más tarde"
        soloEntendido
        pasar={null}
        pendientes={null}
        n={0}
        onElegir={() => undefined}
        onEntendido={() => {
          if (primera && primera.ops.length > 0) aplicarPropuesta(route.id, dateIso, { ...primera, avisoTexto: 'Tu día, un poco más tarde' })
          onCerrar()
        }}
        onCerrar={onCerrar}
      />
    )
  }
  return (
    <CuerpoDeLaHoja
      variante="h5"
      titulo="Voy con retraso"
      intro={`${segunGrupo('Vais', 'Vas')} tarde: hoy no ${segunGrupo('os', 'te')} da tiempo a ver ${sitios(primera.quitadas.length)}.`}
      gris={margen ? [margen] : []}
      tarjetas={tarjetas}
      franja={franjaDeLaTarde(ultimoHecho(day))}
      pasar={pasar}
      pendientes={pendientes}
      n={primera.quitadas.length}
      onElegir={(p) => {
        aplicarPropuesta(route.id, dateIso, p)
        onCerrar()
      }}
      onEntendido={onCerrar}
      onCerrar={onCerrar}
    />
  )
}

/** ¿Esta lista de propuestas de retraso se enseña con la hoja nueva (H4/H5)? No si hay que preguntar (lo más importante). */
export const retrasoConHojaNueva = (propuestas: Propuesta[]): boolean => !propuestas[0]?.pregunta
