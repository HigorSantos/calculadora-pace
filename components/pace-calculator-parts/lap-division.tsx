import {Check, Plus, X} from "lucide-react";

import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {formatTime} from "@/lib/pace";
import {cn} from "@/lib/utils";

export type LapBlock = {
	index: number;
	startLabel?: number;
	endLabel?: number;
	blockSeconds?: number;
	cumulativeSeconds?: number;
	isInitial?: boolean;
};

type LapBlockHeaderProps = {
	block: LapBlock;
	description: string;
	onDescriptionChange: (value: string) => void;
	onDescriptionFocus: () => void;
	onDescriptionBlur: () => void;
};

export function LapBlockHeader({
	block,
	description,
	onDescriptionChange,
	onDescriptionFocus,
	onDescriptionBlur,
}: LapBlockHeaderProps) {
	return (
		<li className='border-b border-border/70 bg-muted/35 px-5 py-3'>
			<div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] sm:items-center'>
				<div className='min-w-0 space-y-1'>
					<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
						<span className='text-sm font-semibold'>Divisão {block.index}</span>
						{block.isInitial ? (
							<span className='text-xs text-muted-foreground'>
								Instrução pré-corrida
							</span>
						) : (
							<></>
							// <span className='text-xs text-muted-foreground'>
							// 	Trechos {block.startLabel}-{block.endLabel}
							// </span>
						)}
					</div>
					{!block.isInitial &&
					block.blockSeconds != null &&
					block.cumulativeSeconds != null ? (
						<div className='flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
							<span>
								Acumulado desde a última divisão{" "}
								<span className='font-mono tabular-nums text-foreground'>
									{formatTime(block.blockSeconds)}
								</span>
							</span>
						</div>
					) : null}
				</div>
				<Input
					value={description}
					onFocus={onDescriptionFocus}
					onChange={event => onDescriptionChange(event.target.value)}
					onBlur={onDescriptionBlur}
					placeholder={
						block.isInitial ? "Instrução inicial" : "Descrição da divisão"
					}
					aria-label={`Descrição da divisão ${block.index}`}
					className='h-9'
				/>
			</div>
		</li>
	);
}

type LapDivisionBoundaryProps = {
	isActive: boolean;
	canAdd: boolean;
	onAdd: () => void;
	onRemove: () => void;
	onRequestUpgrade: () => void;
	splitPlaceholder?: string;
	splitRangeLabel?: string;
	onAddLapSplit?: (rawDistance: string) => boolean;
};

export function LapDivisionBoundary({
	isActive,
	canAdd,
	onAdd,
	onRemove,
	onRequestUpgrade,
	splitPlaceholder,
	splitRangeLabel,
	onAddLapSplit,
}: LapDivisionBoundaryProps) {
	const [showSplitInput, setShowSplitInput] = useState(false);
	const [splitDistance, setSplitDistance] = useState("");
	const [splitError, setSplitError] = useState(false);

	function submitLapSplit() {
		if (!onAddLapSplit) return;
		const added = onAddLapSplit(splitDistance);
		setSplitError(!added);
		if (!added) return;

		setSplitDistance("");
		setShowSplitInput(false);
	}

	return (
		<li className='group bg-background px-5 py-1'>
			<div className='flex items-center gap-2'>
				<span
					className={cn(
						"h-px flex-1 transition-colors",
						isActive ? "bg-primary/60" : "bg-border group-hover:bg-primary/50",
					)}
					aria-hidden='true'
				/>
				<div className='flex flex-wrap items-center justify-center gap-1.5'>
					{isActive ? (
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='h-7 gap-1.5 px-2.5 text-xs'
							onClick={onRemove}
						>
							<X className='size-3.5' />
							Remover divisão
						</Button>
					) : (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-6 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground'
							onClick={canAdd ? onAdd : onRequestUpgrade}
						>
							<Plus className='size-3.5' />
							{canAdd ? "Dividir aqui" : "Liberar divisões"}
						</Button>
					)}
					{onAddLapSplit ? (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-6 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground'
							onClick={() => {
								setShowSplitInput(current => !current);
								setSplitError(false);
							}}
						>
							<Plus className='size-3.5' />
							Adicionar trecho
						</Button>
					) : null}
				</div>
				<span
					className={cn(
						"h-px flex-1 transition-colors",
						isActive ? "bg-primary/60" : "bg-border group-hover:bg-primary/50",
					)}
					aria-hidden='true'
				/>
			</div>
			{showSplitInput && onAddLapSplit ? (
				<div className='mx-auto mt-2 flex max-w-sm flex-col gap-1.5'>
					<div className='flex items-center gap-1.5'>
						<Input
							value={splitDistance}
							onChange={event => {
								setSplitDistance(event.target.value);
								setSplitError(false);
							}}
							onKeyDown={event => {
								if (event.key === "Enter") submitLapSplit();
							}}
							inputMode='decimal'
							placeholder={splitPlaceholder}
							aria-invalid={splitError}
							className='h-8 text-center font-mono tabular-nums'
						/>
						<Button
							type='button'
							variant='outline'
							size='icon-sm'
							onClick={submitLapSplit}
							aria-label='Adicionar trecho'
						>
							<Check className='size-3.5' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon-sm'
							onClick={() => {
								setShowSplitInput(false);
								setSplitDistance("");
								setSplitError(false);
							}}
							aria-label='Cancelar trecho'
						>
							<X className='size-3.5' />
						</Button>
					</div>
					<p
						className={cn(
							"text-center text-xs",
							splitError ? "text-destructive" : "text-muted-foreground",
						)}
					>
						{splitError
							? `Use um valor entre ${splitRangeLabel}.`
							: splitRangeLabel
								? `Entre ${splitRangeLabel}`
								: ""}
					</p>
				</div>
			) : null}
		</li>
	);
}
