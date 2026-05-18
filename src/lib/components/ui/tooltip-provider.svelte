<script lang="ts">
	import { Tooltip, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = WithoutChild<Tooltip.ProviderProps> & {
		children: Snippet;
	};

	let { delayDuration = 200, children, ...rest }: Props = $props();
</script>

<Tooltip.Provider {delayDuration} {...rest}>
	{@render children()}
</Tooltip.Provider>
