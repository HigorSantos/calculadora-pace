"use client";

import Link from "next/link";
import {LogIn, LogOut} from "lucide-react";

import {useBillingAccess} from "@/components/billing-access-provider";
import {
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {buttonVariants} from "@/components/ui/button";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";
import {cn} from "@/lib/utils";

const AUTH_MENU_ENABLED =
	PAYMENT_AUTH_ENABLED && process.env.NEXT_PUBLIC_AUTH_MENU_ENABLED === "true";

type AuthMenuActionProps = {
	variant: "button" | "menu-item";
	className?: string;
};

export function AuthMenuAction({variant, className}: AuthMenuActionProps) {
	const {accessMode, isHydrated} = useBillingAccess();

	if (!AUTH_MENU_ENABLED || !isHydrated) return null;

	const authItem =
		accessMode === "paid"
			? {href: "/api/auth/logout", label: "Sair", icon: LogOut}
			: {href: "/api/auth/login", label: "Entrar", icon: LogIn};
	const AuthIcon = authItem.icon;

	if (variant === "button") {
		return (
			<Link
				href={authItem.href}
				className={cn(
					buttonVariants({variant: "outline", size: "sm"}),
					"h-7 gap-1.5 px-2",
					className,
				)}
			>
				<AuthIcon className='size-4' />
				<span>{authItem.label}</span>
			</Link>
		);
	}

	return (
		<Link
			href={authItem.href}
			className={cn(
				"flex h-9 items-center gap-2 rounded-md px-2 text-sm text-popover-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
				className,
			)}
		>
			<AuthIcon className='size-4 text-muted-foreground' />
			<span>{authItem.label}</span>
		</Link>
	);
}

export function AuthMenuDropdownSection() {
	const {isHydrated} = useBillingAccess();

	if (!AUTH_MENU_ENABLED || !isHydrated) return null;

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>Conta</DropdownMenuLabel>
				<AuthMenuAction variant='menu-item' />
			</DropdownMenuGroup>
		</>
	);
}
