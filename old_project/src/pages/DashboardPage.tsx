import { useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Feedback } from "@/components/Comments";
import { FeedbackRequestSelection } from "@/components/FeedbackRequestSelection";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { dashboardRoute } from "@/frontend.tsx";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { username, userId } = dashboardRoute.useRouteContext();

  const { data: checkData } = useSuspenseQuery({
    queryKey: ["feedback-requests-check", userId],
    queryFn: async () => {
      const response = await api.api["feedback-requests"].check.get();
      return response.data;
    },
  });

  const handleLogout = async () => {
    try {
      await api.api.logout.post();
    } catch (err) {
      // Ignore errors
    }
    queryClient.removeQueries({ queryKey: ["feedback", userId] });
    queryClient.removeQueries({
      queryKey: ["feedback-requests-check", userId],
    });
    navigate({ to: "/login" });
  };

  const hasRequests = checkData?.hasRequests ?? false;

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-background via-background to-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Heading level={1} className="text-2xl sm:text-3xl">
              Colleague Feedback
            </Heading>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasRequests
                ? "Give and receive anonymous feedback from your colleagues."
                : "Select colleagues you want feedback from to get started."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border bg-card/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur supports-backdrop-filter:bg-card/40">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span className="max-w-56 truncate">{username}</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
        {hasRequests ? <Feedback /> : <FeedbackRequestSelection />}
      </div>
    </div>
  );
}
