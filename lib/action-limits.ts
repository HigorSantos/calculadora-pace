export const ACTIONS_PER_LAP_BLOCK = 10;
export const CUSTOM_CONSUMABLE_LIMIT = 1;
export const CUSTOM_CONSUMABLE_ID_PREFIX = "custom-";
export const FREE_HISTORY_UNDO_LIMIT = 2;
export const FREE_HISTORY_REDO_LIMIT = 2;
export const FREE_PLAN_DIVISION_LIMIT = 2;

export type LapActions = Record<number, string[]>;

export function maxActionsForLapCount(lapCount: number) {
	if (lapCount <= 0) return 0;
	return Math.ceil(lapCount / ACTIONS_PER_LAP_BLOCK);
}

export function countActionsWithinLaps(actions: LapActions, lapCount: number) {
	if (lapCount <= 0) return 0;

	return Object.entries(actions).reduce((total, [rawIndex, ids]) => {
		const index = Number(rawIndex);
		if (!Number.isInteger(index) || index < 0 || index >= lapCount) {
			return total;
		}
		return total + ids.length;
	}, 0);
}

export function canAddPlanAction(actions: LapActions, lapCount: number) {
	return (
		countActionsWithinLaps(actions, lapCount) < maxActionsForLapCount(lapCount)
	);
}

export type ConsumableIdentifier = {id: string};

export function isCustomConsumable(consumable: ConsumableIdentifier) {
	return consumable.id.startsWith(CUSTOM_CONSUMABLE_ID_PREFIX);
}

export function countCustomConsumables(consumables: ConsumableIdentifier[]) {
	return consumables.filter(isCustomConsumable).length;
}

export function canAddCustomConsumable(consumables: ConsumableIdentifier[]) {
	return countCustomConsumables(consumables) < CUSTOM_CONSUMABLE_LIMIT;
}

export function canAddFreePlanDivision(currentDivisionCount: number) {
	return currentDivisionCount < FREE_PLAN_DIVISION_LIMIT;
}

export function limitFreeUndoHistory<T>(items: T[]) {
	return items.slice(-FREE_HISTORY_UNDO_LIMIT);
}

export function limitFreeRedoHistory<T>(items: T[]) {
	return items.slice(0, FREE_HISTORY_REDO_LIMIT);
}
