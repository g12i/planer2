<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TooltipProvider from '$lib/components/ui/tooltip-provider.svelte';
	import { queryClient } from '$lib/query-client';
	import { initTheme } from '$lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(initTheme);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<TooltipProvider>
		{@render children()}
	</TooltipProvider>
</QueryClientProvider>
