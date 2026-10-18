/** Un número «al azar» que siempre sale igual (Design usa el mismo para las chispas): así las capturas y la prueba no cambian de una vez a otra. */
const azar = (k: number): number => {
  const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export interface Chispa {
  dx: string
  dy: string
  color: string
  tam: string
}

/** Las chispas de subir de nivel (14, alrededor de la estrella nueva). */
export const chispasDeNivel: Chispa[] = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2
  const r = 60 + azar(i) * 40
  return { dx: `${(Math.cos(a) * r).toFixed(0)}px`, dy: `${(Math.sin(a) * r - 20).toFixed(0)}px`, color: i % 2 ? '#FFF1B8' : '#FFFFFF', tam: '6px' }
})

/** Las chispas del cambio de rango (20, más grandes y más lejos). */
export const chispasDeRango: Chispa[] = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2 + azar(i + 5) * 0.2
  const r = 130 + azar(i) * 110
  return { dx: `${(Math.cos(a) * r).toFixed(0)}px`, dy: `${(Math.sin(a) * r).toFixed(0)}px`, color: i % 3 ? '#FFF1B8' : '#FFFFFF', tam: `${4 + Math.round(azar(i + 9) * 4)}px` }
})
