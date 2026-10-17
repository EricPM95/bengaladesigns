// Hace la página para elegir las fotos de Unsplash (Tanda 8B4): docs/dias/FOTOS_CANDIDATAS_8B4.html, a partir de docs/dias/notas_8b/candidatas_8b4.json.
//   node scripts/destino/paginaCandidatas8b4.mjs
// Cada sitio con sus 3 fotos grandes y numeradas, y cómo se verían recortadas en HOY v2 (la foto de la tarjeta, 2,2 : 1) y como miniatura de la lista (cuadrada, 48 px).
import fs from 'node:fs'

const datos = JSON.parse(fs.readFileSync('docs/dias/notas_8b/candidatas_8b4.json', 'utf8'))
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tarjeta = (s, c) => `
      <figure class="cand">
        <a href="${esc(c.enlace)}" target="_blank" rel="noopener noreferrer"><img class="grande" src="${esc(c.grande)}" alt="${esc(c.nota)}" loading="lazy"></a>
        <figcaption>
          <p class="op">Opción ${c.opcion} <span class="clave">${esc(s.id)} · ${c.opcion}</span></p>
          <p class="nota">${esc(c.nota)}</p>
          <div class="vistas">
            <div class="vista"><div class="hoyv2" style="background-image:url('${esc(c.grande)}')"></div><span>En HOY v2</span></div>
            <div class="vista"><div class="mini" style="background-image:url('${esc(c.pequena)}')"></div><span>Miniatura</span></div>
          </div>
          <p class="autor">Foto de <a href="${esc(c.enlace_autor)}" target="_blank" rel="noopener noreferrer">${esc(c.autor)}</a> en <a href="https://unsplash.com/?utm_source=viajes_bengala&amp;utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a> · ${esc(c.licencia)} · ${c.ancho}×${c.alto}</p>
        </figcaption>
      </figure>`

const secciones = datos.sitios
  .map(
    (s) => `
  <section id="${esc(s.id)}">
    <p class="tipo">Lugar</p>
    <h2>${esc(s.nombre)}</h2>
    <p class="hoy"><strong>Hoy:</strong> ${esc(s.hoy)}.</p>
    <div class="cands">${s.candidatas.map((c) => tarjeta(s, c)).join('')}
    </div>
    <p class="tuya">¿Ninguna te convence? Dime «ninguna» y se queda sin foto, o pon una tuya en <code>public/fotos/roma/</code>.</p>
  </section>`,
  )
  .join('')

const sin = datos.sin_candidatas
  .map(
    (s) => `
  <section id="${esc(s.id)}" class="sin">
    <p class="tipo">Lugar</p>
    <h2>${esc(s.nombre)}</h2>
    <p class="aviso"><strong>Sin ninguna candidata buena.</strong> ${esc(s.motivo)} Se queda sin foto hasta que tengamos una buena (o pongas tú una).</p>
  </section>`,
  )
  .join('')

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fotos de Unsplash para Roma: candidatas para elegir</title>
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
  .aviso { background: rgba(180,50,90,.09); border-left: 3px solid var(--acento); padding: 8px 12px; border-radius: 0 8px 8px 0; margin: 10px 0 4px; font-size: 14.5px; }
  .cands { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-top: 12px; }
  .cand { margin: 0; border: 1px solid var(--linea); border-radius: 14px; overflow: hidden; background: var(--fondo); }
  .cand img.grande { display: block; width: 100%; height: auto; max-height: 340px; object-fit: contain; background: #111; }
  figcaption { padding: 10px 12px 12px; }
  figcaption p { margin: 0; }
  .op { font-weight: 700; font-size: 15px; }
  .clave { font: 500 11px ui-monospace, Consolas, monospace; color: var(--suave); margin-left: 6px; }
  .nota { font-size: 14px; margin-top: 2px; }
  .vistas { display: flex; align-items: flex-end; gap: 14px; margin-top: 10px; }
  .vista { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: var(--suave); }
  .hoyv2 { width: 220px; aspect-ratio: 2.2 / 1; border-radius: 14px; background-size: cover; background-position: center; border: 1px solid var(--linea); }
  .mini { width: 48px; height: 48px; border-radius: 10px; background-size: cover; background-position: center; border: 1px solid var(--linea); }
  .autor { font-size: 12.5px; color: var(--suave); margin-top: 8px; }
  .tuya { color: var(--suave); font-size: 13.5px; margin: 14px 0 0; }
  footer { margin-top: 28px; color: var(--suave); font-size: 13px; }
</style>
</head>
<body>
<main>
  <h1>Fotos de Unsplash para Roma: candidatas para elegir</h1>
  <p class="intro">Son los sitios que se han quedado <strong>sin foto propia</strong>. De cada uno hay <strong>3 candidatas</strong> de Unsplash: de día, del sitio de verdad, apaisadas (se pueden recortar en horizontal), sin gente en primer plano y sin marcas de agua. Debajo de cada una se ve <strong>cómo quedaría recortada</strong> en HOY v2 (la foto de la tarjeta) y en la miniatura de la lista. <strong>Todavía no hay ninguna en la app</strong>: dime «sitio: opción» (por ejemplo «Panteón: 1») y la pongo, con su autor.</p>
  <p class="intro">La licencia de Unsplash permite usarlas en una app que cobra. Aun así, cada foto lleva su autor y su enlace. Los sitios del final no tienen ninguna candidata buena y se quedan sin foto.</p>
${secciones}
  <h2 style="margin-top:36px">Sin ninguna candidata buena</h2>
${sin}
  <footer>Generada el ${esc(datos.fecha)} con <code>scripts/destino/paginaCandidatas8b4.mjs</code> a partir de <code>docs/dias/notas_8b/candidatas_8b4.json</code> (autor, enlace y licencia de cada foto).</footer>
</main>
</body>
</html>
`
fs.writeFileSync('docs/dias/FOTOS_CANDIDATAS_8B4.html', html)
console.log('docs/dias/FOTOS_CANDIDATAS_8B4.html escrita:', datos.sitios.length, 'sitios con candidatas,', datos.sin_candidatas.length, 'sin ninguna')
