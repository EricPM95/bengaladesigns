// REPASO de la Tanda V37 (21-nov): medallas, sello con sonido, viaje más ligero, borrar mi cuenta y limpieza.
//   node scripts/destino/generarRepasoV37.mjs   →   docs/dias/REPASO_V37.html  (+ las capturas de docs/dias/V37_capturas)
import fs from 'node:fs'
const D = 'docs/dias/V37_capturas'
const t = JSON.parse(fs.readFileSync(`${D}/textos.json`, 'utf8'))
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const fig = (f, pie) => `<figure><img src="V37_capturas/${f}" alt="${pie}"><figcaption>${pie}</figcaption></figure>`

const medallas = [
  '<b>42 textos cambiados en 22 archivos</b> (más la copia de la demo): «sello» → «medalla» donde «sello» significaba la medalla de un destino.',
  'Animaciones: «TU MEDALLA DE ROMA · BRONCE» (capturas de abajo), «Tu medalla sube a…», «Tu medalla de Roma, en…». Páginas de destino y lista «Todos»: «Medallas de ciudad», «Medalla de Roma», «Medalla de ciudad · bronce». Logros de viajero: «Primera medalla», «Consigue la medalla de oro/diamante…». Lista y aviso del pase: «Las medallas de Roma y del Vaticano», «consigues la medalla de cada destino que visitas». «Tus logros, medallas y EXP» al eliminar un viaje; título «Medallas» en el panel.',
  'Buscado también en avisos (campana y push), correos, panel, política de privacidad y tutorial: allí no había «sello» como medalla.',
  '«Sello» se queda SOLO en el pasaporte (la hoja, «Ver mi sello», «Estampar mi sello», «llena tu pasaporte de sellos»…). Nada interno se ha renombrado.',
  'La prueba nueva <code>pruebaV37_textos</code> (13 comprobaciones) recorre src, server, shared, api, data/logros y data/pase y falla si «sello» aparece fuera de su lista blanca explícita (29 textos del pasaporte en 14 archivos, cada uno con su motivo).',
  'Regla apuntada en CLAUDE.md: en el código <code>sello</code> es la medalla; en los textos, siempre «medalla».',
]
const sello = [
  'En la app, cuando el sello cae y toca la hoja del pasaporte (a los 2,05 s) suena la partitura <code>sello_pasaporte</code> (candidato A del clic): una vez al estampar. No suena al ver un sello ya estampado ([Ver mi sello]), ni en la hoja de ejemplo del estudio, ni con «reducir movimiento» (sin golpe, sin sonido), ni con el sonido apagado en Ajustes.',
  'La tarjeta «Sello del pasaporte» del estudio usa la misma partitura. <code>pruebaV37_sello</code>: 18 comprobaciones. <b>Ojo:</b> el reloj exacto (clic a 2,05 s) no se pudo medir en Chrome sin pantalla; <b>falta oírlo en un iPhone de verdad</b>.',
]
const viaje = [
  'La copia <code>originalRoute</code> (la de «Volver a mi ruta original») ya no sube, ni baja, ni se guarda en la caché de HOY. Se guarda UNA vez, aparte, solo en ese móvil (<code>localStorage</code>, hasta 8 viajes, se borra al cerrar sesión). La varita sigue funcionando. Informe completo: <code>docs/dias/V37_ORIGINALROUTE.md</code> (dónde se usaba cada cosa).',
  '<b>Lo que se pierde:</b> otro móvil u otro navegador no tiene la copia: allí la «original» es la ruta tal como se abre por primera vez (igual que ya pasaba con los viajes anteriores a la varita). Si la quieres entre aparatos, la opción limpia es una columna aparte <code>trips.route_original</code> (migración tuya).',
  'Un viaje viejo con copia en la nube se abre, se edita y se guarda y queda limpio; la nube se limpia sola, una vez, en el siguiente guardado. SQL opcional <code>docs/dias/LIMPIAR_ORIGINALROUTE.sql</code> + <code>COMPROBAR_LIMPIAR_ORIGINALROUTE.sql</code> (SIN APLICAR; probados en PGlite con las migraciones reales).',
  '<code>pruebaV37_viaje</code>: 40 comprobaciones (viaje nuevo sin copia en la petición, viejo abierto/editado/guardado, peso ≤ 55 %, huella, SQL, tope de 8 copias).',
]
const pesos = `<table><thead><tr><th>Viaje</th><th>Antes</th><th>Después</th><th>Queda</th></tr></thead><tbody>
<tr><td>Lanzarote (el real de Eric)</td><td>96.883 B (94,6 KB)</td><td>49.278 B (48,1 KB)</td><td>50,9 %</td></tr>
<tr><td>Roma (la ruta de prueba)</td><td>161.666 B (157,9 KB)</td><td>81.640 B (79,7 KB)</td><td>50,5 %</td></tr>
<tr><td>Lanzarote: cuerpo real del guardado</td><td>96.883 B</td><td>49.254 B</td><td>50,8 %</td></tr></tbody></table>`
const cuenta = [
  'Servidor: <code>DELETE /api/cuenta</code> exige <code>{ confirmar: "BORRAR" }</code>; 403 si la sesión es anónima («Entra con tu cuenta…») o es de administrador («Pídeselo a otro administrador»). Hace lo mismo que <code>empezar_de_cero</code> (con respaldo a <code>preparar_borrado</code> si la función faltara), borra los archivos (fotos y foto de perfil) y la cuenta de Supabase Auth. <b>Se queda <code>pagos_registro</code></b> (fecha e importe).',
  'Ajustes, al final: [Borrar mi cuenta] rojo suave → hoja con la explicación, campo «escribe BORRAR» y [Borrar mi cuenta para siempre] apagado hasta escribirlo. Después la app limpia el móvil y vuelve a la bienvenida (código de siempre).',
  'Política de privacidad, «Cómo borrarlo»: se puede borrar desde Ajustes y por correo a privacidad@jutrip.app; qué se borra y qué guarda la ley.',
  '<code>pruebaV37_cuenta</code> (PGlite con todas las migraciones + el servidor de cuentas de verdad): 25 comprobaciones. Sin BORRAR no se borra nada; anónima y administrador, 403; con BORRAR desaparece su acceso, viajes, logros y archivos; el pase que pagó pasa a Beto; <code>pagos_registro</code> se queda; lo de otra persona no se toca. También <code>pruebaCuentas1</code> (314) y <code>pruebaCuentas3</code> (473), adaptadas.',
]
const limpieza = [
  '<b>Contraseña de Civitatis:</b> el código SÍ la lee (<code>CIVITATIS_API_USER</code> y <code>CIVITATIS_API_PASSWORD</code>, en <code>server/civitatis/cliente.js</code>; el servidor la usa en <code>server/index.js</code> y los scripts <code>civitatis*.mjs</code>). No se ha quitado nada. No se ha abierto ningún <code>.env*</code> (se averiguó buscando en el código).',
  'CLAUDE.md: la última <code>empezar_de_cero</code> (hoy la 0091) se encuentra buscando la migración con el número más alto que la define; regla «los agentes nunca abren ni leen <code>.env*</code>»; regla «sello/medalla»; borrar la cuenta.',
  '<code>pruebaV36_cliente</code> pasa con el Vite normal (28). Con el Vite «estable» (Supabase de mentira) no pasa, porque necesita el contador real de peticiones: se corre con el Vite normal en 5173.',
]
const viejas = `<table><thead><tr><th>Prueba</th><th>Por qué fallaba</th><th>Qué se hizo</th></tr></thead><tbody>
<tr><td><code>pruebaTanda6z6b</code> (1)</td><td>Buscaba el «+» en <code>PerfilSheet</code>; desde la V31 vive en <code>BotonMas.tsx</code></td><td>Prueba al día</td></tr>
<tr><td><code>pruebaFase6y4_perfil</code> (3)</td><td>Pedía el «+» de 64 px; la V31 lo dejó en 72 px (diseño «Boton Mas»)</td><td>Prueba al día</td></tr>
<tr><td><code>pruebaTanda10S2</code> (1)</td><td>Pedía <code>&lt;PiezaSegura nombre="…"&gt;</code> sin atributos; <code>MomentosHost</code> lleva <code>reintentable</code> desde la V25</td><td>Prueba al día</td></tr>
<tr><td><code>pruebaTanda10N10_avisos</code> (3)</td><td>Desde el arreglo del 6-nov la franja de avisos solo sale con la ruta abierta; la prueba no la abría</td><td>La prueba abre la ruta, como la persona</td></tr>
<tr><td><code>pruebaV2Hoy</code> (2)</td><td>Contaba el botón flotante «Cuéntanos» (V28b, 19-nov) como flotante de HOY</td><td>La regla cuenta los de HOY (cámara y logros)</td></tr>
<tr><td><code>pruebaTandaHOY1_B</code> y <code>_C</code></td><td>«Not found»: Lanzarote está oculto salvo para administradores (el guardián del servidor, <code>DESTINOS_OCULTOS</code>)</td><td>Pasan con el api-server con Lanzarote visible (0 fallos: 195 y 124). Sin tocar la prueba; el api-server se ha vuelto a dejar normal</td></tr>
<tr><td><code>pruebaV25</code> (1)</td><td>Dos filas de pestañas del panel (V35A) con <code>overflowX</code> sin <code>overflowY</code></td><td>Arreglo real en <code>comun.tsx</code> (filas quietas en vertical)</td></tr>
<tr><td><code>pruebaTandaLZ2b1_B</code> (1)</td><td>Buscaba el nombre viejo de una variable de <code>ExplorePanel</code></td><td>Prueba al día</td></tr></tbody></table>
<p><small>No se han probado en un commit anterior (no se puede apartar el trabajo en curso sin riesgo): el motivo de cada una se ha comprobado leyendo el código, que V37 no toca en esos puntos. Las de agentes que fallaron en medio de la tanda (<code>pruebaTanda10F</code>, <code>pruebaTanda10S</code>, <code>pruebaTanda10N11_c</code>, <code>pruebaV10</code>, <code>pruebaV14</code>) pasan en 0 en la ejecución final con Vite reiniciado.</small></p>`
const pruebas = [
  '<b>En 0 fallos:</b> pruebaV37 (textos 13, cuenta 25, viaje 40, sello 18), pruebaJutrip (130), pruebaV35A (91), pruebaV35B (73), pruebaV36_cliente (28), pruebaV36_servidor (28), pruebaV36C (106), pruebaEntrarUnaVez (7), pruebaTanda10J (248), pruebaCuentas1 (314), pruebaCuentas3 (473).',
  '<b>Viejas en 0:</b> pruebaV2Hoy (149), pruebaTandaHOY1_B (195), pruebaTandaHOY1_C (124), pruebaTanda10N10_avisos (23), pruebaFase6y4_perfil (152), pruebaTanda6z6b (80), pruebaTanda10S2 (42), pruebaTanda10F (88), pruebaTanda10S (82), pruebaTanda10N11_c (47), pruebaV10 (16), pruebaV14 (54), pruebaV25 (89), pruebaTandaLZ2b1_B (159), pruebaTanda10N5_freetour (53).',
  'Producción (jutrip.app en modo iPhone): se comprueba después del push (ver el informe final).',
]
const paraEric = [
  '<b>Civitatis:</b> no hay nada que borrar: el código usa <code>CIVITATIS_API_USER</code> y <code>CIVITATIS_API_PASSWORD</code> (si dejas de usar los scripts <code>civitatis*.mjs</code> y la API está apagada, <code>CIVITATIS_API_ACTIVA</code> sin <code>true</code>, la contraseña podría quitarse de <code>.env.local</code>; en Vercel, solo si algún día apagas la API de Civitatis).',
  '<b>SQL de limpieza (opcional):</b> en el SQL editor de Supabase pega el PASO 1 de <code>docs/dias/LIMPIAR_ORIGINALROUTE.sql</code> (solo lee), mira cuántos viajes la llevan y, si te vale, el PASO 2 (repetible); después <code>COMPROBAR_LIMPIAR_ORIGINALROUTE.sql</code> (una fila, todo en true). Sin él, la app funciona igual y cada viaje se limpia solo al guardarse. Si un móvil con la app vieja guarda después, repite el PASO 2.',
  '<b>Decisión tuya:</b> ¿quieres la copia original también entre aparatos (columna <code>trips.route_original</code>, migración nueva)? Hoy solo la conserva el móvil donde se creó la ruta.',
  '<b>Oírlo en un iPhone:</b> el sonido del sello del pasaporte (clic al tocar la hoja) y el resto de sonidos no se pueden oír en Chrome sin pantalla.',
  '<b>Pieza de Design:</b> «Pase Lista.dc.html» aún dice «Los sellos de Roma y del Vaticano»; la app dice «medallas». Si quieres, actualiza la pieza.',
  'Sigue pendiente de V35B: aplicar la migración 0091 (la app va bien sin ella, con «Pronto»).',
]
const lista = [
  'Abrir una animación de medalla (p. ej. al ganar la de bronce de Roma): dice «TU MEDALLA DE ROMA · BRONCE».',
  'Perfil → destino: «Medallas de ciudad» y «Medalla de Roma». Lista del pase: «Las medallas de Roma y del Vaticano».',
  'Estampar un sello nuevo en el pasaporte: suena un clic cuando toca la hoja; [Ver mi sello] no suena.',
  'Abrir un viaje viejo (de antes de hoy), editarlo, cerrar la app y abrirlo otra vez: todo sigue igual; la varita «Volver a la ruta original» funciona en el móvil donde se creó.',
  'Ajustes → al final [Borrar mi cuenta]: con una cuenta de prueba NO administradora, el botón rojo está apagado hasta escribir BORRAR; tras borrar vuelve a la bienvenida y esa cuenta ya no entra. Con la cuenta de administrador sale «Pídeselo a otro administrador».',
  'Privacidad → «Cómo borrarlo»: se lee lo de Ajustes y el correo privacidad@jutrip.app.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V37 · medallas, viaje ligero y borrar mi cuenta</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f3ecd9}img{max-width:300px;border:1px solid #ddd;border-radius:10px}figure{display:inline-block;margin:8px 12px 8px 0;vertical-align:top}figcaption{font-size:12px;color:#667;max-width:300px}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}small{color:#667}h2{margin-top:28px}.eric{background:#FFF6DC;border:1px solid #E2C070;border-radius:10px;padding:4px 16px}</style>
<h1>V37 · Medallas, sello con sonido, viaje más ligero y limpieza</h1>
<h2>1. «Sello» → «medalla»</h2>${li(medallas)}
${fig('medalla_bronce.jpg', 'Medalla de bronce: «TU MEDALLA DE ROMA · BRONCE» (marco de iPhone del estudio)')}${fig('medalla_oro.jpg', 'Medalla de oro: «TU MEDALLA DE ROMA · ORO»')}
<p><small>Textos leídos en pantalla: ${t.medalla_bronce}<br>${t.medalla_oro}</small></p>
<h2>2. El sello del pasaporte, con sonido</h2>${li(sello)}
<h2>3. Viaje sin <code>originalRoute</code></h2>${li(viaje)}${pesos}
<h2>4. Borrar mi cuenta</h2>${li(cuenta)}
${fig('borrar_cuenta_normal.jpg', 'La hoja (cuenta normal): botón apagado hasta escribir')}${fig('borrar_cuenta_escrito.jpg', 'Con BORRAR escrito: botón encendido')}${fig('borrar_cuenta_administrador.jpg', 'Cuenta de administrador: «Pídeselo a otro administrador»')}
<h2>5. Limpieza</h2>${li(limpieza)}<h3>Pruebas viejas, una a una</h3>${viejas}
<h2>6. Pruebas</h2>${li(pruebas)}
<h2>Lista de comprobación (a mano)</h2>${li(lista)}
<h2 class="eric">PARA ERIC</h2><div class="eric">${li(paraEric)}</div>
</html>`
fs.writeFileSync('docs/dias/REPASO_V37.html', html)
console.log('REPASO_V37.html escrito')
