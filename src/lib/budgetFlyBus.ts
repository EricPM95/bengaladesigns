/**
 * Bus mínimo (pub/sub) para la animación de confirmación "+X€" que vuela hacia el icono de
 * presupuesto (ver FloatingBudget.tsx) cada vez que se añade un ítem con coste — vive fuera del
 * store porque es puramente un efecto visual efímero, no estado de la ruta (no debe persistirse ni
 * disparar un re-render de todo lo que lee `useRouteStore`). Quien añade el coste (useRouteStore.ts,
 * en cada acción que liga un ítem al presupuesto) llama a `triggerBudgetFly`; FloatingBudget.tsx es
 * el único suscriptor real.
 */
type Listener = (amount: number) => void

const listeners = new Set<Listener>()

export function triggerBudgetFly(amount: number): void {
  if (!amount) return
  listeners.forEach((listener) => listener(amount))
}

export function subscribeBudgetFly(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
