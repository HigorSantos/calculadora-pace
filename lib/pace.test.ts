import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
	DEFAULT_CONSUMABLES,
	buildDistances,
	buildLaps,
	deriveFinalPaceFromInitialPace,
	splitLapAtDistance,
} from "./pace.ts";

function totalTime(laps: {time: number}[]) {
	return laps.reduce((sum, lap) => sum + lap.time, 0);
}

describe("pace strategy planning", () => {
	it("derives the final pace from an initial pace and target time", () => {
		const distances = buildDistances(5);

		assert.equal(
			deriveFinalPaceFromInitialPace(distances, 25 * 60, 6 * 60),
			4 * 60,
		);
	});

	it("builds negative splits from the requested initial pace", () => {
		const laps = buildLaps(5, 25 * 60, "negative", 0.08, 6 * 60);

		assert.equal(laps.length, 5);
		assert.equal(laps[0]?.time, 6 * 60);
		assert.equal(laps.at(-1)?.time, 4 * 60);
		assert.equal(totalTime(laps), 25 * 60);
	});

	it("builds positive splits from the requested initial pace", () => {
		const laps = buildLaps(5, 25 * 60, "positive", 0.08, 4 * 60);

		assert.equal(laps.length, 5);
		assert.equal(laps[0]?.time, 4 * 60);
		assert.equal(laps.at(-1)?.time, 6 * 60);
		assert.equal(totalTime(laps), 25 * 60);
	});

	it("rejects initial paces that invert the selected strategy", () => {
		assert.deepEqual(buildLaps(5, 25 * 60, "negative", 0.08, 4 * 60), []);
		assert.deepEqual(buildLaps(5, 25 * 60, "positive", 0.08, 6 * 60), []);
	});

	it("splits the next lap at a valid absolute distance", () => {
		const laps = buildLaps(5, 25 * 60);
		const result = splitLapAtDistance(laps, 1, 2.5);

		assert.ok(result);
		assert.equal(result.targetIndex, 2);
		assert.equal(result.insertIndex, 3);
		assert.deepEqual(
			result.laps.map(lap => lap.distance),
			[1, 1, 0.5, 0.5, 1, 1],
		);
		assert.equal(totalTime(result.laps), totalTime(laps));
	});

	it("rejects lap splits outside the next lap interval", () => {
		const laps = buildLaps(5, 25 * 60);

		assert.equal(splitLapAtDistance(laps, 1, 2), null);
		assert.equal(splitLapAtDistance(laps, 1, 3), null);
		assert.equal(splitLapAtDistance(laps, 1, 3.2), null);
	});

	it("keeps the requested initial pace before a constant remaining pace", () => {
		const laps = buildLaps(5, 25 * 60, "constant", 0.08, 6 * 60, 2);

		assert.deepEqual(
			laps.map(lap => lap.time),
			[6 * 60, 6 * 60, 4 * 60 + 20, 4 * 60 + 20, 4 * 60 + 20],
		);
		assert.equal(totalTime(laps), 25 * 60);
	});

	it("keeps the requested initial pace for multiple opening laps", () => {
		const negative = buildLaps(5, 25 * 60, "negative", 0.08, 6 * 60, 2);
		const positive = buildLaps(5, 25 * 60, "positive", 0.08, 4 * 60, 2);

		assert.deepEqual(
			negative.map(lap => lap.time),
			[6 * 60, 6 * 60, 5 * 60 + 10, 4 * 60 + 20, 3 * 60 + 30],
		);
		assert.equal(totalTime(negative), 25 * 60);
		assert.deepEqual(
			positive.map(lap => lap.time),
			[4 * 60, 4 * 60, 4 * 60 + 50, 5 * 60 + 40, 6 * 60 + 30],
		);
		assert.equal(totalTime(positive), 25 * 60);
	});

});


describe("default consumables catalog", () => {
	it("keeps generic items and imports branded items with slug ids", () => {
		const generic = DEFAULT_CONSUMABLES.find(
			consumable => consumable.id === "genericos-gel-carbo-20g",
		);
		const branded = DEFAULT_CONSUMABLES.find(
			consumable =>
				consumable.id === "z2-energy-gel-z2-maratona-do-rio-agua-de-coco",
		);

		assert.equal(generic?.brand, "Genéricos");
		assert.equal(branded?.brand, "Z2");
		assert.equal(branded?.tamanho_sache_g, 40);
		assert.equal(branded?.carbs, 25);
	});

	it("keeps default consumable ids unique", () => {
		const ids = DEFAULT_CONSUMABLES.map(consumable => consumable.id);
		const uniqueIds = new Set(ids);

		assert.equal(uniqueIds.size, ids.length);
		assert.ok(
			DEFAULT_CONSUMABLES.some(
				consumable =>
					consumable.id === "z2-energy-gel-z2-original" &&
					consumable.name === "Energy Gel Z2 Original",
			),
		);
		assert.ok(
			DEFAULT_CONSUMABLES.some(
				consumable =>
					consumable.id === "z2-energy-gel-z2-plus-original" &&
					consumable.name === "Energy Gel Z2+ Original",
			),
		);
	});

	it("imports optional taurine and nitrate fields", () => {
		const taurine = DEFAULT_CONSUMABLES.find(
			consumable => consumable.id === "z2-energy-gel-z2-plus-double-expresso",
		);
		const nitrate = DEFAULT_CONSUMABLES.find(
			consumable => consumable.id === "dobro-bt-400-nitrato-gel-redberry-com-cafeina",
		);

		assert.equal(taurine?.taurina_mg, 500);
		assert.equal(nitrate?.nitrato_mg, 400);
	});
});
