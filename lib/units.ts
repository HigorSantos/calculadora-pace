export type UnitSystem = "metric" | "imperial";

export const UNIT_SYSTEM_STORAGE_KEY = "arsenal-unit-system";

const KM_TO_MILES = 0.6213711922;
const GRAMS_TO_OUNCES = 0.03527396195;

function formatUnitTime(totalSeconds: number): string {
	const safe = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(safe / 3600);
	const m = Math.floor((safe % 3600) / 60);
	const s = safe % 60;
	const pad = (n: number) => n.toString().padStart(2, "0");
	if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
	return `${pad(m)}:${pad(s)}`;
}

export function isUnitSystem(value: string | null): value is UnitSystem {
	return value === "metric" || value === "imperial";
}

export function distanceUnitLabel(unitSystem: UnitSystem): "km" | "mi" {
	return unitSystem === "imperial" ? "mi" : "km";
}

export function speedUnitLabel(unitSystem: UnitSystem): "km/h" | "mph" {
	return unitSystem === "imperial" ? "mph" : "km/h";
}

export function paceUnitLabel(unitSystem: UnitSystem): "/km" | "/mi" {
	return unitSystem === "imperial" ? "/mi" : "/km";
}

export function toDisplayDistance(distanceKm: number, unitSystem: UnitSystem) {
	return unitSystem === "imperial" ? distanceKm * KM_TO_MILES : distanceKm;
}

export function fromDisplayDistance(distance: number, unitSystem: UnitSystem) {
	return unitSystem === "imperial" ? distance / KM_TO_MILES : distance;
}

export function toDisplayPace(secondsPerKm: number, unitSystem: UnitSystem) {
	return unitSystem === "imperial" ? secondsPerKm / KM_TO_MILES : secondsPerKm;
}

export function fromDisplayPace(secondsPerUnit: number, unitSystem: UnitSystem) {
	return unitSystem === "imperial" ? secondsPerUnit * KM_TO_MILES : secondsPerUnit;
}

export function toDisplaySpeed(speedKmh: number, unitSystem: UnitSystem) {
	return unitSystem === "imperial" ? speedKmh * KM_TO_MILES : speedKmh;
}

export function toDisplayMass(
	value: number,
	sourceUnit: "g" | "mg",
	unitSystem: UnitSystem,
) {
	if (unitSystem === "metric") return value;
	const grams = sourceUnit === "mg" ? value / 1000 : value;
	return grams * GRAMS_TO_OUNCES;
}

export function massUnitLabel(
	sourceUnit: "g" | "mg",
	unitSystem: UnitSystem,
): "g" | "mg" | "oz" {
	return unitSystem === "imperial" ? "oz" : sourceUnit;
}

export function formatDisplayNumber(
	value: number,
	options: {maximumFractionDigits?: number; minimumFractionDigits?: number} = {},
) {
	return value.toLocaleString("pt-BR", {
		maximumFractionDigits: options.maximumFractionDigits ?? 2,
		minimumFractionDigits: options.minimumFractionDigits ?? 0,
	});
}

export function formatDisplayDistance(
	distanceKm: number,
	unitSystem: UnitSystem,
) {
	const value = toDisplayDistance(distanceKm, unitSystem);
	return `${formatDisplayNumber(value, {
		maximumFractionDigits: 2,
		minimumFractionDigits: value % 1 === 0 ? 0 : 1,
	})} ${distanceUnitLabel(unitSystem)}`;
}

export function formatDisplayPace(secondsPerKm: number, unitSystem: UnitSystem) {
	return `${formatUnitTime(toDisplayPace(secondsPerKm, unitSystem))} ${paceUnitLabel(
		unitSystem,
	)}`;
}

export function formatDisplaySpeed(speedKmh: number | null, unitSystem: UnitSystem) {
	if (speedKmh == null) return "--";
	return `${formatDisplayNumber(toDisplaySpeed(speedKmh, unitSystem), {
		maximumFractionDigits: 2,
		minimumFractionDigits: 1,
	})} ${speedUnitLabel(unitSystem)}`;
}

export function parseDisplayDistance(input: string, unitSystem: UnitSystem) {
	const normalized = input.trim().replace(",", ".");
	if (normalized === "") return null;
	const value = Number(normalized);
	if (!Number.isFinite(value) || value <= 0) return null;
	return fromDisplayDistance(value, unitSystem);
}

export function formatDisplayMass(
	value: number,
	sourceUnit: "g" | "mg",
	unitSystem: UnitSystem,
) {
	const displayValue = toDisplayMass(value, sourceUnit, unitSystem);
	const maximumFractionDigits =
		unitSystem === "imperial" && displayValue < 0.1 ? 4 : 2;
	return `${formatDisplayNumber(displayValue, {maximumFractionDigits})} ${massUnitLabel(
		sourceUnit,
		unitSystem,
	)}`;
}
