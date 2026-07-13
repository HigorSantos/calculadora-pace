import type {TargetMode} from "@/components/pace-calculator-parts/utils";
import type {Consumable, Lap, Strategy} from "@/lib/pace";
import type {UnitSystem} from "@/lib/units";

export const PACE_HISTORY_STORAGE_KEY = "arsenal-pace-calculator-history:v1";
export const SELECTED_CONSUMABLES_STORAGE_KEY = "arsenal-selected-consumables:v1";
export const PACE_EXPORT_SCHEMA = "arsenal-do-corredor/pace-calculator-export";
export const SUPPORTED_PACE_EXPORT_VERSION = 1;

export type ExportedConsumable = Consumable & {
	source: "default" | "user" | "race";
	userCreated: boolean;
};

export type ExportedLapAction = {
	id: string;
	itemId: string;
	item: ExportedConsumable | null;
	userCreated: boolean;
};

export type PaceQueryValues = {
	distance: string;
	targetType: TargetMode;
	targetValue: string;
	strategy: Strategy;
	initialPace: string;
	initialPaceSegments: string;
};

export type LapDivisionConfig = {
	breaks: number[];
	descriptions: Record<number, string>;
};

export type PaceHistorySnapshot = {
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
	selectedRaceId: string;
	actions: Record<number, string[]>;
	collapseEmpty: boolean;
};

export type PaceHistoryState = {
	past: PaceHistorySnapshot[];
	future: PaceHistorySnapshot[];
};

export type StoredPaceHistory = {
	version: 1;
	current: PaceHistorySnapshot;
	history: PaceHistoryState;
};

export type PendingImportReview = {
	fileName: string;
	loadedAt: string;
	version: number | null;
	exportedAt: string | null;
	lapCount: number;
	actionCount: number;
	divisionCount: number;
	imported: {
		unitSystem: UnitSystem | null;
		snapshot: PaceHistorySnapshot;
	};
};

export type ImportDialogState =
	| {status: "empty"}
	| {status: "ready"; review: PendingImportReview}
	| {status: "error"; fileName: string; message: string};

export type PaceCalculatorExport = {
	schema: typeof PACE_EXPORT_SCHEMA;
	version: typeof SUPPORTED_PACE_EXPORT_VERSION;
	exportedAt: string;
	app: {
		name: "Arsenal do Corredor";
		url: "https://arsenaldocorredor.com.br";
	};
	configuration: {
		unitSystem: string;
		values: PaceQueryValues;
		storedTargetValues: {time: string; pace: string};
		recalcFollowingLaps: boolean;
		spreadPct: number;
		spreadInput: string;
		targetSeconds: number;
		totalDistanceKm: number;
		totalTimeSeconds: number;
		averagePaceSecondsPerKm: number;
		selectedRaceId?: string;
	};
	consumables: ExportedConsumable[];
	selectedConsumableIds: string[];
	laps: Array<{
		index: number;
		number: number;
		distanceKm: number;
		paceSecondsPerKm: number;
		timeSeconds: number;
		actions: ExportedLapAction[];
	}>;
	divisions: {
		breaks: number[];
		descriptions: Record<number, string>;
		items: Array<{
			index: number;
			kind: "pre-race" | "split";
			description: string;
			breakAfterLap?: number;
			startLap?: number;
			endLap?: number;
			blockTimeSeconds?: number;
			cumulativeTimeSeconds?: number;
		}>;
	};
};

export type LapDivisionSummaries = {
	initial: {index: number; isInitial: true};
	byBreakIndex: Map<
		number,
		{
			index: number;
			startLabel: number;
			endLabel: number;
			blockSeconds: number;
			cumulativeSeconds: number;
		}
	>;
};
