import { useEffect, useMemo } from 'react'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { cambiosDeLaPropuesta, etiquetaDeDia, textoDelCambio, textoDeCuantos, verboDelCambio, type CambioPropuesto } from '../../lib/propuesta'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useRouteStore } from '../../store/useRouteStore'
import { BotonHoja, Hoja } from '../ui/Hoja'
import { CambioParada } from './CambioParada'

/** Una fila de la lista de cambios: «Día 2 · jue 17 · cambiar» y debajo el cambio (la pareja, en su recuadro; lo que se quita, tachado en rojo; lo que se añade, en verde). */
export function FilaDeCambio({ etiqueta, cambio, onDeshacer }: { etiqueta: string; cambio: Pick<CambioPropuesto, 'tipo' | 'antes' | 'despues' | 'dayTitle'>; onDeshacer?: () => void }) {
  const texto = textoDelCambio(cambio as CambioPropuesto)
  return (
    <div data-cambio-propuesto={cambio.tipo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: '#F5EFE4' }}>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>
          {etiqueta} · {verboDelCambio(cambio.tipo)}
        </span>
        {cambio.tipo === 'cambiar' ? (
          <CambioParada a={cambio.antes?.name ?? ''} b={cambio.despues?.name ?? ''} tamano="pequena" />
        ) : cambio.tipo === 'quitar' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "500 13.5px/1.3 'Geist'", color: 'oklch(0.55 0.17 5)', textDecoration: 'line-through' }}>
            <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: 'oklch(0.55 0.17 5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 11px 'Geist'", textDecoration: 'none' }}>−</span>
            {texto}
          </span>
        ) : cambio.tipo === 'anadir' || cambio.tipo === 'dia_nuevo' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 13.5px/1.3 'Geist'", color: 'oklch(0.38 0.1 150)' }}>
            <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: 'oklch(0.55 0.11 150)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 11px 'Geist'" }}>+</span>
            {texto}
          </span>
        ) : (
          <span style={{ font: "500 13.5px/1.35 'Geist'" }}>{texto}</span>
        )}
      </span>
      {onDeshacer && (
        <button type="button" onClick={onDeshacer} data-deshacer-cambio style={{ minHeight: 44, minWidth: 44, border: 'none', background: 'transparent', font: "600 12.5px 'Geist'", textDecoration: 'underline', textUnderlineOffset: 3, color: 'inherit', cursor: 'pointer' }}>
          Deshacer
        </button>
      )}
    </div>
  )
}

/**
 * [VER]: LA LISTA DE SUS CAMBIOS (RV, cuentas parte 3): cada uno con su día y su [Deshacer], y [Enviar a Elena] debajo. Si un cambio se deshace y no queda ninguno, la hoja se cierra sola.
 * `enviada`: la variante de la persona que ya mandó su propuesta (AV7): la misma lista sin [Deshacer], con «Enviada · esperando a Elena».
 */
export function HojaVerPropuesta({ cambiosEnviados = null, onCerrar, nombreDelAdmin }: { nombreDelAdmin?: string; cambiosEnviados?: { etiqueta: string; cambio: Pick<CambioPropuesto, 'tipo' | 'antes' | 'despues' | 'dayTitle'> }[] | null; onCerrar?: () => void }) {
  const base = usePropuestaStore((s) => s.base)
  const verAbierto = usePropuestaStore((s) => s.verAbierto)
  const enviando = usePropuestaStore((s) => s.enviando)
  const error = usePropuestaStore((s) => s.error)
  const verLista = usePropuestaStore((s) => s.verLista)
  const deshacer = usePropuestaStore((s) => s.deshacer)
  const enviar = usePropuestaStore((s) => s.enviar)
  const route = useRouteStore((s) => s.route)
  const modo = useModoInvitado()
  const nombreAdmin = nombreDelAdmin ?? modo.nombreAdmin
  const cambios = useMemo(() => (base && route ? cambiosDeLaPropuesta(base, route) : []), [base, route])
  const enviada = cambiosEnviados != null
  const filas = enviada ? cambiosEnviados : route ? cambios.map((c) => ({ etiqueta: etiquetaDeDia(route, c.dayNumber), cambio: c, original: c })) : []
  // Sin cambios (se han deshecho todos), la lista se cierra sola.
  const vacia = !enviada && verAbierto && cambios.length === 0
  useEffect(() => {
    if (vacia) verLista(false)
  }, [vacia, verLista])
  if (!enviada && !verAbierto) return null
  const cerrar = () => (onCerrar ? onCerrar() : verLista(false))
  return (
    <Hoja onCerrar={cerrar} etiqueta="Tu propuesta" datos={enviada ? 'AV7' : 'RV'} z={95}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 34 }}>
        <span style={{ flex: 1, font: "400 25px/1.1 'Instrument Serif',serif" }}>{textoDeCuantos(filas.length)}</span>
        {enviada && (
          <span data-enviada-esperando style={{ height: 26, padding: '0 10px', borderRadius: 999, background: '#F5EFE4', color: 'rgba(28,34,48,.7)', display: 'flex', alignItems: 'center', gap: 6, font: "600 11.5px 'Geist'" }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.8 0.14 70)' }} />
            Enviada · esperando a {nombreAdmin}
          </span>
        )}
      </span>
      {filas.map((f, i) => (
        <FilaDeCambio key={(f as unknown as { original?: CambioPropuesto }).original?.id ?? i} etiqueta={f.etiqueta} cambio={f.cambio} onDeshacer={enviada ? undefined : () => deshacer((f as unknown as { original: CambioPropuesto }).original)} />
      ))}
      {error && (
        <p role="alert" style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'oklch(0.5 0.17 5)' }}>
          {error}
        </p>
      )}
      {!enviada && (
        <BotonHoja tipo="principal" disabled={enviando || filas.length === 0} onClick={() => void enviar()} datos="enviar-propuesta">
          Enviar a {nombreAdmin}
        </BotonHoja>
      )}
    </Hoja>
  )
}
