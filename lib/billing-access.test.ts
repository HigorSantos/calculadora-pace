import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	canAccessPaidFeature,
	canAddLapAction,
	isBillingAccessMode,
} from "./billing-access.ts";

describe("billing access helpers", () => {
	it("validates supported access modes", () => {
		assert.equal(isBillingAccessMode("free"), true);
		assert.equal(isBillingAccessMode("paid"), true);
		assert.equal(isBillingAccessMode("trial"), false);
		assert.equal(isBillingAccessMode(null), false);
	});

	it("allows paid-only features only for paid access", () => {
		assert.equal(canAccessPaidFeature("free", "consumable-paid-presets"), false);
		assert.equal(canAccessPaidFeature("paid", "consumable-paid-presets"), true);
		assert.equal(canAccessPaidFeature("free", "pace-variation"), false);
		assert.equal(canAccessPaidFeature("paid", "pace-variation"), true);
		assert.equal(canAccessPaidFeature("free", "multiple-actions-per-lap"), false);
		assert.equal(canAccessPaidFeature("paid", "multiple-actions-per-lap"), true);
		assert.equal(canAccessPaidFeature("free", "unlimited-plan-actions"), false);
		assert.equal(canAccessPaidFeature("paid", "unlimited-plan-actions"), true);
		assert.equal(
			canAccessPaidFeature("free", "unlimited-custom-consumables"),
			false,
		);
		assert.equal(
			canAccessPaidFeature("paid", "unlimited-custom-consumables"),
			true,
		);
		assert.equal(canAccessPaidFeature("free", "custom-split-spread"), false);
		assert.equal(canAccessPaidFeature("paid", "custom-split-spread"), true);
		assert.equal(canAccessPaidFeature("free", "unlimited-history"), false);
		assert.equal(canAccessPaidFeature("paid", "unlimited-history"), true);
		assert.equal(
			canAccessPaidFeature("free", "unlimited-plan-divisions"),
			false,
		);
		assert.equal(
			canAccessPaidFeature("paid", "unlimited-plan-divisions"),
			true,
		);
	});

	it("limits multiple actions per lap to paid access", () => {
		assert.equal(canAddLapAction("free", 0), true);
		assert.equal(canAddLapAction("free", 1), false);
		assert.equal(canAddLapAction("paid", 0), true);
		assert.equal(canAddLapAction("paid", 1), true);
		assert.equal(canAddLapAction("paid", 2), true);
	});
});
