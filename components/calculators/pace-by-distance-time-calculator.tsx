"use client";

import {useMemo, useState} from "react";
import {Clock, Gauge, Route, Timer} from "lucide-react";

import {CalculatorResultCard} from "@/components/calculators/calculator-result-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	calculatePaceFromDistanceAndTime,
	formatDistance,
	formatPace,
	formatSpeed,
	formatTime,
	paceToSpeed,
	parseTime,
} from "@/lib/pace";

const PRESETS = [
	{label: "5 km", distance: "5", time: "25:00"},
	{label: "10 km", distance: "10", time: "50:00"},
	{label: "Meia", distance: "21,1", time: "1:50:00"},
	{label: "Maratona", distance: "42,195", time: "4:00:00"},
];

function parseDistance(input: string): number | null {
	const normalized = input.trim().replace(",", ".");
	if (normalized === "") return null;
	const value = Number(normalized);
	if (!Number.isFinite(value) || value <= 0) return null;
	return value;
}

export function PaceByDistanceTimeCalculator({
	initialDistance = "10",
	initialTime = "50:00",
}: {
	initialDistance?: string;
	initialTime?: string;
}) {
	const [distanceInput, setDistanceInput] = useState(initialDistance);
	const [timeInput, setTimeInput] = useState(initialTime);

	const result = useMemo(() => {
		const distance = parseDistance(distanceInput);
		const totalSeconds = parseTime(timeInput);
		const paceSeconds =
			distance == null || totalSeconds == null
				? null
				: calculatePaceFromDistanceAndTime(distance, totalSeconds);

		return {
			distance,
			totalSeconds,
			paceSeconds,
			speed: paceSeconds == null ? null : paceToSpeed(paceSeconds),
		};
	}, [distanceInput, timeInput]);

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setDistanceInput(preset.distance);
		setTimeInput(preset.time);
	}

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg border border-border bg-card p-4 text-card-foreground'>
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='pace-distance' className='text-xs'>
							Distância (km)
						</Label>
						<Input
							id='pace-distance'
							inputMode='decimal'
							value={distanceInput}
							onChange={event => setDistanceInput(event.target.value)}
							placeholder='10'
							className='h-9'
						/>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='pace-time' className='text-xs'>
							Tempo total
						</Label>
						<Input
							id='pace-time'
							value={timeInput}
							onChange={event => setTimeInput(event.target.value)}
							placeholder='50:00'
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
					</div>
				</div>
			</div>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
				<CalculatorResultCard
					icon={<Gauge className='size-5' />}
					label='Pace estimado'
					value={
						result.paceSeconds != null ? formatPace(result.paceSeconds) : "--"
					}
					featured
				/>

				<div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-1'>
					<CalculatorResultCard
						icon={<Clock className='size-4' />}
						label='Tempo'
						value={
							result.totalSeconds != null
								? formatTime(result.totalSeconds)
								: "--"
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
						icon={<Timer className='size-4' />}
						label='Velocidade média'
						value={formatSpeed(result.speed)}
					/>
				</div>
			</div>
		</div>
	);
}
