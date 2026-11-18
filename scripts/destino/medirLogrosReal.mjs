// V12: cuánto tarda en abrir Logros con la cuenta de Eric en producción. SOLO LEE (GET). Lo corre Eric (necesita su sesión; yo no la tengo ni toco producción).
//   1) En la app de producción, con la sesión iniciada, abre la consola del navegador y pega:  (await (await import('/src/lib/supabaseClient.ts')).supabase.auth.getSession()).data.session.access_token
//      (o copia el «access_token» de Application → Local Storage → sb-…-auth-token).
//   2) En el PC:  JUTRIP_API=https://TU-DOMINIO JUTRIP_TOKEN=el_token node scripts/destino/medirLogrosReal.mjs
// Mide 5 veces cada petición de lectura y enseña el mínimo, la mediana y el máximo en milisegundos. No escribe nada. No guardes el token en ningún archivo.
const API = process.env.JUTRIP_API
const TOKEN = process.env.JUTRIP_TOKEN
if (!API || !TOKEN) {
  console.error('Faltan JUTRIP_API y JUTRIP_TOKEN (mira las instrucciones de arriba).')
  process.exit(2)
}
const RUTAS = ['/api/logros/perfil', '/api/logros/estado', '/api/logros/pasaporte2', '/api/logros/ganados']
const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
for (const ruta of RUTAS) {
  const t = []
  let estado = 0
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now()
    const r = await fetch(API + ruta, { headers: { Authorization: `Bearer ${TOKEN}` } })
    await r.text()
    estado = r.status
    t.push(Math.round(performance.now() - t0))
  }
  console.log(`${ruta}  (${estado})  mín ${Math.min(...t)} ms · mediana ${mediana(t)} ms · máx ${Math.max(...t)} ms`)
}
