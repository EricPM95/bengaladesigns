/** Solo desarrollo: «?dibujos=1» enseña todos los dibujos de los logros en cuadrícula, para compararlos con «Logros · Modelos». */
import { useState } from 'react'
import { Sello, Insignia, Emblema, Chapa, MedallaMaravillas } from '../components/logros/dibujos'
import { sitiosDeColeccion } from '../components/logros/dibujos/Insignia'
import { ESCALONES_DE, LOGROS_CON_CHAPA } from '../components/logros/dibujos/Chapa'
import viajero from '../../data/logros/viajero.json'
import roma from '../../data/logros/roma.json'

const MARAVILLAS = ['coliseo', 'chichen_itza', 'cristo_redentor', 'gran_muralla', 'machu_picchu', 'petra', 'taj_mahal']
const Titulo = ({ t }: { t: string }) => <h2 style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', margin: '28px 0 10px', color: 'rgba(28,34,48,.6)' }}>{t}</h2>
const Cel = ({ children, pie, oscuro = false }: { children: React.ReactNode; pie?: string; oscuro?: boolean }) => (
  <div style={{ width: 168, padding: '12px 6px', borderRadius: 18, background: oscuro ? '#1B2036' : '#FFFDF8', color: oscuro ? '#FFFDF8' : '#1C2230', border: '1px solid rgba(28,34,48,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
    {children}
    {pie && <span style={{ font: "500 10.5px 'Geist Mono',monospace", opacity: 0.7 }}>{pie}</span>}
  </div>
)
const Fila = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{children}</div>

export function DibujosPrueba() {
  const [animado, setAnimado] = useState(false)
  const ids = (viajero as { logros: { id: string }[] }).logros.map((l) => l.id)
  const sinChapa = ids.filter((i) => !LOGROS_CON_CHAPA.includes(i))
  const colecciones = (roma as { colecciones: { id: string }[] }).colecciones.map((c) => c.id)
  return (
    <div style={{ minHeight: '100vh', background: '#E7DCC6', padding: '24px 28px 80px', fontFamily: "'Geist',system-ui,sans-serif", overflow: 'auto', position: 'absolute', inset: 0 }}>
      <h1 style={{ font: "400 34px 'Instrument Serif',serif", margin: 0 }}>Dibujos de los logros</h1>
      <label style={{ fontSize: 13 }}><input type="checkbox" checked={animado} onChange={(e) => setAnimado(e.target.checked)} /> animados</label>
      <p style={{ fontSize: 12, margin: '4px 0' }}>Logros de viajero sin chapa: {sinChapa.length ? sinChapa.join(', ') : 'ninguno'} · {ids.length} logros</p>

      <Titulo t="Sellos · roma" />
      <Fila>{(['bronce', 'plata', 'oro', 'diamante'] as const).map((g) => <Cel key={g} pie={g}><Sello id="roma" grado={g} tam={110} animado={animado} /></Cel>)}<Cel pie="por conseguir"><Sello id="roma" grado="bronce" apagado tam={110} /></Cel></Fila>
      <Titulo t="Sellos · vaticano" />
      <Fila>{(['plata', 'oro', 'diamante'] as const).map((g) => <Cel key={g} pie={g}><Sello id="vaticano" grado={g} tam={110} animado={animado} /></Cel>)}</Fila>

      <Titulo t="Insignias · sin ganar / a medias / completa" />
      <Fila>
        {colecciones.flatMap((c) => {
          const s = sitiosDeColeccion(c)
          return [
            <Cel key={c + 0} pie={c + ' · 0'}><Insignia coleccion={c} tam={120} /></Cel>,
            <Cel key={c + 1} pie={`${c} · ${Math.ceil(s.length / 2)}/${s.length}`}><Insignia coleccion={c} ganados={s.slice(0, Math.ceil(s.length / 2))} tam={120} /></Cel>,
            <Cel key={c + 2} pie={c + ' · completa'}><Insignia coleccion={c} completa tam={120} animada={animado} /></Cel>,
          ]
        })}
      </Fila>

      <Titulo t="Emblemas (animado según la casilla / estático / silueta)" />
      <Fila>
        {(roma as { emblemas: { id: string }[] }).emblemas.map((e) => (
          <Cel key={e.id} oscuro pie={e.id}>
            <Emblema id={e.id} animado={animado} tam={120} />
            <div style={{ display: 'flex', gap: 6 }}><Emblema id={e.id} tam={64} /><Emblema id={e.id} silueta tam={64} /></div>
          </Cel>
        ))}
      </Fila>

      <Titulo t="Chapas de los 43 logros (primer escalón y último)" />
      <Fila>
        {ids.map((id) => {
          const esc = ESCALONES_DE[id]
          return (
            <Cel key={id} pie={id + (esc ? ` · ${esc[0]}…${esc[esc.length - 1]}` : '')}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <Chapa logro={id} escalon={esc?.[0]} tam={esc ? 70 : 100} animada={animado} />
                {esc && <Chapa logro={id} escalon={esc[esc.length - 1]} tam={70} />}
              </div>
            </Cel>
          )
        })}
      </Fila>

      <Titulo t="Países · los 9 escalones" />
      <Fila>{(ESCALONES_DE.paises ?? []).map((n) => <Cel key={n} pie={'países ' + n}><Chapa logro="paises" escalon={n} tam={110} /></Cel>)}</Fila>

      <Titulo t="Medalla de las 7 maravillas · 0 a 7" />
      <Fila>{[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <Cel key={n} oscuro pie={n + ' de 7'}><MedallaMaravillas encendidas={MARAVILLAS.slice(0, n)} tam={140} animada={animado} /></Cel>)}</Fila>
    </div>
  )
}
