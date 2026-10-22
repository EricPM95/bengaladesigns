import { usePerfilUi } from '../../store/usePerfilUi'

/** [Editar] al lado del título «Mis viajes» (Tanda 10F): enseña la papelera de cada viaje y pasa a [Hecho]. Fuera del modo editar, la lista queda como siempre. */
export function BotonEditarViajes({ oscuro = false }: { oscuro?: boolean }) {
  const editando = usePerfilUi((s) => s.editando)
  const alternar = usePerfilUi((s) => s.alternarEdicion)
  return (
    <button
      type="button"
      onClick={alternar}
      data-editar-viajes={editando ? 'hecho' : 'editar'}
      className="flex h-8 items-center rounded-full px-1.5 text-[14px] font-semibold"
      style={{ color: oscuro ? '#E9C77A' : '#6F4E37', background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      {editando ? 'Hecho' : 'Editar'}
    </button>
  )
}
