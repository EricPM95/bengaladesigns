import type { CSSProperties, ReactNode } from 'react'

const GRIS = 'rgba(28,34,48,.07)'

/** Un hueco gris claro (el sitio de algo que aún no ha llegado). */
function Hueco({ w, h, r = 12, style }: { w: number | string; h: number; r?: number | string; style?: CSSProperties }): ReactNode {
  return <span aria-hidden="true" style={{ display: 'block', width: w, height: h, borderRadius: r, background: GRIS, flex: 'none', ...style }} />
}

/**
 * EL PERFIL NUEVO VACÍO (Tanda 10N3, §3b.2): lo que se ve mientras llegan los datos del Perfil con logros. Tiene la misma forma que el de verdad (el círculo del marco, «Hola, …», la barra de EXP,
 * la vitrina y el pasaporte), con los huecos de cada tarjeta en gris claro. Sustituye al «Perfil de siempre» que se colaba un instante: con los logros encendidos el Perfil viejo no sale NUNCA.
 * `nombre`: el nombre ya conocido (sale en el «Hola»); `conViajes`: si abajo va la lista de viajes de este móvil (no) o un hueco con el título «Mis viajes» (sí).
 */
export function PerfilEsqueleto({ nombre = null, titulo = true }: { nombre?: string | null; titulo?: boolean }): ReactNode {
  return (
    <div data-perfil-cargando="1" aria-busy="true" className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-3.5 px-1">
        <Hueco w={104} h={104} r="50%" />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {nombre ? (
            <h2 className="m-0 font-display text-[34px] leading-none tracking-[-.01em] text-text">
              Hola, <em>{nombre}</em>
            </h2>
          ) : (
            <Hueco w="70%" h={30} r={10} />
          )}
          <Hueco w="52%" h={14} r={7} />
          <Hueco w="44%" h={30} r={999} />
        </div>
      </div>
      <Hueco w="100%" h={44} r={14} />
      <Hueco w="100%" h={200} r={26} />
      <Hueco w="100%" h={132} r={24} />
      {titulo && <Hueco w={120} h={24} r={8} style={{ marginTop: 52 }} />}
    </div>
  )
}
