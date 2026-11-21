// Capturas de la V35B en tamaño iPhone (390 x 844) del panel nuevo, con la demo (?logrosDemo=1).
import { abrirApp } from './_enLaApp.mjs'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = (p) => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
for (const [ruta, archivo, esperaSel] of [['/admin/destinos', 'movil_destinos', '[data-pedido]'], ['/admin/ventas', 'movil_ventas', '[data-bloque="afiliados"]'], ['/admin/logros?pestana=herramientas', 'movil_cuentas_de_prueba', '[data-herramienta="cuentas-que-no-cuentan"]']]) {
  const a = await abrirApp(APP, { ruta: RUTA(ruta.split('?')[0]) + (ruta.includes('?') ? '&' + ruta.split('?')[1] : ''), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    for (let i = 0; i < 60; i++) {
      if (await a.evaluar(`Boolean(document.querySelector('${esperaSel}'))`).catch(() => false)) break
      await a.esp(250)
    }
    await a.esp(600)
    await a.captura(`docs/dias/V35B_capturas/${archivo}.jpg`)
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')
