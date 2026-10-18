import { cuentasActivas } from '../../lib/cuentas'
import { inicialDeNombre } from '../../lib/miPerfil'
import { useAjustesUi } from '../../store/useAjustesUi'
import { useMiNombreYFoto } from '../../store/useMiPerfil'
import { Avatar } from '../ajustes/Avatar'
import { Icono } from '../ui/Icono'

/**
 * «Hola, viajero» con su círculo: la cabecera del Perfil de siempre (Tanda 6z6). Con los logros apagados es la única; con ellos encendidos es la que se ve mientras llegan los datos
 * (o si no hay cuenta), y la sustituye la del marco de rango. Un solo sitio para las dos.
 * Con las cuentas encendidas (cuentas parte 3): «Hola, {nombre}» («Viajero» hasta que ponga uno), su foto en el círculo (tocarlo la cambia) y el botón de Ajustes.
 */
export function CabeceraDeSiempre() {
  const conCuentas = cuentasActivas()
  const yo = useMiNombreYFoto()
  const abrirAjustes = useAjustesUi((s) => s.abrir)
  const editarPerfil = useAjustesUi((s) => s.editarPerfil)
  return (
    <div className="flex items-center gap-3.5 px-1">
      <h2 className="m-0 flex-1 font-display text-[40px] leading-none tracking-[-.01em] text-text">
        Hola, <em>{conCuentas ? yo.nombre : 'viajero'}</em>
      </h2>
      {conCuentas ? (
        <>
          <button type="button" onClick={() => editarPerfil(true)} aria-label="Cambiar mi foto y mi nombre" data-editar-perfil className="flex h-11 w-[52px] flex-none items-center justify-center">
            <span style={{ boxShadow: '0 0 0 3px rgb(var(--bg)),0 0 0 4.5px rgb(var(--accent))', borderRadius: '50%', display: 'flex' }}>
              <Avatar foto={yo.foto} inicial={inicialDeNombre(yo.tieneNombre ? yo.nombre : null)} tam={52} />
            </span>
          </button>
          <button type="button" aria-label="Ajustes" data-ajustes onClick={() => abrirAjustes()} className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-text/70">
            <Icono nombre="ajustes" size={22} />
          </button>
        </>
      ) : (
        <span aria-hidden="true" className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-[#1C2230] font-display text-[26px] leading-none text-[#FFFDF8]" style={{ boxShadow: '0 0 0 3px rgb(var(--bg)),0 0 0 4.5px rgb(var(--accent))' }}>
          V
        </span>
      )}
    </div>
  )
}
