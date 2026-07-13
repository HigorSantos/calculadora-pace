import {NextRequest, NextResponse} from "next/server";

import {createAuth0DatabaseUser} from "@/lib/auth0";
import {
	activateCustomer,
	addCustomerIdentifiers,
	type Customer,
	type PaymentMethod,
} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

type InfinitePayWebhookPayload = {
	invoice_slug?: unknown;
	amount?: unknown;
	paid_amount?: unknown;
	installments?: unknown;
	capture_method?: unknown;
	transaction_nsu?: unknown;
	order_nsu?: unknown;
	receipt_url?: unknown;
	items?: unknown;
};

function stringValue(value: unknown) {
	return typeof value === "string" && value.trim() !== ""
		? value.trim()
		: null;
}

function numberValue(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function integerValue(value: unknown) {
	const parsed = numberValue(value);
	if (parsed == null) return null;
	return Number.isInteger(parsed) ? parsed : null;
}

function centsValue(value: unknown) {
	const parsed = numberValue(value);
	if (parsed == null || parsed < 0) return null;
	return Math.round(parsed);
}

function paymentMethodFromCaptureMethod(
	captureMethod: string | null,
): PaymentMethod {
	if (captureMethod === "pix") return "pix";
	if (captureMethod === "boleto") return "boleto";
	if (captureMethod === "credit_card") return "credit_card";
	return "other";
}

function customerEmail(customer: Customer) {
	return customer.identifiers.find(identifier => identifier.type === "email")
		?.value;
}

async function createPaidUserAccount(customer: Customer) {
	const email = customerEmail(customer);
	if (!email) return {created: false, reason: "missing-email"};

	const auth0User = await createAuth0DatabaseUser(email);
	if (auth0User.userId) {
		await addCustomerIdentifiers(customer.customerId, [
			{type: "auth0_user_id", value: auth0User.userId},
		]);
	}

	return {
		created: auth0User.created,
		reason: auth0User.created ? "created" : "already-exists",
	};
}

export async function POST(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.json({error: "Webhook disponível somente em desenvolvimento"}, {status: 404});
	}

	const body = (await req.json().catch(() => null)) as
		| InfinitePayWebhookPayload
		| null;

	if (!body) {
		return NextResponse.json({error: "Payload inválido"}, {status: 400});
	}

	const orderNsu = stringValue(body.order_nsu);
	const transactionNsu = stringValue(body.transaction_nsu);
	const installments = integerValue(body.installments);
	const amountPaidCents = centsValue(body.paid_amount);
	const captureMethod = stringValue(body.capture_method);

	if (
		!orderNsu ||
		!transactionNsu ||
		installments == null ||
		amountPaidCents == null
	) {
		return NextResponse.json(
			{
				error:
					"order_nsu, transaction_nsu, installments e paid_amount são obrigatórios",
			},
			{status: 400},
		);
	}

	const customer = await activateCustomer({
		identifier: {type: "infinite_pay_order_nsu", value: orderNsu},
		paymentPlatform: "infinite-pay",
		paymentMethod: paymentMethodFromCaptureMethod(captureMethod),
		amountPaidCents,
		installments,
		orderNsu,
		transactionNsu,
	});
	const auth0User = await createPaidUserAccount(customer);

	return NextResponse.json({received: true, auth0User});
}
