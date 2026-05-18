<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const dropdownMenuSeparatorVariants = cva('bg-border-card my-1 h-px');
</script>

<script lang="ts">
	import { DropdownMenu, type WithoutChild } from 'bits-ui';

	import { cn } from '$lib/utils/cn';

	type Props = WithoutChild<DropdownMenu.SeparatorProps> & {
		class?: string;
	};

	let { class: className, ...rest }: Props = $props();

	const mergedClass = $derived(cn(dropdownMenuSeparatorVariants(), className));
</script>

<DropdownMenu.Separator class={mergedClass} {...rest} />
