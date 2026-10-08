"use client";

import type { FormEvent } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import {
  isChoiceType,
  type ScreeningAnswerInput,
  type ScreeningQuestion,
} from "@/features/jobs/lib/screening-questions";

function questionDescription(question: ScreeningQuestion) {
  if (question.type === "multi_choice") return "Select all that apply.";
  if (question.type === "number") return "Enter a number.";
  if (!question.required) return "Skip if this doesn't apply.";
  return null;
}

function choicesFor(question: ScreeningQuestion) {
  if (question.type === "yes_no") {
    return [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ];
  }
  if (isChoiceType(question.type)) {
    return question.options.map((option) => ({
      value: option.id,
      label: option.label,
    }));
  }
  return [];
}

function isChoiceChecked(
  answers: ScreeningAnswerInput[],
  question: ScreeningQuestion,
  choiceValue: string,
) {
  const value = answers.find((answer) => answer.questionId === question.id)
    ?.value;
  if (Array.isArray(value)) return value.includes(choiceValue);
  if (question.type === "yes_no") {
    if (value === true) return choiceValue === "yes";
    if (value === false) return choiceValue === "no";
  }
  return value === choiceValue;
}

function inputDefaultValue(
  answers: ScreeningAnswerInput[],
  questionId: string,
) {
  const value = answers.find((answer) => answer.questionId === questionId)
    ?.value;
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return undefined;
}

function answersFromFormData(
  questions: ScreeningQuestion[],
  formData: FormData,
): ScreeningAnswerInput[] {
  return questions.map((question) => {
    if (question.type === "multi_choice") {
      return {
        questionId: question.id,
        value: formData.getAll(question.id).filter(
          (value): value is string => typeof value === "string",
        ),
      };
    }
    const raw = formData.get(question.id);
    const text = typeof raw === "string" ? raw.trim() : "";
    if (question.type === "yes_no") {
      return {
        questionId: question.id,
        value: text === "yes" ? true : text === "no" ? false : null,
      };
    }
    return {
      questionId: question.id,
      value: text || null,
    };
  });
}

export function ScreeningQuestionsDrawer({
  open,
  onOpenChange,
  questions,
  answers,
  onAnswersChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: ScreeningQuestion[];
  answers: ScreeningAnswerInput[];
  onAnswersChange: (answers: ScreeningAnswerInput[]) => void;
}) {
  if (questions.length === 0) return null;

  const items = questions.map((question) => {
    const choices = choicesFor(question).map((choice) => ({
      value: choice.value,
    }));
    return {
      name: question.id,
      required: question.required,
      ...(choices.length > 0 ? { choices } : {}),
    };
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAnswersChange(answersFromFormData(questions, new FormData(event.currentTarget)));
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>A few questions</DrawerTitle>
          <DrawerDescription>
            Please answer these before you apply.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Questionnaire items={items} onSubmit={handleSubmit}>
            <QuestionnaireProgress />
            {questions.map((question) => {
              const choices = choicesFor(question);
              const description = questionDescription(question);
              const isFreeform =
                question.type === "short_text" ||
                question.type === "long_text" ||
                question.type === "number";
              return (
                <QuestionnaireItem
                  key={question.id}
                  name={question.id}
                  required={question.required}
                  multiple={question.type === "multi_choice"}
                >
                  <QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
                  {description ? (
                    <QuestionnaireDescription>
                      {description}
                    </QuestionnaireDescription>
                  ) : null}
                  <QuestionnaireChoices>
                    {choices.map((choice) => (
                      <QuestionnaireChoice
                        key={choice.value}
                        value={choice.value}
                        defaultChecked={isChoiceChecked(
                          answers,
                          question,
                          choice.value,
                        )}
                      >
                        <span className="font-medium">{choice.label}</span>
                      </QuestionnaireChoice>
                    ))}
                    {isFreeform ? (
                      <QuestionnaireInput
                        aria-label={question.prompt}
                        type={question.type === "number" ? "number" : "text"}
                        defaultValue={inputDefaultValue(answers, question.id)}
                        placeholder="Your answer"
                      />
                    ) : null}
                  </QuestionnaireChoices>
                  <QuestionnaireError />
                </QuestionnaireItem>
              );
            })}
            <QuestionnaireActions>
              <QuestionnairePrevious />
              <QuestionnaireSkip />
              <QuestionnaireNext />
              <QuestionnaireSubmit>Done</QuestionnaireSubmit>
            </QuestionnaireActions>
          </Questionnaire>
        </div>
      </DrawerContent>
    </Drawer>
  );
}