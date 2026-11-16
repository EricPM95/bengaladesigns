// Genera docs/dias/REPASO_V2.html (Design al lado de la app, pantalla a pantalla: A1–A9 y H1–H8). Se corre después de _v2_design_pantallas.mjs y _v2_repaso_capturas.mjs:
//   node scripts/destino/generarRepasoV2.mjs
import fs from 'node:fs'

const CAP = 'docs/dias/V2_capturas'
const b64 = (f) => (fs.existsSync(`${CAP}/${f}`) ? `data:image/jpeg;base64,${fs.readFileSync(`${CAP}/${f}`).toString('base64')}` : null)
const par = (id, titulo, design, app, nota) => {
  const d = b64(design)
  const a = app ? b64(app) : null
  return `<section class="par"><h3>${id} · ${titulo}</h3><div class="dos"><figure>${d ? `<img alt="Design ${id}" src="${d}">` : '<div class="no">sin captura</div>'}<figcaption>Design</figcaption></figure><figure>${a ? `<img alt="App ${id}" src="${a}">` : '<div class="no">sin captura de la app</div>'}<figcaption>La app</figcaption></figure></div>${nota ? `<p class="nota">${nota}</p>` : ''}</section>`
}
const A = [
  par('A1', 'Ya estás aquí', 'design_A1.jpg', 'app_A1_roma.jpg', 'Foto con etiqueta y nombre, «Visita de unos 30 min», tres iconos sin texto (con su aria-label), [He terminado] [Necesito más tiempo]. Sin «¿Empezamos?». La cámara flotante se ve encima de la tarjeta, como en Design.'),
  par('A2', 'Cierra pronto', 'design_A2.jpg', null, 'El «Cierra en 25 min» solo sale si cierra en menos de 45 min: depende de la hora real y no se puede fijar en una captura. Lo cubre <code>pruebaV2Hoy</code> (lógica y código).'),
  par('A3', 'Con entrada', 'design_A3.jpg', null, 'Icono «Tu entrada» solo con reserva: el viaje de pruebas no tiene reserva en esa parada. Cubierto en el código por <code>pruebaV2Hoy</code>.'),
  par('A4', 'La historia sonando', 'design_A4.jpg', 'app_A4.jpg', 'Se ve el icono de escuchar. La barra con [Pausa] no se ve porque el Chrome de pruebas no tiene voz; la barra está en el código y en <code>pruebaV2Hoy</code>.'),
  par('A5', 'Siguiente parada con el aviso de abajo', 'design_A5.jpg', 'app_A5_H5b.jpg', 'Tras «Saltar parada»: un solo aviso, «Parada saltada · la tienes en Lugares pendientes», sin [Deshacer].'),
  par('A6', 'Siguiente parada con la línea de la historia', 'design_A6.jpg', 'app_A6_A9.jpg', 'Etiqueta, foto (nunca mapa), «En coche · 13 min · 6 km», [Cómo llegar] [Cambiar plan], «¿No te detecta el GPS? Ya he llegado». Sin «+10 min para aparcar».'),
  par('A7', 'Las 4 pastillas a la vez', 'design_A7.jpg', 'app_A1_roma.jpg', 'Los iconos y la pastilla de la visita, como en A1.'),
  par('A8', '«Lugares pendientes» al final de HOY', 'design_A8.jpg', 'app_A8.jpg', 'Abierto, con [Pasar a otro día] [Recuperar hoy] [Ya lo visité] [Quitar].'),
  par('A9', 'Primera parada por la mañana', 'design_A9.jpg', 'app_A6_A9.jpg', '«PRIMERA PARADA» (ya no hay «Sal de casa a las…»).'),
].join('\n')
const H = [
  par('H1', 'HOY entero en «Ya estás aquí»', 'design_H1.jpg', 'app_H1.jpg', 'Orden: cabecera, avisos (uno), tarjeta, ¿Qué hago ahora?, «Tu día» abierto con foto por parada, «Cerca de ti», fotos, «Volver al alojamiento», «Si te sobra tiempo», «Lugares pendientes».'),
  par('H2', 'Con un aviso arriba', 'design_H2.jpg', null, 'Un solo aviso a la vista (los demás, tras «N avisos más»). Se ve en las capturas de arriba: «A este ritmo llegarías a…».'),
  par('H3', 'El reto del día', 'design_H3.jpg', 'app_H3.jpg', 'En la ruta de pruebas no hay colecciones que avancen hoy, así que no sale el reto. La elección del reto único está en el servidor (<code>elegirRetos</code>) y la prueba la cubre.'),
  par('H4', 'El final de la pantalla (sin alojamiento)', 'design_H4.jpg', 'app_H4.jpg', 'Fila «Pon tu alojamiento para volver con un toque» + [Añadir].'),
  par('H4b', 'El final de la pantalla (con alojamiento)', 'design_H4b.jpg', null, 'Con dirección: nombre, «25 min en coche» y [Cómo llegar]. Cubierto por <code>pruebaTanda10N12_c</code> (con y sin dirección).'),
  par('H5', 'Un aviso de abajo · «Plan actualizado»', 'design_H5.jpg', null, 'Mismo sitio, ancho completo, con [Deshacer]; cubierto por HOY2_B y HOY2_C.'),
  par('H5b', 'Un aviso de abajo · parada saltada', 'design_H5b.jpg', 'app_A5_H5b.jpg', 'Sin [Deshacer].'),
  par('H6', '«Lugares pendientes» cerrado', 'design_H6.jpg', 'app_H6.jpg', 'Cerrado, con su número.'),
  par('H7', '«Cerca de ti» · hoja de Gasolineras', 'design_H7.jpg', 'app_H7.jpg', 'En coche: [Gasolineras] [Aparcar] [Comer]; la hoja con los 4 más cercanos.'),
  par('H8', '«Cerca de ti» en Roma', 'design_H8.jpg', 'app_H8.jpg', 'A pie: [Baños] [Fuentes] [Comer].'),
].join('\n')
const cerr = b64('app_cerrado.jpg')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso de la tanda V2 · El nuevo HOY durante el viaje</title>
<style>:root{--bg:#FBF6EC;--tx:#1C2230;--bd:rgba(28,34,48,.15)}@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--bd:rgba(255,253,248,.2)}}body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:900px;margin-inline:auto}h1{font:400 28px/1.15 Georgia,serif}h2{font:400 22px Georgia,serif;margin-top:32px}h3{font-size:15px;margin:0 0 8px}.par{border-top:1px solid var(--bd);padding:16px 0}.dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;height:auto;border-radius:12px;border:1px solid var(--bd)}figcaption{font-size:12px;opacity:.65;text-align:center}.no{border:1px dashed var(--bd);border-radius:12px;min-height:160px;display:flex;align-items:center;justify-content:center;opacity:.6;font-size:13px}.nota{font-size:13.5px;opacity:.85}label{display:block;margin:8px 0}code{font-size:12.5px}</style></head><body>
<h1>El nuevo HOY durante el viaje</h1>
<p>Cada pantalla de Design (izquierda) al lado de la de la app (derecha, móvil de 390). Todo igual en Roma a pie y en Lanzarote en coche. Probado con <code>pruebaV2Hoy</code> (nueva), <code>pruebaJutrip</code>, las pruebas de HOY (HOY1, HOY2, HOY2b, HOY3), <code>pruebaTanda10S</code>, <code>10N12</code>, <code>10N4</code>, <code>pruebaV3</code> y la muestra de 60 de Roma (idéntica). Ninguna prueba toca el Supabase de producción.</p>
<h2>«Hoy Aqui» (A1–A9)</h2>${A}
<h2>«Hoy Entero» (H1–H8)</h2>${H}
<h2>Un sitio que ya ha cerrado</h2>
<p>La siguiente parada, si ya ha cerrado o habrá cerrado cuando llegues, no se te propone: pasa sola a «Lugares pendientes», sale la siguiente abierta y abajo aparece «… ya ha cerrado · la tienes en Lugares pendientes».</p>
${cerr ? `<figure style="max-width:300px"><img alt="Aviso de sitio cerrado" src="${cerr}"><figcaption>Aviso de abajo al cerrarse la siguiente parada</figcaption></figure>` : ''}
<h2>Lista de comprobación de ESTA tanda</h2>
<label><input type="checkbox"> «Ya estás aquí»: foto con etiqueta y nombre, sin «¿Empezamos?», «Visita de unos N min», iconos sin texto, [He terminado] [Necesito más tiempo] y el enlace «Saltar parada»</label>
<label><input type="checkbox"> «Saltar parada» salta directo (sin hoja) y sale un solo aviso abajo, sin [Deshacer]; la parada está en «Lugares pendientes»</label>
<label><input type="checkbox"> En el camino: «SIGUIENTE PARADA» / «PRIMERA PARADA», foto, horario «9:30–16:45», «En coche · 22 min · 17 km», [Cómo llegar] [Cambiar plan], «Ya he llegado»; en ningún sitio «+10 min para aparcar»</label>
<label><input type="checkbox"> Encima de la foto no hay nada (ni cámara ni cama); solo dos botones flotantes: cámara de viaje y logros</label>
<label><input type="checkbox"> «Tu día» abierto, con la foto de cada parada y su estado, por franjas; se puede cerrar y se acuerda</label>
<label><input type="checkbox"> Un solo reto del día y «Y N colecciones más avanzan hoy ›»</label>
<label><input type="checkbox"> «Cerca de ti»: en coche [Gasolineras] [Aparcar] [Comer]; a pie [Baños] [Fuentes] [Comer]</label>
<label><input type="checkbox"> «Volver al alojamiento» (con dirección: cómo llegar; sin ella: [Añadir])</label>
<label><input type="checkbox"> «Lugares pendientes» al final, aparte de «Si te sobra tiempo»; lo que queda sin ver al acabar el día sigue saliendo los días siguientes hasta [Pasar a otro día] / [Recuperar hoy] / [Ya lo visité] / [Quitar]</label>
<label><input type="checkbox"> Un sitio cerrado nunca es la siguiente parada: pasa solo a «Lugares pendientes» con su aviso abajo</label>
<label><input type="checkbox"> Los avisos de abajo, uno a la vez y todos en el mismo sitio; «Plan actualizado» sigue con [Deshacer]</label>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_V2.html', html)
console.log(`REPASO_V2.html: ${Math.round(html.length / 1024)} kB`)
