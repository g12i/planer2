<script lang="ts">
	import { onMount } from 'svelte';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TooltipProvider from '$lib/components/ui/tooltip-provider.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(initTheme);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<TooltipProvider>
	{@render children()}
</TooltipProvider>
