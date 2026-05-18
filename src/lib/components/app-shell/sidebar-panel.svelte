<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/cn';

	type Props = {
		sidebar: Snippet;
	};

	let { sidebar }: Props = $props();
</script>

<Collapsible.Content forceMount>
	{#snippet child({ props, open })}
		<div
			{...props}
			class={cn(
				'flex h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-out',
				open ? 'w-64' : 'w-0 pointer-events-none',
			)}
			aria-hidden={open ? undefined : true}
		>
			<aside class="flex h-full min-h-0 w-64 shrink-0 flex-col bg-background">
				{@render sidebar()}
			</aside>
		</div>
	{/snippet}
</Collapsible.Content>
