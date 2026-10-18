/**
 * «Hola, viajero» con su círculo: la cabecera del Perfil de siempre (Tanda 6z6). Con los logros apagados es la única; con ellos encendidos es la que se ve mientras llegan los datos
 * (o si no hay cuenta), y la sustituye la del marco de rango. Un solo sitio para las dos.
 */
export function CabeceraDeSiempre() {
  return (
    <div className="flex items-center gap-3.5 px-1">
      <h2 className="m-0 flex-1 font-display text-[40px] leading-none tracking-[-.01em] text-text">
        Hola, <em>viajero</em>
      </h2>
      <span aria-hidden="true" className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-[#1C2230] font-display text-[26px] leading-none text-[#FFFDF8]" style={{ boxShadow: '0 0 0 3px rgb(var(--bg)), 0 0 0 4.5px oklch(0.8 0.14 70)' }}>
        V
      </span>
    </div>
  )
}
