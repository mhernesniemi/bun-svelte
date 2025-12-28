import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
  emptyAdminValuationQuestionGroups,
  type AdminValuationQuestionGroupsDTO,
} from "@/lib/valuation-types";

export function AdminPage() {
  const queryClient = useQueryClient();
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [newQuestionText, setNewQuestionText] = useState<
    Record<number, string>
  >({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [editingQuestionText, setEditingQuestionText] = useState("");

  const { data: groups = emptyAdminValuationQuestionGroups, isLoading } =
    useQuery<AdminValuationQuestionGroupsDTO>({
      queryKey: ["admin-valuation-question-groups"],
      queryFn: async () => {
        const response =
          await api.api["admin"]["valuation-question-groups"].get();
        return response.data ?? emptyAdminValuationQuestionGroups;
      },
    });

  const createGroup = useMutation({
    mutationFn: async (title: string) => {
      const response = await api.api["admin"]["valuation-question-groups"].post(
        {
          title,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
      setNewGroupTitle("");
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const group = groups.find((g) => g.id === id);
      const response = await api.api["admin"]
        ["valuation-question-groups"]({
          id,
        })
        .put({ title, order: group?.order ?? 0 });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
      setEditingGroupId(null);
      setEditingGroupTitle("");
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.api["admin"]
        ["valuation-question-groups"]({ id })
        .delete();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
    },
  });

  const createQuestion = useMutation({
    mutationFn: async ({
      groupId,
      questionText,
    }: {
      groupId: number;
      questionText: string;
    }) => {
      const response = await api.api["admin"]["valuation-questions"].post({
        groupId,
        questionText,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
      setNewQuestionText((prev) => {
        const next = { ...prev };
        delete next[variables.groupId];
        return next;
      });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({
      id,
      questionText,
    }: {
      id: number;
      questionText: string;
    }) => {
      const allQuestions = groups.flatMap((g) => g.questions);
      const question = allQuestions.find((q) => q.id === id);
      const response = await api.api["admin"]
        ["valuation-questions"]({ id })
        .put({
          questionText,
          order: question?.order ?? 0,
        });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
      setEditingQuestionId(null);
      setEditingQuestionText("");
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.api["admin"]
        ["valuation-questions"]({ id })
        .delete();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-valuation-question-groups"],
      });
    },
  });

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupTitle.trim()) {
      createGroup.mutate(newGroupTitle.trim());
    }
  };

  const handleGroupEdit = (group: AdminValuationQuestionGroupsDTO[number]) => {
    setEditingGroupId(group.id);
    setEditingGroupTitle(group.title);
  };

  const handleGroupSave = (id: number) => {
    if (editingGroupTitle.trim()) {
      updateGroup.mutate({ id, title: editingGroupTitle.trim() });
    }
  };

  const handleGroupCancel = () => {
    setEditingGroupId(null);
    setEditingGroupTitle("");
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleQuestionSubmit = (groupId: number, e: React.FormEvent) => {
    e.preventDefault();
    const questionText = newQuestionText[groupId];
    if (questionText?.trim()) {
      createQuestion.mutate({ groupId, questionText: questionText.trim() });
    }
  };

  const handleQuestionEdit = (question: {
    id: number;
    questionText: string;
  }) => {
    setEditingQuestionId(question.id);
    setEditingQuestionText(question.questionText);
  };

  const handleQuestionSave = (id: number) => {
    if (editingQuestionText.trim()) {
      updateQuestion.mutate({ id, questionText: editingQuestionText.trim() });
    }
  };

  const handleQuestionCancel = () => {
    setEditingQuestionId(null);
    setEditingQuestionText("");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Heading level={1} className="mb-6">
        Admin - Valuation Question Groups
      </Heading>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Group</CardTitle>
          <CardDescription>
            Add a new question group. Each group can contain multiple questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-title">Group Title</Label>
              <Input
                id="group-title"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                placeholder="Enter group title..."
                required
              />
            </div>
            <Button type="submit" disabled={createGroup.isPending}>
              {createGroup.isPending ? "Adding..." : "Add Group"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No groups yet.</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingGroupTitle}
                        onChange={(e) => setEditingGroupTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleGroupSave(group.id)}
                        disabled={updateGroup.isPending}
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleGroupCancel}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <CardTitle>{group.title}</CardTitle>
                        <CardDescription>
                          {group.questions.length} question
                          {group.questions.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleGroup(group.id)}
                          variant="outline"
                          size="sm"
                        >
                          {expandedGroups.has(group.id) ? "Collapse" : "Expand"}
                        </Button>
                        <Button
                          onClick={() => handleGroupEdit(group)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteGroup.mutate(group.id)}
                          variant="destructive"
                          size="sm"
                          disabled={deleteGroup.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              {expandedGroups.has(group.id) && (
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(e) => handleQuestionSubmit(group.id, e)}
                    className="space-y-2 p-4 border rounded-lg"
                  >
                    <Label htmlFor={`question-${group.id}`}>
                      Add Question to Group
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`question-${group.id}`}
                        value={newQuestionText[group.id] || ""}
                        onChange={(e) =>
                          setNewQuestionText((prev) => ({
                            ...prev,
                            [group.id]: e.target.value,
                          }))
                        }
                        placeholder="Enter question text..."
                        className="flex-1"
                        required
                      />
                      <Button type="submit" disabled={createQuestion.isPending}>
                        Add
                      </Button>
                    </div>
                  </form>

                  {group.questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No questions in this group yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {group.questions.map((question) => (
                        <div
                          key={question.id}
                          className="flex items-center gap-2 p-3 border rounded-lg"
                        >
                          {editingQuestionId === question.id ? (
                            <>
                              <Input
                                value={editingQuestionText}
                                onChange={(e) =>
                                  setEditingQuestionText(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button
                                onClick={() => handleQuestionSave(question.id)}
                                disabled={updateQuestion.isPending}
                                size="sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={handleQuestionCancel}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {question.questionText}
                                </p>
                              </div>
                              <Button
                                onClick={() => handleQuestionEdit(question)}
                                variant="outline"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() =>
                                  deleteQuestion.mutate(question.id)
                                }
                                variant="destructive"
                                size="sm"
                                disabled={deleteQuestion.isPending}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
