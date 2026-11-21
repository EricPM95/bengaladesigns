// Un trocito de `admin.from(...)` de Supabase sobre PGlite (solo para las pruebas del servidor del panel): select (con eq/neq/in/like/order/limit/range/maybeSingle), insert, upsert, update y delete.
// No es Supabase: solo lo que el panel necesita. Ninguna clave, ninguna red.
export function conFrom(admin, bd) {
  const from = (tabla) => {
    if (!/^[a-z_]+$/.test(tabla)) throw new Error('tabla rara')
    const filtros = []
    const ordenes = []
    let tope = null
    let cuenta = false
    let cambios = null
    let accion = 'select'
    let columnas = '*'
    let filas = null
    let conflicto = null
    const SQL = (f) => Object.keys(f).map((k) => `"${k}"`).join(', ')
    const construir = {
      select: (cols, o) => ((columnas = cols ?? '*'), o?.head && o?.count ? ((cuenta = true), construir) : construir),
      update: (c) => ((accion = 'update'), (cambios = c), construir),
      insert: (f) => ((accion = 'insert'), (filas = Array.isArray(f) ? f : [f]), construir),
      upsert: (f, o) => ((accion = 'upsert'), (filas = Array.isArray(f) ? f : [f]), (conflicto = o?.onConflict ?? null), construir),
      delete: () => ((accion = 'delete'), construir),
      eq: (k, v) => (filtros.push((f) => f[k] === v), construir),
      neq: (k, v) => (filtros.push((f) => f[k] !== v), construir),
      in: (k, vs) => (filtros.push((f) => vs.includes(f[k])), construir),
      like: (k, pat) => (filtros.push((f) => String(f[k] ?? '').startsWith(String(pat).replace(/%$/, ''))), construir),
      order: (k, o) => (ordenes.push([k, o?.ascending !== false]), construir),
      limit: (n) => ((tope = n), construir),
      range: (d, h) => ((tope = h + 1), construir),
      maybeSingle: async () => ({ data: (await construir.then((r) => r)).data?.[0] ?? null, error: null }),
      then: async (ok, no) => {
        try {
          if (accion === 'insert' || accion === 'upsert') {
            for (const f of filas) {
              const claves = Object.keys(f)
              const marcas = claves.map((_, i) => `$${i + 1}`).join(', ')
              const alChocar = accion === 'upsert' ? ` on conflict (${conflicto ?? claves[0]}) do nothing` : ''
              await bd.q(`insert into public.${tabla} (${SQL(f)}) values (${marcas})${alChocar}`, Object.values(f))
            }
            return ok({ data: null, error: null })
          }
          // Como Supabase: pedir una columna que no existe da error (así se prueba la base SIN la migración 0091).
          if (accion === 'select' && columnas !== '*') {
            const hay = new Set((await bd.q(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`, [tabla])).map((x) => x.column_name))
            if (hay.size === 0) return ok({ data: null, error: { message: `relation "${tabla}" does not exist` } })
            const falta = String(columnas).split(',').map((c) => c.trim()).filter((c) => /^[a-z_]+$/.test(c) && !hay.has(c))
            if (falta.length) return ok({ data: null, error: { message: `column ${tabla}.${falta[0]} does not exist` } })
          }
          const todas = (await bd.q(`select * from public.${tabla}`)).filter((f) => filtros.every((x) => x(f)))
          if (accion === 'delete') {
            for (const f of todas) {
              const ck = Object.keys(f)[0]
              await bd.q(`delete from public.${tabla} where "${ck}" = $1`, [f[ck]])
            }
            return ok({ data: null, error: null })
          }
          if (accion === 'update') {
            for (const f of todas) for (const [k, v] of Object.entries(cambios)) await bd.q(`update public.${tabla} set ${k} = $1 where id = $2`, [v, f.id])
            return ok({ data: null, error: null })
          }
          let res = todas
          for (const [k, asc] of [...ordenes].reverse()) res = [...res].sort((x, y) => (String(x[k]) < String(y[k]) ? -1 : String(x[k]) > String(y[k]) ? 1 : 0) * (asc ? 1 : -1))
          if (tope !== null) res = res.slice(0, tope)
          return ok(cuenta ? { count: res.length, data: null, error: null } : { data: res, error: null })
        } catch (e) {
          return no ? no(e) : ok({ data: null, error: { message: e.message } })
        }
      },
    }
    return construir
  }
  // La lista de cuentas (auth.admin.listUsers): una sola página, como el panel la necesita.
  admin.auth.admin.listUsers = async ({ page = 1 } = {}) => {
    if (page > 1) return { data: { users: [] }, error: null }
    const filas = await bd.q('select id, email, is_anonymous, created_at, last_sign_in_at from auth.users order by created_at, email')
    return { data: { users: filas.map((u) => ({ id: u.id, email: u.email, is_anonymous: u.is_anonymous, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, app_metadata: { providers: ['email'], provider: 'email' } })) }, error: null }
  }
  return Object.assign(admin, { from })
}
