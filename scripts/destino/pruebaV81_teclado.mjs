// V81 §3: las hojas con un campo de texto y el teclado del iPhone (se SIMULA el teclado: ver _tecladoV81.mjs). Un solo Chrome; por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV81_teclado.mjs
import { abrir, TECLADO } from './_tecladoV81.mjs'

let fallos = 0
const ok = (cond, texto) => {
  console.log(`${cond ? 'OK   ' : 'FALLO'} ${texto}`)
  if (!cond) fallos++
}
const VISTA = 844 - TECLADO
const t = await abrir('despues')
const { a } = t
const ev = (js) => a.evaluar(js)
try {
  const cerrarHoja = async () => {
    await ev("(() => { const b = document.querySelector('[data-hoja-cerrar]'); if (b) b.click(); return true })()")
    await a.esp(700)
  }
  const dentro = (m, nombre, conTitulo = true) => {
    ok(m.panel.top >= 0 && m.panel.bottom <= VISTA, `${nombre}: la hoja queda dentro del área visible (${m.panel.top}-${m.panel.bottom} de ${VISTA})`)
    if (conTitulo) ok(m.titulo && m.titulo.top >= m.panel.top && m.titulo.bottom <= VISTA, `${nombre}: el título se ve (${m.titulo?.top}-${m.titulo?.bottom})`)
    ok(m.campo && m.campo.top >= m.panel.top && m.campo.bottom <= VISTA, `${nombre}: el campo con el foco se ve (${m.campo?.top}-${m.campo?.bottom})`)
  }
  const caso = async (nombre, selector, letras, vacio) => {
    const sin = await t.medidas()
    ok(sin.panel.bottom === 844, `${nombre}: sin teclado, la hoja está abajo del todo (${sin.panel.bottom})`)
    ok((await ev("document.documentElement.hasAttribute('data-teclado')")) === false, `${nombre}: sin teclado no hay data-teclado`)
    await t.sacarTeclado(selector)
    const a1 = await t.medidas()
    dentro(a1, `${nombre} con teclado`)
    await t.teclear(letras)
    const a2 = await t.medidas()
    dentro(a2, `${nombre} con una letra`)
    ok(a2.panel.h === a1.panel.h, `${nombre}: la hoja no cambia de alto al escribir (${a1.panel.h} → ${a2.panel.h})`)
    if (vacio) {
      await ev(`(() => { const i = document.activeElement; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'zzzzq'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
      await a.esp(600)
      const a3 = await t.medidas()
      ok(a3.panel.h === a1.panel.h && a3.panel.bottom === a1.panel.bottom, `${nombre}: sin resultados el alto sigue igual (${a3.panel.h}) y sigue encima del teclado`)
      dentro(a3, `${nombre} sin resultados`)
    }
    await t.quitarTeclado()
    const d = await t.medidas()
    ok(d.panel.bottom === 844, `${nombre}: al cerrar el teclado vuelve abajo del todo (${d.panel.bottom})`)
    ok((await ev("[...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop().lastElementChild.style.minHeight")) === '', `${nombre}: al cerrar el teclado no queda alto fijado`)
  }

  await t.ajustes()
  ok(await t.clic('Moneda'), 'Ajustes › Moneda abre')
  await a.esp(1500)
  await caso('Moneda', '[data-hoja-opciones] input', 'c', true)
  // El título y el buscador se quedan arriba al deslizar la lista con el teclado abierto.
  await t.sacarTeclado('[data-hoja-opciones] input')
  await ev(`(() => { const i = document.activeElement; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'c'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await a.esp(500)
  await ev("(() => { const p = [...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop().lastElementChild; p.scrollTop = 400; return true })()")
  await a.esp(400)
  const sc = await t.medidas()
  ok(sc.scrollTop > 0 && sc.titulo.top >= sc.panel.top && sc.titulo.bottom <= VISTA && sc.campo.top >= sc.panel.top, `Moneda: con la lista deslizada, título y buscador siguen a la vista (scroll ${sc.scrollTop}, título ${sc.titulo.top})`)
  await t.quitarTeclado()
  // Regla V63: con un aviso con [Deshacer] abajo, la hoja empieza encima del aviso; con teclado manda el teclado; al cerrarlo vuelve al aviso.
  await ev("(() => { document.documentElement.setAttribute('data-aviso-abajo', '1'); document.documentElement.style.setProperty('--aviso-alto', '80px'); return true })()")
  await a.esp(300)
  ok((await t.medidas()).panel.bottom === 764, 'V63: con aviso abajo la hoja empieza 80 px encima')
  await t.sacarTeclado('[data-hoja-opciones] input')
  ok((await t.medidas()).panel.bottom <= VISTA, 'V63: con aviso y teclado, la hoja queda encima del teclado')
  await t.quitarTeclado()
  ok((await t.medidas()).panel.bottom === 764, 'V63: al cerrar el teclado, la hoja vuelve a quedar encima del aviso')
  await ev("(() => { document.documentElement.removeAttribute('data-aviso-abajo'); document.documentElement.style.removeProperty('--aviso-alto'); return true })()")
  await cerrarHoja()

  ok(await ev("(() => { const b = document.querySelector('[data-pais-vive]') ?? [...document.querySelectorAll('button')].find((x) => /País donde vives/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()"), 'Ajustes › País abre')
  await a.esp(1500)
  await caso('País', '[data-hoja-opciones] input', 'm', true)
  await cerrarHoja()

  await t.reserva()
  await caso('+ Añadir una reserva (ferry)', '[data-extra-campo="compania"]', 'Car', false)
} finally {
  a.cerrar()
}
console.log(fallos === 0 ? '\nTODO BIEN' : `\n${fallos} FALLOS`)
process.exit(fallos === 0 ? 0 : 1)
