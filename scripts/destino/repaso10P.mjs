// Genera docs/dias/REPASO_10P.html (la lista de comprobación con casillas, arriba del todo, y las capturas a tamaño de móvil) y, con --md, imprime la misma lista en Markdown para el informe.
//   node scripts/destino/repaso10P.mjs          → escribe docs/dias/REPASO_10P.html
//   node scripts/destino/repaso10P.mjs --md     → imprime la lista de comprobación en Markdown
// La lista sigue el prompt de la Tanda 10P (docs/dias/PROMPT_TANDA10P.md), punto por punto y en el mismo orden.
import fs from 'node:fs'

const OK = '✅ Hecho'
const MEDIAS = '⚠️ A medias'
const NO = '❌ No hecho'
const SP = 'sin pase'
const CP = 'con pase'

/** [apartado, texto del punto, estado, nota (qué falta o cómo está), dónde lo mira Eric (con qué cuenta o modo), captura|null] */
const PUNTOS = [
  ['0 · Antes de empezar', 'Prompt guardado en docs/dias/PROMPT_TANDA10P.md y en el commit', OK, '', 'No es de móvil.', null],
  ['0 · Antes de empezar', 'Design al día (docs/diseno/proyecto/, sin uploads/): Pase Moneda y Sorteo Perfil nuevas; Pase Pelicula, Logros Pantallas, Perfil, App Pase y cuenta, App Ruta y dias, Reservas v4, Presupuesto y Propuesta Boton/Cambios', OK, 'El zip de la carpeta se llama «NUEVA TANDA.zip» (no «NUEVA_TANDA_1.zip»); «PRESUPUESTO.zip» tiene lo mismo en estas piezas. Dejé fuera las capturas de pantalla (screenshots/) y el .thumbnail del zip.', 'No es de móvil.', null],
  ['0 · Antes de empezar', 'Reservas v4 («¿Para quién es?») y Presupuesto (cartera de Extras): no tocarlos ahora (van en la 10N)', OK, 'Solo se copió su diseño; el código de la app no se ha tocado.', 'No es de móvil.', null],

  ['1.1 · La historia de prueba', 'La historia de prueba es la del sitio que el viajero elija (no la fija del Coliseo)', OK, '', `DÍAS › abrir cualquier parada con historia › barra de abajo (${SP}).`, '10p_hoy_historia_prueba.jpg'],
  ['1.1 · La historia de prueba', 'Antes de usarla, en todos los sitios con historia: «Escuchar historia · Gratis, tu historia de prueba · 0/1» («Gratis» en oro)', OK, '', `DÍAS › parada › barra de abajo; y HOY (con ?hoy2=on en desarrollo) › botón «Escuchar historia» (${SP}).`, '10p_hoy_historia_prueba.jpg'],
  ['1.1 · La historia de prueba', 'Se gasta a los 3 segundos de escucharla y esa historia se queda suya, para todo el viaje', OK, 'A 1,4 s no se gasta; a 4 s sí.', `Toca ▶ en una parada y espera más de 3 s; vuelve a abrirla: sigue abierta (${SP}).`, null],
  ['1.1 · La historia de prueba', 'Las demás, después: el mismo botón con el candado dorado a la derecha y «Todas las historias, con el Pase de Roma»', OK, '', `Abre otra parada distinta de la que escuchaste (${SP}).`, '10p_hoy_historia_cerrada.jpg'],
  ['1.1 · La historia de prueba', 'Una por destino, guardada en la cuenta (no solo en el móvil)', MEDIAS, 'Hecho, pero la tabla `historia_de_prueba` (migración 0033) está SIN APLICAR: hasta entonces vive en el móvil y se sube sola cuando exista la tabla. El móvil escribe directo con RLS (como los [Visto]), sin endpoint de servidor: dime si prefieres endpoint.', 'Aplica 0033 en el editor SQL de Supabase; luego, en otro móvil con la misma cuenta, la misma historia sale gastada.', null],
  ['1.1 · La historia de prueba', 'El día de prueba de HOY no la gasta', OK, '', `HOY › «Tu día de prueba» › escucha una historia más de 3 s: no cambia el 0/1 (${CP}).`, null],

  ['1.2 · La película en el móvil', 'Que ocupe toda la pantalla, sin márgenes negros a los lados y sin deformarse', OK, 'Medido a 390, 430 y 360 de ancho en Chrome emulando móvil; no en un iPhone real.', `RUTA › pastilla «Pase de Roma» (${SP}).`, '10p_pase_01_final_390x664.jpg'],
  ['1.2 · La película en el móvil', 'En el final se puede bajar: la lista hace scroll y la parte fija de abajo («Se paga una vez y no caduca», [Elegir mi pase]…) siempre a la vista', OK, 'Dos causas: las zonas de toque y el degradado tapaban la lista.', `Película › final › baja la lista con el dedo (${SP}; en el iPhone).`, '10p_pase_02_final_430x932.jpg'],
  ['1.2 · La película en el móvil', 'Botón [Ver] arriba, junto a [Saltar] (o junto al ✕ en el final), para verla otra vez desde el principio', OK, 'En el final va junto al ✕; [Saltar] ya no se ve en el final.', `Final de la película › [Ver] arriba (${SP}).`, '10p_pase_05_ver_otra_vez_empieza.jpg'],
  ['1.2 · La película en el móvil', 'Cuando ya se ha visto, el final sale ya montado (sin repetir la animación de unos 5 s al tocar [Elegir mi pase] o cualquier botón del pase)', OK, 'Medido: a los 0,5 s no queda ninguna animación sin acabar.', `Abre el pase una segunda vez › sale directo con «Pase de Roma», la lista y [Elegir mi pase] (${SP}).`, '10p_pase_06_final_EUR.jpg'],

  ['1.3 · La puesta de sol y lo de mañana en HOY', 'El atardecer: si la siguiente parada es un mirador del atardecer, «Al Janículo para el atardecer: el sol se pone a las 17:02» (con el icono del sol)', MEDIAS, 'Hecho y probado, pero la hora sale de `sunsetText` del motor y en la ruta de pruebas de desarrollo llega vacío (la prueba lo pone a mano): confirma que en producción llega siempre. Y HOY v2 solo se ve con `?hoy2=on` (o VITE_HOY_V2 en producción): confírmalo.', `HOY, en un día con mirador del atardecer como siguiente parada (${CP} o día de prueba).`, '10p_hoy_atardecer.jpg'],
  ['1.3 · La puesta de sol y lo de mañana en HOY', 'Sin mirador en la ruta y con uno cerca a media tarde: «Hoy el sol se pone a las 17:02 · el Janículo está a 15 min»', MEDIAS, 'Solo mira miradores que ya estén en la ruta (otros días o «si te sobra tiempo»): el catálogo del destino no expone el mirador del atardecer al cliente. Para buscar entre todos habría que ampliar la API de lugares.', `HOY a media tarde sin mirador pendiente (${CP}).`, null],
  ['1.3 · La puesta de sol y lo de mañana en HOY', 'Lo de mañana: al acabar el día o desde la hora de la cena, «Mañana: Vaticano y Trastevere · empiezas a las 9:00», y la reserva con hora del día siguiente si la hay', OK, '', `HOY al acabar las paradas del día (${CP}).`, '10p_hoy_manana.jpg'],
  ['1.3 · La puesta de sol y lo de mañana en HOY', 'El último día del viaje, nada', OK, 'Tampoco en el día de vuelta.', `HOY en el último día (${CP}).`, null],
  ['1.3 · La puesta de sol y lo de mañana en HOY', 'Con el pase (y el día de prueba); sin pase, como ahora', OK, '', `HOY (${SP}: sin la puesta de sol ni lo de mañana).`, null],

  ['1.4 · La lista del pase', 'Fuera de la lista (final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY): «Modo "a mi aire"» y «El reto del día»', OK, 'Mediante `data/pase/lista_ajustes.json` (si Design cambia la lista y se regenera, los ajustes se siguen aplicando).', `Final de la película › [Ver todo lo que incluye]; y HOY › «Con el pase tendrás» (${SP}).`, '10p_pase_11_todo_lo_que_incluye.jpg'],
  ['1.4 · La lista del pase', 'Se quedan «¿Qué hago ahora?», «Estoy aquí», «Funciona sin internet» y «La puesta de sol y lo de mañana»; apuntar cuáles faltan todavía', MEDIAS, 'Siguen SIN existir: «¿Qué hago ahora?», «Estoy aquí» y «Funciona sin internet» (el service worker no guarda nada). «La puesta de sol y lo de mañana» existe (1.3), con los límites de arriba.', 'No hay dónde mirarlas: están por hacer antes del lanzamiento.', null],
  ['1.4 · La lista del pase', '«Invita a un amigo · Gana 200 EXP cuando haga su primer viaje con HOY» («HOY» con Marca), también en una línea en la hoja de invitar a un amigo', MEDIAS, 'La fila está en el final de la película, en «Todo lo que incluye» y en Ajustes › «Invitar a un amigo». `HojaInvitar.tsx` es la hoja de invitar a un viaje/pase, no la de amigo: si la quieres ahí también es una línea más.', `Ajustes › «Invitar a un amigo» (con o ${SP}).`, '10p_pase_04_invita_a_un_amigo.jpg'],

  ['1.5 · +200 EXP por invitar', '+200 EXP a quien invita cuando el amigo (cuenta nueva) completa su primer viaje con HOY: viaje terminado y HOY usado al menos la mitad de los días (hacia arriba; un día con HOY = al menos un [Visto] ese día)', OK, 'Una sola función compartida con el sorteo; idempotente. Probado con PGlite y las migraciones reales, no contra la base de Supabase real.', 'Perfil › barra de EXP, cuando un amigo haya terminado un viaje así.', null],
  ['1.5 · +200 EXP por invitar', 'Como mucho 5 amigos al año por persona', OK, 'El sexto no da EXP ni aviso.', 'No hay pantalla: se ve en la EXP.', null],
  ['1.5 · +200 EXP por invitar', 'Aviso en la campana de quien invita: «Ana ha hecho su primer viaje con HOY: +200 EXP»', MEDIAS, 'Hecho, pero hace falta aplicar la migración 0034 (amplía los tipos de aviso). Sin ella, la EXP funciona y el aviso no sale.', 'Campana (arriba a la derecha) con la cuenta de quien invitó.', null],
  ['1.5 · +200 EXP por invitar', 'Cuenta para el nivel y para el sorteo, como cualquier otra experiencia', OK, '', 'Perfil › EXP y billete del sorteo.', null],

  ['1.6 · El sorteo', 'El billete dorado en el perfil, debajo de la tarjeta de EXP, con sus tres estados («Te faltan 340 EXP para el nivel 3» con barrita real; «Ya tienes el nivel. Haz un viaje con HOY activado y entras.»; [✓ Estás dentro])', OK, 'Para verlos en desarrollo: en la consola `__demoSorteo.poner("sin_nivel"|"falta_viaje"|"dentro")`.', 'Perfil (foto de arriba a la derecha) › bajo la barra de EXP.', '10p_perfil_1_billete_sin_nivel.jpg'],
  ['1.6 · El sorteo', 'Al tocarlo, la página del sorteo (foto, premio, cuándo se sortea, quién entra, «Cómo se entra» con ✓, [Bases legales] y botón con su estado)', OK, 'La foto es la del Coliseo, que ya estaba en la app; la del diseño era un hueco.', 'Perfil › tocar el billete dorado.', '10p_sorteo_1_pagina_sin_nivel.jpg'],
  ['1.6 · El sorteo', 'Aviso dorado de la campana el día que entra: «¡Ya estás en el sorteo de 2027!», una sola vez', MEDIAS, 'Hecho y probado (una sola vez), pero necesita la migración 0034.', 'Campana, el día en que la cuenta cumple las dos condiciones.', '10p_sorteo_5_campana.jpg'],
  ['1.6 · El sorteo', 'Regla nueva en exp.json: nivel 3 o más + un viaje acabado con HOY la mitad de los días o más, a cualquier destino', MEDIAS, 'La regla está hecha. «A cualquier destino» solo es cierto para destinos con datos de logros (hoy solo Roma): un viaje con HOY en París no cuenta todavía.', 'Admin: `/?admin=logros` › pestaña «Sorteo».', null],
  ['1.6 · El sorteo', 'Se cierra el 31 de agosto (2027: viajes y nivel hasta el 31-ago-2027; después, del 1-sep al 31-ago)', OK, 'Probado: un viaje acabado el 1-sep-2027 ya no cuenta para 2027.', 'Admin › «Sorteo».', null],
  ['1.6 · El sorteo', 'Datos del sorteo en un sitio y fáciles de cambiar: año 2027, Roma, «Un viaje a Roma para dos personas», fechas «del 8 al 10 de octubre de 2027», cierre 31-ago-2027, enlace de bases', OK, '`data/logros/exp.json › sorteo.edicion`. Añadí `fecha_sorteo` (2027-10-10) para saber cuándo pasar al año siguiente.', 'No es de móvil.', null],
  ['1.6 · El sorteo', 'Mientras no haya enlace de las bases, el botón [Bases legales] no sale', OK, '`bases_url` vacío; probado también con enlace.', 'Perfil › billete › página del sorteo.', '10p_sorteo_4_pagina_con_bases.jpg'],
  ['1.6 · El sorteo', 'Después del cierre y hasta el sorteo: «Estás dentro» para quien está dentro; a los demás el billete les cuenta para el año siguiente («Un viaje al destino del año»)', OK, '', 'Perfil › billete.', null],
  ['1.6 · El sorteo', 'Para todos los que tengan los logros encendidos', OK, '', 'Perfil (con los logros encendidos).', null],
  ['1.6 · El sorteo', 'Comprobado de punta a punta con cuentas de prueba (la EXP sube, el nivel se ve, tres estados, menos de la mitad de los días no cuenta, 1-sep-2027 no cuenta, aviso una vez, el admin cuenta a esa cuenta)', MEDIAS, 'Comprobado con PGlite y las migraciones reales, NO contra Supabase real (falta la clave de servicio). Falta: la migración 0034 aplicada y una prueba real con una cuenta de verdad.', 'Perfil y `/?admin=logros`.', null],

  ['1.7 · El precio en la moneda del viajero', 'En «¿Cuántos sois?»: pastilla de la moneda («MXN ⌄») junto a la ✕; precio grande en su moneda («≈ …») y pequeño en euros; tachado y «Ahorras ≈ …»; «≈ … cada uno»; [Comprar · ≈ …]; en euros, todo como ahora', OK, '', `RUTA › pastilla del pase › [Elegir mi pase] (${SP}).`, '10p_pase_07_compra_MXN.jpg'],
  ['1.7 · El precio en la moneda del viajero', 'El final de la película con «≈ … MXN» grande y «6,99 €» pequeño; la hoja «Moneda» desde abajo con la elegida con borde de oro', OK, '', `Final de la película › pastilla de moneda (${SP}).`, '10p_pase_10_hoja_moneda.jpg'],
  ['1.7 · El precio en la moneda del viajero', 'La moneda: la que ya tiene en la app (presupuesto) o, si no, la de su país; se puede cambiar ahí mismo', OK, 'La que se elige en el pase se recuerda en el móvil y NO cambia la del presupuesto: dime si debería.', `RUTA › presupuesto › Moneda; luego el pase (${SP}).`, null],
  ['1.7 · El precio en la moneda del viajero', 'Cifras redondeadas y que cuadren (tachado − precio = ahorro); euros siempre los de precios.json', OK, 'Redondeo de 10 en 10 en pesos mexicanos, de 100 en 100 en COP/CLP. Probado con más de 3000 combinaciones.', `[Elegir mi pase] en MXN, USD y COP (${SP}).`, '10p_pase_09_compra_COP.jpg'],
  ['1.7 · El precio en la moneda del viajero', 'Que nunca pague más de lo que vio: primero el cambio de Stripe si se puede pedir; si no, el cambio del día + 4 % redondeando hacia arriba', OK, 'Stripe no deja pedir el cambio antes de pagar: se aplica el plan B. Por eso el pase sale en 160 MXN y no en 140 (el 4 % más el redondeo hacia arriba). Si te parece caro, se baja el margen.', `[Elegir mi pase] en MXN (${SP}).`, '10p_pase_07_final_MXN.jpg'],
  ['1.7 · El precio en la moneda del viajero', 'De dónde sale el cambio del día y cada cuánto se actualiza', MEDIAS, 'Del Banco Central Europeo (`/api/cambio`, como mucho una vez al día, guardado 12 h). El BCE NO publica COP, CLP, ARS, PEN, UYU, BOB, PYG, CRC, DOP ni GTQ: añadí una segunda fuente gratuita (currency-api vía jsdelivr) solo para esas. Confírmame que te vale; si no, se quitan COP y CLP.', 'No es de móvil.', null],
  ['1.7 · El precio en la moneda del viajero', 'Adaptive Pricing de Stripe: comprobar que sirve para pagos de una vez y en qué países, y qué tiene que tocar Eric', OK, 'Sirve para pagos de una vez de Checkout y Payment Links (más de 150 países, entre ellos MX, CO, CL, PE, ES, PT; ARG no). Eric: panel de Stripe › Ajustes › Pagos › Adaptive Pricing › activarlo (primero en modo prueba, luego en real). No hay que cambiar código. No se probó un pago real.', 'Panel de Stripe (no es de móvil).', null],

  ['1.8 · El perfil y el pasaporte', 'Países, ciudades y mapa salen de un solo sitio (el pasaporte, lo visitado), en el perfil y dentro', OK, 'Una sola función en el servidor para las dos pantallas.', 'Perfil y Perfil › Mi pasaporte: mismas cifras.', '10p_perfil_4_pasaporte_tarjeta.jpg'],
  ['1.8 · El perfil y el pasaporte', 'Perfil (P1): fuera el mapa suelto bajo «Mi pasaporte»; tarjeta con el círculo del mapa a la izquierda, sellos a la derecha y solo «N países · N ciudades»', OK, 'Mientras llega la respuesta del servidor se ve un instante el perfil de siempre (menos de un segundo).', 'Perfil › bajar a la tarjeta burdeos.', '10p_perfil_4_pasaporte_tarjeta.jpg'],
  ['1.8 · El perfil y el pasaporte', 'Pasaporte (P2): «Pasaporte de {nombre}», círculo del mapa mucho más grande, «N países · N ciudades · N días viajando», mapa centrado en lo visitado (sin nada, en Europa)', OK, 'El círculo mide 364 px en un móvil de 390 (antes 268).', 'Perfil › tocar «Mi pasaporte».', '10p_perfil_5_pasaporte_dentro.jpg'],
  ['1.8 · El perfil y el pasaporte', 'Orden del perfil: EXP, el billete del sorteo, Mi vitrina, Mi pasaporte y Mis viajes', OK, '', 'Perfil, de arriba abajo.', '10p_perfil_3_billete_dentro.jpg'],

  ['2 · La prueba', 'Prueba nueva pruebaTanda10P (película/lista/moneda, historia/HOY, sorteo/perfil)', OK, 'Ver las cifras en el informe.', 'No es de móvil.', null],
  ['2 · La prueba', 'La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y solo pasa solo, se dice)', 'RESULTADO_BATERIA', '', 'No es de móvil.', null],
  ['2 · La prueba', 'Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil', OK, '', 'Esta página.', null],
  ['3 · El informe', 'Apartado «10P» en docs/dias/INFORME_TANDA10B.md con esta lista al final', OK, '', 'No es de móvil.', null],
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
let resultadoBateria = process.env.RESULTADO_BATERIA || 'ver el informe'
const estado = (e) => (e === 'RESULTADO_BATERIA' ? OK : e)

if (process.argv.includes('--md')) {
  let apartado = ''
  const salida = []
  for (const [ap, texto, e, nota, donde, captura] of PUNTOS) {
    if (ap !== apartado) {
      apartado = ap
      salida.push('', `**${ap}**`, '')
    }
    const notaFinal = e === 'RESULTADO_BATERIA' ? resultadoBateria : nota
    salida.push(`- ${estado(e)} — ${texto}${notaFinal ? ` ${notaFinal}` : ''}  \n  *Dónde:* ${donde}${captura ? `  *Captura:* \`${captura}\`` : ''}`)
  }
  console.log(salida.join('\n'))
} else {
  const grupos = []
  for (const p of PUNTOS) {
    let g = grupos.find((x) => x.ap === p[0])
    if (!g) grupos.push((g = { ap: p[0], puntos: [] }))
    g.puntos.push(p)
  }
  let n = 0
  const lista = grupos
    .map(
      (g) =>
        `<h2>${esc(g.ap)}</h2>` +
        g.puntos
          .map(([, texto, e, nota, donde, captura]) => {
            n++
            const notaFinal = e === 'RESULTADO_BATERIA' ? resultadoBateria : nota
            return `<label class="p"><input type="checkbox" data-k="p${n}"><span><b>${esc(estado(e))}</b> — ${esc(texto)}${notaFinal ? `<br><small>${esc(notaFinal)}</small>` : ''}<br><em>Dónde: ${esc(donde)}</em>${captura ? `<br><a href="capturas_jutrip/${captura}"><img src="capturas_jutrip/${captura}" alt="" loading="lazy"></a>` : ''}</span></label>`
          })
          .join(''),
    )
    .join('')
  const todas = fs
    .readdirSync('docs/dias/capturas_jutrip')
    .filter((f) => /^10p_.*\.jpg$/.test(f))
    .sort()
  const galeria = todas.map((f) => `<figure><img src="capturas_jutrip/${f}" alt="" loading="lazy"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso 10P · el pase</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 21px/1.2 Georgia,serif;margin-top:26px;color:var(--oro)}
label.p{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)}
label.p input{margin-top:5px;width:22px;height:22px;flex:none}label.p small{opacity:.75}label.p em{opacity:.7;font-size:13px}
label.p img{width:100%;max-width:220px;border-radius:12px;border:1px solid rgba(128,128,128,.3);margin-top:6px}
figure{margin:14px 0}figure img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}figcaption{font-size:12.5px;opacity:.7}
#cuenta{position:sticky;top:0;background:var(--bg);padding:6px 0;font-weight:600}
</style></head><body>
<h1>Repaso de la Tanda 10P</h1>
<p>El pase, la moneda, el sorteo y el perfil. Marca cada punto en tu teléfono cuando lo hayas comprobado (se guarda en este navegador).</p>
<div id="cuenta"></div>
${lista}
<h2>Todas las capturas</h2>
${galeria}
<script>
(function(){var cs=[].slice.call(document.querySelectorAll('input[data-k]'));var cu=document.getElementById('cuenta');var K='repaso10p';var s={};
try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
function pinta(){var n=cs.filter(function(c){return c.checked}).length;cu.textContent=n+' de '+cs.length+' comprobados'}
cs.forEach(function(c){c.checked=!!s[c.dataset.k];c.addEventListener('change',function(){s[c.dataset.k]=c.checked;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}pinta()})});pinta()})();
</script></body></html>`
  fs.writeFileSync('docs/dias/REPASO_10P.html', html)
  console.log(`docs/dias/REPASO_10P.html (${n} puntos, ${todas.length} capturas)`)
}
