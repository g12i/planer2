<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import SidebarIcon from 'phosphor-svelte/lib/SidebarIcon';
	import type { Snippet } from 'svelte';

	import Button from '$lib/components/ui/button.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area.svelte';

	type Props = {
		sidebarOpen: boolean;
		title: string;
		children: Snippet;
	};

	let { sidebarOpen, title, children }: Props = $props();
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col">
	<header
		class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-border-card border-b bg-background px-4"
	>
		<Collapsible.Trigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon"
					{...props}
					aria-label={sidebarOpen ? 'Zwiń panel boczny' : 'Rozwiń panel boczny'}
				>
					<SidebarIcon class="size-5" weight="regular" />
				</Button>
			{/snippet}
		</Collapsible.Trigger>
		<h1 class="truncate text-sm font-semibold text-foreground">{title}</h1>
	</header>

	<ScrollArea variant="muted">
		<div class="p-6">
			{@render children()}
		</div>
	</ScrollArea>
</div>
