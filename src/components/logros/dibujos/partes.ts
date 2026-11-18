/**
 * (V13) LAS 18 INSIGNIAS, POR PARTES: para cada colección, la clave de su pieza de Design (`Piezas/Insignia Lanza Codigo`: r1…r11 en Roma, 1…7 en Lanzarote) y sus sitios EN EL ORDEN DE LOS DATOS (un trozo por sitio).
 * GENERADO por `node scripts/destino/generarPartes.mjs` desde data/logros/roma.json y lanzarote.json: no se edita a mano (si cambian los sitios, se vuelve a generar; `pruebaV13` lo comprueba).
 */
export interface ColeccionPorPartes {
  destino: 'roma' | 'lanzarote'
  /** La clave de la pieza de Design. */
  col: string
  /** Los sitios, en el orden de los datos: el trozo `k` es el sitio `k`. */
  sitios: string[]
}

export const COLECCIONES_POR_PARTES: Record<string, ColeccionPorPartes> = {
  "imprescindibles": { destino: "roma", col: "r1", sitios: ["coliseo","foro_romano_y_palatino","fontana_de_trevi","panteon","piazza_navona","plaza_de_espana","castillo_de_santangelo","trastevere"] },
  "pais_mas_pequeno": { destino: "roma", col: "r2", sitios: ["museos_vaticanos_y_capilla_sixtina","basilica_de_san_pedro","plaza_de_san_pedro"] },
  "cuatro_joyas": { destino: "roma", col: "r3", sitios: ["coliseo","fontana_de_trevi","panteon","museos_vaticanos_y_capilla_sixtina"] },
  "alma_trastevere": { destino: "roma", col: "r4", sitios: ["isla_tiberina","iglesia_de_santa_maria_in_trastevere","san_pietro_in_montorio_y_tempietto_de_bramante","trastevere"] },
  "miguel_angel": { destino: "roma", col: "r5", sitios: ["museos_vaticanos_y_capilla_sixtina","basilica_de_san_pedro","plaza_del_campidoglio","iglesia_de_santa_maria_sopra_minerva"] },
  "bernini": { destino: "roma", col: "r6", sitios: ["piazza_navona","elefantino_de_bernini","plaza_de_san_pedro","basilica_de_san_pedro","puente_santangelo"] },
  "caravaggio": { destino: "roma", col: "r7", sitios: ["iglesia_de_san_luigi_dei_francesi","santa_maria_del_popolo","galeria_borghese"] },
  "roma_antigua": { destino: "roma", col: "r8", sitios: ["coliseo","foro_romano_y_palatino","largo_di_torre_argentina","castillo_de_santangelo","circo_maximo","termas_de_caracalla"] },
  "miradores": { destino: "roma", col: "r9", sitios: ["mirador_del_janiculo","terraza_del_pincio","jardin_de_los_naranjos"] },
  "plazas_y_fuentes": { destino: "roma", col: "r10", sitios: ["piazza_navona","piazza_del_popolo","plaza_de_espana","plaza_venecia","fontana_de_trevi","fontana_dellacqua_paola","fuente_del_triton"] },
  "roma_secreta": { destino: "roma", col: "r11", sitios: ["ojo_de_la_cerradura_del_aventino","piramide_cestia","basilica_de_san_clemente","san_pietro_in_montorio_y_tempietto_de_bramante","fuente_de_las_tortugas"] },
  "lz_imprescindibles": { destino: "lanzarote", col: "1", sitios: ["montanas_del_fuego","jameos_del_agua","cueva_de_los_verdes","mirador_del_rio","fundacion_cesar_manrique","charco_de_los_clicos","la_geria_y_sus_bodegas"] },
  "cesar_manrique": { destino: "lanzarote", col: "2", sitios: ["jameos_del_agua","mirador_del_rio","jardin_de_cactus","fundacion_cesar_manrique","casa_museo_cesar_manrique","casa_museo_del_campesino","castillo_de_san_jose"] },
  "tierra_de_fuego": { destino: "lanzarote", col: "3", sitios: ["montanas_del_fuego","cueva_de_los_verdes","los_hervideros","volcan_del_cuervo","caldera_blanca","las_grietas_montana_blanca","ciudad_estratificada_rofera_de_teseguite"] },
  "isla_a_tus_pies": { destino: "lanzarote", col: "4", sitios: ["mirador_del_rio","mirador_de_guinate","ermita_de_las_nieves","mirador_del_bosquecillo","mirador_de_haria","salinas_de_janubio"] },
  "playas_y_charcos": { destino: "lanzarote", col: "5", sitios: ["playas_de_papagayo","caleton_blanco","charco_de_los_clicos","playa_de_famara","punta_mujeres_y_arrieta","playa_de_la_garita","playa_de_montana_bermeja"] },
  "pueblos_con_alma": { destino: "lanzarote", col: "6", sitios: ["teguise","arrecife_charco_de_san_gines_y_el_paseo","el_golfo_pueblo","haria_pueblo","caleta_de_famara","puerto_del_carmen_puerto_viejo"] },
  "entre_vinas_de_ceniza": { destino: "lanzarote", col: "7", sitios: ["la_geria_y_sus_bodegas","bodega_la_geria","bodega_el_grifo"] },
}
