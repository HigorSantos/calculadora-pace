import type {Metadata} from "next";

import {CalculatorShell} from "@/components/calculators/calculator-shell";
import {PaceByDistanceTimeCalculator} from "@/components/calculators/pace-by-distance-time-calculator";

export const metadata: Metadata = {
	title: "Pace por distância e tempo",
	description:
		"Calcule o pace médio de uma corrida informando a distância planejada e o tempo total.",
	alternates: {
		canonical: "/calculadoras/pace-por-distancia-e-tempo",
	},
	openGraph: {
		title: "Pace por distância e tempo | Arsenal do Corredor",
		description:
			"Calculadora para descobrir o pace médio a partir da distância e do tempo total de corrida.",
		url: "https://arsenaldocorredor.com.br/calculadoras/pace-por-distancia-e-tempo",
	},
};

export default function PaceByDistanceTimePage() {
	return (
		<CalculatorShell
			eyebrow='Calculadoras básicas'
			title='Pace por distância e tempo'
			description='Descubra o ritmo médio na unidade selecionada (pace) a partir da distância percorrida e do tempo total da corrida.'
		>
			<PaceByDistanceTimeCalculator />
		</CalculatorShell>
	);
}
