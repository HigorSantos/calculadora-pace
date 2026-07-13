export const CUSTOMER_COOKIE = "arsenal-cid";

// Após 10 dias ativos, o cookie passa a ter validade anual.
// Antes disso renova diariamente para forçar revalidação.
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const ANNUAL_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const ONE_DAY_SECONDS = 24 * 60 * 60;

export function cookieMaxAge(activatedAt: Date | null): number {
	if (!activatedAt) return ONE_DAY_SECONDS;
	const elapsed = Date.now() - activatedAt.getTime();
	return elapsed >= TEN_DAYS_MS
		? ANNUAL_COOKIE_MAX_AGE_SECONDS
		: ONE_DAY_SECONDS;
}
