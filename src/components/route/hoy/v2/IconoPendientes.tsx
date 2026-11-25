/**
 * V53 §6: EL ICONO DE «LUGARES PENDIENTES», UNA sola pieza: el D de Design «Icono Pendientes» (el «Pin con reloj»: el sitio y, en la esquina, un reloj de «para luego»).
 * (Design marca la A como «la elegida»; Eric eligió la D. Ni la A, ni la E, ni la F.) Se usa en cuatro sitios: la cabecera del bloque «LUGARES PENDIENTES 7», el cuadrado de la derecha de la tarjeta
 * de «Pasar a otro día» cuando el sitio va a pendientes (`CuadradoPendientes`), el botón [Guardar en pendientes] y el aviso de abajo «… lo tienes en Lugares pendientes · [Deshacer]».
 * `fondo`: el color de detrás (el reloj lleva un círculo de ese color para que no se cruce con el pin): marfil sobre claro, azul oscuro sobre oscuro.
 */
export function IconoPendientes({ size = 20, color = '#6E5018', grosor = 1.8, fondo = '#FFFDF8' }: { size?: number; color?: string; grosor?: number; fondo?: string }) {
  return (
    <svg data-icono-pendientes="1" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M11 20.5s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z" />
      <circle cx="11" cy="10.5" r="2.2" />
      <circle cx="17.2" cy="17.2" r="4.6" fill={fondo} />
      <path d="M17.2 14.9v2.5l1.6 1" />
    </svg>
  )
}

/** El cuadrado de la derecha de la tarjeta del sitio (I3), en lugar de la fecha: azul oscuro con el icono en dorado. Mismo tamaño que `CuadradoFecha`. */
export function CuadradoPendientes() {
  return (
    <span data-cuadrado-pendientes="1" aria-hidden="true" className="flex h-[56px] w-[52px] flex-none items-center justify-center rounded-[14px]" style={{ background: '#1C2230' }}>
      <IconoPendientes size={28} color="#F3D88F" grosor={1.7} fondo="#1C2230" />
    </span>
  )
}
