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
	BILLING_ACCESS_MOCK_STORAGE_KEY,
	canAccessPaidFeature,
	type BillingAccessMode,
	isBillingAccessMode,
	type PaidFeature,
} from "@/lib/billing-access";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

const IS_DEV = process.env.NODE_ENV === "development";

type BillingAccessContextValue = {
	accessMode: BillingAccessMode;
	isHydrated: boolean;
	setMockAccessMode: (accessMode: BillingAccessMode) => void;
	canAccess: (feature: PaidFeature) => boolean;
};
export const PREMIUM_ANUAL_PLAN = {
	id: "plano_lancamento",
	nome: "Arsenal Corredor Premium - Lançamento",
	preco: 19.9,
};
const BillingAccessContext = createContext<BillingAccessContextValue | null>(
	null,
);

export function BillingAccessProvider({children}: {children: ReactNode}) {
	const [accessMode, setAccessMode] = useState<BillingAccessMode>(
		PAYMENT_AUTH_ENABLED ? "free" : "paid",
	);
	const [isHydrated, setIsHydrated] = useState(!PAYMENT_AUTH_ENABLED);

	useEffect(() => {
		if (!PAYMENT_AUTH_ENABLED) return;

		// Em dev o mock do localStorage tem prioridade para facilitar testes
		if (IS_DEV) {
			const stored = window.localStorage.getItem(
				BILLING_ACCESS_MOCK_STORAGE_KEY,
			);
			if (isBillingAccessMode(stored)) {
				setAccessMode(stored);
				setIsHydrated(true);
				return;
			}
		}

		fetch("/api/auth/me")
			.then(r => r.json())
			.then((data: {active: boolean}) => {
				setAccessMode(data.active ? "paid" : "free");
			})
			.catch(() => {})
			.finally(() => setIsHydrated(true));
	}, []);

	const setMockAccessMode = useCallback((nextAccessMode: BillingAccessMode) => {
		if (!PAYMENT_AUTH_ENABLED) return;

		setAccessMode(nextAccessMode);
		if (IS_DEV) {
			window.localStorage.setItem(
				BILLING_ACCESS_MOCK_STORAGE_KEY,
				nextAccessMode,
			);
		}
	}, []);

	const canAccess = useCallback(
		(feature: PaidFeature) => canAccessPaidFeature(accessMode, feature),
		[accessMode],
	);

	const value = useMemo(
		() => ({accessMode, isHydrated, setMockAccessMode, canAccess}),
		[accessMode, isHydrated, setMockAccessMode, canAccess],
	);

	return (
		<BillingAccessContext.Provider value={value}>
			{children}
		</BillingAccessContext.Provider>
	);
}

export function useBillingAccess() {
	const context = useContext(BillingAccessContext);
	if (!context) {
		throw new Error(
			"useBillingAccess must be used within BillingAccessProvider",
		);
	}
	return context;
}
