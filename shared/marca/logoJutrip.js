/**
 * El logo de JUTRIP, dibujado con código y en UN solo sitio. Tanda 10E: la palabra JUTRIP en Italiana con su degradado de oro y la estrella sobre la I («Piezas/Logo JUTRIP» de Design); la estrella con su
 * anillo y su ruta de puntos (el logo P4) queda solo para el icono de la app (scripts/destino/iconosJutrip.mjs) y el logo pequeño de una línea de la primera pantalla y del formulario (que Design no ha cambiado).
 * Lo usan la pantalla de apertura (index.html, por el plugin de vite.config.ts), la pantalla de entrar y los huecos del logo (React, `src/components/ui/LogoJutrip.tsx`).
 * Devuelve texto HTML: sin React, para poder ponerlo también en el HTML de antes de que cargue la app.
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

/**
 * EL LOGO NUEVO (Tanda 10E, «Piezas/Logo JUTRIP» de Design): la palabra JUTRIP en Italiana, con el degradado de oro, las letras que entran una a una (de derecha a izquierda se abren, de izquierda a derecha
 * entran) y la estrella que salta sobre la I. Sus oros son los del metal (como los de los emblemas): no se pasan al oro de la interfaz.
 *   · `tam` es el cuerpo de la letra en px (el `fs` de Design: 46 en Entrar, 54 en la apertura).
 *   · `tono`: «claro» (sobre marfil o crema) u «oscuro» (sobre tinta).
 *   · `anim`: segundos que dura la entrada de las letras y de la estrella (0, sin movimiento). Con movimiento, el dibujo lleva sus @keyframes (jtL0 a jtL5 y jtStar) y se queda en el estado final.
 */
const GRAD = { claro: 'linear-gradient(180deg,#C99A44,#8E6820 55%,#5A4010)', oscuro: 'linear-gradient(180deg,#FFF6DC,#E9C77A 48%,#9A7228)' }
const ESTRELLA = (id) =>
  `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6DC"/><stop offset=".3" stop-color="#F3D88F"/><stop offset=".55" stop-color="#C99A44"/><stop offset=".8" stop-color="#8E6820"/><stop offset="1" stop-color="#E9C77A"/></linearGradient></defs>` +
  `<path d="M60 4L71 49L116 60L71 71L60 116L49 71L4 60L49 49Z" fill="url(#${id}g)" stroke="#6E5018" stroke-width="3"/>`

/** Los @keyframes de la entrada del logo: cada letra se abre de izquierda a derecha (la J primero) y la estrella salta sobre la I al final. No se apagan al terminar. */
export function keyframesDelLogo() {
  const oculto = 'opacity:0;clip-path:inset(-30% 110% -10% -10%);transform:translateX(-14px)'
  const visible = 'opacity:1;clip-path:inset(-30% -10% -10% -10%);transform:none'
  const orden = { J: 0, U: 1, T: 2, R: 3, I: 4, P: 5 }
  let css = ''
  for (const l of 'JUTRIP') {
    const n = orden[l]
    css += `@keyframes jtL${n}{0%,${6 + 6 * n}%{${oculto}}${20 + 6 * n}%,100%{${visible}}}`
  }
  css += '@keyframes jtStar{0%,50%{opacity:0;transform:translateX(-50%) scale(0) rotate(-120deg)}60%{opacity:1;transform:translateX(-50%) scale(1.6) rotate(0)}68%{transform:translateX(-50%) scale(1) rotate(0)}100%{opacity:1;transform:translateX(-50%) scale(1)}}'
  return css
}

/** La palabra JUTRIP con su estrella sobre la I. `id` distinto en cada dibujo de la misma página. */
export function palabraJutripHtml({ tam = 50, tono = 'claro', anim = 0, id = 'jt' } = {}) {
  const T = Number(anim) || 0
  const orden = { J: 0, U: 1, T: 2, R: 3, I: 4, P: 5 }
  const letras = 'JUTRIP'
    .split('')
    .map((c) => {
      const estrella =
        c === 'I'
          ? `<svg viewBox="0 0 120 120" fill="none" aria-hidden="true" style="position:absolute;left:calc(50% - .14em);top:-.2em;width:.26em;height:.26em;transform:translateX(-50%);overflow:visible;animation:${T ? `jtStar ${T}s ease-out 1 both` : 'none'}">${ESTRELLA(id)}</svg>`
          : ''
      return `<span style="display:inline-block;position:relative;color:transparent;background:${GRAD[tono === 'oscuro' ? 'oscuro' : 'claro']};-webkit-background-clip:text;background-clip:text;animation:${T ? `jtL${orden[c]} ${T}s cubic-bezier(.25,.6,.3,1) 1 both` : 'none'}">${c}${estrella}</span>`
    })
    .join('')
  const sombra = tono === 'oscuro' ? 'none' : 'drop-shadow(0 2px 3px rgba(110,80,24,.25))'
  return (
    (T ? `<style>${keyframesDelLogo()}</style>` : '') +
    `<span data-palabra-jutrip data-logo-jutrip style="display:inline-block;font-family:'Italiana',serif;font-size:${tam}px;letter-spacing:.28em;padding-left:.28em;line-height:1.25;white-space:nowrap;filter:${sombra}">${letras}</span>`
  )
}

/** Solo la estrella del logo (el `mark="star"` de Design). `tam` en px. */
export function estrellaJutripHtml({ tam = 22, id = 'jts' } = {}) {
  return `<svg viewBox="0 0 120 120" fill="none" width="${tam}" height="${tam}" aria-hidden="true" style="display:block;overflow:visible">${ESTRELLA(id)}</svg>`
}

/** El logo entero de la app (la palabra con su estrella). Se queda con este nombre porque lo piden el plugin de vite.config.ts y los huecos del logo. */
export function logoJutripHtml(opciones = {}) {
  return palabraJutripHtml({ tam: opciones.fuente ?? opciones.tam ?? 50, tono: opciones.tono, anim: opciones.anim, id: opciones.id })
}
