import assert from "node:assert/strict";
import {afterEach, describe, it} from "node:test";

import {auth0UserEmailExists} from "./auth0.ts";

const originalEnv = {...process.env};
const originalFetch = globalThis.fetch;

function configureAuth0Env() {
	process.env.AUTH0_DOMAIN = "tenant.auth0.com";
	process.env.AUTH0_CLIENT_ID = "client-id";
	process.env.AUTH0_CLIENT_SECRET = "client-secret";
}

afterEach(() => {
	process.env = {...originalEnv};
	globalThis.fetch = originalFetch;
});

describe("auth0 helpers", () => {
	it("finds an existing user by normalized email", async () => {
		configureAuth0Env();
		const requestedUrls: string[] = [];

		globalThis.fetch = (async input => {
			const url = input.toString();
			requestedUrls.push(url);

			if (url === "https://tenant.auth0.com/oauth/token") {
				return {
					ok: true,
					json: async () => ({access_token: "management-token"}),
				} as Response;
			}

			assert.equal(
				url,
				"https://tenant.auth0.com/api/v2/users-by-email?email=teste%40example.com",
			);
			return {
				ok: true,
				json: async () => ([{email: "Teste@Example.com"}]),
			} as Response;
		}) as typeof fetch;

		assert.equal(await auth0UserEmailExists(" Teste@Example.com "), true);
		assert.deepEqual(requestedUrls, [
			"https://tenant.auth0.com/oauth/token",
			"https://tenant.auth0.com/api/v2/users-by-email?email=teste%40example.com",
		]);
	});

	it("returns false when Auth0 does not return the email", async () => {
		configureAuth0Env();

		globalThis.fetch = (async input => {
			const url = input.toString();
			if (url === "https://tenant.auth0.com/oauth/token") {
				return {
					ok: true,
					json: async () => ({access_token: "management-token"}),
				} as Response;
			}

			return {
				ok: true,
				json: async () => ([]),
			} as Response;
		}) as typeof fetch;

		assert.equal(await auth0UserEmailExists("novo@example.com"), false);
	});
});
