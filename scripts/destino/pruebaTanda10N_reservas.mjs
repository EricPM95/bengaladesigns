// La prueba de la Tanda 10N, parte D1 (§8): RESERVAS del invitado = la misma pantalla que la del dueño, sin poder tocar lo que comparte el grupo; las entradas, de cada uno; «¿Para quién es?»;
// «Reservada ✓» / «Comprar entrada» en DÍAS; los avisos de la campana; la entrada del invitado que no cuadra con la ruta.
// Hace falta el servidor y la app (abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs). Guarda las capturas en docs/dias/capturas_jutrip/10n_reservas_*.jpg.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10N_reservas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

/* ───────────────────────── 1. Lo que se ve en el código ───────────────────────── */
{
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(!/Lo que pagaste en total/.test(hoja), 'formulario', 'fuera «Lo que pagaste en total, todas las personas.» del formulario de la entrada')
  debe(/¿Para quién es\?/.test(hoja) && /paraQuienVisible/.test(hoja) && /grupo\.compartido && !esInvitado/.test(hoja), 'formulario', '«¿Para quién es?» solo en un viaje compartido y solo para el dueño')
  debe(/btn-champan/.test(hoja.slice(hoja.indexOf('data-guardar-reserva') - 200, hoja.indexOf('data-guardar-reserva') + 900)), 'formulario', 'el botón [Guardar · …] del formulario es champán (btn-champan)')
  debe(/PastillaElegir/.test(hoja), 'formulario', 'las pastillas de «¿Para quién es?» son las de «Elegir» (azul oscuro con su ✓)')
  const panel = sinComentarios(leer('src/components/route/ReservasPanel.tsx'))
  debe(/<ZonaGris activo=\{grupo\.esInvitado\}/.test(panel) && !/ReservasSoloVer/.test(panel), 'misma_pantalla', 'RESERVAS del invitado es la misma pantalla (ReservasPanel) con Llegada y Alojamiento en una ZonaGris')
  debe(!fs.existsSync('src/components/route/ReservasSoloVer.tsx'), 'misma_pantalla', 'la pantalla pobre «ReservasSoloVer» ya no existe')
  const todo = ['src/components/route/ReservasPanel.tsx', 'src/components/route/reservas/EntradasYFreeTour.tsx', 'src/components/route/reservas/ZonaGris.tsx'].map(leer).join('\n')
  debe(!/Aquí solo se mira/.test(todo), 'misma_pantalla', 'fuera «Esto es lo que ha reservado Eric. Aquí solo se mira.»')
  const mig = leer('supabase/migrations/0038_reservas_para_quien.sql')
  debe(/reservas_invitado/.test(mig) && /row level security/.test(mig) && !/avisos_tipo_check/.test(mig), 'migracion', 'la 0038 crea reservas_invitado con RLS y no toca la lista de tipos de aviso (es de la 0035)')
  const textos = await import('../../shared/avisos/textos.js')
  const dentro = textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { quien: 'Eric', sitio: 'el Coliseo', dia: 'jueves 26', hora: '08:00', incluido: true } })
  const fuera = textos.textoDelAviso({ tipo: 'reserva_grupo', payload: { quien: 'Eric', sitio: 'el Coliseo', dia: 'jueves 26', hora: '08:00', incluido: false } })
  debe(dentro === 'Eric ha reservado el Coliseo para ti: jueves 26, 8:00.', 'avisos', `aviso del incluido: «${dentro}»`)
  debe(fuera === 'Eric ha reservado el Coliseo el jueves 26 a las 8:00.', 'avisos', `aviso del no incluido: «${fuera}»`)
}

/* ───────────────────────── 2. La app ───────────────────────── */
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
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
  await a.evaluar("Promise.all([import('/src/store/useResumenVueloStore.ts'), import('/src/store/useViajeCompartido.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-marta', nombre: 'Marta', foto: null, esAdmin: false, permiso: 'recomendar' },
]
/** Quién soy: 'eric' (dueño) o 'ana' / 'luis' (invitados); [] = viaje sin compartir. */
const ponerGente = (a, yo) =>
  a.evaluar(`(() => {
    const yo = ${JSON.stringify(yo)}
    const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
    sessionStorage.removeItem('trazo:invitado')
    sessionStorage.removeItem('trazo:permiso')
    if (yo && yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar') }
    window.__viaje.getState().poner({ gente: yo ? g : [] })
    return true
  })()`)
const irAReservas = async (a) => {
  await a.evaluar("window.__ruta.getState().setMode('bookings'); true")
  await a.esp(1500)
}
const irA = async (a, modo) => {
  await a.evaluar(`window.__ruta.getState().setMode('${modo}'); true`)
  await a.esp(1500)
}
const abrirBloque = async (a, bloque) => {
  for (let n = 0; n < 40; n++) {
    const hecho = await a.evaluar(`(() => { const b = document.querySelector('[data-blk="${bloque}"]'); const cab = b && b.firstElementChild; if (!cab) return false; if (b.children.length < 2) cab.click(); return true })()`)
    if (hecho) return true
    await a.esp(500)
  }
  return false
}
const botonConTexto = (re, dentro = 'document') => `(() => { const raiz = ${dentro}; if (!raiz) return false; const b = Array.from(raiz.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`

const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
try {
  await preparar(a)
  await a.evaluar('window.__errs = []; const oe = console.error; console.error = (...x) => { window.__errs.push(x.map((y) => (y && y.stack) || String(y)).join(" ").slice(0, 700)); oe(...x) }; true')
  const nombreColiseo = await a.evaluar(`(async () => {
    const { buildEntradasBloque } = await import('/src/lib/bookings.ts')
    const { fetchDestinationExcursions } = await import('/src/lib/destinationExcursions.ts').catch(() => ({}))
    return null
  })()`).catch(() => null)
  void nombreColiseo

  /* — Dueño, viaje SIN compartir: el formulario es el de siempre — */
  await ponerGente(a, '')
  await irAReservas(a)
  await abrirBloque(a, 'entradas')
  await a.esp(1200)
  const filaColiseo = await a.evaluar(`(() => {
    const bloque = document.querySelector('[data-blk="entradas"]')
    const botones = Array.from(bloque?.querySelectorAll('button') ?? []).filter((b) => /Añádela/.test(b.textContent || ''))
    const tarjeta = (b) => b.closest('[class*="min-h-"]')
    const c = botones.find((b) => /Coliseo/.test(tarjeta(b)?.textContent || ''))
    return c ? (tarjeta(c)?.textContent || '').slice(0, 80) : null
  })()`)
  debe(Boolean(filaColiseo), 'app', `en RESERVAS aparece la entrada del Coliseo (${filaColiseo})`)
  await a.evaluar(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')); b.click(); return true })()`)
  await a.esp(1500)
  const sinCompartir = await a.evaluar(`(() => {
    const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    if (!hoja) return null
    const g = hoja.querySelector('[data-guardar-reserva]')
    const est = g ? getComputedStyle(g) : null
    return { paraQuien: Boolean(hoja.querySelector('[data-para-quien]')), pagaste: /Lo que pagaste en total/.test(hoja.textContent || ''), precio: /Precio \\(opcional\\)/.test(hoja.textContent || ''), fondo: est?.backgroundImage ?? '', color: est?.color ?? '' }
  })()`)
  debe(sinCompartir && sinCompartir.paraQuien === false, 'sin_compartir', 'en un viaje sin compartir NO sale «¿Para quién es?»')
  debe(sinCompartir && sinCompartir.pagaste === false && sinCompartir.precio === true, 'sin_compartir', 'sin «Lo que pagaste en total, todas las personas.» pero con «Precio (opcional)»')
  debe(sinCompartir && /linear-gradient/.test(sinCompartir.fondo) && /111, 78, 55/.test(sinCompartir.color), 'champan', `el botón Guardar está en champán (${sinCompartir?.fondo?.slice(0, 40)} · ${sinCompartir?.color})`)
  await a.captura(path.join(SALIDA, '10n_reservas_dueno_sin_compartir.jpg'))
  await a.evaluar("document.querySelector('[aria-labelledby=\"add-reservation-heading\"] button[aria-label=\"Cerrar\"]')?.click(); true")
  await a.esp(600)

  /* — Dueño, viaje compartido (4 personas): «¿Para quién es?» — */
  await ponerGente(a, 'eric')
  await a.esp(800)
  await a.evaluar(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')); b.click(); return true })()`)
  await a.esp(1500)
  const pq = () =>
    a.evaluar(`(() => {
      const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
      const bloque = hoja?.querySelector('[data-para-quien]')
      if (!bloque) return null
      const pastillas = Array.from(bloque.querySelectorAll('[data-elegir-pastilla]'))
      const todo = Array.from(hoja.querySelectorAll('*'))
      const orden = (sel) => todo.indexOf(hoja.querySelector(sel))
      return {
        cuenta: bloque.querySelector('[data-para-quien-cuenta]')?.textContent?.trim(),
        nombres: pastillas.map((p) => (p.textContent || '').trim()),
        marcadas: pastillas.filter((p) => p.dataset.elegida === '1').map((p) => (p.textContent || '').trim()),
        fondoMarcada: getComputedStyle(pastillas.find((p) => p.dataset.elegida === '1')).backgroundColor,
        despuesDeLaDisponibilidad: orden('[data-aviso="disponibilidad"]') < orden('[data-para-quien]'),
        antesDelPrecio: orden('[data-para-quien]') < todo.indexOf(Array.from(hoja.querySelectorAll('span')).find((s) => /Precio \\(opcional\\)/.test(s.textContent || ''))),
        pagaste: /Lo que pagaste en total/.test(hoja.textContent || ''),
        filas: new Set(pastillas.map((p) => Math.round(p.getBoundingClientRect().top))).size,
      }
    })()`)
  let est = await pq()
  debe(est && est.nombres.join('|') === '✓Eric|Ana|Luis|Marta'.replace('✓', '') && est.cuenta === '· 1 de 4', 'para_quien', `cuatro pastillas, el dueño marcado y «1 de 4» (${JSON.stringify(est)})`)
  debe(est && est.marcadas.join('|') === 'Eric', 'para_quien', 'el dueño sale ya marcado')
  debe(est && /28, 34, 48/.test(est.fondoMarcada), 'para_quien', `la pastilla marcada va en azul oscuro (${est?.fondoMarcada})`)
  debe(est && est.despuesDeLaDisponibilidad && est.antesDelPrecio, 'para_quien', 'va después de «Recuerda revisar la disponibilidad…» y antes del precio')
  debe(est && est.pagaste === false, 'para_quien', 'sin «Lo que pagaste en total» tampoco en el viaje compartido')
  await a.evaluar(`(() => { const hoja = document.querySelector('#add-reservation-heading').closest('[role="dialog"]'); Array.from(hoja.querySelectorAll('[data-elegir-pastilla]')).find((p) => /Ana/.test(p.textContent)).click(); return true })()`)
  await a.esp(400)
  est = await pq()
  debe(est && est.cuenta === '· 2 de 4' && est.marcadas.join('|') === 'Eric|Ana', 'para_quien', `marcar a Ana: «2 de 4» (${est?.cuenta})`)
  // el dueño no se puede desmarcar
  await a.evaluar(`(() => { const hoja = document.querySelector('#add-reservation-heading').closest('[role="dialog"]'); Array.from(hoja.querySelectorAll('[data-elegir-pastilla]')).find((p) => /Eric/.test(p.textContent)).click(); return true })()`)
  est = await pq()
  debe(est && est.marcadas.includes('Eric'), 'para_quien', 'el dueño no se puede desmarcar de su propia entrada')
  await a.captura(path.join(SALIDA, '10n_reservas_dueno_para_quien.jpg'))
  // El día y la hora de la entrada (el primer día del viaje que no esté cerrado y las 08:00 o la primera hora de la rueda).
  const guardada = await a.evaluar(`(async () => {
    const hoja = document.querySelector('#add-reservation-heading').closest('[role="dialog"]')
    const fichas = Array.from(hoja.querySelectorAll('[role="group"] button')).filter((b) => !b.disabled)
    // el 2.º día disponible (así la entrada no coincide con el día en que el motor ya tenía el Coliseo)
    ;(fichas[1] ?? fichas[0]).click()
    await new Promise((r) => setTimeout(r, 1500))
    const g = hoja.querySelector('[data-guardar-reserva]')
    const texto = g.textContent
    for (let i = 0; i < 30 && g.disabled; i++) await new Promise((r) => setTimeout(r, 300))
    g.click()
    await new Promise((r) => setTimeout(r, 1200))
    const ok = Array.from(document.querySelectorAll('button')).find((b) => /^De acuerdo$/.test((b.textContent || '').trim()))
    ok?.click()
    await new Promise((r) => setTimeout(r, 2500))
    const reservas = window.__ruta.getState().reservations
    return { texto, reservas: reservas.map((r) => ({ id: r.id, refId: r.refId, placeNames: r.placeNames, dateIso: r.dateIso, time: r.time, paraQuien: r.paraQuien })) }
  })()`)
  const ownerRes = guardada.reservas.find((r) => /Coliseo/.test(r.refId))
  debe(Boolean(ownerRes) && JSON.stringify(ownerRes.paraQuien) === JSON.stringify(['p-eric', 'p-ana']), 'para_quien', `la entrada del Coliseo queda para Eric y Ana (${JSON.stringify(ownerRes?.paraQuien)})`)
  const nReservasDueno = guardada.reservas.length
  const [h, m] = (ownerRes?.time ?? '00:00').split(':')
  const horaOwner = `${Number(h)}:${m}`
  const diaOwner = await a.evaluar(`(async () => { const { diaProsa } = await import('/src/lib/nombreDeDia.ts'); const { dayOfReservation } = await import('/src/lib/bookings.ts'); const r = window.__ruta.getState().route; const res = window.__ruta.getState().reservations.find((x) => /Coliseo/.test(x.refId)); return diaProsa(r, dayOfReservation(r, res).dayNumber) })()`)

  await irAReservas(a)
  await a.esp(1000)
  const lineaDueno = await a.evaluar(`document.querySelector('[data-entrada-fila*="Coliseo"]')?.textContent ?? null`)
  debe(lineaDueno && /Para Eric, Ana/.test(lineaDueno), 'para_quien', `el dueño ve en su línea «Para Eric, Ana» (${lineaDueno})`)
  await a.captura(path.join(SALIDA, '10n_reservas_dueno_entradas.jpg'))

  /* — Ana (incluida): la misma pantalla, en gris, y «Reservada ✓» — */
  await ponerGente(a, 'ana')
  await a.esp(1500)
  await irAReservas(a)
  await a.esp(1200)
  const gris = await a.evaluar(`(() => {
    const zonas = Array.from(document.querySelectorAll('[data-solo-lectura]'))
    const bloques = zonas.map((z) => z.querySelector('[data-blk]')?.dataset.blk)
    const cab = document.querySelector('[data-blk="llegada"]')?.firstElementChild
    return { bloques, titulo: Array.from(document.querySelectorAll('span')).some((s) => /^Reservas$/.test((s.textContent || '').trim())), llegadaVisible: Boolean(cab), solo: /Aquí solo se mira/.test(document.body.textContent || ''), entradas: Boolean(document.querySelector('[data-blk="entradas"]')) }
  })()`)
  debe(gris.bloques.includes('llegada') && gris.bloques.includes('aloj'), 'gris', `Llegada y vuelta y Alojamiento van en zona gris (${gris.bloques.join(',')})`)
  debe(gris.titulo && gris.entradas && !gris.solo, 'misma_pantalla', 'el invitado ve la misma pantalla Reservas (con su bloque de Entradas) y sin «Aquí solo se mira»')
  await abrirBloque(a, 'llegada')
  await abrirBloque(a, 'aloj')
  await a.esp(900)
  const tocar = await a.evaluar(`(async () => {
    const zona = document.querySelector('[data-blk="llegada"]').closest('[data-solo-lectura]')
    const botones = Array.from(zona.querySelectorAll('button')).filter((b) => !b.hasAttribute('data-activo-invitado'))
    const inputs = Array.from(zona.querySelectorAll('input'))
    const opacidades = botones.map((b) => Number(getComputedStyle(b).opacity))
    const antes = document.querySelectorAll('[role="dialog"]').length
    const rueda = botones.find((b) => /Elige la hora|Llega|Sale/.test(b.textContent || ''))
    rueda?.click()
    await new Promise((r) => setTimeout(r, 500))
    const despues = document.querySelectorAll('[role="dialog"]').length
    const linea = zona.querySelector('[data-esto-lo-cambia]')?.textContent ?? null
    return { nBotones: botones.length, nInputs: inputs.length, gris: opacidades.every((o) => o <= 0.6), inputsLectura: inputs.every((i) => i.readOnly), antes, despues, linea }
  })()`)
  debe(tocar.nBotones > 0 && tocar.gris, 'gris', `los botones de Llegada y vuelta están en gris (${tocar.nBotones} botones)`)
  debe(tocar.nInputs === 0 || tocar.inputsLectura, 'gris', 'las casillas de escribir son de solo lectura')
  debe(tocar.antes === tocar.despues, 'gris', 'al tocar un campo o botón de editar no se abre ninguna hoja')
  debe(tocar.linea === 'Esto lo cambia Eric', 'gris', `y sale la línea corta «Esto lo cambia Eric» (${tocar.linea})`)
  const aloj = await a.evaluar(`(() => {
    const zona = document.querySelector('[data-blk="aloj"]').closest('[data-solo-lectura]')
    const buscar = Array.from(zona.querySelectorAll('button')).find((b) => /Buscar alojamiento/.test(b.textContent || ''))
    const otros = Array.from(zona.querySelectorAll('button')).filter((b) => !b.hasAttribute('data-activo-invitado') && !/Buscar alojamiento/.test(b.textContent || ''))
    return { buscarActivo: Boolean(buscar) && buscar.hasAttribute('data-activo-invitado') && Number(getComputedStyle(buscar).opacity) === 1, otrosGris: otros.every((b) => Number(getComputedStyle(b).opacity) <= 0.6), hayOtros: otros.length }
  })()`)
  debe(aloj.buscarActivo, 'alojamiento', 'sin alojamiento del dueño, [Buscar alojamiento] sale activo para el invitado')
  debe(aloj.hayOtros === 0 || aloj.otrosGris, 'alojamiento', 'y lo demás del Alojamiento sale en gris')
  await a.captura(path.join(SALIDA, '10n_reservas_invitado_gris.jpg'))
  // El alojamiento del dueño puesto: en gris con su dato.
  await a.evaluar(`(async () => { const { useRouteStore } = await import('/src/store/useRouteStore.ts'); const r = useRouteStore.getState().route; const seg = r.days[0].id; useRouteStore.getState().setAccommodationHotel(seg, { id: 'h1', name: 'Hotel Artemide', price: null }); return true })()`)
  await a.esp(900)
  const conHotel = await a.evaluar(`(() => { const zona = document.querySelector('[data-blk="aloj"]').closest('[data-solo-lectura]'); const b = Array.from(zona.querySelectorAll('button')); return { dato: /Hotel Artemide/.test(zona.textContent || ''), buscar: b.some((x) => /Buscar alojamiento/.test(x.textContent || '')), todosGris: b.every((x) => Number(getComputedStyle(x).opacity) <= 0.6) } })()`)
  debe(conHotel.dato && !conHotel.buscar && conHotel.todosGris, 'alojamiento', 'con el alojamiento del dueño puesto: sale el dato y todo en gris (sin [Buscar alojamiento])')
  await a.evaluar(`(async () => { const { useRouteStore } = await import('/src/store/useRouteStore.ts'); const r = useRouteStore.getState().route; useRouteStore.getState().setAccommodationHotel(r.days[0].id, null); return true })()`)

  await abrirBloque(a, 'entradas')
  await a.esp(1000)
  const filaAna = await a.evaluar(`(() => { const f = document.querySelector('[data-entrada-fila*="Coliseo"]'); return f ? { texto: f.textContent, cambiar: Array.from(f.querySelectorAll('button')).some((b) => /Cambiar/.test(b.textContent)) } : null })()`)
  debe(filaAna && /Eric la ha reservado para ti/.test(filaAna.texto) && !filaAna.cambiar, 'incluida', `Ana (incluida) ve el Coliseo reservado, «Eric la ha reservado para ti», sin Cambiar (${filaAna?.texto})`)
  await a.captura(path.join(SALIDA, '10n_reservas_invitada_incluida.jpg'))
  // DÍAS: «Reservada ✓»
  await irA(a, 'days')
  const etq = await a.evaluar(`(async () => {
    const { useRouteStore } = await import('/src/store/useRouteStore.ts')
    const r = useRouteStore.getState().route
    const res = useRouteStore.getState().reservations.find((x) => /Coliseo/.test(x.refId))
    const { dayOfReservation } = await import('/src/lib/bookings.ts')
    useRouteStore.getState().setActiveDayId?.(dayOfReservation(r, res).id)
    return true
  })()`)
  void etq
  const etiquetaAna = await etiquetaDeLaParada(a)
  debe(etiquetaAna === 'reservada:Reservada ✓', 'dias', `en DÍAS, Ana ve la etiqueta corta «Reservada ✓» en el Coliseo (${etiquetaAna})`)
  await a.captura(path.join(SALIDA, '10n_reservas_dias_etiqueta_incluida.jpg'))
  // La campana de Ana
  const campanaAna = await leerCampana(a)
  debe(campanaAna.some((t) => t === `Eric ha reservado el Coliseo para ti: ${diaOwner}, ${horaOwner}.`), 'campana', `la campana de Ana: «Eric ha reservado el Coliseo para ti: ${diaOwner}, ${horaOwner}.» (${JSON.stringify(campanaAna)})`)
  const botonesAna = await a.evaluar(`Array.from(document.querySelectorAll('[role="dialog"] button')).map((b) => (b.textContent || '').trim())`)
  debe(!botonesAna.includes('Reservar la mía a la misma hora') && !botonesAna.includes('Ya la tengo'), 'campana', 'al incluido no le salen los botones de comprar la suya')
  await cerrarCampana(a)

  /* — Luis (no incluido): «Comprar entrada» y su aviso — */
  await ponerGente(a, 'luis')
  await a.esp(1500)
  const etiquetaLuis = await etiquetaDeLaParada(a)
  debe(etiquetaLuis === 'comprar:Comprar entrada', 'dias', `en DÍAS, Luis (no incluido) ve «Comprar entrada» en el Coliseo (${etiquetaLuis})`)
  const colorLuis = await a.evaluar(`getComputedStyle(document.querySelector('[data-etiqueta-entrada="comprar"]')).backgroundColor`)
  const colorAna = 'rgb(65, 134, 87)'
  void colorAna
  debe(/^rgb\((?!.*(65, 134, 87))/.test(colorLuis), 'dias', `y en frambuesa (${colorLuis})`)
  await a.captura(path.join(SALIDA, '10n_reservas_dias_etiqueta_no_incluido.jpg'))
  const campanaLuis = await leerCampana(a)
  debe(campanaLuis.some((t) => t === `Eric ha reservado el Coliseo el ${diaOwner} a las ${horaOwner}.`), 'campana', `la campana de Luis: «Eric ha reservado el Coliseo el ${diaOwner} a las ${horaOwner}.» (${JSON.stringify(campanaLuis)})`)
  const botonesLuis = await a.evaluar(`Array.from(document.querySelectorAll('[role="dialog"] button')).map((b) => (b.textContent || '').trim())`)
  debe(botonesLuis.includes('Reservar la mía a la misma hora') && botonesLuis.includes('Ya la tengo'), 'campana', 'y lleva [Reservar la mía a la misma hora] y [Ya la tengo]')
  await a.captura(path.join(SALIDA, '10n_reservas_campana_no_incluido.jpg'))
  // Contar / leer
  const cuenta = () => a.evaluar(`(() => { const b = document.querySelector('[data-campana-cuenta], [aria-label*="aviso" i] [class*="rounded-full"]'); return document.body.innerHTML.length })()`)
  void cuenta
  const leido = await a.evaluar(`(async () => {
    const { useNoticesStore } = await import('/src/store/useNoticesStore.ts')
    const id = Array.from(window.__ruta.getState().reservations).map((r) => 'reserva-grupo:' + r.id).find((x) => x)
    const antes = useNoticesStore.getState().readIds.includes(id)
    const marcar = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => /Marcar como leído/.test(b.textContent || ''))
    marcar?.click()
    await new Promise((r) => setTimeout(r, 400))
    const despues = useNoticesStore.getState().readIds.includes(id)
    const sigue = /ha reservado el Coliseo/.test(document.querySelector('[role="dialog"]')?.textContent || '')
    return { antes, despues, sigue }
  })()`)
  debe(leido.antes === false && leido.despues === true && leido.sigue === true, 'campana', 'al leerlo deja de contar (queda en leídos) y se queda en la lista')
  await cerrarCampana(a)

  // [Reservar la mía a la misma hora] desde RESERVAS: día y hora ya elegidos
  await irAReservas(a)
  await abrirBloque(a, 'entradas')
  await a.esp(1000)
  const filaLuis = await a.evaluar(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).find((x) => /Reservar la mía a la misma hora/.test(x.textContent || '')); const t = b?.closest('[class*="min-h-"]')?.textContent ?? null; return t })()`)
  debe(filaLuis && /Coliseo/.test(filaLuis) && new RegExp(`Eric va el ${diaOwner} a las ${horaOwner}`).test(filaLuis), 'misma_hora', `en RESERVAS, la tarjeta del Coliseo de Luis dice «Eric va el ${diaOwner} a las ${horaOwner}» con [Reservar la mía a la misma hora] (${filaLuis})`)
  await a.captura(path.join(SALIDA, '10n_reservas_invitado_misma_hora_tarjeta.jpg'))
  await a.evaluar(botonConTexto('/Reservar la mía a la misma hora/', `document.querySelector('[data-blk="entradas"]')`))
  await a.esp(1800)
  const abierta = await a.evaluar(`(() => {
    const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    if (!hoja) return null
    const marcado = Array.from(hoja.querySelectorAll('[role="group"] button')).find((b) => b.getAttribute('aria-pressed') === 'true')
    const rueda = hoja.querySelector('[data-time-wheel], [role="listbox"]')
    const g = hoja.querySelector('[data-guardar-reserva]')
    return { igual: hoja.querySelector('[data-igual-que]')?.textContent ?? null, dia: marcado?.textContent ?? null, boton: g?.textContent ?? null, paraQuien: Boolean(hoja.querySelector('[data-para-quien]')), modo: g?.dataset.guardarReserva }
  })()`)
  debe(abierta && new RegExp(`Eric va el ${diaOwner} a las ${horaOwner}`).test(abierta.igual ?? ''), 'misma_hora', `la compra se abre diciendo lo del dueño (${abierta?.igual})`)
  debe(abierta && new RegExp(`Abrir la compra · 0?${horaOwner}`).test(abierta.boton ?? '') && abierta.modo === 'comprar', 'misma_hora', `con la hora ya elegida (${abierta?.boton})`)
  const numDiaOwner = diaOwner.split(' ')[1]
  debe(abierta && new RegExp(`(^|\\D)${numDiaOwner}(\\D|$)`).test(abierta.dia ?? ''), 'misma_hora', `y el día ya elegido (${abierta?.dia} · el del dueño es el ${diaOwner})`)
  debe(abierta && abierta.paraQuien === false, 'misma_hora', 'quien compra la suya no ve «¿Para quién es?»')
  await a.captura(path.join(SALIDA, '10n_reservas_invitado_misma_hora_compra.jpg'))
  // Abrir la compra y guardarla: es suya, no cambia las reservas del dueño.
  await a.evaluar(`(() => { window.open = () => null; return true })()`)
  await a.evaluar(`document.querySelector('[data-guardar-reserva]').click(); true`)
  await a.esp(800)
  const trasAbrir = await a.evaluar(`document.querySelector('[data-guardar-reserva]')?.dataset.guardarReserva ?? null`)
  debe(trasAbrir === 'guardar', 'misma_hora', 'tras abrir la compra, el botón pasa a [Guardar · hora] para apuntar la suya')
  await a.evaluar(`document.querySelector('[data-guardar-reserva]').click(); true`)
  await a.esp(1200)
  const propias = await a.evaluar(`(async () => { const { useMisReservas } = await import('/src/store/useMisReservas.ts'); return { mias: useMisReservas.getState().lista.map((r) => ({ refId: r.refId, dateIso: r.dateIso, time: r.time, paraQuien: r.paraQuien })), dueno: window.__ruta.getState().reservations.length } })()`)
  debe(propias.mias.length === 1 && /Coliseo/.test(propias.mias[0].refId) && propias.mias[0].time === ownerRes.time && propias.mias[0].dateIso === ownerRes.dateIso, 'misma_hora', `la entrada de Luis queda en SU lista con el mismo día y hora (${JSON.stringify(propias.mias)})`)
  debe(propias.dueno === nReservasDueno, 'misma_hora', 'y NO entra en las reservas del dueño (el viaje sigue con las mismas)')
  const lineaLuis = await a.evaluar(`document.querySelector('[data-entrada-fila*="Coliseo"]')?.textContent ?? null`)
  debe(lineaLuis && /Cambiar/.test(lineaLuis) && !/Eric la ha reservado/.test(lineaLuis), 'misma_hora', `Luis ve ahora SU entrada del Coliseo como reservada, con Cambiar (${lineaLuis})`)
  await a.captura(path.join(SALIDA, '10n_reservas_invitado_la_suya.jpg'))
  const etiquetaLuis2 = await (async () => { await irA(a, 'days'); return etiquetaDeLaParada(a) })()
  debe(etiquetaLuis2 === 'reservada:Reservada ✓', 'dias', `con la suya comprada, Luis pasa a ver «Reservada ✓» (${etiquetaLuis2})`)

  /* — La de Luis no cuadra con la ruta — */
  await a.evaluar(`(async () => {
    const { useMisReservas } = await import('/src/store/useMisReservas.ts')
    const r = window.__ruta.getState().route
    const orig = useMisReservas.getState().lista[0]
    const otroDia = r.days.filter((d) => !d.isReturnLeg).find((d) => d.dayNumber !== window.__ruta.getState().reservations.find((x) => /Coliseo/.test(x.refId)) && true)
    const { addDaysToIso } = await import('/src/lib/dateRange.ts')
    const fecha = addDaysToIso(orig.dateIso, 1)
    useMisReservas.getState().anadir({ ...orig, id: 'res-luis-otro-dia', dateIso: fecha })
    return true
  })()`)
  await irAReservas(a)
  await abrirBloque(a, 'entradas')
  await a.esp(1200)
  const noCuadra = await a.evaluar(`document.querySelector('[data-entrada-no-cuadra]')?.textContent ?? null`)
  debe(noCuadra && /^Tu entrada del Coliseo es el .+, y en la ruta está el .+\.$/.test(noCuadra) && noCuadra.includes(diaOwner), 'no_cuadra', `si la entrada del invitado cae otro día, se le avisa en RESERVAS (${noCuadra})`)
  await a.captura(path.join(SALIDA, '10n_reservas_invitado_no_cuadra.jpg'))
  const campanaNoCuadra = await leerCampana(a)
  debe(campanaNoCuadra.some((t) => /^Tu entrada del Coliseo es el .+, y en la ruta está el .+\.$/.test(t)), 'no_cuadra', `y en la campana (${JSON.stringify(campanaNoCuadra.slice(0, 3))})`)
  await cerrarCampana(a)

  /* — El dueño no ve las entradas del invitado — */
  await ponerGente(a, 'eric')
  await irAReservas(a)
  await abrirBloque(a, 'entradas')
  await a.esp(900)
  const mismasDueno = await a.evaluar(`window.__ruta.getState().reservations.length`)
  debe(mismasDueno === nReservasDueno, 'suya', 'lo que compra el invitado es suyo: las reservas del dueño siguen siendo las mismas')
  const lineaDueno2 = await a.evaluar(`document.querySelector('[data-entrada-fila*="Coliseo"]')?.textContent ?? null`)
  debe(lineaDueno2 && !/Cambiar.*Cambiar/.test(lineaDueno2) && /Para Eric, Ana/.test(lineaDueno2), 'suya', 'y su RESERVAS sigue diciendo «Para Eric, Ana», sin rastro de la entrada de Luis')
} catch (e) {
  console.log('ERRS', await a.evaluar('JSON.stringify(window.__errs)').catch(() => '?'))
  throw e
} finally {
  a.cerrar()
}

async function etiquetaDeLaParada(a) {
  // Abre el día del Coliseo en DÍAS y lee la etiqueta corta de esa parada.
  await a.evaluar("window.__ruta.getState().setMode('days'); true")
  await a.esp(1200)
  for (let i = 0; i < 25; i++) {
    const t = await a.evaluar(`(() => { const e = document.querySelector('[data-etiqueta-entrada]'); return e ? e.dataset.etiquetaEntrada + ':' + e.textContent.trim() : null })()`)
    if (t) return t
    // Abre la pestaña DÍAS y el día de la reserva
    await a.evaluar(`(() => {
      const tab = Array.from(document.querySelectorAll('button, a')).find((b) => /^(Días|DÍAS|Itinerario)$/i.test((b.textContent || '').trim()))
      tab?.click()
      return true
    })()`)
    await a.esp(500)
    await a.evaluar(`(async () => {
      const { useRouteStore } = await import('/src/store/useRouteStore.ts')
      const { dayOfReservation } = await import('/src/lib/bookings.ts')
      const s = useRouteStore.getState()
      const res = s.reservations.find((x) => /Coliseo/.test(x.refId))
      const dia = res ? dayOfReservation(s.route, res) : null
      if (dia) s.setActiveDayId?.(dia.id)
      return true
    })()`)
    await a.esp(700)
  }
  return null
}
async function leerCampana(a) {
  await a.evaluar(`(() => { const b = document.querySelector('button[aria-label^="Avisos"]'); b?.click(); return Boolean(b) })()`)
  await a.esp(1200)
  return a.evaluar(`Array.from(document.querySelectorAll('[role="dialog"] .font-display, [role="dialog"] p')).map((e) => (e.textContent || '').trim())`)
}
async function cerrarCampana(a) {
  await a.evaluar(`document.querySelector('[role="dialog"][aria-labelledby="notices-heading"] button[aria-label="Cerrar"]')?.click(); true`)
  await a.esp(500)
}

/* ───────────────────────── Resultado ───────────────────────── */
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba de la Tanda 10N (D1, RESERVAS del invitado): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
