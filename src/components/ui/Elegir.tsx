import type { ReactNode } from 'react'

/**
 * ELEGIR UNA COSA U OTRA: el mismo estilo en toda la app (Tanda 10N §11, «Presupuesto Compartido» 03-05).
 * Lo elegido: azul oscuro de la marca #1C2230, texto claro #FBF3E2 y el icono en oro #F3D88F. Lo no elegido: blanco #FFFDF8 con su borde fino.
 * (Las listas de una hoja donde se elige una FILA —la «Moneda», «Elige tu título»— no usan esto: se quedan con borde de oro.)
 *
 * USO
 *   <InterruptorElegir
 *     valor={modo}                         // el id elegido
 *     onCambio={setModo}                   // (id) => void
 *     opciones={[{ id: 'todos', texto: 'Para todos', icono: <Icono .../> }, { id: 'yo', texto: 'Para mí' }]}
 *     datos="gasto-alcance"                // opcional: data-elegir en el contenedor, para las pruebas
 *   />
 *   Las opciones se reparten el ancho a partes iguales (2 o más). `icono` es opcional (un ReactNode; hereda el color: oro si está elegida, gris si no).
 *   `alto` (por defecto 54) y `compacto` (alto 40, letra de 13 px) para sitios estrechos. `deshabilitado` apaga todo.
 *
 *   <PastillaElegir elegida={marcada} onClick={alternar} icono={<Icono .../>} marca>Eric</PastillaElegir>
 *   Una pastilla elegible suelta (varias a la vez, p. ej. «¿Quién ha pagado?» o «¿Para quién es?»). `marca`: pinta un ✓ dorado delante cuando está elegida.
 *   `datos` pone data-elegir-pastilla. Para varias en fila: <div style={{display:'flex',flexWrap:'wrap',gap:8}}>…</div>.
 */

const AZUL = '#1C2230'
const CLARO = '#FBF3E2'
const ORO = '#F3D88F'

export interface OpcionElegir {
  id: string
  texto: ReactNode
  icono?: ReactNode
  deshabilitada?: boolean
  /** Algo detrás del texto (un candado pequeño…). */
  extra?: ReactNode
  /** (Tanda 10N5 §6b) Bloqueada por el pase: azul oscuro con anillo dorado y el candado dorado delante (los colores de la caja de `Pase Estilo` 01). Al tocarla, lo que haga `onCambio` (abrir el pase). */
  bloqueada?: boolean
  /** Atributos data-* de ese botón (para las pruebas): `{ 'data-pestana': 'nearby' }`. */
  atributos?: Record<string, string>
}

export function InterruptorElegir({
  valor,
  onCambio,
  opciones,
  alto = 54,
  compacto = false,
  deshabilitado = false,
  datos,
  etiqueta,
  atributos,
}: {
  valor: string | null
  onCambio: (id: string) => void
  opciones: OpcionElegir[]
  alto?: number
  compacto?: boolean
  deshabilitado?: boolean
  datos?: string
  etiqueta?: string
  /** Atributos data-* del contenedor (para las pruebas). */
  atributos?: Record<string, string>
}) {
  const h = compacto ? 40 : alto
  return (
    <div data-elegir={datos ?? ''} {...atributos} role="radiogroup" aria-label={etiqueta} style={{ display: 'flex', gap: 8 }}>
      {opciones.map((o) => {
        const elegida = o.id === valor
        const apagada = deshabilitado || o.deshabilitada
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={elegida}
            data-elegida={elegida ? '1' : '0'}
            disabled={apagada}
            onClick={() => onCambio(o.id)}
            {...o.atributos}
            style={{
              flex: 1,
              minWidth: 0,
              height: h,
              borderRadius: compacto ? 14 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compacto ? 6 : 9,
              font: `600 ${compacto ? 13 : 15}px 'Geist'`,
              background: o.bloqueada ? 'linear-gradient(135deg,#1C2230,#252F55 60%,#1C2230)' : elegida ? AZUL : '#FFFDF8',
              color: elegida || o.bloqueada ? CLARO : AZUL,
              border: o.bloqueada ? '1px solid transparent' : `1px solid ${elegida ? AZUL : 'rgba(28,34,48,.14)'}`,
              boxShadow: o.bloqueada ? 'inset 0 0 0 1.3px rgba(233,199,122,.55)' : undefined,
              cursor: apagada ? 'default' : 'pointer',
              opacity: apagada && !elegida ? 0.5 : 1,
              transition: 'background .15s,color .15s',
            }}
          >
            {o.bloqueada && (
              <svg data-bloqueado-pase="1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
              </svg>
            )}
            {o.icono && <span aria-hidden="true" style={{ flex: 'none', display: 'inline-flex', color: elegida ? ORO : 'rgba(28,34,48,.6)' }}>{o.icono}</span>}
            <span style={{ minWidth: 0 }}>{o.texto}</span>
            {o.extra}
          </button>
        )
      })}
    </div>
  )
}

export function PastillaElegir({
  elegida,
  onClick,
  children,
  icono,
  marca = false,
  deshabilitada = false,
  datos,
}: {
  elegida: boolean
  onClick?: () => void
  children: ReactNode
  icono?: ReactNode
  marca?: boolean
  deshabilitada?: boolean
  datos?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      data-elegir-pastilla={datos ?? ''}
      data-elegida={elegida ? '1' : '0'}
      disabled={deshabilitada}
      onClick={onClick}
      style={{
        minHeight: 38,
        padding: '0 14px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        font: "600 13px 'Geist'",
        background: elegida ? AZUL : '#FFFDF8',
        color: elegida ? CLARO : AZUL,
        border: `1px solid ${elegida ? AZUL : 'rgba(28,34,48,.14)'}`,
        cursor: deshabilitada ? 'default' : 'pointer',
        opacity: deshabilitada ? 0.5 : 1,
        transition: 'background .15s,color .15s',
      }}
    >
      {marca && elegida && (
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ORO} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {icono && <span aria-hidden="true" style={{ flex: 'none', display: 'inline-flex', color: elegida ? ORO : 'rgba(28,34,48,.6)' }}>{icono}</span>}
      {children}
    </button>
  )
}
