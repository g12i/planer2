function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
	}
	return Math.abs(hash);
}

export type CardColor = { hue: number; lightness: number; chroma: number };

/**
 * Subject name → fixed hue.
 * Activity kind + group index → lightness/chroma shift so groups are
 * visually distinct but clearly the same subject.
 */
export function activityCardColor(input: {
	subjectName: string;
	activityKind: string;
	groupIndex?: number;
}): CardColor {
	const hue = hashString(input.subjectName) % 360;
	const kindHash = input.activityKind ? hashString(input.activityKind) : 0;
	const groupIdx = input.groupIndex ?? 1;
	const variant = (kindHash % 5) + groupIdx;
	const lightness = 0.88 + (variant % 5) * 0.02;
	const chroma = 0.04 + (variant % 4) * 0.015;
	return { hue, lightness, chroma };
}

export function activityCardStyle(c: CardColor): string {
	return `background-color: oklch(${c.lightness} ${c.chroma} ${c.hue}); color: oklch(${c.lightness - 0.52} ${c.chroma + 0.02} ${c.hue})`;
}

export function activityCardStyleDark(c: CardColor): string {
	const darkL = 1 - c.lightness + 0.12;
	return `background-color: oklch(${darkL} ${c.chroma * 0.8} ${c.hue}); color: oklch(${darkL + 0.45} ${c.chroma} ${c.hue})`;
}

export function dotColor(c: CardColor): string {
	return `oklch(0.6 0.12 ${c.hue})`;
}
