import type { ReactNode } from 'react'
import fotos from '../../../data/entrada/fotos.json'

/**
 * (V39C, Design «Pase y cuenta» › A1) EL MOSAICO DE LA PANTALLA DE ENTRAR: tres columnas de tarjetas de destinos, inclinadas, que suben y bajan DESPACIO sin parar (un desplazamiento continuo y suave, sin saltos) y se difuminan hacia abajo.
 * Cada tarjeta lleva una FOTO de verdad de su destino (WebP pequeña, `public/fotos/entrada/`, de `data/entrada/fotos.json`; sus autores y licencias, en «Créditos» y en `docs/dias/FOTOS_ENTRADA.md`), su nombre y su país.
 * Solo salen destinos NUESTROS (los 11 de salida y los 3 «Próximamente»); nada de ejemplo de Design.
 *   · Las fotos se cargan poco a poco (`loading="lazy"`) y en el tamaño de la tarjeta; mientras llegan, la tarjeta lleva su degradado de color (como en el dibujo).
 *   · Con «Reducir movimiento» el mosaico se queda quieto (la regla está en el propio CSS).
 *   · Cada columna lleva sus tarjetas DOS veces y se desplaza justo la mitad: el bucle no se nota (el relleno de abajo es el hueco entre tarjetas).
 * Sin ninguna consulta: todo va dentro de la app.
 */
interface FotoDeEntrada {
  archivo: string
  nombre: string
  pais: string
}
interface Tarjeta {
  clave: string
  /** Altura de la tarjeta, en píxeles (varían de una a otra, como en el dibujo). */
  h: number
  /** El degradado de color que se ve mientras llega la foto. */
  bg: string
}
const DE_ENTRADA = fotos as unknown as Record<string, FotoDeEntrada>
/** Roma y Lanzarote usan su portada de siempre (reducida a tamaño de tarjeta). */
const PROPIAS: Record<string, FotoDeEntrada> = {
  roma: { archivo: '/fotos/entrada/roma.webp', nombre: 'Roma', pais: 'Italia' },
  lanzarote: { archivo: '/fotos/entrada/lanzarote.webp', nombre: 'Lanzarote', pais: 'España' },
}
const TODAS: Record<string, FotoDeEntrada> = { ...DE_ENTRADA, ...PROPIAS }

const T = (clave: string, h: number, bg: string): Tarjeta => ({ clave, h, bg })
const COLUMNAS: { mt: number; animacion: 'enMosaicoSube' | 'enMosaicoBaja'; segundos: number; tarjetas: Tarjeta[] }[] = [
  { mt: 0, animacion: 'enMosaicoSube', segundos: 46, tarjetas: [T('roma', 170, 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)'), T('nueva_york', 176, 'linear-gradient(160deg,#9AA8B8,#4A5A6E 60%,#1E2838)'), T('cancun', 160, 'linear-gradient(160deg,#7FD3D3,#2A8C9A 60%,#124A56)'), T('praga', 152, 'linear-gradient(160deg,#C9A27C,#8A5A3A 60%,#3E2A1C)'), T('berlin', 164, 'linear-gradient(160deg,#A6B0BC,#5C6878 60%,#262E3A)')] },
  { mt: -70, animacion: 'enMosaicoBaja', segundos: 52, tarjetas: [T('paris', 140, 'linear-gradient(160deg,#9DB4D8,#5A6EA0 55%,#2E3A5E)'), T('lanzarote', 150, 'linear-gradient(160deg,#E2896A,#8A3E22 60%,#3A1A10)'), T('londres', 142, 'linear-gradient(160deg,#A9B8C4,#66788A 60%,#2E3A48)'), T('florencia', 168, 'linear-gradient(160deg,#E8B88C,#B8683E 60%,#5A2E1A)'), T('amsterdam', 156, 'linear-gradient(160deg,#B8C8B4,#6E8A68 60%,#2E402E)')] },
  { mt: -20, animacion: 'enMosaicoSube', segundos: 58, tarjetas: [T('barcelona', 148, 'linear-gradient(160deg,#E9C08A,#B5683A 60%,#5A3018)'), T('lisboa', 166, 'linear-gradient(160deg,#E8C98A,#B8884A 60%,#5E421E)'), T('madrid', 154, 'linear-gradient(160deg,#E3A08A,#A8523C 60%,#4A2218)'), T('cartagena_de_indias', 160, 'linear-gradient(160deg,#F0C890,#C8783A 60%,#5E3016)')] },
]
/** Los destinos que salen en el mosaico (para la prueba). */
export const CLAVES_DEL_MOSAICO: string[] = COLUMNAS.flatMap((c) => c.tarjetas.map((t) => t.clave))
export const FOTOS_DEL_MOSAICO = TODAS

function TarjetaDeDestino({ t, copia }: { t: Tarjeta; copia: boolean }): ReactNode {
  const f = TODAS[t.clave]
  if (!f) return null
  return (
    <div data-tarjeta-mosaico={t.clave} data-copia={copia ? '1' : undefined} style={{ position: 'relative', height: t.h, flex: 'none', borderRadius: 20, overflow: 'hidden', background: t.bg, boxShadow: '0 14px 22px -14px rgba(60,40,20,.55),inset 0 0 0 1px rgba(255,255,255,.35)' }}>
      <img src={f.archivo} alt="" width={240} height={300} loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'linear-gradient(180deg,transparent,rgba(20,14,8,.62))' }} />
      <span style={{ position: 'absolute', left: 10, right: 8, bottom: 9, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
        <span style={{ font: "700 14px/1.1 'Geist'", color: '#FFFFFF' }}>{f.nombre}</span>
        <span style={{ font: "500 10.5px 'Geist'", color: 'rgba(255,255,255,.75)' }}>{f.pais}</span>
      </span>
    </div>
  )
}

export function MosaicoDeDestinos(): ReactNode {
  return (
    <div
      aria-hidden="true"
      data-mosaico-entrada
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 'clamp(140px, calc(100% - 340px), 470px)', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 62%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 62%,transparent 100%)', pointerEvents: 'none' }}
    >
      <style>{`@keyframes enMosaicoSube{from{transform:translateY(0)}to{transform:translateY(-50%)}}@keyframes enMosaicoBaja{from{transform:translateY(-50%)}to{transform:translateY(0)}}@media (prefers-reduced-motion:reduce){[data-columna-mosaico]{animation:none!important}}`}</style>
      <div style={{ position: 'absolute', left: -14, right: -14, top: -30, display: 'flex', gap: 12, justifyContent: 'center', transform: 'perspective(900px) rotateX(10deg) rotate(-5deg) scale(1.12)', transformOrigin: '50% 0' }}>
        {COLUMNAS.map((c, i) => (
          <div key={i} data-columna-mosaico={i} style={{ width: 112, flex: 'none', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12, marginTop: c.mt, animation: `${c.animacion} ${c.segundos}s linear infinite`, willChange: 'transform' }}>
            {c.tarjetas.map((t) => (
              <TarjetaDeDestino key={t.clave} t={t} copia={false} />
            ))}
            {c.tarjetas.map((t) => (
              <TarjetaDeDestino key={`${t.clave}-2`} t={t} copia />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
