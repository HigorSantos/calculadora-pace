import type { Metadata } from "next"

import { CalculatorShell } from "@/components/calculators/calculator-shell"
import { TimeByDistancePaceCalculator } from "@/components/calculators/time-by-distance-pace-calculator"

export const metadata: Metadata = {
  title: "Tempo por distância e pace",
  description:
    "Calcule o tempo final estimado de uma corrida informando a distância em quilômetros e o pace médio por quilômetro.",
  alternates: {
    canonical: "/calculadoras/tempo-por-distancia-e-pace",
  },
  openGraph: {
    title: "Tempo por distância e pace | Arsenal do Corredor",
    description:
      "Calculadora para estimar o tempo total de corrida a partir da distância e do pace médio.",
    url: "https://arsenaldocorredor.com.br/calculadoras/tempo-por-distancia-e-pace",
  },
}

export default function TimeByDistancePacePage() {
  return (
    <CalculatorShell
      eyebrow="Calculadoras básicas"
      title="Tempo por distância e pace"
      description="Estime o tempo total da corrida a partir da distância planejada e do ritmo médio por quilômetro."
    >
      <TimeByDistancePaceCalculator />
    </CalculatorShell>
  )
}
