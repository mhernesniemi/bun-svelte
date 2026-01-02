<script lang="ts">
  import { Heading } from "@/components/ui/heading";
  import { Button } from "@/components/ui/button";

  type Props = {
    username: string;
    isAdmin: boolean;
  };

  let { username, isAdmin }: Props = $props();
</script>

<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
  <div class="min-w-0">
    <Heading level={1} class="text-2xl sm:text-3xl">Colleague Feedback</Heading>
  </div>
  <div class="flex items-center gap-3">
    <div
      class="hidden items-center gap-2 rounded-full border bg-card/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur supports-backdrop-filter:bg-card/40 sm:flex"
    >
      <span class="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
      <span class="max-w-56 truncate">{username}</span>
    </div>
    {#if isAdmin}
      <Button href="/admin" variant="outline" size="sm">Admin</Button>
    {/if}
    <Button href="/dashboard/received-feedback" variant="outline" size="sm"
      >Recieved Feedback</Button
    >
    <form method="POST" action="/logout">
      <Button type="submit" variant="outline" size="sm">Logout</Button>
    </form>
  </div>
</div>
