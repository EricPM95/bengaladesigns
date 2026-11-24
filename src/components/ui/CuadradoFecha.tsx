/**
 * EL CUADRADO DE LA FECHA — UNA SOLA PIEZA PARA TODA LA APP (Eric, noche del 24-25 nov; regla en CLAUDE.md). Donde salga una fecha en un cuadrado de calendario es ESTE: fondo azul oscuro, el día de la semana pequeño en
 * mayúsculas y el número grande, los dos en dorado (el «JUE 26» del dibujo A2 de `NUEVO_DISEÑO`). Nunca se escribe otro. Los botones para ELEGIR un día en las hojas («Mar 24», «Jue 26») no son cuadrados de fecha: no lo usan.
 *   · `semana`: «JUE» (se pasa a mayúsculas); `numero`: «26».
 *   · `marcado`: el día abierto en la lista de DÍAS: el mismo cuadrado con un borde dorado.
 *   · `tam`: 'normal' (44 × 52, el de siempre) o 'pequeno' (36 × 42, para filas apretadas).
 */
export function CuadradoFecha({ semana, numero, marcado = false, tam = 'normal', datos }: { semana: string; numero: string | number; marcado?: boolean; tam?: 'normal' | 'pequeno'; datos?: Record<string, string> }) {
  const pequeno = tam === 'pequeno'
  return (
    <span
      data-cuadrado-fecha={marcado ? 'marcado' : '1'}
      {...datos}
      className="flex flex-none flex-col items-center justify-center rounded-[12px]"
      style={{ width: pequeno ? 38 : 48, height: pequeno ? 44 : 52, background: '#1C2230', boxShadow: marcado ? '0 0 0 2px #B58A2E' : undefined }}
    >
      <span style={{ font: `700 ${pequeno ? 8 : 9}px 'Geist Mono',monospace`, letterSpacing: '.12em', color: '#F3D88F', textTransform: 'uppercase', lineHeight: 1 }}>{semana}</span>
      <span style={{ font: `400 ${pequeno ? 20 : 24}px/1 'Instrument Serif',serif`, color: '#F3D88F', marginTop: 2 }}>{numero}</span>
    </span>
  )
}
