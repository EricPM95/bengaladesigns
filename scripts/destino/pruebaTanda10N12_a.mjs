// Tanda 10N12 (agente A) · lo bloqueado abre el aviso pequeño (no la lista) y siempre «Pase Roma».
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N12_a.mjs
// Capturas: docs/dias/capturas_jutrip/10n12_aviso_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, foto as foto5, leer, modulo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const foto = (n) => foto5(n).replace('10n5_', '10n12_aviso_')
const store = modulo('/src/store/useRouteStore.ts')
const TEXTO_ALOJ = 'Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.'
const TEXTO_VUELO = 'Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.'

/* ───────── 1. El código: ningún «Pase de Roma» y los sitios cambiados ───────── */
console.log('1. El código')
{
  const recorre = (dir, fuera = []) => {
    const r = []
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) r.push(...recorre(p, fuera))
      else if (/\.(ts|tsx|js|mjs|json)$/.test(e.name)) r.push(p)
    }
    return r
  }
  const malos = []
  for (const d of ['src', 'data', 'shared', 'server']) {
    for (const f of recorre(d)) {
      const t = leer(f)
      if (/Pase de (Roma|París|Florencia|Londres|\$\{|\{)/.test(t)) malos.push(f)
    }
  }
  debe(malos.length === 0, '5', `ningún «Pase de Roma» / «Pase de \${destino}» en src, data, shared ni server (${malos.join(', ')})`)
  const t = leer('src/lib/avisoPaseTextos.ts')
  debe(t.includes('adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.') && t.includes('adaptamos tu primer y tu último día a tus vuelos.'), '1', 'los textos del aviso: alojamiento y vuelo')
  const sinCom = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  for (const f of ['src/components/route/alojamiento/HojaTuAlojamiento.tsx', 'src/components/route/dayDetail/AccommodationBlock.tsx', 'src/components/logros/momentos/HojaLogros.tsx']) {
    const c = sinCom(leer(f))
    debe(/abrirAvisoPase/.test(c) && !/abrirPase\b/.test(c), '1', `${f}: abre el aviso pequeño y ya no llama a abrirPase`)
  }
  const cand = sinCom(leer('src/components/pase/Candado.tsx'))
  const linea = cand.slice(cand.indexOf('export function LineaDelPase'))
  debe(/abrirAvisoPase/.test(linea) && !/abrirPase\b/.test(linea), '1', 'LineaDelPase abre el aviso pequeño (RESERVAS, hoja del vuelo, hoja del alojamiento)')
  debe(/clave="vuelo"/.test(leer('src/components/route/reservas/HojaDelVuelo.tsx')) && /clave="alojamiento"/.test(leer('src/components/route/reservas/AlojamientoReservas.tsx')), '1', 'la línea de la hoja del vuelo y de la tarjeta de RESERVAS llevan su clave')
}

/* ───────── 2. En la app, sin pase ───────── */
console.log('2. Sin pase')
{
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  const aviso = (clave) => a.evaluar(`(() => { const e = document.querySelector('[data-aviso-pase${clave ? `="${clave}"` : ''}]'); return e ? e.innerText.replace(/\\s+/g, ' ') : null })()`)
  const lista = () => a.evaluar("Boolean(document.querySelector('[data-lista-del-pase]'))")
  const verYLista = async (regla, que) => {
    await a.evaluar("document.querySelector('[data-aviso-pase-ver]')?.click(); true")
    let ok = false
    for (let i = 0; i < 10 && !ok; i++) {
      await esp(500)
      ok = await lista()
    }
    debe(ok, regla, `${que}: [Ver el Pase Roma] abre la lista`)
    await a.evaluar("document.querySelector('[data-pelicula-cerrar]')?.click(); true")
    await esp(700)
  }
  try {
    // RUTA: la pastilla abre la lista directamente.
    await a.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('route'); return true })`)
    await esp(2500)
    const clicP = await a.evaluar("(() => { const p = document.querySelector('[data-pastilla-pase=\"sin\"]'); if (!p) return false; p.click(); return true })()")
    await esp(1500)
    debe(clicP && (await lista()) && !(await aviso()), 'pastilla', 'la pastilla «Pase Roma» de RUTA abre la lista directamente (sin aviso)')
    await a.evaluar("document.querySelector('[data-pelicula-cerrar]')?.click(); true")
    await esp(700)

    // RESERVAS: la tarjeta del alojamiento → hoja → bloque gris.
    await a.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('bookings'); return true })`)
    await esp(2500)
    await a.evaluar("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
    await esp(400)
    await a.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"]'); if (b && !b.querySelector('[data-anadir-alojamiento]')) b.firstElementChild.click(); return true })()")
    await esp(600)
    // La línea gris de la tarjeta (si ya sale) o la hoja.
    const tieneLinea = await a.evaluar("Boolean(document.querySelector('[data-linea-pase=\"alojamiento-tarjeta\"]'))")
    if (tieneLinea) {
      await a.evaluar("document.querySelector('[data-linea-pase=\"alojamiento-tarjeta\"]').click(); true")
      await esp(900)
      const t = await aviso('alojamiento')
      debe(t && t.includes(TEXTO_ALOJ) && /Desbloquéalo con el Pase Roma/.test(t), 'tarjeta', `RESERVAS, línea del pase de la tarjeta: aviso con su texto (${t})`)
      await verYLista('tarjeta', 'RESERVAS (tarjeta)')
    } else debe(false, 'tarjeta', 'RESERVAS: la línea del pase del alojamiento no sale')
    await a.evaluar("document.querySelector('[data-anadir-alojamiento]')?.click(); true")
    await esp(1400)
    const bloque = await a.evaluar("Boolean(document.querySelector('[data-alojamiento-bloque-pase]'))")
    debe(bloque, 'hoja', 'la hoja «Tu alojamiento» sin pase lleva el bloque gris')
    await a.evaluar("document.querySelector('[data-alojamiento-bloque-pase]')?.click(); true")
    await esp(900)
    const t1 = await aviso('alojamiento')
    debe(t1 && t1.includes(TEXTO_ALOJ) && /Desbloquéalo con el Pase Roma/.test(t1) && /Ver el Pase Roma/.test(t1) && !(await lista()), 'hoja', `el bloque gris abre el aviso pequeño con su texto, no la lista (${t1})`)
    await a.captura(foto('01_hoja_alojamiento'))
    await verYLista('hoja', 'hoja Tu alojamiento (bloque gris)')
    // Cierra la hoja.
    for (let i = 0; i < 4 && (await a.evaluar("Boolean(document.querySelector('[role=dialog]'))")); i++) {
      await a.evaluar("(() => { const d = document.querySelector('[role=dialog]'); (d.querySelector('button[aria-label=Cerrar]') ?? d.querySelector('button'))?.click(); return true })()")
      await esp(500)
    }

    // DÍAS: [Ir] con candado del día 1.
    await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); const id = e.route.days[0].id; e.setAccommodationHotel(id, { name: 'Hotel Aurora', precio: null }); e.setActiveDayId(e.route.days[0].id); e.setMode('days'); return true })`)
    await esp(3000)
    const ir = await a.evaluar("(() => { const b = document.querySelector('[data-alojamiento-dia=\"ir-candado\"]'); if (!b) return false; b.click(); return true })()")
    await esp(900)
    const t2 = await aviso('alojamiento')
    debe(ir && t2 && t2.includes(TEXTO_ALOJ) && !(await lista()), 'ir', `DÍAS: el [Ir] con candado abre el aviso pequeño con su texto, no la lista (${t2})`)
    await a.captura(foto('02_ir_dias'))
    await verYLista('ir', 'DÍAS [Ir]')
  } finally {
    a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
