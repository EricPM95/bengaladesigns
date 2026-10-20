/**
 * El logo de JUTRIP (Tanda 10, logo P4 de Design: «Piezas/Logo JUTRIP»), dibujado con código y en UN solo sitio. Lo usan la pantalla de apertura (index.html, por el plugin de vite.config.ts),
 * la pantalla de entrar y los huecos del logo (React, `src/components/ui/LogoJutrip.tsx`) y la imagen del icono (scripts/destino/iconosJutrip.mjs).
 *
 * La estrella con su anillo y la ruta de puntos, en oro con relieve, y debajo JUTRIP en Bodoni Moda 500 con la R y la P más finas (400). Dos tonos: `claro` (sobre marfil o crema) y
 * `oscuro` (sobre tinta o azul noche). Devuelve texto HTML (un `<span>` con el SVG y la palabra): sin React, para poder ponerlo también en el HTML de antes de que cargue la app.
 */

const CLARO = { m0: '#C99A44', m1: '#8E6820', m2: '#6E5018', m3: '#5A4010', m4: '#8E6820', ed: '#5A4010', t0: '#C99A44', t1: '#8E6820', t2: '#5A4010' }
const OSCURO = { m0: '#FFF6DC', m1: '#F3D88F', m2: '#C99A44', m3: '#8E6820', m4: '#E9C77A', ed: '#6E5018', t0: '#FFF6DC', t1: '#E9C77A', t2: '#9A7228' }

/** Los colores del logo por tono (para quien dibuje solo la estrella). */
export const coloresDelLogo = (tono) => (tono === 'oscuro' ? OSCURO : CLARO)

/** Solo la estrella con su anillo y su ruta de puntos (el emblema, sin la palabra). `ancho` en px; `id` distinto en cada dibujo de la misma página. */
export function estrellaSvg({ ancho = 120, tono = 'claro', id = 'jt' } = {}) {
  const c = coloresDelLogo(tono)
  const alto = Math.round((ancho * 200) / 230)
  return (
    `<svg width="${ancho}" height="${alto}" viewBox="0 0 230 200" fill="none" style="overflow:visible;flex:none" aria-hidden="true">` +
    `<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.m0}"/><stop offset=".3" stop-color="${c.m1}"/><stop offset=".55" stop-color="${c.m2}"/><stop offset=".8" stop-color="${c.m3}"/><stop offset="1" stop-color="${c.m4}"/></linearGradient>` +
    `<radialGradient id="${id}c" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="${c.m1}"/><stop offset="1" stop-color="${c.m3}"/></radialGradient></defs>` +
    `<circle cx="115" cy="104" r="78" stroke="url(#${id}m)" stroke-width="3" opacity=".6"/>` +
    `<circle cx="115" cy="104" r="70" stroke="${c.m2}" stroke-width="1" stroke-dasharray="1 6" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M115 14L129 82L196 104L129 126L115 194L101 126L34 104L101 82Z" fill="url(#${id}m)" stroke="${c.ed}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M115 14L129 82L115 104L101 82Z" fill="#FFFFFF" opacity=".34"/>` +
    `<path d="M196 104L129 126L115 104L129 82Z" fill="#000000" opacity=".1"/>` +
    `<path d="M115 194L101 126L115 104L129 126Z" fill="#000000" opacity=".22"/>` +
    `<path d="M34 104L101 82L115 104L101 126Z" fill="#FFFFFF" opacity=".12"/>` +
    `<circle cx="115" cy="104" r="15" fill="url(#${id}c)" stroke="${c.ed}" stroke-width="1.6"/>` +
    `<path d="M110 97a9 9 0 0 1 8-3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".9"/>` +
    `<path d="M30 168Q82 124 148 140T214 80" stroke="url(#${id}m)" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="1 9"/>` +
    `<circle cx="30" cy="168" r="6" fill="url(#${id}c)" stroke="${c.ed}" stroke-width="1.4"/>` +
    `<circle cx="214" cy="80" r="5" stroke="${c.m1}" stroke-width="2"/>` +
    `</svg>`
  )
}

/** La palabra JUTRIP en Bodoni Moda 500, con la R y la P en 400, en degradado de oro. `tam` es el cuerpo de la letra en px. */
export function palabraJutripHtml({ tam = 50, tono = 'claro' } = {}) {
  const c = coloresDelLogo(tono)
  const letras = 'JUTRIP'
    .split('')
    .map((l) => `<span style="font-weight:${l === 'R' || l === 'P' ? 400 : 500};font-variation-settings:'opsz' 96">${l}</span>`)
    .join('')
  return (
    `<span data-palabra-jutrip style="font-family:'Bodoni Moda',serif;font-size:${tam}px;line-height:1.2;letter-spacing:.1em;padding-left:.1em;color:transparent;` +
    `background:linear-gradient(180deg,${c.t0},${c.t1} 50%,${c.t2});-webkit-background-clip:text;background-clip:text;white-space:nowrap">${letras}</span>`
  )
}

/** El logo entero: la estrella y, debajo, la palabra. `tam` es el ancho de la estrella en px (como `size` en Design) y `fuente`, el cuerpo de la palabra (por defecto, el 42 % de `tam`). */
export function logoJutripHtml({ tam = 120, tono = 'claro', id = 'jt', palabra = true, fuente } = {}) {
  const hueco = Math.round(tam * 0.06)
  return (
    `<span data-logo-jutrip style="display:inline-flex;flex-direction:column;align-items:center;gap:${hueco}px">` +
    estrellaSvg({ ancho: tam, tono, id }) +
    (palabra ? palabraJutripHtml({ tam: fuente ?? Math.round(tam * 0.42), tono }) : '') +
    `</span>`
  )
}

/** El logo pequeño de una línea (la estrella y JUTRIP al lado), como arriba en la primera pantalla de Design. Las letras T, R y P, en el trazo fino. */
export function logoPequenoHtml({ tono = 'claro', id = 'jp', tam = 21 } = {}) {
  const c = coloresDelLogo(tono)
  const letras = 'JUTRIP'
    .split('')
    .map((l) => `<span style="font-weight:${l === 'T' || l === 'R' || l === 'P' ? 400 : 500}">${l}</span>`)
    .join('')
  return (
    `<span data-logo-pequeno style="display:inline-flex;align-items:center;gap:9px">` +
    `<svg width="${Math.round(tam * 1.24)}" height="${Math.round(tam * 1.05)}" viewBox="0 0 230 190" fill="none" style="overflow:visible;flex:none" aria-hidden="true">` +
    `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6DC"/><stop offset=".3" stop-color="#F3D88F"/><stop offset=".55" stop-color="#C99A44"/><stop offset=".8" stop-color="#8E6820"/><stop offset="1" stop-color="#E9C77A"/></linearGradient></defs>` +
    `<path d="M115 14L129 82L196 104L129 126L115 194L101 126L34 104L101 82Z" fill="url(#${id}g)" stroke="#6E5018" stroke-width="5" stroke-linejoin="round"/>` +
    `<circle cx="115" cy="104" r="15" fill="#FFF6DC" stroke="#6E5018" stroke-width="4"/></svg>` +
    `<span style="font-family:'Bodoni Moda',serif;font-size:${tam}px;line-height:1;letter-spacing:.14em;color:${tono === 'oscuro' ? '#E9C77A' : '#8E6820'}">${letras}</span></span>`
  )
}
