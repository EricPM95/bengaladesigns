// Tanda 6y7, parte de los TÍTULOS DE LOS DÍAS: pone `grupo_dia` a cada sitio de data/pipeline_v2/roma.json.
//   node scripts/destino/asignarGruposDia6y7.mjs            (escribe; se puede repetir: no duplica nada)
//   node scripts/destino/asignarGruposDia6y7.mjs --revisar  (solo enseña la tabla, no escribe)
// Es DATO, no código: la app lee `grupo_dia` del dato (ver gruposDeDia en shared/routeEngine/fichaLugar.js). Los nombres de grupo son SOLO los de la lista de Eric.
// Este fichero es la ÚNICA fuente de la asignación: se decidió sitio por sitio y se revisó a mano (la tabla va en docs/dias/INFORME_PARTE_TITULOS_TANDA6Y7.md).
// NO reformatea el JSON: inserta líneas sueltas (el resto del fichero queda byte a byte igual).
import fs from 'node:fs'

const RUTA = 'data/pipeline_v2/roma.json'

export const GRUPOS = {
  centro: 'Centro histórico',
  antigua: 'Roma antigua',
  trastevere: 'Trastevere',
  espana: 'Plaza de España',
  vaticano: 'Vaticano',
  borghese: 'Villa Borghese',
  popolo: 'Popolo',
  basilicas: 'Basílicas y el Aventino',
  alturas: 'Roma desde las alturas',
}
export const LISTA_DE_GRUPOS = [...Object.values(GRUPOS), 'Excursión desde Roma', 'Free Tour']
const G = GRUPOS

/** id del sitio → grupo. Los que Eric nombró están marcados con (E). */
export const POR_SITIO = {
  // Roma antigua
  coliseo: G.antigua, foro_romano_y_palatino: G.antigua, arco_de_constantino: G.antigua, circo_maximo: G.antigua, // (E) Coliseo, Foro, Circo Máximo
  altar_de_la_patria: G.antigua, plaza_venecia: G.antigua, via_dei_fori_imperiali: G.antigua, mercados_de_trajano: G.antigua, columna_de_trajano: G.antigua,
  plaza_del_campidoglio: G.antigua, museos_capitolinos: G.antigua, teatro_de_marcelo: G.antigua, basilica_de_san_clemente: G.antigua, iglesia_de_san_pietro_in_vincoli: G.antigua,
  domus_aurea: G.antigua, colle_oppio: G.antigua, monti: G.antigua, terraza_largo_gaetana_agnesi: G.antigua, termas_de_caracalla: G.antigua, via_appia_antica: G.antigua,
  catacumbas_de_san_calixto: G.antigua, santo_bambino_de_aracoeli: G.antigua,
  // Centro histórico
  fontana_de_trevi: G.centro, panteon: G.centro, piazza_navona: G.centro, // (E) Trevi, Panteón, Navona
  largo_di_torre_argentina: G.centro, via_del_corso: G.centro, campo_de_fiori: G.centro, iglesia_del_gesu: G.centro, iglesia_de_san_luigi_dei_francesi: G.centro, ara_pacis: G.centro,
  barrio_judio: G.centro, iglesia_de_santa_maria_sopra_minerva: G.centro, iglesia_de_san_ignacio_de_loyola: G.centro, elefantino_de_bernini: G.centro, fuente_de_las_tortugas: G.centro,
  fuente_del_triton: G.centro, plaza_colonna: G.centro, piazza_colonna: G.centro, plaza_del_quirinal: G.centro, via_dei_coronari: G.centro, templo_de_adriano: G.centro,
  plaza_farnese: G.centro, ponte_sisto: G.centro, palazzo_doria_pamphilj: G.centro, cripta_de_los_capuchinos: G.centro, via_veneto: G.centro,
  mercadillo_de_navidad_de_piazza_navona: G.centro,
  // Plaza de España
  plaza_de_espana: G.espana, via_condotti: G.espana, // (E) Via Condotti
  trinita_dei_monti: G.espana, via_del_babuino: G.espana, via_margutta: G.espana, luces_de_navidad_del_tridente: G.espana,
  // Popolo
  piazza_del_popolo: G.popolo, santa_maria_del_popolo: G.popolo, via_di_ripetta: G.popolo,
  // Vaticano
  museos_vaticanos_y_capilla_sixtina: G.vaticano, basilica_de_san_pedro: G.vaticano, plaza_de_san_pedro: G.vaticano, via_della_conciliazione: G.vaticano, lungotevere: G.vaticano,
  castillo_de_santangelo: G.vaticano, puente_santangelo: G.vaticano, borgo_pio: G.vaticano, cupula_de_san_pedro: G.vaticano, '100_presepi_in_vaticano': G.vaticano,
  // Villa Borghese
  galeria_borghese: G.borghese, parque_de_villa_borghese: G.borghese, bioparque_de_roma: G.borghese, galeria_nacional_de_arte_moderno: G.borghese, porta_pinciana: G.borghese,
  quartiere_coppede: G.borghese,
  // Trastevere
  isla_tiberina: G.trastevere, iglesia_de_santa_maria_in_trastevere: G.trastevere, villa_farnesina: G.trastevere, plaza_trilussa: G.trastevere,
  san_pietro_in_montorio_y_tempietto_de_bramante: G.trastevere, basilica_de_santa_cecilia_in_trastevere: G.trastevere, trastevere: G.trastevere,
  // Basílicas y el Aventino
  boca_de_la_verdad: G.basilicas, jardin_de_los_naranjos: G.basilicas, basilica_de_santa_maria_la_mayor: G.basilicas, ojo_de_la_cerradura_del_aventino: G.basilicas, // (E) Santa María la Mayor, Ojo de la cerradura
  basilica_de_san_juan_de_letran: G.basilicas, iglesia_de_santa_maria_della_vittoria: G.basilicas,
  piramide_cestia: G.basilicas, mercado_de_testaccio: G.basilicas, cementerio_protestante: G.basilicas, testaccio: G.basilicas,
  // Roma desde las alturas
  mirador_del_janiculo: G.alturas, terraza_del_pincio: G.alturas, jardines_del_pincio: G.alturas, // (E) Janículo y Pincio
  mirador_de_san_pietro_in_montorio: G.alturas, fontana_dellacqua_paola: G.alturas,
}

/** Los paseos por barrio (`zone_walks`): el grupo de su zona. */
export const POR_ZONA_DE_PASEO = {
  trastevere: G.trastevere, centro_historico: G.centro, roma_antigua: G.antigua, villa_borghese: G.borghese, vaticano: G.vaticano,
  aventino: G.basilicas, testaccio: G.basilicas, appia: G.antigua, san_giovanni: G.basilicas, esquilino: G.basilicas, nomentano: G.borghese,
}

/** Los paseos libres («Pasea y piérdete por…»), por la clave de su zona en destination_config.paseo_libre.zonas. */
export const POR_ZONA_DE_PASEO_LIBRE = {
  tridente: G.espana, trevi: G.centro, centro_historico: G.centro, monti: G.antigua, coliseo: G.antigua, trastevere: G.trastevere, testaccio: G.basilicas, prati: G.vaticano, vaticano: G.vaticano,
}

/** Las nocturnas (night_experiences), por su id: el grupo del sitio que se ve de noche. */
export const POR_NOCHE = {
  noche_coliseo: G.antigua, noche_fontana_de_trevi: G.centro, noche_plaza_de_espana: G.espana, noche_panteon: G.centro, noche_mirador_del_janiculo: G.alturas, noche_terraza_del_pincio: G.alturas,
  noche_el_puente_y_el_castillo_de_santangelo: G.vaticano, noche_foro_romano_desde_el_campidoglio: G.antigua, noche_piazza_navona: G.centro, noche_trastevere: G.trastevere,
}

const NOMBRES_TOP = { lista: LISTA_DE_GRUPOS.filter((nombre) => nombre !== 'Excursión desde Roma' && nombre !== 'Free Tour'), free_tour: 'Free Tour', excursion: 'Excursión desde Roma' }

function escribir() {
  const bruto = fs.readFileSync(RUTA, 'utf8')
  const eol = bruto.includes('\r\n') ? '\r\n' : '\n'
  const lineas = bruto.split(eol)
  const salida = []
  const hechos = { sitios: 0, noches: 0, paseos: 0, libres: 0 }
  let zonaActual = null // 'places' | 'zone_walks' | 'paseo_libre'
  let idActual = null
  let esperaZona = false
  let claveLibre = null
  let haySeccion = false
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]
    if (/^  "places": \[$/.test(linea) && !haySeccion) { zonaActual = 'places'; haySeccion = true }
    else if (/^  "night_experiences": \[$/.test(linea)) zonaActual = 'night'
    else if (/^  "zone_walks": \[$/.test(linea)) zonaActual = 'zone_walks'
    else if (/^    "paseo_libre": \{$/.test(linea)) zonaActual = 'paseo_libre'
    else if (/^  "[a-z_0-9]+": /.test(linea) && !/^  "(places|zone_walks|night_experiences)": \[$/.test(linea)) zonaActual = null
    if (zonaActual === 'paseo_libre' && /^    "[a-z_0-9]+": /.test(linea) && !/^    "paseo_libre"/.test(linea) && !/^    "zonas"/.test(linea) && !/^    "_/.test(linea)) {
      // otra clave de destination_config: el paseo libre se acabó
      zonaActual = null
    }
    // Ya tiene grupo_dia: se salta (se repone si estaba, para poder repetir)
    if (/^\s+"grupo_dia": /.test(linea)) continue
    if (/^  "por_que_lugares": \{$/.test(linea)) {
      salida.push(`  "grupos_dia": ${JSON.stringify(NOMBRES_TOP, null, 2).split('\n').map((l, n) => (n === 0 ? l : `  ${l}`)).join(eol)},`)
    }
    if (/^  "grupos_dia": \{$/.test(linea)) {
      // bloque de una ejecución anterior: se salta entero
      while (!/^  \},$/.test(lineas[i])) i++
      continue
    }
    salida.push(linea)
    if (zonaActual === 'places' || zonaActual === 'night') {
      const m = /^      "id": "([^"]+)",$/.exec(linea)
      if (m) { idActual = m[1]; esperaZona = true }
      if (esperaZona && /^      "zone": /.test(linea)) {
        esperaZona = false
        const grupo = zonaActual === 'night' ? POR_NOCHE[idActual] : POR_SITIO[idActual]
        if (!grupo) throw new Error(`Sin grupo: ${idActual}`)
        salida.push(`      "grupo_dia": ${JSON.stringify(grupo)},`)
        hechos[zonaActual === 'night' ? 'noches' : 'sitios']++
      }
    } else if (zonaActual === 'zone_walks') {
      if (/^      "zone": /.test(linea)) {
        const zona = /"zone": "([^"]+)"/.exec(linea)[1]
        const grupo = POR_ZONA_DE_PASEO[zona]
        if (!grupo) throw new Error(`Paseo sin grupo: ${zona}`)
        salida.push(`      "grupo_dia": ${JSON.stringify(grupo)},`)
        hechos.paseos++
      }
    } else if (zonaActual === 'paseo_libre') {
      const m = /^        "([a-z_0-9]+)": \{$/.exec(linea)
      if (m && POR_ZONA_DE_PASEO_LIBRE[m[1]] !== undefined) claveLibre = m[1]
      if (claveLibre && /^          "nombre": /.test(linea)) {
        salida.push(`          "grupo_dia": ${JSON.stringify(POR_ZONA_DE_PASEO_LIBRE[claveLibre])},`)
        hechos.libres++
        claveLibre = null
      }
    }
  }
  fs.writeFileSync(RUTA, salida.join(eol))
  JSON.parse(fs.readFileSync(RUTA, 'utf8')) // tiene que seguir siendo JSON
  return hechos
}

if (process.argv[1]?.endsWith('asignarGruposDia6y7.mjs')) {
  if (process.argv.includes('--revisar')) {
    const datos = JSON.parse(fs.readFileSync(RUTA, 'utf8'))
    const faltan = datos.places.filter((place) => !POR_SITIO[place.id]).map((place) => place.id)
    const sobran = Object.keys(POR_SITIO).filter((id) => !datos.places.some((place) => place.id === id))
    console.log(`sitios: ${datos.places.length} · sin grupo: ${faltan.join(', ') || 'ninguno'} · ids de más: ${sobran.join(', ') || 'ninguno'}`)
  } else console.log(escribir())
}
