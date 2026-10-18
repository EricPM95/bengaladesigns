// La prueba de «Mi vitrina», «Todos mis logros» y la ficha de un logro (Tanda 8C2).
//   node scripts/destino/pruebaPantallas8c.mjs        (la corre junto con las demás partes)
// Comprueba la lógica del servidor (funciones puras de server/logros/pantallas/ganados.js) con un viajero que calcula el motor de verdad, y las reglas del encargo sobre el código de las pantallas.
import fs from 'node:fs'
import { escenario, respuestaDelEscenario } from '../generarDemoGanados.mjs'
import { baldaDe, clavesSuperadas, codigoDePais, construirGanados, ponerBalda, vitrinaDeGanados } from '../../../server/logros/pantallas/ganados.js'

export const titulo = 'Mi vitrina, Todos mis logros y la ficha de un logro (8C2)'

const PANTALLAS = 'src/components/logros/pantallas'
const MIOS = [`${PANTALLAS}/TodosMisLogros.tsx`, `${PANTALLAS}/FichaDeLogro.tsx`]

export default async function ({ debe, leer, archivos, sinComentarios }) {
  const delCodigo = [...MIOS, ...archivos(`${PANTALLAS}/todos`)]
  const codigo = Object.fromEntries(delCodigo.map((f) => [f.split('\\').join('/'), sinComentarios(leer(f))]))
  const todoElCodigo = Object.values(codigo).join('\n')

  /* ── Servidor: lo ganado ── */
  const lleno = respuestaDelEscenario({ completo: true })
  const poco = respuestaDelEscenario({ completo: true, sitios: ['trastevere'] })
  const vacio = respuestaDelEscenario({ completo: false })
  debe(lleno.ok === true && lleno.total > 0, 'ganados', 'un viaje entero da logros')
  debe(vacio.total === 0 && vacio.items.length === 0, 'ganados', 'sin nada ganado no hay ni un logro')
  debe(vacio.vitrina.pedestal.length === 0 && Object.values(vacio.vitrina.baldas).every((b) => b.huecos.length === 0), 'vitrina', 'la vitrina de quien no tiene nada está vacía (V2)')
  debe(poco.vitrina.pedestal.length === 0, 'vitrina', 'sin ninguna maravilla no hay pedestal (V2)')
  debe(lleno.vitrina.pedestal.length > 0 && lleno.vitrina.exclusivos.length > 0, 'vitrina', 'con maravilla y exclusivos, el pedestal y la balda de exclusivos salen (V1)')
  debe(lleno.total === lleno.items.filter((i) => !i.superado).length, 'ganados', 'el número de logros cuenta lo ganado en su grado más alto (sin repetir el bronce de un sello que ya es oro)')

  // Los emblemas: solo los encontrados. Nunca un emblema oculto antes de encontrarlo.
  const { datos, items } = escenario({ completo: true })
  const emblemasGanados = new Set([...items.values()].filter((i) => i.logro === 'emblema').map((i) => i.escalon))
  const emblemasEnLaRespuesta = lleno.items.filter((i) => i.tipo === 'emblema')
  debe(emblemasEnLaRespuesta.length === emblemasGanados.size && emblemasEnLaRespuesta.every((i) => emblemasGanados.has(i.emblema)), 'emblemas', 'solo salen los emblemas encontrados')
  debe(emblemasEnLaRespuesta.length < datos.destinos.roma.emblemas.length, 'emblemas', 'el viajero de ejemplo no los tiene todos (para que la prueba valga)')
  debe(poco.items.every((i) => i.tipo !== 'emblema') && vacio.items.every((i) => i.tipo !== 'emblema'), 'emblemas', 'sin fotos no hay ni un emblema en la respuesta')
  debe(!/\b(madrugador|nocturno|foro_romano|boca_de_la_verdad|catacumbas|ojo_cerradura)\b/.test(todoElCodigo), 'emblemas', 'ninguna pantalla lleva escrita la lista de emblemas (ni siquiera sus nombres): no se pueden enseñar los que faltan')

  // Ninguna hora de Madrugador o Nocturno a la vista.
  const textos = lleno.items.flatMap((i) => [i.nombre, i.linea, i.momento?.nombre, i.momento?.linea])
  debe(textos.every((t) => !/\b\d{1,2}[:h.]\d{2}\b/.test(String(t ?? ''))), 'horas', 'ningún nombre ni línea lleva una hora')

  // Lo apagado en la Versión 1 no existe.
  const apagados = new Set(datos.viajero.logros_apagados ?? [])
  const idsDeFilas = lleno.viajero.flatMap((g) => g.filas.map((f) => f.id))
  const idsDeItems = lleno.items.map((i) => i.def).filter(Boolean)
  debe(apagados.size > 0, 'apagados', 'hay logros apagados en los datos (para que la prueba valga)')
  debe(idsDeFilas.every((id) => !apagados.has(id)) && idsDeItems.every((id) => !apagados.has(id)), 'apagados', 'ni un logro apagado sale en las filas ni entre lo ganado')
  debe(!idsDeFilas.includes('maravillas') && idsDeFilas.every((id) => !['fundador', 'pionero', 'edicion_anio', 'probador'].includes(id)), 'grupos', 'las maravillas y los exclusivos no se repiten en los grupos de viajero')
  debe(lleno.viajero.map((g) => g.id).join() === 'mundo,tiempo,como_viajas,coleccionista', 'grupos', 'los cuatro grupos, en el orden del diseño')

  // Las filas: lo que lleva sale de los hechos; lo que no se tiene dice cómo conseguirlo.
  const fila = (id) => lleno.viajero.flatMap((g) => g.filas).find((f) => f.id === id)
  debe(fila('paises').actual === [...items.values()].filter((i) => i.logro === 'pais').length, 'filas', 'los países que lleva son los que ha ganado (no un número escrito)')
  debe(fila('viajes').actual === 1 && fila('con_quien_pareja').actual === 1 && fila('con_quien_solo').actual === 0, 'filas', 'los viajes y con quién salen de los hechos del viaje')
  debe(Boolean(fila('con_quien_solo').como) && fila('con_quien_solo').ganado === false && fila('con_quien_solo').clave === null, 'filas', 'lo que no se tiene no tiene clave y dice cómo conseguirlo')
  debe(fila('cuatro_estaciones').progreso === 1 && String(fila('doce_meses').progreso) === '10', 'filas', 'las cuatro estaciones y los 12 meses llevan su avance')
  const f5 = fila('paises')
  debe(f5.siguiente == null || f5.siguiente.faltan === f5.siguiente.n - f5.actual, 'filas', 'lo que falta para el siguiente escalón es la resta, no un número escrito')

  // Por destino y por países.
  debe(lleno.por_destino.length === 1 && lleno.por_destino[0].destino === 'roma' && lleno.por_destino[0].sello.grado === 'diamante', 'destinos', 'Roma sale con el grado de su sello')
  debe(lleno.por_destino[0].avance === lleno.por_destino[0].colecciones.completas / lleno.por_destino[0].colecciones.total, 'destinos', 'el avance de un destino son sus colecciones completas entre las que tiene')
  const vat = lleno.paises.find((p) => p.pais === 'Ciudad del Vaticano')
  debe(lleno.paises.length === 2 && vat?.destinos[0].dentro_de_otro === true && vat.codigo === 'va', 'paises', 'el Vaticano sale como país aparte, dentro del viaje a Roma, con su bandera')
  debe(codigoDePais('Italia') === 'it', 'paises', 'el código del país sale de su nombre')
  debe(vacio.por_destino.length === 0 && vacio.paises.length === 0, 'destinos', 'sin viajes no hay destinos ni países')

  // La vitrina: el hueco, el título y lo que se puede llevar.
  const superadas = clavesSuperadas(datos, items)
  debe(lleno.vitrina.baldas.sellos.huecos.every((k) => !superadas.has(k)), 'vitrina', 'la vitrina no se rellena sola con el bronce de un sello que ya es oro')
  debe(baldaDe({ logro: 'sello' }) === 'sellos' && baldaDe({ logro: 'viajero:paises' }) === 'viajero' && baldaDe({ logro: 'viajero:fundador' }) === null && baldaDe({ logro: 'maravilla' }) === null, 'vitrina', 'qué va a cada balda; los exclusivos y la maravilla no se llevan')
  const cols = [...items.values()].filter((i) => i.logro === 'coleccion').map((i) => i.clave)
  const base = { items, guardada: { baldas: {}, titulo: null }, superadas }
  debe(ponerBalda({ ...base, balda: 'colecciones', huecos: cols.slice(0, 4) }).ok, 'vitrina', 'se puede guardar una balda de 4')
  debe(!ponerBalda({ ...base, balda: 'colecciones', huecos: cols.slice(0, 5) }).ok, 'vitrina', 'una balda no admite más de 4')
  debe(!ponerBalda({ ...base, balda: 'colecciones', huecos: [cols[0], cols[0]] }).ok, 'vitrina', 'una pieza no puede estar dos veces en la misma balda')
  debe(!ponerBalda({ ...base, balda: 'sellos', huecos: [cols[0]] }).ok, 'vitrina', 'una colección no cabe en la balda de sellos')
  debe(!ponerBalda({ ...base, balda: 'colecciones', huecos: ['roma|coleccion|no_existe'] }).ok, 'vitrina', 'solo se puede poner lo que se ha ganado')
  const sinSuperados = [...items.values()].find((i) => superadas.has(i.clave))
  debe(!sinSuperados || !ponerBalda({ ...base, balda: baldaDe(sinSuperados), huecos: [sinSuperados.clave] }).ok, 'vitrina', 'no se puede poner en la vitrina lo que ya tiene otro más alto')
  const vaciada = ponerBalda({ ...base, balda: 'colecciones', huecos: [] })
  debe(vaciada.ok && vitrinaDeGanados({ items, guardada: vaciada.guardada, superadas }).baldas.colecciones.huecos.length === 0, 'vitrina', 'una balda vaciada a propósito se queda vacía (no se rellena sola)')
  const puesta = ponerBalda({ ...base, balda: 'colecciones', huecos: cols.slice(0, 2) })
  debe(vitrinaDeGanados({ items, guardada: puesta.guardada, superadas }).baldas.colecciones.huecos.length === 2, 'vitrina', 'la balda elegida enseña justo lo elegido')

  // El título: el que está guardado y ganado; si no, ninguno.
  const tit = [...items.values()].find((i) => i.logro === 'viajero:paises')
  const conTitulo = construirGanados({ datos, catalogos: {}, items, cuentan: [], viajes: {}, perfil: { vitrina: { baldas: {}, titulo: tit.clave } }, ahora: new Date('2026-10-20T10:00:00Z') })
  debe(conTitulo.titulo?.clave === tit.clave && conTitulo.titulo.nombre.length > 0, 'titulo', 'el título del perfil sale con su nombre')
  const titFalso = construirGanados({ datos, catalogos: {}, items, cuentan: [], viajes: {}, perfil: { vitrina: { baldas: {}, titulo: 'x|viajero:nada|' } }, ahora: new Date('2026-10-20T10:00:00Z') })
  debe(titFalso.titulo === null, 'titulo', 'un título que no se ha ganado no sale')
  debe(lleno.items.filter((i) => i.titulable).every((i) => i.logro.startsWith('viajero:')), 'titulo', 'solo los logros de viajero pueden ser el título')

  // Volver a ver y compartir: cada cosa trae su momento, sin frase de suspense y sin ser «la primera vez».
  const conMomento = lleno.items.filter((i) => i.momento)
  debe(conMomento.length >= lleno.items.length - 1, 'momentos', 'casi todo lo ganado trae su momento para [Volver a ver] y [Compartir]')
  debe(conMomento.every((i) => i.momento.primera_vez === false && !i.momento.frase), 'momentos', 'al volver a verlo no hay frase de suspense ni «primera vez»')

  // El demo tiene la forma real: se vuelve a generar y tiene que dar lo mismo.
  const guardado = JSON.parse(leer('src/lib/logrosDemo_ganados_datos.json'))
  debe(JSON.stringify(guardado.lleno) === JSON.stringify(lleno), 'demo', 'el demo «lleno» es lo que calcula el servidor ahora (si cambia el servidor: node scripts/destino/generarDemoGanados.mjs)')
  debe(JSON.stringify(guardado.poco) === JSON.stringify(poco) && JSON.stringify(guardado.vacio) === JSON.stringify(vacio), 'demo', 'los demos «poco» y «vacio» también')
  debe(fs.existsSync('src/lib/logrosDemo_ganados.ts') && /export function responder/.test(leer('src/lib/logrosDemo_ganados.ts')), 'demo', 'el demo responde las rutas nuevas')

  /* ── Código: las reglas del encargo ── */
  debe(delCodigo.length >= 10, 'archivos', 'todas las piezas de la pantalla están')
  const empresa = /\b(civitatis|booking|stay22|whatsapp|instagram|tiktok|apple|google|routy|facebook|twitter|spotify|airbnb)\b/i
  debe(!empresa.test(todoElCodigo), 'empresas', 'ni un nombre de empresa, ni el de la app, en los textos de estas pantallas')
  debe(!empresa.test(leer('server/logros/pantallas/ganados.js').replace(/\/\*[\s\S]*?\*\//g, '')), 'empresas', 'ni en los textos que manda el servidor')

  // Ningún número escrito a mano en lo que se ve: «N de M» solo con números que vienen de los datos.
  const numerosFijos = todoElCodigo.match(/['"`>][^'"`<{}]*\b\d+ de \d+\b/g) ?? []
  debe(numerosFijos.length === 0, 'numeros', `nada de «N de M» escrito a mano: ${numerosFijos.join(' | ')}`)
  debe(!/\b(7|11|12) (maravillas|colecciones|secretos)\b/.test(todoElCodigo.split('Las 7 maravillas').join('')), 'numeros', 'no hay cuentas de maravillas, colecciones o secretos escritas a mano')
  debe(!/\bde 12\b/.test(todoElCodigo), 'numeros', 'ningún «de 12» escrito')

  // Zonas de toque de 44 px.
  const botonesBajos = Object.entries(codigo).flatMap(([f, c]) => (c.match(/<button[^>]*style=\{\{[^}]*\bheight: (\d+)/g) ?? []).map((b) => [f, Number(b.match(/\bheight: (\d+)/)[1])])).filter(([, h]) => h < 44)
  debe(botonesBajos.length === 0, 'toque', `todo botón mide 44 px o más de alto: ${JSON.stringify(botonesBajos)}`)
  debe(/width: 48, height: 48/.test(codigo[`${PANTALLAS}/TodosMisLogros.tsx`]) && /height: 44, border: 'none', borderRadius: 999/.test(codigo[`${PANTALLAS}/TodosMisLogros.tsx`]), 'toque', 'el botón de volver y las pestañas llegan a 44 px')
  debe(/minHeight: 44/.test(codigo[`${PANTALLAS}/todos/TodosLista.tsx`]), 'toque', 'las vistas «Destinos · Países» y «Ver todo» llegan a 44 px')

  // Reducir movimiento.
  const css = leer(`${PANTALLAS}/todos/todos.css`)
  debe(/prefers-reduced-motion: reduce/.test(css) && /animation-duration:\.001s/.test(css), 'movimiento', 'con «reducir movimiento» todo sale sin moverse')
  debe(Object.entries(codigo).every(([f, c]) => !/\banimation:/.test(c) || /todos\.css/.test(todoElCodigo)), 'movimiento', 'las animaciones usan los keyframes de todos.css')
  debe(/className="vt"/.test(codigo[`${PANTALLAS}/TodosMisLogros.tsx`]) && /className="vt"/.test(codigo[`${PANTALLAS}/FichaDeLogro.tsx`]), 'movimiento', 'las dos pantallas están dentro de .vt (donde vive la regla de reducir movimiento)')

  // Peso al abrir: todo en su propio archivo y cargado a demanda.
  const host = leer(`${PANTALLAS}/PantallasHost.tsx`)
  debe(/todos: \(\) => import\('\.\/TodosMisLogros'\)/.test(host) && /ficha: \(\) => import\('\.\/FichaDeLogro'\)/.test(host), 'peso', 'las dos pantallas se cargan solo al abrirlas')
  debe(/lazy\(\(\) => import\('\.\/Repetir'\)\)/.test(codigo[`${PANTALLAS}/todos/FichaHoja.tsx`]), 'peso', '[Volver a ver] baja sus pantallas solo al tocarlo')
  const apps = [leer('src/App.tsx'), leer('src/main.tsx')].join('\n')
  debe(!/TodosMisLogros|FichaDeLogro|logros\/pantallas\/todos/.test(apps), 'peso', 'nada de esto está en el paquete que baja al abrir la app')
  debe(!/\.(png|jpe?g|gif|mp4|webm)['"]/.test(todoElCodigo), 'peso', 'sin imágenes ni vídeos: los dibujos son de código')

  // Los dibujos: se usan los que ya hay.
  debe(/from '\.\.\/\.\.\/dibujos'/.test(codigo[`${PANTALLAS}/todos/dibujo.tsx`]) && /Chapa/.test(codigo[`${PANTALLAS}/todos/dibujo.tsx`]), 'dibujos', 'los dibujos son los de dibujos/ (Sello, Insignia, Emblema, Chapa, MedallaDeSiete)')
  // Las otras pantallas se abren con la pila, no se mezclan aquí.
  debe(/abrir\(\{ t: 'destino', destino/.test(todoElCodigo) && /abrir\(\{ t: 'mi_coleccion', grupo/.test(todoElCodigo), 'pila', 'cada destino abre su página y «Ver todo» abre Mi colección')
  debe(/abrirCompartir\(\{ tipo: 'logro', momento/.test(todoElCodigo), 'compartir', '[Compartir] usa el de los momentos')
  debe(/Quitar de mi vitrina/.test(todoElCodigo) && /Llevar a mi vitrina/.test(todoElCodigo) && /Colocar aquí/.test(todoElCodigo) && /Elige un hueco|elige un hueco/.test(todoElCodigo), 'vitrina', 'los textos del diseño de V3 están')

  /* ── Escaparates y capturas ── */
  const esc = leer('src/dev/escaparates/vitrina.ts')
  for (const id of ['V1', 'V2', 'V3', 'T1', 'T2', 'T4']) debe(new RegExp(`id: '${id}'`).test(esc), 'escaparates', `hay escaparate ${id}`)
  const dir = 'docs/dias/capturas_8c'
  for (const id of ['V1', 'V2', 'V3', 'T1', 'T2', 'T4']) debe(fs.existsSync(`${dir}/${id}.jpg`), 'capturas', `hay captura de ${id}`)
}
