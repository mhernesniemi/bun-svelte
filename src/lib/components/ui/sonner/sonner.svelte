<script lang="ts">
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import InfoIcon from "@lucide/svelte/icons/info";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
  import OctagonXIcon from "@lucide/svelte/icons/octagon-x";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";

  import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
  import { mode } from "mode-watcher";

  let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
  theme="dark"
  class="toaster group"
  richColors
  style="--normal-bg: hsl(240 6% 10%); --normal-text: hsl(0 0% 95%); --normal-border: hsl(240 4% 20%); --success-bg: hsl(142 40% 12%); --success-text: hsl(142 70% 75%); --success-border: hsl(142 30% 25%); --error-bg: hsl(0 50% 12%); --error-text: hsl(0 85% 75%); --error-border: hsl(0 40% 25%); --warning-bg: hsl(38 50% 12%); --warning-text: hsl(38 90% 70%); --warning-border: hsl(38 40% 25%); --info-bg: hsl(210 50% 12%); --info-text: hsl(210 90% 75%); --info-border: hsl(210 40% 25%); font-weight: 700;"
  {...restProps}
  >{#snippet loadingIcon()}
    <Loader2Icon class="size-4 animate-spin" />
  {/snippet}
  {#snippet successIcon()}
    <CircleCheckIcon class="size-4" />
  {/snippet}
  {#snippet errorIcon()}
    <OctagonXIcon class="size-4" />
  {/snippet}
  {#snippet infoIcon()}
    <InfoIcon class="size-4" />
  {/snippet}
  {#snippet warningIcon()}
    <TriangleAlertIcon class="size-4" />
  {/snippet}
</Sonner>
