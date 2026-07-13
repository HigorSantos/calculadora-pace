import {useMemo, useState} from "react";
import {Plus, Search, SportShoeIcon, Utensils} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useUnitSystem} from "@/components/unit-system-provider";
import {canAddCustomConsumable} from "@/lib/action-limits";
import type {Consumable} from "@/lib/pace";
import {isRaceConsumableId} from "@/lib/race-configurations";

import {consumableSummaryForUnit} from "./utils";
import {cn} from "@/lib/utils";
import {Badge} from "../ui/badge";

export function ConsumableManager({
	consumables,
	selectedIds,
	canAddUnlimitedCustomConsumables,
	onToggleSelected,
	onAdd,
	onRemove,
}: {
	consumables: Consumable[];
	selectedIds: string[];
	canAddUnlimitedCustomConsumables: boolean;
	onToggleSelected: (id: string, selected: boolean) => void;
	onAdd: (c: Omit<Consumable, "id">) => void;
	onRemove: (id: string) => void;
}) {
	const [name, setName] = useState("");
	const [carbs, setCarbs] = useState("");
	const [sodium, setSodium] = useState("");
	const [caffeine, setCaffeine] = useState("");
	const [query, setQuery] = useState("");

	const num = (v: string) => {
		const n = Number(v.replace(",", "."));
		return Number.isNaN(n) || n < 0 ? 0 : n;
	};

	const {unitSystem} = useUnitSystem();
	const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
	const filteredConsumables = useMemo(() => {
		if (normalizedQuery === "") return consumables;

		return consumables.filter(consumable =>
			`${consumable.name} ${consumable.brand}`
				.toLocaleLowerCase("pt-BR")
				.includes(normalizedQuery),
		);
	}, [consumables, normalizedQuery]);
	const canAddGenericConsumable =
		canAddUnlimitedCustomConsumables || canAddCustomConsumable(consumables);

	function handleAdd() {
		const trimmed = name.trim();
		if (trimmed === "" || !canAddGenericConsumable) return;
		onAdd({
			name: trimmed,
			brand: "Genéricos",
			carbs: num(carbs),
			sodium: num(sodium),
			caffeine: num(caffeine),
			paid: false,
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

			<div className='relative'>
				<Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
				<Input
					value={query}
					onChange={event => setQuery(event.target.value)}
					placeholder='Buscar por nome ou marca'
					className='h-8 pl-8'
				/>
			</div>

			<div className='max-h-72 overflow-y-auto rounded-md border border-border'>
				<ul className='divide-y divide-border'>
					{filteredConsumables.length === 0 ? (
						<li className='px-3 py-6 text-center text-sm text-muted-foreground'>
							Nenhum item encontrado.
						</li>
					) : (
						filteredConsumables.map(c => {
							const selected = selectedIdSet.has(c.id);
							const isRaceConsumable = isRaceConsumableId(c.id);

							return (
								<li
									key={c.id}
									className={cn(
										"flex items-start gap-2 px-2.5 py-2",
										selected && "bg-primary/10",
										c.paid &&
											!canAddUnlimitedCustomConsumables &&
											"bg-primary/10",
									)}
								>
									<input
										type='checkbox'
										checked={selected}
										onChange={event =>
											onToggleSelected(c.id, event.target.checked)
										}
										className='mt-1 size-4 accent-primary'
										aria-label={`Selecionar ${c.name}`}
									/>
									<div className='min-w-0 flex-1'>
										<div className='flex justify-between items-center gap-2'>
											<div className=' text-sm font-medium'>{c.name}</div>
											<div className='flex shrink-0 items-center gap-1'>
												<Badge variant={"secondary"}>{c.brand}</Badge>
											</div>
										</div>
										{isRaceConsumable && (
											<div className='text-xs text-primary'>
												Importado da prova selecionada
											</div>
										)}
										{consumableSummaryForUnit(c, unitSystem) && (
											<div className='truncate text-xs text-muted-foreground'>
												{consumableSummaryForUnit(c, unitSystem)}
											</div>
										)}
									</div>
									{c.paid && !canAddUnlimitedCustomConsumables && (
										<SportShoeIcon
											className='mt-1 size-4 text-primary'
											aria-description='Disponível a partir de pagamento'
										/>
									)}
								</li>
							);
						})
					)}
				</ul>
			</div>

			<div className='space-y-2 rounded-md border border-dashed border-border p-3'>
				<div className='space-y-1.5'>
					<Label htmlFor='c-name' className='text-xs'>
						Nome do item
					</Label>
					<Input
						id='c-name'
						value={name}
						onChange={e => setName(e.target.value)}
						placeholder='Ex.: Bananinha ou capsula de sal'
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
					disabled={name.trim() === "" || !canAddGenericConsumable}
					className='w-full gap-1.5'
				>
					<Plus className='size-4' />
					Adicionar item
				</Button>
				{!canAddGenericConsumable && (
					<p className='text-xs text-muted-foreground'>
						Libere mais itens personalizados.
					</p>
				)}
			</div>
		</div>
	);
}
