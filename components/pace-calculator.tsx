"use client";

import {
	Fragment,
	type ChangeEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Check,
	CreditCard,
	DownloadIcon,
	Heart,
	Eye,
	EyeOff,
	Redo2,
	RotateCcw,
	Share2Icon,
	Timer,
	Undo2,
	UploadIcon,
	CoffeeIcon,
} from "lucide-react";
import {useRouter} from "next/navigation";

import {useBillingAccess} from "@/components/billing-access-provider";
import {ConsumableManager} from "@/components/pace-calculator-parts/consumable-manager";
import {
	LapBlockHeader,
	LapDivisionBoundary,
} from "@/components/pace-calculator-parts/lap-division";
import {
	LapRow,
	SuppressedRow,
} from "@/components/pace-calculator-parts/lap-row";
import {NutritionSummary} from "@/components/pace-calculator-parts/nutrition-summary";
import {StatCard} from "@/components/pace-calculator-parts/stat-card";
import {
	buildLapDistanceRanges,
	buildLapDivisionSummaries,
	cloneHistoryValue,
	areHistorySnapshotsEqual,
	arePaceQueryValuesEqual,
	defaultLapDivisions,
	defaultSelectedConsumableIds,
	filterActionsByLapCount,
	mergeLapActions,
	normalizeLapDivisions,
	isRecord,
	parseStoredPaceHistory,
	parseStoredSelectedConsumables,
	sameDistance,
	shiftActionsAfterLapInsertion,
	shiftActionsAfterLapRemoval,
	withoutRaceActions,
} from "@/components/pace-calculator-parts/history";
import {
	buildPaceCalculatorExport,
	countImportedActions,
	countImportedDivisions,
	downloadJsonFile,
	formatImportDateTime,
	getImportValidationMessage,
	hasManualLapSplits,
	isValidDateString,
	numberValue,
	parseImportedPaceCalculatorExport,
	safeExportFilename,
	type PaceCalculatorExportOptions,
} from "@/components/pace-calculator-parts/import-export";
import {
	PACE_HISTORY_STORAGE_KEY,
	SELECTED_CONSUMABLES_STORAGE_KEY,
	type ImportDialogState,
	type LapDivisionConfig,
	type PaceHistorySnapshot,
	type PaceHistoryState,
	type StoredPaceHistory,
} from "@/components/pace-calculator-parts/types";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {Slider} from "@/components/ui/slider";
import {Switch} from "@/components/ui/switch";
import {useUnitSystem} from "@/components/unit-system-provider";
import {useQueryStringState} from "@/hooks/use-query-string-state";
import {
	NO_RACE_CONFIG_ID,
	RACE_CONFIGURATIONS,
	buildRaceActions,
	formatRaceDate,
	formatRaceDistance,
	isRaceConfigurationVisible,
	isRaceConsumableId,
	raceConsumables,
} from "@/lib/race-configurations";
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
	buildLapsFromDistances,
	computeNutrition,
	DEFAULT_CONSUMABLES,
	DEFAULT_SPREAD,
	deriveConstantPaceAfterInitialSegments,
	deriveFinalPaceFromInitialPace,
	formatTime,
	parseTime,
	splitLapAtDistance,
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
import {useUmami} from "@/hooks/use-umami";

const DEFAULT_EXPORT_OPTIONS: PaceCalculatorExportOptions = {
	includeInitialPace: true,
	includeCustomSplitSpread: true,
	includeLapActions: true,
	includeLapDivisions: true,
	includeManualLapSplits: true,
};

export function PaceCalculator() {
	const {
		accessMode,
		canAccess,
		isHydrated: isBillingAccessHydrated,
	} = useBillingAccess();

	const {trackEvent} = useUmami();
	const router = useRouter();

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [exportOptions, setExportOptions] =
		useState<PaceCalculatorExportOptions>(() => ({...DEFAULT_EXPORT_OPTIONS}));
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [importDialogState, setImportDialogState] = useState<ImportDialogState>(
		{
			status: "empty",
		},
	);
	const [shareCopied, setShareCopied] = useState(false);
	const shareFeedbackTimeoutRef = useRef<number | null>(null);
	const importInputRef = useRef<HTMLInputElement | null>(null);
	const {unitSystem, setUnitSystem} = useUnitSystem();
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
	const [selectedRaceId, setSelectedRaceId] = useState(NO_RACE_CONFIG_ID);
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
	const manualDistanceEditRef = useRef(false);
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
	const lapDistanceRanges = useMemo(() => buildLapDistanceRanges(laps), [laps]);
	const diff = totalTime - targetSeconds;
	const avgPace = totalDistance > 0 ? totalTime / totalDistance : 0;
	// No modo pace, a diferença exibida é de ritmo, não de tempo total.
	const targetDisplayPace = targetMode === "pace" ? parseTime(paceInput) : null;
	const targetPace =
		targetDisplayPace == null
			? 0
			: fromDisplayPace(targetDisplayPace, unitSystem);
	const paceDiff = avgPace > 0 && targetPace > 0 ? avgPace - targetPace : 0;

	function openPremiumPage(source: string) {
		trackEvent("premium_cta_click", {
			source,
			distance: totalDistance,
			accessMode,
		});
		router.push(`/premium?source=${encodeURIComponent(source)}`);
	}

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
	const availableRaceConfigurations = useMemo(
		() =>
			RACE_CONFIGURATIONS.filter(race => isRaceConfigurationVisible(race)).sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			),
		[],
	);
	const selectedRace = useMemo(
		() =>
			availableRaceConfigurations.find(race => race.id === selectedRaceId) ??
			null,
		[availableRaceConfigurations, selectedRaceId],
	);
	const actionLimit = maxActionsForLapCount(laps.length);
	const limitedActions = useMemo(() => withoutRaceActions(actions), [actions]);
	const actionCount = countActionsWithinLaps(limitedActions, laps.length);
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

	const hasExportInitialPaceConfig =
		values.initialPace.trim().length > 0 || values.initialPaceSegments !== "1";
	const hasExportCustomSplitSpread =
		canUseCustomSplitSpread && strategy !== "constant";
	const hasExportLapActions = hasAnyAction;
	const hasExportLapDivisions =
		normalizedLapDivisions.breaks.length > 0 ||
		Object.values(normalizedLapDivisions.descriptions).some(
			description => description.trim().length > 0,
		);
	const hasExportManualLapSplits = useMemo(
		() => hasManualLapSplits(laps, totalDistance),
		[laps, totalDistance],
	);
	const selectedExportOptions: PaceCalculatorExportOptions = {
		includeInitialPace:
			exportOptions.includeInitialPace && hasExportInitialPaceConfig,
		includeCustomSplitSpread:
			exportOptions.includeCustomSplitSpread && hasExportCustomSplitSpread,
		includeLapActions: exportOptions.includeLapActions && hasExportLapActions,
		includeLapDivisions:
			exportOptions.includeLapDivisions && hasExportLapDivisions,
		includeManualLapSplits:
			exportOptions.includeManualLapSplits && hasExportManualLapSplits,
	};

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
	const strategyDistances = useMemo(() => {
		if (sameDistance(totalDistance, distance)) {
			return laps.map(lap => lap.distance);
		}

		return buildDistances(distance);
	}, [distance, laps, totalDistance]);
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
			selectedRaceId,
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
		setSelectedRaceId(snapshot.selectedRaceId ?? NO_RACE_CONFIG_ID);
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
		const nextDistances = sameDistance(totalDistance, nextDistance)
			? laps.map(lap => lap.distance)
			: buildDistances(nextDistance);

		setLaps(
			buildLapsFromDistances(
				nextDistances,
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
		selectedRaceId,
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

	useEffect(() => {
		if (!manualDistanceEditRef.current) return;
		manualDistanceEditRef.current = false;
		clearRaceSelection({clearAllActions: true});
	}, [distanceInput]);

	function clearRaceSelection(options?: {clearAllActions?: boolean}) {
		setSelectedRaceId(NO_RACE_CONFIG_ID);
		setConsumables(currentConsumables =>
			currentConsumables.filter(
				consumable => !isRaceConsumableId(consumable.id),
			),
		);
		setSelectedConsumableIds(currentIds =>
			currentIds.filter(id => !isRaceConsumableId(id)),
		);
		setActions(currentActions =>
			options?.clearAllActions ? {} : withoutRaceActions(currentActions),
		);
	}

	function handleDistanceChange(value: string) {
		manualDistanceEditRef.current = true;
		markHistoryChange();
		setValue("distance", value);
		clearRaceSelection({clearAllActions: true});
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
		trackEvent("change_target_mode", {targetMode});
	}

	function handleStrategyChange(value: Strategy | null) {
		if (!value || value === strategy) return;
		markHistoryChange();
		setValue("strategy", value);
		trackEvent("change_strategy", {strategy: value});
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
		clearRaceSelection({clearAllActions: true});
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
		trackEvent("apply_preset", {preset: preset.distance});
	}

	function applyRaceConfiguration(raceId: string | null) {
		const nextRaceId = raceId || NO_RACE_CONFIG_ID;
		const race =
			availableRaceConfigurations.find(item => item.id === nextRaceId) ?? null;
		const baseConsumables = consumables.filter(
			consumable => !isRaceConsumableId(consumable.id),
		);
		const baseSelectedConsumableIds = selectedConsumableIds.filter(
			id => !isRaceConsumableId(id),
		);
		const baseActions = withoutRaceActions(actions);

		markHistoryChange();
		setSelectedRaceId(race?.id ?? NO_RACE_CONFIG_ID);

		if (!race) {
			clearRaceSelection();
			return;
		}

		const nextDistance = race.distanceKm;
		const nextDistanceInput = formatDisplayNumber(
			toDisplayDistance(nextDistance, unitSystem),
			{maximumFractionDigits: 3},
		).replace(".", ",");
		const nextTargetSeconds = resolveTargetSeconds(
			targetMode,
			nextDistance,
			targetInput,
			paceInput,
			unitSystem,
		);
		const displayInitialPace =
			initialPaceInput.trim() === "" ? null : parseTime(initialPaceInput);
		const nextInitialPace =
			displayInitialPace == null
				? null
				: fromDisplayPace(displayInitialPace, unitSystem);
		const nextLaps =
			nextTargetSeconds == null || nextTargetSeconds <= 0
				? []
				: buildLaps(
						nextDistance,
						nextTargetSeconds,
						strategy,
						spreadPct / 100,
						nextInitialPace,
						initialPaceSegments,
					);
		const nextRaceConsumables = raceConsumables(race);
		const nextRaceConsumableIds = nextRaceConsumables.map(item => item.id);
		const nextActions = mergeLapActions(
			filterActionsByLapCount(baseActions, nextLaps.length),
			buildRaceActions(race, nextLaps),
		);

		skipNextRegenerateRef.current = true;
		setValues({distance: nextDistanceInput});
		setLaps(nextLaps);
		setShowActions(true);
		setConsumables([...baseConsumables, ...nextRaceConsumables]);
		setSelectedConsumableIds(
			Array.from(
				new Set([...baseSelectedConsumableIds, ...nextRaceConsumableIds]),
			),
		);
		setActions(nextActions);
		trackEvent("apply_race_configuration", {
			race_id: race.id,
			race_nam: race.name,
			race_distance: race.distanceKm,
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
		trackEvent("repeat_lap_to_end", {distance: totalDistance});
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
		trackEvent("copy_average_laps", {distance: totalDistance});
	}

	function reset() {
		markHistoryChange();
		regenerate(distance, targetInput);
	}

	function addAction(lapIndex: number, consumableId: string) {
		const consumable = consumables.find(item => item.id === consumableId);
		if (!consumable || !selectedConsumableIdSet.has(consumableId)) {
			return;
		}
		trackEvent("add_action", {
			type: "init",
			consumable_brand: consumable.brand,
			distance: totalDistance,
		});
		if (!canUsePaidConsumables && consumable.paid) {
			trackEvent("block_paid_consumable", {consumable: consumable.name});

			return;
		}

		const current = actions[lapIndex] ?? [];
		const currentLimitedActionCount = current.filter(
			id => !isRaceConsumableId(id),
		).length;
		if (!canAddLapAction(accessMode, currentLimitedActionCount)) {
			trackEvent("block_lap_action", {accessMode: accessMode});

			return;
		}
		if (
			!canUseUnlimitedPlanActions &&
			!canAddPlanAction(limitedActions, laps.length)
		) {
			trackEvent("block_plan_action", {accessMode: accessMode});

			return;
		}

		markHistoryChange();
		setActions(prev => ({
			...prev,
			[lapIndex]: [...(prev[lapIndex] ?? []), consumableId],
		}));
		trackEvent("add_action", {
			type: "add",
			consumable_brand: consumable.brand,
			distance: totalDistance,
		});
	}

	function removeLap(index: number) {
		if (laps.length <= 1 || !laps[index]) return;

		const mergeTargetIndex = index < laps.length - 1 ? index + 1 : index - 1;
		const firstIndex = Math.min(index, mergeTargetIndex);
		const secondIndex = Math.max(index, mergeTargetIndex);
		const firstLap = laps[firstIndex];
		const secondLap = laps[secondIndex];
		if (!firstLap || !secondLap) return;

		const nextLaps = laps.map(lap => ({...lap}));
		nextLaps.splice(firstIndex, 2, {
			distance: Number((firstLap.distance + secondLap.distance).toFixed(3)),
			time: firstLap.time + secondLap.time,
		});
		const removedBoundaryIndex = firstIndex;

		markHistoryChange();
		setLaps(nextLaps);
		setActions(currentActions =>
			shiftActionsAfterLapRemoval(currentActions, index, mergeTargetIndex),
		);
		setLapDivisions(currentDivisions => {
			const current = normalizeLapDivisions(currentDivisions, laps.length);
			const keptBreaks = current.breaks.filter(
				breakIndex => breakIndex !== removedBoundaryIndex,
			);
			const nextBreaks = keptBreaks.map(breakIndex =>
				breakIndex > removedBoundaryIndex ? breakIndex - 1 : breakIndex,
			);
			const descriptions: Record<number, string> = {
				0: current.descriptions[0] ?? "",
			};

			for (const breakIndex of keptBreaks) {
				const oldPosition = current.breaks.indexOf(breakIndex) + 1;
				const newBreakIndex =
					breakIndex > removedBoundaryIndex ? breakIndex - 1 : breakIndex;
				const newPosition = nextBreaks.indexOf(newBreakIndex) + 1;
				if (newPosition > 0) {
					descriptions[newPosition] = current.descriptions[oldPosition] ?? "";
				}
			}

			return normalizeLapDivisions(
				{breaks: nextBreaks, descriptions},
				nextLaps.length,
			);
		});
		trackEvent("remove_lap", {distance: totalDistance});
	}

	function addLapDivision(afterLapIndex: number) {
		if (afterLapIndex < 0 || afterLapIndex >= laps.length - 1) return;
		if (normalizedLapDivisions.breaks.includes(afterLapIndex)) return;
		if (!canAddMoreLapDivisions) {
			trackEvent("block_add_lap_division", {distance: totalDistance});
			openPremiumPage("lap-division-limit");

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

		trackEvent("add_lap_division", {distance: totalDistance});
	}

	function formatSplitDistanceInput(distanceKm: number) {
		return formatDisplayNumber(toDisplayDistance(distanceKm, unitSystem), {
			maximumFractionDigits: 3,
		}).replace(".", ",");
	}

	function addLapSplit(afterLapIndex: number, rawDistance: string) {
		const splitDistance = parseDisplayDistance(rawDistance, unitSystem);
		if (splitDistance == null) return false;

		const result = splitLapAtDistance(laps, afterLapIndex, splitDistance);
		if (!result) {
			return false;
		}

		markHistoryChange();
		setLaps(result.laps);
		setActions(currentActions =>
			shiftActionsAfterLapInsertion(currentActions, result.insertIndex),
		);
		setLapDivisions(currentDivisions => {
			const current = normalizeLapDivisions(currentDivisions, laps.length);
			return normalizeLapDivisions(
				{
					breaks: current.breaks.map(breakIndex =>
						breakIndex >= result.targetIndex ? breakIndex + 1 : breakIndex,
					),
					descriptions: current.descriptions,
				},
				result.laps.length,
			);
		});
		trackEvent("add_lap_split", {distance: totalDistance});

		return true;
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
		trackEvent("remove_lap_division", {distance: totalDistance});
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
		if (!actions[lapIndex]?.[actionIndex]) {
			return;
		}
		markHistoryChange();
		setActions(prev => {
			const current = prev[lapIndex] ?? [];
			const next = current.filter((_, i) => i !== actionIndex);
			const copy = {...prev};
			if (next.length === 0) delete copy[lapIndex];
			else copy[lapIndex] = next;
			return copy;
		});
		trackEvent("remove_action", {distance: totalDistance});
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
		trackEvent("add_consumable", {distance: totalDistance, consumable_id: id});
	}

	function toggleSelectedConsumable(id: string, selected: boolean) {
		markHistoryChange();
		setSelectedConsumableIds(prev => {
			if (selected) return prev.includes(id) ? prev : [...prev, id];
			return prev.filter(item => item !== id);
		});
	}

	useEffect(() => {
		return () => {
			if (shareFeedbackTimeoutRef.current) {
				window.clearTimeout(shareFeedbackTimeoutRef.current);
			}
		};
	}, []);

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

		trackEvent("remove_consumable", {
			distance: totalDistance,
			consumable_id: id,
		});
	}

	function showShareCopiedFeedback() {
		setShareCopied(true);
		if (shareFeedbackTimeoutRef.current) {
			window.clearTimeout(shareFeedbackTimeoutRef.current);
		}
		shareFeedbackTimeoutRef.current = window.setTimeout(() => {
			setShareCopied(false);
			shareFeedbackTimeoutRef.current = null;
		}, 2400);
	}

	const handleShare = async () => {
		if (typeof window === "undefined") {
			trackEvent("error_copy_link", {
				distance: totalDistance,
				error: "window undefined",
			});

			return;
		}

		const url = new URL(window.location.href);

		for (const [key, value] of Object.entries(values)) {
			if (value.trim() === "") {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}

		const shareUrl = url.toString();

		if (navigator.clipboard?.writeText) {
			const copied = await navigator.clipboard.writeText(shareUrl).then(
				() => true,
				() => false,
			);

			if (copied) {
				showShareCopiedFeedback();
				trackEvent("copy_link", {distance: totalDistance});

				return;
			}
		}

		const textArea = document.createElement("textarea");
		textArea.value = shareUrl;
		textArea.style.position = "fixed";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.select();
		const copied = document.execCommand("copy");
		document.body.removeChild(textArea);

		if (copied) {
			showShareCopiedFeedback();
		}

		trackEvent("copy_link", {distance: totalDistance});
	};

	const updateExportOption = (
		key: keyof PaceCalculatorExportOptions,
		checked: boolean,
	) => {
		setExportOptions(current => ({...current, [key]: checked}));
	};

	const handleDownload = (options: PaceCalculatorExportOptions) => {
		if (typeof window === "undefined") {
			trackEvent("error_download_config", {
				distance: totalDistance,
				error: "window undefined",
			});
			return;
		}

		const exportedAt = new Date();
		const payload = buildPaceCalculatorExport({
			exportedAt,
			unitSystem,
			values: {...values},
			storedTargetValues: {...storedTargetValues},
			recalc,
			spreadPct,
			spreadInput,
			targetSeconds,
			totalDistance,
			totalTime,
			averagePace: avgPace,
			selectedRaceId,
			consumables,
			selectedConsumableIds,
			laps,
			actions,
			normalizedLapDivisions,
			lapDivisionSummaries,
			options,
		});

		downloadJsonFile(safeExportFilename(exportedAt), payload);
		setExportDialogOpen(false);
		trackEvent("download_config", {
			distance: totalDistance,
			includeInitialPace: options.includeInitialPace,
			includeCustomSplitSpread: options.includeCustomSplitSpread,
			includeLapActions: options.includeLapActions,
			includeLapDivisions: options.includeLapDivisions,
			includeManualLapSplits: options.includeManualLapSplits,
		});
	};

	function closeImportDialog() {
		setImportDialogOpen(false);
		setImportDialogState({status: "empty"});
	}

	function confirmImport() {
		if (importDialogState.status !== "ready") {
			return;
		}

		const {imported} = importDialogState.review;
		const before = captureHistorySnapshot();
		pushHistorySnapshot(before, imported.snapshot);

		if (imported.unitSystem) {
			setUnitSystem(imported.unitSystem);
		}

		restoreHistorySnapshot(imported.snapshot);

		trackEvent("import_config", {
			status: "complete",
		});

		closeImportDialog();
	}

	async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = "";
		if (!file) return;

		setImportDialogOpen(true);

		try {
			const parsed = JSON.parse(await file.text()) as unknown;
			const validationMessage = getImportValidationMessage(parsed);
			if (validationMessage) {
				setImportDialogState({
					status: "error",
					fileName: file.name,
					message: validationMessage,
				});
				trackEvent("error_import_config", {
					message: validationMessage,
				});
				return;
			}

			const imported = parseImportedPaceCalculatorExport(parsed);
			if (
				!imported ||
				!isRecord(parsed) ||
				!isValidDateString(parsed.exportedAt)
			) {
				setImportDialogState({
					status: "error",
					fileName: file.name,
					message:
						"A configuração é compatível, mas os dados internos não puderam ser lidos com segurança.",
				});
				trackEvent("error_import_config", {
					message: "configuração compatível",
				});
				return;
			}

			setImportDialogState({
				status: "ready",
				review: {
					fileName: file.name,
					loadedAt: new Date().toISOString(),
					version: numberValue(parsed.version),
					exportedAt: parsed.exportedAt,
					lapCount: Array.isArray(parsed.laps) ? parsed.laps.length : 0,
					actionCount: countImportedActions(parsed),
					divisionCount: countImportedDivisions(parsed),
					imported,
				},
			});
		} catch {
			setImportDialogState({
				status: "error",
				fileName: file.name,
				message:
					"Não foi possível ler o arquivo. Selecione um JSON exportado pela calculadora.",
			});
			trackEvent("error_import_config", {
				message: "Não foi possível ler o arquivo",
			});
		}
	}

	return (
		<div className='grid items-start gap-6 lg:grid-cols-[380px_1fr]'>
			{/* Painel de configuração */}
			<Card className='h-fit p-6'>
				<div className='flex items-center justify-between gap-4'>
					<h2 className='text-lg font-semibold'>Configuração</h2>
					<div className='relative flex items-center'>
						<div
							className={cn(
								"flex items-center gap-4 transition-transform duration-200 ease-out",
								shareCopied ? "-translate-x-16" : "translate-x-0",
							)}
						>
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
							<div className='flex items-center gap-1'>
								<Button
									onClick={() => handleShare()}
									title={shareCopied ? "Configuração copiada" : "Compartilhar"}
									size='icon-sm'
									variant='outline'
									aria-label={
										shareCopied
											? "Configuração copiada"
											: "Compartilhar configuração"
									}
								>
									{shareCopied ? <Check className='size-4' /> : <Share2Icon />}
								</Button>
								<Button
									onClick={() => setExportDialogOpen(true)}
									title='Exportar'
									size='icon-sm'
									variant='outline'
									aria-label='Exportar configuração'
								>
									<DownloadIcon />
								</Button>
								<Button
									type='button'
									onClick={() => setImportDialogOpen(true)}
									title='Importar'
									size='icon-sm'
									variant='outline'
									aria-label='Importar configuração'
								>
									<UploadIcon />
								</Button>
							</div>
						</div>
						<span
							className={cn(
								"pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-primary transition-all duration-200 ease-out",
								shareCopied
									? "translate-x-0 opacity-100"
									: "translate-x-2 opacity-0",
							)}
							aria-live='polite'
						>
							{shareCopied ? "Copiada" : ""}
						</span>
					</div>
				</div>
				<p className='mt-1 text-sm text-muted-foreground text-pretty'>
					Informe a distância, tempo ou pace alvo e estratégia. O plano se
					adapta automaticamente.
				</p>
				<div className='mt-2 space-y-5'>
					<div className='flex flex-col items-start gap-6 rounded-lg border border-border p-4'>
						<div className='space-y-2'>
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
						<div className='flex w-full min-w-0 flex-col gap-2 overflow-hidden'>
							<Label htmlFor='race-configuration'>
								Importar dados de prova
							</Label>
							<p className='text-xs text-muted-foreground text-pretty'>
								Selecione uma prova para carregar distância e pontos de apoio.{" "}
								<strong className='underline'>Atenção:</strong> sempre confira
								as informações oficiais junto ao organizador.
							</p>
							<Select
								value={selectedRaceId}
								onValueChange={applyRaceConfiguration}
							>
								<SelectTrigger
									id='race-configuration'
									className='w-full min-w-0 max-w-full [&>span]:w-0 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate'
								>
									<SelectValue
										className='w-0 min-w-0 flex-1 truncate'
										placeholder='Selecione uma prova'
									>
										{availableRaceConfigurations.find(
											r => r.id === selectedRaceId,
										)?.name || "Selecione uma prova"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value={NO_RACE_CONFIG_ID}>
											Nenhuma prova
										</SelectItem>
										{availableRaceConfigurations.map(race => (
											<SelectItem key={race.id} value={race.id}>
												<span className='block min-w-0 truncate'>
													{race.name}
												</span>
												{/* <p className='text-xs text-muted-foreground'>
													{formatRaceDate(race.date)}
												</p> */}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{selectedRace && (
								<>
									<p className='text-xs text-muted-foreground text-pretty'>
										{formatRaceDate(selectedRace.date)} ·{" "}
										{formatRaceDistance(selectedRace.distanceKm)} ·{" "}
										{selectedRace.items.length}{" "}
										{selectedRace.items.length === 1 ? "item" : "itens"} de
										prova
									</p>
								</>
							)}
						</div>
					</div>
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
								onClick={() => openPremiumPage("custom-split-spread")}
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
				{true && (
					// accessMode !== "paid"
					<div className='grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
						<div className='space-y-1'>
							<p className='text-sm font-semibold text-foreground'>
								Apoie o Arsenal da Corrida
							</p>
							<p className='text-xs leading-6 text-muted-foreground'>
								O Buy Me a Coffee é só um apoio ao site para manter toda a
								estrutura do site e <strong>não libera</strong> o Premium.
								{false && (
									<span>
										{" "}
										Para desbloquear ações ilimitadas, e todos os recursos
										pagos, assine o plano anual.
									</span>
								)}
							</p>
						</div>

						<div className='grid gap-2 sm:min-w-56'>
							{false && (
								<Button
									id='comprar-premium'
									type='button'
									className='h-10 w-full gap-2'
									onClick={() => openPremiumPage("premium-button")}
								>
									<CreditCard className='size-4' />
									Assinar Premium
								</Button>
							)}
							<a
								id='buymeacoffee'
								href='https://www.buymeacoffee.com/higorsantos'
								target='_blank'
								rel='noreferrer'
								className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
							>
								<CoffeeIcon className='size-4 text-primary' />
								Apoiar o site (Buy Me a Coffee)
							</a>
						</div>
					</div>
				)}
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
					<div className='flex flex-col shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-4'>
						<div className='flex flex-col items-center gap-0'>
							<div className='flex'>
								<Timer className='size-4 text-primary' />
								<h2 className='font-semibold'>Trecho a trecho</h2>
							</div>
							<span className='text-xs text-muted-foreground'>
								{collapsed
									? `${hiddenCount} ocultos`
									: `${laps.length} ${laps.length === 1 ? "trecho" : "trechos"}`}
							</span>
						</div>
						<div className='w-full flex flex-row items-center justify-center gap-4'>
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
										const range = lapDistanceRanges[item.index] ?? {
											start: item.index,
											end: item.index + laps[item.index].distance,
										};
										const nextRange = lapDistanceRanges[item.index + 1];

										return (
											<Fragment key={item.index}>
												<LapRow
													index={item.index}
													lap={laps[item.index]}
													startDistanceKm={range.start}
													endDistanceKm={range.end}
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
													onRemoveLap={() => removeLap(item.index)}
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
													onRequestUpgrade={() => openPremiumPage("lap-action-limit")}
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
														onRequestUpgrade={() => openPremiumPage("lap-division-limit")}
														splitPlaceholder={
															nextRange
																? formatSplitDistanceInput(
																		range.end + (nextRange.end - range.end) / 2,
																	)
																: undefined
														}
														splitRangeLabel={
															nextRange
																? `${formatDisplayDistance(
																		range.end,
																		unitSystem,
																	)} e ${formatDisplayDistance(nextRange.end, unitSystem)}`
																: undefined
														}
														onAddLapSplit={
															nextRange
																? rawDistance =>
																		addLapSplit(item.index, rawDistance)
																: undefined
														}
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

			<Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
				<DialogContent className='max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto sm:w-full'>
					<DialogHeader className='pr-7'>
						<DialogTitle>Exportar configuração</DialogTitle>
						<DialogDescription>
							Escolha quais dados opcionais entram no arquivo JSON. Distância,
							alvo e estratégia serão incluídos sempre.
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='rounded-md border border-border bg-muted/35 p-3 text-sm'>
							<p className='font-medium text-foreground'>Incluído sempre</p>
							<p className='mt-1 text-muted-foreground'>
								Distância, tipo de alvo, pace ou tempo alvo e estratégia.
							</p>
						</div>

						<div className='flex flex-col gap-2'>
							<label
								className={cn(
									"flex gap-3 rounded-md border border-border p-3 text-sm transition-colors",
									!hasExportInitialPaceConfig && "opacity-55",
								)}
							>
								<input
									type='checkbox'
									className='mt-1 size-4 accent-primary'
									checked={exportOptions.includeInitialPace}
									onChange={event =>
										updateExportOption(
											"includeInitialPace",
											event.target.checked,
										)
									}
								/>
								<span>
									<span className='block font-medium text-foreground'>
										Pace inicial e trechos iniciais
									</span>
									<span className='text-muted-foreground'>
										{hasExportInitialPaceConfig
											? "Inclui a configuração de largada quando preenchida."
											: "Sem configuração de largada preenchida agora."}
									</span>
								</span>
							</label>

							<label
								className={cn(
									"flex gap-3 rounded-md border border-border p-3 text-sm transition-colors",
									!hasExportCustomSplitSpread && "opacity-55",
								)}
							>
								<input
									type='checkbox'
									className='mt-1 size-4 accent-primary'
									checked={exportOptions.includeCustomSplitSpread}
									onChange={event =>
										updateExportOption(
											"includeCustomSplitSpread",
											event.target.checked,
										)
									}
								/>
								<span>
									<span className='block font-medium text-foreground'>
										Variação máxima do split
									</span>
									<span className='text-muted-foreground'>
										{hasExportCustomSplitSpread
											? "Inclui a variação personalizada do split."
											: "Disponível para split positivo ou negativo no plano pago."}
									</span>
								</span>
							</label>

							<label
								className={cn(
									"flex gap-3 rounded-md border border-border p-3 text-sm transition-colors",
									!hasExportLapActions && "opacity-55",
								)}
							>
								<input
									type='checkbox'
									className='mt-1 size-4 accent-primary'
									checked={exportOptions.includeLapActions}
									onChange={event =>
										updateExportOption(
											"includeLapActions",
											event.target.checked,
										)
									}
								/>
								<span>
									<span className='block font-medium text-foreground'>
										Ações dos trechos
									</span>
									<span className='text-muted-foreground'>
										{hasExportLapActions
											? "Inclui as ações e apenas os consumíveis usados nelas."
											: "Sem ações adicionadas aos trechos agora."}
									</span>
								</span>
							</label>

							<label
								className={cn(
									"flex gap-3 rounded-md border border-border p-3 text-sm transition-colors",
									!hasExportLapDivisions && "opacity-55",
								)}
							>
								<input
									type='checkbox'
									className='mt-1 size-4 accent-primary'
									checked={exportOptions.includeLapDivisions}
									onChange={event =>
										updateExportOption(
											"includeLapDivisions",
											event.target.checked,
										)
									}
								/>
								<span>
									<span className='block font-medium text-foreground'>
										Divisões de trecho
									</span>
									<span className='text-muted-foreground'>
										{hasExportLapDivisions
											? "Inclui descrições e tempos dos blocos configurados."
											: "Sem divisões configuradas agora."}
									</span>
								</span>
							</label>

							<label
								className={cn(
									"flex gap-3 rounded-md border border-border p-3 text-sm transition-colors",
									!hasExportManualLapSplits && "opacity-55",
								)}
							>
								<input
									type='checkbox'
									className='mt-1 size-4 accent-primary'
									checked={exportOptions.includeManualLapSplits}
									onChange={event =>
										updateExportOption(
											"includeManualLapSplits",
											event.target.checked,
										)
									}
								/>
								<span>
									<span className='block font-medium text-foreground'>
										Trechos adicionados manualmente
									</span>
									<span className='text-muted-foreground'>
										{hasExportManualLapSplits
											? "Sem isso, os trechos são exportados nos marcos padrão da distância."
											: "Sem trechos manuais adicionados agora."}
									</span>
								</span>
							</label>
						</div>
					</div>

					<DialogFooter className='pt-2'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setExportDialogOpen(false)}
						>
							Cancelar
						</Button>
						<Button
							type='button'
							onClick={() => handleDownload(selectedExportOptions)}
						>
							Exportar JSON
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={importDialogOpen}
				onOpenChange={nextOpen => {
					if (nextOpen) {
						setImportDialogOpen(true);
						return;
					}
					closeImportDialog();
				}}
			>
				<DialogContent className='max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto sm:w-full'>
					<DialogHeader className='pr-7'>
						<DialogTitle>Importar configuração</DialogTitle>
						<DialogDescription>
							Selecione um JSON exportado pela calculadora para validar a versão
							antes de substituir os dados atuais.
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<input
							ref={importInputRef}
							type='file'
							accept='.json,application/json'
							className='hidden'
							onChange={handleImportFile}
						/>
						<Button
							type='button'
							variant='outline'
							onClick={() => importInputRef.current?.click()}
							className='w-full justify-center'
						>
							<UploadIcon />
							Selecionar arquivo JSON
						</Button>

						{importDialogState.status === "empty" ? (
							<p className='text-sm text-muted-foreground'>
								Nenhum arquivo selecionado ainda.
							</p>
						) : null}

						{importDialogState.status === "error" ? (
							<div className='flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm'>
								<span className='font-medium text-foreground'>
									{importDialogState.fileName}
								</span>
								<p className='text-muted-foreground'>
									{importDialogState.message}
								</p>
							</div>
						) : null}

						{importDialogState.status === "ready" ? (
							<div className='flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm'>
								<div>
									<p className='font-medium text-foreground'>
										{importDialogState.review.fileName}
									</p>
									<p className='text-muted-foreground'>
										Versão compatível: {importDialogState.review.version}
									</p>
								</div>
								<div className='grid gap-2 sm:grid-cols-2'>
									<div>
										<span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
											Exportado em
										</span>
										<p>
											{formatImportDateTime(
												importDialogState.review.exportedAt ?? "",
											)}
										</p>
									</div>
									<div>
										<span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
											Lido em
										</span>
										<p>
											{formatImportDateTime(importDialogState.review.loadedAt)}
										</p>
									</div>
								</div>
								<div className='grid grid-cols-3 gap-2 text-center'>
									<div className='rounded-md bg-background px-2 py-2'>
										<p className='text-base font-semibold'>
											{importDialogState.review.lapCount}
										</p>
										<p className='text-xs text-muted-foreground'>trechos</p>
									</div>
									<div className='rounded-md bg-background px-2 py-2'>
										<p className='text-base font-semibold'>
											{importDialogState.review.actionCount}
										</p>
										<p className='text-xs text-muted-foreground'>ações</p>
									</div>
									<div className='rounded-md bg-background px-2 py-2'>
										<p className='text-base font-semibold'>
											{importDialogState.review.divisionCount}
										</p>
										<p className='text-xs text-muted-foreground'>divisões</p>
									</div>
								</div>
								<p className='text-muted-foreground'>
									Ao confirmar, os dados preenchidos na tela serão perdidos e
									substituídos por esta configuração.
								</p>
							</div>
						) : null}
					</div>

					<DialogFooter className='pt-2'>
						<Button type='button' variant='outline' onClick={closeImportDialog}>
							Cancelar
						</Button>
						<Button
							type='button'
							onClick={confirmImport}
							disabled={importDialogState.status !== "ready"}
						>
							Importar configuração
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</div>
	);
}
