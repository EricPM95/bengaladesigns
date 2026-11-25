// Tanda 10S9b (agente B), apartado 3: la hora de la hoja «Añadir» (entrada, Free Tour, excursión) con la misma rueda que el resto de la app.
// antes → ahora → decisión de Eric (10S10, 1-nov): RESERVAS entra con todos los bloques cerrados; la prueba abre «Entradas» tocando su cabecera.
//   1 · el código (sin navegador): la hoja usa CampoDeHora/HojaDeHora y no la rueda abierta; la hora no se pone sola; el día sigue en sus cuadrados.
//   2 · la hoja de la entrada del Coliseo en la app (390 px): día en cuadrados, hora en casilla con ejemplo en gris, [Guardar] sin activar hasta elegirla,
//       tocar fuera de la rueda vacía sin moverla la deja vacía, el ✓ guarda lo que se ve, tocar fuera con la hora elegida la guarda.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9b_B.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, leer as leerArchivo } from './_10n5_comun.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s9b_anadir_hora_${n}.jpg`)
const clic = (a, sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)

console.log('1. El código')
{
  const add = sinComentarios(leerArchivo('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/<CampoDeHora/.test(add) && /from '..\/..\/ui\/HojaDeHora'/.test(add), 'b1', 'la hoja «Añadir» usa la casilla CampoDeHora (la hoja de la hora de toda la app)')
  debe(!/<TimeListWheel/.test(add), 'b2', 'la rueda ya no va abierta dentro de la hoja «Añadir»')
  debe(!/set\(\{ time: nearest \}\)/.test(add) && !/set\(\{ time: first && pickupItems/.test(add), 'b3', 'la hora no se pone sola al abrir la hoja (ni la entrada ni la excursión)')
  debe(/data-dia-cuadrado=/.test(add) && /repartirEnFilas\(chipDays\)/.test(add), 'b4', 'el día sigue en sus cuadrados')
  // (V49, 24-nov) La hora de una EXCURSIÓN es opcional (no se inventa); en el resto, [Guardar] sigue pidiendo una hora válida elegida.
  debe(/const ready = Boolean\(resolvedDay && \(validTime \|\| isExcursion\)\)/.test(add), 'b5', '[Guardar] sigue pidiendo una hora válida elegida (salvo la excursión, V49)')
  const hora = sinComentarios(leerArchivo('src/components/ui/HojaDeHora.tsx'))
  debe(/if \(valida \|\| tocada\.current\)/.test(hora) && /cerrarSinGuardar/.test(hora), 'b6', '(V49/V50) el ✓ guarda lo elegido (o la hora que ya había); nunca inventa el ejemplo; tocar fuera cierra sin guardar')
}

console.log('2. La hoja de la entrada en la app')
let a = null
try {
  a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  await a.evaluar("(async () => { const n = performance.getEntriesByType('resource').map((r) => r.name).find((x) => x.includes('/src/store/useRouteStore.ts')); const m = await import(n || '/src/store/useRouteStore.ts'); m.useRouteStore.getState().setMode('bookings'); return true })()")
  await esp(2200)
  await a.evaluar(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.querySelector('[data-cabecera-clara]') ?? b?.firstElementChild; if (cab && !Array.from(b.querySelectorAll('button')).some((x) => /Añádela/.test(x.textContent || ''))) cab.click(); return true })()`)
  await esp(1500)
  const botonColiseo = `(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque?.querySelectorAll('button') ?? []).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`
  let abierta = false
  for (let i = 0; i < 40 && !abierta; i++) {
    abierta = await a.evaluar(botonColiseo)
    if (!abierta) await esp(500)
  }
  debe(abierta, 'a0', 'se abre la hoja «Añadir» del Coliseo desde RESERVAS')
  await esp(1800)
  const hoja = () => a.evaluar(`(() => {
    const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    if (!d) return null
    const c = d.querySelector('[data-campo-de-hora="anadir"]')
    const t = c?.querySelector('[data-campo-de-hora-texto]')
    const g = d.querySelector('[data-guardar-reserva]')
    return {
      dias: d.querySelectorAll('[data-dia-cuadrado]').length,
      rueda: d.querySelectorAll('[role="listbox"]').length,
      campo: c ? { vacia: c.getAttribute('data-vacia'), texto: (t?.textContent ?? '').trim(), color: t ? getComputedStyle(t).color : '', alto: c.getBoundingClientRect().height } : null,
      guardarActivo: g ? !g.disabled : null,
      hojaDeHora: Boolean(document.querySelector('[data-hoja-de-hora]')),
    }
  })()`)
  let h = await hoja()
  debe(Boolean(h), 'a1', 'la hoja está abierta')
  if (h) {
    debe(h.dias >= 2, 'a2', `el día va en sus cuadrados (${h.dias})`)
    debe(h.rueda === 0 && h.campo != null, 'a3', `la hora es una casilla; la rueda no va abierta en la pantalla (ruedas ${h.rueda})`)
    debe(h.campo && h.campo.vacia === '1' && /^\d{2}:\d{2}$/.test(h.campo.texto) && /rgba?\(28, 34, 48, 0?\.[2-4]/.test(h.campo.color), 'a4', `la hora sale como ejemplo en GRIS (${JSON.stringify(h.campo)})`)
    debe(h.guardarActivo === false, 'a5', '[Guardar] no está activo hasta elegir la hora (el ejemplo no cuenta)')
    await a.captura(foto('1_casilla_ejemplo'))
  }
  const ejemplo = h?.campo?.texto

  // Abrir la rueda y tocar fuera SIN moverla: se queda vacía.
  await clic(a, '[data-campo-de-hora="anadir"]')
  await esp(800)
  h = await hoja()
  debe(h?.hojaDeHora === true, 'a6', 'tocar la casilla abre la hoja de la hora (la rueda de toda la app)')
  const ruedas = await a.evaluar("document.querySelectorAll('[data-hoja-de-hora] [role=\"listbox\"]').length")
  debe(ruedas === 1, 'a7', `con una sola columna: las horas de ese sitio (${ruedas} rueda)`)
  await a.captura(foto('2_rueda'))
  await clic(a, '[data-hoja-de-hora-fondo]')
  await esp(700)
  h = await hoja()
  debe(h?.hojaDeHora === false && h?.campo?.vacia === '1' && h?.guardarActivo === false, 'a8', `tocar fuera de la rueda vacía sin moverla la deja vacía (${JSON.stringify(h?.campo)})`)

  // (V49, 24-nov) El ✓ SIN mover la rueda NO guarda la hora de ejemplo (nunca se guarda lo que el viajero no escribe).
  await clic(a, '[data-campo-de-hora="anadir"]')
  await esp(800)
  await clic(a, '[data-hoja-de-hora-guardar]')
  await esp(900)
  h = await hoja()
  debe(h?.campo?.vacia === '1', 'a9', `el ✓ sin mover NO guarda la hora de ejemplo (${ejemplo} → ${JSON.stringify(h?.campo)})`)
  // Eligiendo en la rueda, el ✓ guarda lo elegido, y sale en negro.
  await clic(a, '[data-campo-de-hora="anadir"]')
  await esp(800)
  const otra = await a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[data-hoja-de-hora] [role="option"]')).map((x) => x.textContent.trim()).filter((t) => t !== ${JSON.stringify(ejemplo)}); return o.at(-1) ?? null })()`)
  await a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[data-hoja-de-hora] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(otra)}); o?.click(); return true })()`)
  await esp(500)
  await clic(a, '[data-hoja-de-hora-guardar]')
  await esp(900)
  h = await hoja()
  debe(otra && h?.campo?.texto === otra && h.campo.vacia === '0', 'a9', `eligiendo otra hora, el ✓ la guarda (${otra} → ${JSON.stringify(h?.campo)})`)
  debe(h?.campo && /rgba?\(28, 34, 48(, 1)?\)/.test(h.campo.color), 'a10', `la hora elegida sale en negro (${h?.campo?.color})`)
  await a.captura(foto('3_hora_elegida'))

  // (V50, 24-nov) Elegir otra hora y tocar fuera: se cierra SIN guardar (sigue la anterior).
  await clic(a, '[data-campo-de-hora="anadir"]')
  await esp(800)
  const otra2 = await a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[data-hoja-de-hora] [role="option"]')).map((x) => x.textContent.trim()).filter((t) => t !== ${JSON.stringify(otra)}); return o[0] ?? null })()`)
  await a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[data-hoja-de-hora] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(otra2)}); o?.click(); return true })()`)
  await esp(500)
  await clic(a, '[data-hoja-de-hora-fondo]')
  await esp(800)
  h = await hoja()
  debe(otra2 && h?.campo?.texto === otra && h.campo.vacia === '0', 'a11', `elegir otra hora y tocar fuera NO la guarda (V50) (${otra2} → ${h?.campo?.texto}, sigue ${otra})`)
} catch (e) {
  debe(false, 'error', `la prueba se cortó: ${String(e?.message ?? e).slice(0, 200)}`)
} finally {
  a?.cerrar()
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
