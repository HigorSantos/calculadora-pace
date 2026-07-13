import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";

import {
	AUTH0_REGISTRATION_ORDER_COOKIE,
	AUTH0_STATE_COOKIE,
	buildAuth0AuthorizeUrl,
	createAuth0State,
} from "@/lib/auth0";
import {findByOrderNsu} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

const TEN_MINUTES_SECONDS = 10 * 60;

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

export async function GET(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	const orderNsu = req.nextUrl.searchParams.get("order_nsu")?.trim();

	if (orderNsu) {
		const customer = await findByOrderNsu(orderNsu);

		if (!customer || !customer.active) {
			return redirectToRegistrar(req, "processing", orderNsu);
		}
	}

	const state = createAuth0State();
	const jar = await cookies();
	const secure = process.env.NODE_ENV === "production";

	jar.set(AUTH0_STATE_COOKIE, state, {
		httpOnly: true,
		sameSite: "lax",
		secure,
		path: "/",
		maxAge: TEN_MINUTES_SECONDS,
	});

	if (orderNsu) {
		jar.set(AUTH0_REGISTRATION_ORDER_COOKIE, orderNsu, {
			httpOnly: true,
			sameSite: "lax",
			secure,
			path: "/",
			maxAge: TEN_MINUTES_SECONDS,
		});
	} else {
		jar.delete(AUTH0_REGISTRATION_ORDER_COOKIE);
	}

	return NextResponse.redirect(
		buildAuth0AuthorizeUrl(req.nextUrl.origin, state),
	);
}
