"use client";

import {Ruler} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useUnitSystem} from "@/components/unit-system-provider";
import type {UnitSystem} from "@/lib/units";

const unitSystems: Array<{
	value: UnitSystem;
	label: string;
	shortLabel: string;
}> = [
	{value: "metric", label: "Métrico", shortLabel: "km"},
	{value: "imperial", label: "Imperial", shortLabel: "mi"},
];

export function UnitSystemSelector() {
	const {unitSystem, setUnitSystem} = useUnitSystem();
	const selected =
		unitSystems.find(item => item.value === unitSystem) ?? unitSystems[0];

	function selectUnitSystem(nextUnitSystem: string) {
		if (nextUnitSystem !== "metric" && nextUnitSystem !== "imperial") return;
		setUnitSystem(nextUnitSystem);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant='outline'
						size='sm'
						aria-label='Selecionar sistema de medidas'
						title='Selecionar sistema de medidas'
						className='h-7 gap-1.5 px-2'
					>
						<Ruler className='size-4' />
						<span className='text-xs font-semibold uppercase tabular-nums'>
							{selected.shortLabel}
						</span>
					</Button>
				}
			/>
			<DropdownMenuContent align='end' className='w-40'>
				<DropdownMenuRadioGroup
					value={unitSystem}
					onValueChange={selectUnitSystem}
				>
					<DropdownMenuLabel>Medidas</DropdownMenuLabel>
					{unitSystems.map(item => (
						<DropdownMenuRadioItem key={item.value} value={item.value}>
							<span className='w-6 text-xs font-semibold uppercase text-muted-foreground'>
								{item.shortLabel}
							</span>
							{item.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
