<script lang="ts">
  import { Heading } from "$lib/components/ui/heading";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";

  type Props = {
    error: Error & { status?: number; message?: string };
  };

  let { error }: Props = $props();

  const status = error.status ?? 500;
  const message = error.message ?? "An unexpected error occurred";
</script>

<div class="flex min-h-screen items-center justify-center px-4">
  <Card class="max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl">Error {status}</CardTitle>
      <CardDescription>{message}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if status === 404}
        <p class="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      {:else if status === 500}
        <p class="text-sm text-muted-foreground">Something went wrong on our end. Please try again later.</p>
      {/if}
      <div class="flex gap-2">
        <Button href="/dashboard" variant="default">Go to Dashboard</Button>
        <Button onclick={() => window.location.reload()} variant="outline">Reload Page</Button>
      </div>
    </CardContent>
  </Card>
</div>

