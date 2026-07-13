"use client";

import {useCallback, useMemo} from "react";

declare global {
	interface Window {
		umami?: {track: (...args: unknown[]) => void};
		dataLayer?: unknown[];
	}
}

interface AnalyticsParams {
	[key: string]: string | number | boolean | undefined | null;
}

const isUmamiAvailable = () =>
	typeof window !== "undefined" && typeof window.umami?.track === "function";

export const useUmami = () => {
	const trackEvent = useCallback(
		(eventName: string, params?: AnalyticsParams) => {
			const payload = {...params};

			// Provedores diretos (mantidos)
			if (isUmamiAvailable()) {
				window.umami?.track(eventName, payload);
			}
		},
		[],
	);

	const trackExit = useCallback(
		(timeSeconds: number) => {
			trackEvent("lp_exit", {time_seconds: timeSeconds});
		},
		[trackEvent],
	);

	const trackCheckoutOpen = useCallback(
		({
			offerId,
			offerName,
			price,
			currency,
			source,
		}: {
			offerId: string;
			offerName: string;
			price: number;
			currency: string;
			source: string;
		}) => {
			trackEvent("checkout_open", {
				offer_id: offerId,
				offer_name: offerName,
				offer_price: price,
				offer_source: source,
				currency: currency,
			});
		},
		[trackEvent],
	);

	const trackCheckoutSubmit = useCallback(
		({
			stepIndex,
			success,
			errorMessage,
			offerPrice,
		}: {
			stepIndex: number;
			success: boolean;
			errorMessage?: string;
			offerPrice: number;
		}) => {
			trackEvent("checkout_submit", {
				step_index: stepIndex,
				success,
				error_message: errorMessage,
				offer_price: offerPrice,
			});
		},
		[trackEvent],
	);

	const trackCheckoutComplete = useCallback(
		({
			offerId,
			offerName,
			offerPrice,
			transactionId,
		}: {
			offerId: string;
			offerName: string;
			offerPrice: number;
			transactionId: string;
		}) => {
			trackEvent("checkout_complete", {
				transaction_id: transactionId,
				plan_id: offerId,
				plan_name: offerName,
				plan_price: offerPrice,
			});
		},
		[trackEvent],
	);

	const trackCheckoutAbandon = useCallback(
		({
			stepIndex,
			stepTitle,

			offerPrice,
		}: {
			stepIndex: number;
			stepTitle: string;
			offerPrice: number;
		}) => {
			trackEvent("checkout_abandon", {
				step_index: stepIndex,
				step_title: stepTitle,
				offer_price: offerPrice,
			});
		},
		[trackEvent],
	);

	return {
		trackEvent,
		trackExit,
		trackCheckoutOpen,
		trackCheckoutSubmit,
		trackCheckoutComplete,
		trackCheckoutAbandon,
	};
};
