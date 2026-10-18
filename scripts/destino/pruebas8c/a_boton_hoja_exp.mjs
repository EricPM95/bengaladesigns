// Prueba de mi parte de la 8C2: el botón flotante, la hoja de logros, la EXP a la vista y Compartir.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

export const titulo = 'Botón flotante, hoja de logros, EXP a la vista y Compartir'

export default async function ({ debe, leer, archivos, sinComentarios }) {
  // --- Funciones puras: se compilan y se prueban de verdad ---
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba8c-hoja-'))
  const abs = (f) => path.resolve(f).split(path.sep).join('/')
  fs.writeFileSync(
    path.join(carpeta, 'e.ts'),
    `export * from '${abs('src/components/logros/momentos/hoja/textosHoja.ts')}'\nexport * from '${abs('src/components/logros/momentos/hoja/piezaDeInsignia.ts')}'\nexport { pasoTrasLaExp } from '${abs('src/components/logros/momentos/pasoTrasLaExp.ts')}'\n`,
  )
  const salida = path.join(carpeta, 's.cjs')
  await build({ entryPoints: [path.join(carpeta, 'e.ts')], outfile: salida, bundle: true, platform: 'node', format: 'cjs', logLevel: 'error', jsx: 'automatic', define: { 'import.meta.env': '{"DEV":false}' }, external: ['react', 'react-dom'] })
  const T = createRequire(import.meta.url)(salida)

  const v = (inicio, fin, hoy) => ({ inicio, fin, hoy })
  debe(T.faseDelViaje(v('2026-10-29', '2026-11-01', '2026-10-20')) === 'antes', 'fase', 'antes del viaje')
  debe(T.faseDelViaje(v('2026-10-29', '2026-11-01', '2026-10-29')) === 'durante' && T.faseDelViaje(v('2026-10-29', '2026-11-01', '2026-11-01')) === 'durante', 'fase', 'el primer y el último día es durante')
  debe(T.faseDelViaje(v('2026-10-29', '2026-11-01', '2026-11-02')) === 'despues' && T.faseDelViaje(null) === 'antes', 'fase', 'después del viaje; sin viaje, antes')
  debe(T.etiquetaDeFase('antes', v('2026-10-29', '2026-11-01', '2026-10-20'), 'Roma') === 'Antes del viaje · 29 oct – 1 nov', 'etiqueta', 'rango entre dos meses')
  debe(T.etiquetaDeFase('despues', v('2026-10-13', '2026-10-16', '2026-10-20'), 'Roma') === 'Viaje terminado · 13 – 16 oct', 'etiqueta', 'rango en el mismo mes')
  debe(T.etiquetaDeFase('durante', v('2026-10-29', '2026-11-01', '2026-10-29'), 'Roma') === 'Jue 29 · día 1', 'etiqueta', 'día 1')
  debe(T.etiquetaDeFase('durante', v('2026-10-29', '2026-11-01', '2026-11-01'), 'Roma') === 'Dom 1 · último día en Roma', 'etiqueta', 'último día')
  debe(T.textoDelSiguiente({ fase: 'durante', grado: null, siguiente: { grado: 'bronce', faltan: 1 } }) === 'Empieza en bronce', 'siguiente', 'sin grado')
  debe(T.textoDelSiguiente({ fase: 'durante', grado: 'bronce', siguiente: { grado: 'plata', faltan: 2 } }) === 'Te faltan 2 para la plata', 'siguiente', 'plural')
  debe(T.textoDelSiguiente({ fase: 'durante', grado: 'bronce', siguiente: { grado: 'plata', faltan: 1 } }) === 'Te falta 1 para la plata', 'siguiente', 'singular')
  debe(T.textoDelSiguiente({ fase: 'despues', grado: 'oro', siguiente: { grado: 'diamante', faltan: 2 } }) === 'Te quedan 2 para el diamante', 'siguiente', 'después del viaje')
  debe(T.textoDelSiguiente({ fase: 'durante', grado: 'diamante', siguiente: null, alCompletar: 'Lo esencial, visto' }) === 'Lo esencial, visto', 'siguiente', 'en diamante')
  debe(T.bannerAntes(7, 11) === 'Con tu ruta puedes completar 7 de las 11 colecciones' && T.bannerAntes(null, 11) === null, 'banner', 'antes del viaje, con el número de su ruta')
  debe(T.bannerDespues('Roma', { grado: 'oro', n: 6, total: 8 }).startsWith('Te quedan 2 para el diamante de Roma.') && T.bannerDespues('Roma', { grado: 'diamante', n: 8, total: 8 }) === null, 'banner', 'después del viaje, nada si ya tiene el diamante')
  debe(T.tituloDeSecretos('antes', 'Roma', 12, 0) === 'Roma esconde 12 secretos', 'secretos', 'antes del viaje')
  debe(T.tituloDeSecretos('durante', 'Roma', 12, 3) === 'Roma aún esconde 9 secretos.' && T.tituloDeSecretos('despues', 'Roma', 12, 11) === 'Roma aún esconde 1 secreto.', 'secretos', 'durante y después: «aún esconde N secretos.»')
  debe(!/de 12 secretos encontrados|\d+ de \d+ secretos/.test(leer('src/components/logros/momentos/hoja/textosHoja.ts')), 'secretos', 'nunca «N de 12 secretos encontrados»')
  debe(T.marcaDeColeccion({ fase: 'antes', completa: false, nuevo: false, enTuRuta: true, ciudad: 'Roma' }).texto === 'En tu ruta', 'marca', 'antes: En tu ruta')
  debe(T.marcaDeColeccion({ fase: 'durante', completa: true, nuevo: true, enTuRuta: false, ciudad: 'Roma' }).etiqueta === 'completa', 'marca', 'completa gana a nuevo')
  debe(T.marcaDeColeccion({ fase: 'despues', completa: false, nuevo: false, enTuRuta: false, ciudad: 'Roma' }).faltaParaOtroViaje === 'Para tu próximo viaje a Roma', 'marca', 'después: para tu próximo viaje')
  // Tocar un pedazo: la forma de cada insignia
  debe(T.piezaDeInsignia('imprescindibles', 8, 0.5, 0.05) === 0 || T.piezaDeInsignia('imprescindibles', 8, 0.5, 0.05) === 7, 'pieza', 'octógono: arriba es la primera o la última teselas')
  debe(T.piezaDeInsignia('imprescindibles', 8, 0.5, 0.5) === null, 'pieza', 'el centro del octógono no es ningún pedazo')
  debe(T.piezaDeInsignia('cuatro_joyas', 4, 0.5, 0.05) === 0 && T.piezaDeInsignia('cuatro_joyas', 4, 0.95, 0.5) === 1 && T.piezaDeInsignia('cuatro_joyas', 4, 0.05, 0.5) === 2 && T.piezaDeInsignia('cuatro_joyas', 4, 0.5, 0.95) === 3, 'pieza', 'las 4 joyas: arriba, derecha, izquierda, abajo')
  debe(T.piezaDeInsignia('caravaggio', 3, 0.1, 0.5) === 0 && T.piezaDeInsignia('caravaggio', 3, 0.9, 0.5) === 2, 'pieza', 'la cinta: de izquierda a derecha')
  debe(T.piezaDeInsignia('roma_antigua', 6, 2, 0.5) === null, 'pieza', 'fuera del dibujo, nada')
  const todas = new Set()
  for (let a = 0; a < 360; a += 5) todas.add(T.piezaDeInsignia('roma_antigua', 6, 0.5 + 0.4 * Math.cos((a * Math.PI) / 180), 0.5 + 0.4 * Math.sin((a * Math.PI) / 180)))
  debe(todas.size === 6, 'pieza', 'una insignia de 6 cuñas tiene los 6 pedazos tocables')
  // EXP: qué sale después del «+EXP»
  const r = (rango_ix, nivel) => ({ rango_ix, nivel })
  debe(T.pasoTrasLaExp({ antes: r(0, 3), despues: r(0, 4) }) === 'nivel', 'exp', 'sube de nivel → E3')
  debe(T.pasoTrasLaExp({ antes: r(0, 5), despues: r(1, 6) }) === 'rango', 'exp', 'cambia de rango → E4')
  debe(T.pasoTrasLaExp({ antes: r(1, 7), despues: r(1, 7) }) === null, 'exp', 'sin subir, solo el +EXP')

  // --- El código ---
  const exph = sinComentarios(leer('src/components/logros/momentos/ExpHost.tsx'))
  debe(/ronda/.test(exph) && /resumenDia/.test(exph) && /resumenViaje/.test(exph) && /hojaAbierta/.test(exph) && /visibilityState/.test(exph), 'exp', 'la EXP espera a que acaben las sorpresas, el resumen y las hojas, y a que la app se vea')
  debe(/ESPERA_TRAS_EL_VUELO_MS/.test(exph), 'exp', 'primero el vuelo del dibujo y luego el «+EXP»')
  const host = leer('src/components/logros/momentos/MomentosHost.tsx')
  debe(/<ExpHost \/>/.test(host), 'exp', 'ExpHost está montado')
  const visibles = archivos('src/components/logros/momentos').filter((f) => !/demoMomentos|ExpHost/.test(f))
  const pintaExp = visibles.filter((f) => /\bEXP\b|despues\.exp|\.exp\b/.test(sinComentarios(leer(f)).replace(/data-exp|ExpHost/g, '')))
  debe(pintaExp.length === 0, 'exp', `ni las sorpresas ni los resúmenes enseñan EXP (solo ExpHost): ${pintaExp.join(', ')}`)
  const store = leer('src/store/useLogrosStore.ts')
  debe(/tomarExp/.test(store) && /s\.exp\.antes/.test(store), 'exp', 'la EXP se suma en el almacén, con el «antes» del primero')
  // --- La hoja ---
  const hoja = sinComentarios(leer('src/components/logros/momentos/HojaLogros.tsx'))
  debe(!/<Emblema\b[^>]*silueta/.test(hoja) && /encontrados_lista/.test(hoja), 'emblemas', 'la hoja solo dibuja emblemas de la lista de encontrados')
  debe(/\?<\/span>/.test(hoja) || /\?\s*<\/span>/.test(hoja), 'emblemas', 'los que faltan son solo «?»')
  debe(!/madrugador|nocturno/i.test(hoja.replace(/ID_EMBLEMAS[^\n]*\n/, '')), 'horas', 'ni Madrugador ni Nocturno con hora en la hoja')
  debe(/minHeight: 44/.test(hoja) && /width: 48, height: 48/.test(hoja), 'toque', 'los botones de la hoja miden 44 px o más')
  debe(/data-grado|moPop/.test(hoja + leer('src/components/logros/momentos/BotonFlotanteLogros.tsx')), 'hoja', 'sale con su animación')
  const boton = sinComentarios(leer('src/components/logros/momentos/BotonFlotanteLogros.tsx'))
  debe(/modo === 'today' \? 120 : 88/.test(boton), 'boton', 'en HOY el botón sube')
  debe(/strokeDasharray=\{grado \? undefined : '4 3'\}/.test(boton), 'boton', 'antes del viaje el aro va a rayas')
  debe(/logrosActivos\(\)\) return null/.test(boton), 'boton', 'con los logros apagados no se monta')
  debe(/logrosActivos\(\) \? 'pb-28'/.test(leer('src/components/route/DayList.tsx')), 'dias', 'la lista de días deja hueco al final solo con los logros encendidos')
  const css = leer('src/components/logros/momentos/momentos.css')
  debe(/prefers-reduced-motion/.test(css) && /@keyframes moPop/.test(css), 'movimiento', 'reducir movimiento cubre la hoja')
  // --- Los números salen del servidor ---
  const servicio = leer('server/logros/servicio.js')
  debe(/en_ruta: enRuta\.has\(s\.sitio\)/.test(servicio) && /\.\.\.\(coordenadasDeSitio/.test(servicio), 'servidor', 'el estado manda el nombre, si está en la ruta y las coordenadas de cada sitio')
  // --- Compartir ---
  const imagen = sinComentarios(leer('src/components/logros/momentos/imagen.ts'))
  debe(/LOGO_DE_LA_APP: string \| null = null/.test(imagen) && /setLineDash/.test(imagen), 'compartir', 'el hueco del logo queda vacío y preparado')
  debe(!/Routy/.test(imagen + leer('src/components/logros/momentos/Compartir.tsx')), 'compartir', 'ningún nombre de la app puesto a mano')
  debe(/marco-\$\{/.test(imagen) && /datosDelPie/.test(leer('src/components/logros/momentos/Compartir.tsx')), 'compartir', 'el pie lleva el marco de rango y el título')
  debe(!/secretos\.texto/.test(imagen), 'compartir', 'la imagen del viaje no dice «N de 12 secretos encontrados»')
  // --- Demo de EXP con las funciones del servidor ---
  debe(/server\/logros\/exp\.js/.test(leer('src/lib/logrosDemo_exp.ts')), 'demo', 'el demo de la EXP usa las funciones y la tabla del servidor')
}
