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

  // Create an array of numbers from 1 to max
  const options = $derived(Array.from({ length: max }, (_, i) => i + 1));

  const groupId = `rating-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class={cn("flex items-center justify-between gap-3", className)} role="radiogroup">
  {#each options as grade}
    {@const selected = value === grade}
    {@const radioId = `${groupId}-${grade}`}
    <label
      for={radioId}
      class={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-sm transition",
        disabled && "cursor-not-allowed",
        disabled && !selected && "border-muted bg-muted text-muted-foreground",
        selected && disabled && "opacity-50",
        selected && "border-primary",
        !selected && !disabled && "hover:border-primary/20"
      )}
    >
      <input
        type="radio"
        id={radioId}
        name={groupId}
        value={grade}
        checked={selected}
        {disabled}
        class="sr-only"
        onchange={() => {
          if (!disabled) onValueChange(grade);
        }}
      />
      {grade}
    </label>
  {/each}
</div>
