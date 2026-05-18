<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const dropdownMenuLabelVariants = cva(
		'px-2 py-1.5 text-xs font-medium text-foreground-alt',
	);
</script>

<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/cn';

	type Props = {
		class?: string;
		children: Snippet;
	};

	let { class: className, children }: Props = $props();

	const mergedClass = $derived(cn(dropdownMenuLabelVariants(), className));
</script>

<DropdownMenu.Group>
	<DropdownMenu.GroupHeading class={mergedClass}>
		{@render children()}
	</DropdownMenu.GroupHeading>
</DropdownMenu.Group>
