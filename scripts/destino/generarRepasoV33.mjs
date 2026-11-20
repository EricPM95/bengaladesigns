// Genera docs/dias/REPASO_V33.html: node scripts/destino/generarRepasoV33.mjs
import fs from 'node:fs'
const img = (f, ancho = 420) => (fs.existsSync(`docs/dias/V33_capturas/${f}.jpg`) ? `<img alt="${f}" src="data:image/jpeg;base64,${fs.readFileSync(`docs/dias/V33_capturas/${f}.jpg`).toString('base64')}" style="max-width:${ancho}px;border-radius:12px;margin:4px;border:1px solid #ccc">` : `<p>(falta ${f})</p>`)
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V33 · El panel de Jutrip</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:16px/1.5 system-ui,sans-serif;max-width:960px}h1{font-size:24px}table{border-collapse:collapse;font-size:13px}td,th{border:1px solid #9994;padding:4px 8px;text-align:left;vertical-align:top}label{display:block;margin:6px 0}code{font-size:13px}</style></head><body>
<h1>V33 · El panel de Jutrip: un solo sitio para gestionarlo todo</h1>
<p>Probado con <code>pruebaV33</code> (la pantalla del panel) y <code>pruebaV33_servidor</code> (el servidor: 403 sin ser administrador, paginación, dinero, correos simulados), más <code>pruebaJutrip</code>, <code>pruebaV20</code> (Cuéntanos), <code>pruebaV29</code> (sonidos), <code>pruebaV31</code> y <code>pruebaTanda10J</code>. La muestra de 60 de Roma no se toca (el motor no cambia). <b>Ninguna prueba manda correos de verdad.</b></p>
<h2>1. Qué hay, en palabras sencillas</h2>
<ul>
<li><b>Una sola entrada: <code>/admin</code></b>, solo para administradores. La comprobación es SIEMPRE en el servidor: cada <code>/api/admin/*</code> da 403 a quien no lo es y la pantalla dice «Esta página es solo para administradores».</li>
<li><b>Menú de Design:</b> Inicio · Reportes · Fotos · Destinos y «Avísame» · Ventas · Usuarios · Logros · Sonidos. En ordenador, a la izquierda; en el móvil, en pastillas arriba. <code>/admin/logros</code> y <code>/admin/sonidos</code> siguen funcionando y llevan a su apartado (lo de siempre, dentro del panel).</li>
<li><b>Inicio:</b> reportes sin mirar, fotos por aprobar, pases e ingresos de hoy y del mes, usuarios nuevos hoy y esta semana, el gráfico de los últimos 14 días, lo último que ha llegado y los totales de las respuestas de la primera vez.</li>
<li><b>Reportes:</b> lo de «Avisos de viajeros» con el diseño nuevo (filtros por tipo, destino y estado; fotos y captura; [Visto] [Hecho] [Descartar]) y <b>[Responder]</b>: un texto corto que le llega al viajero a la campana, y <b>por correo solo si mandó el reporte con cuenta y con «avísame» encendido</b>, desde soporte@jutrip.app.</li>
<li><b>Fotos de viajeros:</b> las que esperan aprobación; [Usar en la app] y [Descartar].</li>
<li><b>Destinos y «Avísame»:</b> los más pedidos y los «Próximamente» con cuántos pulsaron [Avísame]; [Ya está disponible: avisarles] avisa en la campana y por correo, <b>una sola vez por persona y destino</b>.</li>
<li><b>Ventas:</b> pases por destino y por día, ingresos del mes y las últimas compras (fecha, destino, tipo e importe; nunca datos de tarjeta).</li>
<li><b>Usuarios:</b> la lista, uno a uno (nombre y correo, alta y último acceso, nivel, pase, viajes creados y hechos, dinero gastado y lo que contestó en la primera vez), con buscador, filtros (con o sin pase, destino, cada cuánto viaja, con quién), orden (más reciente, último acceso, más viajes, más gastado) y páginas de 50 en 50; los totales en porcentajes; y la ficha de cada uno (viajes, pases, logros y pasaporte, reportes). <b>Solo administradores, solo lectura, sin botón de exportar, nunca datos de tarjeta ni contraseñas</b>; los datos se leen en el servidor con la clave de servicio, nunca en el navegador.</li>
<li><b>Correo a soporte@ cuando llega un reporte nuevo:</b> con el tipo, el destino, el texto y un enlace al reporte en el panel, sin el correo del viajero en el asunto; <b>como mucho uno cada 15 minutos</b> (si llegan varios, van juntos).</li>
<li><b>Sin <code>RESEND_API_KEY</code> el panel funciona igual</b> y lo dice (en Inicio y en Destinos): no manda correos.</li>
</ul>
<h2>2. Capturas</h2>
<p>El diseño está en <code>docs/diseno/proyecto/Panel Jutrip.dc.html</code> (ábrelo para compararlo; no he podido sacar capturas del propio archivo de Design). Las capturas son del panel con datos de mentira de la demo.</p>
<p><b>Inicio</b><br>${img('inicio', 640)}</p>
<p><b>Reportes (uno abierto con [Responder])</b><br>${img('reporte_abierto', 640)}</p>
<p><b>Ventas</b><br>${img('ventas', 640)}</p>
<p><b>Usuarios: la lista y una ficha</b><br>${img('usuarios_lista', 640)}${img('usuarios_ficha', 640)}</p>
<p><b>Destinos y «Avísame»</b><br>${img('destinos', 640)}</p>
<p><b>El panel en el móvil</b><br>${['movil_inicio', 'movil_usuarios', 'movil_reportes'].map((n) => img(n, 200)).join('')}</p>
<h2>3. Lo que no se ha podido comprobar todavía</h2>
<ul>
<li>El panel con los datos REALES (usuarios, ventas, reportes de verdad): hace falta que Eric aplique la migración 0090 (ver «PARA ERIC» del resumen).</li>
<li>Los correos de verdad (necesitan <code>RESEND_API_KEY</code>, que pone Eric).</li>
<li>La comprobación en producción con la cuenta de administrador: no puedo entrar con una cuenta de verdad desde aquí.</li>
</ul>
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> Pegar la migración 0090 en Supabase y pasar su COMPROBAR (una fila «Aplicada»)</label>
<label><input type="checkbox"> Crear la RESEND_API_KEY y ponerla en Vercel (pasos en el resumen), redesplegar</label>
<label><input type="checkbox"> Abrir <code>/admin</code> con tu cuenta: el Inicio sale con cifras reales; con otra cuenta, «solo para administradores»</label>
<label><input type="checkbox"> Usuarios: buscar, filtrar, ordenar, pasar de página y abrir una ficha</label>
<label><input type="checkbox"> Reportes: abrir uno y pulsar [Responder] en una cuenta tuya de prueba (llega a la campana y, con «avísame», al correo)</label>
<label><input type="checkbox"> Mandar un reporte nuevo desde la app: llega UN correo a soporte@ (y varios seguidos, juntos, cada 15 minutos)</label>
<label><input type="checkbox"> Pasar lo de privacidad por el gestor (los administradores ven los datos de cada usuario)</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V33.html', html)
console.log('docs/dias/REPASO_V33.html', Math.round(html.length / 1024), 'KB')
