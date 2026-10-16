// Borra los textos guardados de /api/describe-stop (place_content_cache, destino «describe:<ciudad>») para que la IA los vuelva a escribir con el pedido nuevo
// («por qué vale la pena el sitio», nunca la logística de la ruta). Es solo caché: se regenera sola al abrir cada ficha.
//   node scripts/destino/borrarCacheDescribe.mjs          → cuenta lo que hay (no borra nada)
//   node scripts/destino/borrarCacheDescribe.mjs --borrar → lo borra
// Lee la dirección y la clave del .env.local; nunca las enseña.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
const clave = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY ?? env.VITE_SUPABASE_ANON_KEY
if (!url || !clave) {
  console.log('Sin conexión a Supabase en el .env.local: nada que borrar desde aquí.')
  process.exit(0)
}
const supabase = createClient(url, clave)
const borrar = process.argv.includes('--borrar')

const { count, error } = await supabase.from('place_content_cache').select('id', { count: 'exact', head: true }).like('destination', 'describe:%')
if (error) {
  console.log(`No he podido contarlos: ${error.message}`)
  process.exit(1)
}
console.log(`Textos guardados de la IA (describe-stop): ${count}`)
if (borrar && count) {
  const { data, error: errorBorrar } = await supabase.from('place_content_cache').delete().like('destination', 'describe:%').select('id')
  if (errorBorrar) {
    console.log(`No he podido borrarlos: ${errorBorrar.message}`)
    process.exit(1)
  }
  console.log(`Borrados: ${data?.length ?? 0}`)
  if ((data?.length ?? 0) < count) console.log('OJO: se han borrado menos de los que hay (permisos de la base de datos).')
}
