"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import {
	isUnitSystem,
	type UnitSystem,
	UNIT_SYSTEM_STORAGE_KEY,
} from "@/lib/units";

type UnitSystemContextValue = {
	unitSystem: UnitSystem;
	setUnitSystem: (unitSystem: UnitSystem) => void;
};

const UnitSystemContext = createContext<UnitSystemContextValue | null>(null);

export function UnitSystemProvider({children}: {children: ReactNode}) {
	const [unitSystem, setUnitSystemState] = useState<UnitSystem>("metric");

	useEffect(() => {
		const storedUnitSystem = window.localStorage.getItem(
			UNIT_SYSTEM_STORAGE_KEY,
		);
		if (isUnitSystem(storedUnitSystem)) {
			setUnitSystemState(storedUnitSystem);
		}
	}, []);

	const setUnitSystem = useCallback((nextUnitSystem: UnitSystem) => {
		setUnitSystemState(nextUnitSystem);
		window.localStorage.setItem(UNIT_SYSTEM_STORAGE_KEY, nextUnitSystem);
	}, []);

	const value = useMemo(
		() => ({unitSystem, setUnitSystem}),
		[unitSystem, setUnitSystem],
	);

	return (
		<UnitSystemContext.Provider value={value}>
			{children}
		</UnitSystemContext.Provider>
	);
}

export function useUnitSystem() {
	const context = useContext(UnitSystemContext);
	if (!context) {
		throw new Error("useUnitSystem must be used within UnitSystemProvider");
	}
	return context;
}
