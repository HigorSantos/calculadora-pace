import {NO_RACE_CONFIG_ID, isRaceConsumableId} from "@/lib/race-configurations";
import {DEFAULT_CONSUMABLES, type Consumable, type Lap} from "@/lib/pace";

import type {
	LapDivisionConfig,
	LapDivisionSummaries,
	PaceHistorySnapshot,
	PaceQueryValues,
	StoredPaceHistory,
} from "./types";

export function cloneHistoryValue<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function areHistorySnapshotsEqual(
	left: PaceHistorySnapshot,
	right: PaceHistorySnapshot,
) {
	return JSON.stringify(left) === JSON.stringify(right);
}

export function arePaceQueryValuesEqual(
	left: PaceQueryValues,
	right: PaceQueryValues,
) {
	return (
		left.distance === right.distance &&
		left.targetType === right.targetType &&
		left.targetValue === right.targetValue &&
		left.strategy === right.strategy &&
		left.initialPace === right.initialPace &&
		left.initialPaceSegments === right.initialPaceSegments
	);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPaceQueryValues(value: unknown): value is PaceQueryValues {
	return (
		isRecord(value) &&
		typeof value.distance === "string" &&
		typeof value.targetType === "string" &&
		typeof value.targetValue === "string" &&
		typeof value.strategy === "string" &&
		(value.initialPace === undefined ||
			typeof value.initialPace === "string") &&
		(value.initialPaceSegments === undefined ||
			typeof value.initialPaceSegments === "string")
	);
}

export function isPaceHistorySnapshot(
	value: unknown,
): value is PaceHistorySnapshot {
	return (
		isRecord(value) &&
		isPaceQueryValues(value.values) &&
		isRecord(value.storedTargetValues) &&
		typeof value.storedTargetValues.time === "string" &&
		typeof value.storedTargetValues.pace === "string" &&
		typeof value.recalc === "boolean" &&
		typeof value.spreadPct === "number" &&
		typeof value.spreadInput === "string" &&
		(value.initialPaceInput === undefined ||
			typeof value.initialPaceInput === "string") &&
		(value.selectedRaceId === undefined ||
			typeof value.selectedRaceId === "string") &&
		Array.isArray(value.laps) &&
		(value.lapDivisions === undefined || isRecord(value.lapDivisions)) &&
		typeof value.showActions === "boolean" &&
		Array.isArray(value.consumables) &&
		(value.selectedConsumableIds === undefined ||
			Array.isArray(value.selectedConsumableIds)) &&
		isRecord(value.actions) &&
		typeof value.collapseEmpty === "boolean"
	);
}

function restoreConsumablesFromSnapshot(snapshot: PaceHistorySnapshot) {
	const defaultIds = new Set(
		DEFAULT_CONSUMABLES.map(consumable => consumable.id),
	);
	const restorableConsumables = snapshot.consumables.filter(consumable => {
		if (defaultIds.has(consumable.id)) return false;
		return (
			consumable.id.startsWith("custom-") ||
			isRaceConsumableId(consumable.id)
		);
	});

	return [...DEFAULT_CONSUMABLES, ...restorableConsumables];
}

function filterIdsByConsumables(ids: string[], consumables: Consumable[]) {
	const validIds = new Set(consumables.map(consumable => consumable.id));
	return ids.filter(id => validIds.has(id));
}

export function defaultLapDivisions(): LapDivisionConfig {
	return {breaks: [], descriptions: {0: ""}};
}

export function normalizeLapDivisions(
	value: unknown,
	lapCount: number,
): LapDivisionConfig {
	if (!isRecord(value)) return defaultLapDivisions();

	const maxBreakIndex = lapCount - 2;
	const breaks = Array.isArray(value.breaks)
		? Array.from(
				new Set(
					value.breaks.filter(
						(item): item is number =>
							Number.isInteger(item) && item >= 0 && item <= maxBreakIndex,
					),
				),
			).sort((a, b) => a - b)
		: [];
	const blockCount = breaks.length + 1;
	const descriptions: Record<number, string> = {0: ""};

	if (isRecord(value.descriptions)) {
		for (const [key, description] of Object.entries(value.descriptions)) {
			const index = Number(key);
			if (
				Number.isInteger(index) &&
				index >= 0 &&
				index < blockCount &&
				typeof description === "string"
			) {
				descriptions[index] = description;
			}
		}
	}

	for (let index = 0; index < blockCount; index += 1) {
		descriptions[index] ??= "";
	}

	return {breaks, descriptions};
}

export function buildLapDivisionSummaries(
	laps: Lap[],
	breaks: number[],
): LapDivisionSummaries {
	const byBreakIndex = new Map<
		number,
		{
			index: number;
			startLabel: number;
			endLabel: number;
			blockSeconds: number;
			cumulativeSeconds: number;
		}
	>();
	const initial = {index: 0, isInitial: true} as const;
	if (laps.length === 0) return {initial, byBreakIndex};

	let previousBreakIndex: number | null = null;
	breaks.forEach((breakIndex, position) => {
		const startIndex = previousBreakIndex == null ? 0 : previousBreakIndex + 1;
		const startLabel = previousBreakIndex == null ? 1 : previousBreakIndex + 1;
		const endExclusive = breakIndex + 1;
		const blockSeconds = laps
			.slice(startIndex, endExclusive)
			.reduce((sum, lap) => sum + lap.time, 0);
		const cumulativeSeconds = laps
			.slice(0, endExclusive)
			.reduce((sum, lap) => sum + lap.time, 0);

		byBreakIndex.set(breakIndex, {
			index: position + 1,
			startLabel,
			endLabel: breakIndex + 1,
			blockSeconds,
			cumulativeSeconds,
		});
		previousBreakIndex = breakIndex;
	});

	return {initial, byBreakIndex};
}

function filterActionsByConsumables(
	actions: Record<number, string[]>,
	consumables: Consumable[],
) {
	const validIds = new Set(consumables.map(consumable => consumable.id));
	const filteredActions: Record<number, string[]> = {};

	for (const [key, ids] of Object.entries(actions)) {
		const validActionIds = ids.filter(id => validIds.has(id));
		if (validActionIds.length > 0)
			filteredActions[Number(key)] = validActionIds;
	}

	return filteredActions;
}

export function filterActionsByLapCount(
	actions: Record<number, string[]>,
	lapCount: number,
) {
	const filteredActions: Record<number, string[]> = {};

	for (const [key, ids] of Object.entries(actions)) {
		const index = Number(key);
		if (!Number.isInteger(index) || index < 0 || index >= lapCount) continue;
		if (ids.length > 0) filteredActions[index] = ids;
	}

	return filteredActions;
}

export function withoutRaceActions(actions: Record<number, string[]>) {
	const filteredActions: Record<number, string[]> = {};

	for (const [key, ids] of Object.entries(actions)) {
		const remainingIds = ids.filter(id => !isRaceConsumableId(id));
		if (remainingIds.length > 0) filteredActions[Number(key)] = remainingIds;
	}

	return filteredActions;
}

export function mergeLapActions(
	baseActions: Record<number, string[]>,
	nextActions: Record<number, string[]>,
) {
	const mergedActions: Record<number, string[]> = {...baseActions};

	for (const [key, ids] of Object.entries(nextActions)) {
		const index = Number(key);
		mergedActions[index] = [...(mergedActions[index] ?? []), ...ids];
	}

	return mergedActions;
}

export function shiftActionsAfterLapInsertion(
	actions: Record<number, string[]>,
	insertIndex: number,
) {
	const shiftedActions: Record<number, string[]> = {};

	for (const [key, ids] of Object.entries(actions)) {
		const index = Number(key);
		if (!Number.isInteger(index)) continue;
		shiftedActions[index >= insertIndex ? index + 1 : index] = ids;
	}

	return shiftedActions;
}

export function shiftActionsAfterLapRemoval(
	actions: Record<number, string[]>,
	removedIndex: number,
	mergeTargetIndex: number,
) {
	const shiftedActions: Record<number, string[]> = {};

	for (const [key, ids] of Object.entries(actions)) {
		const index = Number(key);
		if (!Number.isInteger(index)) continue;

		if (index === removedIndex || index === mergeTargetIndex) {
			const targetIndex = Math.min(removedIndex, mergeTargetIndex);
			shiftedActions[targetIndex] = [
				...(shiftedActions[targetIndex] ?? []),
				...ids,
			];
			continue;
		}

		shiftedActions[index > removedIndex ? index - 1 : index] = ids;
	}

	return shiftedActions;
}

export function buildLapDistanceRanges(laps: Lap[]) {
	let start = 0;
	return laps.map(lap => {
		const range = {start, end: start + lap.distance};
		start = range.end;
		return range;
	});
}

export function sameDistance(left: number, right: number) {
	return Math.abs(left - right) < 0.001;
}

export function parseStoredPaceHistory(
	raw: string | null,
): StoredPaceHistory | null {
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!isRecord(parsed) || parsed.version !== 1) return null;
		if (!isPaceHistorySnapshot(parsed.current)) return null;
		if (!isRecord(parsed.history)) return null;
		if (!Array.isArray(parsed.history.past)) return null;
		if (!Array.isArray(parsed.history.future)) return null;

		const normalizeSnapshot = (snapshot: PaceHistorySnapshot) => {
			const values = {
				...snapshot.values,
				initialPace:
					snapshot.values.initialPace ?? snapshot.initialPaceInput ?? "",
				initialPaceSegments: snapshot.values.initialPaceSegments ?? "1",
			};
			const consumables = restoreConsumablesFromSnapshot(snapshot);
			const selectedConsumableIds = Array.isArray(
				snapshot.selectedConsumableIds,
			)
				? snapshot.selectedConsumableIds.filter(
						(id): id is string => typeof id === "string",
					)
				: defaultSelectedConsumableIds(DEFAULT_CONSUMABLES);

			return {
				...snapshot,
				values,
				selectedRaceId: snapshot.selectedRaceId ?? NO_RACE_CONFIG_ID,
				lapDivisions: normalizeLapDivisions(
					snapshot.lapDivisions,
					snapshot.laps.length,
				),
				consumables,
				selectedConsumableIds: filterIdsByConsumables(
					selectedConsumableIds,
					consumables,
				),
				actions: filterActionsByConsumables(snapshot.actions, consumables),
			};
		};

		return {
			version: 1,
			current: normalizeSnapshot(parsed.current),
			history: {
				past: parsed.history.past
					.filter(isPaceHistorySnapshot)
					.map(normalizeSnapshot),
				future: parsed.history.future
					.filter(isPaceHistorySnapshot)
					.map(normalizeSnapshot),
			},
		};
	} catch {
		return null;
	}
}

export function defaultSelectedConsumableIds(consumables: Consumable[]) {
	return consumables
		.filter(consumable => consumable.brand === "Genéricos")
		.map(consumable => consumable.id);
}

export function parseStoredSelectedConsumables(raw: string | null) {
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return null;
		return parsed.filter((id): id is string => typeof id === "string");
	} catch {
		return null;
	}
}
