import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RatingSelectorProps = {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
};

export function RatingSelector({
  value,
  onValueChange,
  max = 5,
  disabled = false,
  className,
  ariaLabel,
  ariaLabelledby,
}: RatingSelectorProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1);
  const stringValue = value?.toString() ?? "";

  const handleValueChange = (newValue: string) => {
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue)) {
      onValueChange(numValue);
    }
  };

  return (
    <RadioGroup
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      className={cn("w-full", className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      <div className="relative w-full">
        <div
          className="pointer-events-none absolute left-3 right-3 bottom-3 -z-10 h-px bg-border"
          aria-hidden="true"
        ></div>
        <div className="flex items-start justify-between gap-2">
          {options.map((grade) => {
            const selected = value === grade;
            const optionId = `rating-${grade}`;
            return (
              <div
                key={grade}
                className={cn(
                  "group flex min-w-0 flex-1 flex-col items-center gap-2",
                  disabled && "opacity-60"
                )}
              >
                <span className="text-xs text-muted-foreground">{grade}</span>
                <RadioGroupItem
                  value={grade.toString()}
                  id={optionId}
                  disabled={disabled}
                  className={cn(
                    "relative h-7 w-7 rounded-full border bg-background shadow-sm transition",
                    "hover:border-foreground/30",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary/30",
                    "[&>svg]:hidden",
                    disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      "h-2 w-2 rounded-full bg-current transition-opacity",
                      selected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                </RadioGroupItem>
              </div>
            );
          })}
        </div>
      </div>
    </RadioGroup>
  );
}
