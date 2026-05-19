<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<DropdownMenu.Group>
	<DropdownMenu.GroupHeading class="px-2 py-1.5 text-xs font-medium text-foreground-alt">
		{@render children()}
	</DropdownMenu.GroupHeading>
</DropdownMenu.Group>
