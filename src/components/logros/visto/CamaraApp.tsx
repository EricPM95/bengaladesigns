import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trazo, TRAZO } from './trazos'

/**
 * LA CÁMARA DE LA APP (diseño 9b «La cámara de la app»). Pantalla negra con el visor, «Encuadra» + el nombre del sitio, la etiqueta «Emblema Oculto» si toca, cerrar, girar y el disparador.
 * Usa la cámara del móvil (`getUserMedia`). Si el móvil no deja (o no hay cámara), abre la cámara normal del móvil con un selector de archivos, y la foto cuenta igual como «de la app».
 * Entrega la foto como `File` (JPEG) por `alFoto`. Nunca guarda nada por su cuenta.
 */
export function CamaraApp({ nombre, oculto, alFoto, alCerrar }: { nombre: string; oculto: boolean; alFoto: (f: File) => void; alCerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const flujo = useRef<MediaStream | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const [lado, setLado] = useState<'environment' | 'user'>('environment')
  const [listo, setListo] = useState(false)
  const [sinVisor, setSinVisor] = useState(false)

  useEffect(() => {
    let vivo = true
    setListo(false)
    const abrir = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara')
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: lado } }, audio: false })
        if (!vivo) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        flujo.current?.getTracks().forEach((t) => t.stop())
        flujo.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => undefined)
        }
        setListo(true)
      } catch {
        if (vivo) setSinVisor(true)
      }
    }
    void abrir()
    return () => {
      vivo = false
    }
  }, [lado])

  useEffect(
    () => () => {
      flujo.current?.getTracks().forEach((t) => t.stop())
      flujo.current = null
    },
    [],
  )

  const disparar = () => {
    const v = video.current
    if (!listo || !v || !v.videoWidth) {
      entrada.current?.click()
      return
    }
    const lienzo = document.createElement('canvas')
    lienzo.width = v.videoWidth
    lienzo.height = v.videoHeight
    lienzo.getContext('2d')?.drawImage(v, 0, 0)
    lienzo.toBlob((b) => b && alFoto(new File([b], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.9)
  }

  return createPortal(
    <div data-visto="camara" role="dialog" aria-label="Cámara" className="fixed inset-0 z-[90] flex flex-col bg-[#0E1118] text-[#FFFDF8]" style={{ animation: 'vistoFade .3s ease both' }}>
      <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={{ display: listo ? 'block' : 'none' }} />
      {!listo && <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,#1E2430 0 14px,#1A202B 14px 28px)' }} />}
      {!listo && (
        <span className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(255,253,248,.4)' }}>
          {sinVisor ? 'USA LA CÁMARA DEL MÓVIL' : 'ABRIENDO LA CÁMARA…'}
        </span>
      )}
      <div className="absolute inset-x-0 top-0 h-[170px]" style={{ background: 'linear-gradient(180deg,rgba(14,17,24,.85),transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[230px]" style={{ background: 'linear-gradient(0deg,rgba(14,17,24,.95) 40%,transparent)' }} />
      <div className="pointer-events-none absolute inset-x-7 bottom-[250px] top-[200px]">
        {['left-0 top-0 border-l-2 border-t-2 rounded-tl-lg', 'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg', 'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg', 'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg'].map((c) => (
          <span key={c} className={`absolute h-[26px] w-[26px] border-[#FFFDF8]/80 ${c}`} />
        ))}
      </div>
      <div className="relative flex items-center gap-2.5 px-[18px] pt-[62px]">
        <button type="button" onClick={alCerrar} aria-label="Cerrar cámara" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#FFFDF8]/15 text-[#FFFDF8]">
          <Trazo d={TRAZO.cerrar} tam={16} grosor={2} />
        </button>
        <span className="flex-1" />
        {oculto && (
          <span className="flex h-8 items-center gap-[7px] rounded-full border pl-2 pr-3" style={{ background: 'rgba(14,17,24,.6)', borderColor: 'oklch(0.82 0.12 80 / .5)', font: "600 11.5px 'Geist'", color: 'oklch(0.88 0.11 88)' }}>
            <span className="h-3.5 w-3.5 rotate-45 rounded-[4px]" style={{ background: 'linear-gradient(135deg,oklch(0.88 0.11 88),oklch(0.62 0.13 60))' }} />
            Emblema Oculto
          </span>
        )}
      </div>
      <div className="relative mx-[18px] mt-3.5 flex flex-col gap-[3px]">
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,253,248,.65)' }}>Encuadra</span>
        <span style={{ font: "400 28px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{nombre}</span>
      </div>
      <div className="flex-1" />
      <div className="relative flex items-center justify-between px-[34px] pb-[54px]">
        <span className="h-12 w-12" />
        <button type="button" onClick={disparar} aria-label="Hacer la foto" className="h-20 w-20 rounded-full border-4 border-[#FFFDF8] bg-transparent p-[5px] active:scale-95">
          <span className="block h-full w-full rounded-full" style={{ background: oculto ? 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)' : '#FFFDF8' }} />
        </button>
        <button type="button" onClick={() => setLado((l) => (l === 'environment' ? 'user' : 'environment'))} aria-label="Girar cámara" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFDF8]/15 text-[#FFFDF8]">
          <Trazo d={TRAZO.giro} tam={20} />
        </button>
      </div>
      {/* Sin visor (o sin permiso): la cámara normal del móvil, que también hace la foto en el momento. */}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) alFoto(f)
        }}
      />
    </div>,
    document.body,
  )
}
