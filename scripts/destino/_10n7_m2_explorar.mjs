import { abrir, foto } from './_10n7_m2_comun.mjs'
const { a, ev, preparar, abrirPresupuesto, texto, gasto, clic, RESERVAS } = await abrir()
try {
  await preparar({ yo: 'eric', modo: 'cada_uno', gente: ['eric', 'ana', 'luis', 'marta'] })
  await abrirPresupuesto()
  console.log('A', await clic('/Añadir gasto/'))
  await a.esp(1200)
  console.log(await texto('[role="dialog"][aria-labelledby="hoja-anadir-gasto"]'))
  await a.captura(foto('m2_explorar_gasto_cada_uno'))
  // reserva
  await ev("(() => { const b = Array.from(document.querySelectorAll('[aria-labelledby=\"hoja-anadir-gasto\"] button')).find((x) => /Cerrar/.test(x.getAttribute('aria-label')||'')); b?.click(); return true })()")
  await a.esp(600)
  console.log('B', await clic('/Coliseo, Foro y Palatino/', "document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')"))
  await a.esp(1500)
  await ev("document.querySelector('[data-para-quien]')?.scrollIntoView({block:'center'}); true")
  await a.esp(500)
  await a.captura(foto('m2_explorar_reserva_cada_uno'))
} finally { a.cerrar() }
process.exit(0)
