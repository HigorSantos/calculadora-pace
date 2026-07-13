import {NextRequest, NextResponse} from "next/server";
import {activateCustomer, type IdentifierType, type PaymentMethod} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

export async function POST(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.json({error: "Rota disponível somente em desenvolvimento"}, {status: 404});
	}

	const secret = req.headers.get("x-admin-secret");
	if (secret !== process.env.ADMIN_SECRET) {
		return NextResponse.json({error: "Não autorizado"}, {status: 401});
	}

	const body = await req.json().catch(() => null);
	const identifierType: IdentifierType = body?.identifierType;
	const identifierValue: string = body?.identifierValue;
	const paymentPlatform: string = body?.paymentPlatform;
	const paymentMethod: PaymentMethod = body?.paymentMethod;
	const amountPaidCents: number = body?.amountPaidCents;

	if (!identifierType || !identifierValue || !paymentPlatform || !paymentMethod || amountPaidCents == null) {
		return NextResponse.json(
			{error: "identifierType, identifierValue, paymentPlatform, paymentMethod e amountPaidCents são obrigatórios"},
			{status: 400},
		);
	}

	const customer = await activateCustomer({
		identifier: {type: identifierType, value: identifierValue},
		paymentPlatform,
		paymentMethod,
		amountPaidCents,
	});

	return NextResponse.json({customerId: customer.customerId, active: customer.active});
}
