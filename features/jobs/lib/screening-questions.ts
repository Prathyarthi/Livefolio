export const SCREENING_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "number",
] as const;

export type ScreeningQuestionType = (typeof SCREENING_QUESTION_TYPES)[number];

export type ScreeningTypeGroup = "text" | "choice" | "other";

export const SCREENING_TYPE_GROUP: Record<
  ScreeningQuestionType,
  ScreeningTypeGroup
> = {
  short_text: "text",
  long_text: "text",
  single_choice: "choice",
  multi_choice: "choice",
  yes_no: "other",
  number: "other",
};

export const SCREENING_TYPE_LABELS: Record<ScreeningQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  single_choice: "Pick one",
  multi_choice: "Pick many",
  yes_no: "Yes / No",
  number: "Number",
};

export const SCREENING_GROUP_LABELS: Record<ScreeningTypeGroup, string> = {
  text: "Text",
  choice: "Multiple choice",
  other: "Other",
};

export const MAX_SCREENING_QUESTIONS = 10;
export const MAX_SCREENING_PER_GROUP = 10;
export const MAX_CHOICE_OPTIONS = 10;
export const MIN_CHOICE_OPTIONS = 2;
export const MAX_PROMPT_LENGTH = 300;
export const MAX_SHORT_TEXT_LENGTH = 500;
export const MAX_LONG_TEXT_LENGTH = 2000;

export type ScreeningChoiceOption = {
  id: string;
  label: string;
};

export type ScreeningQuestion = {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
  required: boolean;
  options: ScreeningChoiceOption[];
};

export type ScreeningAnswerInput = {
  questionId: string;
  value: string | string[] | number | boolean | null;
};

export type ScreeningAnswer = {
  questionId: string;
  prompt: string;
  type: ScreeningQuestionType;
  value: string | string[] | number | boolean | null;
  displayValue: string;
};

export function isScreeningQuestionType(
  value: unknown,
): value is ScreeningQuestionType {
  return (
    typeof value === "string" &&
    (SCREENING_QUESTION_TYPES as readonly string[]).includes(value)
  );
}

export function isChoiceType(type: ScreeningQuestionType) {
  return type === "single_choice" || type === "multi_choice";
}

export function emptyChoiceOption(): ScreeningChoiceOption {
  return { id: crypto.randomUUID(), label: "" };
}

export function emptyScreeningQuestion(
  type: ScreeningQuestionType = "short_text",
): ScreeningQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    type,
    required: true,
    options: isChoiceType(type)
      ? [emptyChoiceOption(), emptyChoiceOption()]
      : [],
  };
}

export function countByGroup(questions: ScreeningQuestion[]) {
  const counts: Record<ScreeningTypeGroup, number> = {
    text: 0,
    choice: 0,
    other: 0,
  };
  for (const question of questions) {
    counts[SCREENING_TYPE_GROUP[question.type]] += 1;
  }
  return counts;
}

export function canAddScreeningQuestion(
  questions: ScreeningQuestion[],
  type: ScreeningQuestionType,
) {
  if (questions.length >= MAX_SCREENING_QUESTIONS) return false;
  const group = SCREENING_TYPE_GROUP[type];
  return countByGroup(questions)[group] < MAX_SCREENING_PER_GROUP;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseOptions(value: unknown): ScreeningChoiceOption[] {
  if (!Array.isArray(value)) return [];
  const options: ScreeningChoiceOption[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) continue;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!id || !label) continue;
    options.push({ id, label: label.slice(0, 200) });
    if (options.length >= MAX_CHOICE_OPTIONS) break;
  }
  return options;
}

export function parseScreeningQuestions(value: unknown): ScreeningQuestion[] {
  if (!Array.isArray(value)) return [];
  const questions: ScreeningQuestion[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) continue;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const prompt = typeof row.prompt === "string" ? row.prompt.trim() : "";
    if (!id || !prompt || !isScreeningQuestionType(row.type)) continue;
    questions.push({
      id,
      prompt: prompt.slice(0, MAX_PROMPT_LENGTH),
      type: row.type,
      required: row.required !== false,
      options: isChoiceType(row.type) ? parseOptions(row.options) : [],
    });
    if (questions.length >= MAX_SCREENING_QUESTIONS) break;
  }
  return questions;
}

export function normalizeScreeningQuestionsForSave(
  questions: ScreeningQuestion[],
): { ok: true; questions: ScreeningQuestion[] } | { ok: false; error: string } {
  const cleaned: ScreeningQuestion[] = [];

  for (const question of questions) {
    const prompt = question.prompt.trim();
    if (!prompt) continue;
    if (!isScreeningQuestionType(question.type)) {
      return { ok: false, error: "Invalid screening question type" };
    }

    const next: ScreeningQuestion = {
      id: question.id.trim() || crypto.randomUUID(),
      prompt: prompt.slice(0, MAX_PROMPT_LENGTH),
      type: question.type,
      required: question.required !== false,
      options: [],
    };

    if (isChoiceType(question.type)) {
      const options = question.options
        .map((option) => ({
          id: option.id.trim() || crypto.randomUUID(),
          label: option.label.trim().slice(0, 200),
        }))
        .filter((option) => option.label);
      if (options.length < MIN_CHOICE_OPTIONS) {
        return {
          ok: false,
          error: `"${next.prompt}" needs at least ${MIN_CHOICE_OPTIONS} choices`,
        };
      }
      if (options.length > MAX_CHOICE_OPTIONS) {
        return {
          ok: false,
          error: `Each multiple-choice question can have at most ${MAX_CHOICE_OPTIONS} options`,
        };
      }
      next.options = options;
    }

    cleaned.push(next);
  }

  if (cleaned.length > MAX_SCREENING_QUESTIONS) {
    return {
      ok: false,
      error: `Jobs can include at most ${MAX_SCREENING_QUESTIONS} application questions`,
    };
  }

  const counts = countByGroup(cleaned);
  for (const group of Object.keys(counts) as ScreeningTypeGroup[]) {
    if (counts[group] > MAX_SCREENING_PER_GROUP) {
      return {
        ok: false,
        error: `At most ${MAX_SCREENING_PER_GROUP} ${SCREENING_GROUP_LABELS[group].toLowerCase()} questions are allowed`,
      };
    }
  }

  const ids = new Set(cleaned.map((question) => question.id));
  if (ids.size !== cleaned.length) {
    return { ok: false, error: "Screening questions must have unique ids" };
  }

  return { ok: true, questions: cleaned };
}

function stringifyAnswerValue(
  question: ScreeningQuestion,
  value: ScreeningAnswerInput["value"],
): string {
  if (value == null) return "";
  if (question.type === "yes_no") {
    if (value === true || value === "yes") return "Yes";
    if (value === false || value === "no") return "No";
    return "";
  }
  if (question.type === "number") {
    return typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : "";
  }
  if (question.type === "single_choice") {
    const id = typeof value === "string" ? value : "";
    return question.options.find((option) => option.id === id)?.label ?? "";
  }
  if (question.type === "multi_choice") {
    const ids = Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
    return question.options
      .filter((option) => ids.includes(option.id))
      .map((option) => option.label)
      .join(", ");
  }
  return typeof value === "string" ? value.trim() : String(value);
}

function isAnswered(displayValue: string, value: ScreeningAnswerInput["value"]) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return displayValue.length > 0;
}

export function validateScreeningAnswers(
  questions: ScreeningQuestion[],
  answers: unknown,
): { ok: true; answers: ScreeningAnswer[] } | { ok: false; error: string } {
  const incoming = Array.isArray(answers) ? answers : [];
  const byQuestionId = new Map<string, ScreeningAnswerInput["value"]>();

  for (const item of incoming) {
    const row = asRecord(item);
    if (!row || typeof row.questionId !== "string") continue;
    byQuestionId.set(row.questionId, (row.value ?? null) as ScreeningAnswerInput["value"]);
  }

  const normalized: ScreeningAnswer[] = [];

  for (const question of questions) {
    const raw = byQuestionId.has(question.id)
      ? byQuestionId.get(question.id)!
      : null;
    let value: ScreeningAnswerInput["value"] = null;

    if (question.type === "short_text" || question.type === "long_text") {
      const text = typeof raw === "string" ? raw.trim() : "";
      const max =
        question.type === "short_text"
          ? MAX_SHORT_TEXT_LENGTH
          : MAX_LONG_TEXT_LENGTH;
      if (text.length > max) {
        return {
          ok: false,
          error: `Answer to "${question.prompt}" is too long`,
        };
      }
      value = text || null;
    } else if (question.type === "number") {
      if (raw === "" || raw == null) {
        value = null;
      } else {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(n)) {
          return {
            ok: false,
            error: `"${question.prompt}" must be a number`,
          };
        }
        value = n;
      }
    } else if (question.type === "yes_no") {
      if (raw === true || raw === "yes") value = true;
      else if (raw === false || raw === "no") value = false;
      else value = null;
    } else if (question.type === "single_choice") {
      const id = typeof raw === "string" ? raw : "";
      value = question.options.some((option) => option.id === id) ? id : null;
    } else if (question.type === "multi_choice") {
      const ids = Array.isArray(raw)
        ? raw.filter(
            (id): id is string =>
              typeof id === "string" &&
              question.options.some((option) => option.id === id),
          )
        : [];
      value = ids;
    }

    const displayValue = stringifyAnswerValue(question, value);
    const answered = isAnswered(displayValue, value);

    if (question.required && !answered) {
      return {
        ok: false,
        error: `Please answer: ${question.prompt}`,
      };
    }

    normalized.push({
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      value: answered ? value : null,
      displayValue,
    });
  }

  return { ok: true, answers: normalized };
}

export function unansweredRequiredQuestions(
  questions: ScreeningQuestion[],
  answers: ScreeningAnswerInput[],
) {
  const result = validateScreeningAnswers(questions, answers);
  if (result.ok) return [];
  return questions.filter((question) => {
    const match = answers.find((answer) => answer.questionId === question.id);
    const display = stringifyAnswerValue(question, match?.value ?? null);
    return question.required && !isAnswered(display, match?.value ?? null);
  });
}

export function parseScreeningAnswers(value: unknown): ScreeningAnswer[] {
  if (!Array.isArray(value)) return [];
  const answers: ScreeningAnswer[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row || typeof row.questionId !== "string" || typeof row.prompt !== "string") {
      continue;
    }
    if (!isScreeningQuestionType(row.type)) continue;
    answers.push({
      questionId: row.questionId,
      prompt: row.prompt,
      type: row.type,
      value: (row.value ?? null) as ScreeningAnswer["value"],
      displayValue:
        typeof row.displayValue === "string"
          ? row.displayValue
          : stringifyAnswerValue(
              {
                id: row.questionId,
                prompt: row.prompt,
                type: row.type,
                required: false,
                options: parseOptions(row.options),
              },
              (row.value ?? null) as ScreeningAnswerInput["value"],
            ),
    });
  }
  return answers;
}