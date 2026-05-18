<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const inputVariants = cva(
		'rounded-md border border-border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-hidden transition-colors focus-visible:border-border-input-hover focus-visible:ring-2 focus-visible:ring-foreground/20',
	);
</script>

<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	import { cn } from '$lib/utils/cn';

	type Props = SvelteHTMLElements['input'] & {
		class?: string;
	};

	let { class: className, ...rest }: Props = $props();

	const mergedClass = $derived(cn(inputVariants(), className));
</script>

<input class={mergedClass} {...rest} />
