<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription
  } from "$lib/components/ui/card";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import FeedbackRequestSelection from "@/components/feedback/feedback-request-selection.svelte";
  import ValuationGroupCard from "@/components/feedback/valuation-group-card.svelte";
  import DashboardHeader from "@/components/dashboard/dashboard-header.svelte";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type GroupAnswersState = Record<
    number,
    { questionAnswers: Record<number, number>; comment: string }
  >;

  let toUserId = $state<number | null>(null);
  let answers = $state<Record<number, GroupAnswersState>>({});
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  let autosaveForm = $state<HTMLFormElement | null>(null);

  const isFeedbackSubmitted = $derived(toUserId !== null && data.submittedFeedback.has(toUserId));

  const hasDraftContent = $derived.by(() => {
    if (toUserId === null) return false;
    const userAnswers = answers[toUserId];
    if (!userAnswers) return false;
    return Object.values(userAnswers).some(
      (group) =>
        Object.values(group.questionAnswers).some((rating) => rating > 0) ||
        (group.comment && group.comment.trim())
    );
  });

  // Load active tab from localStorage or set the first received request as default
  $effect(() => {
    if (data.receivedRequests.length === 0) return;

    // Try to load from localStorage (user-specific)
    if (typeof window !== "undefined") {
      const storageKey = `dashboard-active-tab-${data.user.id}`;
      const savedUserId = localStorage.getItem(storageKey);
      if (savedUserId) {
        const userId = Number(savedUserId);
        const isValidUser = data.receivedRequests.some((r) => r.userId === userId);
        if (isValidUser) {
          toUserId = userId;
          return;
        }
      }
    }

    // Fallback to first user if no saved tab or saved tab is invalid
    if (toUserId === null) {
      toUserId = data.receivedRequests[0]?.userId ?? null;
    }
  });

  // Save active tab to localStorage when it changes (user-specific)
  $effect(() => {
    if (typeof window !== "undefined" && toUserId !== null) {
      const storageKey = `dashboard-active-tab-${data.user.id}`;
      localStorage.setItem(storageKey, toUserId.toString());
    }
  });

  // Load draft answers from server data into local state
  $effect(() => {
    if (!data.drafts || data.receivedRequests.length === 0) return;

    for (const request of data.receivedRequests) {
      const draft = data.drafts.get(request.userId);
      if (!draft) continue;

      const draftAnswers: GroupAnswersState = {};
      for (const group of draft) {
        draftAnswers[group.groupId] = {
          questionAnswers: Object.fromEntries(group.questions.map((q) => [q.questionId, q.rating])),
          comment: group.comment || ""
        };
      }
      answers[request.userId] = draftAnswers;
    }
  });

  function getUserName(userId: number | null) {
    if (userId === null) return "...";
    return data.receivedRequests.find((r) => r.userId === userId)?.username ?? "...";
  }

  function buildPayload() {
    if (toUserId === null) return "[]";
    const groupAnswers = answers[toUserId] ?? {};
    return JSON.stringify(
      data.groups.map((g) => ({
        groupId: g.id,
        questions: g.questions.map((q) => ({
          questionId: q.id,
          rating: groupAnswers[g.id]?.questionAnswers[q.id] ?? 0
        })),
        comment: groupAnswers[g.id]?.comment?.trim() || undefined
      }))
    );
  }

  function autosave() {
    if (toUserId === null) return;
    autosaveForm?.requestSubmit();
  }

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      autosave();
      autosaveTimer = null;
    }, 400);
  }

  function updateQuestionRating(groupId: number, questionId: number, rating: number) {
    if (toUserId === null) return;
    if (isFeedbackSubmitted) return;
    if (!answers[toUserId]) answers[toUserId] = {};

    const group = answers[toUserId][groupId] ?? { questionAnswers: {}, comment: "" };
    answers[toUserId][groupId] = {
      ...group,
      questionAnswers: { ...group.questionAnswers, [questionId]: rating }
    };

    scheduleAutosave();
  }

  function updateGroupComment(groupId: number, comment: string) {
    if (toUserId === null) return;
    if (isFeedbackSubmitted) return;
    if (!answers[toUserId]) answers[toUserId] = {};

    const group = answers[toUserId][groupId] ?? { questionAnswers: {}, comment: "" };
    answers[toUserId][groupId] = { ...group, comment };

    scheduleAutosave();
  }
</script>

<div
  class="min-h-screen w-full bg-linear-to-b from-background via-background to-muted/30 px-4 py-8"
>
  <div class="mx-auto max-w-4xl">
    <DashboardHeader username={data.user.username} isAdmin={data.isAdmin} />

    {#if !data.hasRequests}
      <FeedbackRequestSelection users={data.users} form={form ?? undefined} />
    {:else if data.receivedRequests.length === 0}
      <Card
        class="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40"
      >
        <CardHeader>
          <CardTitle>No requests yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Wait for colleagues to request feedback from you.
          </p>
        </CardContent>
      </Card>
    {:else}
      <div
        class="sticky top-0 z-50 space-y-2 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      >
        <Tabs.Root
          value={toUserId?.toString() ?? ""}
          onValueChange={(value) => {
            toUserId = value ? Number(value) : null;
          }}
          class="w-full"
        >
          <Tabs.List
            class="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent"
          >
            {#each data.receivedRequests as r (r.id)}
              <Tabs.Trigger
                value={r.userId.toString()}
                class={data.submittedFeedback.has(r.userId)
                  ? "text-green-500 hover:text-green-400 data-[state=active]:text-green-500"
                  : ""}
              >
                {r.username}
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </Tabs.Root>
      </div>

      {#key toUserId}
        <div in:fly={{ y: 10, duration: 400, easing: expoInOut }}>
          <Card
            class="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40"
          >
            <CardHeader>
              <CardTitle class="flex items-center justify-between gap-2">
                <span>Give Feedback to {getUserName(toUserId)}</span>
                {#if toUserId !== null}
                  {#if isFeedbackSubmitted}
                    <span class="text-green-500">Completed</span>
                  {:else if hasDraftContent}
                    <span class="text-muted-foreground">Draft</span>
                  {/if}
                {/if}
              </CardTitle>
              <CardDescription>
                Provide feedback to {getUserName(toUserId)} on their performance and areas for improvement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                bind:this={autosaveForm}
                method="POST"
                action="?/autosave"
                use:enhance={() => {
                  return () => {};
                }}
                class="hidden"
              >
                <input type="hidden" name="toUserId" bind:value={toUserId} />
                <input type="hidden" name="groups" value={buildPayload()} />
              </form>
              <form
                method="POST"
                action="?/createFeedback"
                use:enhance={() =>
                  async ({ result, update }) => {
                    await update();
                    if (result.type === "success") {
                      await invalidateAll();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (result.type === "failure" && result.data?.error) {
                      const errorMessage =
                        typeof result.data.error === "string"
                          ? result.data.error
                          : "An error occurred";
                      toast.error(errorMessage);
                    }
                  }}
                class="space-y-6"
              >
                <input type="hidden" name="toUserId" value={toUserId ?? ""} />
                <input type="hidden" name="groups" value={buildPayload()} />

                <div class="space-y-6">
                  {#each data.groups as group (group.id)}
                    <ValuationGroupCard
                      {group}
                      groupAnswers={(toUserId ? answers[toUserId]?.[group.id] : null) ?? {
                        questionAnswers: {},
                        comment: ""
                      }}
                      onQuestionRatingChange={updateQuestionRating}
                      onGroupCommentChange={updateGroupComment}
                      disabled={isFeedbackSubmitted}
                    />
                  {/each}
                </div>

                <div class="flex items-center justify-end">
                  <Button type="submit" disabled={isFeedbackSubmitted}>Submit</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      {/key}
    {/if}
  </div>
</div>
