import { enlaceAlPuntoDeEncuentro } from '../../../lib/civitatis'
import { precioTienda } from '../../../lib/dinero'
import type { DatosDeActividad } from '../../../lib/types'

/**
 * LOS DATOS REALES DE UNA ENTRADA (API de consulta, parte 1; solo con el interruptor encendido), dentro de la pestaña «Entradas» de la ficha: foto, valoración y opiniones, qué incluye y qué no,
 * cancelación, hasta cuándo se reserva, duración y punto de encuentro (con enlace al mapa). Todo viene de nuestro servidor; lo que la API no da, no sale (nunca un número inventado). Ninguna
 * línea nombra a la empresa. Provisional hasta que Design dibuje la suya.
 */

const euros = (n: number) => precioTienda(n)

export function DatosDeLaActividad({ datos }: { datos: DatosDeActividad }) {
  const enlaceMapa = enlaceAlPuntoDeEncuentro(datos.puntoDeEncuentro)
  const filas: { etiqueta: string; texto: string }[] = [
    datos.duracion ? { etiqueta: 'Duración', texto: datos.duracion } : null,
    datos.reservarHasta ? { etiqueta: 'Reserva', texto: datos.reservarHasta } : null,
    datos.cancelacion ? { etiqueta: 'Cancelación', texto: datos.cancelacion } : null,
  ].filter((fila): fila is { etiqueta: string; texto: string } => fila !== null)
  return (
    <div className="mt-3 space-y-2.5" data-datos-actividad={datos.id}>
      {datos.fotos.principal && <img src={datos.fotos.principal.url} alt={datos.fotos.principal.pie ?? datos.nombre} loading="lazy" className="h-32 w-full rounded-2xl object-cover" />}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] text-text/75">
        {datos.valoracion != null && (
          <span data-valoracion className="font-semibold text-text">
            {datos.valoracion.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/10
          </span>
        )}
        {datos.opiniones != null && <span data-opiniones>{datos.opiniones.toLocaleString('es-ES')} opiniones</span>}
        {datos.original != null && datos.desde != null && (
          <span className="text-text/50 line-through" data-precio-original>
            {euros(datos.original)}
          </span>
        )}
        {datos.gratis && <span className="font-semibold text-text">Gratis</span>}
      </div>
      {filas.map((fila) => (
        <p key={fila.etiqueta} className="m-0 text-[13px] leading-[1.45] text-text/72">
          <span className="font-semibold text-text/85">{fila.etiqueta}: </span>
          {fila.texto}
        </p>
      ))}
      {datos.incluye.length > 0 && (
        <div className="text-[13px] leading-[1.45] text-text/72">
          <p className="m-0 font-semibold text-text/85">Incluye</p>
          <ul className="m-0 list-disc pl-5">
            {datos.incluye.slice(0, 5).map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </div>
      )}
      {datos.noIncluye.length > 0 && (
        <div className="text-[13px] leading-[1.45] text-text/72">
          <p className="m-0 font-semibold text-text/85">No incluye</p>
          <ul className="m-0 list-disc pl-5">
            {datos.noIncluye.slice(0, 4).map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </div>
      )}
      {datos.puntoDeEncuentro?.texto && (
        <p className="m-0 text-[13px] leading-[1.45] text-text/72" data-punto-de-encuentro>
          <span className="font-semibold text-text/85">Punto de encuentro: </span>
          {datos.puntoDeEncuentro.texto}
          {enlaceMapa && (
            <>
              {' · '}
              <a href={enlaceMapa} target="_blank" rel="noopener noreferrer" className="font-semibold text-text underline underline-offset-2">
                Ver en el mapa
              </a>
            </>
          )}
        </p>
      )}
    </div>
  )
}
