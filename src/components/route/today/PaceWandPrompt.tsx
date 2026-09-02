import { Button } from '../../ui/Button'

interface EarlyPaceWandPromptProps {
  kind: 'early'
  onAddSomething: () => void
  onDismiss: () => void
}

interface LatePaceWandPromptProps {
  kind: 'late'
  onCompress: () => void
  onDropLowestPriority: () => void
  onDismiss: () => void
}

type PaceWandPromptProps = EarlyPaceWandPromptProps | LatePaceWandPromptProps

/**
 * Aviso de "varita mágica" tras un check-in con margen fuera de lo normal — mismo mecanismo ya
 * usado para oportunidades de vuelo/hotel (ver flightOpportunity.ts): nunca actúa solo, siempre
 * ofrece opciones explícitas. El caso "retraso" es el único que puede reorganizar el día.
 */
export function PaceWandPrompt(props: PaceWandPromptProps) {
  if (props.kind === 'early') {
    return (
      <div className="mx-4 space-y-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-3">
        <p className="flex items-start gap-2 text-small font-medium text-accent-hover">
          <span aria-hidden="true">🪄</span>
          Vas a buen ritmo — ¿busco algo más para tu día?
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={props.onDismiss} className="flex-1">
            No, gracias
          </Button>
          <Button onClick={props.onAddSomething} className="flex-1">
            Busca algo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 space-y-2.5 rounded-xl border border-accent-red/30 bg-accent-red/10 px-3.5 py-3">
      <p className="flex items-start gap-2 text-small font-medium text-accent-red">
        <span aria-hidden="true">🪄</span>
        Vas con retraso — ¿reorganizamos el resto del día, o prefieres que quitemos algo?
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={props.onDismiss} className="flex-1">
          Ahora no
        </Button>
        <Button variant="secondary" onClick={props.onDropLowestPriority} className="flex-1">
          Quitar una parada
        </Button>
        <Button onClick={props.onCompress} className="flex-1">
          Comprimir tiempos
        </Button>
      </div>
    </div>
  )
}
