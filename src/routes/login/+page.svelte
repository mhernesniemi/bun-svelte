<script lang="ts">
  import { enhance } from "$app/forms";
  import { Heading } from "$lib/components/ui/heading";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
  } from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import type { ActionData, PageData } from "./$types";

  let { form }: { data: PageData; form: ActionData } = $props();

  let error = $state<string | null>(null);
  $effect(() => {
    error = form?.error ?? null;
  });
</script>

<div
  class="flex min-h-screen items-center justify-center bg-linear-to-b from-background via-background to-muted/30 px-4 py-10"
>
  <div class="w-full max-w-md space-y-6">
    <div class="text-center">
      <Heading level={1}>Colleague Feedback</Heading>
      <p class="mt-2 text-sm text-muted-foreground">Sign in to continue</p>
    </div>

    <Card
      class="w-full rounded-2xl border-0 bg-card/50 shadow-xl ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40"
    >
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access the feedback tool</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="POST" use:enhance class="space-y-4">
          {#if error}
            <div
              class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          {/if}

          <div class="space-y-2">
            <Label for="login-username">Username</Label>
            <Input id="login-username" name="username" autocomplete="username" required />
          </div>

          <div class="space-y-2">
            <Label for="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

          <Button type="submit" class="w-full">Login</Button>

          <div class="text-center text-sm text-muted-foreground">
            Don't have an account?
            <a href="/register" class="text-primary underline-offset-4 hover:underline">Register</a>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
