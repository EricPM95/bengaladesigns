// Qué línea de la prueba mira cada una de las 15 reglas de docs/REGLAS_RUTAS.md («Cómo se comprueba»).
// `tipos`: los nombres de lo que cuenta la prueba (los de auditoria.mjs, auditoriaReglas.mjs y prueba365.mjs).
// `nota`: si la regla no tiene comprobación en esta prueba (o solo en parte), dónde se mira o por qué no.
// Una regla con `tipos` vacío sale como «SIN COMPROBACIÓN».
export const REGLAS_PRUEBA = [
  { id: 1, nombre: 'Nunca un sitio cerrado', tipos: ['fuera_de_horario', 'v4_fuera_de_horario', 'cerrada_a_su_hora', 'v4_cerrado_sin_solucion', 'acaba_tras_cierre', 'acortada_menos_20', 'fuera_sin_vista', 'fuera_minutos', 'fuera_con_tiempo', 'pago_sin_dentro', 'basilica_fuera', 'vaticano_sin_castillo', 'vaticano_sin_puente'] },
  { id: 2, nombre: 'El viajero manda', tipos: ['v4_llega_tarde', 'hora_fija_movida', 'aviso_de_llegada', 'en_el_dia_y_no_incluido', 'pool_fuera'] },
  { id: 3, nombre: 'Un sitio, una vez en el viaje', tipos: ['repetido_dia', 'repetido_viaje', 'sitio_dos_dias', 'nocturna_repite', 'nocturna_repite_viaje', 'foto_repetida', 'barrio_dos_veces', 'paseo_repite_viaje', 'paseo_misma_zona', 'no_incluido_pero_visto'] },
  { id: 4, nombre: 'Cada día, una zona y un sentido', tipos: ['zigzag', 'tramo_largo', 'dos_visitas_grandes', 'grupo_partido', 'plaza_despues', 'joya_tarde'] },
  { id: 5, nombre: 'Coliseo y Museos Vaticanos a primera hora', tipos: ['primera_hora', 'se_llena_tarde'], nota: '«Si solo cabe uno, uno» no se mira aquí.' },
  { id: 6, nombre: 'La tarde según la luz', tipos: ['v4_elastica', 'atardecer_corto', 'atardecer_tarde', 'mirador_fuera_de_hora'] },
  { id: 7, nombre: 'La comida', tipos: ['comida_menos_45', 'comida_mas_90', 'v4_comida_corta', 'restaurante_repetido'], nota: 'Los 15 min andando y «abierto ese día» no se miran aquí.' },
  { id: 8, nombre: 'La noche', tipos: ['cena_espera', 'hueco_cena', 'cena_lejos_nocturna', 'nocturna_antes_de_cenar', 'noche_pasa_limite', 'cena_tarde', 'v4_antes_de_cenar'] },
  { id: 9, nombre: 'Los huecos', tipos: ['hueco', 'libre_largo', 'libre_pisa_comida', 'espera_mas_90', 'min_max_pasado', 'paseo_largo', 'duracion_corta', 'v4_parada_corta', 'tiempo_libre_sigue', 'hora_no_10', 'duracion_no_5', 'no_cuadra'] },
  { id: 10, nombre: 'El Free Tour', tipos: ['tour_repite'] },
  { id: 11, nombre: 'Qué es parada', tipos: ['nivel_camino', 'nivel_idea', 'calle_parada', 'camino_sin_nombre', 'camino_cierra_pool'] },
  { id: 12, nombre: 'Según los días del viaje', tipos: [], nota: 'Los viajes de 1 día y sin fechas están en la prueba, pero ninguna línea mira «1 día, todo por fuera».' },
  { id: 13, nombre: 'Las experiencias', tipos: ['experiencia_sin_efecto', 'experiencia_fuera_de_zona'] },
  { id: 14, nombre: 'Las fechas especiales', tipos: ['aviso_promete', 'aviso_lugar_ajeno', 'aviso_repetido', 'nota_promete', 'texto_condicion', 'v4_titulo', 'titulo_hora'], nota: 'Las fechas clave tienen su sección aparte en el informe.' },
  { id: 15, nombre: 'Excursiones, llegada y vuelta', tipos: [], nota: 'Las mira scripts/destino/llegadas.mjs, no esta prueba (y está pendiente del encargo de vuelos).' },
]
