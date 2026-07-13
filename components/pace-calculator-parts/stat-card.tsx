import {Card} from "@/components/ui/card";

export function StatCard({
	label,
	value,
	tone = "neutral",
	detail,
	detailTone = "neutral",
	className = "",
}: {
	label: string;
	value: string;
	tone?: "neutral" | "ok" | "over" | "under";
	detail?: string;
	detailTone?: "neutral" | "ok" | "over" | "under";
	className?: string;
}) {
	function toneClassFor(currentTone: "neutral" | "ok" | "over" | "under") {
		return currentTone === "over"
			? "text-destructive"
			: currentTone === "under"
				? "text-chart-2"
				: currentTone === "ok"
					? "text-foreground"
					: "text-muted-foreground";
	}

	const toneClass = toneClassFor(tone);
	const detailToneClass = toneClassFor(detailTone);
	return (
		<Card className={`gap-1 p-4 ${className}`}>
			<span className='text-sm font-medium text-muted-foreground'>{label}</span>
			<span
				className={`font-mono text-2xl font-semibold tabular-nums ${toneClass}`}
			>
				{value}
			</span>
			{detail ? (
				<span className={`text-sm font-medium ${detailToneClass}`}>
					{detail}
				</span>
			) : null}
		</Card>
	);
}
