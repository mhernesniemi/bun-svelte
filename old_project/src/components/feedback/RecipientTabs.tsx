import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FeedbackRequestRecipient = {
  id: number;
  userId: number;
  username: string;
};

type RecipientTabsProps = {
  value: number | null;
  defaultValue?: number | null;
  recipients: FeedbackRequestRecipient[];
  onChange: (userId: number) => void;
};

export function RecipientTabs({
  value,
  defaultValue,
  recipients,
  onChange,
}: RecipientTabsProps) {
  if (recipients.length === 0) {
    return null;
  }

  const firstUserId = defaultValue ?? recipients[0]?.userId ?? null;
  const selectedUserId = value ?? firstUserId;
  const selectedValue =
    selectedUserId === null ? "" : selectedUserId.toString();

  return (
    <div className="sticky top-0 z-50 space-y-2 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-2">
      <Tabs
        value={selectedValue}
        onValueChange={(next) => onChange(Number(next))}
      >
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto">
          {recipients.map((recipient) => (
            <TabsTrigger
              key={recipient.id}
              value={recipient.userId.toString()}
              className="shrink-0"
            >
              {recipient.username}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
