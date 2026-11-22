// REPASO de la Tanda V39C: la pantalla de entrada nueva.
import fs from 'node:fs'
const img = (f) => (fs.existsSync(`docs/dias/${f}`) ? `<figure><img src="${f}" alt="${f}"><figcaption>${f}</figcaption></figure>` : `<i>(sin captura: ${f})</i>`)
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const fotos = JSON.parse(fs.readFileSync('data/entrada/fotos.json', 'utf8'))
const filas = Object.entries(fotos)
  .map(([k, f]) => `<tr><td>${f.nombre ?? k}</td><td><code>${f.archivo}</code></td><td>${f.autor ?? ''}</td><td>${f.licencia ?? ''}</td><td>${f.url_fuente ? `<a href="${f.url_fuente}">${f.url_fuente}</a>` : ''}</td><td>${fs.existsSync('public' + f.archivo) ? (fs.statSync('public' + f.archivo).size / 1024).toFixed(1) + ' KB' : ''}</td></tr>`)
  .join('')
const propias = ['roma', 'lanzarote']
  .map((k) => `<tr><td>${k === 'roma' ? 'Roma' : 'Lanzarote'}</td><td><code>/fotos/entrada/${k}.webp</code></td><td colspan="3">La portada que ya tiene el destino en la app (reducida a tamaño de tarjeta)</td><td>${fs.existsSync(`public/fotos/entrada/${k}.webp`) ? (fs.statSync(`public/fotos/entrada/${k}.webp`).size / 1024).toFixed(1) + ' KB' : ''}</td></tr>`)
  .join('')
const total = fs.readdirSync('public/fotos/entrada').filter((f) => f.endsWith('.webp')).reduce((s, f) => s + fs.statSync(`public/fotos/entrada/${f}`).size, 0)
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V39C</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:960px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:260px;border:1px solid #ddd;border-radius:10px;margin:6px 8px 6px 0}figure{display:inline-block;margin:0 8px 8px 0;font-size:12px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V39C · La pantalla de entrada nueva</h1>
<h2>Qué se ha hecho</h2>
${li([
  '<b>La pantalla de entrada de Design</b> (A1, A2, A3 de «02 · Entrar en la cuenta»): fondo crema en degradado, el logo JUTRIP, «Guarda tus viajes, tus fotos y tus logros.», [Continuar con Google] (blanco, con la «G» de colores y el borde dorado fino), [Entrar con mi email] (dorado) y «Privacidad y condiciones». Los botones van abajo, como en el dibujo.',
  '<b>El mosaico de destinos</b> arriba: tres columnas inclinadas que suben y bajan muy despacio (46, 52 y 58 s por vuelta, sin saltos), difuminadas hacia abajo. Cada tarjeta lleva su <b>foto</b>, su nombre y su país. Salen los 11 de salida y los 3 de Próximamente (Florencia, Berlín, Cartagena de Indias). <b>Ningún Tokio.</b>',
  '<b>Rendimiento:</b> las fotos son WebP pequeñas (tamaño de tarjeta), con carga perezosa (<code>loading="lazy"</code>); mientras llegan, la tarjeta lleva su degradado de color. Con «Reducir movimiento» el mosaico se queda quieto. Sin ninguna consulta a Supabase.',
  '<b>A2</b> (la hoja con el email): «Entra con tu email», «tu@email.com», [Enviarme el enlace] con el botón dorado del diseño.',
  '<b>A3</b> (enlace enviado): «Te hemos enviado un enlace a …», «Ábrelo desde este móvil para entrar.», [Abrir mi correo] dorado. <b>No se ha perdido nada:</b> el aviso de Spam o Promociones, la casilla del código de números con su [Entrar] (<code>entrarConCodigo</code>) y «¿No te llega? Enviar otra vez» siguen debajo, con el estilo de la hoja.',
  '<b>Nada cambia en cómo se entra:</b> Google, el código, pasar los viajes de la cuenta anónima y «Entrando…» una sola vez (<code>pruebaEntrarUnaVez</code>).',
])}
<h2>Capturas (iPhone 390 × 844)</h2>
<p>${img('V39C_capturas/A1.png')}${img('V39C_capturas/A2.png')}${img('V39C_capturas/A3.png')}</p>
<p>${img('V39C_capturas/A1_pantalla_baja.png')}${img('V39C_capturas/A1_reducir_movimiento.png')}</p>
<h2>Las fotos: fuente y licencia</h2>
<p>Total de las fotos del mosaico: <b>${(total / 1024).toFixed(0)} KB</b> (${fs.readdirSync('public/fotos/entrada').filter((f) => f.endsWith('.webp')).length} archivos). Los autores también están en «Créditos» de la app y el detalle en <code>docs/dias/FOTOS_ENTRADA.md</code>.</p>
<table><tr><th>Destino</th><th>Archivo</th><th>Autor</th><th>Licencia</th><th>Fuente</th><th>Peso</th></tr>${propias}${filas}</table>
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  'Abre la app sin sesión: arriba el mosaico moviéndose despacio, con fotos reconocibles y sin Tokio.',
  'Con «Reducir movimiento» (Ajustes del iPhone › Accesibilidad › Movimiento) el mosaico está quieto.',
  '[Entrar con mi email] → escribe el email → [Enviarme el enlace] → «Te hemos enviado un enlace…»: mira que debajo siguen el aviso de Spam, la casilla del código con [Entrar] y «Enviar otra vez».',
  'Entra con el código del email (el enlace abierto en Safari no entra en la app instalada: con el código sí).',
  '[Continuar con Google] sigue entrando.',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  'La «G» de Google es la multicolor oficial dibujada en SVG; el botón es el blanco del diseño.',
  'El botón dorado de las hojas es el del diseño (degradado dorado y texto marrón oscuro); los demás botones de la app siguen siendo champán, no los he tocado.',
  'Si prefieres otras fotos en alguna tarjeta, dímelo y las cambio (cada una es un archivo pequeño en <code>public/fotos/entrada/</code>).',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V39C.html', html)
console.log('ok')
