import type {Consumable, Lap} from "@/lib/pace";

export const NO_RACE_CONFIG_ID = "none";
export const RACE_CONSUMABLE_ID_PREFIX = "race-";

export type RaceCourseItemCategory =
	| "hydration"
	| "isotonic"
	| "sweet"
	| "savory"
	| "support"
	| "snack";

export type RaceCourseItem = {
	distanceKm: number;
	name: string;
	category: RaceCourseItemCategory;
	carbs?: number;
	sodium?: number;
	caffeine?: number;
};

export type RaceConfiguration = {
	id: string;
	name: string;
	date: string;
	distanceKm: number;
	items: RaceCourseItem[];
};

export const RACE_CONFIGURATIONS: RaceConfiguration[] = [
	{
		id: "sp-city-marathon-2026-21k",
		name: "21k - SP City Marathon",
		date: "2026-07-26",
		distanceKm: 21.097,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 6.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Isotônico", category: "isotonic"},
			{distanceKm: 16, name: "Água", category: "hydration"},
			{distanceKm: 16, name: "Gel Carbo", category: "sweet"},
			{distanceKm: 18, name: "Água", category: "hydration"},
			{distanceKm: 18, name: "Isotônico", category: "isotonic"},
		],
	},
	{
		id: "maratona-internacional-joao-pessoa-2026-21k",
		name: "21K - Maratona Internacional de João Pessoa",
		date: "2026-08-01",
		distanceKm: 21.097,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 5.5, name: "Água", category: "hydration"},
			{distanceKm: 8, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 17, name: "Água", category: "hydration"},
			{distanceKm: 19.5, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-internacional-joao-pessoa-2026-42k",
		name: "42K - Maratona Internacional de João Pessoa",
		date: "2026-08-02",
		distanceKm: 42.195,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 5.5, name: "Água", category: "hydration"},
			{distanceKm: 8, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 17, name: "Água", category: "hydration"},
			{distanceKm: 20.5, name: "Água", category: "hydration"},
			{distanceKm: 22, name: "Água", category: "hydration"},
			{distanceKm: 24, name: "Água", category: "hydration"},
			{distanceKm: 26.5, name: "Água", category: "hydration"},
			{distanceKm: 30, name: "Água", category: "hydration"},
			{distanceKm: 33, name: "Água", category: "hydration"},
			{distanceKm: 36, name: "Água", category: "hydration"},
			{distanceKm: 38.5, name: "Água", category: "hydration"},
			{distanceKm: 41, name: "Água", category: "hydration"},
		],
	},
	{
		id: "meia-maratona-internacional-rio-2026-21k",
		name: "28ª Meia Maratona Int'l do Rio",
		date: "2026-08-16",
		distanceKm: 21.097,
		items: [
			{distanceKm: 3.3, name: "Água", category: "hydration"},
			{distanceKm: 6.3, name: "Água", category: "hydration"},
			{distanceKm: 9, name: "Água", category: "hydration"},
			{distanceKm: 9, name: "Snack", category: "sweet"},
			{distanceKm: 12.3, name: "Isotônico", category: "isotonic"},
			{distanceKm: 13, name: "Água", category: "hydration"},
			{distanceKm: 16.3, name: "Água", category: "hydration"},
			{distanceKm: 19.3, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-internacional-floripa-2026-21k",
		name: "21K - Maratona Internacional de Floripa",
		date: "2026-08-29",
		distanceKm: 21.097,
		items: [
			{distanceKm: 4.6, name: "Água", category: "hydration"},
			{distanceKm: 7.7, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 13.6, name: "Água", category: "hydration"},
			{distanceKm: 15.7, name: "Água", category: "hydration"},
			{distanceKm: 17.6, name: "Água", category: "hydration"},
			{distanceKm: 28.5, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-internacional-floripa-2026-42k",
		name: "42K - Maratona Internacional de Floripa",
		date: "2026-08-29",
		distanceKm: 42.195,
		items: [
			{distanceKm: 4.3, name: "Água", category: "hydration"},
			{distanceKm: 6.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 13.4, name: "Água", category: "hydration"},
			{distanceKm: 15.4, name: "Água", category: "hydration"},
			{distanceKm: 18.1, name: "Água", category: "hydration"},
			{distanceKm: 20.8, name: "Água", category: "hydration"},
			{distanceKm: 23.1, name: "Água", category: "hydration"},
			{distanceKm: 25.4, name: "Água", category: "hydration"},
			{distanceKm: 27.8, name: "Água", category: "hydration"},
			{distanceKm: 30.7, name: "Água", category: "hydration"},
			{distanceKm: 32.6, name: "Água", category: "hydration"},
			{distanceKm: 35.2, name: "Água", category: "hydration"},
			{distanceKm: 37.6, name: "Água", category: "hydration"},
			{distanceKm: 39.6, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-de-vitoria-2026-21k",
		name: "21K - Maratona de Vitória",
		date: "2026-08-30",
		distanceKm: 21.097,
		items: [
			{distanceKm: 2.6, name: "Água", category: "hydration"},
			{distanceKm: 5.3, name: "Água", category: "hydration"},
			{distanceKm: 8.3, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 16.3, name: "Água", category: "hydration"},
			{distanceKm: 16.3, name: "Isotônico", category: "isotonic"},
			{distanceKm: 19.2, name: "Água", category: "hydration"},
			{distanceKm: 19.2, name: "Isotônico", category: "isotonic"},
		],
	},
	{
		id: "maratona-de-vitoria-2026-42k",
		name: "42K - Maratona de Vitória",
		date: "2026-08-30",
		distanceKm: 42.195,
		items: [
			{distanceKm: 2.6, name: "Água", category: "hydration"},
			{distanceKm: 5.3, name: "Água", category: "hydration"},
			{distanceKm: 8.3, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 17, name: "Água", category: "hydration"},
			{distanceKm: 17, name: "Isotônico", category: "isotonic"},
			{distanceKm: 20, name: "Água", category: "hydration"},
			{distanceKm: 23, name: "Água", category: "hydration"},
			{distanceKm: 23, name: "Isotônico", category: "isotonic"},
			{distanceKm: 26, name: "Água", category: "hydration"},
			{distanceKm: 29, name: "Água", category: "hydration"},
			{distanceKm: 29, name: "Isotônico", category: "isotonic"},
			{distanceKm: 31.7, name: "Água", category: "hydration"},
			{distanceKm: 34, name: "Água", category: "hydration"},
			{distanceKm: 34, name: "Isotônico", category: "isotonic"},
			{distanceKm: 37.3, name: "Água", category: "hydration"},
			{distanceKm: 40.7, name: "Água", category: "hydration"},
			{distanceKm: 40.7, name: "Isotônico", category: "isotonic"},
		],
	},
	{
		id: "meia-maratona-do-sol-2026",
		name: "Meia Maratona do Sol",
		date: "2026-09-20",
		distanceKm: 21.097,
		items: [
			{distanceKm: 2.5, name: "Água", category: "hydration"},
			{distanceKm: 5, name: "Água", category: "hydration"},
			{distanceKm: 7.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 12.5, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Água", category: "hydration"},
			{distanceKm: 17.5, name: "Água", category: "hydration"},
			{distanceKm: 20, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-salvador-2026-21k",
		name: "21K - Maratona Salvador",
		date: "2026-09-27",
		distanceKm: 21.097,
		items: [
			{distanceKm: 2, name: "Água", category: "hydration"},
			{distanceKm: 4, name: "Água", category: "hydration"},
			{distanceKm: 6.7, name: "Água", category: "hydration"},
			{distanceKm: 8.3, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 13.2, name: "Água", category: "hydration"},
			{distanceKm: 15.4, name: "Água", category: "hydration"},
			{distanceKm: 17.4, name: "Água", category: "hydration"},
			{distanceKm: 19.4, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-salvador-2026-42k",
		name: "42K - Maratona Salvador",
		date: "2026-09-27",
		distanceKm: 42.195,
		items: [
			{distanceKm: 2, name: "Água", category: "hydration"},
			{distanceKm: 4, name: "Água", category: "hydration"},
			{distanceKm: 6.7, name: "Água", category: "hydration"},
			{distanceKm: 8.3, name: "Água", category: "hydration"},
			{distanceKm: 11, name: "Água", category: "hydration"},
			{distanceKm: 13.2, name: "Água", category: "hydration"},
			{distanceKm: 15.4, name: "Água", category: "hydration"},
			{distanceKm: 17.4, name: "Água", category: "hydration"},
			{distanceKm: 19.4, name: "Água", category: "hydration"},
			{distanceKm: 22, name: "Água", category: "hydration"},
			{distanceKm: 25, name: "Água", category: "hydration"},
			{distanceKm: 27, name: "Água", category: "hydration"},
			{distanceKm: 29.7, name: "Água", category: "hydration"},
			{distanceKm: 32.3, name: "Água", category: "hydration"},
			{distanceKm: 33.3, name: "Água", category: "hydration"},
			{distanceKm: 36, name: "Água", category: "hydration"},
			{distanceKm: 38.7, name: "Água", category: "hydration"},
			{distanceKm: 40.7, name: "Água", category: "hydration"},
		],
	},
	{
		id: "maratona-criciuma-2026-21k",
		name: "21K - Maratona de Criciúma",
		date: "2026-09-27",
		distanceKm: 21.097,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 6, name: "Água", category: "hydration"},
			{distanceKm: 9, name: "Água", category: "hydration"},
			{distanceKm: 12, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Água", category: "hydration"},
			{distanceKm: 18, name: "Água", category: "hydration"},
			{distanceKm: 21, name: "Água", category: "hydration"},
			{distanceKm: 7, name: "Isotônico", category: "isotonic"},
			{distanceKm: 7, name: "Frutas", category: "snack"},
			{distanceKm: 14, name: "Isotônico", category: "isotonic"},
			{distanceKm: 14, name: "Frutas", category: "snack"},
		],
	},
	{
		id: "maratona-criciuma-2026-42k",
		name: "42K - Maratona de Criciúma",
		date: "2026-09-27",
		distanceKm: 42.195,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 6, name: "Água", category: "hydration"},
			{distanceKm: 9, name: "Água", category: "hydration"},
			{distanceKm: 12, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Água", category: "hydration"},
			{distanceKm: 18, name: "Água", category: "hydration"},
			{distanceKm: 21, name: "Água", category: "hydration"},
			{distanceKm: 24, name: "Água", category: "hydration"},
			{distanceKm: 27, name: "Água", category: "hydration"},
			{distanceKm: 30, name: "Água", category: "hydration"},
			{distanceKm: 33, name: "Água", category: "hydration"},
			{distanceKm: 36, name: "Água", category: "hydration"},
			{distanceKm: 39, name: "Água", category: "hydration"},
			{distanceKm: 42, name: "Água", category: "hydration"},
			{distanceKm: 7, name: "Isotônico", category: "isotonic"},
			{distanceKm: 7, name: "Frutas", category: "snack"},
			{distanceKm: 14, name: "Isotônico", category: "isotonic"},
			{distanceKm: 14, name: "Frutas", category: "snack"},
			{distanceKm: 21, name: "Isotônico", category: "isotonic"},
			{distanceKm: 21, name: "Frutas", category: "snack"},
			{distanceKm: 28, name: "Isotônico", category: "isotonic"},
			{distanceKm: 28, name: "Frutas", category: "snack"},
			{distanceKm: 35, name: "Isotônico", category: "isotonic"},
			{distanceKm: 35, name: "Frutas", category: "snack"},
		],
	},
	{
		id: "maratona-monumental-brasilia-2026-21k",
		name: "21K - Maratona Monumental de Brasília",
		date: "2026-11-22",
		distanceKm: 21.097,
		items: [
			{distanceKm: 2.5, name: "Água", category: "hydration"},
			{distanceKm: 5, name: "Água", category: "hydration"},
			{distanceKm: 7.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 12.5, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Água", category: "hydration"},
			{distanceKm: 17.5, name: "Água", category: "hydration"},
			{distanceKm: 20, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Isotônico", category: "isotonic"},
			{distanceKm: 15, name: "Frutas", category: "snack"},
		],
	},
	{
		id: "maratona-monumental-brasilia-2026-42k",
		name: "42K - Maratona Monumental de Brasília",
		date: "2026-11-22",
		distanceKm: 42.195,
		items: [
			{distanceKm: 2.5, name: "Água", category: "hydration"},
			{distanceKm: 5, name: "Água", category: "hydration"},
			{distanceKm: 7.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 12.5, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Água", category: "hydration"},
			{distanceKm: 17.5, name: "Água", category: "hydration"},
			{distanceKm: 20, name: "Água", category: "hydration"},
			{distanceKm: 22.5, name: "Água", category: "hydration"},
			{distanceKm: 25, name: "Água", category: "hydration"},
			{distanceKm: 27.5, name: "Água", category: "hydration"},
			{distanceKm: 30, name: "Água", category: "hydration"},
			{distanceKm: 32.5, name: "Água", category: "hydration"},
			{distanceKm: 35, name: "Água", category: "hydration"},
			{distanceKm: 37.5, name: "Água", category: "hydration"},
			{distanceKm: 40, name: "Água", category: "hydration"},
			{distanceKm: 15, name: "Isotônico", category: "isotonic"},
			{distanceKm: 15, name: "Frutas", category: "snack"},
			{distanceKm: 25, name: "Isotônico", category: "isotonic"},
			{distanceKm: 25, name: "Frutas", category: "snack"},
			{distanceKm: 36, name: "Isotônico", category: "isotonic"},
			{distanceKm: 36, name: "Frutas", category: "snack"},
		],
	},
	{
		id: "sp-city-marathon-2026-42k",
		name: "42K - SP City Marathon",
		date: "2026-07-26",
		distanceKm: 42.195,
		items: [
			{distanceKm: 3, name: "Água", category: "hydration"},
			{distanceKm: 6.5, name: "Água", category: "hydration"},
			{distanceKm: 10, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Água", category: "hydration"},
			{distanceKm: 14, name: "Isotônico", category: "isotonic"},
			{distanceKm: 16, name: "Água", category: "hydration"},
			{distanceKm: 16, name: "Gel Carbo", category: "sweet"},
			{distanceKm: 18, name: "Água", category: "hydration"},
			{distanceKm: 18, name: "Isotônico", category: "isotonic"},
			{distanceKm: 21, name: "Água", category: "hydration"},
			{distanceKm: 23.5, name: "Água", category: "hydration"},
			{distanceKm: 23.5, name: "Banana", category: "sweet"},
			{distanceKm: 26, name: "Água", category: "hydration"},
			{distanceKm: 28, name: "Água", category: "hydration"},
			{distanceKm: 30.5, name: "Água", category: "hydration"},
			{distanceKm: 30.5, name: "Isotônico", category: "isotonic"},
			{distanceKm: 32.5, name: "Água", category: "hydration"},
			{distanceKm: 32.5, name: "Banana", category: "sweet"},
			{distanceKm: 35.5, name: "Água", category: "hydration"},
			{distanceKm: 35.5, name: "Salgado", category: "savory"},
			{distanceKm: 35.5, name: "Refrigerante", category: "sweet"},
			{distanceKm: 38, name: "Água", category: "hydration"},
			{distanceKm: 38, name: "Isotônico", category: "isotonic"},
			{distanceKm: 40, name: "Bala de goma", category: "sweet"},
			{distanceKm: 41, name: "Água", category: "hydration"},
		],
	},
];

export function isRaceConfigurationVisible(
	race: RaceConfiguration,
	referenceDate = new Date(),
) {
	const [year, month, day] = race.date.split("-").map(Number);
	if (!year || !month || !day) return true;

	const raceDayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
	return referenceDate.getTime() <= raceDayEnd.getTime();
}

export function formatRaceDate(date: string) {
	const [year, month, day] = date.split("-").map(Number);
	if (!year || !month || !day) return date;

	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "short",
	}).format(new Date(year, month - 1, day));
}

function slugify(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function isRaceConsumableId(id: string) {
	return id.startsWith(RACE_CONSUMABLE_ID_PREFIX);
}

export function raceItemId(race: RaceConfiguration, item: RaceCourseItem) {
	return `${RACE_CONSUMABLE_ID_PREFIX}${slugify(race.id)}-${slugify(
		`${item.name}-${item.category}`,
	)}`;
}

export function raceActionId(race: RaceConfiguration, item: RaceCourseItem) {
	return `${raceItemId(race, item)}@${item.distanceKm}`;
}

export function raceActionConsumableId(actionId: string) {
	return actionId.split("@")[0] ?? actionId;
}

export function raceActionDescription(actionId: string) {
	const [, rawDistance] = actionId.split("@");
	if (!rawDistance) return null;

	const distance = Number(rawDistance);
	return Number.isFinite(distance) ? formatRaceDistance(distance) : null;
}

export function raceItemToConsumable(
	race: RaceConfiguration,
	item: RaceCourseItem,
): Consumable {
	return {
		id: raceItemId(race, item),
		name: item.name,
		brand: race.name,
		carbs: item.carbs ?? 0,
		sodium: item.sodium ?? 0,
		caffeine: item.caffeine ?? 0,
		paid: false,
	};
}

export function raceConsumables(race: RaceConfiguration) {
	const byId = new Map<string, Consumable>();

	for (const item of race.items) {
		const consumable = raceItemToConsumable(race, item);
		byId.set(consumable.id, consumable);
	}

	return Array.from(byId.values());
}

export function buildRaceActions(race: RaceConfiguration, laps: Lap[]) {
	const actions: Record<number, string[]> = {};

	for (const item of race.items) {
		const lapIndex = findLapIndexForDistance(laps, item.distanceKm);
		if (lapIndex == null) continue;
		actions[lapIndex] = [
			...(actions[lapIndex] ?? []),
			raceActionId(race, item),
		];
	}

	return actions;
}

export function formatRaceDistance(distanceKm: number) {
	return `${distanceKm.toLocaleString("pt-BR", {
		maximumFractionDigits: 3,
	})} km`;
}

function findLapIndexForDistance(laps: Lap[], distanceKm: number) {
	if (laps.length === 0 || distanceKm <= 0) return null;

	let cumulative = 0;
	for (const [index, lap] of laps.entries()) {
		cumulative += lap.distance;
		if (distanceKm <= cumulative + 0.000001) return index;
	}

	return null;
}
