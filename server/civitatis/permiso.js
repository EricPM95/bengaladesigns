/**
 * QUIÉN PUEDE USAR LA API DE CONSULTA CUANDO SOLO ESTÁ ENCENDIDA PARA EL ADMINISTRADOR (`CIVITATIS_API_ACTIVA=admin`).
 * Lo decide el servidor por petición, con el MISMO mecanismo que el resto de cosas de admin (Tanda 10J, «Empezar de cero»): el token de Supabase de la cabecera `Authorization: Bearer …`
 * → el usuario (`quienEs`) → ¿está su email en `LOGROS_ADMIN_EMAILS` y no es anónimo? (`esAdmin`). Sin sesión, con sesión anónima, sin la clave de servicio o ante cualquier fallo: NO.
 * `quienEs` y `esAdmin` se pasan de fuera (así las pruebas usan unos de mentira, sin red).
 */
export function crearPermisoAdminCivitatis({ admin, quienEs, esAdmin, tokenDe, env = process.env }) {
  return async function permitida(req) {
    if (!admin) return false
    const token = tokenDe(req)
    if (!token) return false
    const usuario = await quienEs(admin, token)
    return Boolean(usuario) && esAdmin(usuario, env) === true
  }
}
