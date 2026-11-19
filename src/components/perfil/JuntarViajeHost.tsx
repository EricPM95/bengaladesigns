import { dejarlosSeparados, juntarlos, textosDeJuntar, useJuntarUi } from '../../lib/juntarViaje'
import { Hoja, BotonHoja } from '../ui/Hoja'

/** (V17) La pregunta al unirte a un viaje compartido cuando ya tienes uno propio al mismo destino con días que se pisan. */
export function JuntarViajeHost() {
  const p = useJuntarUi((s) => s.propuesta)
  const ocupado = useJuntarUi((s) => s.ocupado)
  const error = useJuntarUi((s) => s.error)
  if (!p) return null
  const t = textosDeJuntar(p.destino, p.invitador)
  return (
    <Hoja onCerrar={dejarlosSeparados} etiqueta="Tu viaje" titulo={t.titulo} datos="juntar-viaje" z={97}>
      <p data-pregunta-juntar style={{ margin: 0, font: "500 15px/1.4 'Geist'" }}>{t.pregunta}</p>
      <p style={{ margin: 0, font: "400 13.5px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>Tus fotos y tus logros pasan al viaje compartido, sin repetirse, y tu copia se quita.</p>
      {error && <span data-error-juntar style={{ font: "500 12.5px 'Geist'", color: 'rgb(var(--accent-red))' }}>{error}</span>}
      <BotonHoja tipo="principal" onClick={() => void juntarlos()} disabled={ocupado} datos="juntarlos">{ocupado ? 'Juntando…' : 'Juntarlos'}</BotonHoja>
      <BotonHoja tipo="secundario" onClick={dejarlosSeparados} disabled={ocupado} datos="dejarlos-separados">Dejarlos separados</BotonHoja>
    </Hoja>
  )
}
