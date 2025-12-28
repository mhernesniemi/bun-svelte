import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

import { FeedbackList } from "@/components/FeedbackList";
import { RecipientTabs } from "@/components/feedback/RecipientTabs";
import { ValuationGroupCard } from "@/components/feedback/ValuationGroupCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { api } from "@/lib/api";
import {
  emptyValuationQuestionGroups,
  type CreateFeedbackInput,
  type GroupAnswersState,
  type ValuationQuestionGroupsDTO,
} from "@/lib/valuation-types";
import { dashboardRoute } from "@/frontend.tsx";

type RecipientAnswersState = Record<number, GroupAnswersState>;

export function Feedback() {
  const queryClient = useQueryClient();
  const { userId } = dashboardRoute.useRouteContext();

  const [toUserId, setToUserId] = useState<number | null>(null);
  const [recipientAnswers, setRecipientAnswers] =
    useState<RecipientAnswersState>({});
  const [formError, setFormError] = useState<string | null>(null);

  const hasUnsavedChanges =
    Object.keys(recipientAnswers).length > 0 &&
    Object.values(recipientAnswers).some((answers) =>
      Object.values(answers).some(
        (groupAnswer) =>
          Object.keys(groupAnswer.questionAnswers).length > 0 ||
          (groupAnswer.comment && groupAnswer.comment.trim().length > 0)
      )
    );

  useBlocker({
    shouldBlockFn: () => {
      if (!hasUnsavedChanges) return false;
      const shouldLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      return !shouldLeave;
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["feedback-requests-received", userId],
    queryFn: async () => {
      const response = await api.api["feedback-requests"].received.get();
      if (response.data && Array.isArray(response.data)) return response.data;
      return [];
    },
  });

  const selectedToUserId = toUserId ?? receivedRequests[0]?.userId ?? null;
  const groupAnswers = selectedToUserId
    ? (recipientAnswers[selectedToUserId] ?? {})
    : {};

  const getUserName = (toUserId: number | null) => {
    if (toUserId === null) return "Unknown";
    const request = receivedRequests.find((r) => r.userId === toUserId);
    return request?.username || "Unknown";
  };

  const { data: groups = emptyValuationQuestionGroups } =
    useQuery<ValuationQuestionGroupsDTO>({
      queryKey: ["valuation-questions"],
      queryFn: async () => {
        const response = await api.api["valuation-questions"].get();
        return response.data ?? emptyValuationQuestionGroups;
      },
    });

  const createFeedback = useMutation({
    mutationFn: async (data: CreateFeedbackInput) => {
      const response = await api.api.feedback.post(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", userId] });
      setRecipientAnswers((prev) => {
        const updated = { ...prev };
        delete updated[variables.toUserId];
        return updated;
      });
      setFormError(null);
    },
  });

  const updateQuestionRating = (
    groupId: number,
    questionId: number,
    rating: number
  ) => {
    if (selectedToUserId === null) return;
    setRecipientAnswers((prev) => {
      const recipientAnswer = prev[selectedToUserId] || {};
      const groupAnswer = recipientAnswer[groupId] || {
        questionAnswers: {},
        comment: "",
      };
      return {
        ...prev,
        [selectedToUserId]: {
          ...recipientAnswer,
          [groupId]: {
            ...groupAnswer,
            questionAnswers: {
              ...groupAnswer.questionAnswers,
              [questionId]: rating,
            },
          },
        },
      };
    });
  };

  const updateGroupComment = (groupId: number, comment: string) => {
    if (selectedToUserId === null) return;
    setRecipientAnswers((prev) => {
      const recipientAnswer = prev[selectedToUserId] || {};
      const groupAnswer = recipientAnswer[groupId] || {
        questionAnswers: {},
        comment: "",
      };
      return {
        ...prev,
        [selectedToUserId]: {
          ...recipientAnswer,
          [groupId]: { ...groupAnswer, comment },
        },
      };
    });
  };

  const allQuestionsAnswered = groups.every((group) => {
    const groupAnswer = groupAnswers[group.id];
    return (
      groupAnswer &&
      group.questions.every((q) => {
        const rating = groupAnswer.questionAnswers[q.id];
        return rating !== undefined && rating >= 1 && rating <= 5;
      })
    );
  });

  const canSubmit =
    selectedToUserId !== null &&
    groups.length > 0 &&
    allQuestionsAnswered &&
    !createFeedback.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (selectedToUserId === null) return;

    if (groups.length === 0) {
      setFormError("No valuation questions available.");
      return;
    }

    const groupsData: CreateFeedbackInput["groups"] = [];
    for (const group of groups) {
      const groupAnswer = groupAnswers[group.id];
      const questions: CreateFeedbackInput["groups"][number]["questions"] = [];

      for (const question of group.questions) {
        const rating = groupAnswer?.questionAnswers[question.id];
        if (rating === undefined || rating < 1 || rating > 5) {
          setFormError(
            "Please answer all questions with a rating from 1 to 5."
          );
          return;
        }
        questions.push({ questionId: question.id, rating });
      }

      groupsData.push({
        groupId: group.id,
        questions,
        comment: groupAnswer?.comment?.trim() || undefined,
      });
    }

    createFeedback.mutate({ toUserId: selectedToUserId, groups: groupsData });
  };

  return (
    <div>
      <RecipientTabs
        value={selectedToUserId}
        defaultValue={receivedRequests[0]?.userId ?? null}
        recipients={receivedRequests}
        onChange={(nextUserId) => {
          setToUserId(nextUserId);
          setFormError(null);
        }}
      />
      <Card className="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Give Feedback to {getUserName(selectedToUserId)}</span>
            <span className="text-green-500">Completed</span>
          </CardTitle>
          {/* <CardDescription>
            We collect colleague feedback yearly. This is an essential tool for
            developing as a professional for all of us, so please fill this form
            carefully. Especially open comments are very appreciated.
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            {selectedToUserId !== null && groups.length > 0 && (
              <div className="space-y-6">
                {groups.map((group) => (
                  <ValuationGroupCard
                    key={group.id}
                    group={group}
                    groupAnswers={groupAnswers}
                    onQuestionRatingChange={updateQuestionRating}
                    onGroupCommentChange={updateGroupComment}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={!canSubmit}>
                {createFeedback.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* <Card className="rounded-2xl border-0 bg-card/50 shadow-lg ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackList />
        </CardContent>
      </Card> */}
    </div>
  );
}
