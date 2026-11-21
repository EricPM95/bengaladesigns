// REPASO de la Tanda V35B: lo hecho, lo que no, la lista de comprobación y PARA ERIC (el orden para aplicar la 0091).
//   node scripts/destino/generarRepasoV35B.mjs
import fs from 'node:fs'
const D = 'docs/dias/V35B_capturas'
const imgs = fs.existsSync(D) ? fs.readdirSync(D).filter((f) => /\.(jpg|png)$/.test(f)).sort() : []
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const ol = (x) => `<ol>${x.map((i) => `<li>${i}</li>`).join('')}</ol>`
const lista = [
  '0091_panel_datos.sql (UNA migración, SIN APLICAR en producción) + COMPROBAR_0091.sql (una fila, todo true). Sin ella, la app y el panel funcionan igual: «Pronto».',
  'Quién paga cada pase: pagos_registro guarda user_id, comisión de Stripe y lo devuelto; el aviso de Stripe lo rellena en cada compra nueva. Script que solo lee de Stripe (modo de prueba) para los pagos viejos.',
  'Próximamente en la base de datos: el mapa lee de ahí (o del JSON si no hay tabla); en Destinos pedidos, [Pasar a Próximamente], [Quitar] (con confirmación) y [+ Añadir un destino]; [Avisar] y [Ya está disponible] solo si el destino ya está publicado («Aún no está en la app»).',
  'País donde vives (4ª pregunta de la primera vez y en Ajustes), uso de la app (día activo, aparato, instalada; sin IP ni ubicación) y su política de privacidad.',
  'Ventas: comisión de Stripe, devoluciones (rojo suave y tachadas), «lo que te queda» antes de impuestos y clics en «Reservar» por destino y tipo (sin saber quién).',
  '«Sin cuentas de prueba» (interruptor arriba del panel, encendido por defecto) y «Cuentas que no cuentan» en Herramientas; los administradores no cuentan nunca.',
  'La campana: respuestas a reportes con el triángulo de «Cuéntanos», «Te hemos respondido» y el aviso se abre entero.',
  'Sonidos de la app: apertura en silencio, «Tu primer día» con partitura, resumen del día / del viaje y vuelo de lo ganado suenan (candidato A); el resumen del viaje del estudio lleva datos de ejemplo.',
  'pruebaTanda10S7b_V arreglada.',
]
const paraEric = [
  'Abre el SQL editor de Supabase (proyecto de producción) y pega TODO el contenido de <code>supabase/migrations/0091_panel_datos.sql</code>. Se puede pegar dos veces sin problema. Va después de la 0090.',
  'Pega <code>docs/dias/COMPROBAR_0091.sql</code>: tiene que salir UNA fila con <b>todo</b> en <code>true</code> (la última columna, <code>todo</code>, también).',
  'Mira el Panel: «Destinos pedidos» tiene que dejar de decir «Pronto» en los botones; en «Herramientas» sale «Cuentas que no cuentan» con bengala.ingresos+pruebas1@gmail.com marcada.',
  '(Opcional) Para rellenar quién pagó los cobros viejos: en tu ordenador, con una clave de PRUEBA de Stripe en la variable STRIPE_SECRET_KEY, ejecuta <code>node scripts/pagos/rellenarPagosViejos.mjs</code>; escribe <code>docs/dias/RELLENAR_PAGOS_VIEJOS.sql</code> (no se sube al repositorio). Revísalo y pégalo en Supabase DESPUÉS de la 0091. Solo lee de Stripe y se niega con una clave sk_live_.',
  'Confirma con el gestor: el registro de pagos se guarda años y <code>pagos_registro.user_id</code> NO se borra al borrar la cuenta (sin clave a auth.users). Si hay que desvincularlo, basta con poner user_id a null.',
  'Pásale al gestor los dos textos nuevos de la política de privacidad (país y uso) que van en el informe.',
  'Qué probar después: (1) compra de prueba con el pago de prueba → en Ventas sale quién compró y la comisión; (2) en Destinos pedidos, pasa un destino a Próximamente y mira el mapa de la app; (3) en la app, entra con una cuenta nueva y comprueba la 4ª pregunta («¿En qué país vives?»); (4) marca una cuenta como de prueba y mira que sale «Prueba» en Usuarios y no suma en Inicio; (5) pulsa un «Reservar» de Civitatis y mira Ventas › Afiliados.',
]
const respuestas = [
  '<b>El Pase Roma de 6,99 € del 19-oct:</b> no se puede saber de quién es desde aquí. El registro de cobros no guardaba quién pagó y el pase se borró con «Empezar de cero» (la función borra los pases pero deja el cobro). Es muy probable que fuera una compra tuya de prueba. Para averiguarlo con certeza: el script <code>rellenarPagosViejos.mjs</code> lee de Stripe (modo de prueba) el correo o el identificador de ese cobro (cs_… del 19-oct) y escribe su user_id en el SQL aparte.',
  '<b>«Empezar de cero» y los pases pagados:</b> sí, quien lo pulsa pierde los pases que PAGÓ (se borra <code>passes</code> donde es la compradora), con una salvedad: si otra persona usa ese pase o es su destinatario, el pase se TRASPASA a ella y no se pierde. El cobro (<code>pagos_registro</code>) se queda siempre y no se devuelve el dinero. Ojo: «Empezar de cero» solo existe en el panel de administrador (Logros y sonidos › Herramientas), no en Ajustes de los viajeros; ahí la confirmación ya dice «Tienes N pase(s) pagado(s): se borrará(n) con todo lo demás y no se devuelve el dinero.» antes de borrar.',
  '<b>Política de privacidad, lo que se ha puesto (para el gestor):</b><br>• País donde vives: «En las primeras preguntas te preguntamos en qué país vives. Es opcional: puedes saltarlo, y lo puedes cambiar o quitar cuando quieras en Ajustes. Lo usamos para saber desde dónde viaja la gente y mejorar JUTRIP. Si te lo proponemos ya marcado, sale del idioma de tu móvil: nunca de tu ubicación ni de tu dirección IP. No lo enseñamos a nadie.»<br>• Uso de la app: «Guardamos un día de uso por cuenta (la fecha, sin hora), el tipo de aparato (iPhone, Android u ordenador, sin el modelo) y si usas la app instalada en tu pantalla de inicio o desde el navegador. Lo usamos para saber cuánta gente usa JUTRIP y desde qué tipo de aparato, y así mejorarlo. Con esto no guardamos tu dirección IP ni tu ubicación.»<br>(Un iPad cuenta como «iPhone». El apartado «Qué guardamos» de esa política sigue con «Texto pendiente».)',
  '<b>Lo que no se pudo verificar:</b> nada se ha probado contra Supabase real ni con la 0091 aplicada (solo PGlite con todas las migraciones); el audio real en un iPhone; Stripe real (solo con respuestas de mentira).',
  '<b>Fallos que ya estaban:</b> <code>pruebaTanda10N10_avisos</code> falla 3 comprobaciones de la franja y el sonido (la franja solo sale con la pantalla de ruta abierta, por el arreglo del 6-nov ya commiteado); no es de esta tanda.',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V35B · datos nuevos del panel y la campana</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:100%;border:1px solid #ddd;border-radius:8px}figure{margin:12px 0}figcaption{font-size:12px;color:#667}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#fff8e6;border:1.5px solid #d8be84;border-radius:12px;padding:8px 18px}</style>
<h1>V35B · Los datos nuevos del panel y la campana</h1>
<h2>Lista de comprobación de esta tanda</h2>${li(lista)}
<h2 class="eric">PARA ERIC</h2><div class="eric">${ol(paraEric)}</div>
<h2>Respuestas a lo que preguntabas</h2>${li(respuestas)}
<h2>Capturas</h2>${imgs.map((f) => `<figure><img src="V35B_capturas/${f}" alt="${f}"><figcaption>${f}</figcaption></figure>`).join('')}
</html>`
fs.writeFileSync('docs/dias/REPASO_V35B.html', html)
console.log(`REPASO_V35B.html escrito (${imgs.length} capturas)`)
