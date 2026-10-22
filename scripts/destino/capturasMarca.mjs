// Tanda 10E: las pantallas de «Marca JUTRIP» de Design (02 · Pantallas, de la 01 a la 10) en imagen, y la página docs/dias/MARCA_COMPARA.html con cada captura de la app al lado de su pantalla de Marca JUTRIP.
//   Hace falta el servidor de Design (`diseno` en .claude/launch.json: http://localhost:4180) y haber hecho antes las capturas de la app:
//   node scripts/destino/capturasJutrip.mjs tanda10e
//   node scripts/destino/capturasMarca.mjs            (con --solo-pagina, solo rehace la página con lo que ya hay)
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const MARCA = path.join(SALIDA, 'marca')
const DISENO = process.env.DISENO_URL ?? 'http://localhost:4180'

// Las diez pantallas de Marca JUTRIP, en el orden de la página, con la captura de la app que se compara con cada una.
const PANTALLAS = [
  { n: '01', nombre: 'Apertura', apps: ['10e_01a_apertura_logo_entrando', '10e_01b_apertura_frase_a_medias', '10e_01c_apertura_final'], nota: 'La de Design se repite en bucle y su frase es «TU APP DE VIAJES»; la nuestra sale una sola vez, dura 3 s y dice «De viajeros, para viajeros» (más larga, escrita más deprisa).' },
  { n: '02', nombre: 'Entrar', apps: ['10e_02_entrar'], nota: 'Fondo blanco (decisión de Eric, no cambia); el logo nuevo arriba.' },
  { n: '03', nombre: 'HOY', apps: ['10e_03_hoy'], nota: '' },
  { n: '04', nombre: 'Días, con un día abierto', apps: ['10e_04_dias_dia_abierto'], nota: '' },
  { n: '05', nombre: 'Explorar', apps: ['10e_05_explorar'], nota: '' },
  { n: '06', nombre: 'Reservas', apps: ['10e_06a_reservas_cerrada', '10e_06b_reservas_acordeon_abierto'], nota: '' },
  { n: '07', nombre: 'Logros: colección y medalla', apps: ['10e_07_logros'], nota: 'Los dibujos de las medallas, sellos y emblemas no se tocan (su oro es el del metal).' },
  { n: '08', nombre: 'El Pase, pantalla de compra', apps: ['10e_08_la_hoja_del_pase', '10e_08b_mis_pases'], nota: '' },
  { n: '09', nombre: 'HOY en modo claro, con la barra marfil', apps: ['10e_03_hoy'], nota: 'La barra de la app es la A (tinta); Design enseña también la marfil.' },
  { n: '10', nombre: 'Una parada por dentro', apps: ['10e_10_ficha_de_una_parada'], nota: '' },
  { n: '—', nombre: 'RUTA (Marca JUTRIP no tiene pantalla de RUTA todavía)', apps: ['10e_04a_ruta'], nota: '' },
  { n: '—', nombre: 'Crear el viaje, primer paso (Marca JUTRIP no tiene esta pantalla todavía)', apps: ['10e_12_crear_el_viaje_paso_1'], nota: '' },
]

if (!process.argv.includes('--solo-pagina')) {
  fs.mkdirSync(MARCA, { recursive: true })
  const app = await abrirApp(DISENO, { ruta: '/Marca%20JUTRIP.dc.html', ancho: 1500, alto: 1100 })
  await app.esp(4000)
  const cajas = await app.evaluar(`(() => {
    const todas = Array.from(document.querySelectorAll('#pantallas div')).filter((e) => /width:\\s*390px/.test(e.getAttribute('style') || '') && /border-radius:\\s*44px/.test(e.getAttribute('style') || ''))
    return todas.map((e, i) => { e.setAttribute('data-marca-caja', String(i)); return { i } })
  })()`)
  console.log('pantallas de Marca JUTRIP encontradas:', cajas.length)
  for (const [k, caja] of cajas.entries()) {
    const pant = PANTALLAS[k]
    if (!pant) continue
    // La apertura de Design es un bucle de 5,6 s: se para cerca del final de la entrada (antes de que se apague).
    await app.evaluar('(() => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = 4900 } return true })()')
    await app.evaluar(`document.querySelector('[data-marca-caja="${caja.i}"]').scrollIntoView({ block: 'start' })`)
    await app.esp(500)
    const r = await app.evaluar(`(() => { const r = document.querySelector('[data-marca-caja="${caja.i}"]').getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height } })()`)
    const res = await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })
    fs.writeFileSync(path.join(MARCA, `${pant.n}_${pant.nombre.split(/[ ,:]/)[0].toLowerCase()}.jpg`), Buffer.from(res.result.data, 'base64'))
  }
  app.cerrar()
}

const archivoMarca = (p) => fs.readdirSync(MARCA).find((f) => f.startsWith(p.n + '_'))
const filas = PANTALLAS.map((p) => {
  const marca = p.n === '—' ? null : archivoMarca(p)
  const apps = p.apps.filter((a) => fs.existsSync(path.join(SALIDA, a + '.jpg')))
  const izquierda = marca
    ? `<figure><img src="capturas_jutrip/marca/${marca}" alt="Marca JUTRIP ${p.n}"><figcaption>Design · Marca JUTRIP ${p.n}</figcaption></figure>`
    : '<figure class="vacia"><div>Marca JUTRIP todavía no tiene esta pantalla</div><figcaption>Design</figcaption></figure>'
  const derecha = apps.map((a) => `<figure><img src="capturas_jutrip/${a}.jpg" alt="${a}"><figcaption>La app · ${a.replace(/^10e_/, '')}</figcaption></figure>`).join('')
  return `<section><h2>${p.n} · ${p.nombre}</h2>${p.nota ? `<p class="nota">${p.nota}</p>` : ''}<div class="fila">${izquierda}${derecha}</div></section>`
})
const pagina = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marca JUTRIP · Design y la app, lado a lado</title>
<style>
body{margin:0;background:#E7DCC6;font-family:system-ui,sans-serif;color:#1C2230;padding:28px 24px 80px}
h1{font:400 38px/1.1 Georgia,serif;margin:0 0 6px}
.sub{margin:0 0 28px;color:rgba(28,34,48,.65);max-width:760px;line-height:1.45}
section{margin:0 0 44px}
h2{font:600 15px/1.2 ui-monospace,monospace;letter-spacing:.04em;margin:0 0 6px;color:#6F4E37}
.nota{margin:0 0 12px;font-size:13.5px;color:rgba(28,34,48,.7);max-width:760px}
.fila{display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0}
img{display:block;width:300px;height:auto;border-radius:22px;box-shadow:0 18px 40px -18px rgba(28,34,48,.55)}
figcaption{margin:8px 2px 0;font:500 11.5px ui-monospace,monospace;color:rgba(28,34,48,.7)}
.vacia div{width:300px;height:200px;border-radius:22px;border:1.5px dashed rgba(111,78,55,.5);display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;box-sizing:border-box;color:#6F4E37;font-size:13px}
</style></head><body>
<h1>Marca JUTRIP, al lado de la app</h1>
<p class="sub">A la izquierda, la pantalla de «Marca JUTRIP» de Design; a la derecha, la misma pantalla en la app (viaje de pruebas de Roma, 390 × 844). Hecha por scripts/destino/capturasMarca.mjs.</p>
${filas.join('\n')}
</body></html>
`
fs.writeFileSync(path.resolve('docs/dias/MARCA_COMPARA.html'), pagina)
console.log('docs/dias/MARCA_COMPARA.html escrita')
