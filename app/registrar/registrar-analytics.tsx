"use client";

import {useEffect} from "react";

import {useUmami} from "@/hooks/use-umami";

type RegistrarAnalyticsProps = {
	paymentConfirmed: boolean;
	transactionId: string | null;
	amountPaidCents: number | null;
};

const PREMIUM_OFFER_ID = "arsenal-corredor-premium-anual";
const PREMIUM_OFFER_NAME = "Arsenal do Corredor Premium anual";
const DEFAULT_PREMIUM_PRICE = 1990;

export function RegistrarAnalytics({
	paymentConfirmed,
	transactionId,
	amountPaidCents,
}: RegistrarAnalyticsProps) {
	const {trackCheckoutComplete} = useUmami();

	useEffect(() => {
		if (!paymentConfirmed || !transactionId) return;

		const storageKey = `arsenal-checkout-complete:${transactionId}`;
		if (window.sessionStorage.getItem(storageKey) === "1") return;

		trackCheckoutComplete({
			offerId: PREMIUM_OFFER_ID,
			offerName: PREMIUM_OFFER_NAME,
			offerPrice: amountPaidCents ?? DEFAULT_PREMIUM_PRICE,
			transactionId,
		});
		window.sessionStorage.setItem(storageKey, "1");
	}, [amountPaidCents, paymentConfirmed, trackCheckoutComplete, transactionId]);

	return null;
}
