// REPASO de la Tanda V35A2 (arreglo del estudio de sonidos): antes y después, y la lista de comprobación.
import fs from 'node:fs'
const D = 'docs/dias/V35A2_capturas'
const par = (titulo, a, b) => `<h3>${titulo}</h3><div class="par"><figure><img src="V35A2_capturas/${a}"><figcaption>Antes</figcaption></figure><figure><img src="V35A2_capturas/${b}"><figcaption>Después</figcaption></figure></div>`
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const lista = [
  'Ya no existe «Sustituye a»: los sonidos de Eric se suman a los de Code.',
  'Cada sonido de Code (golpe, redoble, chispas…) tiene su fila con candidatos A–E, [Silenciar] y su volumen de 0 a 200 %. Arriba, [Silenciar todos los de Code].',
  'Los sonidos de Eric son capas: [Probar con mi sonido] y [+ Añadir otro sonido mío], cada uno con nombre, volumen, barra de ms, «Empieza…» y [Quitar].',
  '«Empieza…»: «Al empezar la animación» (0 ms = primer fotograma, por defecto) o «En el golpe» (0 ms = golpe / final).',
  'La barra de ms va de −duración a +duración, de 10 en 10, con −100 / −10 / 0 / +10 / +100.',
  'Adelantar de verdad: si un sonido cae antes del primer fotograma NO se recorta; la animación espera y la página lo dice.',
  'Línea de tiempo con una fila por sonido que suena, raya verde (empieza la animación) y raya roja (golpe / final) con su rótulo.',
  '«Lo elegido» dice todo lo que suena en cada animación (silenciados, candidato y volumen de cada sonido, y los míos con su momento).',
  'pruebaV35A2 40/0; pruebaV34C 84/0; pruebaV35A 91/0; pruebaV29 46/0; pruebaV30 532/0; pruebaJutrip 130/0.',
  'Solo se ha tocado /admin/sonidos (AdminSonidos, estudio, visor y lo de «propio» en motor). Ninguna prueba toca producción.',
]
fs.writeFileSync('docs/dias/REPASO_V35A2.html', `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V35A2 · estudio de sonidos</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1300px;margin:0 auto;padding:16px;color:#1C2230}.par{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%;border:1px solid #ddd;border-radius:8px}figcaption{font-size:12px;color:#667}@media(max-width:700px){.par{grid-template-columns:1fr}}</style><h1>V35A2 · Arreglo del estudio de sonidos</h1>${par('Tarjeta abierta', 'antes_abierta.jpg', 'despues_codigo.jpg')}${par('Probar con mi sonido (antes) / capas y línea de tiempo (después)', 'antes_propio.jpg', 'despues_capas.jpg')}<h3>En el iPhone</h3><figure><img style="max-width:390px" src="V35A2_capturas/despues_iphone.jpg"></figure><h2>Lista de comprobación de esta tanda</h2>${li(lista)}</html>`)
console.log('ok')
