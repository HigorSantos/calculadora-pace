import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {findByIdentifier, type IdentifierType} from "@/lib/customer";
import {CUSTOMER_COOKIE, cookieMaxAge} from "@/lib/customer-cookie";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

export async function POST(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.json({error: "Rota disponível somente em desenvolvimento"}, {status: 404});
	}

	const body = await req.json().catch(() => null);
	const type: IdentifierType = body?.type;
	const value: string = body?.value;

	if (!type || !value) {
		return NextResponse.json({error: "type e value são obrigatórios"}, {status: 400});
	}

	const customer = await findByIdentifier(type, value);

	if (!customer || !customer.active) {
		return NextResponse.json({error: "Cliente não encontrado ou inativo"}, {status: 404});
	}

	const jar = await cookies();
	jar.set(CUSTOMER_COOKIE, customer.customerId, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: cookieMaxAge(customer.activatedAt),
	});

	return NextResponse.json({active: true});
}
