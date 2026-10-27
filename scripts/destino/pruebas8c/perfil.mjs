// La prueba del Perfil con su marco, los 10 marcos de rango, «Mis viajes → un viaje» y la EXP a la vista (Tanda 8C2).
// Comprueba el código (reglas del encargo), los pesos de los marcos y la lógica pura del servidor (server/logros/pantallas/perfil.js) sobre los datos de verdad.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const titulo = 'Perfil con marco de rango, marcos WebP, Mis viajes → un viaje y la EXP a la vista'

const raiz = process.cwd()
const ruta = (...p) => path.join(raiz, ...p)
const importar = (f) => import(pathToFileURL(ruta(f)).href)

export default async function ({ debe, leer, archivos, sinComentarios }) {
  const carpeta = 'src/components/logros/pantallas/perfil'
  const ficheros = ['src/components/layout/PerfilSheet.tsx', 'src/components/logros/pantallas/ViajeGuardado.tsx', 'server/logros/pantallas/perfil.js', 'src/lib/logrosDemo_perfil.ts', 'src/dev/escaparates/perfil.ts', 'scripts/destino/marcos8c.mjs', 'src/components/perfil/agruparViajes.ts']
  for (const f of ficheros) debe(fs.existsSync(ruta(f)), 'archivos', `existe ${f}`)
  const propios = archivos(ruta(carpeta), /\.(ts|tsx)$/)
  for (const n of ['MarcoDeRango', 'NivelYBarra', 'ExpGanada', 'SubeDeNivel', 'CambioDeRango', 'CuerpoConLogros', 'ElegirTitulo', 'index']) debe(propios.some((f) => path.basename(f).startsWith(n + '.')), 'archivos', `existe ${n} en pantallas/perfil`)
  const codigo = [...propios, ruta('src/components/logros/pantallas/ViajeGuardado.tsx')].map((f) => ({ f: path.relative(raiz, f), t: sinComentarios(leer(f)) }))

  /* ── Los 10 marcos: pesos y carga bajo demanda ── */
  for (let n = 1; n <= 10; n++) {
    const f = ruta(`public/marcos/marco-${n}.webp`)
    const ok = fs.existsSync(f)
    debe(ok, 'marcos', `existe public/marcos/marco-${n}.webp`)
    if (ok) {
      const kb = fs.statSync(f).size / 1024
      debe(kb >= 30 && kb <= 80, 'marcos', `marco ${n}: ${kb.toFixed(1)} KB (debe estar entre 30 y 80)`)
    }
    debe(fs.existsSync(ruta(`public/marcos/hueco-${n}.webp`)), 'marcos', `existe el hueco ${n}`)
  }
  const marco = codigo.find((c) => c.f.endsWith('MarcoDeRango.tsx'))?.t ?? ''
  debe(/loading="lazy"/.test(marco), 'lazy', 'la imagen del marco lleva loading="lazy"')
  debe(!/^import .*\.(webp|png)'/m.test(marco), 'lazy', 'los marcos no se importan en el código (se piden por URL al pintarse)')
  const hoja = sinComentarios(leer(ruta('src/components/layout/PerfilSheet.tsx')))
  debe(/lazy\(\(\) => import\('\.\.\/logros\/pantallas\/perfil\/CuerpoConLogros'\)\)/.test(hoja), 'lazy', 'el Perfil con logros se baja con import() (no entra en el paquete al abrir la app)')
  debe(!/pantallas\/perfil\/(MarcoDeRango|NivelYBarra|ExpGanada)/.test(hoja.replace(/import\('\.\.\/logros\/pantallas\/perfil\/CuerpoConLogros'\)/, '')), 'lazy', 'PerfilSheet no importa a mano nada de pantallas/perfil salvo el cuerpo perezoso')
  debe(!/logrosActivos\(\)/.test(hoja) && /logrosActivos\(\)/.test(sinComentarios(leer(ruta(carpeta, 'CuerpoConLogros.tsx')))), 'apagado', '(10N4) la rama de los logros vive dentro del cuerpo único: PerfilSheet ya no decide entre dos perfiles')
  debe(!/cuerpoDeSiempre/.test(hoja), 'apagado', '(10N4) con los logros apagados NO queda el cuerpo de siempre: es el mismo perfil nuevo sin lo de los logros')
  const host = leer(ruta('src/components/logros/pantallas/PantallasHost.tsx'))
  debe(/import\('\.\/ViajeGuardado'\)/.test(host), 'lazy', 'ViajeGuardado se carga con import() desde PantallasHost')

  /* ── Reglas del encargo sobre el código nuevo ── */
  const todo = codigo.map((c) => c.t).join('\n')
  debe(!/(Civitatis|Booking|Stay22|WhatsApp|Instagram|Tiktok|Apple|Google|Routy)/i.test(todo), 'empresas', 'ningún nombre de empresa ni de la app en los textos')
  debe(!/(madrugador|nocturno)[^\n]{0,60}\d{1,2}[:.]\d{2}/i.test(todo), 'horas', 'ninguna hora de Madrugador o Nocturno')
  debe(/prefers-reduced-motion/.test(leer(ruta(carpeta, 'util.ts'))), 'movimiento', 'se mira prefers-reduced-motion')
  for (const n of ['ExpGanada', 'SubeDeNivel', 'CambioDeRango']) {
    const t = codigo.find((c) => c.f.endsWith(`${n}.tsx`))?.t ?? ''
    debe(/movimientoReducido\(\)/.test(t), 'movimiento', `${n} respeta «reducir movimiento»`)
    debe(/onFin/.test(t), 'api', `${n} tiene onFin`)
  }
  debe(!/ResumenDia|resumen del d[ií]a/i.test(todo), 'resumen', 'nada de EXP en el resumen del día (no se toca ResumenDia)')
  // Números de niveles/EXP: ninguno escrito a mano (los de la tabla salen del servidor).
  const sinNumeros = codigo.filter((c) => /NivelYBarra|ExpGanada|CuerpoConLogros/.test(c.f)).map((c) => c.t).join('\n')
  debe(!sinNumeros.split('\n').filter((l) => !/DURACION|font:/.test(l)).some((l) => /\b(900|1\.?300|2\.?500|3\.?000)\b/.test(l)), 'numeros', 'ningún coste de nivel escrito a mano en el móvil')
  // 44 px de toque en lo que se toca
  debe(/min-h-\[44px\]/.test(codigo.find((c) => c.f.endsWith('CuerpoConLogros.tsx'))?.t ?? ''), '44px', 'el título del Perfil tiene zona de toque de 44 px')
  debe(/h-11 w-11/.test(codigo.find((c) => c.f.endsWith('CuerpoConLogros.tsx'))?.t ?? ''), '44px', 'Ajustes tiene zona de toque de 44 px')
  // Emblemas ocultos: el Perfil solo dibuja lo que el servidor manda como ganado.
  debe(/CON_HORA/.test(leer(ruta(carpeta, 'piezasDelViaje.ts'))), 'emblemas', 'las piezas del viaje no dibujan Madrugador ni Nocturno')

  /* ── El servidor: funciones puras sobre los datos de verdad ── */
  const P = await importar('server/logros/pantallas/perfil.js')
  const { soloActivos } = await importar('server/logros/viajeroActivo.js')
  const leerJson = (f) => JSON.parse(fs.readFileSync(ruta(f), 'utf8'))
  const roma = leerJson('data/logros/roma.json')
  const catalogo = leerJson('data/pipeline_v2/roma.json')
  const destino = { ...roma }
  Object.defineProperty(destino, 'sitios_catalogo', { value: (catalogo.places ?? []).map((p) => p.id), enumerable: false })
  const datos = { destinos: { roma: destino }, viajero: soloActivos(leerJson('data/logros/viajero.json')), ajustes: leerJson('data/logros/ajustes.json'), exp: leerJson('data/logros/exp.json') }
  const { resumenDeExp, expDeNivel } = await importar('server/logros/exp.js')
  const { catalogoDePaises } = await importar('server/logros/pantallas/previos.js')
  const it = (destino_, logro, escalon, en) => ({ clave: `${destino_}|${logro}|${escalon}`, logro, escalon: String(escalon), destino: destino_, en })
  const lista = [
    it('*', 'viajero:paises', 1, '2026-10-10T10:00:00Z'),
    it('*', 'viajero:paises', 3, '2026-10-11T10:00:00Z'),
    it('roma', 'sello', 'roma:bronce', '2026-10-10T11:00:00Z'),
    it('roma', 'sello', 'roma:oro', '2026-10-13T11:00:00Z'),
    it('roma', 'emblema', 'coliseo', '2026-10-12T11:00:00Z'),
    it('roma', 'emblema', 'madrugador', '2026-10-12T12:00:00Z'),
    it('roma', 'coleccion', 'imprescindibles', '2026-10-09T11:00:00Z'),
  ]
  const items = new Map(lista.map((x) => [x.clave, x]))
  const ahora = new Date('2026-10-18T10:00:00Z')

  const titulos = P.titulosGanados({ datos, items, ahora })
  const t = titulos.find((x) => x.id === 'paises')
  debe(titulos.length === 1 && t?.escalon === 1 && t.clave === '*|viajero:paises|1', 'titulos', `solo sale el escalón más alto ganado de cada logro (${JSON.stringify(titulos.map((x) => x.clave))})`)
  debe(!!t?.nombre && t.grupo === 'mundo', 'titulos', 'el título trae su nombre y su grupo del servidor')
  debe(P.titulosGanados({ datos, items: new Map(), ahora }).length === 0, 'titulos', 'sin logros de viajero no hay títulos que elegir')

  const v = P.resumenDeVitrina({ items })
  debe(v.recientes.length === 3, 'vitrina', 'el resumen de la vitrina dibuja 3 piezas')
  debe(v.recientes.filter((x) => x.logro === 'sello').length <= 1, 'vitrina', 'un sello que sube de grado cuenta una vez')
  debe(!v.recientes.some((x) => x.escalon === 'madrugador'), 'vitrina', 'Madrugador no sale en el resumen (su dibujo lleva una hora)')
  // 7 cosas ganadas, pero el país 1 y el 3 son un solo logro y el sello bronce y el oro son un solo sello: 5 logros (los mismos que cuenta «Todos mis logros»).
  debe(v.logros === lista.length - 2, 'vitrina', `los logros se cuentan una vez cada uno, sin repetir escalones ni grados (${v.logros} de ${lista.length})`)

  const exp = resumenDeExp(expDeNivel(8, datos.exp) + 100, datos.exp)
  const p = P.construirPerfil({ datos, items, exp, guardada: { baldas: {}, titulo: '*|viajero:paises|1' }, previos: { paises: ['Francia'], dias: 0 }, ahora, catalogo: catalogoDePaises() })
  debe(p.ok && p.titulo?.clave === '*|viajero:paises|1', 'perfil', 'el título guardado sale como elegido')
  debe(p.exp.nivel === 8 && p.exp.rango === datos.exp.niveles.rangos[1] && p.exp.exp_en_nivel === 100, 'perfil', 'la EXP, el nivel y el rango salen de la tabla del servidor')
  debe(p.exp.maximo === false, 'perfil', 'a nivel 8 no es el último nivel')
  debe(P.construirPerfil({ datos, items, exp, guardada: { baldas: {}, titulo: '*|viajero:viajes|99' }, previos: { paises: [], dias: 0 }, ahora, catalogo: catalogoDePaises() }).titulo === null, 'perfil', 'un título que no se ha ganado no sale elegido')
  debe(p.pasaporte.paises >= 1 && p.pasaporte.sellos >= 1, 'perfil', `el pasaporte cuenta países y sellos (${p.pasaporte.paises} · ${p.pasaporte.sellos})`)
  debe(p.previos.paises === 1, 'perfil', 'cuenta los países de antes de la app')
  const tope = resumenDeExp(expDeNivel(50, datos.exp) + 10, datos.exp)
  debe(P.construirPerfil({ datos, items, exp: tope, previos: { paises: [], dias: 0 }, ahora, catalogo: catalogoDePaises() }).exp.maximo === true, 'perfil', 'en el último nivel `maximo` es verdadero')

  /* ── Lo ganado en un viaje (TR) ── */
  const fuenteTR = leer(ruta(carpeta, 'piezasDelViaje.ts'))
  debe(/resumen\?trip_id=/.test(fuenteTR), 'TR', 'lo ganado en el viaje se pide a /api/logros/resumen?trip_id=')

  /* ── Capturas hechas ── */
  const necesarias = ['P1', 'P1b', 'TR', 'E1-1-principio', 'E1-2-mitad', 'E1-3-final', 'E2-1-principio', 'E2-2-mitad', 'E2-3-final', 'E3-1-principio', 'E3-2-mitad', 'E3-3-final', 'E4-1-principio', 'E4-2-mitad', 'E4-3-final', ...Array.from({ length: 10 }, (_, i) => `P1-rango${i + 1}`)]
  for (const c of necesarias) debe(fs.existsSync(ruta(`docs/dias/capturas_8c/${c}.jpg`)), 'capturas', `existe la captura ${c}`)
}
