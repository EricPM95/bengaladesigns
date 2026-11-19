// La prueba del SERVIDOR de la V20 («Cuéntanos»): server/avisosViajeros.js + migraciones 0085 y 0086. Sin navegador y sin servidores de la app: PGlite (todas las migraciones reales) y un express en un puerto
// aleatorio dentro de la propia prueba, con un cliente de Supabase de mentira (auth, rpc sobre PGlite y un almacén en memoria).
//   node scripts/destino/pruebaV20_servidor.mjs
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import express from 'express'
import { crearBaseDePrueba, crearAdminDePrueba } from './_baseDeDatosPrueba.mjs'
import { registrarRutasAvisosViajeros, normalizarAviso } from '../../server/avisosViajeros.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) fallos.push(texto)
}

// ── La base de datos: todas las migraciones reales (las que no encajan en PGlite, como pg_cron, se ignoran) ──
const noAplicadas = []
const bd = await crearBaseDePrueba({ migraciones: /^\d{4}_.*\.sql$/, alFallar: (m) => noAplicadas.push(String(m)) })
debe(!noAplicadas.some((m) => /^008[56]/.test(m)), `las migraciones 0085 y 0086 se aplican (${noAplicadas.filter((m) => /^008[56]/.test(m)).join(' | ')})`)
const { q, servidor, nuevoUsuario } = bd
// Como en Supabase: lo que las migraciones revocan, revocado (la base de pruebas concede todo al final).
for (const fn of ['norm_destino_aviso(text)', 'aviso_viajero_guardar(jsonb)', 'avisos_viajeros_listar(text, text, text, integer)', 'aviso_viajero_obtener(uuid)', 'aviso_viajero_marcar(uuid, text, text)', 'avisos_viajeros_destinos()', 'avisos_viajeros_ya_esta(text, text)', 'aviso_viajero_foto_usada(uuid, jsonb)', 'fotos_de_viajeros(text)', 'empezar_de_cero(uuid)']) await bd.db.exec('revoke execute on function public.' + fn + ' from authenticated')
const S = (sql, params = []) => servidor(() => q(sql, params))
const una = async (sql) => (await q(sql))[0]
debe((await una(fs.readFileSync('docs/dias/COMPROBAR_0085.sql', 'utf8'))).migracion_0085?.aplicada === true, 'COMPROBAR_0085.sql dice aplicada')
debe((await una(fs.readFileSync('docs/dias/COMPROBAR_0086.sql', 'utf8'))).migracion_0086?.aplicada === true, 'COMPROBAR_0086.sql dice aplicada')
debe((await una("select count(*)::int as n from storage.buckets where id in ('avisos-viajeros','fotos-de-viajeros')")).n === 2, 'los dos almacenes existen')

// ── Las cuentas ──
const admin = await nuevoUsuario('admin@x.es')
const ana = await nuevoUsuario('ana@x.es')
const bea = await nuevoUsuario('bea@x.es')
const carlos = await nuevoUsuario('carlos@x.es')
const anonimo = await nuevoUsuario('anon@x.es', true)
const fichas = new Map([['T-admin', admin], ['T-ana', ana], ['T-bea', bea], ['T-carlos', carlos], ['T-anon', anonimo]])

// ── El almacén de mentira ──
const cubos = { 'avisos-viajeros': new Map(), 'fotos-de-viajeros': new Map() }
const adminSupabase = crearAdminDePrueba(bd, fichas)
adminSupabase.storage = {
  from: (b) => ({
    createSignedUploadUrl: async (ruta) => ({ data: { signedUrl: `https://subida.test/${b}/${ruta}?token=x`, path: ruta, token: 'x' }, error: null }),
    createSignedUrls: async (rutas) => ({ data: rutas.map((p) => ({ path: p, signedUrl: cubos[b].has(p) ? `https://firmada.test/${b}/${p}?t=1` : null, error: null })) }),
    download: async (r) => (cubos[b].has(r) ? { data: new Blob([cubos[b].get(r)], { type: 'image/jpeg' }), error: null } : { data: null, error: { message: 'no existe' } }),
    upload: async (r, c) => {
      cubos[b].set(r, c)
      return { data: { path: r }, error: null }
    },
    getPublicUrl: (r) => ({ data: { publicUrl: `https://publico.test/${b}/${r}` } }),
    list: async (carpeta, o) => ({ data: [...cubos[b].keys()].filter((k) => k.startsWith(`${carpeta}/`)).map((k) => k.slice(carpeta.length + 1)).filter((n) => !o?.search || n.includes(o.search)).map((name) => ({ id: name, name })), error: null }),
  }),
}
const subirFalso = (carpeta) => {
  const ruta = `${carpeta}/${randomUUID()}`
  cubos['avisos-viajeros'].set(ruta, Buffer.from('imagen'))
  return ruta
}

// ── El servidor (express en un puerto aleatorio) ──
let reloj = 1_000_000_000_000
const consola = { log() {}, error() {} }
const montar = (admin) => {
  const app = express()
  app.use(express.json())
  registrarRutasAvisosViajeros(app, { admin, env: { LOGROS_ADMIN_EMAILS: 'admin@x.es' }, consola, ahora: () => reloj })
  return new Promise((ok) => {
    const s = app.listen(0, '127.0.0.1', () => ok({ s, base: `http://127.0.0.1:${s.address().port}` }))
  })
}
const { s: servidorHttp, base } = await montar(adminSupabase)
let ua = 0
/** Una petición. Cada una sale con un «dispositivo» distinto (user-agent) salvo que se diga: así el freno por persona no estorba. */
const pide = async (metodo, ruta, { cuerpo, token, dispositivo } = {}) => {
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', 'user-agent': dispositivo ?? `movil-${++ua}`, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  let json = null
  try {
    json = await r.json()
  } catch {
    json = null
  }
  return { estado: r.status, json }
}
const comun = { destino: 'Roma', pantalla: 'DIAS', pestana: 'dias', version: 'abc1234', dispositivo: 'iPhone', navegador: 'Safari', hora: '2026-11-19T10:00:00.000Z' }
const envia = (tipo, datos, extra = {}, opciones = {}) => pide('POST', '/api/avisos-viajeros', { cuerpo: { ...comun, tipo, datos, ...extra }, ...opciones })
const fila = async (id) => (await S('select * from public.avisos_de_viajeros where id = $1', [id]))[0]
const campana = (uid) => S("select tipo, payload from public.avisos where user_id = $1 and tipo = 'gracias_viajero' order by creado_en", [uid])

// 1. Los 8 tipos se validan y se guardan
console.log('1. Los 8 tipos')
const BUENOS = {
  restaurante: { nombre: 'Da Enzo', precio: '€€', bueno: 'La carbonara' },
  lugar: { nombre: 'Villa Torlonia', porque: 'Es preciosa' },
  destino: { destino: 'Lisboa', cuando: 'este_ano', mas: 'en mayo' },
  dato_mal: { sitio: 'Coliseo', sitio_id: 'coliseo', falla: 'horario', mas: 'cierra antes' },
  consejo: { sitio: 'Pantheon', consejo: 'Ve a primera hora' },
  no_funciona: { que: 'El mapa no carga' },
  idea: { texto: 'Un modo oscuro' },
}
const ids = {}
for (const [tipo, datos] of Object.entries(BUENOS)) {
  const r = await envia(tipo, datos)
  debe(r.estado === 200 && r.json?.ok === true && r.json?.guardado === true && typeof r.json?.id === 'string', `${tipo}: se guarda (${r.estado})`)
  const f = r.json?.id ? await fila(r.json.id) : null
  debe(f?.tipo === tipo && f?.estado === 'nuevo' && f?.destino === 'Roma' && f?.pantalla === 'DIAS' && f?.version_app === 'abc1234', `${tipo}: la fila lleva tipo, estado nuevo, destino, pantalla y versión`)
  debe(f?.user_id === null, `${tipo}: sin cuenta no se guarda user_id`)
  ids[tipo] = r.json?.id
}
const rutaFoto = subirFalso('foto')
const rFoto = await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.', acepta: true }, { fotos: [rutaFoto] })
debe(rFoto.estado === 200 && rFoto.json?.guardado === true, 'foto: se guarda con su foto')
ids.foto = rFoto.json?.id
debe((await fila(ids.foto))?.fotos?.[0] === rutaFoto, 'foto: la ruta de la foto queda en la fila')
const f1 = await fila(ids.restaurante)
debe(f1.datos.precio === '€€' && f1.datos.nombre === 'Da Enzo' && f1.hora_cliente && new Date(f1.hora_cliente).toISOString() === '2026-11-19T10:00:00.000Z', 'los datos y la hora del cliente se guardan')

// 2. Lo que se rechaza
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('2. Validación')
const malos = [
  ['restaurante sin nombre', 'restaurante', { precio: '€' }],
  ['restaurante con nombre de 1 letra', 'restaurante', { nombre: 'A' }],
  ['lugar sin nombre', 'lugar', {}],
  ['dato_mal sin sitio', 'dato_mal', { falla: 'horario' }],
  ['dato_mal con falla desconocida', 'dato_mal', { sitio: 'Coliseo', falla: 'inventada' }],
  ['consejo sin consejo', 'consejo', { sitio: 'Pantheon' }],
  ['no_funciona vacío', 'no_funciona', { que: ' ' }],
  ['idea vacía', 'idea', { texto: '' }],
  ['destino sin destino', 'destino', { cuando: 'algun_dia' }],
  ['tipo inventado', 'chiste', { texto: 'hola' }],
]
for (const [nombre, tipo, datos] of malos) debe((await envia(tipo, datos)).estado === 400, `se rechaza: ${nombre}`)
const sinCasilla = await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.', acepta: false }, { fotos: [subirFalso('foto')] })
debe(sinCasilla.estado === 400, 'foto sin la casilla (acepta) se rechaza')
const sinCasilla2 = await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.' }, { fotos: [subirFalso('foto')] })
debe(sinCasilla2.estado === 400, 'foto sin el campo acepta se rechaza')
debe((await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.', acepta: true })).estado === 400, 'foto sin ninguna foto se rechaza')
debe((await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.', acepta: true }, { fotos: [1, 2, 3, 4].map(() => subirFalso('foto')) })).estado === 400, 'más de 3 fotos se rechaza')
debe((await envia('foto', { sitio: 'Coliseo', nombre_en_foto: 'Ana P.', acepta: true }, { fotos: ['../otro/archivo'] })).estado === 400, 'una ruta que no es del almacén se rechaza')
debe((await envia('idea', { texto: 'hola' }, { captura: 'foto/xxxxxxxx-xxxx' })).estado === 400, 'una captura con otra carpeta se rechaza')
debe(normalizarAviso(null).error && normalizarAviso({}).error, 'un cuerpo vacío se rechaza')
const antes = (await una('select count(*)::int as n from public.avisos_de_viajeros')).n
const sucio = await envia('idea', { texto: 'Escribidme a juan@correo.com con la clave sb_secret_abcdefgh12345 por favor' })
const fSucio = await fila(sucio.json.id)
debe(!/juan@correo\.com|sb_secret_abcdefgh12345/.test(JSON.stringify(fSucio)) && /<correo>/.test(fSucio.datos.texto), 'se tachan correos y claves')
const larga = await envia('idea', { texto: 'x'.repeat(5000) })
debe((await fila(larga.json.id)).datos.texto.length <= 1000, 'los textos se recortan')
const conErrores = await envia('no_funciona', { que: 'Falla' }, { errores: ['Error uno de juan@correo.com', 'dos'], punto: { lat: 41.9, lng: 12.5, direccion: 'Via X' }, trip_id: randomUUID(), parada: 'coliseo', dia: '2' })
const fE = await fila(conErrores.json.id)
debe(Array.isArray(fE.errores) && fE.errores.length === 2 && !/juan@correo/.test(JSON.stringify(fE.errores)) && fE.punto?.lat === 41.9 && /^[0-9a-f-]{36}$/.test(fE.trip_id), 'errores limpios, punto y trip_id (un UUID real, sin tachar) se guardan')
debe(antes >= 1, 'hay filas')

// 3. Quién queda guardado
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('3. Privacidad: user_id solo con cuenta de verdad y avisame')
const conAnon = await envia('idea', { texto: 'Desde una sesión anónima' }, { avisame: true }, { token: 'T-anon' })
debe((await fila(conAnon.json.id)).user_id === null, 'sesión anónima con avisame: no se guarda user_id')
const sinCuentaAvisame = await envia('idea', { texto: 'Sin cuenta pero con avisame' }, { avisame: true })
debe((await fila(sinCuentaAvisame.json.id)).user_id === null, 'sin cuenta con avisame: no se guarda user_id')
const cuentaNo = await envia('idea', { texto: 'Con cuenta pero sin avisame' }, { avisame: false }, { token: 'T-bea' })
debe((await fila(cuentaNo.json.id)).user_id === null, 'con cuenta y avisame=false: no se guarda user_id')
const cuentaSi = await envia('idea', { texto: 'Con cuenta y avisame' }, { avisame: true }, { token: 'T-ana' })
debe((await fila(cuentaSi.json.id)).user_id === ana, 'con cuenta y avisame=true: SÍ se guarda user_id')
const tokenMalo = await envia('idea', { texto: 'Con un token que no vale' }, { avisame: true }, { token: 'T-no-existe' })
debe(tokenMalo.estado === 200 && (await fila(tokenMalo.json.id)).user_id === null, 'un token que no vale se trata como sin cuenta (200, sin user_id)')
const todo = JSON.stringify(await S('select * from public.avisos_de_viajeros where user_id is null'))
debe(!/127\.0\.0\.1|::1|::ffff|movil-\d/.test(todo), 'en las filas sin cuenta no hay IP ni huella ni dispositivo del freno')

// 4. [Hecho] avisa solo a quien pidió avisame, una vez
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('4. Estados y avisos a la campana')
const ruta = (id) => `/api/admin/avisos-viajeros/${id}`
const hechoAna = await pide('PATCH', ruta(cuentaSi.json.id), { cuerpo: { estado: 'hecho' }, token: 'T-admin' })
debe(hechoAna.estado === 200 && hechoAna.json?.ok === true && hechoAna.json?.avisado === true, 'hecho con cuenta+avisame: avisado')
const camAna = await campana(ana)
debe(camAna.length === 1 && camAna[0].payload.texto === 'Gracias por tu idea: ya la hemos mirado.', 'la campana de Ana: aviso gracias_viajero con el texto de la idea')
const fAna = await fila(cuentaSi.json.id)
debe(fAna.estado === 'hecho' && fAna.avisado_en && fAna.aviso_texto && fAna.revisado_en, 'la fila queda hecha, con avisado_en, aviso_texto y revisado_en')
const otraVez = await pide('PATCH', ruta(cuentaSi.json.id), { cuerpo: { estado: 'hecho' }, token: 'T-admin' })
debe(otraVez.json?.avisado === false && (await campana(ana)).length === 1, 'hecho otra vez: no avisa dos veces')
const hechoBea = await pide('PATCH', ruta(cuentaNo.json.id), { cuerpo: { estado: 'hecho' }, token: 'T-admin' })
debe(hechoBea.json?.avisado === false && (await campana(bea)).length === 0, 'hecho sin avisame: no avisa a nadie')
const hechoAnon = await pide('PATCH', ruta(conAnon.json.id), { cuerpo: { estado: 'hecho' }, token: 'T-admin' })
debe(hechoAnon.json?.avisado === false, 'hecho de alguien sin cuenta: no avisa')
const visto = await pide('PATCH', ruta(ids.lugar), { cuerpo: { estado: 'visto' }, token: 'T-admin' })
debe(visto.json?.avisado === false && (await fila(ids.lugar)).estado === 'visto', 'visto: cambia el estado y no avisa')
const descartado = await pide('PATCH', ruta(ids.consejo), { cuerpo: { estado: 'descartado' }, token: 'T-admin' })
debe(descartado.json?.avisado === false && (await fila(ids.consejo)).estado === 'descartado', 'descartado: cambia el estado y no avisa')
debe((await pide('PATCH', ruta(ids.idea), { cuerpo: { estado: 'nuevo' }, token: 'T-admin' })).estado === 400, 'un estado que no vale: 400')
debe((await pide('PATCH', ruta(randomUUID()), { cuerpo: { estado: 'hecho' }, token: 'T-admin' })).estado === 404, 'un aviso que no existe: 404')
debe((await pide('PATCH', '/api/admin/avisos-viajeros/no-es-un-id', { cuerpo: { estado: 'hecho' }, token: 'T-admin' })).estado === 400, 'un id que no es un id: 400')
// Textos por defecto de cada tipo y texto propio
const conTipo = async (tipo, datos, extra = {}) => {
  const r = await envia(tipo, datos, { avisame: true, ...extra }, { token: 'T-carlos' })
  const h = await pide('PATCH', ruta(r.json.id), { cuerpo: { estado: 'hecho', ...(extra.texto_admin ? { texto: extra.texto_admin } : {}) }, token: 'T-admin' })
  return { h, texto: (await fila(r.json.id)).aviso_texto }
}
const t1 = await conTipo('dato_mal', BUENOS.dato_mal)
debe(t1.texto === 'Gracias a ti, ya está arreglado: Coliseo.', `dato_mal: texto por defecto (${t1.texto})`)
const t2 = await conTipo('restaurante', BUENOS.restaurante)
debe(t2.texto === 'Hemos añadido Da Enzo. ¡Gracias!', `restaurante: texto por defecto (${t2.texto})`)
const t3 = await conTipo('no_funciona', BUENOS.no_funciona)
debe(t3.texto === 'Gracias a ti, ya está arreglado: El mapa no carga.', `no_funciona: texto por defecto (${t3.texto})`)
const t4 = await conTipo('consejo', BUENOS.consejo)
debe(t4.texto === 'Gracias a ti, ya está arreglado: Pantheon.', `consejo: texto por defecto (${t4.texto})`)
const t5 = await conTipo('lugar', BUENOS.lugar)
debe(t5.texto === 'Hemos añadido Villa Torlonia. ¡Gracias!', `lugar: texto por defecto (${t5.texto})`)
const t6 = await conTipo('idea', BUENOS.idea, { texto_admin: 'Qué buena idea, ¡ya la tenemos!' })
debe(t6.texto === 'Qué buena idea, ¡ya la tenemos!', 'el texto del administrador manda sobre el de por defecto')
debe((await campana(carlos)).length === 6, 'Carlos tiene sus 6 avisos en la campana')

// 5. «Ya está» de un destino
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('5. Destinos pedidos')
await envia('destino', { destino: 'Lisboa', cuando: 'este_ano' }, { avisame: true }, { token: 'T-ana' })
await envia('destino', { destino: '  LISBOA ', cuando: 'algun_dia' }, { avisame: true }, { token: 'T-carlos' })
await envia('destino', { destino: 'lisboa', cuando: 'algun_dia' }, { avisame: false }, { token: 'T-bea' })
await envia('destino', { destino: 'Lisboa', cuando: 'algun_dia' }, { avisame: true }) // sin cuenta
await envia('destino', { destino: 'Oporto', cuando: 'este_ano' }, { avisame: true }, { token: 'T-ana' })
await envia('destino', { destino: 'Málaga', cuando: 'este_ano' }, { avisame: true }, { token: 'T-bea' })
await envia('destino', { destino: 'Malaga', cuando: 'este_ano' }, { avisame: true }, { token: 'T-carlos' })
const dest = await pide('GET', '/api/admin/avisos-viajeros/destinos', { token: 'T-admin' })
const lisboa = (dest.json ?? []).find((d) => /lisboa/i.test(d.destino))
const malaga = (dest.json ?? []).find((d) => /m[aá]laga/i.test(d.destino))
debe(Array.isArray(dest.json) && lisboa?.cuantos === 5 && lisboa?.avisables === 2 && lisboa?.primero && lisboa?.ultimo, `destinos: Lisboa junta mayúsculas y espacios (cuantos ${lisboa?.cuantos}, avisables ${lisboa?.avisables})`)
debe(malaga?.cuantos === 2 && malaga?.avisables === 2, 'destinos: Málaga y Malaga (sin tilde) se agrupan')
const camAnaAntes = (await campana(ana)).length
const camCarlosAntes = (await campana(carlos)).length
const camBeaAntes = (await campana(bea)).length
const ya = await pide('POST', '/api/admin/avisos-viajeros/destinos/ya-esta', { cuerpo: { destino: 'Lisboa' }, token: 'T-admin' })
debe(ya.estado === 200 && ya.json?.ok === true && ya.json?.avisados === 2, `ya-esta Lisboa: avisa a las 2 personas con avisame (${ya.json?.avisados})`)
const camAna2 = await campana(ana)
debe(camAna2.length === camAnaAntes + 1 && camAna2[camAna2.length - 1].payload.texto === '¡Lisboa ya está en JUTRIP! Tú lo pediste.', 'Ana recibe «¡Lisboa ya está en JUTRIP! Tú lo pediste.»')
debe((await campana(carlos)).length === camCarlosAntes + 1, 'Carlos también')
debe((await campana(bea)).length === camBeaAntes, 'Bea (sin avisame) no recibe nada')
debe((await S("select count(*)::int as n from public.avisos_de_viajeros where tipo = 'destino' and datos->>'destino' ilike '%lisboa%' and estado = 'hecho'"))[0].n === 5, 'los 5 avisos de Lisboa quedan hechos')
debe((await S("select count(*)::int as n from public.avisos_de_viajeros where tipo = 'destino' and datos->>'destino' = 'Oporto' and estado = 'nuevo'"))[0].n === 1, 'Oporto sigue nuevo (solo se tocó Lisboa)')
const ya2 = await pide('POST', '/api/admin/avisos-viajeros/destinos/ya-esta', { cuerpo: { destino: 'lisboa' }, token: 'T-admin' })
debe(ya2.json?.avisados === 0 && (await campana(ana)).length === camAna2.length, 'ya-esta otra vez: no duplica')
const ya3 = await pide('POST', '/api/admin/avisos-viajeros/destinos/ya-esta', { cuerpo: { destino: 'Málaga', texto: 'Málaga ya está. ¡Gracias!' }, token: 'T-admin' })
debe(ya3.json?.avisados === 2 && (await campana(bea)).some((a) => a.payload.texto === 'Málaga ya está. ¡Gracias!'), 'ya-esta con texto propio: avisa con ese texto (Málaga y Malaga son lo mismo)')
debe((await pide('POST', '/api/admin/avisos-viajeros/destinos/ya-esta', { cuerpo: {}, token: 'T-admin' })).estado === 400, 'ya-esta sin destino: 400')

// 6. Fotos, capturas y subida
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('6. Subida y fotos')
const sub = await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 2, clase: 'foto' } })
debe(sub.estado === 200 && sub.json?.ok && sub.json.subidas?.length === 2 && sub.json.subidas.every((x) => /^foto\/[0-9a-f-]{36}$/.test(x.ruta) && /^https:\/\/subida\.test\//.test(x.url)), 'subida: 2 direcciones firmadas en la carpeta foto')
const subC = await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 1, clase: 'captura' } })
debe(/^captura\//.test(subC.json?.subidas?.[0]?.ruta ?? ''), 'subida de captura: carpeta captura')
const subE = await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 1, clase: 'foto_entera' } })
debe(/^entera\//.test(subE.json?.subidas?.[0]?.ruta ?? ''), 'subida de foto entera: carpeta entera')
debe((await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 4, clase: 'foto' } })).estado === 400, 'subida: más de 3 se rechaza')
debe((await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 0, clase: 'foto' } })).estado === 400, 'subida: 0 se rechaza')
debe((await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 1, clase: 'video' } })).estado === 400, 'subida: clase que no existe se rechaza')
const capturaReal = subirFalso('captura')
const conCaptura = await envia('no_funciona', { que: 'Falla con captura' }, { captura: capturaReal })
debe((await fila(conCaptura.json.id)).captura === capturaReal, 'la captura que existe se guarda')
const capturaFalsa = `captura/${randomUUID()}`
const sinCaptura = await envia('no_funciona', { que: 'Falla con captura inventada' }, { captura: capturaFalsa })
debe(sinCaptura.estado === 200 && (await fila(sinCaptura.json.id)).captura === null, 'una captura que no existe se descarta (el aviso se guarda sin ella)')

// Panel: lista con direcciones firmadas
const lista = await pide('GET', '/api/admin/avisos-viajeros?limite=500', { token: 'T-admin' })
debe(lista.estado === 200 && lista.json?.ok && Array.isArray(lista.json.items) && lista.json.items.length > 10, 'el panel lista los avisos')
const itFoto = lista.json.items.find((i) => i.id === ids.foto)
debe(itFoto?.fotos_urls?.length === 1 && /^https:\/\/firmada\.test\//.test(itFoto.fotos_urls[0]), 'la lista trae la dirección firmada de la foto')
const itCaptura = lista.json.items.find((i) => i.id === conCaptura.json.id)
debe(/^https:\/\/firmada\.test\//.test(itCaptura?.captura_url ?? ''), 'la lista trae la dirección firmada de la captura')
debe(lista.json.items.every((i) => !('user_id' in i)), 'la lista no enseña el user_id (solo con_cuenta)')
const creados = lista.json.items.map((i) => i.creado)
debe(creados.every((c, k) => k === 0 || new Date(creados[k - 1]) >= new Date(c)), 'lo más nuevo arriba')
const nuevosReales = (await una("select count(*)::int as n from public.avisos_de_viajeros where estado = 'nuevo'")).n
debe(lista.json.nuevos === nuevosReales && nuevosReales > 0, `«nuevos» cuenta los de estado nuevo (${lista.json.nuevos})`)
const soloIdeas = await pide('GET', '/api/admin/avisos-viajeros?tipo=idea', { token: 'T-admin' })
debe(soloIdeas.json.items.length > 0 && soloIdeas.json.items.every((i) => i.tipo === 'idea'), 'filtro por tipo')
const soloLisboa = await pide('GET', '/api/admin/avisos-viajeros?tipo=destino&destino=lisboa', { token: 'T-admin' })
debe(soloLisboa.json.items.length === 5, `filtro por destino (${soloLisboa.json.items.length})`)
const soloHechos = await pide('GET', '/api/admin/avisos-viajeros?estado=hecho', { token: 'T-admin' })
debe(soloHechos.json.items.length > 0 && soloHechos.json.items.every((i) => i.estado === 'hecho'), 'filtro por estado')
const limite2 = await pide('GET', '/api/admin/avisos-viajeros?limite=2', { token: 'T-admin' })
debe(limite2.json.items.length === 2, 'límite')

// Usar la foto
reloj += 61_000
const fotoCuenta = subirFalso('foto')
const foto2 = await envia('foto', { sitio: 'Fontana', nombre_en_foto: 'Beatriz R.', acepta: true }, { fotos: [fotoCuenta], avisame: true }, { token: 'T-bea' })
const camBea0 = (await campana(bea)).length
const noEsFoto = await pide('POST', `${ruta(ids.idea)}/usar-foto`, { cuerpo: { sitio: 'X', destino: 'Roma' }, token: 'T-admin' })
debe(noEsFoto.estado === 400, 'usar-foto de algo que no es foto: 400')
debe((await pide('POST', `${ruta(foto2.json.id)}/usar-foto`, { cuerpo: { sitio: 'Fontana de Trevi' }, token: 'T-admin' })).estado === 400, 'usar-foto sin destino: 400')
const usada = await pide('POST', `${ruta(foto2.json.id)}/usar-foto`, { cuerpo: { sitio: 'Fontana de Trevi', destino: 'Roma' }, token: 'T-admin' })
debe(usada.estado === 200 && usada.json?.ok && /^https:\/\/publico\.test\/fotos-de-viajeros\/roma\/fontana-de-trevi-/.test(usada.json.url_publica ?? '') && usada.json.avisado === true, `usar-foto: copia al almacén público y avisa (${usada.json?.url_publica})`)
const fU = await fila(foto2.json.id)
debe(fU.estado === 'usada' && fU.foto_aprobada?.sitio === 'Fontana de Trevi' && fU.foto_aprobada?.destino === 'Roma' && fU.foto_aprobada?.credito_texto === 'Foto: Beatriz R.' && fU.foto_aprobada?.url_publica === usada.json.url_publica, 'la fila queda usada con foto_aprobada {sitio, destino, url_publica, credito_texto}')
debe(cubos['fotos-de-viajeros'].size === 1, 'la foto está copiada en el almacén público')
const camBea1 = await campana(bea)
debe(camBea1.length === camBea0 + 1 && camBea1[camBea1.length - 1].payload.texto === 'Tu foto ya está en la app. ¡Gracias!', 'Beatriz recibe «Tu foto ya está en la app. ¡Gracias!»')
const usada2 = await pide('POST', `${ruta(foto2.json.id)}/usar-foto`, { cuerpo: { sitio: 'Fontana de Trevi', destino: 'Roma', credito: 'Foto: Bea' }, token: 'T-admin' })
debe(usada2.json?.avisado === false && (await campana(bea)).length === camBea1.length, 'usar-foto otra vez: no avisa dos veces')
debe((await fila(foto2.json.id)).foto_aprobada.credito_texto === 'Foto: Bea', 'el crédito del cuerpo manda')
const pub = await pide('GET', '/api/fotos-de-viajeros?destino=ROMA')
debe(pub.estado === 200 && Array.isArray(pub.json) && pub.json.length === 1 && pub.json[0].sitio === 'Fontana de Trevi' && /publico\.test/.test(pub.json[0].url) && pub.json[0].credito_texto === 'Foto: Bea', 'GET público de fotos de viajeros (sin sesión)')
debe((await pide('GET', '/api/fotos-de-viajeros?destino=lisboa')).json.length === 0, 'y por destino: Lisboa no tiene')
debe(!/user_id|avisame|nombre_en_foto/.test(JSON.stringify(pub.json)), 'el GET público no enseña nada de la persona')

// 7. El freno
reloj += 61_000 // (otro minuto: el freno total no estorba)
console.log('7. Freno')
reloj += 3 * 3600_000
const mismoDisp = 'telefono-pesado'
const cod = []
for (let k = 0; k < 12; k++) cod.push((await envia('idea', { texto: `Idea numero ${k} distinta` }, {}, { dispositivo: mismoDisp })).estado)
debe(cod.slice(0, 10).every((c) => c === 200) && cod[10] === 429 && cod[11] === 429, `10 por hora y por dispositivo; el 11 se corta (${cod.join(',')})`)
reloj += 3600_000 + 1000
debe((await envia('idea', { texto: 'Pasada la hora, otra vez' }, {}, { dispositivo: mismoDisp })).estado === 200, 'pasada la hora, vuelve a dejar')
reloj += 3 * 3600_000
const iguales = []
for (let k = 0; k < 7; k++) iguales.push((await envia('idea', { texto: 'Lo mismo siempre' })).estado)
debe(iguales.slice(0, 5).every((c) => c === 200) && iguales[5] === 429, `5 por minuto del mismo tipo y texto; el 6 se corta (${iguales.join(',')})`)
reloj += 61_000
debe((await envia('idea', { texto: 'Lo mismo siempre' })).estado === 200, 'pasado el minuto, el mismo texto vuelve a pasar')
reloj += 3 * 3600_000
const total = []
for (let k = 0; k < 33; k++) total.push((await envia('idea', { texto: `Texto de la ronda ${k}` })).estado)
debe(total.slice(0, 30).every((c) => c === 200) && total[30] === 429, `30 por minuto en total; el 31 se corta (${total.slice(28).join(',')})`)
reloj += 3 * 3600_000
const porCuenta = []
for (let k = 0; k < 11; k++) porCuenta.push((await envia('idea', { texto: `Mensaje de cuenta ${k} diferente` }, {}, { token: 'T-carlos' })).estado)
debe(porCuenta.slice(0, 10).every((c) => c === 200) && porCuenta[10] === 429, `10 por hora y por cuenta aunque cambie de dispositivo (${porCuenta.join(',')})`)
reloj += 3 * 3600_000
const subs = []
for (let k = 0; k < 8; k++) subs.push((await pide('POST', '/api/avisos/subida', { cuerpo: { cuantas: 1, clase: 'foto' }, dispositivo: 'subidor' })).estado)
debe(subs.slice(0, 5).every((c) => c === 200) && subs[5] === 429, `la subida también se frena (${subs.join(',')})`)
reloj += 3 * 3600_000

// 8. Solo el administrador
console.log('8. Permisos')
const unaFila = ids.idea
const rutasAdmin = [
  ['GET', '/api/admin/avisos-viajeros', undefined],
  ['PATCH', ruta(unaFila), { estado: 'hecho' }],
  ['GET', '/api/admin/avisos-viajeros/destinos', undefined],
  ['POST', '/api/admin/avisos-viajeros/destinos/ya-esta', { destino: 'Lisboa' }],
  ['POST', `${ruta(foto2.json.id)}/usar-foto`, { sitio: 'X', destino: 'Roma' }],
]
for (const [m, r, c] of rutasAdmin) {
  const normal = await pide(m, r, { cuerpo: c, token: 'T-ana' })
  const anon = await pide(m, r, { cuerpo: c, token: 'T-anon' })
  const nadie = await pide(m, r, { cuerpo: c })
  debe(normal.estado === 403, `${m} ${r.replace(/[0-9a-f-]{36}/, ':id')}: una cuenta que no es administradora recibe 403 (${normal.estado})`)
  debe(anon.estado === 403, `${m} ${r.replace(/[0-9a-f-]{36}/, ':id')}: una sesión anónima recibe 403 (${anon.estado})`)
  debe(nadie.estado === 401, `${m} ${r.replace(/[0-9a-f-]{36}/, ':id')}: sin sesión, 401 (${nadie.estado})`)
}
debe((await fila(unaFila)).estado === 'nuevo', 'y el aviso no cambió con los intentos de quien no es administrador')

// 9. Empezar de cero
console.log('9. Empezar de cero')
const deAna = (await una('select count(*)::int as n from public.avisos_de_viajeros where user_id = $1'.replace('$1', `'${ana}'`))).n
const deCarlos = (await una(`select count(*)::int as n from public.avisos_de_viajeros where user_id = '${carlos}'`)).n
const sinCuenta = (await una('select count(*)::int as n from public.avisos_de_viajeros where user_id is null')).n
debe(deAna > 0 && deCarlos > 0, `Ana (${deAna}) y Carlos (${deCarlos}) tienen avisos guardados antes`)
const r0 = await S('select public.empezar_de_cero($1) as r', [ana])
debe((await una(`select count(*)::int as n from public.avisos_de_viajeros where user_id = '${ana}'`)).n === 0, 'empezar de cero borra los avisos de Ana')
debe((await una(`select count(*)::int as n from public.avisos_de_viajeros where user_id = '${carlos}'`)).n === deCarlos, 'y no toca los de Carlos')
debe((await una('select count(*)::int as n from public.avisos_de_viajeros where user_id is null')).n === sinCuenta, 'ni los que no tienen cuenta')
debe(r0[0].r?.borrados?.avisos_de_viajeros === deAna, `y lo cuenta en su resultado (borrados.avisos_de_viajeros = ${r0[0].r?.borrados?.avisos_de_viajeros})`)
// Borrar la cuenta también se lo lleva (on delete cascade)
await q('delete from auth.users where id = $1', [carlos])
debe((await una(`select count(*)::int as n from public.avisos_de_viajeros where user_id = '${carlos}'`)).n === 0, 'borrar la cuenta se lleva sus avisos (cascada)')

// 10. RLS: el móvil con la clave pública no ve nada
console.log('10. Base de datos cerrada')
const comoAna = async (sql) => {
  await bd.db.exec('reset role')
  await bd.db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: bea, role: 'authenticated' })])
  await bd.db.exec('set role authenticated')
  try {
    return (await bd.db.query(sql)).rows
  } catch (e) {
    return { error: e.message }
  } finally {
    await bd.db.exec('reset role')
  }
}
const leido = await comoAna('select * from public.avisos_de_viajeros')
debe(Array.isArray(leido) && leido.length === 0, 'con RLS y sin políticas, una cuenta normal no ve ninguna fila')
const escrito = await comoAna("insert into public.avisos_de_viajeros (tipo, datos) values ('idea', '{}')")
debe(!Array.isArray(escrito) && escrito.error, 'ni puede escribir')
const llamada = await comoAna("select public.avisos_viajeros_destinos()")
debe(!Array.isArray(llamada) && llamada.error, 'ni llamar a las funciones del servidor')

// 11. Sin clave de servicio (local)
console.log('11. Sin clave de servicio')
await new Promise((ok) => servidorHttp.close(ok))
const sin = await montar(null)
const r1 = await fetch(`${sin.base}/api/avisos/subida`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cuantas: 1, clase: 'foto' }) })
const j1 = await r1.json()
debe(r1.status === 200 && j1.ok === true && Array.isArray(j1.subidas) && j1.subidas.length === 0 && j1.sin_almacen === true, 'subida sin clave de servicio: {ok, subidas:[], sin_almacen:true}')
const r2 = await fetch(`${sin.base}/api/avisos-viajeros`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...comun, tipo: 'idea', datos: { texto: 'Hola local' } }) })
const j2 = await r2.json()
debe(r2.status === 200 && j2.ok === true && j2.guardado === false, 'aviso sin clave de servicio: ok y guardado false (no falla)')
const r3 = await fetch(`${sin.base}/api/fotos-de-viajeros?destino=roma`)
debe(r3.status === 200 && (await r3.json()).length === 0, 'fotos públicas sin clave de servicio: lista vacía')
const r4 = await fetch(`${sin.base}/api/admin/avisos-viajeros`)
debe(r4.status === 503, 'admin sin clave de servicio: 503')
await new Promise((ok) => sin.s.close(ok))
await bd.db.close()

console.log(`\nLa prueba del servidor de la V20: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO', f)
process.exit(fallos.length ? 1 : 0)
