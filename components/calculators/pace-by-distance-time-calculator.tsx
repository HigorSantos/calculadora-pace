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
	calculatePaceFromDistanceAndTime,
	formatTime,
	paceToSpeed,
	parseTime,
} from "@/lib/pace";
import {
	distanceUnitLabel,
	formatDisplayDistance,
	formatDisplayNumber,
	formatDisplayPace,
	formatDisplaySpeed,
	fromDisplayDistance,
	paceUnitLabel,
	parseDisplayDistance,
	toDisplayDistance,
	toDisplayPace,
} from "@/lib/units";

const PRESETS = [
	{label: null, distance: 5, time: "25:00"},
	{label: null, distance: 10, time: "50:00"},
	{label: "Meia", distance: 21.1, time: "1:50:00"},
	{label: "Maratona", distance: 42.195, time: "4:00:00"},
];


function formatDisplayDistanceInput(distanceKm: number, unitSystem: "metric" | "imperial") {
	return formatDisplayNumber(toDisplayDistance(distanceKm, unitSystem), {
		maximumFractionDigits: 3,
	}).replace(".", ",");
}

function formatPresetDistanceInput(distanceKm: number, unitSystem: "metric" | "imperial") {
	return formatDisplayDistanceInput(distanceKm, unitSystem);
}

function presetLabel(preset: (typeof PRESETS)[number], unitSystem: "metric" | "imperial") {
	return preset.label ?? formatDisplayDistance(preset.distance, unitSystem);
}

export function PaceByDistanceTimeCalculator({
	initialDistance = "10",
	initialTime = "50:00",
}: {
	initialDistance?: string;
	initialTime?: string;
}) {
	const {unitSystem} = useUnitSystem();
	const {values, setValue, setValues, isHydrated} = useQueryStringState({
		distance: initialDistance,
		time: initialTime,
	});
	const distanceInput = values.distance;
	const timeInput = values.time;

	const previousUnitSystem = useRef(unitSystem);

	useEffect(() => {
		const previous = previousUnitSystem.current;
		if (!isHydrated || previous === unitSystem) return;

		const displayDistance = Number(distanceInput.trim().replace(",", "."));
		if (Number.isFinite(displayDistance) && displayDistance > 0) {
			const distanceKm = fromDisplayDistance(displayDistance, previous);
			setValue("distance", formatDisplayDistanceInput(distanceKm, unitSystem));
		}

		previousUnitSystem.current = unitSystem;
	}, [distanceInput, isHydrated, setValue, unitSystem]);

	const result = useMemo(() => {
		const distance = parseDisplayDistance(distanceInput, unitSystem);
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
	}, [distanceInput, timeInput, unitSystem]);

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setValues({
			distance: formatPresetDistanceInput(preset.distance, unitSystem),
			time: preset.time,
		});
	}

	const isLoading = !isHydrated;

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg border border-border bg-card p-4 text-card-foreground'>
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='pace-distance' className='text-xs'>
							Distância ({distanceUnitLabel(unitSystem)})
						</Label>
						<Input
							id='pace-distance'
							inputMode='decimal'
							value={distanceInput}
							onChange={event => setValue("distance", event.target.value)}
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
							onChange={event => setValue("time", event.target.value)}
							placeholder='50:00'
							className='h-9 font-mono tabular-nums'
						/>
					</div>

					<div className='flex flex-row gap-2 sm:justify-end'>
						{PRESETS.map(preset => (
							<Button
								key={`${preset.label ?? preset.distance}`}
								type='button'
								variant='outline'
								size='sm'
								onClick={() => applyPreset(preset)}
							>
								{presetLabel(preset, unitSystem)}
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
						icon={<Gauge className='size-5' />}
						label='Pace estimado'
						value={
							result.paceSeconds != null
								? formatDisplayPace(result.paceSeconds, unitSystem)
								: "--"
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
									? formatDisplayDistance(result.distance, unitSystem)
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
