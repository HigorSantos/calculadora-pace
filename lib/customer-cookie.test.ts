import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {cookieMaxAge} from "./customer-cookie.ts";

const ONE_DAY_SECONDS = 24 * 60 * 60;
const ONE_YEAR_SECONDS = 365 * ONE_DAY_SECONDS;

describe("customer cookie expiration", () => {
	it("uses daily validation before the activation date is available", () => {
		assert.equal(cookieMaxAge(null), ONE_DAY_SECONDS);
	});

	it("keeps daily validation during the first 10 active days", () => {
		const nineDaysAgo = new Date(Date.now() - 9 * ONE_DAY_SECONDS * 1000);

		assert.equal(cookieMaxAge(nineDaysAgo), ONE_DAY_SECONDS);
	});

	it("uses annual validity after the first 10 active days", () => {
		const elevenDaysAgo = new Date(Date.now() - 11 * ONE_DAY_SECONDS * 1000);

		assert.equal(cookieMaxAge(elevenDaysAgo), ONE_YEAR_SECONDS);
	});
});
