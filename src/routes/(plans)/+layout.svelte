<script lang="ts">
	import PlusIcon from 'phosphor-svelte/lib/PlusIcon';

	import AppShell from '$lib/components/app-shell/app-shell.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area.svelte';
	import type { LayoutProps } from './$types';

	const MOCK_PLANS = [
		'W1-N1K019.2025',
		'W1-N1K019.2024',
		'W2-INZ001.2025',
		'W3-ALG102.2025',
	] as const;

	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<AppShell user={data.user} title="Plany">
		{#snippet sidebar()}
			<div class="shrink-0 space-y-3 border-border-card border-b px-4 py-4">
				<h2 class="text-sm font-semibold text-foreground">Twoje plany</h2>
				<Input type="search" placeholder="Szukaj planu..." class="w-full" />
			</div>

			<ScrollArea>
				<ul class="space-y-0.5 px-2 py-2">
					{#each MOCK_PLANS as plan (plan)}
						<li>
							<Button
								type="button"
								variant="ghost"
								class="w-full justify-start"
							>
								{plan}
							</Button>
						</li>
					{/each}
				</ul>
			</ScrollArea>

			<div class="shrink-0 border-border-card border-t p-3">
				<Button type="button" variant="primary" class="w-full">
					<PlusIcon class="size-4" weight="bold" />
					Nowy plan
				</Button>
			</div>
		{/snippet}
		{@render children()}
	</AppShell>
{:else}
	{@render children()}
{/if}
