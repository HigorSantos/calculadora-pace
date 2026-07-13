import {NextRequest, NextResponse} from "next/server";

import {
	AUTH0_REGISTRATION_ORDER_COOKIE,
	AUTH0_STATE_COOKIE,
	buildAuth0LogoutUrl,
} from "@/lib/auth0";
import {CUSTOMER_COOKIE} from "@/lib/customer-cookie";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

export async function GET(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	const response = NextResponse.redirect(
		buildAuth0LogoutUrl(req.nextUrl.origin),
	);

	response.cookies.delete(CUSTOMER_COOKIE);
	response.cookies.delete(AUTH0_STATE_COOKIE);
	response.cookies.delete(AUTH0_REGISTRATION_ORDER_COOKIE);

	return response;
}
