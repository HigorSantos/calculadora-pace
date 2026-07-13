export type BillingAccessMode = "free" | "paid";

export type PaidFeature =
	| "consumable-paid-presets"
	| "pace-variation"
	| "nutrition-actions"
	| "multiple-actions-per-lap"
	| "unlimited-plan-actions"
	| "unlimited-custom-consumables"
	| "custom-split-spread"
	| "unlimited-history"
	| "unlimited-plan-divisions";

export const BILLING_ACCESS_MOCK_STORAGE_KEY = "arsenal-billing-access-mock";

export function isBillingAccessMode(
	value: string | null,
): value is BillingAccessMode {
	return value === "free" || value === "paid";
}

export function canAccessPaidFeature(
	accessMode: BillingAccessMode,
	_feature: PaidFeature,
) {
	return accessMode === "paid";
}

export function canAddLapAction(
	accessMode: BillingAccessMode,
	currentActionCount: number,
) {
	return (
		currentActionCount <= 0 ||
		canAccessPaidFeature(accessMode, "multiple-actions-per-lap")
	);
}
