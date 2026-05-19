<script lang="ts">
	import { DropdownMenu, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import Button from '$lib/components/ui/button.svelte';
	import DropdownMenuLabel from '$lib/components/ui/dropdown-menu-label.svelte';
	import DropdownMenuSeparator from '$lib/components/ui/dropdown-menu-separator.svelte';

	type Props = WithoutChild<DropdownMenu.RootProps> & {
		trigger: Snippet;
		content: Snippet;
		header?: Snippet;
		footer?: Snippet;
		triggerAriaLabel?: string;
		contentProps?: WithoutChild<DropdownMenu.ContentProps>;
	};

	let {
		open = $bindable(false),
		trigger,
		content,
		header,
		footer,
		triggerAriaLabel,
		contentProps,
		...rootProps
	}: Props = $props();
</script>

<DropdownMenu.Root bind:open {...rootProps}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				{...props}
				aria-label={triggerAriaLabel}
			>
				{@render trigger()}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="border-border-card bg-background shadow-popover z-50 min-w-48 rounded-lg border p-1 outline-hidden"
			{...contentProps}
		>
			{#if header}
				<DropdownMenuLabel>{@render header()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
			{/if}
			{@render content()}
			{#if footer}
				<DropdownMenuSeparator />
				{@render footer()}
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
