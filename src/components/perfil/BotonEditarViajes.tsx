import { usePerfilUi } from '../../store/usePerfilUi'

/**
 * El lápiz redondo junto al título «Mis viajes» (Tanda V8, `Perfil Zona` de Design; antes «Editar»): enseña la papelera de cada viaje y, en el modo editar, pasa a una marca (hecho).
 * Hace lo mismo que el [Editar] de antes. Fuera del modo editar, la lista queda como siempre.
 */
export function BotonEditarViajes() {
  const editando = usePerfilUi((s) => s.editando)
  const alternar = usePerfilUi((s) => s.alternarEdicion)
  return (
    <button
      type="button"
      onClick={alternar}
      data-editar-viajes={editando ? 'hecho' : 'editar'}
      aria-label={editando ? 'Hecho' : 'Editar'}
      className="zona-toque flex flex-none items-center justify-center rounded-full"
      style={{ width: 34, height: 34, color: '#1C2230', background: editando ? '#F3D88F' : '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', cursor: 'pointer', padding: 0 }}
    >
      {editando ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14.5 6.5l3 3" />
        </svg>
      )}
    </button>
  )
}
