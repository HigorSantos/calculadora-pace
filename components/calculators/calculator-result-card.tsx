import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function CalculatorResultCard({
	icon,
	label,
	value,
	featured = false,
}: {
	icon: ReactNode;
	label: string;
	value: string;
	featured?: boolean;
}) {
	return (
		<Card
			className={`justify-between p-5 ${
				featured
					? "min-h-40 max-h-52 border-primary/35 bg-primary/5 sm:p-7"
					: ""
			}`}
		>
			<div className='flex items-center justify-between gap-3 text-muted-foreground'>
				<span className='text-xs font-medium uppercase tracking-wide'>
					{label}
				</span>
				<div className='flex flex-row gap-6 justify-around items-end'>
					{!featured && (
						<span className='tabular-nums justify-self-end'>{value}</span>
					)}
					<span className='text-primary'>{icon}</span>
				</div>
			</div>
			{featured && (
				<div className='mt-6 font-mono font-semibold tabular-nums tracking-tight text-foreground text-5xl sm:text-6xl lg:text-7xl'>
					{value}
				</div>
			)}
		</Card>
	);
}
