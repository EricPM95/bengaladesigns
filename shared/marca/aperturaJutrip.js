/**
 * LA PANTALLA DE APERTURA (Tanda 10E, «Marca JUTRIP 02 · 01 · Apertura» de Design), en HTML y CSS sin React para que se vea antes de que cargue nada. La monta index.html por el plugin de
 * vite.config.ts. Sale UNA sola vez (en Design se repite para enseñarla) y dura 3 segundos (`DURACION`): el fondo de marfil con su luz, el brillo detrás, el logo que entra de borroso a
 * nítido, el destello que lo cruza, las chispas, la línea de debajo que se escribe letra a letra y la ruta de puntos de abajo con su pin.
 * La línea es el lema de la marca (de data/marca.json), más larga que la de Design: se escribe más deprisa para que quepa. Con las animaciones reducidas queda quieta, con el logo y la frase.
 * Todo se queda en su estado final al acabar (nada se apaga): luego main.tsx funde la pantalla entera.
 */
import { keyframesDelLogo, palabraJutripHtml } from './logoJutrip.js'

export const DURACION = 3

const CURVA = 'cubic-bezier(.3,.7,.2,1)'
const anim = (nombre, extra = '') => `animation:${nombre} ${DURACION}s ${CURVA} 1 both${extra}`

/** Las letras del lema, una a una: empiezan al 22 % y acaban al 88 % de la duración, con un fundido de 3,2 % cada una. */
function letrasDelLema(lema) {
  const letras = Array.from(lema)
  const paso = 66 / letras.length
  let css = ''
  const spans = letras
    .map((c, i) => {
      const a = (22 + paso * i).toFixed(2)
      const b = (22 + paso * i + 3.2).toFixed(2)
      css += `@keyframes apL${i}{0%,${a}%{opacity:0;transform:translateX(-10px) scale(.8)}${b}%,100%{opacity:1;transform:none}}`
      return `<span style="display:inline-block;white-space:pre;animation:apL${i} ${DURACION}s ease-out 1 both">${c === '<' ? '&lt;' : c === '&' ? '&amp;' : c}</span>`
    })
    .join('')
  return { css, spans }
}

const CHISPA = (color, lado) => `<svg viewBox="0 0 24 24" width="${lado}" height="${lado}"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" fill="${color}"/></svg>`

/** El interior de la pantalla de apertura (lo de dentro del `#apertura` de index.html). */
export function aperturaInteriorHtml({ lema = '' } = {}) {
  const { css, spans } = letrasDelLema(lema)
  const keyframes =
    keyframesDelLogo() +
    '@keyframes apGlow{0%{opacity:0;transform:scale(.7)}22%,100%{opacity:1;transform:scale(1)}}' +
    '@keyframes apLogo{0%,2%{opacity:0;transform:scale(.84) translateY(14px);filter:blur(12px)}28%,100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}' +
    '@keyframes apShine{0%,24%{transform:translateX(-130%) skewX(-18deg);opacity:0}28%{opacity:1}40%,100%{transform:translateX(340%) skewX(-18deg);opacity:0}}' +
    '@keyframes apRoute{0%,8%{clip-path:inset(0 100% 0 0)}36%,100%{clip-path:inset(0 0 0 0)}}' +
    '@keyframes apPin{0%,34%{opacity:0;transform:scale(0)}40%{opacity:1;transform:scale(1.6)}46%,100%{opacity:1;transform:scale(1)}}' +
    '@keyframes apSpark{0%,26%{opacity:0;transform:scale(0)}32%{opacity:1;transform:scale(1)}40%,100%{opacity:0;transform:scale(.4)}}' +
    css +
    // Con las animaciones reducidas, la pantalla queda quieta con todo puesto (las chispas y el destello solo existen en movimiento).
    '@media (prefers-reduced-motion: reduce){#apertura *{animation:none!important}}'
  return (
    `<style>${keyframes}</style>` +
    `<div style="position:absolute;left:-40px;right:-40px;top:16vh;height:50vh;background:radial-gradient(circle,rgba(243,216,143,.55),transparent 62%);${anim('apGlow')}"></div>` +
    `<div style="position:absolute;left:0;right:0;top:29vh;display:flex;flex-direction:column;align-items:center;gap:20px">` +
    `<div style="position:relative;${anim('apLogo')}">` +
    palabraJutripHtml({ tam: 54, tono: 'claro', anim: DURACION, id: 'ap' }) +
    `<span style="position:absolute;inset:0;overflow:hidden;pointer-events:none"><span style="position:absolute;top:-10%;bottom:-10%;left:0;width:26%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:soft-light;opacity:0;${anim('apShine')}"></span></span>` +
    `<span style="position:absolute;left:36px;top:34px;width:12px;height:12px;opacity:0;${anim('apSpark')}">${CHISPA('#FFF6DC', 12)}</span>` +
    `<span style="position:absolute;right:30px;top:80px;width:16px;height:16px;opacity:0;${anim('apSpark', ';animation-delay:.1s')}">${CHISPA('#E9C77A', 16)}</span>` +
    `</div>` +
    `<span data-lema style="font:500 11px 'Geist Mono',monospace;letter-spacing:.34em;padding-left:.34em;color:#6F4E37;text-transform:uppercase;text-align:center;display:flex;justify-content:center;flex-wrap:wrap;max-width:92vw">${spans}</span>` +
    `</div>` +
    `<svg width="390" height="120" viewBox="0 0 390 120" style="position:absolute;left:50%;bottom:60px;transform:translateX(-50%);max-width:100vw;overflow:visible" fill="none">` +
    `<g style="${anim('apRoute')}"><path d="M20 90Q120 20 210 70T370 30" stroke="#D8B98E" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 9"/><circle cx="20" cy="90" r="5" fill="#D8B98E"/></g>` +
    `<circle cx="370" cy="30" r="5" stroke="#D8B98E" stroke-width="2" style="transform-box:fill-box;transform-origin:center;${anim('apPin')}"/></svg>`
  )
}
