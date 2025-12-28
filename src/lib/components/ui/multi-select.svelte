<script lang="ts">
  import { cn } from '@/utils';

  type Option = { id: number; username: string };

  type Props = {
    options: Option[];
    selected?: number[];
    maxSelections?: number;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    class?: string;
  };

  let {
    options,
    selected = $bindable<number[]>([]),
    maxSelections = 5,
    placeholder = 'Select users...',
    searchPlaceholder = 'Search by username...',
    emptyMessage = 'No users found',
    class: className = ''
  }: Props = $props();

  let isOpen = $state(false);
  let search = $state('');
  let container: HTMLDivElement | null = $state(null);

  const selectedOptions = $derived(options.filter((o) => selected.includes(o.id)));
  const filteredOptions = $derived(
    search.trim()
      ? options.filter((o) => o.username.toLowerCase().includes(search.trim().toLowerCase()))
      : options
  );

  function toggle(optionId: number) {
    if (selected.includes(optionId)) {
      selected = selected.filter((id) => id !== optionId);
      return;
    }
    if (selected.length >= maxSelections) return;
    selected = [...selected, optionId];
  }

  function remove(optionId: number) {
    selected = selected.filter((id) => id !== optionId);
  }

  function onDocMouseDown(e: MouseEvent) {
    if (!container) return;
    if (!container.contains(e.target as Node)) {
      isOpen = false;
      search = '';
    }
  }

  $effect(() => {
    if (!isOpen) return;
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  });
</script>

<div bind:this={container} class={cn('relative w-full', className)}>
  <button
    type="button"
    class="flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent"
    onclick={() => (isOpen = !isOpen)}
  >
    <div class="flex flex-1 flex-wrap gap-1.5">
      {#if selectedOptions.length > 0}
        {#each selectedOptions as opt (opt.id)}
          <span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {opt.username}
            <span
              class="cursor-pointer rounded-sm hover:bg-primary/20"
              role="button"
              tabindex="0"
              onclick={(e) => (e.stopPropagation(), remove(opt.id))}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(opt.id);
                }
              }}
            >
              ×
            </span>
          </span>
        {/each}
      {:else}
        <span class="text-muted-foreground">{placeholder}</span>
      {/if}
    </div>
    <span class="text-xs text-muted-foreground">{selected.length}/{maxSelections}</span>
  </button>

  {#if isOpen}
    <div class="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md">
      <div class="p-2">
        <input
          class="h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={searchPlaceholder}
          value={search}
          oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)}
        />
      </div>
      <div class="max-h-60 overflow-auto p-1">
        {#if filteredOptions.length === 0}
          <div class="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        {:else}
          {#each filteredOptions as opt (opt.id)}
            {@const isSelected = selected.includes(opt.id)}
            {@const isDisabled = !isSelected && selected.length >= maxSelections}
            <button
              type="button"
              class={cn(
                'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors',
                isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isDisabled}
              onclick={() => toggle(opt.id)}
            >
              <span>{opt.username}</span>
              <span class="text-xs">{isSelected ? '✓' : ''}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>


