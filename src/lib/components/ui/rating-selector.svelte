<script lang="ts">
  import { cn } from "@/utils";

  type Props = {
    class?: string;
    value: number | null;
    onValueChange: (value: number) => void;
    max?: number;
    disabled?: boolean;
  };

  let { class: className = "", value, onValueChange, max = 5, disabled = false }: Props = $props();

  const options = $derived(Array.from({ length: max }, (_, i) => i + 1));
</script>

<div class={cn("flex items-center justify-between gap-3", className)} role="radiogroup">
  {#each options as grade}
    {@const selected = value === grade}
    <button
      type="button"
      class={cn(
        "h-8 w-8 rounded-full border text-sm transition",
        disabled && "cursor-not-allowed",
        disabled && !selected && "border-muted bg-muted text-muted-foreground",
        selected && disabled && "opacity-50",
        selected && "border-primary",
        !selected && !disabled && "hover:border-primary/20"
      )}
      {disabled}
      role="radio"
      aria-checked={selected}
      onclick={() => {
        if (!disabled) onValueChange(grade);
      }}
    >
      {grade}
    </button>
  {/each}
</div>
