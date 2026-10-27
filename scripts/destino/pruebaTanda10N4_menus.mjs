// La prueba de la Tanda 10N4, parte G3: TODOS los menús de opciones como en Design («Piezas/Hojas Opciones» 01 a 04) y los permisos con nombres cortos.
//   APP_URL=http://localhost:5184 API_URL=http://localhost:8854 node scripts/destino/pruebaTanda10N4_menus.mjs
// Capturas en docs/dias/capturas_jutrip/10n4_menus_*.jpg (la app) y 10n4_design_hojas_opciones.jpg (la pieza de Design, para compararlas).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

/* ───────────── 1. El código ───────────── */
{
  const per = leer('src/lib/personasViaje.ts')
  debe(/editar: 'Editar'/.test(per) && /recomendar: 'Recomendar'/.test(per) && /admin: 'Administrador'/.test(per), '4', 'los nombres cortos de los permisos: Administrador, Editar, Recomendar')
  debe(/editar: 'Cambia la ruta\.'/.test(per) && /recomendar: 'Propone cambios\.'/.test(per) && /admin: ''/.test(per), '4', 'sus líneas: «Cambia la ruta.», «Propone cambios.» y Administrador sin texto')
  const hoja = leer('src/components/ui/HojaOpciones.tsx')
  debe(/export function HojaOpciones/.test(hoja) && /export function OpcionTarjeta/.test(hoja) && /'#FDFBF4'/.test(hoja) && /Instrument Serif/.test(hoja) && /borderRadius: 22/.test(hoja), '3', 'el componente compartido HojaOpciones con las medidas de Design')
  const usan = ['src/components/route/dayDetail/StopMenu.tsx', 'src/components/route/dayDetail/DayMenu.tsx', 'src/components/propuesta/MenusDelInvitado.tsx', 'src/components/compartir/PersonasDelViaje.tsx', 'src/components/perfil/HojaPortada.tsx', 'src/components/route/freeDay/AddDayChooser.tsx', 'src/components/route/dayDetail/OpenInMapsSheet.tsx']
  for (const f of usan) debe(/OpcionTarjeta/.test(leer(f)), '3', `${path.basename(f)} usa las tarjetas de opción`)
  debe(!/OpcionHoja\b/.test(leer('src/components/ui/MenuHoja.tsx')), '3', 'ya no queda la fila suelta con raya (OpcionHoja)')
  const per2 = leer('src/components/compartir/PersonasDelViaje.tsx')
  debe(/Añadir a alguien/.test(per2) && /Con un enlace o un código/.test(per2) && !/Invitar a alguien/.test(per2.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')), '3', '«Añadir a alguien · Con un enlace o un código» en vez de «+ Invitar a alguien»')
}

/* ───────────── 2. Design, al lado ───────────── */
try {
  await capturarDesign('Piezas/Hojas Opciones.dc.html', 'docs/dias/capturas_jutrip/10n4_design_hojas_opciones.jpg', { ancho: 1900, alto: 1000 })
  debe(fs.existsSync(path.join(SALIDA, '10n4_design_hojas_opciones.jpg')), 'design', 'la captura de la pieza de Design')
} catch (e) {
  console.log('  (no se pudo capturar Design: ' + e.message + ')')
}

/* ───────────── 3. La app ───────────── */
const preparar = async (a) => {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await a.evaluar('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await a.evaluar('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 80 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(500)
  await a.esp(2500)
}
const cerrarAvisos = async (a) => {
  for (let i = 0; i < 8; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const modo = async (a, m) => {
  await a.evaluar(`import('/src/store/useRouteStore.ts').then((s) => { s.useRouteStore.getState().setMode('${m}'); return true })`)
  await a.esp(2200)
  await cerrarAvisos(a)
}
/** Lo que enseña la hoja de opciones de arriba del todo: etiqueta, título y cada tarjeta. */
const LEER_HOJA = (datos) => `(() => {
  const hojas = Array.from(document.querySelectorAll('[data-hoja-opciones${datos ? `="${datos}"` : ''}]'))
  const h = hojas[hojas.length - 1]
  if (!h) return null
  const p = h.querySelector('.hoja-panel')
  const r = p.getBoundingClientRect()
  return {
    etiqueta: h.querySelector('[data-hoja-opciones-etiqueta]')?.textContent ?? '',
    titulo: h.querySelector('[data-hoja-opciones-titulo]')?.textContent ?? '',
    tirador: Boolean(h.querySelector('[data-hoja-tirador]')),
    cerrar: Boolean(h.querySelector('[data-hoja-cerrar]')),
    alto: r.height, ventana: window.innerHeight, ancho: r.width,
    radio: getComputedStyle(p).borderTopLeftRadius, fondo: getComputedStyle(p).backgroundColor,
    tarjetas: Array.from(h.querySelectorAll('[data-opcion-hoja]')).map((b) => {
      const tile = b.querySelector('span[aria-hidden="true"]')
      const t = b.querySelector('[data-opcion-titulo]')
      return {
        titulo: t?.textContent ?? '', linea: b.querySelector('[data-opcion-linea]')?.textContent ?? '',
        deshabilitada: b.getAttribute('data-deshabilitada') === '1' || b.disabled === true, peligro: b.getAttribute('data-peligro') === '1', flecha: b.getAttribute('data-flecha') === '1', elegida: b.getAttribute('data-elegida') === '1',
        icono: Boolean(tile && tile.querySelector('svg')), tile: tile ? Math.round(tile.getBoundingClientRect().width) : 0, tileBg: tile ? getComputedStyle(tile).backgroundColor : '',
        letra: t ? getComputedStyle(t).fontFamily : '', tam: t ? getComputedStyle(t).fontSize : '', fondo: getComputedStyle(b).backgroundColor, borde: getComputedStyle(b).borderTopLeftRadius, alto: Math.round(b.getBoundingClientRect().height),
      }
    }),
  }
})()`

{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const cap = (n) => a.captura(path.join(SALIDA, `10n4_menus_${n}.jpg`))
  const ev = (js) => a.evaluar(js)
  const clic = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  try {
    await preparar(a)
    await cerrarAvisos(a)

    // ── 01 · El menú de una parada ──
    await modo(a, 'days')
    await a.esp(1500)
    const abrirParada = async () => {
      await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
      await a.esp(400)
      const ok = await ev("(() => { const b = document.querySelector('[data-menu-hoja=\"parada\"]'); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()")
      await a.esp(900)
      return ok
    }
    debe(await abrirParada(), '01', 'la parada tiene su «···»')
    const p = await ev(LEER_HOJA('menu'))
    debe(p && p.tirador && p.cerrar, '01', 'la hoja de la parada lleva tirador y ✕')
    debe(/^parada$/i.test(p?.etiqueta ?? ''), '01', `arriba, pequeño: «PARADA» (${p?.etiqueta})`)
    debe((p?.titulo ?? '').length > 2, '01', `debajo, grande, el nombre de la parada (${p?.titulo})`)
    const nombres = (p?.tarjetas ?? []).map((t) => t.titulo)
    debe(nombres.slice(0, 5).join('|') === 'Cambiar parada|Mover a otro día|Mover antes|Mover después|Quitar parada', '01', `el orden de Design: Cambiar parada, Mover a otro día, Mover antes, Mover después, Quitar parada (${nombres.join(', ')})`)
    debe(nombres[nombres.length - 1] === 'Quitar parada', '01', 'Quitar parada es la última')
    debe((p?.tarjetas ?? []).every((t) => t.icono && t.tile === 54 && t.linea.length > 4), '01', 'cada tarjeta lleva su icono en un cuadrado de 54 px y su línea gris')
    debe((p?.tarjetas ?? []).every((t) => /Instrument Serif/.test(t.letra) && t.tam === '23px' && t.borde === '22px'), '01', 'el nombre en la letra de los títulos (23 px) y la tarjeta con borde de 22 px')
    const tilesDistintos = new Set((p?.tarjetas ?? []).filter((t) => !t.peligro && !t.deshabilitada).map((t) => t.tileBg))
    debe(tilesDistintos.size >= 2, '01', `cada opción con su color suave (${[...tilesDistintos].join(' · ')})`)
    const antes = (p?.tarjetas ?? []).find((t) => t.titulo === 'Mover antes')
    debe(antes?.deshabilitada && /primera del día/.test(antes?.linea ?? ''), '01', `«Mover antes» en gris: «${antes?.linea}»`)
    debe((p?.tarjetas ?? []).find((t) => t.titulo === 'Cambiar parada')?.flecha && (p?.tarjetas ?? []).find((t) => t.titulo === 'Mover a otro día')?.flecha, '01', 'la flecha «›» en las que llevan a otra pantalla')
    const quitar = (p?.tarjetas ?? []).find((t) => t.titulo === 'Quitar parada')
    debe(quitar?.peligro && quitar.fondo === 'rgb(255, 248, 247)' && /Sale de tu ruta/.test(quitar.linea), '01', `«Quitar parada» en rojo, tarjeta rosa muy clara (${quitar?.fondo}, «${quitar?.linea}»)`)
    debe(p && p.radio === '32px' && p.fondo === 'rgb(253, 251, 244)', '01', `la hoja con el borde de 32 px y el fondo de Design (${p?.radio}, ${p?.fondo})`)
    await cap('01_parada')

    // «Mover a otro día» sigue con su ruedita dentro de la misma hoja.
    await ev("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((b) => /Mover a otro día/.test(b.textContent)).click(); true")
    await a.esp(900)
    debe(await ev("Boolean(document.querySelector('[data-mover-a-dia]'))"), '01', '«Mover a otro día» abre la ruedita de días')
    await cap('01b_mover_a')
    await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
    await a.esp(500)

    // ── 02 · El menú de un día ──
    const nDias = await ev("document.querySelectorAll('[data-menu-hoja=\"dia\"]').length")
    debe(nDias >= 3, '02', `los días tienen su «···» (${nDias})`)
    const dias = []
    for (let i = 0; i < nDias; i++) {
      await ev(`document.querySelectorAll('[data-menu-hoja="dia"]')[${i}].scrollIntoView({block:'center'}); document.querySelectorAll('[data-menu-hoja="dia"]')[${i}].click(); true`)
      await a.esp(800)
      const d = await ev(LEER_HOJA('menu'))
      dias.push(d)
      if (i === 0) await cap('02_dia_llegada')
      if (i === nDias - 1) await cap('02_dia_vuelta')
      await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
      await a.esp(400)
    }
    const d0 = dias[0]
    debe(/^día$/i.test(d0?.etiqueta ?? '') && (d0?.titulo ?? '').length > 4, '02', `arriba «DÍA» y debajo el nombre del día (${d0?.etiqueta} · ${d0?.titulo})`)
    for (const [i, d] of dias.entries()) {
      const n = (d?.tarjetas ?? []).map((t) => t.titulo)
      debe(n[0] === 'Añadir lugares' && n[1] === 'Añadir una excursión' && n[n.length - 1] === 'Eliminar día', '02', `día ${i + 1}: Añadir lugares, Añadir una excursión … y Eliminar día la última (${n.join(', ')})`)
      const el = d?.tarjetas.find((t) => t.titulo === 'Eliminar día')
      debe(el?.peligro && /Se quitan el día y sus paradas|fijado/.test(el.linea), '02', `día ${i + 1}: «Eliminar día» en rojo con su línea (${el?.linea})`)
    }
    const exc = (i) => dias[i]?.tarjetas.find((t) => /excursión|Volver a Roma/.test(t.titulo))
    debe(exc(0)?.deshabilitada && /llegada/.test(exc(0)?.linea ?? ''), '02', `el día de llegada: «Añadir una excursión» en gris con el porqué (${exc(0)?.linea})`)
    debe(exc(nDias - 1)?.deshabilitada && /vuelta/.test(exc(nDias - 1)?.linea ?? ''), '02', `el día de vuelta: en gris con el porqué (${exc(nDias - 1)?.linea})`)
    // El viaje de pruebas no trae ningún día con interruptor: se le pone a uno del medio para ver la opción activa (y se espía lo que pide).
    debe(dias.every((d, i) => exc(i)?.deshabilitada), '02', '«Añadir una excursión» sale en gris en todos los días del viaje de pruebas (ninguno lleva interruptor)')
    await ev("import('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; m.useRouteStore.setState({ route: { ...r, days: r.days.map((d) => (d.id === 'day-2' ? { ...d, interruptor: { mode: 'roma', default: 'roma', excursionId: null, percentPhrase: '', other: null } } : d)) } }); window.__pedido = null; return import('/src/store/useInterruptorUiStore.ts').then((u) => { u.useInterruptorUiStore.setState({ pedir: async (id, t) => { window.__pedido = id + ':' + t } }); return true }) })")
    await a.esp(1200)
    const conExc = [1]
    debe(dias.every((d) => (d?.tarjetas.find((t) => t.titulo === 'Añadir lugares')?.linea ?? '') === 'Monumentos, barrios, miradores…'), '02', '«Añadir lugares»: «Monumentos, barrios, miradores…»')
    if (conExc.length) {
      // «Añadir una excursión» hace lo mismo que el interruptor: el día pasa a Excursión.
      const i = conExc[0]
      await ev(`document.querySelectorAll('[data-menu-hoja="dia"]')[${i}].scrollIntoView({block:'center'}); document.querySelectorAll('[data-menu-hoja="dia"]')[${i}].click(); true`)
      await a.esp(800)
      await cap('02_dia_con_excursion')
      await ev("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((b) => /Añadir una excursión/.test(b.textContent)).click(); true")
      await a.esp(800)
      debe((await ev('window.__pedido')) === 'day-2:excursion', '02', `«Añadir una excursión» pide lo mismo que el interruptor del día (${await ev('window.__pedido')})`)
    }

    // «Añadir lugares» abre la pantalla de añadir a ese día.
    await ev("document.querySelectorAll('[data-menu-hoja=\"dia\"]')[1].scrollIntoView({block:'center'}); document.querySelectorAll('[data-menu-hoja=\"dia\"]')[1].click(); true")
    await a.esp(800)
    await ev("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((b) => /Añadir lugares/.test(b.textContent)).click(); true")
    await a.esp(2500)
    debe(await ev("import('/src/store/useAddFlowStore.ts').then((m) => Boolean(m.useAddFlowStore.getState().addFlow))"), '02', '«Añadir lugares» abre la pantalla de añadir a ese día')
    await ev("import('/src/store/useAddFlowStore.ts').then((m) => { m.useAddFlowStore.getState().closeAddFlow(); return true })")
    await a.esp(600)

    // «+ Añadir día»: qué quieres hacer.
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Añadir día/.test(x.textContent || '')); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()")
    await a.esp(900)
    const ch = await ev(LEER_HOJA('add-day-chooser'))
    debe(ch && ch.tarjetas.map((t) => t.titulo).join('|') === 'Añadir lugares|Añadir una excursión', 'chooser', `«+ Añadir día» con las mismas tarjetas (${ch?.tarjetas.map((t) => t.titulo).join(', ')})`)
    if (ch) await cap('03_anadir_dia')
    await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
    await a.esp(400)

    // ── 03 y 04 · Personas del viaje ──
    await modo(a, 'route')
    const gente = (yo) => `window.__viaje.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'e', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: ${yo === 'e'} }, { id: 'v', nombre: 'VIAJES', foto: null, esAdmin: false, permiso: 'editar', esYo: ${yo === 'v'} }] })`
    await ev(gente('e'))
    await a.esp(900)
    debe(await clic('[data-caras-del-viaje-boton]'), '03', 'las caras del viaje abren «Personas del viaje»')
    await a.esp(1800)
    for (let k = 0; k < 3 && !(await ev("Boolean(document.querySelector(\"[data-hoja-opciones=personas-del-viaje]\"))")); k++) {
      await clic("[data-caras-del-viaje-boton]")
      await a.esp(1800)
    }
    const per = await ev(LEER_HOJA('personas-del-viaje'))
    const tex = await ev('document.body.innerText')
    debe(per && /PERSONAS/.test(per.etiqueta) && per.titulo === 'Personas del viaje', '03', `arriba «ROMA · … · 2 PERSONAS» y «Personas del viaje» (${per?.etiqueta})`)
    debe(/Administrador/.test(tex) && /\bEditar\b/.test(tex) && !/Puede editar|Solo recomendar/.test(tex), '03', 'las etiquetas con los nombres cortos (Administrador, Editar) y ninguno de los viejos')
    debe(/· Tú/.test(tex), '03', '«· Tú» en la fila propia')
    const anadir = per?.tarjetas.find((t) => /Añadir a alguien/.test(t.titulo))
    debe(anadir && anadir.linea === 'Con un enlace o un código', '03', `abajo «Añadir a alguien · Con un enlace o un código» (${anadir?.titulo} · ${anadir?.linea})`)
    debe(await ev("(() => { const b = document.querySelector('[data-persona-fila=\"v\"]'); const p = document.querySelector('[data-persona-fila=\"e\"]'); return Boolean(b && !b.disabled && p && p.disabled && b.querySelector('svg:last-child')) })()"), '03', 'solo se puede tocar a los demás (con «›»), no a uno mismo')
    await cap('03_personas')

    // 04 · Al tocar a VIAJES.
    await ev("document.querySelector('[data-persona-fila=\"v\"]').click(); true")
    await a.esp(900)
    const pe = await ev(LEER_HOJA('persona-del-viaje'))
    debe(pe && /PERSONAS DEL VIAJE · EDITAR/i.test(pe.etiqueta) && pe.titulo === 'VIAJES', '04', `arriba «PERSONAS DEL VIAJE · EDITAR» y «VIAJES» (${pe?.etiqueta} · ${pe?.titulo})`)
    debe(pe && pe.tarjetas.map((t) => t.titulo).join('|') === 'Cambiar permiso|Quitar del viaje', '04', `«Cambiar permiso» y «Quitar del viaje» (${pe?.tarjetas.map((t) => t.titulo).join(', ')})`)
    const cp = pe?.tarjetas[0]
    debe(cp?.linea === 'Editar o Recomendar' && cp?.flecha, '04', `«Cambiar permiso · Editar o Recomendar» con «›» (${cp?.linea})`)
    const qv = pe?.tarjetas[1]
    debe(qv?.peligro && qv.linea === 'Pierde el acceso y su plaza del pase vuelve a ti', '04', `«Quitar del viaje» en rojo y la última (${qv?.linea})`)
    await cap('04_persona')

    // El permiso.
    await clic('[data-cambiar-permiso]')
    await a.esp(900)
    const pm = await ev(LEER_HOJA('permiso-de'))
    debe(pm && /^Permiso de VIAJES$/.test(pm.titulo), 'permiso', `«Permiso de VIAJES» (${pm?.titulo})`)
    const adm = pm?.tarjetas.find((t) => t.titulo === 'Administrador')
    debe(adm?.deshabilitada && adm.linea === '', 'permiso', 'Administrador en gris y sin texto debajo')
    debe(await ev("(() => { const a = document.querySelector('[data-hoja-opciones=\"permiso-de\"] [data-opcion-permiso=\"admin\"]'); return Boolean(a && /Solo Eric/.test(a.innerText) && a.querySelector('svg')) })()"), 'permiso', 'con el candado y «Solo Eric» a la derecha')
    const ed = pm?.tarjetas.find((t) => t.titulo === 'Editar')
    const re = pm?.tarjetas.find((t) => t.titulo === 'Recomendar')
    debe(ed?.linea === 'Cambia la ruta.' && re?.linea === 'Propone cambios.', 'permiso', `«Editar · Cambia la ruta.» y «Recomendar · Propone cambios.» (${ed?.linea} · ${re?.linea})`)
    debe(ed?.elegida && ed.fondo === 'rgb(28, 34, 48)' && !re?.elegida, 'permiso', `la elegida (Editar) con el estilo de elegir: azul oscuro (${ed?.fondo})`)
    debe(!/Todo, y es el único|No invita ni cambia|Toca la ruta y acepta/.test(await ev('document.body.innerText')), 'permiso', 'fuera las frases largas')
    await cap('05_permiso')
    await ev("document.querySelector('[data-opcion-permiso=\"recomendar\"]').click(); true")
    await a.esp(400)
    debe(await ev("document.querySelector('[data-opcion-permiso=\"recomendar\"]').getAttribute('data-elegida') === '1' && document.querySelector('[data-opcion-permiso=\"editar\"]').getAttribute('data-elegida') !== '1'"), 'permiso', 'al tocar Recomendar pasa a ser la elegida')
    await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
    await a.esp(400)

    // Un invitado (no administrador): «Salir del viaje» como tarjeta roja.
    await ev("sessionStorage.setItem('trazo:invitado', '1'); true")
    await ev(gente('v'))
    await a.esp(800)
    await ev("document.querySelector('[data-hoja-opciones] [data-hoja-cerrar]')?.click(); true")
    await a.esp(300)
    if (await clic('[data-caras-del-viaje-boton]')) {
      await a.esp(1500)
      const inv = await ev(LEER_HOJA('personas-del-viaje'))
      const sal = inv?.tarjetas.find((t) => t.titulo === 'Salir del viaje')
      debe(sal?.peligro, 'invitado', `el invitado ve «Salir del viaje» como tarjeta roja (${sal?.titulo})`)
      debe(!inv?.tarjetas.some((t) => /Añadir a alguien/.test(t.titulo)), 'invitado', 'y no ve «Añadir a alguien»')
      await cap('06_invitado')
      await ev("Array.from(document.querySelectorAll('[data-hoja-opciones] [data-hoja-cerrar]')).forEach((b) => b.click()); true")
    }
    await ev("sessionStorage.removeItem('trazo:invitado'); true")
    await ev(gente('e'))

    // ── Cambiar portada (Mis viajes) ──
    await a.esp(500)
    const perfil = await ev("(() => { const b = document.querySelector('[aria-label*=\"erfil\"], [data-boton-perfil]'); if (!b) return false; b.click(); return true })()")
    if (perfil) {
      await a.esp(4000)
      if (await ev("Boolean(document.querySelector('[data-cambiar-portada]'))")) {
        await clic('[data-cambiar-portada]')
        await a.esp(900)
        const po = await ev(LEER_HOJA('cambiar-portada'))
        debe(po && po.titulo === 'Cambiar portada' && po.tarjetas.length === 3, 'portada', `«Cambiar portada» con tres tarjetas (${po?.tarjetas.map((t) => t.titulo).join(', ')})`)
        debe(po?.tarjetas.every((t) => t.icono && t.linea.length > 3), 'portada', 'cada una con su icono y su línea')
        await cap('07_cambiar_portada')
      } else console.log('  (no se encontró «Cambiar portada» en Mis viajes: se salta)')
    } else console.log('  (no se encontró el perfil: se salta «Cambiar portada»)')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de los menús de opciones (Tanda 10N4): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
