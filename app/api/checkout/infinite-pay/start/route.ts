import {randomUUID} from "crypto";
import {NextRequest, NextResponse} from "next/server";

import {auth0UserEmailExists} from "@/lib/auth0";
import {
	createInfinitePayCheckoutCustomer,
	CustomerEmailAlreadyExistsError,
} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

const INFINITE_PAY_LINKS_URL = "https://api.checkout.infinitepay.io/links";
const APP_URL = "https://arsenaldocorredor.com.br";
const PREMIUM_ITEM = {
	quantity: 1,
	price: 1990,
	description: "Arsenal do Corredor Premium anual - oferta de lançamento",
};

function normalizeEmail(value: unknown) {
	if (typeof value !== "string") return null;
	const email = value.trim().toLowerCase();
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeName(value: unknown) {
	if (typeof value !== "string") return null;
	const name = value.trim().replace(/\s+/g, " ");
	return name.length >= 2 ? name : null;
}

function infinitePayHandle() {
	const handle = process.env.INFINITE_PAY_HANDLE?.trim();
	return handle && handle.length > 0 ? handle : null;
}

function brasiliaTimestamp(date = new Date()) {
	const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
	return new Date(date.getTime() + brasiliaOffsetMs)
		.toISOString()
		.replace("Z", "-03:00");
}

function forwardedClientIp(req: NextRequest) {
	const forwardedFor =
		req.headers.get("x-forwarded-for") ??
		req.headers.get("x-vercel-forwarded-for") ??
		req.headers.get("x-real-ip");
	return forwardedFor?.split(",")[0]?.trim() || null;
}

function forwardedClientPort(req: NextRequest) {
	return req.headers.get("x-forwarded-port")?.trim() || null;
}

function emailAlreadyRegisteredResponse() {
	return NextResponse.json(
		{error: "Este e-mail já está cadastrado."},
		{status: 409},
	);
}

export async function POST(req: NextRequest) {
	if (!PAYMENT_AUTH_ENABLED) {
		return NextResponse.json({error: "Checkout disponível somente em desenvolvimento"}, {status: 404});
	}

	const body = await req.json().catch(() => null);
	const name = normalizeName(body?.name);
	const email = normalizeEmail(body?.email);
	const handle = infinitePayHandle();

	if (!name) {
		return NextResponse.json({error: "nome é obrigatório"}, {status: 400});
	}
	if (!email) {
		return NextResponse.json({error: "email válido é obrigatório"}, {status: 400});
	}
	if (!handle) {
		return NextResponse.json(
			{error: "INFINITE_PAY_HANDLE não configurado"},
			{status: 500},
		);
	}

	const auth0EmailAlreadyExists = await auth0UserEmailExists(email);
	if (auth0EmailAlreadyExists) {
		return emailAlreadyRegisteredResponse();
	}

	const orderNsu = randomUUID();
	const customer = await createInfinitePayCheckoutCustomer({
		name,
		email,
		orderNsu,
		registeredAtBrasilia: brasiliaTimestamp(),
		clientIp: forwardedClientIp(req),
		clientPort: forwardedClientPort(req),
	}).catch(error => {
		if (error instanceof CustomerEmailAlreadyExistsError) {
			return null;
		}
		throw error;
	});

	if (!customer) {
		return emailAlreadyRegisteredResponse();
	}

	const payload = {
		handle,
		items: [PREMIUM_ITEM],
		order_nsu: customer.orderNsu ?? orderNsu,
		redirect_url: `${APP_URL}/registrar`,
		webhook_url: `${APP_URL}/api/webhooks/infinite-pay`,
		customer: {name, email},
	};

	const response = await fetch(INFINITE_PAY_LINKS_URL, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(payload),
	});
	const data = (await response.json().catch(() => null)) as {url?: unknown} | null;

	if (!response.ok || typeof data?.url !== "string" || data.url.trim() === "") {
		return NextResponse.json(
			{error: "Não foi possível gerar o checkout da InfinitePay"},
			{status: 502},
		);
	}

	return NextResponse.json({
		url: data.url,
		customerId: customer.customerId,
		orderNsu: customer.orderNsu,
	});
}
