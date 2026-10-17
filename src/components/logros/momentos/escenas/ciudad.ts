/** La silueta de Roma (Coliseo, Foro, Panteón) que comparten «Madrugador» y «Nocturno»: el trazo del cielo (con sus huecos) y dónde van las ventanas que se encienden. */
export function silueta(): { sk: string; wins: [number, number][] } {
  const arch: string[] = []
  const wins: [number, number][] = []
  for (let x = 20; x <= 104; x += 14) {
    arch.push(`M${x} 552a4 4 0 0 1 8 0v8h-8z`)
    wins.push([x + 4, 557])
  }
  for (let x = 20; x <= 132; x += 14) {
    arch.push(`M${x} 580a4 4 0 0 1 8 0v10h-8z`)
    wins.push([x + 4, 586])
  }
  for (let x = 20; x <= 132; x += 14) {
    arch.push(`M${x} 604a4 4 0 0 1 8 0v10h-8z`)
    wins.push([x + 4, 610])
  }
  const holes = 'M168 570h6v48h-6zM182 570h6v48h-6zM196 570h6v48h-6zM248 590h5v28h-5zM260 590h5v28h-5zM272 590h5v28h-5zM284 590h5v28h-5z' + arch.join('')
  const sk = 'M0 844V620H10V532Q70 508 122 522V540H136V556H150V620H158V562H210V620H238V586L270 566L302 586V578H296V572A42 42 0 0 1 380 572V578H374V620H390V844ZM334 530h8v-8h-8z' + holes
  ;([[171, 594], [185, 594], [199, 594], [250.5, 604], [262.5, 604], [274.5, 604], [286.5, 604]] as [number, number][]).forEach((w) => wins.push(w))
  return { sk, wins: wins.filter((_, k) => k % 2 === 0 || k >= wins.length - 7) }
}
