interface ChoiceButtonProps {
  label: string
  description?: string
  icon?: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

export function ChoiceButton({ label, description, icon, selected, disabled, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-border bg-bg-card hover:border-border-accent hover:bg-bg-hover'
      }`}
    >
      {icon && <span className="text-lg leading-none">{icon}</span>}
      <span>
        <span className={`block text-body font-medium ${selected ? 'text-accent-hover' : 'text-text'}`}>{label}</span>
        {description && <span className="mt-0.5 block text-small text-text-soft">{description}</span>}
      </span>
    </button>
  )
}
