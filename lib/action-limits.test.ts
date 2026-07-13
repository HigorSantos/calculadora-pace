import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	canAddCustomConsumable,
	canAddFreePlanDivision,
	canAddPlanAction,
	countActionsWithinLaps,
	countCustomConsumables,
	limitFreeRedoHistory,
	limitFreeUndoHistory,
	maxActionsForLapCount,
} from "./action-limits.ts";

describe("plan action limits", () => {
	it("allows at least one action for plans up to 10 laps", () => {
		assert.equal(maxActionsForLapCount(0), 0);
		assert.equal(maxActionsForLapCount(1), 1);
		assert.equal(maxActionsForLapCount(5), 1);
		assert.equal(maxActionsForLapCount(10), 1);
	});

	it("adds one action slot for each started block after 10 laps", () => {
		assert.equal(maxActionsForLapCount(11), 2);
		assert.equal(maxActionsForLapCount(19), 2);
		assert.equal(maxActionsForLapCount(20), 2);
		assert.equal(maxActionsForLapCount(21), 3);
		assert.equal(maxActionsForLapCount(30), 3);
		assert.equal(maxActionsForLapCount(35), 4);
		assert.equal(maxActionsForLapCount(42), 5);
	});

	it("counts only actions within the current lap range", () => {
		assert.equal(
			countActionsWithinLaps(
				{
					0: ["gel"],
					2: ["water", "salt"],
					8: ["ignored"],
				},
				5,
			),
			3,
		);
	});

	it("blocks adding actions when the plan limit is reached", () => {
		assert.equal(canAddPlanAction({}, 5), true);
		assert.equal(canAddPlanAction({0: ["gel"]}, 5), false);
		assert.equal(canAddPlanAction({0: ["gel"], 12: ["salt"]}, 35), true);
		assert.equal(
			canAddPlanAction(
				{0: ["gel"], 12: ["salt"], 20: ["caffeine"], 28: ["water"]},
				35,
			),
			false,
		);
	});

	it("limits generic user consumables to one item", () => {
		const consumables = [
			{id: "gel-carbo-20"},
			{id: "custom-123"},
		];

		assert.equal(countCustomConsumables([]), 0);
		assert.equal(countCustomConsumables(consumables), 1);
		assert.equal(canAddCustomConsumable([{id: "gel-carbo-20"}]), true);
		assert.equal(canAddCustomConsumable(consumables), false);
	});

	it("limits free plan divisions to two", () => {
		assert.equal(canAddFreePlanDivision(0), true);
		assert.equal(canAddFreePlanDivision(1), true);
		assert.equal(canAddFreePlanDivision(2), false);
		assert.equal(canAddFreePlanDivision(3), false);
	});

	it("limits free undo and redo history stacks", () => {
		assert.deepEqual(limitFreeUndoHistory([1, 2, 3, 4]), [3, 4]);
		assert.deepEqual(limitFreeUndoHistory([1]), [1]);
		assert.deepEqual(limitFreeRedoHistory([1, 2, 3, 4]), [1, 2]);
		assert.deepEqual(limitFreeRedoHistory([1]), [1]);
	});
});
