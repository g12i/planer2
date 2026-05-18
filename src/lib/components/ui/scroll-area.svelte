<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const scrollAreaRootVariants = cva(
		'relative min-h-0 flex-1 overflow-hidden',
		{
			variants: {
				variant: {
					default: '',
					muted: 'bg-muted/30',
				},
			},
			defaultVariants: {
				variant: 'default',
			},
		},
	);

	export const scrollAreaScrollbarVariants = cva(
		'bg-muted hover:bg-dark-10 data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0 flex w-2 touch-none select-none rounded-full border-l border-l-transparent p-px transition-all duration-200 hover:w-2.5',
	);

	export const scrollAreaThumbVariants = cva(
		'bg-muted-foreground flex-1 rounded-full',
	);
</script>

<script lang="ts">
	import { ScrollArea, type WithoutChild } from 'bits-ui';
	import type { VariantProps } from 'class-variance-authority';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/cn';

	type Props = WithoutChild<ScrollArea.RootProps> &
		VariantProps<typeof scrollAreaRootVariants> & {
			class?: string;
			children: Snippet;
		};

	let {
		variant,
		class: className,
		children,
		type = 'hover',
		...rest
	}: Props = $props();

	const mergedRootClass = $derived(
		cn(scrollAreaRootVariants({ variant }), className),
	);
</script>

<ScrollArea.Root {type} class={mergedRootClass} {...rest}>
	<ScrollArea.Viewport class="h-full w-full">
		{@render children()}
	</ScrollArea.Viewport>
	<ScrollArea.Scrollbar
		orientation="vertical"
		class={scrollAreaScrollbarVariants()}
	>
		<ScrollArea.Thumb class={scrollAreaThumbVariants()} />
	</ScrollArea.Scrollbar>
	<ScrollArea.Corner />
</ScrollArea.Root>
