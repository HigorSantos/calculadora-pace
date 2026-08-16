import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {normalizeOrderNsuLookupValue} from "./order-nsu.ts";

describe("customer helpers", () => {
	it("keeps regular order NSU values unchanged", () => {
		assert.equal(
			normalizeOrderNsuLookupValue("f4ab1c2d-2f33-4a2a-a11a-9d00b05f2b3e"),
			"f4ab1c2d-2f33-4a2a-a11a-9d00b05f2b3e",
		);
	});

	it("restores plus signs decoded as spaces in order NSU query params", () => {
		assert.equal(
			normalizeOrderNsuLookupValue(
				"f4ab1c2d-2f33-4a2a-a11a-9d00b05f2b3e teste@example.com",
			),
			"f4ab1c2d-2f33-4a2a-a11a-9d00b05f2b3e+teste@example.com",
		);
	});
});
