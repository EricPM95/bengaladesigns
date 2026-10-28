// Tanda 10N8 (N3): cabecera de la ficha (8b-g), «Abierto 24 h», botones con borde sobre el mapa (8b-e), aviso de abajo sobre el menú (8b-h), botón de entrada del Castillo (8b-i),
// textos del aviso del pase (0a-10), EXPLORAR con el candado en la esquina (6) y «Tus recuerdos» (8b-f).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_ficha.mjs
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, modo, esp, cuando, leer, preparar, store } from './_10n6_k3_comun.mjs'

const { debe, fin } = preparar()
const SAL = path.resolve('docs/dias/capturas_jutrip')
const foto = (n) => path.join(SAL, `10n8_${n}.jpg`)
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/* 1. El código */
console.log('1. El código')
{
  const t = leer('src/lib/avisoPaseTextos.ts')
  for (const f of [
    'Con el {pase}, podrás escuchar todas las historias que quieras, sin límite.',
    'Con el {pase}, guarda fotos sin límite y haz crecer tu álbum de recuerdos.',
    'Con el {pase}, encuentra las fuentes de agua más cercanas, estés donde estés.',
    'Con el {pase}, encuentra los baños más cercanos, estés donde estés.',
    'Con el {pase}, descubre todo lo que tienes cerca, estés donde estés.',
    'Con el {pase}, tienes HOY disponible todos los días de tu viaje.',
    'Desbloquea todo lo que el {pase} añade a tu viaje.',
    'Ya tienes tu foto de este sitio.',
    'Ya has escuchado tu historia de prueba.',
    'Solo tienes HOY abierto el día de prueba.',
  ])
    debe(t.includes(f), '0a', `texto del aviso: ${f}`)
  debe(!/Tu ruta ya te dice/.test(t), '0a', 'fuera «Tu ruta ya te dice…»')
  const e = sinComentarios(leer('src/components/ui/Elegir.tsx'))
  debe(/ORO_PASE/.test(e) && !/linear-gradient\(135deg,#1C2230,#252F55/.test(e), '6', 'Elegir: el candado dorado en la esquina y fuera el azul oscuro')
  const x = sinComentarios(leer('src/components/route/ExplorePanel.tsx'))
  debe(/grayscale\(1\)/.test(x) && !/AZUL_PASE/.test(x), '6', 'Baños y Fuentes: tarjeta en gris con candado, sin azul')
  for (const f of ['perfil/EliminarViajeHost.tsx', 'route/freeDay/UndoToast.tsx', 'logros/visto/Hojas.tsx', 'propuesta/BotonesDeViaje.tsx'])
    debe(/AvisoSobreLaBarra/.test(leer('src/components/' + f)), '8b-h', `${f}: el aviso de abajo usa AvisoSobreLaBarra`)
  const sd = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  debe((sd.match(/border-\[1\.5px\] border-accent/g) ?? []).length >= 2, '8b-e', 'ficha: volver y fecha con el borde marrón')
}

/* 2. Con pase: fichas */
console.log('2. Fichas')
{
  const a = await conViaje({ version: 'pago', ancho: 390, alto: 844 })
  try {
    await modo(a, 'days', 0)
    const abrirFicha = async (nombre) => {
      await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)} || x.textContent.startsWith(${JSON.stringify(nombre + ',')})); tit?.scrollIntoView({ block: 'center' }); tit?.click(); return true })()`)
      return cuando(a, "Boolean(document.querySelector('[data-ficha-panel] [data-ficha-cabecera]'))", 60)
    }
    const dias = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days.map((d) => d.stops.filter((x) => !x.isBreak && !x.isFreeTour).map((x) => x.name)))`)
    console.log('paradas', dias.map((d, i) => i + ': ' + d.join(', ')).join(' // '))
    const MIDE = `(() => { const c = document.querySelector('[data-ficha-cabecera]'); const img = c.children[0].getBoundingClientRect(); const h1 = c.querySelector('h1'); const hr = h1.getBoundingClientRect(); const et = c.querySelector('[data-ficha-etiquetas]'); const er = et.getBoundingClientRect(); const p = [...c.querySelectorAll('[data-etiqueta-ficha]')].map((x) => ({ t: x.innerText.trim(), r: x.getBoundingClientRect().toJSON(), color: getComputedStyle(x).color })); return { fotoTop: img.top, fotoBottom: img.bottom, nombre: h1.innerText, nombreTop: hr.top, nombreLeft: hr.left, nombreH: hr.height, etTop: er.top, etBottom: er.bottom, modo: et.dataset.fichaEtiquetas, pildoras: p } })()`
    const fichas = {}
    const buscar = [
      ['Trevi', 'Fontana de Trevi'],
      ['Coliseo', 'Coliseo'],
      ['DosLineas', 'Museos Vaticanos y Capilla Sixtina'],
    ]
    for (const [clave, parte] of buscar) {
      const di = dias.findIndex((d) => d.includes(parte))
      const nombre = di >= 0 ? parte : null
      if (nombre) await modo(a, 'days', di)
      if (!nombre) {
        debe(false, '8b-g', `no hay ${clave} en la ruta de prueba`)
        continue
      }
      const abierta = await abrirFicha(nombre)
      debe(abierta, '8b-g', `se abre la ficha de ${nombre}`)
      if (!abierta) continue
      await esp(1500)
      const m = await a.evaluar(MIDE)
      fichas[clave] = m
      debe(Math.abs(m.nombreTop - m.fotoTop) <= 8, '8b-g', `${clave}: el nombre arriba, alineado con el borde de arriba de la foto (${m.nombreTop.toFixed(0)} / ${m.fotoTop.toFixed(0)})`)
      debe(m.etTop - (m.nombreTop + m.nombreH) <= 10, '8b-g', `${clave}: las etiquetas justo debajo del nombre, sin hueco (${(m.etTop - (m.nombreTop + m.nombreH)).toFixed(0)} px)`)
      debe(m.etBottom <= m.fotoBottom + 2 || m.modo === 'fila', '8b-g', `${clave}: nada sobresale por debajo de la foto (${m.etBottom.toFixed(0)} / ${m.fotoBottom.toFixed(0)})`)
      debe(m.modo === 'fila' || m.pildoras.every((q) => Math.abs(q.r.left - m.nombreLeft) < 3), '8b-g', `${clave}: en columna, alineadas a la izquierda con el nombre`)
      await a.captura(foto(`ficha_${clave}`))
      if (clave === 'Trevi') debe(m.pildoras.some((q) => q.t === 'Abierto 24 h' && /43, 127, 69/.test(q.color)), '8b-g', `Fontana di Trevi: «Abierto 24 h» en verde (${JSON.stringify(m.pildoras.map((q) => [q.t, q.color]))})`)
      if (clave === 'DosLineas') debe(m.modo === 'fila' || m.nombreH < 40, '8b-g', `nombre largo (${m.nombreH.toFixed(0)} px, modo ${m.modo})`)
      if (clave === 'Coliseo') debe(!m.pildoras.some((q) => q.t === 'Abierto 24 h'), '8b-g', 'Coliseo: sin «Abierto 24 h»')
      const borde = await a.evaluar(`(() => { const e = document.querySelector('[aria-label="Volver"]'); return e ? getComputedStyle(e).borderTopWidth + ' ' + getComputedStyle(e).borderTopColor : null })()`)
      debe(borde && /^1(\.5)?px rgb\(166, 124, 82\)/.test(borde), '8b-e', `${clave}: la flecha de volver con el borde marrón (${borde})`)
      await a.evaluar(`(() => { document.querySelector('[aria-label="Volver"]')?.click(); return true })()`)
      await esp(800)
    }
    fs.writeFileSync(path.join(process.env.TEMP, 'fichas_10n8.json'), JSON.stringify(fichas, null, 1))

    // El aviso de abajo: el mismo sitio que el menú.
    await a.evaluar(`(async () => { const n = performance.getEntriesByType('resource').map((r) => r.name).find((x) => x.includes('/src/store/useAddFlowStore')); const m = await import(n || '/src/store/useAddFlowStore.ts'); m.useAddFlowStore.setState({ toast: { message: 'Prueba añadido', previous: {} } }); return true })()`)
    await esp(800)
    const r = await a.evaluar(`(() => { const n = document.querySelector('nav[aria-label="Barra del viaje"]').getBoundingClientRect(); const t = document.querySelector('[data-aviso-sobre-barra]')?.getBoundingClientRect(); return t ? { nav: [n.left, n.top, n.width, n.height], aviso: [t.left, t.top, t.width, t.height] } : null })()`)
    debe(r && r.nav.every((v, i) => Math.abs(v - r.aviso[i]) <= 1), '8b-h', `el aviso con [Deshacer] ocupa exactamente el sitio del menú (${JSON.stringify(r)})`)
    await a.captura(foto('aviso_sobre_menu'))
  } finally {
    a.cerrar()
  }
}
fin('pruebaTanda10N8_ficha')
