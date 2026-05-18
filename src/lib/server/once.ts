/**
 * Lazily run `factory` once and reuse the result (module-scoped singleton).
 * Not the same as React `cache()` — that memoizes per call + arguments per request.
 */
export function once<T>(factory: () => T): () => T {
	let value: T;
	let initialized = false;

	return () => {
		if (!initialized) {
			value = factory();
			initialized = true;
		}
		return value;
	};
}
