import { useEffect, useMemo } from 'react'
import { useLaPropuesta } from '../../hooks/useLaPropuesta'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { textoDeCuantos, textoDeLoAceptado, textoEnviarA, textoEsperandoA, type CambioPropuesto } from '../../lib/propuesta'
import { pedirPermisoUnaVez } from '../../lib/permisoAvisos'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { DetalleDeCambio } from './DetalleDeCambio'
import { FilaDeCambio } from './FilaDeCambio'

export { FilaDeCambio }

const ESTILO_LISTA = { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '52dvh', overflowY: 'auto', scrollbarWidth: 'none', paddingBottom: 6 } as const

/**
 * LA HOJA DE LA PROPUESTA DE QUIEN SOLO RECOMIENDA (Tanda 10N, apartado 6; «Propuesta Cambios · 2»). Se abre con el lápiz flotante:
 *   · «Tu propuesta · 5 cambios»: la lista de lo que ha cambiado sin enviar (un cambio por idea, cada uno con su [Deshacer]) y, siempre a mano abajo, [Enviar a Eric]. Nunca se envía sin pasar por esta lista.
 *   · Los cambios que ya no tienen sentido (el administrador cambió ese día) salen marcados y se pueden quitar.
 *   · Lo ya enviado que espera respuesta, debajo («Enviada · esperando a Eric»).
 *   · La propuesta ya contestada (desde el aviso «Eric ha aceptado 3 de tus 5 cambios»): su lista con cuáles sí y cuáles no.
 * Al tocar una fila, el detalle del cambio (antes y ahora, con el mapa pequeño).
 */
export function HojaVerPropuesta() {
  const verAbierto = usePropuestaStore((s) => s.verAbierto)
  const hoja = usePropuestaStore((s) => s.hoja)
  const detalle = usePropuestaStore((s) => s.detalle)
  const enviando = usePropuestaStore((s) => s.enviando)
  const error = usePropuestaStore((s) => s.error)
  const verLista = usePropuestaStore((s) => s.verLista)
  const verDetalle = usePropuestaStore((s) => s.verDetalle)
  const deshacer = usePropuestaStore((s) => s.deshacer)
  const quitarSinSentido = usePropuestaStore((s) => s.quitarSinSentido)
  const enviar = usePropuestaStore((s) => s.enviar)
  const { cambios, sinSentido, mandadas, enEspera, route, base } = useLaPropuesta()
  const { nombreAdmin } = useModoInvitado()
  const modoMia = hoja?.modo === 'mia'
  const vacia = modoMia && cambios.length === 0 && sinSentido.length === 0 && enEspera.length === 0
  // Sin nada que enseñar (se han deshecho todos), la hoja se cierra sola.
  useEffect(() => {
    if (verAbierto && vacia) verLista(false)
  }, [verAbierto, vacia, verLista])
  const rec = hoja?.modo === 'enviada' ? mandadas.find((m) => m.rec.id === hoja.recId) ?? null : null
  const sobre = base ?? route
  const abierto = useMemo(() => {
    if (!detalle) return null
    if (detalle.recId) {
      const m = mandadas.find((x) => x.rec.id === detalle.recId)
      const i = m ? m.cambios.findIndex((c) => c.id === detalle.id) : -1
      return m && i >= 0 ? { cambio: m.cambios[i], i, n: m.cambios.length, decision: m.rec.decisiones?.[detalle.id] ?? null, mia: false } : null
    }
    const i = cambios.findIndex((c) => c.id === detalle.id)
    return i >= 0 ? { cambio: cambios[i], i, n: cambios.length, decision: null, mia: true } : null
  }, [detalle, cambios, mandadas])
  if (!verAbierto || !hoja || vacia || !route) return null

  const cerrar = () => verLista(false)
  const destino = route.destination
  const enviarAhora = () => {
    void pedirPermisoUnaVez()
    void enviar()
  }
  const listaDeEnviada = (cs: CambioPropuesto[], decisiones: Record<string, 'aceptado' | 'rechazado'> | undefined, recId: string) =>
    cs.map((c) => <FilaDeCambio key={c.id} cambio={c} modo="enviada" decision={decisiones?.[c.id] ?? null} onAbrir={() => verDetalle(c.id, recId)} />)

  let titulo: string
  let quien: string
  if (hoja.modo === 'enviada') {
    const aceptados = rec ? Object.values(rec.rec.decisiones ?? {}).filter((d) => d === 'aceptado').length : 0
    const decididos = rec ? Object.keys(rec.rec.decisiones ?? {}).length : 0
    titulo = 'Tu propuesta'
    quien = rec && decididos > 0 ? textoDeLoAceptado(nombreAdmin, aceptados, rec.cambios.length) : `Enviada · ${textoEsperandoA(nombreAdmin)}`
  } else {
    titulo = cambios.length > 0 ? `Tu propuesta · ${textoDeCuantos(cambios.length)}` : 'Tu propuesta'
    quien = cambios.length > 0 ? `Para ${nombreAdmin || 'el administrador'} · viaje a ${destino}` : `Enviada · ${textoEsperandoA(nombreAdmin)}`
  }

  return (
    <>
      <Hoja onCerrar={cerrar} etiqueta="Tu propuesta" datos="propuesta" z={95}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 34 }}>
          <span data-propuesta-titulo style={{ font: "400 28px/1 'Instrument Serif',serif" }}>
            {titulo}
          </span>
          <span data-propuesta-quien style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            {quien}
          </span>
        </span>
        <div data-propuesta-lista style={ESTILO_LISTA}>
          {modoMia &&
            cambios.map((c) => <FilaDeCambio key={c.id} cambio={c} modo="mia" onDeshacer={() => deshacer(c)} onAbrir={() => verDetalle(c.id)} />)}
          {modoMia && sinSentido.map((c) => <FilaDeCambio key={`s-${c.id}`} cambio={c} modo="mia" onQuitar={() => quitarSinSentido(c.id)} />)}
          {modoMia && enEspera.length > 0 && (
            <>
              <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)', paddingTop: cambios.length > 0 ? 8 : 0 }}>Enviada · {textoEsperandoA(nombreAdmin)}</span>
              {enEspera.flatMap((m) => listaDeEnviada(m.cambios, m.rec.decisiones, m.rec.id))}
            </>
          )}
          {hoja.modo === 'enviada' && rec && listaDeEnviada(rec.cambios, rec.rec.decisiones, rec.rec.id)}
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgb(var(--accent-red))' }}>
            {error}
          </p>
        )}
        {modoMia && (
          <BotonHoja tipo="principal" disabled={enviando || cambios.length === 0} onClick={enviarAhora} datos="enviar-propuesta">
            {textoEnviarA(nombreAdmin)}
          </BotonHoja>
        )}
      </Hoja>
      {abierto && sobre && (
        <DetalleDeCambio
          cambio={abierto.cambio}
          sobre={sobre}
          cabecera={abierto.mia ? `CAMBIO ${abierto.i + 1} DE ${abierto.n}` : `TU PROPUESTA · ${abierto.i + 1} DE ${abierto.n}`}
          modo={abierto.mia ? 'mia' : 'enviada'}
          decision={abierto.decision}
          onCerrar={() => verDetalle(null)}
          onDeshacer={() => {
            deshacer(abierto.cambio)
            verDetalle(null)
          }}
        />
      )}
    </>
  )
}
