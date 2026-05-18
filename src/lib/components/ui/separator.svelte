<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const separatorVariants = cva(
		'bg-border-card shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
	);
</script>

<script lang="ts">
	import { Separator, type WithoutChild } from 'bits-ui';

	import { cn } from '$lib/utils/cn';

	type Props = WithoutChild<Separator.RootProps> & {
		class?: string;
	};

	let {
		orientation = 'horizontal',
		decorative = false,
		class: className,
		...rest
	}: Props = $props();

	const mergedClass = $derived(cn(separatorVariants(), className));
</script>

<Separator.Root
	{orientation}
	{decorative}
	class={mergedClass}
	{...rest}
/>
