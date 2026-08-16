import {randomUUID} from "crypto";

import {getDb} from "@/lib/mongodb";
import {normalizeOrderNsuLookupValue} from "./order-nsu";

export type IdentifierType =
	| "email"
	| "hotmart_id"
	| "stripe_id"
	| "auth0_user_id"
	| "infinite_pay_order_nsu"
	| "manual";

export type CustomerIdentifier = {
	type: IdentifierType;
	value: string;
};

export type PaymentMethod = "pix" | "credit_card" | "boleto" | "other";

export type Customer = {
	customerId: string;
	name: string | null;
	active: boolean;
	createdAt: Date;
	activatedAt: Date | null;
	identifiers: CustomerIdentifier[];
	paymentPlatform: string | null;
	paymentMethod: PaymentMethod | null;
	amountPaidCents: number | null;
	installments: number | null;
	orderNsu: string | null;
	transactionNsu: string | null;
	registeredAtBrasilia: string | null;
	clientIp: string | null;
	clientPort: string | null;
};

export class CustomerEmailAlreadyExistsError extends Error {
	readonly email: string;

	constructor(email: string) {
		super("Email já cadastrado");
		this.name = "CustomerEmailAlreadyExistsError";
		this.email = email;
	}
}

async function collection() {
	const db = await getDb();
	return db.collection<Customer>("customers");
}

export async function findByCustomerId(
	customerId: string,
): Promise<Customer | null> {
	const col = await collection();
	return col.findOne({customerId}, {projection: {_id: 0}});
}

export async function findByIdentifier(
	type: IdentifierType,
	value: string,
): Promise<Customer | null> {
	const col = await collection();
	return col.findOne(
		{identifiers: {$elemMatch: {type, value}}},
		{projection: {_id: 0}},
	);
}

export async function findByOrderNsu(
	orderNsu: string,
): Promise<Customer | null> {
	const col = await collection();
	const normalizedOrderNsu = normalizeOrderNsuLookupValue(orderNsu);
	const orderNsuCandidates =
		normalizedOrderNsu === orderNsu
			? [orderNsu]
			: [orderNsu, normalizedOrderNsu];

	return col.findOne(
		{orderNsu: {$in: orderNsuCandidates}},
		{projection: {_id: 0}},
	);
}

export async function createCustomer(
	identifiers: CustomerIdentifier[],
): Promise<Customer> {
	const col = await collection();
	const customer: Customer = {
		customerId: randomUUID(),
		name: null,
		active: false,
		createdAt: new Date(),
		activatedAt: null,
		identifiers,
		paymentPlatform: null,
		paymentMethod: null,
		amountPaidCents: null,
		installments: null,
		orderNsu: null,
		transactionNsu: null,
		registeredAtBrasilia: null,
		clientIp: null,
		clientPort: null,
	};
	await col.insertOne(customer);
	return customer;
}


export async function addCustomerIdentifiers(
	customerId: string,
	identifiers: CustomerIdentifier[],
): Promise<Customer | null> {
	const col = await collection();
	await col.updateOne(
		{customerId},
		{$addToSet: {identifiers: {$each: identifiers}}},
	);
	return findByCustomerId(customerId);
}

export type CreateInfinitePayCheckoutCustomerInput = {
	name: string;
	email: string;
	orderNsu?: string | null;
	registeredAtBrasilia?: string | null;
	clientIp?: string | null;
	clientPort?: string | null;
};

export async function createInfinitePayCheckoutCustomer(
	input: CreateInfinitePayCheckoutCustomerInput,
): Promise<Customer> {
	const col = await collection();
	const name = input.name.trim().replace(/\s+/g, " ");
	const email = input.email.trim().toLowerCase();
	const existing = await findByIdentifier("email", email);
	if (existing) {
		throw new CustomerEmailAlreadyExistsError(email);
	}

	const orderNsu = input.orderNsu ?? randomUUID();
	const identifiers: CustomerIdentifier[] = [
		{type: "email", value: email},
		{type: "infinite_pay_order_nsu", value: orderNsu},
	];

	const customer: Customer = {
		customerId: randomUUID(),
		name,
		active: false,
		createdAt: new Date(),
		activatedAt: null,
		identifiers,
		paymentPlatform: "infinite-pay",
		paymentMethod: null,
		amountPaidCents: null,
		installments: null,
		orderNsu,
		transactionNsu: null,
		registeredAtBrasilia: input.registeredAtBrasilia ?? null,
		clientIp: input.clientIp ?? null,
		clientPort: input.clientPort ?? null,
	};
	await col.insertOne(customer);
	return customer;
}

export type ActivateCustomerInput = {
	identifier: CustomerIdentifier;
	paymentPlatform: string;
	paymentMethod: PaymentMethod;
	amountPaidCents: number;
	installments?: number | null;
	orderNsu?: string | null;
	transactionNsu?: string | null;
};

export async function activateCustomer(
	input: ActivateCustomerInput,
): Promise<Customer> {
	const col = await collection();

	const existing =
		(input.orderNsu ? await findByOrderNsu(input.orderNsu) : null) ??
		(await findByIdentifier(input.identifier.type, input.identifier.value));

	if (existing) {
		await col.updateOne(
			{customerId: existing.customerId},
			{
				$set: {
					active: true,
					activatedAt: new Date(),
					paymentPlatform: input.paymentPlatform,
					paymentMethod: input.paymentMethod,
					amountPaidCents: input.amountPaidCents,
					installments: input.installments ?? null,
					orderNsu: input.orderNsu ?? null,
					transactionNsu: input.transactionNsu ?? null,
				},
				$addToSet: {identifiers: input.identifier},
			},
		);
		return (await findByCustomerId(existing.customerId))!;
	}

	const customer = await createCustomer([input.identifier]);
	await col.updateOne(
		{customerId: customer.customerId},
		{
			$set: {
				active: true,
				activatedAt: new Date(),
				paymentPlatform: input.paymentPlatform,
				paymentMethod: input.paymentMethod,
				amountPaidCents: input.amountPaidCents,
				installments: input.installments ?? null,
				orderNsu: input.orderNsu ?? null,
				transactionNsu: input.transactionNsu ?? null,
			},
		},
	);
	return (await findByCustomerId(customer.customerId))!;
}
