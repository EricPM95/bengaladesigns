import { useEffect, useState, type ReactNode } from 'react'
import { llamar } from '../../../lib/logros'
import { tarjetaBlanca, titulo14 } from './comun'

/**
 * (V35B) HERRAMIENTAS › «CUENTAS QUE NO CUENTAN»: marcar o desmarcar una cuenta (por correo) como de prueba. No cuentan en las cifras ni los gráficos mientras «Sin cuentas de prueba» (arriba del panel) esté encendido; la lista
 * de usuarios las sigue enseñando con la etiqueta «Prueba». Las de administrador no cuentan nunca. Sin la migración 0091, «Pronto».
 */
interface Estado {
  ok: boolean
  disponible: boolean
  cuentas: { email: string; marcado_en: string }[]
  administradores: string[]
}

export function CuentasQueNoCuentan({ movil }: { movil: boolean }): ReactNode {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const cargar = () => void llamar<Estado>('/api/admin/cuentas-de-prueba').then(setEstado)
  useEffect(cargar, [])
  const cambiar = async (email: string, marcar: boolean) => {
    setOcupado(true)
    const r = await llamar<{ ok: boolean; error?: string }>('/api/admin/cuentas-de-prueba', { cuerpo: { email, marcar } })
    setOcupado(false)
    setMensaje(r?.ok ? (marcar ? `${email} ya no cuenta en las cifras.` : `${email} vuelve a contar.`) : 'No se ha podido (¿el correo está bien escrito?).')
    if (r?.ok && marcar) setCorreo('')
    cargar()
  }
  const disponible = estado?.disponible !== false
  return (
    <section data-herramienta="cuentas-que-no-cuentan" style={tarjetaBlanca}>
      <span style={titulo14}>Cuentas que no cuentan</span>
      <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
        Las cuentas de prueba no suman en las cifras ni los gráficos del panel (con «Sin cuentas de prueba» encendido arriba). La lista de usuarios las sigue enseñando, con la etiqueta «Prueba». Las de administrador no cuentan nunca.
      </span>
      {!disponible && <b data-pronto style={{ font: "700 13px 'Geist'", color: '#8A6A2C' }}>Pronto: falta aplicar la migración 0091 en Supabase.</b>}
      {disponible && (
        <form onSubmit={(e) => { e.preventDefault(); if (correo.trim()) void cambiar(correo.trim(), true) }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input data-correo-de-prueba type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@example.com" aria-label="Correo de la cuenta de prueba" style={{ flex: '1 1 220px', minHeight: 44, borderRadius: 12, border: '1.5px solid rgba(28,34,48,.2)', padding: '0 12px', font: "500 14px 'Geist'" }} />
          <button type="submit" data-marcar-prueba disabled={ocupado || !correo.trim()} style={{ minHeight: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1C2230', color: '#F3D88F', font: "700 13.5px 'Geist'", opacity: ocupado || !correo.trim() ? 0.5 : 1 }}>Marcar como de prueba</button>
        </form>
      )}
      {estado && estado.cuentas.length > 0 && (
        <div data-lista-de-pruebas style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {estado.cuentas.map((c) => (
            <div key={c.email} data-cuenta-de-prueba={c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderRadius: 12, background: '#F7F1E4', flexWrap: movil ? 'wrap' : 'nowrap' }}>
              <span style={{ font: "500 13.5px 'Geist'", overflowWrap: 'anywhere' }}>{c.email}</span>
              <button type="button" data-desmarcar-prueba={c.email} disabled={ocupado} onClick={() => void cambiar(c.email, false)} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "600 12.5px 'Geist'" }}>Desmarcar</button>
            </div>
          ))}
        </div>
      )}
      {estado && estado.administradores.length > 0 && (
        <span data-administradores style={{ font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>Administradores (no cuentan nunca): {estado.administradores.join(', ')}</span>
      )}
      {mensaje && <p data-mensaje-pruebas role="status" style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.75)' }}>{mensaje}</p>}
    </section>
  )
}
