<script lang="ts">
  import { Heading } from "$lib/components/ui/heading";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import RatingSelector from "@/components/ui/rating-selector.svelte";

  type Group = { id: number; title: string; questions: { id: number; questionText: string }[] };

  type Props = {
    group: Group;
    groupAnswers: {
      questionAnswers: Record<number, number>;
      comment: string;
    };
    onQuestionRatingChange: (groupId: number, questionId: number, rating: number) => void;
    onGroupCommentChange: (groupId: number, comment: string) => void;
    disabled?: boolean;
  };

  let {
    group,
    groupAnswers,
    onQuestionRatingChange,
    onGroupCommentChange,
    disabled = false
  }: Props = $props();

  function handleCommentInput(e: Event) {
    if (disabled) return;
    const value = (e.currentTarget as HTMLTextAreaElement).value;
    onGroupCommentChange(group.id, value);
  }
</script>

<div class="space-y-4 rounded-2xl border bg-card/20 p-5">
  <Heading level={3} class="text-base sm:text-lg">{group.title}</Heading>

  <div class="space-y-5 divide-y">
    {#each group.questions as q (q.id)}
      {@const labelId = `rating-label-${q.id}`}
      {@const ratingValue = groupAnswers.questionAnswers[q.id] ?? null}
      <div class="grid pb-5 sm:grid-cols-[1fr_320px] sm:items-center">
        <div class="min-w-0">
          <Label for={labelId} class="leading-snug">{q.questionText}</Label>
        </div>
        <RatingSelector
          value={ratingValue}
          onValueChange={(next) => onQuestionRatingChange(group.id, q.id, next)}
          {disabled}
          class="justify-end"
        />
      </div>
    {/each}
  </div>

  <div class="space-y-2">
    <Label for={`comment-${group.id}`}
      >Comment <span class="text-muted-foreground">(optional)</span></Label
    >
    <Textarea
      id={`comment-${group.id}`}
      value={groupAnswers.comment}
      oninput={handleCommentInput}
      {disabled}
      rows={3}
    ></Textarea>
  </div>
</div>
