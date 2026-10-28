// Tanda 10N8 (N2) · apartados 1, 1b, 2 y 2b: perfil, orden de Ajustes, «Este código no existe.», avisos de desde que te uniste, sonido, botones flotantes y pastilla del pase.
// Esta parte no abre navegador (lee el código y corre la lógica pura); las pantallas se miran en pruebaTanda10N8_pantallas.mjs (por la cola de Chrome).
//   node scripts/destino/pruebaTanda10N8_perfil.mjs
import fs from 'node:fs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

console.log('1. Mis viajes: una tarjeta a todo el ancho, varias al 60 %; el [+]')
{
  const cuerpo = leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
  const tarjeta = leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx')
  debe(/enFila\.length \+ \(antes > 0 \? 1 : 0\) <= 1 \? '100%' : '60%'/.test(cuerpo), 'ancho', 'un solo viaje = 100 %, más de uno = 60 %')
  debe(/ancho = '60%'/.test(tarjeta) && /width: ancho/.test(tarjeta), 'ancho', 'la tarjeta usa el ancho que le dan')
  debe(/width: anchoDeTarjeta/.test(cuerpo), 'ancho', 'la tarjeta «Antes de la app» lleva el mismo ancho')
  const hoja = leer('src/components/layout/PerfilSheet.tsx')
  debe(hoja.includes('titulo="Añade un viaje que ya hiciste"') && hoja.includes('linea="¿Viajaste antes de tener JUTRIP? Añade tu destino y rellena tu mapa y tu pasaporte."'), 'texto', 'la tarjeta del [+] con el texto nuevo')
}

console.log('1b. Orden de Ajustes')
{
  const aj = leer('src/components/ajustes/AjustesScreen.tsx')
  const pos = (t) => aj.indexOf(t)
  const orden = ['datos="cuenta"', 'datos="moneda"', 'datos="codigo"', 'datos="mis-pases"', 'datos="sonido"', 'datos="avisos-movil"', 'datos="tutorial"', 'datos="invitar-amigo"', 'datos="privacidad"', 'datos="cerrar-sesion"'].map(pos)
  debe(orden.every((p, i) => p > 0 && (i === 0 || p > orden[i - 1])), 'orden', `correo, Moneda, código, Mis pases, La app, Invitar, Privacidad y Cerrar sesión al final (${orden.join(',')})`)
  const laApp = aj.slice(pos('<Grupo titulo="La app">'), pos('<Grupo>'))
  debe(!/datos="moneda"/.test(laApp), 'orden', '«Moneda» ya no está en «La app»')
  const cerrar = aj.slice(pos('datos="privacidad"'))
  debe(/<Grupo>\s*<Fila icono="salir" titulo="Cerrar sesión"[\s\S]*?datos="cerrar-sesion" \/>\s*<\/Grupo>/.test(cerrar), 'orden', '«Cerrar sesión» sola en su bloque')
}

console.log('2. El código que no vale')
{
  const u = leer('src/lib/unirseConCodigo.ts')
  const inv = leer('src/lib/invitaciones.ts')
  debe(u.includes("TEXTO_CODIGO_NO_VALE = 'Este código no existe.'"), 'código', 'el texto es solo «Este código no existe.»')
  debe(/return 'Este código no existe\.'/.test(inv), 'código', 'la hoja de la invitación dice lo mismo')
}

console.log('2. Avisos de desde que te uniste')
{
  const h = leer('src/hooks/useAppNotices.ts')
  debe(/trazo:desde-que-me-uni:/.test(h) && /useNoticesStore\.getState\(\)\.hide\(ids\)/.test(h) && /fecha:\$\{a\.id\}/.test(h) && /reserva-grupo:\$\{r\.id\}/.test(h), 'unirse', 'al ver el viaje por primera vez como invitado, lo que ya traía se esconde')
  const m = leer('supabase/migrations/0058_avisos_viaje_nuevos_y_salir.sql')
  debe(/update public\.avisos set oculto_en = coalesce\(oculto_en, now\(\)\)[\s\S]*tipo <> 'quitado'/.test(m), 'salir', 'al salir o quitarte, los avisos del viaje se esconden (menos «Ya no formas parte…»)')
}

console.log('2. El sonido de los avisos')
{
  const s = leer('src/lib/sonidos.ts')
  debe(/'touchend', 'click', 'pointerup', 'keydown'/.test(s) && /ctx\.state !== 'running'/.test(s), 'sonido', 'cada toque comprueba y reanuda el audio (iPhone)')
  const f = leer('src/store/useFranjaStore.ts')
  debe(/sonar\('aviso'\)/.test(f), 'sonido', 'la franja hace sonar «aviso» con todos los avisos nuevos')
  const t = leer('src/lib/tripPersistence.ts')
  debe(/fueGuardadaAqui/.test(t) && /fueGuardadaAqui/.test(leer('src/lib/viajeEnDirecto.ts')), 'eco', 'el eco de cualquiera de los últimos guardados propios no cuenta como cambio de otra persona')
}

console.log('2b. La pastilla del pase')
{
  const p = leer('src/components/pase/PastillaPase.tsx')
  debe(/background: '#1C2230'/.test(p) && /#D2B67A/.test(p), 'pastilla', 'sin pase: azul oscuro con candado dorado')
  debe(/linear-gradient\(100deg,#E6CB8E/.test(p) && /'hecho'/.test(p), 'pastilla', 'con pase: dorado con ✓')
  debe(/data-pastilla-pase="cargando"[^>]*h-\[30px\] w-\[118px\][^>]*rounded-full/.test(p) && /rgba\(28,34,48,\.08\)/.test(p), 'pastilla', 'mientras no se sabe: hueco gris claro del mismo alto, sin texto')
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
