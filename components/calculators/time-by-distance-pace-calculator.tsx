"use client";

import {useEffect, useMemo, useRef} from "react";
import {Gauge, Route, Timer} from "lucide-react";

import {CalculatorResultCard} from "@/components/calculators/calculator-result-card";
import {useQueryStringState} from "@/hooks/use-query-string-state";
import {useUnitSystem} from "@/components/unit-system-provider";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	calculateTimeFromDistanceAndPace,
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
	fromDisplayPace,
	paceUnitLabel,
	parseDisplayDistance,
	toDisplayDistance,
	toDisplayPace,
} from "@/lib/units";

const PRESETS = [
	{label: null, distance: 5, pace: "5:00"},
	{label: null, distance: 10, pace: "5:00"},
	{label: "Meia", distance: 21.1, pace: "5:15"},
	{label: "Maratona", distance: 42.195, pace: "5:30"},
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

export function TimeByDistancePaceCalculator({
	initialDistance = "10",
	initialPace = "5:00",
}: {
	initialDistance?: string;
	initialPace?: string;
}) {
	const {unitSystem} = useUnitSystem();
	const {values, setValue, setValues, isHydrated} = useQueryStringState({
		distance: initialDistance,
		pace: initialPace,
	});
	const distanceInput = values.distance;
	const paceInput = values.pace;

	const previousUnitSystem = useRef(unitSystem);

	useEffect(() => {
		const previous = previousUnitSystem.current;
		if (!isHydrated || previous === unitSystem) return;

		const displayDistance = Number(distanceInput.trim().replace(",", "."));
		const displayPace = parseTime(paceInput);
		const nextValues: Partial<typeof values> = {};

		if (Number.isFinite(displayDistance) && displayDistance > 0) {
			const distanceKm = fromDisplayDistance(displayDistance, previous);
			nextValues.distance = formatDisplayDistanceInput(distanceKm, unitSystem);
		}

		if (displayPace != null && displayPace > 0) {
			const paceSecondsPerKm = fromDisplayPace(displayPace, previous);
			nextValues.pace = formatTime(toDisplayPace(paceSecondsPerKm, unitSystem));
		}

		previousUnitSystem.current = unitSystem;
		if (Object.keys(nextValues).length > 0) setValues(nextValues);
	}, [distanceInput, isHydrated, paceInput, setValues, unitSystem, values]);

	const result = useMemo(() => {
		const distance = parseDisplayDistance(distanceInput, unitSystem);
		const displayPaceSeconds = parseTime(paceInput);
		const paceSeconds =
			displayPaceSeconds == null
				? null
				: fromDisplayPace(displayPaceSeconds, unitSystem);
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
	}, [distanceInput, paceInput, unitSystem]);

	const hasResult = result.totalSeconds != null;

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setValues({
			distance: formatPresetDistanceInput(preset.distance, unitSystem),
			pace: preset.pace,
		});
	}

	const isLoading = !isHydrated;

	return (
		<div className='grid gap-4'>
			<div className='rounded-lg space-y-4 border border-border bg-card p-4 text-card-foreground'>
				<div className='grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 sm:items-end'>
					<div className='space-y-1.5'>
						<Label htmlFor='basic-distance' className='text-xs'>
							Distância ({distanceUnitLabel(unitSystem)})
						</Label>
						<Input
							id='basic-distance'
							inputMode='decimal'
							value={distanceInput}
							onChange={event => setValue("distance", event.target.value)}
							placeholder='10'
							className='h-9'
						/>
					</div>
					<div className='space-y-1.5'>
						<Label htmlFor='basic-pace' className='text-xs'>
							Pace médio ({paceUnitLabel(unitSystem)})
						</Label>
						<Input
							id='basic-pace'
							value={paceInput}
							onChange={event => setValue("pace", event.target.value)}
							placeholder='5:00'
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
								result.paceSeconds != null
									? formatDisplayPace(result.paceSeconds, unitSystem)
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
							icon={<Gauge className='size-4' />}
							label='Velocidade média'
							value={formatDisplaySpeed(result.speed, unitSystem)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
