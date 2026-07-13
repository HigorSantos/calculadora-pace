import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {isRaceConfigurationVisible, type RaceConfiguration} from "./race-configurations.ts";

const race: RaceConfiguration = {
	id: "test-race",
	name: "Test Race",
	date: "2026-07-26",
	distanceKm: 42.195,
	items: [],
};

describe("race configuration visibility", () => {
	it("keeps races visible until the end of race day", () => {
		assert.equal(
			isRaceConfigurationVisible(race, new Date(2026, 6, 25, 23, 59)),
			true,
		);
		assert.equal(
			isRaceConfigurationVisible(race, new Date(2026, 6, 26, 23, 59)),
			true,
		);
	});

	it("hides races after race day has passed", () => {
		assert.equal(
			isRaceConfigurationVisible(race, new Date(2026, 6, 27, 0, 0)),
			false,
		);
	});
});
