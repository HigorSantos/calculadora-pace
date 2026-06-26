import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {paceToSpeed} from "./pace.ts";
import {
	formatDisplayDistance,
	formatDisplayMass,
	formatDisplayPace,
	formatDisplaySpeed,
	fromDisplayPace,
	parseDisplayDistance,
	toDisplayDistance,
	toDisplayPace,
} from "./units.ts";

describe("unit display helpers", () => {
	it("formats speed in the selected unit system", () => {
		const speedKmh = paceToSpeed(300);

		assert.equal(formatDisplaySpeed(speedKmh, "metric"), "12,0 km/h");
		assert.equal(formatDisplaySpeed(speedKmh, "imperial"), "7,5 mph");
	});

	it("formats pace in the selected unit system", () => {
		assert.equal(formatDisplayPace(300, "metric"), "05:00 /km");
		assert.equal(formatDisplayPace(300, "imperial"), "08:03 /mi");
	});

	it("formats and parses distance in the selected unit system", () => {
		assert.equal(formatDisplayDistance(10, "metric"), "10 km");
		assert.equal(formatDisplayDistance(10, "imperial"), "6,21 mi");

		assert.equal(parseDisplayDistance("10", "metric"), 10);
		assert.ok(Math.abs(parseDisplayDistance("6,214", "imperial")! - 10) < 0.01);
	});

	it("converts visible distance and pace values without changing their real value", () => {
		assert.ok(Math.abs(toDisplayDistance(10, "imperial") - 6.2137) < 0.001);
		assert.equal(Math.round(toDisplayPace(300, "imperial")), 483);
		assert.equal(Math.round(fromDisplayPace(483, "imperial")), 300);
	});

	it("formats nutrition mass values in the selected unit system", () => {
		assert.equal(formatDisplayMass(30, "g", "metric"), "30 g");
		assert.equal(formatDisplayMass(200, "mg", "metric"), "200 mg");
		assert.equal(formatDisplayMass(30, "g", "imperial"), "1,06 oz");
		assert.equal(formatDisplayMass(200, "mg", "imperial"), "0,0071 oz");
	});
});
