<script lang="ts">
  import { cn } from '@/utils';

  type Props = {
    class?: string;
    value: number | null;
    onValueChange: (value: number) => void;
    max?: number;
    disabled?: boolean;
  };

  let {
    class: className = '',
    value,
    onValueChange,
    max = 5,
    disabled = false
  }: Props = $props();

  const options = $derived(Array.from({ length: max }, (_, i) => i + 1));
</script>

<div class={cn('flex items-center justify-between gap-2', className)} role="radiogroup">
  {#each options as grade}
    {@const selected = value === grade}
    <button
      type="button"
      class={cn(
        'h-8 w-8 rounded-full border text-sm transition',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background hover:border-foreground/30',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      onclick={() => onValueChange(grade)}
    >
      {grade}
    </button>
  {/each}
</div>


