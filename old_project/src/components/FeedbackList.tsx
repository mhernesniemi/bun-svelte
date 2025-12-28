import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dashboardRoute } from "@/frontend.tsx";
import { useQuery } from "@tanstack/react-query";

export function FeedbackList() {
  const { userId } = dashboardRoute.useRouteContext();

  const { data: feedbackData } = useSuspenseQuery({
    queryKey: ["feedback", userId],
    queryFn: async () => {
      const response = await api.api.feedback.get();
      if (response.data) {
        return response.data;
      }
      return { sent: [], received: [] };
    },
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["feedback-requests-received", userId],
    queryFn: async () => {
      const response = await api.api["feedback-requests"].received.get();
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
  });

  const getUserName = (toUserId: number) => {
    const request = receivedRequests.find((r) => r.userId === toUserId);
    return request?.username || "Unknown";
  };

  const allFeedback = [
    ...feedbackData.sent.map((f) => ({ ...f, type: "sent" as const })),
    ...feedbackData.received.map((f) => ({ ...f, type: "received" as const })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (allFeedback.length === 0) {
    return (
      <div className="rounded-xl bg-muted/30 p-8 text-center ring-1 ring-border/30">
        <p className="text-sm text-muted-foreground">
          No feedback yet. Give feedback to colleagues who requested it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allFeedback.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border bg-card/40 p-4 shadow-sm backdrop-blur transition-colors hover:bg-card/55 supports-backdrop-filter:bg-card/35"
        >
          <div className="space-y-4">
            <div className="flex justify-between flex-wrap items-baseline gap-x-3 gap-y-1">
              {item.type === "sent" ? (
                <p className="text-xs font-medium text-primary">
                  To: {getUserName(item.toUserId)}
                </p>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">
                  Anonymous feedback
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString("fi-FI", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-4">
              {item.groups && item.groups.length > 0 ? (
                item.groups.map((group: any) => (
                  <div key={group.groupId} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {group.groupTitle}
                    </p>
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {group.questions && group.questions.length > 0 ? (
                        group.questions.map((question: any) => (
                          <div key={question.questionId} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-foreground">
                                {question.questionText}
                              </p>
                              <p className="text-sm font-semibold text-primary">
                                {question.rating}/5
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No questions answered
                        </p>
                      )}
                      {group.comment && (
                        <div className="mt-2 pt-2 border-t border-muted">
                          <p className="text-sm text-muted-foreground">
                            {group.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No answers</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
