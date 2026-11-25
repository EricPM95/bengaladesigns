// Tanda 10S9b, parte D (la del principal): los botones flotantes vuelven a estar siempre visibles (código y reglas), Ostia en la página del día 4 cuadra con la tabla y las reglas nuevas.
//   node scripts/destino/pruebaTanda10S9b_D.mjs        (sin navegador: lo de «siguen visibles después de bajar» en pantalla lo corre pruebaTanda10S9_A, apartado 5b, que el envoltorio pasa)
import fs from 'node:fs'

const fallos = []
let n = 0
const debe = (cond, texto) => {
  n++
  if (!cond) {
    fallos.push(texto)
    console.log(`  ✗ ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('1. Los botones flotantes: siempre visibles (código)')
{
  const flot = sinComentarios(leer('src/components/flotantes/flotantes.ts'))
  debe(!/escondidos|estiloEscondido|mostrarLosFlotantes|alDesplazar/.test(flot), 'flotantes.ts ya no esconde nada al bajar')
  debe(/AIRE_BAJO_LOS_BOTONES/.test(flot) && /suelo/.test(flot), 'flotantes.ts sigue dejando el hueco de abajo (regla de la 10S5: suelo y AIRE_BAJO_LOS_BOTONES)')
  for (const f of ['src/components/logros/momentos/BotonFlotanteLogros.tsx', 'src/components/propuesta/BotonDePropuesta.tsx', 'src/components/reorganizar/ReorganizarHost.tsx']) {
    const s = sinComentarios(leer(f))
    debe(!/estiloEscondido|data-flotantes-escondidos|escondidos/.test(s), `${f.split('/').pop()}: sin esconderse al bajar`)
    debe(/useFlotantes/.test(s), `${f.split('/').pop()}: sigue usando useFlotantes (hoja abierta y hueco)`)
  }
  debe(!/mostrarLosFlotantes/.test(sinComentarios(leer('src/components/logros/momentos/vuelo.ts'))), 'el dibujo que vuela a los logros ya no necesita traerlos de vuelta')
  // Ningún otro archivo de src llama a lo que se quitó.
  const resto = []
  const mira = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) mira(p); else if (/\.(ts|tsx)$/.test(e.name) && /estiloEscondido|mostrarLosFlotantes|data-flotantes-escondidos/.test(sinComentarios(leer(p)))) resto.push(p) } }
  mira('src')
  debe(resto.length === 0, `nada en src usa lo que se quitó (${resto.join(', ') || 'ninguno'})`)
}

console.log('2. Ostia Antica, página del día 4, cuadra con la tabla (3 h)')
{
  const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
  const tabla = roma.excursions.options.find((o) => o.id === 'ostia_antica')
  const dias = JSON.parse(leer('data/dias/roma/_excursiones.json'))
  const lista = Array.isArray(dias) ? dias : dias.excursiones ?? dias.opciones ?? Object.values(dias).find(Array.isArray) ?? []
  const o = lista.find((x) => x.id === 'ostia_antica')
  debe(Boolean(o), 'Ostia está en la página del día 4')
  debe(tabla.duration_hours === 3 && o?.duracion_h === tabla.duration_hours, `duración: página ${o?.duracion_h} h, tabla ${tabla.duration_hours} h`)
  // (V50, 24-nov) Las excursiones ya NO llevan horas ni punto de encuentro de ejemplo: solo datos verdaderos (la salida, la vuelta y las horas de las paradas están vacías hasta que haya un dato real).
  const salida = o?.paradas?.[0]?.hora
  const vuelta = o?.paradas?.at(-1)?.hora
  debe(!salida && !o?.vuelta && !vuelta, `sin horas inventadas: salida «${salida}», vuelta «${o?.vuelta}» / última parada «${vuelta}» (V50)`)
  debe(o?.paradas?.length === 3 && o.paradas.every((p) => !p.hora) && o.paradas[1].nombre === 'Ostia Antica', 'las 3 paradas (Roma · Ostia Antica · Roma) siguen, sin ninguna hora')
  debe(o?.paradas?.length === 3 && o.paradas.every((p) => !p.hora), 'la parada de Ostia cae entre la salida y la vuelta (por orden; sin horas)')
  debe(o?.punto_de_encuentro === tabla.meeting_point, 'el punto de encuentro es el de la tabla')
  debe(!/6 h|14:00/.test(JSON.stringify(o)), 'ya no queda ninguna «6 h» ni «14:00» en Ostia')
}

console.log('3. Las reglas nuevas están escritas')
{
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/10S9b/.test(reglas) && /SIEMPRE visibles/.test(reglas), 'REGLAS: los botones flotantes siempre visibles (10S9b)')
  debe(/rueda de hora vac[ií]a/i.test(reglas) && /se queda vac[ií]a/i.test(reglas), 'REGLAS: tocar fuera de una rueda vacía sin moverla la deja vacía')
  debe(/QUITADA en la 10S9b/.test(reglas), 'REGLAS: la regla de esconderlos al bajar queda marcada como quitada')
}

console.log(`pruebaTanda10S9b_D: ${n} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(' ✗', f)
process.exit(fallos.length ? 1 : 0)
