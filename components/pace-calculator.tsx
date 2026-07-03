"use client";

import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import {Eye, EyeOff, Redo2, RotateCcw, Timer, Undo2} from "lucide-react";

import {useBillingAccess} from "@/components/billing-access-provider";
import {ConsumableManager} from "@/components/pace-calculator-parts/consumable-manager";
import {
	LapBlockHeader,
	LapDivisionBoundary,
	type LapBlock,
} from "@/components/pace-calculator-parts/lap-division";
import {
	LapRow,
	SuppressedRow,
} from "@/components/pace-calculator-parts/lap-row";
import {NutritionSummary} from "@/components/pace-calculator-parts/nutrition-summary";
import {StatCard} from "@/components/pace-calculator-parts/stat-card";
import {UpgradeDialog} from "@/components/pace-calculator-parts/upgrade-dialog";
import {
	DEFAULT_DISTANCE_INPUT,
	DEFAULT_PACE_VALUE,
	DEFAULT_STRATEGY,
	DEFAULT_TARGET_MODE,
	DEFAULT_TARGET_VALUE,
	PRESETS,
	STRATEGIES,
	newConsumableId,
	normalizeStrategy,
	normalizeTargetMode,
	resolveTargetSeconds,
	type Preset,
	type TargetMode,
} from "@/components/pace-calculator-parts/utils";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {Slider} from "@/components/ui/slider";
import {Switch} from "@/components/ui/switch";
import {useUnitSystem} from "@/components/unit-system-provider";
import {useQueryStringState} from "@/hooks/use-query-string-state";
import {
	canAddCustomConsumable,
	canAddFreePlanDivision,
	canAddPlanAction,
	countActionsWithinLaps,
	limitFreeRedoHistory,
	limitFreeUndoHistory,
	maxActionsForLapCount,
} from "@/lib/action-limits";
import {canAddLapAction} from "@/lib/billing-access";
import {
	applyLapEdit,
	buildDistances,
	buildLaps,
	computeNutrition,
	DEFAULT_CONSUMABLES,
	DEFAULT_SPREAD,
	deriveConstantPaceAfterInitialSegments,
	deriveFinalPaceFromInitialPace,
	formatTime,
	parseTime,
	type Consumable,
	type Lap,
	type Strategy,
} from "@/lib/pace";
import {cn} from "@/lib/utils";
import {
	distanceUnitLabel,
	formatDisplayDistance,
	formatDisplayNumber,
	fromDisplayPace,
	paceUnitLabel,
	parseDisplayDistance,
	toDisplayDistance,
	toDisplayPace,
} from "@/lib/units";

type PaceQueryValues = {
	distance: string;
	targetType: TargetMode;
	targetValue: string;
	strategy: Strategy;
	initialPace: string;
	initialPaceSegments: string;
};

type LapDivisionConfig = {
	breaks: number[];
	descriptions: Record<number, string>;
};

type PaceHistorySnapshot = {
	values: PaceQueryValues;
	storedTargetValues: {time: string; pace: string};
	recalc: boolean;
	spreadPct: number;
	spreadInput: string;
	initialPaceInput?: string;
	laps: Lap[];
	lapDivisions?: LapDivisionConfig;
	showActions: boolean;
	consumables: Consumable[];
	selectedConsumableIds: string[];
	actions: Record<number, string[]>;
	collapseEmpty: boolean;
};

type PaceHistoryState = {
	past: PaceHistorySnapshot[];
	future: PaceHistorySnapshot[];
};

type StoredPaceHistory = {
	version: 1;
	current: PaceHistorySnapshot;
	history: PaceHistoryState;
};

const PACE_HISTORY_STORAGE_KEY = "arsenal-pace-calculator-history:v1";
const SELECTED_CONSUMABLES_STORAGE_KEY = "arsenal-selected-consumables:v1";

function cloneHistoryValue<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function areHistorySnapshotsEqual(
	left: PaceHistorySnapshot,
	right: PaceHistorySnapshot,
) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function arePaceQueryValuesEqual(
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPaceQueryValues(value: unknown): value is PaceQueryValues {
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

function isPaceHistorySnapshot(value: unknown): value is PaceHistorySnapshot {
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
	const customConsumables = snapshot.consumables.filter(
		consumable =>
			consumable.id.startsWith("custom-") && !defaultIds.has(consumable.id),
	);

	return [...DEFAULT_CONSUMABLES, ...customConsumables];
}

function filterIdsByConsumables(ids: string[], consumables: Consumable[]) {
	const validIds = new Set(consumables.map(consumable => consumable.id));
	return ids.filter(id => validIds.has(id));
}

function defaultLapDivisions(): LapDivisionConfig {
	return {breaks: [], descriptions: {0: ""}};
}

function normalizeLapDivisions(
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

function buildLapDivisionSummaries(
	laps: Lap[],
	breaks: number[],
): {initial: LapBlock; byBreakIndex: Map<number, LapBlock>} {
	const byBreakIndex = new Map<number, LapBlock>();
	const initial = {index: 0, isInitial: true};
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

function parseStoredPaceHistory(raw: string | null): StoredPaceHistory | null {
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

function defaultSelectedConsumableIds(consumables: Consumable[]) {
	return consumables
		.filter(consumable => consumable.brand === "Genéricos")
		.map(consumable => consumable.id);
}

function parseStoredSelectedConsumables(raw: string | null) {
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return null;
		return parsed.filter((id): id is string => typeof id === "string");
	} catch {
		return null;
	}
}

export function PaceCalculator() {
	const {
		accessMode,
		canAccess,
		isHydrated: isBillingAccessHydrated,
	} = useBillingAccess();
	const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
	const {unitSystem} = useUnitSystem();
	const {values, setValue, setValues, isHydrated} = useQueryStringState({
		distance: DEFAULT_DISTANCE_INPUT,
		targetType: DEFAULT_TARGET_MODE,
		targetValue: DEFAULT_TARGET_VALUE,
		strategy: DEFAULT_STRATEGY,
		initialPace: "",
		initialPaceSegments: "1",
	});
	const distanceInput = values.distance;
	const distance = parseDisplayDistance(distanceInput, unitSystem) ?? 0;
	const targetMode = normalizeTargetMode(values.targetType);
	const strategy = normalizeStrategy(values.strategy);
	const [storedTargetValues, setStoredTargetValues] = useState({
		time: DEFAULT_TARGET_VALUE,
		pace: DEFAULT_PACE_VALUE,
	});
	const targetInput =
		targetMode === "time" ? values.targetValue : storedTargetValues.time;
	const paceInput =
		targetMode === "pace" ? values.targetValue : storedTargetValues.pace;
	const initialPaceInput = values.initialPace;
	const initialPaceSegmentInput = values.initialPaceSegments;
	const [recalc, setRecalc] = useState(true);
	// Variação máxima de pace entre início e fim, em % do pace médio.
	const [spreadPct, setSpreadPct] = useState(DEFAULT_SPREAD * 100);
	const [spreadInput, setSpreadInput] = useState(String(DEFAULT_SPREAD * 100));
	const [laps, setLaps] = useState<Lap[]>(() =>
		buildLaps(5, 25 * 60, "constant", DEFAULT_SPREAD),
	);
	const [lapDivisions, setLapDivisions] = useState<LapDivisionConfig>(() =>
		defaultLapDivisions(),
	);

	// --- Ações / nutrição ---
	const [showActions, setShowActions] = useState(true);
	const [consumables, setConsumables] = useState<Consumable[]>(
		() => DEFAULT_CONSUMABLES,
	);
	const [selectedConsumableIds, setSelectedConsumableIds] = useState<string[]>(
		() => defaultSelectedConsumableIds(DEFAULT_CONSUMABLES),
	);
	// índice do trecho -> lista de ids de consumíveis (pode repetir)
	const [actions, setActions] = useState<Record<number, string[]>>({});
	// esconder trechos sem ação quando a lista fica longa
	const [collapseEmpty, setCollapseEmpty] = useState(false);
	const [showLapDivisionOptions, setShowLapDivisionOptions] = useState(true);
	const [history, setHistory] = useState<PaceHistoryState>({
		past: [],
		future: [],
	});
	const pendingHistorySnapshotRef = useRef<PaceHistorySnapshot | null>(null);
	const focusedFieldSnapshotRef = useRef<PaceHistorySnapshot | null>(null);
	const isRestoringHistoryRef = useRef(false);
	const skipNextRegenerateRef = useRef(false);
	const historyStorageRestoredRef = useRef(false);
	const skipNextHistoryStoragePersistRef = useRef(false);

	const targetSeconds =
		resolveTargetSeconds(
			targetMode,
			distance,
			targetInput,
			paceInput,
			unitSystem,
		) ?? 0;

	const totalTime = useMemo(() => laps.reduce((a, l) => a + l.time, 0), [laps]);
	const totalDistance = useMemo(
		() => laps.reduce((a, l) => a + l.distance, 0),
		[laps],
	);
	const diff = totalTime - targetSeconds;
	const avgPace = totalDistance > 0 ? totalTime / totalDistance : 0;
	// No modo pace, a diferença exibida é de ritmo, não de tempo total.
	const targetDisplayPace = targetMode === "pace" ? parseTime(paceInput) : null;
	const targetPace =
		targetDisplayPace == null
			? 0
			: fromDisplayPace(targetDisplayPace, unitSystem);
	const paceDiff = avgPace > 0 && targetPace > 0 ? avgPace - targetPace : 0;

	const canUsePaidConsumables = canAccess("consumable-paid-presets");
	const canUseMultipleActionsPerLap = canAccess("multiple-actions-per-lap");
	const canUseUnlimitedPlanActions = canAccess("unlimited-plan-actions");
	const canUseUnlimitedCustomConsumables = canAccess(
		"unlimited-custom-consumables",
	);
	const canUseCustomSplitSpread = canAccess("custom-split-spread");
	const canUseUnlimitedHistory = canAccess("unlimited-history");
	const canUseUnlimitedPlanDivisions = canAccess("unlimited-plan-divisions");

	const selectedConsumableIdSet = useMemo(
		() => new Set(selectedConsumableIds),
		[selectedConsumableIds],
	);
	const selectedConsumables = useMemo(
		() =>
			consumables.filter(consumable =>
				selectedConsumableIdSet.has(consumable.id),
			),
		[consumables, selectedConsumableIdSet],
	);
	const actionLimit = maxActionsForLapCount(laps.length);
	const actionCount = countActionsWithinLaps(actions, laps.length);
	const normalizedLapDivisions = useMemo(
		() => normalizeLapDivisions(lapDivisions, laps.length),
		[lapDivisions, laps.length],
	);
	const canAddMorePlanActions =
		canUseUnlimitedPlanActions || actionCount < actionLimit;
	const canAddMoreLapDivisions =
		canUseUnlimitedPlanDivisions ||
		canAddFreePlanDivision(normalizedLapDivisions.breaks.length);
	const nutrition = useMemo(
		() => computeNutrition(actions, consumables),
		[actions, consumables],
	);

	const COLLAPSE_THRESHOLD = 12;
	//Habilitar quando (pago)
	const VARIACAO_PACE_HABILITADA =
		canUseCustomSplitSpread && strategy !== "constant";
	const hasAnyAction = useMemo(
		() =>
			Object.entries(actions).some(
				([key, ids]) => Number(key) < laps.length && ids.length > 0,
			),
		[actions, laps.length],
	);
	// Só faz sentido oferecer o recolhimento quando há ações e muitos trechos.
	const canCollapse =
		showActions && hasAnyAction && laps.length > COLLAPSE_THRESHOLD;
	const collapsed = canCollapse && collapseEmpty;

	// Constrói a sequência de exibição: trechos com ação intercalados por
	// separadores que indicam quantos trechos sem ação foram suprimidos.
	const renderItems = useMemo(() => {
		type Item = {type: "lap"; index: number} | {type: "gap"; count: number};
		if (!collapsed)
			return laps.map((_, index) => ({type: "lap", index}) as Item);
		const items: Item[] = [];
		let gap = 0;
		laps.forEach((_, index) => {
			const has = (actions[index]?.length ?? 0) > 0;
			if (has) {
				if (gap > 0) {
					items.push({type: "gap", count: gap});
					gap = 0;
				}
				items.push({type: "lap", index});
			} else {
				gap += 1;
			}
		});
		if (gap > 0) items.push({type: "gap", count: gap});
		return items;
	}, [collapsed, laps, actions]);

	const lapDivisionSummaries = useMemo(
		() => buildLapDivisionSummaries(laps, normalizedLapDivisions.breaks),
		[laps, normalizedLapDivisions.breaks],
	);
	const lapDivisionBreakSet = useMemo(
		() => new Set(normalizedLapDivisions.breaks),
		[normalizedLapDivisions.breaks],
	);

	const hiddenCount = useMemo(
		() =>
			collapsed
				? renderItems.reduce(
						(a, it) => (it.type === "gap" ? a + it.count : a),
						0,
					)
				: 0,
		[collapsed, renderItems],
	);
	const isLoadingConfig = !isHydrated;
	const canUndo = history.past.length > 0;
	const canRedo = history.future.length > 0;
	const initialDisplayPace = parseTime(initialPaceInput);
	const initialPaceSeconds =
		initialDisplayPace == null
			? null
			: fromDisplayPace(initialDisplayPace, unitSystem);
	const strategyDistances = useMemo(() => buildDistances(distance), [distance]);
	const parsedInitialPaceSegments = Number.parseInt(
		initialPaceSegmentInput,
		10,
	);
	const initialPaceSegments = Number.isFinite(parsedInitialPaceSegments)
		? parsedInitialPaceSegments
		: 1;
	const maxInitialPaceSegments = Math.max(1, strategyDistances.length - 1);
	const initialPaceSegmentsAreInvalid =
		initialPaceSegmentInput.trim() === "" ||
		!Number.isFinite(parsedInitialPaceSegments) ||
		parsedInitialPaceSegments < 1 ||
		parsedInitialPaceSegments > maxInitialPaceSegments;
	const finalPaceFromInitial =
		initialPaceSeconds != null
			? strategy === "constant"
				? deriveConstantPaceAfterInitialSegments(
						strategyDistances,
						targetSeconds,
						initialPaceSeconds,
						initialPaceSegments,
					)
				: deriveFinalPaceFromInitialPace(
						strategyDistances,
						targetSeconds,
						initialPaceSeconds,
						initialPaceSegments,
					)
			: null;
	const initialPaceDirectionIsValid =
		strategy === "constant" ||
		initialPaceSeconds == null ||
		finalPaceFromInitial == null ||
		(strategy === "negative"
			? finalPaceFromInitial < initialPaceSeconds
			: finalPaceFromInitial > initialPaceSeconds);
	const hasInitialPaceInput = initialPaceInput.trim() !== "";
	const initialPaceIsInvalid =
		hasInitialPaceInput &&
		(initialPaceSeconds == null ||
			initialPaceSegmentsAreInvalid ||
			finalPaceFromInitial == null ||
			!initialPaceDirectionIsValid);

	function captureHistorySnapshot(): PaceHistorySnapshot {
		return cloneHistoryValue({
			values,
			storedTargetValues,
			recalc,
			spreadPct,
			spreadInput,
			laps,
			lapDivisions: normalizedLapDivisions,
			showActions,
			consumables,
			selectedConsumableIds,
			actions,
			collapseEmpty,
		});
	}

	function limitUndoHistory(items: PaceHistorySnapshot[]) {
		return canUseUnlimitedHistory ? items : limitFreeUndoHistory(items);
	}

	function limitRedoHistory(items: PaceHistorySnapshot[]) {
		return canUseUnlimitedHistory ? items : limitFreeRedoHistory(items);
	}

	function pushHistorySnapshot(
		before: PaceHistorySnapshot,
		after: PaceHistorySnapshot = captureHistorySnapshot(),
	) {
		if (isRestoringHistoryRef.current) return;
		if (areHistorySnapshotsEqual(before, after)) return;

		setHistory(currentHistory => ({
			past: limitUndoHistory([...currentHistory.past, before]),
			future: [],
		}));
	}

	function markHistoryChange() {
		if (isRestoringHistoryRef.current) return;
		pendingHistorySnapshotRef.current ??= captureHistorySnapshot();
	}

	function rememberFieldHistorySnapshot() {
		if (isRestoringHistoryRef.current) return;
		focusedFieldSnapshotRef.current = captureHistorySnapshot();
	}

	function commitFocusedFieldHistorySnapshot() {
		const before = focusedFieldSnapshotRef.current;
		focusedFieldSnapshotRef.current = null;
		if (!before) return;
		pushHistorySnapshot(before);
	}

	function restoreHistorySnapshot(snapshot: PaceHistorySnapshot) {
		isRestoringHistoryRef.current = true;
		skipNextRegenerateRef.current = true;
		setValues(snapshot.values);
		setStoredTargetValues(snapshot.storedTargetValues);
		setRecalc(snapshot.recalc);
		setSpreadPct(snapshot.spreadPct);
		setSpreadInput(snapshot.spreadInput);
		setLaps(snapshot.laps);
		setLapDivisions(
			normalizeLapDivisions(snapshot.lapDivisions, snapshot.laps.length),
		);
		setShowActions(snapshot.showActions);
		setConsumables(snapshot.consumables);
		setSelectedConsumableIds(snapshot.selectedConsumableIds);
		setActions(snapshot.actions);
		setCollapseEmpty(snapshot.collapseEmpty);
		window.setTimeout(() => {
			isRestoringHistoryRef.current = false;
		}, 0);
	}

	function undoHistory() {
		const previous = history.past.at(-1);
		if (!previous) return;
		const current = captureHistorySnapshot();
		restoreHistorySnapshot(previous);
		setHistory({
			past: history.past.slice(0, -1),
			future: limitRedoHistory([current, ...history.future]),
		});
	}

	function redoHistory() {
		const next = history.future[0];
		if (!next) return;
		const current = captureHistorySnapshot();
		restoreHistorySnapshot(next);
		setHistory({
			past: limitUndoHistory([...history.past, current]),
			future: history.future.slice(1),
		});
	}

	function regenerate(
		nextDistance: number,
		nextTargetInput: string,
		nextStrategy: Strategy = strategy,
		nextSpreadPct: number = spreadPct,
		nextMode: TargetMode = targetMode,
		nextPaceInput: string = paceInput,
		nextInitialPaceInput: string = initialPaceInput,
		nextInitialPaceSegments: number = initialPaceSegments,
	) {
		const secs = resolveTargetSeconds(
			nextMode,
			nextDistance,
			nextTargetInput,
			nextPaceInput,
			unitSystem,
		);
		if (!nextDistance || nextDistance <= 0 || secs == null || secs <= 0) {
			setLaps([]);
			return;
		}
		const displayInitialPace =
			nextInitialPaceInput.trim() === ""
				? null
				: parseTime(nextInitialPaceInput);
		const initialPace =
			displayInitialPace == null
				? null
				: fromDisplayPace(displayInitialPace, unitSystem);
		setLaps(
			buildLaps(
				nextDistance,
				secs,
				nextStrategy,
				nextSpreadPct / 100,
				initialPace,
				nextInitialPaceSegments,
			),
		);
	}

	useEffect(() => {
		setStoredTargetValues(currentValues => {
			if (currentValues[targetMode] === values.targetValue)
				return currentValues;
			return {...currentValues, [targetMode]: values.targetValue};
		});
	}, [targetMode, values.targetValue]);

	useEffect(() => {
		if (skipNextRegenerateRef.current) {
			skipNextRegenerateRef.current = false;
			return;
		}

		regenerate(
			distance,
			targetInput,
			strategy,
			spreadPct,
			targetMode,
			paceInput,
			initialPaceInput,
			initialPaceSegments,
		);
	}, [
		distance,
		targetInput,
		strategy,
		spreadPct,
		targetMode,
		paceInput,
		initialPaceInput,
		initialPaceSegments,
		unitSystem,
	]);

	useEffect(() => {
		if (canUseUnlimitedHistory) return;

		setHistory(currentHistory => {
			const nextPast = limitFreeUndoHistory(currentHistory.past);
			const nextFuture = limitFreeRedoHistory(currentHistory.future);
			if (
				nextPast.length === currentHistory.past.length &&
				nextFuture.length === currentHistory.future.length
			) {
				return currentHistory;
			}

			return {past: nextPast, future: nextFuture};
		});
	}, [canUseUnlimitedHistory]);

	useEffect(() => {
		if (!isHydrated || !isBillingAccessHydrated) return;
		if (historyStorageRestoredRef.current) return;

		historyStorageRestoredRef.current = true;
		const stored = parseStoredPaceHistory(
			window.localStorage.getItem(PACE_HISTORY_STORAGE_KEY),
		);
		if (!stored) return;

		skipNextHistoryStoragePersistRef.current = true;
		const nextHistory = {
			past: limitUndoHistory(stored.history.past),
			future: limitRedoHistory(stored.history.future),
		};
		setHistory(nextHistory);

		if (arePaceQueryValuesEqual(stored.current.values, values)) {
			restoreHistorySnapshot(stored.current);
		}
	}, [isHydrated, isBillingAccessHydrated, canUseUnlimitedHistory]);

	useEffect(() => {
		if (!isHydrated || !isBillingAccessHydrated) return;
		if (!historyStorageRestoredRef.current) return;
		if (skipNextHistoryStoragePersistRef.current) {
			skipNextHistoryStoragePersistRef.current = false;
			return;
		}

		const stored: StoredPaceHistory = {
			version: 1,
			current: captureHistorySnapshot(),
			history: {
				past: limitUndoHistory(history.past),
				future: limitRedoHistory(history.future),
			},
		};

		try {
			window.localStorage.setItem(
				PACE_HISTORY_STORAGE_KEY,
				JSON.stringify(stored),
			);
		} catch {
			// O histórico é apenas fallback local; falha de quota não deve afetar a ferramenta.
		}
	}, [
		isHydrated,
		isBillingAccessHydrated,
		canUseUnlimitedHistory,
		history,
		values,
		storedTargetValues,
		recalc,
		spreadPct,
		spreadInput,
		laps,
		normalizedLapDivisions,
		showActions,
		consumables,
		selectedConsumableIds,
		actions,
		collapseEmpty,
	]);

	useEffect(() => {
		setLapDivisions(currentDivisions => {
			const nextDivisions = normalizeLapDivisions(
				currentDivisions,
				laps.length,
			);
			if (JSON.stringify(nextDivisions) === JSON.stringify(currentDivisions)) {
				return currentDivisions;
			}
			return nextDivisions;
		});
	}, [laps.length]);

	useEffect(() => {
		if (!isHydrated) return;

		const stored = parseStoredSelectedConsumables(
			window.localStorage.getItem(SELECTED_CONSUMABLES_STORAGE_KEY),
		);
		if (!stored) return;

		const validIds = new Set(consumables.map(consumable => consumable.id));
		setSelectedConsumableIds(stored.filter(id => validIds.has(id)));
	}, [isHydrated]);

	useEffect(() => {
		if (!isHydrated) return;

		try {
			window.localStorage.setItem(
				SELECTED_CONSUMABLES_STORAGE_KEY,
				JSON.stringify(selectedConsumableIds),
			);
		} catch {
			// A seleção é preferência local; falha de quota não deve afetar a ferramenta.
		}
	}, [isHydrated, selectedConsumableIds]);

	useEffect(() => {
		const before = pendingHistorySnapshotRef.current;
		if (!before || isRestoringHistoryRef.current) return;
		pendingHistorySnapshotRef.current = null;
		pushHistorySnapshot(before);
	});

	function handleDistanceChange(value: string) {
		setValue("distance", value);
	}

	function handleTargetChange(value: string) {
		setValue("targetValue", value);
	}

	function handlePaceChange(value: string) {
		setValue("targetValue", value);
	}

	function handleInitialPaceChange(value: string) {
		setValue("initialPace", value);
	}

	function handleInitialPaceSegmentsChange(value: string) {
		setValue("initialPaceSegments", value);
	}

	function handleTargetModeChange(value: TargetMode) {
		if (!value || value === targetMode) return;
		markHistoryChange();
		setValues({
			targetType: value,
			targetValue: storedTargetValues[value],
		});
	}

	function handleStrategyChange(value: Strategy | null) {
		if (!value || value === strategy) return;
		markHistoryChange();
		setValue("strategy", value);
	}

	function applySpread(pct: number) {
		if (typeof pct !== "number" || Number.isNaN(pct)) return;
		const clamped = Math.min(50, Math.max(0, pct));
		if (clamped === spreadPct) return;
		markHistoryChange();
		setSpreadPct(clamped);
		setSpreadInput(String(clamped));
		regenerate(
			distance,
			targetInput,
			strategy,
			clamped,
			targetMode,
			paceInput,
			initialPaceInput,
			initialPaceSegments,
		);
	}

	function handleSpreadInputChange(value: string) {
		if (!canUseCustomSplitSpread) {
			return;
		}

		setSpreadInput(value);
		const parsed = Number(value.replace(",", "."));
		if (!Number.isNaN(parsed)) {
			const clamped = Math.min(50, Math.max(0, parsed));
			setSpreadPct(clamped);
			regenerate(
				distance,
				targetInput,
				strategy,
				clamped,
				targetMode,
				paceInput,
				initialPaceInput,
				initialPaceSegments,
			);
		}
	}

	function applyPreset(preset: Preset) {
		markHistoryChange();
		setValues({
			distance: formatDisplayNumber(
				toDisplayDistance(preset.distance, unitSystem),
				{
					maximumFractionDigits: 3,
				},
			).replace(".", ","),
			targetType: "time",
			targetValue: preset.time,
		});
	}

	function commitLap(index: number, raw: string) {
		const secs = parseTime(raw);
		if (secs == null || laps[index]?.time === secs) return;
		markHistoryChange();
		setLaps(prev => applyLapEdit(prev, index, secs, targetSeconds, recalc));
	}

	function repeatLapValueNext(index: number, count: number) {
		markHistoryChange();
		setRecalc(false);
		setLaps(prev => {
			const source = prev[index];
			if (!source || count <= 0) return prev;
			const sourcePace = source.time / source.distance;
			return prev.map((lap, lapIndex) =>
				lapIndex > index && lapIndex <= index + count
					? {...lap, time: Math.round(sourcePace * lap.distance)}
					: lap,
			);
		});
	}

	function repeatLapValueToEnd(index: number) {
		markHistoryChange();
		setRecalc(false);
		setLaps(prev => {
			const source = prev[index];
			if (!source) return prev;
			const sourcePace = source.time / source.distance;
			return prev.map((lap, lapIndex) =>
				lapIndex > index
					? {...lap, time: Math.round(sourcePace * lap.distance)}
					: lap,
			);
		});
	}

	function copyPreviousAverageToLap(index: number, count: number) {
		markHistoryChange();
		setRecalc(false);
		setLaps(prev => {
			const current = prev[index];
			if (!current || count <= 0 || count > index) return prev;
			const previous = prev.slice(index - count, index);
			const totalPreviousDistance = previous.reduce(
				(sum, lap) => sum + lap.distance,
				0,
			);
			if (totalPreviousDistance <= 0) return prev;
			const totalPreviousTime = previous.reduce(
				(sum, lap) => sum + lap.time,
				0,
			);
			const averagePace = totalPreviousTime / totalPreviousDistance;
			return prev.map((lap, lapIndex) =>
				lapIndex === index
					? {...lap, time: Math.round(averagePace * current.distance)}
					: lap,
			);
		});
	}

	function reset() {
		markHistoryChange();
		regenerate(distance, targetInput);
	}

	function addAction(lapIndex: number, consumableId: string) {
		const consumable = consumables.find(item => item.id === consumableId);
		if (!consumable || !selectedConsumableIdSet.has(consumableId)) return;
		if (!canUsePaidConsumables && consumable.paid) return;

		const current = actions[lapIndex] ?? [];
		if (!canAddLapAction(accessMode, current.length)) return;
		if (
			!canUseUnlimitedPlanActions &&
			!canAddPlanAction(actions, laps.length)
		) {
			return;
		}

		markHistoryChange();
		setActions(prev => ({
			...prev,
			[lapIndex]: [...(prev[lapIndex] ?? []), consumableId],
		}));
	}

	function addLapDivision(afterLapIndex: number) {
		if (afterLapIndex < 0 || afterLapIndex >= laps.length - 1) return;
		if (normalizedLapDivisions.breaks.includes(afterLapIndex)) return;
		if (!canAddMoreLapDivisions) {
			setUpgradeDialogOpen(true);
			return;
		}

		markHistoryChange();
		setLapDivisions(currentDivisions => {
			const current = normalizeLapDivisions(currentDivisions, laps.length);
			const insertIndex = current.breaks.filter(
				item => item < afterLapIndex,
			).length;
			const descriptions: Record<number, string> = {};

			for (const [key, description] of Object.entries(current.descriptions)) {
				const index = Number(key);
				if (!Number.isInteger(index)) continue;
				descriptions[index <= insertIndex ? index : index + 1] = description;
			}

			descriptions[insertIndex + 1] = "";
			return normalizeLapDivisions(
				{
					breaks: [...current.breaks, afterLapIndex],
					descriptions,
				},
				laps.length,
			);
		});
	}

	function removeLapDivision(afterLapIndex: number) {
		if (!normalizedLapDivisions.breaks.includes(afterLapIndex)) return;

		markHistoryChange();
		setLapDivisions(currentDivisions => {
			const current = normalizeLapDivisions(currentDivisions, laps.length);
			const removeIndex = current.breaks.indexOf(afterLapIndex);
			if (removeIndex < 0) return current;

			const descriptions: Record<number, string> = {};
			for (const [key, description] of Object.entries(current.descriptions)) {
				const index = Number(key);
				if (!Number.isInteger(index) || index === removeIndex + 1) continue;
				descriptions[index > removeIndex + 1 ? index - 1 : index] = description;
			}

			return normalizeLapDivisions(
				{
					breaks: current.breaks.filter(item => item !== afterLapIndex),
					descriptions,
				},
				laps.length,
			);
		});
	}

	function updateLapDivisionDescription(index: number, description: string) {
		setLapDivisions(currentDivisions => ({
			...currentDivisions,
			descriptions: {
				...currentDivisions.descriptions,
				[index]: description,
			},
		}));
	}

	function removeAction(lapIndex: number, actionIndex: number) {
		if (!actions[lapIndex]?.[actionIndex]) return;
		markHistoryChange();
		setActions(prev => {
			const current = prev[lapIndex] ?? [];
			const next = current.filter((_, i) => i !== actionIndex);
			const copy = {...prev};
			if (next.length === 0) delete copy[lapIndex];
			else copy[lapIndex] = next;
			return copy;
		});
	}

	function addConsumable(c: Omit<Consumable, "id">) {
		if (
			!canUseUnlimitedCustomConsumables &&
			!canAddCustomConsumable(consumables)
		) {
			return;
		}

		markHistoryChange();
		const id = newConsumableId();
		setConsumables(prev => [
			...prev,
			{...c, brand: c.brand || "Genéricos", id},
		]);
		setSelectedConsumableIds(prev => [...prev, id]);
	}

	function toggleSelectedConsumable(id: string, selected: boolean) {
		markHistoryChange();
		setSelectedConsumableIds(prev => {
			if (selected) return prev.includes(id) ? prev : [...prev, id];
			return prev.filter(item => item !== id);
		});
	}

	function removeConsumable(id: string) {
		const consumable = consumables.find(item => item.id === id);
		if (!consumable || (!canUsePaidConsumables && consumable.paid)) return;

		markHistoryChange();
		setConsumables(prev => prev.filter(c => c.id !== id));
		setSelectedConsumableIds(prev => prev.filter(item => item !== id));
		// remove ações que usam o item excluído
		setActions(prev => {
			const copy: Record<number, string[]> = {};
			for (const [key, ids] of Object.entries(prev)) {
				const filtered = ids.filter(i => i !== id);
				if (filtered.length > 0) copy[Number(key)] = filtered;
			}
			return copy;
		});
	}
	return (
		<div className='grid items-start gap-6 lg:grid-cols-[380px_1fr]'>
			{/* Painel de configuração */}
			<Card className='h-fit p-6 lg:sticky lg:top-6'>
				<div className='flex items-center justify-between gap-3'>
					<h2 className='text-lg font-semibold'>Configuração</h2>
					<div className='flex items-center gap-1'>
						<Button
							type='button'
							variant='outline'
							size='icon-sm'
							onClick={undoHistory}
							disabled={!canUndo}
							aria-label='Desfazer alteração'
							title='Desfazer'
						>
							<Undo2 className='size-4' />
						</Button>
						<Button
							type='button'
							variant='outline'
							size='icon-sm'
							onClick={redoHistory}
							disabled={!canRedo}
							aria-label='Refazer alteração'
							title='Refazer'
						>
							<Redo2 className='size-4' />
						</Button>
					</div>
				</div>
				<p className='mt-1 text-sm text-muted-foreground text-pretty'>
					Informe a distância e o tempo alvo. O ritmo é dividido igualmente
					entre os trechos.
				</p>
				<div className='mt-4 space-y-2'>
					<span className='text-xs font-medium text-muted-foreground'>
						Distâncias rápidas
					</span>
					<div className='flex flex-wrap gap-2'>
						{PRESETS.map(preset => (
							<Button
								key={preset.distance}
								variant='outline'
								size='sm'
								onClick={() => applyPreset(preset)}
							>
								{formatDisplayDistance(preset.distance, unitSystem)}
							</Button>
						))}
					</div>
				</div>
				<div className='mt-6 space-y-5'>
					<div className='space-y-2'>
						<Label htmlFor='distance'>
							Distância ({distanceUnitLabel(unitSystem)})
						</Label>
						<Input
							id='distance'
							inputMode='decimal'
							value={distanceInput}
							onFocus={rememberFieldHistorySnapshot}
							onChange={e => handleDistanceChange(e.target.value)}
							onBlur={commitFocusedFieldHistorySnapshot}
							placeholder='5'
						/>
					</div>

					<div className='space-y-2'>
						<Label>Definir alvo por</Label>
						<div className='grid grid-cols-2 gap-1 rounded-lg bg-muted p-1'>
							<button
								type='button'
								onClick={() => handleTargetModeChange("time")}
								aria-pressed={targetMode === "time"}
								className={cn(
									"rounded-md py-1.5 text-sm font-medium transition-colors",
									targetMode === "time"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								Tempo alvo
							</button>
							<button
								type='button'
								onClick={() => handleTargetModeChange("pace")}
								aria-pressed={targetMode === "pace"}
								className={cn(
									"rounded-md py-1.5 text-sm font-medium transition-colors",
									targetMode === "pace"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								Pace alvo
							</button>
						</div>
					</div>

					{targetMode === "time" ? (
						<div className='space-y-2'>
							<Label htmlFor='target'>Tempo alvo (mm:ss ou h:mm:ss)</Label>
							<Input
								id='target'
								value={targetInput}
								onFocus={rememberFieldHistorySnapshot}
								onChange={e => handleTargetChange(e.target.value)}
								onBlur={commitFocusedFieldHistorySnapshot}
								placeholder='25:00'
							/>
						</div>
					) : (
						<div className='space-y-2'>
							<Label htmlFor='pace'>
								Pace alvo (mm:ss {paceUnitLabel(unitSystem)})
							</Label>
							<Input
								id='pace'
								value={paceInput}
								onFocus={rememberFieldHistorySnapshot}
								onChange={e => handlePaceChange(e.target.value)}
								onBlur={commitFocusedFieldHistorySnapshot}
								placeholder='5:00'
							/>
							<p className='text-xs text-muted-foreground text-pretty'>
								Tempo total estimado:{" "}
								<span className='font-mono tabular-nums text-foreground'>
									{targetSeconds > 0 ? formatTime(targetSeconds) : "--"}
								</span>
							</p>
						</div>
					)}
					<div className='space-y-2'>
						<Label htmlFor='strategy'>Estratégia</Label>
						<Select value={strategy} onValueChange={handleStrategyChange}>
							<SelectTrigger id='strategy' className='w-full'>
								{STRATEGIES.find(s => s.value === strategy)?.label ??
									"Estratégia"}
							</SelectTrigger>
							<SelectContent>
								{STRATEGIES.map(s => (
									<SelectItem key={s.value} value={s.value}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className='text-xs text-muted-foreground text-pretty'>
							{STRATEGIES.find(s => s.value === strategy)?.hint}
						</p>
					</div>

					<div className='space-y-3 rounded-lg border border-border p-4'>
						<div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
							<div className='space-y-1.5'>
								<Label htmlFor='initial-pace'>
									Pace inicial ({paceUnitLabel(unitSystem)})
								</Label>
								<Input
									id='initial-pace'
									value={initialPaceInput}
									onFocus={rememberFieldHistorySnapshot}
									onChange={e => handleInitialPaceChange(e.target.value)}
									onBlur={commitFocusedFieldHistorySnapshot}
									placeholder={
										strategy === "negative"
											? "5:20"
											: strategy === "positive"
												? "4:40"
												: "5:00"
									}
									aria-invalid={initialPaceIsInvalid}
									className='h-8 text-center font-mono tabular-nums sm:w-24'
								/>
							</div>
							<div className='space-y-1.5'>
								<Label htmlFor='initial-pace-segments'>Trechos</Label>
								<Input
									id='initial-pace-segments'
									inputMode='numeric'
									value={initialPaceSegmentInput}
									onFocus={rememberFieldHistorySnapshot}
									onChange={e =>
										handleInitialPaceSegmentsChange(e.target.value)
									}
									onBlur={commitFocusedFieldHistorySnapshot}
									aria-invalid={
										hasInitialPaceInput && initialPaceSegmentsAreInvalid
									}
									className='h-8 text-center font-mono tabular-nums sm:w-20'
									min={1}
									max={maxInitialPaceSegments}
								/>
							</div>
						</div>
						{initialPaceIsInvalid ? (
							<p className='text-xs text-destructive text-pretty'>
								Esse pace inicial ou quantidade de trechos não bate com o alvo.
							</p>
						) : finalPaceFromInitial != null && initialPaceSeconds != null ? (
							<p className='text-xs text-muted-foreground text-pretty'>
								{strategy === "constant"
									? "Pace dos trechos restantes estimado"
									: "Pace final estimado"}
								: {formatTime(toDisplayPace(finalPaceFromInitial, unitSystem))}{" "}
								{paceUnitLabel(unitSystem)}.
							</p>
						) : (
							<p className='text-xs text-muted-foreground text-pretty'>
								Se vazio, a divisão usa apenas a estratégia selecionada.
							</p>
						)}
					</div>

					<div
						className={`space-y-3 ${!VARIACAO_PACE_HABILITADA ? "opacity-50" : ""}`}
					>
						<div className='flex items-center justify-between gap-2'>
							<Label htmlFor='spread'>Variação máxima de pace</Label>
							<div className='flex items-center gap-1'>
								<Input
									id='spread'
									inputMode='decimal'
									value={spreadInput}
									onFocus={rememberFieldHistorySnapshot}
									aria-disabled={
										!VARIACAO_PACE_HABILITADA || !canUseCustomSplitSpread
									}
									disabled={
										!VARIACAO_PACE_HABILITADA || !canUseCustomSplitSpread
									}
									onChange={e => handleSpreadInputChange(e.target.value)}
									onBlur={() => {
										setSpreadInput(String(spreadPct));
										commitFocusedFieldHistorySnapshot();
									}}
									className='h-8 w-16 text-center font-mono tabular-nums'
									aria-label='Variação máxima de pace em porcentagem'
								/>
								<span className='text-sm text-muted-foreground'>%</span>
							</div>
						</div>
						<Slider
							value={[spreadPct]}
							onValueChange={v => applySpread(Array.isArray(v) ? v[0] : v)}
							min={0}
							max={30}
							step={0.5}
							disabled={!VARIACAO_PACE_HABILITADA || !canUseCustomSplitSpread}
							aria-disabled={
								!VARIACAO_PACE_HABILITADA || !canUseCustomSplitSpread
							}
							aria-label='Variação máxima de pace'
						/>
						<p className='text-xs text-muted-foreground text-pretty'>
							Diferença de ritmo entre o início e o fim da prova. Quanto maior,
							mais acentuada a aceleração ou desaceleração.
						</p>
						{!canUseCustomSplitSpread && (
							<Button
								variant={"link"}
								onClick={() => setUpgradeDialogOpen(true)}
							>
								Desbloquear controle de ritmo
							</Button>
						)}
					</div>

					<div className='flex relative items-start justify-between gap-4 rounded-lg border border-border p-4'>
						<div className='space-y-1'>
							<Label htmlFor='recalc' className='cursor-pointer'>
								Recalcular trechos seguintes
							</Label>
							<p className='text-xs text-muted-foreground text-pretty'>
								Ao editar um trecho, ajusta os seguintes para manter o tempo
								alvo. Desmarcado, apenas o trecho editado muda.
							</p>
						</div>
						<Switch
							id='recalc'
							checked={recalc}
							onCheckedChange={checked => {
								markHistoryChange();
								setRecalc(checked);
							}}
						/>
					</div>

					{/* Ações de nutrição/hidratação */}
					<div className='space-y-4 rounded-lg border border-border p-4'>
						<div className='flex items-start justify-between gap-4'>
							<div className='space-y-1'>
								<Label htmlFor='show-actions' className='cursor-pointer'>
									Exibir ações por trecho
								</Label>
								<p className='text-xs text-muted-foreground text-pretty'>
									Permite adicionar consumíveis (gel, sódio, cafeína) a cada
									trecho e calcula o total ingerido.
								</p>
							</div>
							<Switch
								id='show-actions'
								checked={showActions}
								onCheckedChange={checked => {
									markHistoryChange();
									setShowActions(checked);
								}}
							/>
						</div>

						{showActions && (
							<div className='space-y-3'>
								<p className='text-xs text-muted-foreground'>
									{canUseUnlimitedPlanActions
										? `${actionCount} ações usadas neste plano.`
										: `${actionCount} de ${actionLimit} ações usadas neste plano.`}
								</p>
								<ConsumableManager
									consumables={consumables}
									selectedIds={selectedConsumableIds}
									canAddUnlimitedCustomConsumables={
										canUseUnlimitedCustomConsumables
									}
									onToggleSelected={toggleSelectedConsumable}
									onAdd={addConsumable}
									onRemove={removeConsumable}
								/>
							</div>
						)}
					</div>
					<Button
						variant='ghost'
						onClick={reset}
						className='w-full gap-2'
						disabled={laps.length === 0}
					>
						<RotateCcw className='size-4' />
						Redividir trechos
					</Button>
				</div>
			</Card>

			{/* Resultado */}
			<div className='flex flex-col gap-4'>
				<div className='grid shrink-0 gap-4 grid-cols-2'>
					<StatCard
						label='Tempo total'
						value={formatTime(totalTime)}
						detail={
							targetMode === "time"
								? diff === 0
									? "no alvo"
									: `${diff > 0 ? "+" : "-"}${formatTime(Math.abs(diff))} do alvo`
								: undefined
						}
						detailTone={diff === 0 ? "ok" : diff > 0 ? "over" : "under"}
					/>
					<StatCard
						label='Pace médio'
						value={
							avgPace > 0
								? `${formatTime(toDisplayPace(avgPace, unitSystem))} ${paceUnitLabel(unitSystem)}`
								: "--"
						}
						detail={
							targetMode === "pace"
								? Math.round(paceDiff) === 0
									? "no alvo"
									: `${paceDiff > 0 ? "+" : "-"}${formatTime(
											toDisplayPace(Math.abs(paceDiff), unitSystem),
										)} ${paceUnitLabel(unitSystem)} do alvo`
								: undefined
						}
						detailTone={
							Math.round(paceDiff) === 0
								? "ok"
								: paceDiff > 0
									? "over"
									: "under"
						}
					/>
				</div>

				<Card className='flex flex-col overflow-hidden p-0'>
					<div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-4'>
						<Timer className='size-4 text-primary' />
						<h2 className='font-semibold'>Trecho a trecho</h2>
						<div className='ml-auto flex flex-wrap items-center justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowLapDivisionOptions(value => !value)}
								className='h-7 gap-1.5 px-2.5 text-xs'
							>
								{showLapDivisionOptions ? (
									<>
										<EyeOff className='size-3.5' />
										Ocultar divisões
									</>
								) : (
									<>
										<Eye className='size-3.5' />
										Mostrar divisões
									</>
								)}
							</Button>
							{canCollapse && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										markHistoryChange();
										setCollapseEmpty(v => !v);
									}}
									className='h-7 gap-1.5 px-2.5 text-xs'
								>
									{collapsed ? (
										<>
											<Eye className='size-3.5' />
											Mostrar todos
										</>
									) : (
										<>
											<EyeOff className='size-3.5' />
											Só trechos com ação
										</>
									)}
								</Button>
							)}
							<span className='text-sm text-muted-foreground'>
								{collapsed
									? `${hiddenCount} ocultos`
									: `${laps.length} ${laps.length === 1 ? "trecho" : "trechos"}`}
							</span>
						</div>
					</div>

					<div className='relative'>
						{isLoadingConfig ? (
							<div className='absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm'>
								<div className='flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium shadow-sm'>
									<div className='size-2.5 animate-pulse rounded-full bg-primary' />
									<span>Carregando trechos...</span>
								</div>
							</div>
						) : null}

						<div className={isLoadingConfig ? "opacity-60 blur-[1px]" : ""}>
							{laps.length === 0 ? (
								<p className='px-5 py-10 text-center text-sm text-muted-foreground'>
									Informe uma distância e um tempo alvo válidos para ver o
									plano.
								</p>
							) : (
								<ul className='divide-y divide-border'>
									<LapBlockHeader
										block={lapDivisionSummaries.initial}
										description={normalizedLapDivisions.descriptions[0] ?? ""}
										onDescriptionFocus={rememberFieldHistorySnapshot}
										onDescriptionChange={value =>
											updateLapDivisionDescription(0, value)
										}
										onDescriptionBlur={commitFocusedFieldHistorySnapshot}
									/>
									{renderItems.map((item, pos) => {
										if (item.type === "gap") {
											return (
												<SuppressedRow key={`gap-${pos}`} count={item.count} />
											);
										}

										const block = lapDivisionSummaries.byBreakIndex.get(
											item.index,
										);
										const hasBoundaryAfter = item.index < laps.length - 1;
										const isDivisionBoundary = lapDivisionBreakSet.has(
											item.index,
										);

										return (
											<Fragment key={item.index}>
												<LapRow
													index={item.index}
													lap={laps[item.index]}
													cumulative={laps
														.slice(0, item.index + 1)
														.reduce((a, l) => a + l.time, 0)}
													totalLaps={laps.length}
													onCommit={raw => commitLap(item.index, raw)}
													onRepeatNext={count =>
														repeatLapValueNext(item.index, count)
													}
													onRepeatToEnd={() => repeatLapValueToEnd(item.index)}
													onCopyPreviousAverage={count =>
														copyPreviousAverageToLap(item.index, count)
													}
													showActions={showActions}
													canAddMultipleActions={canUseMultipleActionsPerLap}
													canAddMorePlanActions={canAddMorePlanActions}
													consumables={consumables}
													availableConsumables={selectedConsumables}
													lapActions={actions[item.index] ?? []}
													onAddAction={id => addAction(item.index, id)}
													onRemoveAction={actionIndex =>
														removeAction(item.index, actionIndex)
													}
													onRequestUpgrade={() => setUpgradeDialogOpen(true)}
													paidMode={canUseUnlimitedPlanActions}
												/>
												{block && !collapsed ? (
													<LapBlockHeader
														block={block}
														description={
															normalizedLapDivisions.descriptions[
																block.index
															] ?? ""
														}
														onDescriptionFocus={rememberFieldHistorySnapshot}
														onDescriptionChange={value =>
															updateLapDivisionDescription(block.index, value)
														}
														onDescriptionBlur={
															commitFocusedFieldHistorySnapshot
														}
													/>
												) : null}
												{hasBoundaryAfter &&
												!collapsed &&
												showLapDivisionOptions ? (
													<LapDivisionBoundary
														isActive={isDivisionBoundary}
														canAdd={canAddMoreLapDivisions}
														onAdd={() => addLapDivision(item.index)}
														onRemove={() => removeLapDivision(item.index)}
														onRequestUpgrade={() => setUpgradeDialogOpen(true)}
													/>
												) : null}
											</Fragment>
										);
									})}
								</ul>
							)}
						</div>
					</div>
				</Card>

				{showActions && (
					<NutritionSummary nutrition={nutrition} totalSeconds={totalTime} />
				)}
			</div>

			<UpgradeDialog
				open={upgradeDialogOpen}
				onClose={() => setUpgradeDialogOpen(false)}
			/>
		</div>
	);
}
