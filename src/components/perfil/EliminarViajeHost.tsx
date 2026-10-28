import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { guardarTodasMisFotos, useEliminarViaje, type DatosDeLaHoja } from '../../lib/eliminarViaje'
import { textoDeFotos } from '../../lib/viajesPerfil'
import { Hoja, BotonHoja } from '../ui/Hoja'
import { AvisoSobreLaBarra } from '../ui/AvisoSobreLaBarra'

/** «Ana», «Ana y Luis», «Ana, Luis y Marta». */
export function listaDeNombres(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? ''
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/**
 * LA HOJA DE ELIMINAR UN VIAJE (Tanda 10F), de las que suben desde abajo como las demás de la app (no una ventana del navegador): «¿Eliminar tu viaje a Roma?» con sus fechas, lo que se BORRA (la ruta, los días,
 * las reservas apuntadas y las fotos del viaje; con fotos, «Tienes 155 fotos en este viaje» y [Guardar en mi galería]), lo que se QUEDA (los logros, sellos y EXP, y el Pase de ese destino), los avisos que
 * hagan falta (es el viaje abierto, estás de viaje ahora mismo, también desaparece para los invitados) y [Eliminar viaje] en el rojo de los avisos importantes. Quien está invitada no lo borra para los demás:
 * su botón es [Salir de este viaje].
 */
function ContenidoDeLaHoja({ datos }: { datos: DatosDeLaHoja }) {
  const confirmar = useEliminarViaje((s) => s.confirmar)
  const cerrar = useEliminarViaje((s) => s.cerrarHoja)
  const [bajando, setBajando] = useState<{ hechas: number; total: number } | null>(null)
  const [guardadas, setGuardadas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { viaje, fotos, invitados, esInvitado } = datos
  const fechas = [viaje.cuando, viaje.duracion].filter(Boolean).join(' · ')

  const guardarFotos = async () => {
    setError(null)
    setBajando({ hechas: 0, total: fotos ?? 0 })
    const fallo = await guardarTodasMisFotos(viaje.id, (hechas, total) => setBajando({ hechas, total }))
    setBajando(null)
    if (fallo) setError(fallo)
    else setGuardadas(true)
  }

  const linea = { font: "400 13.5px/1.4 'Geist'", color: 'rgba(28,34,48,.78)' } as const
  const aviso = (texto: string, dato: string) => (
    <p data-aviso-eliminar={dato} style={{ margin: 0, padding: '9px 12px', borderRadius: 12, background: 'rgb(var(--accent-red) / .08)', font: "600 13px/1.35 'Geist'", color: 'rgb(var(--accent-red))' }}>
      {texto}
    </p>
  )

  return (
    <Hoja onCerrar={cerrar} etiqueta={esInvitado ? 'Salir del viaje' : 'Eliminar viaje'} titulo={esInvitado ? `¿Salir de tu viaje a ${viaje.destino}?` : `¿Eliminar tu viaje a ${viaje.destino}?`} datos="eliminar-viaje">
      {fechas && (
        <span data-fechas-del-viaje style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)', marginTop: -4 }}>
          {fechas}
        </span>
      )}
      {datos.esElAbierto && aviso('Es el viaje que tienes abierto', 'abierto')}
      {datos.esAhora && aviso('Estás de viaje ahora mismo', 'ahora')}
      {!esInvitado && invitados.length > 0 && aviso(`También desaparece para ${listaDeNombres(invitados)}`, 'compartido')}

      <div data-se-borra style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Se borra</span>
        <p style={{ ...linea, margin: 0 }}>
          {esInvitado ? 'Solo sale de tu cuenta: para los demás el viaje sigue. Tus fotos de este viaje también se borran.' : 'La ruta, los días, las reservas que has apuntado y las fotos de este viaje.'}
        </p>
      </div>

      {fotos !== null && fotos > 0 && (
        <div data-fotos-del-viaje style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 16, background: '#F5EFE4' }}>
          <span style={{ font: "600 14px 'Geist'" }}>Tienes {textoDeFotos(fotos)} en este viaje</span>
          {guardadas ? (
            <span data-fotos-guardadas style={{ font: "600 13px 'Geist'", color: 'oklch(0.38 0.1 150)' }}>✓ Guardadas en tu galería</span>
          ) : (
            <BotonHoja tipo="secundario" onClick={() => void guardarFotos()} disabled={bajando !== null} datos="guardar-fotos">
              {bajando ? `Bajando ${bajando.hechas} de ${bajando.total}…` : 'Guardar en mi galería'}
            </BotonHoja>
          )}
          {error && <span style={{ font: "500 12.5px 'Geist'", color: 'rgb(var(--accent-red))' }}>{error}</span>}
        </div>
      )}

      <div data-se-queda style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Se queda</span>
        <p style={{ ...linea, margin: 0 }}>Tus logros, sellos y EXP, y tu Pase de {viaje.destino}, si lo tienes: se paga por destino, no por viaje.</p>
      </div>

      <button
        type="button"
        onClick={() => void confirmar()}
        data-confirmar-eliminar
        style={{ height: 54, border: 'none', borderRadius: 999, background: 'rgb(var(--accent-red))', color: '#FFFFFF', font: "700 15px 'Geist'", cursor: 'pointer', marginTop: 4 }}
      >
        {esInvitado ? 'Salir de este viaje' : 'Eliminar viaje'}
      </button>
      <BotonHoja tipo="secundario" onClick={cerrar} datos="cancelar-eliminar">
        Cancelar
      </BotonHoja>
    </Hoja>
  )
}

/** El aviso de abajo: «Viaje eliminado» con [Deshacer] unos segundos (o el error, sin [Deshacer]). */
function AvisoViajeEliminado() {
  const aviso = useEliminarViaje((s) => s.aviso)
  const deshacer = useEliminarViaje((s) => s.deshacer)
  const cerrarAviso = useEliminarViaje((s) => s.cerrarAviso)
  // Un error se va solo a los pocos segundos; el de «Viaje eliminado» lo quita el propio plazo de la tienda.
  useEffect(() => {
    if (!aviso || aviso.deshacer) return undefined
    const t = window.setTimeout(cerrarAviso, 6000)
    return () => window.clearTimeout(t)
  }, [aviso, cerrarAviso])
  if (!aviso) return null
  return createPortal(
    <AvisoSobreLaBarra z={96} datos={{ 'data-aviso-viaje-eliminado': '' }}>
      <>
        <p className="min-w-0 flex-1 text-[14px] font-medium">{aviso.texto}</p>
        {aviso.deshacer && (
          <button type="button" onClick={deshacer} data-deshacer-eliminar className="shrink-0 text-[14px] font-semibold" style={{ color: '#E9C77A' }}>
            Deshacer
          </button>
        )}
      </>
    </AvisoSobreLaBarra>,
    document.body,
  )
}

/** Montado una vez en App.tsx: la hoja y el aviso de eliminar un viaje, desde el Perfil o desde la pantalla antigua «Mis viajes». */
export function EliminarViajeHost() {
  const hoja = useEliminarViaje((s) => s.hoja)
  return (
    <>
      {hoja && <ContenidoDeLaHoja key={hoja.viaje.id} datos={hoja} />}
      <AvisoViajeEliminado />
    </>
  )
}
