<script lang="ts">
  import { RadioGroup } from "bits-ui";
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
  const stringValue = $derived(value?.toString() ?? "");
</script>

<RadioGroup.Root
  value={stringValue}
  onValueChange={(v) => onValueChange(Number(v))}
  {disabled}
  orientation="horizontal"
  class={cn("flex items-center justify-between gap-4", className)}
>
  {#each options as grade}
    <RadioGroup.Item
      value={grade.toString()}
      class={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border text-sm transition outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/80",
        "disabled:cursor-not-allowed",
        "disabled:data-[state=unchecked]:border-muted disabled:data-[state=unchecked]:bg-muted disabled:data-[state=unchecked]:text-muted-foreground",
        "disabled:data-[state=checked]:opacity-50",
        "data-[state=checked]:border-primary",
        "data-[state=unchecked]:enabled:hover:border-primary/20"
      )}
    >
      {grade}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
