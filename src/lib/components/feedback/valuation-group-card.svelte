<script lang="ts">
  import { Heading } from "$lib/components/ui/heading";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import QuestionRatingRow from "./question-rating-row.svelte";

  type Group = { id: number; title: string; questions: { id: number; questionText: string }[] };

  type Props = {
    group: Group;
    groupAnswers: {
      questionAnswers: Record<number, number>;
      comment: string;
    };
    onQuestionRatingChange: (groupId: number, questionId: number, rating: number) => void;
    onGroupCommentChange: (groupId: number, comment: string) => void;
  };

  let { group, groupAnswers, onQuestionRatingChange, onGroupCommentChange }: Props = $props();

  let commentValue = $state("");

  $effect(() => {
    commentValue = groupAnswers.comment;
  });

  $effect(() => {
    onGroupCommentChange(group.id, commentValue);
  });
</script>

<div class="space-y-4 rounded-2xl border bg-card/20 p-5">
  <Heading level={3} class="text-base sm:text-lg">{group.title}</Heading>

  <div class="space-y-5 divide-y">
    {#each group.questions as q (q.id)}
      <QuestionRatingRow
        questionId={q.id}
        questionText={q.questionText}
        value={groupAnswers.questionAnswers[q.id] ?? null}
        onChange={(next) => onQuestionRatingChange(group.id, q.id, next)}
      />
    {/each}
  </div>

  <div class="space-y-2">
    <Label for={`comment-${group.id}`}>Group Comment (optional)</Label>
    <Textarea id={`comment-${group.id}`} bind:value={commentValue} rows={3}></Textarea>
  </div>
</div>
