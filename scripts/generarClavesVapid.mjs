// Genera las claves VAPID de los avisos al móvil (web push, Tanda 8A2) y las escribe en .env.local. Nunca las enseña: ni en la consola ni en un archivo que vaya a git.
//   node scripts/generarClavesVapid.mjs                      → crea las claves si no existen (no pisa las que ya hay)
//   node scripts/generarClavesVapid.mjs --forzar             → las cambia por otras nuevas (los móviles ya suscritos tendrán que suscribirse otra vez)
//   node scripts/generarClavesVapid.mjs --contacto=mailto:tu@email   → pone también el contacto (si no, deja un aviso para que lo pongas)
//
// En Vercel (Settings → Environment Variables) hay que poner estas tres con los MISMOS valores que salen en .env.local (ábrelo y cópialos; no los pegues en ningún chat):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO (un «mailto:» con un email tuyo)
// y, cuando estén la pantalla del permiso y todo lo demás, PUSH_ACTIVO=true. Hasta entonces el envío sigue apagado.
import fs from 'node:fs'
import webpush from 'web-push'

const forzar = process.argv.includes('--forzar')
const contacto = process.argv.find((a) => a.startsWith('--contacto='))?.slice('--contacto='.length) ?? null
const ruta = '.env.local'
const antes = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : ''
const tiene = (nombre) => new RegExp(`^${nombre}=.+$`, 'm').test(antes)

if (tiene('VAPID_PUBLIC_KEY') && tiene('VAPID_PRIVATE_KEY') && !forzar) {
  console.log('Ya hay claves VAPID en .env.local: no se ha cambiado nada (usa --forzar para cambiarlas).')
  if (contacto && !tiene('VAPID_CONTACTO')) {
    fs.appendFileSync(ruta, `${antes.endsWith('\n') || antes === '' ? '' : '\n'}VAPID_CONTACTO=${contacto}\n`)
    console.log('Contacto añadido.')
  }
  process.exit(0)
}

const claves = webpush.generateVAPIDKeys()
let texto = antes
const poner = (nombre, valor) => {
  const linea = `${nombre}=${valor}`
  const re = new RegExp(`^${nombre}=.*$`, 'm')
  texto = re.test(texto) ? texto.replace(re, () => linea) : `${texto}${texto === '' || texto.endsWith('\n') ? '' : '\n'}${linea}\n`
}
poner('VAPID_PUBLIC_KEY', claves.publicKey)
poner('VAPID_PRIVATE_KEY', claves.privateKey)
if (contacto) poner('VAPID_CONTACTO', contacto)
else if (!tiene('VAPID_CONTACTO')) poner('VAPID_CONTACTO', 'mailto:PON-AQUI-TU-EMAIL')
fs.writeFileSync(ruta, texto)

console.log('Claves VAPID creadas y guardadas en .env.local (no se enseñan aquí).')
if (!contacto && !tiene('VAPID_CONTACTO')) console.log('OJO: cambia VAPID_CONTACTO en .env.local por «mailto:» y tu email.')
console.log('En Vercel, pon con los mismos valores: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_CONTACTO. Y PUSH_ACTIVO=true solo cuando todo esté listo.')
