<script lang="ts">
	import { DropdownMenu, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = WithoutChild<DropdownMenu.ItemProps> & {
		children: Snippet;
		icon?: Snippet;
	};

	let {
		children,
		icon,
		...rest
	}: Props = $props();
</script>

<DropdownMenu.Item
	class="data-highlighted:bg-muted flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-foreground outline-hidden focus-visible:outline-hidden"
	{...rest}
>
	{#if icon}
		<span class="text-foreground-alt shrink-0 [&_svg]:size-5 [&_svg]:shrink-0" aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
	{@render children()}
</DropdownMenu.Item>
