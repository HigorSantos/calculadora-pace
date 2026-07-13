import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {findByCustomerId} from "@/lib/customer";
import {CUSTOMER_COOKIE, cookieMaxAge} from "@/lib/customer-cookie";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

export async function GET() {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.json({active: true});
	}

	const jar = await cookies();
	const customerId = jar.get(CUSTOMER_COOKIE)?.value;

	if (!customerId) {
		return NextResponse.json({active: false});
	}

	const customer = await findByCustomerId(customerId);

	if (!customer) {
		jar.delete(CUSTOMER_COOKIE);
		return NextResponse.json({active: false});
	}

	// Renova o cookie a cada requisição para recalcular o maxAge
	jar.set(CUSTOMER_COOKIE, customerId, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: cookieMaxAge(customer.activatedAt),
	});

	return NextResponse.json({active: customer.active});
}
