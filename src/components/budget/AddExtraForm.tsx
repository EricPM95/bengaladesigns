import { useState } from 'react'
import { useRouteStore } from '../../store/useRouteStore'

export function AddExtraForm() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const addBudgetItem = useRouteStore((state) => state.addBudgetItem)

  const handleAdd = () => {
    const value = Number(amount)
    if (!name.trim() || !value || value <= 0) return
    addBudgetItem({ id: `extra-${Date.now()}`, icon: '➕', label: name.trim(), amount: value, category: 'extra', sourceType: 'other' })
    setName('')
    setAmount('')
  }

  return (
    <div className="flex gap-2 pt-1">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre del gasto"
        className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
      />
      <input
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="€"
        type="number"
        min="0"
        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-small text-text"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim() || !amount}
        className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-small font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Añadir
      </button>
    </div>
  )
}
