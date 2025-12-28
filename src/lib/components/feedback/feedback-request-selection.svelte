<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import MultiSelect from '@/components/ui/multi-select.svelte';

  type UserOption = { id: number; username: string };

  type Props = {
    users: UserOption[];
    form?: { error?: string };
  };

  let { users, form }: Props = $props();

  let selected = $state<number[]>([]);
  let error = $state<string | null>(null);

  $effect(() => {
    error = form?.error ?? null;
  });
</script>

<Card class="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40">
  <CardHeader>
    <CardTitle>Select Feedback Providers</CardTitle>
    <CardDescription>
      Select exactly 5 colleagues you want to receive feedback from. This selection cannot be changed later.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form method="POST" action="?/createRequests" use:enhance class="space-y-4">
      {#if error}
        <div class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="user-select">Selected: {selected.length} / 5</Label>
        <input type="hidden" name="userIds" value={JSON.stringify(selected)} />
        <MultiSelect options={users} bind:selected={selected} maxSelections={5} placeholder="Select 5 colleagues..." />
      </div>

      <div class="flex items-center justify-end">
        <Button type="submit" disabled={selected.length !== 5}>Save Selection</Button>
      </div>
    </form>
  </CardContent>
</Card>


