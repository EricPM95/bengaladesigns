// La prueba de la Tanda V41 (partes mías): «Mis viajes» sin quedarse viejo, el Perfil sin «Crear un viaje», el transporte desde el globo, la tarjeta de la excursión añadida, los dos botones del día de excursión y ningún aviso de obras.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV41_viajes.mjs
// Sin Supabase real (el Chrome de prueba lo tiene bloqueado) ni nada de nadie: la lista de viajes y la clasificación se imitan dentro de la página.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { abrirConViajes, abrirPerfil } from './_ayuda10F.mjs'

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
const CAP = 'docs/dias/V41_capturas'
const conCapturas = process.argv.includes('--capturas')
if (conCapturas) fs.mkdirSync(CAP, { recursive: true })

// ───────── 5. Las obras no se señalan (sin navegador) ─────────
const VETADO = /en obras|por obras|obras de (mejora|reforma|remodelaci[oó]n)|en restauraci[oó]n|andamios|remodelaci[oó]n/i
const destinos = leer('data/destinations.json')
debe(!VETADO.test(destinos), 'obras', 'data/destinations.json: ningún texto del viajero habla de obras, restauración, andamios ni remodelación')
debe(destinos.includes('"El museo del Barça tiene la colección de trofeos más impresionante de Europa"'), 'obras', 'Barcelona › Camp Nou: se queda solo «El museo del Barça tiene la colección de trofeos más impresionante de Europa»')
for (const f of ['data/pipeline_v2/roma.json', 'data/pipeline_v2/lanzarote.json']) debe(!VETADO.test(leer(f)), 'obras', `${f}: sin avisos de obras`)
debe(leer('data/dias/roma/_webs_oficiales_entradas.json').includes('cierres por obras'), 'obras', 'la nota interna de la Domus Aurea se queda (no la ve el viajero)')
debe(leer('CLAUDE.md').includes('En la app no se avisa de obras: cada sitio con su horario normal'), 'obras', 'la regla está apuntada en CLAUDE.md')

// ───────── Código de lo que cambia (sin navegador) ─────────
const cuerpo = leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
debe(!/data-crear-viaje-perfil/.test(cuerpo) && !/>\s*Crear un viaje\s*</.test(cuerpo), 'perfil', 'el código del Perfil ya no tiene el botón «Crear un viaje»')
const flujo = leer('src/components/trazo/TrazoFlow.tsx')
debe(flujo.includes('classifyInBackground(dest.name)') && flujo.includes('!state.archetype && !state.archetype_ambiguous'), 'transporte', 'al empezar el viaje, si el destino puesto de antemano no está clasificado, se clasifica')
debe(leer('src/lib/nuevoViaje.ts').includes('classifyInBackground(destino.nombre)'), 'transporte', 'empezarViajeNuevo(destino) clasifica el destino (globo, hoja del destino, [Crear viaje])')
const sync = leer('src/components/sync/TripSync.tsx')
debe(sync.includes('apuntarViajeEnLaLista(savedId, payload)') && sync.includes('refrescarListaDeViajes()'), 'viajes', 'TripSync apunta cada guardado en la lista y la vuelve a pedir al volver a la app')

// ───────── 2. Qué sale al abrir la app ─────────
debe(sync.includes("donde.tipo === 'nada' && cuentasActivas()") && sync.includes("setMode('today')") && sync.includes("donde.tipo === 'ruta'"), 'abrir', 'al abrir: de viaje HOY, con un viaje próximo ese viaje, sin ningún viaje el Perfil (con «¿A dónde te apetece ir?»)')
const dondeAbrir = leer('src/lib/dondeAbrir.ts')
debe(dondeAbrir.includes("tipo: 'hoy'") && dondeAbrir.includes("tipo: 'ruta'") && dondeAbrir.includes("{ tipo: 'nada' }"), 'abrir', 'dondeAbrir decide: hoy → HOY, por delante → ese viaje, ninguno → nada (el Perfil)')

// ───────── En el navegador ─────────
const { app } = await abrirConViajes()
try {
  // 4. «Mis viajes»: crear un viaje teniendo otro, y volver a abrir el otro.
  const r4 = JSON.parse(
    await app.evaluar(`(async () => {
      const { useSyncStore } = await import('/src/store/useSyncStore.ts')
      const { useRouteStore } = await import('/src/store/useRouteStore.ts')
      const { buildTripPayload } = await import('/src/components/sync/TripSync.tsx')
      const { apuntarViajeEnLaLista } = await import('/src/lib/listaDeViajes.ts')
      const { viajesDelPerfil } = await import('/src/lib/viajesPerfil.ts')
      const base = buildTripPayload()
      const clon = (fila, rutaId, destino, inicio, fin) => ({ id: fila, route: { ...base.route, id: rutaId, destination: destino, answers: { ...base.route.answers, dateRange: { start: inicio, end: fin } } }, bookings: base.bookings, wishlist: [], uiState: base.uiState, generationState: null })
      // Eric tiene Lanzarote: la lista del móvil trae solo ese.
      const lanzarote = clon('fila-lanzarote', 'ruta-lanzarote', 'Lanzarote', '2027-03-01', '2027-03-05')
      useSyncStore.getState().setSavedTrips([lanzarote])
      const antes = viajesDelPerfil(useSyncStore.getState().savedTrips, lanzarote.route).map((v) => v.destino)
      // Crea Roma (está abierto) y se guarda por primera vez: entra en la lista.
      apuntarViajeEnLaLista('fila-roma', base)
      // Abre OTRO viaje (Lanzarote): Roma ya no es «el abierto». Antes desaparecía; ahora sale.
      const conLanzaroteAbierto = viajesDelPerfil(useSyncStore.getState().savedTrips, lanzarote.route).map((v) => v.destino)
      // Un segundo guardado de Roma (cambia algo) la pone al día sin duplicarla.
      apuntarViajeEnLaLista('fila-roma', { ...base, route: { ...base.route, destination: 'Roma' } })
      const tras = useSyncStore.getState().savedTrips.map((v) => v.id)
      // Con Roma abierta y su copia vieja en la lista, manda la abierta.
      const mandaLaAbierta = viajesDelPerfil([{ ...base, id: 'fila-roma', route: { ...base.route, destination: 'Vieja' } }], base.route).map((v) => v.destino)
      useRouteStore.setState({ route: lanzarote.route })
      return JSON.stringify({ antes, conLanzaroteAbierto, tras, mandaLaAbierta })
    })()`),
  )
  debe(r4.antes.length === 1, 'viajes', `antes de crear, «Mis viajes» tiene 1 viaje (${r4.antes.join(', ')})`)
  debe(r4.conLanzaroteAbierto.length === 2 && r4.conLanzaroteAbierto.includes('Roma') && r4.conLanzaroteAbierto.includes('Lanzarote'), 'viajes', `al crear un segundo viaje y abrir el otro, salen los dos sin recargar (${r4.conLanzaroteAbierto.join(', ')})`)
  debe(r4.tras.filter((x) => x === 'fila-roma').length === 1 && r4.tras.length === 2, 'viajes', 'guardar otra vez no duplica el viaje en la lista')
  debe(r4.mandaLaAbierta.length === 1 && r4.mandaLaAbierta[0] === 'Roma', 'viajes', 'el viaje abierto manda sobre su copia vieja de la lista')
  // Lo mismo, en el Perfil de verdad.
  await abrirPerfil(app)
  await app.esp(1500)
  const perfil = JSON.parse(await app.evaluar(`JSON.stringify({ ver: document.querySelector('[data-numero-de-viajes]')?.innerText ?? '', filas: document.querySelectorAll('[data-fila-de-viajes] > *').length, botones: [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter((t) => /^Crear (un|mi) viaje$/i.test(t)), grande: Boolean(document.querySelector('[data-crear-viaje-perfil]')), texto: document.body.innerText.includes('Mis viajes') })`))
  debe(perfil.texto && /Ver todos \(2\)/.test(perfil.ver), 'viajes', `en el Perfil, «Ver todos (2)» sale con los dos viajes (${perfil.ver})`)
  debe(!perfil.grande && perfil.botones.length === 0, 'perfil', 'en el Perfil no hay botón «Crear un viaje» / «Crear mi viaje» bajo «Mis viajes»')
  if (conCapturas) await app.captura(`${CAP}/perfil_sin_crear_un_viaje.jpg`)
  // Cerrar y volver a abrir la app = volver a pedir la lista: lo que dice la nube sale (dos viajes), no una lista vieja.
  const reabrir = JSON.parse(
    await app.evaluar(`(async () => {
      const { useSyncStore } = await import('/src/store/useSyncStore.ts')
      const { viajesDelPerfil } = await import('/src/lib/viajesPerfil.ts')
      const { useRouteStore } = await import('/src/store/useRouteStore.ts')
      const guardados = useSyncStore.getState().savedTrips
      useSyncStore.getState().setSavedTrips(null)
      useSyncStore.getState().setSavedTrips(guardados)
      return JSON.stringify(viajesDelPerfil(useSyncStore.getState().savedTrips, useRouteStore.getState().route).map((v) => v.destino))
    })()`),
  )
  debe(reabrir.length === 2, 'viajes', `al cerrar y volver a abrir la app salen los dos viajes (${reabrir.join(', ')})`)

  // 5.2. Desde el globo (o la hoja del destino): el destino viene puesto y se clasifica, así el transporte acaba de cargar.
  const r52 = JSON.parse(
    await app.evaluar(`(async () => {
      const llamadas = []
      const f = window.fetch.bind(window)
      window.fetch = async (url, init) => {
        if (String(url).includes('/api/classify-destination')) { llamadas.push(JSON.parse(init.body).destination); return new Response(JSON.stringify({ archetype: 'urbano_clasico', is_region: false, ambiguous: false, requiere_coche: false, pase_dominante: null, vehiculo_altamente_recomendado: false }), { status: 200, headers: { 'Content-Type': 'application/json' } }) }
        return f(url, init)
      }
      const { empezarViajeNuevo } = await import('/src/lib/nuevoViaje.ts')
      const { useRouteStore } = await import('/src/store/useRouteStore.ts')
      empezarViajeNuevo({ nombre: 'Roma', lat: 41.9, lng: 12.5, pais: 'Italia', iso: 'IT' })
      empezarViajeNuevo({ nombre: 'Roma', lat: 41.9, lng: 12.5, pais: 'Italia', iso: 'IT' }) // y otra vez (el formulario, «Reintentar»): no se paga dos veces
      await new Promise((r) => setTimeout(r, 700))
      const s = useRouteStore.getState()
      window.fetch = f
      return JSON.stringify({ destino: s.destination, archetype: s.archetype, llamadas })
    })()`),
  )
  debe(r52.destino === 'Roma' && r52.archetype === 'urbano_clasico', 'transporte', `desde el globo el destino queda clasificado (${r52.archetype}): el transporte acaba de cargar y sale [Continuar]`)
  debe(r52.llamadas.length === 1, 'transporte', `la clasificación se pide una sola vez aunque la pidan dos piezas (${r52.llamadas.length})`)

  // 5.3 y 5.4. Las piezas de la excursión, montadas sueltas.
  const montar = (codigo) =>
    app.evaluar(`(async () => {
      const v = (await fetch('/src/main.tsx').then((r) => r.text())).match(/react-dom_client[.]js[?]v=([a-z0-9]+)/)[1]; const [rd, rr, B] = await Promise.all([import('/node_modules/.vite/deps/react-dom_client.js?v=' + v), import('/node_modules/.vite/deps/react.js?v=' + v), import('/src/components/route/dayDetail/ExcursionBlocks.tsx')]); const createRoot = rd.createRoot ?? rd.default.createRoot; const React = rr.default ?? rr
      document.getElementById('v41')?.remove()
      const d = document.createElement('div'); d.id = 'v41'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#F9F4E8;overflow:auto;padding:14px 16px'; document.body.appendChild(d)
      const exc = (id, titulo) => ({ id, title: titulo, length: 'full', durationLabel: '12 h', price: 65, priceLabel: '65 €', priceOrientativo: true, rating: 9.2, reviewCount: 3526, cancellation: 'gratuita', durationText: '12 h 15 - 13 h', recogida: 'Recogida en el hotel', incluye: 'Comida incluida', bookUrl: 'https://example.invalid/x', photoUrl: null, description: 'Un día' })
      ${codigo}
      await new Promise((r) => setTimeout(r, 700)); return true })()`)
  await montar(`window.__quitada = 0; createRoot(d).render(React.createElement(B.BlankDayFullExcursion, { excursion: exc('e1', 'La Graciosa'), dayNumber: 2, onRemove: () => { window.__quitada++ } }))`)
  const tarjeta = JSON.parse(await app.evaluar(`JSON.stringify((() => { const d = document.getElementById('v41'); const t = d.querySelector('[data-excursion-tarjeta]'); return { tarjeta: Boolean(t), nota: d.querySelector('[data-excursion-nota]')?.innerText.trim(), opiniones: d.querySelector('[data-excursion-opiniones]')?.innerText, cancelacion: d.querySelector('[data-excursion-cancelacion]')?.innerText, orientativo: d.innerText.includes('Precio orientativo'), etiquetas: d.querySelectorAll('[data-etiqueta]').length, comida: d.innerText.includes('Comida incluida'), recogida: d.innerText.includes('Recogida en el hotel'), disponibilidad: Boolean(d.querySelector('[data-ver-disponibilidad]')), yaReservada: d.innerText.includes('¿Ya la has reservado?') && d.innerText.includes('Añade tu confirmación'), vieja: /relájate y disfruta|ocupa el día entero/.test(d.innerText), quitar: d.querySelector('[data-quitar-excursion]')?.innerText.trim(), titulo: d.querySelector('[data-excursion-titulo]')?.innerText } })())`))
  debe(tarjeta.tarjeta && /9,2/.test(tarjeta.nota) && /3\.526 opiniones/.test(tarjeta.opiniones), 'excursion', `la excursión añadida sale con la tarjeta de Design: nota y opiniones (${tarjeta.nota}, ${tarjeta.opiniones})`)
  debe(/Cancelación gratuita/.test(tarjeta.cancelacion) && tarjeta.orientativo, 'excursion', 'con cancelación y «Precio orientativo»')
  debe(tarjeta.etiquetas >= 3 && tarjeta.comida && tarjeta.recogida, 'excursion', `con las etiquetas de horas, recogida y comida (${tarjeta.etiquetas})`)
  debe(tarjeta.disponibilidad && tarjeta.yaReservada, 'excursion', '[Ver disponibilidad] y «¿Ya la has reservado? Añade tu confirmación»')
  debe(!tarjeta.vieja && tarjeta.quitar === 'Quitar esta excursión', 'excursion', 'ya no sale la tarjeta beige ni «relájate y disfruta»; «Quitar esta excursión» se queda, en pequeño, debajo')
  await app.evaluar("document.querySelector('[data-quitar-excursion]').click(); true")
  debe((await app.evaluar('window.__quitada')) === 1, 'excursion', '«Quitar esta excursión» sigue funcionando')
  if (conCapturas) await app.captura(`${CAP}/excursion_anadida.jpg`)

  for (const [hayRuta, nombre] of [[true, 'con ruta'], [false, 'sin ruta']]) {
    await montar(`window.__dec = []; createRoot(d).render(React.createElement(B.ExcursionDayProposal, { destination: 'Lanzarote', options: [exc('e1', 'La Graciosa'), exc('e2', 'Timanfaya')], selectedId: 'e1', dayNumber: 2, hayRuta: ${hayRuta}, onSelect: () => {}, onDecline: (x) => window.__dec.push(x) }))`)
    const b = JSON.parse(await app.evaluar(`JSON.stringify((() => { const d = document.getElementById('v41'); const o = d.querySelector('[data-organizame-dia]'); const c = d.querySelector('[data-crear-mi-dia]'); const cs = (x) => getComputedStyle(x); return { sin: /O sin excursión/i.test(d.innerText), org: o?.innerText.split(String.fromCharCode(10)).join(' | '), orgFondo: o ? cs(o).backgroundColor : null, crear: c?.innerText.split(String.fromCharCode(10)).join(' | '), crearFondo: c ? cs(c).backgroundColor : null, vieja: d.innerText.includes('¿Prefieres seguir en') } })())`))
    debe(b.sin && !b.vieja, 'botones', `${nombre}: sale «O SIN EXCURSIÓN» y desaparece la línea subrayada «¿Prefieres seguir en…?»`)
    debe(b.crear === 'Crear mi propio día | Elige tus sitios en el mapa' && b.crearFondo === 'rgb(28, 34, 48)', 'botones', `${nombre}: el azul oscuro «Crear mi propio día» con «Elige tus sitios en el mapa»`)
    if (hayRuta) {
      debe(b.org === 'Organízame este día | Te preparamos un día por Lanzarote' && b.orgFondo === 'rgb(255, 253, 248)', 'botones', 'con ruta: el blanco «Organízame este día» con «Te preparamos un día por Lanzarote»')
      await app.evaluar("document.querySelector('[data-organizame-dia]').click(); document.querySelector('[data-crear-mi-dia]').click(); true")
      debe(JSON.stringify(await app.evaluar('window.__dec')) === JSON.stringify(['route', 'empty']), 'botones', 'el blanco monta la ruta del día (route) y el azul deja el día en blanco (empty)')
      if (conCapturas) await app.captura(`${CAP}/excursion_dos_botones.jpg`)
    } else {
      debe(b.org == null, 'botones', 'sin ruta nuestra para ese día: solo «Crear mi propio día»')
    }
  }
  debe(leer('src/components/route/dayDetail/DayDetailPanel.tsx').includes('hayRuta={day.stops.length > 0'), 'botones', 'el panel del día pasa si hay ruta nuestra (paradas, foto de antes o ruta alternativa)')
} finally {
  app.cerrar()
}

console.log(`\nPrueba V41 (viajes, perfil, transporte, excursión, obras): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
