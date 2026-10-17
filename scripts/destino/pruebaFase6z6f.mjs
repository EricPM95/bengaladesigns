// La prueba de la Tanda 6z6f: los tips a pantalla completa de verdad, HOY sin mapa grande, fuera las etiquetas «Antes/Durante/Después del viaje» y «x de 3 listo» sin título.
//   node scripts/destino/pruebaFase6z6f.mjs
// Da fallo si:
//   1. los tips no se pintan en el `body` con un portal por encima de la cabecera (z-20) y la barra (z-30), o hay otra pantalla «completa» de RUTA/DÍAS/RESERVAS dentro del panel con el mismo problema (se enumeran);
//   2. HOY lleva el mapa grande en alguno de los tres momentos, o RUTA, DÍAS, EXPLORAR y RESERVAS pierden el suyo;
//   3. sale en la app algún texto «Antes del viaje», «Durante el viaje» o «Después del viaje» (fuera del panel de pruebas);
//   4. la tarjeta clara de RESERVAS no dice solo «x de 3 listo» (o «x de 2»), con «Tu viaje a…» delante.
import fs from 'node:fs'
import path from 'node:path'

let fallos = 0
let comprobaciones = 0
const ok = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (p) => fs.readFileSync(p, 'utf8')
const ficheros = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) ficheros(p, acc)
    else if (/\.(tsx?|js)$/.test(e.name)) acc.push(p)
  }
  return acc
}

// ── 1. Los tips ──
console.log('Tips')
{
  const t = leer('src/components/route/TripTipsSheet.tsx')
  ok(/createPortal\(/.test(t) && /document\.body,\s*\)/.test(t), '1a los tips no se pintan en el body con createPortal')
  const z = Number((t.match(/fixed inset-0 z-\[(\d+)\]/) ?? [])[1])
  ok(z >= 80, `1b los tips no van por encima de la cabecera (z-20) y la barra (z-30): z-${z}`)
  ok(/aria-label="Cerrar los tips"/.test(t), '1c los tips no tienen su X para cerrar')
  // Fuera del portal, las pantallas «completas» del panel de RUTA: ninguna más sin portal (salvo las conocidas, que son menús, avisos del RouteView o rutas heredadas).
  const SIN_PORTAL_CONOCIDAS = [
    'DateNoticesModal.tsx', // las monta RouteView, fuera del panel
    'SeasonCard.tsx', // ídem
    'StopMenu.tsx', // menús desplegables (fondo transparente)
    'DayMenu.tsx', // ídem
    'AttractionsFinder.tsx', // ruta heredada de destinos sin catálogo (no es Roma); lleva su propio `map-cover-overlay`
    'ArrivalDetailSheet.tsx', // se pinta dentro del portal de DayDetailPanel
    'ArrivalReturnSheet.tsx', // ídem
    'MealDetailSheet.tsx', // ídem
    'StopDetailSheet.tsx', // ídem (y en AddStopScreen / PlaceExplorerScreen, que son portales)
    'RestaurantDetailSheet.tsx', // dentro de PlaceExplorerScreen (portal)
  ]
  const todos = ficheros('src/components').filter((f) => /fixed inset-0/.test(leer(f)) && !/createPortal/.test(leer(f)))
  const nuevos = todos.filter((f) => !SIN_PORTAL_CONOCIDAS.some((c) => f.endsWith(c)))
  ok(nuevos.length === 0, `1d pantalla «completa» sin portal que no estaba revisada: ${nuevos.join(', ')}`)
  // Las fichas de DIAS van en el portal del panel del día.
  const dia = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  ok(/createPortal\(\s*<>\s*<StopDetailSheet/.test(dia), '1e DayDetailPanel no pinta sus fichas en el body')
}

// ── 2. HOY sin mapa grande ──
console.log('Mapas')
{
  const v = leer('src/components/route/RouteView.tsx')
  ok(/const mapHidden = mode === 'today' \|\|/.test(v), '2a HOY lleva el mapa grande (mapHidden no incluye mode === \'today\')')
  // El mapa de los demás modos sigue como estaba: solo se esconde en los casos de siempre.
  const linea = (v.match(/const mapHidden = .*/) ?? [''])[0]
  const resto = linea.replace("mode === 'today' || ", '')
  ok(resto === "const mapHidden = (canCollapseMap && mapCollapsed) || (dayDetailOpen && dayOverlayOpen) || (mode === 'explore' && exploreFullScreen) || (mode === 'route' && destinationOverlayOpen)", `2b el mapa de RUTA, DÍAS, EXPLORAR o RESERVAS ha cambiado: ${resto}`)
  ok(/const canCollapseMap = mode === 'days' \|\| mode === 'explore'/.test(v), '2c el botón de ocultar mapa ha cambiado')
  ok(/const showRouteStyleMap = mode === 'route'/.test(v), '2d el mapa de RUTA ha cambiado')
  ok(/\{mode === 'today' && <HoyView/.test(v), '2e HOY ya no se pinta en su pestaña')
  // Los tres momentos de HOY: el mapa pequeño de «Siguiente parada» sigue en HoyDurante y ninguno de los tres lleva el grande.
  for (const f of ['HoyAntes', 'HoyDurante', 'HoyDespues']) ok(!/StopsMapView|mapboxgl\.Map/.test(leer(`src/components/route/hoy/${f}.tsx`)) || f === 'HoyDurante', `2f ${f} pinta un mapa grande`)
  ok(/mapbox|StaticImage|static\/|MapaPequeno|mapa/i.test(leer('src/components/route/hoy/HoyDurante.tsx')), '2g HOY durante ha perdido su mapa pequeño de «Siguiente parada»')
  // RESERVAS es una pantalla completa propia (ya no lleva el mapa debajo).
  ok(/if \(mode === 'bookings'\) \{/.test(v), '2h RESERVAS ha cambiado de sitio')
}

// ── 3. Sin etiquetas de momento ──
console.log('Etiquetas')
{
  const ETIQUETA = /Antes del viaje|Durante el viaje|Después del viaje/
  const dentro = ficheros('src').filter((f) => !/[\\/]dev[\\/]|PanelDePruebas/.test(f)).flatMap((f) =>
    leer(f)
      .split(/\r?\n/)
      .map((linea, i) => ({ f, i: i + 1, linea: linea.trim() }))
      .filter(({ linea }) => ETIQUETA.test(linea) && !/^(\/\/|\*|\/\*|\{\/\*)/.test(linea) && !/Hoy te dará/.test(linea)),
  )
  ok(dentro.length === 0, `3a etiquetas de momento en la app: ${dentro.map((d) => `${d.f}:${d.i}`).join(' ')}`)
  const panel = leer('src/components/dev/PanelDePruebas.tsx')
  ok(/Momento del viaje/.test(panel) && /Antes del viaje/.test(panel), '3b el panel de pruebas ha perdido su «Momento»')
}

// ── 4. «x de 3 listo» sin título ──
console.log('Resumen')
{
  const r = leer('src/components/route/reservas/ResumenViaje.tsx')
  const cuerpo = r.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
  ok(!/Tu viaje a/.test(cuerpo), '4a la tarjeta clara todavía dice «Tu viaje a…»')
  ok(/\{listas\} de \{fichas\.length\} listo/.test(cuerpo), '4b la tarjeta clara no dice «x de n listo»')
  ok(/oklch\(0\.5 0\.17 5\)/.test(cuerpo) && /<em /.test(cuerpo), '4c la tarjeta clara ha perdido su estilo (frambuesa, cursiva)')
  ok(/h-1 flex-1 rounded/.test(cuerpo) && /rounded-full/.test(cuerpo), '4d la tarjeta clara ha perdido sus rayas o sus botones redondos')
  ok(!/ciudad/.test(cuerpo), '4e la tarjeta clara todavía recibe la ciudad')
}

console.log(`\n6z6f: ${comprobaciones} comprobaciones, ${fallos} fallos.`)
process.exitCode = fallos === 0 ? 0 : 1
