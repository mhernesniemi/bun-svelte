import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionRatingRow } from "@/components/feedback/QuestionRatingRow";
import type { GroupAnswersState } from "@/lib/valuation-types";

type ValuationGroupCardProps = {
  group: {
    id: number;
    title: string;
    questions: { id: number; questionText: string }[];
  };
  groupAnswers: GroupAnswersState;
  onQuestionRatingChange: (
    groupId: number,
    questionId: number,
    rating: number
  ) => void;
  onGroupCommentChange: (groupId: number, comment: string) => void;
};

export function ValuationGroupCard({
  group,
  groupAnswers,
  onQuestionRatingChange,
  onGroupCommentChange,
}: ValuationGroupCardProps) {
  const groupAnswer = groupAnswers[group.id];
  const groupComment = groupAnswer?.comment || "";

  return (
    <div className="space-y-4 rounded-2xl border bg-card/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <Heading level={3} className="text-base sm:text-lg">
          {group.title}
        </Heading>
      </div>

      <div className="space-y-5 divide-y">
        {group.questions.map((q) => {
          const rating = groupAnswer?.questionAnswers[q.id] ?? null;
          return (
            <QuestionRatingRow
              key={q.id}
              idPrefix={`${group.id}-`}
              questionId={q.id}
              questionText={q.questionText}
              value={rating}
              onChange={(next) => onQuestionRatingChange(group.id, q.id, next)}
            />
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`comment-${group.id}`}>Group Comment (optional)</Label>
        <Textarea
          id={`comment-${group.id}`}
          placeholder="Add optional comment for this group..."
          value={groupComment}
          onChange={(e) => onGroupCommentChange(group.id, e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
