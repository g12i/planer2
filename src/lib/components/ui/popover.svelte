<script lang="ts">
	import { Popover, type WithoutChild } from "bits-ui";
	import type { Snippet } from "svelte";

	type Props = WithoutChild<Popover.RootProps> & {
		trigger: Snippet<[Record<string, unknown>]>;
		content: Snippet;
		side?: WithoutChild<Popover.ContentProps>["side"];
		sideOffset?: number;
		openOnHover?: boolean;
		openDelay?: number;
		closeDelay?: number;
	};

	let {
		open = $bindable(false),
		trigger,
		content,
		side = "top",
		sideOffset = 8,
		openOnHover = true,
		openDelay = 700,
		closeDelay = 300,
		...rootProps
	}: Props = $props();
</script>

<Popover.Root bind:open {...rootProps}>
	<Popover.Trigger {openOnHover} {openDelay} {closeDelay}>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			{side}
			{sideOffset}
			class="z-50 max-w-xs origin-(--bits-popover-content-transform-origin) rounded-md border border-border-card bg-background p-2 text-xs shadow-popover animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
		>
			{@render content()}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
