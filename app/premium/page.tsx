import {Suspense} from "react";

import {PremiumUpgradePage} from "@/components/premium-upgrade-page";

export const metadata = {
	title: "Premium | Arsenal do Corredor",
	description:
		"Assine o Arsenal do Corredor Premium para planejar ritmo, hidratação, carboidrato e estratégia de prova sem limites.",
};

export default function Page() {
	return (
		<Suspense fallback={null}>
			<PremiumUpgradePage />
		</Suspense>
	);
}
