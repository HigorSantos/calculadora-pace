export type Lap = {
  /** distância do trecho em km (geralmente 1, menos no último parcial) */
  distance: number
  /** tempo do trecho em segundos */
  time: number
}

/** Converte segundos em "mm:ss" ou "h:mm:ss". */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/** Interpreta uma string de tempo ("25", "5:30", "1:05:00") em segundos. */
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === "") return null
  const parts = trimmed.split(":").map((p) => p.trim())
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null
  const nums = parts.map(Number)
  if (nums.some((n) => n < 0)) return null

  if (nums.length === 1) return Math.round(nums[0] * 60) // só minutos
  if (nums.length === 2) return nums[0] * 60 + nums[1] // mm:ss
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2] // h:mm:ss
  return null
}

/** Formata um pace (segundos por km) como "mm:ss /km". */
export function formatPace(secondsPerKm: number): string {
  return `${formatTime(secondsPerKm)} /km`
}

/** Cria os trechos (1 km cada, com último parcial se houver) para uma distância. */
export function buildDistances(distanceKm: number): number[] {
  if (distanceKm <= 0) return []
  const full = Math.floor(distanceKm + 1e-9)
  const remainder = Number((distanceKm - full).toFixed(3))
  const arr: number[] = Array(full).fill(1)
  if (remainder > 0.001) arr.push(remainder)
  if (arr.length === 0 && distanceKm > 0) arr.push(distanceKm)
  return arr
}

/** Estratégias de divisão do esforço ao longo da prova. */
export type Strategy = "constant" | "negative" | "positive"

/** Variação máxima de pace entre início e fim (fração do pace médio), padrão. */
export const DEFAULT_SPREAD = 0.08

/**
 * Divide o tempo alvo entre os trechos de acordo com a estratégia.
 *
 * - constant: mesmo pace em todos os trechos.
 * - negative: começa mais lento e termina mais rápido (split negativo).
 * - positive: começa mais rápido e termina mais lento (split positivo).
 *
 * @param spread variação máxima de pace entre início e fim (fração do pace
 *               médio). Ignorada na estratégia constante.
 *
 * O gradiente é aplicado de forma linear pela posição do trecho e depois
 * normalizado para que a soma dos tempos seja exatamente o tempo alvo.
 */
export function buildLaps(
  distanceKm: number,
  targetSeconds: number,
  strategy: Strategy = "constant",
  spread: number = DEFAULT_SPREAD,
): Lap[] {
  const distances = buildDistances(distanceKm)
  const total = distances.reduce((a, b) => a + b, 0)
  if (total === 0) return []

  // Tempo "bruto" de cada trecho com o fator de pace da estratégia.
  let covered = 0
  const raw = distances.map((distance) => {
    // posição central do trecho (0 = início, 1 = fim)
    const center = total > 1 ? (covered + distance / 2) / total : 0.5
    covered += distance
    let factor = 1
    if (strategy === "negative") factor = 1 + spread * (1 - 2 * center)
    else if (strategy === "positive") factor = 1 + spread * (2 * center - 1)
    return distance * factor
  })

  const rawSum = raw.reduce((a, b) => a + b, 0)
  const scale = rawSum > 0 ? targetSeconds / rawSum : 0
  return distances.map((distance, i) => ({
    distance,
    time: Math.round(raw[i] * scale),
  }))
}

/** Divide o tempo alvo igualmente entre os trechos (proporcional à distância). */
export function buildEqualLaps(distanceKm: number, targetSeconds: number): Lap[] {
  return buildLaps(distanceKm, targetSeconds, "constant")
}

/**
 * Recalcula os trechos após o usuário editar um trecho.
 *
 * @param laps          estado atual dos trechos
 * @param index         índice do trecho que foi editado
 * @param newTime       novo tempo (em segundos) para o trecho editado
 * @param targetSeconds tempo alvo total
 * @param recalc        se true, redistribui os trechos seguintes para manter o alvo
 */
/**
 * Item consumível durante a prova (gel, cápsula de sal, etc.).
 * As quantidades são por unidade consumida.
 */
export type Consumable = {
  id: string
  name: string
  /** carboidrato em gramas */
  carbs: number
  /** sódio em miligramas */
  sodium: number
  /** cafeína em miligramas */
  caffeine: number
}

/** Ações padrão disponíveis para adicionar aos trechos. */
export const DEFAULT_CONSUMABLES: Consumable[] = [
  { id: "gel-carbo-20", name: "Gel carbo 20g", carbs: 20, sodium: 0, caffeine: 0 },
  { id: "gel-carbo-30", name: "Gel carbo 30g", carbs: 30, sodium: 0, caffeine: 0 },
  { id: "gel-carbo-40", name: "Gel carbo 40g", carbs: 40, sodium: 0, caffeine: 0 },
  { id: "gel-carbo-30-sodio-200", name: "Gel carbo 30g + sódio 200mg", carbs: 30, sodium: 200, caffeine: 0 },
  { id: "gel-carbo-30-cafeina-150-sodio-300", name: "Gel carbo 30g + cafeína 150mg + sódio 300mg", carbs: 30, sodium: 300, caffeine: 150 },
  { id: "capsula-sal-300", name: "Cápsula de sal 300mg", carbs: 0, sodium: 300, caffeine: 0 },
]

/** Monta um resumo curto dos elementos de um consumível (ex.: "30g carbo · 200mg sódio"). */
export function consumableSummary(c: Consumable): string {
  const parts: string[] = []
  if (c.carbs > 0) parts.push(`${c.carbs}g carbo`)
  if (c.sodium > 0) parts.push(`${c.sodium}mg sódio`)
  if (c.caffeine > 0) parts.push(`${c.caffeine}mg cafeína`)
  return parts.join(" · ")
}

export type Nutrition = {
  carbs: number
  sodium: number
  caffeine: number
  /** quantidade total de itens consumidos */
  count: number
}

/**
 * Soma os elementos de todas as ações distribuídas pelos trechos.
 *
 * @param actions     mapa de índice do trecho → lista de ids de consumíveis
 * @param consumables catálogo de consumíveis disponível
 */
export function computeNutrition(
  actions: Record<number, string[]>,
  consumables: Consumable[],
): Nutrition {
  const byId = new Map(consumables.map((c) => [c.id, c]))
  const total: Nutrition = { carbs: 0, sodium: 0, caffeine: 0, count: 0 }
  for (const ids of Object.values(actions)) {
    for (const id of ids) {
      const c = byId.get(id)
      if (!c) continue
      total.carbs += c.carbs
      total.sodium += c.sodium
      total.caffeine += c.caffeine
      total.count += 1
    }
  }
  return total
}

/** Converte um total em valor por hora, dado o tempo total em segundos. */
export function perHour(amount: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0
  return (amount / totalSeconds) * 3600
}

export function applyLapEdit(
  laps: Lap[],
  index: number,
  newTime: number,
  targetSeconds: number,
  recalc: boolean,
): Lap[] {
  const next = laps.map((l) => ({ ...l }))
  next[index].time = Math.max(0, Math.round(newTime))

  if (!recalc) return next

  // Trechos anteriores e o editado ficam fixos; os seguintes se ajustam.
  const fixedSum = next.slice(0, index + 1).reduce((a, l) => a + l.time, 0)
  const remainingLaps = next.slice(index + 1)
  if (remainingLaps.length === 0) return next

  const remainingDistance = remainingLaps.reduce((a, l) => a + l.distance, 0)
  const remainingTime = Math.max(0, targetSeconds - fixedSum)
  if (remainingDistance === 0) return next

  const pace = remainingTime / remainingDistance
  for (let i = index + 1; i < next.length; i++) {
    next[i].time = Math.round(pace * next[i].distance)
  }
  return next
}
