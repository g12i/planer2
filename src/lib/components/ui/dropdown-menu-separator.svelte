<script lang="ts">
	import { DropdownMenu, type WithoutChild } from 'bits-ui';

	type Props = WithoutChild<DropdownMenu.SeparatorProps>;

	let { ...rest }: Props = $props();
</script>

<DropdownMenu.Separator class="bg-border-card my-1 h-px" {...rest} />
