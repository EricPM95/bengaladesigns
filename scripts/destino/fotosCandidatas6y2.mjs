// Genera docs/dias/FOTOS_ROMA_CANDIDATAS.html (Tanda 6y2) desde data/dias/roma/_fotos_candidatas_6y2.json y _fotos.json › fotos_rechazadas.
//   node scripts/destino/fotosCandidatas6y2.mjs
// La página es autocontenida (un solo fichero, estilos dentro, sin scripts); las fotos se cargan de images.unsplash.com, así que hace falta internet.
import fs from 'node:fs'

const fotos = JSON.parse(fs.readFileSync('data/dias/roma/_fotos.json', 'utf8'))
const candidatas = JSON.parse(fs.readFileSync('data/dias/roma/_fotos_candidatas_6y2.json', 'utf8'))
const motivoDe = new Map((fotos.fotos_rechazadas ?? []).map((entrada) => [entrada.lugar, entrada.motivo]))

const esc = (texto) => String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tarjeta = (c, n) => `
      <figure class="cand">
        <a href="${esc(c.pagina)}" target="_blank" rel="noopener noreferrer"><img src="${esc(c.small)}" alt="${esc(c.descripcion || c.nota)}" loading="lazy" width="400" height="260"></a>
        <figcaption>
          <p class="op">Opción ${n}</p>
          <p class="nota">${esc(c.nota)}</p>
          <p class="autor">Foto de <a href="${esc(c.autor_url)}" target="_blank" rel="noopener noreferrer">${esc(c.autor)}</a> en <a href="https://unsplash.com/?utm_source=viajes_bengala&amp;utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a> · <a href="${esc(c.pagina)}" target="_blank" rel="noopener noreferrer">ver la foto</a></p>
        </figcaption>
      </figure>`

const secciones = candidatas.entradas
  .map((e) => {
    const motivo = motivoDe.get(e.lugar)
    const cuerpo =
      e.candidatas.length > 0
        ? `<div class="cands">${e.candidatas.map((c, i) => tarjeta(c, i + 1)).join('')}\n    </div>`
        : ''
    return `
  <section id="${esc(e.lugar.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'))}">
    <p class="tipo">${e.tipo === 'excursion' ? 'Excursión' : 'Lugar'}</p>
    <h2>${esc(e.lugar)}</h2>
    <p class="hoy"><strong>Qué pasaba:</strong> ${esc(motivo ?? e.dice_hoy)}</p>
    ${e.aviso ? `<p class="aviso">${esc(e.aviso)}</p>` : ''}
    ${cuerpo}
    <p class="tuya">¿Ninguna te convence? Pon una tuya con el nombre fijo en <code>public/fotos/roma/</code> (o dímelo y la preparo) y este sitio sale con ella.</p>
  </section>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fotos de Roma: candidatas para elegir</title>
<style>
  :root { --fondo: #f6f1e7; --tarjeta: #fffdf8; --texto: #1f1b16; --suave: #6b6458; --acento: #b4325a; --linea: rgba(31,27,22,.12); }
  @media (prefers-color-scheme: dark) { :root { --fondo: #161310; --tarjeta: #211c17; --texto: #f3eee4; --suave: #a79f91; --acento: #e8708f; --linea: rgba(243,238,228,.16); } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fondo); color: var(--texto); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font: 600 30px/1.15 Georgia, "Times New Roman", serif; margin: 0 0 8px; }
  h2 { font: 600 24px/1.2 Georgia, "Times New Roman", serif; margin: 2px 0 6px; }
  a { color: var(--acento); }
  code { background: var(--linea); padding: 1px 5px; border-radius: 4px; font-size: .9em; }
  .intro { color: var(--suave); max-width: 70ch; }
  .intro strong { color: var(--texto); }
  section { background: var(--tarjeta); border: 1px solid var(--linea); border-radius: 18px; padding: 20px; margin-top: 24px; }
  .tipo { font: 600 11px/1 ui-monospace, Consolas, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--acento); margin: 0; }
  .hoy { color: var(--suave); margin: 4px 0 10px; font-size: 14.5px; }
  .hoy strong { color: var(--texto); }
  .aviso { background: rgba(180,50,90,.09); border-left: 3px solid var(--acento); padding: 8px 12px; border-radius: 0 8px 8px 0; margin: 10px 0 14px; font-size: 14.5px; }
  .cands { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-top: 12px; }
  .cand { margin: 0; border: 1px solid var(--linea); border-radius: 14px; overflow: hidden; background: var(--fondo); }
  .cand img { display: block; width: 100%; height: 190px; object-fit: cover; background: var(--linea); }
  figcaption { padding: 10px 12px 12px; }
  figcaption p { margin: 0; }
  .op { font-weight: 700; font-size: 14px; }
  .nota { font-size: 14px; margin-top: 2px; }
  .autor { font-size: 12.5px; color: var(--suave); margin-top: 6px; }
  .tuya { color: var(--suave); font-size: 13.5px; margin: 14px 0 0; }
  footer { margin-top: 28px; color: var(--suave); font-size: 13px; }
</style>
</head>
<body>
<main>
  <h1>Fotos de Roma: candidatas para elegir</h1>
  <p class="intro">Estos ${candidatas.entradas.length} sitios llevaban en la app una foto de Wikipedia que <strong>no era el sitio</strong>. Mientras no se cambie, <strong>van sin foto</strong> (el recuadro de color de la app): es mejor que una foto equivocada. Aquí tienes hasta 3 fotos de Unsplash de cada uno para elegir. <strong>Dime «Trastevere: opción 2»</strong> (o pon una foto tuya) y la preparo. Si una foto no es de verdad el sitio, no la elijas: la API de Unsplash no dice dónde se hizo la foto, solo su descripción, y por eso cada candidata lleva una nota de cuánto te puedes fiar.</p>
${secciones}
  <footer>Fotos de Unsplash, enlazadas desde images.unsplash.com (hace falta conexión). Cada una con el nombre de su autor y su enlace, como piden sus condiciones. Generada con <code>scripts/destino/fotosCandidatas6y2.mjs</code> (Tanda 6y2).</footer>
</main>
</body>
</html>
`
fs.writeFileSync('docs/dias/FOTOS_ROMA_CANDIDATAS.html', html)
console.log('docs/dias/FOTOS_ROMA_CANDIDATAS.html escrito:', candidatas.entradas.length, 'sitios,', candidatas.entradas.reduce((n, e) => n + e.candidatas.length, 0), 'candidatas')
