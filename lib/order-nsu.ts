export function normalizeOrderNsuLookupValue(orderNsu: string) {
	return orderNsu.trim().replace(/\s+/g, "+");
}
