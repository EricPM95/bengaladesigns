// Prepara el SQL de limpieza LISTO PARA PEGAR (con los correos de los administradores y las cuentas que se guardan a mano) en la carpeta de la copia, FUERA del repo.
//   ADMIN_EMAILS="uno@x.com,otro@y.com" EXTRA_IDS="uuid1,uuid2" node scripts/limpieza/prepararSql.mjs [carpeta]
import fs from 'node:fs'
import path from 'node:path'

const [c1, c2] = String(process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())
if (!c1 || !c2) throw new Error('Faltan los dos correos en ADMIN_EMAILS.')
const extra = String(process.env.EXTRA_IDS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
if (extra.some((i) => !/^[0-9a-f-]{36}$/i.test(i))) throw new Error('Algún id de EXTRA_IDS no es un uuid.')
const carpeta = process.argv[2] ?? path.join(process.env.USERPROFILE ?? '.', 'Desktop', 'JUTRIP_copia_cuentas_de_prueba_2026-11-15')
if (path.resolve(carpeta).startsWith(path.resolve('.'))) throw new Error('El SQL con correos no puede estar dentro del repo.')
const sql = fs.readFileSync('scripts/limpieza/borrarCuentasDePrueba.sql', 'utf8').replaceAll('__CORREO_1__', c1).replaceAll('__CORREO_2__', c2).replaceAll('__IDS_EXTRA__', extra.length ? extra.map((i) => `'${i}'::uuid`).join(', ') : 'null::uuid')
const salida = path.join(carpeta, 'BORRAR_cuentas_de_prueba.sql')
fs.writeFileSync(salida, sql)
console.log(`Listo: ${salida} (se guardan ${extra.length} cuenta(s) a mano además de las de los dos correos).`)
