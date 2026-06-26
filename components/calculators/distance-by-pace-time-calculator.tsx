"use client";

import {useMemo, useState} from "react";
import {Clock, Gauge, Route, Timer} from "lucide-react";

import {CalculatorResultCard} from "@/components/calculators/calculator-result-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	calculateDistanceFromPaceAndTime,
	formatDistance,
	formatPace,
	formatSpeed,
	formatTime,
	paceToSpeed,
	parseTime,
} from "@/lib/pace";

const PRESETS = [
	{label: "30 min", pace: "5:00", time: "30:00"},
	{label: "45 min", pace: "5:30", time: "45:00"},
	{label: "1 hora", pace: "6:00", time: "1:00:00"},
	{label: "Longo", pace: "5:45", time: "1:30:00"},
];

export function DistanceByPaceTimeCalculator({
	initialPace = "5:00",
	initialTime = "50:00",
}: {
	initialPace?: string;
	initialTime?: string;
}) {
	const [paceInput, setPaceInput] = useState(initialPace);
	const [timeInput, setTimeInput] = useState(initialTime);

	const result = useMemo(() => {
		const paceSeconds = parseTime(paceInput);
		const totalSeconds = parseTime(timeInput);
		const distance =
			paceSeconds == null || totalSeconds == null
				? null
				: calculateDistanceFromPaceAndTime(paceSeconds, totalSeconds);

		return {
			paceSeconds,
			totalSeconds,
			distance,
			speed: paceSeconds == null ? null : paceToSpeed(paceSeconds),
		};
	}, [paceInput, timeInput]);

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setPaceInput(preset.pace);
		setTimeInput(preset.time);
	}

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg border border-border bg-card p-4 text-card-foreground'>
				<div className='grid gap-3 grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='distance-pace' className='text-xs'>
							Pace médio
						</Label>
						<Input
							id='distance-pace'
							value={paceInput}
							onChange={event => setPaceInput(event.target.value)}
							placeholder='5:00'
							className='h-9 font-mono tabular-nums'
						/>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='distance-time' className='text-xs'>
							Tempo total
						</Label>
						<Input
							id='distance-time'
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
					icon={<Route className='size-5' />}
					label='Distância estimada'
					value={
						result.distance != null
							? `${formatDistance(result.distance)} km`
							: "--"
					}
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
						icon={<Clock className='size-4' />}
						label='Tempo'
						value={
							result.totalSeconds != null
								? formatTime(result.totalSeconds)
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
