<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
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
  import { GripVertical, Edit, Trash2, X, Check } from "lucide-svelte";
  import type { PageData, ActionData } from "./$types";
  import { SvelteSet } from "svelte/reactivity";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let newGroupTitle = $state("");
  let newQuestionText = $state<Record<number, string>>({});
  let expanded = new SvelteSet<number>();
  let error = $derived(form?.error ?? null);
  let draggedQuestionIndex = $state<Record<number, number | null>>({});
  let editingQuestionId = $state<number | null>(null);
  let editingQuestionText = $state<string>("");

  function toggle(id: number) {
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
  }

  function dragStart(groupId: number, index: number) {
    draggedQuestionIndex[groupId] = index;
  }

  async function drop(groupId: number, dropIndex: number) {
    const dragIndex = draggedQuestionIndex[groupId];
    if (dragIndex === null || dragIndex === undefined) return;

    const group = data.groups.find((g) => g.id === groupId);
    if (!group) return;

    const questions = [...group.questions];
    const draggedQuestion = questions[dragIndex];

    questions.splice(dragIndex, 1);
    questions.splice(dropIndex, 0, draggedQuestion);

    // Update order values
    const questionIds = questions.map((q) => q.id);

    const formData = new FormData();
    formData.append("questionIds", JSON.stringify(questionIds));

    try {
      const response = await fetch("?/reorderQuestions", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        await invalidateAll();
      }
    } catch (err) {
      console.error("Failed to reorder questions:", err);
    }

    draggedQuestionIndex[groupId] = null;
  }

  function startEdit(question: { id: number; questionText: string }) {
    editingQuestionId = question.id;
    editingQuestionText = question.questionText;
  }

  function cancelEdit() {
    editingQuestionId = null;
    editingQuestionText = "";
  }
</script>

<div class="container mx-auto max-w-4xl space-y-6 p-6">
  <Heading level={1} class="mb-1">Admin Panel</Heading>
  <p class="text-sm text-muted-foreground">Manage your valuation questions and groups.</p>

  {#if error}
    <div
      class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error}
    </div>
  {/if}

  <Card>
    <CardHeader>
      <CardTitle>Add New Group</CardTitle>
      <CardDescription
        >Add a new question group. Each group can contain multiple questions.</CardDescription
      >
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/createGroup"
        use:enhance={() =>
          async ({ update }) => (await update(), invalidateAll())}
        class="space-y-4"
      >
        <div class="space-y-2">
          <Label for="group-title">Group Title</Label>
          <Input id="group-title" name="title" bind:value={newGroupTitle} required />
        </div>
        <Button type="submit">Add Group</Button>
      </form>
    </CardContent>
  </Card>

  <div class="space-y-4">
    {#each data.groups as group (group.id)}
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <CardTitle>{group.title}</CardTitle>
              <CardDescription
                >{group.questions.length} question{group.questions.length === 1
                  ? ""
                  : "s"}</CardDescription
              >
            </div>
            <Button type="button" variant="outline" size="sm" onclick={() => toggle(group.id)}>
              {expanded.has(group.id) ? "Collapse" : "Expand"}
            </Button>
          </div>
        </CardHeader>
        {#if expanded.has(group.id)}
          <CardContent class="space-y-4">
            <form
              method="POST"
              action="?/createQuestion"
              use:enhance={() =>
                async ({ update }) => (await update(), invalidateAll())}
              class="space-y-2"
            >
              <Label for={`question-${group.id}`}>Add Question to Group</Label>
              <div class="flex gap-2">
                <Input
                  id={`question-${group.id}`}
                  bind:value={newQuestionText[group.id]}
                  placeholder="Enter question text..."
                  class="flex-1"
                  required
                />
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="questionText" value={newQuestionText[group.id] ?? ""} />
                <Button type="submit">Add</Button>
              </div>
            </form>

            {#if group.questions.length === 0}
              <p class="text-sm text-muted-foreground">No questions in this group yet.</p>
            {:else}
              <div class="space-y-2">
                {#each group.questions as q, index (q.id)}
                  {#if editingQuestionId === q.id}
                    <form
                      method="POST"
                      action="?/updateQuestion"
                      use:enhance={() =>
                        async ({ update }) => {
                          await update();
                          await invalidateAll();
                          cancelEdit();
                        }}
                      class="rounded-lg border p-3"
                    >
                      <div class="flex items-center gap-2">
                        <Input
                          bind:value={editingQuestionText}
                          name="questionText"
                          class="flex-1"
                          required
                        />
                        <input type="hidden" name="questionId" value={q.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          <Check class="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onclick={cancelEdit}>
                          <X class="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  {:else}
                    <div
                      draggable="true"
                      role="button"
                      tabindex="0"
                      ondragstart={() => dragStart(group.id, index)}
                      ondragover={(e) => e.preventDefault()}
                      ondrop={() => drop(group.id, index)}
                      class="cursor-move rounded-lg border p-3 text-sm transition-opacity {draggedQuestionIndex[
                        group.id
                      ] === index
                        ? 'opacity-50'
                        : ''}"
                    >
                      <div class="flex items-center gap-2">
                        <GripVertical class="h-4 w-4 text-muted-foreground" />
                        <span class="flex-1">{q.questionText}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onclick={() => startEdit(q)}
                          class="h-8 w-8 p-0"
                        >
                          <Edit class="h-4 w-4" />
                        </Button>
                        <form
                          method="POST"
                          action="?/deleteQuestion"
                          use:enhance={() =>
                            async ({ update }) => (await update(), invalidateAll())}
                          class="inline"
                        >
                          <input type="hidden" name="questionId" value={q.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}

            <div class="mt-6">
              <form
                method="POST"
                action="?/deleteGroup"
                use:enhance={() =>
                  async ({ update }) => (await update(), invalidateAll())}
                class="flex items-center justify-start"
              >
                <input type="hidden" name="groupId" value={group.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  Delete Group
                </Button>
              </form>
            </div>
          </CardContent>
        {/if}
      </Card>
    {/each}
  </div>
</div>
