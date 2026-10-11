"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_CHOICE_OPTIONS,
  MAX_PROMPT_LENGTH,
  MAX_SCREENING_PER_GROUP,
  MAX_SCREENING_QUESTIONS,
  MIN_CHOICE_OPTIONS,
  SCREENING_QUESTION_TYPES,
  SCREENING_TYPE_GROUP,
  SCREENING_TYPE_LABELS,
  canAddScreeningQuestion,
  countByGroup,
  emptyChoiceOption,
  emptyScreeningQuestion,
  isChoiceType,
  type ScreeningQuestion,
  type ScreeningQuestionType,
} from "@/features/jobs/lib/screening-questions";

const ADD_TYPE_OPTIONS: ScreeningQuestionType[] = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "number",
];

export function JobScreeningQuestionsFields({
  questions,
  onChange,
}: {
  questions: ScreeningQuestion[];
  onChange: (questions: ScreeningQuestion[]) => void;
}) {
  const counts = countByGroup(questions);
  const atTotalLimit = questions.length >= MAX_SCREENING_QUESTIONS;

  function update(index: number, patch: Partial<ScreeningQuestion>) {
    onChange(
      questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function addQuestion(type: ScreeningQuestionType) {
    if (!canAddScreeningQuestion(questions, type)) return;
    onChange([...questions, emptyScreeningQuestion(type)]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {questions.length === 0
            ? "None added yet"
            : `${questions.length} of ${MAX_SCREENING_QUESTIONS} questions`}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atTotalLimit}
            >
              {atTotalLimit ? "That's 10 questions" : "Add question"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ADD_TYPE_OPTIONS.map((type) => {
              const disabled = !canAddScreeningQuestion(questions, type);
              return (
                <DropdownMenuItem
                  key={type}
                  disabled={disabled}
                  onSelect={() => addQuestion(type)}
                >
                  {SCREENING_TYPE_LABELS[type]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="space-y-3 rounded-[var(--radius-md)] border border-border-default p-3"
          >
            <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
              <Select
                value={question.type}
                onValueChange={(value) => {
                  const type = value as ScreeningQuestionType;
                  const currentGroup = SCREENING_TYPE_GROUP[question.type];
                  const nextGroup = SCREENING_TYPE_GROUP[type];
                  if (
                    nextGroup !== currentGroup &&
                    counts[nextGroup] >= MAX_SCREENING_PER_GROUP
                  ) {
                    return;
                  }
                  update(index, {
                    type,
                    options: isChoiceType(type)
                      ? question.options.length >= MIN_CHOICE_OPTIONS
                        ? question.options
                        : [emptyChoiceOption(), emptyChoiceOption()]
                      : [],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCREENING_QUESTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {SCREENING_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={question.prompt}
                maxLength={MAX_PROMPT_LENGTH}
                onChange={(e) => update(index, { prompt: e.target.value })}
                placeholder="Question applicants will see"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange(questions.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(required) => update(index, { required })}
              />
              <Label htmlFor={`required-${question.id}`} className="font-normal">
                Required
              </Label>
            </div>

            {isChoiceType(question.type) ? (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        update(index, {
                          options: question.options.map((item, i) =>
                            i === optionIndex
                              ? { ...item, label: e.target.value }
                              : item,
                          ),
                        })
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={question.options.length <= MIN_CHOICE_OPTIONS}
                      onClick={() =>
                        update(index, {
                          options: question.options.filter(
                            (_, i) => i !== optionIndex,
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={question.options.length >= MAX_CHOICE_OPTIONS}
                  onClick={() =>
                    update(index, {
                      options: [...question.options, emptyChoiceOption()],
                    })
                  }
                >
                  Add option
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}