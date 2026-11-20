// (V35A) La BASE FALSA de la pantalla «Usuarios»: la misma forma que devuelve `server/panel/base.js` (`leerBase`), con gente inventada (nada de nadie). La usan la prueba del servidor y la demo (?logrosDemo=1).
// Hoy = 20 nov 2026. Cuentas con nombre: Eric (pase de Lanzarote Dúo + viaje propio + Roma), Alice (SOLO un viaje compartido al de Eric y el pase compartido), Bruno, Carla, Diana; y 55 de relleno para paginar y llenar el calendario.
export const AHORA = new Date('2026-11-20T10:00:00Z')

const usuario = (id, email, alta, acceso, proveedor) => ({ id, email, alta: `${alta}T09:00:00Z`, ultimo_acceso: acceso ? `${acceso}T08:00:00Z` : null, proveedor })

export function baseFalsa() {
  const usuarios = [
    usuario('u-eric', 'eric@demo.test', '2026-03-12', '2026-11-20', 'google'),
    usuario('u-alice', 'alice@demo.test', '2026-10-14', '2026-11-19', 'correo'),
    usuario('u-bruno', 'bruno@demo.test', '2026-04-02', '2026-11-13', 'google'),
    usuario('u-carla', 'carla@demo.test', '2026-11-10', '2026-11-10', 'correo'),
    usuario('u-diana', 'diana@demo.test', '2026-01-20', '2026-10-01', 'correo'),
  ]
  const travelers = [{ id: 'u-eric', nombre: 'Eric' }, { id: 'u-alice', nombre: 'Alice' }, { id: 'u-bruno', nombre: 'Bruno Prueba' }, { id: 'u-carla', nombre: '' }, { id: 'u-diana', nombre: 'Diana' }]
  const lugar = (name, countryCode) => ({ name, countryCode })
  const trips = [
    { id: 't-lanz', traveler_id: 'u-eric', destino: 'Lanzarote', origen: 'Barcelona', lugar: lugar('Barcelona', 'es'), inicio: '2026-11-18', fin: '2026-11-24' },
    { id: 't-roma-eric', traveler_id: 'u-eric', destino: 'Roma', origen: 'Barcelona', lugar: lugar('Barcelona', 'es'), inicio: '2026-12-05', fin: '2026-12-09' },
    { id: 't-roma-bruno', traveler_id: 'u-bruno', destino: 'roma', origen: 'Ciudad de México', lugar: lugar('Ciudad de México', 'mx'), inicio: '2026-12-01', fin: '2026-12-04' },
    { id: 't-bcn-diana', traveler_id: 'u-diana', destino: 'Barcelona', origen: 'Madrid', lugar: lugar('Madrid', 'es'), inicio: '2026-07-02', fin: '2026-07-05' },
  ]
  const miembros = [{ trip_id: 't-lanz', user_id: 'u-alice', rol: 'miembro', created_at: '2026-11-10T10:00:00Z' }, { trip_id: 't-roma-bruno', user_id: 'u-carla', rol: 'miembro', created_at: '2026-11-11T10:00:00Z' }]
  const pases = [
    { id: 'p-lanz', comprador_id: 'u-eric', para_id: null, destino: 'Lanzarote', tipo: 'duo', estado: 'activo', pago_ref: 'pg-lanz', created_at: '2026-11-19T10:00:00Z', trip_id: 't-lanz' },
    { id: 'p-roma-bruno', comprador_id: 'u-bruno', para_id: null, destino: 'Roma', tipo: 'uno', estado: 'activo', pago_ref: 'pg-bruno', created_at: '2026-11-02T10:00:00Z', trip_id: 't-roma-bruno' },
    { id: 'p-bcn-regalo', comprador_id: 'u-diana', para_id: null, destino: 'Barcelona', tipo: 'uno', estado: 'activo', pago_ref: null, created_at: '2026-06-20T10:00:00Z', trip_id: null },
  ]
  const miembrosPase = [{ pass_id: 'p-lanz', user_id: 'u-alice', unido_en: '2026-11-19T12:00:00Z' }]
  const pagos = [
    { pago_ref: 'pg-lanz', destino: 'Lanzarote', plan: 'duo', personas: 2, importe_cent: 1099, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-11-19T10:00:00Z', devuelto_en: null },
    { pago_ref: 'pg-bruno', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-11-02T10:00:00Z', devuelto_en: null },
    // Los dos cobros de Roma de Eric del 19 oct: su pase se borró con «Empezar de cero»; el registro de cobros no se borra.
    { pago_ref: 'pg-roma-1', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'pagado', proveedor: 'stripe', creado_en: '2026-10-19T10:00:00Z', devuelto_en: null },
    { pago_ref: 'pg-roma-2', destino: 'Roma', plan: 'uno', personas: 1, importe_cent: 699, moneda: 'eur', estado: 'devuelto', proveedor: 'stripe', creado_en: '2026-10-19T11:00:00Z', devuelto_en: '2026-10-19T12:00:00Z' },
  ]
  const logros = [
    { user_id: 'u-diana', logro: 'sello', escalon: 'roma:bronce', destino: 'roma', ganado_en: '2026-07-03T10:00:00Z' },
    { user_id: 'u-diana', logro: 'sello', escalon: 'roma:oro', destino: 'roma', ganado_en: '2026-07-04T10:00:00Z' },
    { user_id: 'u-diana', logro: 'coleccion', escalon: 'imprescindibles', destino: 'roma', ganado_en: '2026-07-04T10:00:00Z' },
    { user_id: 'u-diana', logro: 'pais', escalon: 'Italia', destino: null, ganado_en: '2026-07-03T10:00:00Z' },
    { user_id: 'u-diana', logro: 'viajero:paises', escalon: '1', destino: null, ganado_en: '2026-07-03T10:00:00Z' },
    { user_id: 'u-bruno', logro: 'sello', escalon: 'roma:bronce', destino: 'roma', ganado_en: '2026-11-05T10:00:00Z' },
  ]
  const perfiles = [{ user_id: 'u-diana', exp_max: 1500 }, { user_id: 'u-eric', exp_max: 600 }, { user_id: 'u-bruno', exp_max: 120 }]
  const primeraVez = [
    { user_id: 'u-eric', frecuencia: 'dos_o_tres', compania: 'pareja', anio_nacimiento: 1991, hecho_en: '2026-03-12T10:00:00Z' },
    { user_id: 'u-bruno', frecuencia: 'cuatro_o_mas', compania: 'amigos', anio_nacimiento: 1988, hecho_en: '2026-04-02T10:00:00Z' },
    { user_id: 'u-diana', frecuencia: 'una_vez_al_anio', compania: 'familia', anio_nacimiento: null, hecho_en: '2026-01-20T10:00:00Z' },
  ]
  // 55 de relleno: para paginar (50 en 50) y para llenar el calendario con más de 5 destinos.
  const DESTINOS = ['Roma', 'Lanzarote', 'Barcelona', 'París', 'Londres', 'Lisboa', 'Praga']
  const iniciosMes = ['2026-11-25', '2026-12-10', '2027-01-08', '2027-02-12', '2027-03-20', '2027-04-09']
  for (let i = 0; i < 55; i++) {
    const id = `u-r${String(i).padStart(2, '0')}`
    usuarios.push(usuario(id, `relleno${i}@demo.test`, `2026-0${1 + (i % 9)}-15`, i % 3 ? `2026-11-0${1 + (i % 9)}` : null, i % 2 ? 'google' : 'correo'))
    travelers.push({ id, nombre: `Relleno ${String(i).padStart(2, '0')}` })
    if (i % 4 !== 3) {
      const inicio = iniciosMes[i % 6]
      const fin = new Date(new Date(`${inicio}T12:00:00Z`).getTime() + 4 * 864e5).toISOString().slice(0, 10)
      trips.push({ id: `t-r${i}`, traveler_id: id, destino: DESTINOS[(i * 3 + (i % 7 < 3 ? 0 : i)) % 7], origen: 'Madrid', lugar: lugar('Madrid', 'es'), inicio, fin })
    }
  }
  return { usuarios, travelers, trips, miembros, pases, miembros_pase: miembrosPase, pagos, logros, perfiles, primera_vez: primeraVez, avisos_destino: [], avisos: [] }
}
