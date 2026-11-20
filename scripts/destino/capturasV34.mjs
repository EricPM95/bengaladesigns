// Capturas de iPhone de la V34 («antes» con el código de 7b36cdac y «después» con el de ahora). Uso:
//   APP_URL=http://localhost:5198 node scripts/destino/capturasV34.mjs antes
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV34.mjs despues
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const fase = process.argv[2] ?? 'despues'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V34_capturas'
fs.mkdirSync(CAP, { recursive: true })
const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const HECHA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.setItem('trazo:demo:primera_vez_hecha','si')}catch(e){}"
const CURADOS = "window.__destinosCurados = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9028, lng: 12.4964, linea: 'La ciudad eterna', portada: '/fotos/roma/dia_coliseo.jpg', portada_pequena: '/fotos/roma/dia_coliseo_p.jpg' }];"
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const cap = (a, nombre) => a.captura(`${CAP}/${fase}_${nombre}.jpg`)

// 1. La pantalla que se veía un segundo (antes) / la cortina (después), y la bienvenida (después).
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS })
  try {
    let hecho = false
    for (let i = 0; i < 400 && !hecho; i++) {
      const estado = await a.evaluar("JSON.stringify({ pp: Boolean(document.querySelector('[data-primera-pantalla]')), cortina: Boolean(document.querySelector('[data-cortina-primera-vez]')), bienvenida: Boolean(document.querySelector('[data-bienvenida-primera-vez]')), preguntas: Boolean(document.querySelector('[data-preguntas-primera-vez]')) })").then(JSON.parse).catch(() => ({}))
      if (fase === 'antes' && estado.pp && !estado.preguntas) { await cap(a, '1_origen_destino_un_segundo'); hecho = true }
      if (fase === 'despues' && (estado.cortina || estado.bienvenida)) { await cap(a, estado.bienvenida ? '1_bienvenida' : '1_cortina'); hecho = true; if (estado.bienvenida) await esperar(a, "Boolean(document.querySelector('[data-empezar]'))") }
      await a.esp(40)
    }
    if (fase === 'despues') {
      await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
      await cap(a, '1_bienvenida')
      await clic(a, '[data-empezar]')
      await a.esp(400)
      await cap(a, '1_pregunta_1')
    }
  } finally {
    a.cerrar()
  }
}
// 2. El Perfil (vitrina vacía y pasaporte) en 390 y 320.
for (const ancho of [390, 320]) {
  const a = await abrirApp(APP, { ruta: RUTA, ancho, alto: 800, antes: HECHA + CURADOS })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-vitrina-del-perfil]')) && Boolean(document.querySelector('[data-abrir-pasaporte] [data-sello-asomando], [data-abrir-pasaporte]'))")
    await a.esp(1500)
    await a.evaluar("document.querySelector('[data-vitrina-del-perfil]').scrollIntoView({ block: 'center' }); true")
    await a.esp(300)
    await cap(a, `2_vitrina_${ancho}`)
    await a.evaluar("document.querySelector('[data-abrir-pasaporte]').scrollIntoView({ block: 'center' }); true")
    await a.esp(300)
    await cap(a, `2_pasaporte_${ancho}`)
  } finally {
    a.cerrar()
  }
}
// 3. La tarjeta y la página del destino (390): números, emblemas, cruces, portada, botón fijo.
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: HECHA + CURADOS })
  try {
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 3")
    await a.esp(1500)
    await a.evaluar("document.querySelector('[data-destino-lista=\"roma\"]').click(); true")
    await a.esp(120)
    await cap(a, '3_tarjeta')
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    await clic(a, '[data-ver-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]'))")
    await a.esp(1500)
    await cap(a, '4_pagina_arriba_portada')
    await a.evaluar("document.querySelector('[data-pagina-destino]').scrollTop = 700; true")
    await a.esp(500)
    await cap(a, '5_pagina_bajando_cruces')
    await a.evaluar("(() => { const c = document.querySelector('[data-pagina-destino]'); const e = document.querySelector('[data-llevar-emblemas]'); e.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(400)
    await cap(a, '6_emblemas')
    await a.evaluar("(() => { const c = document.querySelector('[data-pagina-destino]'); c.scrollTop = c.scrollHeight; return true })()")
    await a.esp(500)
    await cap(a, '7_pagina_abajo_boton')
  } finally {
    a.cerrar()
  }
}
// 4. El botón fijo en 320 x 568.
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 320, alto: 568, antes: HECHA + CURADOS })
  try {
    await esperar(a, "document.querySelectorAll('[data-pin]').length >= 3")
    await a.esp(1200)
    await a.evaluar("document.querySelector('[data-destino-lista=\"roma\"]').click(); true")
    await esperar(a, "Boolean(document.querySelector('[data-ver-destino]'))")
    await clic(a, '[data-ver-destino]')
    await esperar(a, "Boolean(document.querySelector('[data-pagina-destino] [data-lo-que-te-puedes-llevar]'))")
    await a.esp(1200)
    await a.evaluar("(() => { const c = document.querySelector('[data-pagina-destino]'); c.scrollTop = c.scrollHeight; return true })()")
    await a.esp(500)
    await cap(a, '7_pagina_abajo_boton_320')
  } finally {
    a.cerrar()
  }
}
console.log('capturas', fase, 'hechas en', CAP)
