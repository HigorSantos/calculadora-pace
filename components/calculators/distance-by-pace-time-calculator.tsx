"use client";

import {useEffect, useMemo, useRef} from "react";
import {Clock, Gauge, Route, Timer} from "lucide-react";

import {CalculatorResultCard} from "@/components/calculators/calculator-result-card";
import {useQueryStringState} from "@/hooks/use-query-string-state";
import {useUnitSystem} from "@/components/unit-system-provider";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	calculateDistanceFromPaceAndTime,
	formatTime,
	paceToSpeed,
	parseTime,
} from "@/lib/pace";
import {
	formatDisplayDistance,
	formatDisplayPace,
	formatDisplaySpeed,
	fromDisplayPace,
	paceUnitLabel,
	toDisplayPace,
} from "@/lib/units";

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
	const {unitSystem} = useUnitSystem();
	const {values, setValue, setValues, isHydrated} = useQueryStringState({
		pace: initialPace,
		time: initialTime,
	});
	const paceInput = values.pace;
	const timeInput = values.time;

	const previousUnitSystem = useRef(unitSystem);

	useEffect(() => {
		const previous = previousUnitSystem.current;
		if (!isHydrated || previous === unitSystem) return;

		const displayPace = parseTime(paceInput);
		if (displayPace != null && displayPace > 0) {
			const paceSecondsPerKm = fromDisplayPace(displayPace, previous);
			setValue("pace", formatTime(toDisplayPace(paceSecondsPerKm, unitSystem)));
		}

		previousUnitSystem.current = unitSystem;
	}, [isHydrated, paceInput, setValue, unitSystem]);

	const result = useMemo(() => {
		const displayPaceSeconds = parseTime(paceInput);
		const paceSeconds =
			displayPaceSeconds == null
				? null
				: fromDisplayPace(displayPaceSeconds, unitSystem);
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
	}, [paceInput, timeInput, unitSystem]);

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setValues({pace: preset.pace, time: preset.time});
	}

	const isLoading = !isHydrated;

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg border border-border bg-card p-4 text-card-foreground'>
				<div className='grid gap-3 grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='distance-pace' className='text-xs'>
							Pace médio ({paceUnitLabel(unitSystem)})
						</Label>
						<Input
							id='distance-pace'
							value={paceInput}
							onChange={event => setValue("pace", event.target.value)}
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
							onChange={event => setValue("time", event.target.value)}
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

			<div className='relative'>
				{isLoading ? (
					<div className='absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm'>
						<div className='flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium shadow-sm'>
							<div className='size-2.5 animate-pulse rounded-full bg-primary' />
							<span>Calculando...</span>
						</div>
					</div>
				) : null}

				<div
					className={`grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] ${
						isLoading ? "opacity-60 blur-[1px]" : ""
					}`}
				>
					<CalculatorResultCard
						icon={<Route className='size-5' />}
						label='Distância estimada'
						value={
							result.distance != null
								? formatDisplayDistance(result.distance, unitSystem)
								: "--"
						}
						featured
					/>

					<div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-1'>
						<CalculatorResultCard
							icon={<Gauge className='size-4' />}
							label='Pace'
							value={
								result.paceSeconds != null
									? formatDisplayPace(result.paceSeconds, unitSystem)
									: "--"
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
							value={formatDisplaySpeed(result.speed, unitSystem)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
