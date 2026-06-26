"use client";

import {useCallback, useEffect, useRef, useState} from "react";

type QueryStringValues = Record<string, string>;

export function useQueryStringState<TValues extends QueryStringValues>(
	initialValues: TValues,
) {
	const keysRef = useRef(Object.keys(initialValues) as Array<keyof TValues>);
	const didSkipInitialUrlWriteRef = useRef(false);
	const [values, setStateValues] = useState<TValues>(initialValues);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			setIsHydrated(true);
			return;
		}

		const params = new URLSearchParams(window.location.search);

		setStateValues(currentValues => {
			let hasChanges = false;
			const nextValues = {...currentValues};

			for (const key of keysRef.current) {
				const queryValue = params.get(String(key));

				if (queryValue != null && queryValue !== currentValues[key]) {
					nextValues[key] = queryValue as TValues[typeof key];
					hasChanges = true;
				}
			}

			return hasChanges ? nextValues : currentValues;
		});

		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!didSkipInitialUrlWriteRef.current) {
			didSkipInitialUrlWriteRef.current = true;
			return;
		}

		if (typeof window === "undefined") return;

		const url = new URL(window.location.href);

		for (const key of keysRef.current) {
			const paramName = String(key);
			const value = values[key];

			if (value.trim() === "") {
				url.searchParams.delete(paramName);
			} else {
				url.searchParams.set(paramName, value);
			}
		}

		const nextUrl = `${url.pathname}${url.search}${url.hash}`;
		const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

		if (nextUrl !== currentUrl) {
			window.history.replaceState(window.history.state, "", nextUrl);
		}
	}, [values]);

	const setValue = useCallback(
		<TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => {
			setStateValues(currentValues => {
				if (currentValues[key] === value) return currentValues;
				return {...currentValues, [key]: value};
			});
		},
		[],
	);

	const setValues = useCallback((nextValues: Partial<TValues>) => {
		setStateValues(currentValues => {
			let hasChanges = false;
			const mergedValues = {...currentValues};

			for (const [key, value] of Object.entries(nextValues) as Array<
				[keyof TValues, TValues[keyof TValues]]
			>) {
				if (value == null || mergedValues[key] === value) continue;

				mergedValues[key] = value;
				hasChanges = true;
			}

			return hasChanges ? mergedValues : currentValues;
		});
	}, []);

	return {values, setValue, setValues, isHydrated};
}
