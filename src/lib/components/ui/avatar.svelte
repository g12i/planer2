<script lang="ts" module>
  import { cva } from "class-variance-authority";

  export const avatarVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium uppercase text-muted-foreground data-[status=loaded]:border data-[status=loaded]:border-border-card data-[status=loading]:border-transparent",
    {
      variants: {
        size: {
          sm: "size-6 text-[10px]",
          md: "size-8 text-xs",
        },
      },
      defaultVariants: {
        size: "md",
      },
    },
  );
</script>

<script lang="ts">
  import { Avatar, type WithoutChildrenOrChild } from "bits-ui";
  import type { VariantProps } from "class-variance-authority";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChildrenOrChild<Avatar.RootProps> &
    VariantProps<typeof avatarVariants> & {
      src?: string;
      alt: string;
      fallback: string;
      class?: string;
    };

  let {
    src,
    alt,
    fallback,
    size,
    class: className,
    ...rootProps
  }: Props = $props();

  const rootClass = $derived(cn(avatarVariants({ size }), className));
</script>

<Avatar.Root class={rootClass} {...rootProps}>
  <div
    class="flex size-full items-center justify-center overflow-hidden rounded-full"
  >
    {#if src}
      <Avatar.Image {src} {alt} class="size-full object-cover" />
    {/if}
    <Avatar.Fallback>{fallback}</Avatar.Fallback>
  </div>
</Avatar.Root>
