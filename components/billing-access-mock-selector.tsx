"use client";

import {BadgeCheck, LockKeyhole} from "lucide-react";

import {useBillingAccess} from "@/components/billing-access-provider";
import {Button} from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {BillingAccessMode} from "@/lib/billing-access";

const accessModes: Array<{
	value: BillingAccessMode;
	label: string;
	shortLabel: string;
	icon: typeof LockKeyhole;
}> = [
	{value: "free", label: "Grátis", shortLabel: "Free", icon: LockKeyhole},
	{value: "paid", label: "Pagante", shortLabel: "Pago", icon: BadgeCheck},
];

export function BillingAccessMockSelector() {
	const {accessMode, setMockAccessMode} = useBillingAccess();
	const selected =
		accessModes.find(item => item.value === accessMode) ?? accessModes[0];
	const SelectedIcon = selected.icon;

	function selectAccessMode(nextAccessMode: string) {
		if (nextAccessMode !== "free" && nextAccessMode !== "paid") return;
		setMockAccessMode(nextAccessMode);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant='outline'
						size='sm'
						aria-label='Selecionar acesso mockado'
						title='Selecionar acesso mockado'
						className='h-7 gap-1.5 px-2'
					>
						<SelectedIcon className='size-4' />
						<span className='text-xs font-semibold'>{selected.shortLabel}</span>
					</Button>
				}
			/>
			<DropdownMenuContent align='end' className='w-44'>
				<DropdownMenuRadioGroup
					value={accessMode}
					onValueChange={selectAccessMode}
				>
					<DropdownMenuLabel>Acesso mock</DropdownMenuLabel>
					{accessModes.map(item => (
						<DropdownMenuRadioItem key={item.value} value={item.value}>
							<item.icon className='size-4 text-muted-foreground' />
							{item.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
