<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/components/app-shell/app-shell.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(initTheme);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.user}
	<AppShell user={data.user}>
		{@render children()}
	</AppShell>
{:else}
	{@render children()}
{/if}
