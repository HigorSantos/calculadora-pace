"use client";

import {type KeyboardEvent, useEffect, useMemo, useState} from "react";
import {
	Eye,
	EyeOff,
	MoreHorizontal,
	Plus,
	RotateCcw,
	Timer,
	Trash2,
	Utensils,
	X,
} from "lucide-react";
import {
	applyLapEdit,
	buildLaps,
	computeNutrition,
	DEFAULT_CONSUMABLES,
	DEFAULT_SPREAD,
	formatTime,
	parseTime,
	perHour,
	type Consumable,
	type Lap,
	type Strategy,
} from "@/lib/pace";
import {Button, buttonVariants} from "@/components/ui/button";
import {useUnitSystem} from "@/components/unit-system-provider";
import {useQueryStringState} from "@/hooks/use-query-string-state";
import {cn} from "@/lib/utils";
import {
	distanceUnitLabel,
	formatDisplayDistance,
	formatDisplayMass,
	formatDisplayNumber,
	fromDisplayPace,
	paceUnitLabel,
	parseDisplayDistance,
	toDisplayDistance,
	toDisplayPace,
	type UnitSystem,
} from "@/lib/units";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Card} from "@/components/ui/card";
import {Slider} from "@/components/ui/slider";
import {Badge} from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STRATEGIES: {value: Strategy; label: string; hint: string}[] = [
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

type TargetMode = "time" | "pace";

const DEFAULT_DISTANCE_INPUT = "5";
const DEFAULT_TARGET_MODE: TargetMode = "time";
const DEFAULT_TARGET_VALUE = "25:00";
const DEFAULT_PACE_VALUE = "5:00";
const DEFAULT_STRATEGY: Strategy = "constant";

function normalizeTargetMode(value: string): TargetMode {
	return value === "pace" ? "pace" : "time";
}

function normalizeStrategy(value: string): Strategy {
	return STRATEGIES.some(strategy => strategy.value === value)
		? (value as Strategy)
		: DEFAULT_STRATEGY;
}

/** Resolve o tempo alvo total (segundos) conforme o modo escolhido. */
function resolveTargetSeconds(
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

type Preset = {distance: number; time: string};

const PRESETS: Preset[] = [
	{distance: 5, time: "25:00"},
	{distance: 10, time: "50:00"},
	{distance: 21.1, time: "1:45:00"},
	{distance: 42.2, time: "3:45:00"},
];

let consumableSeq = 0;
function newConsumableId() {
	consumableSeq += 1;
	return `custom-${Date.now()}-${consumableSeq}`;
}

function parsePositiveInteger(input: string): number | null {
	const parsed = Number(input);
	if (!Number.isInteger(parsed) || parsed <= 0) return null;
	return parsed;
}

function consumableSummaryForUnit(
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

export function PaceCalculator() {
	const {unitSystem} = useUnitSystem();
	const {values, setValue, setValues, isHydrated} = useQueryStringState({
		distance: DEFAULT_DISTANCE_INPUT,
		targetType: DEFAULT_TARGET_MODE,
		targetValue: DEFAULT_TARGET_VALUE,
		strategy: DEFAULT_STRATEGY,
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
	const [recalc, setRecalc] = useState(true);
	// Variação máxima de pace entre início e fim, em % do pace médio.
	const [spreadPct, setSpreadPct] = useState(DEFAULT_SPREAD * 100);
	const [spreadInput, setSpreadInput] = useState(String(DEFAULT_SPREAD * 100));
	const [laps, setLaps] = useState<Lap[]>(() =>
		buildLaps(5, 25 * 60, "constant", DEFAULT_SPREAD),
	);

	// --- Ações / nutrição ---
	const [showActions, setShowActions] = useState(false);
	const [consumables, setConsumables] = useState<Consumable[]>(
		() => DEFAULT_CONSUMABLES,
	);
	// índice do trecho -> lista de ids de consumíveis (pode repetir)
	const [actions, setActions] = useState<Record<number, string[]>>({});
	// esconder trechos sem ação quando a lista fica longa
	const [collapseEmpty, setCollapseEmpty] = useState(false);

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

	const nutrition = useMemo(
		() => computeNutrition(actions, consumables),
		[actions, consumables],
	);

	const COLLAPSE_THRESHOLD = 12;
	//Habilitar quando (pago)
	const VARIACAO_PACE_HABILITADA = false; //strategy !== "constant";
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

	function regenerate(
		nextDistance: number,
		nextTargetInput: string,
		nextStrategy: Strategy = strategy,
		nextSpreadPct: number = spreadPct,
		nextMode: TargetMode = targetMode,
		nextPaceInput: string = paceInput,
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
		setLaps(buildLaps(nextDistance, secs, nextStrategy, nextSpreadPct / 100));
	}

	useEffect(() => {
		setStoredTargetValues(currentValues => {
			if (currentValues[targetMode] === values.targetValue)
				return currentValues;
			return {...currentValues, [targetMode]: values.targetValue};
		});
	}, [targetMode, values.targetValue]);

	useEffect(() => {
		regenerate(
			distance,
			targetInput,
			strategy,
			spreadPct,
			targetMode,
			paceInput,
		);
	}, [
		distance,
		targetInput,
		strategy,
		spreadPct,
		targetMode,
		paceInput,
		unitSystem,
	]);

	function handleDistanceChange(value: string) {
		setValue("distance", value);
	}

	function handleTargetChange(value: string) {
		setValue("targetValue", value);
	}

	function handlePaceChange(value: string) {
		setValue("targetValue", value);
	}

	function handleTargetModeChange(value: TargetMode) {
		if (!value || value === targetMode) return;
		setValues({
			targetType: value,
			targetValue: storedTargetValues[value],
		});
	}

	function handleStrategyChange(value: Strategy | null) {
		if (!value) return;
		setValue("strategy", value);
	}

	function applySpread(pct: number) {
		if (typeof pct !== "number" || Number.isNaN(pct)) return;
		const clamped = Math.min(50, Math.max(0, pct));
		setSpreadPct(clamped);
		setSpreadInput(String(clamped));
		regenerate(distance, targetInput, strategy, clamped);
	}

	function handleSpreadInputChange(value: string) {
		setSpreadInput(value);
		const parsed = Number(value.replace(",", "."));
		if (!Number.isNaN(parsed)) {
			const clamped = Math.min(50, Math.max(0, parsed));
			setSpreadPct(clamped);
			regenerate(distance, targetInput, strategy, clamped);
		}
	}

	function applyPreset(preset: Preset) {
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
		if (secs == null) return;
		setLaps(prev => applyLapEdit(prev, index, secs, targetSeconds, recalc));
	}

	function repeatLapValueNext(index: number, count: number) {
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
		regenerate(distance, targetInput);
	}

	function addAction(lapIndex: number, consumableId: string) {
		setActions(prev => ({
			...prev,
			[lapIndex]: [...(prev[lapIndex] ?? []), consumableId],
		}));
	}

	function removeAction(lapIndex: number, actionIndex: number) {
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
		setConsumables(prev => [...prev, {...c, id: newConsumableId()}]);
	}

	function removeConsumable(id: string) {
		setConsumables(prev => prev.filter(c => c.id !== id));
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
				<h2 className='text-lg font-semibold'>Configuração</h2>
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
							onChange={e => handleDistanceChange(e.target.value)}
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
								onChange={e => handleTargetChange(e.target.value)}
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
								onChange={e => handlePaceChange(e.target.value)}
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
									onChange={e => handleSpreadInputChange(e.target.value)}
									onBlur={() => setSpreadInput(String(spreadPct))}
									disabled={!VARIACAO_PACE_HABILITADA}
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
							disabled={!VARIACAO_PACE_HABILITADA}
							aria-label='Variação máxima de pace'
						/>
						<p className='text-xs text-muted-foreground text-pretty'>
							Diferença de ritmo entre o início e o fim da prova. Quanto maior,
							mais acentuada a aceleração ou desaceleração.
						</p>
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
						<Switch id='recalc' checked={recalc} onCheckedChange={setRecalc} />
					</div>

					{/* Ações de nutrição/hidratação */}
					{false && (
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
									onCheckedChange={setShowActions}
								/>
							</div>

							{showActions && (
								<ConsumableManager
									consumables={consumables}
									onAdd={addConsumable}
									onRemove={removeConsumable}
								/>
							)}
						</div>
					)}
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
				<div className='grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3'>
					<StatCard label='Tempo total' value={formatTime(totalTime)} />
					<StatCard
						label='Pace médio'
						value={
							avgPace > 0
								? `${formatTime(toDisplayPace(avgPace, unitSystem))} ${paceUnitLabel(unitSystem)}`
								: "--"
						}
					/>
					{targetMode === "pace" ? (
						<StatCard
							label='Diferença do alvo'
							value={
								Math.round(paceDiff) === 0
									? "no alvo"
									: `${paceDiff > 0 ? "+" : "-"}${formatTime(
											toDisplayPace(Math.abs(paceDiff), unitSystem),
										)} ${paceUnitLabel(unitSystem)}`
							}
							tone={
								Math.round(paceDiff) === 0
									? "ok"
									: paceDiff > 0
										? "over"
										: "under"
							}
							className='col-span-2 sm:col-span-1'
						/>
					) : (
						<StatCard
							label='Diferença do alvo'
							value={
								diff === 0
									? "no alvo"
									: `${diff > 0 ? "+" : "-"}${formatTime(Math.abs(diff))}`
							}
							tone={diff === 0 ? "ok" : diff > 0 ? "over" : "under"}
							className='col-span-2 sm:col-span-1'
						/>
					)}
				</div>

				<Card className='flex flex-col overflow-hidden p-0'>
					<div className='flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-4'>
						<Timer className='size-4 text-primary' />
						<h2 className='font-semibold'>Trecho a trecho</h2>
						{canCollapse && (
							<Button
								variant='outline'
								size='sm'
								onClick={() => setCollapseEmpty(v => !v)}
								className='ml-auto h-7 gap-1.5 px-2.5 text-xs'
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
						<span
							className={`text-sm text-muted-foreground ${canCollapse ? "" : "ml-auto"}`}
						>
							{collapsed
								? `${hiddenCount} ocultos`
								: `${laps.length} ${laps.length === 1 ? "trecho" : "trechos"}`}
						</span>
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
									{renderItems.map((item, pos) =>
										item.type === "gap" ? (
											<SuppressedRow key={`gap-${pos}`} count={item.count} />
										) : (
											<LapRow
												key={item.index}
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
												consumables={consumables}
												lapActions={actions[item.index] ?? []}
												onAddAction={id => addAction(item.index, id)}
												onRemoveAction={actionIndex =>
													removeAction(item.index, actionIndex)
												}
											/>
										),
									)}
								</ul>
							)}
						</div>
					</div>
				</Card>

				{showActions && (
					<NutritionSummary nutrition={nutrition} totalSeconds={totalTime} />
				)}
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	tone = "neutral",
	className = "",
}: {
	label: string;
	value: string;
	tone?: "neutral" | "ok" | "over" | "under";
	className?: string;
}) {
	const toneClass =
		tone === "over"
			? "text-destructive"
			: tone === "under"
				? "text-chart-2"
				: "text-foreground";
	return (
		<Card className={`gap-1 p-4 ${className}`}>
			<span className='text-xs font-medium text-muted-foreground'>{label}</span>
			<span
				className={`font-mono text-xl font-semibold tabular-nums ${toneClass}`}
			>
				{value}
			</span>
		</Card>
	);
}

function SuppressedRow({count}: {count: number}) {
	return (
		<li className='flex items-center gap-3 px-5 py-2'>
			<span className='h-px flex-1 bg-border' aria-hidden='true' />
			<span className='shrink-0 text-xs font-medium text-muted-foreground'>
				{count} {count === 1 ? "trecho suprimido" : "trechos suprimidos"}
			</span>
			<span className='h-px flex-1 bg-border' aria-hidden='true' />
		</li>
	);
}

function LapRow({
	index,
	lap,
	cumulative,
	totalLaps,
	onCommit,
	onRepeatNext,
	onRepeatToEnd,
	onCopyPreviousAverage,
	showActions,
	consumables,
	lapActions,
	onAddAction,
	onRemoveAction,
}: {
	index: number;
	lap: Lap;
	cumulative: number;
	totalLaps: number;
	onCommit: (raw: string) => void;
	onRepeatNext: (count: number) => void;
	onRepeatToEnd: () => void;
	onCopyPreviousAverage: (count: number) => void;
	showActions: boolean;
	consumables: Consumable[];
	lapActions: string[];
	onAddAction: (id: string) => void;
	onRemoveAction: (actionIndex: number) => void;
}) {
	const {unitSystem} = useUnitSystem();
	const [selected, setSelected] = useState<boolean>(false);
	const display = formatTime(lap.time);
	const isPartial = lap.distance < 1;
	const pace = lap.distance > 0 ? lap.time / lap.distance : 0;
	const byId = new Map(consumables.map(c => [c.id, c]));
	const previousCount = index;
	const nextCount = Math.max(0, totalLaps - index - 1);

	return (
		<li className={`px-5 py-3 ${selected ? "bg-accent/40" : ""}`}>
			<div className='flex items-center gap-4'>
				<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary tabular-nums'>
					{index + 1}
				</div>

				<div className='min-w-0 flex-1'>
					<div className='font-medium'>
						{isPartial
							? `Trecho final (${formatDisplayDistance(lap.distance, unitSystem)})`
							: `Trecho ${index + 1}`}
					</div>
					<div className='text-xs text-muted-foreground'>
						{`${formatTime(toDisplayPace(pace, unitSystem))} ${paceUnitLabel(unitSystem)}`}{" "}
						· acumulado {formatTime(cumulative)}
					</div>
				</div>

				<div className='flex shrink-0 items-center gap-1.5'>
					<Input
						key={display}
						id={`lap-${index}`}
						defaultValue={display}
						onBlur={e => onCommit(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") (e.target as HTMLInputElement).blur();
						}}
						className='w-24 text-center font-mono tabular-nums'
						aria-label={`Tempo do trecho ${index + 1}`}
					/>
					<LapOptionsMenu
						onOpenChange={setSelected}
						nextCount={nextCount}
						previousCount={previousCount}
						onRepeatNext={onRepeatNext}
						onRepeatToEnd={onRepeatToEnd}
						onCopyPreviousAverage={onCopyPreviousAverage}
					/>
				</div>
			</div>

			{showActions && (
				<div className='mt-3 flex flex-wrap items-center gap-2 pl-13'>
					{lapActions.map((id, actionIndex) => {
						const c = byId.get(id);
						if (!c) return null;
						return (
							<Badge
								key={`${id}-${actionIndex}`}
								variant='secondary'
								className='gap-1 py-1 pl-2.5 pr-1'
							>
								<span className='font-medium'>{c.name}</span>
								<button
									type='button'
									onClick={() => onRemoveAction(actionIndex)}
									className='ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground'
									aria-label={`Remover ${c.name}`}
								>
									<X className='size-3' />
								</button>
							</Badge>
						);
					})}

					<DropdownMenu>
						<DropdownMenuTrigger
							disabled={consumables.length === 0}
							className={cn(
								buttonVariants({variant: "outline", size: "sm"}),
								"h-7 gap-1 px-2 text-xs",
							)}
						>
							<Plus className='size-3.5' />
							Ação
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' className='w-64'>
							<DropdownMenuGroup>
								<DropdownMenuLabel>Adicionar consumível</DropdownMenuLabel>
								{consumables.map(c => (
									<DropdownMenuItem
										key={c.id}
										onClick={() => onAddAction(c.id)}
										className='flex flex-col items-start gap-0.5'
									>
										<span className='font-medium'>{c.name}</span>
										{consumableSummaryForUnit(c, unitSystem) && (
											<span className='text-xs text-muted-foreground'>
												{consumableSummaryForUnit(c, unitSystem)}
											</span>
										)}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</li>
	);
}

function LapOptionsMenu({
	nextCount,
	previousCount,
	onRepeatNext,
	onRepeatToEnd,
	onCopyPreviousAverage,
	onOpenChange,
}: {
	nextCount: number;
	previousCount: number;
	onRepeatNext: (count: number) => void;
	onRepeatToEnd: () => void;
	onCopyPreviousAverage: (count: number) => void;
	onOpenChange: (open: boolean) => void;
}) {
	const [repeatCount, setRepeatCount] = useState("1");
	const [averageCount, setAverageCount] = useState("1");
	const parsedRepeatCount = parsePositiveInteger(repeatCount);
	const parsedAverageCount = parsePositiveInteger(averageCount);
	const canRepeatNext =
		parsedRepeatCount != null && parsedRepeatCount <= nextCount;
	const canCopyAverage =
		parsedAverageCount != null && parsedAverageCount <= previousCount;
	const stopMenuKeyboardCapture = (event: KeyboardEvent<HTMLInputElement>) => {
		event.stopPropagation();
	};

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				className={cn(
					buttonVariants({variant: "outline", size: "icon-sm"}),
					"size-8",
				)}
				aria-label='Opções do trecho'
			>
				<MoreHorizontal className='size-4' />
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-72 p-2'>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Opções do trecho</DropdownMenuLabel>

					<div className='space-y-2 rounded-md p-1.5'>
						<div className='space-y-1.5'>
							<Label htmlFor='repeat-next-count' className='text-xs'>
								Repetir nos próximos X trechos
							</Label>
							<div className='flex gap-2'>
								<Input
									id='repeat-next-count'
									inputMode='numeric'
									value={repeatCount}
									onKeyDown={stopMenuKeyboardCapture}
									onChange={e => setRepeatCount(e.target.value)}
									className='h-8 w-20 text-center font-mono tabular-nums'
									aria-label='Quantidade de próximos trechos'
								/>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										if (parsedRepeatCount != null)
											onRepeatNext(parsedRepeatCount);
									}}
									disabled={!canRepeatNext}
									className='flex-1'
								>
									Aplicar
								</Button>
							</div>
							<p className='text-xs text-muted-foreground'>
								Disponíveis: {nextCount} próximos.
							</p>
						</div>
					</div>

					<div className='space-y-2 rounded-md p-1.5'>
						<div className='space-y-1.5'>
							<Label htmlFor='average-previous-count' className='text-xs'>
								Copiar média dos últimos X trechos
							</Label>
							<div className='flex gap-2'>
								<Input
									id='average-previous-count'
									inputMode='numeric'
									value={averageCount}
									onKeyDown={stopMenuKeyboardCapture}
									onChange={e => setAverageCount(e.target.value)}
									className='h-8 w-20 text-center font-mono tabular-nums'
									aria-label='Quantidade de trechos anteriores'
								/>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										if (parsedAverageCount != null)
											onCopyPreviousAverage(parsedAverageCount);
									}}
									disabled={!canCopyAverage}
									className='flex-1'
								>
									Aplicar
								</Button>
							</div>
							<p className='text-xs text-muted-foreground'>
								Disponíveis: {previousCount} anteriores.
							</p>
						</div>
					</div>
					<DropdownMenuItem
						onClick={onRepeatToEnd}
						disabled={nextCount === 0}
						className='my-1'
					>
						<Button variant={"secondary"}>Repetir valor até o último</Button>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ConsumableManager({
	consumables,
	onAdd,
	onRemove,
}: {
	consumables: Consumable[];
	onAdd: (c: Omit<Consumable, "id">) => void;
	onRemove: (id: string) => void;
}) {
	const [name, setName] = useState("");
	const [carbs, setCarbs] = useState("");
	const [sodium, setSodium] = useState("");
	const [caffeine, setCaffeine] = useState("");

	const num = (v: string) => {
		const n = Number(v.replace(",", "."));
		return Number.isNaN(n) || n < 0 ? 0 : n;
	};

	const {unitSystem} = useUnitSystem();

	function handleAdd() {
		const trimmed = name.trim();
		if (trimmed === "") return;
		onAdd({
			name: trimmed,
			carbs: num(carbs),
			sodium: num(sodium),
			caffeine: num(caffeine),
		});
		setName("");
		setCarbs("");
		setSodium("");
		setCaffeine("");
	}

	return (
		<div className='space-y-3 border-t border-border pt-4'>
			<div className='flex items-center gap-2'>
				<Utensils className='size-4 text-primary' />
				<span className='text-sm font-medium'>Itens consumíveis</span>
			</div>

			<ul className='space-y-1.5'>
				{consumables.map(c => (
					<li
						key={c.id}
						className='flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5'
					>
						<div className='min-w-0 flex-1'>
							<div className='truncate text-sm font-medium'>{c.name}</div>
							{consumableSummaryForUnit(c, unitSystem) && (
								<div className='truncate text-xs text-muted-foreground'>
									{consumableSummaryForUnit(c, unitSystem)}
								</div>
							)}
						</div>
						<button
							type='button'
							onClick={() => onRemove(c.id)}
							className='shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
							aria-label={`Remover ${c.name}`}
						>
							<Trash2 className='size-3.5' />
						</button>
					</li>
				))}
			</ul>

			<div className='space-y-2 rounded-md border border-dashed border-border p-3'>
				<div className='space-y-1.5'>
					<Label htmlFor='c-name' className='text-xs'>
						Nome do item
					</Label>
					<Input
						id='c-name'
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder='Ex.: Bananinha'
						className='h-8'
						onKeyDown={e => {
							if (e.key === "Enter") handleAdd();
						}}
					/>
				</div>
				<div className='grid grid-cols-3 gap-2'>
					<div className='space-y-1.5'>
						<Label htmlFor='c-carbs' className='text-xs'>
							Carbo
						</Label>
						<Input
							id='c-carbs'
							inputMode='decimal'
							value={carbs}
							onChange={e => setCarbs(e.target.value)}
							placeholder='0'
							className='h-8 text-center font-mono tabular-nums'
						/>
					</div>
					<div className='space-y-1.5'>
						<Label htmlFor='c-sodium' className='text-xs'>
							Sódio
						</Label>
						<Input
							id='c-sodium'
							inputMode='decimal'
							value={sodium}
							onChange={e => setSodium(e.target.value)}
							placeholder='0'
							className='h-8 text-center font-mono tabular-nums'
						/>
					</div>
					<div className='space-y-1.5'>
						<Label htmlFor='c-caffeine' className='text-xs'>
							Cafeína
						</Label>
						<Input
							id='c-caffeine'
							inputMode='decimal'
							value={caffeine}
							onChange={e => setCaffeine(e.target.value)}
							placeholder='0'
							className='h-8 text-center font-mono tabular-nums'
						/>
					</div>
				</div>
				<Button
					size='sm'
					onClick={handleAdd}
					disabled={name.trim() === ""}
					className='w-full gap-1.5'
				>
					<Plus className='size-4' />
					Adicionar item
				</Button>
			</div>
		</div>
	);
}

function NutritionSummary({
	nutrition,
	totalSeconds,
}: {
	nutrition: {carbs: number; sodium: number; caffeine: number; count: number};
	totalSeconds: number;
}) {
	const {unitSystem} = useUnitSystem();

	const items: {label: string; total: string; rate: string}[] = [
		{
			label: "Carboidrato",
			total: formatDisplayMass(nutrition.carbs, "g", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.carbs, totalSeconds),
				"g",
				unitSystem,
			)}/h`,
		},
		{
			label: "Sódio",
			total: formatDisplayMass(nutrition.sodium, "mg", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.sodium, totalSeconds),
				"mg",
				unitSystem,
			)}/h`,
		},
		{
			label: "Cafeína",
			total: formatDisplayMass(nutrition.caffeine, "mg", unitSystem),
			rate: `${formatDisplayMass(
				perHour(nutrition.caffeine, totalSeconds),
				"mg",
				unitSystem,
			)}/h`,
		},
	];

	return (
		<Card className='overflow-hidden p-0'>
			<div className='flex shrink-0 items-center gap-2 border-b border-border px-5 py-4'>
				<Utensils className='size-4 text-primary' />
				<h2 className='font-semibold'>Total consumido</h2>
				<span className='ml-auto text-sm text-muted-foreground'>
					{nutrition.count} {nutrition.count === 1 ? "item" : "itens"}
				</span>
			</div>
			{nutrition.count === 0 ? (
				<p className='px-5 py-8 text-center text-sm text-muted-foreground'>
					Adicione ações aos trechos para ver o resumo nutricional.
				</p>
			) : (
				<div className='grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
					{items.map(item => (
						<div key={item.label} className='px-5 py-4'>
							<span className='text-xs font-medium text-muted-foreground'>
								{item.label}
							</span>
							<div className='mt-1 font-mono text-2xl font-semibold tabular-nums'>
								{item.total}
							</div>
							<div className='mt-0.5 text-sm text-muted-foreground'>
								{item.rate}
							</div>
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
