export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60).toString().padStart(2, '0')
  const mm = (wrapped % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(parseTimeToMinutes(time) + minutes)
}
