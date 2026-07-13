import {Utensils} from "lucide-react";

import {Card} from "@/components/ui/card";
import {useUnitSystem} from "@/components/unit-system-provider";
import {perHour} from "@/lib/pace";
import {formatDisplayMass} from "@/lib/units";

export function NutritionSummary({
	nutrition,
	totalSeconds,
}: {
	nutrition: {carbs: number; sodium: number; caffeine: number; count: number};
	totalSeconds: number;
}) {
	const {unitSystem} = useUnitSystem();

	const items: {label: string; total: string; rate: string}[] = [
		{
			label: "Carboidrato",
			total: formatDisplayMass(nutrition.carbs, "g", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.carbs, totalSeconds),
				"g",
				unitSystem,
			)}/h`,
		},
		{
			label: "Sódio",
			total: formatDisplayMass(nutrition.sodium, "mg", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.sodium, totalSeconds),
				"mg",
				unitSystem,
			)}/h`,
		},
		{
			label: "Cafeína",
			total: formatDisplayMass(nutrition.caffeine, "mg", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.caffeine, totalSeconds),
				"mg",
				unitSystem,
			)}/h`,
		},
	];

	return (
		<Card className='overflow-hidden p-0'>
			<div className='flex shrink-0 items-center gap-2 border-b border-border px-5 py-4'>
				<Utensils className='size-4 text-primary' />
				<h2 className='font-semibold'>Total consumido</h2>
				<span className='ml-auto text-sm text-muted-foreground'>
					{nutrition.count} {nutrition.count === 1 ? "item" : "itens"}
				</span>
			</div>
			{nutrition.count === 0 ? (
				<p className='px-5 py-8 text-center text-sm text-muted-foreground'>
					Adicione ações aos trechos para ver o resumo nutricional.
				</p>
			) : (
				<div className='grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
					{items.map(item => (
						<div key={item.label} className='px-5 py-4'>
							<span className='text-xs font-medium text-muted-foreground'>
								{item.label}
							</span>
							<div className='mt-1 font-mono text-2xl font-semibold tabular-nums'>
								{item.total}
							</div>
							<div className='mt-0.5 text-sm text-muted-foreground'>
								{item.rate}
							</div>
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
