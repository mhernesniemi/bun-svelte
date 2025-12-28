<script lang="ts">
  import { cn } from "$lib/utils";
  import { cva, type VariantProps } from "class-variance-authority";

  const headingVariants = cva("tracking-tight text-foreground", {
    variants: {
      level: {
        1: "text-3xl sm:text-4xl font-semibold",
        2: "text-xl sm:text-2xl font-semibold",
        3: "text-lg font-semibold"
      },
      tone: {
        default: "",
        muted: "text-muted-foreground"
      }
    },
    defaultVariants: {
      level: 2,
      tone: "default"
    }
  });

  type Props = VariantProps<typeof headingVariants> & {
    level?: 1 | 2 | 3;
    class?: string;
    children?: import("svelte").Snippet;
  };

  let { level = 2, tone, class: className = "", children, ...rest }: Props = $props();

  const classes = $derived(cn(headingVariants({ level, tone }), className));
</script>

{#if level === 1}
  <h1 class={classes} {...rest}>
    {#if children}{@render children()}{/if}
  </h1>
{:else if level === 2}
  <h2 class={classes} {...rest}>
    {#if children}{@render children()}{/if}
  </h2>
{:else}
  <h3 class={classes} {...rest}>
    {#if children}{@render children()}{/if}
  </h3>
{/if}
