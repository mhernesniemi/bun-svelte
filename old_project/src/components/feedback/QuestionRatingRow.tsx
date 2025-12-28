import { Label } from "@/components/ui/label";
import { RatingSelector } from "@/components/ui/rating-selector";
import { cn } from "@/lib/utils";

type QuestionRatingRowProps = {
  idPrefix?: string;
  questionId: number;
  questionText: string;
  value: number | null;
  onChange: (rating: number) => void;
  className?: string;
};

export function QuestionRatingRow({
  idPrefix,
  questionId,
  questionText,
  value,
  onChange,
  className,
}: QuestionRatingRowProps) {
  const labelId = `rating-label-${idPrefix ?? ""}${questionId}`;

  return (
    <div
      className={cn(
        "grid pb-5 sm:grid-cols-[1fr_320px] sm:items-center",
        className
      )}
    >
      <div className="min-w-0">
        <Label id={labelId} className="leading-snug">
          {questionText}
        </Label>
      </div>
      <RatingSelector
        value={value}
        onValueChange={onChange}
        ariaLabelledby={labelId}
      />
    </div>
  );
}
