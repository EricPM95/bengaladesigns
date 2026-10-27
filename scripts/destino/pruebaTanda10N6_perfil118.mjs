// Tanda 10N6 (agente K3), respuesta 0a-4: el marco de la foto del perfil mide 118 px (como en Design) y no tapa el nombre.
//   APP_URL=http://localhost:5203 API_URL=http://localhost:8873 node scripts/destino/pruebaTanda10N6_perfil118.mjs
import { conViaje, esp, cuando, foto, leer, preparar } from './_10n6_k3_comun.mjs'
const { debe, fin } = preparar()
const cuerpo = leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
debe(!/tam=\{104\}/.test(cuerpo) && (cuerpo.match(/tam=\{118\}/g) || []).length >= 3, '0a-4', 'la cabecera del perfil usa 118 px en sus tres sitios (con marco, sin logros y su Avatar)')
debe(/w=\{118\} h=\{118\}/.test(leer('src/components/perfil/PerfilEsqueleto.tsx')), '0a-4', 'el esqueleto del perfil también mide 118')
const g = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
try {
  await g.evaluar("(() => { Array.from(document.querySelectorAll('button')).find((b) => /^Cerrar$/.test(b.innerText.trim()))?.click(); document.querySelector('[aria-label=\"Perfil y mis viajes\"]')?.click(); return true })()")
  await cuando(g, "Boolean(document.querySelector('[data-editar-perfil]'))", 80)
  await esp(2500)
  const m = await g.evaluar(`(() => { const b = document.querySelector('[data-editar-perfil]'); const cab = b?.closest('[data-cabecera-con-marco],[data-cabecera-sin-logros]'); const h2 = cab?.querySelector('h2'); const img = b?.querySelector('img,[class*=avatar],span'); const rb = b?.getBoundingClientRect(); const rh = h2?.getBoundingClientRect(); const marco = b?.firstElementChild?.getBoundingClientRect(); return { ancho: Math.round(rb?.width ?? 0), marco: Math.round(marco?.width ?? 0), nombreIzq: Math.round(rh?.left ?? 0), fotoDer: Math.round(rb?.right ?? 0), nombreDer: Math.round(rh?.right ?? 0), vw: innerWidth } })()`)
  debe(m.ancho === 118 || m.marco === 118, '0a-4', `el marco de la foto mide 118 px (${JSON.stringify(m)})`)
  debe(m.nombreIzq >= m.fotoDer && m.nombreDer <= m.vw, '0a-4', `el nombre no queda tapado ni se sale (${JSON.stringify(m)})`)
  await g.captura(foto('perfil_marco_118'))
} finally {
  g.cerrar()
}
fin('pruebaTanda10N6_perfil118')
