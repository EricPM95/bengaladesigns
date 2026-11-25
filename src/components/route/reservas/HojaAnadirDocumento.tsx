import { BOTON_CLARO, BOTON_ORO } from '../../ui/botonesOro'
import { HojaAbajo } from './HojaAbajo'
import type { ClaveDocumento } from './BotonesDeReserva'

/**
 * (V64 §1; Design «Añadir un documento» D1, D4a, D4b y D5b) UNA SOLA FORMA DE AÑADIR UN DOCUMENTO, en todas las tarjetas de RESERVAS (vuelo, tren, entradas, excursiones, alojamiento, coche) y en el QR gris de HOY:
 * una hoja pequeña, ANTES de que se abra el menú del iPhone, con [Subir foto o archivo] (dorado; debajo, en gris, qué vale) y [Escribir los datos] (blanco con borde; debajo, qué pasa si no hay código). Fuera los enlaces «o escribe los datos a mano».
 * Los dos botones son los de siempre (`BOTON_ORO`, `BOTON_CLARO`); la hoja es `HojaAbajo`, la de las hojas de RESERVAS.
 */
const TEXTOS: Record<ClaveDocumento, { titulo: string; subir: string; escribir: string }> = {
  documento_vuelo: { titulo: 'Tu tarjeta de embarque', subir: 'PDF, foto o captura de pantalla (también de Wallet o de la app de la aerolínea)', escribir: 'Sin el código: en el aeropuerto, usa la app de la aerolínea' },
  documento_tren: { titulo: 'Tu billete', subir: 'PDF, foto o captura de pantalla (también de la app de la compañía)', escribir: 'Sin el código: en la estación, usa la app de la compañía' },
  documento_barco: { titulo: 'Tu billete', subir: 'PDF, foto o captura de pantalla (también de la app de la naviera)', escribir: 'Sin el código: en el puerto, usa la app de la naviera' },
  documento_entrada: { titulo: 'Tu entrada', subir: 'PDF, foto o captura de pantalla (también del email de la reserva)', escribir: 'Sin el código: en la entrada, enseña el email de la reserva' },
  documento_excursion: { titulo: 'Tu reserva', subir: 'PDF, foto o captura de pantalla (también del email de la reserva)', escribir: 'Sin el código: en el punto de encuentro, enseña el email de la reserva' },
  documento_alojamiento: { titulo: 'Tu reserva', subir: 'PDF, foto o captura de pantalla (también del email de la reserva)', escribir: 'Para guardar la dirección, las horas de entrada y salida y el teléfono' },
  documento_coche: { titulo: 'Tu reserva del coche', subir: 'PDF, foto o captura de pantalla (también del email de la reserva)', escribir: 'Para guardar la compañía, la recogida, la devolución y el precio' },
}

const CAPTION = { margin: 0, padding: '0 6px', textAlign: 'center', font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' } as const

export function HojaAnadirDocumento({ clave, titulo, onSubir, onEscribir, onClose }: { clave: ClaveDocumento; /** (V65) Otro título (p. ej. «La entrada de Alicia», al subir el documento de otra persona). */ titulo?: string; /** Abre el selector de archivos (la hoja se cierra antes). */ onSubir: () => void; onEscribir: () => void; onClose: () => void }) {
  const t = TEXTOS[clave]
  return (
    <HojaAbajo titleId="hoja-anadir-documento" onClose={onClose} capa={118}>
      <div data-hoja-anadir-documento={clave} className="flex flex-col gap-3">
        <h2 id="hoja-anadir-documento" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
          {titulo ?? t.titulo}
        </h2>
        <button
          type="button"
          onClick={() => {
            // El selector de archivos se abre dentro del mismo toque (si no, el iPhone lo bloquea); la hoja se cierra justo después.
            onSubir()
            onClose()
          }}
          data-anadir-doc-subir
          className="flex items-center justify-center gap-2.5"
          style={{ ...BOTON_ORO, border: 'none', height: 56, borderRadius: 18, font: "700 16px 'Geist'" }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
          </svg>
          Subir foto o archivo
        </button>
        <p data-anadir-doc-subir-ayuda style={{ ...CAPTION, marginTop: -4 }}>
          {t.subir}
        </p>
        <button
          type="button"
          onClick={() => {
            onClose()
            onEscribir()
          }}
          data-anadir-doc-escribir
          className="mt-1.5 flex items-center justify-center gap-2.5"
          style={{ ...BOTON_CLARO, height: 54, borderRadius: 18, font: "700 15.5px 'Geist'" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" />
          </svg>
          Escribir los datos
        </button>
        <p data-anadir-doc-escribir-ayuda style={{ ...CAPTION, marginTop: -4 }}>
          {t.escribir}
        </p>
      </div>
    </HojaAbajo>
  )
}
