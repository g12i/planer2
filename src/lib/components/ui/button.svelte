<script lang="ts" module>
  import { cva } from "class-variance-authority";

  export const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-hidden select-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    {
      variants: {
        variant: {
          primary:
            "bg-accent text-accent-foreground hover:brightness-110 active:brightness-95",
          ghost:
            "text-foreground-alt hover:bg-muted hover:text-foreground active:bg-muted/70",
          destructive:
            "bg-destructive text-white hover:brightness-110 active:brightness-95 focus-visible:ring-destructive",
        },
        size: {
          default: "h-9 gap-1.5 px-3",
          icon: "size-10 shrink-0 gap-0 p-0",
        },
      },
      defaultVariants: {
        variant: "primary",
        size: "default",
      },
    },
  );
</script>

<script lang="ts">
  import { Button } from "bits-ui";
  import type { VariantProps } from "class-variance-authority";
  import CircleNotchIcon from "phosphor-svelte/lib/CircleNotchIcon";
  import type { Snippet } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";

  import { cn } from "$lib/utils/cn";

  type Props = Omit<SvelteHTMLElements["button"], "class" | "children"> &
    VariantProps<typeof buttonVariants> & {
      class?: string;
      children: Snippet;
      href?: string;
      loading?: boolean;
    };

  let {
    variant,
    size,
    class: className,
    children,
    href,
    loading = false,
    disabled,
    ...rest
  }: Props = $props();

  const mergedClass = $derived(
    cn(buttonVariants({ variant, size }), className),
  );
</script>

<Button.Root
  class={mergedClass}
  {href}
  disabled={disabled || loading}
  {...rest}
>
  {#if loading}
    <CircleNotchIcon class="size-4 animate-spin" />
  {/if}
  {@render children()}
</Button.Root>
