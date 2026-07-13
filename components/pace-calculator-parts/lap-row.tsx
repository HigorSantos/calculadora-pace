import {useState} from "react";
import {Plus, SportShoeIcon, X} from "lucide-react";

import {Button, buttonVariants} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {useUnitSystem} from "@/components/unit-system-provider";
import {
	formatDistance,
	formatTime,
	type Consumable,
	type Lap,
} from "@/lib/pace";
import {
	isRaceConsumableId,
	raceActionConsumableId,
	raceActionDescription,
} from "@/lib/race-configurations";
import {cn} from "@/lib/utils";
import {formatDisplayDistance, paceUnitLabel, toDisplayPace} from "@/lib/units";

import {LapOptionsMenu} from "./lap-options-menu";
import {consumableSummaryForUnit} from "./utils";

export function SuppressedRow({count}: {count: number}) {
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

export function LapRow({
	index,
	lap,
	startDistanceKm,
	endDistanceKm,
	cumulative,
	totalLaps,
	onCommit,
	onRepeatNext,
	onRepeatToEnd,
	onCopyPreviousAverage,
	onRemoveLap,
	showActions,
	canAddMultipleActions,
	canAddMorePlanActions,
	consumables,
	availableConsumables,
	lapActions,
	onAddAction,
	onRemoveAction,
	onRequestUpgrade,
	paidMode,
}: {
	index: number;
	lap: Lap;
	startDistanceKm: number;
	endDistanceKm: number;
	cumulative: number;
	totalLaps: number;
	onCommit: (raw: string) => void;
	onRepeatNext: (count: number) => void;
	onRepeatToEnd: () => void;
	onCopyPreviousAverage: (count: number) => void;
	onRemoveLap: () => void;
	showActions: boolean;
	canAddMultipleActions: boolean;
	canAddMorePlanActions: boolean;
	consumables: Consumable[];
	availableConsumables: Consumable[];
	lapActions: string[];
	onAddAction: (id: string) => void;
	onRemoveAction: (actionIndex: number) => void;
	onRequestUpgrade: () => void;
	paidMode: boolean;
}) {
	const {unitSystem} = useUnitSystem();
	const [selected, setSelected] = useState<boolean>(false);
	const display = formatTime(lap.time);
	const pace = lap.distance > 0 ? lap.time / lap.distance : 0;
	const rangeLabel = `${formatDisplayDistance(
		startDistanceKm,
		unitSystem,
		true,
	)} ao ${formatDistance(endDistanceKm)}`;
	const byId = new Map(consumables.map(c => [c.id, c]));
	const previousCount = index;
	const nextCount = Math.max(0, totalLaps - index - 1);
	const countedLapActionCount = lapActions.filter(
		id => !isRaceConsumableId(id),
	).length;
	const canAddLapLevelAction =
		canAddMultipleActions || countedLapActionCount === 0;
	const canAddAction = canAddLapLevelAction && canAddMorePlanActions;
	const addableConsumables = availableConsumables;

	return (
		<li className={`px-5 py-3 ${selected ? "bg-accent/40" : ""}`}>
			<div className='flex items-center gap-4'>
				<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary tabular-nums'>
					{index + 1}
				</div>

				<div className='min-w-0 flex-1'>
					<div className='font-medium overflow-visible whitespace-nowrap'>{`${rangeLabel}`}</div>
					<div className='text-xs text-muted-foreground'>
						{`${formatTime(toDisplayPace(pace, unitSystem))} ${paceUnitLabel(unitSystem)}`}{" "}
						·{" "}
						<span className='whitespace-nowrap'>
							acumulado {formatTime(cumulative)}
						</span>
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
						onRemoveLap={onRemoveLap}
						canRemoveLap={totalLaps > 1}
					/>
				</div>
			</div>

			{showActions && (
				<div className='mt-3 flex flex-wrap items-center gap-2 pl-13'>
					{lapActions.map((id, actionIndex) => {
						const c = byId.get(raceActionConsumableId(id));
						if (!c) return null;
						const description = raceActionDescription(id);
						const isRaceAction = isRaceConsumableId(id);
						return (
							<Badge
								key={`${id}-${actionIndex}`}
								variant='secondary'
								className='gap-1 py-1 pl-2.5 pr-1'
							>
								<span className='font-medium'>
									{description ? `${c.name} (${description})` : c.name}
								</span>
								{isRaceAction && (
									<span className='rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary'>
										Prova
									</span>
								)}
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
						{canAddMorePlanActions && (
							<DropdownMenuTrigger
								disabled={addableConsumables.length === 0 || !canAddAction}
								className={cn(
									buttonVariants({variant: "outline", size: "sm"}),
									"h-7 gap-1 px-2 text-xs",
								)}
							>
								<Plus className='size-3.5' />
								{canAddAction
									? "Ação"
									: canAddMorePlanActions
										? "Ação única"
										: "Liberar"}
							</DropdownMenuTrigger>
						)}
						<DropdownMenuContent align='start' className='w-64'>
							<DropdownMenuGroup>
								<DropdownMenuLabel>Adicionar consumível</DropdownMenuLabel>
								{addableConsumables.map(c => {
									const isRaceConsumable = isRaceConsumableId(c.id);

									return (
										<DropdownMenuItem
											key={c.id}
											onClick={() => onAddAction(c.id)}
											disabled={!paidMode && c.paid}
											className={cn(
												`mb-0.5 data-disabled:opacity-90`,
												!paidMode && c.paid ? "bg-primary/10" : "",
											)}
										>
											<div className='flex flex-row items-center justify-between gap-2'>
												<div className='flex flex-col grow items-start gap-0.5'>
													<div className='flex items-center gap-1.5'>
														<span className='font-medium'>{c.name}</span>
														{isRaceConsumable && (
															<Badge className='bg-primary/10 text-primary hover:bg-primary/10'>
																Prova
															</Badge>
														)}
													</div>
													{consumableSummaryForUnit(c, unitSystem) && (
														<span className='text-xs text-muted-foreground'>
															{consumableSummaryForUnit(c, unitSystem)}
														</span>
													)}
												</div>
												{!paidMode && c.paid && (
													<SportShoeIcon className='size-4 text-primary' />
												)}
											</div>
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					{!canAddMorePlanActions && (
						<Button variant={"link"} onClick={onRequestUpgrade}>
							Planejar sem limite
						</Button>
					)}
				</div>
			)}
		</li>
	);
}
