import {parseTime, type Consumable, type Strategy} from "@/lib/pace";
import {formatDisplayMass, fromDisplayPace, type UnitSystem} from "@/lib/units";

export const STRATEGIES: {value: Strategy; label: string; hint: string}[] = [
	{
		value: "constant",
		label: "Split constante",
		hint: "Mesmo ritmo em todos os trechos.",
	},
	{
		value: "negative",
		label: "Split negativo",
		hint: "Começa mais lento e termina mais rápido.",
	},
	{
		value: "positive",
		label: "Split positivo",
		hint: "Começa mais rápido e termina mais lento.",
	},
];

export type TargetMode = "time" | "pace";

export const DEFAULT_DISTANCE_INPUT = "10";
export const DEFAULT_TARGET_MODE: TargetMode = "time";
export const DEFAULT_TARGET_VALUE = "50:00";
export const DEFAULT_PACE_VALUE = "5:00";
export const DEFAULT_STRATEGY: Strategy = "constant";

export function normalizeTargetMode(value: string): TargetMode {
	return value === "pace" ? "pace" : "time";
}

export function normalizeStrategy(value: string): Strategy {
	return STRATEGIES.some(strategy => strategy.value === value)
		? (value as Strategy)
		: DEFAULT_STRATEGY;
}

export function resolveTargetSeconds(
	mode: TargetMode,
	distanceKm: number,
	timeInput: string,
	paceInput: string,
	unitSystem: UnitSystem,
): number | null {
	if (mode === "pace") {
		const displayPace = parseTime(paceInput);
		const pace =
			displayPace == null ? null : fromDisplayPace(displayPace, unitSystem);
		if (pace == null || pace <= 0 || distanceKm <= 0) return null;
		return Math.round(distanceKm * pace);
	}
	return parseTime(timeInput);
}

export type Preset = {distance: number; time: string};

export const PRESETS: Preset[] = [
	{distance: 5, time: "25:00"},
	{distance: 10, time: "50:00"},
	{distance: 21.1, time: "1:45:00"},
	{distance: 42.2, time: "3:45:00"},
];

let consumableSeq = 0;
export function newConsumableId() {
	consumableSeq += 1;
	return `custom-${Date.now()}-${consumableSeq}`;
}

export function parsePositiveInteger(input: string): number | null {
	const parsed = Number(input);
	if (!Number.isInteger(parsed) || parsed <= 0) return null;
	return parsed;
}

export function consumableSummaryForUnit(
	c: Consumable,
	unitSystem: UnitSystem,
): string {
	const parts: string[] = [];
	if (c.carbs > 0)
		parts.push(`${formatDisplayMass(c.carbs, "g", unitSystem)} carbo`);
	if (c.sodium > 0)
		parts.push(`${formatDisplayMass(c.sodium, "mg", unitSystem)} sódio`);
	if (c.caffeine > 0)
		parts.push(`${formatDisplayMass(c.caffeine, "mg", unitSystem)} cafeína`);
	return parts.join(" · ");
}
