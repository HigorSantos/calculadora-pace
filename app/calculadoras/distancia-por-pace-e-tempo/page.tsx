import type {Metadata} from "next";

import {CalculatorShell} from "@/components/calculators/calculator-shell";
import {DistanceByPaceTimeCalculator} from "@/components/calculators/distance-by-pace-time-calculator";

export const metadata: Metadata = {
	title: "Distância por pace e tempo",
	description:
		"Calcule a distância estimada de uma corrida informando o pace médio e o tempo total.",
	alternates: {
		canonical: "/calculadoras/distancia-por-pace-e-tempo",
	},
	openGraph: {
		title: "Distância por pace e tempo | Arsenal do Corredor",
		description:
			"Calculadora para descobrir a distância percorrida a partir do pace médio e do tempo total.",
		url: "https://arsenaldocorredor.com.br/calculadoras/distancia-por-pace-e-tempo",
	},
};

export default function DistanceByPaceTimePage() {
	return (
		<CalculatorShell
			eyebrow='Calculadoras básicas'
			title='Distância por pace e tempo'
			description='Estime a distância que você percorrerá a partir do ritmo médio na unidade selecionada e do tempo total da corrida.'
		>
			<DistanceByPaceTimeCalculator />
		</CalculatorShell>
	);
}
