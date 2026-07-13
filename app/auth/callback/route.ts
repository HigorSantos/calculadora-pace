import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";

import {
	AUTH0_REGISTRATION_ORDER_COOKIE,
	AUTH0_STATE_COOKIE,
	exchangeAuth0Code,
	fetchAuth0Profile,
} from "@/lib/auth0";
import {CUSTOMER_COOKIE, cookieMaxAge} from "@/lib/customer-cookie";
import {
	addCustomerIdentifiers,
	findByIdentifier,
	findByOrderNsu,
	type Customer,
	type CustomerIdentifier,
} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

function redirectToRegistrar(
	req: NextRequest,
	status: string,
	orderNsu?: string,
) {
	const url = new URL("/registrar", req.url);
	url.searchParams.set("status", status);
	if (orderNsu) url.searchParams.set("order_nsu", orderNsu);
	return NextResponse.redirect(url);
}

function clearAuthCookies(response: NextResponse) {
	response.cookies.delete(AUTH0_STATE_COOKIE);
	response.cookies.delete(AUTH0_REGISTRATION_ORDER_COOKIE);
}

function setCustomerCookie(response: NextResponse, customer: Customer) {
	response.cookies.set(CUSTOMER_COOKIE, customer.customerId, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: cookieMaxAge(customer.activatedAt),
	});
}

async function findAuth0Customer(profile: {sub: string; email?: string}) {
	const byAuth0Id = await findByIdentifier("auth0_user_id", profile.sub);
	if (byAuth0Id) return byAuth0Id;

	const email = profile.email?.trim().toLowerCase();
	if (!email) return null;

	return findByIdentifier("email", email);
}

export async function GET(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	const code = req.nextUrl.searchParams.get("code");
	const state = req.nextUrl.searchParams.get("state");
	const jar = await cookies();
	const expectedState = jar.get(AUTH0_STATE_COOKIE)?.value;
	const orderNsu = jar.get(AUTH0_REGISTRATION_ORDER_COOKIE)?.value;

	if (!code || !state || !expectedState || state !== expectedState) {
		const response = orderNsu
			? redirectToRegistrar(req, "auth-error", orderNsu)
			: NextResponse.redirect(new URL("/?login=erro", req.url));
		clearAuthCookies(response);
		return response;
	}

	try {
		const accessToken = await exchangeAuth0Code(req.nextUrl.origin, code);
		const profile = await fetchAuth0Profile(accessToken);
		const identifiers: CustomerIdentifier[] = [
			{type: "auth0_user_id", value: profile.sub},
		];

		if (profile.email) {
			identifiers.push({
				type: "email",
				value: profile.email.trim().toLowerCase(),
			});
		}

		const customer = orderNsu
			? await findByOrderNsu(orderNsu)
			: await findAuth0Customer(profile);

		if (!customer || !customer.active) {
			const response = orderNsu
				? redirectToRegistrar(req, "processing", orderNsu)
				: NextResponse.redirect(new URL("/?login=sem-acesso", req.url));
			clearAuthCookies(response);
			return response;
		}

		const updatedCustomer =
			(await addCustomerIdentifiers(customer.customerId, identifiers)) ??
			customer;
		const response = NextResponse.redirect(
			new URL(orderNsu ? "/?registro=concluido" : "/", req.url),
		);

		clearAuthCookies(response);
		setCustomerCookie(response, updatedCustomer);

		return response;
	} catch {
		const response = orderNsu
			? redirectToRegistrar(req, "auth-error", orderNsu)
			: NextResponse.redirect(new URL("/?login=erro", req.url));
		clearAuthCookies(response);
		return response;
	}
}
