<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import RatingSelector from "@/components/ui/rating-selector.svelte";
  import { cn } from "@/utils";

  type Props = {
    class?: string;
    questionId: number;
    questionText: string;
    value: number | null;
    onChange: (rating: number) => void;
    disabled?: boolean;
  };

  let { class: className = "", questionId, questionText, value, onChange, disabled = false }: Props = $props();
  const labelId = $derived(`rating-label-${questionId}`);
</script>

<div class={cn("grid pb-5 sm:grid-cols-[1fr_320px] sm:items-center", className)}>
  <div class="min-w-0">
    <Label for={labelId} class="leading-snug">{questionText}</Label>
  </div>
  <RatingSelector {value} onValueChange={onChange} {disabled} class="justify-end" />
</div>
