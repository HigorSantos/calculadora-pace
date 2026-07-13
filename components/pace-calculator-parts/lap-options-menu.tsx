import {type KeyboardEvent, useState} from "react";
import {MoreHorizontal, Trash2} from "lucide-react";

import {Button, buttonVariants} from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

import {parsePositiveInteger} from "./utils";

export function LapOptionsMenu({
	nextCount,
	previousCount,
	onRepeatNext,
	onRepeatToEnd,
	onCopyPreviousAverage,
	onRemoveLap,
	canRemoveLap,
	onOpenChange,
}: {
	nextCount: number;
	previousCount: number;
	onRepeatNext: (count: number) => void;
	onRepeatToEnd: () => void;
	onCopyPreviousAverage: (count: number) => void;
	onRemoveLap: () => void;
	canRemoveLap: boolean;
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

					<DropdownMenuItem
						onClick={onRemoveLap}
						disabled={!canRemoveLap}
						className='my-1 text-destructive focus:text-destructive'
					>
						<Trash2 className='size-4' />
						Remover trecho
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
