<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const dropdownMenuItemVariants = cva(
		'data-highlighted:bg-muted flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-foreground outline-hidden focus-visible:outline-hidden',
	);

	export const dropdownMenuItemIconVariants = cva(
		'text-foreground-alt shrink-0 [&_svg]:size-5 [&_svg]:shrink-0',
	);
</script>

<script lang="ts">
	import { DropdownMenu, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/cn';

	type Props = WithoutChild<DropdownMenu.ItemProps> & {
		class?: string;
		iconClass?: string;
		children: Snippet;
		icon?: Snippet;
	};

	let {
		class: className,
		iconClass,
		children,
		icon,
		...rest
	}: Props = $props();

	const mergedClass = $derived(cn(dropdownMenuItemVariants(), className));
	const mergedIconClass = $derived(
		cn(dropdownMenuItemIconVariants(), iconClass),
	);
</script>

<DropdownMenu.Item class={mergedClass} {...rest}>
	{#if icon}
		<span class={mergedIconClass} aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
	{@render children()}
</DropdownMenu.Item>
