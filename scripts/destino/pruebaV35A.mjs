// La prueba de la Tanda V35A: EL PANEL, IGUAL QUE DESIGN (Inicio, Reportes, Fotos, Destinos pedidos y Ventas; Usuarios y Logros tienen la suya: pruebaV35A_usuarios y pruebaV35A_logros).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35A.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: el servidor se prueba con una base falsa y la pantalla con el servidor de mentira de la demo (?logrosDemo=1).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { rangoDePeriodo, cubetasDeRango, enRango } from '../../server/panel/periodo.js'
import { calcularInicio, calcularVentas, primeraVez, desdeDondeViajan, tituloDeAviso } from '../../server/panel/calculos.js'
import { tituloDeReporte, dondeEstaba, aparatoDe, buscarSitio, textoDeReporte } from '../../server/panel/reportes.js'

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
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)

/* ───────── 1. El periodo (servidor) ───────── */
console.log('1. El periodo: los siete, en la hora de Madrid')
{
  const ahora = new Date('2026-11-20T10:00:00Z')
  const r = (p, d = '', h = '') => rangoDePeriodo({ periodo: p, desde: d, hasta: h }, ahora)
  debe(r('7d').desde === '2026-11-14' && r('7d').hasta === '2026-11-20' && r('7d').titulo === 'últimos 7 días', 'periodo', 'Últimos 7 días: del 14 al 20 de nov')
  debe(r('mes').desde === '2026-11-01' && r('mes').titulo === 'este mes' && r('mes').etiqueta === 'Este mes', 'periodo', 'Este mes: desde el 1')
  debe(r('30d').desde === '2026-10-22', 'periodo', 'Últimos 30 días')
  debe(r('6m').desde === '2026-06-01' && r('6m').titulo === 'últimos 6 meses', 'periodo', 'Últimos 6 meses: desde el 1 de junio')
  debe(r('anio').desde === '2026-01-01' && r('anio').titulo === 'este año', 'periodo', 'Este año')
  debe(r('todo').desde === null && r('todo').dias === null, 'periodo', 'Todo: desde siempre')
  debe(r('custom', '2026-11-03', '2026-11-18').etiqueta === '3 nov – 18 nov' && r('custom', '2026-11-18', '2026-11-03').desde === '2026-11-03', 'periodo', 'Personalizado: «3 nov – 18 nov» (y si se eligen al revés, se ordenan)')
  debe(r('custom').periodo === 'mes' && r('raro').periodo === 'mes', 'periodo', 'un personalizado sin fechas, o un periodo raro, es «este mes»')
  debe(rangoDePeriodo({ periodo: 'mes' }, new Date('2026-11-30T23:30:00Z')).hasta === '2026-12-01', 'periodo', 'un día es un día de Madrid (las 23:30 UTC del 30 ya son el 1 de dic)')
  debe(enRango('2026-11-20T09:00:00Z', r('7d')) && !enRango('2026-11-10T09:00:00Z', r('7d')), 'periodo', 'enRango mira el día de Madrid')
  const dia = cubetasDeRango(r('7d'))
  const sem = cubetasDeRango(r('anio'))
  const mes = cubetasDeRango({ desde: '2024-01-01', hasta: '2026-11-20' })
  debe(dia.tipo === 'dia' && dia.cubetas.length === 7 && sem.tipo === 'semana' && mes.tipo === 'mes', 'periodo', 'el gráfico va por día, semana o mes según lo largo que sea')
}

/* ───────── 2. Los cálculos (servidor, con una base falsa) ───────── */
console.log('2. Inicio y Ventas con una base falsa')
const AHORA = new Date('2026-11-20T10:00:00Z')
const base = {
  usuarios: [
    { id: 'eric', email: 'eric@x.test', alta: '2026-10-01T10:00:00Z', ultimo_acceso: '2026-11-20T08:00:00Z', proveedor: 'google' },
    { id: 'alice', email: 'alice@x.test', alta: '2026-11-20T07:00:00Z', ultimo_acceso: '2026-11-20T08:00:00Z', proveedor: 'correo' },
    { id: 'bob', email: 'bob@x.test', alta: '2026-11-18T07:00:00Z', ultimo_acceso: null, proveedor: 'correo' },
  ],
  travelers: [{ id: 'eric', nombre: 'Eric' }, { id: 'alice', nombre: 'Alice' }],
  trips: [
    { id: 't1', traveler_id: 'eric', destino: 'Roma', origen: 'Barcelona', lugar: { name: 'Barcelona', countryCode: 'es' }, inicio: '2026-12-01', fin: '2026-12-05' },
    { id: 't2', traveler_id: 'bob', destino: 'Lanzarote', origen: 'Madrid', lugar: null, inicio: '2026-10-01', fin: '2026-10-05' },
    { id: 't3', traveler_id: 'bob', destino: 'Cancún', origen: 'Ciudad de México', lugar: { name: 'Ciudad de México', countryCode: 'mx' }, inicio: null, fin: null },
  ],
  miembros: [{ trip_id: 't1', user_id: 'alice' }],
  pases: [
    { id: 'p1', comprador_id: 'eric', destino: 'Lanzarote', tipo: 'duo', estado: 'activo', pago_ref: 'cs_1', created_at: '2026-11-19T18:00:00Z' },
    { id: 'p2', comprador_id: 'bob', destino: 'Roma', tipo: 'uno', estado: 'activo', pago_ref: null, created_at: '2026-11-18T10:00:00Z' },
  ],
  miembros_pase: [{ pass_id: 'p1', user_id: 'alice' }],
  pagos: [
    { pago_ref: 'cs_1', destino: 'Lanzarote', plan: 'duo', personas: 2, importe_cent: 1099, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-11-19T18:00:00Z' },
    { pago_ref: 'cs_2', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-10-19T09:00:00Z' },
    { pago_ref: 'cs_3', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'devuelto', proveedor: 'stripe', creado_en: '2026-10-19T08:00:00Z' },
    { pago_ref: 'cs_4', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'pagado', proveedor: 'mentira', creado_en: '2026-11-19T08:00:00Z' },
  ],
  primera_vez: [
    { user_id: 'eric', frecuencia: 'dos_o_tres', compania: 'pareja', anio_nacimiento: 1990 },
    { user_id: 'alice', frecuencia: 'dos_o_tres', compania: null, anio_nacimiento: null },
    { user_id: 'bob', frecuencia: null, compania: null, anio_nacimiento: null },
  ],
  logros: [],
  perfiles: [],
  avisos_destino: [],
  avisos: [],
}
{
  const v = (p, d, h) => calcularVentas(base, { periodo: { periodo: p, desde: d, hasta: h }, ahora: AHORA })
  const mes = v('mes')
  const todo = v('todo')
  debe(mes.pases.periodo === 1 && mes.ingresos_cent === 1099 && todo.pases.periodo === 2 && todo.ingresos_cent === 2497 && todo.te_queda.cent === 1798 && todo.devoluciones_cent === 699, 'ventas', `el periodo cambia las cifras (este mes ${mes.pases.periodo} pase / ${mes.ingresos_cent} cént.; todo ${todo.pases.periodo} / ${todo.ingresos_cent}): solo cobros REALES de Stripe, no los de la pasarela de mentira; (V35B) los ingresos incluyen lo devuelto y «lo que te queda» (${todo.te_queda.cent}) ya lo descuenta`)
  debe(mes.te_queda.comision_cent === null && mes.te_queda.antes_de_impuestos === true && mes.afiliados.clics === null, 'ventas', '«Lo que te queda» antes de impuestos; la comisión de Stripe y los clics, pendientes (V35B)')
  debe(mes.conversion.compraron === 1 && mes.conversion.viajeros === 2 && mes.conversion.pct === 50, 'ventas', 'conversión real: de las 2 personas con viaje propio, 1 compró el pase (50 %)')
  const c = todo.compras
  debe(c.some((x) => x.destino === 'Roma' && x.estado === 'reembolsado') && c.some((x) => x.estado === 'regalado' && x.persona?.nombre === 'bob') && c.some((x) => x.estado === 'comprado' && x.persona?.nombre === 'Eric' && x.tipo === 'duo'), 'ventas', 'Últimas compras: Comprado (con su ficha), «Regalado» y «Reembolsado»')
  debe(c.some((x) => x.destino === 'Roma' && x.estado === 'comprado' && x.persona === null), 'ventas', 'un cobro sin pase (el de Roma de 6,99 €) cuenta en Ventas y dice que no tiene cuenta asociada')
  debe(!c.some((x) => x.importe_cent === 699 && x.fecha.startsWith('2026-11-19')), 'ventas', 'la compra de la pasarela de mentira no sale')
  debe(todo.por_destino[0].destino === 'Lanzarote' && todo.por_destino.find((d) => d.destino === 'Roma').importe_cent === 699, 'ventas', 'Pases por destino, con sus ingresos')
  debe(v('7d').por_dia.cubetas.length === 7 && v('30d').por_dia.cubetas.length === 30, 'ventas', 'Pases por día: 7 y 30 días')
  const i = calcularInicio(base, { nuevos: 2, fotos: 1, recientes: [{ id: 'a', tipo: 'no_funciona', creado: '2026-11-20T09:00:00Z', datos: { que: 'No deja pagar' } }] }, { periodo: { periodo: 'mes' }, ahora: AHORA })
  debe(i.usuarios.total === 3 && i.usuarios.hoy === 1 && i.usuarios.semana === 2 && i.usuarios.con_viaje === 3 && i.usuarios.pct_con_viaje === 100, 'inicio', 'Usuarios: 3 en total, 1 nuevo hoy, 2 esta semana; con viaje cuenta también los compartidos (Alice)')
  debe(i.pases.hoy === 0 && i.pases.mes === 1 && i.ingresos.mes_cent === 1099 && i.reportes_nuevos === 2 && i.fotos_por_aprobar === 1, 'inicio', 'las tarjetas: pases, ingresos, reportes y fotos reales')
  debe(i.atencion[0].tipo === 'fallo' && /Algo no funciona: No deja pagar/.test(i.atencion[0].titulo) && i.atencion.some((x) => x.titulo === 'Pase Lanzarote · Dúo') && i.atencion.some((x) => x.titulo === 'Pase Roma · Individual'), 'inicio', 'Lo último: ventas con nombre claro («Pase Roma · Individual») y los reportes')
  debe(i.serie.cubetas.length === 20 && i.serie.total === 1, 'inicio', 'el gráfico de este mes (1 al 20) con sus números')
  const pv = primeraVez(base, AHORA)
  debe(pv.contestaron === 2 && pv.bloques[0].opciones.length === 1 && pv.bloques[1].opciones.length === 1 && pv.bloques[2].opciones.length === 1 && pv.bloques[0].opciones[0].pct === 100, 'primera_vez', 'lo que contestaron, SOLO con las opciones elegidas (no salen las que nadie eligió)')
  const dd = desdeDondeViajan(base)
  debe(dd.paises.find((p) => p.iso === 'es').n === 2 && dd.paises.find((p) => p.iso === 'mx').n === 1 && dd.ciudades.find((c2) => c2.nombre === 'Madrid').iso === 'es', 'origen', 'Desde dónde viajan: sale del ORIGEN de los viajes (España 2, México 1; Madrid sin país en el viaje cuenta como España)')
}
console.log('2b. Reportes: lo que se enseña, en palabras')
{
  debe(tituloDeReporte('dato_mal', { sitio: 'Coliseo', falla: 'horario' }) === 'Coliseo · Horario' && tituloDeReporte('foto', { sitio: 'Panteón' }) === 'Panteón · Foto' && tituloDeReporte('restaurante', { nombre: 'Trattoria da Enzo' }) === 'Trattoria da Enzo', 'reportes', 'el título de cada reporte («Coliseo · Horario»)')
  debe(dondeEstaba({ pantalla: 'route', pestana: 'dias', viaje: 'Roma 1–5 dic' }) === 'Desde DÍAS de su viaje «Roma 1–5 dic»' && aparatoDe('iPhone', 'Safari 17') === 'iPhone · Safari 17', 'reportes', 'el contexto en palabras: «Desde DÍAS de su viaje…», «iPhone · Safari 17» (no «route · v 947e7f58»)')
  const sitios = [{ clave: 'roma', destino: 'Roma', id: 'coliseo', nombre: 'Coliseo', nombres: ['coliseo', 'colosseo'], horario: '08:30-16:30', entrada: '18 €' }]
  debe(buscarSitio(sitios, 'Colosseo', 'Roma')?.id === 'coliseo' && buscarSitio(sitios, 'Nada', 'Roma') === null, 'reportes', 'se encuentra el sitio del reporte (por su nombre o alias) para enseñar lo que pone la app')
  debe(textoDeReporte('dato_mal', { mas: 'Cierra a las 17:00' }) === 'Cierra a las 17:00', 'reportes', 'lo que dice el viajero')
  debe(/Algo no funciona: x/.test(tituloDeAviso({ tipo: 'no_funciona', datos: { que: 'x' } })), 'reportes', 'el título del aviso del inicio')
}

/* ───────── 3. El código ───────── */
console.log('3. El código')
{
  const sec = (f) => leer(`src/components/panel/${f}`)
  debe(/Últimos 7 días/.test(sec('periodo.tsx')) && /Últimos 6 meses/.test(sec('periodo.tsx')) && /Personalizado/.test(sec('periodo.tsx')) && /Aplicar/.test(sec('periodo.tsx')), 'periodo', 'el selector tiene los siete periodos y [Aplicar] en el calendario')
  const quien = ['Inicio', 'Ventas', 'Destinos'].every((f) => /SelectorDePeriodo/.test(sec(`${f}.tsx`))) && /SelectorDePeriodo/.test(sec('Usuarios.tsx'))
  debe(quien, 'periodo', 'el MISMO selector arriba en Inicio, Ventas, Destinos pedidos y Usuarios')
  debe(/FlagIcon/.test(sec('banderas.tsx')) && !/linear-gradient\(90deg,#2E8B57/.test(sec('banderas.tsx')), 'banderas', 'las banderas son de verdad, de una sola pieza compartida (nada de degradados a mano)')
  const nombres = ['Inicio', 'Reportes', 'Fotos de viajeros', 'Destinos pedidos', 'Ventas', 'Usuarios', 'Logros y sonidos']
  const panel = sec('PanelJutrip.tsx')
  debe(nombres.every((n) => panel.includes(`nombre: '${n}'`)), 'menu', 'el menú de Design: Inicio · Reportes · Fotos de viajeros · Destinos pedidos · Ventas · Usuarios · Logros y sonidos')
  debe(!/\.\.\.\.|serie14/.test(sec('Inicio.tsx')), 'inicio', 'Inicio ya no usa el formato viejo')
  const index = leer('server/panel/index.js')
  debe(!/rpc\(admin, 'panel_(inicio|ventas)'/.test(leer('server/panel/inicio.js') + leer('server/panel/ventas.js')) && /conAdmin\(async \(req, res\) => res\.json\(await reportes\.lista/.test(index), 'servidor', 'Inicio y Ventas no usan SQL; la lista de reportes pasa por el guardián de administrador')
  debe(!/create (or replace )?function/i.test(leer('server/panel/calculos.js') + leer('server/panel/base.js')), 'sin_sql', 'esta tanda no lleva SQL: nada de funciones nuevas')
}

/* ───────── 4. En la pantalla ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V35A: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
const RUTA = (p) => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
const PROHIBIDAS = /\b(eur|duo)\b|Pase [A-Za-zÁ-ú ]+ · uno\b/i
console.log('4. Las pantallas: ordenador (1280) y móvil (390)')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-donut]'))"), 'inicio', 'Inicio sale')
    const m = await J(a, `JSON.stringify({
      menu: [...document.querySelectorAll('[data-nav]')].map((b) => b.innerText.replace(/\\n.*$/s, '').trim()),
      rojas: Object.fromEntries([...document.querySelectorAll('[data-insignia]')].map((b) => [b.getAttribute('data-insignia'), b.textContent])),
      fecha: document.querySelector('main span')?.textContent ?? '',
      selector: Boolean(document.querySelector('[data-selector-periodo]')), periodos: [...document.querySelectorAll('[data-periodo]')].map((b) => b.textContent.trim()),
      tarjetas: [...document.querySelectorAll('[data-tarjetas] [data-cifra]')].map((c) => c.getAttribute('data-cifra')),
      orden: [...document.querySelectorAll('[data-seccion="inicio"] [data-selector-periodo], [data-seccion="inicio"] [data-tarjetas], [data-seccion="inicio"] [data-bloque], [data-seccion="inicio"] [data-respuestas-primera-vez]')].map((e) => e.getAttribute('data-bloque') || (e.getAttribute('data-respuestas-primera-vez') !== null ? 'primera-vez' : e.getAttribute('data-tarjetas') !== null ? 'tarjetas' : 'periodo')),
      sinBandera: document.querySelectorAll('[data-seccion="inicio"] [data-bandera="sin"]').length, banderas: [...document.querySelectorAll('[data-seccion="inicio"] [data-bandera]')].map((b) => b.getAttribute('data-bandera')),
      origenes: [...document.querySelectorAll('[data-origen]')].map((e) => e.getAttribute('data-origen')),
      pronto: Boolean(document.querySelector('[data-bloque="donde-viven"] [data-pronto]')), texto: document.querySelector('[data-seccion="inicio"]').innerText
    })`)
    debe(JSON.stringify(m.menu) === JSON.stringify(['Inicio', 'Reportes', 'Fotos de viajeros', 'Destinos pedidos', 'Ventas', 'Usuarios', 'Logros y sonidos']), 'menu', `el menú de Design (${m.menu.join(' · ')})`)
    debe(m.rojas.reportes === '3' && m.rojas.fotos === '12', 'menu', `las cifras rojas del menú son las del servidor (reportes ${m.rojas.reportes}, fotos ${m.rojas.fotos})`)
    debe(/^[A-Za-záéíóú]+ \d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic) \d{4}$/.test(m.fecha), 'fecha', `la fecha como Design («${m.fecha}»)`)
    debe(JSON.stringify(m.periodos.map((p) => p.replace(/\s+/g, ' '))) === JSON.stringify(['Últimos 7 días', 'Este mes', 'Últimos 30 días', 'Últimos 6 meses', 'Este año', 'Todo', 'Personalizado']), 'periodo', `el selector de periodo, con sus siete (${m.periodos.join(' · ')})`)
    debe(JSON.stringify(m.tarjetas) === JSON.stringify(['Reportes nuevos', 'Fotos pendientes', 'Pases hoy', 'Ingresos hoy', 'Usuarios', 'Con viaje']), 'inicio', `las seis tarjetas de Design, en su orden (${m.tarjetas.join(' · ')})`)
    debe(JSON.stringify(m.orden) === JSON.stringify(['periodo', 'tarjetas', 'pases-vendidos', 'lo-ultimo', 'primera-vez', 'desde-donde', 'donde-viven']), 'inicio', `los bloques de Inicio en el orden de Design (${m.orden.join(' → ')})`)
    debe(/\b3\b.*1 nuevo hoy · 1 esta semana|1 nuevo hoy · 1 esta semana/.test(m.texto) && /2 de 3/.test(m.texto) && /67 % de los usuarios/.test(m.texto), 'inicio', 'Usuarios «X nuevos hoy · X esta semana» y «Con viaje: 2 de 3» con su %')
    debe(/Pases vendidos · este mes/.test(m.texto) && /Desde dónde viajan/.test(m.texto) && /Dónde viven/.test(m.texto) && /España/.test(m.texto) && !m.pronto, 'inicio', '(V35B) los títulos dicen el periodo y «Dónde viven» enseña los países (con la 0091; sin ella, «Pronto»: pruebaV35B_personas)')
    debe(m.sinBandera === 0 && m.banderas.includes('es') && m.banderas.includes('mx'), 'banderas', `ninguna bandera en blanco; España y México con la suya (${[...new Set(m.banderas)].join(',')})`)
    debe(!PROHIBIDAS.test(m.texto), 'texto', 'en Inicio nunca sale «eur», «duo» ni «uno»')
    // El periodo cambia las cifras
    const antes = await J(a, `JSON.stringify({ barras: document.querySelectorAll('[data-grafico-pases] [data-barra]').length, titulo: document.querySelector('[data-bloque="pases-vendidos"] [data-titulo-bloque]').textContent })`)
    await clic(a, '[data-periodo="7d"]')
    await esperar(a, "document.querySelectorAll('[data-grafico-pases] [data-barra]').length === 7")
    const sieteD = await J(a, `JSON.stringify({ barras: document.querySelectorAll('[data-grafico-pases] [data-barra]').length, titulo: document.querySelector('[data-bloque="pases-vendidos"] [data-titulo-bloque]').textContent })`)
    debe(antes.barras === 20 && sieteD.barras === 7 && /últimos 7 días/.test(sieteD.titulo) && /este mes/.test(antes.titulo), 'periodo', `el selector cambia el gráfico (${antes.barras} → ${sieteD.barras} barras) y el título dice el periodo («${sieteD.titulo}»)`)
    // Personalizado con calendario
    await clic(a, '[data-periodo="custom"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-calendario]'))"), 'periodo', 'Personalizado abre el calendario')
    await clic(a, '[data-cal-dia="2026-11-03"]')
    await clic(a, '[data-cal-dia="2026-11-18"]')
    const tcal = await a.evaluar("document.querySelector('[data-cal-texto]').textContent")
    await clic(a, '[data-cal-aplicar]')
    await esperar(a, "document.querySelectorAll('[data-grafico-pases] [data-barra]').length === 16")
    const pers = await J(a, `JSON.stringify({ barras: document.querySelectorAll('[data-grafico-pases] [data-barra]').length, titulo: document.querySelector('[data-bloque="pases-vendidos"] [data-titulo-bloque]').textContent, chip: document.querySelector('[data-periodo="custom"]').textContent.trim() })`)
    debe(tcal === '3 nov – 18 nov' && pers.barras === 16 && /3 nov – 18 nov/.test(pers.titulo) && /3 nov – 18 nov/.test(pers.chip), 'periodo', `Personalizado: «${tcal}», [Aplicar] y el título dice «3 nov – 18 nov» (${pers.barras} días)`)
    await a.captura('docs/dias/V35A_capturas/_tmp_inicio.jpg')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/ventas'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-compra]'))"), 'ventas', 'Ventas sale')
    const m = await J(a, `JSON.stringify({
      tarjetas: [...document.querySelectorAll('[data-tarjetas] [data-cifra]')].map((c) => c.getAttribute('data-cifra')),
      orden: [...document.querySelectorAll('[data-seccion="ventas"] [data-selector-periodo], [data-seccion="ventas"] [data-tarjetas], [data-seccion="ventas"] [data-bloque]')].map((e) => e.getAttribute('data-bloque') || (e.getAttribute('data-tarjetas') !== null ? 'tarjetas' : 'periodo')),
      texto: document.querySelector('[data-seccion="ventas"]').innerText, sinBandera: document.querySelectorAll('[data-seccion="ventas"] [data-bandera="sin"]').length,
      estados: [...document.querySelectorAll('[data-compra]')].map((e) => e.getAttribute('data-compra')), fichas: document.querySelectorAll('[data-ver-ficha]').length, sinCuenta: Boolean(document.querySelector('[data-sin-cuenta]')),
      afil: [...document.querySelectorAll('[data-panel-afiliado]')].map((e) => e.getAttribute('data-panel-afiliado') + ':' + (e.getAttribute('href') || '').startsWith('https://')),
      pronto: document.querySelectorAll('[data-bloque="afiliados"] [data-pronto]').length
    })`)
    debe(JSON.stringify(m.tarjetas) === JSON.stringify(['Pases vendidos', 'Ingresos', 'Lo que te queda', 'Conversión']), 'ventas', `las cuatro tarjetas de Design (${m.tarjetas.join(' · ')})`)
    debe(JSON.stringify(m.orden) === JSON.stringify(['periodo', 'tarjetas', 'pases-por-dia', 'pases-por-destino', 'ultimas-compras', 'afiliados']), 'ventas', `los bloques de Ventas en el orden de Design (${m.orden.join(' → ')})`)
    debe(/Lo que te queda/i.test(m.texto) && /antes de impuestos/.test(m.texto) && /Comisión de Stripe: \d+,\d\d €/.test(m.texto) && /Devoluciones: 6,99 €/.test(m.texto) && /\d+ %/.test(m.texto) && /De los que crean un viaje compran el pase · \d+ de \d+ viajeros/.test(m.texto), 'ventas', '«Lo que te queda» con «antes de impuestos», «Comisión: pronto» y la conversión con sus datos')
    debe(/Pases por día · este mes/.test(m.texto) && /Pases por destino · este mes/.test(m.texto) && /Individual/.test(m.texto) && /Dúo/.test(m.texto) && /Grupo ×4/.test(m.texto), 'ventas', 'los bloques dicen el periodo; los pases son Individual · Dúo · Grupo')
    debe(m.estados.includes('regalado') && m.estados.includes('reembolsado') && m.estados.includes('comprado') && m.fichas >= 3 && m.sinCuenta, 'ventas', 'Últimas compras: Comprado, «Regalado», «Reembolsado», quién compró con enlace a su ficha, y «Sin cuenta asociada» donde no se sabe')
    debe(/\d+,\d\d €/.test(m.texto) && !/\d+\.\d\d €/.test(m.texto) && !PROHIBIDAS.test(m.texto), 'dinero', 'el dinero siempre con «€», coma y dos decimales; nunca «eur», «duo» ni «uno»')
    debe(m.sinBandera === 0, 'banderas', 'ninguna bandera en blanco en Ventas')
    debe(m.afil.join() === 'civitatis:true,stay22:true' && /Roma/.test(m.texto) && /ACTIV\./.test(m.texto), 'ventas', 'los dos botones a los paneles de Civitatis y Stay22, y (V35B) los clics por destino de verdad')
    await clic(a, '[data-ver-ficha]')
    await a.esp(600)
    debe(/\/admin\/usuarios\?ficha=u001/.test(await a.evaluar('location.pathname + location.search')), 'ventas', 'el nombre de quien compró abre su ficha')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/reportes'), ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-reporte]'))"), 'reportes', 'Reportes sale')
    const l = await J(a, `JSON.stringify({ n: document.querySelectorAll('[data-reporte]').length, quien: [...document.querySelectorAll('[data-quien]')].map((e) => e.textContent), desp: [...document.querySelectorAll('[data-desplegable]')].map((e) => e.getAttribute('data-desplegable')), nuevos: document.querySelector('[data-contador-nuevos]')?.textContent, estados: [...document.querySelectorAll('[data-reporte]')].map((e) => e.getAttribute('data-estado') + ':' + e.querySelector('[data-estado-pastilla]').textContent) })`)
    debe(l.n === 6 && l.desp.join() === 'tipo,estado' && /3 nuevos/.test(l.nuevos) && l.quien.includes('Sin cuenta') && l.quien.includes('Eric Peña'), 'reportes', `la lista: desplegables de Tipo y Estado, quién lo mandó y «3 nuevos» (${l.quien.join(', ')})`)
    debe(l.estados.every((e) => ({ nuevo: 'Nuevo', visto: 'Visto', hecho: 'Hecho', descartado: 'Descartado' })[e.split(':')[0]] === e.split(':')[1]), 'reportes', 'cada reporte dice su estado de verdad, con su nombre en español')
    await clic(a, '[data-reporte="a1"]')
    await esperar(a, "Boolean(document.querySelector('[data-reporte-abierto=\"a1\"]'))")
    const d = await J(a, `JSON.stringify({ texto: document.querySelector('[data-reporte-abierto]').innerText, contexto: [...document.querySelectorAll('[data-contexto] > span')].map((e) => e.innerText.trim()).join('|'), ficha: Boolean(document.querySelector('[data-reporte-abierto] [data-ver-ficha]')), sitio: Boolean(document.querySelector('[data-ver-sitio]')), comparacion: Boolean(document.querySelector('[data-comparacion]')), historial: document.querySelectorAll('[data-historial] [data-mensaje]').length, cajas: document.querySelectorAll('[data-texto-responder]').length, marcar: Boolean(document.querySelector('[data-marcar-hecho]')) })`)
    debe(/Desde DÍAS de su viaje «Roma 26–29 nov»/.test(d.texto) && /iPhone · Safari 17/.test(d.texto) && !/v 947e7f58|route ·/.test(d.texto), 'reportes', 'el contexto en palabras: desde dónde, aparato, si quiere respuesta (no «route · v 947e7f58»)')
    debe(d.ficha && d.sitio && d.comparacion && /EN LA APP/.test(d.texto) && /DICE EL VIAJERO/.test(d.texto) && /Horario en la app: 08:30–16:30/.test(d.texto), 'reportes', 'el enlace al sitio y lo que pone ahora la app frente a lo que dice el viajero')
    debe(d.historial >= 1 && d.cajas === 1 && d.marcar, 'reportes', 'el historial y UNA sola caja para contestar, con «y marcar como hecho»')
    // Contestar y marcar como hecho: el estado cambia en el detalle Y en la lista
    await a.evaluar(`(() => { const t = document.querySelector('[data-texto-responder]'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'Gracias, ya está arreglado'); t.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    await clic(a, '[data-marcar-hecho]')
    await clic(a, '[data-responder]')
    await esperar(a, "document.querySelector('[data-reporte-abierto]')?.getAttribute('data-estado') === 'hecho'")
    await a.esp(500)
    const e = await J(a, `JSON.stringify({ detalle: document.querySelector('[data-reporte-abierto]').getAttribute('data-estado'), lista: document.querySelector('[data-reporte="a1"]').getAttribute('data-estado'), pastilla: document.querySelector('[data-reporte="a1"] [data-estado-pastilla]').textContent, historial: document.querySelectorAll('[data-historial] [data-mensaje="tu"]').length })`)
    debe(e.detalle === 'hecho' && e.lista === 'hecho' && e.pastilla === 'Hecho' && e.historial === 1, 'reportes', `«y marcar como hecho»: el detalle y la LISTA dicen «Hecho» (no «visto»): ${e.detalle}/${e.lista}/${e.pastilla}; y la respuesta queda en el historial`)
    await clic(a, '[data-estado-boton="descartado"]')
    await esperar(a, "document.querySelector('[data-reporte=\"a1\"]')?.getAttribute('data-estado') === 'descartado'")
    debe(await a.evaluar("document.querySelector('[data-reporte=\"a1\"] [data-estado-pastilla]').textContent") === 'Descartado', 'reportes', 'y al cambiar a mano, la lista lo refleja al momento')
    await clic(a, '[data-reporte="a2"]')
    await esperar(a, "Boolean(document.querySelector('[data-reporte-abierto=\"a2\"]'))")
    const sc = await J(a, `JSON.stringify({ off: document.querySelector('[data-texto-responder]').disabled, texto: document.querySelector('[data-reporte-abierto]').innerText })`)
    debe(sc.off && /Sin cuenta/.test(sc.texto) && /No hay cuenta ni respuesta que enviar/.test(sc.texto), 'reportes', 'sin cuenta no se puede contestar y lo dice')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/destinos'), ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-pedido]'))"), 'destinos', 'Destinos pedidos sale')
    const m = await J(a, `JSON.stringify({ texto: document.querySelector('[data-seccion="destinos"]').innerText, selector: Boolean(document.querySelector('[data-selector-periodo]')), anadir: document.querySelector('[data-anadir-destino]')?.disabled, avisar: document.querySelectorAll('[data-avisar]').length, prox: document.querySelectorAll('[data-proximamente]').length, sin: [...document.querySelectorAll('[data-seccion="destinos"] [data-bandera="sin"]')].length })`)
    debe(m.selector && /Los más pedidos · este mes/.test(m.texto) && /Próximamente/.test(m.texto) && /Ya está disponible: avisarles/.test(m.texto) && /quieren que les avisemos/.test(m.texto), 'destinos', 'Destinos pedidos como Design: periodo, «Los más pedidos · este mes», Próximamente y [Ya está disponible: avisarles]')
    debe(m.anadir === false && m.prox === 3 && !/Pronto/.test(m.texto), 'destinos', '(V35B) «Añadir un destino», «Pasar a Próximamente» y «Quitar» están encendidos (con la 0091); la prueba de lo que hacen es pruebaV35B_pantalla')
    debe(m.sin <= 1, 'banderas', 'banderas de verdad (solo un destino sin país conocido, Tokio, lleva el hueco gris)')
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/fotos'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-seccion=\"fotos\"]'))"), 'fotos', 'Fotos de viajeros sale')
    debe(/Fotos de viajeros/.test(await a.evaluar("document.querySelector('main h1').textContent")), 'fotos', 'su título es «Fotos de viajeros»')
  } finally {
    a.cerrar()
  }
}
console.log('5. En el móvil (390): el desplegable del periodo y nada se sale')
for (const ruta of ['/admin', '/admin/ventas', '/admin/reportes', '/admin/destinos', '/admin/fotos']) {
  const a = await abrirApp(APP, { ruta: RUTA(ruta), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-seccion]'))")
    await a.esp(1500)
    const m = await J(a, `JSON.stringify({ ancho: document.documentElement.scrollWidth, desplegable: Boolean(document.querySelector('[data-periodo-desplegable]')), pastillas: document.querySelectorAll('[data-periodo]').length })`)
    const lleva = ['/admin', '/admin/ventas', '/admin/destinos'].includes(ruta)
    debe(m.ancho <= 391, 'movil', `${ruta}: sin desplazamiento lateral (${m.ancho} de 390)`)
    if (lleva) debe(m.desplegable && m.pastillas === 0, 'movil', `${ruta}: el periodo es un desplegable`)
    if (ruta === '/admin/ventas') {
      await a.evaluar("(() => { const s = document.querySelector('[data-periodo-desplegable]'); s.value = '30d'; s.dispatchEvent(new Event('change', { bubbles: true })); return true })()")
      await esperar(a, "/últimos 30 días/.test(document.querySelector('[data-bloque=\"pases-por-dia\"]')?.innerText ?? '')")
      debe(/últimos 30 días/.test(await a.evaluar("document.querySelector('[data-bloque=\"pases-por-dia\"]').innerText")), 'movil', 'el desplegable del móvil cambia el periodo')
    }
  } finally {
    a.cerrar()
  }
}

/* ───────── 6. Sin ser administrador ───────── */
console.log('6. Sin ser administrador: nada')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/ventas'), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5, antes: "try{sessionStorage.setItem('trazo:demo-no-admin','1')}catch(e){}" })
  try {
    const sale = await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))")
    debe(sale && !(await a.evaluar("Boolean(document.querySelector('[data-seccion]'))")), 'solo_admin', 'quien no es administrador solo ve «Esta página es solo para administradores»')
  } finally {
    a.cerrar()
  }
  for (const r of ['/api/admin/inicio', '/api/admin/ventas', '/api/admin/reportes', '/api/admin/destinos', '/api/admin/usuarios']) {
    const x = await fetch(`${APP}${r}`).catch(() => null)
    debe(x === null || [401, 403, 503].includes(x.status), 'solo_admin', `${r} sin sesión: ${x?.status ?? 'sin respuesta'} (no 200)`)
  }
}
for (const f of fs.readdirSync('docs/dias/V35A_capturas')) if (f.startsWith('_tmp_')) fs.unlinkSync(`docs/dias/V35A_capturas/${f}`)
console.log(`\nPrueba de la Tanda V35A: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
