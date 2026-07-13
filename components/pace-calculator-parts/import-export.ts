import {
	DEFAULT_PACE_VALUE,
	DEFAULT_TARGET_VALUE,
	normalizeStrategy,
	normalizeTargetMode,
} from "@/components/pace-calculator-parts/utils";
import {
	NO_RACE_CONFIG_ID,
	isRaceConsumableId,
	raceActionConsumableId,
} from "@/lib/race-configurations";
import {
	buildDistances,
	DEFAULT_CONSUMABLES,
	DEFAULT_SPREAD,
	type Consumable,
	type Lap,
} from "@/lib/pace";
import {isUnitSystem, type UnitSystem} from "@/lib/units";

import {
	defaultLapDivisions,
	isPaceQueryValues,
	isRecord,
	normalizeLapDivisions,
} from "./history";
import {
	PACE_EXPORT_SCHEMA,
	SUPPORTED_PACE_EXPORT_VERSION,
	type ExportedConsumable,
	type LapDivisionConfig,
	type LapDivisionSummaries,
	type PaceCalculatorExport,
	type PaceHistorySnapshot,
	type PaceQueryValues,
} from "./types";

function isUserCreatedConsumable(consumable: Consumable) {
	const defaultIds = new Set(DEFAULT_CONSUMABLES.map(item => item.id));
	return consumable.id.startsWith("custom-") && !defaultIds.has(consumable.id);
}

function toExportedConsumable(consumable: Consumable): ExportedConsumable {
	const userCreated = isUserCreatedConsumable(consumable);
	return {
		...consumable,
		source: isRaceConsumableId(consumable.id)
			? "race"
			: userCreated
				? "user"
				: "default",
		userCreated,
	};
}

export function safeExportFilename(date: Date) {
	return `arsenal-do-corredor-configuracao-${date
		.toISOString()
		.replace(/[:.]/g, "-")}.json`;
}

export function downloadJsonFile(filename: string, payload: unknown) {
	const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
		type: "application/json;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function numberValue(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isValidDateString(value: unknown): value is string {
	return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function formatImportDateTime(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function getImportValidationMessage(value: unknown) {
	if (!isRecord(value)) {
		return "O arquivo selecionado não tem o formato esperado para uma configuração exportada.";
	}

	if (value.schema !== PACE_EXPORT_SCHEMA) {
		return "Este arquivo não é uma exportação da calculadora de pace.";
	}

	const version = numberValue(value.version);
	if (version == null) {
		return "Não foi possível identificar a versão da configuração.";
	}

	if (version !== SUPPORTED_PACE_EXPORT_VERSION) {
		return `Versão ${version} não compatível. Esta versão do site importa apenas arquivos na versão ${SUPPORTED_PACE_EXPORT_VERSION}.`;
	}

	if (!isValidDateString(value.exportedAt)) {
		return "Não foi possível identificar a data de exportação da configuração.";
	}

	return null;
}

export function countImportedActions(value: unknown) {
	if (!isRecord(value) || !Array.isArray(value.laps)) return 0;
	return value.laps.reduce((total, lap) => {
		if (!isRecord(lap) || !Array.isArray(lap.actions)) return total;
		return total + lap.actions.length;
	}, 0);
}

export function countImportedDivisions(value: unknown) {
	if (!isRecord(value) || !isRecord(value.divisions)) return 0;
	if (Array.isArray(value.divisions.breaks))
		return value.divisions.breaks.length;
	if (Array.isArray(value.divisions.items)) {
		return value.divisions.items.filter(item => {
			return isRecord(item) && item.kind === "split";
		}).length;
	}
	return 0;
}

function parseImportedConsumable(value: unknown): Consumable | null {
	if (!isRecord(value)) return null;
	const carbs = numberValue(value.carbs);
	const sodium = numberValue(value.sodium);
	const caffeine = numberValue(value.caffeine);

	if (
		typeof value.id !== "string" ||
		typeof value.name !== "string" ||
		typeof value.brand !== "string" ||
		carbs == null ||
		sodium == null ||
		caffeine == null
	) {
		return null;
	}

	const consumable: Consumable = {
		id: value.id,
		name: value.name,
		brand: value.brand,
		carbs,
		sodium,
		caffeine,
		paid: typeof value.paid === "boolean" ? value.paid : false,
	};

	const taurina = numberValue(value.taurina_mg);
	const nitrato = numberValue(value.nitrato_mg);
	const tamanhoSache = numberValue(value.tamanho_sache_g);
	if (taurina != null) consumable.taurina_mg = taurina;
	if (nitrato != null) consumable.nitrato_mg = nitrato;
	if (tamanhoSache != null) consumable.tamanho_sache_g = tamanhoSache;

	return consumable;
}

export function parseImportedPaceCalculatorExport(value: unknown): {
	unitSystem: UnitSystem | null;
	snapshot: PaceHistorySnapshot;
} | null {
	if (!isRecord(value)) return null;
	if (value.schema !== PACE_EXPORT_SCHEMA) return null;
	if (value.version !== SUPPORTED_PACE_EXPORT_VERSION) return null;
	if (!isRecord(value.configuration)) return null;
	if (!isPaceQueryValues(value.configuration.values)) return null;
	if (!Array.isArray(value.laps)) return null;

	const importedLaps: Lap[] = [];
	const importedConsumables = new Map<string, Consumable>();
	const defaultConsumableIds = new Set(
		DEFAULT_CONSUMABLES.map(consumable => consumable.id),
	);

	if (Array.isArray(value.consumables)) {
		for (const item of value.consumables) {
			const consumable = parseImportedConsumable(item);
			if (consumable) importedConsumables.set(consumable.id, consumable);
		}
	}

	for (const [index, item] of value.laps.entries()) {
		if (!isRecord(item)) return null;
		const distance = numberValue(item.distanceKm);
		const time = numberValue(item.timeSeconds);
		if (distance == null || time == null || distance < 0 || time < 0)
			return null;
		importedLaps[index] = {distance, time};

		if (!Array.isArray(item.actions)) continue;
		for (const action of item.actions) {
			if (!isRecord(action)) continue;
			const embeddedConsumable = parseImportedConsumable(action.item);
			if (embeddedConsumable) {
				importedConsumables.set(embeddedConsumable.id, embeddedConsumable);
			}
		}
	}

	if (importedLaps.length === 0) return null;

	const extraConsumables = Array.from(importedConsumables.values()).filter(
		consumable => !defaultConsumableIds.has(consumable.id),
	);
	const consumables = [...DEFAULT_CONSUMABLES, ...extraConsumables];
	const validConsumableIds = new Set(
		consumables.map(consumable => consumable.id),
	);
	const importedActions: Record<number, string[]> = {};

	for (const [index, item] of value.laps.entries()) {
		if (!isRecord(item) || !Array.isArray(item.actions)) continue;
		const actionIds = item.actions
			.map(action => (isRecord(action) ? action.itemId : null))
			.filter(
				(itemId): itemId is string =>
					typeof itemId === "string" &&
					validConsumableIds.has(raceActionConsumableId(itemId)),
			);
		if (actionIds.length > 0) importedActions[index] = actionIds;
	}

	const rawValues = value.configuration.values;
	const values: PaceQueryValues = {
		distance: rawValues.distance,
		targetType: normalizeTargetMode(rawValues.targetType),
		targetValue: rawValues.targetValue,
		strategy: normalizeStrategy(rawValues.strategy),
		initialPace: rawValues.initialPace ?? "",
		initialPaceSegments: rawValues.initialPaceSegments ?? "1",
	};
	const storedTargetValues = isRecord(value.configuration.storedTargetValues)
		? {
				time:
					typeof value.configuration.storedTargetValues.time === "string"
						? value.configuration.storedTargetValues.time
						: DEFAULT_TARGET_VALUE,
				pace:
					typeof value.configuration.storedTargetValues.pace === "string"
						? value.configuration.storedTargetValues.pace
						: DEFAULT_PACE_VALUE,
			}
		: {time: DEFAULT_TARGET_VALUE, pace: DEFAULT_PACE_VALUE};
	const selectedConsumableIds = Array.isArray(value.selectedConsumableIds)
		? value.selectedConsumableIds.filter(
				(id): id is string =>
					typeof id === "string" &&
					validConsumableIds.has(raceActionConsumableId(id)),
			)
		: [];
	const usedActionIds = Array.from(new Set(Object.values(importedActions).flat()));
	const lapDivisions = isRecord(value.divisions)
		? normalizeLapDivisions(
				{
					breaks: value.divisions.breaks,
					descriptions: value.divisions.descriptions,
				},
				importedLaps.length,
			)
		: defaultLapDivisions();

	return {
		unitSystem:
			typeof value.configuration.unitSystem === "string" &&
			isUnitSystem(value.configuration.unitSystem)
				? value.configuration.unitSystem
				: null,
		snapshot: {
			values,
			storedTargetValues,
			recalc:
				typeof value.configuration.recalcFollowingLaps === "boolean"
					? value.configuration.recalcFollowingLaps
					: true,
			spreadPct:
				numberValue(value.configuration.spreadPct) ?? DEFAULT_SPREAD * 100,
			spreadInput:
				typeof value.configuration.spreadInput === "string"
					? value.configuration.spreadInput
					: String(DEFAULT_SPREAD * 100),
			laps: importedLaps,
			lapDivisions,
			showActions: true,
			consumables,
			selectedConsumableIds:
				selectedConsumableIds.length > 0
					? selectedConsumableIds
					: usedActionIds,
			selectedRaceId:
				typeof value.configuration.selectedRaceId === "string"
					? value.configuration.selectedRaceId
					: NO_RACE_CONFIG_ID,
			actions: importedActions,
			collapseEmpty: false,
		},
	};
}

export type PaceCalculatorExportOptions = {
	includeInitialPace: boolean;
	includeCustomSplitSpread: boolean;
	includeLapActions: boolean;
	includeLapDivisions: boolean;
	includeManualLapSplits: boolean;
};

type BuildPaceCalculatorExportInput = {
	exportedAt: Date;
	unitSystem: UnitSystem;
	values: PaceQueryValues;
	storedTargetValues: {time: string; pace: string};
	recalc: boolean;
	spreadPct: number;
	spreadInput: string;
	targetSeconds: number;
	totalDistance: number;
	totalTime: number;
	averagePace: number;
	selectedRaceId: string;
	consumables: Consumable[];
	selectedConsumableIds: string[];
	laps: Lap[];
	actions: Record<number, string[]>;
	normalizedLapDivisions: LapDivisionConfig;
	lapDivisionSummaries: LapDivisionSummaries;
	options?: PaceCalculatorExportOptions;
};

const DEFAULT_EXPORT_OPTIONS: PaceCalculatorExportOptions = {
	includeInitialPace: true,
	includeCustomSplitSpread: true,
	includeLapActions: true,
	includeLapDivisions: true,
	includeManualLapSplits: true,
};

function areLapDistancesDefault(laps: Lap[], totalDistance: number) {
	const defaultDistances = buildDistances(totalDistance);
	if (defaultDistances.length !== laps.length) return false;
	return laps.every(
		(lap, index) => Math.abs(lap.distance - defaultDistances[index]) < 0.001,
	);
}

export function hasManualLapSplits(laps: Lap[], totalDistance: number) {
	return !areLapDistancesDefault(laps, totalDistance);
}

function collapseManualLapSplits(laps: Lap[], totalDistance: number): Lap[] {
	const targetDistances = buildDistances(totalDistance);
	if (targetDistances.length === 0) return laps.map(lap => ({...lap}));
	if (areLapDistancesDefault(laps, totalDistance)) {
		return laps.map(lap => ({...lap}));
	}

	const collapsed: Lap[] = [];
	let sourceIndex = 0;
	let sourceConsumedDistance = 0;

	for (const targetDistance of targetDistances) {
		let remainingDistance = targetDistance;
		let time = 0;

		while (remainingDistance > 0.0005 && sourceIndex < laps.length) {
			const sourceLap = laps[sourceIndex];
			const availableDistance = sourceLap.distance - sourceConsumedDistance;
			const usedDistance = Math.min(remainingDistance, availableDistance);
			const pace = sourceLap.distance > 0 ? sourceLap.time / sourceLap.distance : 0;

			time += usedDistance * pace;
			remainingDistance = Number((remainingDistance - usedDistance).toFixed(6));
			sourceConsumedDistance = Number(
				(sourceConsumedDistance + usedDistance).toFixed(6),
			);

			if (sourceConsumedDistance >= sourceLap.distance - 0.0005) {
				sourceIndex += 1;
				sourceConsumedDistance = 0;
			}
		}

		collapsed.push({
			distance: targetDistance,
			time: Math.round(time),
		});
	}

	return collapsed;
}

function remapActionsToExportLaps(
	actions: Record<number, string[]>,
	sourceLaps: Lap[],
	exportLaps: Lap[],
) {
	if (sourceLaps.length === exportLaps.length) return actions;

	const exportEndDistances: number[] = [];
	let cumulativeExportDistance = 0;
	for (const lap of exportLaps) {
		cumulativeExportDistance += lap.distance;
		exportEndDistances.push(cumulativeExportDistance);
	}

	const remapped: Record<number, string[]> = {};
	let cumulativeSourceDistance = 0;
	for (const [sourceIndex, lap] of sourceLaps.entries()) {
		const actionIds = actions[sourceIndex];
		cumulativeSourceDistance += lap.distance;
		if (!actionIds?.length) continue;

		const midpoint = cumulativeSourceDistance - lap.distance / 2;
		const exportIndex = exportEndDistances.findIndex(
			endDistance => midpoint <= endDistance + 0.0005,
		);
		const targetIndex = exportIndex >= 0 ? exportIndex : exportLaps.length - 1;
		remapped[targetIndex] = [...(remapped[targetIndex] ?? []), ...actionIds];
	}

	return remapped;
}

export function buildPaceCalculatorExport({
	exportedAt,
	unitSystem,
	values,
	storedTargetValues,
	recalc,
	spreadPct,
	spreadInput,
	targetSeconds,
	totalDistance,
	totalTime,
	averagePace,
	selectedRaceId,
	consumables,
	selectedConsumableIds,
	laps,
	actions,
	normalizedLapDivisions,
	lapDivisionSummaries,
	options = DEFAULT_EXPORT_OPTIONS,
}: BuildPaceCalculatorExportInput): PaceCalculatorExport {
	const effectiveOptions = {...DEFAULT_EXPORT_OPTIONS, ...options};
	const exportValues: PaceQueryValues = effectiveOptions.includeInitialPace
		? {...values}
		: {...values, initialPace: "", initialPaceSegments: "1"};
	const exportSpreadPct = effectiveOptions.includeCustomSplitSpread
		? spreadPct
		: DEFAULT_SPREAD * 100;
	const exportSpreadInput = effectiveOptions.includeCustomSplitSpread
		? spreadInput
		: String(DEFAULT_SPREAD * 100);
	const exportLaps = effectiveOptions.includeManualLapSplits
		? laps
		: collapseManualLapSplits(laps, totalDistance);
	const baseExportActions = effectiveOptions.includeLapActions ? actions : {};
	const exportActions = effectiveOptions.includeManualLapSplits
		? baseExportActions
		: remapActionsToExportLaps(baseExportActions, laps, exportLaps);
	const usedConsumableIds = new Set(
		Object.values(exportActions).flatMap(actionIds =>
			actionIds.map(raceActionConsumableId),
		),
	);
	const exportedConsumables = consumables
		.filter(consumable => usedConsumableIds.has(consumable.id))
		.map(toExportedConsumable);
	const exportedConsumableById = new Map(
		exportedConsumables.map(item => [item.id, item]),
	);
	const exportedSelectedConsumableIds = selectedConsumableIds.filter(id =>
		usedConsumableIds.has(id),
	);
	const exportedActionsForLap = (lapIndex: number) =>
		(exportActions[lapIndex] ?? []).map((itemId, actionIndex) => {
			const item =
				exportedConsumableById.get(raceActionConsumableId(itemId)) ?? null;
			return {
				id: `lap-${lapIndex + 1}-action-${actionIndex + 1}`,
				itemId,
				item,
				userCreated: item?.userCreated ?? false,
			};
		});

	const divisionItems: PaceCalculatorExport["divisions"]["items"] =
		effectiveOptions.includeLapDivisions
			? [
					{
						index: 0,
						kind: "pre-race" as const,
						description: normalizedLapDivisions.descriptions[0] ?? "",
					},
				]
			: [];

	if (effectiveOptions.includeLapDivisions) {
		for (const breakIndex of normalizedLapDivisions.breaks) {
			const summary = lapDivisionSummaries.byBreakIndex.get(breakIndex);
			if (!summary) continue;
			divisionItems.push({
				index: summary.index,
				kind: "split",
				description: normalizedLapDivisions.descriptions[summary.index] ?? "",
				breakAfterLap: breakIndex + 1,
				startLap: summary.startLabel,
				endLap: summary.endLabel,
				blockTimeSeconds: summary.blockSeconds,
				cumulativeTimeSeconds: summary.cumulativeSeconds,
			});
		}
	}

	const exportLapDivisions = effectiveOptions.includeLapDivisions
		? normalizedLapDivisions
		: defaultLapDivisions();

	return {
		schema: PACE_EXPORT_SCHEMA,
		version: SUPPORTED_PACE_EXPORT_VERSION,
		exportedAt: exportedAt.toISOString(),
		app: {
			name: "Arsenal do Corredor",
			url: "https://arsenaldocorredor.com.br",
		},
		configuration: {
			unitSystem,
			values: exportValues,
			storedTargetValues: {...storedTargetValues},
			recalcFollowingLaps: recalc,
			spreadPct: exportSpreadPct,
			spreadInput: exportSpreadInput,
			targetSeconds,
			totalDistanceKm: totalDistance,
			totalTimeSeconds: totalTime,
			averagePaceSecondsPerKm: averagePace,
			selectedRaceId,
		},
		consumables: exportedConsumables,
		selectedConsumableIds: exportedSelectedConsumableIds,
		laps: exportLaps.map((lap, index) => ({
			index,
			number: index + 1,
			distanceKm: lap.distance,
			paceSecondsPerKm: lap.distance > 0 ? lap.time / lap.distance : 0,
			timeSeconds: lap.time,
			actions: exportedActionsForLap(index),
		})),
		divisions: {
			breaks: [...exportLapDivisions.breaks],
			descriptions: effectiveOptions.includeLapDivisions
				? {...exportLapDivisions.descriptions}
				: {},
			items: divisionItems,
		},
	};
}
