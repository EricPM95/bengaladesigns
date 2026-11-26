/**
 * (V70, 1b) EL CAMPO DE BÚSQUEDA de punta a punta: el de «Dónde has estado» («Busca un país»), UNA sola pieza. Lo usan esa pantalla y las hojas de la moneda y del país de Ajustes.
 * Busca sin tildes ni mayúsculas con `coincideConBusqueda`. Sin consultas a Supabase (filtra listas que ya están en memoria).
 */
export const sinTildesNiMayusculas = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** ¿Alguno de los textos contiene lo que se busca? (sin tildes ni mayúsculas; sin nada escrito, todo coincide). */
export function coincideConBusqueda(textos: (string | null | undefined)[], q: string): boolean {
  const k = sinTildesNiMayusculas(q)
  if (!k) return true
  return textos.some((t) => sinTildesNiMayusculas(t ?? '').includes(k))
}

export function CampoDeBusqueda({ valor, onCambio, placeholder = 'Busca un país', datos = 'busqueda' }: { valor: string; onCambio: (q: string) => void; placeholder?: string; datos?: string }) {
  return (
    <label data-campo-busqueda={datos} style={{ height: 48, flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 16, background: '#FFFDF8', border: `1.5px solid ${valor ? '#1C2230' : 'rgba(28,34,48,.12)'}` }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.55)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} aria-label={placeholder} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: "500 15px 'Geist'", color: '#1C2230' }} />
    </label>
  )
}
