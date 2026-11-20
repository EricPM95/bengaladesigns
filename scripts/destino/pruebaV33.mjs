// La prueba de la Tanda V33 (la PANTALLA del panel de Jutrip), puesta al día en la V35A: /admin con todos sus apartados abre, en ordenador y en móvil, con el servidor de mentira de la demo (?logrosDemo=1); quien no es administrador no ve nada; las direcciones de siempre llevan a su apartado.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV33.mjs
// El detalle de cada pantalla (bloques de Design, periodo, banderas, dinero…) lo prueban pruebaV35A.mjs, pruebaV35A_usuarios.mjs y pruebaV35A_logros.mjs; el servidor, pruebaV33_servidor.mjs. Ninguna parte toca producción ni manda correos.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

console.log('1. El código')
{
  const v = JSON.parse(leer('vercel.json'))
  debe(v.rewrites.some((r) => r.source === '/admin' && r.destination === '/index.html') && v.rewrites.some((r) => r.source === '/admin/:seccion'), 'rutas', 'Vercel sirve /admin y /admin/<apartado>')
  const p = leer('src/components/panel/PanelJutrip.tsx')
  debe(['Inicio', 'Reportes', 'Fotos de viajeros', 'Destinos pedidos', 'Ventas', 'Usuarios', 'Logros y sonidos'].every((n) => p.includes(`nombre: '${n}'`)), 'menu', 'el menú de Design: Inicio · Reportes · Fotos de viajeros · Destinos pedidos · Ventas · Usuarios · Logros y sonidos')
  const cuerpo = ['api.ts', 'Usuarios.tsx', 'Ventas.tsx'].map((n) => leer(`src/components/panel/${n}`)).join('\n')
  debe(!/Exportar|Descargar|\.csv|Blob\(|download=/.test(cuerpo), 'privacidad', 'el panel no tiene botón de exportar ni descarga de usuarios (solo lectura)')
  debe(!/supabase|service_role|SERVICE_ROLE/i.test(['Inicio', 'Reportes', 'Fotos', 'Destinos', 'Ventas', 'Usuarios', 'PanelJutrip'].map((n) => leer(`src/components/panel/${n}.tsx`)).join('\n') + leer('src/components/panel/api.ts')), 'privacidad', 'el navegador no sabe nada de Supabase ni de la clave de servicio: todo pasa por /api/admin/*')
  const main = leer('src/main.tsx')
  debe(main.includes("window.location.pathname === '/admin'") && main.includes("startsWith('/admin/')"), 'rutas', '/admin y /admin/<apartado> abren el panel')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V33 (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const RUTA = (p = '/admin') => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const actual = (a) => a.evaluar("document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual')")

console.log('2. Quien no es administrador ve «Esta página es solo para administradores»')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5, antes: "try{sessionStorage.setItem('trazo:demo-no-admin','1')}catch(e){}" })
  try {
    const ok = await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))")
    debe(ok && !(await a.evaluar("Boolean(document.querySelector('[data-panel-jutrip]'))")), 'admin', 'sin ser administrador, /admin enseña «Esta página es solo para administradores» y nada del panel')
  } finally {
    a.cerrar()
  }
}

console.log('3. El panel en ordenador: todos los apartados abren')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-movil') === '0' && Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-cifra]'))"), 'inicio', 'el panel abre en Inicio con sus cifras')
    const menu = JSON.parse(await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-nav]')].map((b) => b.getAttribute('data-nav')))"))
    debe(menu.join() === 'inicio,reportes,fotos,destinos,ventas,usuarios,logros', 'menu', `el menú, en su orden (${menu.join(', ')})`)
    for (const id of ['reportes', 'fotos', 'destinos', 'ventas', 'usuarios', 'logros']) {
      await clic(a, `[data-nav="${id}"]`)
      await a.esp(900)
      debe((await actual(a)) === id && (await a.evaluar('location.pathname')) === `/admin/${id}`, 'apartados', `el apartado «${id}» abre y cambia la dirección`)
    }
  } finally {
    a.cerrar()
  }
}

console.log('4. Las direcciones de siempre llevan a su apartado; el panel en el móvil')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/usuarios'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual') === 'usuarios'"), 'rutas', '/admin/usuarios abre directamente el apartado Usuarios')
  } finally {
    a.cerrar()
  }
  const b = await abrirApp(APP, { ruta: RUTA('/admin/sonidos'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(b, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual') === 'logros' && Boolean(document.querySelector('[data-admin-sonidos]'))"), 'rutas', '/admin/sonidos lleva a «Logros y sonidos», en su pestaña Sonidos')
  } finally {
    b.cerrar()
  }
  const m = await abrirApp(APP, { ruta: RUTA(), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(m, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-movil') === '1' && Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-cifra]'))"), 'movil', 'en el móvil el panel abre con el menú de pastillas y el Inicio')
    debe(!(await m.evaluar('document.documentElement.scrollWidth > innerWidth + 2')), 'movil', 'el Inicio no se sale de la pantalla en el móvil')
    for (const id of ['usuarios', 'reportes', 'ventas', 'logros']) {
      await clic(m, `[data-nav="${id}"]`)
      await m.esp(1200)
      debe(!(await m.evaluar('document.documentElement.scrollWidth > innerWidth + 2')), 'movil', `«${id}» cabe en el móvil`)
    }
  } finally {
    m.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V33 (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
