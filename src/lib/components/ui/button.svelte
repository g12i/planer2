<script lang="ts" module>
	import { cva } from 'class-variance-authority';

	export const buttonVariants = cva(
		'inline-flex shrink-0 items-center justify-center gap-2 rounded-none px-4 py-2.5 text-sm font-medium disabled:pointer-events-none disabled:opacity-50',
		{
			variants: {
				variant: {
					primary:
						'transition-[filter] bg-accent text-accent-foreground hover:brightness-110 active:brightness-95',
					secondary:
						'transition-colors bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70',
					outline:
						'border border-border-input bg-transparent transition-colors hover:bg-muted/40 active:bg-muted/55',
					ghost: 'transition-colors hover:bg-muted/50 active:bg-muted/65',
					destructive:
						'transition-[filter] bg-destructive text-white hover:brightness-110 active:brightness-95',
					link:
						'px-1 py-0.5 text-accent underline underline-offset-4 hover:brightness-110 transition-[filter]',
				},
			},
			defaultVariants: {
				variant: 'primary',
			},
		},
	);
</script>

<script lang="ts">
	import { Button } from 'bits-ui';
	import type { VariantProps } from 'class-variance-authority';
	import type { Snippet } from 'svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';

	import { cn } from '$lib/utils/cn';

	type Props = Omit<SvelteHTMLElements['button'], 'class' | 'children'> &
		VariantProps<typeof buttonVariants> & {
			class?: string;
			children: Snippet;
		};

	let {
		variant,
		class: className,
		children,
		...rest
	}: Props = $props();

	const mergedClass = $derived(cn(buttonVariants({ variant }), className));
</script>

<Button.Root class={mergedClass} {...rest}>
	{@render children()}
</Button.Root>
