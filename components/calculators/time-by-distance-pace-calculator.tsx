"use client";

import {useMemo, useState} from "react";
import {Gauge, Route, Timer} from "lucide-react";

import {CalculatorResultCard} from "@/components/calculators/calculator-result-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	calculateTimeFromDistanceAndPace,
	formatDistance,
	formatPace,
	formatSpeed,
	formatTime,
	paceToSpeed,
	parseTime,
} from "@/lib/pace";

const PRESETS = [
	{label: "5 km", distance: "5", pace: "5:00"},
	{label: "10 km", distance: "10", pace: "5:00"},
	{label: "Meia", distance: "21,1", pace: "5:15"},
	{label: "Maratona", distance: "42,195", pace: "5:30"},
];

function parseDistance(input: string): number | null {
	const normalized = input.trim().replace(",", ".");
	if (normalized === "") return null;
	const value = Number(normalized);
	if (!Number.isFinite(value) || value <= 0) return null;
	return value;
}

export function TimeByDistancePaceCalculator({
	initialDistance = "10",
	initialPace = "5:00",
}: {
	initialDistance?: string;
	initialPace?: string;
}) {
	const [distanceInput, setDistanceInput] = useState(initialDistance);
	const [paceInput, setPaceInput] = useState(initialPace);

	const result = useMemo(() => {
		const distance = parseDistance(distanceInput);
		const paceSeconds = parseTime(paceInput);
		const totalSeconds =
			distance == null || paceSeconds == null
				? null
				: calculateTimeFromDistanceAndPace(distance, paceSeconds);

		return {
			distance,
			paceSeconds,
			totalSeconds,
			speed: paceSeconds == null ? null : paceToSpeed(paceSeconds),
		};
	}, [distanceInput, paceInput]);

	const hasResult = result.totalSeconds != null;

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setDistanceInput(preset.distance);
		setPaceInput(preset.pace);
	}

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg space-y-4 border border-border bg-card p-4 text-card-foreground'>
				<div className='grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='basic-distance' className='text-xs'>
							Distância (km)
						</Label>
						<Input
							id='basic-distance'
							inputMode='decimal'
							value={distanceInput}
							onChange={event => setDistanceInput(event.target.value)}
							placeholder='10'
							className='h-9'
						/>
					</div>
					<div className='space-y-1.5'>
						<Label htmlFor='basic-pace' className='text-xs'>
							Pace médio
						</Label>
						<Input
							id='basic-pace'
							value={paceInput}
							onChange={event => setPaceInput(event.target.value)}
							placeholder='5:00'
							className='h-9 font-mono tabular-nums'
						/>
					</div>
					<div className='flex flex-row gap-2 sm:justify-end'>
						{PRESETS.map(preset => (
							<Button
								key={preset.label}
								type='button'
								variant='outline'
								size='sm'
								onClick={() => applyPreset(preset)}
							>
								{preset.label}
							</Button>
						))}
					</div>{" "}
				</div>
			</div>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
				<CalculatorResultCard
					icon={<Timer className='size-5' />}
					label='Tempo estimado'
					value={hasResult ? formatTime(result.totalSeconds!) : "--"}
					featured
				/>

				<div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-1'>
					<CalculatorResultCard
						icon={<Gauge className='size-4' />}
						label='Pace'
						value={
							result.paceSeconds != null ? formatPace(result.paceSeconds) : "--"
						}
					/>
					<CalculatorResultCard
						icon={<Route className='size-4' />}
						label='Distância'
						value={
							result.distance != null
								? `${formatDistance(result.distance)} km`
								: "--"
						}
					/>
					<CalculatorResultCard
						icon={<Gauge className='size-4' />}
						label='Velocidade média'
						value={formatSpeed(result.speed)}
					/>
				</div>
			</div>
		</div>
	);
}
