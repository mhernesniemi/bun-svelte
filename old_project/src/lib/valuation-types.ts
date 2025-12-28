import type { api } from "@/lib/api";
import type { ValuationQuestion, ValuationQuestionGroup } from "@/db/schema";

export type ValuationQuestionDTO = Pick<
  ValuationQuestion,
  "id" | "groupId" | "questionText" | "order"
> & { createdAt: number };

export type ValuationQuestionGroupDTO = Pick<
  ValuationQuestionGroup,
  "id" | "title" | "order"
> & { createdAt: number; questions: ValuationQuestionDTO[] };

export type ValuationQuestionGroupsDTO = ValuationQuestionGroupDTO[];
export const emptyValuationQuestionGroups: ValuationQuestionGroupsDTO = [];

export type AdminValuationQuestionGroupsDTO = ValuationQuestionGroupsDTO;
export const emptyAdminValuationQuestionGroups: AdminValuationQuestionGroupsDTO =
  [];

export type CreateFeedbackInput = Parameters<typeof api.api.feedback.post>[0];

type CreateFeedbackGroupInput = CreateFeedbackInput["groups"][number];
type CreateFeedbackQuestionInput = CreateFeedbackGroupInput["questions"][number];

export type GroupAnswersState = Record<
  CreateFeedbackGroupInput["groupId"],
  {
    questionAnswers: Record<
      CreateFeedbackQuestionInput["questionId"],
      CreateFeedbackQuestionInput["rating"]
    >;
    comment: string;
  }
>;


