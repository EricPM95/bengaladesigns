// V26: PONER LA CACHÉ DE UN AÑO A LAS FOTOS QUE YA ESTÁN SUBIDAS (las de antes de la V26 se subieron con la caché por defecto de Supabase: 1 hora).
// Supabase NO deja cambiar solo ese dato de un archivo que ya existe: la única forma es volver a escribir el archivo con el dato nuevo, desde AQUÍ (no desde los móviles) y con la misma ruta (sin cambiar nada más).
// El almacén entero pesa unos 3 MB (el panel de Supabase dice 0,003 GB), así que son unos segundos y casi nada de tráfico. NO lo corre nadie solo: es una ESCRITURA en producción y la decide Eric.
//
//   Ver qué haría (no toca nada):   SUPABASE_SERVICE_ROLE_KEY=… VITE_SUPABASE_URL=… node scripts/destino/cacheDeLasFotosViejas.mjs
//   Hacerlo de verdad:              SUPABASE_SERVICE_ROLE_KEY=… VITE_SUPABASE_URL=… node scripts/destino/cacheDeLasFotosViejas.mjs --aplicar
// La clave se lee del entorno (nunca se escribe en ningún fichero ni se imprime). Cada archivo: se baja, se vuelve a subir con `upsert` y `cacheControl: 31536000`, y se comprueba que el tamaño sigue igual.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
const aplicar = process.argv.includes('--aplicar')
if (!url || !clave) {
  console.log('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno (la clave no se escribe en ningún sitio).')
  process.exit(1)
}
const admin = createClient(url, clave, { auth: { persistSession: false } })
const BUCKETS = ['fotos-viaje', 'perfiles']

async function listar(bucket, carpeta = '') {
  const { data, error } = await admin.storage.from(bucket).list(carpeta, { limit: 1000 })
  if (error) throw new Error(`${bucket}/${carpeta}: ${error.message}`)
  const salida = []
  for (const e of data ?? []) {
    const ruta = carpeta ? `${carpeta}/${e.name}` : e.name
    if (e.id === null || e.metadata == null) salida.push(...(await listar(bucket, ruta)))
    else salida.push({ ruta, tam: e.metadata?.size ?? null, cache: e.metadata?.cacheControl ?? null, tipo: e.metadata?.mimetype ?? 'image/jpeg' })
  }
  return salida
}

let total = 0
let cambiados = 0
let bytes = 0
for (const bucket of BUCKETS) {
  const archivos = await listar(bucket)
  const pendientes = archivos.filter((a) => !/31536000/.test(a.cache ?? ''))
  console.log(`${bucket}: ${archivos.length} archivos, ${pendientes.length} sin la caché de un año (${Math.round(pendientes.reduce((s, a) => s + (a.tam ?? 0), 0) / 1024)} KB)`)
  total += archivos.length
  if (!aplicar) continue
  for (const a of pendientes) {
    const { data: blob, error: eb } = await admin.storage.from(bucket).download(a.ruta)
    if (eb || !blob) {
      console.log(`  no se pudo bajar ${a.ruta}: ${eb?.message}`)
      continue
    }
    const { error: es } = await admin.storage.from(bucket).upload(a.ruta, blob, { upsert: true, cacheControl: '31536000', contentType: a.tipo })
    if (es) {
      console.log(`  no se pudo subir ${a.ruta}: ${es.message}`)
      continue
    }
    cambiados++
    bytes += blob.size
  }
}
console.log(aplicar ? `Hecho: ${cambiados} archivos con la caché de un año (${Math.round(bytes / 1024)} KB movidos).` : `Solo mirado (${total} archivos). Para hacerlo de verdad: añade --aplicar.`)
