// La prueba de los arreglos de la Tanda 8C3 (tras las capturas de la 8C2): capturas sobre la pantalla de verdad, Perfil nuevo en los 10 rangos, año del exclusivo, sello del Vaticano,
// secretos, un solo viajero de prueba en todas las pantallas, sin continentes, pines de la vitrina, «Añadir a mi ruta» con el sitio, tarjetas de Mis viajes, vitrina del servidor y sello estampado.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

export const titulo = 'Arreglos tras las capturas de la 8C2 (8C3)'

const raiz = process.cwd()
const ruta = (...p) => path.join(raiz, ...p)
const importar = (f) => import(pathToFileURL(ruta(f)).href)

/** `entrada` puede ser un archivo o una lista de [archivo, exportaciones]: en una lista, todo va en el mismo paquete (los módulos comparten su estado, como en el móvil). */
async function compilar(entrada, exportaciones) {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-8c3-'))
  const salida = path.join(carpeta, 'app.cjs')
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  const pares = Array.isArray(entrada) ? entrada : [[entrada, exportaciones]]
  fs.writeFileSync(path.join(carpeta, 'entrada.ts'), pares.map(([f, ex]) => `export { ${ex.join(', ')} } from '${abs(f)}'\n`).join(''))
  await build({ entryPoints: [path.join(carpeta, 'entrada.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', loader: { '.json': 'json' }, define: { 'import.meta.env': '{"DEV":false}' } })
  return createRequire(import.meta.url)(salida)
}

export default async function ({ debe, leer, sinComentarios }) {
  const L = (f) => sinComentarios(leer(ruta(f)))

  /* ── 1. Las capturas, sobre la pantalla de verdad ── */
  const hoja = leer(ruta('src/dev/escaparates/hoja.ts'))
  const perfilEsc = leer(ruta('src/dev/escaparates/perfil.ts'))
  debe(/export async function conRuta/.test(hoja), 'capturas', 'conRuta (abrir la ruta de verdad) se comparte con los demás escaparates')
  debe(/const abrirHoja = async[\s\S]{0,400}await conRuta\('days'\)/.test(hoja), 'capturas', 'la hoja de logros (2a, 3a-3e, 4a) se abre sobre DÍAS')
  debe(/id: 'E1'[\s\S]{0,400}await conRuta\('today'\)[\s\S]{0,200}ExpGanada/.test(perfilEsc), 'capturas', 'el «+EXP» E1 sale sobre HOY')
  debe(/id: 'E2'[\s\S]{0,500}await conRuta\('today'\)[\s\S]{0,200}ExpGanada/.test(perfilEsc), 'capturas', 'el «+EXP» E2 sale sobre HOY')
  debe(/modo === 'today'\)\s*window\.sessionStorage\.setItem\('trazo:hoy2', 'on'\)/.test(hoja), 'capturas', 'HOY se captura con HOY v2 encendido (foto del sitio y mapa pequeño)')
  debe(/data-hueco-insignia/.test(hoja), 'capturas', 'la captura de la hoja espera a que no quede ningún hueco gris de insignia')
  debe(/Execution context: el Perfil nuevo no se ha pintado/.test(perfilEsc), 'capturas', 'si el Perfil nuevo no llega, el escaparate FALLA (y se repite) en vez de fotografiar el de antes')

  const exp = L('src/components/logros/pantallas/perfil/ExpGanada.tsx')
  debe(/data-boton-visto/.test(L('src/components/route/hoy/HoyDurante.tsx')) && /data-boton-visto/.test(L('src/components/route/hoy/v2/HoyDuranteV2.tsx')), 'exp', 'los dos HOY marcan su botón [✓ Visto]')
  debe(/querySelector\('\[data-boton-visto\]'\)/.test(exp) && /bottom: subida !== null/.test(exp), 'exp', 'el «+EXP» flota justo encima de [✓ Visto] para no taparlo')

  /* ── 2a. Colecciones: hueco gris mientras cargan ── */
  const perezosa = L('src/components/logros/dibujos/InsigniaPerezosa.tsx')
  debe(/data-hueco-insignia/.test(perezosa) && /rgba\(28,34,48,\.1\)/.test(perezosa), 'insignias', 'mientras cargan los dibujos, cada insignia sale con su hueco en gris')

  /* ── 2b. Los 10 rangos salen con el Perfil nuevo ── */
  // El Perfil y el mundo van en el mismo paquete: comparten su estado, como en el móvil.
  const Todo = await compilar([
    ['src/lib/logrosDemo_perfil.ts', ['responder', 'reiniciarPerfilDemo', 'expDeEjemplo', 'expEnNivel', 'estrellaDeLeyenda', 'ponerPerfilDemo']],
    ['src/lib/logrosDemo_mundo.ts', ['responder as responderMundo']],
  ])
  const D = { ...Todo }
  const M = { responder: Todo.responderMundo }
  const u = new URL('http://x/api/logros/perfil')
  const rangos = new Set()
  for (let r = 0; r < 10; r++) {
    D.reiniciarPerfilDemo()
    D.ponerPerfilDemo({ exp: D.expDeEjemplo(r === 9 ? D.expEnNivel(50, 3 * D.estrellaDeLeyenda + 120) : D.expEnNivel(r * 5 + 3, 180)) })
    const p = D.responder('/api/logros/perfil', u, {}, {})
    debe(p?.ok === true && p.exp.rango_ix === r && p.titulos.length > 0 && p.vitrina.recientes.length === 3, 'rangos', `el rango ${r + 1} contesta el Perfil nuevo completo (rango ${p?.exp?.rango_ix}, ${p?.titulos?.length} títulos, ${p?.vitrina?.recientes?.length} piezas)`)
    rangos.add(p?.exp?.rango_ix)
    debe(fs.existsSync(ruta('public/marcos', `marco-${r + 1}.webp`)) && fs.existsSync(ruta('public/marcos', `hueco-${r + 1}.webp`)), 'rangos', `el rango ${r + 1} tiene su marco y su hueco`)
  }
  debe(rangos.size === 10, 'rangos', 'los 10 rangos son distintos')

  /* ── 3. Un solo viajero de prueba: Perfil, pasaporte, J3 y Todos mis logros ── */
  const pedir = (ruta_) => new URL(`http://x${ruta_}`)
  const marcar = (paises) => M.responder('/api/logros/previos', pedir('/api/logros/previos'), { paises, dias: 0 }, { metodo: 'PUT' })
  D.reiniciarPerfilDemo()
  const perfil = D.responder('/api/logros/perfil', u, {}, {})
  const pas = M.responder('/api/logros/pasaporte2', pedir('/api/logros/pasaporte2'), {}, {})
  debe(perfil.pasaporte.paises === pas.numeros.paises && perfil.pasaporte.sellos === pas.numeros.sellos && perfil.pasaporte.ciudades === pas.numeros.ciudades, 'viajero', `el Perfil (${perfil.pasaporte.paises} países · ${perfil.pasaporte.sellos} sellos · ${perfil.pasaporte.ciudades} ciudades) dice lo mismo que el pasaporte (${pas.numeros.paises} · ${pas.numeros.sellos})`)
  const prev = M.responder('/api/logros/previos', pedir('/api/logros/previos'), {}, {})
  debe(perfil.previos.paises === prev.paises.length, 'viajero', 'los países de antes de la app del Perfil son los del demo del mundo')
  // Si se marcan más países en «¿Dónde has estado ya?», el Perfil y el pasaporte cambian juntos.
  marcar(['España', 'Portugal', 'Grecia', 'Países Bajos', 'Alemania'])
  debe(D.responder('/api/logros/perfil', u, {}, {}).pasaporte.paises === M.responder('/api/logros/pasaporte2', pedir('/api/logros/pasaporte2'), {}, {}).numeros.paises, 'viajero', 'al marcar un país más, el Perfil y el pasaporte siguen igual')

  // J3: 11 países marcados dan 8 sellos de recuerdo (3 de los 11 ya tienen sello de verdad: Italia, el Vaticano y Francia) y no sale la cuenta de continentes.
  const once = ['España', 'Italia', 'Francia', 'Portugal', 'Reino Unido', 'Alemania', 'Grecia', 'Países Bajos', 'Suiza', 'Marruecos', 'Ciudad del Vaticano']
  marcar(once)
  const j3 = M.responder('/api/logros/previos', pedir('/api/logros/previos'), {}, {})
  debe(j3.numeros.paises === 11 && j3.numeros.sellos_recuerdo === 8, 'j3', `11 países marcados dan 8 sellos de recuerdo (${j3.numeros.paises} → ${j3.numeros.sellos_recuerdo}): los otros 3 ya tienen sello de verdad`)
  const j3src = L('src/components/logros/pantallas/DondeHasEstado.tsx')
  debe(!/continentes/.test(j3src), 'j3', 'la pantalla J3 no enseña la cuenta de continentes (logro apagado en la Versión 1)')
  marcar(['España', 'Portugal', 'Grecia', 'Países Bajos'])

  // Roma en Todos mis logros y en su página: el mismo estado.
  const Dest = await compilar('src/lib/logrosDemo_destino.ts', ['responder'])
  const ganados = JSON.parse(leer(ruta('src/lib/logrosDemo_ganados_datos.json'))).lleno
  const romaTodos = ganados.por_destino.find((d) => d.destino === 'roma')
  const romaPagina = Dest.responder('/api/logros/destino', pedir('/api/logros/destino?destino=roma'))
  const principal = romaPagina.sellos.find((s) => s.principal) ?? romaPagina.sellos[0]
  debe(romaPagina.ok && principal.grado === romaTodos.sello.grado, 'viajero', `Roma: sello ${principal.grado} en su página y ${romaTodos.sello.grado} en Todos mis logros`)
  debe(romaPagina.numeros.colecciones_completas === romaTodos.colecciones.completas && romaPagina.numeros.colecciones_total === romaTodos.colecciones.total, 'viajero', `Roma: ${romaPagina.numeros.colecciones_completas} de ${romaPagina.numeros.colecciones_total} colecciones en su página y ${romaTodos.colecciones.completas} de ${romaTodos.colecciones.total} en Todos mis logros`)
  debe(romaPagina.emblemas.encontrados === romaTodos.secretos.encontrados && romaPagina.emblemas.total === romaTodos.secretos.total, 'viajero', 'Roma: los mismos secretos encontrados y el mismo total en las dos pantallas')
  debe(JSON.stringify(romaPagina.sellos.map((s) => [s.id, s.grado])) === JSON.stringify(romaTodos.sellos.map((s) => [s.id, s.grado])), 'viajero', 'Roma: los mismos sellos y grados (Roma y el Vaticano) en las dos pantallas')
  const miColeccion = Dest.responder('/api/logros/mi-coleccion', pedir('/api/logros/mi-coleccion'))
  debe(miColeccion?.ok !== false, 'viajero', 'Mi colección contesta con el mismo viajero')
  debe(/estado = \{ modo: 'completo'/.test(leer(ruta('src/lib/logrosDemo_destino.ts'))), 'viajero', 'el viajero del demo de destinos es, por defecto, el del viaje acabado (el mismo que Todos mis logros)')

  /* ── 4. El exclusivo: ciudad y año de verdad ── */
  const holo = leer(ruta('src/components/logros/dibujos/piezas/ExclusivoHolo.tsx'))
  debe(!/\{"2027"\}|\{"ROMA"\}/.test(holo), 'exclusivo', 'el dibujo del exclusivo ya no lleva «2027» ni «ROMA» escritos a mano')
  debe(/v\.anio\}<\/text>/.test(holo) && /v\.ciudad\}<\/text>/.test(holo), 'exclusivo', 'el dibujo escribe el año y la ciudad que se le dan')
  const chapa = L('src/components/logros/dibujos/Chapa.tsx')
  debe(/<ExclusivoHolo kind=\{EXCLUSIVOS\[logro\]\} size=\{tam\} anio=\{escalon \?\? undefined\} ciudad=\{ciudad\}/.test(chapa), 'exclusivo', 'la chapa pasa el año del escalón («2026») y la ciudad al dibujo')
  debe(/ciudad=\{item\.lugar\?\.split\(','\)\[0\]\}/.test(L('src/components/logros/pantallas/todos/dibujo.tsx')), 'exclusivo', 'Todos mis logros pasa la ciudad del exclusivo')
  const exclusivo = ganados.items.find((i) => i.tipo === 'exclusivo' && i.logro === 'viajero:edicion_anio')
  debe(exclusivo && exclusivo.nombre === `Roma ${exclusivo.escalon}` && /^\d{4}$/.test(exclusivo.escalon), 'exclusivo', `el texto («${exclusivo?.nombre}») y el año del dibujo («${exclusivo?.escalon}») salen del mismo dato`)

  /* ── 5. El sello del Vaticano lleva su dibujo ── */
  const S = await compilar('src/components/logros/pantallas/mundo/selloDatos.ts', ['monumentoDe'])
  debe(S.monumentoDe('Ciudad del Vaticano') !== '' && S.monumentoDe('Ciudad del Vaticano') !== S.monumentoDe('Roma'), 'vaticano', 'el sello del Vaticano ya no lleva el dibujo del Coliseo')
  debe(S.monumentoDe('Vaticano') === S.monumentoDe('Ciudad del Vaticano'), 'vaticano', '«Vaticano» y «Ciudad del Vaticano» llevan el mismo dibujo')
  debe(S.monumentoDe('Roma') !== '' && S.monumentoDe('Pisa') !== '', 'vaticano', 'los demás sellos conservan su monumento')

  /* ── 6. Los secretos dicen «Roma aún esconde N secretos.» ── */
  const R = await compilar('src/components/logros/momentos/textosResumen.ts', ['lineaDeSecretos'])
  debe(R.lineaDeSecretos('Roma', 12, 5) === 'Roma aún esconde 7 secretos.', 'secretos', 'durante y después: «Roma aún esconde N secretos.»')
  debe(R.lineaDeSecretos('Roma', 12, 0, true) === 'Roma esconde 12 secretos', 'secretos', 'antes del viaje: «Roma esconde 12 secretos»')
  debe(R.lineaDeSecretos('Roma', 12, 11) === 'Roma aún esconde 1 secreto.', 'secretos', 'en singular con uno')
  const pag = L('src/components/logros/pantallas/PaginaDeDestino.tsx')
  const lis = L('src/components/logros/pantallas/todos/TodosLista.tsx')
  debe(!/secretos_encontrados\} de|secretos_total|secretos encontrados/.test(pag), 'secretos', 'la página de un destino no dice «N de 12 secretos» ni «N secretos encontrados»')
  debe(!/secretos encontrados|secreto encontrado/.test(lis) && /lineaDeSecretos\(d\.ciudad/.test(lis), 'secretos', 'Todos mis logros usa la misma frase que el resto')
  debe(/lineaDeSecretos\(datos\.ciudad/.test(pag), 'secretos', 'la página de un destino usa la misma frase que el resto')
  debe(/secretos: \{ encontrados: est\.secretos\.encontrados, total: est\.secretos\.total \}/.test(leer(ruta('server/logros/pantallas/ganados.js'))), 'secretos', 'el servidor manda el total de secretos de cada destino en «Todos mis logros»')

  /* ── 7. Los pines de la vitrina en la página de cada destino ── */
  debe(/function PinDeVitrina/.test(pag) && /data-pin-de-vitrina/.test(pag), 'pines', 'existe el pin de la vitrina')
  debe(/oklch\(0\.55 0\.11 150\)/.test(pag) && /oklch\(0\.8 0\.14 70\)/.test(pag) && /M5 12\.5l4\.5 4\.5L19 7\.5/.test(pag) && /M12 5v14M5 12h14/.test(pag), 'pines', 'verde con ✓ si está en la vitrina, dorado con «+» si no (los colores y trazos del diseño)')
  debe((pag.match(/<PinDeVitrina/g) ?? []).length >= 3, 'pines', 'lo llevan los sellos, las colecciones y los emblemas')
  debe(/c\.completa \? enVitrina\(/.test(pag) && /s\.grado \? enVitrina\(/.test(pag), 'pines', 'solo lleva pin lo que ya está ganado')
  debe(/useGanados\.getState\(\)\.cargar\(\)/.test(pag), 'pines', 'pide la vitrina al servidor (la de «Todos mis logros»)')

  /* ── 8. «Añadir a mi ruta» abre «Añadir parada» con el sitio ya puesto ── */
  debe(/openAddFlow\(null, s\.nombre \?\? s\.sitio\)/.test(L('src/components/logros/momentos/HojaLogros.tsx')), 'anadir', 'la hoja manda el sitio al abrir la pantalla de añadir')
  const tienda = await compilar('src/store/useAddFlowStore.ts', ['useAddFlowStore'])
  tienda.useAddFlowStore.getState().openAddFlow(null, 'Panteón')
  debe(tienda.useAddFlowStore.getState().addFlow?.lugar === 'Panteón', 'anadir', 'el almacén guarda el sitio que viene puesto')
  tienda.useAddFlowStore.getState().openAddFlow('d1')
  debe(tienda.useAddFlowStore.getState().addFlow?.lugar === undefined, 'anadir', 'sin sitio, la pantalla de añadir se abre como siempre')
  const anadir = L('src/components/route/freeDay/AddToTripScreen.tsx')
  debe(/addFlow\?\.lugar/.test(anadir) && /setItem\(\{ kind: 'place', place \}\)/.test(anadir), 'anadir', 'la pantalla de añadir busca el sitio en el catálogo y pregunta a qué día va')

  /* ── 9. Mis viajes: tarjetas grandes con foto ── */
  const cuerpo = L('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
  debe(/<TarjetaDeViaje/.test(cuerpo) && !/<FilaDeViaje/.test(cuerpo), 'viajes', 'Mis viajes (Perfil con logros) usa las tarjetas grandes, no las filas')
  const tarjeta = L('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx')
  debe(/height: enCurso \? 176 : 132/.test(tarjeta) && /borderRadius: 22/.test(tarjeta), 'viajes', 'las tarjetas miden 176 px (en curso) y 132 px, con las esquinas del diseño')
  debe(/Día \$\{Math\.min\(diaN, viaje\.dias\)\} de \$\{viaje\.dias\}/.test(tarjeta), 'viajes', 'el viaje en curso dice «Día N de M»')
  debe(!fs.existsSync(ruta('src/components/perfil/FilaDeViaje.tsx')) && !/<FilaDeViaje/.test(leer(ruta('src/components/layout/PerfilSheet.tsx'))), 'viajes', '(10N4) la fila de siempre ya no existe: con los logros apagados salen las mismas tarjetas')

  /* ── 10. La vitrina del servidor ── */
  const serv = L('server/logros/servicio.js')
  debe(!/construirVitrina/.test(serv) && !/construirVitrina/.test(L('server/logros/vistas.js')), 'vitrina', 'la vitrina vieja (construirVitrina) ya no existe: nadie puede usarla por error')
  debe(/vitrinaDeGanados\(\{ items, guardada: perfil\.vitrina, superadas: clavesSuperadas\(datos, items\) \}\)/.test(serv), 'vitrina', 'GET /api/logros/vitrina usa la vitrina de «Todos mis logros»')
  const G = await importar('server/logros/pantallas/ganados.js')
  const datosV = { destinos: { roma: { sellos: [{ id: 'roma', grados: [{ grado: 'bronce' }, { grado: 'plata' }, { grado: 'oro' }] }] } } }
  const it = (destino, logro, escalon, en) => ({ clave: `${destino}|${logro}|${escalon}`, destino, logro, escalon, en })
  const items = new Map([it('roma', 'sello', 'roma:bronce', '2026-10-10T10:00:00Z'), it('roma', 'sello', 'roma:oro', '2026-10-12T10:00:00Z'), it('roma', 'coleccion', 'bernini', '2026-10-11T10:00:00Z')].map((x) => [x.clave, x]))
  const sup = G.clavesSuperadas(datosV, items)
  const v1 = G.vitrinaDeGanados({ items, guardada: { baldas: {}, titulo: null }, superadas: sup })
  debe(JSON.stringify(v1.baldas.sellos.huecos) === JSON.stringify(['roma|sello|roma:oro']), 'vitrina', 'el bronce de un sello que ya es oro no entra en la vitrina')
  const v2 = G.vitrinaDeGanados({ items, guardada: { baldas: { colecciones: [] }, titulo: null }, superadas: sup })
  debe(v2.baldas.colecciones.huecos.length === 0 && v2.baldas.colecciones.elegida === true, 'vitrina', 'una balda vaciada a propósito se queda vacía (no se rellena sola)')
  const PerfilS = await importar('server/logros/pantallas/perfil.js')
  const resumen = PerfilS.resumenDeVitrina({ items })
  debe(resumen.logros === 2, 'vitrina', `el Perfil cuenta un sello que sube de grado una sola vez (${resumen.logros} logros, no 3)`)

  /* ── 11. El sello estampado al acabar el viaje ── */
  const rv = L('src/components/logros/momentos/ResumenViaje.tsx')
  debe(/pagina: `sello:\$\{tripId\}`/.test(rv) && /data-estampar-sello/.test(rv) && /Estampar mi sello/.test(rv), 'sello', 'el aviso de viaje acabado abre el pasaporte con el sello del viaje estampándose')
  debe(/cerrar\(\)[\s\S]{0,80}abrir\(\{ t: 'pasaporte'/.test(rv), 'sello', 'primero se cierra el aviso y luego se abre el pasaporte')
  debe(/pedida\?\.startsWith\('sello:'\)/.test(L('src/components/logros/pantallas/PasaporteScreen.tsx')), 'sello', 'el pasaporte sabe abrirse en el sello de un viaje')

  /* ── 12. Sin errores de consola en las capturas: el script las cuenta ── */
  const cap = leer(ruta('scripts/destino/capturas8c.mjs'))
  debe(/Sin errores de consola/.test(cap) && /errores\.push/.test(cap), 'consola', 'el script de capturas cuenta los errores de consola de cada pantalla')
}
