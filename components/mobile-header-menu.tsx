"use client";

import Link from "next/link";
import {Activity, Gauge, Menu, Route, Timer} from "lucide-react";

import {AuthMenuDropdownSection} from "@/components/auth-menu-action";
import {BillingAccessMockSelector} from "@/components/billing-access-mock-selector";
import {ThemeSelector} from "@/components/theme-selector";
import {Button} from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {UnitSystemSelector} from "@/components/unit-system-selector";

const iconsByName = {
	activity: Activity,
	gauge: Gauge,
	route: Route,
	timer: Timer,
};


type MobileMenuTool = {
	label: string;
	href: string;
	iconName: string;
};

export function MobileHeaderMenu({tools}: {tools: MobileMenuTool[]}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant='outline'
						size='icon-sm'
						aria-label='Abrir menu'
						title='Abrir menu'
						className='lg:hidden'
					>
						<Menu className='size-4' />
					</Button>
				}
			/>
			<DropdownMenuContent align='end' className='w-72 p-2 lg:hidden'>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Calculadoras</DropdownMenuLabel>
					<div className='grid gap-1'>
						{tools.map(tool => {
							const ToolIcon =
								iconsByName[tool.iconName as keyof typeof iconsByName] ?? Activity;

							return (
								<Link
									key={tool.href}
									href={tool.href}
									className='flex h-9 items-center gap-2 rounded-md px-2 text-sm text-popover-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground'
								>
									<ToolIcon className='size-4 text-muted-foreground' />
									<span>{tool.label}</span>
								</Link>
							);
						})}
					</div>
				</DropdownMenuGroup>
				<AuthMenuDropdownSection />
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>Preferências</DropdownMenuLabel>
					<div className='flex items-center gap-2 px-1.5 py-1'>
						<ThemeSelector />
						<UnitSystemSelector />
						{process.env.NODE_ENV === "development" && (
							<BillingAccessMockSelector />
						)}
					</div>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
