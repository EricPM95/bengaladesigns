/**
 * V53 §7: EL ICONO DEL BOTÓN FLOTANTE «REORGANIZAR» (las dos flechas), una sola pieza. Lo usan el botón flotante (`ReorganizarHost`) y, antes del título, toda hoja que ofrezca Reorganizar
 * («¿Reorganizamos tu día?», «¿Adaptamos tu primer y tu último día a tus vuelos?»), para que, al pulsar [Ahora no], se reconozca el botón que se queda flotando.
 * `circulo`: lado del círculo azul oscuro con borde dorado (el mismo del botón flotante); sin él, solo las flechas.
 */
export function IconoReorganizar({ circulo, tam = 21 }: { circulo?: number; tam?: number }) {
  const flechas = (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h10l3-3 3 3M20 16H10l-3 3-3-3M17 5v6M7 13v6" />
    </svg>
  )
  if (!circulo) return flechas
  return (
    <span data-icono-reorganizar="1" aria-hidden="true" style={{ width: circulo, height: circulo, flex: 'none', borderRadius: '50%', background: '#1C2230', border: '1.5px solid #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {flechas}
    </span>
  )
}
