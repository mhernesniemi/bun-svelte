import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { dashboardRoute } from "@/frontend.tsx";

export function FeedbackRequestSelection() {
  const queryClient = useQueryClient();
  const { userId } = dashboardRoute.useRouteContext();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.api.users.get();
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
  });

  const submitRequests = useMutation({
    mutationFn: async (userIds: number[]) => {
      const response = await api.api["feedback-requests"].post({
        userIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feedback-requests-check", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["feedback-requests-received"],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 5) {
      submitRequests.mutate(selectedUserIds);
    }
  };

  const canSubmit = selectedUserIds.length === 5 && !submitRequests.isPending;

  return (
    <Card className="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40">
      <CardHeader>
        <CardTitle>Select Feedback Providers</CardTitle>
        <CardDescription>
          Select exactly 5 colleagues you want to receive feedback from. This
          selection cannot be changed later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">
              Selected: {selectedUserIds.length} / 5
            </Label>
            <MultiSelect
              options={users}
              selected={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
              maxSelections={5}
              placeholder="Select 5 colleagues..."
              searchPlaceholder="Search by username..."
              emptyMessage="No users found"
            />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {submitRequests.isPending ? "Saving..." : "Save Selection"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
