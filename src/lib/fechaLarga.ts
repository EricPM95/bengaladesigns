const SEMANA = new Intl.DateTimeFormat('es-ES', { weekday: 'long' })
const MES = new Intl.DateTimeFormat('es-ES', { month: 'long' })

/** «jueves 29 octubre» (como lo dibuja Design en las hojas de RESERVAS: sin «de»). */
export function fechaLarga(dateIso: string): string {
  const fecha = new Date(`${dateIso}T12:00:00`)
  return `${SEMANA.format(fecha)} ${fecha.getDate()} ${MES.format(fecha)}`
}
