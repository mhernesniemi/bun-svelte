import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FeedbackRequestRecipient = {
  id: number;
  userId: number;
  username: string;
};

type RecipientSelectProps = {
  value: number | null;
  recipients: FeedbackRequestRecipient[];
  onChange: (userId: number) => void;
};

export function RecipientSelect({
  value,
  recipients,
  onChange,
}: RecipientSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="feedback-user">To</Label>
      <Select
        value={value?.toString() || ""}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger id="feedback-user">
          <SelectValue placeholder="Select a colleague" />
        </SelectTrigger>
        <SelectContent>
          {recipients.map((r) => (
            <SelectItem key={r.id} value={r.userId.toString()}>
              {r.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


