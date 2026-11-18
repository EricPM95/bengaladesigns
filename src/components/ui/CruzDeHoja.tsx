import type { CSSProperties, ReactNode } from 'react'

/**
 * LA X PARA CERRAR de las hojas y pantallas (V12): la misma X redonda de «Tus logros en …» —un círculo de 40 px (#F1EADC) con la X fina dentro, en una zona de toque de 48 px— arriba a la derecha.
 * Toda hoja que sube desde abajo y toda pantalla que tapa la app la lleva (la hoja se cierra también arrastrando y tocando fuera, pero no todo el mundo lo sabe).
 * Se coloca con `position: absolute` en la esquina de su hoja (la hoja tiene que ser `relative`/`absolute`/`fixed`); `estilo` cambia la posición si hace falta.
 */
export function CruzDeHoja({ onCerrar, oscura = false, estilo, etiqueta = 'Cerrar' }: { onCerrar: () => void; oscura?: boolean; estilo?: CSSProperties; etiqueta?: string }): ReactNode {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onCerrar()
      }}
      aria-label={etiqueta}
      data-cruz-de-hoja
      style={{ position: 'absolute', right: 6, top: 6, zIndex: 5, width: 48, height: 48, flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...estilo }}
    >
      <span style={{ width: 40, height: 40, borderRadius: '50%', background: oscura ? 'rgba(255,253,248,.14)' : '#F1EADC', color: oscura ? '#FFFDF8' : '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    </button>
  )
}
