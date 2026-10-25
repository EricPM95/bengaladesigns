// La lista de EXPLORAR de Roma tal como la ordena la app (Tanda 10O): Lugares (Atracciones) y Miradores, con su puesto y sus «me gusta» de partida.
//   node scripts/destino/listaExplorar10O.mjs            → imprime las dos listas
//   node scripts/destino/listaExplorar10O.mjs --json     → lo mismo en JSON
// Sale de /api/destination-places (el servidor de verdad) y aplica el orden de PlaceExplorerScreen (Recomendados): «me gusta», luego «al final de la lista», luego nivel, luego orden editorial, luego alfabético.
export async function cargarCatalogo(api = process.env.API_URL ?? 'http://localhost:8787') {
  const respuesta = await fetch(`${api}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
  return respuesta.json()
}

const ATRACCIONES = ['monumentos', 'museos_arte', 'iglesias']
const orden = (a, b) =>
  (b.likes_initial ?? 0) - (a.likes_initial ?? 0) ||
  Number(Boolean(a.al_final_de_lista)) - Number(Boolean(b.al_final_de_lista)) ||
  (a.level ?? 9) - (b.level ?? 9) ||
  a.name.localeCompare(b.name, 'es')

export function listas(catalogo) {
  const visibles = catalogo.places.filter((p) => p.kind === 'place' && !p.fuera_de_lista)
  const lugares = visibles.filter((p) => ATRACCIONES.includes(p.filter_category)).sort(orden)
  const miradores = visibles.filter((p) => p.filter_category === 'miradores').sort(orden)
  // «Todo»: sin ningún filtro, lugares y miradores juntos (como los ve Eric al abrir EXPLORAR sin tocar filtros).
  const todo = visibles.filter((p) => ATRACCIONES.includes(p.filter_category) || p.filter_category === 'miradores').sort(orden)
  return { lugares, miradores, todo, ocultos: catalogo.places.filter((p) => p.fuera_de_lista).map((p) => p.name), freeTour: catalogo.free_tour_entry ?? null }
}

if (process.argv[1]?.endsWith('listaExplorar10O.mjs')) {
  const datos = await cargarCatalogo()
  const { lugares, miradores, todo, ocultos, freeTour } = listas(datos)
  const fila = (p, i) => `${String(i + 1).padStart(3)}  ${String(p.likes_initial ?? 0).padStart(4)}  ${p.name}${p.al_final_de_lista ? '  (al final)' : ''}`
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ lugares: lugares.map((p, i) => ({ puesto: i + 1, nombre: p.name, megusta: p.likes_initial ?? 0 })), miradores: miradores.map((p, i) => ({ puesto: i + 1, nombre: p.name, megusta: p.likes_initial ?? 0 })), todo: todo.map((p, i) => ({ puesto: i + 1, nombre: p.name, megusta: p.likes_initial ?? 0 })), ocultos, freeTour: freeTour ? { nombre: freeTour.name, megusta: freeTour.likes_initial } : null }, null, 1))
  } else {
    console.log(`Free Tour: ${freeTour?.name} → ${freeTour?.likes_initial}`)
    console.log(`\nLUGARES (${lugares.length})\n` + lugares.map(fila).join('\n'))
    console.log(`\nMIRADORES (${miradores.length})\n` + miradores.map(fila).join('\n'))
    console.log(`\nTODO (${todo.length}): sin filtros, lugares y miradores juntos\n` + todo.map(fila).join('\n'))
    console.log(`\nFUERA DE LA LISTA (${ocultos.length}): ${ocultos.join('; ')}`)
  }
}
