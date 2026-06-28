"use client";

import {Monitor, Moon, Sun} from "lucide-react";
import * as React from "react";

import {Button} from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "arsenal-theme";

type Theme = "system" | "light" | "dark";

const themes: Array<{
	value: Theme;
	label: string;
	icon: React.ComponentType<{className?: string}>;
}> = [
	// {value: "system", label: "Sistema", icon: Monitor},
	{value: "light", label: "Claro", icon: Sun},
	{value: "dark", label: "Escuro", icon: Moon},
];

function applyTheme(theme: Theme) {
	const root = document.documentElement;

	root.classList.remove("light", "dark");

	if (theme !== "system") {
		root.classList.add(theme);
	}
}

export function ThemeSelector() {
	const [theme, setTheme] = React.useState<Theme>("system");

	React.useEffect(() => {
		const storedTheme = window.localStorage.getItem(STORAGE_KEY);

		if (storedTheme === "light" || storedTheme === "dark") {
			setTheme(storedTheme);
			applyTheme(storedTheme);
			return;
		}

		applyTheme("dark");
	}, []);

	const selectTheme = React.useCallback((nextTheme: string) => {
		if (
			nextTheme !== "light" &&
			nextTheme !== "dark" &&
			nextTheme !== "system"
		) {
			return;
		}

		setTheme(nextTheme);
		applyTheme(nextTheme);
		window.localStorage.setItem(STORAGE_KEY, nextTheme);
	}, []);

	const handleTroca = () => {
		if (theme === "light") {
			selectTheme("dark");
		} else {
			selectTheme("light");
		}
	};

	const SelectedIcon = themes.find(item => item.value === theme)?.icon ?? Moon;

	return (
		<Button
			variant='outline'
			size='icon-sm'
			aria-label='Trocar tema'
			title='Trocar tema'
			onClick={handleTroca}
		>
			<SelectedIcon className='size-4' />
		</Button>
	);
}
